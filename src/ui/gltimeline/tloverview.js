import { Events, Logger } from "cables-shared-client/index.js";
import { clamp } from "cables/src/core/utils.js";
import GlRect from "../gldraw/glrect.js";
import { TlDragArea } from "./tldragarea.js";
import Gui, { gui } from "../gui.js";
import { GlTimeline } from "./gltimeline.js";
import { GuiText } from "../text.js";

// overview
export class tlOverview extends Events
{

    /** @type {GlRect} */
    #bgRect = null;

    /** @type {TlDragArea} */
    #dragBar = null;

    /** @type {GlRect} */
    #glRectCursor;

    /** @type {GlRect} */
    #glRectSelection;

    height = 24;
    #width = 222;
    #glTl;

    /** @type {GlRect[]} */
    #indicatorRects = [];
    #rulerBg;

    /**
     * @param {GlTimeline} glTl
     */
    constructor(glTl)
    {
        super();
        this._log = new Logger("tlOverview");
        this.#glTl = glTl;

        this.#bgRect = this.#glTl.rectsNoScroll.createRect({ "name": "scroll bg", "draggable": false, "interactive": true });
        this.#bgRect.setSize(this.#width, this.height);

        this.#rulerBg = this.#glTl.rectsNoScroll.createRect({ "name": "scroll rulesbg", "draggable": false, "interactive": false });
        this.#rulerBg.setPosition(0, 0, 0.1);
        this.#rulerBg.setSize(this.#width, this.height);

        this.#dragBar = new TlDragArea(glTl, this.#bgRect, this.#glTl.rectsNoScroll);

        this.#bgRect.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            gui.showInfo(GuiText.tlhover_scroll);

        });

        gui.on(Gui.EVENT_THEMECHANGED, () =>
        {
            this.updateColors();
            this.update();
            this.updateIndicators();
        }),

        this.#dragBar.on(TlDragArea.EVENT_MOVE, (e) =>
        {
            const f = (e.x - e.delta) / this.#width * this.#glTl.duration;
            this.#glTl.view.scrollTo(f);
        });

        this.#dragBar.on(TlDragArea.EVENT_RIGHT, (e) =>
        {
            this.#glTl.view.setZoomLength(e.origWidth * e.factor / this.#width * this.#glTl.duration);
            this.update();
        });

        // this.#glRectSelection = this.#glTl.rectsNoScroll.createRect({ "name": "scroll selection", "draggable": false, "interactive": false });
        // this.#glRectSelection.setColor(1, 1, 0, 0.3);
        // this.#glRectSelection.setPosition(0, 0, -0.09);
        // this.#glRectSelection.setSize(0, 0);
        // this.#glRectSelection.setParent(this.#bgRect);

        this.#glRectCursor = this.#glTl.rectsNoScroll.createRect({ "name": "cursor", "draggable": false, "interactive": false });
        this.#glRectCursor.setSize(1, this.height);
        this.#glRectCursor.setPosition(0, 0, -0.1);
        this.#glRectCursor.setParent(this.#bgRect);

        this.updateColors();
        this.update();
    }

    updateColors()
    {

        this.#glRectCursor.setColorArray(gui.theme.colors_timeline.cursor);
        this.#dragBar.setColorArray(gui.theme.colors_timeline.overview_bar || [1, 1, 1, 1]);
        this.#bgRect.setColorArray(gui.theme.colors_timeline.overview_background);
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
        const stepSeconds = this.#glTl.duration / (steps - 2);
        this.#indicatorRects.length = Math.max(this.#indicatorRects.length, steps);

        const ports = gui.corePatch().getAllAnimPorts();

        for (let i = 0; i < this.#indicatorRects.length; i++)
        {
            let selected = false;
            let found = false;
            for (let j = 0; j < ports.length; j++)
            {
                if (ports[j].anim.hasKeyframesBetween(stepSeconds * i, stepSeconds * (i + 1)))
                {
                    found = true;

                    for (let ki = 0; ki < ports[j].anim.keys.length; ki++)
                    {
                        if (ports[j].anim.keys[ki].time >= stepSeconds * i && ports[j].anim.keys[ki].time < stepSeconds * (i + 1))
                        {
                            if (this.#glTl.isKeySelected(ports[j].anim.keys[ki]))
                            {
                                selected = true;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
            if (!this.#indicatorRects[i]) this.#indicatorRects[i] = this.#glTl.rectsNoScroll.createRect({ "interactive": false, "draggable": false, "name": "scroll indicator" + i });

            if (found)
            {
                const x = stepSeconds * i * this.#glTl.view.pixelPerSecond;
                this.#indicatorRects[i].setPosition(x, this.height / 3, -0.12);
                this.#indicatorRects[i].setSize(this.height / 3, this.height / 3);
                this.#indicatorRects[i].setShape(GlRect.SHAPE_RHOMB);

                if (selected)
                    this.#indicatorRects[i].setColorArray(gui.theme.colors_timeline.key_selected);
                else
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
        // this.ruler.update();

    }

    update()
    {
        // const pixelVisible = (this.#glTl.view.visibleTime / this.#glTl.duration) * (this.#width / this.#glTl.view.pixelPerSecond);

        const pixelVisible = (this.#glTl.view.visibleTime) * this.#glTl.view.pixelPerSecond;
        // console.log("this.#glTl.view.offset", this.#glTl.view.offset);
        let x = this.#glTl.view.offset * this.#glTl.view.pixelPerSecond;
        let cx = Math.ceil(gui.corePatch().timer.getTime() * this.#glTl.view.pixelPerSecond);

        this.#dragBar.set(x, 0, -0.1, pixelVisible);

        this.#glRectCursor.setPosition(Math.max(0, cx - 1), 0);

        this.updateIndicators();

        const bounds = this.#glTl.getSelectedKeysBoundsTime();

        if (this.#glTl.getNumSelectedKeys() > 0)
        {
            // this.#glRectSelection.setPosition(bounds.min * this.#glTl.view.pixelPerSecond, 0);
            // this.#glRectSelection.setSize((bounds.max - bounds.min) * this.#glTl.view.pixelPerSecond + 2, this.height);
        }
        // this.ruler.update();
    }

    isHovering()
    {
        return this.#bgRect.isHovering();
    }
}
