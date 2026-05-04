import { ModalBackground, Logger, ele, Events } from "cables-shared-client";
import { Anim } from "cables";
import { uuid } from "cables/src/core/utils.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { gui } from "../gui.js";
import { DomEvents } from "../theme.js";

/**
 * @typedef KeyObject
 * @property {number} pos
 * @property {number} r
 * @property {number} g
 * @property {number} b
 * @property {number} a
 * @property {number} posy
 * @property {HTMLElement} ele
 */

/**
 * @typedef CanvasPointEditorOptions
 * @property {HTMLElement} openerEle
 * @property {string} [template]
 */

/**
 * gradient editor dialog
 */
export default class CanvasPointEditor extends Events
{
    op = null;
    port = null;
    _bg = null;
    _elContainer = null;
    anim = null;
    #log = new Logger("canvasPointEditor");

    /** @type {KeyObject[]} */
    keys = [];

    #keyWidth = 8;
    #keyHeight = 8;
    #keyStrokeWidth = 2;
    #keyOpacity = 1;
    #dragDownDeleteThreshold = 120;
    #width = 512;
    #height = 100;
    #callback = null;
    ctx = null;
    #currentKey = null;
    #oldCurrentKey = null;

    /** @type {CanvasPointEditorOptions} */
    options = { "openerEle": null };
    openerEle;
    #previousContent;
    #downDot = null;
    #docListener = null;
    #id = uuid();

    /**
     * @param {any} opid
     * @param {any} portname
     * @param {CanvasPointEditorOptions} options
     */
    constructor(opid, portname, options)
    {
        super();
        this._opId = opid;
        this._portName = portname;

        this.op = gui.corePatch().getOpById(this._opId);
        this.port = this.op.getPort(this._portName);
        this.type = this.port.uiAttribs.gradientType || "gradient";

        this.anim = new Anim();
        this.anim.defaultEasing = Anim.EASING_SMOOTHSTEP;

        this._bg = new ModalBackground();
        this._bg.on("hide", () =>
        {
            this.close();
        });

        this.options.smoothStep = this.port.uiAttribs.gradEditSmoothstep;
        this.options.step = this.port.uiAttribs.gradEditStep;
        this.options.oklab = this.port.uiAttribs.gradOklab;

        this.#previousContent = "";
        this.openerEle = (options || {}).openerEle;
        this.updateOpenerBackground();
    }

    updateCanvas()
    {
        console.log("updateCanvas: overwrite me!");
    }

    updateOpenerBackground()
    {
        this.openerEle.style.background = "red";
    }

