import { Anim, utils } from "cables";
import { UserSettings, userSettings } from "../components/usersettings.js";
import GlRect from "../gldraw/glrect.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { gui } from "../gui.js";
import GlOp from "./glop.js";
import { UiOp } from "../core_extend_op.js";
import gluiconfig from "./gluiconfig.js";

export default class GlArea
{

    /** @type {GlRect} */
    #rectBg = null;

    /** @type {GlRect} */
    #rectResize = null;

    /** @type {GlOp} */
    #glop;
    #id = utils.shortId();

    #instancer;

    _w = 300;
    _h = 200;
    _visible = true;

    /** @type {GlOp} */
    #glOpScopeEnd;

    #animW = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
    #animH = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
    #animating = false;
    #bringingToFront = false;
    #animFlash = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
    #flashing = false;
    #brightness = 0.35;
    animDuration = 0.25;

    /**
     * @param {GlRectInstancer} instancer
     * @param {GlOp} glop
     */
    constructor(instancer, glop)
    {
        this.#instancer = instancer;

        this.#glop = glop;

        this.#rectBg = glop.glPatch.areaRectDrawer.createRect({ "name": "glarea bg", "interactive": false, "draggable": false });
        this.#rectBg.setSize(this._w, this._h);
        // this.#rectBg.setBorder(1);
        this._updateColor();

        /**
         * @type {Number}
         */
        this.resizeCornerSize = 15;

        /**
         * @type {GlRect}
         */
        this.#rectResize = this.#instancer.createRect({ "name": "glarea resize", "interactive": true, "draggable": true });
        this.#rectResize.setShape(GlRect.SHAPE_TRIANGLE_BOTTOM);
        this.#rectResize.setSize(this.resizeCornerSize, this.resizeCornerSize);
        this.#rectResize.setColor(0, 0, 0, 0.2);
        this.#rectResize.setPosition(200 - this.resizeCornerSize, 200 - this.resizeCornerSize);
        this.#rectResize.draggable = true;
        this.#rectResize.draggableMove = true;

        this.#rectResize.on(GlRect.EVENT_POINTER_HOVER, (rect) =>
        {
            this.#glop.glPatch.hoverResizeRect = rect;
        });

        this.#rectResize.on(GlRect.EVENT_POINTER_UNHOVER, (rect) =>
        {
            if (this.#glop.glPatch.hoverResizeRect == rect) this.#glop.glPatch.hoverResizeRect = null;
        });

