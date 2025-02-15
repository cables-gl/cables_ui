import { Events, Logger } from "cables-shared-client";
import { Types } from "cables-shared-types";
import GlTimeline from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import undo from "../utils/undo.js";
import { glTlAnimLine } from "./gltlanimline.js";

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

    /** @type {Types.Anim} */
    #anim = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<GlRect>} */
    #keyRects = [];

    /** @type {Array<GlRect>} */
    // #dopeRects = [];

    /** @type {GlRect} */
    #parentRect = null;

    /** @type {Types.Port} */
    #port;

    /** @type {GlSpline} */
    #spline;

    /** @type {GlSpline} */
    #zeroSpline;

    #disposed = false;

    sizeKey = 12;
    #points = [];
    #options = {};

    #dragStarted = false;
    #animLine = null;
    #dragStartX = 0;
    #dragStartY = 0;

    /**
     * @param {GlTimeline} glTl
     * @param {glTlAnimLine} animLine
     * @param {Types.Anim} anim
     * @param {GlRect} parentRect
     * @param {Types.Port} port
     * @param {Object} options
     */
    constructor(glTl, animLine, anim, parentRect, port, options)
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
        this.#animLine = animLine;

        if (this.#options.keyYpos)
        {
            this.#spline = new GlSpline(this.#glTl.splines, port.name);

            this.#spline.setParentRect(parentRect);
            this.#spline.setPoints([0, 0, 0, 100, 10, 0, 10, 10, 0]);

            this.#zeroSpline = new GlSpline(this.#glTl.splines, "zero");
            this.#zeroSpline.setPoints([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            this.#zeroSpline.setColor(0.3, 0.3, 0.3, 1);
        }

        this.points = [];
        this.init();
    }

    isDragging()
    {
        return this.#dragStarted;
    }

    get sizeKey2()
    {
        return this.sizeKey / 2;

    }

    get anim()
    {
        return this.#anim;
    }

    isCurrentOp()
    {
        let isCurrentOp = gui.patchView.isCurrentOp(this.#port.op);
        return isCurrentOp;

    }

    /**
     * @param {number} minVal
     * @param {number} maxVal
     */
    update(minVal = this.#minVal, maxVal = this.#maxVal)
    {
        this.#minVal = minVal;
        this.#maxVal = maxVal;

        if (this.#disposed)
        {
            this._log.warn("disposed", this);
            this._log.stack("ss");
            return;
        }
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();

        if (this.#options.multiAnims && !this.isCurrentOp()) this.sizeKey = 12;
        else this.sizeKey = 14;

        this.#points = [];
        const pointsSort = [];

        let z = -0.4;

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            let col = [0.7, 0.7, 0.7, 1];

            const animKey = this.#anim.keys[i];
            const kr = this.#keyRects[i];

            if (animKey.time == this.#glTl.view.cursorTime) this.#glTl.setColorRectSpecial(kr);
            else
            if (this.isCurrentOp()) col = [1, 1, 1];

            // let y = (this.#parentRect.h / 2);
            // if (this.#options.keyYpos)
            // y = this.#parentRect.h - CABLES.map(animKey.value, this.#minVal, this.#maxVal, sizeKey2, this.#parentRect.h - sizeKey2);

            // const rx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset) - sizeKey2;
            // const ry = y - sizeKey2;

            // let zpos = -0.2;
            // kr.setPosition(rx, ry, zpos);
            kr.setSize(this.sizeKey, this.sizeKey);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.sizeKey) && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }

            if (this.#glTl.isKeySelected(animKey))
            {
                col = [1, 1, 0, 1];
            }

            kr.setColor(col);

            if (this.#options.keyYpos)
            {
                const lx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset);
                const ly = this.valueToPixel(this.#anim.getValue(animKey.time));
                pointsSort.push([lx, ly, z]);

                const onepixelTime = this.#glTl.view.pixelToTime(1);
                pointsSort.push([
                    this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset - onepixelTime),
                    this.valueToPixel(this.#anim.getValue(animKey.time)),
                    z]);
                pointsSort.push([
                    this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset + onepixelTime),
                    this.valueToPixel(this.#anim.getValue(animKey.time)),
                    z]);
            }

        }

        this.setKeyPositions();

        if (this.#options.keyYpos)
        {
            const timeKeyOff = this.#glTl.view.pixelToTime(this.sizeKey2);
            const steps = (this.#glTl.width - this.#glTl.titleSpace) / 5;

            for (let i = 0; i < steps; i++)
            {
                const t = CABLES.map(i, 0, steps, this.#glTl.view.timeLeft, this.#glTl.view.timeRight);
                const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);

                const y = this.valueToPixel(this.#anim.getValue(t));

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
            if (this.isCurrentOp()) this.#glTl.setColorRectSpecial(this.#spline);
            else this.#spline.setColor(0.5, 0.5, 0.5, 1);

            this.#spline.setPoints(this.#points);
        }
        // else
        // for (let i = 0; i < this.#anim.keys.length; i++)
        // {
        // const kr = this.#dopeRects[i];

        // if (kr)
        // {
        //     let x = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset);
        //     let y = 0;
        //     kr.setPosition(x, y, -0.1);

        //     if (this.#anim.keys[i + 1])
        //     {
        //         if (i == 0)
        //         {
        //             kr.setPosition(this.#glTl.view.timeToPixel(0 - this.#glTl.view.offset), 0);
        //             kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time), this.#parentRect.h);
        //         }
        //         else
        //             kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time - animKey.time), this.#parentRect.h);
        //     }
        //     else
        //     {
        //         // after last
        //         kr.setSize(this.#glTl.view.timeToPixel(this.#glTl.duration - animKey.time), this.#parentRect.h);
        //     }
        // }
        // }
    }

    setKeyPositions()
    {
        for (let i = 0; i < this.#keyRects.length; i++)
        {
            let col = [0.7, 0.7, 0.7, 1];

            const animKey = this.#anim.keys[i];
            const kr = this.#keyRects[i];

            if (animKey.time == this.#glTl.view.cursorTime) this.#glTl.setColorRectSpecial(kr);
            else
            if (this.isCurrentOp()) col = [1, 1, 1];

            let y = (this.#parentRect.h / 2);
            if (this.#options.keyYpos)
                y = this.valueToPixel(animKey.value);

            const rx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset) - this.sizeKey2;
            const ry = y - this.sizeKey2;

            let zpos = -0.2;
            if (this.#glTl.isKeySelected(animKey)) zpos = -0.3;

            kr.setPosition(rx, ry, zpos);
            kr.setSize(this.sizeKey, this.sizeKey);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.sizeKey) && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }

        }

        const y = this.valueToPixel(0) + this.#parentRect.absY;

        this.#zeroSpline.setPoints([0, y, -0.1,
            100, y, -0.1,
            111111111, y, -0.1]);

    }

    updateKeyRects()
    {

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
            kr.setParent(this.#parentRect);
            const key = this.#anim.keys[i];
            kr.key = key;

            let startDragTime = -1111;
            let startDragValue = -1111;

            let oldValues = {};

            kr.draggableMove = true;
            kr.on(GlRect.EVENT_POINTER_HOVER, () =>
            {
                this.#glTl.hoverKeyRect = kr;
                this.update();
            });
            kr.on(GlRect.EVENT_POINTER_UNHOVER, () =>
            {
                this.#glTl.hoverKeyRect = null;
                this.update();
            });

            kr.on(GlRect.EVENT_DRAGEND, () =>
            {
                this.#anim.sortKeys();
                this.#dragStarted = false;

                undo.add({
                    "title": "timeline move keys",
                    "undo": () =>
                    {

                        this.#glTl.deserializeKeys(oldValues);

                        // key.set(oldValues);
                    },
                    redo() {}
                });
            });

            kr.on(GlRect.EVENT_DRAGSTART, (rect, x, y, button, e) =>
            {

                this.#dragStartX = x.offsetX;
                this.#dragStartY = e.offsetY;
                if (button == 1 && !this.#dragStarted)
                {

                    oldValues = this.#glTl.serializeSelectedKeys();
                    this.#dragStarted = true;
                    startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                    startDragValue = this.pixelToValue(e.offsetY);

                    if (e.shiftKey)
                    {
                        this.#glTl.duplicateSelectedKeys();
                    }

                }
            });

            kr.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
            {
                if (this.#glTl.selectRect) return;

                if (button == 2)
                {
                    this.#dragStartX = e.offsetX;
                    this.#dragStartY = e.offsetY;
                }

                if (button == 1)
                {
                    const offTime = this.#glTl.view.pixelToTime(e.offsetX) - startDragTime;
                    startDragTime = this.#glTl.snapTime(this.#glTl.view.pixelToTime(e.offsetX));

                    const offVal = startDragValue - this.pixelToValue(e.offsetY);
                    startDragValue = this.pixelToValue(e.offsetY);

                    if (this.#glTl.getNumSelectedKeys() > 0)
                    {
                        this.#glTl.moveSelectedKeysDelta(this.#glTl.snapTime(offTime), offVal);
                        this.#anim.sortKeys();
                    }

                    this.#animLine.update();
                    this.update();

                }
            });

            this.#keyRects.push(kr);

            // if (!this.#options.multiAnims)
            // {
            //     if (this.#port.uiAttribs.display == "bool" || this.#port.uiAttribs.increment == "integer")
            //     {
            //         const krDop = this.#glTl.rects.createRect({ "draggable": true });
            //         krDop.setSize(this.sizeKey, this.sizeKey);

            //         if (this.#port.uiAttribs.display == "bool")
            //         {
            //             if (animKey.value) krDop.setColor(0.6, 0.6, 0.6, 1);
            //             else krDop.setColor(0.4, 0.4, 0.4, 1);
            //         }
            //         if (this.#port.uiAttribs.increment == "integer")
            //         {
            //             if (i % 2 == 0) krDop.setColor(0.6, 0.6, 0.6, 1);
            //             else krDop.setColor(0.4, 0.4, 0.4, 1);
            //         }

            //         krDop.setParent(this.#parentRect);
            //         this.#dopeRects.push(krDop);
            //     }

            // }

        }
        this.update();
    }

    get height()
    {
        return this.#parentRect.h;
    }

    /**
     * @param {Number} posy
     */
    pixelToValue(posy)
    {
        return CABLES.map(posy, 0, this.height, this.#minVal, this.#maxVal);
    }

    /**
     * @param {Number} v
     */
    valueToPixel(v)
    {
        return this.#parentRect.h - CABLES.map(v, this.#minVal, this.#maxVal, this.sizeKey2, this.#parentRect.h - this.sizeKey2);
    }

    reset()
    {
        for (let i = 0; i < this.#keyRects.length; i++) this.#keyRects[i].dispose();
        this.#keyRects = [];
        // for (let i = 0; i < this.#dopeRects.length; i++) this.#dopeRects[i].dispose();
        // this.#dopeRects = [];
    }

    dispose()
    {
        this.reset();

        if (this.#spline) this.#spline = this.#spline.dispose();
        this.#disposed = true;
    }

}
