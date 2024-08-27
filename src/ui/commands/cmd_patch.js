import ModalDialog from "../dialogs/modaldialog.js";
import Gui from "../gui.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { notifyError } from "../elements/notification.js";
import AnalyzePatchTab from "../components/tabs/tab_analyze.js";
import OpParampanel from "../components/opparampanel/op_parampanel.js";
import GlOpWatcher from "../components/tabs/tab_glop.js";
import ManageOp from "../components/tabs/tab_manage_op.js";
import defaultOps from "../defaultops.js";
import subPatchOpUtil from "../subpatchop_util.js";

const CABLES_CMD_PATCH = {};
const CMD_PATCH_COMMANDS = [];

const patchCommands =
{
    "commands": CMD_PATCH_COMMANDS,
    "functions": CABLES_CMD_PATCH
};

export default patchCommands;

CABLES_CMD_PATCH.setPatchTitle = () =>
{
    gui.patchView.store.showModalTitleDialog();
};



CABLES_CMD_PATCH.openParamsTab = () =>
{
    const ops = gui.patchView.getSelectedOps();
    if (!ops.length) return;

    const op = gui.patchView.getSelectedOps()[0];
    const id = "params" + CABLES.uuid();

    const tab = new CABLES.UI.Tab(op.name, { "icon": "op", "infotext": "tab_timeline", "padding": true, "singleton": false });
    gui.mainTabs.addTab(tab, true);
    gui.maintabPanel.show(true);
    tab.html("<div id=\"" + id + "\"></div<");

    const opParams = new OpParampanel();

    opParams.setParentElementId(id);
    opParams.show(op);
};

CABLES_CMD_PATCH.clearOpTitles = function ()
{
    let ops = gui.patchView.getSelectedOps();

    if (ops.length == 0)ops = gui.corePatch().ops;

    if (!ops || ops.length == 0) return;

    for (let i = 0; i < ops.length; i++)
    {
        const op = gui.corePatch().getOpById(ops[i].id);
        op.setTitle("");
    }
};



CABLES_CMD_PATCH.selectChilds = function ()
{
    const ops = gui.patchView.getSelectedOps();

    if (!ops || ops.length == 0) return;

    for (let i = 0; i < ops.length; i++)
    {
        const op = gui.corePatch().getOpById(ops[i].id);
        op.selectChilds();
    }

    gui.patchView.showSelectedOpsPanel();
};


CABLES_CMD_PATCH.gotoParentSubpatch = function ()
{
    const names = gui.patchView.getSubpatchPathArray(gui.patchView.getCurrentSubPatch());

    if (names.length == 0) return;
    if (names.length == 1)
    {
        gui.patchView.setCurrentSubPatch(0);
    }
    else
        gui.patchView.setCurrentSubPatch(names[names.length - 1].id);
};

CABLES_CMD_PATCH.selectAllOps = function ()
{
    gui.patchView.selectAllOpsSubPatch(gui.patchView.getCurrentSubPatch());
};

CABLES_CMD_PATCH.deleteSelectedOps = function ()
{
    gui.patchView.deleteSelectedOps();
};

CABLES_CMD_PATCH.reload = function ()
{
    CABLESUILOADER.talkerAPI.send("reload");
};

CABLES_CMD_PATCH.editOp = function (userInteraction = true)
{
    const selops = gui.patchView.getSelectedOps();

    if (selops && selops.length > 0)
    {
        for (let i = 0; i < selops.length; i++) gui.serverOps.edit(selops[i], false, null, userInteraction);
    }
};

CABLES_CMD_PATCH.createVersionSelectedOp = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length == 0) return;

    const opname = ops[0].objName;
    let newOpname = "";
    if (opname.contains("_v"))
    {
        const parts = opname.split("_v");
        newOpname = parts[0] + "_v" + (parseFloat(parts[1]) + 1);
    }
    else newOpname = opname + "_v2";

    gui.serverOps.clone(ops[0].opId, newOpname, () =>
    {
        gui.serverOps.loadOpDependencies(opname, function ()
        {
            gui.patchView.replaceOp(ops[0].id, newOpname);

            CABLES.UI.notify("created op " + newOpname, null, { "force": true });
        });
    });
};

CABLES_CMD_PATCH.cloneSelectedOp = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length > 0) gui.serverOps.cloneDialog(ops[0].objName, ops[0]);
};

CABLES_CMD_PATCH.manageCurrentSubpatchOp = function ()
{
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    new ManageOp(gui.mainTabs, subOuter.opId);
};

CABLES_CMD_PATCH.manageSelectedOp = function (opid)
{
    if (!opid)
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length > 0) opid = ops[0].objName;
    }
    new ManageOp(gui.mainTabs, opid);
};

CABLES_CMD_PATCH.save = function (force, cb)
{
    if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL)
    {
        notifyError("Not allowed");
        return;
    }
    if (gui.jobs().hasJob("projectsave"))
    {
        console.log("already saving...");
        return;
    }

    gui.patchView.store.saveCurrentProject(cb, undefined, undefined, force);

    const ops = gui.savedState.getUnsavedPatchSubPatchOps();

    for (let i = 0; i < ops.length; i++)
    {
        const name = ops[i].op.shortName;
        subPatchOpUtil.updateBluePrint2Attachment(ops[i].op, { "oldSubId": ops[i].subId });
    }
};

CABLES_CMD_PATCH.saveAs = function ()
{
    gui.patchView.store.saveAs();
};

CABLES_CMD_PATCH.createBackup = function ()
{
    CABLES.platform.createBackup();
};

CABLES_CMD_PATCH.clear = function ()
{
    gui.patchView.clearPatch();
};

CABLES_CMD_PATCH.createAreaFromSelection = function ()
{
    gui.patchView.createAreaFromSelection();
};

