import { Events } from "cables-shared-client";
import { PatchConnectionReceiver } from "./patchconnection.js";
import { gui } from "../gui.js";

export default class PacoConnector extends Events
{

    static PACO_CLEAR = 0;
    static PACO_VALUECHANGE = 1;
    static PACO_OP_DELETE = 2;
    static PACO_UNLINK = 3;
    static PACO_LINK = 4;
    static PACO_LOAD = 5;
    static PACO_OP_CREATE = 6;
    static PACO_OP_ENABLE = 7;
    static PACO_OP_DISABLE = 8;
    static PACO_UIATTRIBS = 9;
    static PACO_VARIABLES = 10;
    static PACO_TRIGGERS = 11;
    static PACO_PORT_SETVARIABLE = 12;
    static PACO_PORT_SETANIMATED = 13;
    static PACO_PORT_ANIM_UPDATED = 14;
    static PACO_DESERIALIZE = 15;
    static PACO_OP_RELOAD = 16;

    /**
     * @param {} connection
     * @param {any} paco
     */
    constructor(connection, paco)
    {
        super();
        this._connection = connection;
        this._paco = paco;
        this.initialized = false;
        this.paused = false;
        this._delays = {};
        this._delays[PacoConnector.PACO_PORT_ANIM_UPDATED] = 500;
        this._delays[PacoConnector.PACO_VALUECHANGE] = 300;
        this._timeouts = {};
    }

    send(event, vars, sendOnEmptyClientList = false)
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
                this._connection.sendPaco({ "data": data }, sendOnEmptyClientList);
                this._timeouts[event] = null;
            }, this._delays[event]);
        }
        else
        {
            this._connection.sendPaco({ "data": data }, "paco", sendOnEmptyClientList);
        }
    }

    receive(pacoMsg)
    {
        if (!this._receiver)
        {

            /** @type {PatchConnectionReceiver} */
            this._receiver = new PatchConnectionReceiver(
                gui.corePatch(), {}, this
            );
        }

        // wait for initial patch sync before handling other messages
        if (pacoMsg.event === PacoConnector.PACO_VALUECHANGE)
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
