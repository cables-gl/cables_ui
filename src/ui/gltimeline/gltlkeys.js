import { Events, Logger } from "cables-shared-client";

import { Anim, Port } from "cables";
import { GlTimeline } from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import undo from "../utils/undo.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { gui } from "../gui.js";
import { GlTlView } from "./gltlview.js";

/**
 * gltl key rendering
 *
 * @export
 * @class glTlKeys
 * @extends {Events}
 */
export class glTlKeys extends Events
{
    static COLOR_INACTIVE = [0.26, 0.26, 0.26, 1];

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

    /** @type {GlTlView} */
    #view;
    #updateCount = 0;
    #initCount = 0;
    #needsUpdate = false;

    #listeners = [];
    #hasSelectedKeys = false;
    #disposedWarning = 0;

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
        this.#listeners.push(
            anim.listen(Anim.EVENT_CHANGE, () =>
            {
                this.#needsUpdate = true;
            }));

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
            kr.setShape(13);
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
        if (this.#glTl.layout == GlTimeline.LAYOUT_GRAPHS) return this.sizeKey;
        const kwidth = this.#glTl.view.timeToPixel(1 / 30) - 1;

        return kwidth;
    }

    /**
     */
    update()
    {
        if (this.#disposed)
        {
            this.#disposedWarning++;
            // if (this.#disposedWarning > 3)
            // this._log.warn("disposed", this.#disposedWarning);
            return;
        }

        if (this.#keyRects.length != this.#anim.keys.length) return this.init();

        const wasSelected = this.#hasSelectedKeys;
        this.#hasSelectedKeys = false;

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            let col = glTlKeys.COLOR_INACTIVE;

            const animKey = this.#anim.keys[i];
            const keyRect = this.#keyRects[i];

            if (animKey.anim.tlActive) col = [0.8, 0.8, 0.8, 1];

            this.setKeyShapeSize(keyRect);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (keyRect.absX + this.sizeKey) && this.#glTl.selectRect.x2 > keyRect.absX &&
                this.#glTl.selectRect.y < (keyRect.absY + this.keyHeight) && this.#glTl.selectRect.y2 > keyRect.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }

            if (this.#glTl.isKeySelected(animKey))
            {
                if (!this.#hasSelectedKeys)
                {
                    this.#hasSelectedKeys = true;
                    this.#needsUpdate = true;
                }
                col = [1, 1, 0, 1];
            }

            if (!this.#glTl.isSnappedTime(animKey.time))col = [1, 0, 0, 1];
            keyRect.setColorArray(col);

        }
        if (wasSelected != this.#hasSelectedKeys) this.updateColors();

        this.setKeyPositions();

        /// /////////

        if (!this.#glTl.view.isAnimated() && !this.#needsUpdate) return;

        this.#needsUpdate = false;
        this.#points = [];
        const pointsSort = [];

        let z = -0.4;
        if (this.#anim.tlActive)z = -0.4;

        if (this.#options.keyYpos)
        {
            const steps = (this.#glTl.width) / 1;
            let lv = 9999999;
            let skipped = false;

            for (let i = 0; i < steps; i++)
            {
                const t = CABLES.map(i, 0, steps, this.#glTl.view.timeLeft, this.#glTl.view.timeRight);
                const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);

                let v = this.#anim.getValue(t);

                if (v == lv && i < steps - 3)
                {
                    skipped = true;
                    continue;
                }

                if (skipped)
                {
                    let y = this.#animLine.valueToPixel(lv);
                    pointsSort.push(x, y, z);
                }

                lv = v;
                let y = this.#animLine.valueToPixel(v);
                pointsSort.push(x, y, z);
                skipped = false;

            }

            // pointsSort.sort((a, b) =>
            // {
            //     return a[0] - b[0];
            // });

            // this.#points = pointsSort.flat();
            this.#points = pointsSort;
        }

        if (this.#options.keyYpos)
        {
            this.#spline.getDrawer().rebuildLater();
            this.#spline.setPoints(this.#points);
            this.updateColors();
        }

        this.#updateCount++;

        // if (this.#resDiv != 1) this.updateSoon();
    }

    updateColors()
    {
        if (this.#spline)
            if (this.#anim.tlActive)
            {

                if (this.#port.op.isCurrentUiOp()) this.#spline.setColor(0, 1, 1, 1);
                else if (this.#hasSelectedKeys) { this.#spline.setColor(1, 1, 1, 1); }
                else this.#spline.setColor(0.6, 0.6, 0.6, 1);
            }
            else
            {
                this.#spline.setColorArray(glTlKeys.COLOR_INACTIVE);
            }
    }

    setKeyPositions()
    {
        const isActive = this.#port.op.isCurrentUiOp();
        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const animKey = this.#anim.keys[i];
            const kr = this.#keyRects[i];

            if (this.#anim.tlActive && animKey.time == this.#glTl.view.cursorTime) this.#glTl.setColorRectSpecial(kr);

            let y = (this.#parentRect.h / 2);
            if (this.#options.keyYpos) y = this.#animLine.valueToPixel(animKey.value);

            let rx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset);

            rx -= this.getKeyWidth() / 2;

            const ry = y - this.keyHeight / 2;
            if (rx != rx || ry != ry)console.log("${}", rx, ry);

            kr.setPosition(rx, ry, -0.84);
            this.setKeyShapeSize(kr);

            if (
                this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.keyHeight) && this.#glTl.selectRect.y2 > kr.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }
        }
    }

    selectAll()
    {
        if (this.#anim.tlActive)
            for (let i = 0; i < this.#anim.keys.length; i++)
                this.#glTl.selectKey(this.#anim.keys[i], this.#anim);
    }

    hasSelectedKeys()
    {
        // for (let i = 0; i < this.#anim.keys.length; i++)
        // {
        //     const animKey = this.#anim.keys[i];
        //     if (this.#glTl.isKeySelected(animKey))
        //         return true;
        // }
        // return false;
        return this.#hasSelectedKeys;
    }

    updateKeyRects()
    {

    }

    init()
    {
        this.reset();
        this.#initCount++;
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const keyRect = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });

            this.setKeyShapeSize(keyRect);
            keyRect.setColor(0.28, 0.28, 0.28, 0.28);
            keyRect.setColorHover(1, 1, 1, 1);
            keyRect.setParent(this.#parentRect);
            const key = this.#anim.keys[i];
            keyRect.data.key = key;

            let startDragTime = -1111;
            let startDragValue = -1111;

            /** @type {Object} */
            let oldValues = {};

            keyRect.draggableMove = true;
            keyRect.listen(GlRect.EVENT_POINTER_HOVER, () =>
            {
                this.#glTl.hoverKeyRect = keyRect;
            });
            keyRect.listen(GlRect.EVENT_POINTER_UNHOVER, () =>
            {
                this.#glTl.hoverKeyRect = null;
            });

            keyRect.listen(GlRect.EVENT_DRAGEND, () =>
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

            keyRect.listen(GlRect.EVENT_POINTER_UP, (e) =>
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

            keyRect.listen(GlRect.EVENT_POINTER_DOWN, () =>
            {
                this.click = true;
            });

            keyRect.listen(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
            {
                // this.click = false;

                this.#dragStartX = e.offsetX;
                this.#dragStartY = e.offsetY;
                this.#glTl.predragSelectedKeys();
                if (button == 1 && !this.#dragStarted)
                {
                    oldValues = this.#glTl.serializeSelectedKeys();
                    this.#dragStarted = true;
                    startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                    startDragValue = this.#animLine.pixelToValue(e.offsetY);

                    if (e.shiftKey) this.#glTl.duplicateSelectedKeys();
                }
            });

            keyRect.listen(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
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
                    let offX = e.offsetX;
                    let offY = e.offsetY;

                    let offTime = this.#glTl.view.pixelToTime(offX) - startDragTime;
                    let offVal = startDragValue - this.#animLine.pixelToValue(offY);

                    if (e.shiftKey)
                    {
                        if (Math.abs(this.#dragStartX - offX) > Math.abs(this.#dragStartY - offY)) offVal = 0;
                        else offTime = 0;
                    }
                    if (this.#glTl.getNumSelectedKeys() > 0)
                    {
                        this.#glTl.dragSelectedKeys(this.#glTl.snapTime(offTime), offVal);
                        this.#anim.sortKeys();
                    }
                    this.setKeyPositions();

                    this.#animLine.update();

                }
            });

            this.#keyRects.push(keyRect);

        }
    }

    get height()
    {
        return this.#parentRect.h - this.#parentRect.y;
    }

    reset()
    {
        for (let i = 0; i < this.#keyRects.length; i++)
        {
            this.#keyRects[i].dispose();
        }
        this.#keyRects = [];
    }

    dispose()
    {
        this.reset();
        for (let i = 0; i < this.#listeners.length; i++) this.#listeners[i].remove();

        if (this.#spline) this.#spline = this.#spline.dispose();
        // if (this.#zeroRect) this.#zeroRect = this.#zeroRect.dispose();

        this.removeAllEventListeners();

        this.#disposed = true;
    }

    getDebug()
    {
        const o = {};
        o.points = this.#points;
        o.updateCount = this.#updateCount;

        o.initCount = this.#initCount;
        o.animated = this.#glTl.view.isAnimated();
        o.needsupdate = this.#needsUpdate;
        return o;
    }
}
