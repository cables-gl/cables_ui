import { Events } from "cables-shared-client";
import GlText from "../gldraw/gltext.js";
import glTlKeys from "./gltlkeys.js";
import GlTimeline from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import { gui } from "../gui.js";

/**
 * gltimeline anim
 *
 * @export
 * @class glTlAnim
 * @extends {Events}
 */
export default class glTlAnim extends Events
{
    #anim = null;
    #op = null;
    #glRectKeysBg = null;
    #glRectBg = null;
    #glTitle = null;
    height = 30;

    /**
     * @param {GlTimeline} glTl
     * @param {Anim} anim
     * @param {Op} op
     * @param {Port} port
    */
    constructor(glTl, anim, op, port)
    {
        super();

        this.#anim = anim;

        this._glTl = glTl;

        this.#glRectBg = this._glTl.rects.createRect({ "draggable": false });
        this.#glRectBg.setSize(150, this.height);
        this.#glRectBg.setColor(0, 0, 0, 1);

        /**
         * @type {GlRect}
         */
        this.#glRectKeysBg = this._glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(1000, this.height);
        this.#glRectKeysBg.setColor(0.2, 0.2, 0.9, 0);
        this.#glRectKeysBg.setPosition(150, 0);
        this.#glRectKeysBg.setParent(this.#glRectBg);

        /**
         * @type GlText
         */
        this.#glTitle = new GlText(this._glTl.texts, op.name + " - " + port.name || "unknown anim");
        this.#glTitle.setParentRect(this.#glRectBg);

        /**
         * @type glTlKeys
         */
        this.keys = new glTlKeys(glTl, anim, this.#glRectKeysBg);
        this.#op = op;
        this._port = port;

        /*
         * op.on("uiParamPanel", () =>
         * {
         *     if (gui.patchView.isCurrentOp(this.op))
         *     {
         *         this.#glTitle.setColor(1, 0, 0, 1);
         *     }
         * });
         */

        anim.on("onChange", () =>
        {
            this.keys.init();
        });

        this.updateColor();
    }

    update()
    {
        this.updateColor();
    }

    updateColor()
    {
        this.#glTitle.setColor(1, 1, 1, 1);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3, 0);

        if (gui.patchView.isCurrentOp(this.#op))
        {
            this.#glTitle.setColor(0.5, 1, 1, 1);
            this.#glRectKeysBg.setColor(0.4, 0.4, 0.4, 0.1);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#glRectBg.setPosition(x, y);

        console.log("setpos", x, y);
        console.log("glRectBg.absY", this.#glRectBg.absY);

        console.log("glRectKeysBg.absY", this.#glRectKeysBg.absY);

    }
}
