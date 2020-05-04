CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Chat = class extends CABLES.EventTarget
{
    constructor(tabs, socket)
    {
        super();

        this._tabs = tabs;
        this.updateIntervalSeconds = 10;

        socket.addEventListener("onChatMessage", this.onChatMsg.bind(this));
        socket.addEventListener("onInfoMessage", this.onChatMsg.bind(this));
        socket.addEventListener("onPingAnswer", this.onPingAnswer.bind(this));

        this._msgs = [];
        this._users = {};
        this._clients = {};

        this._socket = socket;
    }

    onChatMsg(payload)
    {
        this._msgs.push(payload);
        this._updateText();
    }

    getNumClients()
    {
        return Object.keys(this._clients).length;
    }

    _updateClientTimeouts()
    {
        for (const i in this._clients)
        {
            const client = this._clients[i];
            if (!client) continue;

            client.timeout = (Date.now() - client.lastSeen);
            client.lost = client.timeout > 10000;

            if (client.clientId == this._socket.clientId) client.isMe = true;
        }
    }

    getUserInfoHtml()
    {
        const numClients = this.getNumClients();

        this._updateClientTimeouts();

        const html = CABLES.UI.getHandleBarHtml("socketinfo", {
            "numClients": numClients,
            "users": this._users,
            "clients": this._clients,
            "connected": this._socket.isConnected()
        });
        return html;
    }

    onPingAnswer(payload)
    {
        if (!Array.isArray(this._users[payload.username]))
        {
            this._users[payload.username] = [];
        }
        const client = this._users[payload.username].find(c => c.clientId == payload.clientId);
        if (client)
        {
            this._clients[payload.clientId] = client;
            client.lastSeen = payload.lastSeen;
        }
        else
        {
            this._users[payload.username].push({ "username": payload.username, "clientId": payload.clientId, "lastSeen": payload.lastSeen });
        }

        this._updateClientTimeouts();
        this._cleanUpUserList();

        if (this.getNumClients() > 1) document.getElementById("userindicator").classList.remove("hidden");
        else document.getElementById("userindicator").classList.add("hidden");

        this.emitEvent("updated");
    }

    show()
    {
        this._tab = new CABLES.UI.Tab("chat", { "icon": "pie-chart", "infotext": "tab_chat", "padding": true });
        this._tabs.addTab(this._tab, true);

        const html = CABLES.UI.getHandleBarHtml("tab_chat", {});
        this._tab.html(html);
        this._updateText();
    }

    _cleanUpUserList()
    {
        const timeOutSeconds = this.updateIntervalSeconds * 2;
        Object.keys(this._users).forEach((userName) =>
        {
            const user = this._users[userName];
            for (let j = 0; j < user.length; j++)
            {
                const client = user[j];
                if (client.lastSeen && Date.now() - client.lastSeen > timeOutSeconds * 1000)
                {
                    user.splice(j, 1);
                }
                if (user.length === 0)
                {
                    delete this._clients[client.clientId];
                    delete this._users[userName];
                }
            }
        });
    }

    _updateText()
    {
        let html = "";
        const logEle = document.getElementById("chatmsgs");
        if (!logEle) return;

        for (let i = 0; i < this._msgs.length; i++)
        {
            if (this._msgs[i].type == "info")
            {
                html += "<b>";
                html += this._msgs[i].text;
                html += "</b>";
            }
            else
            {
                html += "- ";
                html += this._msgs[i].username + ": ";
                html += this._msgs[i].text;
            }
            html += "<br/>";
        }

        logEle.innerHTML = html;
    }

    send(text)
    {
        this._socket.sendChat(text);
    }
};
