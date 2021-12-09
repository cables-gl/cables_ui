
export default class ScGui extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this._connection = connection;
        this._lastMouseX = this._lastMouseY = 0;
        this._mouseTimeout = null;

        this._followedClient = null;

        this._connection.on("connectionChanged", this.updateHtml.bind(this));
        this._connection.state.on("userListChanged", this.updateHtml.bind(this));
        this._connection.state.on("becamePilot", this.updateHtml.bind(this));
        this._connection.state.on("clientRemoved", (msg) =>
        {
            if (this._followedClient && this._followedClient.clientId == msg)
            {
                this._followedClient = null;
            }

            this._connection.sendUi("netClientRemoved", msg, true);
            gui.emitEvent("netClientRemoved", msg);
        });

        gui.patchView.on("mouseMove", (x, y) =>
        {
            this.sendCursorPos(x, y);
        });

        if (CABLES.sandbox.isDevEnv() || CABLES.sandbox._cfg.env === "nightly")
        {
            gui.on("netOpPos", (payload) =>
            {
                if (this._connection.client.isPilot)
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

            this._connection.on("netSelectionArea", (msg) =>
            {
                msg.color = this.getClientColor(msg.clientId);
                gui.emitEvent("netSelectionArea", msg);
            });
        }

        this._connection.on("netCursorPos", (msg) =>
        {
            if (this._followedClient && msg.clientId == this._followedClient.clientId)
            {
                gui.emitEvent("netGotoPos", msg);
            }
            gui.emitEvent("netCursorPos", msg);
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

        if (this._connection.state.getNumClients() > 1)
        {
            const clientList = Object.fromEntries(Object.entries(this._connection.clients).sort((a, b) => b.connectedSince - a.connectedSince));

            const data = {
                "numClients": this._connection.state.getNumClients(),
                "clients": clientList,
                "cablesurl": CABLES.sandbox.getCablesUrl(),
                "connected": this._connection.isConnected()
            };


            const messageNav = document.getElementById("multiplayer_message_nav");
            const messageBox = document.getElementById("multiplayer_message");
            if (!this._connection.synced)
            {
                messageBox.innerHTML = "waiting for pilot to send current state of patch - changes will be discarded";
                messageNav.style.display = "block";
                messageBox.style.display = "block";

                gui.patchView.patchRenderer.greyOut = true;
            }
            else if (this._connection.client && !this._connection.client.isPilot)
            {
                messageBox.innerHTML = "you are not the pilot in this multiplayer session - changes will not be saved";
                messageNav.style.display = "block";
                messageBox.style.display = "block";

                gui.patchView.patchRenderer.greyOut = true;
            }
            else
            {
                messageBox.style.display = "none";
                messageNav.style.display = "none";
                gui.patchView.patchRenderer.greyOut = false;
            }

            const html = CABLES.UI.getHandleBarHtml("socket_userlist", data);
            const userList = document.getElementById("nav-clientlist");
            userList.innerHTML = html;
            const userListItems = userList.querySelectorAll(".socket_userlist_item");
            userListItems.forEach((ele) =>
            {
                const itemId = ele.dataset.clientId;
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

                    if (this._followedClient && this._followedClient.clientId === ele.dataset.clientId)
                    {
                        ele.classList.add("following");
                    }
                    else
                    {
                        ele.classList.remove("following");
                    }
                }

                ele.addEventListener("contextmenu", (event) =>
                {
                    const client = this._connection.clients[ele.dataset.clientId];
                    if (ele.dataset.clientId !== this._connection.clientId)
                    {
                        const multiPlayerBar = document.getElementById("multiplayerbar");
                        if (this._followedClient && this._followedClient.clientId === ele.dataset.clientId)
                        {
                            this._followedClient = null;
                            ele.classList.remove("following");
                            delete multiPlayerBar.dataset.multiplayerFollow;
                            this._connection.client.following = null;
                        }
                        else
                        {
                            this._followedClient = client;
                            userListItems.forEach(item => item.classList.remove("following"));
                            ele.classList.add("following");
                            multiPlayerBar.dataset.multiplayerFollow = client.username;
                            this._connection.client.following = client.clientId;
                        }
                    }
                    else
                    {
                        if (event.ctrlKey || event.metaKey)
                        {
                            this._connection.becomePilot();
                        }
                    }

                    if (client)
                    {
                        if (client.hasOwnProperty("x") && client.hasOwnProperty("y"))
                        {
                            const guiEvent = { "x": client.x, "y": client.y };
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
                            gui.emitEvent("netGotoPos", guiEvent);
                        }
                    }
                });
            });
            document.getElementById("multiplayerbar").style.display = "block";
        }
        else
        {
            document.getElementById("multiplayerbar").style.display = "none";
            document.getElementById("multiplayer_message_nav").style.display = "none";
            gui.patchView.patchRenderer.greyOut = false;
        }
    }

    _getUserInfoHtml()
    {
        const data = {
            "numClients": this._connection.state.getNumClients(),
            "apiUrl": CABLES.sandbox.getCablesUrl(),
            "clients": this._connection.clients,
            "connected": this._connection.isConnected(),
        };
        data.ping = CABLES.api.pingTime;

        const html = CABLES.UI.getHandleBarHtml("socketinfo", data);
        return html;
    }
}
