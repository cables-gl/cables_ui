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

    _clientId;
    #glPatch;

    /**
     * @param {GlPatch} glPatch
     * @param {GlRectInstancer} instancer
     * @param {number} [clientId]
     */
    constructor(glPatch, instancer, clientId)
    {
        super();

        this.#animPosX.defaultEasing = this.#animPosY.defaultEasing = Anim.EASING_CUBIC_OUT;

        this.#glPatch = glPatch;
        this._instancer = instancer;
        this._cursorRect = this._instancer.createRect({ "name": "opcursor", "interactive": false });
        this._cursorRect.setSize(10, 10);
        this._cursorRect.setShape(GlRect.SHAPE_FRAME);
        this._lastMovement = performance.now();

        this._cursorRect.setColor(0.7, 0.7, 0.7, 1);

    }

    /**
     * @param {number|string} _subPatch
     */
    setSubpatch(_subPatch)
    {
        this._subPatch = _subPatch;
        this.updateAnim();
    }

    updateAnim()
    {
        let x = this.#animPosX.getValue(this.#glPatch.time);
        let y = this.#animPosY.getValue(this.#glPatch.time);

        this._cursorRect.setPosition(x, y);

        let w = this.#animSizeX.getValue(this.#glPatch.time);
        let h = this.#animSizeY.getValue(this.#glPatch.time);

        this._cursorRect.setSize(w, h);

        const coord = this.#glPatch.viewBox.patchToScreenCoords(x, y);

        if (performance.now() - this._lastMovement > 10000 || gui.patchView.getCurrentSubPatch() != this._subPatch)
        {
            this._cursorRect.visible = false;
        }
        else
        {
            this._cursorRect.visible = true;
        }
    }

    /**
     * @param {number} _r
     * @param {number} _g
     * @param {number} _b
     * @param {number} _a
     */
    setColor(_r, _g, _b, _a) { this._cursorRect.setColor(1, 1, 1, 1); }

    get visible() { return this._cursorRect.visible; }

    set visible(v) { this._cursorRect.visible = v; }

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
        if (this._cursorRect) this._cursorRect.dispose();
    }

    /**
     * @param {import("cables").Op<any>} op
     */
    moveToOp(op)
    {
        this.op = op;
        this.setPosition(this.#glPatch._glOpz[op.id].x - GlOpCursor.padding, this.#glPatch._glOpz[op.id].y - GlOpCursor.padding);
        this.setSize(this.#glPatch._glOpz[op.id].w + GlOpCursor.padding * 2, this.#glPatch._glOpz[op.id].h + GlOpCursor.padding * 2);
    }
}
