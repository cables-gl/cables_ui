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
    }

    _trackEvent(eventCategory, eventAction, eventLabel, meta = {})
    {
        if (this.gui.socket)
        {
            console.log(eventCategory, eventAction, eventLabel, meta);
            this.gui.socket.track(eventCategory, eventAction, eventLabel, meta);
        }
    }
}
