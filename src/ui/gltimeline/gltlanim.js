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
    #glRectTitle = null;

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
        this.#op = op;
        this.#port = port;

        this.#glRectTitle = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });

        this.#glRectTitle.setColor(0, 0, 0);

        this.#glRectTitle.on("mousedown", () =>
        {
            gui.patchView.focusOp(this.#op.id);
        });

        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);

        // this.#glRectKeysBg.setParent(this.#glRectTitle);

        this.#glTitle = new GlText(this.#glTl.texts, op.name + " - " + port.name || "unknown anim");
        this.#glTitle.setPosition(10, 0);
        this.#glTitle.setParentRect(this.#glRectTitle);

        this.#keys = new glTlKeys(glTl, anim, this.#glRectKeysBg);

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
            this.#glRectKeysBg.setColor(0.45, 0.45, 0.45);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#glRectTitle.setPosition(x, y, -0.5);
        this.#glRectKeysBg.setPosition(this.#glTl.titleSpace, y + 1);
    }

    setWidth(w)
    {
        this.width = w;
        this.#glRectTitle.setSize(this.#glTl.titleSpace, this.height - 1);
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
    }

    dispose()
    {

    }
}
