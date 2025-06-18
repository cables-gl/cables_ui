import { Events, Logger, ele } from "cables-shared-client";
import { Anim, AnimKey, Port, Timer, Patch } from "cables";
import { CG, CGL, FpsCounter } from "cables-corelibs";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { glTlAnimLine } from "./gltlanimline.js";
import { glTlRuler } from "./gltlruler.js";
import { glTlScroll } from "./gltlscroll.js";
import { GlTlView } from "./gltlview.js";
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
import { glTlKeys } from "./gltlkeys.js";

/**
 * @typedef TlConfig
 * @property {Number} fps
 * @property {Number} [duration]
 * @property {Number} [bpm]
 * @property {Boolean} [fadeInFrames]
 * @property {Boolean} [showBeats]
 * @property {String} [displayUnits]
 * @property {Boolean} [restrictToFrames]
 * @property {Number} [bpmHlXth]
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

    #lastDragX = Number.MAX_SAFE_INTEGER;
    #lastDragY = Number.MAX_SAFE_INTEGER;
    #selectModeEl;
    graphSelectMode = true;
    keyframeAutoCreate = true;

    #paramLastInputValue = 0.25;
    #paramLastInputMove = 1;

    /** @type {GlTextWriter} */
    texts = null;

    /** @type {GlSplineDrawer} */
    splines;

    /** @type {GlRectInstancer} */
    #rects = null;

    /** @type {GlRectInstancer} */
    #rectsOver = null;

    /** @type {glTlRuler} */
    ruler = null;

    /** @type {glTlScroll} */
    scroll = null;

    /** @type {Array<glTlAnimLine>} */
    #tlAnims = [];

    /** @type {GlRect} */
    cursorVertLineRect;

    /** @type {GlRect} */
    cursorNewKeyVis;

    duration = 120;
    displayUnits = GlTimeline.DISPLAYUNIT_SECONDS;

    /** @type {GlRect} */
    #rectSelect;

    /** @type {GlTlView} */
    view = null;
    needsUpdateAll = "";

    static LAYOUT_LINES = 0;
    static LAYOUT_GRAPHS = 1;
    #layout = GlTimeline.LAYOUT_LINES;

    /** @type {Array<AnimKey>} */
    #selectedKeys = [];

    hoverKeyRect = null;
    disposed = false;

    #oldhtml = "";
    #canvasMouseDown = false;
    #paused = false;

    /** @type {CglContext} */
    #cgl = null;
    #isAnimated = false;
    buttonForScrolling = 2;
    toParamKeys = null;

    loopAreaStart = 0;
    loopAreaEnd = 0;

    /** @type {TlConfig} */
    cfg = CABLES.timelineConfig || {
        "fps": 30,
        "bpm": 180,
        "fadeInFrames": true,
        "showBeats": true,
        "restrictToFrames": true
    };

    #selOpsStr = "";
    #lastXnoButton = 0;
    #lastYnoButton = 0;

    selectRect = null;
    #selectedKeyAnims = [];
    #firstInit = true;
    #focusRuler = false;
    #focusScroll = false;
    #keyOverEl;
    #tlTimeDisplay;

    #oldSize = -1;
    #perfFps = new FpsCounter();
    #filterInputEl;
    #filterString = "";
    #cursorText;
    #cursorTextBgRect;
    #cursorY = 30;
    #rectLoopArea;
    #rectHoverKey;

    /**
     * @param {CglContext} cgl
    */
    constructor(cgl)
    {
        super();

        this._log = new Logger("gltimeline");

        this.#cgl = cgl;
        this.view = new GlTlView(this);

        this.#layout = userSettings.get(GlTimeline.USERSETTING_LAYOUT) || GlTimeline.LAYOUT_LINES;
        this.texts = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this.#rects = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.#rectsOver = new GlRectInstancer(cgl, { "name": "gltl rects", "allowDragging": true });

        this.ruler = new glTlRuler(this);

        this.scroll = new glTlScroll(this);

        if (gui.patchView.store.getUiSettings())
            this.loadPatchData(gui.patchView.store.getUiSettings().timeline);

        this.bgRect = this.#rectsOver.createRect({ "draggable": true, "interactive": true });
        this.bgRect.setSize(cgl.canvasWidth, cgl.canvasHeight);
        this.bgRect.setPosition(0, 0, 1);
        this.bgRect.setColorArray(gui.theme.colors_patch.background);

        this.cursorVertLineRect = this.#rectsOver.createRect({ "draggable": true, "interactive": true });
        this.cursorVertLineRect.setSize(1, cgl.canvasHeight);
        this.cursorVertLineRect.setPosition(0, 0, -1);
        this.setColorRectSpecial(this.cursorVertLineRect);

        this.cursorNewKeyVis = this.#rectsOver.createRect({ "draggable": false, "interactive": false });
        this.cursorNewKeyVis.setSize(5214, 1);
        this.cursorNewKeyVis.setPosition(0, 0, -1);
        this.cursorNewKeyVis.setColor(0, 0, 0);
        this.setColorRectSpecial(this.cursorNewKeyVis);

        this.#cursorTextBgRect = this.#rectsOver.createRect({ "draggable": false, "interactive": false });
        this.#cursorTextBgRect.setSize(40, 20);
        this.#cursorTextBgRect.setParent(this.cursorVertLineRect);
        this.#cursorTextBgRect.setColor(0.2, 0.2, 0.2, 1);

        this.#cursorText = new GlText(this.texts, "???");
        this.#cursorText.setParentRect(this.cursorVertLineRect);
        this.setColorRectSpecial(this.#cursorText);

        this.#rectLoopArea = this.#rectsOver.createRect({ "draggable": false, "interactive": false });
        this.#rectLoopArea.setSize(40, 20);
        this.#rectLoopArea.setPosition(40, 20, 0.15);
        this.#rectLoopArea.setColor(0.9, 0.2, 0.2, 0.1);

        this.#rectHoverKey = this.#rectsOver.createRect({ "draggable": false, "interactive": false });
        this.#rectHoverKey.setSize(20, 20);
        this.#rectHoverKey.setShape(13);
        this.#rectHoverKey.setPosition(40, 20, -0.2);
        this.#rectHoverKey.setColor(1, 1, 0, 1);

        this.#rectSelect = this.#rectsOver.createRect({ "draggable": true, "interactive": true });
        this.#rectSelect.setSize(0, 0);
        this.#rectSelect.setPosition(0, 0, -0.9);
        this.#rectSelect.setColorArray(gui.theme.colors_patch.patchSelectionArea);

        gui.corePatch().timer.on(Timer.EVENT_PLAY_PAUSE, () =>
        {
            gui.corePatch().timer.setTime(this.snapTime(gui.corePatch().timer.getTime()));
        });

        cgl.canvas.setAttribute("tabindex", "0");
        cgl.canvas.classList.add("cblgltimelineEle");
        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this), { "passive": true });
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this), { "passive": true });
        cgl.on("resize", () => { this.resize(true); });
        gui.on(Gui.EVENT_RESIZE, () => { this.resize(true); });

        gui.corePatch().on("timelineConfigChange", this.onConfig.bind(this));

        gui.corePatch().on(Patch.EVENT_OP_DELETED, () => { this.init(); });
        gui.corePatch().on(Patch.EVENT_OP_ADDED, () => { this.init(); });
        gui.corePatch().on("portAnimToggle", () => { this.init(); });

        this.#keyOverEl = document.createElement("div");
        this.#keyOverEl.classList.add("keyOverlay");
        this.#keyOverEl.setAttribute("id", "keyOverlay");
        cgl.canvas.parentElement.appendChild(this.#keyOverEl);

        this.#filterInputEl = document.createElement("input");
        this.#filterInputEl.classList.add("filterInput");
        this.#filterInputEl.setAttribute("placeholder", "filter...");
        cgl.canvas.parentElement.appendChild(this.#filterInputEl);
        this.#filterInputEl.addEventListener("input", () =>
        {
            this.#filterString = this.#filterInputEl.value;
            this.init();
        });

        this.#selectModeEl = document.createElement("div");
        this.#selectModeEl.classList.add("selectMode");
        this.#selectModeEl.classList.add("button-small");
        this.#selectModeEl.innerHTML = "selected";
        cgl.canvas.parentElement.appendChild(this.#selectModeEl);
        ele.clickable(this.#selectModeEl, () =>
        {
            this.graphSelectMode = !this.graphSelectMode;
            this.updateGraphSelectMode();
        });

        this.#tlTimeDisplay = document.createElement("div");
        this.#tlTimeDisplay.classList.add("tltimedisplay");
        this.#tlTimeDisplay.addEventListener("click", this.cycleDisplayUnits.bind(this));

        cgl.canvas.parentElement.appendChild(this.#tlTimeDisplay);

        gui.keys.key(".", "forward one frame", "down", cgl.canvas.id, {}, () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 1 / this.fps);
        });

        gui.keys.key(",", "rewind one frame", "down", cgl.canvas.id, {}, () =>
        {
            gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 1 / this.fps);
        });

        gui.keys.key("c", "Center cursor", "down", cgl.canvas.id, {}, () =>
        {
            this.view.centerCursor();
        });

        gui.keys.key("f", "zoom to all or selected keys", "down", cgl.canvas.id, {}, () =>
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

        gui.keys.key("delete", "delete selected keys", "down", cgl.canvas.id, {}, () =>
        {
            this.deleteSelectedKeys();
        });

        gui.keys.key("backspace", "delete selected keys", "down", cgl.canvas.id, {}, () =>
        {
            this.deleteSelectedKeys();
            this.needsUpdateAll = "deletekey";
        });

        gui.keys.key("a", "Select all keys", "down", cgl.canvas.id, { "cmdCtrl": true }, () =>
        {
            this.selectAllKeys();
        });

        /// ///////////////////
        gui.on("opSelectChange", (op) =>
        {
            this.selectedOp = op;

            const selops = gui.patchView.getSelectedOps();
            if (this.graphSelectMode && this.layout == GlTimeline.LAYOUT_GRAPHS)
            {
                this.#tlAnims[0].activateSelectedOps(selops);
            }

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
                this.#tlAnims[0].activateSelectedOps(ops);
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
        });
        gui.glTimeline = this;

        this.init();
        this._initUserPrefs();
        this.updateParamKeyframes();
    }

    toggleAutoKeyframe()
    {
        this.keyframeAutoCreate = !this.keyframeAutoCreate;
        this.updateIcons();
        this.saveUserSettings();
    }

    updateGraphSelectMode()
    {
        if (this.graphSelectMode) this.#selectModeEl.innerHTML = "selected";
        else this.#selectModeEl.innerHTML = "manual";

        this.deactivateAllAnims(true);
        gui.emitEvent("opSelectChange");
        this.needsUpdateAll = "updategrathselect";
        this.saveUserSettings();
    }

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
        this.buttonForScrolling = userSettingScrollButton || 2;
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

    /** @returns {number} */
    get bpm()
    {
        return this.cfg.bpm;
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

    get isAnimated()
    {
        return this.view.isAnimated() || this.needsUpdateAll;
    }

    get cursorTime()
    {
        return gui.corePatch().timer.getTime();
    }

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
        this.#oldSize = this.#cgl.canvasWidth;
        this.scroll.setWidth(this.#cgl.canvasWidth);
        this.ruler.setWidth(this.#cgl.canvasWidth);

        this.bgRect.setSize(this.#cgl.canvasWidth, this.#cgl.canvasHeight);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].setWidth(this.#cgl.canvasWidth);

        this.needsUpdateAll = "resize";
        this.setHoverKeyRect(null);

        const wparams = userSettings.get(GlTimeline.USERSETTING_SPLITTER_RIGHT);
        this.#keyOverEl.style.width = wparams + "px";
        this.#keyOverEl.style.right = 0 + "px";
        this.#keyOverEl.style.bottom = 0 + "px";
        this.#keyOverEl.style.top = "35px";

    }

    snapSelectedKeyTimes()
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].set({ "t": this.snapTime(this.#selectedKeys[i].time) });
        }
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

        this.saveUserSettings();

        this.updateIcons();
        this.init();
    }

    updateIcons()
    {

        if (this.keyframeAutoCreate)
            ele.byId("autokeyframe").parentElement.classList.add("button-active");
        else
            ele.byId("autokeyframe").parentElement.classList.remove("button-active");

        ele.byId("togglegraph1").parentElement.classList.remove("button-active");
        ele.byId("togglegraph2").parentElement.classList.remove("button-active");
        ele.byId("zoomgraph1").parentElement.classList.remove("button-inactive");
        ele.byId("zoomgraph2").parentElement.classList.remove("button-inactive");

        if (this.#layout == GlTimeline.LAYOUT_GRAPHS)
        {
            ele.byId("togglegraph1").parentElement.classList.add("button-active");
            this.#selectModeEl.classList.remove("hidden");
        }
        else
        {
            this.#selectModeEl.classList.add("hidden");
            ele.byId("togglegraph2").parentElement.classList.add("button-active");
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
        return [0.02745098039215691, 0.968627450980392, 0.5490196078431373, 1];
    }

    /**
     * @param {GlRect|GlText|GlSpline} rect
     */
    setColorRectSpecial(rect)
    {
        if (rect)
            rect.setColorArray(this.getColorSpecial());
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;
        this.#focusRuler = false;
        this.#focusScroll = false;
        if (this.ruler.isHovering()) this.#focusRuler = true;
        if (this.scroll.isHovering()) this.#focusScroll = true;

        if (this.#focusRuler)
        {
            this.ruler.setTimeFromPixel(e.offsetX);
        }

        else if (this.#focusScroll)
        {
        }
        else
        {
            if (!this.selectRect && e.buttons == 1)
                if (this.hoverKeyRect == null && !e.shiftKey)
                    if (e.offsetY > this.getFirstLinePosy())
                    {
                        this.unSelectAllKeys("canvas down ");
                    }

            try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
            catch (er) { this._log.log(er); }

            this.#rects.mouseDown(e, e.offsetX, e.offsetY);
        }

        this.mouseDown = true;
    }

    /**
     * @param {MouseEvent} event
     */
    _onCanvasMouseMove(event)
    {
        this.emitEvent("mousemove", event);

        let x = event.offsetX;
        let y = event.offsetY;
        this.#rects.mouseMove(x, y, event.buttons);

        if (event.buttons == 1)
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
                            this.createKey(
                                this.#tlAnims[i].anims[0], t, this.#tlAnims[i].anims[0].getValue(t));
                        }
                    }
                }
            }

            if (!this.#focusRuler && !this.#focusScroll && !this.hoverKeyRect)
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
                            "y": Math.min(this.#lastYnoButton, y),
                            "x2": Math.max(this.#lastXnoButton, x),
                            "y2": Math.max(this.#lastYnoButton, y)
                        };

                        this.#rectSelect.setPosition(this.#lastXnoButton, this.#lastYnoButton, -1);
                        this.#rectSelect.setSize(x - this.#lastXnoButton, y - this.#lastYnoButton);

                        for (let i = 0; i < this.#tlAnims.length; i++)
                        {
                            this.#tlAnims[i].testSelected();
                        }
                    }
                }

                this.needsUpdateAll = "mouse m";

                this.showKeyParamsSoon();
            }

        }
        else if (event.buttons == this.buttonForScrolling)
        {
            if (this.#lastDragX != Number.MAX_SAFE_INTEGER)
            {
                const movementX = event.offsetX - this.#lastDragX;
                const movementY = event.offsetY - this.#lastDragY;

                if (event.metaKey || event.ctrlKey)
                {
                    if (Math.abs(movementY) > Math.abs(movementX))
                    {
                        this.view.scale(movementY * 0.01);
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

            this.#lastDragX = event.offsetX;
            this.#lastDragY = event.offsetY;
            this.needsUpdateAll = "mouse drag pan";
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
     * @param {number} deltaTime
     * @param {number} deltaValue
     */
    dragSelectedKeys(deltaTime, deltaValue)
    {
        if (deltaTime == 0 && deltaValue == 0) return;
        for (let i = 0; i < this.#selectedKeys.length; i++)
        {
            this.#selectedKeys[i].set({ "t": this.snapTime(this.#selectedKeys[i].temp.preDragTime + deltaTime), "v": this.#selectedKeys[i].temp.preDragValue + deltaValue });
        }

        this.needsUpdateAll = "dragselect";
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
        this.needsUpdateAll = "moveselected";
    }

    /**
     * @param {Number} easing
     */
    setSelectedKeysEasing(easing)
    {

        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeys[i].set({ "e": easing });

        this.needsUpdateAll = "selselected";
        this.showKeyParamsSoon();
    }

    /**
     * @param {Number} time
     */
    setSelectedKeysTime(time = this.cursorTime)
    {
        for (let i = 0; i < this.#selectedKeys.length; i++)
            this.#selectedKeys[i].set({ "t": time });

        this.fixAnimsFromKeys(this.#selectedKeys);
        this.needsUpdateAll = "seltselectedtime";
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
            this.#selectedKeys[i].set({ "t": this.#selectedKeys[i].time + deltaTime, "v": this.#selectedKeys[i].value + deltaValue });
        }

        this.fixAnimsFromKeys(this.#selectedKeys);
        this.needsUpdateAll = "moveselectdelta";

    }

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

    showKeyParamsSoon()
    {
        clearTimeout(this.toParamKeys);
        this.toParamKeys = setTimeout(() =>
        {
            this.showParamKeys();
        }, 100);
    }

    /**
     * @param {string} [reason]
     */
    unSelectAllKeys(reason)
    {
        this.#selectedKeys = [];
        this.#selectedKeyAnims = [];
        this.showKeyParamsSoon();
        this.setHoverKeyRect(null);
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
            this.#selectedKeyAnims[i].remove(this.#selectedKeys[i]);

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
        if (glTlKeys.dragStarted()) return;
        if (a.tlActive && !this.isKeySelected(k))
        {
            this.#selectedKeys.push(k);
            this.#selectedKeyAnims.push(a);
        }
        this.showKeyParamsSoon();
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseUp(e)
    {
        this.#rects.mouseUp(e);
        this.mouseDown = false;
        this.hoverKeyRect = null;
        this.selectRect = null;
        this.#rectSelect.setSize(0, 0);
        this.#lastDragX = Number.MAX_SAFE_INTEGER;
        this.#lastDragY = Number.MAX_SAFE_INTEGER;
    }

    /**
     * @param {WheelEvent} event
     */
    _onCanvasWheel(event)
    {
        this.pixelPerSecond = this.view.timeToPixel(1);

        if (event.metaKey)
        {
            this.view.scroll(this.view.visibleTime * event.deltaY * 0.0005);
        }
        else if (event.shiftKey && this.isGraphLayout)
        {
            this.view.scale(event.deltaX * 0.003);
        }
        else if (Math.abs(event.deltaY) > Math.abs(event.deltaX))
        {
            let delta = 0;
            if (event.deltaY > 0) delta = 1.1;
            else delta = 0.9;

            this.view.setZoomOffset(delta);

            if (event.deltaY > 0) delta = 1;
            else delta = -1;

            this.view.scale(delta * 0.07);
        }

        this.setHoverKeyRect(null);
        this.needsUpdateAll = "wheel";
    }

    isGraphLayout()
    {
        return this.layout == GlTimeline.LAYOUT_GRAPHS;
    }

    get width()
    {
        return this.#cgl.canvasWidth;
    }

    init()
    {
        if (this.disposed) return;
        const perf = gui.uiProfiler.start("[gltimeline] init");

        CABLES.UI.PREVISKEYVAL = null;
        this.splines = new GlSplineDrawer(this.#cgl, "gltlSplines_0");
        this.splines.setWidth(2);
        this.splines.setFadeout(false);

        for (let i = 0; i < this.#tlAnims.length; i++) this.#tlAnims[i].dispose();
        this.#tlAnims = [];

        let ops = [];
        let count = 0;
        const ports = [];

        let selops = gui.patchView.getSelectedOps();
        if (this.#layout == GlTimeline.LAYOUT_LINES) ops = gui.corePatch().ops;

        // if (this.#layout == GlTimeline.LAYOUT_GRAPHS && selops.length > 0) ops = selops;
        // if (this.#layout == GlTimeline.LAYOUT_GRAPHS && this.#firstInit)ops = i
        ops = gui.corePatch().ops;

        this.#firstInit = false;

        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            for (let j = 0; j < op.portsIn.length; j++)
            {
                if (op.portsIn[j].anim)
                {
                    if (this.filter(op.portsIn[j]))
                    {
                        ports.push(op.portsIn[j]);

                        if (this.#layout === GlTimeline.LAYOUT_LINES)
                        {
                            const a = new glTlAnimLine(this, [op.portsIn[j]]);
                            this.#tlAnims.push(a);
                        }
                        count++;
                    }
                }
            }
        }

        if (this.#layout === GlTimeline.LAYOUT_GRAPHS)
        {
            const multiAnim = new glTlAnimLine(this, ports, { "keyYpos": true, "multiAnims": true });
            multiAnim.setHeight(this.#cgl.canvasHeight - this.getFirstLinePosy());
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

    getFirstLinePosy()
    {
        let posy = 0;

        this.scroll.setPosition(0, posy);
        posy += this.scroll.height;

        this.ruler.setPosition(0, posy);
        posy += this.ruler.height;
        return posy;
    }

    setPositions()
    {
        if (this.disposed) return;
        let posy = this.getFirstLinePosy();

        for (let i = 0; i < this.#tlAnims.length; i++)
        {
            this.#tlAnims[i].setPosition(0, posy);
            posy += this.#tlAnims[i].height;
        }

    }

    dispose()
    {
        if (this.disposed) return;
        this.disposed = true;

        if (this.#rects) this.#rects = this.#rects.dispose();
    }

    updateSize()
    {
        if (this.disposed) return;
        this.setPositions();
        // this.updateAllElements();
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
            // if (this.needsUpdateAll) console.log("needs update", this.needsUpdateAll);
            if (this.view.isAnimated() || this.needsUpdateAll) this.updateAllElements();

            this.updateCursor();
            this.#cgl.gl.clearColor(0.2, 0.2, 0.2, 1);
            this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                this.#tlAnims[i].render();
            }

            this.#cgl.pushDepthTest(true);

            this.#rects.render(resX, resY, -1, 1, resX / 2);
            this.texts.render(resX, resY, -1, 1, resX / 2);
            this.splines.render(resX, resY, -1, 1, resX / 2, this.#lastXnoButton, this.#lastYnoButton);
            this.#rectsOver.render(resX, resY, -1, 1, resX / 2);

            this.#rectLoopArea.setPosition(this.view.timeToPixelScreen(this.loopAreaStart), 0, -1);
            this.#rectLoopArea.setSize(this.view.timeToPixelScreen(this.loopAreaEnd) - this.view.timeToPixelScreen(this.loopAreaStart), 2222);

            this.#cgl.popDepthTest();
        }
        this.#perfFps.endFrame();
    }

    updateCursor()
    {
        this.cursorVertLineRect.setPosition(this.view.timeToPixelScreen(this.cursorTime), this.#cursorY, -0.9);

        if (CABLES.UI.PREVISKEYVAL != undefined && CABLES.UI.PREVISKEYVAL != null)
        {
            if (this.isGraphLayout() && !this.keyframeAutoCreate)
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
        const beat = String(Math.floor(this.cursorTime * (this.bpm / 60) + 1));
        const padd = 14;
        const w = this.#cursorText.width + padd;

        this.#cursorText.setPosition(-w / 2 + padd / 2, -3, -0.1);

        this.#cursorTextBgRect.setPosition(-w / 2, 0, -0.01);
        this.#cursorTextBgRect.setSize(w, 20);

        let html = "";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_SECONDS)
        {
            this.#cursorText.text = secondss;

            html += "<h3>Second " + secondss + "</h3>";
            html += frame + "f ";

            if (this.cfg.showBeats) html += beat + "b<br>";
        }
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
        {
            this.#cursorText.text = frame;
            html += "<h3>Frame " + frame + "</h3>";
            html += secondss + "s ";

            if (this.cfg.showBeats) html += beat + "b<br>";
        }
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_BEATS)
        {
            this.#cursorText.text = beat;
            html += "<h3>Beat " + beat + "</h3>";
            html += secondss + "s ";
            html += frame + "f ";

            if (this.cfg.showBeats) html += "" + beat + "b<br>";
        }

        if (this.#oldhtml != html)
        {
            this.#tlTimeDisplay.innerHTML = html;
            this.#oldhtml = html;
        }
        this.scroll.update();
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
        this.duration = cfg.duration;
        this.needsUpdateAll = "on config";
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
        else if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES) this.displayUnits = GlTimeline.DISPLAYUNIT_BEATS;
        else this.displayUnits = GlTimeline.DISPLAYUNIT_SECONDS;

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
            this.view.scrollTo(bounds.min - this.view.visibleTime / 2);
        }
        else
        {
            this.view.setZoomLength(bounds.length + bounds.length * 0.2);
            this.view.scrollTo(bounds.min - bounds.length * 0.1);
        }
    }

    /**
     * @param {ClipboardEvent} event
     */
    copy(event = null)
    {
        const obj = { "keys": this.serializeSelectedKeys(true) };

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

            const json = JSON.parse(str);
            if (json)
            {
                if (json.keys)
                {
                    const deser = this.deserializeKeys(json.keys, { "setCursorTime": true });
                    const notfoundallAnims = deser.notfoundallAnims;

                    if (notfoundallAnims)
                    {
                        notifyWarn("could not find all anims for pasted keys");
                    }
                    else
                    {
                        notify(json.keys.length + " keys pasted");
                    }

                    const animPorts = gui.corePatch().getAllAnimPorts();
                    for (let i = 0; i < animPorts.length; i++)
                        if (animPorts[i].anim)
                            animPorts[i].anim.removeDuplicates();

                    this.needsUpdateAll = "";

                    return;
                }
            }
            CABLES.UI.notify("Paste failed");
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
                {
                    newKeys[i].delete();
                }
                // key.set(oldValues);
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
            "dragstarted": glTlKeys.dragStarted()
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

            const data = { "colNames": ["time", "value", "easing"], "cells": [] };
            for (let i = 0; i < anim.keys.length; i++)
            {
                data.cells.push(
                    [
                        anim.keys[i].time,
                        anim.keys[i].value,
                        anim.keys[i].getEasing()
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
                        console.log("abbruch");
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

    // /**
    //  * @param {Anim} anim
    //  */
    // addUndoStart(anim)
    // {
    //     const s = anim.getSerialized();
    //     this.undoStart = s;
    // }

    // /**
    //  * @param {Anim} anim
    //  * @param {any} title
    //  */
    // addUndoFinish(anim, title)
    // {
    //     const undoStart = this.undoStart;
    //     const undoEnd = anim.getSerialized();

    //     undo.add({
    //         "title": title,
    //         undo()
    //         {
    //             anim.clear();
    //             anim.deserialize(undoStart);
    //         },
    //         redo()
    //         {
    //             anim.clear();
    //             anim.deserialize(undoEnd);

    //         }
    //     });
    // }

    updateParamKeyframes()
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
        if (this.getNumSelectedKeys() == 0) return this.#keyOverEl.innerHTML = "";
        const timebounds = this.getSelectedKeysBoundsTime();
        const valbounds = this.getSelectedKeysBoundsValue();
        let timestr = " " + Math.round(timebounds.length * 100) / 100 + " seconds ";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)
        {
            timestr = "" + Math.round(timebounds.length * 100 * this.fps) / 100 + " frames: ";
            timestr += Math.round(timebounds.min * 100 * this.fps) / 100;
            timestr += " to ";
            timestr += Math.round(timebounds.max * 100 * this.fps) / 100;
        }

        let valstr = " " + Math.round(valbounds.min * 100) / 100 + " to " + Math.round(valbounds.max * 100) / 100;

        if (this.#selectedKeys.length == 0) this.hideParams();
        else this.showParams();

        let comment = "";
        let ease = this.#selectedKeys[0].getEasing();
        if (this.#selectedKeys.length == 1)
        {
            const k = this.#selectedKeys[0];
            if (k.uiAttribs.text)comment = this.#selectedKeys[0].uiAttribs.text;
        }
        else
        {
            for (let i = 1; i < this.#selectedKeys.length; i++)
            {
                showCurves = showCurves || ease > 4;
                if (ease != this.#selectedKeys[i].getEasing()) ease = -1;
            }
        }

        let unit = "seconds";
        if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES) unit = "frames";

        const html = getHandleBarHtml(
            "params_keys", {
                "numKeys": this.#selectedKeys.length,
                "timeBounds": timestr,
                "valueBounds": valstr,
                "lastInputValue": this.#paramLastInputValue,
                "lastInputMove": this.#paramLastInputMove,
                "displayunit": unit,
                "errors": this.testAnim(this.#selectedKeys),
                "commentColors": uiconfig.commentColors,
                "easing": ease,
                "showCurves": showCurves,
                "comment": comment
            });
        this.#keyOverEl.innerHTML = html;

        ele.clickable(ele.byId("kp_delete"), () =>
        {
            this.deleteSelectedKeys();
        });

        ele.clickable(ele.byId("kp_bezfree"), () =>
        {
            console.log("toggle blezq");
            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                this.#selectedKeys[i].setUiAttribs({ "bezFree": !this.#selectedKeys[i].uiAttribs.bezFree });

            }
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
        });

        ele.clickable(ele.byId("kp_time_moveb"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_time").value);
            if (this.displayUnits == GlTimeline.DISPLAYUNIT_FRAMES)off *= 1 / this.fps;

            for (let i = 0; i < this.#selectedKeys.length; i++)
            {
                this.#selectedKeys[i].set({ "time": this.snapTime(this.#selectedKeys[i].time - off) });
            }
            this.fixAnimsFromKeys(this.#selectedKeys);
            this.#paramLastInputMove = off;
        });

        ele.clickable(ele.byId("kp_value_movef"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_value").value);

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "value": this.#selectedKeys[i].value - off });
            this.fixAnimsFromKeys(this.#selectedKeys);
            this.showParamKeys();
            this.#paramLastInputValue = off;
        });

        ele.clickable(ele.byId("kp_value_moveb"), () =>
        {
            let off = parseFloat(ele.byId("kp_input_value").value);

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].set({ "value": this.#selectedKeys[i].value + off });
            this.fixAnimsFromKeys(this.#selectedKeys);
            this.showParamKeys();
            this.#paramLastInputValue = off;
        });

        ele.byId("kp_comment").addEventListener("input", () =>
        {
            let txt = ele.byId("kp_comment").value;

            for (let i = 0; i < this.#selectedKeys.length; i++)
                this.#selectedKeys[i].setUiAttribs({ "text": txt });
            // this.showParamKeys();
        });

        const buttons = ele.byClassAll("kp_colorbutton");
        for (let i = 0; i < buttons.length; i++)
        {
            const button = buttons[i];
            button.addEventListener("click", () =>
            {
                for (let j = 0; j < this.#selectedKeys.length; j++)
                    this.#selectedKeys[j].setUiAttribs({ "color": button.dataset.col });
            });
        }
    }

    /**
     * @param {Anim} anim
     */
    showParamAnim(anim)
    {
        this.showParams();
        const html = getHandleBarHtml(
            "params_anim", {
                "anim": anim,
                "errors": this.testAnim(anim.keys),
                "length": Math.round(anim.getLengthLoop() * 1000) / 1000
            });
        this.#keyOverEl.innerHTML = html;

        ele.clickable(ele.byId("ap_select"), () =>
        {
            for (let i = 0; i < this.#tlAnims.length; i++)
            {
                const keys = this.#tlAnims[i].getGlKeysForAnim(anim);
                if (keys)keys.selectAll();
            }
        });
        ele.clickable(ele.byId("ap_spreadsheet"), () =>
        {
            this.showSpreadSheet(anim);
        });

        ele.clickable(ele.byId("ap_loop_off"), () =>
        {
            anim.setLoop(Anim.LOOP_OFF);
            this.needsUpdateAll = "loopchange";
        });

        ele.clickable(ele.byId("ap_loop_mirror"), () =>
        {
            anim.setLoop(Anim.LOOP_MIRROR);
            this.needsUpdateAll = "loopchange";
        });
        ele.clickable(ele.byId("ap_loop_repeat"), () =>
        {
            anim.setLoop(Anim.LOOP_REPEAT);
            this.needsUpdateAll = "loopchange";
        });
        ele.clickable(ele.byId("ap_loop_offset"), () =>
        {
            anim.setLoop(Anim.LOOP_OFFSET);
            this.needsUpdateAll = "loopchange";
        });
    }

    /**
     * @param {GlRect} kr
     */
    setHoverKeyRect(kr)
    {
        if (glTlKeys.dragStarted())
        {
            this.#rectHoverKey.setPosition(-9999, -9999);
        }
        const size = 6;

        this.hoverKeyRect = kr;
        if (kr)
        {
            this.#rectHoverKey.setShape(kr.shape);
            this.#rectHoverKey.setSize(kr.w + size, kr.h + size);
            this.#rectHoverKey.setPosition(kr.absX - size / 2, kr.absY - size / 2, kr.absZ + 0.023);
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
