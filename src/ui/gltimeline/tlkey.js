import { Anim, AnimKey } from "cables";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";
import { GlTimeline } from "./gltimeline.js";

export class TlKey
{

    /** @type {GlTimeline} */
    #gltl = null;

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

    /** @type {GlRect} */
    cp1s = null;

    /** @type {GlRect} */
    cp2s = null;

    /** @type {GlText} */
    text = null;

    /**
     * @param {GlTimeline} gltl
     * @param {AnimKey} key
     * @param {GlRect} [rect]
     */
    constructor(gltl, key, rect)
    {
        this.key = key;
        this.#gltl = gltl;
        this.rect = rect;
        key.anim.on(Anim.EVENT_KEY_DELETE, (k) =>
        {
            if (k == this.key) this.dispose();
        });
    }

    dispose()
    {
        if (this.rect) this.rect = this.rect.dispose();
        if (this.cp1r) this.cp1r = this.cp1r.dispose();
        if (this.cp2r) this.cp2s = this.cp2s.dispose();
        if (this.cp1s) this.cp1s = this.cp1s.dispose();
        if (this.text) this.text = this.text.dispose();
        if (this.areaRect) this.areaRect = this.areaRect.dispose();

    }
}
