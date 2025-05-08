import { Logger, Events } from "cables-shared-client";
import PacoConnector from "./sc_paconnector.js";

import ScState from "./sc_state.js";
import ScUiMultiplayer from "./sc_ui_multiplayer.js";
import Gui, { gui } from "../gui.js";
import { PatchConnectionSender } from "./patchconnection.js";
import Chat from "../components/tabs/tab_chat.js";
import { platform } from "../platform.js";
import ScUi from "./sc_ui.js";

export default class ScConnection extends Events
{
    constructor(cfg)
    {
        super();

        this.PING_INTERVAL = 5000;
        this.PINGS_TO_TIMEOUT = 5;
        this.OWN_PINGS_TO_TIMEOUT = 5;

        this._log = new Logger("scconnection");
        this._verboseLog = false;

        this._scConfig = cfg;
        this._active = cfg.hasOwnProperty("enabled") ? cfg.enabled : false;
        this._lastPingReceived = this.getTimestamp();

        this._socket = null;
        this._connected = false;
        this._connectedSince = null;
        this._inSessionSince = null;

        this._paco = null;
        this._pacoEnabled = false;
        this._patchConnection = new PatchConnectionSender(gui.corePatch());
        this._pacoSynced = false;
        this._pacoChannel = null;
        this._pacoLoopReady = false;

        this.patchChannelName = this._scConfig.patchChannel;
        this.userChannelName = this._scConfig.userChannel;
        this.userPatchChannelName = this._scConfig.userPatchChannel;
        this.broadcastChannelName = this._scConfig.broadcastChannel;
        this.multiplayerCapable = this._scConfig.multiplayerCapable;
        if (cfg)
        {
            this._init((isActive) =>
            {
                let showMultiplayerUi = (isActive && this.multiplayerCapable);
                if (this.showGuestUsers) showMultiplayerUi = true;
                if (gui.isRemoteClient) showMultiplayerUi = false;

                this._scUi = new ScUi(this);
                if (showMultiplayerUi)
                {
                    this._multiplayerUi = new ScUiMultiplayer(this);
                    this._chat = new Chat(gui.mainTabs, this);
                }
            });
        }
    }

    getTimestamp()
    {
        return (performance.timing.navigationStart + performance.now());
    }

    get showGuestUsers()
    {
        return gui && gui.project() && gui.project() && gui.project().settings && gui.project().visibility === "public";
    }

    get netMouseCursorDelay() { return 100; }

    get netTimelineScrollDelay() { return 100; }

    get chat() { return this._chat; }

    get state() { return this._state; }

    get connected() { return this._connected; }

    get client() { return this.state.clients[this.clientId]; }

    get clientId() { return this._socket.clientId; }

    get followers() { return this.state.followers; }

    get clients() { return this.state.clients; }

    get synced()
    {
        if (!this._pacoEnabled) { return true; }
        else { return this._pacoSynced; }
    }

    get inMultiplayerSession() { return this._pacoEnabled; }

