
import PacoConnector from "./sc_paconnector";
import Logger from "../utils/logger";

import ScState from "./sc_state";
import ScUiMultiplayer from "./sc_ui_multiplayer";
import { notify } from "../elements/notification";

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
        this._inSessionSince = null;
        this._paco = null;
        this._patchConnection = new CABLES.PatchConnectionSender(gui.corePatch());
        this._pacoSynced = false;

        this.multiplayerCapable = this._scConfig.multiplayerCapable;
        this._pacoEnabled = false;


        if (cfg) this._init((isActive) =>
        {
            if (isActive)
            {
                this._multiplayerUi = new ScUiMultiplayer(this);
                this._chat = new CABLES.UI.Chat(gui.mainTabs, this);
            }
        });
    }

    get netMouseCursorDelay()
    {
        return 100;
    }

    get chat() { return this._chat; }

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

    get inMultiplayerSession()
    {
        return this._pacoEnabled;
    }

    get runningMultiplayerSession()
    {
        if (!this.state) return false;
        let clientsInSession = false;
        const clients = Object.values(this.clients);
        for (let i = 0; i < clients.length; i++)
        {
            const client = clients[i];
            if (client.inMultiplayerSession)
            {
                clientsInSession = true;
                break;
            }
        }
        return clientsInSession;
    }

    get onlyRemoteClientsConnected()
    {
        if (!this.state) return false;
        let onlyRemoteClients = true;
        const clients = Object.values(this.clients);
        for (let i = 0; i < clients.length; i++)
        {
            const client = clients[i];
            if (!client.inMultiplayerSession) continue;
            if (!client.isRemoteClient) onlyRemoteClients = false;
        }
        return onlyRemoteClients;
    }

    hasPilot()
    {
        return this.state.hasPilot();
    }

    getClientColor(clientId)
    {
        return this._state.getClientColor(clientId);
    }

    showChat()
    {
        this._chat.show();
    }

    startPacoSend()
    {
        if (this.inMultiplayerSession)
        {
            if (!this._paco)
            {
                this._paco = new PacoConnector(this, this._patchConnection);
                this._patchConnection.connectors.push(this._paco);
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

    requestPilotPatch()
    {
        if (this.inMultiplayerSession && !this.client.isPilot)
        {
            this.sendControl("resync");
        }
    }

    get clientId() { return this._socket.clientId; }

    _init(doneCallback)
    {
        if (!this._active)
        {
            this._log.info("CABLES-SOCKETCLUSTER NOT ACTIVE, WON'T SEND MESSAGES (enable in config)");
            doneCallback(false);
        }

        this._token = this._scConfig.token;
        this._socket = socketClusterClient.create(this._scConfig);
        this._socket.channelName = this._scConfig.channel;
        this.channelName = this._socket.channelName;

        this._state = new ScState(this);
        if (this.multiplayerCapable)
        {
            this._state.on("becamePilot", () =>
            {
                this.startPacoSend();
            });

            this._state.on("enableMultiplayer", (payload) =>
            {
                this._pacoEnabled = true;

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
                if (payload.started)
                {
                    this.startPacoSend();
                }
                else
                {
                    this.sendControl("resync");
                }
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

                if (this.client.isRemoteClient)
                {
                    this.joinMultiplayerSession();
                }
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

        window.addEventListener("beforeunload", () =>
        {
            if (!this.client) return;

            this.client.isDisconnected = true;
            if (this.inMultiplayerSession)
            {
                this.leaveMultiplayerSession(true);
            }
            else
            {
                this.sendPing();
            }
            this._log.verbose("sc will disconnect!");
            if (this._socket && this._socket.destroy)
            {
                this._socket.destroy();
            }
        });

        doneCallback(true);
    }

    isConnected()
    {
        return this._connected;
    }

    canSaveInMultiplayer()
    {
        if (this._pacoEnabled)
        {
            return this.connected && this.client && this.client.isPilot;
        }
        else
        {
            return true;
        }
    }

    startMultiplayerSession()
    {
        if (this.runningMultiplayerSession)
        {
            this.joinMultiplayerSession();
        }
        else
        {
            if (this.multiplayerCapable)
            {
                if (!this.client.isRemoteClient)
                {
                    this.client.isPilot = true;
                    this.sendNotification(this.client.username + " just started a multiplayer session");
                    notify("YOU just started a multiplayer session");
                }
                this._inSessionSince = Date.now();
                this.client.inMultiplayerSession = true;
                this.sendPing(true);
                this._state.emitEvent("enableMultiplayer", { "username": this.client.username, "clientId": this.clientId, "started": true });
            }
        }
    }

    joinMultiplayerSession()
    {
        this.client.isPilot = false;
        this.client.following = null;
        this.client.inMultiplayerSession = true;
        this._inSessionSince = Date.now();
        this.sendPing();
        this._state.emitEvent("enableMultiplayer", { "username": this.client.username, "clientId": this.clientId, "started": false });
    }

    startRemoteViewer(doneCallback)
    {
        const listener = () => { this._state.off(listenerId); doneCallback(); };
        const listenerId = this._state.on("enableMultiplayer", listener);

        if (!this.inMultiplayerSession)
        {
            if (this.runningMultiplayerSession)
            {
                this.joinMultiplayerSession();
            }
            else
            {
                this.startMultiplayerSession();
            }
        }
        else
        {
            doneCallback();
        }
    }

    leaveMultiplayerSession()
    {
        this.client.isPilot = false;
        this._socket.unsubscribe(this._socket.channelName + "/paco");
        this._pacoEnabled = false;
        this.client.inMultiplayerSession = false;
        this.client.following = null;
        this._inSessionSince = null;
        this.emitEvent("netLeaveSession");
        this.sendPing();
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
        // remove html
        const el = document.createElement("div");
        el.innerHTML = text;
        text = el.textContent || el.innerText || "";
        this._send("chat", { "name": "chatmsg", text, "username": gui.user.username });
    }

    sendPaco(payload)
    {
        if (!this._pacoEnabled) return;
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

    sendPing(startedSession = false)
    {
        const x = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.mousePatchX : null;
        const y = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.mousePatchY : null;
        const subPatch = gui.patchView.getCurrentSubPatch();
        const zoom = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.zoom : null;
        const scrollX = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.scrollX : null;
        const scrollY = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.scrollY : null;

        const payload = {
            "username": gui.user.usernameLowercase,
            "userid": gui.user.id,
            "connectedSince": this._connectedSince,
            "inSessionSince": this._inSessionSince,
            "isRemoteClient": gui.isRemoteClient,
            "x": x,
            "y": y,
            "subpatch": subPatch,
            "zoom": zoom,
            "scrollX": scrollX,
            "scrollY": scrollY,
            "inMultiplayerSession": this.client.inMultiplayerSession,
            "multiplayerCapable": this.multiplayerCapable,
            "startedSession": startedSession
        };

        if (this.client)
        {
            payload.isPilot = this.client.isPilot;
            payload.following = this.client.following;
            if (this.client.isDisconnected)
            {
                payload.isDisconnected = true;
            }
        }
        if (payload.isRemoteClient && CABLESUILOADER.talkerAPI)
        {
            CABLESUILOADER.talkerAPI.send("sendBrowserInfo", {}, (browserInfo) =>
            {
                payload.platform = browserInfo;
                this.sendControl("pingAnswer", payload);
            });
        }
        else
        {
            this.sendControl("pingAnswer", payload);
        }
    }

    _send(topic, payload)
    {
        if (!this.client) return;

        if (this._active && this._connected)
        {
            const finalPayload = {
                "token": this._token,
                "clientId": this.client.clientId,
                "username": this.client.username,
                topic,
                ...payload,
            };

            this.emitEvent("netActivityOut");
            this._socket.transmitPublish(this._socket.channelName + "/" + topic, finalPayload);
        }
    }

    _handleChatChannelMsg(msg)
    {
        if (!this.client) return;

        if (msg.name === "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _handlePacoMessage(msg)
    {
        if (!this.client) return;
        if (msg.clientId === this._socket.clientId) return;

        if (this.inMultiplayerSession && msg.name === "paco")
        {
            if (!this._paco)
            {
                if (msg.data.event !== CABLES.PACO_LOAD)
                {
                    return;
                }

                this._log.log("first paco message !");
                gui.corePatch().clear();
                this._paco = new PacoConnector(this, this._patchConnection);
                this._patchConnection.connectors.push(this._paco);
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
        if (!this.client) return;

        if (msg.name === "resync")
        {
            if (msg.clientId === this._socket.clientId) return;

            if (this._pacoEnabled && this.client && this.client.isPilot)
            {
                this._log.log("RESYNC sending paco patch....");
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
        if (msg.name === "reloadOp")
        {
            if (!this.inMultiplayerSession) return;
            if (msg.clientId === this._socket.clientId) return;
            this.emitEvent("reloadOp", msg);
        }
    }

    _handleUiChannelMsg(msg)
    {
        if (!this.client) return;

        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent(msg.name, msg);
    }

    _handleInfoChannelMsg(msg)
    {
        if (!this.client) return;

        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent("onInfoMessage", msg);
    }
}
