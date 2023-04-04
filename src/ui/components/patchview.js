import ele from "../utils/ele";
import Logger from "../utils/logger";
import PatchSaveServer from "../api/patchServerApi";
import { notify, notifyError } from "../elements/notification";
import gluiconfig from "../glpatch/gluiconfig";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";
import SuggestPortDialog from "./suggestionportdialog";
import text from "../text";
import userSettings from "./usersettings";
import Gui from "../gui";
import undo from "../utils/undo";
import SuggestionDialog from "./suggestiondialog";
import opCleaner from "./cleanops";
import defaultops from "../defaultops";

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

        corepatch.addEventListener("onLink", this._portValidate.bind(this));
        corepatch.addEventListener("onUnLink", this._portValidate.bind(this));

        corepatch.addEventListener("onLink", this.refreshCurrentOpParamsByPort.bind(this));
        corepatch.addEventListener("onUnLink", this.refreshCurrentOpParamsByPort.bind(this));

        corepatch.addEventListener("onOpAdd", this._onAddOpHistory.bind(this));
        corepatch.addEventListener("onOpDelete", this._onDeleteOpUndo.bind(this));

        corepatch.addEventListener("onOpAdd", this.setUnsaved.bind(this));
        corepatch.addEventListener("onOpDelete", this.setUnsaved.bind(this));
        corepatch.addEventListener("onLink", this.setUnsaved.bind(this));
        corepatch.addEventListener("onUnLink", this.setUnsaved.bind(this));
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

        gui.setProject(proj);
        this._patchRenderer.setProject(proj);

        this.store.setServerDate(proj.updated);

        if (gui.isRemoteClient)
        {
            if (cb)cb();
            return;
        }


        gui.serverOps.loadProjectDependencies(proj, () =>
        {
            gui.corePatch().deSerialize(proj);
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
            if (window.gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

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
        if (window.gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

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
        let hadCallback = false;
        setTimeout(() =>
        {
            if (!hadCallback)
            {
                this._log.error("HAD NO loadOpLibs CALLBACK!!!!");
            }
        }, 500);
        gui.serverOps.loadOpLibs(opname, () =>
        {
            hadCallback = true;
            const uiAttribs = {};
            options = options || {};

            if (options.subPatch) uiAttribs.subPatch = options.subPatch;
            if (options.createdLocally) uiAttribs.createdLocally = true;

            if (!uiAttribs.subPatch)uiAttribs.subPatch = this.getCurrentSubPatch();

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
                    op2 = options.linkNewLink.portIn.parent;
                    op1 = options.linkNewLink.portOut.parent;
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
        this.showBookmarkParamsPanel();
    }

    selectAllOpsSubPatch(subPatch, noUnselect)
    {
        for (let i = 0; i < this._p.ops.length; i++)
        {
            if ((this._p.ops[i].uiAttribs.subPatch || 0) == subPatch) this._p.ops[i].uiAttr({ "selected": true });
            else if (!noUnselect) this._p.ops[i].uiAttr({ "selected": false });
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

    showBookmarkParamsPanel()
    {
        let html = "<div class=\"panel bookmarkpanel\">";

        if (gui.longPressConnector.isActive())
        {
            html += gui.longPressConnector.getParamPanelHtml();
        }
        else
        {
            this.checkPatchErrors();

            if (ele.byId("patchsummary")) return;

            const project = gui.project();
            if (project)
            {
                const notCollab = !gui.user.isPatchOwner && !project.users.includes(gui.user.id) && !project.usersReadOnly.includes(gui.user.id);
                if (project.isOpExample || notCollab)
                {
                    const projectId = project.shortId || project._id;
                    html += getHandleBarHtml("patch_summary", { "projectId": projectId });
                }
                if (notCollab)
                {
                    html += getHandleBarHtml("clonepatch", {});
                }
            }
            html += gui.bookmarks.getHtml();
        }

        ele.byId(gui.getParamPanelEleId()).innerHTML = html;
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
            if (ops[j].objName.indexOf("Ops.Ui.") == -1)
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
                    ops[i].portsOut[0].isLinked() &&
                    ops[i].portsIn[0].isLinked() &&
                    ops[i].portsOut[0].type == ops[i].portsIn[0].type)
                {
                    const outerIn = ops[i].portsOut[0].links[0].getOtherPort(ops[i].portsOut[0]);
                    const outerOut = ops[i].portsIn[0].links[0].getOtherPort(ops[i].portsIn[0]);

                    ops[i].portsOut[0].removeLinks();
                    ops[i].portsIn[0].removeLinks();

                    ops[i].patch.link(outerIn.parent, outerIn.getName(), outerOut.parent, outerOut.getName());
                }
                // ops[i].unLinkReconnectOthers();
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
        if (window.gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

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


        gui.serverOps.loadOpLibs(opname, () =>
        {
            const selectedOps = this.getSelectedOps();
            const bounds = this.getSelectionBounds();
            const trans = {
                "x": bounds.minx + (bounds.maxx - bounds.minx) / 2,
                "y": bounds.miny };

            // let opname = defaultops.defaultOpNames.subPatch;
            // if (version == 2)opname = defaultops.defaultOpNames.subPatch2;

            console.log("OPNAME", defaultops.defaultOpNames.subPatch);
            console.log("OPNAME", defaultops.defaultOpNames.subPatch2);

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
                            const otherOp = otherPort.parent;
                            if (otherOp.uiAttribs.subPatch != patchId)
                            {
                                theOp.portsIn[j].links[k].remove();
                                k--;

                                if (found)
                                {
                                    this._p.link(
                                        otherPort.parent,
                                        otherPort.getName(),
                                        patchOp,
                                        found);
                                }
                                else
                                {
                                    this._p.link(
                                        otherPort.parent,
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
                                    const otherOpOut = otherPortOut.parent;
                                    if (otherOpOut.uiAttribs.subPatch != patchId)
                                    {
                                        theOp.portsOut[j].links[k].remove();
                                        this._p.link(
                                            otherPortOut.parent,
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
            if (ops[i].isSubpatchOp() && ops[i].patchId)
                this._cachedSubpatchNames[ops[i].patchId.get()] = ops[i].name;

        if (this._cachedSubpatchNames[subpatch]) return this._cachedSubpatchNames[subpatch];
    }

    getSubpatchPathArray(subId, arr)
    {
        arr = arr || [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].isSubpatchOp() && ops[i].patchId)
            {
                if (ops[i].patchId.get() == subId)
                {
                    let type = "subpatch";
                    if (ops[i].storage && ops[i].storage.blueprint) type = "blueprint_subpatch";

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

    getSubPatches(sort)
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
                    if (foundPatchIds.indexOf(ops[i].uiAttribs.subPatch) == -1) foundPatchIds.push(ops[i].uiAttribs.subPatch);
                }
            }
            if (defaultops.isBlueprintOp(ops[i].objName) && ops[i].uiAttribs)
            {
                foundBlueprints[ops[i].id] = {
                    "opId": ops[i].id,
                    "name": ops[i].uiAttribs.extendTitle,
                    "blueprintSubpatch": ops[i].uiAttribs.blueprintSubpatch
                };
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
                        "name": ops[j].name,
                        "id": foundPatchIds[i]
                    };

                    if (ops[j].storage && ops[j].storage.blueprint)
                    {
                        found = true;
                        o.type = "blueprintSub";
                    }

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
            const blueprint = foundBlueprints[blueprintId];
            const blueprintName = blueprint.name || "loading...";
            subPatches.push({
                "name": "Blueprint: " + blueprintName,
                "id": blueprint.blueprintSubpatch,
                "opId": blueprint.opId,
                "type": "blueprint"
            });
        }

        if (sort) subPatches.sort(function (a, b) { return a.name.localeCompare(b.name); });

        return subPatches;
    }


    subpatchContextMenu(id, el)
    {
        const ids = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs && ops[i].uiAttribs.subPatch == id && ops[i].isSubpatchOp())
            {
                ids.push(ops[i].patchId.get());
            }
        }

        const items = [];
        for (let i = 0; i < ids.length; i++)
        {
            const theId = ids[i];
            items.push({
                "title": "› " + this.getSubPatchName(ids[i]),
                "func": () =>
                {
                    gui.patchView.setCurrentSubPatch(theId);
                }
            });
        }

        items.push({
            "title": "Go to op",
            "func": () =>
            {
                gui.patchView.focusSubpatchOp(id);
            }


        });

        CABLES.contextMenu.show(
            {
                "items": items,
            }, el);
    }

    getSubPatchOuterOp(subPatchId)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            if (op.isSubpatchOp() && op.patchId.get() == subPatchId)
                return op;
        }
    }

    focusSubpatchOp(subPatchId)
    {
        let gotoOp = this.getSubPatchOuterOp(subPatchId);

        let parentSubId = gotoOp.uiAttribs.subPatch;
        if (gotoOp.uiAttribs.blueprintOpId) gotoOp = gotoOp.blueprintOpId;
        this.setCurrentSubPatch(parentSubId, () =>
        {
            this.focus();
            if (gotoOp)
            {
                this.focusOp(gotoOp.id);
                this.centerSelectOp(gotoOp.id);
            }
            else console.log("[focusSubpatchOp] goto op not found");
        });
    }

    updateSubPatchBreadCrumb(currentSubPatch)
    {
        if (currentSubPatch === 0) ele.hide(this._eleSubpatchNav);
        else ele.show(this._eleSubpatchNav);

        const names = this.getSubpatchPathArray(currentSubPatch);

        let str = "<a onclick=\"gui.patchView.setCurrentSubPatch(0)\">Main</a> ";

        for (let i = names.length - 1; i >= 0; i--)
        {
            if (i >= 0) str += "<span class=\"sparrow\">&rsaquo;</span>";
            str += "<a class=\"" + names[i].type + "\" onclick=\"gui.patchView.setCurrentSubPatch('" + names[i].id + "');\">" + names[i].name + "</a>";
        }


        if (names.length > 0 && names[0].type == "blueprint_subpatch")
        {
            this._patchRenderer.greyOut =
            this._patchRenderer.greyOutBlue = true;
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
                if (subpatchId) bpClick = "gui.patchView.setCurrentSubPatch('" + subpatchId + "');CABLES.CMD.UI.centerPatchOps();gui.patchView.showBookmarkParamsPanel()";
            }
            str += "<a style=\"margin:0;\" target=\"_blank\" onclick=\"" + bpClick + "\">" + bpText + "</a>";

            gui.restriction.setMessage("blueprint", "This is a blueprint subpatch, changes will not be saved!");
        }
        else
        {
            gui.restriction.setMessage("blueprint", null);
            this._patchRenderer.greyOutBlue =
            this._patchRenderer.greyOut = false;
        }

        str += "<a style=\"margin-left:5px;\" onclick=\"gui.patchView.subpatchContextMenu('" + currentSubPatch + "',this);\"><span class=\"tt icon icon-triple-dot iconhover info\" style=\"margin: -2px;\"></span></a>";

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
            if (selectedOps[i].isSubpatchOp())
            {
                this.selectAllOpsSubPatch(selectedOps[i].patchId.get(), true);
            }
        }

        selectedOps = this.getSelectedOps();

        for (const i in selectedOps)
        {
            if (selectedOps[i].storage && selectedOps[i].storage.blueprint) continue;
            if (selectedOps[i].uiAttribs.hasOwnProperty("fromNetwork"))
            {
                delete selectedOps[i].uiAttribs.fromNetwork;
            }
            ops.push(selectedOps[i].getSerialized());
            opIds.push(selectedOps[i].id);
        }

        // remove links that are not fully copied...
        for (let i = 0; i < ops.length; i++)
        {
            for (let j = 0; j < ops[i].portsIn.length; j++)
            {
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
                }
            }

            for (let j = 0; j < ops[i].portsOut.length; j++)
            {
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
                }
            }
        }

        const objStr = JSON.stringify({
            "ops": ops
        });
        notify("Copied " + selectedOps.length + " ops");

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

        let json = null;
        try
        {
            json = JSON.parse(str);
        }
        catch (exp)
        {
            notifyError("Paste failed");
            this._log.error(str);
            this._log.error(exp);
        }

        const undoGroup = undo.startGroup();

        if (!json || !json.ops) return;

        let focusSubpatchop = null;
        gui.serverOps.loadProjectDependencies(json, () =>
        {
            // change ids
            json = CABLES.Patch.replaceOpIds(json, oldSub);

            for (const i in json.ops)
                json.ops[i].uiAttribs.pasted = true;

            { // change position of ops to paste
                let minx = Number.MAX_VALUE;
                let miny = Number.MAX_VALUE;

                for (const i in json.ops)
                {
                    if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate && json.ops[i].uiAttribs.subPatch == this.getCurrentSubPatch())
                    {
                        minx = Math.min(minx, json.ops[i].uiAttribs.translate.x);
                        miny = Math.min(miny, json.ops[i].uiAttribs.translate.y);
                    }
                }

                for (const i in json.ops)
                {
                    if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate)
                    {
                        let x = json.ops[i].uiAttribs.translate.x + mouseX - minx;
                        let y = json.ops[i].uiAttribs.translate.y + mouseY - miny;
                        if (userSettings.get("snapToGrid"))
                        {
                            x = gui.patchView.snapOpPosX(x);
                            y = gui.patchView.snapOpPosY(y);
                        }
                        json.ops[i].uiAttribs.translate.x = x;
                        json.ops[i].uiAttribs.translate.y = y;

                        gui.emitEvent(
                            "netOpPos", {
                                "opId": json.ops[i].id,
                                "x": json.ops[i].uiAttribs.translate.x,
                                "y": json.ops[i].uiAttribs.translate.y
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
                    }(json.ops[i].id));
                }
            }
            notify("Pasted " + json.ops.length + " ops");
            gui.corePatch().deSerialize(json, false);
            this.isPasting = false;

            if (focusSubpatchop) this.patchRenderer.focusOpAnim(focusSubpatchop.id);
            next(json.ops, focusSubpatchop);
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

    //             if (ops.indexOf(otherPort.parent) == -1) return;

    //             let linkIndex = otherPort.links.indexOf(firstLinkedPort.links[i]);
    //             let extraLines = 1;
    //             for (let j = otherPort.parent.portsOut.length - 1; j >= 0; j--)
    //             {
    //                 if (otherPort == otherPort.parent.portsOut[j]) break;
    //                 if (otherPort.parent.portsOut[j].isLinked())extraLines++;
    //             }

    //             changed = true;
    //             if (otherPort.links.length > 1)extraLines++;

    //             let portIndex = otherPort.parent.portsOut.indexOf(otherPort);

    //             this.setTempOpPos(op, otherPort.parent.getTempPosX() + (linkIndex * theOpWidth + portIndex * 30), otherPort.parent.getTempPosY() + extraLines * CABLES.GLUI.glUiConfig.newOpDistanceY);
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
                const pre = op.portsIn[0].links[0].portOut.parent;

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
            new SuggestPortDialog(op2, p, e, (p2n, op2id) =>
            {
                op2 = this._p.getOpById(op2id);

                this._p.link(op1, pid, op2, p2n);
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
                    this._p.link(op2, portnames[i], op1, suggport);
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

            if ((p1.type == CABLES.OP_PORT_TYPE_VALUE && p2.type == CABLES.OP_PORT_TYPE_STRING) ||
                (p2.type == CABLES.OP_PORT_TYPE_VALUE && p1.type == CABLES.OP_PORT_TYPE_STRING))

            {
                if (p2.type == CABLES.OP_PORT_TYPE_VALUE && p1.type == CABLES.OP_PORT_TYPE_STRING)
                {
                    const p = p1;
                    const o = op1;
                    p1 = p2;
                    p2 = p;
                    op1 = op2;
                    op2 = o;
                }

                this.addOp(CABLES.UI.DEFAULTOPNAMES.convertNumberToString, { "onOpAdd": (newOp) =>
                {
                    this._p.link(op1, p1.getName(), newOp, "Number");
                    this._p.link(op2, p2.getName(), newOp, "Result");

                    newOp.setUiAttrib({ "translate": { "x": op2.uiAttribs.translate.x, "y": op2.uiAttribs.translate.y - CABLES.GLUI.glUiConfig.newOpDistanceY } });
                } });
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
            this._patchRenderer.setCurrentSubPatch(subpatch, () =>
            {
                gui.patchView.updateSubPatchBreadCrumb(subpatch);
                if (ele.byId("subpatchlist")) this.showDefaultPanel(); // update subpatchlist because its already visible
                if (next) next();
            });
        }
        else this._log.warn("patchRenderer has no function setCurrentSubPatch");
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
        const op = this._p.getOpById(opid);

        this.focusOp(opid);
        this.setSelectedOpById(opid);
        this.focus();


        // if (op && op.uiAttribs && op.uiAttribs.translate)
        this.centerView(); // op.uiAttribs.translate.x, op.uiAttribs.translate.y
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
        gui.setStateUnsaved({ "subPatch": this.getCurrentSubPatch });
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

        inp.parent.setUiError(id, null);

        if (!inp.isLinked()) return;
        if (inp.uiAttribs.ignoreObjTypeErrors) return;
        if (outp.get() == null) return;
        if (p1.uiAttribs.objType == p2.uiAttribs.objType) return;

        const errorMsg = "Object in port <b>" + inp.name + "</b> is not of type " + inp.uiAttribs.objType;

        // check if both have defined objtype
        if (p1.uiAttribs.objType && p2.uiAttribs.objType && p1.uiAttribs.objType != p2.uiAttribs.objType)
        {
            inp.parent.setUiError(id, errorMsg);
            return;
        }

        // validate by object value
        if (inp.uiAttribs.objType && outp.get())
        {
            if (inp.uiAttribs.objType == "texture" && !(outp.get() instanceof WebGLTexture)) inp.parent.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "geometry" && !(outp.get() instanceof CGL.Geometry)) inp.parent.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "shader" && !(outp.get() instanceof CGL.Shader)) inp.parent.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "element" && !(outp.get() instanceof Element)) inp.parent.setUiError(id, errorMsg);
            // * audio
            if (inp.uiAttribs.objType == "audioBuffer" && !(outp.get() instanceof AudioBuffer)) inp.parent.setUiError(id, errorMsg);
            if (inp.uiAttribs.objType == "audioNode" && !(outp.get() instanceof AudioNode)) inp.parent.setUiError(id, errorMsg);
        }
    }


    refreshCurrentOpParamsByPort(p1, p2)
    {
        if (this.isCurrentOp(p2.parent) || this.isCurrentOp(p1.parent)) gui.opParams.refresh();
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
        return (Math.round(posX / CABLES.UI.uiConfig.snapX) * CABLES.UI.uiConfig.snapX);
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
                html += "All old ports are available in the new op, it should be safe to replace with new version. Make sure you test if it behaves the same, very accurately.<br/><br/>";
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
    }

    replaceOp(opid, newOpObjName, cb = null)
    {
        gui.serverOps.loadOpDependencies(newOpObjName, () =>
        {
            this.addOp(newOpObjName, { "onOpAdd": (newOp) =>
            {
                const origOp = this._p.getOpById(opid);

                this.copyOpInputPorts(origOp, newOp);

                for (let i = 0; i < origOp.portsIn.length; i++)
                {
                    for (let j = 0; j < origOp.portsIn[i].links.length; j++)
                    {
                        const otherPort = origOp.portsIn[i].links[j].getOtherPort(origOp.portsIn[i]);

                        this._p.link(otherPort.parent, otherPort.name.toLowerCase(), newOp, origOp.portsIn[i].name.toLowerCase(), true);
                    }
                }

                for (let i = 0; i < origOp.portsOut.length; i++)
                {
                    for (let j = 0; j < origOp.portsOut[i].links.length; j++)
                    {
                        const otherPort = origOp.portsOut[i].links[j].getOtherPort(origOp.portsOut[i]);
                        this._p.link(otherPort.parent, otherPort.name.toLowerCase(), newOp, origOp.portsOut[i].name.toLowerCase(), true);
                    }
                }

                const oldUiAttribs = JSON.parse(JSON.stringify(origOp.uiAttribs));
                this._p.deleteOp(origOp.id);

                setTimeout(() =>
                {
                    const a = {};
                    for (const i in oldUiAttribs)
                    {
                        if (i == "uierrors") continue;
                        a[i] = oldUiAttribs[i];
                    }
                    newOp.setUiAttrib(a);
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
        if (!op.portsIn[0] || !op.portsOut[0]) return;
        if (op.portsIn[0].isLinked() || op.portsOut[0].isLinked()) return;

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

        if (portIn && portOut && op.portsOut[0]) // && !op.portsIn[0].isLinked()
        {
            if (CABLES.Link.canLink(op.portsIn[0], portOut)) //! portOut.isLinked() &&
            {
                gui.corePatch().link(
                    op,
                    op.portsIn[0].getName(), portOut.parent, portOut.getName()
                );

                gui.corePatch().link(
                    op,
                    op.portsOut[0].getName(), portIn.parent, portIn.getName()
                );

                op.setUiAttrib({ "translate": { "x": x, "y": y } });
            }
            else
            {
                gui.corePatch().link(
                    portIn.parent, portIn.getName(),
                    portOut.parent, portOut.getName());
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
                    p.parent,
                    p.name,
                    sugIn[0].p.parent,
                    sugIn[0].p.name);
                return;
            }

            new SuggestionDialog(sugIn, op2, mouseEvent, null,
                function (sid)
                {
                    gui.corePatch().link(
                        p.parent,
                        p.name,
                        sugIn[sid].p.parent,
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

    resetOpValues(opid)
    {
        const op = this._p.getOpById(opid);
        if (!op)
        {
            this._log.error("reset op values: op not found...", opid);
            return;
        }
        for (let i = 0; i < op.portsIn.length; i++)
            if (op.portsIn[i].defaultValue != null)
                op.portsIn[i].set(op.portsIn[i].defaultValue);

        gui.opParams.show(op);
    }

    getSubPatchIdFromBlueprintOpId(opid)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.blueprintSubpatch && ops[i].id == opid)
                return ops[i].uiAttribs.blueprintSubpatch;
    }


    getAllSubPatchOps(subid)
    {
        const foundOps = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs.subPatch == subid) foundOps.push(ops[i]);
        return foundOps;
    }

    getSubPatchExposedPorts(subid, dir)
    {
        const foundPorts = [];
        const ops = this.getAllSubPatchOps(subid);

        for (let i = 0; i < ops.length; i++)
        {
            if (dir == undefined || dir === CABLES.PORT_DIR_IN)
                for (let j = 0; j < ops[i].portsIn.length; j++)
                    if (ops[i].portsIn[j].uiAttribs.expose)foundPorts.push(ops[i].portsIn[j]);

            if (dir == undefined || dir === CABLES.PORT_DIR_OUT)
                for (let j = 0; j < ops[i].portsOut.length; j++)
                    if (ops[i].portsOut[j].uiAttribs.expose)foundPorts.push(ops[i].portsOut[j]);
        }

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
        const opDocs = gui.opDocs.getOpDocs();

        let found = false;
        for (let j = 0; j < opDocs.length; j++)
        {
            if (gui.project().shortId == opDocs[j].exampleProjectId)
            {
                if (!found)
                {
                    const ops = gui.corePatch().ops;
                    for (let i = 0; i < ops.length; i++)
                        ops[i].setUiAttribs({ "color": null });
                }
                found = true;

                const ops = gui.corePatch().getOpsByObjName(opDocs[j].name);
                for (let i = 0; i < ops.length; i++)
                    ops[i].setUiAttribs({ "color": "#5dc0fd" });
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
            if (!defaultops.isBlueprintOp(op.objName)) return false;
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
                    if (!subpatchOp.isSubpatchOp()) return false;
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
            if (!defaultops.isBlueprintOp(op.objName)) return false;
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
}
