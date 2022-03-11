export default class Tracking
{
    constructor(gui)
    {
        this.gui = gui;
        this._initListeners();


        this._trackEvent("ui", "userIsGuest", "", { "isGuest": gui.isGuestEditor() });

        this._trackEvent("ui", "loadStartupFiles", "", { "seconds": CABLESUILOADER.uiLoadFiles / 1000 });
    }

    _initListeners()
    {
        this.gui._corePatch.on("onOpAdd", (op, fromDeserialize) =>
        {
            if (!fromDeserialize && !(op.objName.startsWith("Ops.Ui.PatchInput") || op.objName.startsWith("Ops.Ui.PatchOutput")) && !(op.uiAttribs && op.uiAttribs.fromNetwork))
            {
                // do not track patchload, multiplayer-session, subpatch and blueprint init
                this._trackEvent("ui", "opAdd", op.objName, { "shortName": op._shortOpName });
            }
        });

        this.gui.on("uiIdleEnd", (idleSeconds) =>
        {
            this._trackEvent("ui", "idleEnd", "end", { "seconds": idleSeconds });
        });

        this.gui.on("uiIdleStart", (activeSeconds) =>
        {
            this._trackEvent("ui", "activeDuration", "", { "seconds": activeSeconds });
        });

        this.gui.on("logEvent", (initiator, level, args) =>
        {
            if (!["error", "warn"].includes(level)) return;
            const perf = CABLES.UI.uiProfiler.start("logEvent");
            this._trackLogEvent("logging", level, initiator, args);
            perf.finish();
        });

        this.gui.on("coreLogEvent", (initiator, level, args) =>
        {
            if (!["error", "warn"].includes(level)) return;
            const perf = CABLES.UI.uiProfiler.start("coreLogEvent");
            this._trackLogEvent("logging", level, initiator, args);
            perf.finish();
        });

        this.gui.on("opLogEvent", (initiator, level, args) =>
        {
            if (!["error"].includes(level)) return;
            const perf = CABLES.UI.uiProfiler.start("opLogEvent");
            this._trackLogEvent("oplogging", level, initiator, args);
            perf.finish();
        });
    }

    _trackLogEvent(actionName, level, initiator, args)
    {
        const payload = {
            "initiator": initiator,
            "arguments": args
        };
        const project = this.gui.project();
        if (project) payload.projectId = project._id;
        if (CABLESUILOADER && CABLESUILOADER.talkerAPI)
        {
            CABLESUILOADER.talkerAPI.send("sendBrowserInfo", {}, (browserInfo) =>
            {
                payload.platform = browserInfo;
                this._trackEvent("ui", actionName, level, payload);
            });
        }
        else
        {
            this._trackEvent("ui", actionName, level, payload);
        }
    }

    _trackEvent(eventCategory, eventAction, eventLabel, meta = {})
    {
        if (this.gui.socket)
        {
            this.gui.socket.track(eventCategory, eventAction, eventLabel, meta);
        }
    }
}
