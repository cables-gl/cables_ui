import GlRect from "./glrect.js";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { GlSplineDrawer } from "./glsplinedrawer.js";

export default class GlSpline
{
    #splineIdx = -1;

    /** @type {GlSplineDrawer} */
    #splineDrawer = null;

    /** @type {Array<number>} */
    #points = [0, 0, 0, 10, 10, 0];

    /** @type {GlRect} */
    #parentRect;

    /** @type {String} */
    #name = "unknown spline";

    #disposed = false;

    /** @type {EventListener} */
    #listenerCleared = null;

    /** @type {EventListener} */
    #listenerParentPos = null;

    /**
     * @param {GlSplineDrawer} splineDrawer
     * @param {string} name
     * @param {Object} options
     */
    constructor(splineDrawer, name, options = {})
    {
        this.#name = name;
        this.#splineDrawer = splineDrawer;
        this.#splineIdx = this.#splineDrawer.getSplineIndex(this.#name);
        this.#parentRect = null;

        this.#listenerCleared = splineDrawer.on(GlSplineDrawer.EVENT_CLEARED, () =>
        {
            this.dispose();
        });
    }

    /**
     * @param {GlRect} r
     */
    setParentRect(r)
    {
        if (this.checkDisposed()) return;
        this.#listenerParentPos?.remove();
        this.#listenerParentPos = null;

        this.#parentRect = r;
        if (this.#parentRect) this.#listenerParentPos = this.#parentRect.on(GlRect.EVENT_POSITIONCHANGED, this.rebuild.bind(this));
        this.rebuild();
    }

    getDrawer()
    {
        return this.#splineDrawer;
    }

    /**
     * @param {Array<number>} p
     */
    setPoints(p)
    {
        if (this.checkDisposed()) return;
        this.#points = p;
        this.rebuild();
    }

    rebuild()
    {
        if (this.checkDisposed()) return;
        const finalPoints = [];
        let x = 0, y = 0, z = 0;

        if (this.#parentRect)
        {
            x = this.#parentRect.x;
            y = this.#parentRect.y;
            z = this.#parentRect.z;
        }

        for (let i = 0; i < this.#points.length; i += 3)
        {
            finalPoints[i + 0] = this.#points[i + 0] + x;
            finalPoints[i + 1] = this.#points[i + 1] + y;
            finalPoints[i + 2] = this.#points[i + 2] + z;
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
        if (this.checkDisposed()) return;
        this.#splineDrawer.setSplineColor(this.#splineIdx, [r, g, b, a]);
    }

    /**
     * @param {number[]} arr
     */
    setColorArray(arr)
    {
        if (this.checkDisposed()) return;
        this.#splineDrawer.setSplineColor(this.#splineIdx, arr);
    }

    checkDisposed()
    {
        if (this.#disposed)console.log("disposed object...", this);
        return this.#disposed;
    }

    dispose()
    {
        if (this.#disposed) return null;
        this.#disposed = true;
        this.#listenerCleared?.remove();
        this.#listenerParentPos?.remove();
        this.#listenerCleared = null;
        this.#listenerParentPos = null;
        this.#splineDrawer.deleteSpline(this.#splineIdx);
        this.#splineIdx = -1;
        return null;
    }

    getNumPoints()
    {
        return this.#points.length / 3;
    }
}
