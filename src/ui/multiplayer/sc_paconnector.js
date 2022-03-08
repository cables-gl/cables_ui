export default class PacoConnector extends CABLES.EventTarget
{
    constructor(connection, paco)
    {
        super();
        this._connection = connection;
        this._paco = paco;
        this.initialized = false;
    }

    send(event, vars)
    {
        if (!this._connection)
        {
            return;
        }

        const data = { "event": event, "vars": vars };
        this._connection.sendPaco({ "data": data });
    }

    receive(pacoMsg)
    {
        if (!this._receiver)
        {
            this._receiver = new CABLES.PatchConnectionReceiver(
                gui.corePatch(), {}, this
            );
        }

        // wait for initial patch sync before handling other messages
        if (!this.initialized && pacoMsg.event !== 5) return;
        if (pacoMsg.event === CABLES.PACO_VALUECHANGE)
        {
            if (this._connection.state)
            {
                this._connection.emitEvent("onPortValueChanged", pacoMsg.vars);
            }
        }
        this._receiver._receive(pacoMsg);
        this.initialized = true;
    }
}
