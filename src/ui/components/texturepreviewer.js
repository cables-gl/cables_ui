import { Logger, ele } from "cables-shared-client";

import srcShaderFragment from "./texturepreviewer_glsl.frag";
import srcShaderVertex from "./texturepreviewer_glsl.vert";
import { hideToolTip } from "../elements/tooltips.js";
import { gui } from "../gui.js";

const MODE_CORNER = 0;
const MODE_HOVER = 1;

/**
 * texturepreview floating over the patchfield
 *
 * @export
 * @class TexturePreviewer
 */
export default class TexturePreviewer
{
    constructor()
    {
        this._log = new Logger();

        this._texturePorts = [];
        this._showing = false;
        this._lastTimeActivity = 0;
        this._mode = CABLES.UI.userSettings.get("texpreviewMode") == "corner" ? MODE_CORNER : MODE_HOVER;
        this._paused = false;
        this._shader = null;
        this._shaderTexUniform = null;
        this._tempTexturePort = null;
        this._hoveringTexPort = false;
        this._listeningFrame = false;
        this._emptyCubemap = null;
        this._timer = new CABLES.Timer();
        this._timer.play();
        this._currentHeight = -1;
        this._currentWidth = -1;
        this._lastClicked = null;
        this.scale = 0.2;

        this._ele = document.getElementById("bgpreview");
        this.setSize();

        CABLES.UI.userSettings.on("change", (key, v) =>
        {
            if (key == "texpreviewTransparent") this.setSize();
            if (key == "texpreviewSize") this.setSize(CABLES.UI.userSettings.get(key));
            if (key == "bgpreviewMax") this.enableBgPreview();
        });

        this._initListener();
        this.enableBgPreview();

        if (this._mode == MODE_HOVER)
        {
            this._enabled = false;
            ele.byId("bgpreviewButtonsContainer").classList.add("hidden");
            ele.byId("bgpreview").classList.add("hidden");
        }
    }

    _initListener()
    {
        if (!window.gui)
        {
            setTimeout(this._initListener.bind(this), 300);
            return;
        }

        if (this._mode == MODE_HOVER)
        {
            gui.on("portHovered", (port) =>
            {
                if (port && port.get() && port.get().tex)
                {
                    this._enabled = true;
                    this.selectTexturePort(port);

                    clearTimeout(this._hoverTimeout);
                    this._hoverTimeout = setTimeout(() =>
                    {
                        this._enabled = false;
                    }, 50);
                }
            });
        }

        if (this._mode == MODE_CORNER)
        {
            gui.opParams.on("opSelected", () =>
            {
                if (!gui.opParams.op) return;
                let foundPreview = false;
                const ports = gui.opParams.op.portsOut;

                for (let i = 0; i < ports.length; i++)
                {
                    if (!foundPreview && ports[i].uiAttribs.preview)
                    {
                        this.selectTexturePort(ports[i]);
                        return;
                    }
                }
            });
        }
    }

    needsVizLayer()
    {
        return this._mode == MODE_HOVER;
    }


