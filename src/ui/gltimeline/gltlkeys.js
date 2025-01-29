import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import GlTimeline from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";

/**
 * gltl key rendering
 *
 * @export
 * @class glTlKeys
 * @extends {Events}
 */
export default class glTlKeys extends Events
{

    /** @type {Anim} */
    #anim = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<GlRect} */
    #keyRects = [];

    /** @type {GlRect} */
    #parentRect = null;

    /**
     * @param {GlTimeline} glTl
     * @param {Anim} anim
     * @param {GlRect} parentRect
     */
    constructor(glTl, anim, parentRect)
    {
        super();
        this.#anim = anim;
        this.#glTl = glTl;
        this.#parentRect = parentRect;

        this.init();
    }

    update()
    {
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const kr = this.#keyRects[i];
            kr.setPosition(this.#glTl.timeToPixel(this.#anim.keys[i].time + this.#glTl.offset), 10, -0.1);
        }

    }

    init()
    {
        this.dispose();
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#glTl.rects.createRect({ "draggable": true });
            kr.setShape(6);
            kr.setSize(10, 10);
            kr.setColor(1, 1, 1, 1);
            kr.setParent(this.#parentRect);
            this.#keyRects.push(kr);
        }
        this.update();
    }

    dispose()
    {
        for (let i = 0; i < this.#keyRects.length; i++) this.#keyRects[i].dispose();
        this.#keyRects = [];
    }

}