CABLES_CMD_PATCH.deleteUnusedPatchOps = function ()
{
    const opdocs = gui.opDocs.getAll();
    let text = "";
    let ids = [];

    for (let i = 0; i < opdocs.length; i++)
    {
        if (opdocs[i].name.indexOf("Ops.Patch") == 0)
        {
            const usedOps = gui.corePatch().getOpsByOpId(opdocs[i].id);

            if (ids.indexOf(opdocs[i].id) == -1 && usedOps.length == 0)
            {
                text += "- " + opdocs[i].name + "<br/>";
                ids.push(opdocs[i].id);
                console.log("found patch op", opdocs[i].id);
            }
        }
    }

    if (ids.length === 0)
    {
        new ModalDialog({ "title": "Unused Patch Ops", "text": "No unused patch ops found.", "showOkButton": true });
    }
    else
    {
        // this will open an iframe tab an listen to "opsDeleted" that is sent by the iframe
        const idsParam = ids.join(",");
        const url = CABLES.platform.getCablesUrl() + "/op/delete?ids=" + idsParam + "&iframe=true";
        gui.mainTabs.addIframeTab("Delete Ops", url, { "icon": "ops", "closable": true, "singleton": true, "gotoUrl": CABLES.platform.getCablesUrl() + "/op/delete?ids=" + idsParam }, true);
    }
};

CABLES_CMD_PATCH.createSubPatchOp = function ()
{
    if (!gui.project().allowEdit && gui.patchView.getCurrentSubPatch() == 0)
    {
        new ModalDialog({ "title": "You don't have write access", "showOkButton": true });
        return;
    }

    let suggestedNamespace = defaultOps.getPatchOpsNamespace();
    if (gui.patchView.getCurrentSubPatch() != 0)
    {
        const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
        if (subOuter)
        {
            if (!gui.opDocs.getOpDocByName(subOuter.objName).allowEdit)
            {
                new ModalDialog({ "title": "You don't have write access in this subPatchOp", "showOkButton": true });
                return;
            }


            const parts = subOuter.objName.split(".");

            if (parts.length > 1)
                suggestedNamespace = parts[0] + "." + parts[1] + "." + parts[2] + ".";
        }
    }

    const dialogOptions = {
        "title": "Create operator",
        "shortName": subPatchOpUtil.getAutoName(true),
        "type": "patch",
        "suggestedNamespace": suggestedNamespace,
        "showReplace": false,
        "chooseOpDir": CABLES.platform.frontendOptions.chooseOpDir
    };

    if (gui.patchView.getCurrentSubPatch() != 0)
    {
        const outerOp = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
        if (outerOp)
        {
            const containerName = outerOp.objName;
            dialogOptions.sourceOpName = containerName;
        }
    }

    gui.serverOps.opNameDialog(dialogOptions, (newNamespace, newName, options) =>
    {
        CABLES_CMD_PATCH.createOpFromSelection({ "newOpName": newNamespace + newName, "ignoreNsCheck": true });
    });
};


CABLES_CMD_PATCH.centerOpsInSubpatch = function ()
{
    gui.patchView.centerSubPatchBounds(gui.patchView.getCurrentSubPatch());
};