    _renderTexture(tp, element)
    {
        if (!tp && this._lastClickedP)
        {
            tp = this.updateTexturePort(this._lastClickedP);
        }
        if (!tp || !this._enabled)
        {
            return;
        }

        if (!window.gui) return;

        let port = tp;
        if (tp.port)port = tp.port;

        const id = tp.id;
        const texSlot = 5;
        const texSlotCubemap = texSlot + 1;

        let meta = true;
        if (element)meta = false;

        const previewCanvasEle = element || document.getElementById("preview_img_" + id);

        if (!previewCanvasEle)
        {
            this._log.log("no previewCanvasEle");
            return;
        }

        const previewCanvas = previewCanvasEle.getContext("2d");

        if (previewCanvas && port && port.get())
        {
            const perf = gui.uiProfiler.start("texpreview");
            const cgl = port.op.patch.cgl;

            if (!this._emptyCubemap) this._emptyCubemap = CGL.Texture.getEmptyCubemapTexture(cgl);
            port.op.patch.cgl.profileData.profileTexPreviews++;

            if (!this._mesh)
            {
                const geom = new CGL.Geometry("tex preview rect");
                geom.vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];
                geom.texCoords = [
                    1.0, 1.0,
                    0.0, 1.0,
                    1.0, 0.0,
                    0.0, 0.0];
                geom.verticesIndices = [0, 1, 2, 3, 1, 2];
                this._mesh = new CGL.Mesh(cgl, geom);
            }
            if (!this._shader)
            {
                this._shader = new CGL.Shader(cgl, "texPreviewShader");
                this._shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
                this._shader.setSource(srcShaderVertex, srcShaderFragment);
                this._shaderTexUniform = new CGL.Uniform(this._shader, "t", "tex", texSlot);
                this._shaderTexCubemapUniform = new CGL.Uniform(this._shader, "tc", "cubeMap", texSlotCubemap);

                this._shaderTexUniformW = new CGL.Uniform(this._shader, "f", "width", port.get().width);
                this._shaderTexUniformH = new CGL.Uniform(this._shader, "f", "height", port.get().height);
                this._shaderTypeUniform = new CGL.Uniform(this._shader, "f", "type", 0);
                this._shaderTimeUniform = new CGL.Uniform(this._shader, "f", "time", 0);
            }

            cgl.pushPMatrix();

            mat4.ortho(cgl.pMatrix, -1, 1, 1, -1, 0.001, 11);

            const oldTex = cgl.getTexture(texSlot);
            const oldTexCubemap = cgl.getTexture(texSlotCubemap);

            let texType = 0;
            if (!port.get()) return;
            if (port.get().cubemap) texType = 1;
            if (port.get().textureType == CGL.Texture.TYPE_DEPTH) texType = 2;

            this._showInfo(port.get());

            if (texType == 0 || texType == 2)
            {
                cgl.setTexture(texSlot, port.get().tex);
                cgl.setTexture(texSlotCubemap, this._emptyCubemap.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
            }
            else if (texType == 1)
            {
                cgl.setTexture(texSlotCubemap, port.get().cubemap, cgl.gl.TEXTURE_CUBE_MAP);
            }

            this._shaderTypeUniform.setValue(texType);

            this._timer.update();
            this._shaderTimeUniform.setValue(this._timer.get());

            this._mesh.render(this._shader);
            if (texType == 0) cgl.setTexture(texSlot, oldTex);
            if (texType == 1) cgl.setTexture(texSlotCubemap, oldTexCubemap);

            cgl.popPMatrix();
            cgl.resetViewPort();

            const s = this._getCanvasSize(port, port.get(), meta);
            if (s[0] == 0 || s[1] == 0) return;


            if (texType == 1)s[0] *= 1.33;

            if (this._currentWidth != s[0] * this.scale || this._currentHeight != s[1] * this.scale)
            {
                this._currentWidth = previewCanvasEle.width = s[0] * this.scale;
                this._currentHeight = previewCanvasEle.height = s[1] * this.scale;
            }

            const perf2 = gui.uiProfiler.start("texpreview22");

            // if (this._mode == MODE_CORNER)
            // {
            previewCanvas.clearRect(0, 0, this._currentWidth, previewCanvasEle.height);

            if (this._currentWidth > 0 && cgl.canvas.width > 0 && cgl.canvas.height > 0 && previewCanvasEle.width != 0 && previewCanvasEle.height > 0)
                previewCanvas.drawImage(cgl.canvas, 0, 0, this._currentWidth, previewCanvasEle.height);
            // }

            if (this._mode == MODE_HOVER && this._enabled)
            {
                const vizCtx = gui.patchView.patchRenderer.vizLayer._eleCanvas.getContext("2d");
                vizCtx.save();

                if (CABLES.UI.userSettings.get("texpreviewTransparent")) vizCtx.globalAlpha = 0.5;

                let w = 150;
                let h = Math.min(150, 150 * previewCanvasEle.height / this._currentWidth);
                let x = Math.round(gui.patchView.patchRenderer.viewBox.mouseX * gui.patchView.patchRenderer._cgl.pixelDensity + 53);
                let y = Math.round(gui.patchView.patchRenderer.viewBox.mouseY * gui.patchView.patchRenderer._cgl.pixelDensity - 0);
                vizCtx.translate(x, y);

                if (w <= 1)w = h / 2;
                if (h <= 1)h = w / 2;

                if (port.get().width < w && port.get().height < h) vizCtx.imageSmoothingEnabled = false;

                vizCtx.scale(1, -1);

                if (w > 0 && h > 0 && cgl.canvas && cgl.canvas.width > 0 && cgl.canvas.height > 0) vizCtx.drawImage(cgl.canvas, 0, 0, w, h);
                vizCtx.scale(1, 1);
                vizCtx.globalAlpha = 1;
                vizCtx.restore();
            }


            perf2.finish();

            cgl.gl.clearColor(0, 0, 0, 0);
            cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

            perf.finish();
        }
    }

