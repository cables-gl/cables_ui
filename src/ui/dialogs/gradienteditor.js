import { getHandleBarHtml } from "../utils/handlebars";
import Logger from "../utils/logger";
import ModalDialog from "./modaldialog";

export default class GradientEditor
{
    constructor(opid, portname)
    {
        this._log = new Logger("gradienteditor");
        this._opId = opid;
        this._portName = portname;

        this._keyWidth =
        this._keyHeight = 15;
        this._dragDownDeleteThreshold = 120;
        this._width = 500;
        this._height = 100;

        this._keys = [];
        this._paper = null;

        this._movingkey = false;
        this._callback = null;
        this._ctx = null;

        this._previousContent = "";
    }

    updateCanvas()
    {
        if (!this._ctx)
        {
            const canvas = document.getElementById("gradientEditorCanvas");
            if (!canvas)
            {
                this._log.error("[gradienteditor] no canvas found");
                return;
            }
            this._ctx = canvas.getContext("2d");
            this._imageData = this._ctx.createImageData(this._width, 1);
        }


        let keys = [];
        if (this._keys.length == 0)
        {
            keys.push({ "pos": 0, "r": 0, "g": 0, "b": 0 });
        }
        else keys = [{ "pos": 0, "r": this._keys[0].r, "g": this._keys[0].g, "b": this._keys[0].b }].concat(this._keys);

        const last = keys[keys.length - 1];
        keys.push({ "pos": 1, "r": last.r, "g": last.g, "b": last.b });

        for (let i = 0; i < keys.length - 1; i++)
        {
            if (keys[i].rect)
            {
                keys[i].rect.attr({
                    "fill": "rgba(" + Math.round(keys[i].r * 255) + "," + Math.round(keys[i].g * 255) + "," + Math.round(keys[i].b * 255) + ",1)",
                    "stroke": this.getInvStrokeColor(keys[i].r, keys[i].g, keys[i].b) });
            }

            const keyA = keys[i];
            const keyB = keys[i + 1];

            for (let x = keyA.pos * this._width; x < keyB.pos * this._width; x++)
            {
                let p = CABLES.map(x, keyA.pos * this._width, keyB.pos * this._width, 0, 1);

                p = CABLES.smoothStep(p);

                this._imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
                this._imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
                this._imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;
                this._imageData.data[x * 4 + 3] = 255;
            }
        }

        for (let i = 0; i < this._height; i++)
            this._ctx.putImageData(this._imageData, 0, i);

        this._ctx.strokeStyle = "red";
        this._ctx.lineWidth = 2;
        this._ctx.beginPath();
        this._ctx.moveTo(keys[0].pos * this._width, this._height - keys[0].r * this._height);
        for (let i = 0; i < keys.length - 1; i++)
            this._ctx.lineTo(keys[i].pos * this._width, this._height - keys[i].r * this._height);
        this._ctx.lineTo(keys[keys.length - 1].pos * this._width, this._height - keys[keys.length - 1].r * this._height);
        this._ctx.stroke();

        this._ctx.strokeStyle = "green";
        this._ctx.beginPath();
        this._ctx.moveTo(keys[0].pos * this._width, this._height - keys[0].g * this._height);
        for (let i = 0; i < keys.length - 1; i++)
            this._ctx.lineTo(keys[i].pos * this._width, this._height - keys[i].g * this._height);
        this._ctx.lineTo(keys[keys.length - 1].pos * this._width, this._height - keys[keys.length - 1].g * this._height);
        this._ctx.stroke();

        this._ctx.strokeStyle = "blue";
        this._ctx.beginPath();
        this._ctx.moveTo(keys[0].pos * this._width, this._height - keys[0].b * this._height);
        for (let i = 0; i < keys.length - 1; i++)
            this._ctx.lineTo(keys[i].pos * this._width, this._height - keys[i].b * this._height);
        this._ctx.lineTo(keys[keys.length - 1].pos * this._width, this._height - keys[keys.length - 1].b * this._height);
        this._ctx.stroke();


        if (this._opId && this._portName)
        {
            const keyData = [];
            for (let i = 0; i < keys.length; i++)
            {
                keyData[i] =
                {
                    "pos": keys[i].pos,
                    "r": keys[i].r,
                    "g": keys[i].g,
                    "b": keys[i].b
                };
            }

            const op = gui.corePatch().getOpById(this._opId);
            op.getPort(this._portName).set(JSON.stringify({ "keys": keyData }));
        }
    }

    onChange()
    {
        function compare(a, b) { return a.pos - b.pos; }

        this._keys.sort(compare);

        clearTimeout(this._timeout);
        this._timeout = setTimeout(
            () =>
            {
                CABLES.GradientEditor.editor.updateCanvas();
            }, 10);


        if (this._callback) this._callback();
    }

    deleteKey(k)
    {
        this._keys.splice(this._keys.indexOf(k), 1);
        this.onChange();
    }

