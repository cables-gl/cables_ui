import { Anim, AnimKey } from "cables";
import { Events } from "cables-shared-client";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";
import { GlTimeline } from "./gltimeline.js";
import GlSpline from "../gldraw/glspline.js";
import { glTlKeys } from "./gltlkeys.js";
import undo from "../utils/undo.js";

export class TlKey extends Events
{
    static EVENT_POSCHANGE = "posChanged";
    static EVENT_HOVERCHANGE = "hoverChanged";

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {AnimKey} */
    key = null;

    /** @type {GlRect} */
    rect = null;

    /** @type {GlRect} */
    areaRect = null;

    /** @type {GlRect} */
    cp1r = null;

    /** @type {GlRect} */
    cp2r = null;

    /** @type {GlSpline} */
    cp1s = null;

    /** @type {GlSpline} */
    cp2s = null;

    /** @type {GlText} */
    text = null;
    #bezCpSize = 10;

    /** @type {glTlKeys} */
    tlkeys = null;

    #hidden = false;

    /**
     * @param {GlTimeline} gltl
     * @param {glTlKeys} tlkeys
     * @param {AnimKey} key
     * @param {GlRect} [rect]
     */
    constructor(gltl, tlkeys, key, rect)
    {
        super();
        this.tlkeys = tlkeys;
        this.key = key;
        this.#glTl = gltl;
        this.rect = rect || this.#glTl.rects.createRect({ "draggable": true, "interactive": true, "name": "key" });

        key.anim.on(Anim.EVENT_KEY_DELETE, (k) =>
        {
            if (k == this.key) this.dispose();
        });
    }

    hide()
    {
        this.#hidden = true;
        this.rect.visible = false;
        this.update();
    }

    show()
    {
        this.#hidden = false;
        this.rect.visible = true;
        this.update();
    }

    get isHidden()
    {
        return this.#hidden;
    }

