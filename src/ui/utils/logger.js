
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
        console.error("[" + this.initiator + "]", ...arguments);
    }

    info(args)
    {
        console.error("[" + this.initiator + "]", ...arguments);
    }

    warn(args)
    {
        console.warn("[" + this.initiator + "]", ...arguments);
    }

    verbose()
    {
        if (CABLES.UI && CABLES.UI.logFilter.shouldPrint(this.initiator, ...arguments))
            console.log("[" + this.initiator + "]", ...arguments);
    }

    log(args)
    {
        if (CABLES.UI && CABLES.UI.logFilter.shouldPrint(this.initiator, ...arguments))
            console.log("[" + this.initiator + "]", ...arguments);
    }

    userInteraction(text)
    {
        // this.log({ "initiator": "userinteraction", "text": text });
    }
}
