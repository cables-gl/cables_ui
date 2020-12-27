CABLES = CABLES || {};

CABLES.UI.ScState = class extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();
        this._clients = {};
        this._connection = connection;
        this.updateIntervalSeconds = 2;

        connection.addEventListener("onPingAnswer", this.onPingAnswer.bind(this));
    }

    get clients() { return this._clients; }

    onPingAnswer(payload)
    {
        let userListChanged = false;
        const client = this.clients[payload.clientId];

        if (!client)
            userListChanged = true;

        this._clients[payload.clientId] = {
            "username": payload.username,
            "clientId": payload.clientId,
            "lastSeen": payload.lastSeen };

        this._updateClientTimeouts();
        this._cleanUpUserList();
        if (userListChanged) this.emitEvent("userListChanged");
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
            console.log("list changed REMOVED!");
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
};
