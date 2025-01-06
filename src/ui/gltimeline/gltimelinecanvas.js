import GlCanvas from "../gldraw/glcanvas.js";
import GlTimeline from "./gltimeline.js";

/**
 * canvas for the patchfield {@link GlPatch}
 *
 * @export
 * @class GlUiCanvas
 */
export default class glTimelineCanvas extends GlCanvas
{
    constructor(_patch, parentEle)
    {
        super(_patch, parentEle);

        this.setSize(100, 100);
        this.parentResized();
        this.activityHigh();
        this.patch.addEventListener("onRenderFrame", this.render.bind(this));

        this.glTimeline = new GlTimeline(this.cgl);
    }

    parentResized()
    {
        console.log(this._parentEle.clientWidth, this._parentEle.clientHeight, this.cgl.pixelDensity);
        this.setSize(this._parentEle.clientWidth, this._parentEle.clientHeight);
    }


    render()
    {
        // this.glPatch.updateTime()
        // if (this.glTimeline.paused) return;
        if (this._targetFps != 0 && !this.glTimeline.mouseOverCanvas && performance.now() - this._lastTime < 1000 / this._targetFps) return;

        const cgl = this.cgl;

        if (CGL.MESH.lastMesh) CGL.MESH.lastMesh.unBind();

        if (this._oldTargetFps != this._targetFps) this._oldTargetFps = this._targetFps;

        cgl.renderStart(cgl);

        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.cgl.setTexture(i, CGL.Texture.getEmptyTexture(this.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime) this._firstTime = false;

        this.glTimeline.render(this.width, this.height);

        if (this.glTimeline.isAnimated) this.activityHigh();

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();
    }
}
