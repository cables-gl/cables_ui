import { Anim } from "cables";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";

export class GlTlView
{

    /** @type {GlTimeline} */
    #tl;

    /** @type {Anim} */
    #animZoom;

    /** @type {Anim} */
    #animScroll;

    /** @type {Anim} */
    #animScrollY;

    #zoom = 2;

    #offset = -0.1;
    #offsetY = 0.0;

    #frameMinVal = -1;
    #frameMaxVal = 1;

    #finalMinVal = -2;
    #finalMaxVal = 2;

    /** @type {Anim} */
    #animMinVal;

    /** @type {Anim} */
    #animMaxVal;

    #timer = new CABLES.Timer();

    /**
     * @param {GlTimeline} tl
     */
    constructor(tl)
    {
        this.#tl = tl;

        const defaultEasing = CABLES.Anim.EASING_QUINT_OUT;

        this.#animZoom = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animZoom.setValue(0, this.#zoom);

        this.#animScroll = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animScroll.setValue(0, this.#offset);

        this.#animScrollY = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animScrollY.setValue(0, this.#offsetY);

        this.#animMinVal = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animMaxVal = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.setMinVal(-1);
        this.setMaxVal(1);

        this.#timer.play();
        this.updateAnims();
    }

    isAnimated()
    {
        const t = this.#timer.getTime() - 0.1;
        return (
            (!this.#animZoom.isFinished(t)) ||
            (!this.#animScroll.isFinished(t)) ||
            (!this.#animScrollY.isFinished(t)) ||
            (!this.#animMinVal.isFinished(t)) ||
            (!this.#animMaxVal.isFinished(t))
        );

    }

    get zoom()
    {
        return this.#animZoom.getValue(this.#timer.getTime());
    }

    get finalMinVal()
    {
        return this.#finalMinVal;
    }

    get finalMaxVal()
    {
        return this.#finalMaxVal;
    }

    set minVal(v)
    {
        this.setMinVal(v);
    }

    set maxVal(v)
    {
        this.setMaxVal(v);
    }

    get minVal()
    {
        return this.#frameMinVal;
    }

    get maxVal()
    {
        return this.#frameMaxVal;
    }

    checkMinMaxVals()
    {
        // console.log("", this.#finalMinVal, this.#finalMaxVal);

        // if (this.#finalMinVal == this.#finalMaxVal) this.#finalMaxVal = this.#finalMinVal + 1;
        // if (this.maxVal == this.minVal)
        // {
        //     this.maxVal = this.minVal + 1;
        // }
    }

    /**
     * @param {number} v
     */
    setMinVal(v, dur = 0.0)
    {
        if (this.#finalMinVal == v) return;
        this.#finalMinVal = v;
        this.#animMinVal.clear(this.#timer.getTime());
        this.#animMinVal.setValue(this.#timer.getTime() + dur, this.#finalMinVal);
    }

    /**
     * @param {number} v
     */
    setMaxVal(v, dur = 0.3)
    {
        if (this.#finalMaxVal == v) return;
        this.#finalMaxVal = v;
        this.#animMaxVal.clear(this.#timer.getTime());
        this.#animMaxVal.setValue(this.#timer.getTime() + dur, this.#finalMaxVal);
    }

    /** @returns {number} */
    get offset()
    {
        return this.#offset;
    }

    /** @returns {number} */
    get offsetY()
    {
        return this.#offsetY;
    }

    /** @returns {number} */
    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

    get pixelPerSecond()
    {
        return (this.#tl.width) / this.#tl.duration;
    }

    get visibleTime()
    {
        return Math.abs(this.timeRight) + Math.abs(this.timeLeft);
    }

    get timeLeft()
    {
        return this.offset;
    }

    get timeRight()
    {
        return this.pixelToTime(this.#tl.width) + this.offset;
    }

    /**
     * @param {number} t
     */
    timeToPixel(t)
    {
        const r = t * (this.#tl.width / this.#zoom);
        return r;
    }

    /**
     * @param {number} t
     */
    timeToPixelScreen(t)
    {
        return this.timeToPixel(t) - this.timeToPixel(this.#offset);
    }

    /**
     * @param {number} x
     */
    pixelToTime(x)
    {
        return x / this.timeToPixel(1);
    }

    /**
     * @param {number} x
     */
    pixelScreenToTime(x)
    {
        return this.pixelToTime(x);
    }

    /**
     * @param {number} len
     */
    setZoomLength(len)
    {
        if (len < 0.1)len = 0.1;
        console.log("set zoom length", len);
        let zoom = len;
        let dur = 0.3;
        this.#animZoom.clear(this.#timer.getTime());
        this.#animZoom.setValue(this.#timer.getTime() + dur, zoom);
    }

    /**
     * @param {number} delta
     * @param {number} dur
     */
    setZoomOffset(delta, dur = 0.3)
    {
        let zoom = this.#zoom * delta;
        zoom = CABLES.clamp(zoom, 0.1, 10000000);

        const t = this.#timer.getTime();
        this.#animZoom.clear(t);
        // this.#animZoom.setValue(t, this.#zoom);
        this.#animZoom.setValue(t + dur, zoom);
    }

    centerCursor()
    {
        let center = (this.visibleTime / 2);
        if (this.cursorTime == 0)center = this.visibleTime / 10;
        this.scrollTo(this.cursorTime - center);
    }

    /**
     * @param {number} delta
     */
    scale(delta)
    {
        delta = 1 + delta;
        const nmin = this.minVal *= delta;
        const nmax = this.maxVal *= delta;
        this.minVal = Math.min(nmin, nmax);
        this.maxVal = Math.max(nmin, nmax);
    }

    /**
     * @param {number} delta
     * @param {number} duration
     */
    scroll(delta, duration = 0.2)
    {
        let finalTime = this.#offset + delta;

        const t = this.#timer.getTime();
        this.#animScroll.clear(t);
        this.#animScroll.setValue(t + duration, finalTime);
    }

    /**
     * @param {number} finalTime
     * @param {number} duration=0.2
     */
    scrollTo(finalTime, duration = 0.2)
    {
        const t = this.#timer.getTime();
        this.#animScroll.clear(t);
        this.#animScroll.setValue(t + duration, finalTime);
    }

    /**
     * @param {number} scrolly
     * @param {number} duration=0.2
     */
    scrollToY(scrolly, duration = 0.2)
    {

        const t = this.#timer.getTime();
        this.#animScrollY.clear(t);
        this.#animScrollY.setValue(t + duration, scrolly);
    }

    /**
     * @param {number} pixel
     * @param {number} [duration]
     */
    scrollY(pixel, duration = 0.2)
    {
        if (pixel == 0) return;
        const h = this.#tl.height - this.#tl.getFirstLinePosy();
        const range = (Math.abs(this.finalMinVal) + Math.abs(this.finalMaxVal));
        const y = (pixel / h) * range;
        const t = this.#timer.getTime();

        this.#finalMinVal += y;
        this.#finalMaxVal += y;
        this.#animMinVal.clear(t);
        this.#animMaxVal.clear(t);
        this.#animMinVal.setValue(t, this.finalMinVal);
        this.#animMaxVal.setValue(t, this.finalMaxVal);
    }

    updateAnims()
    {
        this.#timer.update();
        const t = this.#timer.getTime();
        this.#zoom = this.#animZoom.getValue(t);
        this.#offset = this.#animScroll.getValue(t);
        this.#offsetY = this.#animScrollY.getValue(t);
        this.#frameMinVal = this.#animMinVal.getValue(t);
        this.#frameMaxVal = this.#animMaxVal.getValue(t);
        this.checkMinMaxVals();
    }

    getDebug()
    {
        const o = {
            "minval": this.minVal,
            "maxval": this.maxVal,
            "finalmaxval": this.#finalMaxVal,
            "finalminval": this.#finalMinVal,
            "minanimfinished": this.#animMinVal.isFinished(this.#timer.getTime()),
            "offset": this.offset,
            "offsetY": this.offsetY,
            "zoom": this.zoom,
            "visibleTime": this.visibleTime
        };
        return o;

    }

    saveState()
    {
        return {
            "zoom": this.#zoom,
            "offset": this.#offset,
            "offsetY": this.offsetY };
    }

    loadState(cfg)
    {
        if (!cfg) return;

        this.#zoom = cfg.zoom;
        this.#offset = cfg.offset;
        this.#offsetY = cfg.offsetY;

        this.#animZoom.clear(0);
        this.#animZoom.setValue(0, this.#zoom);
        this.#animScroll.clear(0);
        this.#animScroll.setValue(0, this.#offset);
        this.#animScrollY.clear(0);
        this.#animScrollY.setValue(0, this.#offsetY);
    }
}
