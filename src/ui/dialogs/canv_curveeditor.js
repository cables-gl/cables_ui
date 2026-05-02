import { Logger, ele } from "cables-shared-client";
import { utils } from "cables";
import CanvasPointEditor from "./canv_pointeditor.js";

/**
 * gradient editor dialog
 */
export default class CurveEditor extends CanvasPointEditor
{
    #log = new Logger("curveeditor");

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

        this.options.template = "CurveEditor";
        this.options.canvasId = "curveEditorCanvas";
        this.options.smoothStep = this.port.uiAttribs.gradEditSmoothstep;
        this.options.step = this.port.uiAttribs.gradEditStep;
        this.options.oklab = this.port.uiAttribs.gradOklab;

        this.on("open", () =>
        {

        });
    }

    updateOpenerBackground()
    {
        this.openerEle.style.background = CurveEditor.getCssGradientString(this.keys);
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
            const p = keys[i].posy;

            str += ",rgba(" + p + ", " + p + ", " + p + ", " + 255 + ") " + 100 + "% ";
        }

        str += ")";

        return str;
    }

    updateCanvas()
    {
        if (!this.ctx)
        {
            const canvas = ele.byId(this.options.canvasId);
            if (!canvas)
            {
                this.#log.error("[gradienteditor] no canvas found");
                return;
            }
            this.ctx = canvas.getContext("2d");
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

        this.ctx.fillStyle = "#444444";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "#ffffff";

        this.ctx.rect(10, 10, 30, 30);

        this.ctx.beginPath();

        for (let i = 0; i < keys.length; i++)
        {
            const keyA = keys[i];
            // const keyB = keys[i + 1];
            // if (keyA.a == undefined)keyA.a = 1;

            if (i == 0) this.ctx.moveTo(keyA.pos * this.width, keyA.posy * this.height);
            else this.ctx.lineTo(keyA.pos * this.width, keyA.posy * this.height);

            console.log(keyA.pos * this.width, keyA.posy * this.height);
        }

        this.ctx.stroke();

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
