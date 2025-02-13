import { gui } from "../../gui.js";

export default class HtmlInspector
{
    constructor()
    {
        document.addEventListener("mousemove", this._move.bind(this));

        this._offsetEle = 0;

        this._hoveringOpId = null;

        this._inspectEle = document.getElementById("inspectHtmlOverlay");

        this._inspectEle.addEventListener("click", () =>
        {
            gui.patchView.centerSelectOp(this._hoveringOpId);
            gui.opParams.show(this._hoveringOpId);
        }, { "passive": true });

        this._inspectEle.addEventListener("mouseleave", () =>
        {
            this._inspectEle.classList.add("hidden");
        }, { "passive": true });

        this._inspectEle.addEventListener("wheel", (e) =>
        {
            this._offsetEle++;
            this._move(e);
            e.preventDefault();
        }, { "passive": true });
    }

    _move(e)
    {
        clearTimeout(this._timeoutHide);

        if (!e.ctrlKey) return;

        const eles = document.getElementsByClassName("cablesEle");

        const found = [];

        for (let i = 0; i < eles.length; i++)
        {
            const r = eles[i].getBoundingClientRect();

            if (e.pageX > r.x && e.pageX < r.x + r.width &&
                e.pageY > r.y && e.pageY < r.y + r.height)
            {
                found.push(eles[i]);
            }
        }

        if (found.length)
        {
            const index = this._offsetEle % found.length;
            const theEle = found[index];

            this._hoveringOpId = theEle.dataset.op;

            const r = theEle.getBoundingClientRect();

            this._inspectEle.classList.remove("hidden");

            this._inspectEle.style.left = r.x + "px";
            this._inspectEle.style.top = r.y + "px";
            this._inspectEle.style.width = r.width + "px";
            this._inspectEle.style.height = r.height + "px";
        }
    }
}
