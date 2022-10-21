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


        gui.cmdPallet.addDynamic("canvas", "canvas " + c.getGApiName(), () => { console.log(1); }, "cables");
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
                console.log("this._curContextIdx", this._curContextIdx);
            }
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