    get hasOtherMultiplayerCapableClients()
    {
        if (!this.state) return false;
        let clientsInSession = false;
        const clients = Object.values(this.clients);
        for (let i = 0; i < clients.length; i++)
        {
            const client = clients[i];
            if (client.clientId === this.clientId) continue;
            if (client.multiplayerCapable)
            {
                clientsInSession = true;
                break;
            }
        }
        return clientsInSession;
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

    enableVerboseLogging()
    {
        this._verboseLog = true;
    }

    isConnected()
    {
        return this._connected;
    }

    getPilot()
    {
        return this.state.getPilot();
    }

    hasPilot()
    {
        return this.state.hasPilot();
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

    showChat()
    {
        this._chat.show();
    }

    setPacoPaused(paused)
    {
        if (this._paco) this._paco.paused = paused;
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
                }
                this._inSessionSince = this.getTimestamp();
                this.client.inMultiplayerSession = true;
                this._sendPing(true);
                this._state.emitEvent("enableMultiplayer", { "username": this.client.username, "clientId": this.clientId, "started": true });
            }
        }
    }

    joinMultiplayerSession()
    {
        this.client.isPilot = false;
        this.client.following = null;
        this.client.inMultiplayerSession = true;
        this._inSessionSince = this.getTimestamp();
        this._state.emitEvent("enableMultiplayer", { "username": this.client.username, "clientId": this.clientId, "started": false });
        this._sendPing();
    }

    reconnectRemoteViewer()
    {
        let startSessionListener = null;

        if (!this.runningMultiplayerSession)
        {
            startSessionListener = this.on("multiplayerEnabled", () => { this._reconnectViewer(startSessionListener); });
            this.startMultiplayerSession();
        }
        else
        {
            this._reconnectViewer(startSessionListener);
        }
    }

    _reconnectViewer(startSessionListener)
    {
        if (startSessionListener) this._state.off(startSessionListener);
        gui.setRestriction(Gui.RESTRICT_MODE_FULL);
        this.client.isPilot = true;
        this.client.following = null;
        this.client.inMultiplayerSession = true;
        this._inSessionSince = this.getTimestamp();
        this._state.emitEvent("enableMultiplayer", { "username": this.client.username, "clientId": this.clientId, "started": true });
        this._sendPing(true);
        this._startPacoSend(this.clientId, true);
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
        this._pacoChannel = this._socket.unsubscribe(this.userPatchChannelName + "/paco");
        this._pacoEnabled = false;
        this.client.inMultiplayerSession = false;
        this.client.following = null;
        this._inSessionSince = null;
        this.emitEvent("netLeaveSession");
        this._sendPing();
    }

    sendCurrentVersion()
    {
        if (this.client.isPilot)
        {
            this._startPacoSend(this.clientId, true);
        }
    }

    _startPacoSend(requestedBy, forceResync = false)
    {
        if (this.inMultiplayerSession)
        {
            if (!this._paco)
            {
                this._paco = new PacoConnector(this, this._patchConnection);
                this._patchConnection.connectors.push(this._paco);
            }

            const json = gui.corePatch().serialize({ "asObject": true });
            const payload = {
                "patch": JSON.stringify(json),
                "requestedBy": requestedBy,
                "forceResync": forceResync
            };
            this._paco.send(CABLES.PACO_LOAD, payload);
            this._pacoSynced = true;
            if (gui.scene().timer)
            {
                this.sendUi("timelineControl", { "command": "setPlay", "value": gui.scene().timer.isPlaying(), "time": gui.scene().timer.getTime() });
            }
            this.state.emitEvent("patchSynchronized");
        }
    }

    requestPilotPatch()
    {
        if (this.inMultiplayerSession && !this.client.isPilot)
        {
            this.sendPaco({ "requestedBy": this.client.clientId }, "resync");
        }
    }

    track(eventCategory, eventAction, eventLabel, meta = {})
    {
        if (!this._scConfig.enableTracking) return;

        const payload = {
            eventCategory,
            eventAction,
            eventLabel,
            meta
        };
        this.sendControl("track", payload);
    }

    sendNotification(title, text)
    {
        this._send(this.patchChannelName, "info", { "name": "notify", "title": title, "text": text });
    }

    sendControl(name, payload)
    {
        payload = payload || {};
        payload.name = name;

        this._send(this.patchChannelName, "control", payload);
    }

    sendUi(name, payload, sendOnEmptyClientList = false)
    {
        if (sendOnEmptyClientList || this.state.getNumClients() > 1)
        {
            payload = payload || {};
            payload.name = name;
            this._send(this.patchChannelName, "ui", payload);
        }
    }

    sendChat(text)
    {
        // remove html
        const el = document.createElement("div");
        el.innerHTML = text;
        text = el.textContent || el.innerText || "";
        this._send(this.patchChannelName, "chat", { "name": "chatmsg", text, "username": gui.user.username });
    }

    sendPaco(payload, name = "paco")
    {
        if (!this._pacoEnabled) return;
        if (this.client && (!this.client.isRemoteClient || name === "resync"))
        {
            payload.name = name || "paco";
            this._send(this.userPatchChannelName, "paco", payload);
        }
    }

    _init(doneCallback)
    {
        if (!this._active)
        {
            this._log.info("CABLES-SOCKETCLUSTER NOT ACTIVE, WON'T SEND MESSAGES (enable in config)");
            doneCallback(false);
        }

        this._token = this._scConfig.token;
        this._socket = socketClusterClient.create(this._scConfig);
        this._socket.patchChannelName = this.patchChannelName;
        this._socket.userChannelName = this.userChannelName;
        this._socket.userPatchChannelName = this.userPatchChannelName;

        this._state = new ScState(this);
        if (this.multiplayerCapable)
        {
            this._state.on("becamePilot", () =>
            {
                this._sendPing();
                this._startPacoSend(this.clientId);
            });

            this._state.on("enableMultiplayer", (payload) =>
            {
                this._pacoEnabled = true;

                (async () =>
                {
                    if (!this._pacoEnabled) return;
                    if (!this._pacoChannel)
                    {
                        this._pacoChannel = this._socket.subscribe(this.userPatchChannelName + "/paco");
                        if (!this._pacoLoopReady)
                        {
                            this._pacoLoopReady = true;
                            for await (const msg of this._pacoChannel)
                            {
                                this._handlePacoMessage(msg);
                                this.emitEvent("netActivityIn");
                            }
                        }
                    }
                })();

                if (!payload.started)
                {
                    this.requestPilotPatch();
                }
                this.emitEvent("multiplayerEnabled");
            });
        }

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                if (!this.isConnected()) return;
                if (this.inMultiplayerSession)
                {
                    // notifyError("multiplayer server disconnected!", "wait for reconnection to rejoin session");
                    this.leaveMultiplayerSession();
                }
                // socketcluster reports "hung up" errors during own reconnection/keepalive phase
                if (error.code !== 1006 && error.code !== 4001) this._log.info(error.code + " - " + error.message);
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
                // this._log.verbose("sc connected!");
                this._connected = true;
                this._connectedSince = this.getTimestamp();

                this.emitEvent("connectionChanged");

                // send me patch
                this._updateMembers();

                if (this.client.isRemoteClient)
                {
                    this.joinMultiplayerSession();
                }
                else
                {
                    this._reconnectViewer();
                }
            }
        })();

        if (this.userChannelName)
        {
            (async () =>
            {
                const userChannel = this._socket.subscribe(this.userChannelName + "/activity");
                for await (const msg of userChannel)
                {
                    if (msg && msg.data)
                    {
                        gui.updateActivityFeedIcon(msg.data);
                    }
                }
            })();
        }

        (async () =>
        {
            const controlChannel = this._socket.subscribe(this.patchChannelName + "/control");

            for await (const msg of controlChannel)
            {
                this._handleControlChannelMessage(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const uiChannel = this._socket.subscribe(this.patchChannelName + "/ui");
            for await (const msg of uiChannel)
            {
                this._handleUiChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const infoChannel = this._socket.subscribe(this.patchChannelName + "/info");
            for await (const msg of infoChannel)
            {
                this._handleInfoChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        (async () =>
        {
            const chatChannel = this._socket.subscribe(this.patchChannelName + "/chat");
            for await (const msg of chatChannel)
            {
                this._handleChatChannelMsg(msg);
                this.emitEvent("netActivityIn");
            }
        })();

        if (this.userPatchChannelName)
        {
            (async () =>
            {
                const userChannel = this._socket.subscribe(this.userPatchChannelName + "/info");
                for await (const msg of userChannel)
                {
                    this._handleInfoChannelMsg(msg);
                    this.emitEvent("netActivityIn");
                }
            })();
        }

        if (this.broadcastChannelName)
        {
            (async () =>
            {
                const userChannel = this._socket.subscribe(this.broadcastChannelName);
                for await (const msg of userChannel)
                {
                    if (msg && msg.data && msg.data.build)
                    {
                        let text = "";
                        switch (msg.data.build)
                        {
                        case "started":
                            text = "Waiting while building";
                            if (msg.data.module) text += " " + msg.data.module;
                            text += "...";
                            gui.restriction.setMessage("cablesbuild", text);
                            break;
                        case "ended":
                            text = "done building";
                            if (msg.data.module) text += " " + msg.data.module;
                            text += "...";
                            gui.restriction.setMessage("cablesbuild", null);
                            gui.patchView.store.checkUpdated(null, false, true);
                            break;
                        }

                    }
                }
            })();
        }

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
                this._sendPing();
            }
            if (this._socket && this._socket.destroy)
            {
                this._socket.destroy();
            }
        });

        doneCallback(true);
    }

    _updateMembers()
    {
        this.sendControl("pingMembers", {});

        setTimeout(() =>
        {
            this._updateMembers();
        }, this.PING_INTERVAL);
    }

    _sendPing(startedSession = false)
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
            if (this.inMultiplayerSession)
            {
                payload.x = x;
                payload.y = y;
                payload.subpatch = subPatch;
                payload.zoom = zoom;
                payload.scrollX = scrollX;
                payload.scrollY = scrollY;
            }
        }
        if (payload.isRemoteClient && platform.talkerAPI && !payload.isDisconnected)
        {
            payload.platform = platformLib;
            this.sendControl("pingAnswer", payload);
        }
        else
        {
            this.sendControl("pingAnswer", payload);
        }
    }

    _send(channel, topic, payload)
    {
        if (!this.client) return;

        if (this._active && this._connected)
        {
            try
            {
                // try to serialize payload to handle errors in scconnection early
                JSON.stringify(payload);
                const finalPayload = {
                    "token": this._token,
                    "clientId": this.client.clientId,
                    "username": this.client.username,
                    topic,
                    ...payload,
                };

                this.emitEvent("netActivityOut");
                const perf = gui.uiProfiler.start("[sc] send");
                const scTopic = channel + "/" + topic;
                this._logVerbose("send:", scTopic, finalPayload);
                this._socket.transmitPublish(scTopic, finalPayload);
                perf.finish();
            }
            catch (e)
            {
                this._log.info("failed to serialize object before send, ignoring", payload);
            }
        }
    }

    _handleChatChannelMsg(msg)
    {
        if (!this.client) return;
        this._logVerbose("received:", this.patchChannelName + "/chat", msg);
        if (msg.data && msg.data.senderEditorId && (msg.data.senderEditorId === gui.editorSessionId)) msg.isOwn = true;

        if (msg.name === "chatmsg")
        {
            this.emitEvent("onChatMessage", msg);
        }
    }

    _handlePacoMessage(msg)
    {
        if (!this.client) return;
        if (msg.clientId === this._socket.clientId) return;
        if (msg.data && msg.data.senderEditorId && (msg.data.senderEditorId === gui.editorSessionId)) msg.isOwn = true;

        this._logVerbose("received:", this.patchChannelName + "/paco", msg);

        if (this.inMultiplayerSession && msg.name === "paco")
        {
            if (!this.client.isRemoteClient) return;

            const foreignRequest = (msg.data && msg.data.vars && msg.data.vars.requestedBy && this.client) && (msg.data.vars.requestedBy !== this.clientId);

            if (!this._paco)
            {
                if (msg.data.event !== CABLES.PACO_LOAD)
                {
                    return;
                }

                this._log.info("first paco message !");
                this._paco = new PacoConnector(this, this._patchConnection);
                this._patchConnection.connectors.push(this._paco);
                this._synchronizePatch(msg.data);
            }
            else if (msg.data.event === CABLES.PACO_LOAD)
            {
                if (!foreignRequest || (msg.data.vars && msg.data.vars.forceResync))
                {
                    this._synchronizePatch(msg.data, msg.data.vars.forceResync);
                }
            }
            else
            {
                const perf = gui.uiProfiler.start("[sc] paco receive");
                this._paco.receive(msg.data);
                perf.finish();
                this._pacoSynced = true;
                this.state.emitEvent("patchSynchronized");
            }
        }
        else if (msg.name === "resync")
        {
            if (msg.clientId === this._socket.clientId) return;

            let startSessionListener = null;
            const resyncPatch = () =>
            {
                if (startSessionListener) this.off(startSessionListener);
                if (this._pacoEnabled && this.client) // && this.client.isPilot)
                {
                    this._log.info("RESYNC sending paco patch....");
                    this._startPacoSend(msg.clientId);
                }
            };
            if (this.inMultiplayerSession)
            {
                resyncPatch();
            }
        }
    }

    _synchronizePatch(data)
    {
        if (!this._paco) return;
        this._pacoSynced = false;
        this.state.emitEvent("startPatchSync");
        const perf = gui.uiProfiler.start("[sc] paco sync");
        const cbId = gui.corePatch().on("patchLoadEnd", () =>
        {
            this._log.verbose("patchloadend in paco");
            gui.corePatch().off(cbId);
            this._pacoSynced = true;
            this.state.emitEvent("patchSynchronized");
            perf.finish();
        });
        gui.patchView.clearPatch();
        this._paco.receive(data);
    }

    _handleControlChannelMessage(msg)
    {
        if (!this.client) return;
        this._logVerbose("received:", this.patchChannelName + "/control", msg);
        if (msg.data && msg.data.senderEditorId && (msg.data.senderEditorId === gui.editorSessionId)) msg.isOwn = true;

        if (msg.name === "pingMembers")
        {
            const timeOutSeconds = this.PING_INTERVAL * this.OWN_PINGS_TO_TIMEOUT;
            const pingOutTime = this.getTimestamp() - timeOutSeconds;
            if (this._lastPingReceived < pingOutTime)
            {
                msg.seconds = timeOutSeconds / 1000;
                this.emitEvent("onPingTimeout", msg);
                this._log.info("didn't receive ping for more than", msg.seconds, "seconds");
            }
            if (msg.clientId !== this.clientId)
            {
                this._sendPing();
            }
            else
            {
                this._lastPingReceived = msg.lastSeen;
            }
        }
        if (msg.name === "pingAnswer")
        {
            msg.lastSeen = this.getTimestamp();
            this._lastPingReceived = msg.lastSeen;
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
        if (msg.name === "createdSubPatchOp")
        {
            this.emitEvent("createdSubPatchOp", msg);
        }
    }

    _handleUiChannelMsg(msg)
    {
        if (!this.client) return;
        this._logVerbose("received:", this.patchChannelName + "/ui", msg);
        if (msg.data && msg.data.senderEditorId && (msg.data.senderEditorId === gui.editorSessionId)) msg.isOwn = true;

        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent(msg.name, msg);
    }

    _handleInfoChannelMsg(msg)
    {
        if (!this.client) return;
        this._logVerbose("received:", this.patchChannelName + "/info", msg);
        if (msg.data && msg.data.senderEditorId && (msg.data.senderEditorId === gui.editorSessionId)) msg.isOwn = true;

        if (msg.clientId === this._socket.clientId) return;
        this.emitEvent("onInfoMessage", msg);
    }

    _logVerbose(prefix, channel, msg)
    {
        if (this._verboseLog)
        {
            const { token, ...logMsg } = msg;
            this._logVerbose(prefix, channel, logMsg);
        }
    }
}
