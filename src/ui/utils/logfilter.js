import { Events } from "cables-shared-client";

function defaultSetting(initiator = "")
{
    if (initiator == "LoadingStatus") return true;
    if (initiator == "core_port") return true;
    if (initiator == "core_op") return true;
    if (initiator.indexOf("cgl_shader") == 0) return true;
    if (initiator.indexOf("Ops.Patch") == 0) return true;
    if (initiator.indexOf("Ops.Team") == 0) return true;
    if (initiator.indexOf("Ops.User") == 0) return true;
    if (initiator.indexOf("op ") == 0) return true;
    return false;
}

class LogInitiator
{
    constructor(initator)
    {
        this.initiator = initator;
        this.count = 0;
        this.time = performance.now();
        this.logs = [];
        this.print = defaultSetting(this.initiator);
    }

    log(txt)
    {
        this.count++;
        this.time = performance.now();
        this.logs.push(txt);
    }
}


export default class LogFilter extends Events
{
    constructor()
    {
        super();
        this._warned = false;
        this._initiators = {};
        this._settings = JSON.parse(CABLES.UI.userSettings.get("loggingFilter")) || {};

        this.logs = [];

        CABLES.UI.userSettings.on("loaded", () =>
        {
            this._settings = JSON.parse(CABLES.UI.userSettings.get("loggingFilter")) || {};
        });
    }

    get initiators()
    {
        return this._initiators;
    }

    toggleFilter()
    {

    }

    shouldPrint(options)
    {
        const initiator = options.initiator;

        if (!this._initiators[initiator])
        {
            this._initiators[initiator] = new LogInitiator(initiator);

            if (this._settings.hasOwnProperty(initiator)) this._initiators[initiator].print = this._settings[initiator];

            this.emitEvent("initiatorsChanged");
        }

        let setting = this._initiators[initiator];

        if (!setting) return false;
        let should = setting.print;
        if (should && !this._warned)
        {
            this._warned = true;
            console.log("[logging] some console messages are not printed - [ctrl/cmd+p logging] to change logging settings");// eslint-disable-line
        }

        if (options.level > 0)should = true;

        return should;
    }

    filterLog(options)
    {
        let level = options.level || 0;
        let initiator = options.initiator || "unknown";

        let args = [];
        for (let i = 1; i < arguments.length; i++)
        {
            // let lines = [txt];
            // if (txt.indexOf("\n") > -1)
            // {
            //     lines = txt.split("\n");
            //     lines.push("---");
            //     console.log("split lines!!!", this.initiator, lines);
            // }

            let a = arguments[i];

            args.push(a);
        }

        const o = {};
        for (let i in options) o[i] = options[i];
        o.args = args;
        o.initiator = initiator;
        o.level = level;
        o.time = performance.now();



        this.logs.push(o);
        while (this.logs.length > 50) this.logs.splice(0, 1);

        const should = this.shouldPrint(o);

        this._initiators[initiator].log(args[0]);
        if (o.level > 1) CABLES.CMD.DEBUG.logConsole();

        this.emitEvent("logAdded");

        return should;
    }

    getTabInfo()
    {
        return this._initiators;
    }

    resetSettings()
    {
        for (let i in this._initiators)
            this._initiators[i].print = defaultSetting(i);

        this._settings = {};
        CABLES.UI.userSettings.set("loggingFilter", JSON.stringify(this._settings));

        this.emitEvent("initiatorsChanged");
    }

    toggleInitiator(initiator)
    {
        if (!this._settings.hasOwnProperty(initiator)) this._settings[initiator] = defaultSetting(initiator);

        this._settings[initiator] = !this._settings[initiator];

        CABLES.UI.userSettings.set("loggingFilter", JSON.stringify(this._settings));

        this._initiators[initiator].print = this._settings[initiator];
        this.emitEvent("initiatorsChanged");
    }
}
