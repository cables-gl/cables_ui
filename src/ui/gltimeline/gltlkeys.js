import { Events, Logger } from "cables-shared-client";
import GlTimeline from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";

/**
 * gltl key rendering
 *
 * @export
 * @class glTlKeys
 * @extends {Events}
 */
export default class glTlKeys extends Events
{

    /** @type {Anim} */
    #anim = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<GlRect} */
    #keyRects = [];

    /** @type {Array<GlRect} */
    #dopeRects = [];

    /** @type {GlRect} */
    #parentRect = null;

    /** @type {CABLES.Port} */
    #port;

    /** @type {GlSpline} */
    #spline;

    sizeKey = 14;
    #points = [];
    #options = {};

    /**
     * @param {GlTimeline} glTl
     * @param {Anim} anim
     * @param {GlRect} parentRect
     * @param {Port} port
     * @param {Object} options
     */
    constructor(glTl, anim, parentRect, port, options)
    {
        super();
        this._log = new Logger("gltlKeys");
        if (!anim) this._log.error("no anim");
        if (!parentRect) this._log.error("no parentRect");
        if (!port) this._log.error("no port");
        this.#anim = anim;
        this.#glTl = glTl;
        this.#parentRect = parentRect;
        this.#options = options || {};
        this.#port = port;
        if (this.#options.keyYpos)
        {
            this.#spline = new GlSpline(this.#glTl.splines);

            this.#spline.setParentRect(parentRect);
            let z = -0.7;
            this.#spline.setPoints([0, 0, z, 100, 10, z, 10, 10, z]);

        }
        this.points = [];
        this.init();

    }

    update()
    {
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();
        let isCurrentOp = gui.patchView.isCurrentOp(this.#port.op);

        if (this.#options.multiAnims && !isCurrentOp) this.sizeKey = 10;
        else this.sizeKey = 14;

        // this.sizeKey = 8;

        const sizeKey2 = this.sizeKey / 2;

        this.#points = [];// .length = this.#keyRects.length * 3;
        const pointsSort = [];

        let minVal = 9999999;
        let maxVal = -9999999;
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            minVal = Math.min(minVal, this.#anim.keys[i].value);
            maxVal = Math.max(maxVal, this.#anim.keys[i].value);
        }

        let z = 0.0;
        if (isCurrentOp)z = -0.1;

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const kr = this.#keyRects[i];

            kr.setSize(this.sizeKey, this.sizeKey);

            if (this.#anim.keys[i].time == this.#glTl.view.cursorTime) this.#glTl.setColorRectSpecial(kr);
            else
            {
                if (isCurrentOp) kr.setColor(1, 1, 1);
                else kr.setColor(0.7, 0.7, 0.7);
            }

            let y = (this.#parentRect.h / 2);
            if (this.#options.keyYpos)
                y = this.#parentRect.h - CABLES.map(this.#anim.keys[i].value, minVal, maxVal, sizeKey2, this.#parentRect.h - sizeKey2);

            kr.setPosition(this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset) - sizeKey2, y - sizeKey2, -0.2);

            const lx = this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset);
            const ly = this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time), minVal, maxVal, sizeKey2, this.#parentRect.h - sizeKey2);
            pointsSort.push([lx, ly, z]);

            const onepixelTime = this.#glTl.view.pixelToTime(1);
            pointsSort.push([
                this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset - onepixelTime),
                this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time - onepixelTime), minVal, maxVal, sizeKey2, this.#parentRect.h - sizeKey2),
                z]);
            pointsSort.push([
                this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset + onepixelTime),
                this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time + onepixelTime), minVal, maxVal, sizeKey2, this.#parentRect.h - sizeKey2),
                z]);

        }

        const timeKeyOff = this.#glTl.view.pixelToTime(sizeKey2);
        const steps = (this.#glTl.width - this.#glTl.titleSpace) / 5;

        for (let i = 0; i < steps; i++)
        {
            const t = CABLES.map(i, 0, steps, this.#glTl.view.timeLeft, this.#glTl.view.timeRight);
            const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);

            const y = this.#parentRect.h - CABLES.map(this.#anim.getValue(t), minVal, maxVal, sizeKey2, this.#parentRect.h - sizeKey2);

            pointsSort.push([x, y, z]);
        }

        pointsSort.sort((a, b) =>
        {
            return a[0] - b[0];
        });

        this.#points = pointsSort.flat();

        if (this.#options.keyYpos)
        {
            if (isCurrentOp) this.#glTl.setColorRectSpecial(this.#spline);
            else this.#spline.setColor(0.5, 0.5, 0.5, 1);

            this.#spline.setPoints(this.#points);
        }
        else
            for (let i = 0; i < this.#anim.keys.length; i++)
            {
                const kr = this.#dopeRects[i];
                if (kr)
                {
                    kr.setPosition(this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset), 0, -0.1);

                    if (this.#anim.keys[i + 1])
                    {
                        if (i == 0)
                        {
                            kr.setPosition(this.#glTl.view.timeToPixel(0 - this.#glTl.view.offset), 0);
                            kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time), this.#parentRect.h);
                        }
                        else
                            kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time - this.#anim.keys[i].time), this.#parentRect.h);
                    }
                    else
                    {
                    // after last
                        kr.setSize(this.#glTl.view.timeToPixel(this.#glTl.duration - this.#anim.keys[i].time), this.#parentRect.h);
                    }
                }
            }
    }

    init()
    {
        this.dispose();
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#glTl.rects.createRect({ "draggable": true });
            kr.setShape(13);
            kr.setSize(this.sizeKey, this.sizeKey);
            kr.setColor(1, 1, 1, 1);
            kr.setParent(this.#parentRect);
            this.#keyRects.push(kr);

            if (!this.#options.multiAnims)
                if (this.#port.uiAttribs.display == "bool" || this.#port.uiAttribs.increment == "integer")
                {
                    const krDop = this.#glTl.rects.createRect({ "draggable": true });
                    krDop.setSize(this.sizeKey, this.sizeKey);

                    if (this.#port.uiAttribs.display == "bool")
                    {
                        if (this.#anim.keys[i].value) krDop.setColor(0.6, 0.6, 0.6, 1);
                        else krDop.setColor(0.4, 0.4, 0.4, 1);
                    }
                    if (this.#port.uiAttribs.increment == "integer")
                    {
                        if (i % 2 == 0) krDop.setColor(0.6, 0.6, 0.6, 1);
                        else krDop.setColor(0.4, 0.4, 0.4, 1);
                    }

                    krDop.setParent(this.#parentRect);
                    this.#dopeRects.push(krDop);
                }

        }
        this.update();
    }

    dispose()
    {
        for (let i = 0; i < this.#keyRects.length; i++) this.#keyRects[i].dispose();
        this.#keyRects = [];
        for (let i = 0; i < this.#dopeRects.length; i++) this.#dopeRects[i].dispose();
        this.#dopeRects = [];
    }

}
