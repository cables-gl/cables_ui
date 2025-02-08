import { Events, Logger } from "cables-shared-client";
import { Core } from "cables-shared-types";
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

    #minVal = 999999;
    #maxVal = -999999;

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

    /** @type {Core.Port} */
    #port;

    /** @type {GlSpline} */
    #spline;

    #disposed = false;

    sizeKey = 12;
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
            this.#spline = new GlSpline(this.#glTl.splines, port.name);

            this.#spline.setParentRect(parentRect);
            let z = -0.7;
            this.#spline.setPoints([0, 0, z, 100, 10, z, 10, 10, z]);
        }

        this.points = [];
        this.init();

    }

    get anim()
    {
        return this.#anim;
    }

    /**
     * @param {number} minVal
     * @param {number} maxVal
     */
    update(minVal, maxVal)
    {
        if (minVal != 0 && maxVal != 0)
        {
            this.#minVal = minVal;
            this.#maxVal = maxVal;
        }
        if (this.#disposed)
        {
            this._log.warn("disposed", this);
            this._log.stack("ss");
            return;
        }
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();
        let isCurrentOp = gui.patchView.isCurrentOp(this.#port.op);

        if (this.#options.multiAnims && !isCurrentOp) this.sizeKey = 12;
        else this.sizeKey = 14;

        const sizeKey2 = this.sizeKey / 2;

        this.#points = [];
        const pointsSort = [];

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
                y = this.#parentRect.h - CABLES.map(this.#anim.keys[i].value, this.#minVal, this.#maxVal, sizeKey2, this.#parentRect.h - sizeKey2);

            const rx = this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset) - sizeKey2;
            const ry = y - sizeKey2;

            kr.setPosition(rx, ry, -0.2);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < kr.absX + this.sizeKey && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < kr.absY + this.sizeKey && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(this.#anim.keys[i], this.#anim);
            }

            if (this.#glTl.isKeySelected(this.#anim.keys[i])) kr.setColor(1, 1, 0, 1);

            if (this.#options.keyYpos)
            {
                const lx = this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset);
                const ly = this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time), this.#minVal, this.#maxVal, sizeKey2, this.#parentRect.h - sizeKey2);
                pointsSort.push([lx, ly, z]);

                const onepixelTime = this.#glTl.view.pixelToTime(1);
                pointsSort.push([
                    this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset - onepixelTime),
                    this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time - onepixelTime), this.#minVal, this.#maxVal, sizeKey2, this.#parentRect.h - sizeKey2),
                    z]);
                pointsSort.push([
                    this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset + onepixelTime),
                    this.#parentRect.h - CABLES.map(this.#anim.getValue(this.#anim.keys[i].time + onepixelTime), this.#minVal, this.#maxVal, sizeKey2, this.#parentRect.h - sizeKey2),
                    z]);
            }

        }

        if (this.#options.keyYpos)
        {
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

        }

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
                    let x = this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset);
                    let y = 0;
                    kr.setPosition(x, y, -0.1);

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
        this.reset();
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
            kr.setShape(13);
            kr.setSize(this.sizeKey, this.sizeKey);
            kr.setColor(1, 1, 1, 1);
            kr.setColorHover(1, 0, 0, 1);
            kr.setParent(this.#parentRect);
            kr.key = this.#anim.keys[i];

            let startDrag = -1111;

            kr.draggableMove = true;
            kr.on(GlRect.EVENT_POINTER_HOVER, () =>
            {
                this.#glTl.hoverKeyRect = kr;
                this.update(0, 0);
                // kr.setColor(1, 0, 0, 1);
            });
            kr.on(GlRect.EVENT_POINTER_UNHOVER, () =>
            {
                this.#glTl.hoverKeyRect = null;
                kr.setColor(1, 1, 1, 1);
                this.update(0, 0);
            });

            kr.on(GlRect.EVENT_DRAGEND, () =>
            {
                this.#anim.sortKeys();
            });

            kr.on(GlRect.EVENT_DRAGSTART, (rect, x, y, button, e) =>
            {
                startDrag = this.#glTl.view.pixelToTime(e.offsetX);
            });

            kr.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
            {
                if (this.#glTl.selectRect) return;

                const offTime = this.#glTl.view.pixelToTime(e.offsetX) - startDrag;
                startDrag = this.#glTl.view.pixelToTime(e.offsetX);

                if (this.#glTl.getNumSelectedKeys() > 0)
                {
                    this.#glTl.moveSelectedKeysDelta(offTime);
                    this.#anim.sortKeys();
                }

                this.update(0, 0);
            });

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

    reset()
    {
        for (let i = 0; i < this.#keyRects.length; i++) this.#keyRects[i].dispose();
        this.#keyRects = [];
        for (let i = 0; i < this.#dopeRects.length; i++) this.#dopeRects[i].dispose();
        this.#dopeRects = [];
    }

    dispose()
    {
        this.reset();

        if (this.#spline) this.#spline = this.#spline.dispose();
        this.#disposed = true;
    }

}
