import { Patch } from "cables";
import { CGL, Texture } from "cables-corelibs";
import GlCanvas from "../gldraw/glcanvas.js";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";

/**
 * canvas for the timeline {@link GlTimeline}
 *
 * @export
 * @class glTimelineCanvas
 * @extends {GlCanvas}
 */
export class glTimelineCanvas extends GlCanvas
{

    /**
     * @param {Patch} _patch
     * @param {HTMLElement} parentEle
     * @param {GlTimelineTab} tab
     */
    constructor(_patch, parentEle, tab)
    {
        super(_patch, parentEle);

        this.tab = tab;
        this.setSize(100, 100);
        this.activityHigh();
        this.patch.addEventListener("onRenderFrame", this.render.bind(this));

        this.glTimeline = new GlTimeline(this.cgl);
    }

    render()
    {
        if (this.tab.resizing) return;
        if (gui && gui.corePatch().timer.isPlaying()) this._targetFps = 0; // todo check if time is on screen...?

        if (this._targetFps != 0 && performance.now() - this._lastTime < 1000 / this._targetFps) return;

        const cgl = this.cgl;

        if (CGL.MESH.lastMesh) CGL.MESH.lastMesh.unBind();

        if (this._oldTargetFps != this._targetFps) this._oldTargetFps = this._targetFps;

        cgl.renderStart(cgl);

        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.cgl.setTexture(i, Texture.getEmptyTexture(this.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime) this._firstTime = false;

        this.glTimeline.render(this.width, this.height);

        if (this.glTimeline.isAnimated) this.activityHigh();

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();
    }
}