    update()
    {
        const keyRect = this.rect;
        if (this.#hidden)
        {
            return;
        }
        const key = this.key;
        if (!this.areaRect && (key.uiAttribs.color || key.clipId))
        {
            const t = this.#glTl.rects.createRect({ "name": "key color", "draggable": false, "interactive": false });
            t.setParent(keyRect);
            t.setPosition(1, 0, -0.8);
            t.setSize(73, 5);
            if (key.clipId)
            {
                t.setColorHex("#aaaaaa");
                t.setBorder(2);
            }
            if (key.uiAttribs.color)
            {
                t.setColorHex(key.uiAttribs.color);
            }
            t.setOpacity(0.5);
            this.areaRect = t;
        }
        if (this.areaRect && !(key.uiAttribs.color || key.clip)) this.areaRect = this.areaRect.dispose();

        if (key.uiAttribs.text)
        {
            if (!this.text)
            {
                this.text = new GlText(this.#glTl.texts, key.uiAttribs.text);
                this.text.setParentRect(keyRect);
            }
            if (!this.text.text != key.uiAttribs.text) this.text.text = key.uiAttribs.text;
            if (key.clipId && this.text.text != key.clipId) this.text.text = key.clipId;
        }

        if (this.rect && this.#glTl.isGraphLayout() && !this.cp1r && key.getEasing() == Anim.EASING_CUBICSPLINE)
        {
            const bezRect = this.#glTl.rects.createRect({ "name": "bezrect", "draggable": true, "interactive": true });

            bezRect.data.key = key;
            this.cp1r = bezRect;

            this.cp1s = new GlSpline(this.#glTl.splines, "cp1");
            this.cp1s.setParentRect(this.rect.parent);
            this.cp1s.setColorArray(GlTimeline.COLOR_BEZ_HANDLE);

            const bezRect2 = this.#glTl.rects.createRect({ "name": "bezrect2", "draggable": true, "interactive": true });
            bezRect2.data.key = key;
            this.cp2r = bezRect2;

            this.cp2s = new GlSpline(this.#glTl.splines, "cp2");
            this.cp2s.setParentRect(this.rect.parent);
            this.cp2s.setColorArray(GlTimeline.COLOR_BEZ_HANDLE);

            this.bindBezCp(bezRect, key.bezCp1, key, 0);
            this.bindBezCp(bezRect2, key.bezCp2, key, 1);
        }
        if (this.#glTl.isGraphLayout() && this.cp1r && this.cp1r.visible && key.getEasing() != Anim.EASING_CUBICSPLINE)
        {
            this.cp1r.visible = false;
            this.cp2r.visible = false;
            this.cp1s.setPoints([0, 0, 0, 0, 0, 0]);
            this.cp2s.setPoints([0, 0, 0, 0, 0, 0]);
        }
        if (this.#glTl.isGraphLayout() && this.cp1r && !this.cp1r.visible && key.getEasing() == Anim.EASING_CUBICSPLINE)
        {
            this.cp1r.visible = true;
            this.cp2r.visible = true;
        }
    }

    /**
     * @param {GlRect} bezRect
     * @param {number[]} _cp
     * @param {AnimKey} key
     * @param {number} dir
     */
    bindBezCp(bezRect, _cp, key, dir)
    {
        bezRect.setShape(GlRect.SHAPE_FILLED_CIRCLE);
        bezRect.setSize(this.#bezCpSize + dir * 3, this.#bezCpSize + dir * 3);
        bezRect.setParent(this.rect.parent);
        bezRect.draggableMove = true;

        /** @type {Object} */
        let oldValues = {};

        bezRect.on(GlRect.EVENT_POINTER_HOVER, (r, e) =>
        {
            if (bezRect.color[3] == 0) return;
            this.#glTl.setHoverKeyRect(bezRect);
            this.emitEvent(TlKey.EVENT_HOVERCHANGE);
        });

        bezRect.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
            if (this.#glTl.hoverKeyRect == bezRect) this.#glTl.setHoverKeyRect(null);
        });

        bezRect.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            if (bezRect.color[3] == 0) return;
            if (this.#glTl.isSelecting()) return;
            glTlKeys.dragStartX = e.offsetX;
            glTlKeys.dragStartY = e.offsetY;
            if (button == 1 && !glTlKeys.dragStarted)
            {
                oldValues = this.#glTl.serializeSelectedKeys();
                glTlKeys.dragBezCp = key.bezCp1;// [cp[0], cp[1]];
                if (dir == 1) glTlKeys.dragBezCp = key.bezCp2;

                glTlKeys.dragStarted = true;
                glTlKeys.startDragTime = this.#glTl.view.pixelToTime(e.offsetX);
                glTlKeys.startDragValue = this.tlkeys.animLine.pixelToValue(e.offsetY);
            }
        });

        bezRect.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.click = false;
            if (this.#glTl.isSelecting()) return;
            if (glTlKeys.startDragTime == -1111)
            {
                console.log("cant drag bez...", glTlKeys.dragStarted, this.#glTl.isSelecting());
                return;
            }

            if (button == 1 && bezRect == this.#glTl.hoverKeyRect)
            {
                let offX = e.offsetX;
                let offY = e.offsetY;

                let offTime = this.#glTl.view.pixelToTime(offX) - glTlKeys.startDragTime;
                let offVal = glTlKeys.startDragValue - this.tlkeys.animLine.pixelToValue(offY);

                let nt = offTime + glTlKeys.dragBezCp[0];
                let nv = offVal + glTlKeys.dragBezCp[1];

                if (dir == 0)
                {
                    nt = Math.min(nt, 0);
                    if (!key.uiAttribs.bezFree) this.#glTl.selSelectedKeysCP2(nt * -1, nv * -1);
                    this.#glTl.selSelectedKeysCP1(nt, nv);
                }
                if (dir == 1)
                {
                    nt = Math.max(nt, 0);
                    if (!key.uiAttribs.bezFree) this.#glTl.selSelectedKeysCP1(nt * -1, nv * -1);
                    this.#glTl.selSelectedKeysCP2(nt, nv);
                }

                this.emitEvent(TlKey.EVENT_POSCHANGE);
                this.#glTl.setHoverKeyRect(bezRect);
            }
        });

        bezRect.on(GlRect.EVENT_DRAGEND, () =>
        {
            this.#glTl.needsUpdateAll = "draggedbez";
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

    dispose()
    {

        if (this.rect) this.rect = this.rect.dispose();
        if (this.cp1r) this.cp1r = this.cp1r.dispose();
        if (this.cp2r) this.cp2r = this.cp2r.dispose();
        if (this.cp1s) this.cp1s = this.cp1s.dispose();
        if (this.cp2s) this.cp2s = this.cp2s.dispose();
        if (this.text) this.text = this.text.dispose();
        if (this.areaRect) this.areaRect = this.areaRect.dispose();

    }
}
