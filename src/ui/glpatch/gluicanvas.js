import GlPatch from "./glpatch.js";
import GlPatchAPI from "./patchapi.js";

/**
 * canvas for the patchfield {@link GlPatch}
 *
 * @export
 * @class GlUiCanvas
 */
export default class GlUiCanvas
{
    constructor(_patch, parentEle)
    {
        this._moveover = true;
        this._firstTime = true;
        this._lastTime = 0;
        this.width = 0;
        this.height = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this.loaded = false;
        this._inited = false;
        this.clear = true;

        document.body.style["touch-action"] = "none";
        // this._zoom = GlUiConfig.zoomDefault;

        this.canvas = document.createElement("canvas");
        this.canvas.id = "glGuiCanvas-" + CABLES.uuid();
        // this.canvas.style.display='block';
        // this.canvas.style.position='absolute';
        this.canvas.style.border = "0px solid white";
        this.canvas.style.outline = "0";
        this.canvas.style.position = "absolute";

        // this.canvas.style.cursor='none';
        // this.canvas.style['z-index']=9999999991;
        this.canvas.setAttribute("tabindex", 10);
        this._parentEle = parentEle;

        if (parentEle)parentEle.appendChild(this.canvas);
        else document.body.appendChild(this.canvas);

        this.patch = new CABLES.Patch(
            {
                "glCanvasId": this.canvas.id,
                "glCanvasResizeToParent": false,
                "glCanvasResizeToWindow": false,
                "canvas": { "alpha": true, "premultipliedAlpha": true, "antialias": true }
            });


        // new GlAlwaysCheckError(this.patch.cgl);

        this.glPatch = new GlPatch(this.patch.cgl);
        this.patchApi = new GlPatchAPI(_patch, this.glPatch);
        this.patchApi.reset();


        this.patch.cgl.pixelDensity = window.devicePixelRatio || 1;
        this.patch.cgl.updateSize();

        this.patch.cgl.on("beginFrame", () =>
        {
            this.glPatch.vizLayer.renderVizLayer(false);
        });


        this.setSize(100, 100);

        gui.on("canvasModeChange", (mode) =>
        {
            this.canvas.classList.toggle("gluiPatchBg", mode == gui.canvasManager.CANVASMODE_PATCHBG);
        });

        gui.on("uiIdleStart", () =>
        {
            this.patch.pause();
        });

        gui.on("uiIdleEnd", () =>
        {
            this.patch.resume();
        });

        this.glPatch.on("paused", () =>
        {
            this.patch.pause();
        });

        this.glPatch.on("resumed", () =>
        {
            this.patch.cgl.setSize(this.width, this.height);
            this.patch.resume();
        });

        this.canvas.addEventListener("touchmove",
            (e) =>
            {
                if (e.touches.length > 1) e.preventDefault();
            });

        this.canvas.addEventListener("pointermove", (e) =>
        {
            this.activityHigh();

            this._mouseX = e.offsetX;
            this._mouseY = e.offsetY;
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        this.canvas.addEventListener("pointerdown", (e) =>
        {
            this.activityHigh();
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        this.canvas.addEventListener("pointerup", (e) =>
        {
            this.activityHigh();
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        this.canvas.addEventListener("pointerleave", (e) =>
        {
            this.activityMedium();
        }, { "passive": true });

        this.canvas.addEventListener("pointerenter", (e) =>
        {
            this.activityHigh();
        }, { "passive": true });



        // this is for disabling touchpad "pinch with two fingers" on macs, which would zoom in html
        this.canvas.addEventListener("wheel", (event) => { if (event.ctrlKey) event.preventDefault(); }, { "passive": false });

        this.canvas.addEventListener("wheel", (event) =>
        {
            this.activityHigh();

            // event.preventDefault();
            // const wheelMultiplier = userSettings.get("wheelmultiplier") || 1;

            // let delta = CGL.getWheelSpeed(event);
            // delta *= wheelMultiplier;

            // if (event.altKey) this._scrollY -= delta;
            // else if (event.shiftKey) this._scrollX -= delta;
            // else this._zoom += delta * (this._zoom / 155);

            // this._zoom = Math.max(GlUiConfig.minZoom, this._zoom);
            // this._smoothedZoom.set(this._zoom);

            // if (event.ctrlKey || event.altKey) // disable chrome pinch/zoom gesture
            // {
            //     event.preventDefault();
            //     event.stopImmediatePropagation();
            // }
        }, { "passive": true });


        this.parentResized();
        this.activityHigh();
        this.patch.addEventListener("onRenderFrame", this.render.bind(this));
    }

    get element()
    {
        return this.canvas;
    }

    parentResized()
    {
        this.setSize(this._parentEle.clientWidth, this._parentEle.clientHeight);
        this.glPatch.needsRedraw = true;
        this.glPatch.emitEvent("resize", this._parentEle.clientWidth, this._parentEle.clientHeight);
    }

    setSize(w, h)
    {
        this.width = w;
        this.height = h;

        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;

        this.patch.cgl.pixelDensity = window.devicePixelRatio;

        if (this.patch.isPlaying()) this.patch.cgl.setSize(this.width * window.devicePixelRatio, this.height * window.devicePixelRatio);
        this.glPatch.emitEvent("resize", this.width * window.devicePixelRatio, this.height * window.devicePixelRatio);
    }

    dispose()
    {
        this.patch.removeEventListener("onRenderFrame", this.render.bind(this));
        this.patch.pause();
        this.patch.dispose();
        this.canvas.remove();
    }

    activityIdle()
    {
        this._targetFps = 10;
    }

    activityHigh()
    {
        this._targetFps = 0;
        clearTimeout(this._activityTimeout);
        this._activityTimeout = setTimeout(() => { this.activityMedium(); }, 40000);
    }

    activityMedium()
    {
        // console.log("activityMedium")
        this._targetFps = 30;
        // if (!this.glPatch.mouseOverCanvas) this._targetFps = 0;
        clearTimeout(this._activityTimeout);
        this._activityTimeout = setTimeout(() => { this.activityIdle(); }, 30000);
    }

    render()
    {
        this.glPatch.updateTime();
        if (this.glPatch.paused) return;
        if (this._targetFps != 0 && !this.glPatch.mouseOverCanvas && performance.now() - this._lastTime < 1000 / this._targetFps)
        {
            return;
        }

        const cgl = this.patch.cgl;



        if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

        if (this._oldTargetFps != this._targetFps)
        {
            this._oldTargetFps = this._targetFps;
        }

        cgl.renderStart(cgl);

        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.patch.cgl.setTexture(i, CGL.Texture.getEmptyTexture(this.patch.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime)
        {
            this._firstTime = false;
        }


        this.glPatch.debugData.targetFps = this._targetFps;

        this.glPatch.render(
            this.width, this.height, //
            0, 0, // scroll
            0, //
            0, 0, // mouse
            this._mouseButton // mouse button
        );
        if (this.glPatch.isAnimated)
        {
            this.activityHigh();
            // this._targetFps = 0;
        }

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();
    }
}
