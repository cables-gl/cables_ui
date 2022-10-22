export default class CanvasManager
{
    constructor()
    {
        this._curContextIdx = 0;
        this._contexts = [];
    }

    currentCanvas()
    {
        return this._contexts[this._curContextIdx].canvas;
    }

    addContext(c)
    {
        for (let i = 0; i < this._contexts.length; i++)
            if (this._contexts[i] == c) return;

        if (!c.canvasUi) c.canvasUi = new CABLES.UI.CanvasUi(c);

        this._contexts.push(c);
        console.log("canvasmanager added", c.getGApiName());


        const ctx = c;
        gui.cmdPallet.addDynamic("canvas", "canvas " + ctx.getGApiName(), () =>
        {
            ctx.canvas.focus();

            console.log(ctx.getGApiName());
        }, "cables");
    }

    getCanvasUiBar()
    {
        return this._contexts[this._curContextIdx].canvasUi;
    }

    setCurrentCanvas(canv)
    {
        for (let i = 0; i < this._contexts.length; i++)
        {
            if (this._contexts[i].canvas == canv)
            {
                this._curContextIdx = i;
                this._contexts[i].canvas.style["z-index"] = 0;
            }
            else this._contexts[i].canvas.style["z-index"] = -1;
        }
    }

    setSize(w, h)
    {
        for (let i = 0; i < this._contexts.length; i++)
        {
            const density = this._contexts[i].pixelDensity;
            const el = this._contexts[i].canvas;

            el.setAttribute("width", w * density);
            el.setAttribute("height", h * density);
            el.style.width = w + "px";
            el.style.height = h + "px";
        }
    }
}
