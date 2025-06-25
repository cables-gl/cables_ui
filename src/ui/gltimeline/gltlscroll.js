import { Events, Logger } from "cables-shared-client/index.js";
import GlRect from "../gldraw/glrect.js";
import { glTlDragArea } from "./gltldragarea.js";
import { gui } from "../gui.js";
import GlText from "../gldraw/gltext.js";
import { GlTimeline } from "./gltimeline.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";

export class glTlScroll extends Events
{

    /** @type {GlRect} */
    #bgRect = null;

    /** @type {glTlDragArea} */
    #dragBar = null;

    /** @type {GlRect} */
    #glRectCursor;

    height = 24;
    #width = 222;
    #dragStart = 0;
    #glTl;
    #lastdown = 0;

    /** @type {GlRect[]} */
    #indicatorRects = [];

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("gltlscroll");
        this.#glTl = glTl;

        this.#bgRect = this.#glTl.rects.createRect({ "name": "scroll bg", "draggable": false, "interactive": true });
        this.#bgRect.setColor(0.2, 0.2, 0.2, 1);
        this.#bgRect.setSize(this.#width, this.height);

        this.#dragBar = new glTlDragArea(glTl, this.#bgRect, true, this.#glTl.rects);

        this.#dragBar.on(glTlDragArea.EVENT_MOVE, (e) =>
        {
            console.log("text", e);
            // const perc = (x + this.#dragBar.getWidth() / 2) / this.#width;
            const f = (e.posX - e.delta) / this.#width * this.#glTl.duration;
            //     this.#glTl.view.scrollTo((perc * this.#glTl.duration));
            this.#glTl.view.scrollTo(f);

        });
        this.#dragBar.on(glTlDragArea.EVENT_SCALE, (e) =>
        {

            console.log("scale.........", this.#dragBar.getWidth());
            this.#glTl.view.setZoomLength(e.origWidth * e.factor / this.#width * this.#glTl.duration);
            this.update();

        });

        // this.#bgRect.on(GlRect.EVENT_POINTER_DOWN, (e, r, x, y) =>
        // {
        //     if (this.#lastdown != 0 && performance.now() - this.#lastdown < 250) this.showAll();

        //     console.log("text", performance.now() - this.#lastdown);
        //     this.#lastdown = performance.now();

        //     console.log("${}POINTER DOWN");
        //     const perc = (x + this.#dragBar.getWidth() / 2) / this.#width;
        //     this.#glTl.view.scrollTo((perc * this.#glTl.duration));
        // });

        // this.#bgRect.on(GlRect.EVENT_DRAGSTART, (a, x, y) =>
        // {
        //     this.#dragStart = x;
        // });

        // this.#bgRect.on(GlRect.EVENT_DRAG, (a, offX, c, button, event, x, y) =>
        // {
        //     const perc = (this.#dragStart + offX - this.#dragBar.getWidth() / 2) / this.#width;
        //     this.#glTl.view.scrollTo((perc * this.#glTl.duration));
        // });

        this.#glRectCursor = this.#glTl.rects.createRect({ "draggable": false, "interactive": false });
        this.#glRectCursor.setSize(1, this.height);
        this.#glRectCursor.setColor(0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1);
        this.#glRectCursor.setPosition(0, 0, -0.1);
        this.#glRectCursor.setParent(this.#bgRect);

        this.update();
    }

    showAll()
    {
        this.#glTl.view.scrollTo(0);
        this.#glTl.view.setZoomLength(this.#glTl.duration);
        this.updateIndicators();
    }

    updateIndicators()
    {
        const steps = Math.floor((this.#width || 10) / 10);
        const stepSeconds = this.#glTl.duration / steps;
        this.#indicatorRects.length = Math.max(this.#indicatorRects.length, steps);

        const ports = gui.corePatch().getAllAnimPorts();

        for (let i = 0; i < this.#indicatorRects.length; i++)
        {
            let found = false;
            for (let j = 0; j < ports.length; j++)
                if (ports[j].anim.hasKeyframesBetween(stepSeconds * i, stepSeconds * (i + 1)))
                {
                    found = true;
                    break;
                }

            if (!this.#indicatorRects[i]) this.#indicatorRects[i] = this.#glTl.rects.createRect({ "interactive": false, "draggable": false, "name": "scroll indicator" });

            if (found)
            {
                const x = stepSeconds * i * this.#glTl.view.pixelPerSecond;
                this.#indicatorRects[i].setPosition(x, this.height / 3, -0.1);
                // this.#indicatorRects[i].setShape(GlRectInstancer.SHAPE_RHOMB);
                this.#indicatorRects[i].setSize(stepSeconds * this.#glTl.view.pixelPerSecond / 3, this.height / 3);

                this.#indicatorRects[i].setColor(0.5, 0.5, 0.5, 1);
                this.#indicatorRects[i].setParent(this.#bgRect);
            }
            else
            {
                this.#indicatorRects[i].setSize(0, 0);
            }

        }

    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#bgRect.setPosition(x, y, -0.9);
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this.#width = w;
        this.#bgRect.setSize(this.#width, this.height);
    }

    update()
    {
        const pixelVisible = this.#glTl.view.visibleTime * this.#glTl.view.pixelPerSecond;
        let x = this.#glTl.view.offset * this.#glTl.view.pixelPerSecond;
        let cx = gui.corePatch().timer.getTime() * this.#glTl.view.pixelPerSecond;

        this.#dragBar.set(x, 0, -0.1, pixelVisible);
        this.#glRectCursor.setPosition(cx, 0);
        this.updateIndicators();
    }

    isHovering()
    {
        return this.#bgRect.isHovering();
    }
}
