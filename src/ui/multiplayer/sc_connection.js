
import PacoConnector from "./sc_paconnector";
import Logger from "../utils/logger";

import ScStateMultiplayer from "./sc_state_multiplayer";

export default class ScConnection extends CABLES.EventTarget
{
    constructor(cfg)
    {
        super();

        this._log = new Logger("scconnection");
        this.PING_INTERVAL = 5000;
        this.PINGS_TO_TIMEOUT = 2;
        this.OWN_PINGS_TO_TIMEOUT = 5;
        this._lastPing = Date.now();
        this.channelName = null;
        this._active = cfg.hasOwnProperty("enabled") ? cfg.enabled : false;
        this._socket = null;
        this._scConfig = cfg;
        this._connected = false;
        this._connectedSince = null;
        this._paco = null;
        this._pacoSynced = false;

        this.multiplayerEnabled = this._scConfig.multiplayerEnabled;

        this._pacoEnabled = this.multiplayerEnabled;

        if (cfg) this._init();
    }

    get state() { return this._state; }

    get connected() { return this._connected; }

    get client() { return this.state.clients[this.clientId]; }

    get followers() { return this.state.followers; }

    get clients() { return this.state.clients; }


    get synced()
    {
        if (!this._pacoEnabled) { return true; }
        else { return this._pacoSynced; }
    }

    hasPilot()
    {
        return this.state.hasPilot();
    }

