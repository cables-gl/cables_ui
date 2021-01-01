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


        gui.on("netOpPos", (payload) => { this._connection.sendUi("netOpPos", payload); });


        this._connection.on("netOpPos", (msg) =>
        {
            const op = gui.corePatch().getOpById(msg.opId);
            if (op)
            {
                console.log(msg);
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

        this._mouseTimeout = setTimeout(() =>
        {
            this._connection.sendUi("netCursorPos", { "x": this._lastMouseX, "y": this._lastMouseY });
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
            document.getElementById("nav-clientlist").innerHTML =
                CABLES.UI.getHandleBarHtml("socket_userlist", {
                    "numClients": this._connection.state.getNumClients(),
                    "clients": this._connection.state.clients,
                    "connected": this._connection.isConnected()
                });
        else document.getElementById("nav-clientlist").innerHTML = "";
    }

    _getUserInfoHtml()
    {
        const html = CABLES.UI.getHandleBarHtml("socketinfo", {
            "numClients": this._connection.state.getNumClients(),
            "clients": this._connection.state.clients,
            "connected": this._connection.isConnected()
        });
        return html;
    }
};
