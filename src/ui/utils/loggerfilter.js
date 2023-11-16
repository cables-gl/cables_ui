import userSettings from "../components/usersettings";

function defaultSetting(initiator)
{
    if (initiator.indexOf("Ops.User") == 0) return true;
    if (initiator.indexOf("op Ops.User") == 0) return true;
    if (initiator.indexOf("Ops.Deprecated.Cables.CustomOp") == 0) return true;
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


export default class LogFilter extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._warned = false;
        this._initiators = {};
        this._settings = JSON.parse(userSettings.get("loggingFilter")) || {};

        userSettings.on("loaded", () =>
        {
            this._settings = JSON.parse(userSettings.get("loggingFilter")) || {};
        });
    }

    get initiators()
    {
        return this._initiators;
    }

    toggleFilter()
    {

    }

    shouldPrint(initiator, txt, level)
    {
        if (!initiator)initiator = "unknown";
        if (!this._initiators[initiator])
        {
            this._initiators[initiator] = new LogInitiator(initiator);

            if (this._settings.hasOwnProperty(initiator)) this._initiators[initiator].print = this._settings[initiator];

            this.emitEvent("initiatorsChanged");
        }

        this._initiators[initiator].log(txt);

        const should = this._initiators[initiator].print;
        if (should && !this._warned)
        {
            this._warned = true;
            console.log("[logging] some console messages are not printed - [ctrl/cmd+p logging] to change logging settings");// eslint-disable-line
        }
        return should;
    }

    getTabInfo()
    {
        return this._initiators;
    }

    resetSettings()
    {
        for (let i in this._initiators)
        {
            this._initiators[i].print = defaultSetting(i);
        }
        this._settings = {};
        userSettings.set("loggingFilter", JSON.stringify(this._settings));

        this.emitEvent("initiatorsChanged");
    }

    toggleInitiator(initiator)
    {
        if (!this._settings.hasOwnProperty(initiator)) this._settings[initiator] = defaultSetting(initiator);

        this._settings[initiator] = !this._settings[initiator];

        userSettings.set("loggingFilter", JSON.stringify(this._settings));

        this._initiators[initiator].print = this._settings[initiator];
        this.emitEvent("initiatorsChanged");
    }
}
