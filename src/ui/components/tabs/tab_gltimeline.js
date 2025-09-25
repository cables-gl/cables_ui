import { logStack } from "cables/src/core/utils.js";
import { CmdTimeline } from "../../commands/cmd_timeline.js";
import defaultOps from "../../defaultops.js";
import { contextMenu } from "../../elements/contextmenu.js";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { GlTimeline } from "../../gltimeline/gltimeline.js";
import { glTimelineCanvas } from "../../gltimeline/gltimelinecanvas.js";
import Gui, { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";

export default class GlTimelineTab
{

    /** @type {Tab} */
    #tab;
    #splitter;
    #splitterRight;

    /** @type {glTimelineCanvas} */
    tlCanvas = null;

    /** @type {number} */
    #splitterPos = 100;
    #splitterPosRight = 100;

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

        this.#splitterPos = userSettings.get(GlTimeline.USERSETTING_SPLITTER_LEFT) || 200;
        this.#splitterPosRight = userSettings.get(GlTimeline.USERSETTING_SPLITTER_LEFT) || 200;

        tabs.on("resize", () =>
        {
            this.updateSize();
        });

        this.#tab.on("resize", () =>
        {
            this.updateSize();
        });

        this.#tab.on(Tab.EVENT_DEACTIVATE, () =>
        {
            if (this.tlCanvas) this.tlCanvas.pause();
        });

        this.#tab.on(Tab.EVENT_CLOSE, () =>
        {
            userSettings.set("glTimelineOpened", false);
        });

        this.#tab.on(Tab.EVENT_ACTIVATE, () =>
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
            this.tlCanvas.glTimeline.view.scaleValues(-0.3);
        }, ["button-left"]);

        this.#tab.addButton("<span id=\"zoomgraph2\" class=\"nomargin icon icon-chevrons-down-up info\" data-info=\"tlzoomgraph\"></span>", () =>
        {
            this.tlCanvas.glTimeline.view.scaleValues(0.3);
        }, ["button-right"]);

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-skip-back\"></span>", () =>
        {
            CmdTimeline.TimelineRewindStart();
        });
        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_previous info\" data-info=\"tlnextkey\">\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(-1); }, ["button-middle"]);

        this.#tab.addButton("<span class=\"nomargin icon icon-step-back\" ></span>", () =>
        {
            CmdTimeline.TimelineRewind();
        }, ["button-middle"]);

        this.#tab.addButton("<span id=\"timelineplay\" class=\"nomargin icon icon-play info\" data-info=\"tlplay\"></span>", () =>
        {
            gui.corePatch().timer.togglePlay();
            this.tlCanvas.glTimeline.updateIcons();
        }, ["button-middle"]);

        this.#tab.addButton("<span class=\"nomargin icon icon-step-forward\"></span>", () =>
        {
            CmdTimeline.TimelineForward();
        }, ["button-middle"]);

        this.#tab.addButton("<span class=\"nomargin icon icon-keyframe_next info\" data-info=\"tlnextkey\"></span>", () => { this.tlCanvas.glTimeline.jumpKey(1); }, ["button-right"]);
        this.#tab.addButtonSpacer();

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span id=\"togglegraph1\" class=\"nomargin icon info icon-chart-spline\" data-info=\"tltogglegraph\"></span>", () => { this.tlCanvas.glTimeline.toggleGraphLayout(); }, ["button-left", "button-active"]);
        this.#tab.addButton("<span id=\"togglegraph2\"  class=\"nomargin icon info icon-chart-gantt\" data-info=\"tltogglegraph\"></span>", () => { this.tlCanvas.glTimeline.toggleGraphLayout(); }, ["button-right"]);
        this.#tab.addButtonSpacer();

        // this.#tab.addButton("<span class=\"nomargin icon info icon-log-in-rot\" data-info=\"tlloopstart\"></span>", () =>
        // {
        // }, ["button-left"]);
        this.#tab.addButton("<span id=\"tlloop\" class=\"nomargin icon info icon-x\" data-info=\"tlloopdelete\"></span>", (e) =>
        {
            this.tlCanvas.glTimeline.toggleLoopArea();

        });

        // this.#tab.addButton("<span class=\"nomargin icon info icon-log-in\" data-info=\"tlloopend\"></span>", () =>
        // {
        //     this.tlCanvas.glTimeline.loopAreaStart = Math.min(this.tlCanvas.glTimeline.cursorTime, this.tlCanvas.glTimeline.loopAreaStart);
        //     this.tlCanvas.glTimeline.loopAreaEnd = Math.max(this.tlCanvas.glTimeline.cursorTime, this.tlCanvas.glTimeline.loopAreaStart);
        // }, ["button-right"]);
        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon info icon-diamond-plus\" data-info=\"tladdkey\"></span>", () =>
        {
            CmdTimeline.TimelineCreateKeyAtCursor();
        });
        this.#tab.addButton("<span id=\"autokeyframe\" class=\"nomargin icon info icon-keyframe-auto\" data-info=\"tlautokeyframe\"></span>", () =>
        {
            this.tlCanvas.glTimeline.toggleAutoKeyframe();
        }, ["button-active"]);

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

        this.#tab.addButton("<span id=\"autokeyframe\" class=\"nomargin icon info icon-minimize2\" data-info=\"tlfit\"></span>", () =>
        {
            this.tlCanvas.glTimeline.fit();
        });

        this.#tab.addButtonSpacer();

        this.#tab.addButton("<span class=\"nomargin icon icon-chevron-down info\" data-info=\"tltoggle\"></span>", () =>
        {
            gui.bottomTabPanel.toggle();
        }, ["timelineminimize"]);

        /// //////

        this.tlCanvas = new glTimelineCanvas(gui.corePatch(), this.#tab.contentEle, this);

        userSettings.set(GlTimeline.USERSETTING_TL_OPENED, true);

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

        this.#splitterRight = document.createElement("div");
        this.#splitterRight.classList.add("splitter");
        this.#splitterRight.classList.add("splitterTimeline");
        this.#splitterRight.style.right = this.#splitterPosRight + "px";
        this.#splitterRight.addEventListener("pointerdown", this.resizeRendererRight.bind(this), { "passive": false });
        this.#tab.contentEle.appendChild(this.#splitterRight);

        this.tlCanvas.glTimeline.updateIcons();
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
        if (this.resizing) { console.log("resizing..."); return; }
        if (!this.tlCanvas) { console.log("no tlcanv"); return; }

        const parentEle = this.#tab.contentEle;
        if (parentEle.clientWidth == 0)
        {
            if (this.tlCanvas.disposed) return;
            setTimeout(this.updateSize.bind(this), 100);
            return;
        }
        userSettings.set(GlTimeline.USERSETTING_SPLITTER_LEFT, this.#splitterPos);
        userSettings.set(GlTimeline.USERSETTING_SPLITTER_RIGHT, this.#splitterPosRight);
        this.resizing = true;
        this.tlCanvas.glTimeline.resize(true);
        this.tlCanvas.canvas.style.left = this.#splitterPos + "px";

        const w = parentEle.clientWidth - this.#splitterPos - this.#splitterPosRight;
        this.tlCanvas.setSize(w, parentEle.clientHeight);
        console.log("stttt", w, parentEle.clientWidth, this.#splitterPos, this.#splitterPosRight, parentEle.clientHeight);
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

    resizeRendererRight(ev)
    {
        ev.preventDefault();
        window.splitpane.bound = true;
        const mm = (e) =>
        {
            gui.pauseInteractionSplitpanes();
            let x = e.clientX;
            if (x === undefined && e.touches && e.touches.length > 0) x = e.touches[0].clientX;
            if (x < 10)x = 10;

            const parentEle = this.#tab.contentEle;
            this.#splitterRight.style.right = (parentEle.clientWidth - x) + "px";
            this.#splitterPosRight = Math.round((parentEle.clientWidth - x));
            this.updateSize();
            e.preventDefault();
        };
        const f = mm.bind(this);

        document.addEventListener("pointermove", f);
        window.splitpane.listeners.push(f);
    }
}
