import { Logger, ele } from "cables-shared-client";
import { utils } from "cables";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { hideToolTip, showToolTip } from "../../elements/tooltips.js";
import subPatchOpUtil from "../../subpatchop_util.js";
import OpDependencyTabPanel from "../../elements/tabpanel/opdependencytabpanel.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { contextMenu } from "../../elements/contextmenu.js";
import namespace from "../../namespaceutils.js";

/**
 * tab panel for managing ops: attachments,libs etc.
 *
 * @export
 * @class ManageOp
 */
export default class ManageOp
{
    constructor(tabs, opId)
    {
        this._log = new Logger("ManageOp");
        if (!opId)
        {
            editorSession.remove("manageOp", opId);
            return;
        }

        let opDoc = gui.opDocs.getOpDocById(opId);
        if (!opDoc && opId.startsWith("Ops."))
        {
            this._log.warn("manage op paramerter should not be objname, but id", opId);
            opDoc = gui.opDocs.getOpDocByName(opId);
            if (opDoc) opId = opDoc.id;
            else return;
        }

        let opObjName = "";
        if (opDoc) opObjName = opDoc.name;

        this._initialized = false;
        this._currentName = opObjName;
        this._currentId = opId;
        this._id = utils.shortId();
        this._refreshListener = [];
        this._refreshCoreListener = [];

        this._tab = new Tab(opObjName, {
            "icon": "op",
            "infotext": "tab_code",
            "padding": true,
            "tabPanel": tabs,
            "singleton": true
        });
        tabs.addTab(this._tab, true);
        this.show();

        this._tab.on("close", () =>
        {
            editorSession.remove("manageOp", this._currentId);

            for (let i in this._refreshListener)
            {
                gui.off(this._refreshListener[i]);
            }
            for (let i in this._refreshCoreListener)
            {
                gui.corePatch().off(this._refreshCoreListener[i]);
            }

        });

        gui.maintabPanel.show(true);

        this._refreshListener.push(
            gui.on("refreshManageOp", (name) =>
            {
                if (name === undefined || this._currentName == name) this.show();
            }));

        this._refreshCoreListener.push(
            gui.corePatch().on("opReloaded", (name) =>
            {
                if (name === undefined || this._currentName == name) this.show();
            }));
    }

    init()
    {
        if (this._initialized) return;
        this._initialized = true;
    }

