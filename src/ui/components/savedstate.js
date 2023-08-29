import { getHandleBarHtml } from "../utils/handlebars";
import TreeView from "./treeview";

export default class SavedState extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._statesSaved = {};

        this._onBeforeUnloadListener = (event) =>
        {
            const message = "unsaved content!";
            if (typeof event == "undefined")
            {
                event = window.event;
            }
            if (event)
            {
                event.returnValue = message;
            }
            return message;
        };
    }

    getBlueprint()
    {
        const sub = gui.patchView.getCurrentSubPatch() || 0;
        let subOuter = 0;
        let bp = 0;

        if (sub)
        {
            subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
            if (subOuter) bp = subOuter.isBlueprint2() || subOuter.isInBlueprint2();
        }
        return bp;
    }

    setSaved()
    {
        this._statesSaved[this.getBlueprint()] = true;
        this.updateUi();
        gui.corePatch().emitEvent("subpatchesChanged");
    }

    setUnSaved()
    {
        this._statesSaved[this.getBlueprint()] = false;
        gui.corePatch().emitEvent("subpatchesChanged");

        this.updateUi();
    }

    getStateBlueprint(bp)
    {
        return this._statesSaved[bp];
    }

    updateUi()
    {
        console.log("saved:", this.isSaved, this._statesSaved);
        if (this.isSaved)
        {
            CABLESUILOADER.talkerAPI.send("setIconSaved");
            ele.byId("patchname").classList.remove("warning");
            window.removeEventListener("beforeunload", this._onBeforeUnloadListener);
        }
        else
        {
            CABLESUILOADER.talkerAPI.send("setIconUnsaved");
            ele.byId("patchname").classList.add("warning");
            window.addEventListener("beforeunload", this._onBeforeUnloadListener);
        }
    }

    get isSaved()
    {
        for (const idx in this._statesSaved)
            if (!this._statesSaved[idx]) return false;

        return true;
    }
}
