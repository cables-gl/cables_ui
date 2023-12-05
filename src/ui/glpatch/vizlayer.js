
import userSettings from "../components/usersettings";
import Logger from "../utils/logger";

export default class VizLayer extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();

        this._log = new Logger("VizLayer");

        this._usingGl = false;
        this._items = [];
        this._itemsLookup = {};
        this._glPatch = glPatch;
        this.paused = userSettings.get("vizlayerpaused") || false;

        gui.on("uiloaded", () =>
        {
            this._updateSize();
        });

        userSettings.on("change", (key, value) =>
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

        gui.corePatch().cgl.on("beginFrame", () =>
        {
            this._usingGl = true;
            this.renderGl();
        });
        gui.corePatch().on("reqAnimFrame", () =>
        {
            if (!this._usingGl)
            {
                this.renderGl();
            }
        });

        gui.corePatch().on("onOpAdd", (a) =>
        {
            if (a.renderVizLayer)
            {
                let item = this._itemsLookup[a.id];
                if (!item)
                {
                    item = {
                        "op": a,
                        "port": a.portsIn[0],
                        "ports": a.portsIn
                    };

                    this._itemsLookup[a.id] = item;

                    item.op.on("delete", (op) =>
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
        if (!gui.corePatch().cgl.hasFrameStarted() && this._usingGl)
        {
            this._usingGl = false;
            return;
        }

        if (this._items.length == 0) return;
        this._canvasCtx.fillStyle = gui.theme.colors_vizlayer.colorBackground || "#222";
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

            pos[0] *= window.devicePixelRatio;
            pos[1] *= window.devicePixelRatio;

            const glop = this._glPatch.getGlOp(item.op);
            if (!glop || glop.opUiAttribs.subPatch != this._glPatch.subPatch) continue;
            const sizeOp = this._glPatch.viewBox.patchToScreenConv(glop.w, glop.h);
            const size = [sizeOp[0], sizeOp[1] - paddingY - (paddingY / 2)];

            sizeOp[0] *= window.devicePixelRatio;
            sizeOp[1] *= window.devicePixelRatio;

            size[0] *= window.devicePixelRatio;
            size[1] *= window.devicePixelRatio;

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
                this._canvasCtx.fillStyle = gui.theme.colors_vizlayer.colorText || "#FFF";

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
                    "scale": w / gui.patchView._patchRenderer.viewBox.zoom * 0.6,
                    "useGl": this._usingGl,
                    "vizLayer": this
                };

                if (!this._items[i].op.uiAttribs.vizLayerMaxZoom || this._glPatch.viewBox.zoom < this._items[i].op.uiAttribs.vizLayerMaxZoom)
                    if (pos[0] === pos[0] && size[0] === size[0])
                        this._items[i].op.renderVizLayer(this._canvasCtx, layer, this);
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
        if (!op) return;
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

    clear(ctx, layer)
    {
        ctx.fillStyle = gui.theme.colors_vizlayer.colorBackground || "#222" || "#222";
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
    }


    renderText(ctx, layer, lines, options)
    {
        let indent = "";

        let fs = Math.max(1, options.fontSize);
        if (options.zoomText)fs *= (1.0 / layer.scale);
        let padding = fs * 0.25;
        const lineHeight = fs + padding;
        let numLines = Math.floor(layer.height / layer.scale / lineHeight);

        let offset = Math.floor(options.scroll * lines.length);

        offset = Math.max(offset, 0);
        offset = Math.min(offset, lines.length - numLines);
        if (lines.length < numLines)offset = 0;

        ctx.font = "normal " + fs + "px sourceCodePro";
        ctx.fillStyle = gui.theme.colors_vizlayer.colorText || "#FFF";

        if (options.showLineNum) for (let i = 0; i < (offset + numLines + " ").length; i++) indent += " ";

        ctx.fillStyle = gui.theme.colors_vizlayer.colorText || "#FFF";

        let hl = options.syntax && options.syntax != "text";

        for (let i = offset; i < offset + numLines; i += 1)
        {
            if (i >= lines.length || i < 0) continue;

            if (options.showLineNum)
            {
                ctx.fillStyle = gui.theme.colors_vizlayer.colorLineNumbers || "#888";
                ctx.fillText(i,
                    layer.x / layer.scale + padding,
                    layer.y / layer.scale + lineHeight + ((i - offset) * lineHeight));
                ctx.fillStyle = gui.theme.colors_vizlayer.colorText || "#FFF";
            }

            if (hl)
            {
                const data = hljs.highlight(lines[i], { "language": "glsl" });

                let fake = "";
                for (let j = 0; j < data._emitter.rootNode.children.length; j++)
                {
                    const child = data._emitter.rootNode.children[j];
                    if (typeof child == "string")
                    {
                        ctx.fillStyle = gui.theme.colors_vizlayer.colorText || "#FFF";
                        ctx.fillText(indent + fake + child,
                            layer.x / layer.scale + padding,
                            layer.y / layer.scale + lineHeight + ((i - offset) * lineHeight));
                        for (let k = 0; k < child.length; k++) fake += " ";
                    }
                    else
                    {
                        if (child.scope && child.children)
                        {
                            if (child.scope == "built_in")ctx.fillStyle = "#418ce9"; // blue
                            else if (child.scope == "comment")ctx.fillStyle = "#0b0"; // green
                            else if (child.scope == "number")ctx.fillStyle = "#49d6b2"; // cyan
                            else if (child.scope == "meta" || child.scope == "keyword" || child.scope == "type")ctx.fillStyle = "#ecce64"; // yello
                            else
                            {
                                // console.log("unknown", child.scope);
                                ctx.fillStyle = "#d00";
                            }
                            for (let l = 0; l < child.children.length; l++)
                            {
                                ctx.fillText(indent + fake + child.children[l],
                                    layer.x / layer.scale + padding,
                                    layer.y / layer.scale + lineHeight + ((i - offset) * lineHeight));
                                for (let k = 0; k < child.children[l].length; k++) fake += " ";
                            }
                        }
                    }
                }
            }
            else
            {
                ctx.fillText(indent + lines[i],
                    layer.x / layer.scale + padding,
                    layer.y / layer.scale + lineHeight + ((i - offset) * lineHeight));
            }
        }


        const gradHeight = 30;

        if (offset > 0)
        {
            const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + 5, 0, layer.y / layer.scale + gradHeight);
            radGrad.addColorStop(0, gui.theme.colors_vizlayer.colorBackground || "#222");
            radGrad.addColorStop(1, "rgba(34,34,34,0.0)");
            ctx.fillStyle = radGrad;
            ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale, layer.width, gradHeight);
        }

        if (offset + numLines < lines.length)
        {
            const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + 5, 0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + gradHeight);
            radGrad.addColorStop(1, gui.theme.colors_vizlayer.colorBackground || "#222");
            radGrad.addColorStop(0, "rgba(34,34,34,0.0)");
            ctx.fillStyle = radGrad;
            ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale + layer.height / layer.scale - gradHeight, layer.width, gradHeight);
        }
    }
}
