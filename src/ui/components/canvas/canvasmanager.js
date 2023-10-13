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
            items.push({ "title": ctx.getGApiName(),
                "func": () =>
                {
                    ctx.canvas.focus();
                } });
        }

        CABLES.contextMenu.show({ "items": items }, el);
    }


    popOut()
    {
        if (this.subWindow)close();
        let id = CABLES.uuid();
        this.subWindow = window.open("", "view#" + id, "width=" + 500 + ",height=" + 500 + ",directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true");
        if (!this.subWindow) return;
        let document = this.subWindow.document;
        document.title = "jo";

        let body = document.body;

        // const img = document.createElement("img");
        // img.setAttribute("src", "http://localhost:5711/assets/6528ff86a3da3169c9cfef49/production_0_side.jpg?rnd629ea44b-fff0-4f1d-885c-db95d63aae30/production_0_side.jpg?rnd=629ea44b-fff0-4f1d-885c-db95d63aae30");
        // img.onload = () => { console.log("load"); };
        // body.appendChild(img);
        // console.log("huhu");

        const style = document.createElement("link");
        style.setAttribute("href", "/ui/css/style-dark.css");
        style.setAttribute("rel", "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("media", "all");

        style.onload = () => { console.log("load"); };

        document.head.appendChild(style);

        // <link rel="stylesheet" type="text/css" media="all" href="css/style-dark.css">

        body.classList.add("cablesCssUi");

        const containerEle = document.createElement("div");

        containerEle.classList.add("bgpatternDark");
        containerEle.classList.add("bgPatternDark");
        containerEle.style.width = "100%";
        containerEle.style.height = "100%";
        body.appendChild(containerEle);

        containerEle.id = "cablescanvas";

        // overflow: hidden; width: 891px; height: 552px; position: absolute; right: 0px; z-index: 10; left: initial; transform-origin: right top; transform: scale(1);


        const p = gui.corePatch().cgl.canvas.parentElement;

        while (p.childNodes.length > 0)
        {
            containerEle.appendChild(p.childNodes[0]);
        }

        this.subWindow.addEventListener("resize", () =>
        {
            console.log(this.subWindow.innerWidth, this.subWindow.innerHeight);
            gui.corePatch().cgl.setSize(this.subWindow.innerWidth, this.subWindow.innerHeight);
            gui.corePatch().cgl.updateSize();
        });

        this.subWindow.addEventListener("beforeunload", () =>
        {
            while (containerEle.childNodes.length > 0)
            {
                p.appendChild(containerEle.childNodes[0]);
            }

            gui.corePatch().cgl.updateSize();
            this.poppedOut = false;
            gui.setLayout();
        });

        this.poppedOut = true;
        gui.setLayout();
    }
}
