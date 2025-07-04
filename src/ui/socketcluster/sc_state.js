import { Logger, Events } from "cables-shared-client";
import Gui, { gui } from "../gui.js";
import ScClient from "./sc_client.js";
import paramsHelper from "../components/opparampanel/params_helper.js";

CABLES = CABLES || {};

export default class ScState extends Events
{
    constructor(connection)
    {
        super();

        this.PILOT_REQUEST_TIMEOUT = 20000;

        this._log = new Logger("scstate");

        this._connection = connection;

        this._clients = {};
        this._clients[connection.clientId] = new ScClient({
            "username": gui.user.username,
            "userid": gui.user.id,
            "clientId": connection.clientId,
            "isMe": true,
            "isRemoteClient": gui.isRemoteClient,
            "multiplayerCapable": this._connection.multiplayerCapable,
            "isPilot": false
        });
        this._followers = [];
        this._colors = {};
        this._pilot = null;
        this._timeoutRefresh = null;

        this._registerEventListeners();
    }

    get clients() { return this._clients; }

    get followers() { return this._followers; }

    getUserId(clientId)
    {
        if (this._clients[clientId])
            return this._clients[clientId].userid;
    }

    getUserInSubpatch(subPatch)
    {
        const userIds = [];
        for (const i in this._clients)
        {
            if (!this._clients[i].isMe && this._clients[i].subpatch == subPatch)
                userIds.push(this._clients[i].userid);
        }

        return userIds;
    }

