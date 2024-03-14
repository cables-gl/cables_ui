import { Events } from "cables-shared-client";
import { PatchConnectionReceiver } from "./patchconnection.js";

export default class PacoConnector extends Events
{
    constructor(connection, paco)
    {
        super();
        this._connection = connection;
        this._paco = paco;
        this.initialized = false;
        this.paused = false;
        this._delays = {};
        this._delays[CABLES.PACO_PORT_ANIM_UPDATED] = 500;
        this._delays[CABLES.PACO_VALUECHANGE] = 300;
        this._timeouts = {};
    }

    send(event, vars)
    {
        if (!this._connection || this._connection.client.isRemoteClient)
        {
            return;
        }

        if (this.paused) return;

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
            this._receiver = new PatchConnectionReceiver(
                gui.corePatch(), {}, this
            );
        }

        // wait for initial patch sync before handling other messages
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
