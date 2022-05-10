export default class PacoConnector extends CABLES.EventTarget
{
    constructor(connection, paco)
    {
        super();
        this._connection = connection;
        this._paco = paco;
        this.initialized = false;
        this._delays = {};
        this._delays[CABLES.PACO_PORT_ANIM_UPDATED] = 500;
        this._delays[CABLES.PACO_VALUECHANGE] = 300;
        this._delays[CABLES.PACO_UIATTRIBS] = 1000;
        this._timeouts = {};
        this._lastEvent = null;
        this._lastVars = null;
    }

    send(event, vars)
    {
        if (!this._connection)
        {
            return;
        }

        if ((event === this._lastEvent) && (vars === this._lastVars)) return;
        this._lastEvent = event;
        this._lastVars = vars;

        const data = { "event": event, "vars": vars };
        if (this._delays.hasOwnProperty(event))
        {
            if (this._timeouts[event]) return;

            this._timeouts[event] = setTimeout(() =>
            {
                this._connection.sendPaco({ "data": data });
                this._timeouts[event] = null;
            }, this._delays[event]);
        }
        else
        {
            this._connection.sendPaco({ "data": data });
        }
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
