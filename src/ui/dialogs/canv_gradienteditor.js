import { Logger, ele } from "cables-shared-client";
import { utils } from "cables";
import CanvasPointEditor from "./canv_pointeditor.js";
import { DomEvents } from "../theme.js";

/**
 * gradient editor dialog
 */
export class GradientEditor extends CanvasPointEditor
{
    #log = new Logger("gradienteditor");
    imageData = null;

    /**
     * @param {any} opid
     * @param {any} portname
     * @param {import("./canv_pointeditor.js").CanvasPointEditorOptions} options
     */
    constructor(opid, portname, options)
    {
        super(opid, portname, options);
        this._opId = opid;
        this._portName = portname;

        this.options.template = "GradientEditor";
        this.options.smoothStep = this.port.uiAttribs.gradEditSmoothstep;
        this.options.step = this.port.uiAttribs.gradEditStep;
        this.options.oklab = this.port.uiAttribs.gradOklab;

        this.on("open", () =>
        {
            ele.byId("gradientPreset1").addEventListener(DomEvents.POINTER_CLICK, () =>
            {
                while (this.keys.length) this.deleteKey(this.keys[0]);
                this.addKey(0, 0.5, 1, 1, 1, 1);
                this.addKey(1, 0.5, 0, 0, 0, 1);
                this.updateCanvas();
                this.onChange();
            });

            ele.byId("gradientPreset2").addEventListener(DomEvents.POINTER_CLICK, () =>
            {
                while (this.keys.length) this.deleteKey(this.keys[0]);
                this.addKey(0, 0.5, 0, 0, 0, 1);
                this.addKey(0.5, 0.5, 1, 1, 1, 1);
                this.addKey(1, 0.5, 0, 0, 0, 1);
                this.updateCanvas();
                this.onChange();
            });

            ele.byId("gradientPreset3").addEventListener(DomEvents.POINTER_CLICK, () =>
            {
                while (this.keys.length) this.deleteKey(this.keys[0]);
                this.addKey(0, 0.5, 0, 0, 0, 1);
                this.addKey(0.1, 0.5, 1, 1, 1, 1);
                this.addKey(0.9, 0.5, 1, 1, 1, 1);
                this.addKey(1, 0.5, 0, 0, 0, 1);
                this.updateCanvas();
                this.onChange();
            });
        });
    }

    updateOpenerBackground()
    {
        this.openerEle.style.background = GradientEditor.getCssGradientString(this.keys);
    }

    /**
     * @param {import("./canv_pointeditor.js").KeyObject[]} keys
     */
    static getCssGradientString(keys)
    {
        if (!keys) return "";
        let str = "linear-gradient(";
        str += "90deg";

        for (let i = 0; i < keys.length; i++)
        {
            const r = Math.floor(keys[i].r * 255);
            const g = Math.floor(keys[i].g * 255);
            const b = Math.floor(keys[i].b * 255);
            let a = Math.floor(keys[i].a);
            if (keys[i].a === undefined)a = 1;
            const p = Math.floor(keys[i].pos * 100);

            str += ",rgba(" + r + ", " + g + ", " + b + ", " + a + ") " + p + "% ";
        }

        str += ")";

        return str;
    }

    updateCanvas()
    {
        if (!this.ctx)
        {
            const canvas = ele.byId(this.id + "Canvas");
            if (!canvas)
            {
                this.#log.error("[gradienteditor] no canvas found");
                return;
            }
            this.ctx = canvas.getContext("2d");
            this.imageData = this.ctx.createImageData(this.width, 1);
        }

        let keys = [];
        if (this.keys.length == 0) keys.push({
            "posy": 0.5,
            "pos": 0,
            "r": 0,
            "g": 0,
            "b": 0,
            "a": 1
        });
        else keys = [{
            "posy": this.keys[0].posy,
            "pos": 0,
            "r": this.keys[0].r,
            "g": this.keys[0].g,
            "b": this.keys[0].b,
            "a": this.keys[0].a
        }].concat(this.keys);

        const last = keys[keys.length - 1];
        keys.push({
            "posy": last.posy,
            "pos": 1,
            "r": last.r,
            "g": last.g,
            "b": last.b,
            "a": last.a,
        });

        for (let i = 0; i < keys.length - 1; i++)
        {
            const keyA = keys[i];
            const keyB = keys[i + 1];
            if (keyA.a == undefined)keyA.a = 1;

            for (let x = keyA.pos * this.width; x < keyB.pos * this.width; x++)
            {
                x = Math.round(x);
                let p = utils.map(x, keyA.pos * this.width, keyB.pos * this.width, 0, 1);

                if (this.options.smoothStep) p = utils.smoothStep(p);
                if (this.options.step) p = Math.round(p);

                if (this.options.oklab)
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
                    this.imageData.data[x * 4 + 0] = Math.round(pixCol[0] * 255);
                    this.imageData.data[x * 4 + 1] = Math.round(pixCol[1] * 255);
                    this.imageData.data[x * 4 + 2] = Math.round(pixCol[2] * 255);
                    this.imageData.data[x * 4 + 3] = 255;
                }
                else
                {
                    this.imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
                    this.imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
                    this.imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;

                    // this.imageData.data[x * 4 + 3] = ((p * keyB.a) + (1.0 - p) * (keyA.a));
                    this.imageData.data[x * 4 + 3] = 255;
                }
            }

            this.ctx.putImageData(this.imageData, 0, 0);
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
                        "b": keys[i].b,
                        "a": keys[i].a
                    };
            }

            this.port.set(JSON.stringify({ "keys": keyData }));
        }

        this.updateOpenerBackground();
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