CABLES_CMD_PATCH.createOpFromSelection = function (options = {})
{
    if (!options.ignoreNsCheck)
    {
        if (gui.patchView.getCurrentSubPatch() != 0)
        {
            const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
            if (subOuter && subOuter.objName.indexOf("Ops.Patch.") != 0)
            {
                CABLES_CMD_PATCH.createSubPatchOp();
                return;
            }
        }
    }


    const origOpsBounds = gui.patchView.getSelectionBounds();
    gui.patchView.patchRenderer.subPatchOpAnimStart(origOpsBounds);

    // setTimeout(() =>
    // {
    const selops = gui.patchView.getSelectedOps();

    let selectedOpIds = gui.patchView.getSelectedOpsIds();
    const newOpname = options.newOpName || subPatchOpUtil.getAutoName();
    const currentSubpatch = gui.patchView.getCurrentSubPatch();
    const loadingModal = gui.startModalLoading("Create Subpatch");

    for (let i = 0; i < selops.length; i++)
    {
        if (selops[i].isSubPatchOp())
        {
            if (selops[i].storage && selops[i].storage.subPatchVer != 2)
            {
                new ModalDialog({ "title": "Can not create subPatchOp", "text": "not possible To create a subpatch op containing old subpatches. ", "showOkButton": true });

                return;
            }
        }
    }

    gui.serverOps.create(newOpname, () =>
    {
        let newselectedOpIds = [];

        for (let i = 0; i < selectedOpIds.length; i++)
        {
            gui.patchView.selectOpId(selectedOpIds[i]);

            const op = gui.corePatch().getOpById(selectedOpIds[i]);
            if (op.isSubPatchOp())
            {
                const newops = gui.corePatch().getSubPatchOps(op.patchId.get(), false);
                for (let j = 0; j < newops.length; j++)
                    newselectedOpIds.push(newops[j].id);
            }
        }


        gui.patchView.createSubPatchFromSelection(2,
            (patchId, OpTempSubpatch) =>
            {
                const portJson = { "ports": [] };
                const oldLinks = [];

                // find ops that are crosslinked...
                // todo: relink somehow ?
                const ops = gui.corePatch().getSubPatchOps(patchId);

                for (let i = 0; i < ops.length; i++)
                {
                    const op = ops[i];
                    for (let j = 0; j < op.portsIn.length; j++)
                    {
                        const portIn = op.portsIn[j];
                        if (portIn.isLinked() && portIn.links[0])
                        {
                            const p2 = portIn.links[0].getOtherPort(portIn);
                            if (p2.op.uiAttribs.subPatch != op.uiAttribs.subPatch)
                            {
                                const pJson = subPatchOpUtil.createBlueprintPortJsonElement(portIn);
                                portJson.ports.push(pJson);
                                portIn.removeLinks();
                                op.setUiAttrib({ "tempSubOldOpId": op.id });
                                oldLinks.push({ "pJson": pJson, "port": p2, "tempSubOldOpId": op.id, "origPortName": portIn.name });
                            }
                        }
                    }
                    for (let j = 0; j < op.portsOut.length; j++)
                    {
                        const portOut = op.portsOut[j];
                        if (portOut.isLinked())
                        {
                            const p2 = portOut.links[0].getOtherPort(portOut);
                            if (p2.op.uiAttribs.subPatch != op.uiAttribs.subPatch)
                            {
                                const pJson = subPatchOpUtil.createBlueprintPortJsonElement(portOut);
                                portJson.ports.push(pJson);
                                portOut.removeLinks();
                                op.setUiAttrib({ "tempSubOldOpId": op.id });
                                oldLinks.push({ "pJson": pJson, "port": p2, "tempSubOldOpId": op.id, "origPortName": portOut.name });
                            }
                        }
                    }
                }

                loadingModal.setTask("Creating blueprint op");

                gui.patchView.addOp(newOpname,
                    {
                        "uiAttribs": {
                            "translate": { "x": origOpsBounds.minX, "y": origOpsBounds.minY }
                        },
                        "onOpAdd": (newOp) =>
                        {
                            subPatchOpUtil.createBlueprint2Op(newOp, OpTempSubpatch, () =>
                            {
                                const src = subPatchOpUtil.generatePortsAttachmentJsSrc(portJson);

                                gui.corePatch().deleteOp(OpTempSubpatch.id);
                                gui.patchView.setCurrentSubPatch(currentSubpatch);

                                loadingModal.setTask("Creating ports...");

                                CABLESUILOADER.talkerAPI.send("opUpdate",
                                    {
                                        "opname": newOpname,
                                        "update": {
                                            "attachments":
                                            {
                                                "att_inc_gen_ports.js": src,
                                                "att_ports.json": JSON.stringify(portJson)
                                            }
                                        }
                                    },
                                    (err, r) =>
                                    {
                                        if (err)
                                        {
                                            // new ModalError({ "title": "opAttachmentSave2 Error/Invalid response from server", "text": "<pre>" + JSON.stringify(err, false, 4) + "</pre>" });
                                            this.showApiError(err);
                                            return;
                                        }

                                        loadingModal.setTask("Execute code");

                                        gui.serverOps.execute(newOpname, (newOps) =>
                                        {
                                            newOp = newOps[0];
                                            const subPatchId = newOp.patchId.get();

                                            // relink outside ports.......
                                            // for (let i = 0; i < oldLinks.length; i++)

                                            // relink inside ports....
                                            const subOps = gui.corePatch().getSubPatchOps(subPatchId, false);
                                            for (let j = 0; j < oldLinks.length; j++)
                                            {
                                                // outer linking
                                                const oldLink = oldLinks[j];
                                                newOp.patch.link(newOp, oldLink.pJson.id, oldLink.port.op, oldLink.port.name);

                                                for (let i = 0; i < subOps.length; i++)
                                                {
                                                    if (subOps[i].uiAttribs.tempSubOldOpId == oldLink.tempSubOldOpId)
                                                    {
                                                        const op = subOps[i];

                                                        let patchInputOP = gui.corePatch().getSubPatch2InnerInputOp(subPatchId);
                                                        const l = newOp.patch.link(patchInputOP, "innerOut_" + oldLink.pJson.id, subOps[i], oldLink.origPortName);

                                                        if (!l)
                                                        {
                                                            let patchOutputOP = gui.corePatch().getSubPatch2InnerOutputOp(subPatchId);
                                                            newOp.patch.link(patchOutputOP, "innerIn_" + oldLink.pJson.id, subOps[i], oldLink.origPortName);
                                                        }
                                                    }
                                                }
                                            }

                                            for (let i = 0; i < subOps.length; i++) subOps[i].setUiAttrib({ "tempSubOldOpId": null });

                                            if (selectedOpIds.length == 0) newOp.setPos(0, 0);
                                            else newOp.setPos(origOpsBounds.minX, origOpsBounds.minY);

                                            gui.patchView.testCollision(newOp);
                                            gui.patchView.setPositionSubPatchInputOutputOps(subPatchId);

                                            if (!gui.savedState.getStateBlueprint(subPatchId))
                                            {
                                                console.log("need so save subpatchop AGAIN");

                                                subPatchOpUtil.updateBluePrint2Attachment(newOp, { "oldSubId": subPatchId,
                                                    "next": () =>
                                                    {
                                                        // console.log("bp", bp);

                                                        // CABLES.CMD.PATCH.save();
                                                    } });
                                            }


                                            gui.patchView.patchRenderer.focusOpAnim(newOp.id);
                                            gui.endModalLoading();
                                            gui.patchView.patchRenderer.subPatchOpAnimEnd(newOp.id);
                                        });
                                    });
                                // });
                            }, { "doNotExecute": true });
                        }
                    });
            },
            { "translate": { "x": 0, "y": 0 } });
    }, false, { "noLoadOp": true });
    // }, 1400);
};

CABLES_CMD_PATCH.createSubPatchFromSelection = function (version)
{
    gui.patchView.createSubPatchFromSelection(version);
};

CABLES_CMD_PATCH.findCommentedOps = function ()
{
    gui.find(":commented");
};

CABLES_CMD_PATCH.findUnconnectedOps = function ()
{
    gui.find(":unconnected");
};

CABLES_CMD_PATCH.findUserOps = function ()
{
    gui.find(":user");
};

CABLES_CMD_PATCH.findOpsUsingExternalAssets = function ()
{
    gui.find(":extassets");
};

CABLES_CMD_PATCH.createFile = function ()
{
    gui.showFileManager(function ()
    {
        gui.fileManager.createFile();
    });
};

CABLES_CMD_PATCH.uploadFile = function ()
{
    if (!window.gui) return;
    const fileElem = document.getElementById("hiddenfileElem");
    if (fileElem) fileElem.click();
};


CABLES_CMD_PATCH.uploadFileDialog = function ()
{
    if (!window.gui || !gui.project()) return;
    const fileElem = document.getElementById("uploaddialog");

    if (!fileElem)
    {
        const html = getHandleBarHtml("dialog_upload", { "patchId": gui.project()._id });

        new ModalDialog({ "html": html });
    }
};

CABLES_CMD_PATCH.uploadFileTab = () =>
{
    const url = CABLES.platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings/upload?iframe=true";
    gui.mainTabs.addIframeTab(
        "Upload File",
        url,
        {
            "icon": "settings",
            "closable": true,
            "singleton": true,
        },
        true);
};

CABLES_CMD_PATCH.showBackups = () =>
{
    const url = CABLES.platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings?iframe=true#versions";
    const gotoUrl = CABLES.platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings#versions";
    gui.mainTabs.addIframeTab(
        "Patch Backups",
        url,
        {
            "icon": "settings",
            "closable": true,
            "singleton": true,
            "gotoUrl": gotoUrl
        },
        true);
};

