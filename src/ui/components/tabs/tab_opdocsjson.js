import { ele, Events } from "cables-shared-client";
import { utils } from "cables";
import { gui } from "../../gui.js";

export default class OpDocsJson extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("Op Docs Json", { "icon": "op", "infotext": "tab_serialized", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._id = "hljs" + utils.uuid();

        this._op = null;
        this.rebuildHtml();
        this.setOp(gui.opParams.op);

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

        this._op = op;

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
            let json = gui.opDocs.getOpDocByName(this._op.objName);

            json = this._sortObject(json);

            let html = "<div class=\"tabContentScrollContainer\"><code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(json, false, 4) + "</code></pre></div>";
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
