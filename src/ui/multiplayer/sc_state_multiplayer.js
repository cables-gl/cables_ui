import Logger from "../utils/logger";

CABLES = CABLES || {};

export default class ScStateMultiplayer extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this.PILOT_REQUEST_TIMEOUT = 20000;

        this._log = new Logger("scstate");

        this._clients = {};
        this._clients[connection.clientId] = {
            "userid": gui.user.id,
            "clientId": connection.clientId,
            "isMe": true,
            "isRemoteClient": gui.isRemoteClient
        };
        this._followers = [];
        this._connection = connection;
        this._colors = {};
        this._pilot = null;

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
        const isOwnAnswer = payload.clientId === this._connection.clientId;

        if (this._clients[payload.clientId])
        {
            this._clients[payload.clientId].username = payload.username;
            this._clients[payload.clientId].userid = payload.userid;
            this._clients[payload.clientId].shortname = payload.username.substr(0, 2).toUpperCase();
            this._clients[payload.clientId].clientId = payload.clientId;
            this._clients[payload.clientId].lastSeen = payload.lastSeen;
            this._clients[payload.clientId].isMe = isOwnAnswer;
            this._clients[payload.clientId].color = this.getClientColor(payload.clientId);
            this._clients[payload.clientId].connectedSince = payload.connectedSince;
            this._clients[payload.clientId].following = isOwnAnswer ? this._connection.client.following : payload.following;
            this._clients[payload.clientId].isRemoteClient = payload.isRemoteClient;
            this._clients[payload.clientId].platform = payload.platform;
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
                "isMe": isOwnAnswer,
                "color": this.getClientColor(payload.clientId),
                "connectedSince": payload.connectedSince,
                "following": isOwnAnswer ? this._connection.client.following : payload.following,
                "isRemoteClient": payload.isRemoteClient,
                "platform": payload.platform
            };
        }

        let newPilot = null;
        if (payload.isPilot && !payload.isRemoteClient)
        {
            const keys = Object.keys(this._clients);
            for (let i = 0; i < keys.length; i++)
            {
                const client = this._clients[keys[i]];
                if (client.clientId !== payload.clientId)
                {
                    client.isPilot = false;
                }
                else
                {
                    if (client.clientId === this._connection.clientId && gui.isRemoteClient) continue;
                    client.isPilot = true;
                    newPilot = client;
                }
            }
            if (newPilot && (!this._pilot || newPilot.clientId !== this._pilot.clientId))
            {
                if (!newPilot.isRemoteClient)
                {
                    userListChanged = true;
                    this._pilot = newPilot;
                    this.emitEvent("pilotChanged", newPilot);
                }
            }
        }

        if (payload.following && (payload.following === this._connection.clientId) && !this._followers.includes(payload.clientId))
        {
            this._followers.push(payload.clientId);
            userListChanged = true;
        }
        else if (!payload.following && this._followers.includes(payload.clientId))
        {
            this._followers = this._followers.filter((followerId) => { return followerId !== payload.clientId; });
            userListChanged = true;
        }

        const cleanupChange = this._cleanUpUserList();
        if (userListChanged || cleanupChange)
        {
            this.emitEvent("userListChanged");
        }
    }

    getClientColor(clientId)
    {
        if (!clientId) return { "r": 1, "g": 1, "b": 1, "rb": 255, "gb": 255, "bb": 255 };
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
                if (this._pilot && this._pilot.clientId === client.clientId)
                {
                    this._pilot = null;
                    this.emitEvent("pilotRemoved");
                }
                if (this.followers.includes(client.clientId)) this._followers = this._followers.filter((followerId) => { return followerId != client.clientId; });
                cleanupChange = true;
            }
        });

        if (this.getNumClients() < 2 && this._clients[this._connection.clientId] && !this._clients[this._connection.clientId].isPilot)
        {
            if (!gui.isRemoteClient)
            {
                this._clients[this._connection.clientId].isPilot = true;
                cleanupChange = true;
            }
        }

        if (!this.hasPilot())
        {
            // connection has no pilot, try to find the longest connected client
            let pilot = null;
            let earliestConnection = Date.now();
            Object.keys(this._clients).forEach((key) =>
            {
                const client = this._clients[key];
                if (!client.isRemoteClient && client.connectedSince && client.connectedSince < earliestConnection)
                {
                    pilot = client;
                    earliestConnection = client.connectedSince;
                }
            });
            if (pilot && !pilot.isRemoteClient)
            {
                this._clients[pilot.clientId].isPilot = true;
                if (pilot.clientId === this._connection.clientId)
                {
                    this.becomePilot();
                }
            }
        }

        return cleanupChange;
    }

    hasPilot()
    {
        return Object.values(this._clients).some((client) => { return client.isPilot; });
    }

    becomePilot()
    {
        if (!gui.isRemoteClient)
        {
            this._log.verbose("this client became multiplayer pilot");
            this._connection.client.isPilot = true;
            this._connection.sendPing();
            this.emitEvent("becamePilot");
        }
    }

    requestPilotSeat()
    {
        const client = this._clients[this._connection.clientId];
        if (!gui.isRemoteClient && (client && !client.isPilot))
        {
            this._connection.sendControl("pilotRequest", { "username": client.username, "state": "request" });
            const myAvatar = document.querySelector("#multiplayerbar .socket_userlist_item.me");
            if (myAvatar) myAvatar.classList.add("pilot-request");
            this._pendingPilotRequest = setTimeout(() =>
            {
                if (this._pendingPilotRequest)
                {
                    this.acceptPilotSeatRequest();
                    this._pendingPilotRequest = null;
                }
            }, this.PILOT_REQUEST_TIMEOUT + 2000);
        }
    }

    hasPendingPilotSeatRequest()
    {
        return !!this._pendingPilotRequest;
    }

    acceptPilotSeatRequest()
    {
        const client = this._clients[this._connection.clientId];
        if (client && !client.isPilot && this._pendingPilotRequest)
        {
            clearTimeout(this._pendingPilotRequest);
            const myAvatar = document.querySelector("#multiplayerbar .socket_userlist_item.me");
            if (myAvatar) myAvatar.classList.add("pilot-request");
            this.becomePilot();
        }
    }

    cancelPilotSeatRequest()
    {
        const client = this._clients[this._connection.clientId];
        if (client && this._pendingPilotRequest)
        {
            clearTimeout(this._pendingPilotRequest);
            const myAvatar = document.querySelector("#multiplayerbar .socket_userlist_item.me");
            if (myAvatar) myAvatar.classList.remove("pilot-request");
        }
    }
}
