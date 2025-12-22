import { Logger, ele, TalkerAPI } from "cables-shared-client";
import { Port, utils } from "cables";
import ModalDialog from "../dialogs/modaldialog.js";
import Gui, { gui } from "../gui.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { notify, notifyError, notifyWarn } from "../elements/notification.js";
import AnalyzePatchTab from "../components/tabs/tab_analyze.js";
import Profiler from "../components/tabs/tab_profiler.js";
import OpParampanel from "../components/opparampanel/op_parampanel.js";
import GlOpWatcher from "../components/tabs/tab_glop.js";
import defaultOps from "../defaultops.js";
import subPatchOpUtil from "../subpatchop_util.js";
import gluiconfig from "../glpatch/gluiconfig.js";
import Exporter from "../dialogs/exporter.js";
import opNames from "../opnameutils.js";
import { platform } from "../platform.js";
import { portType } from "../core_constants.js";
import TabDebugger from "../components/tabs/tab_debugger.js";

export { CmdPatch };

const log = new Logger("CMD_PATCH");

class CmdPatch
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {
        return [
            {
                "cmd": "Select all ops",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.selectAllOps,
                "hotkey": "CMD + a"
            },
            {
                "cmd": "Delete selected ops",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.deleteSelectedOps,
                "icon": "trash",
                "hotkey": "DEL"
            },
            {
                "cmd": "Save patch",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.save,
                "icon": "save",
                "hotkey": "[cmd_ctrl]`S`",
                "infotext": "cmd_savepatch"

            },
            {
                "cmd": "Save patch as...",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.saveAs,
                "icon": "save",
                "hotkey": "[cmd_ctrl][shift]`s`",
            },
            {
                "cmd": "Upload file dialog",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.uploadFileDialog,
                "icon": "file",
                "frontendOption": "uploadFiles"
            },
            {
                "cmd": "Upload file",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.uploadFile,
                "icon": "file",
                "frontendOption": "uploadFiles"
            },
            {
                "cmd": "Create new file",
                "category": "patch",
                "func": CmdPatch.createFile,
                "icon": "file",
                "frontendOption": "uploadFiles"
            },
            {
                "cmd": "Select child ops",
                "keybindable": true,
                "category": "op",
                "func": CmdPatch.selectChilds
            },
            {
                "cmd": "Clear op titles",
                "category": "op",
                "func": CmdPatch.clearOpTitles
            },

            /*
     * {
     *     "cmd": "Create subpatch",
     *     "category": "patch",
     *     "func": CmdPatch.createSubPatchFromSelection,
     *     "icon": "subpatch"
     * },
     */
            {
                "cmd": "Export static html",
                "category": "patch",
                "func": CmdPatch.export,
                "icon": "download",
                "frontendOption": "showExport"
            },
            {
                "cmd": "Show backups",
                "category": "patch",
                "func": CmdPatch.showBackups,
                "icon": "file",
                "frontendOption": "showPatchBackups"
            },
            {
                "cmd": "Create new patch",
                "category": "patch",
                "func": CmdPatch.newPatch,
                "icon": "file"
            },
            {
                "cmd": "Reload op",
                "category": "patch",
                "func": CmdPatch.reloadOp,
                "icon": "op",
                "infotext": "cmd_reloadop"
            },
            {
                "cmd": "Add op",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.addOp,
                "icon": "op",
                "infotext": "cmd_addop"
            },
            {
                "cmd": "Add op by name",
                "category": "patch",
                "func": CmdPatch.addOpByName,
                "icon": "op"
            },
            {
                "cmd": "Set title",
                "category": "op",
                "func": CmdPatch.setOpTitle,
                "icon": "edit"
            },
            {
                "cmd": "Toggle op resizable",
                "keybindable": true,
                "category": "op",
                "func": CmdPatch.toggleResizable,
                "icon": "op"
            },
            {
                "cmd": "Clear patch",
                "category": "patch",
                "func": CmdPatch.clear
            },
            {
                "cmd": "Open patch website",
                "category": "patch",
                "func": CmdPatch.patchWebsite,
                "icon": "link",
                "frontendOption": "hasCommunity"
            },
            {
                "cmd": "Pause patch execution",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.pause
            },
            {
                "cmd": "Resume patch execution",
                "keybindable": true,
                "category": "patch",
                "func": CmdPatch.resume
            },
            {
                "cmd": "Replace file path",
                "category": "patch",
                "func": CmdPatch.replaceFilePath
            },
            {
                "cmd": "Find unconnected ops",
                "category": "patch",
                "func": CmdPatch.findUnconnectedOps
            },
            {
                "cmd": "Find user ops",
                "category": "patch",
                "func": CmdPatch.findUserOps
            },
            {
                "cmd": "Find commented ops",
                "category": "patch",
                "func": CmdPatch.findCommentedOps
            },
            {
                "cmd": "Find external assets",
                "category": "patch",
                "func": CmdPatch.findOpsUsingExternalAssets
            },
            {
                "cmd": "Analyze patch",
                "category": "patch",
                "func": CmdPatch.analyze
            },
            {
                "cmd": "Create number variable",
                "category": "patch",
                "func": CmdPatch.createVarNumber
            },
            {
                "cmd": "Create backup",
                "category": "patch",
                "func": CmdPatch.createBackup
            },
            {
                "cmd": "Align ops left",
                "keybindable": true,
                "func": CmdPatch.alignOpsLeft,
                "category": "patch",
                "icon": "align-left"
            },
            {
                "cmd": "Compress ops vertically",
                "func": CmdPatch.compressOps,
                "category": "patch",
                "icon": "list"
            },
            {
                "cmd": "Add space x",
                "keybindable": true,
                "func": CmdPatch.addSpaceX,
                "category": "patch",
                "icon": "list"
            },
            {
                "cmd": "Add space y",
                "keybindable": true,
                "func": CmdPatch.addSpaceY,
                "category": "patch",
                "icon": "list"
            },
            {
                "cmd": "Save patchfield screenshot",
                "func": CmdPatch.savePatchScreenshot,
                "category": "patch",
                "icon": "image"
            },
            {
                "cmd": "Replace ops",
                "func": CmdPatch.replaceOp,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Link two selected ops",
                "keybindable": true,
                "func": CmdPatch.linkTwoSelectedOps,
                "category": "patch",
                "icon": "op"
            },

            {
                "cmd": "Go to parent subpatch",
                "keybindable": true,
                "func": CmdPatch.gotoParentSubpatch,
                "category": "patch",
            },
            {
                "cmd": "Open params in tab",
                "func": CmdPatch.openParamsTab,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Show glop information",
                "func": CmdPatch.watchGlOp,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Uncollide ops",
                "func": CmdPatch.uncollideOps,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Toggle patch like",
                "func": CmdPatch.togglePatchLike,
                "category": "patch"
            },
            {
                "cmd": "Create subpatch op",
                "keybindable": true,
                "func": CmdPatch.createSubPatchOp,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Delete unused patch ops",
                "func": CmdPatch.deleteUnusedPatchOps,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Center ops in subpatch",
                "keybindable": true,
                "func": CmdPatch.centerOpsInSubpatch,
                "category": "patch",
                "icon": "op"
            },
            {
                "cmd": "Set patch title",
                "func": CmdPatch.setPatchTitle,
                "category": "patch",
                "icon": "edit"
            },
            {
                "cmd": "Auto position subpatch input output ops",
                "func": CmdPatch.autoPosSubpatchInputOutputOps,
                "category": "op",
                "icon": "op"
            },
            {
                "cmd": "Reload patch",
                "category": "patch",
                "func": CmdPatch.reload
            },
            {
                "cmd": "Patch Profiler",
                "keybindable": true,
                "category": "patch",
                "icon": "pie-chart",
                "func": CmdPatch.patchProfiler
            },
            {
                "cmd": "Patch Debugger",
                "keybindable": true,
                "category": "patch",
                "icon": "list",
                "func": CmdPatch.patchDebugger
            }

        ];

    }

    static setPatchTitle()
    {
        gui.patchView.store.showModalTitleDialog();
    }

    static openParamsTab()
    {
        const ops = gui.patchView.getSelectedOps();
        if (!ops.length) return;

        const op = gui.patchView.getSelectedOps()[0];
        const id = "params" + utils.uuid();

        const tab = new CABLES.UI.Tab(op.name, { "icon": "op", "infotext": "tab_timeline", "padding": true, "singleton": false });
        gui.mainTabs.addTab(tab, true);
        gui.maintabPanel.show(true);
        tab.html("<div id=\"" + id + "\"></div<");

        const opParams = new OpParampanel();

        opParams.setParentElementId(id);
        opParams.show(op);
    }

    static clearOpTitles()
    {
        let ops = gui.patchView.getSelectedOps();

        if (ops.length == 0)ops = gui.corePatch().ops;

        if (!ops || ops.length == 0) return;

        for (let i = 0; i < ops.length; i++)
        {
            const op = gui.corePatch().getOpById(ops[i].id);
            op.setTitle("");
        }
    }

    static selectChilds()
    {
        const ops = gui.patchView.getSelectedOps();

        if (!ops || ops.length == 0) return;

        for (let i = 0; i < ops.length; i++)
        {
            const op = gui.corePatch().getOpById(ops[i].id);
            op.selectChilds();
        }

        gui.patchView.showSelectedOpsPanel();
    }

    static autoPosSubpatchInputOutputOps()
    {
        const sub = gui.patchView.getCurrentSubPatch();
        if (!sub) return;
        gui.patchView.setPositionSubPatchInputOutputOps(sub);
    }

    static gotoParentSubpatch()
    {
        const names = gui.patchView.getSubpatchPathArray(gui.patchView.getCurrentSubPatch());

        if (names.length == 0) return;
        if (names.length == 1) gui.patchView.setCurrentSubPatch(0, null);
        else gui.patchView.setCurrentSubPatch(names[names.length - 1].id, null);
    }

    static selectAllOps()
    {
        gui.patchView.selectAllOpsSubPatch(gui.patchView.getCurrentSubPatch());
    }

    static deleteSelectedOps()
    {
        gui.patchView.deleteSelectedOps();
    }

    static reload()
    {
        platform.talkerAPI.send(TalkerAPI.CMD_RELOAD_PATCH);
    }

    static save(force, cb)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL)
        {
            notifyError("Not allowed");
            return;
        }
        if (platform.isSaving())
        {
            notifyWarn("already saving...");
            console.log("already saving...");
            return;
        }
        const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
        if (subOuter)
        {
            const bp = subOuter.isBlueprint2() || subOuter.isInBlueprint2();
            if (bp)
            {
                gui.showLoadingProgress(true);

                subPatchOpUtil.updateSubPatchOpAttachment(gui.patchView.getSubPatchOuterOp(bp),
                    {
                        "oldSubId": bp,
                        "next": () =>
                        {
                            if (!gui.savedState.getStateBlueprint(0)) gui.patchView.store.saveCurrentProject(cb, force);
                        }
                    });
            }
            else gui.patchView.store.saveCurrentProject(cb, force);
        }
        else gui.patchView.store.saveCurrentProject(cb, force);

    }

    static saveAs()
    {
        gui.patchView.store.saveAs();
    }

    static createBackup()
    {
        platform.createBackup();
    }

    static clear()
    {
        gui.patchView.clearPatch();
    }

    static createAreaFromSelection()
    {
        gui.patchView.createAreaFromSelection();
    }

    static deleteUnusedPatchOps()
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
                    log.log("found patch op", opdocs[i].id);
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
            const url = platform.getCablesUrl() + "/op/delete?ids=" + idsParam + "&iframe=true";
            gui.mainTabs.addIframeTab("Delete Ops", url, { "icon": "ops", "closable": true, "singleton": true, "gotoUrl": platform.getCablesUrl() + "/op/delete?ids=" + idsParam }, true);
        }
    }

    static centerOpsInSubpatch()
    {
        gui.patchView.centerSubPatchBounds(gui.patchView.getCurrentSubPatch());
    }

    static createOpFromSelection(options = {})
    {
        if (!options.ignoreNsCheck)
        {
            if (gui.patchView.getCurrentSubPatch() != 0)
            {
                const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
                if (subOuter && subOuter.objName.indexOf("Ops.Patch.") != 0)
                {
                    CmdPatch.createSubPatchOp();
                    return;
                }
            }
        }

        const origOpsBounds = gui.patchView.getSelectionBounds();
        gui.patchView.patchRenderer.subPatchOpAnimStart(origOpsBounds, () =>
        {
            const selops = gui.patchView.getSelectedOps();

            let selectedOpIds = gui.patchView.getSelectedOpsIds();
            const newOpname = options.newOpName || subPatchOpUtil.getAutoName();
            const currentSubpatch = gui.patchView.getCurrentSubPatch();
            // const loadingModal = gui.startModalLoading("Create Subpatch");

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
                        const ops = gui.corePatch().getSubPatchOps(patchId);

                        let unlink = [];
                        for (let i = 0; i < ops.length; i++)
                        {
                            const op = ops[i];
                            for (let j = 0; j < op.portsIn.length; j++)
                            {
                                const portIn = op.portsIn[j];
                                let pJson;
                                for (let k = 0; k < op.portsIn[j].links.length; k++)
                                {
                                    if (portIn.isLinked() && portIn.links[k])
                                    {
                                        const p2 = portIn.links[k].getOtherPort(portIn);
                                        if (p2.op.uiAttribs.subPatch != op.uiAttribs.subPatch)
                                        {
                                            if (k == 0)
                                            {
                                                pJson = subPatchOpUtil.createBlueprintPortJsonElement(portIn);
                                                portJson.ports.push(pJson);
                                            }

                                            op.setUiAttrib({ "tempSubOldOpId": op.id });
                                            oldLinks.push({ "pJson": pJson, "port": p2, "tempSubOldOpId": op.id, "origPortName": portIn.name });
                                            unlink.push(portIn.links[k]);
                                        }
                                    }
                                }
                            }

                            for (let j = 0; j < op.portsOut.length; j++)
                            {
                                const portOut = op.portsOut[j];
                                if (portOut.isLinked())
                                {
                                    let pJson = null;
                                    for (let k = 0; k < portOut.links.length; k++)
                                    {
                                        const p2 = portOut.links[k].getOtherPort(portOut);
                                        if (p2.op.uiAttribs.subPatch != op.uiAttribs.subPatch)
                                        {
                                            if (k == 0)
                                            {
                                                pJson = subPatchOpUtil.createBlueprintPortJsonElement(portOut);
                                                portJson.ports.push(pJson);
                                            }
                                            op.setUiAttrib({ "tempSubOldOpId": op.id });
                                            oldLinks.push({ "pJson": pJson, "port": p2, "tempSubOldOpId": op.id, "origPortName": portOut.name });
                                            unlink.push(portOut.links[k]);
                                        }
                                    }
                                }
                            }
                        }

                        unlink.forEach((l) => { l.remove(); });

                        gui.patchView.addOp(newOpname,
                            {
                                "uiAttribs":
                            {
                                "translate": { "x": origOpsBounds.minX, "y": origOpsBounds.minY }
                            },
                                "onOpAdd": (newOp) =>
                                {
                                    subPatchOpUtil.createBlueprint2Op(newOp, OpTempSubpatch, () =>
                                    {
                                        const src = subPatchOpUtil.generatePortsAttachmentJsSrc(portJson);

                                        gui.corePatch().deleteOp(OpTempSubpatch.id);
                                        gui.patchView.setCurrentSubPatch(currentSubpatch, null);

                                        platform.talkerAPI.send(TalkerAPI.CMD_UPDATE_OP,
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
                                                    this.showApiError(err);
                                                    return;
                                                }

                                                gui.serverOps.execute(newOpname, (newOps) =>
                                                {
                                                    newOp = newOps[0];

                                                    const subPatchId = newOp.patchId.get();

                                                    // relink inside ports....
                                                    const subOps = gui.corePatch().getSubPatchOps(subPatchId, false);
                                                    for (let j = 0; j < oldLinks.length; j++)
                                                    {
                                                    // outer linking
                                                        const oldLink = oldLinks[j];

                                                        if (oldLink.pJson)
                                                        {
                                                            newOp.patch.link(newOp, oldLink.pJson.id, oldLink.port.op, oldLink.port.name);

                                                            for (let i = 0; i < subOps.length; i++)
                                                            {
                                                                const op = subOps[i];
                                                                if (op.uiAttribs.tempSubOldOpId == oldLink.tempSubOldOpId)
                                                                {
                                                                    let patchInputOP = gui.corePatch().getSubPatch2InnerInputOp(subPatchId);
                                                                    let l = newOp.patch.link(patchInputOP, "innerOut_" + oldLink.pJson.id, op, oldLink.origPortName);

                                                                    if (!l)
                                                                    {
                                                                        let patchOutputOP = gui.corePatch().getSubPatch2InnerOutputOp(subPatchId);
                                                                        l = newOp.patch.link(patchOutputOP, "innerIn_" + oldLink.pJson.id, op, oldLink.origPortName);
                                                                    }

                                                                    if (!l)log.log("could not recreate oldlink", oldLink);
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
                                                        subPatchOpUtil.updateSubPatchOpAttachment(newOp, { "oldSubId": subPatchId,
                                                            "next": () =>
                                                            {

                                                            /*
                                                             * log.log("bp", bp);
                                                             * CABLES.CMD.PATCH.save();
                                                             */
                                                            } });
                                                    }
                                                    gui.patchView.patchRenderer.focusOpAnim(newOp.id);
                                                    gui.patchView.patchRenderer.subPatchOpAnimEnd(newOp.id);
                                                    gui.emitEvent("createdSubPatchOp", newOp, subPatchId);

                                                });
                                            });
                                    }, { "doNotExecute": true });
                                }
                            });
                    },
                    { "translate": { "x": 0, "y": 0 } });
            }, false, { "noLoadOp": true, ...options });
        });
    }

    /*
 * static createSubPatchFromSelection   (version)
 * {
 *     gui.patchView.createSubPatchFromSelection(version);
 * };
 */

    static findCommentedOps()
    {
        gui.find(":commented");
    }

    static findUnconnectedOps()
    {
        gui.find(":unconnected");
    }

    static findUserOps()
    {
        gui.find(":user");
    }

    static findOpsUsingExternalAssets()
    {
        gui.find(":extassets");
    }

    static createFile()
    {
        gui.showFileManager(function ()
        {
            gui.fileManager.createFile();
        });
    }

    static uploadFile()
    {
        const fileElem = document.getElementById("hiddenfileElem");
        if (fileElem) fileElem.click();
    }

    static reuploadFile(id, fileName)
    {
        if (!fileName) return;
        CABLES.reuploadName = fileName;
        const fileEle = ele.byId("fileReUpload" + id);
        if (fileEle && fileEle.dataset.filePath) CABLES.reuploadName = fileEle.dataset.filePath;
        const uploadEle = ele.byId("hiddenfileElemReupload");
        if (uploadEle) uploadEle.click();
    }

    static uploadFileDialog()
    {
    // @ts-ignore - if page is loading and a file drag is hovering it will crash because ....
        if (!window.gui || !gui.project()) return;
        const fileElem = document.getElementById("uploaddialog");

        if (!fileElem)
        {
            const html = getHandleBarHtml("dialog_upload", { "patchId": gui.project()._id });

            new ModalDialog({ "html": html });
        }
    }

    static uploadFileTab()
    {
        const url = platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings/upload?iframe=true";
        gui.mainTabs.addIframeTab(
            "Upload File",
            url,
            {
                "icon": "settings",
                "closable": true,
                "singleton": true,
            },
            true);
    }

    static showBackups()
    {
        const url = platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings?iframe=true#versions";
        const gotoUrl = platform.getCablesUrl() + "/patch/" + gui.project()._id + "/settings#versions";
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
    }

    static export(type)
    {
        const exporter = new Exporter(gui.project(), platform.getPatchVersion(), type);
        exporter.show();
    }

    static newPatch()
    {
        gui.createProject();
    }

    static addOpByName(name)
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
    }

    static reloadOp(x, y)
    {
        const ops = gui.patchView.getSelectedOps();
        if (!ops.length) return;

        const op = gui.patchView.getSelectedOps()[0];

        gui.serverOps.execute(op.opId, () =>
        {
            notify("reloaded op " + op.objName);
        });
    }

    static addOp(x, y)
    {
        gui.opSelect().show({ "x": 0, "y": 0 });
    }

    static patchWebsite()
    {
        window.open(platform.getCablesUrl() + "/p/" + gui.project().shortId || gui.project()._id);
    }

    static renameVariable(oldname)
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
    }

    static createVariable(op)
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
    }

    static createVarNumber(next)
    {
        new ModalDialog({
            "prompt": true,
            "title": "New Variable",
            "text": "Enter a name for the new variable",
            "promptValue": "myNewVar",
            "promptOk": (str) =>
            {
                const opSetter = gui.patchView.addOp(defaultOps.defaultOpNames.VarSetNumber);
                const opGetter = gui.patchView.addOp(defaultOps.defaultOpNames.VarGetNumber);

                opSetter.varName.set(str);
                opGetter.varName.set(str);
            } });
    }

    static analyze(force)
    {
        new AnalyzePatchTab();
    }

    static _createVariable(name, p, p2, value, next)
    {
        const getsetOp = opNames.getVarGetterOpNameByType(p.type, p);

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

                if (p.type != portType.trigger)
                    opSetter.getPortByName(portName).set(value);

                if (p.direction == Port.DIR_IN)
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

                gui.patchView.setCurrentSubPatch(gui.patchView.getCurrentSubPatch(), null);

                if (next)next(opSetter, opGetter);

                gui.closeModal();
            } });
        } });
    }

    static replaceLinkTriggerReceiveExist()
    {
        const link = CABLES.UI.OPSELECT.linkNewLink;
        const p = link.portIn;
        const portOut = link.portOut;
        CABLES.UI.OPSELECT.linkNewLink = null;

        gui.opSelect().close();
        gui.closeModal();
        const getsetOp = opNames.getVarGetterOpNameByType(p.type, p);

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
    }

    static createTriggerSendReceiveExist()
    {
        const type = CABLES.UI.OPSELECT.linkNewOpToPort.type;
        const p = CABLES.UI.OPSELECT.linkNewOpToPort;

        gui.opSelect().close();
        gui.closeModal();
        const getsetOp = opNames.getVarGetterOpNameByType(type, p);
        CABLES.UI.OPSELECT.linkNewOpToPort = null;

        let getset = getsetOp.setter;
        if (p.direction == Port.DIR_IN)getset = getsetOp.getter;

        gui.patchView.addOp(
            getset,
            { "onOpAdd": (op) =>
            {
                let off = -40;

                if (p.direction == Port.DIR_IN)
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
    }

    static replaceLinkVariableExist()
    {
        const link = CABLES.UI.OPSELECT.linkNewLink;
        const p = link.portIn;
        const portOut = link.portOut;
        CABLES.UI.OPSELECT.linkNewLink = null;

        gui.opSelect().close();
        gui.closeModal();
        const getsetOp = opNames.getVarGetterOpNameByType(p.type, p);

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
    }

    static addLinkReroute()
    {
        const link = CABLES.UI.OPSELECT.linkNewLink;
        const p = link.portIn;
        const portOut = link.portOut;
        CABLES.UI.OPSELECT.linkNewLink = null;

        gui.opSelect().close();
        gui.closeModal();
        const getsetOp = opNames.getRerouteOp(p.type);

        const glPatch = gui.patchView.patchRenderer;
        const nuiAttribs =
     {
         "translate":
         {
             "subPatch": gui.patchView.getCurrentSubPatch(),
             "x": glPatch.snap.snapX(glPatch.lastMouseX),
             "y": glPatch.snap.snapY(glPatch.lastMouseY)
         }
     };

        gui.patchView.addOp(
            getsetOp,
            {
                "uiAttribs": structuredClone(nuiAttribs),
                "onOpAdd": (opGetter) =>
                {
                // setTimeout(
                //     () =>
                //     {
                    gui.patchView.insertOpInLink(link, opGetter, nuiAttribs.translate.x, nuiAttribs.translate.y);
                    // }, 100);
                } });
    }

    static createLinkVariableExist(createTrigger = false)
    {
        gui.opSelect().close();
        const type = CABLES.UI.OPSELECT.linkNewOpToPort.type;
        const p = CABLES.UI.OPSELECT.linkNewOpToPort;

        gui.closeModal();
        const getsetOp = opNames.getVarGetterOpNameByType(type, p);
        CABLES.UI.OPSELECT.linkNewOpToPort = null;

        let opFunction = getsetOp.getter;
        let newOpX = p.op.uiAttribs.translate.x + 20;
        let newOpY = p.op.uiAttribs.translate.y - 40;
        if (p.direction === Port.DIR_OUT)
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
    }

    static replaceLinkVariable()
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

                if (p1.direction == Port.DIR_IN)p1.removeLinks();
                else p2.removeLinks();

                link.remove();

                CmdPatch._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
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
    }

    static createTriggerSendReceive()
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

                if (p1.direction == Port.DIR_IN)p1.removeLinks();
                else p2.removeLinks();

                link.remove();

                CmdPatch._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
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
    }

    static createAutoVariable()
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
                CmdPatch._createVariable(str, p, null, p.get(), (setter, getter) =>
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
    }

    static addSpaceX()
    {
        gui.patchView.addSpaceBetweenOpsX();
    }

    static addSpaceY()
    {
        gui.patchView.addSpaceBetweenOpsY();
    }

    static linkTwoSelectedOps()
    {
        if (gui.patchView.getSelectedOps().length != 2)
        {
            log.log("needs 2 selected ops");
            return;
        }

        let a = gui.patchView.getSelectedOps()[0];
        let b = gui.patchView.getSelectedOps()[1];

        if (a.uiAttribs.translate.y > b.uiAttribs.translate.y) gui.patchView.suggestionBetweenTwoOps(b, a);
        else gui.patchView.suggestionBetweenTwoOps(a, b);
    }

    static compressOps()
    {
        gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps());
    }

    static alignOpsLeft()
    {
        gui.patchView.alignSelectedOpsVert(gui.patchView.getSelectedOps());
    }

    static watchGlOp()
    {
        new GlOpWatcher(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static savePatchScreenshot()
    {
        gui.patchView.patchRenderer.cgl.saveScreenshot("patchfield_" + performance.now(), () =>
        {
            gui.patchView.patchRenderer.cgl.patch.resume();
        });
    }

    static toggleResizable()
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
    }

    static setOpTitle()
    {
        const ops = gui.patchView.getSelectedOps();

        if (ops.length != 1)
        {
            log.warn("rename canceled - select one op!");
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
    }

    static resume()
    {
        gui.corePatch().resume();
    }

    static pause()
    {
        gui.corePatch().pause();
    }

    static replaceOp()
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
    }

    static editOpSummary(opId, opName, oldSummary = "")
    {
        if (!platform.frontendOptions.editOpSummary) return;

        new ModalDialog({
            "prompt": true,
            "title": opName,
            "text": "New summary:",
            "promptValue": oldSummary,
            "promptOk": (summary) =>
            {
                gui.savingTitleAnimStart("Updating Op...");
                platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_SET_OP_SUMMARY, { "id": opId, "name": opName, "summary": summary }, (err, res) =>
                {
                    if (!err)
                    {
                        gui.serverOps.loadOpDependencies(opName, () =>
                        {
                            gui.savingTitleAnimEnd();
                            gui.emitEvent("refreshManageOp", opName);
                        }, true);
                    }
                });
            }
        });
    }

    static uncollideOps(ops)
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
                    op.setUiAttrib({ "translate": { "x": b.uiAttribs.translate.x, "y": b.uiAttribs.translate.y + gluiconfig.newOpDistanceY } });
                    found = true;
                }
            }
        }
    }

    static togglePatchLike(targetElement = null)
    {
        platform.talkerAPI.send(TalkerAPI.CMD_TOGGLE_PATCH_FAVS, {}, (err, res) =>
        {
            if (!err && res.success && targetElement)
            {
                if (targetElement.target)targetElement = targetElement.target;
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
    }

    static deleteOp(opName = null)
    {
        if (!opName)
        {
            const ops = gui.patchView.getSelectedOps();
            if (!ops.length) return;
            const op = gui.patchView.getSelectedOps()[0];
            opName = op.objName;
        }

        if (platform.frontendOptions.opDeleteInEditor)
        {
            gui.serverOps.deleteDialog(opName);
        }
    }

    static patchProfiler()
    {
        new Profiler(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static patchDebugger()
    {
        new TabDebugger(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static createSubPatchOp()
    {
        if (!gui.project().allowEdit && gui.patchView.getCurrentSubPatch() == 0)
        {
            new ModalDialog({ "title": "You don't have write access", "showOkButton": true });
            return;
        }

        let suggestedNamespace = platform.getPatchOpsNamespace();
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
            "hasOpDirectories": platform.frontendOptions.hasOpDirectories
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
            gui.closeModal();
            CmdPatch.createOpFromSelection({ "newOpName": newName, "ignoreNsCheck": true, ...options });
        });
    }
}
