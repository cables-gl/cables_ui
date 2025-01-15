import { ele, Events } from "cables-shared-client";
import { gui } from "../../gui.js";

/**
 * debug: show current op in serialized form
 *
 * @export
 * @class OpSerialized
 * @extends {Events}
 */
export default class OpSerialized extends Events
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("Serialized Op", { "icon": "op", "infotext": "tab_serialized", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._id = "hljs" + CABLES.uuid();

        this._op = null;
        this.rebuildHtml();
        this.setOp(gui.opParams.op);

        this._tab.addButton("Refresh", () =>
        {
            this.rebuildHtml();
        });

        gui.opParams.on("opSelected", () =>
        {
            this.setOp(gui.opParams.op);
        });
    }

    _sortObject(obj)
    {
        return Object.keys(obj).sort().reduce(function (result, key)
        {
            result[key] = obj[key];
            return result;
        }, {});
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


    rebuildHtml()
    {
        if (this._op)
        {
            let html = "<div class=\"tabContentScrollContainer\"><code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._sortObject(this._op.getSerialized()), false, 4) + "</code></pre></div>";
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
