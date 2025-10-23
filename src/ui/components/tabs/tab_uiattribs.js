import { ele, Events } from "cables-shared-client";
import { utils } from "cables";
import { gui } from "../../gui.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

/**
 * debug: showing uiattribs of currently selected op
 *
 * @export
 * @class OpWatchUiAttribs
 * @extends {Events}
 */
export default class OpWatchUiAttribs extends Events
{
    static TABSESSION_NAME = "watchuiattr";

    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("Op UiAttribs", { "icon": "op", "infotext": "tab_uiattribs", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._id = "hljs" + utils.uuid();

        this._op = null;
        this.rebuildHtml();
        this.setOp(gui.opParams.op);
        editorSession.rememberOpenEditor(OpWatchUiAttribs.TABSESSION_NAME, "profiler", { }, true);

        this._tab.on("close", () =>
        {
            editorSession.remove(OpWatchUiAttribs.TABSESSION_NAME, "profiler");
        });

        gui.opParams.on("opSelected", () =>
        {
            this.setOp(gui.opParams.op);
        });
    }

    setOp(op)
    {
        if (this._op == op) return;

        if (this._op)
        {
            // unbind listener!
        }

        if (op)
        {
            op.addEventListener("onUiAttribsChange", () =>
            {
                this.rebuildHtml();
            });

            this._op = op;
        }

        this.rebuildHtml();
    }

    _sortObject(obj)
    {
        return Object.keys(obj).sort().reduce(function (result, key)
        {
            result[key] = obj[key];
            return result;
        }, {});
    }

    rebuildHtml()
    {
        if (this._op)
        {
            let html = "<div class=\"tabContentScrollContainer\">";
            html += "<hr/><h2>Op: " + this._op.name + " </h2>";
            html += "<code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._sortObject(this._op.uiAttribs), false, 4) + "</code></pre>";

            for (let i = 0; i < this._op.portsIn.length; i++)
            {
                html += "<hr/><h3>Input Port: " + this._op.portsIn[i].name + " </h3>";
                html += "<code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._sortObject(this._op.portsIn[i].uiAttribs), false, 4) + "</code></pre>";
            }

            for (let i = 0; i < this._op.portsOut.length; i++)
            {
                html += "<hr/><h3>Output Port: " + this._op.portsOut[i].name + " </h3>";
                html += "<code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._sortObject(this._op.portsOut[i].uiAttribs), false, 4) + "</code></pre>";
            }

            html += "</div>";

            this._tab.html(html);
        }
        else
        {
            this._tab.html("please select op");
        }

        const el = ele.byId(this._id);
        // hljs.highlightAuto();

        if (el)
            hljs.highlightElement(el);
    }
}
editorSession.addListener(OpWatchUiAttribs.TABSESSION_NAME, (id, data) =>
{
    new OpWatchUiAttribs(gui.mainTabs);
});