    setCurrentKey(key)
    {
        CABLES.currentKey = key;

        document.getElementById("gradientColorInput").style.backgroundColor = "rgb(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ")";
    }

    getInvStrokeColor(r, g, b)
    {
        let invCol = (r + g + b) / 3;

        if (invCol < 0.5)invCol = 1.0;
        else invCol = 0.0;

        const s = "rgba(" + invCol * 255 + "," + invCol * 255 + "," + invCol * 255 + ",1.0)";
        return s;
    }

    addKey(pos, posY, r, g, b)
    {
        if (r == undefined)
        {
            r = Math.random();
            g = Math.random();
            b = Math.random();
        }

        const rect = this._paper.rect(pos * this._width - this._keyWidth / 2, posY * this._height, this._keyWidth, this._keyHeight).attr({
            "fill": "rgba(0,0,0,0)",
            "stroke": this.getInvStrokeColor(r, g, b),
            "strokeWidth": 3 });


        const key = { pos, rect, r, g, b };

        rect.attr({ "fill": "rgba(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ",1)" });

        this._keys.push(key);
        let shouldDelete = false;
        this.setCurrentKey(key);

        function move(dx, dy, x, y, e)
        {
            this.setCurrentKey(key);
            this._movingkey = true;
            const attribs = {};

            attribs.stroke = this.getInvStrokeColor(key.r, key.g, key.b);

            if (e.target.tagName == "svg") // e.target == key.rect.node ||
            {
                attribs.x = e.offsetX - (this._keyWidth / 2);
                attribs.y = e.offsetY - (this._keyWidth / 2);
                key.pos = (attribs.x + this._keyWidth / 2) / this._width;
                key.posY = (attribs.y + this._keyWidth / 2) / this._height;
            }


            if (Math.abs(this._startMouseY - y) > this._dragDownDeleteThresho12d)
            {
                attribs["fill-opacity"] = 0.3;
                attribs.stroke = "#f00";
                shouldDelete = true;
            }
            else
            {
                attribs["fill-opacity"] = 1.0;
                shouldDelete = false;
            }


            rect.attr(attribs);
            this.onChange();
        }

        function down(x, y, e)
        {
            if (e.buttons == 2)
            {
                shouldDelete = true;
            }

            this._startMouseY = y;
            this._movingkey = true;
            this.setCurrentKey(key);
        }

        function up(e)
        {
            setTimeout(function ()
            {
                this._movingkey = false;
            }.bind(this), 100);

            if (shouldDelete && key.rect)
            {
                key.rect.remove();
                this.deleteKey(key);
            }
        }

        if (rect)rect.drag(move.bind(this), down.bind(this), up.bind(this));
    }

    show(cb)
    {
        this._callback = cb;

        const html = getHandleBarHtml("GradientEditor", {});

        new ModalDialog({ "html": html, "nopadding": true });

        this._paper = Raphael("gradienteditorbar", 0, 0);

        document.querySelector("#gradienteditorbar svg").addEventListener("click", (e) =>
        {
            if (this._movingkey) return;
            this.addKey(e.offsetX / this._width, e.offsetY / this._height);
            this.onChange();
        });

        if (this._opId && this._portName)
        {
            const op = gui.corePatch().getOpById(this._opId);
            const data = op.getPort(this._portName).get();
            try
            {
                this._previousContent = data;
                const keys = JSON.parse(data).keys;
                for (let i = 1; i < keys.length - 1; i++)
                {
                    this.addKey(keys[i].pos, keys[i].posY, keys[i].r, keys[i].g, keys[i].b);
                }
            }
            catch (e)
            {
                this._log.error(e);
            }
        }

        if (this._keys.length == 0)
        {
            this.addKey(0, 0, 0, 0, 0);
            this.addKey(1, 0, 1, 1, 1);
        }

        this.onChange();
        CABLES.GradientEditor.editor = this;

        document.getElementById("gradientSaveButton").addEventListener("click", () =>
        {
            gui.closeModal();
        });

        document.getElementById("gradientCancelButton").addEventListener("click", () =>
        {
            const op = gui.corePatch().getOpById(this._opId);
            op.getPort(this._portName).set(this._previousContent);
            gui.closeModal();
        });

        const colEleDel = document.getElementById("gradientColorDelete");
        colEleDel.addEventListener("click", (e) =>
        {
            if (CABLES.currentKey)
            {
                CABLES.currentKey.rect.remove();
                this.deleteKey(CABLES.currentKey);
                CABLES.currentKey = this._keys[0];
            }
        });


        const colEle = document.getElementById("gradientColorInput");

        colEle.addEventListener("click", (e) =>
        {
            if (!CABLES.currentKey) return;
            const cr = new ColorRick({
                "ele": colEle,
                "color": [parseInt(CABLES.currentKey.r * 255), parseInt(CABLES.currentKey.g * 255), parseInt(CABLES.currentKey.b * 255)], // "#ffffff",
                "onChange": (col) =>
                {
                    if (CABLES.currentKey)
                    {
                        CABLES.currentKey.r = col.gl()[0];
                        CABLES.currentKey.g = col.gl()[1];
                        CABLES.currentKey.b = col.gl()[2];

                        CABLES.GradientEditor.editor._ctx = null;
                        CABLES.GradientEditor.editor.onChange();

                        colEle.style.backgroundColor = col.hex();
                    }
                }
            });
        });
    }
}
