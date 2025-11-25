import { ModalBackground, Logger, ele } from "cables-shared-client";
import { Anim, utils } from "cables";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { gui } from "../gui.js";

/**
 * @typedef KeyObject
 * @property {number} pos
 * @property {number} posy
 */

/**
 * gradient editor dialog
 */
export default class GradientEditor
{
    #op = null;
    #port = null;
    #bg = null;
    #elContainer = null;
    #anim = null;
    #log = null;
    #oldKeys = [];
    #keys = [];

    #keyWidth = 8;
    _keyHeight = 8;
    _keyStrokeWidth = 2;
    _keyOpacity = 1;
    _dragDownDeleteThreshold = 120;
    #width = 512;
    #height = 100;

    _callback = null;
    _ctx = null;

    #currentKey = null;
    _oldCurrentKey = null;
    #options = {};
    #openerEle;
    #previousContent;
    #downDot = null;

    constructor(opid, portname, options)
    {
        this.#log = new Logger("gradienteditor");
        this._opId = opid;
        this._portName = portname;

        this.#op = gui.corePatch().getOpById(this._opId);
        this.#port = this.#op.getPort(this._portName);
        this.type = this.#port.uiAttribs.gradientType || "gradient";

        this.#anim = new Anim();
        this.#anim.defaultEasing = Anim.EASING_SMOOTHSTEP;

        this.#elContainer = null;
        this.#bg = new ModalBackground();
        this.#bg.on("hide", () =>
        {
            this.close();
        });

        this.#options.smoothStep = this.#port.uiAttribs.gradEditSmoothstep;
        this.#options.step = this.#port.uiAttribs.gradEditStep;
        this.#options.oklab = this.#port.uiAttribs.gradOklab;

