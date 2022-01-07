import { notify } from "../elements/notification";

export default class ScUi extends CABLES.EventTarget
{
    constructor(connection)
    {
        super();
        this._connection = connection;

        this._connection.on("onInfoMessage", (payload) =>
        {
            if (payload.name === "notify")
            {
                notify(payload.title, payload.text);
            }
        });
    }
}
