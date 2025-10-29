import { Logger, ele, Events } from "cables-shared-client";
import { Link, Op, Patch, Port, utils } from "cables";
import { BoundingBox, Geometry, Shader } from "cables-corelibs";
import PatchSaveServer from "../api/patchserverapi.js";
import defaultOps from "../defaultops.js";
import ModalDialog from "../dialogs/modaldialog.js";
import { notify, notifyError, notifyWarn } from "../elements/notification.js";
import gluiconfig from "../glpatch/gluiconfig.js";
import { GuiText } from "../text.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import undo from "../utils/undo.js";
import opCleaner from "./cleanops.js";
import { convertPorts, getConverters } from "./converterops.js";
import SuggestionDialog from "./suggestiondialog.js";
import SuggestPortDialog from "./suggestionportdialog.js";
import Snap from "../glpatch/snap.js";
import subPatchOpUtil from "../subpatchop_util.js";
import uiconfig from "../uiconfig.js";
import namespace from "../namespaceutils.js";
import opNames from "../opnameutils.js";
import Gui, { gui } from "../gui.js";
import { platform } from "../platform.js";

import { userSettings } from "./usersettings.js";
import { PortDir, portType } from "../core_constants.js";
import GlPatch from "../glpatch/glpatch.js";
import { UiOp } from "../core_extend_op.js";
import { UiPatch } from "../core_extend_patch.js";

/**
 * manage patch view and helper functions
 *
 * @export
 * @class PatchView
 * @extends {Events}
 */
export default class PatchView extends Events
{
    constructor(corepatch)
    {
        super();

        /** @type {Patch} */
        this._p = corepatch;
        this._log = new Logger("patchview");
        this._element = null;
        this._pvRenderers = {};

        /** @type {GlPatch} */
        this._patchRenderer = null;
        // this._cachedSubpatchNames = {};
        this.isPasting = false;

        /** @type {Object} */
        this.currentOpPaste = null;

        /** @type {String} */
        this.newPatchOpPaste = null;

        this._showingNavHelperEmpty = false;
        this._lastTempOP = null;

        this.boundingRect = null;
        this.store = new PatchSaveServer(); // this should probably be somewhere else need only one storage, even when opening multiple patchviews ?
        this._initListeners();
        this._eleSubpatchNav = ele.byId("subpatch_nav");

        corepatch.on("onLink", this._portValidate.bind(this));
        corepatch.on("onUnLink", this._portValidate.bind(this));

        corepatch.on("onLink", this.refreshCurrentOpParamsByPort.bind(this));
        corepatch.on("onUnLink", this.refreshCurrentOpParamsByPort.bind(this));

        // corepatch.on("onOpAdd", this._onAddOpHistory.bind(this));
        corepatch.on(Patch.EVENT_OP_DELETED, this._onDeleteOpUndo.bind(this));

        corepatch.on(Patch.EVENT_OP_ADDED, (op) => { if (!undo.paused()) gui.savedState.setUnSaved("onOpAdd", op.getSubPatch()); });
        corepatch.on(Patch.EVENT_OP_DELETED, (op) => { if (!undo.paused()) gui.savedState.setUnSaved("onOpDelete", op.getSubPatch()); });
        corepatch.on("onLink", (p1, p2) => { if (!undo.paused()) gui.savedState.setUnSaved("onLink", p1.op.getSubPatch() || p2.op.getSubPatch()); });
        corepatch.on("onUnLink", (p1, p2) => { if (!undo.paused()) gui.savedState.setUnSaved("onUnLink", p1.op.getSubPatch() || p2.op.getSubPatch()); });
    }

    get element() { return this._element || PatchView.getElement(); }

    static getElement()
    {
        return document.querySelector("#patchviews .visible");
    }

    get patchRenderer()
    {
        return this._patchRenderer;
    }

    get rendererName()
    {
        return this._patchRenderer.name;
    }

    // _onAddOpHistory(op, fromDeserialize)
    // {
    //     if (this._showingNavHelperEmpty)
    //     {
    //         this._showingNavHelperEmpty = false;
    //         ele.hide(ele.byId("patchnavhelperEmpty"));
    //     }

    //     if (!fromDeserialize)
    //     {
    //         if (!op.uiAttribs) op.uiAttribs = {};
    //         if (!op.uiAttribs.history) op.uiAttribs.history = {};
    //         op.uiAttribs.history.createdAt = Date.now();
    //         op.uiAttribs.history.createdBy = {
    //             "name": gui.user.usernameLowercase
    //         };
    //         op.uiAttribs.history.lastInteractionAt = Date.now();
    //         op.uiAttribs.history.lastInteractionBy = {
    //             "name": gui.user.usernameLowercase
    //         };
    //     }
    // }

    /**
     * @param {String} subPatchId
     */
    focusSubpatchOp(subPatchId)
    {
        const outerOp = gui.corePatch().getSubPatchOuterOp(subPatchId);
        gui.patchView.setCurrentSubPatch(outerOp.uiAttribs.subPatch, () =>
        {
            gui.patchView.centerSelectOp(outerOp.id);
        });

    }

    /**
     * @param {String} subPatchId
     */
    clickSubPatchNav(subPatchId)
    {
        gui.patchView.setCurrentSubPatch(subPatchId, () =>
        {
            gui.patchParamPanel.show(true);
            this.focus();
        });
    }

    /**
     * @param {Op} op
     */
    _onDeleteOpUndo(op)
    {
        this.checkPatchErrorsSoon();

        (function (opname, _opid)
        {
            const oldValues = {};
            for (let i = 0; i < op.portsIn.length; i++)
            {
                oldValues[op.portsIn[i].name] = op.portsIn[i].get();
                if (op.portsIn[i].anim) oldValues[op.portsIn[i].name + "_anim"] = op.portsIn[i].anim.getSerialized();
            }

            undo.add({
                "title": "delete op",
                "context": {
                    "opname": opname
                },
                undo()
                {
                    const newop = gui.corePatch().addOp(opname, op.uiAttribs, _opid);
                    if (newop)
                    {
                        for (const i in oldValues)
                        {
                            const port = newop.getPortByName(i);
                            if (port)
                            {
                                port.set(oldValues[i]);
                                gui.emitEvent("portValueEdited", newop, port, oldValues[i]);
                                if (oldValues[i + "_anim"])
                                {
                                    port.setAnimated(true);
                                    port.anim.deserialize(oldValues[i + "_anim"]);

                                }
                            }
                        }
                    }
                },
                redo()
                {
                    gui.corePatch().deleteOp(_opid, false);
                }
            });
        }(op.objName, op.id));
    }

    setProject(proj, cb)
    {

        if (!this._patchRenderer)
        {
            this._log.error("no patchrenderer...");
            cb();
            return;
        }

        const perf = gui.uiProfiler.start("[patchview] setproject");
        this._p.logStartup("gui set project");

        if (proj && proj.ui)
        {
            this.store.setProject(proj);

            if (proj.ui.renderer)
            {
                if (proj.ui.renderer.w * proj.ui.renderer.s > document.body.clientWidth * 0.9 || proj.ui.renderer.h * proj.ui.renderer.s > document.body.clientHeight * 0.9)
                {
                    proj.ui.renderer.w = 640;
                    proj.ui.renderer.h = 360;
                }

                gui.rendererWidth = proj.ui.renderer.w;
                gui.rendererHeight = proj.ui.renderer.h;
                gui.corePatch().cgl.canvasScale = proj.ui.renderer.s || 1;
                gui.setLayout();
            }

            // gui.setTimeLineLength(proj.ui.timeLineLength);
        }

        gui.setProject(proj);

        this._patchRenderer.setProject(proj);

        this.store.setServerDate(proj.updated);

        if (gui.isRemoteClient)
        {
            if (cb) cb();
            return;
        }

        perf.finish();

        this._p.logStartup("loadProjectDependencies...");
        gui.serverOps.loadProjectDependencies(proj, (project) =>
        {
            this._p.logStartup("loadProjectDependencies done");
            this._p.logStartup("deserialize...");

            const perf3 = gui.uiProfiler.start("[core] deserialize");
            gui.corePatch().deSerialize(project);
            perf3.finish();

            const perf2 = gui.uiProfiler.start("[patchview] setproject2");

            this._p.logStartup("deserialize done");

            undo.clear();

            const ops = gui.corePatch().ops;
            if (!gui.isRemoteClient)
            {
                for (let i = 0; i < ops.length; i++)
                    if (ops[i].uiAttribs.selected) this.selectOpId(ops[i].id);

                if (!this._showingNavHelperEmpty && gui.corePatch().ops.length == 0)
                {
                    this._showingNavHelperEmpty = true;
                    ele.show(ele.byId("patchnavhelperEmpty"));
                }
            }

            gui.patchView.checkPatchOutdated();

            if (gui.project() && gui.project().ui) gui.metaTexturePreviewer.deserialize(gui.project().ui.texPreview);

            gui.patchView.removeLostSubpatches();

            perf2.finish();

            if (cb) cb();
        });
    }

    _initListeners()
    {

    }

    /**
     * @param {String} id
     */
    switch(id)
    {
        const views = ele.byId("patchviews");

        for (let i = 0; i < views.children.length; i++)
        {
            views.children[i].style.display = "none";
            views.children[i].classList.remove("visible");
        }

        const el = document.getElementById(id);
        el.classList.add("visible");
        el.style.display = "block";

        this._patchRenderer = this._pvRenderers[id];
        gui.setLayout();
    }

    updateBoundingRect()
    {
        const el = PatchView.getElement();
        if (el) this.boundingRect = el.getBoundingClientRect();
    }

    /**
     * @returns {Boolean}
     */
    hasFocus()
    {
        return this._patchRenderer.isFocused();
    }

    /**
     * @param {UiOp} op
     */
    testCollision(op)
    {
        if (userSettings.get("checkOpCollisions") === false) return;

        if (!op || !op.uiAttribs) return;
        let count = 0;
        let collided = {};
        for (let j = 0; j < gui.corePatch().ops.length; j++)
        {
            const b = gui.corePatch().ops[j];
            if (!b || !b.uiAttribs || b.deleted || b == op) continue;
            if (b.uiAttribs.subPatch != op.uiAttribs.subPatch) continue;
            if (!b.uiAttribs.translate) continue;
            if (!op.uiAttribs.translate) continue;
            if (collided[b.id]) continue;

            const glopA = this._patchRenderer.getGlOp(op);
            const glopB = this._patchRenderer.getGlOp(b);

            if (!glopA || !glopB) return;

            let found = true;

            if (!op.uiAttribs.resizable && !b.uiAttribs.resizable)
                while (found)
                {
                    found = false;
                    if (
                        (
                            glopA.x >= glopB.x && glopA.x <= glopB.x + glopB.w &&
                            glopA.y >= glopB.y && glopA.y <= glopB.y + glopB.h
                        )
                        ||
                        (
                            glopA.x + glopA.w >= glopB.x && glopA.x + glopA.w <= glopB.x + glopB.w &&
                            glopA.y + glopA.h >= glopB.y && glopA.y + glopA.h <= glopB.y + glopB.h
                        )
                        ||
                        (
                            glopA.x >= glopB.x && glopA.x <= glopB.x + glopB.w &&
                            glopA.y + glopA.h >= glopB.y && glopA.y + glopA.h <= glopB.y + glopB.h
                        )
                        ||
                        (
                            glopA.x + glopA.w >= glopB.x && glopA.x + glopA.w <= glopB.x + glopB.w &&
                            glopA.y >= glopB.y && glopA.y <= glopB.y + glopB.h
                        )
                    )
                    {
                        let mulDirY = 1;
                        if (op.isLinkedOut() && !op.isLinkedIn()) mulDirY = -1; // move upwards
                        let y = Snap.snapOpPosY(b.uiAttribs.translate.y + mulDirY * (uiconfig.snapY / 2 + glopB.h));
                        let x = op.uiAttribs.translate.x;

                        const link = op.isConnectedTo(b);
                        if (link)
                        {
                            let p = link.portIn;
                            if (link.portOut.op == op) p = link.portOut;
                            const otherPort = link.getOtherPort(p);
                            x = otherPort.op.uiAttribs.translate.x + otherPort.op.getPortPosX(otherPort.name);
                        }

                        op.setUiAttrib({ "translate": { "x": x, "y": y } });

                        gui.patchView.testCollision(op);

                        found = true;
                        count++;
                        collided[b.id] = true;
                        collided[op.id] = true;
                    }

                    if (count > 100)
                    {
                        this._log.log("count 100");
                        return;
                    }
                }
        }
    }

