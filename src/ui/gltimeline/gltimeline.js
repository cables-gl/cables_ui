import { Events, Logger, ele } from "cables-shared-client";
import { Anim, AnimKey, Port, Timer, Patch, Op } from "cables";
import { FpsCounter } from "cables-corelibs";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { TlAnimLine } from "./tlanimline.js";
import { tlOverview } from "./tloverview.js";
import { tlView } from "./tlview.js";
import Gui, { gui } from "../gui.js";
import { notify, notifyError, notifyWarn } from "../elements/notification.js";
import { userSettings } from "../components/usersettings.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import GlSplineDrawer from "../gldraw/glsplinedrawer.js";
import GlText from "../gldraw/gltext.js";
import GlTextWriter from "../gldraw/gltextwriter.js";
import undo from "../utils/undo.js";
import GlRect from "../gldraw/glrect.js";
import GlSpline from "../gldraw/glspline.js";
import SpreadSheetTab from "../components/tabs/tab_spreadsheet.js";
import uiconfig from "../uiconfig.js";
import { TlKeys } from "./tlkeys.js";
import { TlDragArea as GlDragArea } from "./tldragarea.js";
import { contextMenu } from "../elements/contextmenu.js";
import defaultOps from "../defaultops.js";
import { patchStructureQuery } from "../components/patchstructurequery.js";
import { UiOp } from "../core_extend_op.js";
import { tlHead } from "./tltimehead.js";
import { DomEvents, CssClassNames } from "../theme.js";
import { GuiText } from "../text.js";

/**
 * @typedef TlConfig
 * @property {Number} fps
 * @property {Boolean} [fadeInFrames]
 * @property {Boolean} [showBeats]
 * @property {String} [displayUnits]
 * @property {Boolean} [restrictToFrames]
 */

/**
 * gl timeline
 *
 * @export
 * @class GlTimeline
 * @extends {Events}
 */
export class GlTimeline extends Events
{
    static CLIP_VAR_PREFIX = "_clip";

    static USERSETTING_LAYOUT = "tl_layout";
    static USERSETTING_TL_OPENED = "tl_opened";
    static USERSETTING_SPLITTER_LEFT = "tl_split_left";
    static USERSETTING_SPLITTER_RIGHT = "tl_split_right";
    static USERSETTING_UNITS = "tl_units";
    static USERSETTING_GRAPH_SELECTMODE = "tl_graphSelectMode";
    static USERSETTING_AUTO_KEYFRAMES = "tl_keyframeAutoCreate";

    static DISPLAYUNIT_SECONDS = 0;
    static DISPLAYUNIT_FRAMES = 1;
    static DISPLAYUNIT_BEATS = 2;

    static EVENT_MOUSEMOVE = "mousemove";
    static EVENT_KEYSELECTIONCHANGE = "keySelectionChange";
    static EVENT_LAYOUTCHANGE = "layoutchanged";

    #log = new Logger("gltimeline");

    #lastDragX = Number.MAX_SAFE_INTEGER;
    #lastDragY = Number.MAX_SAFE_INTEGER;
    #selectModeEl;
    graphSelectMode = true;
    keyframeAutoCreate = true;

    #paramLastInputValue = 0.25;
    #paramLastInputMove = 1;

    /** @type {GlTextWriter} */
    texts = null;

    /** @type {GlTextWriter} */
    textsNoScroll = null;

    /** @type {GlSplineDrawer} */
    splines;

    /** @type {GlRectInstancer} */
    #rects = null;

    /** @type {GlRectInstancer} */
    #rectsNoScroll;

    /** @type {GlRectInstancer} */
    #rectsOver = null;

    /** @type {} */
    ruler = null;

    /** @type {tlOverview} */
    scroll = null;

    /** @type {Array<TlAnimLine>} */
    #tlAnims = [];

    /** @type {GlRect} */
    cursorVertLineRect;

    /** @type {GlRect} */
    cursorNewKeyVis;

    displayUnits = GlTimeline.DISPLAYUNIT_SECONDS;

    /** @type {tlView} */
    view = null;
    needsUpdateAll = "";

    static LAYOUT_LINES = 0;
    static LAYOUT_GRAPHS = 1;
    #layout = GlTimeline.LAYOUT_LINES;

    /** @type {Array<AnimKey>} */
    #selectedKeys = [];

    /** @type {GlRect} */
    #rectSelect;

    /** @type {object} */
    selectRect = null;

    hoverKeyRect = null;
    disposed = false;

    #oldhtml = "";

    /** @type {CglContext} */
    #cgl = null;
    buttonForPanning = 2;
    toParamKeys = null;

    loopAreaStart = 0;
    loopAreaEnd = 0;

    /** @type {TlConfig} */
    cfg = CABLES.timelineConfig || {
        "fps": 30,
        "fadeInFrames": true,
        "restrictToFrames": true
    };

    #selOpsStr = "";
    #lastXnoButton = 0;
    #lastYnoButton = 0;

    /** @type {Anim[]} */
    #selectedKeyAnims = [];
    #focusRuler = false;
    #focusScroll = false;
    #elKeyParamPanel;
    #elTimeDisplay;

    #oldSize = -1;
    #perfFps = new FpsCounter();
    #filterString = "";

    /** @type {GlText} */
    #cursorText;
    #cursorTextBgRect;
    #cursorY = 30;
    #rectLoopArea;
    #rectHoverKey;

    /** @type {GlDragArea} */
    selectedKeysDragArea = null;

    /** @type {GlDragArea} */
    loopAreaDrag = null;

    /** @type {HTMLElement} */
    tlTimeScrollContainer;
    #clipboardKeys;
    #spacePressed = false;
    #cursor;

    /** @type {HTMLElement} */
    #elInfoOverlay;
    #elInfoOverlayTimeout;
    #undoSelection;

