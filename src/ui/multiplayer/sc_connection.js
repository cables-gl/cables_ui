
import ScState from "./sc_state";
import PacoConnector from "./sc_paconnector";
import Logger from "../utils/logger";

export default class ScConnection extends EventTarget
{
    constructor(cfg)
    {
        super();

        this._log = new Logger("scconnection");
        this.PING_INTERVAL = 5000;
        this.PINGS_TO_TIMEOUT = 2;
        this.channelName = null;
        this._active = cfg.hasOwnProperty("enabled") ? cfg.enabled : false;
        this._socket = null;
        this._scConfig = cfg;
        this._connected = false;
        this._paco = null;


        this._receivePaco = false;// gui.isRemoteClient;// gui.patchView.rendererName == "glpatch" || gui.isRemoteClient;
        this._sendPacoInitial = false;//! gui.isRemoteClient;

        this._log.log("this._receivePaco", this._receivePaco);
        this._log.log("this._sendPacoInitial", this._sendPacoInitial);


        if (cfg) this._init();
    }

    get state() { return this._state; }

    startPacoSend()
    {
        if (!this._paco)
        {
            this._paco = new PacoConnector(this, gui.patchConnection);
            gui.patchConnection.connectors.push(this._paco);
        }

        // if (this._state.getNumClients() > 1)
        // {
        // if (!this._sendPacoInitial) return;

        const json = gui.corePatch().serialize(true);
        this._paco.send(CABLES.PACO_LOAD,
            {
                "patch": JSON.stringify(json)
            });
        // }
        // else
        // {
        //     CABLES.UI.notifyError("could not start paco");
        // }
    }

    get clientId() { return this._socket.clientId; }

    _init()
    {
        if (!this._active)
        {
            this._log.info("CABLES-SOCKETCLUSTER NOT ACTIVE, WON'T SEND MESSAGES (enable in config)");
            return;
        }
        this._token = this._scConfig.token;
        this._socket = socketClusterClient.create(this._scConfig);
        this._socket.channelName = this._scConfig.channel;
        this.channelName = this._socket.channelName;

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                this._log.error(error);
                this._connected = false;

                this.emitEvent("connectionChanged");
                this.emitEvent("netActivityIn");
            }
        })();
        (async () =>
        {
            for await (const event of this._socket.listener("connect"))
            {
                this.emitEvent("netActivityIn");
                // this._log.info("cables-socketcluster clientId", this._socket.clientId);
                this._log.log("sc connected!");
                this._connected = true;

                this.emitEvent("connectionChanged");

                // send me patch
                gui.socket.sendInfo(gui.user.username + " joined");
                gui.socket.updateMembers();

                gui.socket.sendControl("resync");
            }
        })();

        (async () =>
        {
            const controlChannel = this._socket.subscribe(this._socket.channelName + "/control");

            for await (const msg of controlChannel)
            {
                this._handleControlChannelMessage(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const uiChannel = this._socket.subscribe(this._socket.channelName + "/ui");
            for await (const msg of uiChannel)
            {
                this._handleUiChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const infoChannel = this._socket.subscribe(this._socket.channelName + "/info");
            for await (const msg of infoChannel)
            {
                this._handleInfoChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const chatChannel = this._socket.subscribe(this._socket.channelName + "/chat");
            for await (const msg of chatChannel)
            {
                this._handleChatChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            if (!this._receivePaco) return;
            const pacoChannel = this._socket.subscribe(this._socket.channelName + "/paco");
            for await (const msg of pacoChannel)
            {
                this._handlePacoMessage(msg);
                this.emitEvent("netActivityIn");
            }
        })();


        this._state = new ScState(this);
    }

    isConnected()
    {
        return this._connected;
    }

    sendInfo(text)
    {
        this._send("info", { "name": "info", text });
    }

    sendControl(name, payload)
    {
        payload = payload || {};
        payload.name = name;

        this._send("control", payload);
    }


    sendUi(name, payload, sendOnEmptyClientList = false)
    {
        if (sendOnEmptyClientList || this.state.getNumClients() > 1)
        {
            payload = payload || {};
            payload.name = name;
            this._send("ui", payload);
        }
    }


    sendChat(text)
    {
        this._send("chat", { "name": "chatmsg", text, "username": gui.user.username });
    }

    sendPaco(payload)
    {
        payload.name = "paco";
        this._send("paco", payload);
    }

    updateMembers()
    {
        this.sendControl("pingMembers", {});

        setTimeout(() =>
        {
            this.updateMembers();
        }, this.PING_INTERVAL);
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

            this.emitEvent("netActivityOut");
            this._socket.transmitPublish(this._socket.channelName + "/" + topic, finalPayload);
        }
    }

    _handleChatChannelMsg(msg)
    {
        if (msg.name == "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _handlePacoMessage(msg)
    {
        if (msg.clientId == this._socket.clientId) return;

        if (msg.name == "paco")
        {
            this._log.log("paco message !");

            if (!this._paco)
            {
                // this._log.log(msg);

                if (msg.data.event != CABLES.PACO_LOAD)
                {
                    return;
                }
                // debugger;

                this._log.log("first paco message !");
                gui.corePatch().clear();
                this._paco = new PacoConnector(this, gui.patchConnection);
                gui.patchConnection.connectors.push(this._paco);
            }
            else if (msg.data.event == CABLES.PACO_LOAD) return;


            this._paco.receive(msg.data);
        }
    }

    _handleControlChannelMessage(msg)
    {
        if (msg.name === "resync")
        {
            if (msg.clientId == this._socket.clientId) return;

            this._log.log("RESYNC sending paco patch....");
            this.startPacoSend();
        }
        if (msg.name === "pingMembers")
        {
            this.sendControl("pingAnswer", {
                "username": gui.user.usernameLowercase,
                "userid": gui.user.id,
            });
        }
        if (msg.name === "pingAnswer")
        {
            msg.lastSeen = Date.now();
            this.emitEvent("onPingAnswer", msg);
        }
    }

    _handleUiChannelMsg(msg)
    {
        if (msg.clientId == this._socket.clientId) return;

        // this._log.log("msg", msg);
        this.emitEvent(msg.name, msg);
    }

    _handleInfoChannelMsg(msg)
    {
        if (msg.name == "info")
        {
            this.emitEvent("onInfoMessage", msg);
        }
    }
}
