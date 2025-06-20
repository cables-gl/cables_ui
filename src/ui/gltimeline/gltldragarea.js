import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";

export class glTlDragArea extends Events
{

    /** @type {GlRect} */
    #rectBar = null;

    /** @type {GlRect} */
    #rectSizeLeft = null;

    /** @type {GlRect} */
    #rectSizeRight = null;

    #width = 222;
    #handleWidth = 8;

    /** @type {GlTimeline} */
    #glTl = null;

    height = 24;
    isDragging = false;

    /**
     * @param {GlTimeline} glTl
     * @param {GlRect} parent
     * @param {boolean} interactive
     * @param {GlRectInstancer} rectInst
     */
    constructor(glTl, parent, interactive, rectInst)
    {
        super();
        this._log = new Logger("tl dragarea");
        this.#glTl = glTl;

        rectInst = rectInst || this.#glTl.rects;
        this.#rectBar = rectInst.createRect({ "draggable": false, "interactive": interactive });
        this.#rectBar.setSize(this.#width, this.height);
        if (parent) this.#rectBar.setParent(parent);
        this.#rectBar.setColorHover(0.65, 0.55, 0.65, 1);
        this.#rectBar.setColor(0.4, 0.4, 0.4, 1);

        this.#rectSizeLeft = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        if (parent) this.#rectSizeLeft.setParent(parent);

        this.#rectSizeRight = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.4, 0.4, 0.4, 1);
        if (parent) this.#rectSizeRight.setParent(parent);

        this.#rectSizeRight.on(GlRect.EVENT_DRAGSTART, () =>
        {
            console.log("dragstart");

            this.isDragging = true;
        });

        this.#rectSizeRight.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragend");

            this.isDragging = false;
        });

        this.#rectSizeRight.on(GlRect.EVENT_DRAG, () =>
        {
            console.log("drag");
            this.isDragging = true;

        });

        this.#rectBar.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            console.log("yhover", this.isHovering);

        });
        this.#rectSizeLeft.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            console.log("yhover", this.isHovering);

        });
        this.#rectSizeRight.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            console.log("yhover", this.isHovering);

        });
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} _width
     * @param {number} _height
     */
    set(x, y, _width, _height = this.height)
    {
        this.#width = _width;
        this.height = _height;

        if (isNaN(this.#width) || isNaN(this.height)) return;

        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);

        this.#rectBar.setSize(this.#width, this.height);
        this.#rectBar.setPosition(x, y, -0.9);

        this.#rectSizeLeft.setPosition(x - this.#handleWidth, y, -0.9);
        this.#rectSizeRight.setPosition(x + this.#width, y, -0.9);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setColor(r, g, b, a = 1)
    {
        this.#rectBar.setColor(r, g, b, a);
        this.#rectSizeLeft.setColor(r, g, b, a * 0.7);
        this.#rectSizeRight.setColor(r, g, b, a * 0.7);
    }

    getWidth()
    {
        return this.#width;
    }

    get isHovering()
    {
        const h = this.#rectBar.isHovering() || this.#rectSizeLeft.isHovering() || this.#rectSizeRight.isHovering();
        return h;
    }

    get x()
    {

        return this.#rectBar.x;

    }

}
