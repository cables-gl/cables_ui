
import GlPreviewLayerTexture from "./glpreviewlayer_texture";
import GlPreviewLayerNumber from "./glpreviewlayer_number_graph";

export default class GlPreviewLayer extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();

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

        setInterval(this.updateViewPort.bind(this), 500);
    }

    _updateSize()
    {
        this._eleCanvas.style.width = this._glPatch._cgl.canvas.width / window.devicePixelRatio + "px";
        this._eleCanvas.style.height = this._glPatch._cgl.canvas.height / window.devicePixelRatio + "px";

        this._eleCanvas.width = this._glPatch._cgl.canvasWidth;
        this._eleCanvas.height = this._glPatch._cgl.canvasHeight;
        this._canvasCtx = this._eleCanvas.getContext("2d");
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

            this._canvasCtx.fillStyle = "#222222";
            this._canvasCtx.fillRect(pos[0], pos[1], size[0], size[1]);

            this._items[i].renderer.render(this._canvasCtx, pos, size);
            count++;
        }

        perf.finish();
    }

    updateViewPort()
    {
        this._updateSize();
        const ops = gui.corePatch().getOpsByObjName("Ops.Ui.VizTexture");
        const ops2 = gui.corePatch().getOpsByObjName("Ops.Ui.VizGraph");
        ops.push(...ops2);

        for (let i = 0; i < ops.length; i++)
        {
            let item = this._itemsLookup[ops[i].id];
            if (!item)
            {
                item = {
                    "op": ops[i],
                    "port": ops[i].portsIn[0],
                    "ports": ops[i].portsIn,
                    "posX": ops[i].uiAttribs.translate.x,
                    "posY": ops[i].uiAttribs.translate.y,
                };

                this._itemsLookup[ops[i].id] = item;
                this._items.push(item);

                if (ops[i].objName == "Ops.Ui.VizTexture") item.renderer = new GlPreviewLayerTexture(this, item);
                if (ops[i].objName == "Ops.Ui.VizGraph") item.renderer = new GlPreviewLayerNumber(this, item);
            }
        }
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