    startPacoSend()
    {
        if (this._pacoEnabled)
        {
            if (!this._paco)
            {
                this._paco = new PacoConnector(this, gui.patchConnection);
                gui.patchConnection.connectors.push(this._paco);
            }

            const json = gui.corePatch().serialize(true);
            this._paco.send(CABLES.PACO_LOAD,
                {
                    "patch": JSON.stringify(json)
                });
            this._pacoSynced = true;
            this.state.emitEvent("patchSynchronized");
        }
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


        if (this.multiplayerEnabled)
        {
            this._state = new ScStateMultiplayer(this);

            this._state.on("becamePilot", () =>
            {
                this.startPacoSend();
            });
        }

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                if (!this.isConnected()) return;
                this._log.error(error.code + " - " + error.message);
                this._connected = false;

                this.emitEvent("connectionError", error);
                this.emitEvent("connectionChanged");
                this.emitEvent("netActivityIn");
            }
        })();
        (async () =>
        {
            for await (const event of this._socket.listener("connect"))
            {
                this.emitEvent("netActivityIn");
                this._log.verbose("sc connected!");
                this._connected = true;
                this._connectedSince = Date.now();

                this.emitEvent("connectionChanged");

                // send me patch
                this.sendChat(gui.user.username + " joined");
                this.updateMembers();

                this.sendControl("resync");
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
            if (!this._pacoEnabled) return;
            const pacoChannel = this._socket.subscribe(this._socket.channelName + "/paco");
            for await (const msg of pacoChannel)
            {
                this._handlePacoMessage(msg);
                this.emitEvent("netActivityIn");
            }
        })();
    }

    isConnected()
    {
        return this._connected;
    }

    canSaveInMultiplayer()
    {
        if (this.multiplayerEnabled)
        {
            return this.connected && this.client && this.client.isPilot;
        }
        else
        {
            return true;
        }
    }

    leaveMultiplayerSession()
    {
        if (this.multiplayerEnabled)
        {
            this._socket.unsubscribe(this._socket.channelName + "/ui");
            this._socket.unsubscribe(this._socket.channelName + "/control");
            this._socket.unsubscribe(this._socket.channelName + "/chat");
            this._socket.unsubscribe(this._socket.channelName + "/paco");
            this.multiplayerEnabled = false;
        }
        const msg = { "clients": [] };
        if (this.state) msg.clients = Object.values(this.state.clients);
        this.emitEvent("netLeaveSession", msg);
    }

    track(eventCategory, eventAction, eventLabel, meta = {})
    {
        const payload = {
            "name": "track",
            eventCategory,
            eventAction,
            eventLabel,
            meta
        };
        this._send("control", payload);
    }

    sendNotification(title, text)
    {
        this._send("info", { "name": "notify", title, text });
    }

    sendInfo(name, text)
    {
        this._send("info", { "name": "info", text });
    }

    sendControl(name, payload)
    {
        if (!this.multiplayerEnabled) return;
        payload = payload || {};
        payload.name = name;

        this._send("control", payload);
    }


    sendUi(name, payload, sendOnEmptyClientList = false)
    {
        if (!this.multiplayerEnabled) return;
        if (sendOnEmptyClientList || this.state.getNumClients() > 1)
        {
            payload = payload || {};
            payload.name = name;
            this._send("ui", payload);
        }
    }


    sendChat(text)
    {
        if (!this.multiplayerEnabled) return;
        // remove html
        const el = document.createElement("div");
        el.innerHTML = text;
        text = el.textContent || el.innerText || "";
        this._send("chat", { "name": "chatmsg", text, "username": gui.user.username });
    }

    sendPaco(payload)
    {
        if (!this.multiplayerEnabled) return;
        if (this.client && this.client.isPilot)
        {
            payload.name = "paco";
            this._send("paco", payload);
        }
    }

    updateMembers()
    {
        this.sendControl("pingMembers", {});

        setTimeout(() =>
        {
            this.updateMembers();
        }, this.PING_INTERVAL);
    }

    sendPing()
    {
        const payload = {
            "username": gui.user.usernameLowercase,
            "userid": gui.user.id,
            "connectedSince": this._connectedSince,
            "isRemoteClient": gui.isRemoteClient
        };
        if (this.multiplayerEnabled && this.state.clients[this.clientId])
        {
            payload.isPilot = this.state.clients[this.clientId].isPilot;
            payload.following = this.state.clients[this.clientId].following;
        }
        this.sendControl("pingAnswer", payload);
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
        if (msg.name === "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _handlePacoMessage(msg)
    {
        if (msg.clientId === this._socket.clientId) return;

        if (this._pacoEnabled && msg.name === "paco")
        {
            if (!this._paco)
            {
                if (msg.data.event !== CABLES.PACO_LOAD)
                {
                    return;
                }

                this._log.log("first paco message !");
                gui.corePatch().clear();
                this._paco = new PacoConnector(this, gui.patchConnection);
                gui.patchConnection.connectors.push(this._paco);
            }
            else if (msg.data.event === CABLES.PACO_LOAD)
            {
                gui.corePatch().clear();
            }

            this._paco.receive(msg.data);
            this._pacoSynced = true;
            // this.state.emitEvent("userListChanged");
            this.state.emitEvent("patchSynchronized");
        }
    }

    _handleControlChannelMessage(msg)
    {
        if (msg.name === "resync")
        {
            if (msg.clientId === this._socket.clientId) return;

            if (this._pacoEnabled && this.client && this.client.isPilot)
            {
                this._log.log("RESYNC sending paco patch....", this.client.isPilot);
                this.startPacoSend();
            }
        }
        if (msg.name === "pingMembers")
        {
            const timeOutSeconds = this.PING_INTERVAL * this.OWN_PINGS_TO_TIMEOUT;
            const pingOutTime = Date.now() - timeOutSeconds;
            msg.lastPing = this._lastPing;
            if (this._lastPing < pingOutTime)
            {
                msg.seconds = timeOutSeconds / 1000;
                this.emitEvent("onPingTimeout", msg);
                this._log.warn("didn't receive ping for more than", msg.seconds, "seconds");
            }
            this.sendPing();
        }
        if (msg.name === "pingAnswer")
        {
            msg.lastSeen = Date.now();
            if (msg.clientId === this._socket.clientId)
            {
                this._lastPing = msg.lastSeen;
            }
            this.emitEvent("onPingAnswer", msg);
        }
        if (msg.name === "pilotRequest")
        {
            if (msg.clientId === this._socket.clientId) return;
            this.emitEvent("onPilotRequest", msg);
        }
    }

    _handleUiChannelMsg(msg)
    {
        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent(msg.name, msg);
    }

    _handleInfoChannelMsg(msg)
    {
        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent("onInfoMessage", msg);
    }
}
