import { Events } from "cables-shared-client";

export default class GlOpWatcher extends Events
{
    constructor(tabs)
    {
        super();

        this._glPatch = gui.patchView.patchRenderer;
        this._tabs = tabs;
        this._tab = new CABLES.UI.Tab("GlOp", { "icon": "op", "infotext": "tab_glop", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        this._op = null;
        this._glop = null;
        this.rebuildHtml();
        this.setOp(gui.opParams.op);

        gui.opParams.on("opSelected", () =>
        {
            this.setOp(gui.opParams.op);
        });

        setInterval(this.rebuildHtml.bind(this), 100);
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
            this._glop = this._glPatch.getGlOp(op);
        }

        this.rebuildHtml();
    }


    rebuildHtml()
    {
        if (this._op)
        {
            let html = "";

            html += "<table>";

            html += "<tr><td>_glRectBg._dragStartX</td><td>" + this._glop._glRectBg._dragStartX + "</td></tr>";
            html += "<tr><td>_passiveDragStartX</td><td>" + this._glop._passiveDragStartX + "</td></tr>";

            html += "<tr><td>_glRectBg.dragOffsetX</td><td>" + this._glop._glRectBg.dragOffsetX + "</td></tr>";
            html += "<tr><td>_glRectBg.dragOffsetY</td><td>" + this._glop._glRectBg.dragOffsetY + "</td></tr>";
            html += "<tr><td>_glRectBg._isDragging</td><td>" + this._glop._glRectBg._isDragging + "</td></tr>";
            html += "<tr><td>_glRectBg.x</td><td>" + this._glop._glRectBg.x + "</td></tr>";
            html += "<tr><td>_glRectBg.y</td><td>" + this._glop._glRectBg.y + "</td></tr>";
            html += "<tr><td>isPassiveDrag</td><td>" + this._glop.isPassiveDrag() + "</td></tr>";


            html += "</table>";

            html += "<div><code><pre>";
            html += JSON.stringify(this._glop.opUiAttribs, false, 4);
            html += "</code></pre></div>";

            this._tab.html(html);
        }
        else
        {
            this._tab.html("please select op");
        }
    }
}
