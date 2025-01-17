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
    /**
     * @param {GlTimeline} glTl
     * @param {Anim} anim
     * @param {GlRect} parentRect
     */
    constructor(glTl, anim, parentRect)
    {
        super();
        this._anim = anim;
        this._glTl = glTl;
        this._parentRect = parentRect;

        this.keys = [];
        this.init();
    }

    init()
    {
        this.dispose();

        for (let i = 0; i < this._anim.keys.length; i++)
        {
            const kr = this._glTl.rects.createRect({ "draggable": true });
            kr.setSize(10, 10);
            kr.setShape(6);
            kr.setParent(this._parentRect);
            kr.setColor(1, 1, 1, 1);
            kr.setPosition(this._anim.keys[i].time * 12, 10, 0.1);

            this.keys.push(kr);
        }
    }

    dispose()
    {
        for (let i = 0; i < this.keys.length; i++) this.keys[i].dispose();
        this.keys = [];
    }

    setIndex(i)
    {
        // this._glRectBg.setPosition(0, i * 31 + 50);
    }
}
