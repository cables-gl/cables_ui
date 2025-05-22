import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";

export class glTlDragArea extends Events
{

    /** @type {GlRect} */
    #rectBar = null;

    /** @type {GlRect} */
    #rectSizeLeft = null;

    /** @type {GlRect} */
    #rectSizeRight = null;

    #width = 222;
    #handleWidth = 4;

    /** @type {GlTimeline} */
    #glTl = null;

    height = 24;

    /**
     * @param {GlTimeline} glTl
     * @param {GlRect} parent
     * @param {boolean} interactive
     */
    constructor(glTl, parent, interactive)
    {
        super();
        this._log = new Logger("tl dragarea");
        this.#glTl = glTl;

        this.#rectBar = this.#glTl.rects.createRect({ "draggable": false, "interactive": interactive });
        this.#rectBar.setSize(this.#width, this.height);
        this.#rectBar.setColor(0.5, 0.5, 0.5, 1);
        this.#rectBar.setParent(parent);
        this.#rectBar.setColorHover(0.65, 0.55, 0.65, 1);

        this.#rectSizeLeft = this.#glTl.rects.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        this.#rectSizeLeft.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeLeft.setParent(parent);

        this.#rectSizeRight = this.#glTl.rects.createRect({ "draggable": true, "interactive": interactive });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeRight.setParent(parent);
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
        this.#rectBar.setPosition(x, y, -0.1);

        this.#rectSizeLeft.setPosition(x - this.#handleWidth, y, -0.1);
        this.#rectSizeRight.setPosition(x + this.#width, y, -0.0);
    }

    getWidth()
    {
        return this.#width;
    }
}
