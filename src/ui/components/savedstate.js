import { getHandleBarHtml } from "../utils/handlebars";
import TreeView from "./treeview";

export default class SavedState extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._statesSaved = {};
        this._statesInitiator = {};
        this._talkerState = null;
        this._timeout = null;

        window.addEventListener("beforeunload", (event) =>
        {
            if (this.isSaved)
            {
                document.body.style.opacity = 0;
                return false;
            }

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
        });
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

    setSavedAll(initiator)
    {
        for (const sp in this._statesSaved)
        {
            this._statesSaved[sp] = true;
            this.log(initiator, sp, true);
        }

        gui.corePatch().emitEvent("subpatchesChanged");
        this.updateUi();
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


        this.log(initiator, subpatch, true);

        gui.corePatch().emitEvent("subpatchesChanged");
        this.updateUi();
    }

    setUnSaved(initiator, subpatch)
    {
        if (subpatch === undefined)
        {
            subpatch = this.getBlueprint() || 0;
            this._statesSaved[subpatch] = true;
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
        this.updateUiLater();
    }

    getStateBlueprint(bp)
    {
        return this._statesSaved[bp];
    }

    updateUiLater()
    {
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            this.updateUi();
        }, 100);
    }

    updateUi()
    {
        if (this.isSaved)
        {
            if (this._talkerState != this.isSaved) CABLESUILOADER.talkerAPI.send("setIconSaved");
            this._talkerState = this.isSaved;

            ele.byId("patchname").classList.remove("warning");
            ele.byId("savestates").innerHTML = "";
        }
        else
        {
            if (this._talkerState != this.isSaved) CABLESUILOADER.talkerAPI.send("setIconUnsaved");
            this._talkerState = this.isSaved;

            ele.byId("patchname").classList.add("warning");

            let str = "";
            for (const idx in this._statesSaved)
            {
                if (this._statesSaved[idx]) continue;
                let subname = gui.patchView.getSubPatchName(idx);

                if (!subname)
                {
                    delete this._statesSaved[idx];
                    this.updateUiLater();
                    continue;
                }
                str += "<li style=\"overflow:hidden;text-overflow:ellipsis\" onclick=\"gui.patchView.setCurrentSubPatch('" + idx + "')\" class=\"warning\">Unsaved:&nbsp;" + subname + "</li>";
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
