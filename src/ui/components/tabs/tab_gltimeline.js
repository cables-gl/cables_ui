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

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab("gl timeline", { "icon": "timeline", "infotext": "gl timeline" });
        tabs.addTab(this.#tab, true);
        gui.bottomTabPanel.show(true);

        // gui.maintabPanel.show(true);
        this.#tab.contentEle.innerHTML = "";
        const a = new glTimelineCanvas(gui.corePatch(), this.#tab.contentEle);
        this.#tab.activate();

        a.parentResized();
        userSettings.set("glTimelineOpened", true);

        gui.on(Gui.EVENT_RESIZE, () =>
        {
            a.glTimeline.resize();
            a.parentResized();
        });

        gui.on(Gui.EVENT_RESIZE_CANVAS, () =>
        {
            a.glTimeline.resize();
            a.parentResized();
        });

        this.selectInfoEl = document.createElement("span");
        this.selectInfoEl.innerHTML = "";
        this.selectInfoEl.id = "tlselectinfo";
        this.#tab.on("resize", () =>
        {
            a.glTimeline.resize();
        });

        this.#tab.on("onDeactivate", () =>
        {
            a.pause();
        });
        this.#tab.on("close", () =>
        {
            a.dispose();
        });

        this.#tab.on("onActivate", () =>
        {
            a.resume();
            a.parentResized();
        });

        this.#tab.addButton("+", () => { a.glTimeline.view.setZoomOffset(1.4, 0.5); });
        this.#tab.addButton("-", () => { a.glTimeline.view.setZoomOffset(0.6, 0.5); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-skip-back\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineRewindStart();
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-fast-forward\" style=\"transform:rotate(180deg)\"></span>", () =>
        {
            CABLES.CMD.TIMELINE.TimelineForward();
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

        this.#tab.on("resize", () =>
        {
            a.parentResized();
        });

        this.#tab.on("close", () =>
        {
            userSettings.set("glTimelineOpened", false);
        });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-left\"></span>", () => { a.glTimeline.view.scroll(-1); });
        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-right\"></span>", () => { a.glTimeline.view.scroll(1); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_previous\"></span>", () => { a.glTimeline.jumpKey(-1); });
        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_next\"></span>", () => { a.glTimeline.jumpKey(1); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-chart-spline\"></span>", () => { a.glTimeline.toggleGraphLayout(); });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-up\"></span>", () =>
        {
            a.glTimeline.view.maxVal -= 1;
            a.glTimeline.view.minVal += 1;
        });
        this.#tab.addButton("<span class=\"nomargin icon icon-arrow-down\"></span>", () =>
        {
            a.glTimeline.view.maxVal += 1;
            a.glTimeline.view.minVal -= 1;
        });

        this.#tab.addButton("<span class=\"nomargin icon icon-three-dots\"></span>", (e) =>
        {
            contextMenu.show(
                {
                    "items":
                        [
                            {
                                "title": "Delete Selected Keys",
                                "func": () => { a.glTimeline.deleteSelectedKeys(); }
                            },
                            {
                                "title": "Move Selected Keys to cursor",
                                "func": () =>
                                {
                                    a.glTimeline.moveSelectedKeys();
                                }
                            },
                            {
                                "title": "Set same time for selected keys",
                                "func": () =>
                                {
                                    a.glTimeline.setSelectedKeysTime();

                                }
                            },

                            {
                                "title": "fit into view",
                                "func": () =>
                                {
                                    a.glTimeline.zoomToFitSelection();
                                }
                            },
                        ]
                }, e.target);
        });

        this.#tab.addButtonSpacer();
        this.#tab.addButtonBarElement(this.selectInfoEl);
    }

    close()
    {
        this.#tab.remove();
        console.log(gui.bottomTabPanel);
    }
}