    get id() { return this.#id; }

    get width() { return this.#width; }
    get height() { return this.#height; }

    close()
    {
        this._bg.hide();
        if (this._elContainer) this._elContainer.remove();
        this._elContainer = null;

    }

    /**
     * @param {number} i
     */
    selectKey(i)
    {
        this.setCurrentKey(this.keys[i]);
    }

    onChange()
    {
        function compare(a, b) { return a.pos - b.pos; }

        this.keys.sort(compare);

        this.anim.clear();
        let html = "";
        for (let i = 0; i < this.keys.length; i++)
        {
            this.keys[i].pos = Math.min(1.0, Math.max(this.keys[i].pos, 0));
            this.keys[i].posy = Math.min(1.0, Math.max(this.keys[i].posy, 0));

            html += "<a data-index=\"" + i + "\" id=\"" + this.id + "-" + i + "\" class=\"keyindex button-small\">" + i + "</a> ";

            this.anim.setValue(this.keys[i].pos, this.keys[i].posy);
        }

        ele.byId(this.#id + "Keys").innerHTML = html;

        for (let i = 0; i < this.keys.length; i++)
            ele.clickable(ele.byId(this.id + "-" + i), (e) =>
            {
                this.selectKey(e.srcElement.dataset.index);
            });

        this._timeout = setTimeout(() =>
        {
            this.updateCanvas();
        }, 10);

        if (this.#callback) this.#callback();
    }

    /**
     * @param {KeyObject} k
     */
    deleteKey(k)
    {
        this.keys.splice(this.keys.indexOf(k), 1);
        if (k.ele)
        {
            k.ele.remove();
            k.ele = null;
        }

        this.onChange();
    }

    /**
     * @param {KeyObject} key
     */
    setCurrentKey(key)
    {
        for (let i = 0; i < this.keys.length; i++)
            this.keys[i].ele.classList.remove("active");

        this.#currentKey = key;
        if (this.#currentKey) this.#currentKey.ele.classList.add("active");

        ele.byId(this.#id + "ColorInput").style.backgroundColor = "rgb(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ")";
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    getInvStrokeColor(r, g, b)
    {
        let invCol = (r + g + b) / 3;

        if (invCol < 0.5) invCol = 1.0;
        else invCol = 0.0;

        const s = "rgba(" + invCol * 255 + "," + invCol * 255 + "," + invCol * 255 + ",1.0)";
        return s;
    }

    /**
     * @param {number} pos
     * @param {number} posy
     * @param {number} [r]
     * @param {number} [g]
     * @param {number} [b]
     * @param {number} [a]
     */
    addKey(pos, posy, r, g, b, a)
    {
        if (r == undefined)
        {
            r = Math.random();
            g = Math.random();
            b = Math.random();
            a = 1;
        }

        if (a === undefined)a = 1;

        const dot = document.createElement("div");
        dot.classList.add("dot");
        ele.byId("gradienteditorbar").appendChild(dot);
        dot.style.marginLeft = (pos * this.#width - this.#keyWidth / 2) + "px";
        dot.style.marginTop = (posy * this.#height - this.#keyWidth / 2) + "px";
        dot.style.width = this.#keyWidth + "px";
        dot.style.height = this.#keyWidth + "px";

        const key = {
            "posy": posy,
            "pos": pos,
            "ele": dot,
            "r": r,
            "g": g,
            "b": b,
            "a": a
        };

        this.keys.push(key);
        let shouldDelete = false;
        this.setCurrentKey(key);

        dot.addEventListener("pointerup", (e) =>
        {
            if (this.#downDot) this.#downDot.style.pointerEvents = "initial";
            this.#downDot = null;
        });

        dot.addEventListener("pointerdown", (e) =>
        {
            if (e.buttons == 2)
            {
                if (this.keys.length < 2) return;
                this.deleteKey(key);
                this.setCurrentKey(this.keys[0]);
                return;
            }
            else
            {
                this.#downDot = dot;
                if (this.#downDot) this.#downDot.style.pointerEvents = "none";

                this.setCurrentKey(key);
            }

            this.#docListener = document.body.addEventListener("pointerup", (e) =>
            {
                document.body.removeEventListener("pointerup", this.#docListener);
                if (this.#downDot)
                {
                    this.#downDot.style.pointerEvents = "initial";
                    this.#downDot = null;
                }

            });
        });

    }

    /**
     * @param {Function} cb
     */
    show(cb = null)
    {
        this.#callback = cb;

        if (gui.currentModal) gui.currentModal.close();

        const html = getHandleBarHtml(this.options.template, {
            "id": this.#id,
            "name": this._portName });

        this._bg.show(true);
        if (!this._elContainer)
        {
            this._elContainer = document.createElement("div");
            document.body.appendChild(this._elContainer);
        }

        this._elContainer.classList.add("gradientEditorContainer");
        this._elContainer.classList.add("cablesCssUi");
        this._elContainer.innerHTML = html;

        if (this.openerEle)
        {
            const r = this.openerEle.getBoundingClientRect();
            const rge = this._elContainer.getBoundingClientRect();
            let ry = r.y;
            if (window.innerHeight - ry < this.#height * 1.5) ry -= this.#height * 1.5;
            this._elContainer.style.left = r.x - rge.width - 20 + "px";
            this._elContainer.style.top = ry + "px";
        }
        else
        {
            this._elContainer.style.left = 100 + "px";
            this._elContainer.style.top = 100 + "px";
        }

        ele.byId(this.#id + "Canvas").addEventListener(DomEvents.POINTER_DOWN, (e) =>
        {
            // ele.byId(his.options.canvasId).setPointerCapture(e.pointerId);
        });

        ele.byId(this.#id + "Canvas").addEventListener(DomEvents.POINTER_UP, (e) =>
        {
            document.body.removeEventListener("pointerup", this.#docListener); // ele.byId(his.options.canvasId).releasePointerCapture(e.pointerId);

            if (this.#downDot)
            {
                this.#downDot.style.pointerEvents = "initial";
                this.#downDot = null;
            }
        });

        ele.byId(this.#id + "Canvas").addEventListener(DomEvents.POINTER_MOVE, (e) =>
        {
            if (this.#downDot)
            {
                this.#currentKey.ele.style.marginTop = e.layerY - (this.#keyWidth / 2) + "px";
                this.#currentKey.ele.style.marginLeft = e.offsetX - (this.#keyWidth / 2) + "px";
                this.#currentKey.posy = (e.layerY + (this.#keyWidth / 2)) / this.#height;
                this.#currentKey.pos = (e.offsetX + (this.#keyWidth / 2)) / this.#width;
                this.onChange();
            }

        });

        ele.byId(this.#id + "Canvas").addEventListener("click", (e) =>
        {
            if (this.#downDot) return;
            this.addKey(e.offsetX / this.#width, e.layerY / this.#height);
            this.onChange();
        });

        if (this._opId && this._portName)
        {
            const op = gui.corePatch().getOpById(this._opId);
            if (!op) this.close();
            const data = op.getPort(this._portName).get();
            try
            {
                this.#previousContent = data;
                const keys = JSON.parse(data).keys || [];
                for (let i = 1; i < keys.length - 1; i++)
                    this.addKey(keys[i].pos, keys[i].posy, keys[i].r, keys[i].g, keys[i].b, keys[i].a);
            }
            catch (e)
            {
                this.#log.error(e);
            }
        }

        if (this.keys.length == 0)
        {
            this.addKey(0, 0.5, 0, 0, 0, 1);
            this.addKey(1, 0.5, 1, 1, 1, 1);
        }

        this.onChange();

        ele.byId(this.#id + "SaveButton").addEventListener("click", () =>
        {
            this.close();
        });

        ele.byId(this.#id + "CancelButton").addEventListener("click", () =>
        {
            const op = gui.corePatch().getOpById(this._opId);
            op.getPort(this._portName).set(this.#previousContent);
            this.close();
            op.refreshParams();
        });

        ele.byId(this.#id + "Reverse").addEventListener("click", () =>
        {
            let keys = [];
            this.#currentKey = null;

            for (let i = 0; i < this.keys.length; i++) keys[i] = this.keys[i];

            while (this.keys.length) this.deleteKey(this.keys[0]);

            for (let i = 0; i < keys.length; i++)
            {
                const k = keys[i];
                this.addKey(1 - k.pos, k.posy, k.r, k.g, k.b, k.a);
            }

            this.onChange();
            this.updateCanvas();
        });

        const colEleDel = ele.byId(this.#id + "KeyDelete");
        colEleDel.addEventListener("click", (e) =>
        {
            if (this.#currentKey)
            {
                if (this.keys.length < 2) return;
                this.deleteKey(this.#currentKey);
                this.#currentKey = this.keys[0];
            }
        });

        const colEle = ele.byId(this.#id + "ColorInput");

        if (colEle)
            colEle.addEventListener("click", (e) =>
            {
                if (!this.#currentKey) return;
                const cr = new ColorRick({
                    "ele": colEle,
                    "color": [Math.floor(this.#currentKey.r * 255), Math.floor(this.#currentKey.g * 255), Math.floor(this.#currentKey.b * 255)], // "#ffffff",
                    "opacity": this.#currentKey.a,
                    "showOpacity": true,
                    "onChange": (col, a) =>
                    {
                        if (this.#currentKey)
                        {
                            this.#currentKey.r = col.gl()[0];
                            this.#currentKey.g = col.gl()[1];
                            this.#currentKey.b = col.gl()[2];
                            this.#currentKey.a = a;

                            this.ctx = null;
                            this.onChange();

                            colEle.style.backgroundColor = col.hex();
                        }
                    }
                });
            });

        this.emitEvent("open");
    }

}
