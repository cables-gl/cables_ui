import { Patch } from "cables";
import { Texture } from "cables-corelibs";
import GlCanvas from "../gldraw/glcanvas.js";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";
import GlTimelineTab from "../components/tabs/tab_gltimeline.js";

/** Canvas of the timeline ({@link GlTimeline}). */
export class glTimelineCanvas extends GlCanvas
{
    #renderFrameListener = null;

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
        this.#renderFrameListener = _patch?.on("onRenderFrame", this.render.bind(this));

        this.glTimeline = new GlTimeline(this.cgl);

        if (!this.glTimeline)
        {
            console.error("timeline b0rken");
        }
    }

    dispose()
    {
        this.#renderFrameListener?.remove();
        this.#renderFrameListener = null;
        super.dispose();
    }

    render()
    {

        const startTime = performance.now();

        if (this.tab.resizing) return;
        const playing = gui && gui.corePatch().timer.isPlaying();

        if (!playing && this.targetFps != 0 && performance.now() - this._lastTime < 1000 / this.targetFps) return;

        const cgl = this.cgl;
        cgl.doGlQueryTiming = true;

        if (cgl.lastMesh) cgl.lastMesh.unBind();

        cgl.renderStart(cgl);

        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.cgl.setTexture(i, Texture.getEmptyTexture(this.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime) this._firstTime = false;

        if (this.glTimeline)
        {
            this.glTimeline.render(this.width, this.height);
            if (this.glTimeline.isAnimated) this.activityHigh();
        }

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();

        gui.corePatch().perfProfiler.setDuration("timeline cpu", performance.now() - startTime);
    }
}
