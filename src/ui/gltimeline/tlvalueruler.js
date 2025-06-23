import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { GlTlView } from "./gltlview.js";

export class TlValueRuler
{

    #numMarker = 20;

    /** @type {GlRect} */
    #zeroRect = null;

    /** @type {GlTimeline} */
    #glTl;

    /** @type {GlTlView} */
    #view;

    /** @type {GlRect[]} */
    #marker = [];
    #parentRect;

    /** @type {glTlAnimLine} */
    #animLine;

    /**
     * @param {GlTimeline} glTl
     * @param {glTlAnimLine} animline
     * @param {GlRect} parentRect
     */
    constructor(glTl, animline, parentRect)
    {
        this.#glTl = glTl;
        this.#parentRect = parentRect;
        this.#view = glTl.view;
        this.#animLine = animline;
        this.init();
    }

    init()
    {
        this.dispose();

        this.#zeroRect = this.#glTl.rects.createRect({ "name": "zero rect", "draggable": true, "interactive": false });
        this.#zeroRect.setSize(99999, 1);
        this.#zeroRect.setColor(0, 0, 0, 1);
        this.#zeroRect.setParent(this.#parentRect);

        for (let i = 0; i < this.#numMarker; i++)
        {
            const r = this.#glTl.rects.createRect({ "name": "nummarker", "draggable": true, "interactive": false });
            r.setPosition(0, i);
            r.setSize(20, 1);
            r.setParent(this.#parentRect);
            this.#marker.push(r);
        }
    }

    update()
    {
        for (let i = 0; i < this.#marker.length; i++)
        {
            this.#marker[i].setPosition(this.#parentRect.w - 20, this.#animLine.valueToPixel(i - this.#numMarker / 2));
        }

        this.#zeroRect.setPosition(0, this.#animLine.valueToPixel(0));
    }

    dispose()
    {
        for (let i = 0; i < this.#marker.length; i++) this.#marker[i].dispose();
        if (this.#zeroRect)
            this.#zeroRect.dispose();

        return null;
    }
}
