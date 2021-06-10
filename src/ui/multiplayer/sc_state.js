CABLES = CABLES || {};

CABLES.UI.ScState = class extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();
        this._clients = {};
        this._connection = connection;
        this.updateIntervalSeconds = 2;
        this._colors = {};

        connection.addEventListener("onPingAnswer", this.onPingAnswer.bind(this));
    }

    get clients() { return this._clients; }

    onPingAnswer(payload)
    {
        let userListChanged = false;
        const client = this.clients[payload.clientId];

        if (!client) userListChanged = true;

        this._clients[payload.clientId] = {
            "username": payload.username,
            "shortname": payload.username.substr(0, 2).toUpperCase(),
            "clientId": payload.clientId,
            "lastSeen": payload.lastSeen,
            "isMe": payload.clientId == this._connection.clientId,
            "color": this.getClientColor(payload.clientId)
        };


        this._updateClientTimeouts();
        this._cleanUpUserList();
        if (userListChanged) this.emitEvent("userListChanged");
    }

    getClientColor(clientId)
    {
        if (!this._colors[clientId]) this._colors[clientId] = this._HSVtoRGB(Math.random(), 0.75, 1.0);
        if (clientId == this._connection.clientId) this._colors[clientId] = { "r": 1, "g": 1, "b": 1, "rb": 255, "gb": 255, "bb": 255 };

        return this._colors[clientId];
    }

    getNumClients()
    {
        return Object.keys(this._clients).length;
    }

    _cleanUpUserList()
    {
        const timeOutSeconds = this.updateIntervalSeconds * 2;

        let userlistChanged = false;

        Object.keys(this._clients).forEach((clientId) =>
        {
            const client = this._clients[clientId];

            if (client.lastSeen && (Date.now() - client.lastSeen) > timeOutSeconds * 1000)
            {
                delete this._clients[client.clientId];
                userlistChanged = true;
            }
        });

        if (userlistChanged)
        {
            // console.log("list changed REMOVED!");
            this.emitEvent("userListChanged");
        }
    }

    _updateClientTimeouts()
    {
        for (const i in this._clients)
        {
            const client = this._clients[i];
            if (!client) continue;

            client.timeout = (Date.now() - client.lastSeen);
            client.lost = client.timeout > 10000;

            if (client.clientId == this._connection.clientId) client.isMe = true;
        }
    }


    _HSVtoRGB(h, s, v)
    {
        let r, g, b, i, f, p, q, t;
        if (arguments.length === 1)
        {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6)
        {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        }
        return {
            "r": r,
            "g": g,
            "b": b,
            "rb": Math.round(255 * r),
            "gb": Math.round(255 * g),
            "bb": Math.round(255 * b)
        };
    }
};
