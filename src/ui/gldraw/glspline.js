import GlRect from "./glrect.js";
import GlSplineDrawer from "./glsplinedrawer.js";

export default class GlSpline
{
    #splineIdx = -1;

    /** @type {GlSplineDrawer} */
    #splineDrawer = null;

    /** @type {Array<number>} */
    #points = [0, 0, 0, 10, 10, 0];

    /** @type {GlRect} */
    #parentRect;

    /**
     * @param {GlSplineDrawer} splineDrawer
     * @param {object} options
     */
    constructor(splineDrawer, options)
    {
        this.#splineDrawer = splineDrawer;
        this.#splineIdx = this.#splineDrawer.getSplineIndex();
        this.#parentRect = null;
    }

    /**
     * @param {GlRect} r
     */
    setParentRect(r)
    {
        if (this.#parentRect) this.#parentRect.removeEventListener(this.rebuild.bind(this));

        this.#parentRect = r;
        if (this.#parentRect) this.#parentRect.on("positionChanged", this.rebuild.bind(this));
        this.rebuild();
    }

    /**
     * @param {Array<number>} p
     */
    setPoints(p)
    {
        this.#points = p;
        this.rebuild();
    }

    rebuild()
    {
        const finalPoints = [];
        for (let i = 0; i < this.#points.length; i += 3)
        {
            finalPoints[i + 0] = this.#points[i + 0] + this.#parentRect.x;
            finalPoints[i + 1] = this.#points[i + 1] + this.#parentRect.y;
            finalPoints[i + 2] = this.#points[i + 2] + this.#parentRect.z;
        }
        this.#splineDrawer.setSpline(this.#splineIdx, finalPoints);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a=1
     */
    setColor(r, g, b, a = 1)
    {
        this.#splineDrawer.setSplineColor(this.#splineIdx, [r, g, b, a]);
    }

    dispose()
    {
        this.#splineDrawer.deleteSpline(this.#splineIdx);

    }
}
