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
        this._keyHeight = 7;
        this._keyStrokeWidth = 3;
        this._keyOpacity = 1;
        this._dragDownDeleteThreshold = 120;
        this._width = 512;
        this._height = 100;

        this._oldKeys = [];
        this._keys = [];
        this._paper = null;

        this._movingkey = false;
        this._callback = null;
        this._ctx = null;

        this._op = gui.corePatch().getOpById(this._opId);
        this._port = this._op.getPort(this._portName);
        this.type = this._port.uiAttribs.gradientType || "gradient";

        this._previousContent = "";
    }

    selectKey(i)
    {
        this.setCurrentKey(this._keys[i]);
    }

    updateCanvas()
    {
        if (!this._ctx)
        {
            const canvas = ele.byId("gradientEditorCanvas");
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
            keys.push({ "posy": 0.5, "pos": 0, "r": 0, "g": 0, "b": 0 });
        }
        else keys = [{ "posy": this._keys[0].posy, "pos": 0, "r": this._keys[0].r, "g": this._keys[0].g, "b": this._keys[0].b }].concat(this._keys);

        const last = keys[keys.length - 1];
        keys.push({ "posy": last.posy, "pos": 1, "r": last.r, "g": last.g, "b": last.b });

        if (this.type == "curve")
        {
            this._ctx.fillStyle = "#444";
            this._ctx.fillRect(0, 0, this._width, this._height);

            this._ctx.strokeStyle = "white";
            this._ctx.lineWidth = 2;
            this._ctx.beginPath();
            this._ctx.moveTo(keys[0].pos * this._width, keys[0].posy * this._height - this._keyWidth / 2);

            for (let i = 0; i < keys.length - 1; i++)
                this._ctx.lineTo(
                    keys[i].pos * this._width - this._keyWidth / 2,
                    keys[i].posy * this._height - this._keyWidth / 2
                );

            this._ctx.lineTo(keys[keys.length - 1].pos * this._width, keys[keys.length - 1].posy * this._height - this._keyWidth / 2);
            this._ctx.stroke();
        }
        else
        {
            for (let i = 0; i < keys.length - 1; i++)
            {
                this._setKeyStyle(keys[i]);
                const keyA = keys[i];
                const keyB = keys[i + 1];

                for (let x = keyA.pos * this._width; x < keyB.pos * this._width; x++)
                {
                    x = Math.round(x);
                    let p = CABLES.map(x, keyA.pos * this._width, keyB.pos * this._width, 0, 1);

                    p = CABLES.smoothStep(p);

                    this._imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
                    this._imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
                    this._imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;
                    this._imageData.data[x * 4 + 3] = 255;
                }
            }

            // for (let i = 0; i < this._height; i++)
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

            this._port.set(JSON.stringify({ "keys": keyData }));
        }
    }

    _setKeyStyle(key)
    {
        if (key.rect)
        {
            if (this.type == "curve")
                key.rect.attr({ "fill": "#888", "stroke": "#fff" });
            else
                key.rect.attr({
                    "fill": "rgba(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + "," + this._keyOpacity + ")",
                    "stroke": this.getInvStrokeColor(key.r, key.g, key.b) });
        }
    }

    onChange()
    {
        function compare(a, b) { return a.pos - b.pos; }

        this._keys.sort(compare);


        let html = "";
        for (let i = 0; i < this._keys.length; i++)
        {
            this._keys[i].pos = Math.min(1.0, Math.max(this._keys[i].pos, 0));
            this._keys[i].posy = Math.min(1.0, Math.max(this._keys[i].posy, 0));

            html += "<a data-index=\"" + i + "\" onclick=\"CABLES.GradientEditor.editor.selectKey(" + i + ")\" class=\"keyindex smallbutton\">" + i + "</a> ";
        }

        ele.byId("gradienteditorKeys").innerHTML = html;


        // clearTimeout(this._timeout);
        this._timeout = setTimeout(
            () =>
            {
                if (CABLES.GradientEditor.editor)CABLES.GradientEditor.editor.updateCanvas();
            }, 3);


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

        ele.byId("gradientColorInput").style.backgroundColor = "rgb(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ")";
    }

    getInvStrokeColor(r, g, b)
    {
        if (this._type == "curve") return "rgba(255,255,255,1)";
        let invCol = (r + g + b) / 3;

        if (invCol < 0.5)invCol = 1.0;
        else invCol = 0.0;

        const s = "rgba(" + invCol * 255 + "," + invCol * 255 + "," + invCol * 255 + ",1.0)";
        return s;
    }

    addKey(pos, posy, r, g, b)
    {
        if (r == undefined)
        {
            r = Math.random();
            g = Math.random();
            b = Math.random();
        }

        const rect = this._paper.ellipse(pos * this._width - this._keyWidth / 2, posy * this._height - this._keyWidth / 2, this._keyWidth, this._keyHeight).attr({
            "stroke": this.getInvStrokeColor(r, g, b),
            "strokeWidth": this._keyStrokeWidth });


        const key = { "posy": posy, "pos": pos, "rect": rect, "r": r, "g": g, "b": b };

        this._setKeyStyle(key);

        this._keys.push(key);
        let shouldDelete = false;
        this.setCurrentKey(key);

        function move(dx, dy, x, y, e)
        {
            this.setCurrentKey(key);
            this._movingkey = true;
            const attribs = {};

            attribs.stroke = this.getInvStrokeColor(key.r, key.g, key.b);

            // e.target == key.rect.node || //|| e.target.tagName == "circle"
            if (e.target.tagName == "svg" || e.target.tagName == "circle" || e.target.tagName == "ellipse")
            {
                let eX = e.offsetX - (this._keyWidth / 2);
                let eY = e.offsetY - (this._keyWidth / 2);

                eX = Math.max(eX, 0);
                eY = Math.max(eY, 0);
                eX = Math.min(eX, this._width);
                eY = Math.min(eY, this._height);


                attribs.cx = eX;
                attribs.cy = eY;

                key.pos = (eX + this._keyWidth / 2) / this._width;
                key.posy = (eY + this._keyWidth / 2) / this._height;
            }

            rect.attr(attribs);
            this.onChange();
        }

        function down(x, y, e)
        {
            try { e.target.setPointerCapture(e.pointerId); }
            catch (_e) {}

            if (e.buttons == 2) shouldDelete = true;

            this._startMouseY = y;
            this._movingkey = true;
            this.setCurrentKey(key);
        }

        function up(e)
        {
            try { e.target.releasePointerCapture(e.pointerId); }
            catch (_e) {}

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

        const html = getHandleBarHtml("GradientEditor", { "name": this._portName });

        new ModalDialog({ "html": html, "nopadding": true });

        this._paper = Raphael("gradienteditorbar", 0, 0);


        document.querySelector("#gradienteditorbar svg").addEventListener("pointerdown", (e) =>
        {
            try { e.target.setPointerCapture(e.pointerId); }
            catch (_e) {}
        });


        document.querySelector("#gradienteditorbar svg").addEventListener("pointerup", (e) =>
        {
            try { e.target.releasePointerCapture(e.pointerId); }
            catch (_e) {}
        });


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
                    this.addKey(keys[i].pos, keys[i].posy, keys[i].r, keys[i].g, keys[i].b);
            }
            catch (e)
            {
                this._log.error(e);
            }
        }

        if (this._keys.length == 0)
        {
            this.addKey(0, 0.5, 0, 0, 0);
            this.addKey(1, 0.5, 1, 1, 1);
        }

        this.onChange();
        CABLES.GradientEditor.editor = this;

        ele.byId("gradientSaveButton").addEventListener("click", () =>
        {
            gui.closeModal();
        });

        ele.byId("gradientCancelButton").addEventListener("click", () =>
        {
            const op = gui.corePatch().getOpById(this._opId);
            op.getPort(this._portName).set(this._previousContent);
            gui.closeModal();
        });

        const colEleDel = ele.byId("gradientColorDelete");
        colEleDel.addEventListener("click", (e) =>
        {
            if (CABLES.currentKey)
            {
                CABLES.currentKey.rect.remove();
                this.deleteKey(CABLES.currentKey);
                CABLES.currentKey = this._keys[0];
            }
        });


        const colEle = ele.byId("gradientColorInput");

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
