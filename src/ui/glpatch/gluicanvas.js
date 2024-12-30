import GlCanvas from "../gldraw/glcanvas.js";
import GlPatch from "./glpatch.js";
import GlPatchAPI from "./patchapi.js";

/**
 * canvas for the patchfield {@link GlPatch}
 *
 * @export
 * @class GlUiCanvas
 */
export default class GlUiCanvas extends GlCanvas
{
    constructor(_patch, parentEle)
    {
        super(_patch, parentEle);

        this.glPatch = new GlPatch(this.cgl);
        this.patchApi = new GlPatchAPI(_patch, this.glPatch);
        this.patchApi.reset();


        this.cgl.on("resize", () =>
        {
            this.glPatch.emitEvent("resize", this.width * window.devicePixelRatio, this.height * window.devicePixelRatio);
        });

        this.cgl.on("beginFrame", () =>
        {
            this.glPatch.vizLayer.renderVizLayer(false);
        });

        this.setSize(100, 100);

        gui.on("canvasModeChange", (mode) =>
        {
            this.canvas.classList.toggle("gluiPatchBg", mode == gui.canvasManager.CANVASMODE_PATCHBG);
        });

        this.glPatch.on("paused", () =>
        {
            this.patch.pause();
        });

        this.glPatch.on("resumed", () =>
        {
            this.cgl.setSize(this.width, this.height);
            this.patch.resume();
        });
        this.canvas.addEventListener("pointermove", (e) =>
        {
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        this.canvas.addEventListener("pointerdown", (e) =>
        {
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        this.canvas.addEventListener("pointerup", (e) =>
        {
            this.glPatch.needsRedraw = true;
        }, { "passive": true });

        // this is for disabling touchpad "pinch with two fingers" on macs, which would zoom in html
        this.canvas.addEventListener("wheel", (event) => { if (event.ctrlKey) event.preventDefault(); }, { "passive": false });

        this.canvas.addEventListener("wheel", (event) =>
        {
            this.activityHigh();
        }, { "passive": true });

        this.parentResized();
        this.activityHigh();
        this.patch.addEventListener("onRenderFrame", this.render.bind(this));
    }


    parentResized()
    {
        this.setSize(this._parentEle.clientWidth, this._parentEle.clientHeight);
        this.glPatch.needsRedraw = true;
        this.glPatch.emitEvent("resize", this._parentEle.clientWidth, this._parentEle.clientHeight);
    }


    render()
    {
        this.glPatch.updateTime();
        if (this.glPatch.paused) return;
        if (this._targetFps != 0 && !this.glPatch.mouseOverCanvas && performance.now() - this._lastTime < 1000 / this._targetFps) return;

        const cgl = this.cgl;

        if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

        if (this._oldTargetFps != this._targetFps) this._oldTargetFps = this._targetFps;

        cgl.renderStart(cgl);

        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.cgl.setTexture(i, CGL.Texture.getEmptyTexture(this.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime) this._firstTime = false;

        this.glPatch.debugData.targetFps = this._targetFps;

        this.glPatch.render(
            this.width, this.height, //
            0, 0, // scroll
            0, //
            0, 0, // mouse
            this._mouseButton // mouse button
        );

        if (this.glPatch.isAnimated) this.activityHigh();

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();
    }
}
