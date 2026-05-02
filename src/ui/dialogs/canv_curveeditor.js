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
            const r = Math.floor((1 - keys[i].posy) * 255);

            str += ",rgba(" + r + ", " + r + ", " + r + ", " + 255 + ") " + Math.floor((keys[i].pos) * 100) + "% ";
        }

        str += ")";
        // return "red";

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

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#999999";

        this.ctx.rect(10, 10, 30, 30);

        this.ctx.beginPath();

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i];

            if (i == 0) this.ctx.moveTo(key.pos * this.width, key.posy * this.height - 1);
            else this.ctx.lineTo(key.pos * this.width, key.posy * this.height - 1);
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
