/* eslint-disable no-console */

export default class Logger extends CABLES.EventTarget
{
    constructor(initiator)
    {
        super();
        this._logs = [];
        this.initiator = initiator;
    }

    stack(t)
    {
        console.info("[" + this.initiator + "] ", t);
        console.log((new Error()).stack);
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
        if (window.gui) gui.emitEvent("logEvent", this.initiator, "error", arguments);
    }

    warn(args)
    {
        console.warn("[" + this.initiator + "]", ...arguments);
        if (window.gui) gui.emitEvent("logEvent", this.initiator, "warn", arguments);
    }


    verbose()
    {
        if (CABLES.UI && CABLES.UI.logFilter.shouldPrint(this.initiator, ...arguments))
            console.log("[" + this.initiator + "]", ...arguments);
        if (window.gui) gui.emitEvent("logEvent", this.initiator, "verbose", arguments);
    }

    log(args)
    {
        if (CABLES.UI && CABLES.UI.logFilter.shouldPrint(this.initiator, ...arguments))
            console.log("[" + this.initiator + "]", ...arguments);
        if (window.gui) gui.emitEvent("logEvent", this.initiator, "log", arguments);
    }

    info(args)
    {
        if (CABLES.UI && CABLES.UI.logFilter.shouldPrint(this.initiator, ...arguments))
            console.log("[" + this.initiator + "]", ...arguments);
        if (window.gui) gui.emitEvent("logEvent", this.initiator, "info", arguments);
    }

    userInteraction(text)
    {
        // this.log({ "initiator": "userinteraction", "text": text });
    }
}