        this.#previousContent = "";
        this.#openerEle = (options || {}).openerEle;
    }

    close()
    {
        this.#bg.hide();
        this.#elContainer.remove();
    }

    /**
     * @param {number} i
     */
    selectKey(i)
    {
        this.setCurrentKey(this.#keys[i]);
    }

    updateCanvas()
    {
        if (!this._ctx)
        {
            const canvas = ele.byId("gradientEditorCanvas");
            // const canvasCurve = ele.byId("gradientEditorCanvasCurve");
            if (!canvas)
            {
                this.#log.error("[gradienteditor] no canvas found");
                return;
            }
            this._ctx = canvas.getContext("2d");
            // this._ctxCurve = canvasCurve.getContext("2d");
            this._imageData = this._ctx.createImageData(this.#width, 1);
        }

        let keys = [];
        if (this.#keys.length == 0) keys.push({
            "posy": 0.5,
            "pos": 0,
            "r": 0,
            "g": 0,
            "b": 0
        });
        else keys = [{
            "posy": this.#keys[0].posy,
            "pos": 0,
            "r": this.#keys[0].r,
            "g": this.#keys[0].g,
            "b": this.#keys[0].b
        }].concat(this.#keys);

        const last = keys[keys.length - 1];
        keys.push({
            "posy": last.posy,
            "pos": 1,
            "r": last.r,
            "g": last.g,
            "b": last.b
        });

        if (this.type == "curve")
        {
            this._ctxCurve.fillStyle = "#444";
            this._ctxCurve.fillRect(0, 0, this.#width, this.#height);

            // --------- 0.5 line...

            this._ctxCurve.strokeStyle = "#333";
            this._ctxCurve.beginPath();
            this._ctxCurve.moveTo(0, this.#height / 2);
            this._ctxCurve.lineTo(this.#width, this.#height / 2);
            this._ctxCurve.stroke();

            // --------- linear

            this._ctxCurve.strokeStyle = "#777";
            this._ctxCurve.lineWidth = 1;
            this._ctxCurve.beginPath();
            this._ctxCurve.moveTo(keys[0].pos * this.#width, keys[0].posy * this.#height - this.#keyWidth / 2);

            for (let i = 0; i < keys.length - 1; i++)
                this._ctxCurve.lineTo(
                    Math.floor(keys[i].pos * this.#width - this.#keyWidth / 2),
                    Math.floor(keys[i].posy * this.#height - this.#keyWidth / 2 + 1)
                );

            this._ctxCurve.lineTo(keys[keys.length - 1].pos * this.#width, keys[keys.length - 1].posy * this.#height - this.#keyWidth / 2);
            this._ctxCurve.stroke();

        }
        else
        {
            for (let i = 0; i < keys.length - 1; i++)
            {
                this._setKeyStyle(keys[i]);
                const keyA = keys[i];
                const keyB = keys[i + 1];

                for (let x = keyA.pos * this.#width; x < keyB.pos * this.#width; x++)
                {
                    x = Math.round(x);
                    let p = utils.map(x, keyA.pos * this.#width, keyB.pos * this.#width, 0, 1);

                    if (this.#options.smoothStep) p = utils.smoothStep(p);
                    if (this.#options.step) p = Math.round(p);

                    if (this.#options.oklab)
                    {
                        const klabA = this.rgbToOklab(keyA.r, keyA.g, keyA.b);
                        const labA_r = klabA[0];
                        const labA_g = klabA[1];
                        const labA_b = klabA[2];

                        const klabB = this.rgbToOklab(keyB.r, keyB.g, keyB.b);
                        const labB_r = klabB[0];
                        const labB_g = klabB[1];
                        const labB_b = klabB[2];

                        const l = ((p * labB_r + (1.0 - p) * labA_r));
                        const a = ((p * labB_g + (1.0 - p) * labA_g));
                        const b = ((p * labB_b + (1.0 - p) * labA_b));

                        const pixCol = this.oklabToRGB(l, a, b);
                        this._imageData.data[x * 4 + 0] = Math.round(pixCol[0] * 255);
                        this._imageData.data[x * 4 + 1] = Math.round(pixCol[1] * 255);
                        this._imageData.data[x * 4 + 2] = Math.round(pixCol[2] * 255);
                        this._imageData.data[x * 4 + 3] = 255;
                    }
                    else
                    {
                        this._imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
                        this._imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
                        this._imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;
                        this._imageData.data[x * 4 + 3] = 255;
                    }
                }
            }

            this._ctx.putImageData(this._imageData, 0, 0);
        }

        if (this._opId && this._portName)
        {
            const keyData = [];
            for (let i = 0; i < keys.length; i++)
            {
                keyData[i] =
                    {
                        "pos": keys[i].pos,
                        "posy": keys[i].posy,
                        "r": keys[i].r,
                        "g": keys[i].g,
                        "b": keys[i].b
                    };
            }

            this.#port.set(JSON.stringify({ "keys": keyData }));
        }
    }

    /**
     * @param {Object} key
     */
    _setKeyStyle(key)
    {
        const attr = {};

        // if (key.rect)
        // {
        //     if (this.type == "curve")
        //     {
        //         attr.fill = "#888";
        //         attr.stroke = "#fff";
        //     }
        //     else
        //     {
        //         attr.fill = "rgba(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + "," + this._keyOpacity + ")";
        //         attr.stroke = this.getInvStrokeColor(key.r, key.g, key.b);
        //     }

        //     key.rect.attr(attr);
        // }
    }

    onChange()
    {
        function compare(a, b) { return a.pos - b.pos; }

        this.#keys.sort(compare);

        this.#anim.clear();
        let html = "";
        for (let i = 0; i < this.#keys.length; i++)
        {
            this.#keys[i].pos = Math.min(1.0, Math.max(this.#keys[i].pos, 0));
            this.#keys[i].posy = Math.min(1.0, Math.max(this.#keys[i].posy, 0));

            html += "<a data-index=\"" + i + "\" onclick=\"CABLES.GradientEditor.editor.selectKey(" + i + ")\" class=\"keyindex button-small\">" + i + "</a> ";

            this.#anim.setValue(this.#keys[i].pos, this.#keys[i].posy);
        }

        ele.byId("gradienteditorKeys").innerHTML = html;

        this._timeout = setTimeout(
            () =>
            {
                if (CABLES.GradientEditor.editor) CABLES.GradientEditor.editor.updateCanvas();
            }, 3);

        if (this._callback) this._callback();
    }

    /**
     * @param {KeyObject} k
     */
    deleteKey(k)
    {
        if (this.#keys.length < 2) return;
        k.ele.remove();
        this.#keys.splice(this.#keys.indexOf(k), 1);
        this.onChange();
    }

    setCurrentKey(key)
    {
        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].ele.classList.remove("active");

        this.#currentKey = key;
        if (this.#currentKey) this.#currentKey.ele.classList.add("active");

        // if (key == this._currentKey) this._currentKey.rect.attr({ "stroke-width": this._keyStrokeWidth * 2 });

        ele.byId("gradientColorInput").style.backgroundColor = "rgb(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ")";
    }

    getInvStrokeColor(r, g, b)
    {
        if (this.type == "curve") return "rgba(255,255,255,1)";
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
     */
    addKey(pos, posy, r, g, b)
    {
        if (r == undefined)
        {
            r = Math.random();
            g = Math.random();
            b = Math.random();
        }

        // const rect = this._paper.ellipse(
        //     pos * this._width - this._keyWidth / 2,
        //     posy * this._height - this._keyWidth / 2,
        //     this._keyWidth,
        //     this._keyHeight).attr(
        //     {
        //         "fill": "transparent",
        //         "stroke": this.getInvStrokeColor(r, g, b),
        //         "stroke-width": this._keyStrokeWidth
        //     });

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
            "b": b
        };

        this._setKeyStyle(key);

        this.#keys.push(key);
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
                this.deleteKey(key);
                this.setCurrentKey(this.#keys[0]);
                return;
            }
            else
            {
                this.#downDot = dot;
                if (this.#downDot) this.#downDot.style.pointerEvents = "none";

                this.setCurrentKey(key);
            }
        });

        // const move = (dx, dy, x, y, e) =>
        // {
        //     this.setCurrentKey(key);
        //     this._movingkey = true;
        //     const attribs = {};

        //     attribs.stroke = this.getInvStrokeColor(key.r, key.g, key.b);

        //     if (e.target.tagName == "svg" || e.target.tagName == "circle" || e.target.tagName == "ellipse")
        //     {
        //         let eX = e.offsetX - (this._keyWidth / 2);
        //         let eY = e.offsetY - (this._keyWidth / 2);

        //         eX = Math.max(eX, 0);
        //         eY = Math.max(eY, 0);
        //         eX = Math.min(eX, this._width);
        //         eY = Math.min(eY, this._height);

        //         attribs.cx = eX;
        //         attribs.cy = eY;

        //         key.pos = (eX + (this._keyWidth / 2)) / this._width;
        //         key.posy = (eY + (this._keyWidth / 2)) / this._height;
        //     }

        //     rect.attr(attribs);
        //     this.onChange();
        // };

        // const down = (x, y, e) =>
        // {
        //     try
        //     { e.target.setPointerCapture(e.pointerId); }
        //     catch (_e)
        //     {}

        //     if (e.buttons == 2) shouldDelete = true;

        //     this._startMouseY = y;
        //     this._movingkey = true;
        //     this.setCurrentKey(key);
        // };

        // const up = (e) =>
        // {
        //     try
        //     { e.target.releasePointerCapture(e.pointerId); }
        //     catch (_e)
        //     {}

        //     setTimeout(() =>
        //     {
        //         this._movingkey = false;
        //     }, 100);

        //     if (shouldDelete && key.rect)
        //     {
        //         key.rect.remove();
        //         this.deleteKey(key);
        //     }
        // };

        // if (rect) rect.drag(move, down, up);
    }

    /**
     * @param {Function} cb
     */
    show(cb)
    {
        this._callback = cb;

        if (window.gui && gui.currentModal) gui.currentModal.close();

        const html = getHandleBarHtml("GradientEditor", { "name": this._portName });

        this.#bg.show(true);

        this.#elContainer = document.createElement("div");
        this.#elContainer.classList.add("gradientEditorContainer");
        this.#elContainer.classList.add("cablesCssUi");

        document.body.appendChild(this.#elContainer);
        this.#elContainer.innerHTML = html;

        if (this.#openerEle)
        {
            const r = this.#openerEle.getBoundingClientRect();
            const rge = this.#elContainer.getBoundingClientRect();
            let ry = r.y;
            if (window.innerHeight - ry < this.#height * 1.5) ry -= this.#height * 1.5;
            this.#elContainer.style.left = r.x - rge.width - 20 + "px";
            this.#elContainer.style.top = ry + "px";
        }
        else
        {
            this.#elContainer.style.left = 100 + "px";
            this.#elContainer.style.top = 100 + "px";
        }
        // this._paper = Raphael("gradienteditorbar", 0, 0);
        // document.querySelector("#gradienteditorbar svg").addEventListener("pointerdown", (e) =>
        // {
        //     try
        //     { e.target.setPointerCapture(e.pointerId); }
        //     catch (_e)
        //     {}
        // });

        // document.querySelector("#gradienteditorbar svg").addEventListener("pointerup", (e) =>
        // {
        //     try
        //     { e.target.releasePointerCapture(e.pointerId); }
        //     catch (_e)
        //     {}
        // });

        ele.byId("gradientEditorCanvas").addEventListener("pointerup", (e) =>
        {
            if (this.#downDot)
            {
                this.#downDot.style.pointerEvents = "initial";
                this.#downDot = null;
            }
        });

        ele.byId("gradientEditorCanvas").addEventListener("pointermove", (e) =>
        {
            if (this.#downDot)
            {
                this.#currentKey.ele.style.marginTop = e.layerY - (this.#keyWidth / 2) + "px";
                this.#currentKey.ele.style.marginLeft = e.offsetX - (this.#keyWidth / 2) + "px";
                this.#currentKey.posy = (e.offsetY + (this.#keyWidth / 2)) / this.#height;
                this.#currentKey.pos = (e.offsetX + (this.#keyWidth / 2)) / this.#width;
                this.onChange();
            }

        });

        ele.byId("gradientEditorCanvas").addEventListener("click", (e) =>
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
                    this.addKey(keys[i].pos, keys[i].posy, keys[i].r, keys[i].g, keys[i].b);
            }
            catch (e)
            {
                this.#log.error(e);
            }
        }

        if (this.#keys.length == 0)
        {
            this.addKey(0, 0.5, 0, 0, 0);
            this.addKey(1, 0.5, 1, 1, 1);
        }

        this.onChange();
        CABLES.GradientEditor.editor = this;

        ele.byId("gradientSaveButton").addEventListener("click", () =>
        {
            this.close();
        });

        ele.byId("gradientCancelButton").addEventListener("click", () =>
        {
            const op = gui.corePatch().getOpById(this._opId);
            op.getPort(this._portName).set(this.#previousContent);
            this.close();
        });

        const colEleDel = ele.byId("gradientColorDelete");
        colEleDel.addEventListener("click", (e) =>
        {
            if (this.#currentKey)
            {
                this.#currentKey.ele.remove();
                this.deleteKey(this.#currentKey);
                this.#currentKey = this.#keys[0];
            }
        });

        if (this.type == "curve") ele.byId("gradientColorInput").classList.add("hidden");
        else ele.byId("gradientColorInput").classList.remove("hidden");

        const colEle = ele.byId("gradientColorInput");

        colEle.addEventListener("click", (e) =>
        {
            if (!this.#currentKey) return;
            const cr = new ColorRick({
                "ele": colEle,
                "color": [parseInt(this.#currentKey.r * 255), parseInt(this.#currentKey.g * 255), parseInt(this.#currentKey.b * 255)], // "#ffffff",
                "onChange": (col) =>
                {
                    if (this.#currentKey)
                    {
                        this.#currentKey.r = col.gl()[0];
                        this.#currentKey.g = col.gl()[1];
                        this.#currentKey.b = col.gl()[2];

                        CABLES.GradientEditor.editor._ctx = null;
                        CABLES.GradientEditor.editor.onChange();

                        colEle.style.backgroundColor = col.hex();
                    }
                }
            });
        });
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    rgbToOklab(r, g, b)
    {
        let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
        l = Math.cbrt(l);
        m = Math.cbrt(m);
        s = Math.cbrt(s);
        return [
            l * +0.2104542553 + m * +0.7936177850 + s * -0.0040720468,
            l * +1.9779984951 + m * -2.4285922050 + s * +0.4505937099,
            l * +0.0259040371 + m * +0.7827717662 + s * -0.8086757660
        ];
    }

    /**
     * @param {number} value
     * @param {number} min
     * @param {number} max
     */
    clamp(value, min, max)
    {
        return Math.max(Math.min(value, max), min);
    }

    /**
     * @param {number} L
     * @param {number} a
     * @param {number} b
     */
    oklabToRGB(L, a, b)
    {
        let l = L + a * +0.3963377774 + b * +0.2158037573;
        let m = L + a * -0.1055613458 + b * -0.0638541728;
        let s = L + a * -0.0894841775 + b * -1.2914855480;
        l **= 3;
        m **= 3;
        s **= 3;
        let rgb_r = l * +4.0767416621 + m * -3.3077115913 + s * +0.2309699292;
        let rgb_g = l * -1.2684380046 + m * +2.6097574011 + s * -0.3413193965;
        let rgb_b = l * -0.0041960863 + m * -0.7034186147 + s * +1.7076147010;
        rgb_r = utils.clamp(rgb_r, 0, 1);
        rgb_g = utils.clamp(rgb_g, 0, 1);
        rgb_b = utils.clamp(rgb_b, 0, 1);
        return [rgb_r, rgb_g, rgb_b];
    }
}
