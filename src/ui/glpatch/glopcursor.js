import { Events } from "cables-shared-client";
import { Anim } from "cables";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import GlPatch from "./glpatch.js";
import GlRect from "../gldraw/glrect.js";

export default class GlOpCursor extends Events
{
    static durationAnim = 0.1;
    static padding = 5;

    op = null;

    /** @type {number|string} */
    _subPatch = 0;

    #animPosX = new Anim();
    #animPosY = new Anim();
    #animSizeX = new Anim();
    #animSizeY = new Anim();

    #glPatch;

    /** @type {GlRect} */
    #cursorRect;

    /**
     * @param {GlPatch} glPatch
     * @param {GlRectInstancer} instancer
     */
    constructor(glPatch, instancer)
    {
        super();

        this.#animPosX.defaultEasing = this.#animPosY.defaultEasing = Anim.EASING_CUBIC_OUT;

        this.#glPatch = glPatch;
        this._instancer = instancer;
        this.#cursorRect = this._instancer.createRect({ "name": "opcursor", "interactive": false });
        this.#cursorRect.setSize(10, 10);
        this.#cursorRect.setShape(GlRect.SHAPE_FRAME);
        this._lastMovement = performance.now();
        this.#cursorRect.setColor(0.7, 0.7, 0.7, 1);
    }

    /**
     * @param {number|string} _subPatch
     */
    setSubpatch(_subPatch)
    {
        this._subPatch = _subPatch;
        this.updateAnim();
    }

    hide()
    {
        this.#cursorRect.visible = false;
    }

    updateAnim()
    {
        let x = this.#animPosX.getValue(this.#glPatch.time);
        let y = this.#animPosY.getValue(this.#glPatch.time);

        this.#cursorRect.setPosition(x, y);

        let w = this.#animSizeX.getValue(this.#glPatch.time);
        let h = this.#animSizeY.getValue(this.#glPatch.time);

        this.#cursorRect.setSize(w, h);

        if (performance.now() - this._lastMovement > 10000 || gui.patchView.getCurrentSubPatch() != this._subPatch)
        {
            this.hide();
        }
    }

    /**
     * @param {number} _r
     * @param {number} _g
     * @param {number} _b
     * @param {number} _a
     */
    setColor(_r, _g, _b, _a) { this.#cursorRect.setColor(1, 1, 1, 1); }

    get visible() { return this.#cursorRect.visible; }

    set visible(v) { this.#cursorRect.visible = v; }

    /**
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h)
    {
        this.#animSizeX.clear(this.#glPatch.time);
        this.#animSizeY.clear(this.#glPatch.time);

        this.#animSizeX.setValue(this.#glPatch.time + GlOpCursor.durationAnim, w);
        this.#animSizeY.setValue(this.#glPatch.time + GlOpCursor.durationAnim, h);
        this.updateAnim();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this._lastMovement = performance.now();

        this.#animPosX.clear(this.#glPatch.time);
        this.#animPosY.clear(this.#glPatch.time);

        this.#animPosX.setValue(this.#glPatch.time + GlOpCursor.durationAnim, x);
        this.#animPosY.setValue(this.#glPatch.time + GlOpCursor.durationAnim, y);

        this.updateAnim();
    }

    dispose()
    {
        if (this.#cursorRect) this.#cursorRect.dispose();
    }

    /**
     * @param {import("cables").Op<any>} op
     */
    moveToOp(op)
    {

        this.#cursorRect.visible = true;
        this.op = op;
        this.setPosition(this.#glPatch._glOpz[op.id].x - GlOpCursor.padding, this.#glPatch._glOpz[op.id].y - GlOpCursor.padding);
        this.setSize(this.#glPatch._glOpz[op.id].w + GlOpCursor.padding * 2, this.#glPatch._glOpz[op.id].h + GlOpCursor.padding * 2);
    }
}