    _onPingAnswer(payload)
    {
        let userListChanged = false;
        if (payload.isDisconnected)
        {
            if (this._clients[payload.clientId])
            {
                const wasInMultiplayerSession = this._clients[payload.clientId].inMultiplayerSession;
                if (this._connection.clientId !== payload.clientId)
                {
                    delete this._clients[payload.clientId];
                    this.emitEvent("clientDisconnected", payload, wasInMultiplayerSession);
                    userListChanged = true;
                }
            }
        }
        else
        {
            const client = new ScClient(payload, this._connection.client);
            if (this._clients[payload.clientId])
            {
                if (!payload.inMultiplayerSession && this._clients[payload.clientId].inMultiplayerSession)
                {
                    this.emitEvent("clientLeft", payload);
                    userListChanged = true;
                }
                if (payload.inMultiplayerSession && !this._clients[payload.clientId].inMultiplayerSession)
                {
                    this.emitEvent("clientJoined", payload);
                    userListChanged = true;
                }
            }
            else
            {
                userListChanged = true;
            }
            this._clients[payload.clientId] = client;
        }

        if (this._connection.inMultiplayerSession)
        {
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
            else if (this._pilot)
            {
                if (this._pilot.clientId === payload.clientId && !payload.isPilot)
                {
                    // pilot left the multiplayer session but is still in socketcluster
                    this._pilot = null;
                    this.emitEvent("pilotRemoved");
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
        }
        else if (payload.startedSession)
        {
            userListChanged = true;
        }

        const cleanupChange = this._cleanUpUserList();
        if (userListChanged || cleanupChange)
        {
            this.emitEvent("userListChanged");
        }
    }

    getNumClients()
    {
        return Object.keys(this._clients).length;
    }

    _cleanUpUserList()
    {
        // wait for patch to be in a synced state to update userlist
        if (!this._connection.synced)
        {
            return false;
        }

        const timeOutSeconds = this._connection.PING_INTERVAL * this._connection.PINGS_TO_TIMEOUT;

        let cleanupChange = false;

        Object.keys(this._clients).forEach((clientId) =>
        {
            const client = this._clients[clientId];

            if (client.lastSeen && (this._connection.getTimestamp() - client.lastSeen) > timeOutSeconds)
            {
                if (this._connection.clientId !== clientId)
                {
                    this.emitEvent("clientRemoved", this._clients[client.clientId]);
                    delete this._clients[client.clientId];
                }
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
            if (this._connection.inMultiplayerSession && !gui.isRemoteClient)
            {
                this._clients[this._connection.clientId].isPilot = true;
                cleanupChange = true;
            }
        }

        if (!this.hasPilot() && this._connection.inMultiplayerSession)
        {
            let pilot = null;
            let earliestConnection = this._connection.getTimestamp();
            Object.keys(this._clients).forEach((key) =>
            {
                const client = this._clients[key];
                if (client && client.isPilot) pilot = client;
            });

            if (!pilot)
            {
                // connection has no pilot, try to find the longest connected client that is also in a multiplayer session
                Object.keys(this._clients).forEach((key) =>
                {
                    const client = this._clients[key];
                    if (!client.isRemoteClient && client.inMultiplayerSession && client.inSessionSince && client.inSessionSince < earliestConnection)
                    {
                        pilot = client;
                        earliestConnection = client.inSessionSince;
                    }
                });
            }

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

    getPilot()
    {
        return this._pilot;
    }

    hasPilot()
    {
        return !!this._pilot;
    }

    becomePilot()
    {
        if (!gui.isRemoteClient)
        {
            this._connection.client.isPilot = true;
            this.emitEvent("becamePilot");
            gui.setRestriction(Gui.RESTRICT_MODE_FULL);
        }
    }

    requestPilotSeat()
    {
        const client = this._clients[this._connection.clientId];
        if (!gui.isRemoteClient && (client && !client.isPilot))
        {
            this._connection.sendControl("pilotRequest", { "username": client.username, "state": "request" });
            const myAvatar = document.querySelector("#multiplayerbar .sc-userlist .item.me");
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
            const myAvatar = document.querySelector("#multiplayerbar .sc-userlist .item.me");
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
            const myAvatar = document.querySelector("#multiplayerbar .sc-userlist .item.me");
            if (myAvatar) myAvatar.classList.remove("pilot-request");
        }
    }

    _registerEventListeners()
    {
        this._connection.on("onPingAnswer", this._onPingAnswer.bind(this));
        this._connection.on("netCursorPos", (msg) =>
        {
            if (this._connection.client.isRemoteClient) return;
            if (this._clients[msg.clientId])
            {
                if (this._clients[msg.clientId].subpatch != msg.subpatch)
                {
                    this._clients[msg.clientId].subpatch = msg.subpatch;
                    gui.emitEvent("multiUserSubpatchChanged", msg.clientId, msg.subpatch);
                }

                this._clients[msg.clientId].x = msg.x;
                this._clients[msg.clientId].y = msg.y;
                this._clients[msg.clientId].subpatch = msg.subpatch;
                this._clients[msg.clientId].zoom = msg.zoom;
                this._clients[msg.clientId].center = msg.center;
                this._clients[msg.clientId].scrollX = msg.scrollX;
                this._clients[msg.clientId].scrollY = msg.scrollY;
            }
        });

        this.on("clientDisconnected", (client, wasInMultiplayerSession = false) =>
        {
            gui.emitEvent("netClientRemoved", { "clientId": client.clientId });
        });

        this.on("clientLeft", (client) =>
        {
            gui.emitEvent("netClientRemoved", { "clientId": client.clientId });
        });

        this.on("patchSynchronized", () =>
        {
            if (this._connection.client.isRemoteClient)
            {
                const menubar = document.getElementById("menubar");
                if (menubar) menubar.classList.add("hidden");
            }
        });

        this._connection.on("clientRemoved", (msg) =>
        {
            this._connection.sendUi("netClientRemoved", msg, true);
            gui.emitEvent("netClientRemoved", msg);
        });

        gui.patchView.on("mouseMove", (x, y) =>
        {
            this._sendCursorPos(x, y);
        });

        gui.on("timelineControl", (command, value) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                if (command !== "scrollTime")
                {
                    const payload = {
                        "command": command,
                        "value": value
                    };
                    this._connection.sendUi("timelineControl", payload);
                }
                else
                {
                    if (this._timelineTimeout) return;

                    const payload = {
                        "command": "setTime",
                        "value": value
                    };
                    this._timelineTimeout = setTimeout(() =>
                    {
                        this._connection.sendUi("timelineControl", payload);
                        this._timelineTimeout = null;
                    }, this._connection.netTimelineScrollDelay);
                }
            }
        });

        gui.on("portValueEdited", (op, port, value) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client) // && this._connection.client.isPilot)
            {
                if (op && port)
                {
                    const payload = {};
                    payload.data = {
                        "event": CABLES.PACO_VALUECHANGE,
                        "vars": {
                            "op": op.id,
                            "port": port.name,
                            "v": value
                        }
                    };
                    this._connection.sendPaco(payload);
                }
            }
        });

        gui.corePatch().on("pacoPortValueSetAnimated", (op, index, targetState, defaultValue) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            paramsHelper.setPortAnimated(op, index, targetState, defaultValue);
        });

        gui.corePatch().on("pacoPortAnimUpdated", (port) =>
        {
            if (!port.anim) return;
            if (!this._connection.inMultiplayerSession) return;
            gui.metaKeyframes.showAnim(port.parent.id, port.name);
        });

        gui.on("portValueSetAnimated", (op, portIndex, targetState, defaultValue) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                if (op)
                {
                    const payload = {};
                    payload.data = {
                        "event": CABLES.PACO_PORT_SETANIMATED,
                        "vars": {
                            "opId": op.id,
                            "portIndex": portIndex,
                            "targetState": targetState,
                            "defaultValue": defaultValue
                        }
                    };
                    this._connection.sendPaco(payload);
                }
            }
        });

