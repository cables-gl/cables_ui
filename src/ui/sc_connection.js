var CABLES = CABLES || {};

CABLES.UI.ScConnection = class extends CABLES.EventTarget
{
    constructor(cfg)
    {
        super();
        this.channelName = null;
        this._active = cfg.hasOwnProperty("enabled") ? cfg.enabled : false;
        this._socket = null;
        this._scConfig = cfg;
        this._connected = false;
        this._paco = null;
        if (cfg) this._init();
    }


    startPacoSend()
    {
        if (!this._paco)
        {
            this._paco = new CABLES.UI.PacoConnector(this, gui.patchConnection);
            gui.patchConnection.connectors.push(this._paco);
        }
        if (gui.chat.getNumClients() > 1)
        {
            const json = gui.corePatch().serialize(true);
            gui.patchConnection.send(CABLES.PACO_LOAD,
                {
                    "patch": JSON.stringify(json)
                });
        }
        else
        {
            CABLES.UI.notifyError("could not start paco");
        }
    }

    get clientId() { return this._socket.clientId; }

    _init()
    {
        if (!this._active)
        {
            console.info("CABLES-SOCKETCLUSTER NOT ACTIVE, WON'T SEND MESSAGES (enable in config)");
            return;
        }
        this._token = this._scConfig.token;
        this._socket = socketClusterClient.create(this._scConfig);
        this._socket.channelName = "patchchannel_" + CABLES.sandbox.getPatchId();
        this.channelName = this._socket.channelName;

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                console.error(error);
                this._connected = false;
            }
        })();
        (async () =>
        {
            for await (const event of this._socket.listener("connect"))
            {
                console.info("cables-socketcluster clientId", this._socket.clientId);
                this._connected = true;
            }
        })();

        (async () =>
        {
            const controlChannel = this._socket.subscribe(this._socket.channelName + "/control");

            for await (const msg of controlChannel)
            {
                this._handleControlChannelMessage(msg);
            }
        })();

        (async () =>
        {
            const infoChannel = this._socket.subscribe(this._socket.channelName + "/info");
            for await (const msg of infoChannel)
            {
                this._handleInfoChannelMsg(msg);
            }
        })();

        (async () =>
        {
            const chatChannel = this._socket.subscribe(this._socket.channelName + "/chat");
            for await (const msg of chatChannel)
            {
                this._handleChatChannelMsg(msg);
            }
        })();

        (async () =>
        {
            const pacoChannel = this._socket.subscribe(this._socket.channelName + "/paco");
            for await (const msg of pacoChannel)
            {
                this._handlePacoMessage(msg);
            }
        })();
    }

    isConnected()
    {
        return this._connected;
    }

    sendInfo(text)
    {
        this._send("info", { "type": "info", text });
    }

    sendControl(payload)
    {
        this._send("control", payload);
    }

    sendChat(text)
    {
        this._send("chat", { "type": "chatmsg", text, "username": gui.user.username });
    }

    sendPaco(payload)
    {
        this._send("paco", payload);
    }

    updateMembers()
    {
        this.sendControl({ "type": "pingMembers" });

        setTimeout(() =>
        {
            this.updateMembers();
        }, 10000);
    }

    _send(topic, payload)
    {
        if (this._active && this._connected)
        {
            const finalPayload = {
                "token": this._token,
                "clientId": this._socket.clientId,
                topic,
                ...payload,
            };
            this._socket.transmitPublish(this._socket.channelName + "/" + topic, finalPayload);
        }
    }

    _handleChatChannelMsg(msg)
    {
        if (msg.type == "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _handlePacoMessage(msg)
    {
        if (msg.type == "paco")
        {
            if (!this._paco)
            {
                gui.corePatch().clear();
                this._paco = new CABLES.UI.PacoConnector(this, gui.patchConnection);
                gui.patchConnection.connectors.push(this._paco);
            }

            if (msg.clientId != this._socket.clientId) this._paco.receive(msg.data);
        }
    }

    _handleControlChannelMessage(msg)
    {
        if (msg.type == "pingMembers")
        {
            this.sendControl({
                "type": "pingAnswer",
                "username": gui.user.usernameLowercase,
            });
        }
        if (msg.type == "pingAnswer")
        {
            msg.lastSeen = Date.now();
            this.emitEvent("onPingAnswer", msg);
        }
    }

    _handleInfoChannelMsg(msg)
    {
        if (msg.type == "info")
        {
            this.emitEvent("onInfoMessage", msg);
        }
    }
};
