import { Anim } from "cables";
import { GlTimeline } from "./gltimeline.js";
import { gui } from "../gui.js";

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

    #zoom = 20;

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

        const defaultEasing = CABLES.Anim.EASING_CUBIC_OUT;

        this.#animZoom = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animZoom.setValue(0, this.#zoom);

        this.#animScroll = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animScroll.setValue(0, this.#offset);

        this.#animScrollY = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animScrollY.setValue(0, this.#offsetY);

        this.#animMinVal = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animMaxVal = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.minVal = -1;
        this.maxVal = 1;

        this.#timer.play();
        this.updateAnims();
    }

    get animsFinished()
    {
        return this.#animZoom.isFinished(this.#timer.getTime()) && this.#animScroll.isFinished(this.#timer.getTime());
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
    set minVal(v)
    {
        if (this.#finalMinVal == v) return;
        this.#finalMinVal = v;

        let dur = 0.3;
        this.#animMinVal.clear(this.#timer.getTime());
        this.#animMinVal.setValue(this.#timer.getTime() + dur, this.#finalMinVal);
    }

    /**
     * @param {number} v
     */
    set maxVal(v)
    {
        if (this.#finalMaxVal == v) return;
        this.#finalMaxVal = v;
        let dur = 0.3;
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
        return this.pixelToTime(this.#tl.width);
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
     * @param {number} delta
     * @param {number} dur
     */
    setZoomOffset(delta, dur = 0.3)
    {
        let zoom = this.#zoom * delta;
        zoom = CABLES.clamp(zoom, 0.1, 10000000);

        this.#animZoom.clear(this.#timer.getTime());
        this.#animZoom.setValue(this.#timer.getTime(), this.#zoom);
        this.#animZoom.setValue(this.#timer.getTime() + dur, zoom);
    }

    centerCursor()
    {
        let center = (this.visibleTime / 2);
        if (this.cursorTime == 0)center = 1;
        this.scroll(this.cursorTime - this.#offset - center);
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

        this.#animScroll.clear(this.#timer.getTime());
        this.#animScroll.setValue(this.#timer.getTime() + duration, finalTime);
    }

    /**
     * @param {number} finalTime
     * @param {number} duration=0.2
     */
    scrollTo(finalTime, duration = 0.2)
    {
        this.#animScroll.clear(this.#timer.getTime());
        this.#animScroll.setValue(this.#timer.getTime() + duration, finalTime);
    }

    /**
     * @param {number} scrolly
     * @param {number} duration=0.2
     */
    scrollToY(scrolly, duration = 0.2)
    {
        this.#animScrollY.clear(this.#timer.getTime());
        this.#animScrollY.setValue(this.#timer.getTime() + duration, scrolly);
    }

    /**
     * @param {number} t
     */
    timeToPixelScreen(t)
    {
        return this.timeToPixel(t) - this.timeToPixel(this.#offset);
    }

    /**
     * @param {number} delta
     * @param {number} duration
     */
    scrollY(delta, duration = 0.2)
    {
        let finalTime = this.#offsetY - delta * 14;

        this.#animScrollY.clear(this.#timer.getTime());
        this.#animScrollY.setValue(this.#timer.getTime() + duration, finalTime);
    }

    /**
     * @param {number} t
     */
    timeToPixel(t)
    {
        return t * this.#zoom * 12;
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
        let zoom = this.#tl.duration / len;
        let dur = 0.3;
        this.#animZoom.clear(this.#timer.getTime());
        this.#animZoom.setValue(this.#timer.getTime() + dur, zoom);
    }

    isAnimated()
    {
        return (
            !this.#animZoom.isFinished(this.#timer.getTime()) ||
            !this.#animScroll.isFinished(this.#timer.getTime()) ||
            !this.#animScrollY.isFinished(this.#timer.getTime()) ||
            !this.#animMinVal.isFinished(this.#timer.getTime()) ||
            !this.#animMaxVal.isFinished(this.#timer.getTime()));

    }

    updateAnims()
    {
        this.#timer.update();
        this.#zoom = this.#animZoom.getValue(this.#timer.getTime());
        this.#offset = this.#animScroll.getValue(this.#timer.getTime());
        this.#offsetY = this.#animScrollY.getValue(this.#timer.getTime());
        this.#frameMinVal = this.#animMinVal.getValue(this.#timer.getTime());
        this.#frameMaxVal = this.#animMaxVal.getValue(this.#timer.getTime());
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
        };
        return o;

    }

}