    drawVizLayer(vizCtx)
    {
        // vizCtx.drawImage(cgl.canvas, 0, 0, w, h);
        // if (this._mode == MODE_HOVER && this._enabled && this._ele && this._ele.width > 0 && this._ele.height > 0)
        // {
        // // const vizCtx = gui.patchView.patchRenderer.vizLayer._eleCanvas.getContext("2d");

        //     if (CABLES.UI.userSettings.get("texpreviewTransparent")) vizCtx.globalAlpha = 0.5;
        //     vizCtx.save();
        //     let w = 150;
        //     let h = Math.min(150, 150 * this._ele.height / this._currentWidth);
        //     let x = Math.round(gui.patchView.patchRenderer.viewBox.mouseX * gui.patchView.patchRenderer._cgl.pixelDensity + 53);
        //     let y = Math.round(gui.patchView.patchRenderer.viewBox.mouseY * gui.patchView.patchRenderer._cgl.pixelDensity - 0);
        //     vizCtx.translate(x, y);

        //     if (this._ele.width < w && this._ele.height < h)vizCtx.imageSmoothingEnabled = false;


        //     if (w <= 1)w = h / 2;
        //     if (h <= 1)h = w / 2;
        //     vizCtx.scale(1, -1);
        //     vizCtx.drawImage(this._ele, 0, 0, w, h);

        //     vizCtx.strokeStyle = "black";
        //     vizCtx.strokeRect(0, 0, w + 1, h + 1);


        //     vizCtx.scale(1, 1);
        //     vizCtx.globalAlpha = 1;
        //     vizCtx.restore();
        // }
    }


    toggleSize(m)
    {
        let size = CABLES.UI.userSettings.get("texpreviewSize");

        if (size == null || size == undefined)size = 30;

        if (size % 10 != 0)size = 30;
        size += m * 10;
        if (size <= 0)size = 10;
        if (size > 100)size = 10;

        this.scale = size / 100;

        CABLES.UI.userSettings.set("texpreviewSize", this.scale * 100);
    }

    setSize(size)
    {
        if (!size)size = CABLES.UI.userSettings.get("texpreviewSize") || 50;

        if (CABLES.UI.userSettings.get("texpreviewTransparent")) this._ele.style.opacity = 0.5;
        else this._ele.style.opacity = 1;

        this.scale = size / 100;

        CABLES.UI.userSettings.set("texpreviewSize", this.scale * 100);
    }

