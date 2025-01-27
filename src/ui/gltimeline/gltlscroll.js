import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";

export default class glTlScroll extends Events
{

    /** @type {GlRect} */
    #mainRect = null;

    /** @type {GlRect} */
    #rectBar = null;

    /**
     * @param {any} GlTimeline
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this._glTl = glTl;
        this.height = 24;

        this.#mainRect = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#mainRect.setColor(0.5, 0.3, 0.3, 1);

        this.#rectBar = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectBar.setSize(200, this.height);
        this.#rectBar.setColor(0.3, 0.9, 0.3, 1);
        this.#rectBar.setParent(this.#mainRect);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#mainRect.setPosition(x, y);
    }

    update()
    {

    }
}
