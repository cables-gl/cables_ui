import { Events, Logger, ele } from "cables-shared-client";

import { Anim, AnimKey, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import undo from "../utils/undo.js";
import { gui } from "../gui.js";
import { GlTlView } from "./gltlview.js";
import { GlTimeline } from "./gltimeline.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { hideToolTip, showToolTip } from "../elements/tooltips.js";
import GlText from "../gldraw/gltext.js";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";

/**
 * gltl key rendering
 *
 * @export
 * @class glTlKeys
 * @extends {Events}
 */
export class glTlKeys extends Events
{
    static COLOR_INIT = [0.9, 0.0, 0.9, 1];
    static COLOR_INACTIVE = [0.4, 0.4, 0.4, 1];
    static COLOR_NORMAL = [0.7, 0.7, 0.7, 1];
    static COLOR_SELECTED = [1, 1, 0.0, 1];
    static COLOR_CURRENT_LINE = [1, 1, 1, 1];
    static COLOR_HIGHLIGHT = [0, 1, 1, 1];

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

    sizeKey = 14;

    #options = {};

    static #dragStarted = false;

    /** @type {glTlAnimLine} */
    #animLine = null;
    static #dragStartX = 0;
    static #dragStartY = 0;
    static #dragBezCp = [0, 0];

    static #startDragTime = -1111;
    static #startDragValue = -1111;

    #updateCount = 0;
    #initCount = 0;
    #needsUpdate = false;

    /** @type {EventListener[]}} */
    #listeners = [];
    #hasSelectedKeys = false;
    #disposedWarning = 0;
    #bezCpZ = -0.3;
    #bezCpSize = 1;

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
        this.#parentRect = parentRect;
        this.#options = options || {};
        this.#port = port;
        this.#animLine = animLine;
        this.#listeners.push(
            anim.on(Anim.EVENT_CHANGE, () =>
            {
                this.#needsUpdate = true;
            }));

        if (this.isLayoutGraph())
        {
            this.#spline = new GlSpline(this.#glTl.splines, port.name);
            this.#spline.setParentRect(parentRect);
        }

        this.init();
    }

    isDragging()
    {
        return glTlKeys.#dragStarted;
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

    showKeysAsFrames()
    {
        if (this.isLayoutGraph()) return false;
        let kwidth = this.#glTl.view.timeToPixel(1 / 30) - 1;
        return kwidth > 5;
    }

    /**
     * @param {GlRect} kr
     */
    setKeyShapeSize(kr)
    {
        const w = this.getKeyWidth();

        if (!this.showKeysAsFrames() || this.isLayoutGraph())
        {
            kr.setShape(13);
            kr.setSize(w, w);
        }
        else
        {
            // shape rectangle and frame width
            kr.setShape(0);
            kr.setSize(w, this.getKeyHeight());
        }
    }

    getKeyHeight()
    {
        if (this.showKeysAsFrames()) return this.#animLine.height - 1;
        return this.getKeyWidth();
    }

    getKeyWidth()
    {
        if (this.isLayoutGraph())
        {
            let s = this.sizeKey * 0.6;
            if (this.#anim.tlActive)s = this.sizeKey * 0.8;
            if (this.#port.animMuted)s = this.sizeKey * 0;
            if (this.#port.op.isCurrentUiOp())s = this.sizeKey;
            return s;
        }
        let kwidth = this.#glTl.view.timeToPixel(1 / 30) - 1;
        if (!this.showKeysAsFrames() && !this.isLayoutGraph()) return 11;

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
            const animKey = this.#anim.keys[i];
            const keyRect = this.#keyRects[i];

            this.setKeyShapeSize(keyRect);

            if (this.#glTl.selectRect &&
                this.#glTl.selectRect.x < (keyRect.absX + this.sizeKey) && this.#glTl.selectRect.x2 > keyRect.absX &&
                this.#glTl.selectRect.y < (keyRect.absY + this.getKeyHeight()) && this.#glTl.selectRect.y2 > keyRect.absY)
            {
                this.#glTl.selectKey(animKey, this.#anim);
            }

        }
        if (wasSelected != this.#hasSelectedKeys) this.updateColors();

        this.setKeyPositions();

        /// /////////

        if (!this.#glTl.view.isAnimated() && !this.#needsUpdate) return;

        this.#needsUpdate = false;

        const pointsSort = [];

        let z = -0.4;
        if (this.#anim.tlActive)z = -0.5;
        if (this.#port.op.isCurrentUiOp())z = -0.6;

        if (this.isLayoutGraph())
        {
            const steps = (this.#glTl.width) / 1;
            let lv = 9999999;
            let skipped = false;
            for (let i = 0; i < steps; i++)
            {
                // todo:add exact keys
                const t = CABLES.map(i, 0, steps, this.#glTl.view.timeLeft, this.#glTl.view.timeRight);
                const x = this.#glTl.view.timeToPixel(t - this.#glTl.view.offset);

                let v = this.#anim.getValue(t);

                // console.log("ttt", t, v, x);
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
        }

        if (this.isLayoutGraph() && this.#spline)
        {
            this.#spline.getDrawer().rebuildLater();
            this.#spline.setPoints(pointsSort);
        }

        this.updateColors();
        this.#updateCount++;
    }

    isLayoutGraph()
    {
        return this.#animLine.height > 50 || this.#animLine.isGraphLayout();
    }

    updateColors()
    {
        if (this.#spline)
        {
            if (this.#anim.tlActive && !this.#port.animMuted)
            {
                if (this.#port.op.isCurrentUiOp()) this.#spline.setColorArray(glTlKeys.COLOR_HIGHLIGHT);
                else this.#spline.setColorArray(glTlKeys.COLOR_NORMAL);
            }
            else
            {
                this.#spline.setColorArray(glTlKeys.COLOR_INACTIVE);
            }
        }
        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const animKey = this.#anim.keys[i];
            const keyRect = this.#keyRects[i];

            let col = glTlKeys.COLOR_INACTIVE;
            let colBez = [0, 0, 0, 0];
            if (animKey.anim.tlActive)col = [0.8, 0.8, 0.8, 1];

            if (this.#glTl.isKeySelected(animKey))
            {
                if (!this.#hasSelectedKeys)
                {
                    this.#hasSelectedKeys = true;
                    this.#needsUpdate = true;
                }
                col = glTlKeys.COLOR_SELECTED;
                colBez = [0.6, 0.6, 0.6, 1];
            }

            if (keyRect.data.cp1r) keyRect.data.cp1r.setColorArray(colBez);
            if (keyRect.data.cp2r) keyRect.data.cp2r.setColorArray(colBez);
            if (keyRect.data.cp1s) keyRect.data.cp1s.setColorArray(colBez);
            if (keyRect.data.cp2s) keyRect.data.cp2s.setColorArray(colBez);
            let shape = GlRectInstancer.SHAPE_FILLED_CIRCLE;
            if (animKey.uiAttribs.bezFree) shape = GlRectInstancer.SHAPE_CIRCLE;

            if (keyRect.data.cp1r) keyRect.data.cp1r.setShape(shape);
            if (keyRect.data.cp2r) keyRect.data.cp2r.setShape(shape);

            if (this.#anim.tlActive && animKey.time == this.#glTl.view.cursorTime) col = glTlKeys.COLOR_HIGHLIGHT;
            keyRect.setColorArray(col);
        }
    }

    setKeyPositions()
    {
        if (this.#glTl.isSelecting()) this.testSelected();

        if (this.#keyRects.length != this.#anim.keys.length) this.init();

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const animKey = this.#anim.keys[i];
            const kr = this.#keyRects[i];

            let y = (this.#parentRect.h / 2);
            if (this.isLayoutGraph()) y = this.#animLine.valueToPixel(animKey.value);

            let rx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset);

            rx -= this.getKeyWidth() / 2;
            let ry = y - this.getKeyHeight() / 2;
            if (this.isLayoutGraph()) ry = y - this.getKeyWidth() / 2;

            if (rx != rx || ry != ry)console.log("nan", rx, ry, this.getKeyWidth(), this.getKeyHeight(), y, animKey.value, this.#animLine.valueToPixel(animKey.value), this.#parentRect.h);

            let z = -0.6;
            if (this.#anim.tlActive)z = -0.9;
            if (this.#port.op.isCurrentUiOp())z = -0.94;

            kr.setPosition(rx, ry, z);
            this.setKeyShapeSize(kr);

            if (kr.data.text)
            {
                const t = kr.data.text;
                if (this.#glTl.isGraphLayout()) t.setPosition(20, 10, 0);
                else
                {
                    if (this.showKeysAsFrames()) t.setPosition(20, 0, 0);
                    else t.setPosition(20, -10, 0);
                }
            }

            if (kr.data.cp1r)
            {
                let ks = kr.w / 2;
                let s = kr.data.cp1r.w / 2;
                const pos = [rx + ks + this.#glTl.view.timeToPixel(animKey.bezCp1[0]), this.#animLine.valueToPixel(animKey.value + animKey.bezCp1[1])];
                kr.data.cp1s.setPoints([rx + ks, ry + ks, this.#bezCpZ, pos[0], pos[1], this.#bezCpZ]);
                kr.data.cp1r.setPosition(pos[0] - s, pos[1] - s, this.#bezCpZ);

                s = kr.data.cp2r.w / 2;
                const pos2 = [rx + ks + this.#glTl.view.timeToPixel(animKey.bezCp2[0]), this.#animLine.valueToPixel(animKey.value + animKey.bezCp2[1])];
                kr.data.cp2s.setPoints([rx + ks, ry + ks, this.#bezCpZ, pos2[0], pos2[1], this.#bezCpZ]);
                kr.data.cp2r.setPosition(pos2[0] - s, pos2[1] - s, this.#bezCpZ);
            }
        }

        // color areas
        for (let i = 0; i < this.#keyRects.length - 1; i++)
        {
            const animKey = this.#anim.keys[i];
            if (animKey.uiAttribs.color)
            {
                const kr = this.#keyRects[i];
                const kr2 = this.#keyRects[i + 1];
                if (!kr.data.rect) continue;
                if (this.#glTl.isGraphLayout() && !this.#glTl.isMultiLine())
                {
                    kr.data.rect.setSize(kr2.x - kr.x, Math.abs(kr2.y - kr.y));
                    kr.data.rect.setPosition(this.getKeyWidth() / 2, Math.min(0, kr2.y - kr.y) + this.getKeyWidth() / 2, 0.8);
                }
                else
                {
                    kr.data.rect.setSize(kr2.x - kr.x, this.#animLine.height - 1);
                    if (this.showKeysAsFrames())
                        kr.data.rect.setPosition(this.getKeyWidth() / 2, -kr.h + this.getKeyHeight(), 0.4);
                    else
                        kr.data.rect.setPosition(this.getKeyWidth() / 2, -this.#animLine.height / 2 + this.getKeyHeight() / 2 + 1, 0.4);
                }
            }
        }

        this.updateColors();
    }

    testSelected()
    {
        if (glTlKeys.#dragStarted) return;

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const animKey = this.#anim.keys[i];
            const kr = this.#keyRects[i];

            if (
                this.#glTl.selectRect.x < (kr.absX + this.sizeKey) && this.#glTl.selectRect.x2 > kr.absX &&
                this.#glTl.selectRect.y < (kr.absY + this.getKeyHeight()) && this.#glTl.selectRect.y2 > kr.absY)
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
        return this.#hasSelectedKeys;
    }

    init()
    {
        this.reset();
        this.#initCount++;
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const keyRect = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
            const key = this.#anim.keys[i];

            this.setKeyShapeSize(keyRect);
            keyRect.setColorArray(glTlKeys.COLOR_INIT);
            keyRect.setParent(this.#parentRect);
            keyRect.setPosition(Math.random() * 399, Math.random() * 399);
            keyRect.data.key = key;

            /** @type {Object} */
            let oldValues = {};

            keyRect.draggableMove = true;
            keyRect.on(GlRect.EVENT_POINTER_HOVER, (r, e) =>
            {
                if (glTlKeys.#dragStarted) return;
                if (this.#glTl.isSelecting()) return;

                this.#glTl.setHoverKeyRect(keyRect);
                showToolTip(e, "value: " + Math.round(key.value * 100) / 100);
                this.updateColors();
            });

            keyRect.on(GlRect.EVENT_POINTER_UNHOVER, () =>
            {
                if (this.#glTl.hoverKeyRect == keyRect) this.#glTl.setHoverKeyRect(null);
                hideToolTip();
            });

            keyRect.on(GlRect.EVENT_POINTER_UP,
                (e) =>
                {
                    glTlKeys.#dragStarted = false;
                    if (this.#glTl.isSelecting())
                    {
                        this.click = false;
                        return;
                    }
                    if (this.click && !this.#glTl.isKeySelected(key))
                    {
                        if (this.#glTl.isSelecting()) return;
                        if (glTlKeys.#dragStarted) return;
                        if (!e.shiftKey) this.#glTl.unSelectAllKeys("key up");

                        console.log("click,.,.,.", e.shiftKey);
                        this.#glTl.selectKey(key, this.#anim);
                    }
                    this.click = false;
                    this.#glTl.hoverKeyRect = keyRect;
                    this.update();

                });

            keyRect.on(GlRect.EVENT_POINTER_DOWN, (e) =>
            {

                if (this.#glTl.isSelecting()) return;

                if (!this.#glTl.isKeySelected(key) && this.#glTl.hoverKeyRect && !this.#glTl.isKeySelected(key))
                {
                    if (glTlKeys.#dragStarted) return;
                    if (!e.shiftKey) this.#glTl.unSelectAllKeys("keys down");

                    this.#glTl.selectKey(key, this.#anim);
                    this.#glTl.hoverKeyRect = keyRect;
                    this.update();
                }
                this.click = true;
            });

            keyRect.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
            {
                console.log("key startdrag");
                if (this.#glTl.isSelecting()) return;
                glTlKeys.#dragStartX = e.offsetX;
                glTlKeys.#dragStartY = e.offsetY;
                this.#glTl.predragSelectedKeys();
                if (button == 1 && !glTlKeys.#dragStarted)
                {
                    oldValues = this.#glTl.serializeSelectedKeys();
                    glTlKeys.#dragStarted = true;
                    glTlKeys.#startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                    glTlKeys.#startDragValue = this.#animLine.pixelToValue(e.offsetY);

                    if (e.altKey) this.#glTl.duplicateSelectedKeys();
                }
            });

            keyRect.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
            {
                this.click = false;
                if (this.#glTl.isSelecting()) return;
                if (glTlKeys.#startDragTime == -1111)
                {
                    console.log("cant drag....", glTlKeys.#dragStarted, this.#glTl.isSelecting());
                    return;
                }

                if (button == 2)
                {
                    glTlKeys.#dragStartX = e.offsetX;
                    glTlKeys.#dragStartY = e.offsetY;
                }

                if (button == 1 && keyRect == this.#glTl.hoverKeyRect)
                {
                    let offX = e.offsetX;
                    let offY = e.offsetY;

                    let offTime = this.#glTl.view.pixelToTime(offX) - glTlKeys.#startDragTime;
                    let offVal = glTlKeys.#startDragValue - this.#animLine.pixelToValue(offY);

                    if (e.shiftKey)
                    {
                        if (Math.abs(glTlKeys.#dragStartX - offX) > Math.abs(glTlKeys.#dragStartY - offY)) offVal = 0;
                        else offTime = 0;
                    }

                    if (this.#glTl.getNumSelectedKeys() > 0)
                    {
                        this.#glTl.dragSelectedKeys(offTime, offVal);
                        this.#anim.sortKeys();
                    }
                    this.setKeyPositions();
                    this.#glTl.setHoverKeyRect(keyRect);
                    this.#animLine.update();
                    hideToolTip();
                }
            });

            keyRect.on(GlRect.EVENT_DRAGEND, () =>
            {
                this.#anim.sortKeys();
                this.#anim.removeDuplicates();
                this.#glTl.needsUpdateAll = "dragged";
                glTlKeys.#dragStarted = false;

                undo.add({
                    "title": "timeline move keys",
                    "undo": () =>
                    {
                        this.#glTl.deserializeKeys(oldValues);
                    },
                    redo() {}
                });
            });

            if (key.uiAttribs.text)
            {
                const t = new GlText(this.#glTl.texts, key.uiAttribs.text);

                t.setParentRect(keyRect);
                keyRect.data.text = t;
            }
            if (key.uiAttribs.color)
            {
                const t = this.#glTl.rects.createRect({ "draggable": false, "interactive": false });
                t.setParent(keyRect);
                t.setColor(1, 1, 0, 0.3);
                t.setPosition(1, 1, 0);
                t.setSize(33, 33);
                t.setColorHex(key.uiAttribs.color);
                t.setOpacity(0.5);
                keyRect.data.rect = t;
            }

            this.#keyRects.push(keyRect);

            /// ////

            if (this.#glTl.isGraphLayout() && key.getEasing() == Anim.EASING_CUBICSPLINE)
            {
                const bezRect = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });

                bezRect.data.key = key;
                keyRect.data.cp1r = bezRect;

                keyRect.data.cp1s = new GlSpline(this.#glTl.splines, "cp1");
                keyRect.data.cp1s.setParentRect(this.#parentRect);
                keyRect.data.cp1s.setColorArray(glTlKeys.COLOR_INACTIVE);

                const bezRect2 = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
                bezRect2.data.key = key;
                keyRect.data.cp2r = bezRect2;

                keyRect.data.cp2s = new GlSpline(this.#glTl.splines, "cp2");
                keyRect.data.cp2s.setParentRect(this.#parentRect);
                keyRect.data.cp2s.setColorArray(glTlKeys.COLOR_INACTIVE);

                this.bindBezCp(bezRect, key.bezCp1, key, 0);
                this.bindBezCp(bezRect2, key.bezCp2, key, 1);
            }
        }

        this.setKeyPositions();
        this.updateColors();
        this.update();
    }

    get height()
    {
        return this.#parentRect.h - this.#parentRect.y;
    }

    reset()
    {
        for (let i = 0; i < this.#keyRects.length; i++)
        {
            if (this.#keyRects[i].data.text) this.#keyRects[i].data.text.dispose();
            if (this.#keyRects[i].data.cp1r) this.#keyRects[i].data.cp1r.dispose();
            if (this.#keyRects[i].data.cp2r) this.#keyRects[i].data.cp2r.dispose();
            if (this.#keyRects[i].data.cp1s) this.#keyRects[i].data.cp1s.dispose();
            if (this.#keyRects[i].data.cp2s) this.#keyRects[i].data.cp2s.dispose();
            this.#keyRects[i].dispose();
        }
        this.#keyRects = [];
        this.#needsUpdate = true;
        this.#glTl.setHoverKeyRect(null);
    }

    dispose()
    {
        this.reset();
        for (let i = 0; i < this.#listeners.length; i++) this.#listeners[i].remove();

        if (this.#spline) this.#spline = this.#spline.dispose();

        this.removeAllEventListeners();
        this.#glTl.setHoverKeyRect(null);

        this.#disposed = true;
    }

    getDebug()
    {
        const o = {};
        // o.points = this.#point.s;
        o.updateCount = this.#updateCount;
        o.initCount = this.#initCount;
        o.animated = this.#glTl.view.isAnimated();
        o.needsupdate = this.#needsUpdate;
        return o;
    }

    render()
    {
        if (this.#glTl.isAnimated) this.update();
        this.setKeyPositions();
    }

    static dragStarted()
    {
        return this.#dragStarted;

    }

    /**
     * @param {GlRect} bezRect
     * @param {number[]} cp
     * @param {AnimKey} key
     * @param {number} dir
     */
    bindBezCp(bezRect, cp, key, dir)
    {
        this.#bezCpSize = this.getKeyWidth() * 0.75;
        bezRect.setShape(6);
        bezRect.setSize(this.#bezCpSize + dir * 3, this.#bezCpSize + dir * 3);
        bezRect.setParent(this.#parentRect);
        bezRect.draggableMove = true;

        /** @type {Object} */
        let oldValues = {};

        bezRect.on(GlRect.EVENT_POINTER_HOVER, (r, e) =>
        {
            if (bezRect.color[3] == 0) return;
            this.#glTl.setHoverKeyRect(bezRect);
            this.updateColors();
        });

        bezRect.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
            if (this.#glTl.hoverKeyRect == bezRect) this.#glTl.setHoverKeyRect(null);
        });

        bezRect.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            if (bezRect.color[3] == 0) return;
            if (this.#glTl.isSelecting()) return;
            glTlKeys.#dragStartX = e.offsetX;
            glTlKeys.#dragStartY = e.offsetY;
            if (button == 1 && !glTlKeys.#dragStarted)
            {
                oldValues = this.#glTl.serializeSelectedKeys();
                glTlKeys.#dragBezCp = [cp[0], cp[1]];
                glTlKeys.#dragStarted = true;
                glTlKeys.#startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                glTlKeys.#startDragValue = this.#animLine.pixelToValue(e.offsetY);
            }
        });

        bezRect.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.click = false;
            if (this.#glTl.isSelecting()) return;
            if (glTlKeys.#startDragTime == -1111)
            {
                console.log("cant drag bez...", glTlKeys.#dragStarted, this.#glTl.isSelecting());
                return;
            }

            if (button == 1 && bezRect == this.#glTl.hoverKeyRect)
            {
                let offX = e.offsetX;
                let offY = e.offsetY;

                let offTime = this.#glTl.view.pixelToTime(offX) - glTlKeys.#startDragTime;
                let offVal = glTlKeys.#startDragValue - this.#animLine.pixelToValue(offY);

                let nt = offTime + glTlKeys.#dragBezCp[0];
                let nv = offVal + glTlKeys.#dragBezCp[1];

                if (dir == 0)
                {
                    nt = Math.min(nt, 0);
                    key.setBezCp1(nt, nv);
                    if (!key.uiAttribs.bezFree) key.setBezCp2(nt * -1, nv * -1);
                }
                if (dir == 1)
                {
                    nt = Math.max(nt, 0);
                    key.setBezCp2(nt, nv);
                    if (!key.uiAttribs.bezFree) key.setBezCp1(nt * -1, nv * -1);
                }

                this.setKeyPositions();
                this.#animLine.update();
                this.#glTl.setHoverKeyRect(bezRect);
                hideToolTip();
            }
        });

        bezRect.on(GlRect.EVENT_DRAGEND, () =>
        {
            this.#glTl.needsUpdateAll = "draggedbez";
            glTlKeys.#dragStarted = false;

            undo.add({
                "title": "timeline move keys",
                "undo": () =>
                {
                    this.#glTl.deserializeKeys(oldValues);
                },
                redo() {}
            });
        });

    }
}