CABLES_CMD_PATCH.export = function ()
{
    const exporter = new CABLES.UI.Exporter(gui.project(), CABLES.platform.getPatchVersion());
    exporter.show();
};

CABLES_CMD_PATCH.newPatch = function ()
{
    gui.createProject();
};

CABLES_CMD_PATCH.addOpByName = (name) =>
{
    new ModalDialog({
        "prompt": true,
        "title": "Add Op",
        "text": "Enter full op name",
        "promptValue": name,
        "promptOk": (opname) =>
        {
            gui.serverOps.loadOpDependencies(opname, function ()
            {
                gui.patchView.addOp(opname, { "onOpAdd": (op) =>
                {
                    op.setUiAttrib({
                        "translate": {
                            "x": gui.patchView.patchRenderer.viewBox.mousePatchX,
                            "y": gui.patchView.patchRenderer.viewBox.mousePatchY },
                    });
                    if (op)
                    {
                        gui.patchView.focusOp(op.id);
                    }
                } });
            });
        }
    });
};

CABLES_CMD_PATCH.addOp = function (x, y)
{
    gui.opSelect().show({ "x": 0, "y": 0 });
};

CABLES_CMD_PATCH.patchWebsite = function ()
{
    window.open(CABLES.platform.getCablesUrl() + "/p/" + gui.project().shortId || gui.project()._id);
};

CABLES_CMD_PATCH.renameVariable = function (oldname)
{
    new ModalDialog({
        "prompt": true,
        "title": "Rename Variable",
        "text": "Enter a new name for the variable " + oldname,
        "promptValue": oldname,
        "promptOk": (newname) =>
        {
            gui.corePatch().emitEvent("variableRename", oldname, newname);
            gui.corePatch().deleteVar(oldname);
        } });
};

CABLES_CMD_PATCH.createVariable = function (op)
{
    new ModalDialog({
        "prompt": true,
        "title": "New Variable",
        "text": "Enter a name for the new variable",
        "promptValue": "",
        "promptOk": (str) =>
        {
            if (op)
            {
                op.setTitle(str);
                op.varName.set(str);
                gui.opParams.show(op);
            }
        } });
};

CABLES_CMD_PATCH.createVarNumber = function (next)
{
    new ModalDialog({
        "prompt": true,
        "title": "New Variable",
        "text": "Enter a name for the new variable",
        "promptValue": "myNewVar",
        "promptOk": (str) =>
        {
            const opSetter = gui.patchView.addOp(CABLES.UI.DEFAULTOPNAMES.VarSetNumber);
            const opGetter = gui.patchView.addOp(CABLES.UI.DEFAULTOPNAMES.VarGetNumber);

            opSetter.varName.set(str);
            opGetter.varName.set(str);
        } });
};

CABLES_CMD_PATCH.analyze = function (force)
{
    new AnalyzePatchTab();
};

CABLES_CMD_PATCH._createVariable = function (name, p, p2, value, next)
{
    const getsetOp = CABLES.UI.getVarGetterOpNameByType(p.type, p);

    let portName = getsetOp.portName;
    let portNameOut = getsetOp.portNameOut;
    let opSetterName = getsetOp.setter;
    let opGetterName = getsetOp.getter;

    gui.patchView.addOp(opSetterName, { "onOpAdd": (opSetter) =>
    {
        gui.patchView.addOp(opGetterName, { "onOpAdd": (opGetter) =>
        {
            opSetter.uiAttr({ "subPatch": gui.patchView.getCurrentSubPatch() });
            opGetter.uiAttr({ "subPatch": gui.patchView.getCurrentSubPatch() });

            if (p.type != CABLES.OP_PORT_TYPE_FUNCTION)
                opSetter.getPortByName(portName).set(value);

            if (p.direction == CABLES.PORT_DIR_IN)
            {
                p.op.patch.link(opGetter, portName, p.op, p.name);
                if (p2) p2.op.patch.link(opSetter, portNameOut, p2.op, p2.name);
            }
            else
            {
                p.op.patch.link(opSetter, portName, p.op, p.name);
                if (p2) p2.op.patch.link(opGetter, portNameOut, p2.op, p2.name);
            }

            opSetter.varName.set(name);
            opGetter.varName.set(name);

            gui.patchView.setCurrentSubPatch(gui.patchView.getCurrentSubPatch());

            if (next)next(opSetter, opGetter);

            gui.closeModal();
        } });
    } });
};

CABLES_CMD_PATCH.replaceLinkTriggerReceiveExist = function ()
{
    const link = CABLES.UI.OPSELECT.linkNewLink;
    const p = link.portIn;
    const portOut = link.portOut;
    CABLES.UI.OPSELECT.linkNewLink = null;

    gui.opSelect().close();
    gui.closeModal();
    const getsetOp = CABLES.UI.getVarGetterOpNameByType(p.type, p);

    gui.patchView.addOp(
        getsetOp.getter,
        { "onOpAdd": (opGetter) =>
        {
            link.remove();
            p.removeLinks();
            p.op.patch.link(opGetter, getsetOp.portNameOut, p.op, p.name);

            opGetter.uiAttr({
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "translate": {
                    "x": p.op.uiAttribs.translate.x + 20,
                    "y": p.op.uiAttribs.translate.y - 40
                } });
        } });
};

CABLES_CMD_PATCH.createTriggerSendReceiveExist = function ()
{
    const type = CABLES.UI.OPSELECT.linkNewOpToPort.type;
    const p = CABLES.UI.OPSELECT.linkNewOpToPort;

    gui.opSelect().close();
    gui.closeModal();
    const getsetOp = CABLES.UI.getVarGetterOpNameByType(type, p);
    CABLES.UI.OPSELECT.linkNewOpToPort = null;

    let getset = getsetOp.setter;
    if (p.direction == CABLES.PORT_DIR_IN)getset = getsetOp.getter;

    gui.patchView.addOp(
        getset,
        { "onOpAdd": (op) =>
        {
            let off = -40;

            if (p.direction == CABLES.PORT_DIR_IN)
            {
                p.op.patch.link(op, getsetOp.portNameOut, p.op, p.name);
            }
            else
            {
                p.op.patch.link(op, getsetOp.portName, p.op, p.name);
                off *= -1;
            }

            op.uiAttr({
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "translate": {
                    "x": p.op.uiAttribs.translate.x + 20,
                    "y": p.op.uiAttribs.translate.y + off
                } });
        } });
};

