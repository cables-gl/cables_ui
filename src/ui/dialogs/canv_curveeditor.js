import { Logger, ele } from "cables-shared-client";
import { utils } from "cables";
import CanvasPointEditor from "./canv_pointeditor.js";

/**
 * gradient editor dialog
 */
export class CurveEditor extends CanvasPointEditor
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

        if (this.port.tempData.curveanim)
        {
            this.ctx.beginPath();
            const num = 100;
            for (let i = 0; i < num; i++)
            {

                const y = (1 - this.port.tempData.curveanim.getValue(i / num)) * this.height;

                if (i == 0) this.ctx.moveTo((i / num) * this.width, y);
                else this.ctx.lineTo((i / num) * this.width, y);
            }
            this.ctx.stroke();
        }
        else
        {

            this.ctx.beginPath();
            for (let i = 0; i < keys.length; i++)
            {
                const key = keys[i];

                if (i == 0) this.ctx.moveTo(key.pos * this.width, key.posy * this.height - 1);
                else this.ctx.lineTo(key.pos * this.width, key.posy * this.height - 1);
            }

            this.ctx.stroke();
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

}
