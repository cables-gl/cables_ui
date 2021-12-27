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
        this._dragDownDeleteThreshold = 40;
        this._width = 500;

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
        }

        const imageData = this._ctx.createImageData(500, 1);
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
            if (keys[i].rect)keys[i].rect.attr({ "fill": "rgba(" + Math.round(keys[i].r * 255) + "," + Math.round(keys[i].g * 255) + "," + Math.round(keys[i].b * 255) + ",1)" });

            const keyA = keys[i];
            const keyB = keys[i + 1];

            for (let x = keyA.pos * this._width; x < keyB.pos * this._width; x++)
            {
                let p = CABLES.map(x, keyA.pos * this._width, keyB.pos * this._width, 0, 1);

                p = CABLES.smoothStep(p);

                imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
                imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
                imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;
                imageData.data[x * 4 + 3] = 255;
            }
        }

        for (let i = 0; i < 50; i++)
        {
            this._ctx.putImageData(imageData, 0, i);
        }

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
        this.updateCanvas();
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

    addKey(pos, r, g, b)
    {
        const rect = this._paper.rect(pos * this._width, 0, this._keyWidth, this._keyHeight).attr({ "stroke": "#000" });

        if (r == undefined)
        {
            r = Math.random();
            g = Math.random();
            b = Math.random();
        }

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
            attribs.stroke = "#000";


            if (e.target.tagName == "svg") // e.target == key.rect.node ||
            {
                attribs.x = e.offsetX - (this._keyWidth / 2);
                key.pos = (attribs.x + this._keyWidth / 2) / this._width;
            }


            if (Math.abs(this._startMouseY - y) > this._dragDownDeleteThreshold)
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

            if (shouldDelete)
            {
                key.rect.remove();
                this.deleteKey(key);
            }
        }

        rect.drag(move.bind(this), down.bind(this), up.bind(this));
    }

    show(cb)
    {
        this._callback = cb;

        const html = CABLES.UI.getHandleBarHtml("GradientEditor", {});

        new ModalDialog({"html":html,"nopadding":true});

        this._paper = Raphael("gradienteditorbar", 0, 0);

        document.querySelector("#gradienteditorbar svg").addEventListener("click", (e) =>
        {
            if (this._movingkey) return;
            this.addKey(e.offsetX / this._width);
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
                    this.addKey(keys[i].pos, keys[i].r, keys[i].g, keys[i].b);
                }
            }
            catch (e)
            {
                this._log.error(e);
            }
        }

        if (this._keys.length == 0)
        {
            this.addKey(0.25, 0, 0, 0);
            this.addKey(0.75, 1, 1, 1);
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

        const colEle = document.getElementById("gradientColorInput");

        colEle.addEventListener("click", (e) =>
        {
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
                        CABLES.GradientEditor.editor.updateCanvas();

                        colEle.style.backgroundColor = col.hex();
                    }
                }
            });
        });
    }
}