    focus()
    {
        if (this._patchRenderer.focus) this._patchRenderer.focus();
    }

    clearPatch()
    {
        this._patchRenderer.dispose();
        this._p.clear();
    }

    setPatchRenderer(id, pr)
    {
        this._pvRenderers[id] = pr;
        if (!this._patchRenderer) this._patchRenderer = pr;
    }

    addAssetOpAuto(filename, event)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

        const ops = opNames.getOpsForFilename(filename);

        if (ops.length == 0)
        {
            notify("No default op for filetype");
            return;
        }

        const opname = ops[0];
        const uiAttr = { "subPatch": this.getCurrentSubPatch() };

        let coordArr = this._patchRenderer.screenToPatchCoord(150, 150);

        if (event && this._patchRenderer.screenToPatchCoord)
        {
            coordArr = this._patchRenderer.screenToPatchCoord(event.clientX || event.x, event.clientY || event.y);
        }

        const coord = { "x": coordArr[0], "y": coordArr[1] };
        coord.x = Snap.snapOpPosX(coord.x);
        coord.y = Snap.snapOpPosY(coord.y);
        uiAttr.translate = { "x": coord.x, "y": coord.y };

        gui.serverOps.loadOpDependencies(opname, () =>
        {
            const op = gui.corePatch().addOp(opname, uiAttr);

            for (let i = 0; i < op.portsIn.length; i++)
                if (op.portsIn[i].uiAttribs.display == "file")
                    op.portsIn[i].set(filename);

            op.refreshParams();
            this.centerSelectOp(op.opId);
        });
    }

    addOp(opname, options)
    {
        gui.jobs().start({ "id": "loadOpDependencies" });
        gui.serverOps.loadOpDependencies(opname, () =>
        {
            gui.jobs().finish("loadOpDependencies");

            options = options || {};
            const uiAttribs = options.uiAttribs || {};

            if (options.subPatch) uiAttribs.subPatch = options.subPatch;
            if (options.createdLocally) uiAttribs.createdLocally = true;

            if (!uiAttribs.subPatch)
            {
                uiAttribs.subPatch = this.getCurrentSubPatch();
            }

            const op = this._p.addOp(opname, uiAttribs);

            if (!op) return;

            if (this._showingNavHelperEmpty)
            {
                document.getElementById("patchnavhelperEmpty").style.display = "none";
            }

            // todo options:
            // - putIntoLink
            // ...?
            // positioning ?

            if (options.linkNewOpToPort)
            {
                const foundPort = op.findFittingPort(options.linkNewOpToPort);
                if (foundPort)
                {
                    if (op.objName == defaultOps.defaultOpNames.number)
                    {
                        const oldValue = options.linkNewOpToPort.get();
                        op.getPort("value").set(oldValue);
                        op.setTitle(options.linkNewOpToPort.getName());
                    }
                    if (op.objName == defaultOps.defaultOpNames.string)
                    {
                        const oldValue = options.linkNewOpToPort.get();
                        op.getPort("value").set(oldValue);
                        op.setTitle(options.linkNewOpToPort.getName());
                    }

                    gui.corePatch().link(
                        options.linkNewOpToOp,
                        options.linkNewOpToPort.getName(),
                        op,
                        foundPort.getName());
                }
            }
            if (options.linkNewLink)
            {
                let op1 = null;
                let op2 = null;
                let port1 = null;
                let port2 = null;

                if (options.linkNewLink.p1)
                {
                    // patch_link
                    op1 = options.linkNewLink.p1.op;
                    op2 = options.linkNewLink.p2.op;
                    port1 = options.linkNewLink.p1.thePort;
                    port2 = options.linkNewLink.p2.thePort;
                }
                else
                {
                    // core link
                    op2 = options.linkNewLink.portIn.op;
                    op1 = options.linkNewLink.portOut.op;
                    port2 = options.linkNewLink.portIn;
                    port1 = options.linkNewLink.portOut;
                }

                const foundPort1 = op.findFittingPort(port1);
                const foundPort2 = op.findFittingPort(port2);

                if (foundPort2 && foundPort1)
                {
                    for (const il in port1.links)
                    {
                        if (
                            (port1.links[il].portIn == port1 && port1.links[il].portOut == port2) ||
                            (port1.links[il].portOut == port1 && port1.links[il].portIn == port2)) port1.links[il].remove();
                    }

                    gui.corePatch().link(
                        op,
                        foundPort1.getName(),
                        op1,
                        port1.getName()
                    );

                    gui.corePatch().link(
                        op,
                        foundPort2.getName(),
                        op2,
                        port2.getName()
                    );
                }
            }

            if (options.onOpAdd) options.onOpAdd(op);
        });
    }

    addOpAndLink(opname, opid, portname, cb)
    {
        const oldOp = gui.corePatch().getOpById(opid);
        const trans = {
            "x": oldOp.uiAttribs.translate.x,
            "y": oldOp.uiAttribs.translate.y - gluiconfig.newOpDistanceY
        };

        gui.patchView.addOp(opname, {
            "onOpAdd": (newOp) =>
            {
                let newPort = newOp.getFirstOutPortByType(oldOp.getPortByName(portname).type);
                if (oldOp.getPortByName(portname).direction == PortDir.out)
                    newPort = newOp.getFirstInPortByType(oldOp.getPortByName(portname).type);

                gui.corePatch().link(oldOp, portname, newOp, newPort.name);

                newOp.setUiAttrib({
                    "translate": trans,
                    "subPatch": this.getCurrentSubPatch()
                });

                this.testCollision(newOp);
                if (cb) cb(newOp);
            }
        });
    }

    showSelectedOpsPanel()
    {
        const ops = this.getSelectedOps();
        const numops = ops.length;

        if (numops > 0)
        {
            let mulSubs = false;

            for (let i = 0; i < ops.length; i++) if (ops[i].uiAttribs.subPatch != ops[0].uiAttribs.subPatch) { mulSubs = true; break; }

            const html = getHandleBarHtml(
                "params_ops", {
                    "isDevEnv": platform.isDevEnv(),
                    "config": platform.cfg,
                    "showDevInfos": userSettings.get("devinfos"),
                    "bounds": this.getSelectionBounds(),
                    "numOps": numops,
                    "mulSubs": mulSubs,
                    "commentColors": uiconfig.commentColors
                });

            gui.opParams.clear();

            ele.byId(gui.getParamPanelEleId()).innerHTML = html;
            gui.setTransformGizmo(null);
            gui.showInfo(GuiText.patchSelectedMultiOps);
        }
        else
        {
            this.showDefaultPanel();
        }
    }

    showDefaultPanel()
    {
        gui.setTransformGizmo(null);
        gui.opParams.clear();
        gui.patchParamPanel.show();
    }

    selectAllOpsSubPatch(subPatch, noUnselect)
    {
        const ops = gui.corePatch().getSubPatchOps(subPatch);
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            if (op)
            {
                if ((op.uiAttribs.subPatch || 0) == subPatch && !op.uiAttribs.selected)
                {
                    op.uiAttr({ "selected": true });

                    // if (op.isSubPatchOp())
                    // this.selectAllOpsSubPatch(op.patchId.get(), true);
                }
                else if (!noUnselect) op.uiAttr({ "selected": false });
            }
        }

        this.showSelectedOpsPanel();
    }

    /**
     * @param {boolean} [setUiError]
     */
    checkPatchOutdated(setUiError)
    {
        const perf = gui.uiProfiler.start("checkpatcherrors");
        this.hasOldOps = false;

        for (let i = 0; i < this._p.ops.length; i++)
        {
            const doc = gui.opDocs.getOpDocByName(this._p.ops[i].objName);
            if (setUiError) this._p.ops[i].setUiError("outdated", null);

            if ((doc && doc.oldVersion) || namespace.isDeprecatedOp(this._p.ops[i].objName))
            {
                this.hasOldOps = true;
                perf.finish();
                if (setUiError) this._p.ops[i].setUiError("outdated", "outdated");
                else return;
            }
        }
        perf.finish();
    }

    checkPatchErrorsSoon()
    {
        setTimeout(() =>
        {
            clearTimeout(this._checkErrorTimeout);
            this.checkPatchOutdated();
            this.checkPatchErrors();
        }, 500);
    }

    checkPatchErrors()
    {
        if (gui.unload) return;
        const perf = gui.uiProfiler.start("checkpatcherrors");
        const hadErrors = this.hasUiErrors;
        this.hasUiErrors = false;

        const patchSummary = gui.getPatchSummary();
        let isExamplePatch = false;
        if (patchSummary)
            isExamplePatch = patchSummary.isBasicExample || (patchSummary.exampleForOps && patchSummary.exampleForOps.length > 0);

        if (!this._checkErrorTimeout)
        {
            gui.patchView.checkPatchOutdated(isExamplePatch); // first time also check outdated ops..
            if (isExamplePatch) CABLES.CMD.PATCH.clearOpTitles(); // examples should not have edited op titles...
        }

        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.uierrors)
                for (let j = 0; j < ops[i].uiAttribs.uierrors.length; j++)
                    if (ops[i].uiAttribs.uierrors[j].level == 2)
                    {
                        this.hasUiErrors = true;
                        break;
                    }

        if (hadErrors != this.hasUiErrors)
            gui.corePatch().emitEvent("warningErrorIconChange");

        let showAttentionIcon = this.hasUiErrors;

        if (this.hasOldOps && (patchSummary && patchSummary.isBasicExample || isExamplePatch)) showAttentionIcon = true;

        clearTimeout(this._checkErrorTimeout);

        const elError = ele.byId("nav-item-error");

        const wasHidden = elError.classList.contains("hidden");
        if (showAttentionIcon) ele.show(elError);
        else ele.hide(elError);

        const elIcon = ele.byId("nav-item-error-icon");
        if (showAttentionIcon) elIcon.style["background-color"] = "red";

        if (wasHidden != elError.classList.contains("hidden")) gui.setLayout();

        perf.finish();
        this._checkErrorTimeout = setTimeout(this.checkPatchErrors.bind(this), 5000);
    }

    centerSubPatchBounds(subPatch)
    {
        const bounds = this.getSubPatchBounds(subPatch);
        const ops = this._p.ops;
        let count = 0;

        for (let j = 0; j < ops.length; j++)
            if (ops[j].uiAttribs.subPatch == subPatch && ops[j].uiAttribs && ops[j].uiAttribs.translate)
            {
                count++;
                ops[j].setPos(
                    ops[j].uiAttribs.translate.x - bounds.minX - bounds.size[0] / 2,
                    ops[j].uiAttribs.translate.y - bounds.minY - bounds.size[1] / 2
                );
            }
    }

    getSubPatchBounds(subPatchId)
    {
        if (subPatchId == undefined) subPatchId = this.getCurrentSubPatch();
        const perf = gui.uiProfiler.start("patch.getSubPatchBounds");
        const ops = this._p.ops;
        const theOps = [];

        for (let j = 0; j < ops.length; j++)
            if (ops[j].uiAttribs.subPatch == subPatchId)
                // if (ops[j].objName.indexOf("Ops.Ui.") == -1 && ops[j].objName.indexOf("Ops.Dev.Ui.") == -1)
                if (ops[j].objName != defaultOps.defaultOpNames.subPatchInput2 && ops[j].objName != defaultOps.defaultOpNames.subPatchOutput2)
                    theOps.push(ops[j]);

        let bounds = this.getOpBounds(theOps);

        perf.finish();

        return bounds;
    }

    getOpBounds(ops, options = {})
    {
        if (options.minWidth == undefined) options.minWidth = 100;

        const bb = new BoundingBox();

        for (let j = 0; j < ops.length; j++)
        {
            if (ops[j].uiAttribs && ops[j].uiAttribs.translate)
            {
                bb.applyPos(ops[j].uiAttribs.translate.x, ops[j].uiAttribs.translate.y, 0);

                const glop = this.patchRenderer.getGlOp(ops[j]);
                if (glop) bb.applyPos(ops[j].uiAttribs.translate.x + glop.w, ops[j].uiAttribs.translate.y + glop.h, 0);
                else bb.applyPos(ops[j].uiAttribs.translate.x + gluiconfig.opWidth, ops[j].uiAttribs.translate.y + gluiconfig.opHeight, 0);
            }
        }

        bb.calcCenterSize();
        return bb;
    }

    getSelectionBounds(minWidth)
    {
        const ops = this.getSelectedOps();
        return this.getOpBounds(ops, { "minWidth": minWidth });
    }

    getDistScore(primAxis, secAxis, primAxisB, secAxisB)
    {
        let score = 0;

        if (primAxis != primAxisB)
            score = Math.abs(primAxis - primAxisB);

        if (secAxis != secAxisB)
            score += (Math.abs(secAxis - secAxisB)) * 2;

        return score;
    }

    getClosestOp()
    {
        let coordArr = this._patchRenderer.screenToPatchCoord(150, 150);
        let minDist = 999999;
        let foundOp = null;
        const cursub = this.getCurrentSubPatch();

        for (let i = 0; i < this._p.ops.length; i++)
        {
            if (this._p.ops[i].getSubPatch() == cursub && this._p.ops[i].uiAttribs.translate)
            {

                const a = this.getDistScore(this._p.ops[i].uiAttribs.translate.x, this._p.ops[i].uiAttribs.translate.y, coordArr[0], coordArr[1]);

                if (a < minDist)
                {
                    minDist = a;
                    foundOp = this._p.ops[i];
                }
            }
        }

        return foundOp;
    }

    cursorNavOps(x, y)
    {
        const ops = this.getSelectedOps();
        let curOp;
        if (ops.length == 0) curOp = this.getClosestOp();
        else curOp = ops[0];

        if (!curOp) return;

        const cursub = this.getCurrentSubPatch();

        let foundOp = null;
        let foundOpScore = 9999999;

        for (let i = 0; i < this._p.ops.length; i++)
        {
            const op = this._p.ops[i];
            if (op.getSubPatch() == cursub && op.uiAttribs.translate)
            {
                if (y == 1 && op.uiAttribs.translate.y > curOp.uiAttribs.translate.y)
                {
                    const score = this.getDistScore(curOp.uiAttribs.translate.y, curOp.uiAttribs.translate.x, op.uiAttribs.translate.y, op.uiAttribs.translate.x);
                    // this._log.log("  score", op.name, score);
                    if (score < foundOpScore)
                    {
                        foundOp = op;
                        foundOpScore = score;
                    }
                }
                else
                if (y == -1 && op.uiAttribs.translate.y < curOp.uiAttribs.translate.y)
                {
                    const score = this.getDistScore(curOp.uiAttribs.translate.y, curOp.uiAttribs.translate.x, op.uiAttribs.translate.y, op.uiAttribs.translate.x);
                    // this._log.log("  score", op.name, score);
                    if (score < foundOpScore)
                    {
                        foundOp = op;
                        foundOpScore = score;
                    }
                }
                else
                if (x == 1 && op.uiAttribs.translate.x > curOp.uiAttribs.translate.x)
                {
                    const score = this.getDistScore(curOp.uiAttribs.translate.x, curOp.uiAttribs.translate.y, op.uiAttribs.translate.x, op.uiAttribs.translate.y);
                    // this._log.log("  score", op.name, score);
                    if (score < foundOpScore)
                    {
                        foundOp = op;
                        foundOpScore = score;
                    }
                }
                else
                if (x == -1 && op.uiAttribs.translate.x < curOp.uiAttribs.translate.x)
                {
                    const score = this.getDistScore(curOp.uiAttribs.translate.x, curOp.uiAttribs.translate.y, op.uiAttribs.translate.x, op.uiAttribs.translate.y);
                    // this._log.log("  score", op.name, score);
                    if (score < foundOpScore)
                    {
                        foundOp = op;
                        foundOpScore = score;
                    }
                }
            }
        }

        if (foundOp)
        {
            this.setSelectedOpById(foundOp.id);
            this.focusOp(foundOp.id);
        }
    }

    getSelectedOpsIds()
    {
        const perf = gui.uiProfiler.start("patchview getSelectedOpsIds");
        const ops = [];

        for (let i = 0; i < this._p.ops.length; i++)
            if (this._p.ops[i].uiAttribs.selected)
                ops.push(this._p.ops[i].id);

        perf.finish();

        return ops;
    }

    /**
     * @returns {Array<UiOp>}
     */
    getSelectedOps()
    {
        const perf = gui.uiProfiler.start("patchview getSelectedOps");
        const ops = [];

        for (let i = 0; i < this._p.ops.length; i++)
            if (this._p.ops[i] && this._p.ops[i].uiAttribs && this._p.ops[i].uiAttribs.selected)
                ops.push(this._p.ops[i]);

        perf.finish();

        return ops;
    }

    /** @param {boolean} [firstOnly] */
    unlinkSelectedOps(firstOnly)
    {
        const undoGroup = undo.startGroup();
        const ops = this.getSelectedOps();
        if (firstOnly)
        {
            for (const i in ops)
            {
                if (ops[i].portsIn.length > 0 && ops[i].portsOut.length > 0)
                {
                    let portIn = ops[i].getFirstPortIn();
                    let portOut = ops[i].getFirstPortOut();

                    if (portOut.type == portIn.type && (portOut.isLinked() || portIn.isLinked()))
                    {
                        let outerIn = [];
                        let outerOut = [];
                        let relink = portOut.isLinked() && portIn.isLinked();

                        if (relink)
                        {
                            for (let o = 0; o < portIn.links.length; o++)
                                outerOut.push(portIn.links[o].getOtherPort(portIn));

                            for (let o = 0; o < portOut.links.length; o++)
                                outerIn.push(portOut.links[o].getOtherPort(portOut));
                        }

                        portOut.removeLinks();
                        portIn.removeLinks();

                        if (relink)
                        {
                            for (let j = 0; j < outerIn.length; j++)
                                for (let o = 0; o < outerOut.length; o++)
                                    ops[i].patch.link(outerIn[j].op, outerIn[j].getName(), outerOut[o].op, outerOut[o].getName());
                        }
                    }
                }
            }
        }
        else
        {
            for (const i in ops) ops[i].unLinkReconnectOthers();
        }
        undo.endGroup(undoGroup, "Unlink selected Ops");
    }

    deleteSelectedOps()
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

        const undoGroup = undo.startGroup();
        const ids = [];
        const ops = this.getSelectedOps();

        for (let i = 0; i < ops.length; i++) ids.push(ops[i].id);
        for (let i = 0; i < ids.length; i++) this._p.deleteOp(ids[i], true);

        undo.endGroup(undoGroup, "Delete selected ops");
    }

    createAreaFromSelection()
    {
        // const selectedOus = this.getSelectedOps();
        const bounds = this.getSelectionBounds();
        const padding = 80;
        const trans = {
            "x": Snap.snapOpPosX(bounds.minX - 0.8 * padding),
            "y": Snap.snapOpPosY(bounds.minY - 1.2 * padding)
        };

        const areaOp = this._p.addOp(defaultOps.defaultOpNames.uiArea, {
            "translate": trans,
            "subPatch": this.getCurrentSubPatch(),
            "area": {
                "w": Snap.snapOpPosX(bounds.maxX - bounds.minX + (2.75 * padding)),
                "h": Snap.snapOpPosY(bounds.maxY - bounds.minY + (2 * padding))
            }
        });

        (function (opid)
        {
            undo.add({
                "title": "paste op",
                undo()
                {
                    gui.corePatch().deleteOp(opid, true);
                },
                redo()
                {
                    gui.corePatch().addOp(defaultOps.defaultOpNames.uiArea, {
                        "translate": trans,
                        "area": {
                            "w": Snap.snapOpPosX(bounds.maxX - bounds.minX + (2.75 * padding)),
                            "h": Snap.snapOpPosY(bounds.maxY - bounds.minY + (2.2 * padding))
                        }
                    });
                }
            });
        }(areaOp.id));
    }

    createSubPatchFromSelection(version = 0, next = null, options = {})
    {
        let opname = defaultOps.defaultOpNames.subPatch;
        if (version == 2) opname = defaultOps.defaultOpNames.subPatch2;

        const selectedOps = this.getSelectedOps();

        gui.serverOps.loadOpDependencies(opname,
            () =>
            {
                const bounds = this.getSelectionBounds();
                let trans = {
                    "x": bounds.minX + (bounds.maxX - bounds.minX) / 2,
                    "y": bounds.minY
                };

                if (options.translate) trans = options.translate;

                // opname = defaultOps.defaultOpNames.subPatch;
                // if (version == 2)opname = defaultOps.defaultOpNames.subPatch2;

                const patchOp = this._p.addOp(opname, { "translate": trans, "subPatch": this.getCurrentSubPatch() });
                const patchId = patchOp.patchId.get();

                if (version < 2)
                {
                    for (let i in selectedOps)
                    {
                        // if (selectedOps[i].uiAttribs.subPatch == this.getCurrentSubPatch())
                        selectedOps[i].setUiAttribs({ "subPatch": patchId });
                    }

                    for (let i = 0; i < selectedOps.length; i++)
                    {
                        for (let j = 0; j < selectedOps[i].portsIn.length; j++)
                        {
                            const theOp = selectedOps[i];
                            let found = null;
                            for (let k = 0; k < theOp.portsIn[j].links.length; k++)
                            {
                                const otherPort = theOp.portsIn[j].links[k].getOtherPort(theOp.portsIn[j]);
                                const otherOp = otherPort.op;
                                if (otherOp.uiAttribs.subPatch != patchId)
                                {
                                    theOp.portsIn[j].links[k].remove();
                                    k--;

                                    if (found)
                                    {
                                        this._p.link(
                                            otherPort.op,
                                            otherPort.getName(),
                                            patchOp,
                                            found);
                                    }
                                    else
                                    {
                                        this._p.link(
                                            otherPort.op,
                                            otherPort.getName(),
                                            patchOp,
                                            patchOp.dyn.name);

                                        found = patchOp.addSubLink(theOp.portsIn[j], otherPort);
                                    }
                                }
                            }

                            if (theOp.portsOut[j])
                            {
                                for (let k = 0; k < theOp.portsOut[j].links.length; k++)
                                {
                                    const otherPortOut = theOp.portsOut[j].links[k].getOtherPort(theOp.portsOut[j]);
                                    if (otherPortOut)
                                    {
                                        const otherOpOut = otherPortOut.op;
                                        if (otherOpOut.uiAttribs.subPatch != patchId)
                                        {
                                            theOp.portsOut[j].links[k].remove();
                                            this._p.link(
                                                otherPortOut.op,
                                                otherPortOut.getName(),
                                                patchOp,
                                                patchOp.dynOut.name);
                                            patchOp.addSubLink(theOp.portsOut[j], otherPortOut);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else
                {
                    for (let i in selectedOps)
                    {
                        if (selectedOps[i].uiAttribs.subPatch == this.getCurrentSubPatch())
                            selectedOps[i].setUiAttribs({ "subPatch": patchId });
                    }

                    this.setPositionSubPatchInputOutputOps();

                    if (next) next(patchId, patchOp);

                    // }, 100);
                }

                gui.patchView.setCurrentSubPatch(this.getCurrentSubPatch(), () =>
                {
                    this._p.emitEvent("subpatchCreated");
                });
            });
    }

    /**
     * @param {string | number} [patchId]
     */
    setPositionSubPatchInputOutputOps(patchId)
    {
        const b = this.getSubPatchBounds(patchId);

        if (!patchId) return;

        let patchInputOPs = this._p.getSubPatchOpsByName(patchId, defaultOps.defaultOpNames.subPatchInput2);
        let patchOutputOPs = this._p.getSubPatchOpsByName(patchId, defaultOps.defaultOpNames.subPatchOutput2);

        if (patchInputOPs.length == 0)
        {
            if (this._p.clearSubPatchCache) this._p.clearSubPatchCache(this.patchId);

            this._p.addOp(defaultOps.defaultOpNames.subPatchInput2, { "subPatch": patchId, "translate": { "x": 0, "y": 0 } });
            this._p.addOp(defaultOps.defaultOpNames.subPatchOutput2, { "subPatch": patchId, "translate": { "x": 0, "y": 0 } });
        }

        if (patchInputOPs.length > 1) this._log.warn("too many input ops?");
        if (patchOutputOPs.length > 1) this._log.warn("too many output ops?");

        let patchInputOP = patchInputOPs[0];
        let patchOutputOP = patchOutputOPs[0];

        let x = 0;
        if (patchInputOP || patchOutputOP)
        {
            x = (patchInputOP || patchOutputOP).uiAttribs.translate.x;

            if (x < b.minX) x = b.minX;
            if (x > b.maxX) x = b.maxX;
        }

        if (patchInputOP)
        {
            let y = Math.min(patchInputOP.uiAttribs.translate.y, b.minY - gluiconfig.newOpDistanceY * 2);

            patchInputOP.setUiAttribs(
                {
                    "translate":
                    {
                        "x": x,
                        "y": y
                    }
                });
        }

        if (patchOutputOP)
        {
            let y = Math.max(patchOutputOP.uiAttribs.translate.y, b.maxY + gluiconfig.newOpDistanceY * 2);

            patchOutputOP.setUiAttribs(
                {
                    "translate":
                    {
                        "x": x,
                        "y": y
                    }
                });
        }
    }

    getSubPatchName(subpatch)
    {
        if (subpatch == 0) return "Main";

        const op = gui.corePatch().getSubPatchOuterOp(subpatch);
        if (!op) return null;
        return op.name;
    }

    /**
     * @param {string | number} subId
     * @param {Object[]} [arr]
     */
    getSubpatchPathArray(subId, arr)
    {
        arr = arr || [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].isSubPatchOp() && ops[i].patchId)
            {
                if (ops[i].patchId.get() == subId)
                {
                    let type = "subpatch";
                    if (ops[i].isSubPatchOp()) type = "blueprint_subpatch2";

                    const patchInfo = {
                        "name": ops[i].name,
                        "patchid": ops[i].patchId.get(),
                        // "id": ops[i].patchId.get(),
                        "type": type
                    };

                    arr.push(patchInfo);
                    if (ops[i].uiAttribs.subPatch !== 0) this.getSubpatchPathArray(ops[i].uiAttribs.subPatch, arr);
                }
            }
        }
        return arr;
    }

    removeLostSubpatches()
    {
        let countSubs = {};
        let foundSubPatchOps = {};
        const ops = gui.corePatch().ops;

        for (let i = 0; i < ops.length; i++)
        {
            if (!ops[i] || !ops[i].uiAttribs) continue;
            const sub = ops[i].uiAttribs.subPatch || 0;
            if (ops[i].isSubPatchOp()) foundSubPatchOps[ops[i].patchId.get()] = true;
            countSubs[sub] = countSubs[sub] || 0;
            countSubs[sub]++;
        }

        for (let subid in countSubs)
        {
            for (let _asub in foundSubPatchOps)
            {
                if (!foundSubPatchOps.hasOwnProperty(subid) && subid != 0)
                {
                    this._log.warn("found lost subpatch...", subid);
                    if (countSubs[subid] <= 2)
                    {
                        this._log.warn("deleted lost subpatch! ", subid);
                        for (let i = ops.length - 1; i >= 0; i--)
                            if (ops[i].uiAttribs.subPatch == subid)
                                ops[i].patch.deleteOp(ops[i].id);

                        countSubs[subid] = 1000;
                    }
                }
            }
        }
    }

    /**
     * @param {boolean} sort
     */
    getSubPatches(sort) // flat list
    {
        let foundPatchIds = [];
        const foundBlueprints = {};
        let subPatches = [];
        const ops = gui.corePatch().ops;

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.hidden) continue;
            if (ops[i].patchId && ops[i].patchId.get() !== 0)
            {
                foundPatchIds.push(ops[i].patchId.get());
            }
        }

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.hidden) continue;

            if (ops[i].uiAttribs)
            {
                if (ops[i].uiAttribs.subPatch)
                {
                    // find lost ops, which are in subpatches, but no subpatch op exists for that subpatch..... :(
                    if (foundPatchIds.indexOf(ops[i].uiAttribs.subPatch) === -1) foundPatchIds.push(ops[i].uiAttribs.subPatch);
                }
            }
            if (ops[i].isSubPatchOp() == 1 && ops[i].uiAttribs)
            {
                foundBlueprints[ops[i].id] = ops[i];
            }
        }

        foundPatchIds = utils.uniqueArray(foundPatchIds);

        for (let i = 0; i < foundPatchIds.length; i++)
        {
            let found = false;
            for (let j = 0; j < ops.length; j++)
            {
                if (ops[j].patchId != 0 && ops[j].patchId && ops[j].patchId.get() == foundPatchIds[i])
                {
                    if (ops[j].uiAttribs.hidden)
                    {
                        found = true;
                        break;
                    }

                    const o = {
                        "opId": ops[j].id,
                        "name": ops[j].getTitle(),
                        "id": foundPatchIds[i]
                    };

                    o.subPatchVer = ops[j].storage.subPatchVer;

                    if (ops[j].storage && ops[j].storage.blueprint)
                    {
                        found = true;
                        o.type = "blueprintSub";
                    }

                    o.blueprintVer = ops[j].isSubPatchOp();

                    subPatches.push(o);
                    found = true;
                }
            }

            if (!found && foundPatchIds[i] != 0)
            {
                subPatches.push({
                    "opId": null,
                    "name": "Lost subpatch " + foundPatchIds[i],
                    "id": foundPatchIds[i],
                    "type": "lostsubpatch"
                });
            }
        }

        for (const blueprintId in foundBlueprints)
        {
            const blueprintOp = foundBlueprints[blueprintId];
            const blueprintName = blueprintOp.uiAttribs.extendTitle || "loading...";
            subPatches.push(
                {
                    "name": "Blueprint: " + blueprintName,
                    "id": blueprintOp.uiAttribs ? blueprintOp.uiAttribs.blueprintSubpatch : null,
                    "opId": blueprintOp.id,
                    "type": "blueprint"
                });
        }

        if (sort) subPatches = subPatches.sort(function (a, b) { return a.name.localeCompare(b.name); });

        return subPatches;
    }

    /**
     * @param {string|number} subPatchId
     * @returns {UiOp}
     */
    getSubPatchOuterOp(subPatchId)
    {
        return gui.corePatch().getSubPatchOuterOp(subPatchId);
    }

    /**
     * @param {String|Number} currentSubPatch
     */
    updateSubPatchBreadCrumb(currentSubPatch)
    {
        this._patchRenderer.greyOut = false;

        if (currentSubPatch === 0) ele.hide(this._eleSubpatchNav);
        else ele.show(this._eleSubpatchNav);

        const names = this.getSubpatchPathArray(currentSubPatch);

        let str = "<a onclick=\"gui.patchView.setCurrentSubPatch(0)\">Main</a> ";

        for (let i = names.length - 1; i >= 0; i--)
        {
            if (i >= 0) str += "<span class=\"sparrow\">&rsaquo;</span>";
            if (i == 0)
                str += "<a class=\"" + names[i].type + "\" onclick=\"gui.patchView.focusSubpatchOp('" + names[i].patchid + "');\"><span class=\"icon icon-op\" style=\"vertical-align: sub;\"></span> " + names[i].name + "</a>";
            else
                str += "<a class=\"" + names[i].type + "\" onclick=\"gui.patchView.clickSubPatchNav('" + names[i].patchid + "');\">" + names[i].name + "</a>";
        }

        if (names.length > 0)
        {
            if (names[0].type == "blueprint_subpatch")
            {
                this._patchRenderer.greyOut = true;
                let blueprintPatchId = names[0].blueprintPatchId;
                if (!blueprintPatchId)
                {
                    const firstBlueprint = names.find((name) => { return name.blueprintPatchId; });
                    if (firstBlueprint) blueprintPatchId = firstBlueprint.blueprintPatchId;
                }
                let bpText = "<span class=\"icon icon-external\"></span> Open patch";
                let bpClick = "window.open('" + platform.getCablesUrl() + "/edit/" + blueprintPatchId + "', '_blank');";
                if (gui.patchId === blueprintPatchId || gui.project().shortId === blueprintPatchId)
                {
                    bpText = "Go to subpatch";
                    let subpatchId = names[0].blueprintLocalSubpatch;
                    if (subpatchId) bpClick = "gui.patchView.setCurrentSubPatch('" + subpatchId + "');CABLES.CMD.UI.centerPatchOps();gui.patchParamPanel.show();";
                }
                str += "<a style=\"margin:0;\" target=\"_blank\" onclick=\"" + bpClick + "\">" + bpText + "</a>";

                gui.restriction.setMessage("blueprint", "This is a blueprint subpatch, changes will not be saved!");
            }
        }
        else
        {
            gui.restriction.setMessage("blueprint", null);
        }

        document.getElementById("subpatch_breadcrumb").innerHTML = str;
    }

    /**
     * @param {ClipboardEvent} e
     */
    clipboardCutOps(e)
    {
        this.clipboardCopyOps(e);
        this.deleteSelectedOps();
    }

    /**
     * @param {Op[]} selectedOps
     */
    serializeOps(selectedOps, _options = {})
    {
        function arrayContains(arr, obj)
        {
            return arr.indexOf(obj) > -1;
        }

        const ops = [];
        const opIds = [];

        for (const i in selectedOps)
        {
            if (selectedOps[i].storage && selectedOps[i].storage.blueprint)
            {
                delete selectedOps[i].storage.blueprint;
            }
            if (selectedOps[i].uiAttribs.hasOwnProperty("fromNetwork"))
            {
                delete selectedOps[i].uiAttribs.fromNetwork;
            }
            ops.push(selectedOps[i].getSerialized());
            opIds.push(selectedOps[i].id);
        }

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].storage && ops[i].storage.ref) delete ops[i].storage.ref;
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch2) delete ops[i].uiAttribs.blueprintSubpatch2;
            if (ops[i].uiAttribs && ops[i].uiAttribs.selected) delete ops[i].uiAttribs.selected;

            // remove links that are not fully copied...

            if (ops[i].portsIn)
            {
                for (let j = 0; j < ops[i].portsIn.length; j++)
                {
                    delete ops[i].portsIn[j].expose;

                    if (ops[i].portsIn[j].links)
                    {
                        let k = ops[i].portsIn[j].links.length;
                        while (k--)
                        {
                            if (ops[i].portsIn[j].links[k] && ops[i].portsIn[j].links[k].objIn && ops[i].portsIn[j].links[k].objOut)
                            {
                                if (!arrayContains(opIds, ops[i].portsIn[j].links[k].objIn) || !arrayContains(opIds, ops[i].portsIn[j].links[k].objOut))
                                {
                                    const p = selectedOps[0].patch.getOpById(ops[i].portsIn[j].links[k].objOut).getPort(ops[i].portsIn[j].links[k].portOut);
                                    ops[i].portsIn[j].links[k] = null;
                                    if (p && (p.type === portType.string || p.type === portType.number))
                                    {
                                        ops[i].portsIn[j].value = p.get();
                                    }
                                }
                            }
                        }
                        // numLinks += ops[i].portsIn[j].links.length;
                    }
                }
            }

            if (ops[i].portsOut) for (let j = 0; j < ops[i].portsOut.length; j++)
            {
                delete ops[i].portsOut[j].expose;

                if (ops[i].portsOut[j].links)
                {
                    let k = ops[i].portsOut[j].links.length;
                    while (k--)
                    {
                        if (ops[i].portsOut[j].links[k] && ops[i].portsOut[j].links[k].objIn && ops[i].portsOut[j].links[k].objOut)
                        {
                            if (!arrayContains(opIds, ops[i].portsOut[j].links[k].objIn) || !arrayContains(opIds, ops[i].portsOut[j].links[k].objOut))
                            {
                                const p = selectedOps[0].patch.getOpById(ops[i].portsOut[j].links[k].objOut).getPort(ops[i].portsOut[j].links[k].portOut);
                                ops[i].portsOut[j].links[k] = null;
                                if (p && (p.type === portType.string || p.type === portType.number))
                                {
                                    ops[i].portsOut[j].value = p.get();
                                }
                            }
                        }
                    }
                }
            }
        }

        return { "ops": ops };
    }

    /**
     * @param {ClipboardEvent} e
     */
    clipboardCopyOps(e)
    {
        let selectedOps = this.getSelectedOps();
        const ser = this.serializeOps(selectedOps);
        const ops = ser.ops;
        ops.forEach((op) =>
        {
            op.objName = gui.serverOps.getOpNameByIdentifier(op.opId);
        });

        const objStr = JSON.stringify({
            "ops": ops
        });
        notify("Copied " + ops.length + " ops");

        e.clipboardData.setData("text/plain", objStr);
        e.preventDefault();
    }

    /**
     * @param {ClipboardEvent} e
     * @param {String} oldSub
     * @param {Number} mouseX
     * @param {Number} mouseY
     * @param {Function} [next]
     */
    clipboardPaste(e, oldSub = "0", mouseX = 0, mouseY = 0, next = null)
    {
        const currentSubPatch = this.getCurrentSubPatch();

        this.isPasting = true;
        if (e.clipboardData.types.indexOf("text/plain") == -1)
        {
            // this._log.error("clipboard not type text");
            // notifyError("Paste failed");
            return;
        }
        let str = e.clipboardData.getData("text/plain");
        e.preventDefault();

        str = str.replace("```", "");
        str = str.replace("```", "");

        let pastedJson = null;
        try
        {
            pastedJson = JSON.parse(str);
            this.currentOpPaste = pastedJson;
        }
        catch (exp)
        {
            this._log.warn("pasting failed...");
        }

        if (this.newPatchOpPaste && this.newPatchOpPaste == str)
        {
            return;
        }
        this.newPatchOpPaste = null;

        const undoGroup = undo.startGroup();

        if (!pastedJson || !pastedJson.ops) return;

        if (currentSubPatch)
        {
            const subOuter = gui.patchView.getSubPatchOuterOp(currentSubPatch);
            if (subOuter && subOuter.objName)
            {
                for (let i = 0; i < pastedJson.ops.length; i++)
                {
                    const pastedOp = pastedJson.ops[i];
                    if (pastedOp.objName)
                    {
                        const pasteProblem = namespace.getNamespaceHierarchyProblem(subOuter.objName, pastedOp.objName);
                        if (pasteProblem)
                        {
                            notifyError("Paste failed", pasteProblem, { "force": true });
                            return;
                        }
                    }
                }
            }
        }

        let focusSubpatchop = null;
        gui.serverOps.loadProjectDependencies(pastedJson, (project, newOps) =>
        {
            // change ids
            project = Patch.replaceOpIds(project, { "parentSubPatchId": oldSub });
            for (const i in project.ops)
            {
                project.ops[i].uiAttribs.pasted = true;
            }

            { // change position of ops to paste
                let minx = Number.MAX_VALUE;
                let miny = Number.MAX_VALUE;

                for (const i in project.ops)
                {
                    if (project.ops[i].uiAttribs && project.ops[i].uiAttribs && project.ops[i].uiAttribs.translate && project.ops[i].uiAttribs.subPatch == this.getCurrentSubPatch())
                    {
                        minx = Math.min(minx, project.ops[i].uiAttribs.translate.x);
                        miny = Math.min(miny, project.ops[i].uiAttribs.translate.y);
                    }
                }

                for (const i in project.ops)
                {
                    if (project.ops[i].uiAttribs && project.ops[i].uiAttribs && project.ops[i].uiAttribs.translate)
                    {
                        let x = project.ops[i].uiAttribs.translate.x + mouseX - minx;
                        let y = project.ops[i].uiAttribs.translate.y + mouseY - miny;
                        if (userSettings.get("snapToGrid2"))
                        {
                            x = Snap.snapOpPosX(x);
                            y = Snap.snapOpPosY(y);
                        }
                        project.ops[i].uiAttribs.translate.x = x;
                        project.ops[i].uiAttribs.translate.y = y;
                    }

                    (function (opid)
                    {
                        undo.add({
                            "title": "paste op",
                            undo()
                            {
                                gui.corePatch().deleteOp(opid, true);
                            },
                            redo()
                            {
                                gui.patchView.clipboardPaste(e);
                            }
                        });
                    }(project.ops[i].id));
                }
            }
            notify("Pasted " + project.ops.length + " ops");
            if (newOps && newOps.length > 0)
            {
                let notifyText = "Created " + newOps.length + " patch op";
                if (newOps.length > 1) notifyText += "s";
                notifyWarn(notifyText, "clipboard cleared");
            }
            gui.corePatch().deSerialize(project);
            this.isPasting = false;

            if (focusSubpatchop) this.patchRenderer.focusOpAnim(focusSubpatchop.id);
            this.currentOpPaste = null;
            if (next) next(project.ops, focusSubpatchop);
        });
        undo.endGroup(undoGroup, "Paste");

        this.setCurrentSubPatch(currentSubPatch);
        this.unselectOpsFromOtherSubpatches();
    }

    addSpaceBetweenOpsX()
    {
        const bounds = this.getSelectionBounds(0);
        const ops = gui.patchView.getSelectedOps();
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const undoGroup = undo.startGroup();

        for (let j = 0; j < ops.length; j++)
        {
            const diffX = ops[j].uiAttribs.translate.x - centerX;
            this.setOpPos(ops[j], Snap.snapOpPosX(centerX + (diffX * 1.2)), ops[j].uiAttribs.translate.y);
        }
        undo.endGroup(undoGroup, "add space x");
    }

    addSpaceBetweenOpsY()
    {
        const bounds = this.getSelectionBounds(0);
        const ops = gui.patchView.getSelectedOps();
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const undoGroup = undo.startGroup();

        for (let j = 0; j < ops.length; j++)
        {
            const diffY = ops[j].uiAttribs.translate.y - centerY;
            this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, Snap.snapOpPosY(centerY + (diffY * 1.8)));
        }
        undo.endGroup(undoGroup, "add space y");
    }

    /**
     * @param {UiOp[]} ops
     */
    compressSelectedOps(ops)
    {
        if (!ops || ops.length === 0) return;

        const undoGroup = undo.startGroup();

        this.saveUndoSelectedOpsPositions(ops);

        this.cleanOps(ops);

        undo.endGroup(undoGroup, "Compress Ops");
    }

    /**
     * @param {Op[]} ops
     */
    cleanOps(ops)
    {
        new opCleaner(ops, this.patchRenderer);
    }

    /**
     * @param {UiOp[]} ops
     */
    alignSelectedOpsVert(ops)
    {
        if (ops.length == 1)
        {
            const op = ops[0];
            if (op.getFirstPortIn() && op.getFirstPortIn().links.length)
            {
                const pre = op.getFirstPortIn().links[0].portOut.op;

                if (pre.uiAttribs.translate && op.uiAttribs.translate)
                    op.setUiAttrib({ "translate": { "x": pre.uiAttribs.translate.x, "y": op.uiAttribs.translate.y } });
            }
        }

        if (ops.length > 0)
        {
            let sum = 0;
            for (const j in ops) sum += ops[j].uiAttribs.translate.x;

            let avg = sum / ops.length;

            if (userSettings.get("snapToGrid2")) avg = Snap.snapOpPosX(avg);

            for (const j in ops) this.setOpPos(ops[j], avg, ops[j].uiAttribs.translate.y);
        }
        return ops;
    }

    /**
     * @param {Op[]} ops
     */
    alignSelectedOpsHor(ops)
    {
        if (ops.length > 0)
        {
            let sum = 0;
            for (const j in ops) sum += ops[j].uiAttribs.translate.y;

            let avg = sum / ops.length;

            if (userSettings.get("snapToGrid2")) avg = Snap.snapOpPosY(avg);

            for (const j in ops) this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, avg);
        }
        return ops;
    }

    /**
     * @param {UiOp | Op} op
     * @param {number} x
     * @param {number} y
     */
    setOpPos(op, x, y)
    {
        if (op && op.uiAttribs && op.uiAttribs.translate)
        {
            const oldX = op.uiAttribs.translate.x;
            const oldY = op.uiAttribs.translate.y;
            undo.add({
                "title": "Move op",
                "context": {
                    "opname": op.name
                },
                undo()
                {
                    op.setUiAttribs({ "translate": { "x": oldX, "y": oldY } });
                },
                redo()
                {
                    op.setUiAttribs({ "translate": { "x": x, "y": y } });
                }
            });
        }

        op.setUiAttribs({
            "translate":
            {
                "x": x,
                "y": y
            }
        });
    }

    /**
     * @param {UiOp[]} selectedOps
     */
    saveUndoSelectedOpsPositions(selectedOps)
    {
        const opPositions = [];
        for (let j = 0; j < selectedOps.length; j++)
        {
            const obj = {};
            obj.id = selectedOps[j].id;

            if (!selectedOps[j].uiAttribs) selectedOps[j].uiAttribs = {};
            if (!selectedOps[j].uiAttribs.translate) selectedOps[j].uiAttribs.translate = { "x": 0, "y": 0 };

            obj.x = selectedOps[j].uiAttribs.translate.x;
            obj.y = selectedOps[j].uiAttribs.translate.y;
            opPositions.push(obj);
        }

        undo.add({
            "title": "save op positions",
            undo()
            {
                const changedOps = [];
                for (let j = 0; j < opPositions.length; j++)
                {
                    const obj = opPositions[j];
                    const op = gui.corePatch().getOpById(obj.id);
                    gui.patchView.setOpPos(op, obj.x, obj.y);
                    changedOps.push(op);
                }
            },
            redo()
            {
                // gui.scene().addOp(objName, op.uiAttribs, opid);
            }
        });
    }

    alignOps(selectedOps)
    {
        const undoGroup = undo.startGroup();

        this.saveUndoSelectedOpsPositions(selectedOps);
        this.alignSelectedOpsVert(selectedOps);

        undo.endGroup(undoGroup, "Align Ops");

        return selectedOps;
    }

    unlinkPort(opid, portid)
    {
        const op = gui.corePatch().getOpById(opid);
        const p = op.getPortById(portid);

        if (!p)
        {
            this._log.warn("[unlinkport] portnot found ");
            return;
        }

        const undoGroup = undo.startGroup();

        p.removeLinks();
        undo.endGroup(undoGroup, "Unlink Port");
    }

    /**
     * @param {MouseEvent} e
     * @param {string} opid
     * @param {string} pid
     * @param {string} op2id
     */
    linkPortToOp(e, opid, pid, op2id)
    {

        /** @type {UiOp} */
        let op1 = this._p.getOpById(opid);

        /** @type {UiOp} */
        let op2 = this._p.getOpById(op2id);
        const p = op1.getPort(pid);
        let showConverter = gui.longLinkHover;
        let numFitting = op2.countFittingPorts(p, showConverter);
        if (numFitting == 0 && !showConverter)
        {
            showConverter = true;
            numFitting = op2.countFittingPorts(p, true);
        }

        const isInnerOp = op2.objName == defaultOps.defaultOpNames.subPatchInput2 || op2.objName == defaultOps.defaultOpNames.subPatchOutput2;
        const isbpOp = op2.isSubPatchOp() || isInnerOp;

        if (isbpOp || numFitting > 1)
        {
            new SuggestPortDialog(op2, p, e, (thePort, newOpId, options, useconverter) =>
            {

                if (options.createSpOpPort)
                {
                    subPatchOpUtil.addPortToBlueprint(options.op.opId, p, {
                        "reverseDir": !isInnerOp,
                        "cb": (newPortJson, newOp, sugg) =>
                        {
                            if (Link.canLink(thePort, sugg.p))
                            {
                                this._p.link(op1, pid, newOp, newPortJson.id);
                            }
                            else
                            {
                                gui.patchView.linkPorts(opid, pid, op2id, thePort.id, e);
                            }
                        }
                    });
                }
                else
                {
                    op2 = this._p.getOpById(newOpId);
                    if (Link.canLink(thePort, p))
                    {
                        this._p.link(op1, pid, op2, thePort.name);
                    }
                    else
                    {
                        gui.patchView.linkPorts(opid, pid, op2id, thePort.id, e);
                    }
                }
            }, null, showConverter);
        }
        else
        {
            const fitp = op2.findFittingPort(p, showConverter);

            if (fitp)
            {
                if (fitp.type == p.type)
                {
                    this._p.link(op1, pid, op2, fitp.name);
                }
                else
                {
                    gui.patchView.linkPorts(opid, p.name, op2id, fitp.name, e);
                }
            }
            else
            {
                console.log("no fitp");
            }
        }
    }

    /**
     * @param {MouseEvent} e
     * @param {string} opid
     * @param {string[]} opids
     * @param {string[]} portnames
     */
    linkPortsToOp(e, opid, opids, portnames, showConverters = false)
    {
        if (!opids || opids.length == 0 || !portnames || portnames.length == 0) return;

        const op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(opids[0]);
        const p = op2.getPort(portnames[0]);
        const numFitting = op1.countFittingPorts(p, showConverters);

        if (numFitting > 1)
        {
            new SuggestPortDialog(op1, p, e, (suggport) =>
            {
                if (suggport)
                    for (let i = 0; i < portnames.length; i++)
                    {
                        op2 = this._p.getOpById(opids[i]);
                        this._p.link(op2, portnames[i], op1, suggport.id);
                    }
            }, null, true);
        }
        else
        {
            const fitp = op1.findFittingPort(p, showConverters);

            if (fitp)
                for (let i = 0; i < portnames.length; i++)
                {
                    op2 = this._p.getOpById(opids[i]);
                    this._p.link(op2, portnames[i], op1, fitp.name);
                }
        }
    }

    /**
     * @param {string} opid
     * @param {string} pid
     * @param {string} op2id
     * @param {string} p2id
     * @param {MouseEvent} event
     */
    linkPorts(opid, pid, op2id, p2id, event)
    {
        let op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(op2id);

        if (!op1 || !op2)
        {
            console.log("no linkop");
            return;
        }

        // helper number2string auto insert....
        let p1 = op1.getPortByName(pid);
        let p2 = op2.getPortByName(p2id);

        const converters = getConverters(p1, p2);

        if (converters.length == 1)
        {
            convertPorts(p1, p2, converters[0]);
            return;
        }
        if (converters.length > 1)
        {
            const suggs = [];
            for (let i = 0; i < converters.length; i++)
            {
                suggs.push({
                    "name": "♻ " + opNames.getShortName(converters[i].op),
                    "class": "port_text_color_" + p2.getTypeString().toLowerCase()
                });
            }

            new SuggestionDialog(suggs, op2, event, null, function (sid)
            {
                convertPorts(p1, p2, converters[sid]);
            });

            return;
        }

        this._p.link(op1, pid, op2, p2id);
    }

    /**
     * @param {number} [x]
     * @param {number} [y]
     */
    centerView(x, y)
    {
        if (this._patchRenderer)
            if (this._patchRenderer.center) this._patchRenderer.center(x, y);
            else this._log.warn("patchRenderer has no function center");
    }

    pauseInteraction()
    {
        this._patchRenderer.pauseInteraction();
    }

    resumeInteraction()
    {
        this._patchRenderer.resumeInteraction();
    }

    /** @returns {String|number} */
    getCurrentSubPatch()
    {
        return this._patchRenderer.getCurrentSubPatch();
    }

    serialize(dataUi)
    {
        this._patchRenderer.serialize(dataUi);
    }

    /**
     * @param {string | number} subpatch
     * @param {Function} next
     */
    setCurrentSubPatch(subpatch, next)
    {
        gui.restriction.setMessage("subpatchref", null);
        if (subpatch != 0)
        {
            const outerOp = this.getSubPatchOuterOp(subpatch);
            const ops = gui.savedState.getUnsavedPatchSubPatchOps();

            for (let i = 0; i < ops.length; i++)
            {
                if (ops[i].op && outerOp && ops[i].op.opId == outerOp.opId && ops[i].op != outerOp)
                {
                    let subid = ops[i].subId;
                    gui.restriction.setMessage("subpatchref", "changed reference in patch: a unsaved reference of this subpatch ops exists in your patch. <br/>saving this can will overwrite references!<br/><a class='link' onclick='gui.patchView.setCurrentSubPatch(\"" + subid + "\")'>goto patch</a>");
                }
            }
        }

        if (this._patchRenderer.setCurrentSubPatch)
        {
            this._patchRenderer.setCurrentSubPatch(subpatch,
                () =>
                {
                    gui.patchView.updateSubPatchBreadCrumb(subpatch);
                    if (ele.byId("subpatchlist")) this.showDefaultPanel(); // update subpatchlist because its already visible
                    if (next) next();
                });
        }
        else this._log.warn("patchRenderer has no function setCurrentSubPatch");

        gui.corePatch().emitEvent("subpatchesChanged");
    }

    getLastFocussedOp()
    {
        return gui.opParams.getCurrentOp();
    }

    /**
     * @param {string} opid
     */
    focusOp(opid)
    {
        if (this._patchRenderer.focusOp) this._patchRenderer.focusOp(opid);
        else this._log.warn("patchRenderer has no function focusOp");
    }

    unselectAllOps()
    {
        for (let i = 0; i < this._p.ops.length; i++)
            if (this._p.ops[i].uiAttribs.selected) this._p.ops[i].setUiAttribs({ "selected": false });
    }

    unselectOpsFromOtherSubpatches()
    {
        const ops = this.getSelectedOps();
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs.subPatch != this.getCurrentSubPatch())
                ops[i].setUiAttribs({ "selected": false });
    }

    /**
     * @param {String} id
     */
    selectOpId(id)
    {
        const op = this._p.getOpById(id);
        if (op) op.setUiAttribs({ "selected": true });
    }

    /**
     * @param {String} opid
     */
    centerSelectOp(opid)
    {
        this.setSelectedOpById(opid);
        this._patchRenderer.viewBox.centerSelectedOps();
        if (gui.patchView.getSelectedOps().length == 1) this.focusOpAnim(gui.patchView.getSelectedOps()[0].id);
        this.focus();
    }

    /**
     * @param {String} opid
     */
    setSelectedOpById(opid)
    {
        if (this._patchRenderer.setSelectedOpById) this._patchRenderer.setSelectedOpById(opid);
        // else if (this._patchRenderer.selectOpId) this._patchRenderer.selectOpId(opid);
        else this._log.warn("patchRenderer has no function setSelectedOpById");
    }

    /**
     * @param {String} id
     */
    selectChilds(id)
    {
        const op = gui.corePatch().getOpById(id);
        op.selectChilds();
    }

    setUnsaved()
    {
        // gui.setStateUnsaved({ "subPatch": this.getCurrentSubPatch });
        // gui.savedState.setUnSaved("patchview??", this.getCurrentSubPatch());
        gui.savedState.setUnSaved("patchview??");
    }

    _portValidate(p1, p2)
    {
        if (p1.type != portType.object) return;
        let inp = null;
        let outp = null;

        if (p1.direction === PortDir.in)
        {
            inp = p1;
            outp = p2;
        }
        else
        {
            inp = p2;
            outp = p1;
        }

        const id = "_validator" + inp.name;

        inp.op.setUiError(id, null);

        if (!inp.isLinked()) return;
        if (inp.uiAttribs.ignoreObjTypeErrors) return;
        if (outp.get() == null) return;

        if (p1.uiAttribs.objType && p2.uiAttribs.objType)
        {
            if (p1.uiAttribs.objType == p2.uiAttribs.objType) return;
            if (p1.uiAttribs.objType.indexOf("sg_") == 0 && p2.uiAttribs.objType.indexOf("sg_") == 0) return;
        }

        const errorMsg = "Object in port <b>" + inp.name + "</b> is not of type " + inp.uiAttribs.objType;

        // check if both have defined objtype
        if (p1.uiAttribs.objType && p2.uiAttribs.objType && p1.uiAttribs.objType != p2.uiAttribs.objType)
        {
            inp.op.setUiError(id, errorMsg);
            return;
        }

        // validate by object value
        if (inp.uiAttribs.objType && outp.get())
        {
            if (inp.uiAttribs.objType == "texture" && !(outp.get() instanceof WebGLTexture)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "geometry" && !(outp.get() instanceof Geometry)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "shader" && !(outp.get() instanceof Shader)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "element" && !(outp.get() instanceof Element)) inp.op.setUiError(id, errorMsg);
            // * audio
            if (inp.uiAttribs.objType == "audioBuffer" && !(outp.get() instanceof AudioBuffer)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "audioNode" && !(outp.get() instanceof AudioNode)) inp.op.setUiError(id, errorMsg);
        }
    }

    /**
     * @param {Port} p1
     * @param {Port} p2
     */
    refreshCurrentOpParamsByPort(p1, p2)
    {
        if (this.isCurrentOp(p2.op) || this.isCurrentOp(p1.op)) gui.opParams.refresh();
    }

    /**
     * @param {Op<any>} op
     */
    isCurrentOp(op)
    {
        return gui.opParams.isCurrentOp(op);
    }

    /**
     * @param {string} opid
     */
    isCurrentOpId(opid)
    {
        return gui.opParams.isCurrentOpId(opid);
    }

    copyOpInputPorts(origOp, newOp)
    {
        for (let i = 0; i < origOp.portsIn.length; i++)
        {
            for (let j = 0; j < newOp.portsIn.length; j++)
            {
                if (newOp.portsIn[j].name.toLowerCase() == origOp.portsIn[i].name.toLowerCase())
                    newOp.portsIn[j].set(origOp.portsIn[i].get());
            }
        }
    }

    downGradeOp(opid, opname)
    {
        if (!gui.opDocs.getOpDocByName(opname))
        {
            notify("op has no versions....");
            return;
        }

        const versions = gui.opDocs.getOpDocByName(opname).versions;
        if (versions.length > 1)
        {
            let name = versions[0].name;
            for (let i = 0; i < versions.length; i++)
            {
                if (versions[i].name == opname) break;
                name = versions[i].name;
            }

            this.replaceOp(opid, name);
        }
        else
        {
            notify("could not downgrade: has no previous version");
        }

        this.unselectAllOps();
    }

    replaceOpCheck(opid, newOpObjName)
    {
        gui.serverOps.loadOpDependencies(newOpObjName, () =>
        {
            this.addOp(newOpObjName, {
                "onOpAdd": (newOp) =>
                {
                    const origOp = this._p.getOpById(opid);

                    if (!newOp || !origOp)
                    {
                        this._log.warn("could not replace op.?", newOp, origOp);
                        return;
                    }

                    let allFine = true;
                    let html = "<h3>Replacing Op</h3>";

                    html += "Replacing <b>" + origOp.objName + "</b> with <b>" + newOp.objName + "</b><br/><br/>";

                    let htmlList = "";
                    htmlList += "<table>";
                    for (let i = 0; i < origOp.portsIn.length; i++)
                    {
                        let found = false;

                        htmlList += "<tr>";
                        htmlList += "<td>Port " + origOp.portsIn[i].name + "</td>";

                        for (let j = 0; j < newOp.portsIn.length; j++)
                        {
                            if (newOp.portsIn[j] && origOp.portsIn[i])
                            {
                                if (newOp.portsIn[j].name.toLowerCase() == origOp.portsIn[i].name.toLowerCase())
                                {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        htmlList += "<td>";
                        if (!found)
                        {
                            htmlList += "NOT FOUND in new version!";
                            allFine = false;
                        }

                        htmlList += "</td>";
                        htmlList += "</tr>";
                    }

                    this._p.deleteOp(newOp.id);
                    htmlList += "</table>";

                    if (allFine)
                    {
                        gui.patchView.replaceOp(opid, newOpObjName);
                        return;
                        // html += "All old ports are available in the new op, it should be safe to replace with new version. Make sure you test if it behaves the same, very accurately.<br/><br/>";
                    }
                    else
                    {
                        html += "Not all old Ports are available in never version of the op. Make sure you test if it behaves the same, very accurately.<br/><br/>";
                        html += htmlList;
                    }

                    html += "<br/><a onClick=\"gui.patchView.replaceOp('" + opid + "','" + newOpObjName + "');gui.closeModal();\" class=\"bluebutton\">Really Upgrade</a>";
                    html += "<a onClick=\"gui.closeModal();\" class=\"button\">Cancel</a>";

                    setTimeout(() =>
                    {
                        this.setSelectedOpById(origOp.id);
                    }, 100);

                    this.selectOpId(newOp.id);
                    gui.opParams.show(newOp.id);
                    this._patchRenderer.focusOpAnim(newOp.id);

                    new ModalDialog({ "html": html });
                }
            });
        });
    }

    /**
     * @param {string} opid
     * @param {string} newOpObjName
     */
    replaceOp(opid, newOpObjName, cb = null)
    {
        gui.serverOps.loadOpDependencies(newOpObjName, () =>
        {
            this.addOp(newOpObjName, {
                "onOpAdd": (newOp) =>
                {
                    const origOp = this._p.getOpById(opid);

                    if (origOp)
                    {
                        const oldUiAttribs = JSON.parse(JSON.stringify(origOp.uiAttribs));

                        const theUiAttribs = {};
                        for (const i in oldUiAttribs)
                        {
                            if (i == "uierrors") continue;
                            theUiAttribs[i] = oldUiAttribs[i];
                        }
                        newOp.setUiAttrib(theUiAttribs);

                        this.copyOpInputPorts(origOp, newOp);

                        for (let i = 0; i < origOp.portsIn.length; i++)
                        {
                            for (let j = 0; j < origOp.portsIn[i].links.length; j++)
                            {
                                const otherPort = origOp.portsIn[i].links[j].getOtherPort(origOp.portsIn[i]);
                                origOp.portsIn[i].links[j].remove();

                                this._p.link(otherPort.op, otherPort.name.toLowerCase(), newOp, origOp.portsIn[i].name.toLowerCase(), true);
                            }
                        }

                        for (let i = 0; i < origOp.portsOut.length; i++)
                        {
                            for (let j = 0; j < origOp.portsOut[i].links.length; j++)
                            {
                                const otherPort = origOp.portsOut[i].links[j].getOtherPort(origOp.portsOut[i]);

                                origOp.portsOut[i].links[j].remove();
                                // origOp.portsOut[i].links[j].link(otherPort, newOp.getPort(origOp.portsOut[i].name.toLowerCase(), true))
                                this._p.link(otherPort.op, otherPort.name.toLowerCase(), newOp, origOp.portsOut[i].name.toLowerCase(), true);
                            }
                        }

                        this._p.deleteOp(origOp.id);

                        setTimeout(() =>
                        {
                            newOp.setUiAttrib(theUiAttribs);
                            this.setCurrentSubPatch(oldUiAttribs.subPatch || 0, () =>
                            {
                                if (cb) cb();
                            });
                        }, 100);
                    }
                    else
                    {
                        this._log.error("no origop ?!");
                    }
                }
            });
        });
    }

    // tempUnlinkOp()
    // {
    //     if (this._lastTempOP)
    //     {
    //         this._lastTempOP.undoUnLinkTemporary();
    //         this._lastTempOP.setEnabled(true);
    //         this._lastTempOP = null;
    //     }
    //     else
    //     {
    //         const op = this.getSelectedOps()[0];
    //         if (op)
    //         {
    //             op.setEnabled(false);
    //             op.unLinkTemporary();
    //             this._lastTempOP = op;
    //         }
    //     }
    // }

    toggleVisibility()
    {
        gui.patchView.element.classList.toggle("hidden");
        gui.patchView.patchRenderer.vizLayer._eleCanvas.classList.toggle("hidden");
        gui.emitEvent("canvasModeChange");
    }

    /**
     * @param {boolean} b
     */
    setVisibility(b)
    {
        if (b)
        {
            gui.patchView.element.classList.remove("hidden");
            gui.patchView.patchRenderer.vizLayer._eleCanvas.classList.remove("hidden");
        }
        else
        {
            gui.patchView.element.classList.add("hidden");
            gui.patchView.patchRenderer.vizLayer._eleCanvas.classList.add("hidden");
        }
    }

    setPortTitle(opId, portName, oldtitle)
    {
        new ModalDialog({
            "prompt": true,
            "title": "Set Title",
            "text": "Enter a custom title for this port",
            "promptValue": oldtitle,
            "promptOk": function (name)
            {
                const op = gui.corePatch().getOpById(opId);
                const p = op.getPort(portName);
                p.setUiAttribs({ "title": name });

                gui.opParams.show(opId);
            }

        });
    }

    insertOpInLink(oldLink, op, x, y)
    {
        let newPortIn = op.getFirstPortIn();
        let newPortOut = op.getFirstPortOut();

        if (!newPortIn || !newPortOut) return;
        if (newPortIn.isLinked() || newPortOut.isLinked()) return;

        let portIn = oldLink.portIn;
        let portOut = oldLink.portOut;

        if (oldLink.p1 && oldLink.p2)
        {
            portIn = oldLink.p1.thePort;
            portOut = oldLink.p2.thePort;

            if (oldLink.p2.thePort.direction == PortDir.in)
            {
                portIn = oldLink.p2.thePort;
                portOut = oldLink.p1.thePort;
            }
            oldLink.unlink();
        }
        else
        {
            oldLink.remove();
        }

        if (portIn && portOut && newPortOut) // && !newPortIn.isLinked()
        {
            if (Link.canLink(newPortIn, portOut)) //! portOut.isLinked() &&
            {
                gui.corePatch().link(
                    op,
                    newPortIn.getName(),
                    portOut.op,
                    portOut.getName()
                );

                gui.corePatch().link(
                    op,
                    newPortOut.getName(),
                    portIn.op,
                    portIn.getName()
                );

                op.setUiAttrib({ "translate": { "x": x, "y": y } });
            }
            else
            {
                gui.corePatch().link(portIn.op, portIn.getName(), portOut.op, portOut.getName());
            }
        }
    }

    pause()
    {
        if (this._patchRenderer && this._patchRenderer.pause) this._patchRenderer.pause();
    }

    resume()
    {
        if (this._patchRenderer && this._patchRenderer.resume) this._patchRenderer.resume();
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     */
    setSize(x, y, w, h)
    {
        if (this._patchRenderer) this._patchRenderer.setSize(x, y, w, h);
    }

    /**
     * @param {number} step
     */
    zoomStep(step)
    {
        this._patchRenderer.zoomStep(step);
    }

    /**
     * @param {UiOp} op1
     * @param {UiOp} op2
     */
    suggestionBetweenTwoOps(op1, op2)
    {
        const mouseEvent = { "clientX": 400, "clientY": 400 };
        let showConv = true;

        /** @type {import("./suggestiondialog.js").SuggestionItem[]} */
        const suggestions = [
            {
                "cb": () => { gui.patchView.suggestionBetweenTwoOps(op2, op1); },
                "name": "OUT: " + op1.getTitle(),
                "classname": ""
            }];
        if (!op1 || !op2) return;

        for (let j = 0; j < op1.portsOut.length; j++)
        {
            const p = op1.portsOut[j];

            const numFitting = op2.countFittingPorts(p, showConv);
            let addText = "...";
            if (numFitting > 0)
            {
                if (numFitting == 1)
                {
                    const p2 = op2.findFittingPort(p, showConv);
                    addText = p2.title;
                }

                suggestions.push({
                    "p": p,
                    "name": p.title + " → " + addText,
                    "classname": "port_text_color_" + p.getTypeString().toLowerCase()
                });
            }
        }

        if (suggestions.length === 0)
        {
            notify("can not link!");
            return;
        }

        const showSuggestions2 = (id) =>
        {
            if (suggestions[id].cb) return suggestions[id].cb();

            const p = suggestions[id].p;

            /** @type {import("./suggestiondialog.js").SuggestionItem[]} */
            const sugIn =
                [{
                    "cb": () => { gui.patchView.suggestionBetweenTwoOps(op2, op1); },
                    "name": "<span class=\"icon icon-op\"></span>IN: " + op2.getTitle(),
                    "classname": ""
                }];

            for (let i = 0; i < op2.portsIn.length; i++)
            {
                if (Link.canLink(op2.portsIn[i], p))
                {
                    sugIn.push({
                        "p": op2.portsIn[i],
                        "name": "<span class=\"icon icon-arrow-right\"></span>" + op2.portsIn[i].title,
                        "classname": "port_text_color_" + op2.portsIn[i].getTypeString().toLowerCase()
                    });
                }
            }

            if (sugIn.length == 1)
            {
                gui.corePatch().link(
                    p.op,
                    p.name,
                    sugIn[0].p.op,
                    sugIn[0].p.name);
                return;
            }

            new SuggestionDialog(sugIn, op2, mouseEvent, null, function (sid)
            {
                gui.corePatch().link(
                    p.op,
                    p.name,
                    sugIn[sid].p.op,
                    sugIn[sid].p.name);
            });
        };

        new SuggestionDialog(suggestions, op1, mouseEvent, null, showSuggestions2, false);
    }

    /**
     * @param {String} col
     */
    setOpColor(col)
    {
        const selectedOps = this.getSelectedOps();

        for (let i = 0; i < selectedOps.length; i++)
            if (selectedOps[i].objName == defaultOps.defaultOpNames.uiArea)
                return selectedOps[i].setUiAttrib({ "color": col });

        for (let i = 0; i < selectedOps.length; i++)
            selectedOps[i].setUiAttrib({ "color": col });
    }

    /**
     * @param {string} opid
     * @param {string} [portname]
     */
    resetOpValues(opid, portname)
    {
        const op = this._p.getOpById(opid);
        if (!op)
        {
            this._log.error("reset op values: op not found...", opid);
            return;
        }

        if (portname)
        {
            const p = op.getPortByName(portname);
            const oldValue = p.get();
            undo.add({
                "title": "reset defaultvalue",
                undo()
                {
                    p.set(oldValue);
                    gui.opParams.show(op);
                },
                redo()
                {
                    p.set(p.defaultValue);
                    gui.opParams.show(op);
                }
            });

            p.set(p.defaultValue);
        }
        else
        {
            // all ops
            for (let i = 0; i < op.portsIn.length; i++)
                if (op.portsIn[i].defaultValue != null)
                    op.portsIn[i].set(op.portsIn[i].defaultValue);
        }

        gui.opParams.show(op);
    }

    /**
     * @param {string} bpSubpatchId
     */
    getBlueprintOpFromBlueprintSubpatchId(bpSubpatchId)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch && ops[i].uiAttribs.blueprintSubpatch == bpSubpatchId)
                return ops[i];
    }

    /**
     * @param {string} subid
     */
    getAllOpsInBlueprint(subid)
    {
        const foundOps = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].isInBlueprint2() == subid || ops[i].uiAttribs.subPatch == subid) foundOps.push(ops[i]);
        }
        return foundOps;
    }

    /**
     * @param {string | number} subid
     */
    getAllSubPatchOps(subid)
    {
        const foundOps = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i] && ops[i].uiAttribs && ops[i].uiAttribs.subPatch == subid) foundOps.push(ops[i]);
        }
        return foundOps;
    }

    /**
     * @param {Port} port
     * @param {number} dir
     */
    setExposedPortOrder(port, dir)
    {
        const ports = this.getSubPatchExposedPorts(port.op.uiAttribs.subPatch);

        gui.savedState.setUnSaved("exposedPortOrder", port.op.uiAttribs.subPatch);

        function move(arr, from, to)
        {
            arr.splice(to, 0, arr.splice(from, 1)[0]);
        }

        const idx = ports.indexOf(port);
        if (idx + dir >= 0) move(ports, idx, idx + dir);

        for (let i = 0; i < ports.length; i++) ports[i].setUiAttribs({ "order": i });

        const exposeOp = this.getSubPatchOuterOp(port.op.uiAttribs.subPatch);

        if (gui.opParams.op == exposeOp) gui.opParams.show(this.getSubPatchOuterOp(port.op.uiAttribs.subPatch).id);
        exposeOp.emitEvent("portOrderChanged");
        exposeOp.emitEvent("glportOrderChanged");
    }

    getSubPatchExposedPorts(_subid, _dir)
    {
        let foundPorts = [];
        // const ops = this.getAllSubPatchOps(subid);

        // for (let i = 0; i < ops.length; i++)
        // {
        //     if (dir == undefined || dir === PortDir.in)
        //         if (ops[i].portsIn)
        //             for (let j = 0; j < ops[i].portsIn.length; j++)
        //                 if (ops[i].portsIn[j].uiAttribs.expose)foundPorts.push(ops[i].portsIn[j]);

        //     if (dir == undefined || dir === Port.DIR_OUT)
        //         for (let j = 0; j < ops[i].portsOut.length; j++)
        //             if (ops[i].portsOut[j].uiAttribs.expose)foundPorts.push(ops[i].portsOut[j]);
        // }

        // foundPorts = foundPorts.sort(function (a, b) { return (a.uiAttribs.order || 0) - (b.uiAttribs.order || 0); });

        // for (let i = 0; i < foundPorts.length; i++)

        return foundPorts;
    }

    replacePortValues(ops, portName, valueNew, valueOld = undefined)
    {
        ops.forEach((op) =>
        {
            const port = op.getPortByName(portName);
            if (port)
            {
                const value = port.get();
                if (valueOld === undefined)
                {
                    port.set(valueNew);
                }
                else
                {
                    if (value === valueOld) port.set(valueNew);
                }
            }
        });
    }

    highlightExamplePatchOps()
    {
        const patchSummary = gui.getPatchSummary();
        if (patchSummary && patchSummary.exampleForOps && patchSummary.exampleForOps.length > 0)
        {
            const ops = gui.corePatch().ops;
            for (let i = 0; i < ops.length; i++)
                ops[i].setUiAttribs({ "color": null });

            for (let j = 0; j < patchSummary.exampleForOps.length; j++)
            {
                const opz = gui.corePatch().getOpsByObjName(patchSummary.exampleForOps[j]);
                for (let k = 0; k < opz.length; k++)
                {
                    // const opname = opz[k];
                    opz[k].setUiAttribs({ "color": "#5dc0fd" });
                }
            }
        }
    }

    warnLargestPort()
    {
        let max = 0;
        let maxName = "unknown";
        let ser = "";
        let maxValue = "";
        let maxId = "";

        try
        {
            for (const i in this._p.ops)
            {
                for (let j in this._p.ops[i].portsIn)
                {
                    if (this._p.ops[i].portsIn[j].uiAttribs.ignoreBigPort) continue;
                    ser = JSON.stringify(this._p.ops[i].portsIn[j].getSerialized());
                    if (ser.length > max)
                    {
                        max = ser.length;
                        maxValue = ser;
                        maxName = this._p.ops[i].name + " - in: " + this._p.ops[i].portsIn[j].name;
                        maxId = this._p.ops[i].id;
                    }
                }
                for (let j in this._p.ops[i].portsOut)
                {
                    if (this._p.ops[i].portsOut[j].uiAttribs.ignoreBigPort) continue;
                    ser = JSON.stringify(this._p.ops[i].portsOut[j].getSerialized());
                    if (ser.length > max)
                    {
                        max = ser.length;
                        maxValue = ser;
                        maxName = this._p.ops[i].name + " - out: " + this._p.ops[i].portsOut[j].name;
                        maxId = this._p.ops[i].id;
                    }
                }
            }

            if (max > 10000)
            {
                const txt = "warning big port: " + maxName + " / " + max + " chars";
                notify(txt);
                this._log.log(txt);
            }
        }
        catch (e)
        {
            // TEST GIT SHIT
            this._log.error(e);
        }
        finally
        {

        }
    }

    updateBlueprints(blueprintOps = [])
    {
        blueprintOps.forEach((blueprintOp) =>
        {
            blueprintOp.updateBlueprint();
        });
    }

    /**
     * @param {string} opid
     */
    focusOpAnim(opid)
    {
        this._patchRenderer.focusOpAnim(opid);
    }

    getPatchOpsUsedInPatch()
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        return ops.filter((op) =>
        {
            return namespace.isPatchOp(op.objName);
        });
    }

    getUserOpsUsedInPatch()
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        return ops.filter((op) =>
        {
            return namespace.isUserOp(op.objName);
        });
    }

}
