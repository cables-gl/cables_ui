import defaultOps from "../../defaultops.js";
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
        this.#tab = new Tab("gl timeline", { "icon": "timeline", "infotext": "gl timeline", "closable": false });
        gui.bottomTabPanel.show(true);

        tabs.addTab(this.#tab, true);
        this.#tab.activate();
        this.#tab.contentEle.innerHTML = "";

        this.#splitterPos = userSettings.get("timeline_titles_width") || 100;

        tabs.on("resize", () =>
        {
            this.updateSize();
        });

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
            userSettings.set("glTimelineOpened", false);
        });

        this.#tab.on("onActivate", () =>
        {
            if (this.tlCanvas) this.tlCanvas.resume();
            this.updateSize();
        });
        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-chevrons-left-right info\" data-info=\"tlzoomtime\"></span>", () => { this.tlCanvas.glTimeline.view.setZoomOffset(1.4, 0.5); }, ["button-left"]);
        this.#tab.addButton("<span class=\"nomargin icon icon-chevrons-right-left left-right info\" data-info=\"tlzoomtime\"></span>", () => { this.tlCanvas.glTimeline.view.setZoomOffset(0.6, 0.5); }, ["button-right"]);

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span id=\"zoomgraph1\" class=\"nomargin icon icon-chevrons-up-down info\" data-info=\"tlzoomgraph\"></span>", () =>
        {
            this.tlCanvas.glTimeline.view.scale(-0.3);
        }, ["button-left"]);

        this.#tab.addButton("<span id=\"zoomgraph2\" class=\"nomargin icon icon-chevrons-down-up info\" data-info=\"tlzoomgraph\"></span>", () =>
        {
            this.tlCanvas.glTimeline.view.scale(0.3);
        }, ["button-right"]);

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-skip-back\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineRewindStart();
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-fast-forward\" style=\"transform:rotate(180deg)\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineRewind();
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_previous info\" data-info=\"tlnextkey\">\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(-1); });
        const buttonPlay = this.#tab.addButton("<span class=\"nomargin icon icon-play info\" data-info=\"tlplay\"></span>", () =>
        {
            gui.corePatch().timer.togglePlay();

            if (gui.corePatch().timer.isPlaying())buttonPlay.innerHTML = "<span class=\"nomargin icon icon-pause\"></span>";
            else buttonPlay.innerHTML = "<span class=\"nomargin icon icon-play\"></span>";
        });
        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_next info\" data-info=\"tlnextkey\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(1); });

        this.#tab.addButton("<span class=\"nomargin icon icon-fast-forward\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineForward();
        });

        this.#tab.addButtonSpacer();

        // this.#tab.addButton("<span class=\"nomargin icon icon-arrow-left\"></span>", () => { this.tlCanvas.glTimeline.view.scroll(-1); });
        // this.#tab.addButton("<span class=\"nomargin icon icon-arrow-right\"></span>", () => { this.tlCanvas.glTimeline.view.scroll(1); });

        // this.#tab.addButtonSpacer();
        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span id=\"togglegraph1\" class=\"nomargin icon info icon-chart-spline\" data-info=\"tltogglegraph\"></span>", () => { this.tlCanvas.glTimeline.toggleGraphLayout(); }, ["button-left", "button-active"]);
        this.#tab.addButton("<span id=\"togglegraph2\"  class=\"nomargin icon info icon-chart-gantt\" data-info=\"tltogglegraph\"></span>", () => { this.tlCanvas.glTimeline.toggleGraphLayout(); }, ["button-right"]);

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-diamond-plus\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineCreateKeyAtCursor();
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-settings\"></span>", () =>
        {
            let ops = gui.corePatch().getOpsByObjName(defaultOps.defaultOpNames.TimelineConfig);
            if (ops.length == 0)
            {
                gui.patchView.addOp(defaultOps.defaultOpNames.TimelineConfig, { "onopadd": (op) =>
                {
                    gui.patchView.focusOpAnim(op.id);
                    gui.patchView.centerSelectOp(op.id);
                    gui.opParams.show(op);
                } });
            }
            else
            {
                gui.patchView.focusOpAnim(ops[0].id);
                gui.patchView.centerSelectOp(ops[0].id);
                gui.opParams.show(ops[0]);
            }

        });

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

        this.selectInfoEl = document.createElement("span");
        this.selectInfoEl.innerHTML = "";
        this.selectInfoEl.id = "tlselectinfo";
        this.#tab.addButtonBarElement(this.selectInfoEl);

        this.#tab.addButton("<span class=\"nomargin icon icon-chevron-down info\" data-info=\"tltoggle\"></span>", () =>
        {
            gui.bottomTabPanel.toggle();
        }, ["timelineminimize"]);

        /// //////

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

        this.#splitter = document.createElement("div");
        this.#splitter.classList.add("splitter");
        this.#splitter.classList.add("splitterTimeline");
        this.#splitter.style.left = this.#splitterPos + "px";
        this.#splitter.addEventListener("pointerdown", this.resizeRenderer.bind(this), { "passive": false });
        this.#tab.contentEle.appendChild(this.#splitter);
        this.updateSize();

    }

    close()
    {
        this.#tab.remove();
        gui.glTimeline.dispose();
        gui.glTimeline = null;
        if (this.tlCanvas) this.tlCanvas.dispose();
        this.tlCanvas = null;
    }

    updateSize()
    {
        if (this.resizing) { console.log("rezising..."); return; }
        if (!this.tlCanvas) { console.log("no tlcanv"); return; }

        const parentEle = this.#tab.contentEle;
        if (parentEle.clientWidth == 0)
        {
            if (this.tlCanvas.disposed) return;
            setTimeout(this.updateSize.bind(this), 100);
            return;
        }
        this.resizing = true;
        this.tlCanvas.glTimeline.resize();
        this.tlCanvas.canvas.style.left = this.#splitterPos + "px";
        this.tlCanvas.setSize(parentEle.clientWidth - this.#splitterPos, parentEle.clientHeight);
        this.resizing = false;

        userSettings.set("timeline_titles_width", this.#splitterPos);
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
            if (x < 10)x = 10;

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
