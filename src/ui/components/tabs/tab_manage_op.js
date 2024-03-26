import { Logger } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { hideToolTip, showToolTip } from "../../elements/tooltips.js";
import blueprintUtil from "../../blueprint_util.js";

export default class ManageOp
{
    constructor(tabs, opname)
    {
        this._log = new Logger("ManageOp");
        this._initialized = false;
        this._lastSelectedOp = null;
        this._currentName = opname;
        this._id = CABLES.shortId();
        this._refreshListener = [];

        this._tab = new Tab(opname, { "icon": "op", "infotext": "tab_code", "padding": true, "tabPanel": tabs });
        tabs.addTab(this._tab, true);
        this.show();

        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("manageOp", this._currentName);

            for (let i in this._refreshListener)
                gui.off(this._refreshListener[i]);
        });

        gui.maintabPanel.show(true);

        this._refreshListener.push(
            gui.on("refreshManageOp", () =>
            {
                this.show();
            }));

        this._refreshListener.push(
            gui.corePatch().on("savedStateChanged", () =>
            {
                this.show();
            }));

        this._refreshListener.push(
            gui.on("opReloaded", () =>
            {
                this.show();
            }));
    }

    init()
    {
        if (this._initialized) return;
        this._initialized = true;
    }


    show()
    {
        CABLES.editorSession.remove("manageOp", this._currentName);

        CABLES.editorSession.rememberOpenEditor("manageOp", this._currentName, { "opname": this._currentName }, true);

        this._id = CABLES.shortId();
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");
        const opDoc = gui.opDocs.getOpDocByName(this._currentName);

        if (!opDoc)
        {
            this._tab.html("unknown op/no opdoc...<br/>this may be related to patch access restrictions<br/>please try in original patcjh");
            this._tab.remove();

            return;
        }


        clearTimeout(this._timeout);
        this._timeout = setTimeout(
            () =>
            {
                CABLESUILOADER.talkerAPI.send("getOpInfo", { "opName": opDoc.id }, (error, res) =>
                {
                    if (error) this._log.warn("error api?");
                    const perf = CABLES.UI.uiProfiler.start("showOpCodeMetaPanel");
                    const doc = {};
                    const opName = this._currentName;
                    let summary = "";
                    let portJson = null;

                    if (res.changelog && res.changelog.length > 0)
                    {
                        doc.changelog = res.changelog;
                    }

                    if (res.attachmentFiles)
                    {
                        //
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
                                        console.log(e);
                                    }
                                }
                            }
                        }
                        doc.attachmentFiles = attachmentFiles;
                    }


                    doc.libs = gui.serverOps.getOpLibs(opName, false);
                    doc.coreLibs = gui.serverOps.getCoreLibs(opName, false);
                    summary = gui.opDocs.getSummary(opName) || "No Summary";
                    const canEditOp = gui.serverOps.canEditOp(gui.user, opName);
                    if (portJson && portJson.ports)
                    {
                        portJson.ports = blueprintUtil.sortPortsJsonPorts(portJson.ports);

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

                            "url": CABLES.sandbox.getCablesUrl(),
                            "opLayoutSvg": gui.opDocs.getLayoutSvg(opName),
                            "opid": opDoc.id,
                            "opname": opName,
                            "doc": doc,
                            "opDoc": opDoc,
                            "viewId": this._id,
                            "bpSaved": gui.savedState.isSavedSubOp(opName),
                            "portJson": portJson,
                            "summary": summary,
                            "canEditOp": canEditOp,
                            "readOnly": !canEditOp,
                            "libs": libs,
                            "coreLibs": gui.opDocs.coreLibs,
                            "user": gui.user,
                            "warns": res.warns
                        });

                    this._tab.html(html);

                    if (canEditOp)
                    {
                        if (portJson && portJson.ports)
                        {
                            const buttonCreate = ele.byId(this._id + "_port_create");
                            if (buttonCreate)buttonCreate.addEventListener("click", () =>
                            {
                                blueprintUtil.portEditDialog(opName);
                            });


                            for (let i = 0; i < portJson.ports.length; i++)
                            {
                                const p = portJson.ports[i];
                                if (!p || !p.id) continue;

                                const id = p.id;
                                const buttonDelete = ele.byId(this._id + "_port_delete_" + id);
                                if (buttonDelete)buttonDelete.addEventListener("click", () =>
                                {
                                    blueprintUtil.portJsonDelete(opName, id);
                                });

                                const buttonTitle = ele.byId(this._id + "_port_title_" + id);
                                if (buttonTitle)buttonTitle.addEventListener("click", () =>
                                {
                                    blueprintUtil.portEditDialog(opName, id, p);
                                    //     new CABLES.UI.ModalDialog({
                                    //         "prompt": true,
                                    //         "title": "Enter Title",
                                    //         "text": "Enter a new title for " + p.title + " (" + id + ")",
                                    //         "promptValue": p.title,
                                    //         "promptOk": (title) =>
                                    //         {
                                    //             blueprintUtil.portJsonUtil(opName, id, { "title": title });
                                    //         }
                                    //     });
                                });

                                const buttonMoveUp = ele.byId(this._id + "_port_up_" + id);
                                if (buttonMoveUp)buttonMoveUp.addEventListener("click", () =>
                                {
                                    blueprintUtil.portJsonMove(opName, id, -1);
                                });

                                const buttonMoveDown = ele.byId(this._id + "_port_down_" + id);
                                if (buttonMoveDown)buttonMoveDown.addEventListener("click", () =>
                                {
                                    blueprintUtil.portJsonMove(opName, id, 1);
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


