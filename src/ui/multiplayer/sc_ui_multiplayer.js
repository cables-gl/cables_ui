import { notify } from "../elements/notification";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";

export default class ScUiMultiplayer extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this._connection = connection;
        this._lastMouseX = this._lastMouseY = 0;
        this._mouseTimeout = null;

        this._connection.on("connectionChanged", this.updateHtml.bind(this));

        this._connection.state.on("userListChanged", this.updateHtml.bind(this));
        this._connection.state.on("becamePilot", this.updateHtml.bind(this));
        this._connection.state.on("pilotChanged", (pilot) =>
        {
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
        this._connection.state.on("pilotRemoved", () =>
        {
            notify("the pilot just left the session");
        });

        // this._connection.state.on("patchSynchronized", this.updateHtml.bind(this));

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
            this.sendCursorPos(x, y);
        });

        gui.on("netOpPos", (payload) =>
        {
            if (this._connection.client && this._connection.client.isPilot)
            {
                this._connection.sendUi("netOpPos", payload);
            }
        });

        gui.on("drawSelectionArea", (x, y, sizeX, sizeY) =>
        {
            this.sendSelectionArea(x, y, sizeX, sizeY);
        });

        gui.on("hideSelectionArea", (x, y, sizeX, sizeY) =>
        {
            this.sendSelectionArea(x, y, sizeX, sizeY, true);
        });

        this._connection.on("netOpPos", (msg) =>
        {
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
            if (!this._connection.multiplayerEnabled) return;

            if (msg.state === "request")
            {
                if (this._connection.client && this._connection.client.isPilot)
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
            msg.color = this.getClientColor(msg.clientId);
            gui.emitEvent("netSelectionArea", msg);
        });

        this._connection.on("netCursorPos", (msg) =>
        {
            if (this._connection.client.following && msg.clientId === this._connection.client.following)
            {
                gui.emitEvent("netGotoPos", msg);
            }
            gui.emitEvent("netCursorPos", msg);
        });

        this._connection.on("netLeaveSession", (msg) =>
        {
            gui.emitEvent("netLeaveSession", msg);
            this.updateHtml();
        });
    }

    get netMouseCursorDelay()
    {
        return 100;
    }

    sendCursorPos(x, y)
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
        }, this.netMouseCursorDelay);
    }

    sendSelectionArea(x, y, sizeX, sizeY, hide = false)
    {
        if (!this._connection.isConnected()) return;
        if (!hide && this._mouseTimeout) return;

        let timeout = this.netMouseCursorDelay;


        this._mouseTimeout = setTimeout(() =>
        {
            const payload = { x, y, sizeX, sizeY, hide };
            this._connection.sendUi("netSelectionArea", payload);
            this._mouseTimeout = null;
        }, timeout);
    }

    getClientColor(clientId)
    {
        return this._connection.state.getClientColor(clientId);
    }

    updateHtml()
    {
        document.getElementById("navsocketinfo").innerHTML = this._getUserInfoHtml();

        if (this._connection.multiplayerEnabled && this._connection.state.getNumClients() > 1)
        {
            const clientList = Object.fromEntries(Object.entries(this._connection.clients).sort((a, b) => { return b.connectedSince - a.connectedSince; }));

            const data = {
                "isActive": this._connection.state.getNumClients() > 1,
                "numClients": this._connection.state.getNumClients(),
                "clients": clientList,
                "cablesurl": CABLES.sandbox.getCablesUrl(),
                "connected": this._connection.isConnected()
            };


            const messageNav = document.getElementById("multiplayer_message_nav");
            const messageBox = document.getElementById("multiplayer_message");
            if (this._connection.client && !this._connection.client.isPilot)
            {
                messageBox.innerHTML = "you are not the pilot in this multiplayer session - changes will not be saved";
                messageNav.style.display = "block";
                messageBox.style.display = "block";

                // gui.patchView.patchRenderer._cgl.canvas.style.pointerEvents = "none";
                gui.patchView.patchRenderer.greyOut = true;
            }
            else
            {
                messageBox.style.display = "none";
                messageNav.style.display = "none";
                // gui.patchView.patchRenderer._cgl.canvas.style.pointerEvents = "all";
                gui.patchView.patchRenderer.greyOut = false;
            }

            const html = getHandleBarHtml("socket_userlist", data);
            const userList = document.getElementById("nav-clientlist");
            userList.innerHTML = html;
            const moreOptions = userList.querySelector(".socket_more_options");
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
                    if (this._connection.client && this._connection.client.isPilot)
                    {
                        items.push({
                            "title": "load last saved version",
                            "iconClass": "icon icon-refresh",
                            "func": () => { this._restoreLastSavedPatchVersion(); }
                        });
                    }
                    items.push({
                        "title": "exit multiplayer",
                        "iconClass": "icon icon-exit",
                        "func": () => { this._connection.leaveMultiplayerSession(); }
                    });
                    CABLES.contextMenu.show({ "items": items, }, event.currentTarget);
                });
            }

            const userListItems = userList.querySelectorAll(".socket_userlist_item");
            userListItems.forEach((ele) =>
            {
                const itemId = ele.dataset.clientId;
                const cursorColorEl = ele.querySelector(".cursorcolor");
                if (cursorColorEl)
                {
                    const clientColor = this.getClientColor(itemId);
                    cursorColorEl.style.backgroundColor = "rgb(" + [clientColor.rb, clientColor.gb, clientColor.bb].join(",") + ")";
                }
                if (this._connection.clients[itemId])
                {
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
            document.getElementById("multiplayerbar").style.display = "block";
        }
        else
        {
            document.getElementById("multiplayerbar").style.display = "none";
            document.getElementById("multiplayer_message_nav").style.display = "none";
            // gui.patchView.patchRenderer._cgl.canvas.style.pointerEvents = "all";
            gui.patchView.patchRenderer.greyOut = false;
        }
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
        if (client.hasOwnProperty("zoom"))
        {
            guiEvent.zoom = client.zoom;
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

    _restoreLastSavedPatchVersion()
    {
        CABLES.sandbox.reloadLastSavedVersion((err, project) =>
        {
            this._connection.startPacoSend();
        });
    }

    _getUserInfoHtml()
    {
        const data = {
            "numClients": this._connection.state.getNumClients(),
            "apiUrl": CABLES.sandbox.getCablesUrl(),
            "clients": Object.values(this._connection.clients),
            "connected": this._connection.isConnected(),
        };
        data.ping = CABLES.api.pingTime;

        const html = getHandleBarHtml("socketinfo", data, true);
        return html;
    }

    _getContextMenuItems(clientId)
    {
        const client = this._connection.clients[clientId];
        const items = [];
        if (client)
        {
            let displayName = client.username;
            items.push({ "title": displayName, "func": () => {} });

            if (!client.isRemoteClient)
            {
                if (client.isPilot && !client.isMe)
                {
                    items.push({
                        "title": "request pilot seat",
                        "iconClass": "icon icon-user",
                        "func": () =>
                        {
                            this._connection.state.requestPilotSeat();
                        }
                    });
                }

                if (client.hasOwnProperty("x") && client.hasOwnProperty("y"))
                {
                    items.push({
                        "title": "jump to cursor",
                        "iconClass": "icon icon-mouse-cursor",
                        "func": () =>
                        {
                            this._jumpToCursor(client);
                        }
                    });
                }
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
                        }
                    });
                }
                else if (!client.isMe)
                {
                    items.push({
                        "title": "follow",
                        "iconClass": "icon icon-eye",
                        "func": () =>
                        {
                            const userList = document.getElementById("nav-clientlist");
                            const userListItems = userList.querySelectorAll(".socket_userlist_item");
                            userListItems.forEach((item) => { return item.classList.remove("following"); });
                            ele.classList.add("following");
                            multiPlayerBar.dataset.multiplayerFollow = client.username;
                            this._connection.client.following = client.clientId;
                            this._jumpToCursor(client);
                        }
                    });
                }
            }
            else
            {
                let title = "remoteviewer";
                if (client.platform)
                {
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
            }
        }
        return items;
    }
}
