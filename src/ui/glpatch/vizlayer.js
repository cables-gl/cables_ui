
import userSettings from "../components/usersettings";
import Logger from "../utils/logger";

export default class VizLayer extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();

        this._log = new Logger("VizLayer");

        this._items = [];
        this._itemsLookup = {};
        this._glPatch = glPatch;
        this.paused = userSettings.get("vizlayerpaused") || false;

        gui.on("uiloaded", () =>
        {
            this._updateSize();
        });

        userSettings.on("onChange", (key, value) =>
        {
            if (key == "vizlayerpaused") this.paused = value;
        });

        this._glPatch.on("resize", this._updateSize.bind(this));

        this._eleCanvas = document.createElement("canvas");

        this._eleCanvas.id = "gluiPreviewLayer";
        this._eleCanvas.classList.add("gluiPreviewLayer");
        this._eleCanvas.style.zIndex = this._glPatch._cgl.canvas.style.zIndex + 2;

        document.body.appendChild(this._eleCanvas);

        this._updateSize();

        gui.corePatch().cgl.on("beginFrame", this.renderGl.bind(this));

        gui.corePatch().on("onOpAdd", (a) =>
        {
            if (a.renderVizLayer)
            {
                let item = this._itemsLookup[a.id];
                if (!item)
                {
                    // a.uiAttribs.translate = a.uiAttribs.translate || { "x": 0, "y": 0 };

                    item = {
                        "op": a,
                        "port": a.portsIn[0],
                        "ports": a.portsIn,
                        // "posX": a.uiAttribs.translate.x,
                        // "posY": a.uiAttribs.translate.y,
                    };

                    this._itemsLookup[a.id] = item;

                    item.op.on("onDelete", (op) =>
                    {
                        this._removeOpItem(op);
                    });

                    this._items.push(item);
                }
            }
        });
    }

    _updateSize()
    {
        if (this._eleCanvas.width != this._glPatch._cgl.canvasWidth ||
            this._eleCanvas.height != this._glPatch._cgl.canvasHeight)
        {
            this._eleCanvas.style.width = this._glPatch._cgl.canvas.width / this._glPatch._cgl.devicePixelRatio + "px";
            this._eleCanvas.style.height = this._glPatch._cgl.canvas.height / this._glPatch._cgl.devicePixelRatio + "px";

            this._eleCanvas.width = this._glPatch._cgl.canvasWidth;
            this._eleCanvas.height = this._glPatch._cgl.canvasHeight;
            this._canvasCtx = this._eleCanvas.getContext("2d");
        }
    }

    render()
    {

    }

    renderGl()
    {
        if (this._items.length == 0) return;
        this._canvasCtx.fillStyle = "#222222";
        this._canvasCtx.clearRect(0, 0, this._eleCanvas.width, this._eleCanvas.height);

        const perf = CABLES.UI.uiProfiler.start("glVizPreviewLayer.renderGl");
        const paddingY = this._glPatch.viewBox.patchToScreenConv(0, 25)[1];

        this._updateSize();

        const w = this._eleCanvas.width;

        let count = 0;
        for (let i = 0; i < this._items.length; i++)
        {
            const item = this._items[i];
            const port = item.port;
            if (!port || !item.op ||
                !item.op.uiAttribs ||
                !item.op.uiAttribs.translate) continue;

            item.posX = item.op.uiAttribs.translate.x;
            item.posY = item.op.uiAttribs.translate.y;

            const pos = this._glPatch.viewBox.patchToScreenCoords(item.posX, item.posY);
            pos[1] += paddingY;

            pos[0] *= this._glPatch._cgl.devicePixelRatio;
            pos[1] *= this._glPatch._cgl.devicePixelRatio;

            const glop = this._glPatch.getGlOp(item.op);
            if (!glop || glop.opUiAttribs.subPatch != this._glPatch.subPatch) continue;
            const sizeOp = this._glPatch.viewBox.patchToScreenConv(glop.w, glop.h);
            const size = [sizeOp[0], sizeOp[1] - paddingY - (paddingY / 2)];

            sizeOp[0] *= this._glPatch._cgl.devicePixelRatio;
            sizeOp[1] *= this._glPatch._cgl.devicePixelRatio;

            size[0] *= this._glPatch._cgl.devicePixelRatio;
            size[1] *= this._glPatch._cgl.devicePixelRatio;

            if (pos[0] < -sizeOp[0] || pos[1] < -sizeOp[1] || pos[0] > this._eleCanvas.width || pos[1] > this._eleCanvas.height) continue;

            this._canvasCtx.clearRect(pos[0] - 1, pos[1] - 1, size[0] + 2, size[1] + 2);
            this._canvasCtx.strokeStyle = "transparent";

            this._canvasCtx.save();

            let region = new Path2D();
            region.rect(pos[0], pos[1], size[0], size[1]);
            this._canvasCtx.clip(region);

            const scale = 1000 / gui.patchView._patchRenderer.viewBox.zoom * 1.5;

            if (count > 10 || this.paused || Math.max(sizeOp[1], sizeOp[0]) < 20)
            {
                this._canvasCtx.save();
                this._canvasCtx.scale(scale, scale);

                this._canvasCtx.font = "normal 6px sourceCodePro";
                this._canvasCtx.fillStyle = "#ccc";

                this._canvasCtx.textAlign = "center";
                this._canvasCtx.fillText("paused", (pos[0] + size[0] / 2) / scale, (pos[1] + (size[1] / 2)) / scale);
                this._canvasCtx.restore();
            }
            else
            {
                const layer =
                {
                    "x": pos[0],
                    "y": pos[1],
                    "width": size[0],
                    "height": size[1],
                    "scale": w / gui.patchView._patchRenderer.viewBox.zoom * 0.6
                };

                this._items[i].op.renderVizLayer(this._canvasCtx, layer);
            }

            this._items[i].oldPos = [pos[0], pos[1], size[0], size[1]];

            this._canvasCtx.restore();
            count++;
        }

        this._glPatch.debugData.numVizLayers = count;

        perf.finish();
    }

    _removeOpItem(op)
    {
        const it = this._itemsLookup[op.id];

        let idx = this._items.indexOf(it);

        if (idx > -1) this._items.splice(idx, 1);
        else this._log.warn("could not find item");

        delete this._itemsLookup[op.id];

        if (this._items.length == 0) this._canvasCtx.clearRect(0, 0, this._eleCanvas.width, this._eleCanvas.height);
    }

    pauseInteraction()
    {
        this._eleCanvas.style["pointer-events"] = "none";
    }

    resumeInteraction()
    {
        this._eleCanvas.style["pointer-events"] = "none";
    }
}
