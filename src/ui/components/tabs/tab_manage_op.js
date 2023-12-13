import Logger from "../../utils/logger";
import Tab from "../../elements/tabpanel/tab";
import { getHandleBarHtml } from "../../utils/handlebars";
import { hideToolTip, showToolTip } from "../../elements/tooltips";
import defaultops from "../../defaultops";
import blueprintUtil from "../../blueprint_util";

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

        this._tab = new Tab(opname, { "icon": "code", "infotext": "tab_code", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        this._tab.on("close", () =>
        {
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
        this._id = CABLES.shortId();

        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");

        CABLESUILOADER.talkerAPI.send("getOpInfo", { "opName": this._currentName }, (error, res) =>
        {
            if (error) this._log.warn("error api?");
            const perf = CABLES.UI.uiProfiler.start("showOpCodeMetaPanel");
            const doc = {};
            let summary = "";
            let portJson = null;
            const opName = this._currentName;

            if (res.attachmentFiles)
            {
                const attachmentFiles = [];
                for (let i = 0; i < res.attachmentFiles.length; i++)
                {
                    attachmentFiles.push(
                        {
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



            const opDoc = gui.opDocs.getOpDocByName(opName);

            doc.libs = gui.serverOps.getOpLibs(opName, false);
            doc.coreLibs = gui.serverOps.getCoreLibs(opName, false);
            summary = gui.opDocs.getSummary(opName);
            const canEditOp = gui.serverOps.canEditOp(gui.user, opName);
            const showPatchLibSelect = defaultops.isNonCoreOp(opName);
            const html = getHandleBarHtml("tab_manage_op",
                {
                    "url": CABLES.sandbox.getCablesUrl(),
                    "opid": opDoc.id,
                    "opname": opName,
                    "doc": doc,
                    "opDoc": opDoc,
                    "viewId": this._id,
                    "bpSaved": gui.savedState.isSavedSubOp(opName),
                    "portJson": portJson,
                    "summary": summary,
                    "showPatchLibSelect": showPatchLibSelect,
                    "canEditOp": canEditOp,
                    "readOnly": !canEditOp,
                    "libs": gui.opDocs.libs,
                    "coreLibs": gui.opDocs.coreLibs,
                    "user": gui.user,
                    "warns": res.warns
                });

            this._tab.html(html);

            if (canEditOp)
            {
                if (portJson && portJson.ports)
                {
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
                            new CABLES.UI.ModalDialog({
                                "prompt": true,
                                "title": "Enter Title",
                                "text": "Enter a new title for " + p.title + " (" + id + ")",
                                "promptValue": p.title,
                                "promptOk": (title) =>
                                {
                                    blueprintUtil.portJsonTitle(opName, id, title);
                                }
                            });
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
    }
}
