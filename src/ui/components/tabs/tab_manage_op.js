import { Logger } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { hideToolTip, showToolTip } from "../../elements/tooltips.js";
import subPatchOpUtil from "../../subpatchop_util.js";
import FileUploader from "../../dialogs/upload.js";

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
            CABLES.editorSession.remove("manageOp", opId);
            return;
        }

        let opDoc = gui.opDocs.getOpDocById(opId);
        if (!opDoc && opId.startsWith("Ops."))
        {
            this._log.warn("manage op paramerter should not be objname, but id", opId);
            opDoc = gui.opDocs.getOpDocByName(opId);
            if (opDoc)opId = opDoc.id;
            else return;
        }

        let opObjName = "";
        if (opDoc)opObjName = opDoc.name;

        this._initialized = false;
        this._currentName = opObjName;
        this._currentId = opId;
        this._id = CABLES.shortId();
        this._refreshListener = [];

        this._tab = new Tab(opObjName, { "icon": "op", "infotext": "tab_code", "padding": true, "tabPanel": tabs, "singleton": true });
        tabs.addTab(this._tab, true);
        this.show();

        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("manageOp", this._currentId);

            for (let i in this._refreshListener)
                gui.off(this._refreshListener[i]);
        });

        gui.maintabPanel.show(true);

        this._refreshListener.push(
            gui.on("refreshManageOp", (name) =>
            {
                if (name === undefined || this._currentName == name) this.show();
            }));

        this._refreshListener.push(
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
        CABLES.editorSession.remove("manageOp", this._currentId);
        CABLES.editorSession.rememberOpenEditor("manageOp", this._currentId, { "opname": this._currentName, "opid": this._currentId }, true);

        this._id = CABLES.shortId();
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");
        const opDoc = gui.opDocs.getOpDocById(this._currentId);

        if (!opDoc)
        {
            this._tab.html("unknown op/no opdoc...<br/>this may be related to patch access restrictions<br/>please try in original patch");
            this._tab.remove();
            return;
        }

        clearTimeout(this._timeout);
        this._timeout = setTimeout(
            () =>
            {
                CABLESUILOADER.talkerAPI.send("getOpInfo", { "opName": opDoc.id }, (error, res) =>
                {
                    if (error) this._log.warn("error api?", error);
                    const perf = CABLES.UI.uiProfiler.start("showOpCodeMetaPanel");
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
                                    "original": res.attachmentFiles[i],
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
                                if (portJson.ports[i - 1].dir != portJson.ports[i].dir)portJson.ports[i].divider = true;
                            }
                    }
                    const allLibs = gui.opDocs.libs.sort((a, b) => { return a.localeCompare(b); });
                    const libs = [];
                    allLibs.forEach((lib) =>
                    {
                        libs.push({
                            "url": lib,
                            "name": CABLES.basename(lib),
                            "isAssetLib": lib.startsWith("/assets/"),
                        });
                    });

                    const html = getHandleBarHtml("tab_manage_op",
                        {
                            "layoutUrl": CABLES.platform.getCablesUrl() + "/api/op/layout/" + opName,
                            "url": CABLES.platform.getCablesDocsUrl(),
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
                            "canDeleteOp": CABLES.platform.frontendOptions.opDeleteInEditor ? canEditOp : false,
                            "readOnly": !canEditOp,
                            "libs": libs,
                            "coreLibs": gui.opDocs.coreLibs,
                            "user": gui.user,
                            "warns": res.warns,
                            "supportedOpDependencyTypes": CABLES.platform.getSupportedOpDependencyTypes()
                        });

                    this._tab.html(html);

                    // CABLES.UI.Collapsable.setup();

                    if (canEditOp)
                    {
                        if (portJson && portJson.ports)
                        {
                            const buttonCreate = ele.byId(this._id + "_port_create");
                            if (buttonCreate)buttonCreate.addEventListener("click", () =>
                            {
                                subPatchOpUtil.portEditDialog(opName);
                            });


                            for (let i = 0; i < portJson.ports.length; i++)
                            {
                                const p = portJson.ports[i];
                                if (!p || !p.id) continue;

                                const id = p.id;
                                const buttonDelete = ele.byId(this._id + "_port_delete_" + id);
                                if (buttonDelete)buttonDelete.addEventListener("click", () =>
                                {
                                    subPatchOpUtil.portJsonDelete(opName, id);
                                });

                                const buttonTitle = ele.byId(this._id + "_port_title_" + id);
                                if (buttonTitle)buttonTitle.addEventListener("click", () =>
                                {
                                    subPatchOpUtil.portEditDialog(opName, id, p);
                                });

                                const buttonMoveUp = ele.byId(this._id + "_port_up_" + id);
                                if (buttonMoveUp)buttonMoveUp.addEventListener("click", () =>
                                {
                                    subPatchOpUtil.portJsonMove(opName, id, -1);
                                });

                                const buttonMoveDown = ele.byId(this._id + "_port_down_" + id);
                                if (buttonMoveDown)buttonMoveDown.addEventListener("click", () =>
                                {
                                    subPatchOpUtil.portJsonMove(opName, id, 1);
                                });
                            }
                        }

                        const depsEle = ele.byId("addopdependency_" + this._id);
                        if (depsEle)
                        {
                            const editEle = depsEle.querySelector(".edit");

                            ele.show(editEle);
                            const srcEle = depsEle.querySelector(".depSrc");
                            const submitEle = editEle.querySelector(".add");
                            const typeSelect = editEle.querySelector(".depType");
                            const exportNameEle = depsEle.querySelector(".exportName input");
                            const uploadButton = editEle.querySelector(".upload");
                            const fileInput = editEle.querySelector("input[type='file']");

                            uploadButton.addEventListener("click", () => { fileInput.click(); });

                            fileInput.addEventListener("change", () =>
                            {
                                const filename = fileInput.files[0].name;
                                srcEle.value = "./" + filename;
                            });

                            typeSelect.addEventListener("change", () =>
                            {
                                const exportName = depsEle.querySelector(".exportName");
                                if (typeSelect.value === "module")
                                {
                                    ele.show(exportName);
                                }
                                else
                                {
                                    ele.hide(exportName);
                                }
                            });

                            submitEle.addEventListener("click", () =>
                            {
                                if (submitEle.disabled) return;
                                const depSrc = srcEle.value;
                                if (!depSrc) return;
                                submitEle.innerText = "working...";
                                submitEle.disabled = true;
                                if (fileInput.files && fileInput.files.length > 0)
                                {
                                    const filename = fileInput.files[0].name;
                                    CABLES.fileUploader.uploadFile(fileInput.files[0], filename, opDoc.id, (err, newFilename) =>
                                    {
                                        if (!err)
                                        {
                                            gui.serverOps.addOpDependency(opName, "./" + newFilename, typeSelect.value, exportNameEle.value, () =>
                                            {
                                                submitEle.innerText = "Add";
                                                submitEle.disabled = false;
                                            });
                                        }
                                    });
                                }
                                else
                                {
                                    gui.serverOps.addOpDependency(opName, depSrc, typeSelect.value, exportNameEle.value, () =>
                                    {
                                        submitEle.innerText = "Add";
                                        submitEle.disabled = false;
                                    });
                                }
                            });
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


