CABLES = CABLES || {};

CABLES.UI.ScGui = class extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();

        this._connection = connection;
        this._connection.on("connectionChanged", this.updateHtml.bind(this));
        this._connection.state.on("userListChanged", this.updateHtml.bind(this));
    }

    updateHtml()
    {
        document.getElementById("navsocketinfo").innerHTML = this._getUserInfoHtml();

        if (this._connection.state.getNumClients() > 1) document.getElementById("userindicator").classList.remove("hidden");
        else document.getElementById("userindicator").classList.add("hidden");
    }

    _getUserInfoHtml()
    {
        console.log("infohtml!!!!");

        const html = CABLES.UI.getHandleBarHtml("socketinfo", {
            "numClients": this._connection.state.getNumClients(),
            "users": this._connection.state.users,
            "clients": this._connection.state.clients,
            "connected": this._connection.isConnected()
        });
        return html;
    }
};
