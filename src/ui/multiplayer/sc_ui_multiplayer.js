import { notify } from "../elements/notification";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";
import Gui from "../gui";
import ele from "../utils/ele";

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

        this._pilotRequestTimeout = null;

        this._registerEventListeners();
    }

    updateMultiplayerBar()
    {
        if (!this._connection.isConnected())
        {
            ele.byId("multiplayerbar").style.display = "none";
            // ele.byId("multiplayer_message_nav").style.display = "none";
            return;
        }

        if (this._connection.multiplayerCapable)
        {
            document.querySelector(".nav_remote_viewer").classList.remove("hidden");
        }

        let shownClients = Object.values(this._connection.clients).filter((c) => { return c.multiplayerCapable; });
        if (this._connection.showGuestUsers) shownClients = Object.values(this._connection.clients);
        const clientList = shownClients.sort((a, b) =>
        {
            if (!a.username) a.username = "";
            if (!b.username) b.username = "";
            return a.username.localeCompare(b.username);
        });

        if (clientList.length < 2)
        {
            if (!this._connection.client.isPilot) ele.byId("multiplayerbar").style.display = "none";
            // ele.byId("multiplayer_message_nav").style.display = "none";
            gui.setRestriction(Gui.RESTRICT_MODE_FULL);
            return;
        }

        const data = {
            "clients": clientList,
            "multiplayerCapable": this._connection.multiplayerCapable,
            "showMoreOptions": true,
            "cablesurl": CABLES.sandbox.getCablesUrl()
        };

        const html = getHandleBarHtml("sc_userlist", data);
        const userList = ele.byId("nav-clientlist");
        userList.innerHTML = html;

        const userListItems = userList.querySelectorAll(".item");
        userListItems.forEach((ele) =>
        {
            const itemId = ele.dataset.clientId;
            let client = this._connection.clients[itemId];
            if (client)
            {
                const cursorColorEl = ele.querySelector(".cursorcolor");
                if (cursorColorEl)
                {
                    const clientColor = this._connection.getClientColor(itemId);
                    let alpha = "0.0";
                    if (client.inMultiplayerSession)
                    {
                        alpha = "1.0";
                    }
                    cursorColorEl.style.backgroundColor = "rgba(" + [clientColor.rb, clientColor.gb, clientColor.bb, alpha].join(",") + ")";
                }

                if (client.isPilot)
                {
                    ele.classList.add("pilot");
                }
                else
                {
                    ele.classList.remove("pilot");
                }

                if (client.isMe)
                {
                    ele.classList.add("me");
                }
                else
                {
                    ele.classList.remove("me");
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

        // const messageNav = ele.byId("multiplayer_message_nav");
        // const messageBox = ele.byId("multiplayer_message");

        if (this._connection.inMultiplayerSession)
        {
            if (this._connection.client && !this._connection.client.isPilot)
            {
                if (!this._connection.client.isRemoteClient) gui.setRestriction(Gui.RESTRICT_MODE_FOLLOWER);

                if (this._connection.client.following)
                {
                    let userName = "someone";
                    if (this._connection.clients[this._connection.client.following]) userName = this._connection.clients[this._connection.client.following].username;
                    gui.restriction.setMessage("You are following  " + userName + " in a multiplayer session - editing is restricted");
                }
                else
                {
                    gui.restriction.setMessage("You are NOT the pilot in this multiplayer session - changes will not be saved");
                }
            }
            else
            {
                gui.restriction.setMessage("You are the pilot in this multiplayer session - changes will be sent to others");
                gui.setRestriction(Gui.RESTRICT_MODE_FULL);
            }
            // messageBox.style.display = "block";
            // messageNav.style.display = "block";
        }
        else
        {
            // messageBox.style.display = "none";
            // messageNav.style.display = "none";
            gui.restriction.setMessage(null);
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
            if (this._connection.multiplayerCapable && this._connection.hasOtherMultiplayerCapableClients && !(this._connection.runningMultiplayerSession || this._connection.inMultiplayerSession))
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
                this._modalJoinMultiplayerSession();
            });
            if (this._connection.onlyRemoteClientsConnected)
            {
                joinButton.textContent = "Reconnect";
            }
            else
            {
                joinButton.textContent = "Join";
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

                if (items.length > 0)
                {
                    CABLES.contextMenu.show({ "items": items, }, event.currentTarget);
                }
            });
        }
        const mpBar = ele.byId("multiplayerbar");
        if (mpBar) mpBar.style.display = "block";
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
        this._connection.setPacoPaused(true);
        CABLES.sandbox.reloadLastSavedVersion((err, project) =>
        {
            this._connection.setPacoPaused(false);
            this._connection.sendCurrentVersion();
        });
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

            if (this._connection.inMultiplayerSession)
            {
                if (client.isPilot && this._connection.clientId !== client.clientId)
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
                            this._connection.requestPilotPatch();
                        }
                    });
                }

                if (client.isRemoteClient)
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
                    if (this._connection.client.isPilot)
                    {
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
            }
        }
        return items;
    }

    _sendForceResync(client)
    {
        if (!this._connection.inMultiplayerSession) return;
        this._connection.sendUi("resyncWithPilot", { "reloadClient": client.clientId });
    }

    _modalJoinMultiplayerSession()
    {
        if (!gui.getSavedState() && !this._connection.onlyRemoteClientsConnected)
        {
            let content = "Your unsaved changes will be lost, once you enter a multiplayer session.";
            const options = {
                "title": "Joining Multiplayer",
                "html": content,
                "warning": true,
                "choice": true
            };

            const modal = new ModalDialog(options);
            modal.on("onSubmit", () =>
            {
                this._connection.joinMultiplayerSession();
            });
        }
        else
        {
            if (this._connection.onlyRemoteClientsConnected)
            {
                this._connection.reconnectRemoteViewer();
            }
            else
            {
                this._connection.joinMultiplayerSession();
            }
        }
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
                    if (callbackBeforeSync)
                    {
                        callbackBeforeSync(() =>
                        {
                            this._connection.requestPilotPatch();
                            modal.close();
                        });
                    }
                    else
                    {
                        this._connection.requestPilotPatch();
                        modal.close();
                    }
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

    _registerEventListeners()
    {
        if (this._connection.client.isRemoteClient) return;

        this._connection.state.on("enableMultiplayer", (msg) =>
        {
            if (!msg.started)
            {
                const multiplayerBar = ele.byId("multiplayerbar");
                if (multiplayerBar) multiplayerBar.classList.add("syncing");
            }
        });
        this._connection.state.on("startPatchSync", () =>
        {
            const multiplayerBar = ele.byId("multiplayerbar");
            if (multiplayerBar) multiplayerBar.classList.add("syncing");
        });
        this._connection.state.on("patchSynchronized", () =>
        {
            const multiplayerBar = ele.byId("multiplayerbar");
            if (multiplayerBar) multiplayerBar.classList.remove("syncing");
        });
        this._connection.on("netLeaveSession", this.updateMultiplayerBar.bind(this));
        this._connection.on("connectionError", this.updateMultiplayerBar.bind(this));
        this._connection.state.on("enableMultiplayer", this.updateMultiplayerBar.bind(this));
        this._connection.state.on("userListChanged", this.updateMultiplayerBar.bind(this));
        this._connection.state.on("becamePilot", this.updateMultiplayerBar.bind(this));
        this._connection.on("connectionChanged", this.updateMultiplayerBar.bind(this));

        this._connection.on("onInfoMessage", (payload) =>
        {
            if (payload.name === "notify")
            {
                notify(payload.title, payload.text, payload.options);
            }
        });

        this._connection.state.on("clientDisconnected", (client, wasInMultiplayerSession = false) =>
        {
            if (this._connection.inMultiplayerSession && wasInMultiplayerSession)
            {
                notify(client.username + " just left the multiplayer session");
            }
        });

        this._connection.state.on("clientJoined", (client) =>
        {
            if (this._connection.inMultiplayerSession) notify(client.username + " just joined the multiplayer session");
        });

        this._connection.state.on("clientLeft", (client) =>
        {
            if (this._connection.inMultiplayerSession)
            {
                notify(client.username + " just left the multiplayer session");
            }
        });

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
                this.updateMultiplayerBar();
                notify(username + " the pilot");
            }
        });

        this._connection.state.on("clientRemoved", (msg) =>
        {
            if (this._connection.client.following && this._connection.client.following === msg.clientId)
            {
                const multiPlayerBar = ele.byId("multiplayerbar");
                if (multiPlayerBar) delete multiPlayerBar.dataset.multiplayerFollow;
                this._connection.client.following = null;
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
                    const taskName = String(this._connection.getTimestamp());
                    loadjs([CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + opName)], taskName);

                    const loadJsCallback = () =>
                    {
                        next();
                    };
                    loadjs.ready(taskName, loadJsCallback, loadJsCallback);
                });
            }
        });

        this._connection.on("onPilotRequest", (msg) =>
        {
            if (!this._connection.multiplayerCapable) return;

            if (msg.state === "request")
            {
                if (this._connection.inMultiplayerSession && this._connection.client.isPilot)
                {
                    if (!this._pilotRequestTimeout)
                    {
                        let content = "You have 20 seconds to react to this request, if you do not react, the request will be accepted<br/><br/>";
                        content += "<a class=\"button accept\">Accept</a>&nbsp;&nbsp;";
                        content += "<a class=\"button decline\">Decline</a>";

                        const options = {
                            "title": msg.username + " wants to be the pilot",
                            "html": content
                        };
                        const modal = new ModalDialog(options, false);
                        const closeListener = () =>
                        {
                            clearTimeout(this._pilotRequestTimeout);
                            this._pilotRequestTimeout = null;
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
                                    clearTimeout(this._pilotRequestTimeout);
                                    this._pilotRequestTimeout = null;
                                    modal.off(closeListenerId);
                                    this._connection.sendControl("pilotRequest", { "state": "accepted", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                                    modal.close();
                                });
                            }
                            if (declineButton)
                            {
                                declineButton.addEventListener("pointerdown", () =>
                                {
                                    clearTimeout(this._pilotRequestTimeout);
                                    this._pilotRequestTimeout = null;
                                    modal.off(closeListenerId);
                                    this._connection.sendControl("pilotRequest", { "state": "declined", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                                    modal.close();
                                });
                            }
                        });

                        this._pilotRequestTimeout = setTimeout(() =>
                        {
                            modal.off(closeListenerId);
                            this._connection.sendControl("pilotRequest", { "state": "accepted", "username": gui.user.usernameLowercase, "initiator": msg.clientId });
                            modal.close();
                        }, this._connection.state.PILOT_REQUEST_TIMEOUT);
                        modal.show();
                    }
                    else
                    {
                        // already waiting for pilot request approval/denial, deny other requests
                        this._connection.sendControl("pilotRequest", { "state": "declined", "username": gui.user.usernameLowercase, "initiator": msg.clientId, "reason": "PENDING_REQUEST" });
                    }
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
                        let reason = "declined your pilot seat request";
                        if (msg.reason && msg.reason === "PENDING_REQUEST") reason = "already has a pending pilot seat request";
                        notify(msg.username, reason);
                    }
                }
            }
        });

        this._connection.on("onChatMessage", (payload) =>
        {
            if (payload.clientId === this._connection.clientId) return;
            if (this._connection.chat && this._connection.chat.isOpen()) return;

            // remove html, cut length
            let text = payload.text;
            const el = document.createElement("div");
            el.innerHTML = text;
            text = el.textContent || el.innerText || "";
            const maxLength = 32;
            if (text.length > maxLength)
            {
                text = text.substring(0, maxLength) + "...";
            }

            notify(payload.username + " says:", text, {
                "closeable": true,
                "buttons": [
                    ["<button>Open Chat</button>", function ()
                    {
                        CABLES.CMD.UI.showChat();
                    }]
                ]
            });
        });
    }
}
