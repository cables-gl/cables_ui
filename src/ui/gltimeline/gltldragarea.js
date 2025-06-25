import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";

export class glTlDragArea extends Events
{

    /** @type {GlRect} */
    rectMove = null;

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
    #dragStartX = 0;

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
        this.rectMove = rectInst.createRect({ "draggable": true, "interactive": interactive, "name": "dragarea middle" });
        this.rectMove.setSize(this.#width, this.height);
        if (parent) this.rectMove.setParent(parent);
        this.rectMove.setColorHover(0.65, 0.55, 0.65, 1);
        this.rectMove.setColor(0.4, 0.4, 0.4, 1);

        this.#rectSizeLeft = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        if (parent) this.#rectSizeLeft.setParent(parent);
        this.#rectSizeLeft.setColor(0.3, 0.3, 0.3, 1);

        this.#rectSizeRight = rectInst.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.3, 0.3, 0.3, 1);
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

        this.rectMove.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.#dragStartX = e.offsetX;
            console.log("dragstart area");
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.rectMove.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            let offpixel = this.#dragStartX - e.offsetX;

            this.emitEvent("move", offpixel);

            this.isDragging = true;

        });

        this.rectMove.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragEND area");
            this.isDragging = false;
        });
        /// ////

        this.rectMove.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.#dragStartX = e.offsetX;
            console.log("dragstart area");
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.rectMove.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            let offpixel = this.#dragStartX - e.offsetX;

            this.emitEvent("move", offpixel);

            this.isDragging = true;

        });

        this.rectMove.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragEND area");
            this.isDragging = false;
        });
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} _width
     * @param {number} _height
     */
    set(x, y, z, _width, _height = this.height)
    {
        this.#width = _width;
        this.height = _height;

        if (isNaN(this.#width) || isNaN(this.height)) return;

        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);

        this.rectMove.setSize(this.#width, this.height);
        this.rectMove.setPosition(x, y, z);

        this.#rectSizeLeft.setPosition(x - this.#handleWidth, y, z);
        this.#rectSizeRight.setPosition(x + this.#width, y, z);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setColor(r, g, b, a = 1)
    {
        this.rectMove.setColorHover(1, 1, 1, 1);
        this.#rectSizeLeft.setColorHover(1, 1, 1, 1);
        this.#rectSizeRight.setColorHover(1, 1, 1, 1);

        this.rectMove.setColor(r, g, b, a);
        this.#rectSizeLeft.setColor(r, g, b, a * 0.7);
        this.#rectSizeRight.setColor(r, g, b, a * 0.7);
    }

    getWidth()
    {
        return this.#width;
    }

    get isHovering()
    {
        const h = this.rectMove.isHovering() || this.#rectSizeLeft.isHovering() || this.#rectSizeRight.isHovering();
        return h;
    }

    get x()
    {
        return this.rectMove.x;
    }

}
