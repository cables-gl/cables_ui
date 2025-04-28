import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { GlTimeline } from "./gltimeline.js";
import { glTlDragArea } from "./gltldragarea.js";
import { gui } from "../gui.js";

export class glTlScroll extends Events
{

    /** @type {GlRect} */
    #mainRect = null;

    /** @type {glTlDragArea} */
    #dragBar = null;

    /** @type {GlRect} */
    #glRectCursor;

    height = 24;
    #width = 222;
    #dragStart = 0;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlRuler");
        this._glTl = glTl;

        this.#mainRect = this._glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#mainRect.setColor(0.2, 0.2, 0.2, 1);
        this.#mainRect.setSize(this.#width, this.height);
        this.#mainRect.setPosition(0, 0, -0.5);

        this.#dragBar = new glTlDragArea(glTl, this.#mainRect);
        // this.#dragBar.on("drag", (off) =>
        // {
        //     const pixelVisible = this._glTl.view.visibleTime * this._glTl.view.pixelPerSecond;
        //     console.log(this._glTl.view.pixelPerSecond, off / this.#width);

        //     this._glTl.view.scrollTo(((off / this.#width) * this._glTl.view.visibleTime), 0);
        //     this.update();
        // });

        this.#mainRect.on(GlRect.EVENT_POINTER_DOWN, (e, r, x, y) =>
        {
            console.log(e, x);
            const perc = (x - this._glTl.titleSpace) / this.#width;

            this._glTl.view.scrollTo((perc * this._glTl.duration));

        });

        this.#mainRect.on(GlRect.EVENT_DRAGSTART, (a, x, y) =>
        {
            this.#dragStart = x;
        });

        // this.emitEvent(GlRect.EVENT_DRAG, this, this.#dragOffsetX, this.#dragOffsetY, button, event, x, y);

        this.#mainRect.on(GlRect.EVENT_DRAG, (a, offX, c, button, event, x, y) =>
        {
            const perc = (this.#dragStart + offX - this._glTl.titleSpace) / this.#width;

            this._glTl.view.scrollTo((perc * this._glTl.duration));

        });

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

        const pixelVisible = this._glTl.view.visibleTime * this._glTl.view.pixelPerSecond;

        let x = this._glTl.view.offset * this._glTl.view.pixelPerSecond;

        this.#dragBar.set(x, 0, pixelVisible);

        let cx = gui.corePatch().timer.getTime() * this._glTl.view.pixelPerSecond;
        this.#glRectCursor.setPosition(cx, 0);

    }

    isHovering()
    {
        return this.#mainRect.isHovering();
    }
}
