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
    #keyRect = [];

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

    init()
    {
        this.dispose();

        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#glTl.rects.createRect({ "draggable": true });
            kr.setSize(10, 10);
            kr.setShape(6);
            kr.setParent(this.#parentRect);
            kr.setColor(1, 1, 1, 1);
            kr.setPosition(this.#anim.keys[i].time * 12, 10, 0.1);

            this.#keyRect.push(kr);
        }
    }

    dispose()
    {
        for (let i = 0; i < this.#keyRect.length; i++) this.#keyRect[i].dispose();
        this.#keyRect = [];
    }

}
