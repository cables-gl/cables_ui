export default class CanvasManager
{
    constructor()
    {
        this._curContextIdx = 0;
        this._contexts = [];
        this.subWindow = null;
        this._menuEle = null;

        this.CANVASMODE_NORMAL = 0;
        this.CANVASMODE_PATCHBG = 1;
        this.CANVASMODE_FULLSCREEN = 2;
        this.CANVASMODE_POPOUT = 3;

        this._canvasMode = this.CANVASMODE_NORMAL;

        window.addEventListener("beforeunload", () =>
        {
            if (this.subWindow) this.subWindow.close();
        });
    }

    set mode(m)
    {
        const hasChanged = m != this._canvasMode;
        this._canvasMode = m;

        if (m == this.CANVASMODE_POPOUT)
        {
            this.popOut();
        }
        else
        {
            gui.emitEvent("canvasModeChange", this._canvasMode);
            if (hasChanged) gui.setLayout();
            gui.corePatch().cgl.updateSize();
        }
    }

    get mode()
    {
        return this._canvasMode;
    }


    currentContext()
    {
        return this._contexts[this._curContextIdx];
    }

    currentCanvas()
    {
        if (!this._contexts[this._curContextIdx]) return null;
        return this._contexts[this._curContextIdx].canvas;
    }

    addContext(c)
    {
        for (let i = 0; i < this._contexts.length; i++) if (this._contexts[i] == c) return;

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
        if (this.currentCanvas()) this.currentCanvas().blur();
    }

    focus()
    {
        if (this.currentCanvas()) this.currentCanvas().focus();
        this.updateCanvasUi();
    }

    updateCanvasUi()
    {
        if (!this._menuEle) this._menuEle = ele.byId("canvasCtxSwitcher");

        if (this._menuEle)
        {
            for (let i = 0; i < this._contexts.length; i++)
            {
                if (this._contexts[i].canvas == this.currentCanvas())
                {
                    this._menuEle.innerText = this._contexts[i].getGApiName();
                }
            }
        }
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

        this.updateCanvasUi();
    }

    setSize(w, h)
    {
        for (let i = 0; i < this._contexts.length; i++)
        {
            const density = this._contexts[i].pixelDensity;
            const el = this._contexts[i].canvas;

            this._contexts[i].setSize(w, h);
        }
    }


    screenShot(cb, mimeType = "image/png", quality = 1)
    {
        if (this.currentCanvas() && this.currentCanvas().toBlob)
        {
            const url = this.currentCanvas().toDataURL();
            console.log(url);
        //         (blob) =>//
        //         {
        //             if (cb) cb(blob);
        //             else this._log.log("no screenshot callback...");
        //         }, mimeType, quality);
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
            items.push({ "title": i + ": " + ctx.getGApiName(),
                "func": () =>
                {
                    ctx.canvas.focus();
                    this.updateCanvasUi();
                } });
        }

        this._menuEle = el;
        this.updateCanvasUi();

        CABLES.contextMenu.show({ "items": items }, el);
    }


    popOut()
    {
        if (this._canvasMode === this.CANVASMODE_POPOUT)
        {
            if (this.subWindow)
            {
                this.subWindow.focus();
            }
            return;
        }
        if (this.subWindow)
        {
            // this leads to problems with internally registered electron listeners
            // so we close and ignore errors (as that works, even in electron)
            try { this.subWindow.close(); }
            catch (e) {}
            this.subWindow = null;
        }
        let id = CABLES.uuid();
        this.subWindow = window.open("", "view#" + id, "width=" + 500 + ",height=" + 500 + ",directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true");
        if (!this.subWindow) return;
        let nDocument = this.subWindow.document;
        nDocument.title = "cables";

        let nBody = nDocument.body;

        gui.corePatch().emitEvent("windowChanged", this.subWindow);



        const style = document.createElement("style");
        style.innerHTML = "body{padding:0;margin:0;background-color:black;overflow:hidden;color:#aaa;font-family:arial;}" +
            "#glcanvas{position:absolute;}" +
            ":focus{outline:unset;}";
        nBody.appendChild(style);

        // <link rel="stylesheet" type="text/css" media="all" href="css/style-dark.css">

        nBody.classList.add("cablesCssUi");

        const containerEle = nDocument.createElement("div");

        containerEle.classList.add("bgpatternDark");
        containerEle.classList.add("bgPatternDark");
        containerEle.style.width = "100%";
        containerEle.style.height = "100%";
        nBody.appendChild(containerEle);

        containerEle.id = "cablescanvas";

        // const base = document.createElement("base");
        // base.setAttribute("href", "https://meineSeite.de/");
        // document.head.appendChild(base);


        const p = gui.corePatch().cgl.canvas.parentElement;

        while (p.childNodes.length > 0)
        {
            containerEle.appendChild(p.childNodes[0]);
        }

        // const cablesEles = document.body.getElementsByClassName("cablesEle");
        // for (let i = 0; i < cablesEles.length; i++)nBody.appendChild(cablesEles[i]);

        while (document.body.getElementsByClassName("cablesEle").length > 0)
        {
            nBody.appendChild(document.body.getElementsByClassName("cablesEle")[0]);
        }

        this.subWindow.addEventListener("resize", () =>
        {
            // console.log(this.subWindow.innerWidth, this.subWindow.innerHeight);
            gui.corePatch().cgl.setSize(this.subWindow.innerWidth, this.subWindow.innerHeight);
            gui.corePatch().cgl.updateSize();
        });

        this.subWindow.addEventListener("beforeunload", () =>
        {
            while (containerEle.childNodes.length > 0)
            {
                p.appendChild(containerEle.childNodes[0]);
            }

            while (nBody.getElementsByClassName("cablesEle").length > 0)
            {
                document.body.appendChild(nBody.getElementsByClassName("cablesEle")[0]);
            }
            // for (let i = 0; i < ncablesEles.length; i++)

            gui.corePatch().cgl.updateSize();
            this._canvasMode = this.CANVASMODE_NORMAL;
            gui.setLayout();
        });

        this._canvasMode = this.CANVASMODE_POPOUT;
        gui.emitEvent("canvasModeChange", this._canvasMode);

        gui.setLayout();
    }
}
