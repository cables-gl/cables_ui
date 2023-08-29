import { getHandleBarHtml } from "../utils/handlebars";
import TreeView from "./treeview";

export default class SavedState extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._statesSaved = {};
        this._statesInitiator = {};

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


    log(initiator, section, savedState)
    {
        this._statesInitiator[section] = this._statesInitiator[section] || [];
        this._statesInitiator[section].push({ "initiator": initiator, "section": section, "savedState": savedState });

        let savedStateStr = "saved";
        if (!savedState) savedStateStr = "unsaved!";

        // console.log("[savestate]", initiator, section, savedStateStr);
    }

    setSaved(initiator, subpatch)
    {
        if (subpatch === undefined)
        {
            subpatch = this._statesSaved[this.getBlueprint() || 0] = true;
        }
        else
        {
            let subOuter = gui.patchView.getSubPatchOuterOp(subpatch);
            if (!subOuter || !subOuter.isBlueprint2())
            {
                subpatch = 0;
            }
        }
        subpatch = subpatch || 0;
        this._statesSaved[subpatch] = true;

        // console.log(this._statesSaved);

        this.log(initiator, subpatch, true);

        gui.corePatch().emitEvent("subpatchesChanged");
        this.updateUi();
    }

    setUnSaved(initiator, subpatch)
    {
        if (subpatch === undefined)
        {
            subpatch = this._statesSaved[this.getBlueprint() || 0] = true;
        }
        else
        {
            let subOuter = gui.patchView.getSubPatchOuterOp(subpatch);
            if (!subOuter || !subOuter.isBlueprint2())
            {
                subpatch = 0;
            }
        }
        if (subpatch === true)subpatch = 0;
        subpatch = subpatch || 0;
        this._statesSaved[subpatch] = false;

        this.log(initiator, subpatch, false);

        gui.corePatch().emitEvent("subpatchesChanged");
        this.updateUi();
    }

    getStateBlueprint(bp)
    {
        return this._statesSaved[bp];
    }

    updateUi()
    {
        if (this.isSaved)
        {
            CABLESUILOADER.talkerAPI.send("setIconSaved");
            ele.byId("patchname").classList.remove("warning");
            window.removeEventListener("beforeunload", this._onBeforeUnloadListener);
            ele.byId("savestates").innerHTML = "";
        }
        else
        {
            CABLESUILOADER.talkerAPI.send("setIconUnsaved");
            ele.byId("patchname").classList.add("warning");
            window.addEventListener("beforeunload", this._onBeforeUnloadListener);

            let str = "";
            for (const idx in this._statesSaved)
            {
                if (this._statesSaved[idx]) continue;
                let subname = "";
                subname = gui.patchView.getSubPatchName(idx) || "Main";
                str += "<li onclick=\"gui.patchView.setCurrentSubPatch('" + idx + "')\" class=\"warning\">Unsaved:&nbsp;" + subname + "</li>";
            }
            str += "<li class=\"divide\"></li>";
            ele.byId("savestates").innerHTML = str;
        }
    }

    get isSaved()
    {
        for (const idx in this._statesSaved)
            if (!this._statesSaved[idx]) return false;

        return true;
    }
}
