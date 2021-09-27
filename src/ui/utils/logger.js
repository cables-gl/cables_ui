
export default class Logger extends CABLES.EventTarget
{
    constructor(initiator)
    {
        super();
        this._logs = [];
        this.initiator = initiator;
    }


    groupCollapsed(t)
    {
        console.groupCollapsed("[" + this.initiator + "] " + t);
    }

    table(t)
    {
        console.table(t);
    }

    groupEnd()
    {
        console.groupEnd();
    }

    error(args)
    {
        console.error("[" + this.initiator + "] ", ...arguments);
    }

    warn(args)
    {
        console.warn("[" + this.initiator + "] ", ...arguments);
    }

    log(args)
    {
        console.log("[" + this.initiator + "] ", ...arguments);

        // if (this._logs.length > 0)
        // {
        //     const lastLog = this._logs[this._logs.length - 1];
        //     let equals = true;
        //     for (const i in log)
        //     {
        //         if (lastLog[i] && lastLog[i] != log[i])
        //         {
        //             equals = false;
        //             break;
        //         }
        //     }
        //     if (equals)
        //     {
        //         lastLog.count++;
        //         return;
        //     }
        // }

        // log.count = 0;
        // this._logs.push(log);
    }

    userInteraction(text)
    {
        // this.log({ "initiator": "userinteraction", "text": text });
    }
}