CABLES_CMD_PATCH.replaceLinkVariableExist = function ()
{
    const link = CABLES.UI.OPSELECT.linkNewLink;
    const p = link.portIn;
    const portOut = link.portOut;
    CABLES.UI.OPSELECT.linkNewLink = null;

    gui.opSelect().close();
    gui.closeModal();
    const getsetOp = CABLES.UI.getVarGetterOpNameByType(p.type, p);

    gui.patchView.addOp(
        getsetOp.getter,
        { "onOpAdd": (opGetter) =>
        {
            link.remove();
            p.removeLinks();

            p.op.patch.link(opGetter, getsetOp.portName, p.op, p.name);

            opGetter.uiAttr({
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "translate": {
                    "x": p.op.uiAttribs.translate.x + 20,
                    "y": p.op.uiAttribs.translate.y - 40
                } });
        } });
};


CABLES_CMD_PATCH.addLinkReroute = function ()
{
    const link = CABLES.UI.OPSELECT.linkNewLink;
    const p = link.portIn;
    const portOut = link.portOut;
    CABLES.UI.OPSELECT.linkNewLink = null;

    gui.opSelect().close();
    gui.closeModal();
    const getsetOp = defaultOps.getRerouteOp(p.type);

    console.log("getsetOp", getsetOp);
    gui.patchView.addOp(
        getsetOp,
        { "onOpAdd": (opGetter) =>
        {
            const glPatch = gui.patchView.patchRenderer;
            let x = glPatch._lastMouseX;
            let y = glPatch._lastMouseY;

            opGetter.uiAttr({
                "subPatch": gui.patchView.getCurrentSubPatch(),
            });

            setTimeout(
                () =>
                {
                    x = glPatch.snap.snapX(x);
                    y = glPatch.snap.snapY(y);

                    gui.patchView.insertOpInLink(link, opGetter, x, y);
                }, 100);
        } });
};


CABLES_CMD_PATCH.createLinkVariableExist = function (createTrigger = false)
{
    gui.opSelect().close();
    const type = CABLES.UI.OPSELECT.linkNewOpToPort.type;
    const p = CABLES.UI.OPSELECT.linkNewOpToPort;

    gui.closeModal();
    const getsetOp = CABLES.UI.getVarGetterOpNameByType(type, p);
    CABLES.UI.OPSELECT.linkNewOpToPort = null;

    let opFunction = getsetOp.getter;
    let newOpX = p.op.uiAttribs.translate.x + 20;
    let newOpY = p.op.uiAttribs.translate.y - 40;
    if (p.direction === CABLES.PORT_DIR_OUT)
    {
        if (createTrigger)
        {
            opFunction = getsetOp.setTrigger;
        }
        else
        {
            opFunction = getsetOp.setter;
        }
        newOpY = p.op.uiAttribs.translate.y + 40;
    }

    gui.patchView.addOp(
        opFunction,
        { "onOpAdd": (opGetter) =>
        {
            p.removeLinks();
            p.op.patch.link(opGetter, getsetOp.portName, p.op, p.name);

            opGetter.uiAttr({
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "translate": {
                    "x": newOpX,
                    "y": newOpY
                } });
        } });
};

CABLES_CMD_PATCH.replaceLinkVariable = function ()
{
    gui.opSelect().close();
    new ModalDialog({
        "prompt": true,
        "title": "New Variable",
        "text": "Enter a name for the new variable",
        "promptValue": "",
        "promptOk": (str) =>
        {
            const link = CABLES.UI.OPSELECT.linkNewLink;

            const p1 = link.portIn;
            const p2 = link.portOut;
            CABLES.UI.OPSELECT.linkNewLink = null;

            if (p1.direction == CABLES.PORT_DIR_IN)p1.removeLinks();
            else p2.removeLinks();

            link.remove();

            CABLES_CMD_PATCH._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
            {
                getter.uiAttr({ "translate": {
                    "x": p1.op.uiAttribs.translate.x,
                    "y": p1.op.uiAttribs.translate.y - 40
                } });

                setter.uiAttr({ "translate": {
                    "x": p2.op.uiAttribs.translate.x,
                    "y": p2.op.uiAttribs.translate.y + 40
                } });
            });
        } });
};

CABLES_CMD_PATCH.createTriggerSendReceive = () =>
{
    gui.opSelect().close();
    const link = CABLES.UI.OPSELECT.linkNewLink;

    new ModalDialog({
        "prompt": true,
        "title": "New Trigger Send",
        "text": "Enter a name for a new wireless trigger",
        "promptValue": link.portOut.name,
        "promptOk": (str) =>
        {
            const p1 = link.portIn;
            const p2 = link.portOut;
            CABLES.UI.OPSELECT.linkNewLink = null;

            if (p1.direction == CABLES.PORT_DIR_IN)p1.removeLinks();
            else p2.removeLinks();

            link.remove();

            CABLES_CMD_PATCH._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
            {
                getter.uiAttr({
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "translate": {
                        "x": p1.op.uiAttribs.translate.x,
                        "y": p1.op.uiAttribs.translate.y - 40
                    } });

                setter.uiAttr({
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "translate": {
                        "x": p2.op.uiAttribs.translate.x,
                        "y": p2.op.uiAttribs.translate.y + 40
                    } });
            });
        } });
};

CABLES_CMD_PATCH.createAutoVariable = function ()
{
    gui.opSelect().close();
    const p = CABLES.UI.OPSELECT.linkNewOpToPort;

    new ModalDialog({
        "prompt": true,
        "title": "New Variable",
        "text": "Enter a name for the new variable",
        "promptValue": p.name,
        "promptOk": (str) =>
        {
            CABLES_CMD_PATCH._createVariable(str, p, null, p.get(), (setter, getter) =>
            {
                if (!setter.uiAttribs.translate)
                    setter.uiAttr({
                        "subPatch": gui.patchView.getCurrentSubPatch(),
                        "translate": {
                            "x": p.op.uiAttribs.translate.x,
                            "y": p.op.uiAttribs.translate.y + 40
                        } });

                getter.uiAttr({
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "translate": {
                        "x": setter.uiAttribs.translate.x,
                        "y": setter.uiAttribs.translate.y + 40
                    } });
            });
        } });
};

