import { Events, Logger } from "cables-shared-client";
import { Anim, AnimKey, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import undo from "../utils/undo.js";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { hideToolTip, showToolTip } from "../elements/tooltips.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { TlKey } from "./tlkey.js";

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
    static COLOR_HIGHLIGHT = [0.8, 0.8, 0.8, 1];

    /** @type {Anim} */
    #anim = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {TlKey[]} */
    #keys = [];

    #keyLookup = {};

    /** @type {Array<GlRect>} */
    // #keyRects = [];

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

    static dragStarted = false;

    /** @type {glTlAnimLine} */
    animLine = null;

    static dragStartX = 0;
    static dragStartY = 0;
    static dragBezCp = [0, 0];

    static startDragTime = -1111;
    static startDragValue = -1111;

    #updateCount = 0;
    #initCount = 0;
    #needsUpdate = false;

    /** @type {EventListener[]}} */
    #listeners = [];
    #hasSelectedKeys = false;
    #disposedWarning = 0;
    #bezCpZ = -0.3;
    #bezCpSize = 1;
    #idx = -1;

    /**
     * @param {GlTimeline} glTl
     * @param {glTlAnimLine} animLine
     * @param {Anim} anim
     * @param {GlRect} parentRect
     * @param {Port} port
     * @param {Object} options
     * @param {Number} idx
     */
    constructor(glTl, animLine, anim, parentRect, port, options, idx)
    {
        super();
        this._log = new Logger("gltlKeys");
        if (!anim) this._log.error("no anim");
        if (!parentRect) this._log.error("no parentRect");
        if (!port) this._log.error("no port");
        this.#anim = anim;

        this.#idx = idx;
        this.#glTl = glTl;
        this.#parentRect = parentRect;
        this.#options = options || {};
        this.#port = port;
        this.animLine = animLine;
        this.#listeners.push(
            anim.on(Anim.EVENT_CHANGE, () =>
            {
                this.#needsUpdate = true;
                for (let i = 0; i < this.#keys.length; i++)
                    this.#keys[i].update();

            }));

        if (this.isLayoutGraph())
        {
            this.#spline = new GlSpline(this.#glTl.splines, port.name);
            this.#spline.setParentRect(parentRect);
        }

        this.#options = options;

        this.init();
    }

    isDragging()
    {
        return glTlKeys.dragStarted;
    }

    get anim()
    {
        return this.#anim;
    }

    /**
     * @param {boolean} b
     */
    set hidden(b)
    {
        if (b)
            for (let i = 0; i < this.#keys.length; i++)
                this.#keys[i].hide();
        else
            for (let i = 0; i < this.#keys.length; i++)
                this.#keys[i].show();
        this.updateColors();
        this.update();
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
        if (this.showKeysAsFrames()) return this.animLine.height - 1;
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
        // if (this.animLine.isHidden)
        // {
        //     for (let i = 0; i < this.#keys.length; i++)
        //     {
        //         if (!this.#keys[i].isHidden) this.#keys[i].hide();
        //     }
        //     return;
        // }
        if (this.#disposed)
        {
            this.#disposedWarning++;
            return;
        }

        if (this.#keys.length != this.#anim.keys.length) return this.init();

        const wasSelected = this.#hasSelectedKeys;
        this.#hasSelectedKeys = false;

        const perf = gui.uiProfiler.start("[gltl] update");
        for (let i = 0; i < this.#keys.length; i++)
        {
            if (this.#keys[i].isHidden) this.#keys[i].show();
            const tlKey = this.#keys[i];
            tlKey.update();

            this.setKeyShapeSize(tlKey.rect);

            if (this.#glTl.selectRect && this.testSelectRectKey(tlKey.key, tlKey.rect))
            {
                this.#glTl.selectKey(tlKey.key, this.#anim);
            }

        }
        perf.finish();

        if (wasSelected != this.#hasSelectedKeys) this.updateColors();

        this.setKeyPositions("update");

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

                if (v == lv && i < steps - 3)
                {
                    skipped = true;
                    continue;
                }

                if (skipped)
                {
                    let y = this.animLine.valueToPixel(lv);
                    pointsSort.push(x, y, z);
                }

                lv = v;
                let y = this.animLine.valueToPixel(v);
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
        return this.animLine.height > 50 || this.animLine.isGraphLayout();
    }

    updateColors()
    {
        const perf = gui.uiProfiler.start("[gltlkeys] updatecolors");
        if (this.#spline)
        {
            if (this.animLine.getTitle(this.#idx) && this.animLine.getTitle(this.#idx).isHovering)
            {
                this.#spline.setColorArray(glTlKeys.COLOR_HIGHLIGHT);
            }
            else
            {
                this.#spline.setColorArray(glTlKeys.COLOR_INACTIVE);
            }
        }

        for (let i = 0; i < this.#keys.length; i++)
        {
            const k = this.#keys[i];
            const animKey = this.#keys[i].key;
            const keyRect = this.#keys[i].rect;
            if (!animKey) return;

            let col = glTlKeys.COLOR_INACTIVE;
            let colBez = [0, 0, 0, 0];
            if (!animKey.anim.uiAttribs.readOnly && animKey.anim.tlActive)col = [0.8, 0.8, 0.8, 1];

            if (!animKey.anim.uiAttribs.readOnly && this.#glTl.isKeySelected(animKey))
            {
                if (!this.#hasSelectedKeys)
                {
                    this.#hasSelectedKeys = true;
                    this.#needsUpdate = true;
                }
                col = glTlKeys.COLOR_SELECTED;
                colBez = GlTimeline.COLOR_BEZ_HANDLE;
            }
            if (k.cp1r) k.cp1r.setColorArray(colBez);
            if (k.cp2r) k.cp2r.setColorArray(colBez);
            if (k.cp1s) k.cp1s.setColorArray(colBez);
            if (k.cp2s) k.cp2s.setColorArray(colBez);
            let shape = GlRect.SHAPE_FILLED_CIRCLE;
            if (animKey.uiAttribs.bezFree) shape = GlRect.SHAPE_CIRCLE;

            if (k.cp1r) k.cp1r.setShape(shape);
            if (k.cp2r) k.cp2r.setShape(shape);

            if (this.#anim.tlActive && animKey.time == this.#glTl.view.cursorTime) col = glTlKeys.COLOR_HIGHLIGHT;
            // if (this.animLine.isHidden)col = glTlKeys.COLOR_INIT;
            keyRect.setColorArray(col);
        }

        perf.finish();
    }

    /**
     * @param {string} [reason]
     */
    setKeyPositions(reason)
    {
        // console.log("reason", reason);
        if (this.#glTl.isSelecting()) this.testSelected();
        if (this.#keys.length != this.#anim.keys.length) this.init();
        let y = this.animLine.getKeyYPos();

        const perf = gui.uiProfiler.start("[gltl] setkeypositions");
        for (let i = 0; i < this.#keys.length; i++)
        {
            const animKey = this.#anim.keys[i];
            const kr = this.#keys[i].rect;
            const k = this.#keys[i];

            if (this.isLayoutGraph()) y = this.animLine.valueToPixel(animKey.value);

            let rx = this.#glTl.view.timeToPixel(animKey.time - this.#glTl.view.offset);

            rx -= this.getKeyWidth() / 2;
            let ry = y - this.getKeyHeight() / 2;
            if (this.isLayoutGraph()) ry = y - this.getKeyWidth() / 2;

            if (rx != rx || ry != ry)console.log("nan", rx, ry, this.getKeyWidth(), this.getKeyHeight(), y, animKey.value, this.animLine.valueToPixel(animKey.value), this.#parentRect.h);

            let z = -0.6;
            if (this.#anim.tlActive)z = -0.9;
            if (this.#port.op.isCurrentUiOp())z = -0.94;

            kr.setPosition(rx, ry, z);
            this.setKeyShapeSize(kr);

            if (k.text)
            {
                const t = k.text;
                if (this.#glTl.isGraphLayout()) t.setPosition(20, 10, 0);
                else
                {
                    if (this.showKeysAsFrames()) t.setPosition(20, 0, 0);
                    else t.setPosition(20, -10, 0);
                }
            }

            if (k.cp1r && k.cp1r.visible)
            {
                let ks = kr.w / 2;
                let s = k.cp1r.w / 2;
                const pos = [rx + ks + this.#glTl.view.timeToPixel(animKey.bezCp1[0]), this.animLine.valueToPixel(animKey.value + animKey.bezCp1[1])];
                k.cp1s.setPoints([rx + ks, ry + ks, this.#bezCpZ, pos[0], pos[1], this.#bezCpZ]);
                k.cp1r.setPosition(pos[0] - s, pos[1] - s, this.#bezCpZ);

                s = k.cp2r.w / 2;
                const pos2 = [rx + ks + this.#glTl.view.timeToPixel(animKey.bezCp2[0]), this.animLine.valueToPixel(animKey.value + animKey.bezCp2[1])];
                k.cp2s.setPoints([rx + ks, ry + ks, this.#bezCpZ, pos2[0], pos2[1], this.#bezCpZ]);
                k.cp2r.setPosition(pos2[0] - s, pos2[1] - s, this.#bezCpZ);
            }
        }

        // color areas
        for (let i = 0; i < this.#keys.length - 1; i++)
        {
            const animKey = this.#keys[i].key;
            if (animKey.uiAttribs.color)
            {
                const k = this.#keys[i];
                const kr = this.#keys[i].rect;
                const kr2 = this.#keys[i + 1].rect;
                if (!k.areaRect) continue;
                if (this.#glTl.isGraphLayout() && !this.#glTl.isMultiLine())
                {
                    k.areaRect.setSize(kr2.x - kr.x, Math.abs(kr2.y - kr.y));
                    k.areaRect.setPosition(this.getKeyWidth() / 2, Math.min(0, kr2.y - kr.y) + this.getKeyWidth() / 2, 0.8);
                }
                else
                {
                    k.areaRect.setSize(kr2.x - kr.x, this.animLine.height - 1);
                    if (this.showKeysAsFrames())
                        k.areaRect.setPosition(this.getKeyWidth() / 2, -kr.h + this.getKeyHeight(), 0.4);
                    else
                        k.areaRect.setPosition(this.getKeyWidth() / 2, -this.animLine.height / 2 + this.getKeyHeight() / 2 + 1, 0.4);
                }
            }
            perf.finish();
        }

        this.updateColors();
    }

    /**
     * @param {AnimKey} key
     * @param {GlRect} kr
     */
    testSelectRectKey(key, kr)
    {

        if (this.#glTl.selectRect &&
            this.#glTl.selectRect.x < (kr.absX + this.sizeKey) &&
            this.#glTl.selectRect.x2 > kr.absX &&
            this.#glTl.selectRect.y < (kr.absY + this.getKeyHeight()) &&
            this.#glTl.selectRect.y2 > kr.absY)
        {
            return true;
        }
        return false;
    }

    testSelected()
    {
        if (glTlKeys.dragStarted) return;

        for (let i = 0; i < this.#keys.length; i++)
        {
            const animKey = this.#keys[i].key;
            const kr = this.#keys[i].rect;

            if (this.testSelectRectKey(animKey, kr))
            {
                animKey.rect = kr;
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
            const key = this.#anim.keys[i];
            if (this.#keyLookup[key.id])
            {
                this.#keyLookup[key.id].update();
                this.#keys.push(this.#keyLookup[key.id]);
                continue;
            }

            const tlKey = new TlKey(this.#glTl, this, key);
            tlKey.on(TlKey.EVENT_POSCHANGE, () => { this.setKeyPositions("poschange"); this.update(); });
            tlKey.on(TlKey.EVENT_HOVERCHANGE, () => { this.updateColors(); });
            this.#keys.push(tlKey);
            this.#keyLookup[key.id] = tlKey;
            const keyRect = tlKey.rect;

            this.setKeyShapeSize(keyRect);
            keyRect.setColorArray(glTlKeys.COLOR_INIT);
            keyRect.setParent(this.#parentRect);
            keyRect.setPosition(Math.random() * 399, Math.random() * 399);
            keyRect.data.key = key;

            /** @type {Object} */
            let oldValues = {};
            if (!key.anim.uiAttribs.readOnly)
            {

                keyRect.draggableMove = true;
                keyRect.on(GlRect.EVENT_POINTER_HOVER, (_r, e) =>
                {
                    if (glTlKeys.dragStarted) return;
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
                        glTlKeys.dragStarted = false;
                        if (this.#glTl.isSelecting())
                        {
                            this.click = false;
                            return;
                        }
                        if (this.click && !this.#glTl.isKeySelected(key))
                        {
                            if (this.#glTl.isSelecting()) return;
                            if (glTlKeys.dragStarted) return;
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
                        if (glTlKeys.dragStarted) return;
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
                    glTlKeys.dragStartX = e.offsetX;
                    glTlKeys.dragStartY = e.offsetY;
                    this.#glTl.predragSelectedKeys();
                    if (button == 1 && !glTlKeys.dragStarted)
                    {
                        oldValues = this.#glTl.serializeSelectedKeys();
                        glTlKeys.dragStarted = true;
                        glTlKeys.startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                        glTlKeys.startDragValue = this.animLine.pixelToValue(e.offsetY - this.#glTl.getFirstLinePosy());

                        if (e.altKey) this.#glTl.duplicateSelectedKeys();
                    }
                });

                keyRect.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
                {
                    this.click = false;
                    if (this.#glTl.isSelecting()) return;
                    if (glTlKeys.startDragTime == -1111)
                    {
                        console.log("cant drag....", glTlKeys.dragStarted, this.#glTl.isSelecting());
                        return;
                    }

                    if (button == 2)
                    {
                        glTlKeys.dragStartX = e.offsetX;
                        glTlKeys.dragStartY = e.offsetY;
                    }

                    if (button == 1 && keyRect == this.#glTl.hoverKeyRect)
                    {
                        let offX = e.offsetX;
                        let offY = e.offsetY - this.#glTl.getFirstLinePosy();

                        let offTime = this.#glTl.view.pixelToTime(offX) - glTlKeys.startDragTime;
                        let offVal = glTlKeys.startDragValue - this.animLine.pixelToValue(offY);

                        if (e.shiftKey)
                        {
                            if (Math.abs(glTlKeys.dragStartX - offX) > Math.abs(glTlKeys.dragStartY - offY)) offVal = 0;
                            else offTime = 0;
                        }

                        if (this.#glTl.getNumSelectedKeys() > 0)
                        {
                            this.#glTl.dragSelectedKeys(offTime, offVal);
                            this.#anim.sortKeys();
                        }
                        this.setKeyPositions();
                        this.#glTl.setHoverKeyRect(keyRect);
                        this.animLine.update();
                        hideToolTip();
                    }
                });

                keyRect.on(GlRect.EVENT_DRAGEND, () =>
                {
                    this.#anim.sortKeys();
                    this.#anim.removeDuplicates();
                    this.#glTl.needsUpdateAll = "dragged";
                    glTlKeys.dragStarted = false;

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
            tlKey.update();

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
        this.#keys = [];
        this.#needsUpdate = true;
        this.#glTl.setHoverKeyRect(null);
    }

    dispose()
    {
        this.reset();
        for (let i = 0; i < this.#listeners.length; i++) this.#listeners[i].remove();

        if (this.#spline) this.#spline = this.#spline.dispose();
        for (let i in this.#keyLookup) this.#keyLookup[i].dispose();

        this.#keyLookup = {};
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
    }

}
