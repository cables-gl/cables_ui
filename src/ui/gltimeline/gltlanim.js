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

    /** @type {GlRect} */
    #glRectKeysBg = null;

    /** @type {GlRect} */
    #glRectBg = null;

    /** @type {GlText} */
    #glTitle = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {glTlKeys} */
    #keys = null;

    /** @type {CABLES.Port} */
    #port = null;

    width = 222;
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
        this.#glTl = glTl;

        this.#glRectBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectBg.setSize(this.#glTl.titleSpace, this.height);
        this.#glRectBg.setColor(0, 0, 0);

        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(this.width, this.height - 1);
        this.#glRectKeysBg.setPosition(150, 0);
        this.#glRectKeysBg.setColor(0.2, 0.2, 0.9);
        this.#glRectKeysBg.setParent(this.#glRectBg);

        this.#glTitle = new GlText(this.#glTl.texts, op.name + " - " + port.name || "unknown anim");
        this.#glTitle.setParentRect(this.#glRectBg);

        this.#keys = new glTlKeys(glTl, anim, this.#glRectKeysBg);
        this.#op = op;
        this.#port = port;

        anim.on("onChange", () =>
        {
            this.#keys.init();
        });

        this.updateColor();
    }

    update()
    {
        this.updateColor();
        this.#keys.update();
    }

    updateColor()
    {
        this.#glTitle.setColor(1, 1, 1, 1);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3);

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

    setWidth(w)
    {
        this.width = w;
        this.#glRectBg.setSize(this.width, this.height);
        this.#glRectKeysBg.setSize(this.width, this.height - 1);
    }

    dispose()
    {

    }
}