    /**
     * @param {CglContext} cgl
    */
    constructor(cgl)
    {
        super();

        GlTimeline.COLOR_BEZ_HANDLE = gui.theme.colors_types.num;

        this.#cgl = cgl;
        this.view = new tlView(this);

        this.#layout = userSettings.get(GlTimeline.USERSETTING_LAYOUT) || GlTimeline.LAYOUT_LINES;
        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this.textsNoScroll = new GlTextWriter(cgl, { "name": "textnoscroll", "initNum": 1000 });
        this.#rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });
        this.#rectsNoScroll = new GlRectInstancer(cgl, { "name": "gltl top rects", "allowDragging": true });
        this.#rectsOver = new GlRectInstancer(cgl, { "name": "gltl rectsOver", "allowDragging": true });

        this.ruler = new tlHead(this);
        this.scroll = new tlOverview(this);

        if (gui.patchView.store.getUiSettings())
            this.loadPatchData(gui.patchView.store.getUiSettings().timeline);

        this.selectedKeysDragArea = new GlDragArea(this, null, this.#rectsOver);
        if (gui.theme.colors_timeline.key_selected)
            this.selectedKeysDragArea.setColor(
                gui.theme.colors_timeline.key_selected[0],
                gui.theme.colors_timeline.key_selected[1],
                gui.theme.colors_timeline.key_selected[2]
            );

        this.loopAreaDrag = new GlDragArea(this, null, this.#rectsOver);
        this.loopAreaDrag.setColor(1, 0.2, 0, 0.3);

        this.on(GlTimeline.EVENT_KEYSELECTIONCHANGE, () => { this.updateSelectedKeysDragArea(); });
        this.bgRect = this.#rectsOver.createRect({ "draggable": false, "interactive": true, "name": "bgrect" });
        this.bgRect.setSize(cgl.canvasWidth, cgl.canvasHeight);
        this.bgRect.setPosition(0, 20, 1);
        this.bgRect.setColorArray(gui.theme.colors_patch.background);

        this.cursorVertLineRect = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "cursorVert" });
        this.cursorVertLineRect.setSize(1, cgl.canvasHeight);
        this.cursorVertLineRect.setPosition(0, 0, -1);

        this.cursorNewKeyVis = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "curcorKeyViz" });
        this.cursorNewKeyVis.setSize(5214, 1);
        this.cursorNewKeyVis.setPosition(0, 0, -1);
        this.cursorNewKeyVis.setColor(0, 0, 0);

        this.#cursorTextBgRect = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "cursorTextBg" });
        this.#cursorTextBgRect.setSize(40, 20);
        this.#cursorTextBgRect.setParent(this.cursorVertLineRect);
        this.#cursorTextBgRect.setColor(0.2, 0.2, 0.2, 1);

        this.#cursorText = new GlText(this.textsNoScroll, "???");
        this.#cursorText.setParentRect(this.cursorVertLineRect);

        this.#rectLoopArea = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "loopArea" });
        this.#rectLoopArea.setSize(40, 20);
        this.#rectLoopArea.setPosition(40, this.getFirstLinePosy(), 0.15);
        this.#rectLoopArea.setColor(0.9, 0.2, 0.2, 0.1);

        this.#rectHoverKey = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "keyHover" });
        this.#rectHoverKey.setSize(20, 20);
        this.#rectHoverKey.setShape(13);
        this.#rectHoverKey.setPosition(40, 20, -0.2);
        this.#rectHoverKey.setColor(1, 1, 0, 1);

        this.#rectSelect = this.#rectsOver.createRect({ "draggable": false, "interactive": false, "name": "rectSelect" });
        this.#rectSelect.setSize(0, 0);
        this.#rectSelect.setPosition(0, 0, -0.9);
        this.#rectSelect.setColorArray(gui.theme.colors_patch.patchSelectionArea);

        gui.corePatch().timer.on(Timer.EVENT_PLAY_PAUSE, () =>
        {
            gui.corePatch().timer.setTime(this.snapTime(gui.corePatch().timer.getTime()));
        });

        gui.on(Gui.EVENT_THEMECHANGED, () =>
        {
            this.updateTheme();
        }),

        cgl.canvas.setAttribute("tabindex", "0");
        cgl.canvas.classList.add("cblgltimelineEle");
        cgl.canvas.addEventListener(DomEvents.POINTER_MOVE, this.#onCanvasPointerMove.bind(this), { "passive": true });
        cgl.canvas.addEventListener(DomEvents.POINTER_UP, this.#onCanvasPointerUp.bind(this), { "passive": true });
        cgl.canvas.addEventListener(DomEvents.POINTER_DOWN, this.#onCanvasPointerDown.bind(this), { "passive": true });
        cgl.canvas.addEventListener(DomEvents.POINTER_WHEEL, this.#onCanvasWheel.bind(this), { "passive": true });
        cgl.canvas.addEventListener(DomEvents.POINTER_LEAVE, (e) => { this.#rects.pointerLeave(e); }, { "passive": true });
        cgl.canvas.addEventListener(DomEvents.POINTER_DBL_CLICK, this._onCanvasDblClick.bind(this), { "passive": false });

        cgl.on("resize", () => { this.resize(true); });
        gui.on(Gui.EVENT_RESIZE, () => { this.resize(true); });

        gui.corePatch().on("timelineConfigChange", this.onConfig.bind(this));

        gui.corePatch().on(Patch.EVENT_OP_DELETED, () => { this.init(); });
        gui.corePatch().on(Patch.EVENT_OP_ADDED, () => { this.init(); });
        gui.corePatch().on("portAnimToggle", () => { this.init(); });

        this.#elKeyParamPanel = document.createElement("div");
        this.#elKeyParamPanel.classList.add("keyOverlay");
        this.#elKeyParamPanel.setAttribute("id", "keyOverlay");
        cgl.canvas.parentElement.appendChild(this.#elKeyParamPanel);

        // this.#filterInputEl = document.createElement("input");
        // this.#filterInputEl.classList.add("filterInput");
        // this.#filterInputEl.setAttribute("placeholder", "filter...");
        // cgl.canvas.parentElement.appendChild(this.#filterInputEl);
        // this.#filterInputEl.addEventListener("input", () =>
        // {
        //     this.#filterString = this.#filterInputEl.value;
        //     this.init();
        // });

        this.#selectModeEl = document.createElement("div");
        this.#selectModeEl.classList.add("selectMode");
        this.#selectModeEl.classList.add(CssClassNames.BUTTON_SMALL);
        this.#selectModeEl.innerHTML = "selected";
        cgl.canvas.parentElement.appendChild(this.#selectModeEl);
        ele.clickable(this.#selectModeEl, () =>
        {
            this.graphSelectMode = !this.graphSelectMode;
            this.updateGraphSelectMode();
        });

        this.#elInfoOverlay = ele.byId("tlInfoOverlay");

        this.#elTimeDisplay = document.createElement("div");
        this.#elTimeDisplay.classList.add("tltimedisplay");
        this.#elTimeDisplay.addEventListener(DomEvents.POINTER_CLICK, this.cycleDisplayUnits.bind(this));
        cgl.canvas.parentElement.appendChild(this.#elTimeDisplay);
        this.#elTimeDisplay.addEventListener(DomEvents.POINTER_ENTER, () =>
        {
            // this.refreshInfoOverlay();
            // gui.showInfo(GuiText.tlhover_display);
        });

        this.#elTimeDisplay.addEventListener(DomEvents.POINTER_LEAVE, () =>
        {
            setTimeout(() =>
            {

                clearTimeout(this.#elInfoOverlayTimeout);
                this.#elInfoOverlay.classList.add(CssClassNames.HIDDEN);
            }, 10000);
        });

        this.tlTimeScrollContainer = document.createElement("div");
        this.tlTimeScrollContainer.classList.add("scrollContainer");
        this.tlTimeScrollContainer.style.top = this.getFirstLinePosyCSS() + "px";

        cgl.canvas.parentElement.appendChild(this.tlTimeScrollContainer);

        cgl.canvas.parentElement.classList.add("tlContainer");

        this.loopAreaDrag.on(GlDragArea.EVENT_MOVE, (e) =>
        {
            const t = this.view.pixelToTime(e.x - e.delta) + this.view.offset;
            const l = this.loopAreaEnd - this.loopAreaStart;

            this.loopAreaStart = t;
            this.loopAreaEnd = t + l;
        });

        this.loopAreaDrag.on(GlDragArea.EVENT_RIGHT, (e) =>
        {
            const t = this.view.pixelToTime(e.x) + this.view.offset;
            this.loopAreaEnd = t;
        });

        this.loopAreaDrag.on(GlDragArea.EVENT_LEFT, (e) =>
        {
            const t = this.view.pixelToTime(e.x) + this.view.offset;

            this.loopAreaStart = t;
        });

        this.selectedKeysDragArea.on(GlDragArea.EVENT_MOVE, (e) =>
        {
            let offTime = -this.view.pixelToTime(e.offpixel);

            this.dragSelectedKeys(offTime, 0, true);
        });

        this.selectedKeysDragArea.on(GlDragArea.EVENT_START, (e) =>
        {
            this.#undoSelection = this.serializeSelectedAnims();
        });

        this.selectedKeysDragArea.on(GlDragArea.EVENT_END, (e) =>
        {
            const undosel = this.#undoSelection;
            undo.add({
                "title": "timeline move keys",
                "undo": () =>
                {
                    for (let i = 0; i < undosel.length; i++)
                        undosel[i].anim.deserialize(undosel[i], true);

                    // this.updateAllElements();
                },
                redo() {}
            });
        });

        this.selectedKeysDragArea.on(GlDragArea.EVENT_RIGHT, (e) =>
        {
            let mintime = 9999999;
            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
                mintime = Math.min(this.#selectedKeys[i].temp.preDragTime, mintime);
            }

            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
                this.#selectedKeys[i].set({ "time": mintime + ((this.#selectedKeys[i].temp.preDragTime - mintime) * e.factor) });
                this.#selectedKeys[i].anim.sortSoon();
                this.snapSelectedKeyTimes();
            }

            this.updateAllElements();

        });

        this.selectedKeysDragArea.on(GlDragArea.EVENT_LEFT, (e) =>
        {

        });

        gui.keys.key(" ", "Drag left mouse button to pan timeline", "down", cgl.canvas.id, { "displayGroup": "Timeline" }, (_e) => { this.#spacePressed = true; this.emitEvent("spacedown"); });
        gui.keys.key(" ", "", "up", cgl.canvas.id, {}, (_e) => { console.log("spaceup"); this.#spacePressed = false; this.emitEvent("spaceup"); });

        gui.keys.key(" ", "Rewind and play", "down", cgl.canvas.id, { "cmdCtrl": true }, (_e) => { gui.corePatch().timer.setTime(0); gui.corePatch().timer.play(); });

        gui.keys.key(".", "Forward one frame", "down", cgl.canvas.id, {}, () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 1 / this.fps);
        });

        gui.keys.key(",", "Rewind one frame", "down", cgl.canvas.id, {}, () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 1 / this.fps);
        });

        gui.keys.key("c", "Center cursor", "down", cgl.canvas.id, {}, () =>
        {
            this.view.centerCursor();
        });

        gui.keys.key("d", "Delete Selected Keys", "down", cgl.canvas.id, {}, () =>
        {
            this.deleteSelectedKeys();
        });

        gui.keys.key("a", "Move keys to cursor", "down", cgl.canvas.id, {}, () =>
        {
            this.moveSelectedKeys();
        });

        gui.keys.key("f", "Zoom to all or selected keys", "down", cgl.canvas.id, {}, () =>
        {
            this.fit();
        });

        gui.keys.key("j", "Go to previous keyframe", "down", cgl.canvas.id, {}, () =>
        {
            this.jumpKey(-1);
        });

        gui.keys.key("k", "Go to next keyframe", "down", cgl.canvas.id, {}, () =>
        {
            this.jumpKey(1);
        });

        gui.keys.key("delete", "Delete selected keys", "down", cgl.canvas.id, {}, () =>
        {
            this.deleteSelectedKeys();
        });

        gui.keys.key("backspace", "Delete selected keys", "down", cgl.canvas.id, {}, () =>
        {
            this.deleteSelectedKeys();
            this.needsUpdateAll = "deletekey";
        });

        gui.keys.key("a", "Select all keys", "down", cgl.canvas.id, { "cmdCtrl": true }, () =>
        {
            this.selectAllKeys();
        });

        /// ///////////////////

        gui.on(Gui.EVENT_OP_SELECTIONCHANGED, (op) =>
        {
            this.selectedOp = op;

            const selops = gui.patchView.getSelectedOps();
            if (this.graphSelectMode && this.layout == GlTimeline.LAYOUT_GRAPHS)
                this.#tlAnims[0]?.activateSelectedOps(selops);

            for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();

            this.needsUpdateAll = "op select channge";

            for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].updateSelectedOpColor(selops);
        });

        gui.patchView.patchRenderer.on("selectedOpsChanged", () =>
        {
            let selops = gui.patchView.getSelectedOps();

            if (selops.length == 0) return;
            // let isAnimated = false;
            // for (let i = 0; i < selops.length; i++) if (selops[i].isAnimated()) isAnimated = true;

            if (this.graphSelectMode && this.layout == GlTimeline.LAYOUT_GRAPHS)
            {
                const ops = gui.patchView.getSelectedOps();
                this.#tlAnims[0]?.activateSelectedOps(ops);
            }

            let selOpsStr = "";
            for (let i = 0; i < selops.length; i++) selOpsStr += selops[i].id;

            this.needsUpdateAll = "selected ops changed";
            if (this.#layout == GlTimeline.LAYOUT_GRAPHS && selOpsStr != this.#selOpsStr)
            {
                this.init();
                this.#selOpsStr = selOpsStr;
            }
            for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].updateSelectedOpColor(selops);

            let found = false;
            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                for (let j = 0; j < selops.length; j++)
                {
                    if (this.#tlAnims[i].getOp() == selops[j])
                    {
                        this.#tlAnims[i].getTitle(0).scrollIntoView();
                        found = true;
                    }
                    if (found) break;
                }
                if (found) break;
            }
        });

        gui.glTimeline = this;
        gui.on(Gui.EVENT_OP_SELECTIONCHANGED, (op) =>
        {
            if (this.isGraphLayout()) this.init();

        });

        this.updateTheme();
        this.init();
        this._initUserPrefs();
        this.updateParamKeyframes();
    }

    updateTheme()
    {
        this.#cursorText.setColorArray(gui.theme.colors_timeline.cursor || [1, 1, 1, 1]);
        this.cursorVertLineRect.setColorArray(gui.theme.colors_timeline.cursor || [1, 1, 1, 1]);
        this.cursorNewKeyVis.setColorArray(gui.theme.colors_timeline.cursor || [1, 1, 1, 1]);

        this.selectedKeysDragArea.setColor(
            gui.theme.colors_timeline.key_selected[0],
            gui.theme.colors_timeline.key_selected[1],
            gui.theme.colors_timeline.key_selected[2]
        );

    }

    get cgl()
    {
        return this.#cgl;
    }

    get overlayRects()
    {
        return this.#rectsOver;
    }

    /**
     * @param {GlTextWriter} writer
     * @param {string} string
     */
    createText(writer, string)
    {
        return new GlText(writer, string);
    }

    refreshInfoOverlay()
    {
        this.#elInfoOverlay.classList.remove(CssClassNames.HIDDEN);
        let str = "debug";
        str += "<br/>fps: " + this.cgl.fpsCounter.stats.fps;
        str += "<br/>ms: " + this.cgl.fpsCounter.stats.ms;
        str += "<br/>rects: " + this.#rectsNoScroll.getNumRects() + ", " + this.#rectsOver.getNumRects() + ", " + this.#rects.getNumRects();
        str += "<br/>text rects: " + this.textsNoScroll.rectDrawer.getNumRects(); str += "<br/>splines: " + this.splines?.count;
        str += "<br/>spline points: " + this.getNumSplinePoints();

        this.#elInfoOverlay.style.transform = "initial";
        this.#elInfoOverlay.style.left = "10px";
        const y = this.#elTimeDisplay.getBoundingClientRect().top;
        const h = this.#elInfoOverlay.getBoundingClientRect().height;
        this.#elInfoOverlay.style.top = y - h - 40 + "px";
        this.#elInfoOverlay.innerHTML = str;
        clearTimeout(this.#elInfoOverlayTimeout);
        this.#elInfoOverlayTimeout = setTimeout(this.refreshInfoOverlay.bind(this), 500);
    }

    getNumSplinePoints()
    {
        let count = 0;
        for (let i = 0; i < this.#tlAnims.length; i++)
            count += this.#tlAnims[i].getNumSplinePoints();

        return count;
    }

    toggleAutoKeyframe()
    {
        this.keyframeAutoCreate = !this.keyframeAutoCreate;
        notify("automatically create keys on changes " + this.keyframeAutoCreate);
        this.updateIcons();
        this.saveUserSettings();
    }

    updateGraphSelectMode()
    {
        if (this.graphSelectMode) this.#selectModeEl.innerHTML = "selected";
        else this.#selectModeEl.innerHTML = "manual";

        this.deactivateAllAnims(true);
        gui.emitEvent(Gui.EVENT_OP_SELECTIONCHANGED);
        this.needsUpdateAll = "updategrathselect";
        this.saveUserSettings();
    }

    /**
     * @param {object} cfg
     */
    loadPatchData(cfg)
    {
        if (!cfg) return;
        this.loopAreaStart = cfg.loopAreaStart || 0;
        this.loopAreaEnd = cfg.loopAreaEnd || 0;
        this.view.loadState(cfg.view);
    }

    savePatchData()
    {
        return {
            "loopAreaStart": this.loopAreaStart,
            "loopAreaEnd": this.loopAreaEnd,
            "view": this.view.saveState()
        };
    }

    _initUserPrefs()
    {
        const userSettingScrollButton = userSettings.get("patch_button_scroll");
        this.buttonForPanning = userSettingScrollButton || 2;
        this.displayUnits = userSettings.get(GlTimeline.USERSETTING_UNITS) || GlTimeline.DISPLAYUNIT_SECONDS;
        this.graphSelectMode = !!userSettings.get(GlTimeline.USERSETTING_GRAPH_SELECTMODE);
        this.keyframeAutoCreate = userSettings.get(GlTimeline.USERSETTING_AUTO_KEYFRAMES, true);

        this.updateGraphSelectMode();
        this.updateIcons();
    }

    saveUserSettings()
    {
        userSettings.set(GlTimeline.USERSETTING_LAYOUT, this.#layout);
        userSettings.set(GlTimeline.USERSETTING_UNITS, this.displayUnits);
        userSettings.set(GlTimeline.USERSETTING_AUTO_KEYFRAMES, this.keyframeAutoCreate);
        userSettings.set(GlTimeline.USERSETTING_GRAPH_SELECTMODE, !!this.graphSelectMode);
    }

    get duration()
    {
        return gui.corePatch().animMaxTime;
    }

    /** @returns {number} */
    get fps()
    {
        return this.cfg.fps;
    }

    get layout()
    {
        return this.#layout;
    }

    get rects()
    {
        return this.#rects;
    }

    get rectsNoScroll()
    {
        return this.#rectsNoScroll;
    }

    get isAnimated()
    {
        return this.view.isAnimated() || this.needsUpdateAll;
    }

    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

    /** @returns {HTMLElement} */
    parentElement()
    {
        return this.#cgl.canvas.parentElement;
    }

    /**
     * @param {boolean} [force]
     */
    resize(force)
    {
        if (!force && this.#oldSize == this.#cgl.canvasWidth) return;
        const canvWidth = this.#cgl.widthCss;
        const canvHeight = this.#cgl.heightCss;
        this.scroll.setWidth(this.#cgl.width);
        this.ruler.setWidth(this.#cgl.width);

        this.bgRect.setSize(this.#cgl.width, this.#cgl.height);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].setWidth(this.#cgl.canvas.clientWidth);

        this.needsUpdateAll = "resize";
        this.setHoverKeyRect(null);

        const wparams = userSettings.get(GlTimeline.USERSETTING_SPLITTER_RIGHT);
        this.#elKeyParamPanel.style.width = wparams - 15 + "px";
        this.#elKeyParamPanel.style.right = 0 + "px";
        this.#elKeyParamPanel.style.bottom = 0 + "px";
        this.#elKeyParamPanel.style.top = 0 + "px";

        const ls = userSettings.get(GlTimeline.USERSETTING_SPLITTER_LEFT);

        this.tlTimeScrollContainer.style.width = ls + canvWidth + 15 + "px";
        this.tlTimeScrollContainer.style.height = canvHeight - this.getFirstLinePosy() + "px";
    }

    snapSelectedKeyTimes()
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeys[i].set({ "t": this.snapTime(this.#selectedKeys[i].time) });
    }

    /**
     * @param {number} time
     */
    snapTime(time)
    {
        if (this.cfg.restrictToFrames) time = Math.floor(time * this.fps) / this.fps;
        return time;
    }

    /**
     * @param {number} t
     */
    isSnappedTime(t)
    {
        return Math.abs(t - this.snapTime(t)) < 0.03;
    }

    toggleGraphLayout()
    {
        if (this.#layout == GlTimeline.LAYOUT_GRAPHS) this.#layout = GlTimeline.LAYOUT_LINES;
        else this.#layout = GlTimeline.LAYOUT_GRAPHS;

        if (this.splines) this.splines.clear();

        this.saveUserSettings();
        this.updateIcons();
        this.init(gui.patchView.getLastFocussedOp());
        this.needsUpdateAll = "togglelayout";
        this.emitEvent(GlTimeline.EVENT_LAYOUTCHANGE);

    }

    updateIcons()
    {

        if (this.keyframeAutoCreate)
        {
            ele.byId("autokeyframe").parentElement.classList.add("button-active");
            ele.byId("autokeyframe").parentElement.classList.remove("button-inactive");
        }
        else
        {
            ele.byId("autokeyframe").parentElement.classList.remove("button-active");
            ele.byId("autokeyframe").parentElement.classList.add("button-inactive");
        }
        if (this.loopAreaEnd == 0)
        {
            ele.byId("tlloop").classList.remove("icon-x");
            ele.byId("tlloop").classList.add("icon-refresh");
        }
        else
        {
            ele.byId("tlloop").classList.remove("icon-refresh");
            ele.byId("tlloop").classList.add("icon-x");
        }

        ele.byId("togglegraph1").parentElement.classList.remove("button-active");
        ele.byId("togglegraph2").parentElement.classList.remove("button-active");
        ele.byId("togglegraph1").parentElement.classList.remove("button-inactive");
        ele.byId("togglegraph2").parentElement.classList.remove("button-inactive");

        ele.byId("zoomgraph1").parentElement.classList.remove("button-inactive");
        ele.byId("zoomgraph2").parentElement.classList.remove("button-inactive");

        if (this.#layout == GlTimeline.LAYOUT_GRAPHS)
        {
            ele.byId("togglegraph1").parentElement.classList.add("button-active");
            ele.byId("togglegraph2").parentElement.classList.add("button-inactive");
            this.#selectModeEl.classList.remove("hidden");
        }
        else
        {
            this.#selectModeEl.classList.add("hidden");
            ele.byId("togglegraph2").parentElement.classList.add("button-active");
            ele.byId("togglegraph1").parentElement.classList.add("button-inactive");
            ele.byId("zoomgraph1").parentElement.classList.add("button-inactive");
            ele.byId("zoomgraph2").parentElement.classList.add("button-inactive");
        }

        const buttonPlay = ele.byId("timelineplay");
        if (buttonPlay)
            if (gui.corePatch().timer.isPlaying())
            {
                buttonPlay.classList.add("icon-pause");
                buttonPlay.classList.remove("icon-play");
            }
            else
            {
                buttonPlay.classList.remove("icon-pause");
                buttonPlay.classList.add("icon-play");
            }

        CABLES.UI.keyframeAutoCreate = this.keyframeAutoCreate;
    }

    setanim()
    {
    }

    getColorSpecial()
    {
        return gui.theme.colors_timeline.cursor || [0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1];
    }

    /**
     * @param {GlRect|GlText|GlSpline} rect
     */
    setColorRectSpecial(rect)
    {
        if (rect)
            rect.setColorArray(this.getColorSpecial());
    }

    canSelectKeys()
    {
        return !this.hoverKeyRect && !this.#focusRuler && !this.#focusScroll && !this.hoverKeyRect && !this.selectedKeysDragArea.isHovering;
    }

    /**
     * @param {MouseEvent} e
     */
    #onCanvasPointerUp(e)
    {
        if (performance.now() - this.mouseDownStart < 200)
            if (!TlKeys.dragStarted && !this.hoverKeyRect)
                for (let i = 0; i < this.#tlAnims.length; i++)
                    if (this.#tlAnims[i].isHovering() && this.#tlAnims[i] && this.#tlAnims[i].anims[0])
                    {
                        if (!gui.patchView.isCurrentOp(this.#tlAnims[i].getOp()))
                        {

                            // gui.patchView.centerSelectOp(this.#tlAnims[i].getOp()?.id);
                            // gui.patchView.focusOp(this.#tlAnims[i].getOp()?.id);
                            // this.showParamAnim(this.#tlAnims[i].anims[0]);

                        }
                        this.#tlAnims[i].getTitle(0)?.hover();
                    }

        TlKeys.dragStarted = false;
        this.selectRect = null;
        this.#rects.mouseUp(e);
        this.#rectsNoScroll.mouseUp(e);
        this.#rectsOver.mouseUp(e);
        this.mouseDown = false;
        this.#rectSelect.setSize(0, 0);
        this.#lastDragX = Number.MAX_SAFE_INTEGER;
        this.#lastDragY = Number.MAX_SAFE_INTEGER;

        for (let i = 0; i < this.#selectedKeys.length; i++) this.#selectedKeys[i].temp = {};// reset predragtimes...
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasDblClick(e)
    {
        if (this.scroll.isHovering())
        {
            this.zoomToFitAll();
        }
        else
        {
            for (let i = 0; i < this.#tlAnims.length; i++)
                if (this.#tlAnims[i].isHovering() && this.#tlAnims[i] && this.#tlAnims[i].anims[0])
                {
                    const anim = this.#tlAnims[i].anims[0];
                    const time = this.snapTime(this.view.pixelToTime(e.offsetX) + this.view.offset);
                    anim.setValue(time, anim.getValue(time));
                }
        }
    }

    /**
     * @param {PointerEvent} e
     */
    #onCanvasPointerDown(e)
    {
        if (!e.pointerType) return;

        this.#focusRuler = false;
        this.#focusScroll = false;

        if (this.ruler.isHovering()) this.#focusRuler = true;
        if (this.scroll.isHovering()) this.#focusScroll = true;

        if (!this.selectedKeysDragArea.isHovering && !this.selectRect && e.buttons == 1)
            if (this.hoverKeyRect == null && !e.shiftKey)
                if (e.offsetY > this.getFirstLinePosy())
                    this.unSelectAllKeys("canvas down");

        this.#onCanvasPointerMove(e);
        if (this.#focusScroll) return;

        try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this.#log.log(er); }

        this.#rectsOver.mouseDown(e, e.offsetX, e.offsetY);
        this.#rectsNoScroll.mouseDown(e, e.offsetX, e.offsetY);

        this.mouseDown = true;
        this.mouseDownStart = performance.now();
    }

    /**
     * @param {MouseEvent} event
     */
    #onCanvasPointerMove(event)
    {
        this.emitEvent(GlTimeline.EVENT_MOUSEMOVE, event);

        let x = event.offsetX;
        let y = event.offsetY;

        this.#rectsOver.mouseMove(x, y, event.buttons, event);
        this.#rects.mouseMove(x, y + this.getScrollY(), event.buttons, event);
        this.#rectsNoScroll.mouseMove(x, y, event.buttons, event);

        if (event.buttons == this.buttonForPanning || this.#spacePressed && event.buttons == 1)
        {
            if (this.#lastDragX != Number.MAX_SAFE_INTEGER)
            {
                const movementX = event.offsetX - this.#lastDragX;
                const movementY = event.offsetY - this.#lastDragY;

                if (!this.isFreePanningMode())
                {
                    this.tlTimeScrollContainer.scrollTop -= movementY;
                    if (movementX != 0) this.view.scroll(-this.view.pixelToTime(movementX), 0);
                }
                else
                {
                    if (event.metaKey || event.ctrlKey)
                    {
                        if (Math.abs(movementY) > Math.abs(movementX))
                        {
                            this.view.scaleValues(movementY * 0.01);
                        }
                        else
                        {
                            let zf = (1 / (this.view.zoom)) * 0.3;
                            let d = 1 + zf;
                            if (movementX > 0)d = 1 - zf;
                            this.view.setZoomOffset(d, 0);
                        }
                    }
                    else
                    {
                        if (movementX != 0) this.view.scroll(-this.view.pixelToTime(movementX), 0);
                        if (!event.shiftKey) this.view.scrollY(movementY, 0);
                    }
                }
            }

            this.#lastDragX = event.offsetX;
            this.#lastDragY = event.offsetY;
            this.needsUpdateAll = "mouse drag pan";
        }
        else if (event.buttons == 1)
        {
            if (event.ctrlKey || event.metaKey)
            {
                if (this.isGraphLayout())
                {
                    const anims = this.#tlAnims[0].getActiveAnims();
                    for (let i = 0; i < anims.length; i++)
                    {
                        const t = this.snapTime(this.view.pixelToTime(x) + this.view.timeLeft);
                        this.createKey(anims[i], t, anims[i].getValue(t));
                    }
                }
                else
                {
                    for (let i = 0; i < this.#tlAnims.length; i++)
                    {
                        if (this.#tlAnims[i].isHovering())
                        {
                            const t = this.snapTime(this.view.pixelToTime(x) + this.view.timeLeft);
                            this.createKey(this.#tlAnims[i].anims[0], t, this.#tlAnims[i].anims[0].getValue(t));
                        }
                    }
                }
            }

            if (this.canSelectKeys())
            {
                if (this.hoverKeyRect)
                {
                }
                else
                {
                    if (y > this.getFirstLinePosy())
                    {
                        if (!event.shiftKey) this.unSelectAllKeys("move " + event.buttons);

                        this.selectRect = {
                            "x": Math.min(this.#lastXnoButton, x),
                            "y": Math.min(this.#lastYnoButton, y) + this.getScrollY(),
                            "x2": Math.max(this.#lastXnoButton, x),
                            "y2": Math.max(this.#lastYnoButton, y) + this.getScrollY()
                        };

                        this.#rectSelect.setPosition(this.#lastXnoButton, this.#lastYnoButton, -1);
                        this.#rectSelect.setSize(x - this.#lastXnoButton, y - this.#lastYnoButton);

                        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].testSelected();
                    }
                }

                this.needsUpdateAll = "mouse m";
                this.showKeyParamsSoon();
            }
        }
        else
        {
            this.#lastXnoButton = x;
            this.#lastYnoButton = y;
        }
    }

    /**
     * @param {AnimKey} k
     * @returns {boolean}
     */
    isKeySelected(k)
    {
        return this.#selectedKeys.indexOf(k) != -1;
    }

    /**
     * @param {Array<AnimKey>} keys
     * @returns {Number}
     */
    getKeysSmallestTime(keys)
    {
        let minTime = 9999999;
        for (let i = 0; i < keys.length; i++)
            minTime = Math.min(minTime, keys[i].time);

        return minTime;
    }

    getNumSelectedKeys()
    {
        return this.#selectedKeys.length;
    }

    /**
     * @param {Anim} anim
     * @param {string} [reason]
     */
    setUnsavedForAnim(anim, reason)
    {
        const op = this.getPortForAnim(anim)?.op;

        for (let i = 0; i < this.#tlAnims.length; i++)
            gui.savedState.setUnSaved(reason || "unknown", op?.getSubPatch());
    }

    /**
     * @param {string} [reason]
     */
    setUnsavedForSelectedKeys(reason)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            const anim = this.#selectedKeys[i].anim;
            if (anim) this.setUnsavedForAnim(anim, reason);
        }
    }

    /**
     * @param {Anim} anim
     */
    getPortForAnim(anim)
    {
        const ports = gui.corePatch().getAllAnimPorts();
        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].anim == anim) return ports[i];
        }
    }

    sortSelectedKeyAnims()
    {
        for (let i = 0; i < this.#selectedKeyAnims.length; i++)
            this.#selectedKeyAnims[i].sortKeys();
    }

    serializeSelectedAnims()
    {
        const anims = {};
        const sers = [];

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            anims[this.#selectedKeys[i].anim.id] = this.#selectedKeys[i].anim;
        }
        for (const i in anims)
        {

            /** @type {Anim} */
            const an = anims[i];
            const ser = an.getSerialized();
            ser.anim = an;
            sers.push(ser);
        }

        return sers;
    }

    /**
     * @param {number} deltaTime
     * @param {number} deltaValue
     * @param {boolean} [sort]
     */
    dragSelectedKeys(deltaTime, deltaValue, sort)
    {
        if (deltaTime == 0 && deltaValue == 0) return;

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
            if (this.#selectedKeys[i].temp.preDragTime === undefined) this.predragSelectedKeys();
            let tt = this.snapTime(this.#selectedKeys[i].temp.preDragTime + deltaTime);
            tt = Math.max(0, tt);

            this.#selectedKeys[i].set({ "t": tt, "v": this.#selectedKeys[i].temp.preDragValue + deltaValue });
        }

        this.needsUpdateAll = "dragselect";
        if (sort) this.sortSelectedKeyAnims();
        this.setUnsavedForSelectedKeys();
    }

    predragSelectedKeys()
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].temp.preDragTime = this.#selectedKeys[i].time;
            this.#selectedKeys[i].temp.preDragValue = this.#selectedKeys[i].value;
        }
    }

    /**
     * @param {Number} time
     */
    moveSelectedKeys(time = this.cursorTime)
    {
        let minTime = time - this.getKeysSmallestTime(this.#selectedKeys);
        this.moveSelectedKeysDelta(minTime);
        this.setUnsavedForSelectedKeys();
        this.needsUpdateAll = "moveselected";
    }

    /**
     * @param {Number} easing
     */
    setSelectedKeysEasing(easing)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
            this.#selectedKeys[i].set({ "e": easing });
        }
        this.needsUpdateAll = "selselected";
        this.setUnsavedForSelectedKeys("set selected key easing");
        this.showKeyParamsSoon();
    }

    /**
     * @param {UiOp} o
     */
    #eventOnOpAdd(o)
    {
        const anim = o.portsIn[0].anim;

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            const nk = new AnimKey(this.#selectedKeys[i].getSerialized(), anim);
            anim.addKey(nk);
        }
    }

    createAnimOpFromSelection()
    {
        gui.patchView.addOp(defaultOps.defaultOpNames.anim, { "onOpAdd": this.#eventOnOpAdd.bind(this) });
    }

    /**
     * @param {Number} time
     */
    setSelectedKeysTime(time = this.cursorTime)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
            this.#selectedKeys[i].set({ "t": time });
        }
        this.fixAnimsFromKeys(this.#selectedKeys);
        this.needsUpdateAll = "seltselectedtime";
        this.setUnsavedForSelectedKeys();
    }

    /**
     * @param {boolean} [newId]
     */
    serializeSelectedKeys(newId)
    {
        const keys = [];
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            const o = this.#selectedKeys[i].getSerialized();
            o.id = this.#selectedKeys[i].id;
            o.animName = this.#selectedKeyAnims[i].name;
            o.animId = this.#selectedKeyAnims[i].id;

            if (newId) o.id = CABLES.shortId();
            keys.push(o);
        }

        return keys;
    }

    /**
     * @param {number} deltaTime
     * @param {number} deltaValue
     */
    moveSelectedKeysDelta(deltaTime, deltaValue = 0)
    {
        if (deltaTime == 0 && deltaValue == 0) return;
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
            this.#selectedKeys[i].set({ "t": this.#selectedKeys[i].time + deltaTime, "v": this.#selectedKeys[i].value + deltaValue });
        }

        this.fixAnimsFromKeys(this.#selectedKeys);
        this.needsUpdateAll = "moveselectdelta";
        this.setUnsavedForSelectedKeys();

    }

    /**
     * @param {AnimKey[]} keys
     */
    fixAnimsFromKeys(keys)
    {
        const anims = [];

        for (let i = 0; i < keys.length; i++)
        {
            if (anims.indexOf(keys[i].anim) == -1)anims.push(keys[i].anim);
        }

        for (let i = 0; i < anims.length; i++)
        {
            this.fixAnim(anims[i]);
        }
    }

    /**
     * @param {Anim} anim
     */
    fixAnim(anim)
    {
        if (!anim) return;
        anim.sortKeys();
        anim.removeDuplicates();
    }

    getSelectedKeysBoundsValue()
    {
        let min = 999999;
        let max = -999999;
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            min = Math.min(min, this.#selectedKeys[i].value);
            max = Math.max(max, this.#selectedKeys[i].value);
        }
        return { "min": min, "max": max };
    }

    getSelectedKeysBoundsTime()
    {
        let min = 999999;
        let max = -999999;
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            min = Math.min(min, this.#selectedKeys[i].time);
            max = Math.max(max, this.#selectedKeys[i].time);
        }
        return { "min": min, "max": max, "length": Math.abs(max) - Math.abs(min) };
    }

    getSelectedKeys()
    {
        return this.#selectedKeys;
    }

    updateSelectedKeysDragArea()
    {
        const timeBounds = this.getSelectedKeysBoundsTime();
        let changed = true;

        if (this.timeBounds)
            changed =
                timeBounds.min != this.timeBounds.min ||
                timeBounds.max != this.timeBounds.max;

        this.timeBounds = timeBounds;
        const newX = this.view.timeToPixelScreen(timeBounds.min);

        if (changed || newX != this.selectedKeysDragArea.x)
            if (this.getNumSelectedKeys() == 0) this.selectedKeysDragArea.set(0, 0, 0, 0, 0);
            else
                this.selectedKeysDragArea.set(
                    newX,
                    (this.height - 15) / window.devicePixelRatio,
                    -0.9,
                    this.view.timeToPixel(timeBounds.max - timeBounds.min) + 20,
                    15 * window.devicePixelRatio);
    }

    showKeyParamsSoon()
    {
        clearTimeout(this.toParamKeys);
        this.toParamKeys = setTimeout(() =>
        {
            if (this.getNumSelectedKeys() > 0 || this.#elKeyParamPanel.dataset.panel == "param_keys") this.showParamKeys();
        }, 30);
    }

    unselectAllKeysSilent()
    {

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            const k = this.#selectedKeys[i];
            setTimeout(() =>
            {
                if (k)k.emitChange();
            }, 30);
        }
        this.#selectedKeys = [];
        this.#selectedKeyAnims = [];
    }

    /**
     * @param {string} [_reason]
     */
    unSelectAllKeys(_reason)
    {
        if (this.selectedKeysDragArea.isHovering) return;
        const old = this.#selectedKeys.length;
        this.unselectAllKeysSilent();
        this.showKeyParamsSoon();
        this.setHoverKeyRect(null);
        if (old != 0) this.emitEvent(GlTimeline.EVENT_KEYSELECTIONCHANGE);
    }

    selectAllKeys()
    {
        if (this.disposed) return;
        for (let i = 0; i < this.#tlAnims.length; i++)
        {
            for (let j = 0; j < this.#tlAnims[i].anims.length; j++)
            {
                for (let k = 0; k < this.#tlAnims[i].anims[j].keys.length; k++)
                {
                    this.selectKey(this.#tlAnims[i].anims[j].keys[k], this.#tlAnims[i].anims[j]);
                }
            }
        }

        this.needsUpdateAll = "selectall";
        this.emitEvent(GlTimeline.EVENT_KEYSELECTIONCHANGE);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    selSelectedKeysCP1(x, y)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].setBezCp1(x, y);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    selSelectedKeysCP2(x, y)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].setBezCp2(x, y);
        }

    }

    deleteSelectedKeys()
    {
        if (this.disposed) return;
        const oldKeys = this.serializeSelectedKeys();
        const gltl = this;
        undo.add({
            "title": "timeline move keys",
            undo()
            {
                gltl.deserializeKeys(oldKeys);
            },
            redo()
            {
            }
        });

        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            if (this.#selectedKeys[i].anim.uiAttribs.readOnly) continue;
            this.#selectedKeyAnims[i].remove(this.#selectedKeys[i]);
            const op = this.getPortForAnim(this.#selectedKeys[i].anim)?.op;
            gui.savedState.setUnSaved("deleted keys", op?.getSubPatch());
        }

        this.unSelectAllKeys("delete keys");
        this.needsUpdateAll = "deletekey";
        this.setHoverKeyRect(null);
    }

    /**
     * @param {AnimKey} k
     * @param {Anim} a
     *
     */
    selectKey(k, a)
    {
        if (TlKeys.dragStarted) return;
        if (a.tlActive && !this.isKeySelected(k))
        {

            this.#selectedKeys.push(k);
            this.#selectedKeyAnims.push(a);
            k.emitChange();
        }
        this.showKeyParamsSoon();
        this.emitEvent(GlTimeline.EVENT_KEYSELECTIONCHANGE);
    }

    /**
     * @param {WheelEvent} event
     */
    #onCanvasWheel(event)
    {
        this.pixelPerSecond = this.view.timeToPixel(1);

        if (event.metaKey)
        {
            let v = 0.1;
            if (event.deltaY < 0)v *= -1;
            this.view.scroll(this.view.visibleTime * v);
        }
        else if (event.shiftKey && this.isGraphLayout())
        {
            let v = 1.3;
            if (event.deltaX < 0)v = 0.7;
            this.view.scaleValues(v);
        }
        else if (event.shiftKey && !this.isGraphLayout())
        {
            this.tlTimeScrollContainer.scrollTop += event.deltaX;
        }
        else if (Math.abs(event.deltaY) > Math.abs(event.deltaX))
        {
            let delta = 0;
            if (event.deltaY > 0) delta = 1.3;
            else delta = 0.7;

            this.view.setZoomOffsetWheel(delta, event);

            if (event.deltaY > 0) delta = 1;
            else delta = -1;
        }

        this.setHoverKeyRect(null);
        this.needsUpdateAll = "wheel";
    }

    isFreePanningMode()
    {
        return this.isGraphLayout();
    }

    isGraphLayout()
    {
        return this.layout == GlTimeline.LAYOUT_GRAPHS;
    }

    get width()
    {
        return this.#cgl.canvasWidth;
    }

    /**
     * @param {object} item
     * @param {HTMLElement} parentEle
     * @param {TlAnimLine} [parentLine]
     */
    hierarchyLine(item, level = 0, parentEle, parentLine)
    {
        if (!item) return;
        const op = gui.corePatch().getOpById(item.id);

        const cont = document.createElement("div");
        cont.classList.add("linesContainer");
        cont.classList.add("level" + level);
        parentEle.appendChild(cont);
        if (level == 0)
        {
            item.childs.sort((a, b) =>
            {
                const op = gui.corePatch().getOpById(a.id);
                const op2 = gui.corePatch().getOpById(b.id);
                return (op.uiAttribs.tlOrder || 100) - (op2.uiAttribs.tlOrder || 100);
            });
        }

        if (item.ports)
        {
            let first = null;
            if (op)
            {
                for (let i = 0; i < item.ports.length; i++)
                {
                    const o = { "parentEle": cont };
                    const a = new TlAnimLine(this, [op.getPortByName(item.ports[i].name)], o);

                    if (parentLine)parentLine.addFolderChild(a);
                    if (first)first.addFolderChild(a);
                    if (i == 0) first = a;

                    this.#tlAnims.push(a);
                    if (i > 0)a.getTitle(0).hideOpName = true;
                }
            }
        }
        else
        if (item.childs)
        {
            for (let i = 0; i < item.childs.length; i++)
            {
                let a = null;
                if (item.childs[i] && item.childs[i].childs)
                {
                    a = new TlAnimLine(this, [], { "title": item.childs[i].title, "parentEle": cont });

                    if (parentLine)parentLine.addFolderChild(a);
                }

                this.hierarchyLine(item.childs[i], level + 1, cont, a || parentLine);
            }
        }
        else
        {
            console.log("waaaaaaaaaaat");
        }

        // console.log("animlines", this.#tlAnims.length);

    }

    init()
    {
        if (this.disposed) return;

        const perf = gui.uiProfiler.start("[gltimeline] init");

        const q = new patchStructureQuery();
        q.setOptions({
            "include": { "animated": true, "subpatches": true, "portsAnimated": true },
            "includeUnsavedIndicator": false,
            "removeEmptySubpatches": true
        });

        if (this.isGraphLayout())
        {
            q.setOptions({
                "include": { "animated": true, "subpatches": true, "portsAnimated": true },
                "includeUnsavedIndicator": false,
                "removeEmptySubpatches": true,
                "only": { "selected": true },
            });
        }

        const hier = q.getHierarchy();
        const root = hier[0];
        const hstr = JSON.stringify(hier);

        if (root.childs == 0 && this.isGraphLayout()) return;
        if (hstr == this.lastHierStr) return;
        this.lastHierStr = hstr;

        CABLES.UI.PREVISKEYVAL = null;
        if (!this.splines)
        {
            this.splines = new GlSplineDrawer(this.#cgl, "gltlSplines_0");
            this.splines.setWidth(2);
            this.splines.setFadeout(false);
            this.splines.doTessEdges = true;
        }

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].dispose();
        this.#tlAnims = [];

        const ports = [];

        this.tlTimeScrollContainer.innerHTML = "";
        this.hierarchyLine(root, 0, this.tlTimeScrollContainer);

        if (this.#tlAnims.length == 0)
        {
            console.log("no anims!s");
            const elee = document.createElement("div");
            elee.style = "text-align:center;width:calc(var(--timelineSplitterLeft) - 30px);padding:10px;diplay:inline-block;";
            elee.innerHTML = marked(GuiText.noanims);
            this.tlTimeScrollContainer.appendChild(elee);
        }

        if (this.#layout === GlTimeline.LAYOUT_GRAPHS)
        {
            const multiAnim = new TlAnimLine(this, ports, { "keyYpos": true, "multiAnims": true });
            multiAnim.setPosition(0, this.getFirstLinePosy());
            this.#tlAnims.push(multiAnim);
        }

        this.updateAllElements();
        this.setPositions();
        this.resize();
        this.updateIcons();

        perf.finish();
    }

    /**
     * @param {Port} port
     */
    filter(port)
    {
        if (port.op.shortName.toLowerCase().includes(this.#filterString) ||
            (port.op.uiAttribs.comment || "").toLowerCase().includes(this.#filterString) ||
            port.name.toLowerCase().includes(this.#filterString)) return true;

        return false;
    }

    getScrollY()
    {
        return this.tlTimeScrollContainer.scrollTop;
    }

    getFirstLinePosyCSS()
    {
        return this.getFirstLinePosy() * window.devicePixelRatio;
    }

    getFirstLinePosy()
    {
        let posy = 0;

        this.scroll.setPosition(0, posy);
        posy += this.scroll.height;

        this.ruler.setPosition(0, posy);
        posy += this.ruler.height;

        posy /= window.devicePixelRatio;

        return posy;
    }

    setPositions()
    {
        if (this.disposed) return;
        let posy = this.getFirstLinePosy();

        for (let i = 0; i < this.#tlAnims.length; i++)
            this.#tlAnims[i].updateGlPos();
    }

    dispose()
    {
        if (this.disposed) return;
        this.disposed = true;

        if (this.#rects) this.#rects = this.#rects.dispose();
        if (this.#rectsNoScroll) this.#rectsNoScroll = this.#rectsNoScroll.dispose();
    }

    updateSize()
    {
        if (this.disposed) return;
        this.setPositions();
        this.needsUpdateAll = "updatesize";
    }

    /**
     * @param {number} resX
     * @param {number} resY
     */
    render(resX, resY)
    {
        this.#perfFps.startFrame();

        if (this.loopAreaEnd != 0 &&
            gui.corePatch().timer.isPlaying() &&
            (
                gui.corePatch().timer.getTime() > this.loopAreaEnd ||
                gui.corePatch().timer.getTime() < this.loopAreaStart
            ))
        {
            gui.corePatch().timer.setTime(this.loopAreaStart);
        }

        if (!gui.bottomTabPanel.isMinimized())
        {
            if (this.disposed) return;
            this.view.updateAnims();
            if (this.view.isAnimated() || this.needsUpdateAll) this.updateAllElements();

            this.updateCursor();
            this.#cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
            this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                this.#tlAnims[i].render();
            }

            this.#cgl.pushDepthTest(true);

            const scrollHeight = resY;// - this.getFirstLinePosy();

            let scrollAdd = this.getScrollY() * 2;
            if (this.isGraphLayout())scrollAdd = 0;
            this.#rects.render(resX, resY, -1, (1 + (scrollAdd / Math.floor(scrollHeight))), resX / 2);

            this.#rectsNoScroll.render(resX, resY, -1, 1, resX / 2);

            this.texts.render(resX, resY, -1, 1 + (scrollAdd / Math.floor(scrollHeight)), resX / 2);
            this.textsNoScroll.render(resX, resY, -1, 1, resX / 2);
            if (this.splines) this.splines.render(resX, resY, -1, 1 + (scrollAdd / Math.floor(scrollHeight)), resX / 2, this.#lastXnoButton, this.#lastYnoButton);
            this.#rectsOver.render(resX, resY, -1, 1, resX / 2);

            this.#rectLoopArea.setPosition(this.view.timeToPixelScreen(this.loopAreaStart), this.getFirstLinePosy(), -1);
            this.#rectLoopArea.setSize(this.view.timeToPixelScreen(this.loopAreaEnd) - this.view.timeToPixelScreen(this.loopAreaStart), 2222);

            if (this.loopAreaEnd == 0) this.loopAreaDrag.set(0, 0, 0, 0);
            else this.loopAreaDrag.set(
                this.view.timeToPixelScreen(this.loopAreaStart),
                this.getFirstLinePosy() - 15,
                -0.9,
                (this.view.timeToPixelScreen(this.loopAreaEnd) - this.view.timeToPixelScreen(this.loopAreaStart)),
                15);

            this.#cgl.popDepthTest();
        }
        this.#updateMouseCursor();
        this.#perfFps.endFrame();
    }

    #updateMouseCursor()
    {
        let cur = "auto";
        if (this.#spacePressed) cur = "grabbing";

        if (this.#cursor != cur) this.#cgl.setCursor(cur);

        this.#cursor = cur;
    }

    updateCursor()
    {
        this.cursorVertLineRect.setPosition(this.view.timeToPixelScreen(this.cursorTime), this.#cursorY, -0.9);

        if (CABLES.UI.PREVISKEYVAL != undefined && CABLES.UI.PREVISKEYVAL != null)
        {
            if (this.isGraphLayout() && !this.keyframeAutoCreate && this.#tlAnims[0])
            {
                const y = this.#tlAnims[0].valueToPixel(CABLES.UI.PREVISKEYVAL) + this.getFirstLinePosy();
                this.cursorNewKeyVis.setPosition(this.view.timeToPixelScreen(this.cursorTime) - this.cursorNewKeyVis.w / 2, y, -0.5);
            }
        }
        else
        {
            this.cursorNewKeyVis.setPosition(-777777, -888888);
        }

        let s = "" + Math.round(this.cursorTime * 1000) / 1000;
        const parts = s.split(".");
        parts[1] = parts[1] || "000";
        while (parts[1].length < 3) parts[1] += "0";
        const secondss = parts[0] + "." + parts[1];
        const frame = String(Math.floor(this.cursorTime * this.fps));
        const padd = 14;
        const w = this.#cursorText.width + padd;

        this.#cursorText.setPosition(-w / 2 + padd / 2, -3, -0.1);
        this.#cursorTextBgRect.setPosition(-w / 2, 0, -0.01);
        this.#cursorTextBgRect.setSize(w, 20);

        let html = "";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_SECONDS)
        {
            this.#cursorText.text = secondss;
            html += "<div>";
            html += "<h3>Second " + secondss + "</h3>";
            html += "Frame " + frame;
            html += "</div>";
            html += "<div>";
            html += "max " + Math.ceil(this.duration) + "s";
            html += "</div>";
        }

        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
        {
            this.#cursorText.text = frame;
            html += "<div>";
            html += "<h3>Frame " + frame + "</h3>";
            html += "Second " + secondss;
            html += "</div>";

            html += "<div>";
            html += "max " + Math.ceil(this.duration) * this.fps + "f";
            html += "</div>";
        }

        html += "<div>";
        if (this.cursorTime / this.duration <= 1)
            html += Math.min(Math.floor((this.cursorTime / this.duration) * 100), 100) + "%";
        html += "</div>";

        if (this.#oldhtml != html)
        {
            this.#elTimeDisplay.innerHTML = html;
            this.#oldhtml = html;
        }
        this.scroll.update();
        this.updateSelectedKeysDragArea();

        for (let i = 0; i < this.#tlAnims.length; i++)
            this.#tlAnims[i].updateTitleValues(this.cursorTime);
    }

    updateAllElements()
    {
        const perf = gui.uiProfiler.start("[gltimeline] udpateAllElements");

        this.needsUpdateAll = "";

        this.ruler.update();
        this.scroll.update();
        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].update();
        this.cursorVertLineRect.setSize(1, this.#cgl.canvasHeight);
        this.updateCursor();

        if (this.#layout === GlTimeline.LAYOUT_GRAPHS && this.#tlAnims[0])
            this.#tlAnims[0].setHeight(this.#cgl.canvasHeight - this.getFirstLinePosy());

        perf.finish();
    }

    /** @param {TlConfig} cfg */
    onConfig(cfg)
    {
        this.cfg = cfg;
        this.needsUpdateAll = "on config";

        cfg = CABLES.timelineConfig || {
            "fps": 30,
            "fadeInFrames": true,
            "restrictToFrames": true
        };
    }

    fit()
    {
        if (this.getNumSelectedKeys() == 1)
        {
            const t = this.#selectedKeys[0].time;
            if (gui.corePatch().timer.getTime() != t)
            {
                gui.corePatch().timer.setTime(t);
                this.view.centerCursor();
            }
        }
        else if (this.getNumSelectedKeys() > 1)
        {
            console.log("zoomtoselection");
            this.zoomToFitSelection();
        }
        else if (this.loopAreaEnd != 0)
        {
            console.log("zoomtoloop");
            this.zoomToFitLoop();
        }
        else
        {
            console.log("zoomto all keys");
            this.selectAllKeys();
            if (this.getNumSelectedKeys())
            {
                this.zoomToFitSelection();
                this.unSelectAllKeys("zoom out");
            }
            else
            {
                notifyWarn("no keys to fit");
            }
        }
    }

    cycleDisplayUnits()
    {
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_SECONDS) this.displayUnits = GlTimeline.DISPLAYUNIT_FRAMES;
        else if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES) this.displayUnits = GlTimeline.DISPLAYUNIT_SECONDS;

        this.needsUpdateAll = "displayunit changed";
        this.saveUserSettings();
    }

    /**
     * @param {number} dir 1 or -1
     */
    jumpKey(dir)
    {
        let theKey = null;

        for (let anii = 0; anii < this.#tlAnims.length; anii++)
        {
            for (let ans = 0; ans < this.#tlAnims[anii].anims.length; ans++)
            {
                const anim = this.#tlAnims[anii].anims[ans];
                if (!anim.tlActive) continue;
                const index = 0;

                for (let ik = 0; ik < anim.keys.length; ik++)
                {
                    if (ik < 0) continue;
                    let newIndex = ik;

                    if (anim.keys[newIndex].time != this.view.cursorTime)
                    {
                        if (dir == 1 && anim.keys[newIndex].time > this.view.cursorTime)
                        {
                            if (!theKey) theKey = anim.keys[newIndex];
                            if (anim.keys[newIndex].time < theKey.time) theKey = anim.keys[newIndex];
                        }

                        if (dir == -1 && anim.keys[newIndex].time < this.view.cursorTime)
                        {
                            if (!theKey) theKey = anim.keys[newIndex];
                            if (anim.keys[newIndex].time > theKey.time) theKey = anim.keys[newIndex];
                        }
                    }
                }
            }
        }

        if (theKey)
        {
            gui.corePatch().timer.setTime(theKey.time);
            if (theKey.time > this.view.timeRight || theKey.time < this.view.timeLeft) this.view.centerCursor();
        }
    }

    toggleLoopArea()
    {
        if (this.loopAreaEnd == 0)
        {
            if (this.getNumSelectedKeys() > 0)
            {
                const b = this.getSelectedKeysBoundsTime();
                this.loopAreaStart = b.min;
                this.loopAreaEnd = b.max;
            }
            else
            {
                this.loopAreaStart = this.view.timeLeft + this.view.visibleTime / 2;
                this.loopAreaEnd = this.loopAreaStart + 2;
            }
        }
        else this.loopAreaStart = this.loopAreaEnd = 0;

        this.updateIcons();
    }

    zoomToFitLoop()
    {
        const l = (this.loopAreaEnd - this.loopAreaStart);
        const padd = l * 0.1;
        this.view.setZoomLength(l + padd + padd);
        this.view.scrollTo(this.loopAreaStart - padd);
    }

    zoomToFitAll()
    {
        this.view.setZoomLength(this.duration);
        this.view.scrollTo(0);
    }

    zoomToFitSelection()
    {
        const boundsy = this.getSelectedKeysBoundsValue();
        const range = (Math.abs(boundsy.min) + Math.abs(boundsy.max));
        if (range > 0)
        {
            this.view.setMinVal(boundsy.min - (range * 0.1));
            this.view.setMaxVal(boundsy.max + (range * 0.1));
            this.view.scrollToY(0);
        }

        const bounds = this.getSelectedKeysBoundsTime();

        if (bounds.length == 0)
        {
            this.view.scrollTo((bounds.min - this.view.visibleTime / 2) / 2);
        }
        else
        {
            this.view.setZoomLength((bounds.length) + (bounds.length * 0.1));
            this.view.scrollTo(bounds.min - (bounds.length * 0.05));
        }
    }

    /**
     * @param {ClipboardEvent} event
     */
    copy(event = null)
    {
        const obj = { "keys": this.serializeSelectedKeys(true) };
        this.#clipboardKeys = obj;

        notify("copied " + obj.keys.length + " keys", null, { "force": true });
        if (event)
        {
            const objStr = JSON.stringify(obj);
            event.clipboardData.setData("text/plain", objStr);
            event.preventDefault();
        }
        return obj;
    }

    /**
     * @param {ClipboardEvent} event
     */
    cut(event)
    {
        this.copy(event);
        this.deleteSelectedKeys();
    }

    /**
     * @param {Array<Object>} keys
     * @param {Object} options
     */
    deserializeKeys(keys, options = {})
    {
        const useId = options.useId || false;
        const setCursorTime = options.setCursorTime || false;

        let minTime = Number.MAX_VALUE;
        for (let i in keys)
        {
            minTime = Math.min(minTime, keys[i].t);
        }

        let notfoundallAnims = false;
        let newKeys = [];

        for (let i = 0; i < keys.length; i++)
        {
            const k = keys[i];
            if (setCursorTime)
                k.t = k.t - minTime + this.cursorTime;

            let found = false;
            for (let j = 0; j < this.#tlAnims.length; j++)
            {
                let an = null;
                if (k.animId) an = this.#tlAnims[j].getAnimById(k.animId);

                if (an)
                {
                    const l = new AnimKey(keys[i], an);

                    newKeys.push(l);
                    an.addKey(l);
                    found = true;
                    gui.savedState.setUnSaved("deserializekeys", this.#tlAnims[j].getOp()?.getSubPatch());
                }
            }

            if (!found)
                notfoundallAnims = true;

        }

        return { "keys": newKeys, "notfoundallAnims": notfoundallAnims };
    }

    /**
     * @param {ClipboardEvent} e
     */
    paste(e)
    {
        if (e.clipboardData.types.indexOf("text/plain") > -1)
        {
            e.preventDefault();

            const str = e.clipboardData.getData("text/plain");

            e.preventDefault();

            try
            {

                const json = JSON.parse(str);
                if (json)
                {
                    if (json.keys)
                    {
                        const deser = this.deserializeKeys(json.keys, { "setCursorTime": true });
                        const notfoundallAnims = deser.notfoundallAnims;

                        if (notfoundallAnims) notifyWarn("could not find all anims for pasted keys");
                        else notify(json.keys.length + " keys pasted");

                        undo.add({
                            "title": "timeline paste keys keys",
                            undo()
                            {
                                for (let i = 0; i < deser.keys.length; i++)
                                    deser.keys[i].delete();
                            },
                            redo() { }
                        });

                        const animPorts = gui.corePatch().getAllAnimPorts();
                        for (let i = 0; i < animPorts.length; i++)
                            if (animPorts[i].anim)
                                animPorts[i].anim.removeDuplicates();

                        this.needsUpdateAll = "";

                        return;
                    }
                }
            }
            catch (e)
            {
                notifyWarn("Timeline paste failed");
            }
        }
    }

    /** @returns {boolean} */
    isFocused()
    {
        return this.#cgl.hasFocus();
    }

    duplicateSelectedKeys()
    {
        const o = this.copy();
        const newKeys = this.deserializeKeys(o.keys, false).keys;

        undo.add({
            "title": "timeline duplicate keys",
            undo()
            {
                for (let i = 0; i < newKeys.length; i++)
                    newKeys[i].delete();
            },
            redo()
            {
            }
        });
    }

    getDebug()
    {
        const o = {
            "layout": this.#layout,
            "tlAnims": [],
            "view": this.view.getDebug(),
            "perf": this.#perfFps.stats,
            "dragstarted": TlKeys.dragStarted
        };

        for (let anii = 0; anii < this.#tlAnims.length; anii++)
            o.tlAnims.push(this.#tlAnims[anii].getDebug());

        return o;
    }

    /**
     * @param {Anim} anim
     * @param {number} time
     * @param {number} value
     */
    createKey(anim, time, value)
    {
        time = this.snapTime(time);
        const prevKey = anim.getKey(time);
        let existedBefore = false;
        if (prevKey && prevKey.time == time) existedBefore = true;

        if (existedBefore && prevKey.value == value) return;
        const found = anim.setValue(time, value);

        if (found && prevKey) found.setEasing(prevKey.getEasing());

        undo.add({
            "title": "createKey",
            undo()
            {
                if (existedBefore)
                {
                    anim.setValue(time, prevKey.value);
                }
                else
                {
                    anim.remove(found);
                }
            },
            redo()
            {
                anim.setValue(time, value);
            }
        });
    }

    createKeyAtCursor()
    {
        for (let i = 0; i < this.#tlAnims.length; i++)
        {
            const t = this.cursorTime;
            this.#tlAnims[i].createKeyAtCursor(t);
        }
    }

    toggle()
    {
        gui.bottomTabPanel.toggle(true);
    }

    deactivateAllAnims(v = false)
    {
        for (let anii = 0; anii < this.#tlAnims.length; anii++)
        {
            for (let ans = 0; ans < this.#tlAnims[anii].anims.length; ans++)
            {
                const anim = this.#tlAnims[anii].anims[ans];
                anim.tlActive = v;
            }
            this.#tlAnims[anii].updateTitles();
        }
    }

    get height()
    {
        return this.#cgl.canvasHeight;
    }

    /**
     * @param {Anim} anim
     */
    showSpreadSheet(anim)
    {
        const getData = () =>
        {
            const data = { "colNames": ["time", "value", "easing", "cp1x", "cp1y", "cp2x", "cp2y"], "cells": [] };
            for (let i = 0; i < anim.keys.length; i++)
            {
                let bezCp1 = anim.keys[i].bezCp1 || [0, 0];
                let bezCp2 = anim.keys[i].bezCp2 || [0, 0];

                data.cells.push(
                    [
                        anim.keys[i].time,
                        anim.keys[i].value,
                        anim.keys[i].getEasing(),
                        bezCp1[0],
                        bezCp1[1],
                        bezCp2[0],
                        bezCp2[1],
                    ]
                );
            }
            return data;
        };

        let paused = false;
        const data = getData();

        anim.on(Anim.EVENT_CHANGE, () =>
        {
            if (paused) return;
            paused = true;
            tab.setData(getData());
            paused = false;
        });

        // todo close tab
        const tab = new SpreadSheetTab(gui.mainTabs, null, data, {
            "title": "keyframes",
            "onchange": (content) =>
            {
                if (paused) return;

                if (!content)
                {
                    notifyError("error parsing spreadsheet...");
                    return;
                }

                paused = true;
                anim.clear();

                for (let i = 0; i < content.cells.length; i++)
                {
                    if (!content.cells[i])
                    {
                        continue;
                    }
                    const o = {
                        "t": parseFloat(content.cells[i][0]),
                        "v": parseFloat(content.cells[i][1]),
                    };
                    anim.setValue(o.t, o.v);

                }
                paused = false;
            }
        });
    }

    updateParamKeyframes()
    {
        // todo: further optimize: check if keys or selection has changed....
        if (!this.keyparamsTimeout)
            this.keyparamsTimeout = setTimeout(() =>
            {
                this.#updateParamKeyframes();
                this.keyparamsTimeout = null;
            }, 50);
    }

    #updateParamKeyframes()
    {
        if (!gui.corePatch().timer.isPlaying())
        {
            const perf = gui.uiProfiler.start("tl.updateparamkf");
            const op = gui.opParams.getCurrentOp();

            if (op)
            {
                for (let i = 0; i < op.portsIn.length; i++)
                {
                    if (op.portsIn[i].isAnimated())
                    {
                        const elkf = ele.byId("paramportkeyframe_" + op.portsIn[i].id);
                        const t = this.cursorTime;
                        const key = op.portsIn[i].anim.getKey(t);

                        if (key && key.time == t)
                        {
                            if (elkf)
                            {
                                elkf.classList.add("onkey");
                                elkf.classList.add("icon-diamond-fill");
                                elkf.classList.remove("icon-diamond");
                            }
                        }
                        else
                        {
                            if (elkf)
                            {
                                elkf.classList.remove("onkey");
                                elkf.classList.remove("icon-diamond-fill");
                                elkf.classList.add("icon-diamond");
                            }
                        }
                    }
                }
            }

            perf.finish();
        }
        setTimeout(this.updateParamKeyframes.bind(this), 111);
    }

    showParams()
    {
    }

    hideParams()
    {
    }

    /**
     * @param {AnimKey[]} keys
     */
    testAnim(keys)
    {
        const errors = [];

        if (keys.length > 0)
            for (let i = 1; i < keys.length; i++)
                if (keys[i].anim == keys[i - 1].anim) if (keys[i].time < keys[i - 1].time)errors.push("keys wrong order " + i);

        for (let i = 0; i < keys.length; i++)
            if (keys[i].time != this.snapTime(keys[i].time))errors.push("time not snapped " + i);

        for (let i = 1; i < keys.length; i++)
            for (let j = 1; j < keys.length; j++)
                if (i != j && keys[i].anim == keys[j].anim) if (keys[i].time == keys[j].time)errors.push("duplicate keys " + i);

        return errors;
    }

    showParamKeys()
    {

        let showCurves = false;
        if (this.getNumSelectedKeys() == 0) return this.#elKeyParamPanel.innerHTML = "";

        const timebounds = this.getSelectedKeysBoundsTime();
        const valbounds = this.getSelectedKeysBoundsValue();

        let timeBoundsStr = "";
        let timestr = "";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
        {
            timestr = "" + Math.round(timebounds.length * 100 * this.fps) / 100 + " frames ";
            timeBoundsStr += Math.round(timebounds.min * 100 * this.fps) / 100;
            timeBoundsStr += " to ";
            timeBoundsStr += Math.round(timebounds.max * 100 * this.fps) / 100;
        }
        else
        {
            timestr = "" + Math.round(timebounds.length * 100) / 100 + " seconds ";
            timeBoundsStr += Math.round(timebounds.min * 100) / 100;
            timeBoundsStr += " to ";
            timeBoundsStr += Math.round(timebounds.max * 100) / 100;
        }

        let valstr = " " + Math.round(valbounds.min * 100) / 100 + " to " + Math.round(valbounds.max * 100) / 100;
        if (this.#selectedKeys.length == 0) this.hideParams();
        else this.showParams();

        let comment = "";
        let hasReadOnly = false;
        let ease = this.#selectedKeys[0].getEasing();
        if (this.#selectedKeys.length == 1)
        {
            const k = this.#selectedKeys[0];
            if (k.uiAttribs.text)comment = this.#selectedKeys[0].uiAttribs.text;
            showCurves = showCurves || (ease > 4 && ease < 28);
        }
        else
        {
            for (let i = 1; i < this.#selectedKeys.length; i++)
            {
                hasReadOnly = hasReadOnly || this.#selectedKeys[i].anim.uiAttribs.readOnly || false;
                showCurves = showCurves || (ease > 4 && ease < 28);
                if (ease != this.#selectedKeys[i].getEasing()) ease = -1;
            }
        }

        let unit = "seconds";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES) unit = "frames";

        let vars = gui.corePatch().getVars(Port.TYPE_OBJECT);
        vars = vars.filter((v) => { return v.name.startsWith(GlTimeline.CLIP_VAR_PREFIX); });

        const html = getHandleBarHtml(
            "params_keys", {
                "writable": !hasReadOnly,
                "numKeys": this.#selectedKeys.length,
                "timeLength": timestr,
                "clipsVars": vars,
                "timeBounds": timeBoundsStr,
                "valueBounds": valstr,
                "clipId": this.#selectedKeys[0].clipId,
                "lastInputValue": this.#paramLastInputValue,
                "lastInputMove": this.#paramLastInputMove,
                "displayunit": unit,
                "errors": this.testAnim(this.#selectedKeys),
                "commentColors": uiconfig.commentColors,
                "easing": ease,
                "showCurves": showCurves,
                "comment": comment
            });
        this.#elKeyParamPanel.dataset.panel = "param_keys";
        this.#elKeyParamPanel.innerHTML = html;

        ele.clickable(ele.byId("kp_more"), (e) =>
        {
            contextMenu.show(
                {
                    "items":
                        [
                            {
                                "title": "Set same time for selected keys",
                                "func": () =>
                                {
                                    this.setSelectedKeysTime();
                                }
                            },
                            {
                                "title": "Delete selected keys",
                                "func": () =>
                                {
                                    this.deleteSelectedKeys();
                                }
                            },
                            {
                                "title": "Create anim op from keyframes",
                                "func": () =>
                                {
                                    this.createAnimOpFromSelection();
                                }
                            },
                        ]
                }, e.target);
        });
        ele.clickable(ele.byId("kp_looparea"), () =>
        {
            const time = this.getSelectedKeysBoundsTime();
            this.loopAreaStart = time.min;
            this.loopAreaEnd = time.max;
        });

        ele.clickable(ele.byId("kp_movecursor"), () =>
        {
            this.moveSelectedKeys();
        });

        ele.clickable(ele.byId("kp_fit"), () =>
        {
            this.fit();
        });

        ele.clickable(ele.byId("kp_bezreset"), () =>
        {
            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].bezReset();

            this.setUnsavedForSelectedKeys();
        });

        ele.clickable(ele.byId("kp_bezfree"), () =>
        {
            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                this.#selectedKeys[i].setUiAttribs({ "bezFree": !this.#selectedKeys[i].uiAttribs.bezFree });
                if (!this.#selectedKeys[i].uiAttribs.bezFree) this.#selectedKeys[i].bezReset();
            }
            this.setUnsavedForSelectedKeys();
        });

        ele.clickable(ele.byId("kp_time_movef"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_time").value);
            if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)off *= 1 / this.fps;
            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                this.#selectedKeys[i].set({ "time": this.#selectedKeys[i].time + off });
            }
            this.fixAnimsFromKeys(this.#selectedKeys);
            this.#paramLastInputMove = off;
            this.setUnsavedForSelectedKeys();
        });

        ele.clickable(ele.byId("kp_time_moveb"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_time").value);
            if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)off *= 1 / this.fps;

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "time": this.snapTime(this.#selectedKeys[i].time - off) });

            this.fixAnimsFromKeys(this.#selectedKeys);
            this.#paramLastInputMove = off;
            this.setUnsavedForSelectedKeys();
        });

        ele.clickable(ele.byId("kp_value_set"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_value").value);

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "value": off });

            this.fixAnimsFromKeys(this.#selectedKeys);
            this.showParamKeys();
            this.setUnsavedForSelectedKeys();
            this.#paramLastInputValue = off;
        });

        ele.clickable(ele.byId("kp_value_movef"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_value").value);

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "value": this.#selectedKeys[i].value - off });

            this.fixAnimsFromKeys(this.#selectedKeys);
            this.showParamKeys();
            this.setUnsavedForSelectedKeys();
            this.#paramLastInputValue = off;
        });

        ele.clickable(ele.byId("kp_value_moveb"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_value").value);

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "value": this.#selectedKeys[i].value + off });
            this.fixAnimsFromKeys(this.#selectedKeys);
            this.showParamKeys();
            this.setUnsavedForSelectedKeys();
            this.#paramLastInputValue = off;
        });

        if (ele.byId("kp_comment"))
            ele.byId("kp_comment").addEventListener("input", () =>
            {
                let txt = ele.byId("kp_comment").value || "";

                for (let i = 0; i < this.#selectedKeys.length; i++)
                    this.#selectedKeys[i].setUiAttribs({ "text": txt });
                this.setUnsavedForSelectedKeys();
            });

        const buttons = ele.byClassAll("kp_colorbutton");
        for (let i = 0; i < buttons.length; i++)
        {
            const button = buttons[i];
            button.addEventListener(DomEvents.POINTER_CLICK, () =>
            {
                for (let j = 0; j < this.#selectedKeys.length; j++)
                    this.#selectedKeys[j].setUiAttribs({ "color": button.dataset.col });

                this.setUnsavedForSelectedKeys();
            });
        }

        if (ele.byId("kp_clip"))
            ele.byId("kp_clip").addEventListener("change", () =>
            {
                for (let j = 0; j < this.#selectedKeys.length; j++)
                {
                    const e = ele.byId("kp_clip");
                    const name = e.options[e.selectedIndex].value;
                    this.#selectedKeys[j].setClip(name, gui.corePatch().getVar(name)?.getValue());
                    this.updateAllElements();
                    this.setUnsavedForSelectedKeys();
                }

            });
    }

    /**
     * @param {Op} op
     */
    showParamOp(op)
    {
        this.showParams();
        const html = getHandleBarHtml(
            "params_animop", {
                "op": op
            });

        this.#elKeyParamPanel.innerHTML = html;
        this.#elKeyParamPanel.dataset.panel = "params_animop";

        ele.clickable(ele.byId("ap_selectopkeys"), () =>
        {
            this.unSelectAllKeys();
            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                if (this.#tlAnims[i].getOp() == op)
                    for (let j = 0; j < this.#tlAnims[i].anims.length; j++)
                    {
                        const keys = this.#tlAnims[i].getGlKeysForAnim(this.#tlAnims[i].anims[j]);
                        if (keys)keys.selectAll();
                    }
                this.#tlAnims[i].update();
            }
        });
    }

    /**
     * @param {Anim} anim
     */
    showParamAnim(anim)
    {
        if (!anim)
        {
            console.log("nope");
            return;
        }
        const options = {
            "anim": anim,
            "errors": this.testAnim(anim.keys),
            "length": Math.round(anim.getLengthLoop() * 1000) / 1000
        };

        const html = getHandleBarHtml("params_anim", options);
        this.#elKeyParamPanel.innerHTML = html;
        this.#elKeyParamPanel.dataset.panel = "params_anim";

        ele.clickable(ele.byId("ap_select"), () =>
        {
            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                const keys = this.#tlAnims[i].getGlKeysForAnim(anim);
                if (keys)keys.selectAll();
            }
        });

        ele.clickable(ele.byId("ap_debug"), (e) =>
        {
            console.log("anim serialized", e.target);
            e.target.parentElement.innerHTML = "<pre>" + JSON.stringify(anim.getSerialized(), null, 2) + "</pre>";
        });

        ele.clickable(ele.byId("ap_size"), () =>
        {
            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                if (this.#tlAnims[i].anims[0] == anim)
                {
                    let h = ((anim.uiAttribs.height || 0) + 1) % TlAnimLine.SIZES.length;

                    this.#tlAnims[i].setLineHeight(h);
                    anim.setUiAttribs({ "height": h });
                    this.#tlAnims[i].updateTitles();
                    this.#tlAnims[i].update();
                    this.#tlAnims[i].updateGlPos();
                    this.needsUpdateAll = "height..";
                }
            }
        });

        ele.clickable(ele.byId("ap_paste"), () =>
        {
            anim.deserialize(this.#clipboardKeys);
        });

        ele.clickable(ele.byId("ap_paste_at_time"), () =>
        {
            console.log("keys", this.#clipboardKeys);
            if (!this.#clipboardKeys) return;

            const startTime = this.#clipboardKeys.keys[0].t;
            for (let i = 0; i < this.#clipboardKeys.keys.length; i++)
                this.#clipboardKeys.keys[i].t += this.cursorTime - startTime;

            anim.deserialize(this.#clipboardKeys);
        });

        ele.clickable(ele.byId("ap_spreadsheet"), () =>
        {
            this.showSpreadSheet(anim);
        });

        ele.clickable(ele.byId("ap_loop_off"), () =>
        {
            anim.setLoop(Anim.LOOP_OFF);
            this.needsUpdateAll = "loopchange";
            this.showParamAnim(anim);
            this.setUnsavedForAnim(anim);
        });

        ele.clickable(ele.byId("ap_loop_mirror"), () =>
        {
            anim.setLoop(Anim.LOOP_MIRROR);
            this.needsUpdateAll = "loopchange";
            this.showParamAnim(anim);
            this.setUnsavedForAnim(anim);
        });

        ele.clickable(ele.byId("ap_loop_repeat"), () =>
        {
            anim.setLoop(Anim.LOOP_REPEAT);
            this.needsUpdateAll = "loopchange";
            this.showParamAnim(anim);
            this.setUnsavedForAnim(anim);
        });

        ele.clickable(ele.byId("ap_loop_offset"), () =>
        {
            anim.setLoop(Anim.LOOP_OFFSET);
            this.needsUpdateAll = "loopchange";
            this.showParamAnim(anim);
            this.setUnsavedForAnim(anim);
        });
    }

    /**
     * @param {GlRect} kr
     */
    setHoverKeyRect(kr)
    {
        if (TlKeys.dragStarted)
            this.#rectHoverKey.setPosition(-9999, -9999);

        const size = 6;

        this.hoverKeyRect = kr;

        if (kr)
        {
            this.#rectHoverKey.setShape(kr.shape);
            this.#rectHoverKey.setSize(kr.w + size, kr.h + size);
            this.#rectHoverKey.setPosition(kr.absX - size / 2, kr.absY - size / 2 - this.getScrollY(), kr.absZ + 0.023);
        }
        else
        {
            this.#rectHoverKey.setPosition(-9999, -9999);
        }
    }

    isSelecting()
    {
        return !!this.selectRect;
    }

    isMultiLine()
    {
        return this.#tlAnims.length > 1;
    }

    removeKeyPreViz()
    {
        CABLES.UI.PREVISKEYVAL = null;
    }

}
