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

    /** @type {Array<GlRect} */
    #dopeRects = [];

    /** @type {GlRect} */
    #parentRect = null;

    /** @type {CABLES.Port} */
    #port;

    sizeKey = 14;

    /**
     * @param {GlTimeline} glTl
     * @param {Anim} anim
     * @param {GlRect} parentRect
     */
    constructor(glTl, anim, parentRect, port)
    {
        super();
        this.#anim = anim;
        this.#glTl = glTl;
        this.#parentRect = parentRect;
        this.#port = port;

        this.init();
    }

    update()
    {
        if (this.#keyRects.length != this.#anim.keys.length) return this.init();

        for (let i = 0; i < this.#keyRects.length; i++)
        {
            const kr = this.#keyRects[i];
            if (this.#anim.keys[i].time == this.#glTl.view.cursorTime) this.#glTl.setColorRectSpecial(kr);
            else kr.setColor(1, 1, 1);

            kr.setPosition(this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset) - this.sizeKey / 2, (this.#parentRect.h / 2 - this.sizeKey / 2), -0.2);
        }

        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#dopeRects[i];
            if (kr)
            {
                kr.setPosition(this.#glTl.view.timeToPixel(this.#anim.keys[i].time - this.#glTl.view.offset), 0, -0.1);

                if (this.#anim.keys[i + 1])
                {
                    if (i == 0)
                    {
                        kr.setPosition(this.#glTl.view.timeToPixel(0 - this.#glTl.view.offset), 0);
                        kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time), this.#parentRect.h);
                    }
                    else
                        kr.setSize(this.#glTl.view.timeToPixel(this.#anim.keys[i + 1].time - this.#anim.keys[i].time), this.#parentRect.h);
                }
                else
                {
                    // after last
                    kr.setSize(this.#glTl.view.timeToPixel(this.#glTl.duration - this.#anim.keys[i].time), this.#parentRect.h);
                }
            }
        }
    }

    init()
    {
        this.dispose();
        for (let i = 0; i < this.#anim.keys.length; i++)
        {
            const kr = this.#glTl.rects.createRect({ "draggable": true });
            kr.setShape(13);
            kr.setSize(this.sizeKey, this.sizeKey);
            kr.setColor(1, 1, 1, 1);
            kr.setParent(this.#parentRect);
            this.#keyRects.push(kr);

            if (this.#port.uiAttribs.display == "bool" || this.#port.uiAttribs.increment == "integer")
            {
                const krDop = this.#glTl.rects.createRect({ "draggable": true });
                krDop.setSize(this.sizeKey, this.sizeKey);

                if (this.#port.uiAttribs.display == "bool")
                {
                    if (this.#anim.keys[i].value) krDop.setColor(0.6, 0.6, 0.6, 1);
                    else krDop.setColor(0.4, 0.4, 0.4, 1);
                }
                if (this.#port.uiAttribs.increment == "integer")
                {
                    if (i % 2 == 0) krDop.setColor(0.6, 0.6, 0.6, 1);
                    else krDop.setColor(0.4, 0.4, 0.4, 1);

                }

                krDop.setParent(this.#parentRect);
                this.#dopeRects.push(krDop);
            }

        }
        this.update();
    }

    dispose()
    {
        for (let i = 0; i < this.#keyRects.length; i++) this.#keyRects[i].dispose();
        this.#keyRects = [];
        for (let i = 0; i < this.#dopeRects.length; i++) this.#dopeRects[i].dispose();
        this.#dopeRects = [];
    }

}