        gui.corePatch().on("opReloaded", (opName) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                this._connection.sendControl("reloadOp", { "opName": opName });
            }
        });

        gui.on("gizmoMove", (opId, portName, newValue) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                if (opId && portName)
                {
                    const payload = {};
                    payload.data = {
                        "event": CABLES.PACO_VALUECHANGE,
                        "vars": {
                            "op": opId,
                            "port": portName,
                            "v": newValue
                        }
                    };
                    this._connection.sendPaco(payload);
                }
            }
        });

        this._connection.on("netCursorPos", (msg) =>
        {
            if (!this._connection.multiplayerCapable) return false;
            delete msg.zoom;
            gui.emitEvent("netCursorPos", msg);
        });

        this._connection.on("resyncWithPilot", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (!this._connection.client.isRemoteClient) return;
            if (this._connection.clientId !== msg.reloadClient) return;
            this._connection.requestPilotPatch();
        });

        this._connection.on("onPortValueChanged", (vars) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client.isRemoteClient) return;
            if (this._connection.client.isPilot) return;

            const selectedOp = gui.patchView.getSelectedOps().find((op) => { return op.id === vars.op; });
            if (selectedOp)
            {
                const portIndex = selectedOp.portsIn.findIndex((port) => { return port.name === vars.port; });
                if (portIndex)
                {
                    clearTimeout(this._timeoutRefresh);
                    this._timeoutRefresh = setTimeout(() =>
                    {
                        selectedOp.refreshParams();
                    }, 50);
                }
            }
        });
    }

    _sendCursorPos(x, y)
    {
        if (!this._connection.isConnected()) return;
        if (this._lastMouseX === x || this._lastMouseY === y) return;

        this._lastMouseX = x;
        this._lastMouseY = y;

        if (this._mouseTimeout) return;

        const subPatch = gui.patchView.getCurrentSubPatch();
        const zoom = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.zoom : null;
        const scrollX = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.scrollX : null;
        const scrollY = gui.patchView.patchRenderer.viewBox ? gui.patchView.patchRenderer.viewBox.scrollY : null;

        this._mouseTimeout = setTimeout(() =>
        {
            const payload = { "x": this._lastMouseX, "y": this._lastMouseY, "subpatch": subPatch, "zoom": zoom, "scrollX": scrollX, "scrollY": scrollY };
            this._connection.sendUi("netCursorPos", payload);
            this._mouseTimeout = null;
        }, this._connection.netMouseCursorDelay);
    }
}
