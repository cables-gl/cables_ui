import Logger from "../../utils/logger";
import Tab from "../../elements/tabpanel/tab";
import { getHandleBarHtml } from "../../utils/handlebars";
import { hideToolTip, showToolTip } from "../../elements/tooltips";
import defaultops from "../../defaultops";

export default class MetaCode
{
    constructor(tabs, opname)
    {
        this._log = new Logger("MetaCode");
        this._initialized = false;
        this._lastSelectedOp = null;
        this._currentName = opname;

        this._tab = new Tab(opname, { "icon": "code", "infotext": "tab_code", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        console.log(tabs);
        gui.maintabPanel.show(true);
        // tabs.activateTab(this._tab.id);
    }

    init()
    {
        if (this._initialized) return;
        this._initialized = true;
    }

    show()
    {
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");

        if (window.process && window.process.versions.electron) return;
        CABLES.api.get(
            "op/" + this._currentName + "/info",
            (res) =>
            {
                const perf = CABLES.UI.uiProfiler.start("showOpCodeMetaPanel");
                const doc = {};
                let summary = "";

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
                    }
                    doc.attachmentFiles = attachmentFiles;
                }

                const opName = this._currentName;
                doc.libs = gui.serverOps.getOpLibs(opName, false);
                doc.coreLibs = gui.serverOps.getCoreLibs(opName, false);
                summary = gui.opDocs.getSummary(opName);

                const canEditOp = gui.serverOps.canEditOp(gui.user, opName);

                // if (defaultops.isCoreOp(opName)) this._op.github = "https://github.com/pandrr/cables/tree/master/src/ops/base/" + opName;

                const showPatchLibSelect = defaultops.isNonCoreOp(opName);
                const html = getHandleBarHtml("meta_code",
                    {
                        "url": CABLES.sandbox.getCablesUrl(),
                        "op": this._op,
                        "opname": opName,
                        "doc": doc,
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
                if (!canEditOp)
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
            },
            () =>
            {
                this._log.warn("error api?");
            });
    }
}
