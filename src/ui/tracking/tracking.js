import { gui } from "../gui.js";
import { platform } from "../platform.js";

export default class Tracking
{
    constructor()
    {
        this.gui = gui;
        this._initListeners();

        this._trackEvent("ui", "userIsGuest", "", { "isGuest": gui.isGuestEditor() });

        this._trackEvent("ui", "loadStartupFiles", "", { "seconds": CABLESUILOADER.uiLoadFiles / 1000 });
    }

    _initListeners()
    {
        this.gui._corePatch.on(CABLES.Patch.EVENT_OP_ADDED, (op, fromDeserialize) =>
        {
            if (!fromDeserialize && !(op.objName.startsWith("Ops.Ui.PatchInput") || op.objName.startsWith("Ops.Ui.PatchOutput")))
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
            if (!["error"].includes(level)) return;
            const perf = gui.uiProfiler.start("logEvent");
            this._trackLogEvent("logging", level, initiator, args);
            perf.finish();
        });

        this.gui.on("uncaughtError", (report) =>
        {
            let initiator = "unknown";
            if (report.url) initiator = report.url;
            if (report.exception) initiator = report.exception.filename + ":" + report.exception.lineno;
            if (report.opName) initiator = report.opName;
            this._trackLogEvent("logging", "uncaught", initiator, report);
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
        if (platform.talkerAPI)
        {
            payload.platform = platformLib;
            this._trackEvent("ui", actionName, level, payload);
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
