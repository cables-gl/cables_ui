import { Events, Logger } from "cables-shared-client";

import { Anim, Port } from "cables";
import { GlTimeline } from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import undo from "../utils/undo.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { gui } from "../gui.js";

/**
 * gltl key rendering
 *
 * @export
 * @class glTlKeys
 * @extends {Events}
 */
export class glTlKeys extends Events
{

    /** @type {Anim} */
    #anim = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<GlRect>} */
    #keyRects = [];

    /** @type {Array<GlRect>} */
    // #dopeRects = [];

    /** @type {GlRect} */
    #parentRect = null;

    /** @type {Port} */
    #port;

    /** @type {GlSpline} */
    #spline;

    #disposed = false;

    sizeKey = 9;

    /** @type {Array<number>} */
    #points = [];
    #options = {};

    #dragStarted = false;

    /** @type {glTlAnimLine} */
    #animLine = null;
    #dragStartX = 0;
    #dragStartY = 0;

    #zeroRect = null;

    #view;

    /**
     * @param {GlTimeline} glTl
     * @param {glTlAnimLine} animLine
     * @param {Anim} anim
     * @param {GlRect} parentRect
     * @param {Port} port
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
        this.#view = glTl.view;
        this.#parentRect = parentRect;
        this.#options = options || {};
        this.#port = port;
        this.#animLine = animLine;

        this.#zeroRect = this.#glTl.rects.createRect({ "draggable": true, "interactive": false });
        this.#zeroRect.setSize(99999, 1);
        this.#zeroRect.setColor(0, 0, 0, 1);

        if (this.#options.keyYpos)
        {
            this.#spline = new GlSpline(this.#glTl.splines, port.name);

            this.#spline.setParentRect(parentRect);
            this.#spline.setPoints([0, 0, 0, 100, 10, 0, 10, 10, 0]);
        }

        this.points = [];
        this.init();
    }

    isDragging()
    {
        return this.#dragStarted;
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

    get keyHeight()
    {
        return this.sizeKey;
    }

    get sizeKey2()
    {
        const w = this.getKeyWidth();

        if (w <= 2 || this.#glTl.layout == GlTimeline.LAYOUT_GRAPHS) return this.sizeKey / 2;
        else return 0;
    }

    /**
     * @param {GlRect} kr
     */
    setKeyShapeSize(kr)
    {
        const w = this.getKeyWidth();

        if (w <= 2 || this.#glTl.layout == GlTimeline.LAYOUT_GRAPHS)
        {
            kr.setShape(6);
            kr.setSize(this.sizeKey, this.sizeKey);
        }
        else
        {
            kr.setShape(0);
            kr.setSize(w, this.sizeKey);
        }
    }

    getKeyWidth()
    {
        const kwidth = this.#glTl.view.timeToPixel(1 / 30) - 1;

        return kwidth;
    }

    /**
     */
    update()
    {

        if (this.#disposed)
        {
            this._log.warn("disposed", this);
            this._log.stack("ss");
            return;
        }
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();

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
            if (!kr.isHovering())
            {
                col[0] *= 0.8;
                col[1] *= 0.8;
                col[2] *= 0.8;
            }

            this.setKeyShapeSize(kr);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.keyHeight) && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }

            if (this.#glTl.isKeySelected(animKey))
            {
                col = [1, 1, 0, 1];
            }

            kr.setColorArray(col);

        }

        this.setKeyPositions();

        if (this.#options.keyYpos)
        {
            const steps = (this.#glTl.width - this.#glTl.titleSpace) / 1;

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
            const ry = y - this.keyHeight / 2;

            let zpos = -0.2;
            if (this.#glTl.isKeySelected(animKey)) zpos = -0.3;

            kr.setPosition(rx, ry, zpos);
            this.setKeyShapeSize(kr);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.keyHeight) && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }
        }

        const y = this.valueToPixel(0);
        this.#zeroRect.setPosition(0, y);
    }

    selectAll()
    {
        for (let i = 0; i < this.#anim.keys.length; i++)
            this.#glTl.selectKey(this.#anim.keys[i], this.#anim);
    }

    hasSelectedKeys()
    {
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const animKey = this.#anim.keys[i];
            if (this.#glTl.isKeySelected(animKey))
                return true;
        }
        return false;
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

            this.setKeyShapeSize(kr);
            kr.setColor(0.28, 0.28, 0.28, 0.28);
            kr.setColorHover(1, 1, 1, 1);
            kr.setParent(this.#parentRect);
            const key = this.#anim.keys[i];
            kr.data.key = key;

            let startDragTime = -1111;
            let startDragValue = -1111;

            /** @type {Object} */
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
                this.#anim.removeDuplicates();
                this.#glTl.needsUpdateAll = true;
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

            kr.on(GlRect.EVENT_POINTER_UP, (e) =>
            {
                if (this.click)
                {
                    if (this.#glTl.selectRect) return;
                    if (this.#dragStarted) return;

                    if (!e.shiftKey) this.#glTl.unSelectAllKeys();
                    this.#glTl.selectKey(key, this.#anim);
                }
                this.click = false;

            });

            kr.on(GlRect.EVENT_POINTER_DOWN, () =>
            {
                this.click = true;
            });

            kr.on(GlRect.EVENT_DRAGSTART, (_rect, x, _y, button, e) =>
            {
                // this.click = false;

                this.#dragStartX = x.offsetX;
                this.#dragStartY = e.offsetY;
                if (button == 1 && !this.#dragStarted)
                {
                    oldValues = this.#glTl.serializeSelectedKeys();
                    this.#dragStarted = true;
                    startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                    startDragValue = this.pixelToValue(e.offsetY);

                    if (e.shiftKey) this.#glTl.duplicateSelectedKeys();

                }
            });

            kr.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
            {
                this.click = false;
                if (this.#glTl.selectRect) return;
                if (startDragTime == -1111)
                {
                    console.log("cant drag,,,,");
                    return;
                }

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

        }
        this.update();
    }

    get height()
    {
        return this.#parentRect.h - this.#parentRect.y;
    }

    /**
     * @param {Number} posy
     */
    pixelToValue(posy)
    {
        return CABLES.map(posy, 0, this.height, this.#view.minVal, this.#view.maxVal);
    }

    /**
     * @param {Number} v
     */
    valueToPixel(v)
    {
        const y = CABLES.map(v, this.#view.minVal, this.#view.maxVal, this.sizeKey2, this.#parentRect.h - this.keyHeight / 2, 0, false);

        return this.#parentRect.h - y - this.#glTl.view.offsetY;
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
