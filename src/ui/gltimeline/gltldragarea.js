import { Events, Logger } from "cables-shared-client/index.js";
import { Patch } from "cables";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { glTlRuler } from "./gltlruler.js";
import { gui } from "../gui.js";

export class glTlDragArea extends Events
{
    static EVENT_MOVE = "move";
    static EVENT_RIGHT = "scale";
    static EVENT_LEFT = "left";

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

    /** @type {number} */
    height = 24;

    /** @type {boolean} */
    isDragging = false;

    /** @type {number} */
    #dragStartX = 0;

    /** @type {number} */
    #dragStartWidth;

    /** @type {number} */
    #delta;

    /**
     * @param {GlTimeline} glTl
     * @param {GlRect} parent
     * @param {GlRectInstancer} rectInst
     */
    constructor(glTl, parent, rectInst)
    {
        super();
        this._log = new Logger("tl dragarea");
        this.#glTl = glTl;

        rectInst = rectInst || this.#glTl.rects;
        this.rectMove = rectInst.createRect({ "name": "dragarea middle", "draggable": true, "interactive": true });
        this.rectMove.setSize(this.#width, this.height);
        this.rectMove.setColorHover(0.65, 0.65, 0.65, 1);
        this.rectMove.setColor(0.4, 0.4, 0.4, 1);
        if (parent) this.rectMove.setParent(parent);

        this.#rectSizeLeft = rectInst.createRect({ "name": "dragarea left", "draggable": true, "interactive": true });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        this.#rectSizeLeft.setColor(0.3, 0.3, 0.3, 1);
        if (parent) this.#rectSizeLeft.setParent(parent);

        this.#rectSizeRight = rectInst.createRect({ "name": "dragarea right", "draggable": true, "interactive": true });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.3, 0.3, 0.3, 1);
        if (parent) this.#rectSizeRight.setParent(parent);

        /// ////
        this.glRectBg = this.#glTl.rectsNoScroll.createRect({ "name": "ruler bgrect", "draggable": false, "interactive": true });
        this.glRectBg.setSize(222, this.height);
        this.glRectBg.setColor(0.25, 0.25, 0.25, 1);
        this.glRectBg.setPosition(0, 0, -0.9);
        this.ruler = new glTlRuler(glTl, this.glRectBg);

        this.rectMove.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.#dragStartX = e.offsetX;
            this.#glTl.predragSelectedKeys();
            this.#delta = e.offsetX - this.rectMove.x;
            this.isDragging = true;
        });

        this.rectMove.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            let offpixel = this.#dragStartX - e.offsetX;

            this.emitEvent(glTlDragArea.EVENT_MOVE, { "offpixel": offpixel, "x": e.offsetX, "delta": this.#delta });

            this.isDragging = true;

        });

        this.rectMove.on(GlRect.EVENT_DRAGEND, () =>
        {
            this.isDragging = false;
        });

        /// ////

        this.#rectSizeRight.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.#dragStartX = e.offsetX;
            this.#dragStartWidth = this.rectMove.w;
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.#rectSizeRight.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.isDragging = true;
            const off = e.offsetX - this.#dragStartX;
            const factor = Math.max(0.000001, (e.offsetX - this.rectMove.x) / this.#dragStartWidth);

            // let newPos = this.#dragStartX + off;
            // const newPosTime = this.#glTl.snapTime(this.#glTl.view.pixelScreenToTime(newPos));
            // newPos = this.#glTl.view.timeToPixelScreen(newPosTime);

            this.emitEvent(glTlDragArea.EVENT_RIGHT, { "factor": factor, "x": e.offsetX, "origWidth": this.#dragStartWidth });
            this.rectMove.setSize(e.offsetX - this.rectMove.x, this.rectMove.h);

            // this.#rectSizeRight.setPosition(newPos, this.#rectSizeRight.y);
        });

        this.#rectSizeRight.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragEND area");
            this.isDragging = false;
        });

        /// ////

        this.#rectSizeLeft.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.#dragStartX = e.offsetX;
            this.#dragStartWidth = this.rectMove.w;
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.#rectSizeLeft.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.isDragging = true;

            this.emitEvent(glTlDragArea.EVENT_LEFT, { "x": e.offsetX, "origWidth": this.#dragStartWidth });
        });

        this.#rectSizeLeft.on(GlRect.EVENT_DRAGEND, () =>
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
        this.rectMove.setColorHover(r, g, b, 0.7);
        this.#rectSizeLeft.setColorHover(r, g, b, 0.7);
        this.#rectSizeRight.setColorHover(r, g, b, 0.7);

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
