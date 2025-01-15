import GlPatch from "../glpatch/glpatch.js";
import GlPatchAPI from "../glpatch/patchapi.js";
import { gui } from "../gui.js";

export default class GlCanvas
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

        this.canvas = document.createElement("canvas");
        this.canvas.id = "glGuiCanvas-" + CABLES.uuid();
        this.canvas.style.border = "0px solid white";
        this.canvas.style.outline = "0";
        this.canvas.style.position = "absolute";

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

        this.cgl = this.patch.cgl;
        this.cgl.pixelDensity = window.devicePixelRatio || 1;
        this.cgl.updateSize();

        gui.on("uiIdleStart", () =>
        {
            this.patch.pause();
        });

        gui.on("uiIdleEnd", () =>
        {
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
        }, { "passive": true });

        this.canvas.addEventListener("pointerdown", (e) =>
        {
            this.activityHigh();
        }, { "passive": true });

        this.canvas.addEventListener("pointerup", (e) =>
        {
            this.activityHigh();
        }, { "passive": true });

        this.canvas.addEventListener("pointerleave", (e) =>
        {
            this.activityMedium();
        }, { "passive": true });

        this.canvas.addEventListener("pointerenter", (e) =>
        {
            this.activityHigh();
        }, { "passive": true });
    }

    get element()
    {
        return this.canvas;
    }

    setSize(w, h)
    {
        this.width = w;
        this.height = h;

        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;

        this.cgl.pixelDensity = window.devicePixelRatio;

        if (this.patch.isPlaying()) this.cgl.setSize(this.width * window.devicePixelRatio, this.height * window.devicePixelRatio);
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
        this._targetFps = 30;
        clearTimeout(this._activityTimeout);
        this._activityTimeout = setTimeout(() => { this.activityIdle(); }, 30000);
    }
}