CABLES_CMD_PATCH.addSpaceX = () =>
{
    gui.patchView.addSpaceBetweenOpsX();
};

CABLES_CMD_PATCH.addSpaceY = () =>
{
    gui.patchView.addSpaceBetweenOpsY();
};

CABLES_CMD_PATCH.linkTwoSelectedOps = () =>
{
    if (gui.patchView.getSelectedOps().length != 2)
    {
        console.log("needs 2 selected ops");
        return;
    }

    let a = gui.patchView.getSelectedOps()[0];
    let b = gui.patchView.getSelectedOps()[1];

    if (a.uiAttribs.translate.y > b.uiAttribs.translate.y) gui.patchView.suggestionBetweenTwoOps(b, a);
    else gui.patchView.suggestionBetweenTwoOps(a, b);
};

CABLES_CMD_PATCH.compressOps = () =>
{
    gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps());
};

CABLES_CMD_PATCH.alignOpsLeft = () =>
{
    gui.patchView.alignSelectedOpsVert(gui.patchView.getSelectedOps());
};



CABLES_CMD_PATCH.upGradeOps = function ()
{
    const selops = gui.patchView.getSelectedOps();
    for (let i = 0; i < selops.length; i++)
    {
        const opdoc = gui.opDocs.getOpDocById(selops[i].opId);
        if (opdoc && opdoc.oldVersion && opdoc.newestVersion && opdoc.newestVersion.name)
            gui.patchView.replaceOp(selops[i].id, opdoc.newestVersion.name);
    }
};

CABLES_CMD_PATCH.downGradeOp = function ()
{
    const selops = gui.patchView.getSelectedOps();
    for (let i = 0; i < selops.length; i++)
    {
        gui.patchView.downGradeOp(selops[i].id, selops[i].objName);
    }
};

CABLES_CMD_PATCH.watchGlOp = function ()
{
    new GlOpWatcher(gui.mainTabs);
    gui.maintabPanel.show(true);
};


CABLES_CMD_PATCH.savePatchScreenshot = function ()
{
    gui.patchView.patchRenderer._cgl.saveScreenshot("patchfield_" + performance.now(), () =>
    {
        gui.patchView.patchRenderer._cgl.patch.resume();
    });
};

CABLES_CMD_PATCH.toggleResizable = function ()
{
    const ops = gui.patchView.getSelectedOps();

    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];

        op.setUiAttribs({
            "stretchPorts": !op.uiAttribs.stretchPorts,
            "resizableY": false,
            "resizable": !op.uiAttribs.stretchPorts
        });
    }
};


CABLES_CMD_PATCH.setOpTitle = function ()
{
    const ops = gui.patchView.getSelectedOps();

    if (ops.length != 1)
    {
        console.warn("rename canceled - select one op!");
        return;
    }

    new ModalDialog({
        "prompt": true,
        "title": "Set Title",
        "text": "Enter a title for this op",
        "promptValue": ops[0].name,
        "promptOk": (name) =>
        {
            gui.opParams.setCurrentOpTitle(name);
        } });
};

CABLES_CMD_PATCH.resume = function ()
{
    gui.corePatch().resume();
};

CABLES_CMD_PATCH.pause = function ()
{
    gui.corePatch().pause();
};

CABLES_CMD_PATCH.replaceFilePath = function ()
{
    new ModalDialog({
        "prompt": true,
        "title": "Replace String Values",
        "text": "Search for...",
        "promptValue": "/assets/",
        "promptOk": (srch) =>
        {
            new ModalDialog({
                "prompt": true,
                "title": "Replace String Values",
                "text": "...replace with",
                "promptValue": "/assets/" + gui.project()._id,
                "promptOk": (rplc) =>
                {
                    const ops = gui.corePatch().ops;
                    for (let i = 0; i < ops.length; i++)
                    {
                        for (let j = 0; j < ops[i].portsIn.length; j++)
                        {
                            if (ops[i].portsIn[j].uiAttribs && ops[i].portsIn[j].uiAttribs.display && ops[i].portsIn[j].uiAttribs.display == "file")
                            {
                                console.log("filename:", ops[i].portsIn[j].get());
                                let v = ops[i].portsIn[j].get();

                                if (v) console.log("srch index", v.indexOf(srch));
                                if (v && v.indexOf(srch) == 0)
                                {
                                    console.log("found str!");
                                    v = rplc + v.substring(srch.length);
                                    ops[i].portsIn[j].set(v);
                                    console.log("result filename:", v);
                                }
                            }
                        }
                    }
                } });
        } });
};

CABLES_CMD_PATCH.convertBlueprintToSubpatch = function (blueprint, skipSelection = false)
{
    const patch = gui.corePatch();
    const ops = patch.ops;
    const relevantOps = [];
    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];
        if (op.uiAttribs && op.uiAttribs.blueprintOpId === blueprint.id) relevantOps.push(op);
    }

    let hiddenSubPatchOp = null;
    relevantOps.forEach((op) =>
    {
        if (op.objName && op.isSubPatchOp())
        {
            op.uiAttribs.translate = {
                "x": blueprint.uiAttribs.translate.x,
                "y": blueprint.uiAttribs.translate.y
            };
            op.portsIn.forEach(
                (portIn) =>
                {
                    const bpPort = blueprint.getPortByName(portIn.name);
                    if (!bpPort) return;
                    if (bpPort.isLinked())
                    {
                        bpPort.links.forEach((bpLink) =>
                        {
                            const parent = bpLink.portOut.op;
                            patch.link(parent, bpLink.portOut.name, op, portIn.name);
                        });
                    }
                    else
                    {
                        portIn.set(bpPort.get());
                    }
                });
            op.portsOut.forEach(
                (portOut) =>
                {
                    const bpPort = blueprint.getPortByName(portOut.name);
                    if (!bpPort) return;
                    if (bpPort.isLinked())
                    {
                        bpPort.links.forEach((bpLink) =>
                        {
                            const parent = bpLink.portIn.op;
                            const link = patch.link(op, portOut.name, parent, bpLink.portIn.name);
                        });
                    }
                    else
                    {
                        portOut.set(bpPort.get());
                    }
                });
        }


        if (op.storage) delete op.storage.blueprint;
        delete op.uiAttribs.blueprintOpId;

        if (op.uiAttribs && op.uiAttribs.hidden)
        {
            if (op.objName && op.isSubPatchOp())
            {
                hiddenSubPatchOp = op;
                op.rebuildListeners();
            }

            op.setUiAttrib({ "hidden": false });
        }
    });
    patch.deleteOp(blueprint.id, false, false);
    if (!skipSelection && hiddenSubPatchOp)
    {
        gui.patchView.unselectAllOps();
        gui.patchView.selectOpId(hiddenSubPatchOp.id);
    }
};