    show()
    {
        editorSession.remove("manageOp", this._currentId);
        editorSession.rememberOpenEditor("manageOp", this._currentId, {
            "opname": this._currentName,
            "opid": this._currentId
        }, true);

        this._id = utils.shortId();
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");
        const opDoc = gui.opDocs.getOpDocById(this._currentId);

        if (!opDoc)
        {
            this._tab.html("unknown op/no opdoc...<br/>this may be related to patch access restrictions<br/>please try in original patch");
            this._tab.remove();
            return;
        }

        // timeout needed to not have multiple requests and refreshes when saving i.e. subpatchops
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            platform.talkerAPI.send("getOpInfo", { "opName": opDoc.id }, (error, res) =>
            {
                if (error) this._log.warn("error api?", error);

                const perf = gui.uiProfiler.start("showOpCodeMetaPanel");
                const doc = {};
                const opName = this._currentName;
                let summary = "";
                let portJson = null;

                if (res.changelog && res.changelog.length > 0) doc.changelog = res.changelog;

                if (res.attachmentFiles)
                {
                    const attachmentFiles = [];
                    for (let i = 0; i < res.attachmentFiles.length; i++)
                    {
                        const parts = res.attachmentFiles[i].split(".");
                        let suffix = "";
                        suffix = parts[parts.length - 1];

                        attachmentFiles.push(
                            {
                                "suffix": suffix,
                                "readable": res.attachmentFiles[i].substr(4),
                                "original": res.attachmentFiles[i]
                            });

                        if (res.attachmentFiles[i] === "att_ports.json")
                        {
                            const ops = gui.corePatch().getOpsByObjName(opName);

                            if (ops && ops.length > 0)
                            {
                                try
                                {
                                    portJson = JSON.parse(ops[0].attachments.ports_json);
                                }
                                catch (e)
                                {
                                    this._log.error(e);
                                }
                            }
                        }
                    }
                    doc.attachmentFiles = attachmentFiles;
                }

                doc.libs = gui.serverOps.getOpLibs(opName, false).map((lib) => { return lib.name; });
                doc.coreLibs = gui.serverOps.getCoreLibs(opName, false).map((lib) => { return lib.name; });
                summary = gui.opDocs.getSummary(opName) || "No Summary";
                const canEditOp = gui.serverOps.canEditOp(gui.user, opName);
                if (portJson && portJson.ports)
                {
                    portJson.ports = subPatchOpUtil.sortPortsJsonPorts(portJson.ports);

                    if (portJson.ports.length > 1)
                        for (let i = 1; i < portJson.ports.length; i++)
                        {
                            if (portJson.ports[i - 1].dir != portJson.ports[i].dir) portJson.ports[i].divider = true;
                        }
                }
                const allLibs = gui.opDocs.libs.sort((a, b) => { return a.localeCompare(b); });
                const libs = [];
                allLibs.forEach((lib) =>
                {
                    libs.push({
                        "url": lib,
                        "name": utils.basename(lib),
                        "isAssetLib": lib.startsWith("/assets/")
                    });
                });

                let canDeleteOp = canEditOp && namespace.isPatchOp(opName);
                if (platform.frontendOptions.opDeleteInEditor) canDeleteOp = canEditOp;

                const html = getHandleBarHtml("tab_manage_op",
                    {
                        "layoutUrl": platform.getCablesUrl() + "/api/op/layout/" + opName,
                        "url": platform.getCablesDocsUrl(),
                        "opLayoutSvg": gui.opDocs.getLayoutSvg(opName),
                        "opid": opDoc.id,
                        "opname": opDoc.name,
                        "doc": doc,
                        "opDoc": opDoc,
                        "viewId": this._id,
                        "subPatchSaved": gui.savedState.isSavedSubOp(opName),
                        "portJson": portJson,
                        "summary": summary,
                        "canEditOp": canEditOp,
                        "canDeleteOp": canDeleteOp,
                        "readOnly": !canEditOp,
                        "user": gui.user,
                        "warns": res.warns,
                        "visibilityString": res.visibilityString,
                        "hasDependencies": (opDoc.coreLibs && opDoc.coreLibs.length) || (opDoc.libs && opDoc.libs.length) || (opDoc.dependencies && opDoc.dependencies.length)
                    });

                this._tab.html(html);

                ele.clickables(this._tab.contentEle, ".dependency-options", (e, dataset) =>
                {
                    const depSrc = dataset.depsrc;
                    const depType = dataset.deptype;
                    const dep = opDoc.dependencies.find((d) => { return d.src == depSrc && d.type == depType; });

                    const items = [];

                    let downloadable = depType !== "corelib" && depType !== "op";
                    if (depType === "lib") downloadable = depSrc.startsWith("/assets/");

                    if (downloadable)
                    {
                        items.push({
                            "title": "download",
                            "iconClass": "icon icon-download",
                            "func": () =>
                            {
                                let scriptSrc = "";
                                if (depSrc.startsWith("http") || depSrc.startsWith("/assets/"))
                                {
                                    scriptSrc = depSrc;
                                }
                                else if (depSrc.startsWith("./"))
                                {
                                    scriptSrc = platform.getSandboxUrl() + "/api/oplib/" + opName + depSrc.replace(".", "");
                                }
                                if (scriptSrc)
                                {
                                    let element = document.createElement("a");
                                    element.setAttribute("href", scriptSrc);
                                    element.setAttribute("download", "");
                                    element.style.display = "none";
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                }
                            }
                        });
                    }

                    if (depType === "op" && dep && dep.oldVersion && dep.newestVersion && dep.newestVersion.name)
                    {
                        items.push({
                            "title": "upgrade",
                            "iconClass": "icon icon-op",
                            "func": (ee) =>
                            {
                                gui.serverOps.addOpDependency(opDoc.id, dep.newestVersion.name, depType, null, () =>
                                {
                                    gui.serverOps.removeOpDependency(opDoc.id, depSrc, depType, () =>
                                    {
                                        gui.emitEvent("refreshManageOp", opName);
                                    }, true);
                                });
                            }
                        });
                    }

                    items.push({
                        "title": "remove",
                        "iconClass": "icon icon-x",
                        "func": (ee) =>
                        {
                            switch (depType)
                            {
                            case "corelib":
                                gui.serverOps.removeCoreLib(opName, depSrc);
                                break;
                            case "lib":
                                gui.serverOps.removeOpLib(opName, depSrc);
                                break;
                            case "commonjs":
                            case "module":
                            default:
                                gui.serverOps.removeOpDependency(opDoc.id, depSrc, depType, () =>
                                {
                                    gui.emitEvent("refreshManageOp", opName);
                                });
                                break;
                            }
                        }
                    });

                    if (items.length > 0)
                    {
                        contextMenu.show({ "items": items, }, event.currentTarget);
                    }

                });

                if (canEditOp)
                {
                    const dependencyTabId = this._id + "_dependencytabs";
                    const tabPanel = ele.byId(dependencyTabId);
                    if (tabPanel)
                    {
                        const panelOptions = {
                            "opDoc": opDoc,
                            "libs": libs,
                            "coreLibs": gui.opDocs.coreLibs,
                            "user": gui.user,
                            "canEditOp": canEditOp,
                            "viewId": this._id
                        };

                        if (tabPanel) tabPanel.innerHTML = "";
                        const depTabs = new OpDependencyTabPanel(dependencyTabId, panelOptions);
                        depTabs.init();
                    }

                    if (portJson && portJson.ports)
                    {
                        const buttonCreate = ele.byId(this._id + "_port_create");
                        if (buttonCreate) buttonCreate.addEventListener("click", () =>
                        {
                            subPatchOpUtil.portEditDialog(opName);
                        });

                        for (let i = 0; i < portJson.ports.length; i++)
                        {
                            const p = portJson.ports[i];
                            if (!p || !p.id) continue;

                            const id = p.id;
                            const buttonDelete = ele.byId(this._id + "_port_delete_" + id);
                            if (buttonDelete) buttonDelete.addEventListener("click", () =>
                            {
                                subPatchOpUtil.portJsonDelete(opName, id);
                            });

                            const buttonTitle = ele.byId(this._id + "_port_title_" + id);
                            if (buttonTitle) buttonTitle.addEventListener("click", () =>
                            {
                                subPatchOpUtil.portEditDialog(opName, id, p);
                            });

                            const buttonMoveUp = ele.byId(this._id + "_port_up_" + id);
                            if (buttonMoveUp) buttonMoveUp.addEventListener("click", () =>
                            {
                                subPatchOpUtil.portJsonMove(opName, id, -1);
                            });

                            const buttonMoveDown = ele.byId(this._id + "_port_down_" + id);
                            if (buttonMoveDown) buttonMoveDown.addEventListener("click", () =>
                            {
                                subPatchOpUtil.portJsonMove(opName, id, 1);
                            });
                        }
                    }
                }
                else
                {
                    document.querySelectorAll("#metatabpanel .libselect select, #metatabpanel .libselect a").forEach((opLibSelect) =>
                    {
                        opLibSelect.disabled = true;
                        opLibSelect.addEventListener("pointerenter", (event) =>
                        {
                            showToolTip(event.currentTarget, "you are not allowed to add libraries to this op");
                        });
                        opLibSelect.addEventListener("pointerleave", (event) =>
                        {
                            hideToolTip();
                        });
                    });

                    document.querySelectorAll("#metatabpanel .libselect").forEach((select) =>
                    {
                        select.classList.add("inactive");
                    });
                }
                perf.finish();
            });
        }, 100);
    }
}
