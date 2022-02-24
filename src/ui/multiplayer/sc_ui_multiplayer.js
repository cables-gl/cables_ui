import { notify } from "../elements/notification";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";
import Gui from "../gui";

export default class ScUiMultiplayer extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this._connection = connection;
        this._lastMouseX = this._lastMouseY = 0;
        this._mouseTimeout = null;

        if (this._connection.client.isRemoteClient)
        {
            gui.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
        }

        this._connection.on("onInfoMessage", (payload) =>
        {
            if (payload.name === "notify")
            {
                notify(payload.title, payload.text);
            }
        });

        this._connection.on("connectionChanged", this.updateHtml.bind(this));

        this._connection.state.on("clientLeft", (client) =>
        {
            if (this._connection.inMultiplayerSession)
            {
                notify(client.username + " just left the multiplayer session");
            }
            gui.emitEvent("netClientRemoved", { "clientId": client.clientId });
        });

        this._connection.state.on("clientJoined", (client) =>
        {
            if (this._connection.inMultiplayerSession) notify(client.username + " just joined the multiplayer session");
        });

        this._connection.state.on("enableMultiplayer", this.updateHtml.bind(this));
        this._connection.state.on("userListChanged", this.updateHtml.bind(this));
        this._connection.state.on("becamePilot", this.updateHtml.bind(this));
        this._connection.state.on("pilotChanged", (pilot) =>
        {
            if (!this._connection.inMultiplayerSession) return;

            if (this._connection.state.getNumClients() > 1)
            {
                let username = pilot.username + " is";
                if (pilot.clientId === this._connection.clientId)
                {
                    username = "YOU are";
                    // unfollow on becoming pilot
                    this._connection.client.following = null;
                }
                else
                {
                    // follow the pilot
                    this._connection.client.following = pilot.clientId;
                    this._jumpToCursor(pilot);
                }
                this.updateHtml();
                notify(username + " the pilot");
            }
        });

        this._connection.state.on("patchSynchronized", () =>
        {
            if (!this._connection.client.isPilot)
            {
                // set patchsave state if not pilot after sync
                gui.setStateSaved();
            }
        });

        this._connection.state.on("clientRemoved", (msg) =>
        {
            if (this._connection.client.following && this._connection.client.following === msg.clientId)
            {
                const multiPlayerBar = document.getElementById("multiplayerbar");
                if (multiPlayerBar) delete multiPlayerBar.dataset.multiplayerFollow;
                this._connection.client.following = null;
            }

            this._connection.sendUi("netClientRemoved", msg, true);
            gui.emitEvent("netClientRemoved", msg);
        });

        gui.patchView.on("mouseMove", (x, y) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            this.sendCursorPos(x, y);
        });

        gui.on("netOpPos", (payload) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                this._connection.sendUi("netOpPos", payload);
            }
        });

        gui.on("timelineControl", (command, value) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                const payload = {
                    "command": command,
                    "value": value
                };
                this._connection.sendUi("timelineControl", payload);
            }
        });

        this._connection.on("timelineControl", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            const timeline = gui.timeLine();
            switch (msg.command)
            {
            case "goto":
                if (!msg.value)
                {
                    timeline.gotoZero();
                }
                else
                {
                    timeline.gotoOffset(Number(msg.value));
                }
                break;
            case "setPlay":
                const timer = gui.scene().timer;
                const targetState = !!msg.value;
                const isPlaying = timer.isPlaying();
                if (targetState !== isPlaying)
                {
                    timeline.togglePlay();
                }
                break;
            }
        });

        gui.on("portValueEdited", (op, port, value) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
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
            CABLES.UI.paramsHelper.setPortAnimated(op, index, targetState, defaultValue);
        });

        gui.corePatch().on("pacoPortAnimUpdated", (port) =>
        {
            console.log("UPDATING SHIT");
            if (!this._connection.inMultiplayerSession) return;
            if (port.anim)
            {
                gui.metaKeyframes.showAnim(port.parent.id, port.name);
            }
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

        gui.on("opReloaded", (opName) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.client && this._connection.client.isPilot)
            {
                this._connection.sendControl("reloadOp", { "opName": opName });
            }
        });

        this._connection.on("reloadOp", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (msg.opName)
            {
                const opName = msg.opName;
                notify("reloaded code for op", opName);

                this._requestResync(msg.username + " changed " + opName, (next) =>
                {
                    const taskName = String(Date.now());
                    loadjs([CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + opName)], taskName);

                    const loadJsCallback = () =>
                    {
                        next();
                    };
                    loadjs.ready(taskName, loadJsCallback, loadJsCallback);
                });
            }
        });

        gui.on("drawSelectionArea", (x, y, sizeX, sizeY) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            this.sendSelectionArea(x, y, sizeX, sizeY);
        });

        gui.on("hideSelectionArea", (x, y, sizeX, sizeY) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            this.sendSelectionArea(x, y, sizeX, sizeY, true);
        });

        this._connection.on("netOpPos", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            const op = gui.corePatch().getOpById(msg.opId);
            if (op)
            {
                op.setUiAttrib({ "fromNetwork": true, "translate": { "x": msg.x, "y": msg.y } });
            }
            else
            {
                setTimeout(
                    () =>
                    {
                        this._connection.emitEvent("netOpPos", msg);
                    }, 100);
            }
        });

        this._connection.on("onPilotRequest", (msg) =>
        {
            if (!this._connection.multiplayerCapable) return;

            if (msg.state === "request")
            {
                if (this._connection.inMultiplayerSession && this._connection.client.isPilot)
                {
                    let content = "<div> you have 20 seconds to react to this request, if you do not react, the request will be accepted</div>";
                    content += "<div style='margin-top: 20px; text-align: center;'>";
                    content += "<a class=\"button accept\">Accept</a>&nbsp;&nbsp;";
                    content += "<a class=\"button decline\">Decline</a>";
                    content += "</div>";

                    const options = {
                        "title": msg.username + " wants to be the pilot",
                        "html": content
                    };
                    const modal = new ModalDialog(options, false);
                    const closeListener = () =>
                    {
                        clearTimeout(requestTimeout);
                        this._connection.sendControl("pilotRequest", { "state": "declined", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                    };
                    const closeListenerId = modal.on("onClose", closeListener);
                    modal.on("onShow", () =>
                    {
                        const modalElement = modal.getElement();
                        const acceptButton = modalElement.querySelector(".button.accept");
                        const declineButton = modalElement.querySelector(".button.decline");

                        if (acceptButton)
                        {
                            acceptButton.addEventListener("pointerdown", () =>
                            {
                                clearTimeout(requestTimeout);
                                modal.off(closeListenerId);
                                this._connection.sendControl("pilotRequest", { "state": "accepted", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                                modal.close();
                            });
                        }
                        if (declineButton)
                        {
                            declineButton.addEventListener("pointerdown", () =>
                            {
                                clearTimeout(requestTimeout);
                                modal.off(closeListenerId);
                                this._connection.sendControl("pilotRequest", { "state": "declined", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                                modal.close();
                            });
                        }
                    });

                    const requestTimeout = setTimeout(() =>
                    {
                        modal.off(closeListenerId);
                        this._connection.sendControl("pilotRequest", { "state": "accepted", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                        modal.close();
                    }, this._connection.state.PILOT_REQUEST_TIMEOUT);
                    modal.show();
                }
            }
            else if (msg.state === "accepted")
            {
                if (msg.initiator && this._connection.clientId === msg.initiator)
                {
                    if (this._connection.state && this._connection.state.hasPendingPilotSeatRequest())
                    {
                        this._connection.state.acceptPilotSeatRequest();
                        notify(msg.username, "accepted your pilot seat request");
                    }
                }
            }
            else if (msg.state === "declined")
            {
                if (msg.initiator && this._connection.clientId === msg.initiator)
                {
                    if (this._connection.state && this._connection.state.hasPendingPilotSeatRequest())
                    {
                        this._connection.state.cancelPilotSeatRequest();
                        notify(msg.username, "declined your pilot seat request");
                    }
                }
            }
        });

        this._connection.on("netSelectionArea", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            msg.color = this._connection.getClientColor(msg.clientId);
            gui.emitEvent("netSelectionArea", msg);
        });

        this._connection.on("netCursorPos", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            delete msg.zoom;
            if (this._connection.client.following && msg.clientId === this._connection.client.following)
            {
                gui.emitEvent("netGotoPos", msg);
            }
            gui.emitEvent("netCursorPos", msg);
        });

        this._connection.on("netLeaveSession", (msg) =>
        {
            this.updateHtml();
        });

        this._connection.on("resyncWithPilot", (msg) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (!this._connection.client.isRemoteClient) return;
            if (this._connection.clientId !== msg.reloadClient) return;
            this._resyncPatch();
        });
    }

    sendCursorPos(x, y)
    {
        if (!this._connection.isConnected()) return;
        if (!this._connection.inMultiplayerSession) return;

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
        }, this.netMouseCursorDelay);
    }

    sendSelectionArea(x, y, sizeX, sizeY, hide = false)
    {
        if (!this._connection.isConnected()) return;
        if (!this._connection.inMultiplayerSession) return;

        if (!hide && this._mouseTimeout) return;

        let timeout = this.netMouseCursorDelay;


        this._mouseTimeout = setTimeout(() =>
        {
            const payload = { x, y, sizeX, sizeY, hide };
            this._connection.sendUi("netSelectionArea", payload);
            this._mouseTimeout = null;
        }, timeout);
    }

    updateHtml()
    {
        if (this._connection.multiplayerCapable)
        {
            document.querySelector(".nav_remote_viewer").classList.remove("hidden");
        }

        if (this._connection.state.getNumClients() < 2)
        {
            document.getElementById("multiplayerbar").style.display = "none";
            document.getElementById("multiplayer_message_nav").style.display = "none";
            gui.setRestriction(Gui.RESTRICT_MODE_FULL);
            return;
        }

        const clientList = Object.values(this._connection.clients).sort((a, b) =>
        {
            if (!a.username) a.username = "";
            if (!b.username) b.username = "";
            return a.username.localeCompare(b.username);
        });

        const data = {
            "clients": clientList,
            "multiplayerCapable": this._connection.multiplayerCapable,
            "cablesurl": CABLES.sandbox.getCablesUrl()
        };

        const html = getHandleBarHtml("sc_userlist", data);
        const userList = document.getElementById("nav-clientlist");
        userList.innerHTML = html;

        const userListItems = userList.querySelectorAll(".item");
        userListItems.forEach((ele) =>
        {
            const itemId = ele.dataset.clientId;
            if (this._connection.clients[itemId])
            {
                const cursorColorEl = ele.querySelector(".cursorcolor");
                if (cursorColorEl)
                {
                    const clientColor = this._connection.getClientColor(itemId);
                    let alpha = "0.0";
                    if (this._connection.clients[itemId].inMultiplayerSession)
                    {
                        alpha = "1.0";
                    }
                    cursorColorEl.style.backgroundColor = "rgba(" + [clientColor.rb, clientColor.gb, clientColor.bb, alpha].join(",") + ")";
                }

                if (this._connection.clients[itemId].isPilot)
                {
                    ele.classList.add("pilot");
                }
                else
                {
                    ele.classList.remove("pilot");
                }

                if (this._connection.clients[itemId].isMe)
                {
                    ele.classList.add("me");
                }
                else
                {
                    ele.classList.remove("me");
                }

                if (this._connection.followers.includes(itemId))
                {
                    ele.classList.add("follower");
                }
                else
                {
                    ele.classList.remove("follower");
                }

                if (this._connection.client.following && this._connection.client.following === ele.dataset.clientId)
                {
                    ele.classList.add("following");
                }
                else
                {
                    ele.classList.remove("following");
                }
            }

            ele.addEventListener("pointerdown", (event) =>
            {
                CABLES.contextMenu.show(
                    {
                        "items": this._getContextMenuItems(event.currentTarget.dataset.clientId)
                    }, event.currentTarget);
            });
        });

        const messageNav = document.getElementById("multiplayer_message_nav");
        const messageBox = document.getElementById("multiplayer_message");

        if (this._connection.inMultiplayerSession)
        {
            if (this._connection.client && !this._connection.client.isPilot)
            {
                messageBox.innerHTML = "you are not the pilot in this multiplayer session - changes will not be saved";
                messageNav.style.display = "block";
                messageBox.style.display = "block";

                if (this._connection.client.following)
                {
                    gui.setRestriction(Gui.RESTRICT_MODE_FOLLOWER);
                }
                else
                {
                    gui.setRestriction(Gui.RESTRICT_MODE_EXPLORER);
                }
            }
            else
            {
                messageBox.style.display = "none";
                messageNav.style.display = "none";
                gui.setRestriction(Gui.RESTRICT_MODE_FULL);
            }
        }
        else
        {
            messageBox.style.display = "none";
            messageNav.style.display = "none";
            gui.setRestriction(Gui.RESTRICT_MODE_FULL);
        }

        const startButton = userList.querySelector(".start-button");
        const joinButton = userList.querySelector(".join-button");
        const leaveButton = userList.querySelector(".leave-button");

        if (startButton)
        {
            startButton.addEventListener("pointerdown", () =>
            {
                this._connection.startMultiplayerSession();
            });
            if (this._connection.multiplayerCapable && !(this._connection.runningMultiplayerSession || this._connection.inMultiplayerSession))
            {
                startButton.classList.add("visible");
            }
            else
            {
                startButton.classList.remove("visible");
            }
        }

        if (joinButton)
        {
            joinButton.addEventListener("pointerdown", () =>
            {
                this._connection.joinMultiplayerSession();
            });
            if (this._connection.onlyRemoteClientsConnected)
            {
                joinButton.textContent = "reconnect";
            }
            else
            {
                joinButton.textContent = "join";
            }
            if (this._connection.multiplayerCapable && this._connection.runningMultiplayerSession && !this._connection.inMultiplayerSession)
            {
                joinButton.classList.add("visible");
            }
            else
            {
                joinButton.classList.remove("visible");
            }
        }

        if (leaveButton)
        {
            leaveButton.addEventListener("pointerdown", () =>
            {
                this._connection.leaveMultiplayerSession();
            });
            if (this._connection.multiplayerCapable && this._connection.inMultiplayerSession)
            {
                leaveButton.classList.add("visible");
            }
            else
            {
                leaveButton.classList.remove("visible");
            }
        }

        const moreOptions = userList.querySelector(".more-options");
        if (moreOptions)
        {
            moreOptions.addEventListener("pointerdown", (event) =>
            {
                const items = [];
                items.push({
                    "title": "open chat",
                    "iconClass": "icon icon-message",
                    "func": () => { CABLES.CMD.UI.showChat(); }
                });

                if (this._connection.inMultiplayerSession && this._connection.client.isPilot)
                {
                    items.push({
                        "title": "load last saved version",
                        "iconClass": "icon icon-refresh",
                        "func": () => { this._restoreLastSavedPatchVersion(); }
                    });
                }
                if (this._connection.inMultiplayerSession)
                {
                    if (!this._connection.client.isPilot)
                    {
                        items.push({
                            "title": "request pilot seat",
                            "iconClass": "icon icon-user",
                            "func": () =>
                            {
                                this._connection.state.requestPilotSeat();
                            }
                        });

                        items.push({
                            "title": "sync patch with pilot",
                            "iconClass": "icon icon-refresh",
                            "func": () =>
                            {
                                this._resyncPatch();
                            }
                        });
                    }
                }

                if (items.length > 0)
                {
                    CABLES.contextMenu.show({ "items": items, }, event.currentTarget);
                }
            });
        }
        document.getElementById("multiplayerbar").style.display = "block";
    }

    _jumpToCursor(client)
    {
        const guiEvent = {};
        if (client.hasOwnProperty("x"))
        {
            guiEvent.x = client.x;
        }
        if (client.hasOwnProperty("y"))
        {
            guiEvent.y = client.y;
        }
        if (client.hasOwnProperty("subpatch"))
        {
            guiEvent.subpatch = client.subpatch;
        }
        /*
        if (client.hasOwnProperty("zoom"))
        {
            guiEvent.zoom = client.zoom;
        }
         */
        if (client.hasOwnProperty("scrollX") && client.hasOwnProperty("scrollY"))
        {
            guiEvent.scrollX = client.scrollX;
            guiEvent.scrollY = client.scrollY;
        }
        if (Object.keys(guiEvent).length > 0)
        {
            gui.emitEvent("netGotoPos", guiEvent);
        }
    }

    _restoreLastSavedPatchVersion()
    {
        CABLES.sandbox.reloadLastSavedVersion((err, project) =>
        {
            this._connection.startPacoSend();
        });
    }

    _resyncPatch()
    {
        this._connection.requestPilotPatch();
    }

    _getContextMenuItems(clientId)
    {
        if (!this._connection.multiplayerCapable) return;

        const client = this._connection.clients[clientId];
        const items = [];
        if (client)
        {
            let displayName = client.username;
            items.push({ "title": displayName, "func": () => {} });

            if (!client.isRemoteClient)
            {
                if (this._connection.inMultiplayerSession)
                {
                    const multiPlayerBar = document.getElementById("multiplayerbar");
                    const ele = multiPlayerBar.querySelector("[data-client-id=\"" + clientId + "\"]");
                    if (this._connection.client.following && this._connection.client.following === clientId)
                    {
                        items.push({
                            "title": "unfollow",
                            "iconClass": "icon icon-eye-off",
                            "func": () =>
                            {
                                ele.classList.remove("following");
                                delete multiPlayerBar.dataset.multiplayerFollow;
                                this._connection.client.following = null;
                                gui.setRestriction(Gui.RESTRICT_MODE_EXPLORER);
                            }
                        });
                    }
                    else if (!client.isMe && !this._connection.client.isPilot)
                    {
                        items.push({
                            "title": "follow",
                            "iconClass": "icon icon-eye",
                            "func": () =>
                            {
                                const userList = document.getElementById("nav-clientlist");
                                const userListItems = userList.querySelectorAll(".item");
                                userListItems.forEach((item) => { return item.classList.remove("following"); });
                                ele.classList.add("following");
                                multiPlayerBar.dataset.multiplayerFollow = client.username;
                                this._connection.client.following = client.clientId;
                                this._jumpToCursor(client);
                                gui.setRestriction(Gui.RESTRICT_MODE_FOLLOWER);
                            }
                        });
                    }
                }
            }
            else
            {
                let title = "remoteviewer";
                if (client.platform)
                {
                    title = "";
                    const platform = client.platform;
                    if (platform.name)
                    {
                        title += " " + platform.name;
                    }
                    if (platform.os && platform.os.family)
                    {
                        title += " on " + platform.os.family;
                    }
                }
                items.push({
                    "title": title,
                    "iconClass": "icon icon-remoteviewer",
                    "func": () => {}
                });
                items.push({
                    "title": "send resync command",
                    "iconClass": "icon icon-refresh",
                    "func": () =>
                    {
                        this._sendForceResync(client);
                    }
                });
            }
        }
        return items;
    }

    _sendForceResync(client)
    {
        if (!this._connection.inMultiplayerSession) return;
        this._connection.sendUi("resyncWithPilot", { "reloadClient": client.clientId });
    }

    _requestResync(title, callbackBeforeSync)
    {
        let content = "<div>You should resync your patch with the pilot version to make sure everything runs with the new code.</div>";
        content += "<div style='margin-top: 20px; text-align: center;'>";
        content += "<a class=\"button accept\">Resync</a>&nbsp;&nbsp;";
        content += "<a class=\"button decline\">Ignore</a>";
        content += "</div>";

        const options = {
            "title": title,
            "html": content
        };

        const modal = new ModalDialog(options, false);
        modal.on("onShow", () =>
        {
            const modalElement = modal.getElement();
            const acceptButton = modalElement.querySelector(".button.accept");
            const declineButton = modalElement.querySelector(".button.decline");

            if (acceptButton)
            {
                acceptButton.addEventListener("pointerdown", () =>
                {
                    callbackBeforeSync(() =>
                    {
                        this._resyncPatch();
                        modal.close();
                    });
                });
            }
            if (declineButton)
            {
                declineButton.addEventListener("pointerdown", () =>
                {
                    modal.close();
                });
            }
        });
        modal.show();
    }
}
