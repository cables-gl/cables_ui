export default class CanvasManager
{
    constructor()
    {
        this._curContextIdx = 0;
        this._contexts = [];
    }

    currentCanvas()
    {
        if (!this._contexts[this._curContextIdx]) return null;
        return this._contexts[this._curContextIdx].canvas;
    }

    addContext(c)
    {
        for (let i = 0; i < this._contexts.length; i++)
            if (this._contexts[i] == c) return;

        if (!c.canvasUi) c.canvasUi = new CABLES.UI.CanvasUi(c);

        this._contexts.push(c);
        const ctx = c;
        gui.cmdPallet.addDynamic("canvas", "canvas " + ctx.getGApiName(), () =>
        {
            ctx.canvas.focus();
        }, "cables");
    }

    getCanvasUiBar()
    {
        if (!this._contexts[this._curContextIdx]) return null;
        return this._contexts[this._curContextIdx].canvasUi;
    }

    blur()
    {
        this.currentCanvas().blur();
    }

    focus()
    {
        this.currentCanvas().focus();
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


    screenShot(cb, mimeType = "image/png", quality = 1)
    {
        if (this.currentCanvas() && this.currentCanvas().toBlob)
        {
            this.currentCanvas().toBlob(
                (blob) =>
                {
                    if (cb) cb(blob);
                    else this._log.log("no screenshot callback...");
                }, mimeType, quality);
        }
        else
        {
            console.log("canvasmanager no current canvas");
            cb(null);
        }
    }

    menu(el)
    {
        let items = [];

        for (let i = 0; i < this._contexts.length; i++)
        {
            const ctx = this._contexts[i];
            items.push({ "title": ctx.getGApiName(),
                "func": () =>
                {
                    ctx.canvas.focus();
                } });
        }

        CABLES.contextMenu.show({ "items": items }, el);
    }
}
