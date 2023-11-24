import PatchSaveServer from "../api/patchServerApi";
import defaultops from "../defaultops";
import ModalDialog from "../dialogs/modaldialog";
import { notify, notifyError } from "../elements/notification";
import gluiconfig from "../glpatch/gluiconfig";
import Gui from "../gui";
import text from "../text";
import ele from "../utils/ele";
import { getHandleBarHtml } from "../utils/handlebars";
import Logger from "../utils/logger";
import undo from "../utils/undo";
import opCleaner from "./cleanops";
import { convertPorts, getConverters } from "./converterops";
import SuggestionDialog from "./suggestiondialog";
import SuggestPortDialog from "./suggestionportdialog";
import userSettings from "./usersettings";

export default class PatchView extends CABLES.EventTarget
{
    constructor(corepatch)
    {
        super();

        this._p = corepatch;
        this._log = new Logger("patchview");
        this._element = null;
        this._pvRenderers = {};
        this._patchRenderer = null;
        this._cachedSubpatchNames = {};
        this.isPasting = false;
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

        corepatch.on("onOpAdd", this._onAddOpHistory.bind(this));
        corepatch.on("onOpDelete", this._onDeleteOpUndo.bind(this));

        corepatch.on("onOpAdd", (op) => { if (!undo.paused())gui.savedState.setUnSaved("onOpAdd", op.uiAttribs.subPatch); });
        corepatch.on("onOpDelete", (op) => { if (!undo.paused())gui.savedState.setUnSaved("onOpDelete", op.uiAttribs.subPatch); });
        corepatch.on("onLink", (p1, p2) => { if (!undo.paused())gui.savedState.setUnSaved("onLink", p1.op.uiAttribs.subPatch || p2.op.uiAttribs.subPatch); });
        corepatch.on("onUnLink", (p1, p2) => { if (!undo.paused())gui.savedState.setUnSaved("onUnLink", p1.op.uiAttribs.subPatch || p2.op.uiAttribs.subPatch); });
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

    _onAddOpHistory(op, fromDeserialize)
    {
        if (this._showingNavHelperEmpty)
        {
            this._showingNavHelperEmpty = false;
            ele.hide(ele.byId("patchnavhelperEmpty"));
        }

        if (!fromDeserialize)
        {
            if (!op.uiAttribs) op.uiAttribs = {};
            if (!op.uiAttribs.history) op.uiAttribs.history = {};
            op.uiAttribs.history.createdAt = Date.now();
            op.uiAttribs.history.createdBy = {
                "name": gui.user.usernameLowercase
            };
            op.uiAttribs.history.lastInteractionAt = Date.now();
            op.uiAttribs.history.lastInteractionBy = {
                "name": gui.user.usernameLowercase
            };
        }
    }

    clickSubPatchNav(subPatchId)
    {
        if (gui.patchView.getCurrentSubPatch() == subPatchId)
        {
            const op = gui.patchView.getSubPatchOuterOp(subPatchId);
            if (!op) return;

            gui.patchView.unselectAllOps();
            gui.patchView.selectOpId(op.id);

            gui.patchView.centerSelectOp(op.id);
            gui.patchView.focusOpAnim(op.id);
        }
        else
        {
            gui.patchView.setCurrentSubPatch(subPatchId);
            gui.patchParamPanel.show(true);
        }
    }

    _onDeleteOpUndo(op)
    {
        this.checkPatchErrorsSoon();

        const undofunc = (function (opname, _opid)
        {
            const oldValues = {};
            for (let i = 0; i < op.portsIn.length; i++) oldValues[op.portsIn[i].name] = op.portsIn[i].get();

            undo.add({
                "title": "delete op",
                "context": {
                    opname
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

        if (window.logStartup) logStartup("setProject 1");

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

            gui.timeLine().setTimeLineLength(proj.ui.timeLineLength);
        }

        if (window.logStartup) logStartup("setProject 2");
        gui.setProject(proj);

        if (window.logStartup) logStartup("setProject renderer");

        this._patchRenderer.setProject(proj);
        if (window.logStartup) logStartup("setProject renderer done");

        this.store.setServerDate(proj.updated);

        if (gui.isRemoteClient)
        {
            if (cb)cb();
            return;
        }

        if (window.logStartup) logStartup("loadProjectDependencies...");
        gui.serverOps.loadProjectDependencies(proj, (project) =>
        {
            if (window.logStartup) logStartup("loadProjectDependencies done");

            if (window.logStartup) logStartup("deserialize...");
            gui.corePatch().deSerialize(project);

            if (window.logStartup) logStartup("deserialize done");

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

            if (cb)cb();
        });
    }

    _initListeners()
    {
        document.addEventListener("copy", (e) =>
        {
            if (this._patchRenderer.isFocussed()) this._patchRenderer.copy(e);
            else if (gui.timeLine().isFocussed()) gui.timeLine().copy(e);
        });

        document.addEventListener("paste", (e) =>
        {
            if (window.gui.getRestriction() < gui.RESTRICT_MODE_FULL) return;

            let items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let index in items)
            {
                let item = items[index];
                if (item.kind === "file")
                {
                    let blob = item.getAsFile();
                    CABLES.fileUploader.uploadFile(blob, "paste_" + CABLES.shortId() + "_" + blob.name);
                    return;
                }
            }

            if (this._patchRenderer.isFocussed()) this._patchRenderer.paste(e);
            else if (gui.timeLine().isFocussed()) gui.timeLine().paste(e);
        });

        document.addEventListener("cut",
            (e) =>
            {
                if (this._patchRenderer.isFocussed()) this._patchRenderer.cut(e);
                else if (gui.timeLine().isFocussed()) gui.timeLine().cut(e);
            });
    }

    switch(id)
    {
        const views = document.getElementById("patchviews");

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
        this.boundingRect = PatchView.getElement().getBoundingClientRect();
    }

    hasFocus()
    {
        return this._patchRenderer.isFocussed();
    }


    testCollision(op)
    {
        let found = true;
        while (found)
        {
            found = false;
            for (let j = 0; j < gui.corePatch().ops.length; j++)
            {
                const b = gui.corePatch().ops[j];
                if (b.deleted || b == op) continue;

                if (b.uiAttribs.translate &&
                    op.uiAttribs.translate &&
                    (op.uiAttribs.translate.x <= b.uiAttribs.translate.x + 50 && op.uiAttribs.translate.x >= b.uiAttribs.translate.x) &&
                    op.uiAttribs.translate.y == b.uiAttribs.translate.y)
                {
                    op.setUiAttrib({ "translate": { "x": b.uiAttribs.translate.x, "y": b.uiAttribs.translate.y + CABLES.GLUI.glUiConfig.newOpDistanceY } });
                    found = true;
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
        if (window.gui.getRestriction() < gui.RESTRICT_MODE_FULL) return;

        const ops = CABLES.UI.getOpsForFilename(filename);

        if (ops.length == 0)
        {
            notify("No default op for filetype");
            return;
        }

        const opname = ops[0];
        const uiAttr = { "subPatch": this.getCurrentSubPatch() };

        if (event)
        {
            let coord = { "x": 0, "y": 0 };
            if (this._patchRenderer.screenToPatchCoord)
            {
                const coordArr = this._patchRenderer.screenToPatchCoord(event.clientX, event.clientY);

                coord = { "x": coordArr[0], "y": coordArr[1] };
            }

            coord.x = gui.patchView.snapOpPosX(coord.x, true);
            coord.y = gui.patchView.snapOpPosY(coord.y);

            uiAttr.translate = { "x": coord.x, "y": coord.y };
        }

        gui.serverOps.loadOpDependencies(opname, function ()
        {
            const op = gui.corePatch().addOp(opname, uiAttr);

            for (let i = 0; i < op.portsIn.length; i++)
                if (op.portsIn[i].uiAttribs.display == "file")
                    op.portsIn[i].set(filename);
        });
    }

    addOp(opname, options)
    {
        gui.serverOps.loadOpDependencies(opname, () =>
        {
            const uiAttribs = {};
            options = options || {};

            if (options.subPatch) uiAttribs.subPatch = options.subPatch;
            if (options.createdLocally) uiAttribs.createdLocally = true;

            if (!uiAttribs.subPatch)
            {
                uiAttribs.subPatch = this.getCurrentSubPatch();
            }

            const op = this._p.addOp(opname, uiAttribs);

            if (!op) return;

            this.addBlueprintInfo(op, this.getSubPatchOuterOp(uiAttribs.subPatch));

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
                    if (op.objName == CABLES.UI.DEFAULTOPNAMES.number)
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

    addOpAndLink(opname, opid, portname)
    {
        const oldOp = gui.corePatch().getOpById(opid);
        const trans = {
            "x": oldOp.uiAttribs.translate.x,
            "y": oldOp.uiAttribs.translate.y - CABLES.GLUI.glUiConfig.newOpDistanceY
        };

        gui.patchView.addOp(opname, {
            "onOpAdd": (newOp) =>
            {
                let newPort = newOp.getFirstOutPortByType(oldOp.getPortByName(portname).type);
                if (oldOp.getPortByName(portname).direction == CABLES.PORT_DIR_OUT)
                    newPort = newOp.getFirstInPortByType(oldOp.getPortByName(portname).type);


                gui.corePatch().link(oldOp, portname, newOp, newPort.name);

                newOp.setUiAttrib({
                    "translate": trans,
                    "subPatch": this.getCurrentSubPatch()
                });

                this.testCollision(newOp);
            } });
    }

    showSelectedOpsPanel()
    {
        const numops = this.getSelectedOps().length;

        if (numops > 0)
        {
            const html = getHandleBarHtml(
                "params_ops", {
                    "isDevEnv": CABLES.sandbox.isDevEnv(),
                    "numOps": numops,
                });

            gui.opParams.clear();

            ele.byId(gui.getParamPanelEleId()).innerHTML = html;
            gui.setTransformGizmo(null);
            gui.showInfo(text.patchSelectedMultiOps);
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
        for (let i = 0; i < this._p.ops.length; i++)
        {
            const op = this._p.ops[i];
            if ((op.uiAttribs.subPatch || 0) == subPatch && !op.uiAttribs.selected)
            {
                op.uiAttr({ "selected": true });

                if (op.isSubPatchOp())
                    this.selectAllOpsSubPatch(op.patchId.get(), true);
            }
            else if (!noUnselect) op.uiAttr({ "selected": false });
        }


        this.showSelectedOpsPanel();
    }

    checkPatchOutdated()
    {
        this.hasOldOps = false;

        for (let i = 0; i < this._p.ops.length; i++)
        {
            const doc = gui.opDocs.getOpDocByName(this._p.ops[i].objName);

            if ((doc && doc.oldVersion) || defaultops.isDeprecatedOp(this._p.ops[i].objName))
            {
                this.hasOldOps = true;
                return;
            }
        }
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
        const perf = CABLES.UI.uiProfiler.start("checkpatcherrors");
        const hadErrors = this.hasUiErrors;
        this.hasUiErrors = false;

        if (!this._checkErrorTimeout)
            gui.patchView.checkPatchOutdated(); // first time also check outdated ops..

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

        clearTimeout(this._checkErrorTimeout);

        const elError = ele.byId("nav-item-error");
        const wasHidden = elError.classList.contains("hidden");
        if (this.hasUiErrors || this.hasOldOps)
        {
            ele.show(elError);
        }
        else ele.hide(elError);

        const elIcon = ele.byId("nav-item-error-icon");
        if (this.hasUiErrors) elIcon.style["background-color"] = "red";
        if (!this.hasUiErrors && this.hasOldOps) elIcon.style["background-color"] = "#999";

        if (wasHidden != elError.classList.contains("hidden")) gui.setLayout();

        perf.finish();
        this._checkErrorTimeout = setTimeout(this.checkPatchErrors.bind(this), 5000);
    }


    getSubPatchBounds(subPatch)
    {
        const perf = CABLES.UI.uiProfiler.start("patch.getSubPatchBounds");

        const bounds = {
            "minx": 9999999,
            "maxx": -9999999,
            "miny": 9999999,
            "maxy": -9999999,
        };
        const ops = this._p.ops;

        for (let j = 0; j < ops.length; j++)
            if (ops[j].objName.indexOf("Ops.Ui.") == -1 && ops[j].objName.indexOf("Ops.Dev.Ui.") == -1)
            {
                if (ops[j].uiAttribs && ops[j].uiAttribs.translate)
                    if (ops[j].uiAttribs.subPatch == subPatch)
                    {
                        bounds.minx = Math.min(bounds.minx, ops[j].uiAttribs.translate.x);
                        bounds.maxx = Math.max(bounds.maxx, ops[j].uiAttribs.translate.x);
                        bounds.miny = Math.min(bounds.miny, ops[j].uiAttribs.translate.y);
                        bounds.maxy = Math.max(bounds.maxy, ops[j].uiAttribs.translate.y);
                    }
            }


        perf.finish();

        return bounds;
    }

    getSelectionBounds(minWidth)
    {
        if (minWidth == undefined)minWidth = 100;
        const ops = this.getSelectedOps();
        const bounds = {
            "minx": 9999999,
            "maxx": -9999999,
            "miny": 9999999,
            "maxy": -9999999 };

        for (let j = 0; j < ops.length; j++)
        {
            if (ops[j].uiAttribs && ops[j].uiAttribs.translate)
            {
                bounds.minx = Math.min(bounds.minx, ops[j].uiAttribs.translate.x);
                bounds.maxx = Math.max(bounds.maxx, ops[j].uiAttribs.translate.x + minWidth);
                bounds.miny = Math.min(bounds.miny, ops[j].uiAttribs.translate.y);
                bounds.maxy = Math.max(bounds.maxy, ops[j].uiAttribs.translate.y);
            }
        }

        return bounds;
    }

    getSelectedOps()
    {
        const perf = CABLES.UI.uiProfiler.start("patchview getSelectedOps");
        const ops = [];

        for (let i = 0; i < this._p.ops.length; i++)
            if (this._p.ops[i].uiAttribs.selected)
                ops.push(this._p.ops[i]);

        perf.finish();

        return ops;
    }

    unlinkSelectedOps(firstOnly)
    {
        const undoGroup = undo.startGroup();
        const ops = this.getSelectedOps();
        if (firstOnly)
        {
            for (const i in ops)
            {
                if (ops[i].portsIn.length > 0 &&
                    ops[i].portsOut.length > 0 &&
                    ops[i].portsOut[0].type == ops[i].portsIn[0].type &&
                    (ops[i].portsOut[0].isLinked() || ops[i].portsIn[0].isLinked())
                )
                {
                    let outerIn = [];
                    let outerOut = [];
                    let relink = ops[i].portsOut[0].isLinked() && ops[i].portsIn[0].isLinked();

                    if (relink)
                    {
                        for (let o = 0; o < ops[i].portsIn[0].links.length; o++)
                            outerOut.push(ops[i].portsIn[0].links[o].getOtherPort(ops[i].portsIn[0]));

                        for (let o = 0; o < ops[i].portsOut[0].links.length; o++)
                            outerIn.push(ops[i].portsOut[0].links[o].getOtherPort(ops[i].portsOut[0]));
                    }

                    ops[i].portsOut[0].removeLinks();
                    ops[i].portsIn[0].removeLinks();

                    if (relink)
                    {
                        for (let j = 0; j < outerIn.length; j++)
                            for (let o = 0; o < outerOut.length; o++)
                                ops[i].patch.link(outerIn[j].op, outerIn[j].getName(), outerOut[o].op, outerOut[o].getName());
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
        if (window.gui.getRestriction() < gui.RESTRICT_MODE_FULL) return;

        const undoGroup = undo.startGroup();
        const ids = [];
        const ops = this.getSelectedOps();

        for (let i = 0; i < ops.length; i++) ids.push(ops[i].id);
        for (let i = 0; i < ids.length; i++) this._p.deleteOp(ids[i], true);

        undo.endGroup(undoGroup, "Delete selected ops");
    }

    createAreaFromSelection()
    {
        const selectedOps = this.getSelectedOps();
        const bounds = this.getSelectionBounds();
        const padding = 80;
        const trans = {
            "x": gui.patchView.snapOpPosX(bounds.minx - 0.8 * padding),
            "y": gui.patchView.snapOpPosX(bounds.miny - 0.8 * padding) };

        const areaOp = this._p.addOp(CABLES.UI.DEFAULTOPNAMES.uiArea, {
            "translate": trans,
            "subPatch": this.getCurrentSubPatch(),
            "area": {
                "w": gui.patchView.snapOpPosX(bounds.maxx - bounds.minx + (2.75 * padding)),
                "h": gui.patchView.snapOpPosX(bounds.maxy - bounds.miny + (2 * padding)) } });

        const undofunc = (function (opid)
        {
            undo.add({
                "title": "paste op",
                undo()
                {
                    gui.corePatch().deleteOp(opid, true);
                },
                redo()
                {
                    gui.corePatch().addOp(CABLES.UI.DEFAULTOPNAMES.uiArea, { "translate": trans,
                        "area": {
                            "w": gui.patchView.snapOpPosX(bounds.maxx - bounds.minx + (2.75 * padding)),
                            "h": gui.patchView.snapOpPosX(bounds.maxy - bounds.miny + (2 * padding)) } });
                }
            });
        }(areaOp.id));
    }


    createSubPatchFromSelection(version = 0)
    {
        let opname = defaultops.defaultOpNames.subPatch;
        if (version == 2)opname = defaultops.defaultOpNames.subPatch2;

        gui.serverOps.loadOpDependencies(opname, () =>
        {
            const selectedOps = this.getSelectedOps();
            const bounds = this.getSelectionBounds();
            const trans = {
                "x": bounds.minx + (bounds.maxx - bounds.minx) / 2,
                "y": bounds.miny };

            // let opname = defaultops.defaultOpNames.subPatch;
            // if (version == 2)opname = defaultops.defaultOpNames.subPatch2;

            // console.log("OPNAME", defaultops.defaultOpNames.subPatch);
            // console.log("OPNAME", defaultops.defaultOpNames.subPatch2);

            const patchOp = this._p.addOp(opname, { "translate": trans });
            const patchId = patchOp.patchId.get();

            patchOp.uiAttr({ "translate": trans, "subPatch": this.getCurrentSubPatch(), });

            for (let i in selectedOps) selectedOps[i].setUiAttribs({ "subPatch": patchId });

            if (version < 2)
            {
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
                for (let i = 0; i < selectedOps.length; i++)
                {
                    for (let j = 0; j < selectedOps[i].portsIn.length; j++)
                    {
                        const port1 = selectedOps[i].portsIn[j];
                        const op1 = selectedOps[i];

                        for (let k = 0; k < op1.portsIn[j].links.length; k++)
                        {
                            const port2 = op1.portsIn[j].links[k].getOtherPort(op1.portsIn[j]);
                            const op2 = port2.op;

                            if (op1.uiAttribs.subPatch != op2.uiAttribs.subPatch)
                            {
                                if (op1.uiAttribs.subPatch != patchId)
                                    port2.setUiAttribs({ "expose": true });
                                else
                                    port1.setUiAttribs({ "expose": true });

                                // relinking is lazy and dirty but there is no easy way to rebuild
                                op1.portsIn[j].links[k].remove();
                                gui.corePatch().link(op1, port1.name, op2, port2.name);
                            }
                        }
                    }
                }

                for (let i = 0; i < selectedOps.length; i++)
                {
                    for (let j = 0; j < selectedOps[i].portsOut.length; j++)
                    {
                        const port1 = selectedOps[i].portsOut[j];
                        const op1 = selectedOps[i];

                        for (let k = 0; k < op1.portsOut[j].links.length; k++)
                        {
                            const port2 = op1.portsOut[j].links[k].getOtherPort(op1.portsOut[j]);
                            const op2 = port2.op;

                            if (op1.uiAttribs.subPatch != op2.uiAttribs.subPatch)
                            {
                                // relinking is lazy and dirty but there is no easy way to rebuild
                                op1.portsOut[j].links[k].remove();
                                gui.corePatch().link(op1, port1.name, op2, port2.name);

                                if (op1.uiAttribs.subPatch != patchId)
                                    port2.setUiAttribs({ "expose": true });
                                else
                                    port1.setUiAttribs({ "expose": true });
                            }
                        }
                    }
                }

                this._p.emitEvent("subpatchExpose", this.getCurrentSubPatch());
                this._p.emitEvent("subpatchExpose", patchId);



                setTimeout(() => // timeout is shit but no event when the in/out ops are created from the subpatch op...
                {
                    // set positions of input/output
                    let patchInputOP = this._p.getSubPatchOp(patchId, defaultops.defaultOpNames.subPatchInput2);
                    let patchOutputOP = this._p.getSubPatchOp(patchId, defaultops.defaultOpNames.subPatchOutput2);

                    const b = this.getSubPatchBounds(patchId);

                    if (patchInputOP)patchInputOP.setUiAttribs({ "translate": { "x": b.minx, "y": b.miny - gluiconfig.newOpDistanceY * 2 } });
                    if (patchOutputOP)patchOutputOP.setUiAttribs({ "translate": { "x": b.minx, "y": b.maxy + gluiconfig.newOpDistanceY * 2 } });

                    this._p.emitEvent("subpatchExpose", this.getCurrentSubPatch());
                    this._p.emitEvent("subpatchExpose", patchId);
                }, 100);

                gui.patchView.setCurrentSubPatch(patchId);
            }

            gui.patchView.setCurrentSubPatch(this.getCurrentSubPatch());
            this._p.emitEvent("subpatchCreated");
        });
    }

    getSubPatchName(subpatch)
    {
        if (!subpatch) return "Main";
        if (this._cachedSubpatchNames[subpatch]) return this._cachedSubpatchNames[subpatch];

        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].isSubPatchOp() && ops[i].patchId)
                this._cachedSubpatchNames[ops[i].patchId.get()] = ops[i].name;

        if (this._cachedSubpatchNames[subpatch]) return this._cachedSubpatchNames[subpatch];
    }

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
                    if (ops[i].storage && ops[i].storage.blueprint) type = "blueprint_subpatch";

                    if (ops[i].storage && ops[i].storage.blueprintVer == 2) type = "blueprint_subpatch2";

                    const patchInfo = {
                        "name": ops[i].name,
                        "id": ops[i].patchId.get(),
                        "type": type
                    };
                    if (ops[i].storage && ops[i].storage.blueprint)
                    {
                        patchInfo.blueprintPatchId = ops[i].storage.blueprint.patchId;
                        const bpOp = gui.corePatch().getOpById(ops[i].uiAttribs.blueprintOpId);
                        if (bpOp)
                        {
                            const port = bpOp.getPortByName("subPatchId");
                            if (port && port.get()) patchInfo.blueprintLocalSubpatch = port.get();
                        }
                    }
                    arr.push(patchInfo);
                    if (ops[i].uiAttribs.subPatch !== 0) this.getSubpatchPathArray(ops[i].uiAttribs.subPatch, arr);
                }
            }
        }

        return arr;
    }

    getSubPatchesHierarchy(patchId = 0)
    {
        let sub =
        {
            "title": "Main",
            "id": "0",
            "subPatchId": "0",
            "childs": [],
            "icon": "op"
        };

        if (this.getCurrentSubPatch() == 0)sub.rowClass = "active";

        let subs = [sub];

        if (patchId)
        {
            const subOp = this.getSubPatchOuterOp(patchId);
            if (!subOp) return;
            sub.title = subOp.getTitle();
            sub.subPatchId = patchId;
            sub.id = subOp.id;
            sub.subPatchVer = subOp.storage.subPatchVer || 0;

            if (this.getCurrentSubPatch() == sub.subPatchId) sub.rowClass = "active";
            else sub.rowClass = "";

            if (subOp.storage.blueprintVer || subOp.isInBlueprint2())
            {
                sub.blueprintVer = subOp.storage.blueprintVer;
                sub.icon = "blueprint";
            }
        }

        const ops = this.getAllSubPatchOps(patchId || 0);

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].patchId && ops[i].patchId.get() !== 0)
            {
                sub.childs.push(this.getSubPatchesHierarchy(ops[i].patchId.get()));
            }
            else
            if (ops[i].uiAttribs.bookmarked)
            {
                if (ops[i].objName == "Ops.Ui.Area")
                    sub.childs.push({ "title": ops[i].uiAttribs.comment_title, "icon": "box-select", "id": ops[i].id, "opid": ops[i].id });
                else
                    sub.childs.push({ "title": ops[i].getTitle(), "icon": "bookmark", "id": ops[i].id, "opid": ops[i].id });
            }
        }

        if (patchId == 0) return subs;
        else return sub;
    }

    removeLostSubpatches()
    {
        let countSubs = {};
        let foundSubPatchOps = {};
        const ops = gui.corePatch().ops;

        for (let i = 0; i < ops.length; i++)
        {
            const sub = ops[i].uiAttribs.subPatch || 0;
            if (ops[i].isSubPatchOp())
            {
                foundSubPatchOps[ops[i].patchId.get()] = true;
            }
            countSubs[sub] = countSubs[sub] || 0;
            countSubs[sub]++;
        }


        for (let subid in countSubs)
        {
            // if(countSubs[subid]<=2)
            for (let asub in foundSubPatchOps)
            {
                if (!foundSubPatchOps.hasOwnProperty(subid) && subid != 0)
                {
                    console.warn("found lost subpatch...", subid);
                    if (countSubs[subid] <= 2)
                    {
                        console.warn("deleted lost subpatch! ", subid);
                        for (let i = ops.length - 1; i >= 0; i--)
                        {
                            if (ops[i].uiAttribs.subPatch == subid)
                            {
                                ops[i].patch.deleteOp(ops[i].id);
                            }
                        }
                        countSubs[subid] = 1000;
                    }
                }
            }
        }
    }

    getSubPatches(sort) // flat list
    {
        let foundPatchIds = [];
        const foundBlueprints = {};
        const subPatches = [];
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
                if (ops[i].uiAttribs.subPatch) // && !(ops[i].storage && ops[i].storage.blueprint)
                {
                    // find lost ops, which are in subpatches, but no subpatch op exists for that subpatch..... :(
                    if (foundPatchIds.indexOf(ops[i].uiAttribs.subPatch) === -1) foundPatchIds.push(ops[i].uiAttribs.subPatch);
                }
            }
            if (defaultops.isBlueprintOp(ops[i]) == 1 && ops[i].uiAttribs)
            {
                foundBlueprints[ops[i].id] = ops[i];
            }
        }

        foundPatchIds = CABLES.uniqueArray(foundPatchIds);

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

                    // if (defaultops.isBlueprintOp(ops[j]) == 2)
                    // {
                    o.blueprintVer = ops[j].storage.blueprintVer;
                    // }

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


    // subpatchContextMenu(id, el)
    // {
    //     const ids = [];
    //     const ops = gui.corePatch().ops;
    //     for (let i = 0; i < ops.length; i++)
    //     {
    //         if (ops[i].uiAttribs && ops[i].uiAttribs.subPatch == id && ops[i].isSubPatchOp())
    //         {
    //             ids.push(ops[i].patchId.get());
    //         }
    //     }

    //     const items = [];
    //     for (let i = 0; i < ids.length; i++)
    //     {
    //         const theId = ids[i];
    //         items.push({
    //             "title": "› " + this.getSubPatchName(ids[i]),
    //             "func": () =>
    //             {
    //                 gui.patchView.setCurrentSubPatch(theId);
    //             }
    //         });
    //     }

    //     items.push({
    //         "title": "Go to op",
    //         "func": () =>
    //         {
    //             gui.patchView.focusSubpatchOp(id);
    //         }
    //     });

    //     CABLES.contextMenu.show(
    //         {
    //             "items": items,
    //         }, el);
    // }

    getSubPatchOuterOp(subPatchId)
    {
        return gui.corePatch().getSubPatchOuterOp(subPatchId);
    }

    focusSubpatchOp(subPatchId)
    {
        let gotoOp = this.getSubPatchOuterOp(subPatchId);
        if (!gotoOp) return;
        let parentSubId = gotoOp.uiAttribs.subPatch || 0;
        let gotoOpId = gotoOp.id;
        if (gotoOp.uiAttribs.blueprintOpId) gotoOpId = gotoOp.uiAttribs.blueprintOpId;
        if (gotoOpId)
            this.setCurrentSubPatch(parentSubId, () =>
            {
                this.focus();
                this.focusOp(gotoOpId);
                this.centerSelectOp(gotoOpId);
            });
        else console.warn("[focusSubpatchOp] goto op not found");
    }

    updateSubPatchBreadCrumb(currentSubPatch)
    {
        // this._patchRenderer.greyOutBlue =
        this._patchRenderer.greyOut = false;

        if (currentSubPatch === 0) ele.hide(this._eleSubpatchNav);
        else ele.show(this._eleSubpatchNav);

        const names = this.getSubpatchPathArray(currentSubPatch);

        let str = "<a onclick=\"gui.patchView.setCurrentSubPatch(0)\">Main</a> ";

        for (let i = names.length - 1; i >= 0; i--)
        {
            if (i >= 0) str += "<span class=\"sparrow\">&rsaquo;</span>";
            str += "<a class=\"" + names[i].type + "\" onclick=\"gui.patchView.clickSubPatchNav('" + names[i].id + "');\">" + names[i].name + "</a>";
        }

        if (names.length > 0)
        {
            if (names[0].type == "blueprint_subpatch2")
            {
                // this._patchRenderer.greyOutBlue = true;
            }
            else if (names[0].type == "blueprint_subpatch")
            {
                this._patchRenderer.greyOut = true;
                // this._patchRenderer.greyOutBlue = true;
                let blueprintPatchId = names[0].blueprintPatchId;
                if (!blueprintPatchId)
                {
                    const firstBlueprint = names.find((name) => { return name.blueprintPatchId; });
                    if (firstBlueprint) blueprintPatchId = firstBlueprint.blueprintPatchId;
                }
                let bpText = "<span class=\"icon icon-external\"></span> Open patch";
                let bpClick = "window.open('" + CABLES.sandbox.getCablesUrl() + "/edit/" + blueprintPatchId + "', '_blank');";
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

    clipboardCutOps(e)
    {
        this.clipboardCopyOps(e);
        this.deleteSelectedOps();
    }

    clipboardCopyOps(e)
    {
        let selectedOps = this.getSelectedOps();
        const ops = [];
        const opIds = [];

        for (const i in selectedOps)
        {
            if (selectedOps[i].isSubPatchOp() && !selectedOps[i].isBlueprint2())
            {
                this.selectAllOpsSubPatch(selectedOps[i].patchId.get(), true);
            }
        }

        selectedOps = this.getSelectedOps();

        for (const i in selectedOps)
        {
            if (selectedOps[i].uiAttribs.blueprintSubpatch2)
            {
                // continue;
            }
            if (selectedOps[i].storage && selectedOps[i].storage.blueprint)
            {
                delete selectedOps[i].storage.blueprint;
            }
            if (selectedOps[i].uiAttribs.hasOwnProperty("blueprintOpId"))
            {
                delete selectedOps[i].uiAttribs.blueprintOpId;
            }
            if (selectedOps[i].uiAttribs.hasOwnProperty("fromNetwork"))
            {
                delete selectedOps[i].uiAttribs.fromNetwork;
            }
            ops.push(selectedOps[i].getSerialized());
            opIds.push(selectedOps[i].id);
        }

        let numLinks = 0;

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].storage && ops[i].storage.ref) delete ops[i].storage.ref;
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch2) delete ops[i].uiAttribs.blueprintSubpatch2;
            if (ops[i].uiAttribs && ops[i].uiAttribs.selected) delete ops[i].uiAttribs.selected;

            // remove links that are not fully copied...
            if (ops[i].portsIn)
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
                                if (!CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objIn) || !CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objOut))
                                {
                                    const p = selectedOps[0].patch.getOpById(ops[i].portsIn[j].links[k].objOut).getPort(ops[i].portsIn[j].links[k].portOut);
                                    ops[i].portsIn[j].links[k] = null;
                                    if (p && (p.type === CABLES.OP_PORT_TYPE_STRING || p.type === CABLES.OP_PORT_TYPE_VALUE))
                                    {
                                        ops[i].portsIn[j].value = p.get();
                                    }
                                }
                            }
                        }
                        numLinks += ops[i].portsIn[j].links.length;
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
                            if (!CABLES.UTILS.arrayContains(opIds, ops[i].portsOut[j].links[k].objIn) || !CABLES.UTILS.arrayContains(opIds, ops[i].portsOut[j].links[k].objOut))
                            {
                                const p = selectedOps[0].patch.getOpById(ops[i].portsOut[j].links[k].objOut).getPort(ops[i].portsOut[j].links[k].portOut);
                                ops[i].portsOut[j].links[k] = null;
                                if (p && (p.type === CABLES.OP_PORT_TYPE_STRING || p.type === CABLES.OP_PORT_TYPE_VALUE))
                                {
                                    ops[i].portsOut[j].value = p.get();
                                }
                            }
                        }
                    }
                    numLinks += ops[i].portsOut[j].links.length;
                }
            }
        }





        const objStr = JSON.stringify({
            "ops": ops
        });
        notify("Copied " + ops.length + " ops / " + numLinks + " Links");

        e.clipboardData.setData("text/plain", objStr);
        e.preventDefault();
    }

    clipboardPaste(e, oldSub, mouseX, mouseY, next)
    {
        const currentSubPatch = this.getCurrentSubPatch();

        this.isPasting = true;
        if (e.clipboardData.types.indexOf("text/plain") == -1)
        {
            this._log.error("clipboard not type text");
            notifyError("Paste failed");
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
        }
        catch (exp)
        {
            notifyError("Paste failed");
            this._log.error(str);
            this._log.error(exp);
        }

        const undoGroup = undo.startGroup();

        if (!pastedJson || !pastedJson.ops) return;

        let focusSubpatchop = null;
        gui.serverOps.loadProjectDependencies(pastedJson, (project) =>
        {
            // change ids
            project = CABLES.Patch.replaceOpIds(project, { "parentSubPatchId": oldSub });
            const outerOp = this.getSubPatchOuterOp(currentSubPatch);
            for (const i in project.ops)
            {
                project.ops[i].uiAttribs.pasted = true;
                this.addBlueprintInfo(project.ops[i], outerOp);
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
                        if (userSettings.get("snapToGrid"))
                        {
                            x = gui.patchView.snapOpPosX(x);
                            y = gui.patchView.snapOpPosY(y);
                        }
                        project.ops[i].uiAttribs.translate.x = x;
                        project.ops[i].uiAttribs.translate.y = y;

                        gui.emitEvent(
                            "netOpPos", {
                                "opId": project.ops[i].id,
                                "x": project.ops[i].uiAttribs.translate.x,
                                "y": project.ops[i].uiAttribs.translate.y
                            });
                    }

                    const undofunc = (function (opid)
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
            gui.corePatch().deSerialize(project);
            this.isPasting = false;

            if (focusSubpatchop) this.patchRenderer.focusOpAnim(focusSubpatchop.id);
            next(project.ops, focusSubpatchop);
        });
        undo.endGroup(undoGroup, "Paste");

        this.setCurrentSubPatch(currentSubPatch);
        this.unselectOpsFromOtherSubpatches();
    }


    addSpaceBetweenOpsX()
    {
        const bounds = this.getSelectionBounds(0);
        const ops = gui.patchView.getSelectedOps();
        const centerX = (bounds.minx + bounds.maxx) / 2;
        const undoGroup = undo.startGroup();

        for (let j = 0; j < ops.length; j++)
        {
            const diffX = ops[j].uiAttribs.translate.x - centerX;
            this.setOpPos(ops[j], this.snapOpPosX(centerX + (diffX * 1.2)), ops[j].uiAttribs.translate.y);
        }
        undo.endGroup(undoGroup, "add space x");
    }

    addSpaceBetweenOpsY()
    {
        const bounds = this.getSelectionBounds(0);
        const ops = gui.patchView.getSelectedOps();
        const centerY = (bounds.miny + bounds.maxy) / 2;
        const undoGroup = undo.startGroup();

        for (let j = 0; j < ops.length; j++)
        {
            const diffY = ops[j].uiAttribs.translate.y - centerY;
            this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, this.snapOpPosY(centerY + (diffY * 1.8)));
        }
        undo.endGroup(undoGroup, "add space y");
    }

    compressSelectedOps(ops)
    {
        if (!ops || ops.length === 0) return;


        const undoGroup = undo.startGroup();

        this.saveUndoSelectedOpsPositions(ops);

        // ops.sort(function (a, b) { return a.uiAttribs.translate.y - b.uiAttribs.translate.y; });

        // let y = 0;
        // for (let j = 0; j < ops.length; j++)
        // {
        //     y += ops[j].uiAttribs.translate.y;
        // }
        // y = this.snapOpPosY(y / ops.length);


        // for (let j = 0; j < ops.length; j++)
        // {
        //     y = this.snapOpPosY(y);

        //     this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, y);
        //     this.testCollision(ops[j]);
        // }

        this.cleanOps(ops);

        undo.endGroup(undoGroup, "Compress Ops");
    }


    // _cleanOp(op, ops, theOpWidth)
    // {
    //     let changed = false;

    //     if (op.portsIn[0] && op.hasAnyInLinked())
    //     {
    //         const firstLinkedPort = op.getFirstLinkedInPort();
    //         for (let i = 0; i < firstLinkedPort.links.length; i++)
    //         {
    //             const otherPort = firstLinkedPort.links[i].getOtherPort(firstLinkedPort);

    //             if (ops.indexOf(otherPort.op) == -1) return;

    //             let linkIndex = otherPort.links.indexOf(firstLinkedPort.links[i]);
    //             let extraLines = 1;
    //             for (let j = otherPort.op.portsOut.length - 1; j >= 0; j--)
    //             {
    //                 if (otherPort == otherPort.op.portsOut[j]) break;
    //                 if (otherPort.op.portsOut[j].isLinked())extraLines++;
    //             }

    //             changed = true;
    //             if (otherPort.links.length > 1)extraLines++;

    //             let portIndex = otherPort.op.portsOut.indexOf(otherPort);

    //             this.setTempOpPos(op, otherPort.op.getTempPosX() + (linkIndex * theOpWidth + portIndex * 30), otherPort.op.getTempPosY() + extraLines * CABLES.GLUI.glUiConfig.newOpDistanceY);
    //         }
    //     }

    //     if (this.testCollision(op))changed = true;
    // }

    cleanOps(ops)
    {
        const c = new opCleaner(ops, this.patchRenderer);
        // c.clean();
        //     if (ops.length == 0) return
        //     const entranceOps = [];
        //     const unconnectedOps = [];
        //     const otherOps = [];
        //     let startPosX = ops[0].uiAttribs.translate.x;
        //     let startPosY = ops[0].uiAttribs.translate.y;

        //     let longestOpPorts = 0;

        //     for (let i = 0; i < ops.length; i++)
        //     {
        //         startPosX = Math.min(startPosX, ops[i].uiAttribs.translate.x);
        //         startPosY = Math.min(startPosY, ops[i].uiAttribs.translate.y);

        //         longestOpPorts = Math.max(longestOpPorts, ops[i].portsIn.length);
        //         longestOpPorts = Math.max(longestOpPorts, ops[i].portsOut.length);

        //         this.setTempOpPos(ops[i], ops[i].uiAttribs.translate.x, ops[i].uiAttribs.translate.y);

        //         if (!ops[i].hasAnyInLinked() && ops[i].hasAnyOutLinked())
        //         {
        //             entranceOps.push(ops[i]);
        //             continue;
        //         }

        //         if (ops[i].isInLinkedToOpOutside(ops))
        //         {
        //             entranceOps.push(ops[i]);
        //             continue;
        //         }

        //         if (!ops[i].hasLinks())
        //         {
        //             unconnectedOps.push(ops[i]);
        //             continue;
        //         }
        //         otherOps.push(ops[i]);
        //     }

        //     let theOpWidth = gui.patchView.snapOpPosX((longestOpPorts + 1) * (CABLES.GLUI.glUiConfig.portWidth + CABLES.GLUI.glUiConfig.portPadding));

        //     for (let i = 0; i < ops.length; i++)
        //         this.setTempOpPos(ops[i], startPosX, startPosY);


        // let firstRowX = gui.patchView.snapOpPosX(startPosX);
        // startPosY = gui.patchView.snapOpPosY(startPosY);


        // for (let i = 0; i < entranceOps.length; i++)
        // {
        //     this.setTempOpPos(entranceOps[i], firstRowX, startPosY);
        //     firstRowX = gui.patchView.snapOpPosX(firstRowX + theOpWidth);
        // }

        // for (let i = 0; i < unconnectedOps.length; i++)
        // {
        //     this.setTempOpPos(unconnectedOps[i], firstRowX, startPosY);
        //     firstRowX = gui.patchView.snapOpPosX(firstRowX + theOpWidth);
        // }


        // let count = 0;
        // let found = true;
        // while (count < 100 || found)
        // {
        //     found = false;
        //     count++;
        //     for (let i = 0; i < otherOps.length; i++)
        //         if (this._cleanOp(otherOps[i], ops, theOpWidth))found = true;
        // }

        // for (let i = 0; i < ops.length; i++)
        // {
        //     const op = ops[i];
        //     if (op.uiAttribs.translateTemp)
        //     {
        //         this.setOpPos(op, op.getTempPosX(), op.getTempPosY());
        //         delete op.uiAttribs.translateTemp;
        //     }
        // }

        // console.log(count + "iterations");
    }


    alignSelectedOpsVert(ops)
    {
        if (ops.length == 1)
        {
            const op = ops[0];
            if (op.portsIn[0] && op.portsIn[0].links.length)
            {
                const pre = op.portsIn[0].links[0].portOut.op;

                if (pre.uiAttribs.translate && op.uiAttribs.translate)
                    op.setUiAttrib({ "translate": { "x": pre.uiAttribs.translate.x, "y": op.uiAttribs.translate.y } });
            }
        }

        if (ops.length > 0)
        {
            let j = 0;
            let sum = 0;
            for (j in ops) sum += ops[j].uiAttribs.translate.x;

            let avg = sum / ops.length;

            if (userSettings.get("snapToGrid")) avg = gui.patchView.snapOpPosX(avg);

            for (j in ops) this.setOpPos(ops[j], avg, ops[j].uiAttribs.translate.y);
        }
        return ops;
    }

    alignSelectedOpsHor(ops)
    {
        if (ops.length > 0)
        {
            let j = 0, sum = 0;
            for (j in ops) sum += ops[j].uiAttribs.translate.y;

            let avg = sum / ops.length;

            if (userSettings.get("snapToGrid")) avg = gui.patchView.snapOpPosY(avg);

            for (j in ops) this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, avg);
        }
        return ops;
    }

    // setTempOpPos(op, x, y)
    // {
    //     op.setUiAttribs({ "translateTemp":
    //         {
    //             "x": x,
    //             "y": y
    //         }
    //     });
    // }

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

        op.setUiAttribs({ "translate":
            {
                "x": x,
                "y": y
            }
        });
    }

    saveUndoSelectedOpsPositions(selectedOps)
    {
        const opPositions = [];
        for (let j = 0; j < selectedOps.length; j++)
        {
            const obj = {};
            obj.id = selectedOps[j].id;

            if (!selectedOps[j].uiAttribs) selectedOps[j].uiAttribs = {};
            if (!selectedOps[j].uiAttribs.translate)selectedOps[j].uiAttribs.translate = { "x": 0, "y": 0 };

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

    linkPortToOp(e, opid, pid, op2id)
    {
        let op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(op2id);
        const p = op1.getPort(pid);
        const numFitting = op2.countFittingPorts(p);

        if (numFitting > 1)
        {
            new SuggestPortDialog(op2, p, e, (thePort, newOpId) =>
            {
                console.log("p2n", thePort.id);
                op2 = this._p.getOpById(newOpId);

                this._p.link(op1, pid, op2, thePort.id);
            });
        }
        else
        {
            const fitp = op2.findFittingPort(p);
            if (fitp) this._p.link(op1, pid, op2, fitp.name);
        }
    }

    linkPortsToOp(e, opid, opids, portnames)
    {
        if (!opids || opids.length == 0 || !portnames || portnames.length == 0) return;

        const op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(opids[0]);
        const p = op2.getPort(portnames[0]);
        const numFitting = op1.countFittingPorts(p);


        if (numFitting > 1)
        {
            new SuggestPortDialog(op1, p, e, (suggport) =>
            {
                for (let i = 0; i < portnames.length; i++)
                {
                    op2 = this._p.getOpById(opids[i]);
                    this._p.link(op2, portnames[i], op1, suggport.id);
                }
            });
        }
        else
        {
            const fitp = op1.findFittingPort(p);

            if (fitp)
                for (let i = 0; i < portnames.length; i++)
                {
                    op2 = this._p.getOpById(opids[i]);
                    this._p.link(op2, portnames[i], op1, fitp.name);
                }
        }
    }

    linkPorts(opid, pid, op2id, p2id)
    {
        let op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(op2id);

        if (!op1 || !op2) return;

        {
            // helper number2string auto insert....
            let p1 = op1.getPortByName(pid);
            let p2 = op2.getPortByName(p2id);

            const converters = getConverters(p1, p2);

            if (converters.length > 0)
            {
                convertPorts(p1, p2, converters[0]);
                return;
            }
        }

        this._p.link(op1, pid, op2, p2id);
    }


    centerView(x, y)
    {
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


    getCurrentSubPatch()
    {
        return this._patchRenderer.getCurrentSubPatch();
    }

    serialize(dataUi)
    {
        this._patchRenderer.serialize(dataUi);
    }


    setCurrentSubPatch(subpatch, next)
    {
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

    focusOp(opid)
    {
        if (this._patchRenderer.focusOp) this._patchRenderer.focusOp(opid);
        else this._log.warn("patchRenderer has no function focusOp");
    }

    unselectAllOps()
    {
        this._patchRenderer.unselectAll();
    }

    unselectOpsFromOtherSubpatches()
    {
        const ops = this.getSelectedOps();
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs.subPatch != this.getCurrentSubPatch())
                ops[i].setUiAttribs({ "selected": false });
    }

    selectOpId(id)
    {
        this._patchRenderer.selectOpId(id);
    }

    centerSelectOp(opid)
    {
        this.setSelectedOpById(opid);
        this._patchRenderer.viewBox.centerSelectedOps();

        if (gui.patchView.getSelectedOps().length == 1) this.focusOpAnim(gui.patchView.getSelectedOps()[0].id);
        this.focus();
    }

    setSelectedOpById(opid)
    {
        if (this._patchRenderer.setSelectedOpById) this._patchRenderer.setSelectedOpById(opid);
        // else if (this._patchRenderer.selectOpId) this._patchRenderer.selectOpId(opid);
        else this._log.warn("patchRenderer has no function setSelectedOpById");
    }

    selectChilds(id)
    {
        const op = gui.corePatch().getOpById(id);
        op.selectChilds();
    }

    setUnsaved()
    {
        // gui.setStateUnsaved({ "subPatch": this.getCurrentSubPatch });
        gui.savedState.setUnSaved("patchview??", this.getCurrentSubPatch());
    }

    _portValidate(p1, p2)
    {
        if (p1.type != CABLES.OP_PORT_TYPE_OBJECT) return;
        let inp = null;
        let outp = null;

        if (p1.direction === CABLES.PORT_DIR_IN)
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
            if (inp.uiAttribs.objType == "geometry" && !(outp.get() instanceof CGL.Geometry)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "shader" && !(outp.get() instanceof CGL.Shader)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "element" && !(outp.get() instanceof Element)) inp.op.setUiError(id, errorMsg);
            // * audio
            if (inp.uiAttribs.objType == "audioBuffer" && !(outp.get() instanceof AudioBuffer)) inp.op.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "audioNode" && !(outp.get() instanceof AudioNode)) inp.op.setUiError(id, errorMsg);
        }
    }


    refreshCurrentOpParamsByPort(p1, p2)
    {
        if (this.isCurrentOp(p2.op) || this.isCurrentOp(p1.op)) gui.opParams.refresh();
    }

    isCurrentOp(op)
    {
        return gui.opParams.isCurrentOp(op);
    }

    isCurrentOpId(opid)
    {
        return gui.opParams.isCurrentOpId(opid);
    }

    snapOpPosX(posX)
    {
        return (Math.round(posX / CABLES.UI.uiConfig.snapX) * CABLES.UI.uiConfig.snapX) || 1;
    }

    snapOpPosY(posY)
    {
        return Math.round(posY / CABLES.UI.uiConfig.snapY) * CABLES.UI.uiConfig.snapY;
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
            CABLES.UI.notify("op has no versions....");
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
            CABLES.UI.notify("could not downgrade: has no previous version");
        }

        this.unselectAllOps();
    }


    replaceOpCheck(opid, newOpObjName)
    {
        gui.serverOps.loadOpDependencies(newOpObjName, () =>
        {
            this.addOp(newOpObjName, { "onOpAdd": (newOp) =>
            {
                const origOp = this._p.getOpById(opid);

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
            } });
        });
    }

    replaceOp(opid, newOpObjName, cb = null)
    {
        gui.serverOps.loadOpDependencies(newOpObjName, () =>
        {
            this.addOp(newOpObjName, { "onOpAdd": (newOp) =>
            {
                const origOp = this._p.getOpById(opid);
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
                        this._p.link(otherPort.op, otherPort.name.toLowerCase(), newOp, origOp.portsIn[i].name.toLowerCase(), true);
                    }
                }

                for (let i = 0; i < origOp.portsOut.length; i++)
                {
                    for (let j = 0; j < origOp.portsOut[i].links.length; j++)
                    {
                        const otherPort = origOp.portsOut[i].links[j].getOtherPort(origOp.portsOut[i]);
                        this._p.link(otherPort.op, otherPort.name.toLowerCase(), newOp, origOp.portsOut[i].name.toLowerCase(), true);
                    }
                }

                this._p.deleteOp(origOp.id);

                setTimeout(() =>
                {
                    newOp.setUiAttrib(theUiAttribs);
                    this.setCurrentSubPatch(oldUiAttribs.subPatch || 0);
                    if (cb) cb();
                }, 100);
            } });
        });
    }


    tempUnlinkOp()
    {
        if (this._lastTempOP)
        {
            this._lastTempOP.undoUnLinkTemporary();
            this._lastTempOP.setEnabled(true);
            this._lastTempOP = null;
        }
        else
        {
            const op = this.getSelectedOps()[0];
            if (op)
            {
                op.setEnabled(false);
                op.unLinkTemporary();
                this._lastTempOP = op;
            }
        }
    }

    toggleVisibility()
    {
        gui.patchView.element.classList.toggle("hidden");
        gui.patchView.patchRenderer.vizLayer._eleCanvas.classList.toggle("hidden");
        gui.emitEvent("canvasModeChange");
    }

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
        let newPortIn = op.portsIn[0];
        let newPortOut = op.portsOut[0];


        if (op.patchId && op.patchId.get() && op.isSubPatchOp())
        {
            console.log("is subpatch...");
            const portsIn = gui.patchView.getSubPatchExposedPorts(op.patchId.get(), CABLES.PORT_DIR_IN);
            const portsOut = gui.patchView.getSubPatchExposedPorts(op.patchId.get(), CABLES.PORT_DIR_OUT);

            if (!(portsIn[0].type == portsOut[0].type == oldLink.portIn.type)) return false;
            newPortIn = portsIn[0];
            newPortOut = portsOut[0];
        }

        if (!newPortIn || !newPortOut) return;
        if (newPortIn.isLinked() || newPortOut.isLinked()) return;

        let portIn = oldLink.portIn;
        let portOut = oldLink.portOut;

        if (oldLink.p1 && oldLink.p2)
        {
            portIn = oldLink.p1.thePort;
            portOut = oldLink.p2.thePort;

            if (oldLink.p2.thePort.direction == CABLES.PORT_DIR_IN)
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
            if (CABLES.Link.canLink(newPortIn, portOut)) //! portOut.isLinked() &&
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
                gui.corePatch().link(
                    portIn.op, portIn.getName(), portOut.op, portOut.getName());
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

    setSize(x, y, w, h)
    {
        if (this._patchRenderer) this._patchRenderer.setSize(x, y, w, h);
    }

    zoomStep(step)
    {
        this._patchRenderer.zoomStep(step);
    }

    suggestionBetweenTwoOps(op1, op2)
    {
        const mouseEvent = { "clientX": 400, "clientY": 400 };

        const suggestions = [
            {
                "cb": () => { gui.patchView.suggestionBetweenTwoOps(op2, op1); },
                "name": "<span class=\"icon icon-op\"></span>OUT: " + op1.getTitle(),
                "classname": ""
            }];
        if (!op1 || !op2) return;

        for (let j = 0; j < op1.portsOut.length; j++)
        {
            const p = op1.portsOut[j];

            const numFitting = op2.countFittingPorts(p);
            let addText = "...";
            if (numFitting > 0)
            {
                if (numFitting == 1)
                {
                    const p2 = op2.findFittingPort(p);
                    addText = p2.title;
                }

                suggestions.push({
                    p,
                    "name": p.title + "<span class=\"icon icon-arrow-right\"></span>" + addText,
                    "classname": "port_text_color_" + p.getTypeString().toLowerCase()
                });
            }
        }

        if (suggestions.length === 0)
        {
            CABLES.UI.notify("can not link!");
            return;
        }

        const showSuggestions2 = (id) =>
        {
            if (suggestions[id].cb) return suggestions[id].cb();

            const p = suggestions[id].p;
            const sugIn =
            [{
                "cb": () => { gui.patchView.suggestionBetweenTwoOps(op2, op1); },
                "name": "<span class=\"icon icon-op\"></span>IN: " + op2.getTitle(),
                "classname": ""
            }];


            for (let i = 0; i < op2.portsIn.length; i++)
            {
                if (CABLES.Link.canLink(op2.portsIn[i], p))
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

    setOpColor(col)
    {
        const selectedOps = this.getSelectedOps();

        for (let i = 0; i < selectedOps.length; i++)
            if (selectedOps[i].objName == CABLES.UI.DEFAULTOPNAMES.uiArea)
                return selectedOps[i].setUiAttrib({ "color": col });

        for (let i = 0; i < selectedOps.length; i++)
            selectedOps[i].setUiAttrib({ "color": col });
    }

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
            CABLES.UI.undo.add({
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

    getSubPatchIdFromBlueprintOpId(opid)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch && ops[i].id == opid)
                return ops[i].uiAttribs.blueprintSubpatch;
    }

    getBlueprintOpFromBlueprintSubpatchId(bpSubpatchId)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch && ops[i].uiAttribs.blueprintSubpatch == bpSubpatchId)
                return ops[i];
    }



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


    getAllSubPatchOps(subid)
    {
        const foundOps = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch == subid) foundOps.push(ops[i]);
        }
        return foundOps;
    }

    setExposedPortOrder(port, dir)
    {
        const ports = this.getSubPatchExposedPorts(port.op.uiAttribs.subPatch);

        gui.savedState.setUnSaved("exposedPortOrder", port.op.uiAttribs.subPatch);

        function move(arr, from, to)
        {
            arr.splice(to, 0, arr.splice(from, 1)[0]);
        }

        const idx = ports.indexOf(port);
        if (idx + dir >= 0)move(ports, idx, idx + dir);

        for (let i = 0; i < ports.length; i++) ports[i].setUiAttribs({ "order": i });

        const exposeOp = this.getSubPatchOuterOp(port.op.uiAttribs.subPatch);

        if (gui.opParams.op == exposeOp) gui.opParams.show(this.getSubPatchOuterOp(port.op.uiAttribs.subPatch).id);
        exposeOp.emitEvent("portOrderChanged");
        exposeOp.emitEvent("glportOrderChanged");
    }


    getSubPatchExposedPorts(subid, dir)
    {
        let foundPorts = [];
        const ops = this.getAllSubPatchOps(subid);

        for (let i = 0; i < ops.length; i++)
        {
            if (dir == undefined || dir === CABLES.PORT_DIR_IN)
                if (ops[i].portsIn)
                    for (let j = 0; j < ops[i].portsIn.length; j++)
                        if (ops[i].portsIn[j].uiAttribs.expose)foundPorts.push(ops[i].portsIn[j]);

            if (dir == undefined || dir === CABLES.PORT_DIR_OUT)
                for (let j = 0; j < ops[i].portsOut.length; j++)
                    if (ops[i].portsOut[j].uiAttribs.expose)foundPorts.push(ops[i].portsOut[j]);
        }

        foundPorts = foundPorts.sort(function (a, b) { return (a.uiAttribs.order || 0) - (b.uiAttribs.order || 0); });

        // for (let i = 0; i < foundPorts.length; i++)
        // console.log(i, foundPorts[i].title);

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
        if (gui.project().summary && gui.project().summary.exampleForOps && gui.project().summary.exampleForOps.length > 0)
        {
            const ops = gui.corePatch().ops;
            for (let i = 0; i < ops.length; i++)
                ops[i].setUiAttribs({ "color": null });


            for (let j = 0; j < gui.project().summary.exampleForOps.length; j++)
            {
                const opz = gui.corePatch().getOpsByObjName(gui.project().summary.exampleForOps[j]);
                for (let k = 0; k < opz.length; k++)
                {
                    const opname = opz[k];
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

    localizeBlueprints()
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        const relevantOps = ops.filter((op) =>
        {
            if (!defaultops.isBlueprintOp(op)) return false;
            const port = op.getPortByName("externalPatchId");
            if (port)
            {
                const portValue = port.get();
                if (portValue !== gui.patchId && portValue !== gui.project().shortId) return true;
            }
            return false;
        });

        const localizable = [];
        relevantOps.forEach((op) =>
        {
            const port = op.getPortByName("subPatchId");
            if (port && port.get())
            {
                const subpatchExists = ops.some((subpatchOp) =>
                {
                    if (!subpatchOp.isSubPatchOp()) return false;
                    const subpatchPort = subpatchOp.getPortByName("patchId");
                    return subpatchPort && subpatchPort.get() && port.get() === subpatchPort.get();
                });
                if (subpatchExists)
                {
                    localizable.push(op);
                }
            }
        });
        gui.patchView.replacePortValues(localizable, "externalPatchId", gui.project().shortId);
    }

    updateBlueprints(blueprintOps = [])
    {
        blueprintOps.forEach((blueprintOp) =>
        {
            blueprintOp.updateBlueprint();
        });
    }

    focusOpAnim(opid)
    {
        this._patchRenderer.focusOpAnim(opid);
    }

    getBlueprintOpsForSubPatches(subpatchIds, localOnly = false)
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        return ops.filter((op) =>
        {
            if (!defaultops.isBlueprintOp(op)) return false;
            let isLocal = false;
            if (localOnly)
            {
                const patchIdPort = op.getPortByName("externalPatchId");
                if (patchIdPort)
                {
                    const patchId = patchIdPort.get();
                    isLocal = (patchId && ((patchId === gui.project().shortId) || (patchId === gui.project()._id)));
                }
                else
                {
                    return false;
                }
            }
            if (!localOnly || (localOnly && isLocal))
            {
                const port = op.getPortByName("subPatchId");
                if (port)
                {
                    const portValue = port.get();
                    return (portValue && subpatchIds.includes(portValue));
                }
            }
            return false;
        });
    }

    getPatchOpsUsedInPatch()
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        return ops.filter((op) =>
        {
            return defaultops.isPatchOp(op.objName);
        });
    }

    getUserOpsUsedInPatch()
    {
        const patch = gui.corePatch();
        const ops = patch.ops;
        return ops.filter((op) =>
        {
            return defaultops.isUserOp(op.objName);
        });
    }

    addBlueprintInfo(op, outerOp)
    {
        if (!op || !outerOp) return;
        if (outerOp)
        {
            if (outerOp.uiAttribs && outerOp.uiAttribs.blueprintOpId)
            {
                op.uiAttribs.blueprintOpId = outerOp.uiAttribs.blueprintOpId;
            }
            if (outerOp.storage && outerOp.storage.blueprint)
            {
                op.setStorage({ "blueprint": { "patchId": outerOp.storage.blueprint.patchId } });
                // op.storage = op.storage || {};
                // op.storage.blueprint = {
                //     "patchId": outerOp.storage.blueprint.patchId
                // };
            }
        }
        return op;
    }
}