CABLES_CMD_PATCH.replaceOp = function ()
{
    new ModalDialog({
        "prompt": true,
        "title": "Replace Ops",
        "text": "Replace selected ops with: Enter full op name",
        "promptOk": (opname) =>
        {
            const ops = gui.patchView.getSelectedOps();
            for (let i = 0; i < ops.length; i++)
            {
                gui.patchView.replaceOp(ops[i].id, opname);
            }
        }
    });
};

CABLES_CMD_PATCH.uncollideOps = function (ops)
{
    let found = true;
    // while (found)

    for (let i = 0; i < gui.corePatch().ops.length; i++)
    {
        const op = gui.corePatch().ops[i];

        if (!op.uiAttribs.translate)
            op.uiAttribs.translate = { "x": 0, "y": 0 };

        for (let j = 0; j < gui.corePatch().ops.length; j++)
        {
            const b = gui.corePatch().ops[j];
            if (b.deleted || b == op) continue;

            while (b.uiAttribs.translate &&
                op.uiAttribs.translate &&
                (op.uiAttribs.translate.x <= b.uiAttribs.translate.x + 50 && op.uiAttribs.translate.x >= b.uiAttribs.translate.x) &&
                op.uiAttribs.translate.y == b.uiAttribs.translate.y)
            {
                op.setUiAttrib({ "translate": { "x": b.uiAttribs.translate.x, "y": b.uiAttribs.translate.y + CABLES.GLUI.glUiConfig.newOpDistanceY } });
                found = true;
            }
        }
    }
};



CABLES_CMD_PATCH.togglePatchLike = (targetElement = null) =>
{
    CABLESUILOADER.talkerAPI.send("toggleFav", {}, (err, res) =>
    {
        if (!err && res.success && targetElement)
        {
            const icon = targetElement.querySelector(".icon");
            if (icon)
            {
                if (res.favstate)
                {
                    icon.classList.remove("icon-heart");
                    icon.classList.add("icon-heart-fill");
                }
                else
                {
                    icon.classList.remove("icon-heart-fill");
                    icon.classList.add("icon-heart");
                }
            }
        }
    });
};

CABLES_CMD_PATCH.cloneSelectedOps = (ops, loadingModal) =>
{
    if (!ops)
    {
        ops = gui.patchView.getSelectedOps();


        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            const opname = op.objName;
            let sanitizedOpName = opname.replaceAll(".", "_");


            let newOpname = "Ops.Patch.P" + gui.patchId + "." + sanitizedOpName;
            newOpname = newOpname.replaceAll(".Ops_", ".");

            const newOpnameNoVer = newOpname.replaceAll("_v", "V");

            let count = 0;
            newOpname = newOpnameNoVer;
            while (gui.opDocs.getOpDocByName(newOpname))
            {
                newOpname = newOpnameNoVer + count;
                count++;
            }
            op.renameopto = newOpname;

            console.log("new renameto name:", newOpname);
        }

        if (ops.length == 0) return;
    }

    loadingModal = loadingModal || gui.startModalLoading("Cloning ops...");


    if (ops.length == 0)
    {
        gui.endModalLoading();
        return;
    }
    const op = ops.pop();
    const opname = op.objName;
    const newOpname = op.renameopto;

    if (gui.opDocs.getOpDocByName(newOpname))
    {
        // that opname was already renamed in list
        gui.patchView.replaceOp(op.id, newOpname);
        CABLES_CMD_PATCH.cloneSelectedOps(ops, loadingModal);
    }
    else
    {
        gui.serverOps.clone(op.opId, newOpname, () =>
        {
            gui.serverOps.loadOpDependencies(opname, function ()
            {
                gui.patchView.replaceOp(op.id, newOpname);

                CABLES.UI.notify("created op " + newOpname, null, { "force": true });

                CABLES_CMD_PATCH.cloneSelectedOps(ops, loadingModal);
            });
        }, { "openEditor": false, "loadingModal": loadingModal });
    }
};

CABLES_CMD_PATCH.renameOp = (opName = null) =>
{
    if (!opName)
    {
        const ops = gui.patchView.getSelectedOps();
        if (!ops.length) return;
        const op = gui.patchView.getSelectedOps()[0];
        opName = op.objName;
    }

    if (CABLES.platform.frontendOptions.opRenameInEditor)
    {
        gui.serverOps.renameDialog(opName);
    }
    else
    {
        gui.serverOps.renameDialogIframe(opName);
    }
};

