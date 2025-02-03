import GlTimeline from "./gltimeline.js";

export default class GlTlView
{

    /** @type {GlTimeline} */
    #tl;

    /** @type {Anim} */
    #animZoom;

    /** @type {Anim} */
    #animScroll;

    #zoom = 20;

    #offset = 0;

    #timer = new CABLES.Timer();

    constructor(tl)
    {
        this.#tl = tl;

        const defaultEasing = CABLES.EASING_CUBIC_OUT;

        this.#animZoom = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animZoom.setValue(0, this.#zoom);

        this.#animScroll = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animScroll.setValue(0, this.#offset);

        this.#timer.play();

    }

    get animsFinished()
    {
        return this.#animZoom.isFinished();
    }

    get zoom()
    {
        return this.#animZoom.getValue(this.#timer.getTime());
    }

    /** @returns {number} */
    get offset()
    {
        return this.#offset;
    }

    /** @returns {number} */
    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

    get pixelPerSecond()
    {
        return (this.#tl.width - this.#tl.titleSpace) / this.#tl.duration;
    }

    get visibleTime()
    {
        return this.pixelToTime(this.#tl.width - this.#tl.titleSpace);
    }

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

        console.log(this.visibleTime);
        this.scroll(this.cursorTime - this.#offset - (this.visibleTime / 2));
    }

    scroll(off, dur = 0.2)
    {
        this.#animScroll.clear(this.#timer.getTime());
        this.#animScroll.setValue(this.#timer.getTime(), this.#offset);
        this.#animScroll.setValue(this.#timer.getTime() + dur, this.#offset + off);

    }

    /**
     * @param {number} t
     */
    timeToPixelScreen(t)
    {
        return this.timeToPixel(t) + this.#tl.titleSpace - this.timeToPixel(this.#offset);
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
        return this.pixelToTime(x - this.#tl.titleSpace);
    }

    updateAnims()
    {
        this.#timer.update();
        this.#zoom = this.#animZoom.getValue(this.#timer.getTime());
        this.#offset = this.#animScroll.getValue(this.#timer.getTime());
    }

}
