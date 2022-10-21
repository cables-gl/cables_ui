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
}
