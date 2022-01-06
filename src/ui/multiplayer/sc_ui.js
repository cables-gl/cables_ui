import { notify, notifyError } from "../elements/notification";

export default class ScUi extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();
        this._connection = connection;
        this.notifyPingTimeout = true;
        this.notifyNetworkError = true;

        this._connection.on("onInfoMessage", (payload) =>
        {
            if (payload.name === "notify")
            {
                notify(payload.title, payload.text);
            }
        });

        this._connection.on("connectionError", (payload) =>
        {
            if (this.notifyNetworkError)
            {
                notifyError("network error", payload.message);
                this.notifyNetworkError = false;
            }
        });

        this._connection.on("onPingAnswer", (msg) =>
        {
            if (msg.clientId === this._connection.clientId)
            {
                this.notifyPingTimeout = true;
            }
        });

        this._connection.on("onPingTimeout", (payload) =>
        {
            if (this.notifyPingTimeout)
            {
                this.notifyPingTimeout = false;
                notify("network warning", "received last ping more than " + payload.seconds + " seconds ago");
            }
        });
    }
}
