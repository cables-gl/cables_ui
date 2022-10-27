import Logger from "../../utils/logger";
import Tab from "../../elements/tabpanel/tab";
import { getHandleBarHtml } from "../../utils/handlebars";
import { hideToolTip, showToolTip } from "../../elements/tooltips";

export default class MetaCode
{
    constructor(tabs)
    {
        this._log = new Logger("MetaCode");
        this._initialized = false;
        this._op = null;
        this._lastSelectedOp = null;
        this._currentName = null;

        this._tab = new Tab("code", { "icon": "code", "infotext": "tab_code", "showTitle": false, "hideToolbar": true, "padding": true });
        tabs.addTab(this._tab);
        this._tab.addEventListener("onActivate", function ()
        {
            this.show();
        }.bind(this));
    }

    init()
    {
        if (this._initialized) return;
        this._initialized = true;

        gui.opParams.addEventListener("opSelected", this.onOpSelected.bind(this));
    }

    onOpSelected(_op)
    {
        this._lastSelectedOp = _op;

        if (!this._tab.isVisible()) return;

        clearTimeout(CABLES.UI.OpShowMetaCodeDelay);
        CABLES.UI.OpShowMetaCodeDelay = setTimeout(function ()
        {
            this._op = this._lastSelectedOp;
            this.show();
        }.bind(this), 100);
    }

    show()
    {
        if (this._lastSelectedOp != this._op) this.onOpSelected(this._lastSelectedOp);

        if (!this._op)
        {
            this._currentName = null;
            this._tab.html("<h3>Code</h3>Select any Op");
            return;
        }

        this._currentName = this._op.objName;
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");

        if (window.process && window.process.versions.electron) return;
        if (this._op)
        {
            CABLES.api.get(
                "op/" + this._op.objName + "/info",
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

                    doc.libs = gui.serverOps.getOpLibs(this._op.objName, false);
                    doc.coreLibs = gui.serverOps.getCoreLibs(this._op.objName, false);
                    summary = gui.opDocs.getSummary(this._op.objName);

                    const canEditOp = gui.serverOps.canEditOp(gui.user, this._op.objName);

                    if (this._op.objName.indexOf("User.") == -1)
                        this._op.github = "https://github.com/pandrr/cables/tree/master/src/ops/base/" + this._op.objName;

                    const html = getHandleBarHtml("meta_code",
                        {
                            "op": this._op,
                            "doc": doc,
                            "summary": summary,
                            "ownsOp": gui.serverOps.ownsOp(this._op.objName),
                            "isUserOp": gui.serverOps.isUserOp(this._op.objName),
                            "canEditOp": canEditOp,
                            "libs": gui.opDocs.libs,
                            "coreLibs": gui.opDocs.coreLibs,
                            "user": gui.user,
                            "warns": res.warns
                        });

                    // console.log(res.warns);

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
}
