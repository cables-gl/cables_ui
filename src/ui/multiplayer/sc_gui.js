CABLES = CABLES || {};

CABLES.UI.ScGui = class extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this._connection = connection;
        this._lastMouseX = this._lastMouseY = 0;
        this._mouseTimeout = null;


        this._connection.on("connectionChanged", this.updateHtml.bind(this));
        this._connection.state.on("userListChanged", this.updateHtml.bind(this));
        this._connection.state.on("clientRemoved", (msg) =>
        {
            this._connection.sendUi("netClientRemoved", msg, true);
        });

        if (CABLES.sandbox.isDevEnv())
        {
            gui.on("netOpPos", (payload) => { this._connection.sendUi("netOpPos", payload); });


            this._connection.on("netOpPos", (msg) =>
            {
                const op = gui.corePatch().getOpById(msg.opId);
                if (op)
                {
                    // console.log(msg);
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
        }
    }

    get netMouseCursorDelay()
    {
        return 100;
    }

    sendCursorPos(x, y)
    {
        if (!this._connection.isConnected()) return;

        if (this._lastMouseX == x || this._lastMouseY == y) return;

        this._lastMouseX = x;
        this._lastMouseY = y;

        if (this._mouseTimeout) return;

        const subPatch = gui.patchView.getCurrentSubPatch();
        this._mouseTimeout = setTimeout(() =>
        {
            this._connection.sendUi("netCursorPos", { "x": this._lastMouseX, "y": this._lastMouseY, "subpatch": subPatch, "zoom": gui.patch().getViewBox().getZoom() });
            this._mouseTimeout = null;
        }, this.netMouseCursorDelay);
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
            const data = {
                "numClients": this._connection.state.getNumClients(),
                "clients": this._connection.state.clients,
                "cablesurl": CABLES.sandbox.getCablesUrl(),
                "connected": this._connection.isConnected()
            };

            let clientnames = "";
            for (let i in this._connection.state.clients)
            {
                clientnames += this._connection.state.clients[i].username;
            }

            if (clientnames != this._clientnames)
            {
                this._clientnames = clientnames;
                const html = CABLES.UI.getHandleBarHtml("socket_userlist", data);
                const userList = document.getElementById("nav-clientlist");
                userList.innerHTML = html;
                const userListItems = userList.querySelectorAll(".socket_userlist_item");
                userListItems.forEach((ele) =>
                {
                    ele.addEventListener("contextmenu", () =>
                    {
                        const client = this._connection.state.clients[ele.dataset.clientId];
                        gui.emitEvent("netGotoPos", { "x": client.x, "y": client.y });
                    });
                });
            }
            document.getElementById("multiplayerbar").style.display = "block";
        }
        else
        {
            // this._clientnames = "";
            document.getElementById("multiplayerbar").style.display = "none";
            // document.getElementById("nav-clientlist").innerHTML = "";
        }
    }

    _getUserInfoHtml()
    {
        const data = {
            "numClients": this._connection.state.getNumClients(),
            "apiUrl": CABLES.sandbox.getCablesUrl(),
            "clients": this._connection.state.clients,
            "connected": this._connection.isConnected(),
        };
        data.ping = CABLES.api.pingTime;

        const html = CABLES.UI.getHandleBarHtml("socketinfo", data);
        return html;
    }
};
