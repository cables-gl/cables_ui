import ele from "../../utils/ele";

export default class OpWatchUiAttribs extends CABLES.EventTarget
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


    rebuildHtml()
    {
        if (this._op)
        {
            let html = "<div class=\"tabContentScrollContainer\">";

            html += "<hr/><h2>Op: " + this._op.name + " </h2>";

            html += "<code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._op.uiAttribs, false, 4) + "</code></pre>";


            for (let i = 0; i < this._op.portsIn.length; i++)
            {
                html += "<hr/><h3>Port: " + this._op.portsIn[i].name + " </h3>";
                html += "<code ><pre id=\"" + this._id + "\" class=\"hljs language-json\">" + JSON.stringify(this._op.portsIn[i].uiAttribs, false, 4) + "</code></pre>";
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