CMD_PATCH_COMMANDS.push(
    {
        "cmd": "select all ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.selectAllOps,
        "hotkey": "CMD + a"
    },
    {
        "cmd": "delete selected ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.deleteSelectedOps,
        "icon": "trash",
        "hotkey": "DEL"
    },
    {
        "cmd": "reload patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.reload
    },
    {
        "cmd": "save patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.save,
        "icon": "save",
        "hotkey": "[cmd_ctrl]`S`",
        "infotext": "cmd_savepatch"

    },
    {
        "cmd": "save patch as...",
        "category": "patch",
        "func": CABLES_CMD_PATCH.saveAs,
        "icon": "save",
        "hotkey": "[cmd_ctrl][shift]`s`",
    },
    {
        "cmd": "upload file dialog",
        "category": "patch",
        "func": CABLES_CMD_PATCH.uploadFileDialog,
        "icon": "file",
        "frontendOption": "uploadFiles"
    },
    {
        "cmd": "upload file",
        "category": "patch",
        "func": CABLES_CMD_PATCH.uploadFile,
        "icon": "file",
        "frontendOption": "uploadFiles"
    },
    {
        "cmd": "create new file",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createFile,
        "icon": "file",
        "frontendOption": "uploadFiles"
    },
    {
        "cmd": "select child ops",
        "category": "op",
        "func": CABLES_CMD_PATCH.selectChilds
    },
    {
        "cmd": "clear op titles",
        "category": "op",
        "func": CABLES_CMD_PATCH.clearOpTitles
    },
    {
        "cmd": "create subpatch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createSubPatchFromSelection,
        "icon": "subpatch"
    },
    {
        "cmd": "export static html",
        "category": "patch",
        "func": CABLES_CMD_PATCH.export,
        "icon": "download",
        "frontendOption": "showExport"
    },
    {
        "cmd": "show backups",
        "category": "patch",
        "func": CABLES_CMD_PATCH.showBackups,
        "icon": "file",
        "frontendOption": "showPatchBackups"
    },
    {
        "cmd": "create new patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.newPatch,
        "icon": "file"
    },
    {
        "cmd": "add op",
        "category": "patch",
        "func": CABLES_CMD_PATCH.addOp,
        "icon": "op",
        "infotext": "cmd_addop"
    },
    {
        "cmd": "add op by name",
        "category": "patch",
        "func": CABLES_CMD_PATCH.addOpByName,
        "icon": "op"
    },
    {
        "cmd": "edit op",
        "category": "op",
        "func": CABLES_CMD_PATCH.editOp,
        "icon": "edit"
    },
    {
        "cmd": "set title",
        "category": "op",
        "func": CABLES_CMD_PATCH.setOpTitle,
        "icon": "edit"
    },
    {
        "cmd": "toggle op resizable",
        "category": "op",
        "func": CABLES_CMD_PATCH.toggleResizable,
        "icon": "op"
    },
    {
        "cmd": "clear patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.clear
    },
    {
        "cmd": "open patch website",
        "category": "patch",
        "func": CABLES_CMD_PATCH.patchWebsite,
        "icon": "link",
        "frontendOption": "hasCommunity"
    },
    {
        "cmd": "pause patch execution",
        "category": "patch",
        "func": CABLES_CMD_PATCH.pause
    },
    {
        "cmd": "resume patch execution",
        "category": "patch",
        "func": CABLES_CMD_PATCH.resume
    },
    {
        "cmd": "replace file path",
        "category": "patch",
        "func": CABLES_CMD_PATCH.replaceFilePath
    },
    {
        "cmd": "find unconnected ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findUnconnectedOps
    },
    {
        "cmd": "find user ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findUserOps
    },
    {
        "cmd": "find commented ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findCommentedOps
    },
    {
        "cmd": "find external assets",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findOpsUsingExternalAssets
    },
    {
        "cmd": "analyze patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.analyze
    },
    {
        "cmd": "create number variable",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createVarNumber
    },
    {
        "cmd": "create backup",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createBackup
    },
    {
        "cmd": "align ops left",
        "func": CABLES_CMD_PATCH.alignOpsLeft,
        "icon": "align-left"
    },
    {
        "cmd": "compress ops vertically",
        "func": CABLES_CMD_PATCH.compressOps,
        "icon": "list"
    },
    {
        "cmd": "add space x",
        "func": CABLES_CMD_PATCH.addSpaceX,
        "icon": "list"
    },
    {
        "cmd": "add space y",
        "func": CABLES_CMD_PATCH.addSpaceY,
        "icon": "list"
    },
    {
        "cmd": "save patchfield screenshot",
        "func": CABLES_CMD_PATCH.savePatchScreenshot,
        "icon": "image"
    },
    {
        "cmd": "replace ops",
        "func": CABLES_CMD_PATCH.replaceOp,
        "icon": "op"
    },
    {
        "cmd": "link two selected ops",
        "func": CABLES_CMD_PATCH.linkTwoSelectedOps,
        "icon": "op"
    },
    {
        "cmd": "downgrade selected op",
        "func": CABLES_CMD_PATCH.downGradeOp,
        "icon": "op"
    },
    {
        "cmd": "upgrade selected ops",
        "func": CABLES_CMD_PATCH.upGradeOps,
        "icon": "op"
    },
    {
        "cmd": "clone selected ops to patch ops",
        "func": CABLES_CMD_PATCH.cloneSelectedOps,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "clone selected op",
        "func": CABLES_CMD_PATCH.cloneSelectedOp,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "create new version of op",
        "func": CABLES_CMD_PATCH.createVersionSelectedOp,
        "icon": "op"
    },
    {
        "cmd": "manage selected op",
        "func": CABLES_CMD_PATCH.manageSelectedOp,
        "icon": "op"
    },
    {
        "cmd": "go to parent subpatch",
        "func": CABLES_CMD_PATCH.gotoParentSubpatch,
    },
    {
        "cmd": "open params in tab",
        "func": CABLES_CMD_PATCH.openParamsTab,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "point blueprints to local patch",
        "func": CABLES_CMD_PATCH.localizeBlueprints,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "show glop information",
        "func": CABLES_CMD_PATCH.watchGlOp,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "uncollide ops",
        "func": CABLES_CMD_PATCH.uncollideOps,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "toggle patch like",
        "func": CABLES_CMD_PATCH.togglePatchLike,
        "category": "patch"
    },
    {
        "cmd": "create subpatch op",
        "func": CABLES_CMD_PATCH.createSubPatchOp,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "delete unused patch ops",
        "func": CABLES_CMD_PATCH.deleteUnusedPatchOps,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "delete unused patch ops",
        "func": CABLES_CMD_PATCH.deleteUnusedPatchOps,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "center ops in subpatch",
        "func": CABLES_CMD_PATCH.centerOpsInSubpatch,
        "category": "patch",
        "icon": "op"
    },
    {
        "cmd": "set patch title",
        "func": CABLES_CMD_PATCH.setPatchTitle,
        "category": "patch",
        "icon": "edit"
    },
    {
        "cmd": "rename op",
        "func": CABLES_CMD_PATCH.renameOp,
        "category": "op",
        "icon": "op"
    }
);