    _getCanvasSize(port, tex, meta)
    {
        let maxWidth = 300;
        let maxHeight = 200;

        if (!meta)
        {
            const patchRect = gui.patchView.element.getBoundingClientRect();
            maxWidth = Math.min(patchRect.width, port.op.patch.cgl.canvasWidth);
            maxHeight = Math.min(patchRect.height, port.op.patch.cgl.canvasHeight);
        }

        const aspect = tex.height / tex.width;
        let w = tex.width;

        if (w > maxWidth)w = maxWidth;
        let h = w * aspect;

        if (h > maxHeight)
        {
            w = maxHeight / aspect;
            h = maxHeight;
        }

        return [w, h];
    }

    _htmlDataObject(o)
    {
        if (o.port.get())
            return {
                "title": o.port.op.getName() + " - " + o.port.name,
                "id": o.id,
                "opid": o.opid,
                "order": parseInt(o.lastTimeClicked, 10),
                "size": o.port.get().width + " x " + o.port.get().height
            };
    }

    showActivity()
    {
        for (let i = 0; i < this._texturePorts.length; i++)
        {
            const activeIndic = document.getElementById("activity" + this._texturePorts[i].id);
            if (activeIndic)
            {
                if (this._texturePorts[i].activity > 0) activeIndic.innerHTML = this._texturePorts[i].activity + " FPS";
                else activeIndic.innerHTML = "";
            }
            this._texturePorts[i].activity = 0;
        }
    }



    enableBgPreview()
    {
        const enabled = CABLES.UI.userSettings.get("bgpreviewMax");
        this._enabled = enabled;

        // if (storeSetting)
        // {
        //     CABLES.UI.userSettings.set("bgpreviewMax", enabled);

        //     this._log.log("store bgpreview max", enabled);
        // }

        // this._log.log("bgpreviewMax", CABLES.UI.userSettings.get("bgpreviewMax"), enabled);


        if (this._mode == MODE_CORNER)
        {
            if (!enabled)
            {
                this.pressedEscape();

                ele.byId("bgpreviewInfo").classList.add("hidden");
                ele.byId("bgpreviewMin").classList.add("hidden");
                ele.byId("bgpreviewMax").classList.remove("hidden");
                ele.byId("texprevSize").classList.add("hidden");
                ele.byId("texprevSize2").classList.add("hidden");

                this._ele.classList.add("hidden");
            }
            else
            {
                this.paused = false;
                ele.byId("bgpreviewInfo").classList.remove("hidden");
                ele.byId("bgpreviewMin").classList.remove("hidden");
                ele.byId("bgpreviewMax").classList.add("hidden");
                ele.byId("texprevSize").classList.remove("hidden");
                ele.byId("texprevSize2").classList.remove("hidden");

                this._ele.classList.remove("hidden");

                if (this._lastClicked) this.selectTexturePort(this._lastClickedP);
            }
        }
    }

    hide()
    {
        this._paused = true;

        if (this._mode == MODE_CORNER) hideToolTip();
    }

    pressedEscape()
    {
        this.hide();
    }

    render()
    {
        if (!this.paused)
        {
            this._ele.style.display = "block";
            this._renderTexture(this._lastClicked, this._ele);

            if (this._ele.width + "px" != this._ele.style.width || this._ele.height + "px" != this._ele.style.height)
            {
                this._ele.style.width = this._ele.width + "px";
                this._ele.style.height = this._ele.height + "px";
            }
        }
    }

    selectTexturePortId(opid, portid)
    {
        if (!window.gui) return;

        const op = gui.corePatch().getOpById(opid);
        if (!op) return;

        const p = op.getPortById(portid);

        if (!p || p.links.length < 1) return;

        const thePort = p.links[0].getOtherPort(p);
        this.selectTexturePort(thePort);
    }

    hover(p)
    {
        let thePort = p;
        if (p.direction == CABLES.PORT_DIR_IN && p.isLinked())
            thePort = p.links[0].getOtherPort(p);

        if (this._lastClickedP != thePort)
        {
            this._hoveringTexPort = true;
            this._tempOldTexPort = this._lastClickedP;
            this.selectTexturePort(thePort);
        }
    }

