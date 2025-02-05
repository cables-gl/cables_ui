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

    /** @type {Array<CABLES.Anim>} */
    #anims = [];

    /** @type {Array<CABLES.Op>} */
    #ops = [];

    /** @type {GlRect} */
    #glRectKeysBg = null;

    /** @type {GlRect} */
    #glRectTitle = null;

    /** @type {GlText} */
    #glTitle = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<glTlKeys>} */
    #keys = [];

    /** @type {Array<CABLES.Port>} */
    #ports = [];

    width = 222;
    height = 30;

    /** @type {Array<Object >} */
    #disposeRects = [];

    #options = {};

    /**
     * @param {GlTimeline} glTl
     * @param {Array<Port>} port
     * @param {Object} options
    */
    constructor(glTl, ports, options = {})
    {
        super();

        this.#options = options;

        this.#glTl = glTl;

        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
        this.#disposeRects.push(this.#glRectKeysBg);

        for (let i = 0; i < ports.length; i++)
        {
            this.#anims[i] = ports[i].anim;
            this.#ops[i] = ports[i].op;
            this.#ports[i] = ports[i];
            this.#keys[i] = new glTlKeys(glTl, this.#ports[i].anim, this.#glRectKeysBg, this.#ports[i], this.#options);

            const keys = this.#keys[i];

            ports[i].anim.on("onChange", () =>
            {

                keys.init();
            });
        }
        this.#glRectTitle = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });
        this.#glRectTitle.setColor(0, 0, 0);
        this.#glRectTitle.on("mousedown", () =>
        {
            gui.patchView.focusOp(this.#ops[0].id);
        });
        this.#disposeRects.push(this.#glRectTitle);

        let title = "???";
        if (ports[0]) title = ports[0].op.name + " - " + ports[0].name;
        if (ports.length > 1)title = ports.length + " anims";

        this.#glTitle = new GlText(this.#glTl.texts, title || "unknown anim");

        this.#glTitle.setPosition(10, 0);
        this.#glTitle.setParentRect(this.#glRectTitle);
        this.#disposeRects.push(this.#glTitle);

        this.updateColor();

    }

    get anims()
    {
        return this.#anims;
    }

    update()
    {
        this.updateColor();

        let minVal = -2;
        let maxVal = 2;

        for (let j = 0; j < this.#keys.length; j++)
        {
            const anim = this.#keys[j].anim;

            for (let i = 0; i < anim.keys.length; i++)
            {
                minVal = Math.min(minVal, anim.keys[i].value);
                maxVal = Math.max(maxVal, anim.keys[i].value);
            }
        }

        minVal -= Math.abs(minVal * 0.5);
        maxVal += Math.abs(maxVal * 0.5);

        for (let i = 0; i < this.#keys.length; i++)
        {
            this.#keys[i].update(minVal, maxVal);
        }
    }

    updateColor()
    {
        this.#glTitle.setColor(0.7, 0.7, 0.7, 1);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3);

        if (gui.patchView.isCurrentOp(this.#ops[0]))
        {
            this.#glTitle.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
            this.#glRectKeysBg.setColor(0.35, 0.35, 0.35);
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

    setHeight(h)
    {
        this.height = h;
        this.setWidth(this.width);
        this.update();
    }

    setWidth(w)
    {
        this.width = w;
        this.#glRectTitle.setSize(this.#glTl.titleSpace, this.height - 1);
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
    }

    dispose()
    {
        for (let i = 0; i < this.#disposeRects.length; i++) this.#disposeRects[i].dispose();
        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].dispose();

        this.#disposeRects = [];
        this.#keys = [];
        if (this.#glRectTitle) this.#glRectTitle = this.#glRectTitle.dispose();
    }
}
