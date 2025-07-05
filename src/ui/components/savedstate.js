import { Events, Logger, ele } from "cables-shared-client";
import subPatchOpUtil from "../subpatchop_util.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { CmdPatch } from "../commands/cmd_patch.js";

/**
 * saved state of patch and subpatches, set orange icon if unsaved
 *
 * @export
 * @class SavedState
 * @extends {Events}
 */
export default class SavedState extends Events
{
    constructor()
    {
        super();
        this._log = new Logger("SavedState");
        this._statesSaved = {};
        this._statesInitiator = {};
        this._talkerState = null;
        this._timeout = null;
        this._addedGuiListener = false;

        window.addEventListener("beforeunload", (event) =>
        {
            if (this.isSaved)
            {
                gui.hide();
                return;
            }
            const message = "unsaved content!";
            if (typeof event == "undefined") event = window.event;
            if (event) event.returnValue = message;
            return message;
        });
    }

    pause()
    {
        this._paused = true;
    }

    resume()
    {
        this._paused = false;
    }

    getBlueprint()
    {
        const sub = gui.patchView.getCurrentSubPatch() || 0;

        let bp = 0;

        if (sub)
        {
            const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
            if (subOuter) bp = subOuter.isBlueprint2() || subOuter.isInBlueprint2();
        }
        return bp;
    }

    /**
     * @param {string} initiator
     * @param {string} section
     * @param {boolean} savedState
     */
    log(initiator, section, savedState)
    {
        this._statesInitiator[section] = this._statesInitiator[section] || [];
        this._statesInitiator[section].push({ "initiator": initiator, "section": section, "savedState": savedState });
    }

    /**
     * @param {string} initiator
     */
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

    /**
     * @param {string} initiator
     * @param {string | number} subpatch
     */
    setSaved(initiator, subpatch = 0)
    {
        if (subpatch === undefined) subpatch = 0;

        const changed = this._statesSaved[subpatch] !== true;
        if (changed) gui.corePatch().emitEvent("savedStateChanged");

        this._statesSaved[subpatch] = true;
        this.log(initiator, subpatch, true);
        gui.corePatch().emitEvent("subpatchesChanged");

        this.updateUi();
    }

    /**
     * @param {string} initiator
     * @param {string | number | boolean} [subpatch]
     */
    setUnSaved(initiator, subpatch)
    {
        if (this._paused) return;
        if (gui.isRemoteClient) return;

        if (subpatch === undefined)
            this._log.log("setUnSaved subpatch undefined", initiator, subpatch);

        if (subpatch === undefined)
        {
            subpatch = this.getBlueprint() || 0;
            // this._statesSaved[subpatch] = true;
        }
        else
        {
            let subOuter = gui.patchView.getSubPatchOuterOp(subpatch);
            if (!subOuter || !subOuter.isBlueprint2()) subpatch = 0;
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

    /**
     * @param {string|number} bp
     */
    getStateBlueprint(bp)
    {
        if (!this._statesSaved.hasOwnProperty(bp))
            this._log.log("does not have state for ", bp);

        return this._statesSaved[bp];
    }

    getUnsavedPatchSubPatchOps()
    {
        const opIds = [];
        for (let i in this._statesSaved)
        {
            if (!this._statesSaved[i])
            {
                const op = gui.patchView.getSubPatchOuterOp(i);

                if (op && op.objName.indexOf("Ops.Patch.") > -1)
                    opIds.push({ "objName": op.objName, "op": op, "opId": op.id, "subId": i });
            }
        }
        return opIds;
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
            if (this._talkerState != this.isSaved) platform.talkerAPI.send("setIconSaved");
            this._talkerState = this.isSaved;

            const elePatchName = ele.byId("patchname");

            if (elePatchName)
            {
                elePatchName.classList.remove("warning");
                ele.byId("savestates").innerHTML = "";
            }
        }
        else
        {
            if (this._talkerState != this.isSaved) platform.talkerAPI.send("setIconUnsaved");
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

                str += "<li style=\"overflow:hidden;text-overflow:ellipsis\" id=\"clickSave_" + idx + "\"  class=\"warning\">Unsaved:&nbsp;" + subname + "</li>";
            }
            str += "<li class=\"divide\"></li>";
            ele.byId("savestates").innerHTML = str;

            for (const idx in this._statesSaved)
            {
                const el = ele.byId("clickSave_" + idx);
                if (el)
                    el.addEventListener("click", () =>
                    {
                        if (idx == 0) CmdPatch.save();
                        else subPatchOpUtil.updateSubPatchOpAttachment(gui.patchView.getSubPatchOuterOp(idx), { "oldSubId": idx });
                    });

            }
        }
        this.updateRestrictionDisplay();
    }

    /**
     * @param {string} subOpName
     */
    isSavedSubOp(subOpName)
    {
        for (const idx in this._statesSaved)
        {
            let subname = gui.patchView.getSubPatchName(idx);
            if (subOpName == subname) return this._statesSaved[idx] !== false;
        }
        return true;
    }

    /**
     * @param {string|number} subPatchId
     */
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
                        this._log.log("updaterestrict?!");

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

                        gui.restriction.setMessage("cablesupdate", "A different reference of this SubPatchOp was changed, continue editing &nbsp; <a class=\"button\" onclick=\"gui.patchView.setCurrentSubPatch('" + theIdx + "', () => { gui.restriction.setMessage('cablesupdate'); })\">here</a> ");
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
