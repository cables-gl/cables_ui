import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { glTlDragArea } from "./gltldragarea.js";
import { gui } from "../gui.js";
import GlText from "../gldraw/gltext.js";
import { GlTimeline } from "./gltimeline.js";

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
    #glTl;
    #lastdown = 0;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("gltlscroll");
        this.#glTl = glTl;

        this.#mainRect = this.#glTl.rects.createRect({ "draggable": true, "interactive": true });
        this.#mainRect.setColor(0.2, 0.2, 0.2, 1);
        this.#mainRect.setSize(this.#width, this.height);

        this.#dragBar = new glTlDragArea(glTl, this.#mainRect, false);

        this.#mainRect.on(GlRect.EVENT_POINTER_DOWN, (e, r, x, y) =>
        {
            if (this.#lastdown != 0 && performance.now() - this.#lastdown < 250) this.showAll();

            console.log("text", performance.now() - this.#lastdown);
            this.#lastdown = performance.now();

            console.log("${}POINTER DOWN");
            const perc = (x + this.#dragBar.getWidth() / 2) / this.#width;
            this.#glTl.view.scrollTo((perc * this.#glTl.duration));
        });

        this.#mainRect.on(GlRect.EVENT_DRAGSTART, (a, x, y) =>
        {
            this.#dragStart = x;
        });

        this.#mainRect.on(GlRect.EVENT_DRAG, (a, offX, c, button, event, x, y) =>
        {
            const perc = (this.#dragStart + offX - this.#dragBar.getWidth() / 2) / this.#width;
            this.#glTl.view.scrollTo((perc * this.#glTl.duration));

        });

        this.#glRectCursor = this.#glTl.rects.createRect({ "draggable": false, "interactive": false });
        this.#glRectCursor.setSize(1, this.height);
        this.#glRectCursor.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
        this.#glRectCursor.setPosition(0, 0);
        this.#glRectCursor.setParent(this.#mainRect);

        this.update();
    }

    showAll()
    {
        console.log("showall!!!!!!");
        this.#glTl.view.scrollTo(0);
        this.#glTl.view.setZoomLength(this.#glTl.duration);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#mainRect.setPosition(x, y, -0.9);
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this.#width = w;
        this.#mainRect.setSize(this.#width, this.height);
    }

    update()
    {

        const pixelVisible = this.#glTl.view.visibleTime * this.#glTl.view.pixelPerSecond;

        let x = this.#glTl.view.offset * this.#glTl.view.pixelPerSecond;

        this.#dragBar.set(x, 0, pixelVisible);

        let cx = gui.corePatch().timer.getTime() * this.#glTl.view.pixelPerSecond;

        this.#glRectCursor.setPosition(cx, 0);

    }

    isHovering()
    {
        return this.#mainRect.isHovering();
    }
}
