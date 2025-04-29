import { contextMenu } from "../../elements/contextmenu.js";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { glTimelineCanvas } from "../../gltimeline/gltimelinecanvas.js";
import Gui, { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";

export default class GlTimelineTab
{

    /** @type {Tab} */
    #tab;
    #splitter;

    /** @type {glTimelineCanvas} */
    tlCanvas = null;

    /** @type {number} */
    #splitterPos = 100;

    resizing = false;

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab("gl timeline", { "icon": "timeline", "infotext": "gl timeline" });
        gui.bottomTabPanel.show(true);

        tabs.addTab(this.#tab, true);
        this.#tab.activate();
        this.#tab.contentEle.innerHTML = "";
        this.tlCanvas = new glTimelineCanvas(gui.corePatch(), this.#tab.contentEle, this);

        userSettings.set("glTimelineOpened", true);

        gui.on(Gui.EVENT_RESIZE, () =>
        {
            this.updateSize();
        });

        gui.on(Gui.EVENT_RESIZE_CANVAS, () =>
        {
            this.updateSize();
        });

        this.selectInfoEl = document.createElement("span");
        this.selectInfoEl.innerHTML = "";
        this.selectInfoEl.id = "tlselectinfo";

        this.#splitter = document.createElement("div");
        this.#splitter.classList.add("splitter");
        this.#splitter.classList.add("splitterTimeline");
        this.#splitter.style.left = "100px";
        this.#splitter.addEventListener("pointerdown", this.resizeRenderer.bind(this), { "passive": false });
        this.#tab.contentEle.appendChild(this.#splitter);

        this.#tab.on("resize", () =>
        {
            this.updateSize();

        });

        this.#tab.on("onDeactivate", () =>
        {
            if (this.tlCanvas) this.tlCanvas.pause();
        });
        this.#tab.on("close", () =>
        {
            if (this.tlCanvas) this.tlCanvas.dispose();
        });

        this.#tab.on("onActivate", () =>
        {
            if (this.tlCanvas) this.tlCanvas.resume();
            this.updateSize();
        });

        this.#tab.addButton("+", () => { this.tlCanvas.glTimeline.view.setZoomOffset(1.4, 0.5); });
        this.#tab.addButton("-", () => { this.tlCanvas.glTimeline.view.setZoomOffset(0.6, 0.5); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-skip-back\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineRewindStart();
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-fast-forward\" style=\"transform:rotate(180deg)\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineRewind();
        });

        const buttonPlay = this.#tab.addButton("<span class=\"nomargin icon icon-play\"></span>", () =>
        {
            gui.corePatch().timer.togglePlay();

            if (gui.corePatch().timer.isPlaying())buttonPlay.innerHTML = "<span class=\"nomargin icon icon-pause\"></span>";
            else buttonPlay.innerHTML = "<span class=\"nomargin icon icon-play\"></span>";
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-fast-forward\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineForward();
        });

        this.#tab.on("close", () =>
        {
            userSettings.set("glTimelineOpened", false);
        });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-left\"></span>", () => { this.tlCanvas.glTimeline.view.scroll(-1); });
        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-right\"></span>", () => { this.tlCanvas.glTimeline.view.scroll(1); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_previous\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(-1); });
        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_next\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(1); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-chart-spline\"></span>", () => { this.tlCanvas.glTimeline.toggleGraphLayout(); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-list-plus\"></span>", () =>
        {
            this.tlCanvas.glTimeline.view.scale(-0.3);
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-list-minus\"></span>", () =>
        {
            this.tlCanvas.glTimeline.view.scale(0.3);
        });

        this.#tab.addButtonSpacer();
        this.#tab.addButton("<span class=\"nomargin icon icon-three-dots\"></span>", (e) =>
        {
            contextMenu.show(
                {
                    "items":
                        [
                            {
                                "title": "Delete Selected Keys",
                                "func": () => { this.tlCanvas.glTimeline.deleteSelectedKeys(); }
                            },
                            {
                                "title": "Move Selected Keys to cursor",
                                "func": () =>
                                {
                                    this.tlCanvas.glTimeline.moveSelectedKeys();
                                }
                            },
                            {
                                "title": "Set same time for selected keys",
                                "func": () =>
                                {
                                    this.tlCanvas.glTimeline.setSelectedKeysTime();

                                }
                            },

                            {
                                "title": "fit into view",
                                "func": () =>
                                {
                                    this.tlCanvas.glTimeline.zoomToFitSelection();
                                }
                            },
                        ]
                }, e.target);
        });

        this.#tab.addButtonSpacer();
        this.#tab.addButtonBarElement(this.selectInfoEl);
        this.updateSize();

    }

    close()
    {
        this.#tab.remove();
        console.log(gui.bottomTabPanel);
    }

    updateSize()
    {
        if (this.resizing) return;
        if (!this.tlCanvas) return;

        this.resizing = true;
        const parentEle = this.#tab.contentEle;
        if (parentEle.clientWidth == 0)
        {

            console.log("delay resize");
            setTimeout(this.updateSize.bind(this), 100);
        }
        console.log("sp", this.#splitterPos);
        this.tlCanvas.glTimeline.resize();
        this.tlCanvas.canvas.style.left = this.#splitterPos + "px";
        this.tlCanvas.setSize(parentEle.clientWidth - this.#splitterPos, parentEle.clientHeight);
        this.resizing = false;
    }

    resizeRenderer(ev)
    {
        ev.preventDefault();
        window.splitpane.bound = true;
        const mm = (e) =>
        {
            gui.pauseInteractionSplitpanes();
            let x = e.clientX;
            if (x === undefined && e.touches && e.touches.length > 0) x = e.touches[0].clientX;

            this.#splitter.style.left = x + "px";
            this.#splitterPos = Math.round(x);
            this.updateSize();
            e.preventDefault();
        };
        const f = mm.bind(this);

        document.addEventListener("pointermove", f);
        window.splitpane.listeners.push(f);
    }
}
