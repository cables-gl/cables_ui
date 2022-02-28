
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

        gui.on("uiloaded", () =>
        {
            this._updateSize();
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
            if (a.renderPreviewLayer)
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
            this._eleCanvas.style.width = this._glPatch._cgl.canvas.width / window.devicePixelRatio + "px";
            this._eleCanvas.style.height = this._glPatch._cgl.canvas.height / window.devicePixelRatio + "px";

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

        let count = 0;
        for (let i = 0; i < this._items.length; i++)
        {
            const item = this._items[i];
            const port = item.port;
            if (!port) continue;

            item.posX = item.op.uiAttribs.translate.x;
            item.posY = item.op.uiAttribs.translate.y;

            const pos = this._glPatch.viewBox.patchToScreenCoords(item.posX, item.posY);
            pos[1] += paddingY;

            pos[0] *= window.devicePixelRatio;
            pos[1] *= window.devicePixelRatio;

            const glop = this._glPatch.getGlOp(item.op);
            if (!glop || glop.opUiAttribs.subPatch != this._glPatch.subPatch) continue;
            const sizeOp = this._glPatch.viewBox.patchToScreenConv(glop.w, glop.h);
            const size = [sizeOp[0], sizeOp[1] - paddingY - (paddingY / 2)];

            size[0] *= window.devicePixelRatio;
            size[1] *= window.devicePixelRatio;

            if (pos[0] < -sizeOp[0] || pos[1] < -sizeOp[1] || pos[0] > this._eleCanvas.width || pos[1] > this._eleCanvas.height) continue;

            this._canvasCtx.clearRect(pos[0] - 1, pos[1] - 1, size[0] + 2, size[1] + 2);
            this._canvasCtx.strokeStyle = "transparent";

            // this._canvasCtx.save();
            this._canvasCtx.save();

            let region = new Path2D();
            region.rect(pos[0], pos[1], size[0], size[1]);
            this._canvasCtx.clip(region);


            this._items[i].op.renderPreviewLayer(this._canvasCtx, pos, size);
            this._items[i].oldPos = [pos[0], pos[1], size[0], size[1]];
            // this._canvasCtx.restore();


            this._canvasCtx.restore();
            count++;
        }

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