        this.#glop.on(GlOp.EVENT_DRAG, () =>
        {
            this.update();
        });

        this.#rectResize.on(GlRect.EVENT_DRAG, (_e) =>
        {
            this._w = this.#rectResize.x - this.#glop.x + this.#rectResize.w / 2;
            this._h = this.#rectResize.y - this.#glop.y + this.#rectResize.h / 2;

            // if (userSettings.get(UserSettings.PREF_SNAPTOGRID))
            // {
            //     this._w = this.#glop.glPatch.snap.snapX(this._w);
            //     this._h = this.#glop.glPatch.snap.snapY(this._h);
            // }

            gui.savedState.setUnSaved("resizeGlArea", this.#glop.op.getSubPatch());

            if (this.#glOpScopeEnd)
            {
                this.#glOpScopeEnd.op.setPos(this.#rectBg.x, this.#rectResize.y + this.#rectResize.h / 2 - this.#glOpScopeEnd.h);
            }
            this.update(true);
        });

        if (this.#glop.op.uiAttribs.area)
        {
            if (this.#glop.op.uiAttribs.area.id) this.#id = this.#glop.op.uiAttribs.area.id;
            this._w = this.#glop.op.uiAttribs.area.w;
            this._h = this.#glop.op.uiAttribs.area.h;
        }

        if (this.#glop.op.uiAttribs.collapsable) this.#glop.glPatch.collapsableAreas[this.#id] = this;

        this.update();
    }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        this._visible = v;
        this.update();
    }

    minsize = 20;

    get width()
    {
        if (this.#animating) return this.#animW.getValue(this.#glop.glPatch.time);
        return this._w;
    }

    get height()
    {
        if (this.#animating) return this.#animH.getValue(this.#glop.glPatch.time);
        return this._h;
    }

    /**
     * @param {boolean} [updateChilds]
     */
    update(updateChilds = false)
    {

        if (this.#rectBg)
        {

            if (this.#glop.op.uiAttribs.areaCollapsed && this._h != this.minsize)
            {
                this.#glop.op.uiAttribs.area.origW = this._w;
                this.#glop.op.uiAttribs.area.origH = this._h;

                this.#startAnim(this._w, this._h, this.#glop.w, this.#glop.h);

                this._w = this.minsize;
                this._h = this.minsize;
            }

            if (!this.#glop.op.uiAttribs.areaCollapsed)
            {

                if (this._h == this.minsize && !this.#glop.op.uiAttribs.areaCollapsed)
                {
                    this.#rectBg.visible = true;
                    this.#rectResize.visible = true;

                    this._w = this.#glop.op.uiAttribs.area.origW;
                    this._h = this.#glop.op.uiAttribs.area.origH;

                    this.#startAnim(this.#glop.w, this.#glop.h, this._w, this._h);
                    this.#glop.bringToFront();
                }

                this.#rectBg.visible = this._visible;
                this.#rectResize.visible = this._visible;

                if (!this._visible) return;
                this.#rectBg.setPosition(
                    this.#glop.x,
                    this.#glop.y,
                    this.#getZ());

                if (this.#glOpScopeEnd)
                {

                    this._h = this.#glOpScopeEnd.y - this.#glop.y + this.#glOpScopeEnd.h;
                    if (!this.#animating) this.#rectBg.setSize(this._w, this._h);

                    this.#rectResize.setPosition(this.#rectResize.x, this.#glOpScopeEnd.y + this.#glOpScopeEnd.h);
                }
                else if (!this.#animating) this.#rectBg.setSize(this._w, this._h);

                if (!this.#animating) this.#setRectResizePosition(this._w, this._h);
            }
        }
        if (!this.#glOpScopeEnd && this.#glop.getUiAttribs().scopeArea)
        {
            if (this.#glop.op.tempData.scopeAreaEndOp)
                this.#glOpScopeEnd = this.#glop.glPatch.getGlOp(this.#glop.op.tempData.scopeAreaEndOp);
        }

        if (!this.#glop.op.uiAttribs.areaCollapsed)
        {
            this.#glop.op.setUiAttrib({ "area": { "w": this._w, "h": this._h, "id": this.#id } });
            if (updateChilds || !this.#glop.op.uiAttribs.collapsable) this.updateChildOps();
        }
        this.#glop.updateSelectedBorder();

    }

    /**
     * @param {number} fromW
     * @param {number} fromH
     * @param {number} toW
     * @param {number} toH
     */
    #startAnim(fromW, fromH, toW, toH)
    {
        const t = this.#glop.glPatch.time;

        this.#animW.clear();
        this.#animW.setValue(t, fromW);
        this.#animW.setValue(t + this.animDuration, toW);

        this.#animH.clear();
        this.#animH.setValue(t, fromH);
        this.#animH.setValue(t + this.animDuration, toH);

        this.#animating = true;
        this.#rectBg.visible = true;
        this.#rectResize.visible = true;
        this.updateAnim();
    }

    updateAnim()
    {
        if (!this.#rectBg) return;
        const t = this.#glop.glPatch.time;

        if (this.#flashing) this.#updateFlash(t);
        if (!this.#animating) return;

        const w = this.#animW.getValue(t);
        const h = this.#animH.getValue(t);
        this.#rectBg.setSize(w, h);
        this.#setRectResizePosition(w, h);
        this.#glop.updateSelectedBorder();

        if (this.#animW.isFinished(t))
        {
            this.#animating = false;
            if (this.#glop.op.uiAttribs.areaCollapsed)
            {
                this.#rectBg.visible = false;
                this.#rectResize.visible = false;
            }
            else
            {
                this.#rectBg.setSize(this._w, this._h);
                this.#setRectResizePosition(this._w, this._h);
                this.#glop.updateSelectedBorder();
            }
        }
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    #setRectResizePosition(w, h)
    {
        this.#rectResize.setPosition(
            this.#glop.x + w - this.#rectResize.w,
            this.#glop.y + h - this.#rectResize.h,
            this.#getZ() - gluiconfig.zOpSlot
        );
    }

    #getZ()
    {
        return this.#glop.getPosZ() + gluiconfig.zOpSlot / 2;
    }

    bringChildrenToFront()
    {
        if (!this.#glop.op.uiAttribs.collapsable) return;
        if (this.#bringingToFront) return;
        this.#bringingToFront = true;
        const childs = gui.corePatch().getOpsByArea(this.#id);
        const glOps = [];
        for (let i = 0; i < childs.length; i++)
        {
            const glop = this.#glop.glPatch.getGlOp(childs[i]);
            if (glop && glop != this.#glop) glOps.push(glop);
        }

        glOps.sort((a, b) => { return a.stackOrder - b.stackOrder; });
        for (let i = 0; i < glOps.length; i++) glOps[i].bringToFront();
        this.#bringingToFront = false;
    }

    updateChildOps()
    {

        const childs = this.#glop.glPatch._getGlOpsInRect(this.#glop.x, this.#glop.y, this.#glop.x + this._w, this.#glop.y + this._h);
        const opChilds = [];

        let changed = false;
        for (let i = 0; i < childs.length; i++)
        {
            if (childs[i].op)
            {
                opChilds.push(childs[i].op);
                if (childs[i].op.attribs.area != this.#id)
                {
                    childs[i].op.attribs.area = this.#id;
                    changed = true;
                }
            }
        }

        const currentChilds = gui.corePatch().getOpsByArea(this.#id);
        for (let i = 0; i < currentChilds.length; i++)
        {
            if (opChilds.indexOf(currentChilds[i]) == -1)
            {
                delete currentChilds[i].attribs.area;
                changed = true;
            }

        }
        if (changed)
        {
            for (let i = 0; i < childs.length; i++) childs[i].updatePosition();
            for (let i = 0; i < currentChilds.length; i++)
            {
                const glop = this.#glop.glPatch.getGlOp(currentChilds[i]);
                if (glop) glop.updatePosition();
            }
            this.bringChildrenToFront();
            this.#glop?.op.emitEvent("areaChildrenChange", childs);
            this.#glOpScopeEnd?.op.emitEvent("areaChildrenChange", childs);
            this.flash();
        }

    }

    /**
     * @private
     */
    _updateColor()
    {
        // if (this._glop.opUiAttribs.color)
        // {
        //     const cols = chroma.hex(this._glop.opUiAttribs.color).gl();
        //     cols[3] = 0.1;
        //     this._rectBg.setColorArray(cols);
        // }
        // else
        this.#rectBg.setColor(this.#brightness, this.#brightness, this.#brightness, 0.7);
    }

    get id() { return this.#id; }

    get glop() { return this.#glop; }

    /**
     * @param {GlOp} glop
     */
    overlapsGlOp(glop)
    {
        if (this.#glop.op.uiAttribs.areaCollapsed) return false;
        return glop.x + glop.w >= this.#glop.x &&
            glop.x <= this.#glop.x + this._w &&
            glop.y + glop.h >= this.#glop.y &&
            glop.y <= this.#glop.y + this._h;
    }

    get z() { return this.#getZ(); }

    /**
     * @param {number} x
     * @param {number} y
     */
    isPointInside(x, y)
    {
        if (this.#glop.op.uiAttribs.areaCollapsed || !this._visible) return false;
        return x >= this.#glop.x && x <= this.#glop.x + this.width && y >= this.#glop.y && y <= this.#glop.y + this.height;
    }

    flash()
    {
        if (!this.#rectBg) return;
        const t = this.#glop.glPatch.time;

        this.#animFlash.clear();
        this.#animFlash.setValue(t, 1);
        this.#animFlash.setValue(t + gluiconfig.areaFlashDuration, 0);

        this.#flashing = true;
        this.#updateFlash(t);
    }

    /**
     * @param {number} t
     */
    #updateFlash(t)
    {
        const v = this.#animFlash.getValue(t);
        const c = this.#brightness + (1 - this.#brightness) * v;
        this.#rectBg.setColor(c, c, c, 0.7);

        if (this.#animFlash.isFinished(t))
        {
            this.#flashing = false;
            this._updateColor();
        }
    }

    dispose()
    {
        if (this.#glop.glPatch.collapsableAreas[this.#id] == this) delete this.#glop.glPatch.collapsableAreas[this.#id];
        this.#rectBg.dispose();
        this.#rectResize.dispose();
        this.#rectBg = null;
        this.#rectResize = null;
        return null;
    }
}
