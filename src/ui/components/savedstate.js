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
        this._addedGuiListener = false;

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
        let changed = false;

        for (const sp in this._statesSaved)
        {
            if (this._statesSaved[sp] != true)changed = true;
            this._statesSaved[sp] = true;
            this.log(initiator, sp, true);
        }
        if (changed)gui.corePatch().emitEvent("savedStateChanged");

        gui.corePatch().emitEvent("subpatchesChanged");
        this.updateUi();
    }

    setSaved(initiator, subpatch)
    {
        if (subpatch === undefined)
        {
            // subpatch = this._statesSaved[this.getBlueprint() || 0] = true;
            subpatch = 0;// this._statesSaved[this.getBlueprint() || 0] = true;
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

        const changed = this._statesSaved[subpatch] != true;
        if (changed)gui.corePatch().emitEvent("savedStateChanged");

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
            // this._statesSaved[subpatch] = true;
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

        const changed = this._statesSaved[subpatch] != false;

        this._statesSaved[subpatch] = false;

        this.log(initiator, subpatch, false);


        if (changed)gui.corePatch().emitEvent("savedStateChanged");

        if (changed)
        {
            gui.corePatch().emitEvent("subpatchesChanged");
            this.updateUiLater();

            if (!this._addedGuiListener)
            {
                this._addedGuiListener = true;
                gui.corePatch().on("subpatchesChanged", () =>
                {
                    this.updateRestrictionDisplay();
                });
            }
        }
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
        this.updateRestrictionDisplay();
    }


    isSavedSubOp(subOpName)
    {
        for (const idx in this._statesSaved)
        {
            let subname = gui.patchView.getSubPatchName(idx);
            if (subOpName == subname) return this._statesSaved[idx] !== false;
        }
        return true;
    }

    isSavedSubPatch(subPatchId)
    {
        return this._statesSaved[subPatchId] !== false;
    }

    updateRestrictionDisplay()
    {
        const subpatch = gui.patchView.getCurrentSubPatch();
        const exposeOp = gui.patchView.getSubPatchOuterOp(subpatch);

        if (exposeOp && exposeOp.patchId)
        {
            const ops = gui.corePatch().getOpsByObjName(exposeOp.objName);
            if (ops.length > 1)
            {
                if (!this.isSavedSubOp(exposeOp.objName) && this.isSavedSubPatch(subpatch))
                {
                    if (!gui.patchView.patchRenderer.greyOut)
                    {
                        console.log("updaterestrict?!");

                        let theIdx = null;
                        for (const idx in this._statesSaved)
                        {
                            let subname = gui.patchView.getSubPatchName(idx);
                            if (exposeOp.objName == subname)
                            {
                                theIdx = idx;
                                break;
                            }
                        }

                        gui.restriction.setMessage("cablesupdate", "A different reference of this SubPatchOp was changed, continue editing &nbsp; <a class=\"button\" onclick=\"gui.patchView.setCurrentSubPatch('" + theIdx + "')\">here</a> ");
                        gui.patchView.patchRenderer.greyOut = true;
                    }
                }
            }
        }
        else
        {
            if (gui.patchView.patchRenderer.greyOut)
            {
                gui.restriction.setMessage("cablesupdate", null);
                gui.patchView.patchRenderer.greyOut = false;
            }
        }
    }

    get isSaved()
    {
        for (const idx in this._statesSaved)
            if (!this._statesSaved[idx]) return false;

        return true;
    }
}
