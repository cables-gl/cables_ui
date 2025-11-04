import { Events, Logger } from "cables-shared-client";
import { map } from "cables/src/core/utils.js";
import GlText from "../gldraw/gltext.js";
import GlRect from "../gldraw/glrect.js";
import { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";
import { glTlRuler } from "./gltlruler.js";

/**
 * gltl ruler display
 *
 * @export
 * @class glTlRuler
 * @extends {Events}
 */
export class glTlHead extends Events
{

    /** @type {GlTimeline} */
    #glTl;
    pointerDown = false;
    #glRectBg;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("glTlHead");
        this.#glTl = glTl;
        this.y = 30;
        this.height = 50;

        this.#glRectBg = this.#glTl.rectsNoScroll.createRect({ "name": "ruler bgrect", "draggable": false, "interactive": true });
        this.#glRectBg.setSize(222, this.height);
        this.#glRectBg.setColor(0.25, 0.25, 0.25, 1);
        this.#glRectBg.setPosition(0, this.y, -0.9);

        this.#glRectBg.on(GlRect.EVENT_POINTER_MOVE, (_x, _y, event) =>
        {
            if (!this.pointerDown) return;
            if (this.#glTl.loopAreaDrag.isDragging) return;
            this.#glTl.removeKeyPreViz();

            gui.corePatch().timer.pause();
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX) + this.#glTl.view.offset));

        });

        this.#glRectBg.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            if (CABLES.UI.showDevInfos)
                gui.showInfo("visible time" + this.#glTl.view.visibleTime);
        });

        this.#glRectBg.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
        });

        this.#glRectBg.on(GlRect.EVENT_POINTER_DOWN, (event, _r, _x, _y) =>
        {
            this.pointerDown = true;
            gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(event.offsetX) + this.#glTl.view.offset));
        });

        this.#glRectBg.on(GlRect.EVENT_POINTER_UP, () =>
        {
            this.pointerDown = false;
        });

        this.ruler = new glTlRuler(this.#glTl, this.#glRectBg);

        this.update();
    }

    /**
     * @param {number} x
     */
    setTimeFromPixel(x)
    {
        gui.corePatch().timer.setTime(this.#glTl.snapTime(this.#glTl.view.pixelToTime(x) + this.#glTl.view.offset));
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this.#glRectBg.setPosition(x, y);
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        this.width = w;
        this.#glRectBg.setSize(this.width, this.height);
    }

    isHovering()
    {
        return this.#glRectBg.isHovering();
    }

    update()
    {
        this.ruler.update();
    }
}
