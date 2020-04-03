var CABLES = CABLES || {};

CABLES.UI.ScConnection = class extends CABLES.EventTarget
{
    constructor(cfg)
    {
        super();
        this.channelName = null;
        this._socket = null;
        this._scConfig = cfg;
        this._connected = false;
        this._paco=null;
console.log("socket config",cfg);

        if (cfg) this._init();

        // setTimeout(()=>
        // {
    
        // },1000);
    }

    setupPaco()
    {
        if(!this._paco && gui.chat.getNumClients()>1)
        {
            this._paco=new CABLES.UI.PacoConnector(this,gui.patchConnection);
            gui.patchConnection.connectors.push(this._paco);
    
        }

    }



    _init()
    {
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
                console.info("socketcluster clientId", this._socket.clientId);
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
    }

    sendInfo(text)
    {
        if (this._connected) this._send("info", { type: "info", text });
    }

    sendControl(payload)
    {
        if (this._connected) this._send("control", payload);
    }

    sendChat(text)
    {
        if (this._connected) this._send("chat", { type: "chatmsg", text, username: gui.user.username });
    }

    updateMembers()
    {
        this.sendControl({ type: "pingMembers" });
    }

    _handleChatChannelMsg(msg)
    {
        if (msg.type == "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _send(topic, payload)
    {
        const finalPayload = {
            clientId: this._socket.clientId,
            topic,
            ...payload,
        };
        if (this._connected) this._socket.transmitPublish(this._socket.channelName + "/" + topic, finalPayload);
    }

    _handleControlChannelMessage(msg)
    {
        console.log("CONTROLMSG ",msg);
        if (msg.type == "pingMembers")
        {
            this.sendControl({
                type: "pingAnswer",
                username: gui.user.usernameLowercase,
            });
        }
        if (msg.type == "pingAnswer")
        {
            msg.lastSeen = Date.now();
            this.emitEvent("onPingAnswer", msg);
            this.setupPaco();
        }

        if(msg.type=="paco")
        {
            console.log('receive paco',msg);
            if(msg.clientId!=this._socket.clientId)
                this._paco.receive(msg.data);
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
