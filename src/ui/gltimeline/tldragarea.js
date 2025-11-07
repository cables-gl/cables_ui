import { Events, Logger } from "cables-shared-client/index.js";
import { Patch } from "cables";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { glTlRuler } from "./tlruler.js";
import { gui } from "../gui.js";
import { GuiText } from "../text.js";
import undo from "../utils/undo.js";

export class TlDragArea extends Events
{
    static EVENT_START = "start";
    static EVENT_END = "end";
    static EVENT_MOVE = "move";
    static EVENT_RIGHT = "scale";
    static EVENT_LEFT = "left";

    /** @type {GlRect} */
    #rectMove = null;

    /** @type {GlRect} */
    #rectLeft = null;

    /** @type {GlRect} */
    #rectRight = null;

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
        this.#rectMove = rectInst.createRect({ "name": "dragarea middle", "draggable": true, "interactive": true });
        this.#rectMove.setSize(this.#width, this.height);
        if (parent) this.#rectMove.setParent(parent);

        this.#rectLeft = rectInst.createRect({ "name": "dragarea left", "draggable": true, "interactive": true });
        this.#rectLeft.setSize(this.#handleWidth, this.height);
        if (parent) this.#rectLeft.setParent(parent);

        this.#rectRight = rectInst.createRect({ "name": "dragarea right", "draggable": true, "interactive": true });
        this.#rectRight.setSize(this.#handleWidth, this.height);
        if (parent) this.#rectRight.setParent(parent);

        this.#rectMove.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            gui.showInfo(GuiText.tlhover_keys_dragarea);
        });

        this.#rectMove.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.emitEvent(TlDragArea.EVENT_START);
            this.#dragStartX = e.offsetX;
            this.#glTl.predragSelectedKeys();
            this.#delta = e.offsetX - this.#rectMove.x;
            this.isDragging = true;
        });

        this.#rectMove.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            let offpixel = this.#dragStartX - e.offsetX;
            this.emitEvent(TlDragArea.EVENT_MOVE, { "offpixel": offpixel, "x": e.offsetX, "delta": this.#delta });
            this.isDragging = true;
        });

        this.#rectMove.on(GlRect.EVENT_DRAGEND, () =>
        {
            this.isDragging = false;
            this.emitEvent(TlDragArea.EVENT_END);
        });

        /// ////

        this.#rectRight.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.emitEvent(TlDragArea.EVENT_START);
            this.#dragStartX = e.offsetX;
            this.#dragStartWidth = this.#rectMove.w;
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.#rectRight.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.isDragging = true;
            const off = e.offsetX - this.#dragStartX;
            const factor = Math.max(0.000001, (e.offsetX - this.#rectMove.x) / this.#dragStartWidth);

            this.emitEvent(TlDragArea.EVENT_RIGHT, { "factor": factor, "x": e.offsetX, "origWidth": this.#dragStartWidth });
            this.set(this.#rectMove.x, this.#rectMove.y, this.#rectMove.z, this.#dragStartWidth * factor, this.height);
        });

        this.#rectRight.on(GlRect.EVENT_DRAGEND, () =>
        {
            this.emitEvent(TlDragArea.EVENT_END);
            this.isDragging = false;
        });

        /// ////

        this.#rectLeft.on(GlRect.EVENT_DRAGSTART, (_rect, _x, _y, button, e) =>
        {
            this.emitEvent(TlDragArea.EVENT_START);
            this.#dragStartX = e.offsetX;
            this.#dragStartWidth = this.#rectMove.w;
            this.#glTl.predragSelectedKeys();
            this.isDragging = true;
        });

        this.#rectLeft.on(GlRect.EVENT_DRAG, (rect, offx, offy, button, e) =>
        {
            this.isDragging = true;

            const off = this.#dragStartX - e.offsetX;
            const factor = Math.max(0.000001, (e.offsetX - this.#rectMove.x) / this.#dragStartWidth);

            this.emitEvent(TlDragArea.EVENT_LEFT, { "factor": factor, "x": e.offsetX, "origWidth": this.#dragStartWidth });

            // this.set(this.#rectMove.x, this.#rectMove.y, this.#rectMove.z, this.#rectRight.x - this.#rectLeft.x, this.height);
        });

        this.#rectLeft.on(GlRect.EVENT_DRAGEND, () =>
        {
            console.log("dragEND area");
            this.isDragging = false;
            this.emitEvent(TlDragArea.EVENT_END);
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

        this.#rectLeft.setSize(this.#handleWidth, this.height);
        this.#rectRight.setSize(this.#handleWidth, this.height);

        this.#rectMove.setSize(this.#width, this.height);
        this.#rectMove.setPosition(x, y, z);

        this.#rectLeft.setPosition(x - this.#handleWidth, y, z);
        this.#rectRight.setPosition(x + this.#width, y, z);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setColor(r, g, b, a = 1)
    {
        this.#rectMove.setColorHover(r, g, b, 1);
        this.#rectLeft.setColorHover(r, g, b, 1);
        this.#rectRight.setColorHover(r, g, b, 1);

        this.#rectMove.setColor(r, g, b, a * 0.7);
        this.#rectLeft.setColor(r, g, b, a * 0.5);
        this.#rectRight.setColor(r, g, b, a * 0.5);
    }

    getWidth()
    {
        return this.#width;
    }

    get isHovering()
    {
        const h = this.#rectMove.isHovering() || this.#rectLeft.isHovering() || this.#rectRight.isHovering();
        return h;
    }

    get x()
    {
        return this.#rectMove.x;
    }

}
