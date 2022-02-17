import Logger from "../utils/logger";
import userSettings from "./usersettings";
//

import srcShaderFragment from "./texturepreviewer_glsl.frag";
import srcShaderVertex from "./texturepreviewer_glsl.vert";


export default class TexturePreviewer
{
    constructor(tabs)
    {
        this._log = new Logger();

        this._texturePorts = [];
        this._showing = false;
        this._lastTimeActivity = 0;
        this._mode = 1;
        this._paused = false;
        this._shader = null;
        this._shaderTexUniform = null;
        this._tempTexturePort = null;
        this._hoveringTexPort = false;
        this._listeningFrame = false;
        this._emptyCubemap = null;

        this._ele = document.getElementById("bgpreview");
        this.setSize();
        this._ele.addEventListener("click", function ()
        {
            if (this._lastClicked && window.gui) gui.patchView.centerSelectOp(this._lastClicked.opid);
        }.bind(this));


        userSettings.addEventListener("onChange", (key, v) =>
        {
            if (key == "texpreviewSize") this.setSize(v);
            if (key == "bgpreview") this.enableBgPreview(v);
        });
    }

    _renderTexture(tp, ele)
    {
        let port = tp.port;
        if (!tp.port)port = tp;
        const id = tp.id;
        const texSlot = 5;
        const texSlotCubemap = texSlot + 1;

        let meta = true;
        if (ele)meta = false;

        const previewCanvasEle = ele || document.getElementById("preview_img_" + id);

        if (!previewCanvasEle)
        {
            return;
        }
        const previewCanvas = previewCanvasEle.getContext("2d");

        if (previewCanvas && port && port.get())
        {
            const perf = CABLES.UI.uiProfiler.start("texpreview");
            const cgl = port.parent.patch.cgl;

            if (!this._emptyCubemap) this._emptyCubemap = CGL.Texture.getEmptyCubemapTexture(cgl);
            port.parent.patch.cgl.profileData.profileTexPreviews++;

            if (!this._mesh)
            {
                const geom = new CGL.Geometry("preview op rect");
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
                this._shader = new CGL.Shader(cgl, "MinimalMaterial");
                this._shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
                this._shader.setSource(srcShaderVertex, srcShaderFragment);
                this._shaderTexUniform = new CGL.Uniform(this._shader, "t", "tex", texSlot);
                this._shaderTexCubemapUniform = new CGL.Uniform(this._shader, "tc", "cubeMap", texSlotCubemap);

                this._shaderTexUniformW = new CGL.Uniform(this._shader, "f", "width", port.get().width);
                this._shaderTexUniformH = new CGL.Uniform(this._shader, "f", "height", port.get().height);
                this._shaderTypeUniform = new CGL.Uniform(this._shader, "f", "type", 0);
            }

            cgl.pushPMatrix();

            mat4.ortho(cgl.pMatrix, -1, 1, 1, -1, 0.001, 11);
            // if(port.get().oldTexFlip) mat4.ortho(cgl.pMatrix,-1,1,-1,1,0.001,11);

            const oldTex = cgl.getTexture(texSlot);
            const oldTexCubemap = cgl.getTexture(texSlotCubemap);

            let texType = 0;
            if (!port.get()) return;
            if (port.get().cubemap) texType = 1;
            if (port.get().textureType == CGL.Texture.TYPE_DEPTH) texType = 2;

            if (texType == 0 || texType == 2)
            {
                cgl.setTexture(texSlot, port.get().tex);
                cgl.setTexture(texSlotCubemap, this._emptyCubemap.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
            }
            else if (texType == 1)
            {
                cgl.setTexture(texSlotCubemap, port.get().cubemap, cgl.gl.TEXTURE_CUBE_MAP);
            }

            // this._shader.toggleDefine("CUBEMAP", true);

            this._shaderTypeUniform.setValue(texType);

            this._mesh.render(this._shader);
            if (texType == 0) cgl.setTexture(texSlot, oldTex);
            if (texType == 1) cgl.setTexture(texSlotCubemap, oldTexCubemap);

            cgl.popPMatrix();
            cgl.resetViewPort();

            // const containerEle=document.getElementById("preview_img_container"+id);
            // const w=Math.min(containerEle.offsetWidth,port.get().width||256);
            // const h=w*(port.get().height/port.get().width);


            const s = this._getCanvasSize(port, port.get(), meta);
            if (s[0] == 0 || s[1] == 0) return;


            if (texType == 1)s[0] *= 1.33;
            previewCanvasEle.width = s[0];
            previewCanvasEle.height = s[1];

            previewCanvas.clearRect(0, 0, previewCanvasEle.width, previewCanvasEle.height);
            previewCanvas.drawImage(cgl.canvas, 0, 0, previewCanvasEle.width, previewCanvasEle.height);

            cgl.gl.clearColor(0, 0, 0, 0);
            cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

            perf.finish();
        }
        else
        {
        }
    }

    setSize(size)
    {
        if (size == undefined)
        {
            size = userSettings.get("texpreviewSize");
            if (!size)size = 50;
        }

        this._ele.classList.remove("bgpreviewScale25");
        this._ele.classList.remove("bgpreviewScale33");
        this._ele.classList.remove("bgpreviewScale50");
        this._ele.classList.remove("bgpreviewScale100");

        this._ele.classList.add("bgpreviewScale" + size);

        userSettings.set("texpreviewSize", size);


        document.getElementById("bgpreviewButtons").addEventListener("pointerenter", (e) =>
        {
            this._showInfoToolTip(e);
        });

        this._ele.addEventListener("pointerenter", (e) =>
        {
            this._showInfoToolTip(e);
        });
        this._ele.addEventListener("pointerleave", (e) =>
        {
            CABLES.UI.hideToolTip();
        });
    }

    _showInfoToolTip(e)
    {
        if (!this._lastClicked || !this._lastClicked.port) return;

        const t = this._lastClicked.port.get();

        if (!t) return;

        CABLES.UI.showToolTip(e, t.getInfoOneLine());
    }

    _getCanvasSize(port, tex, meta)
    {
        let maxWidth = 300;
        let maxHeight = 200;

        if (!meta)
        {
            const patchRect = gui.patchView.element.getBoundingClientRect();
            maxWidth = Math.min(patchRect.width, port.parent.patch.cgl.canvasWidth);
            maxHeight = Math.min(patchRect.height, port.parent.patch.cgl.canvasHeight);
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
                "title": o.port.parent.getName() + " - " + o.port.name,
                "id": o.id,
                "opid": o.opid,
                "order": parseInt(o.lastTimeClicked, 10),
                "size": o.port.get().width + " x " + o.port.get().height
            };
    }


    hide()
    {
        ele.byId("bgpreviewButtonsContainer").classList.add("hidden");
        this._paused = true;
        CABLES.UI.hideToolTip();
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


    enableBgPreview(enabled)
    {
        if (!enabled)
        {
            this.pressedEscape();
        }
        else
        {
            if (this._lastClicked) this.selectTexturePort(this._lastClickedP);
        }
    }

    pressedEscape()
    {
        this._lastClicked = null;
        const ele = document.getElementById("bgpreview");
        if (ele)ele.style.display = "none";
        this.hide();
    }

    render()
    {
        if (this._lastClicked)
        {
            // this._ele=document.getElementById('bgpreview');
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
        if (!userSettings.get("bgpreview"))
        {
            this._lastClickedP = p;
            this._lastClicked = this.updateTexturePort(p);

            return;
        }


        ele.byId("bgpreviewButtonsContainer").classList.remove("hidden");
        CABLES.UI.hideToolTip();

        if (!this._listeningFrame && p)
        {
            this._listeningFrame = true;
            p.parent.patch.cgl.on("beginFrame", () =>
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
            const ele = document.getElementById("preview" + this._texturePorts[i].id);
            if (ele)
                if (this._texturePorts[i].port.parent != p.parent) ele.classList.remove("activePreview");
                else ele.classList.add("activePreview");
        }
    }


    setMode(m)
    {
        // this.clear();
        this._mode = m;
    }

    updateTexturePort(port)
    {
        // if(this._paused || port!=this._lastClicked)return;
        let doUpdateHtml = false;
        const p = port;
        let idx = -1;

        if (p && p.get() && p.get().tex && port.direction == CABLES.PORT_DIR_OUT)
        {
            const id = port.parent.id + port.name;

            idx = -1;
            for (let i = 0; i < this._texturePorts.length; i++)
                if (this._texturePorts[i].id == id)
                    idx = i;

            if (idx == -1)
            {
                doUpdateHtml = true;
                this._texturePorts.push({
                    id,
                    "opid": port.parent.id,
                    "port": p,
                    "lastTimeClicked": -1,
                    "doShow": false,
                    "activity": 0
                });
                idx = this._texturePorts.length - 1;
            }

            this._texturePorts[idx].updated = CABLES.now();
            this._texturePorts[idx].activity++;

            if (this._mode == CABLES.UI.TexturePreviewer.MODE_ACTIVE) this._texturePorts[idx].doShow = true;
        }

        return this._texturePorts[idx];
    }
}


// CABLES.UI.TexturePreviewer.MODE_CLICKED = 0;
// CABLES.UI.TexturePreviewer.MODE_ACTIVE = 1;
