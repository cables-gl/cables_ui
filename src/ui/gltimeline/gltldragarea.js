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
    #rectSizeRight;

    #width = 222;
    #handleWidth = 4;

    /** @type {GlTimeline} */
    #glTl = null;

    #dragStart = 0;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl, parent, interactive)
    {
        super();
        this._log = new Logger("tl dragarea");
        this.#glTl = glTl;
        this.height = 24;

        this.#rectBar = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });
        this.#rectBar.setSize(222, this.height);
        this.#rectBar.setColor(0.5, 0.5, 0.5, 1);
        this.#rectBar.setParent(parent);
        this.#rectBar.setColorHover(0.65, 0.65, 0.65, 1);

        this.#rectSizeLeft = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectSizeLeft.setSize(this.#handleWidth, this.height);
        this.#rectSizeLeft.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeLeft.setParent(parent);

        this.#rectSizeRight = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectSizeRight.setSize(this.#handleWidth, this.height);
        this.#rectSizeRight.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeRight.setParent(parent);

    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    set(x, y, width, height = this.height)
    {
        this.#width = width;
        this.#rectBar.setSize(width, height);
        this.#rectSizeRight.setSize(this.#handleWidth, height);
        this.#rectSizeLeft.setSize(this.#handleWidth, height);
        this.#rectBar.setPosition(x, y, 0);
        this.#rectSizeRight.setPosition(x - this.#handleWidth, y, 0);
        this.#rectSizeLeft.setPosition(x + this.#width, y, 0);
    }

}
