export default class Tracking
{
    constructor(gui)
    {
        this.gui = gui;
        this._initListeners();
    }

    _initListeners()
    {
        this.gui._corePatch.on("onOpAdd", (op, fromDeserialize) =>
        {
            if (!fromDeserialize && !(op.objName.startsWith("Ops.Ui.PatchInput") || op.objName.startsWith("Ops.Ui.PatchOutput")))
            {
                // do not track patchload, subpatch and blueprint init
                this._trackEvent("ui", "opAdd", op.objName, { "shortName": op._shortOpName });
            }
        });
    }

    _trackEvent(eventCategory, eventAction, eventLabel, meta = {})
    {
        if (this.gui.socket)
        {
            this.gui.socket.track(eventCategory, eventAction, eventLabel, meta);
        }
    }
}
