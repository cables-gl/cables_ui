import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";

export class glTlDragArea extends Events
{

    /** @type {GlRect} */
    #rectMiddle = null;

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
    #dragStartX;

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
        console.log("new dragarea,", interactive);

        rectInst = rectInst || this.#glTl.rects;
        this.#rectMiddle = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectMiddle.setSize(this.#width, this.height);
        if (parent) this.#rectMiddle.setParent(parent);
        this.#rectMiddle.setColorHover(0.65, 0.55, 0.65, 1);
        this.#rectMiddle.setColor(0.4, 0.4, 0.4, 1);

        this.#rectSizeLeft = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        if (parent) this.#rectSizeLeft.setParent(parent);

        this.#rectSizeRight = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.4, 0.4, 0.4, 1);
        if (parent) this.#rectSizeRight.setParent(parent);

        // this.#rectSizeRight.on(GlRect.EVENT_DRAG, () =>
        // {
        //     console.log("drag");
        //     this.isDragging = true;

        // });
        // this.#rectSizeLeft.on(GlRect.EVENT_DRAG, () =>
        // {
        //     console.log("drag");
        //     this.isDragging = true;

        // });

        /// ////

        this.#rectMiddle.on(GlRect.EVENT_DRAGSTART, (_rect, x) =>
        {
            this.#dragStartX = x;
            console.log("dragstart");

            this.isDragging = true;
        });

        this.#rectMiddle.on(GlRect.EVENT_DRAG, () =>
        {
            console.log("drag");
            this.isDragging = true;

        });

        this.#rectMiddle.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragend");

            this.isDragging = false;
        });
        /// ///////
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

        this.#rectMiddle.setSize(this.#width, this.height);
        this.#rectMiddle.setPosition(x, y, -0.9);

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
        this.#rectMiddle.setColorHover(1, 1, 1, 1);
        this.#rectSizeLeft.setColorHover(1, 1, 1, 1);
        this.#rectSizeRight.setColorHover(1, 1, 1, 1);

        this.#rectMiddle.setColor(r, g, b, a);
        this.#rectSizeLeft.setColor(r, g, b, a * 0.7);
        this.#rectSizeRight.setColor(r, g, b, a * 0.7);
    }

    getWidth()
    {
        return this.#width;
    }

    get isHovering()
    {
        const h = this.#rectMiddle.isHovering() || this.#rectSizeLeft.isHovering() || this.#rectSizeRight.isHovering();
        return h;
    }

    get x()
    {

        return this.#rectMiddle.x;

    }

}
