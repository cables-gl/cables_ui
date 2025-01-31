import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import GlTimeline from "./gltimeline.js";

export default class glTlScroll extends Events
{

    /** @type {GlRect} */
    #mainRect = null;

    /** @type {GlRect} */
    #rectBar = null;

    /** @type {GlRect} */
    #rectSizeLeft = null;

    /** @type {GlRect} */
    #rectSizeRight;

    /** @type {GlRect} */
    #glRectCursor;

    #width = 222;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this._glTl = glTl;
        this.height = 24;

        this.#mainRect = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#mainRect.setColor(0.2, 0.2, 0.2, 1);
        this.#mainRect.setSize(this.#width, this.height);
        this.#mainRect.setPosition(0, 0, -0.5);

        this.#rectBar = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectBar.setSize(222, this.height);
        this.#rectBar.setColor(0.5, 0.5, 0.5, 1);
        this.#rectBar.setParent(this.#mainRect);

        this.#rectSizeLeft = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectSizeLeft.setSize(3, this.height);
        this.#rectSizeLeft.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeLeft.setParent(this.#mainRect);

        this.#rectSizeRight = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#rectSizeRight.setSize(3, this.height);
        this.#rectSizeRight.setColor(0.4, 0.4, 0.4, 1);
        this.#rectSizeRight.setParent(this.#mainRect);

        this.#glRectCursor = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#glRectCursor.setSize(1, this.height);
        this.#glRectCursor.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
        this.#glRectCursor.setPosition(0, 0);
        this.#glRectCursor.setParent(this.#mainRect);

        this.update();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#mainRect.setPosition(x, y, -0.5);
    }

    setWidth(w)
    {
        this.#width = w;
        this.#mainRect.setSize(this.#width, this.height);

    }

    update()
    {
        const pixelPerSecond = (this.#width - this._glTl.titleSpace) / this._glTl.duration;
        const visibleTime = this._glTl.pixelToTime(this.#width - this._glTl.titleSpace);

        const pixelVisible = (visibleTime) * pixelPerSecond;

        let x = this._glTl.offset * pixelPerSecond;

        this.#rectBar.setPosition(x, 0);
        this.#rectBar.setSize(pixelVisible, this.height);
        this.#rectSizeLeft.setPosition(x, 0);
        this.#rectSizeRight.setPosition(x + pixelVisible, 0);

        let cx = gui.corePatch().timer.getTime() * pixelPerSecond;
        this.#glRectCursor.setPosition(cx, 0);

    }
}