    hoverEnd()
    {
        if (this._hoveringTexPort)
        {
            if (!this._tempOldTexPort) this.enableBgPreview(false);
            else this.selectTexturePort(this._tempOldTexPort);
            this._hoveringTexPort = false;
            this._tempOldTexPort = null;
            this._lastClickedP = null;
        }
    }

    selectTexturePort(p)
    {
        if (!gui.userSettings.get("bgpreview"))
        {
            this._lastClickedP = p;
            this._lastClicked = this.updateTexturePort(p);

            return;
        }


        if (this._mode == MODE_CORNER)
            ele.byId("bgpreviewButtonsContainer").classList.remove("hidden");

        hideToolTip();

        if (!this._listeningFrame && p)
        {
            this._listeningFrame = true;
            p.op.patch.cgl.on("beginFrame", () =>
            {
                this.render();
            });
        }

        this._lastClickedP = p;
        this._lastClicked = this.updateTexturePort(p);

        const tp = this.updateTexturePort(p);

        if (!tp)
        {
            return;
        }

        for (let i = 0; i < this._texturePorts.length; i++)
        {
            const el = document.getElementById("preview" + this._texturePorts[i].id);
            if (el)
                if (this._texturePorts[i].port.op != p.op) el.classList.remove("activePreview");
                else el.classList.add("activePreview");
        }
    }

    updateTexturePort(port)
    {
        let doUpdateHtml = false;
        const p = port;
        let idx = -1;

        if (p && p.get() && p.get().tex && port.direction == CABLES.PORT_DIR_OUT)
        {
            const id = port.op.id + port.name;

            idx = -1;
            for (let i = 0; i < this._texturePorts.length; i++)
                if (this._texturePorts[i].id == id)
                    idx = i;

            if (idx == -1)
            {
                doUpdateHtml = true;
                this._texturePorts.push({
                    "id": id,
                    "opid": port.op.id,
                    "port": p,
                    "lastTimeClicked": -1,
                    "doShow": false,
                    "activity": 0
                });
                idx = this._texturePorts.length - 1;
            }

            this._texturePorts[idx].updated = CABLES.now();
            this._texturePorts[idx].activity++;

            // if (this._mode == CABLES.UI.TexturePreviewer.MODE_ACTIVE) this._texturePorts[idx].doShow = true;
        }

        return this._texturePorts[idx];
    }

    _showInfo(tex)
    {
        let str = "";
        if (tex)
        {
            str = tex.width + " x " + tex.height;
            if (tex.textureType === CGL.Texture.TYPE_FLOAT) str += " 32bit";
        }

        if (this._infoStr == str) return;

        this._infoStr = str;
        ele.byId("bgpreviewInfo").innerText = str;
    }

    gotoOp()
    {
        if (this._lastClickedP) gui.patchView.centerSelectOp(this._lastClickedP.op.id);
    }

    deserialize(o)
    {
        // if (!o) return;

        // this.enableBgPreview(o.enabled);
        // const op = gui.corePatch().getOpById(o.op);

        // if (!op)
        // {
        //     this._log.log("texpreviewer cant find op");
        //     return;
        // }

        // const p = op.getPort(o.port);

        // this.selectTexturePort(p);
        // this._lastClicked = this.updateTexturePort(p);

        // // this.pin(o.pinned);
        // this.enableBgPreview(o.enabled);
    }

    serialize()
    {
        const o = {};

        // // o.pinned = gui.metaTexturePreviewer.pinned;

        // if (this._lastClickedP || this._lastClicked)
        // {
        //     const p = this._lastClicked || this._lastClickedP.port;

        //     if (p)
        //     {
        //         o.port = p.port.name;
        //         o.op = p.port.op.id;
        //         o.enabled = this._enabled;
        //     }

        //     // this._log.log(o);
        // }

        return o;
    }
}
