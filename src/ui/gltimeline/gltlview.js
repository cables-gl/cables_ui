import GlTimeline from "./gltimeline.js";

export default class GlTlView
{

    /** @type {GlTimeline} */
    #tl;

    /** @type {Anim} */
    #animZoom;
    #zoom = 20;

    #timer = new CABLES.Timer();

    constructor(tl)
    {
        this.#tl = tl;

        const defaultEasing = CABLES.EASING_EXPO_OUT;

        this.#animZoom = new CABLES.Anim({ "defaultEasing": defaultEasing });
        this.#animZoom.setValue(0, this.#zoom);
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
        if (!this.#tl) return 0;
        if (!this.#tl.ruler) return 0;
        return this.#tl.ruler.offset;
    }

    /** @returns {number} */
    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

    setZoomOffset(delta, dur = 0.3)
    {
        let zoom = this.#zoom * delta;
        zoom = CABLES.clamp(zoom, 0.1, 10000000);

        this.#animZoom.clear();
        this.#animZoom.setValue(this.#timer.getTime(), this.#zoom);
        this.#animZoom.setValue(this.#timer.getTime() + dur, zoom);
    }

    centerCursor()
    {
    }

    /**
     * @param {number} t
     */
    timeToPixelScreen(t)
    {
        return this.timeToPixel(t) + this.#tl.titleSpace - this.timeToPixel(this.offset);
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

        console.log(this.#zoom);
    }
}
