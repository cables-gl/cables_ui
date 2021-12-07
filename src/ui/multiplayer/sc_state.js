CABLES = CABLES || {};

export default class ScState extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();
        this._clients = {};
        this._clients[connection.clientId] = {
            "clientId": connection.clientId,
            "isMe": true
        };
        this._followers = [];
        this._connection = connection;
        this._colors = {};
        this._presenter = {};

        connection.on("onPingAnswer", this.onPingAnswer.bind(this));
        connection.on("netCursorPos", (msg) =>
        {
            if (this._clients[msg.clientId])
            {
                this._clients[msg.clientId].x = msg.x;
                this._clients[msg.clientId].y = msg.y;
                this._clients[msg.clientId].subpatch = msg.subpatch;
                this._clients[msg.clientId].zoom = msg.zoom;
                this._clients[msg.clientId].center = msg.center;
                this._clients[msg.clientId].scrollX = msg.scrollX;
                this._clients[msg.clientId].scrollY = msg.scrollY;
            }
        });
    }

    get clients() { return this._clients; }

    get followers() { return this._followers; }

    onPingAnswer(payload)
    {
        let userListChanged = false;

        if (this._clients[payload.clientId])
        {
            this._clients[payload.clientId].username = payload.username;
            this._clients[payload.clientId].userid = payload.userid;
            this._clients[payload.clientId].shortname = payload.username.substr(0, 2).toUpperCase();
            this._clients[payload.clientId].clientId = payload.clientId;
            this._clients[payload.clientId].lastSeen = payload.lastSeen;
            this._clients[payload.clientId].isMe = payload.clientId === this._connection.clientId;
            this._clients[payload.clientId].color = this.getClientColor(payload.clientId);
            this._clients[payload.clientId].connectedSince = payload.connectedSince;
            this._clients[payload.clientId].following = payload.following;
        }
        else
        {
            userListChanged = true;
            this._clients[payload.clientId] = {
                "clientId": payload.clientId,
                "username": payload.username,
                "userid": payload.userid,
                "shortname": payload.username.substr(0, 2).toUpperCase(),
                "lastSeen": payload.lastSeen,
                "isMe": payload.clientId == this._connection.clientId,
                "color": this.getClientColor(payload.clientId),
                "connectedSince": payload.connectedSince,
                "following": payload.following
            };
        }

        const amPresenter = this._connection.client && this._connection.client.isPresenter;
        let newPresenter = null;
        if (payload.isPresenter)
        {
            Object.values(this._clients).forEach((client) =>
            {
                if (client.clientId !== payload.clientId)
                {
                    client.isPresenter = false;
                }
                else
                {
                    if (client.clientId == this._connection.clientId && gui.isRemoteClient) return;
                    client.isPresenter = true;
                    newPresenter = client;
                }
            });
            if (!this._presenter || (newPresenter && (newPresenter.clientId != this._presenter.clientId)))
            {
                userListChanged = true;
                this._presenter = newPresenter;
            }
        }

        if (payload.following && payload.following == this._connection.clientId && !this._followers.includes(payload.clientId))
        {
            this._followers.push(payload.clientId);
            userListChanged = true;
        }
        else if (!payload.following && this._followers.includes(payload.clientId))
        {
            this._followers = this._followers.filter(followerId => followerId !== payload.clientId);
            userListChanged = true;
        }

        const cleanupChange = this._cleanUpUserList();
        if (userListChanged || cleanupChange)
        {
            if (!amPresenter && (this._connection.client && this._connection.client.isPresenter))
            {
                this.emitEvent("becamePresenter");
            }
            this.emitEvent("userListChanged");
        }
    }

    getClientColor(clientId)
    {
        if (clientId == this._connection.clientId) this._colors[clientId] = { "r": 1, "g": 1, "b": 1, "rb": 255, "gb": 255, "bb": 255 };
        if (!this._colors[clientId])
        {
            let hash = 0;
            for (let i = 0; i < clientId.length; i++)
            {
                hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
            }
            let result = [];
            for (let i = 0; i < 3; i++)
            {
                let value = (hash >> (i * 8)) & 0xFF;
                result[i] = value / 255;
            }
            const color = {
                "r": result[0],
                "g": result[1],
                "b": result[2],
            };
            color.rb = Math.round(255 * color.r);
            color.gb = Math.round(255 * color.g);
            color.bb = Math.round(255 * color.b);

            this._colors[clientId] = color;
        }

        return this._colors[clientId];
    }

    getNumClients()
    {
        return Object.keys(this._clients).length;
    }

    _cleanUpUserList()
    {
        const timeOutSeconds = this._connection.PING_INTERVAL * this._connection.PINGS_TO_TIMEOUT;

        let cleanupChange = false;

        Object.keys(this._clients).forEach((clientId) =>
        {
            const client = this._clients[clientId];

            if (client.lastSeen && (Date.now() - client.lastSeen) > timeOutSeconds)
            {
                this.emitEvent("clientRemoved", this._clients[client.clientId]);
                delete this._clients[client.clientId];
                if (this._presenter && this._presenter.clientId === client.clientId)
                {
                    this._presenter = null;
                }
                if (this.followers.includes(client.clientId)) this._followers = this._followers.filter(followerId => followerId != client.clientId);
                cleanupChange = true;
            }
        });

        if (this.getNumClients() < 2 && this._clients[this._connection.clientId] && !this._clients[this._connection.clientId].isPresenter)
        {
            this._clients[this._connection.clientId].isPresenter = true;
            cleanupChange = true;
        }

        if (!this.hasPresenter())
        {
            // connection has no presenter, try to find the longest connected client
            let presenter = null;
            let earliestConnection = Date.now();
            Object.keys(this._clients).forEach((key) =>
            {
                const client = this._clients[key];
                if (client.connectedSince && client.connectedSince < earliestConnection)
                {
                    presenter = client;
                    earliestConnection = client.connectedSince;
                }
            });
            if (presenter)
            {
                this._clients[presenter.clientId].isPresenter = true;
            }
        }

        return cleanupChange;
    }

    hasPresenter()
    {
        return Object.values(this._clients).some(client => client.isPresenter);
    }
}
