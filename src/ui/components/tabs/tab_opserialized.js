import ele from "../../utils/ele";

export default class OpSerialized extends CABLES.EventTarget
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("Serialized Op", { "icon": "op", "infotext": "tab_serialized", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

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
            this._tab.html("<div><code><pre>" + JSON.stringify(this._op.getSerialized(), false, 4) + "</code></pre></div>");
        }
        else
        {
            this._tab.html("please select op");
        }
    }
}
