import { ele, Events } from "cables-shared-client";
import { notify } from "../elements/notification.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import ModalDialog from "../dialogs/modaldialog.js";
import Gui, { gui } from "../gui.js";
import { platform } from "../platform.js";
import { contextMenu } from "../elements/contextmenu.js";

export default class ScUiMultiplayer extends Events
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
        if (gui.unload) return;
        if (!this._connection.isConnected())
        {
            ele.byId("multiplayerbar").style.display = "none";
            return;
        }

        if (this._connection.multiplayerCapable)
        {
            const el = document.querySelector(".nav_remote_viewer");
            if (el)el.classList.remove("hidden");
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
            gui.setRestriction(Gui.RESTRICT_MODE_FULL);
            return;
        }

        const data = {
            "clients": clientList,
            "multiplayerCapable": this._connection.multiplayerCapable,
            "showMoreOptions": true,
            "cablesurl": platform.getCablesUrl()
        };

        const html = getHandleBarHtml("sc_userlist", data);
        const userList = ele.byId("nav-clientlist");
        userList.innerHTML = html;

        const userListItems = userList.querySelectorAll(".item");
        userListItems.forEach((elem) =>
        {
            const itemId = elem.dataset.clientId;
            let client = this._connection.clients[itemId];
            if (client)
            {
                if (client.isMe)
                {
                    elem.classList.add("me");
                }
                else
                {
                    elem.classList.remove("me");
                }
            }
            elem.addEventListener("pointerdown", (event) =>
            {
                contextMenu.show({ "items": this._getContextMenuItems(event.currentTarget.dataset.clientId) }, event.currentTarget);
            });
        });

        gui.restriction.setMessage(null);
        gui.setRestriction(Gui.RESTRICT_MODE_FULL);

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
                joinButton.textContent = "Remote Viewer";
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

                if (items.length > 0)
                {
                    contextMenu.show({ "items": items, }, event.currentTarget);
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
                if (client.isRemoteClient)
                {
                    let title = "remoteviewer";
                    const platformInfo = client.platform || {};
                    if (platformInfo)
                    {
                        title = "";
                        if (platformInfo.name)
                        {
                            title += " " + platformInfo.name;
                        }
                        if (platformInfo.os && platformInfo.os.family)
                        {
                            title += " on " + platformInfo.os.family;
                        }
                    }
                    const icon = platformInfo.isMobile ? "icon-smartphone" : "icon-remoteviewer";
                    items.push({
                        "title": title,
                        "iconClass": "icon " + icon,
                        "func": () => {}
                    });
                    const projectId = gui.project().shortId;
                    if (projectId && client.userid)
                    {
                        items.push({
                            "title": "Open in new window",
                            "func": () =>
                            {
                                window.open(platform.getCablesUrl() + "/remote_client/" + projectId + "?u=" + client.userid);
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

        this._connection.state.on("pilotChanged", (pilot) =>
        {
            if (!this._connection.inMultiplayerSession) return;
            if (this._connection.onlyRemoteClientsConnected) return;

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
                    // this._jumpToCursor(pilot);
                }
                this.updateMultiplayerBar();
                // notify(username + " the pilot");
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
