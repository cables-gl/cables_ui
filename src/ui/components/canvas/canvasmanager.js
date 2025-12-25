import { ele } from "cables-shared-client";
import { utils } from "cables";
import { CgContext } from "cables-corelibs";
import { uuid } from "cables/src/core/utils.js";
import { gui } from "../../gui.js";
import CanvasUi from "./canvasui.js";
import { contextMenu } from "../../elements/contextmenu.js";

/**
 * @typedef CanvasContext
 * @property {CgContext} [cg]
 * @property {string} id
 * @property {string} title
 * @property {CanvasUi} [canvasUi]
 * @property {HTMLCanvasElement} canvas
 */

export default class CanvasManager
{

    /** @type {CanvasContext[]} */
    #contexts = [];
    #curContextIdx;

    /** @type {HTMLElement} */
    #menuEle;

    constructor()
    {
        this.#curContextIdx = 0;
        this.#contexts = [];
        this.subWindow = null;
        this.#menuEle = null;

        this.CANVASMODE_NORMAL = 0;
        this.CANVASMODE_PATCHBG = 1;
        this.CANVASMODE_MAXIMIZED = 2;
        this.CANVASMODE_POPOUT = 3;

        /** @deprecated */
        this.CANVASMODE_FULLSCREEN = 2;

        this._canvasMode = this.CANVASMODE_NORMAL;

        window.addEventListener("beforeunload", () =>
        {
            if (this.subWindow) this.subWindow.close();
        });

        this.#findNonCgContexts();
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

    /**
     * @returns {CgContext}
     */
    currentContextCg()
    {
        return this.#contexts[this.#curContextIdx]?.cg;
    }

    currentCanvas()
    {
        if (!this.#contexts[this.#curContextIdx]) return null;
        return this.#contexts[this.#curContextIdx].canvas;
    }

    /**
     * @param {HTMLCanvasElement} canv
     * @param name
     * @param setsize
     */
    // addCanvas(canv, name, setsize)
    // {
    //     const ctx = {
    //         "getGApiName": () => { return name; },
    //         "setSize": setsize,
    //         "canvas": canv
    //     };
    //     this.addCgContext(ctx);

    // }

    /**
     * @param {CgContext} c
     */
    addCgContext(c)
    {
        for (let i = 0; i < this.#contexts.length; i++) if (this.#contexts[i].cg == c) return;

        const cc = {
            "cg": c,
            "canvasUi": new CanvasUi(c),
            "canvas": c.canvas,
            "title": c.getGApiName(),
            "id": uuid()
        };

        this.#contexts.push(cc);

        this.#curContextIdx = this.#contexts.length - 1;

        const ctx = c;
        gui.cmdPalette.addDynamic("canvas", "canvas " + ctx.getGApiName(), () =>
        {
            ctx.canvas.focus();
        }, "cables");
    }

    getCanvasUiBar()
    {
        if (!this.#contexts[this.#curContextIdx]) return null;
        return this.#contexts[this.#curContextIdx].canvasUi;
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
        if (!this.#menuEle) this.#menuEle = ele.byId("canvasCtxSwitcher");

        if (this.#menuEle)
        {
            for (let i = 0; i < this.#contexts.length; i++)
            {
                if (this.#contexts[i].canvas == this.currentCanvas())
                {
                    this.#menuEle.innerText = this.#contexts[i].cg?.getGApiName() || this.#contexts[i].title;
                }
            }
        }
    }

    /**
     * @param {HTMLCanvasElement} canv
     */
    setCurrentCanvas(canv)
    {
        let found = false;
        for (let i = 0; i < this.#contexts.length; i++)
        {
            if (this.#contexts[i].canvas == canv)
            {
                found = true;
                this.#curContextIdx = i;
                this.#contexts[i].canvas.style["z-index"] = 0;
            }
            else this.#contexts[i].canvas.style["z-index"] = -1;
        }

        if (!found) console.log("canvas not found ?Q");

        this.updateCanvasUi();
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h)
    {
        for (let i = 0; i < this.#contexts.length; i++)
        {
            if (this.#contexts[i].cg)
            {
                this.#contexts[i].cg.setSize(w, h);
            }
        }
        if (this._canvasMode === this.CANVASMODE_POPOUT)
        {

        }
    }

    /**
     * @param {function} cb
     * @param mimeType
     * @param quality
     */
    screenShot(cb, mimeType = "image/png", quality = 1)
    {
        if (this.currentCanvas() && this.currentCanvas().toBlob)
        {
            const url = this.currentCanvas().toDataURL();
        }
        else
        {
            console.log("canvasmanager no current canvas");
            cb(null);
        }
    }

    /**
     * @param {HTMLElement} elem
     */
    menu(elem)
    {
        let items = [];
        this.#findNonCgContexts();

        for (let i = 0; i < this.#contexts.length; i++)
        {
            const ctx = this.#contexts[i];
            const idx = i;
            let n = ctx.cg?.getGApiName();
            if (!n)n = ctx.title;

            items.push({ "title": i + ": " + n,
                "func": () =>
                {
                    ctx.canvas.focus();
                    this.setCurrentCanvas(ctx.canvas);
                    this.updateCanvasUi();
                } });
        }

        this.#menuEle = elem;
        this.updateCanvasUi();

        contextMenu.show({ "items": items }, elem);
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
        let id = utils.uuid();
        this.subWindow = window.open("", "view#" + id, "width=" + gui.rendererWidth + ",height=" + gui.rendererHeight + ",directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=yes,popup=true");
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

    /**
     * @param {string} id
     */
    getCanvContextById(id)
    {
        for (let i = 0; i < this.#contexts.length; i++)
        {
            if (this.#contexts[i].id == id) return this.#contexts[i];

        }

    }

    #updateTitle(cc)
    {
        cc.title = cc.canvas.dataset.contextname;

    }

    #findNonCgContexts()
    {
        const canvasEles = ele.byClassAll("cablescontext");

        console.log("text", canvasEles);

        for (let i = 0; i < canvasEles.length; i++)
        {
            let found = false;

            for (let j = 0; j < this.#contexts.length; j++)
            {
                if (canvasEles[i] == this.#contexts[j].canvas)
                {
                    this.#updateTitle(this.#contexts[i]);
                    found = true;
                    break;
                }
            }

            if (!found)
            {

                const cc = {
                    "canvasUi": new CanvasUi(null, canvasEles[i]),
                    "canvas": canvasEles[i],
                    "id": uuid()
                };
                this.#updateTitle(cc);
                console.log("found ctx", cc);

                this.#contexts.push(cc);
                if (this.#contexts.length == 1) this.setCurrentCanvas(canvasEles[i]);
                this.#curContextIdx = this.#contexts.length - 1;
            }
        }

        console.log("num contexts", this.#contexts.length);

        if (this.#contexts.length == 0)setTimeout(() => { this.#findNonCgContexts(); }, 500);

    }
}
