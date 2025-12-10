// @ts-nocheck
import { Logger, ele, Events } from "cables-shared-client";
import { Anim, CglContext, Op } from "cables";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import GlTextWriter from "../gldraw/gltextwriter.js";
import GlText from "../gldraw/gltext.js";
import GlDragLine from "./gldragline.js";
import GlSelectionArea from "./glselectionarea.js";
import GlViewBox from "./glviewbox.js";
import GlOp from "./glop.js";
import MouseState from "./mousestate.js";
import GlCursor from "./glcursor.js";
import ShakeDetector from "./shakedetect.js";
import VizLayer from "./vizlayer.js";
import { GuiText } from "../text.js";
import Gui, { gui } from "../gui.js";
import Snap from "./snap.js";
import gluiconfig from "./gluiconfig.js";
import { updateHoverToolTip, hideToolTip } from "../elements/tooltips.js";
import { notify } from "../elements/notification.js";
import UserSettings, { userSettings } from "../components/usersettings.js";
import { portType } from "../core_constants.js";
import { CmdOp } from "../commands/cmd_op.js";
import { CmdPatch } from "../commands/cmd_patch.js";
import GlLink from "./gllink.js";
import { DomEvents } from "../theme.js";
import { GlSplineDrawer } from "../gldraw/glsplinedrawer.js";

/**
 * rendering the patchfield
 *
 * @export
 * @class GlPatch
 * @extends {Events}
 */
export default class GlPatch extends Events
{
    static USERPREF_GLPATCH_CABLE_WIDTH = "glcablewidth";

    static EVENT_MOUSE_UP_OVER_OP = "mouseUpOverOp";
    static EVENT_MOUSE_UP_OVER_PORT = "mouseUpOverPort";
    static EVENT_MOUSE_DOWN_OVER_PORT = "mouseDownOverPort";

    #cgl = null;
    hoverPort = null;
    paused = false;
    pauseTimeOut = null;
    blueprint = false;
    isAnimated = false;
    #numSelectedGlOps = 0;

    _mouseLeaveButtons = 0;
    _cutLine = [];
    cutLineActive = false;
    _glOpz = {};
    _hoverOps = [];
    _ignoreNonExistError = [];
    _hoverOpLongStartTime = 0;
    _patchAPI = null;
    debugData = {};

    greyOut = false;
    _greyOutRect = null;
    startLinkButtonDrag = null;
    _time = 0;
    frameCount = 0;
    _viewZoom = 0;
    needsRedraw = false;
    _selectedGlOps = {};

    links = {};

    _dropInCircleLink = null;
    _dropInCircleRect = null;

    _cachedNumSelectedOps = 0;
    _cachedFirstSelectedOp = null;

    _showingOpCursor = false;
    _fpsStartTime = 0;

    cacheOIRxa = 0;
    cacheOIRya = 0;
    cacheOIRxb = 0;
    cacheOIRyb = 0;
    cacheOIRops = null;

    _subpatchoprect = null;
    suggestionTeaser = null;

    /** @type {GlLineDrawer[]} */
    #splineDrawers = null;
    #selectionArea = null;
    #dropInOpBorder = null;
    #rectInstancer = null;
    #overlaySplines = null;
    #numSelOpsTimeout = null;
    #textWriter = null;

    #lastMouseX = -1;
    #lastMouseY = -1;

    /**
     * @param {CglContext} cgl
     */
    constructor(cgl)
    {
        super();

        this.logEvents(false, "glpatch");
        this._log = new Logger("glpatch");

        if (!cgl) this._log.error("[glpatch] need cgl");

        this.#cgl = cgl;
        this.mouseState = new MouseState(cgl.canvas);

        this._timeStart = performance.now();
        this.vizFlowMode = userSettings.get("glflowmode") || 0;

        this.#overlaySplines = new GlSplineDrawer(cgl, "overlaysplines");
        this.#overlaySplines.zPos = 0.5;
        this.#splineDrawers = { "0": new GlSplineDrawer(cgl, "patchCableSplines_0") };

        this.viewBox = new GlViewBox(cgl, this);

        this.#rectInstancer = new GlRectInstancer(cgl, { "name": "mainrects", "initNum": 1000, "hoverWhenButton": true });
        this._lines = new GlSplineDrawer(cgl, { "name": "links", "initNum": 100 });
        this._overLayRects = new GlRectInstancer(cgl, { "name": "overlayrects" });
        this.#rectInstancer.hoverWhenButton;
        this._overLayRects.hoverWhenButton = false;

        this.#textWriter = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this._textWriterOverlay = new GlTextWriter(cgl, { "name": "textoverlay" });

        /** @type {number|string} */
        this._currentSubpatch = 0;
        this.#selectionArea = new GlSelectionArea(this._overLayRects);
        this.portDragLine = new GlDragLine(this.#overlaySplines, this);

        if (userSettings.get("devinfos"))
        {
            CABLES.UI.showDevInfos = true;
            const idx = this.#overlaySplines.getSplineIndex();
            this.#overlaySplines.setSpline(idx, [-1000000, 0, 0, 1000000, 0, 0]);
            this.#overlaySplines.setSplineColor(idx, [0.25, 0.25, 0.25, 1.0]);

            const idx2 = this.#overlaySplines.getSplineIndex();
            this.#overlaySplines.setSpline(idx2, [0, -1000000, 0, 0, 1000000, 0]);
            this.#overlaySplines.setSplineColor(idx2, [0.25, 0.25, 0.25, 1.0]);
        }

        this.cablesHoverText = new GlText(this.#textWriter, "");
        this.cablesHoverText.setPosition(0, 0);
        this.cablesHoverText.setColor(1, 1, 1, 0);

        this._eleDropOp = ele.byId("drop-op-cursor");

        this._subpatchAnimFade = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutX = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutY = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutW = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutH = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });

        this._focusRectAnim = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._focusRect = this._overLayRects.createRect({ "name": "focusrect", "interactive": false });
        this._focusRect.setSize(1, 1);
        this._focusRect.setShape(4);
        this._focusRect.setColor(0, 1, 1, 1);
        this._focusRect.visible = false;

        this._glCursors = {};
        this._localGlCursor = new GlCursor(this, this._overLayRects);
        this._localGlCursor.setColor(1, 1, 1, 1);
        this._glCursors[0] = this._localGlCursor;

        this._glSelectionAreas = {};

        this.opShakeDetector = new ShakeDetector();
        this.opShakeDetector.on("shake", () => { if (gui.patchView.getSelectedOps().length === 1)gui.patchView.unlinkSelectedOps(); });

        this.snap = new Snap(cgl, this, this.#rectInstancer);

        // this._redrawFlash = this._overLayRects.createRect({ "name": "redrawflash", "interactive": false });
        // this._redrawFlash.setSize(50, 5);
        // this._redrawFlash.setColor(0, 1, 0, 1);
        this._fadeOutRectAnim = new Anim({ "defaultEasing": Anim.EASING_LINEAR });

        this._fadeOutRect = this._overLayRects.createRect({ "name": "fadeoutrect", "interactive": false });
        this._fadeOutRect.setSize(100000000, 100000000);
        this._fadeOutRect.setPosition(-50000000, -50000000);
        this._fadeOutRect.setColor(0, 0, 0, 0.0);
        this._fadeOutRect.visible = true;

        this.#dropInOpBorder = this._overLayRects.createRect({ "interactive": false, "name": "dropinborder" });
        this.#dropInOpBorder.setSize(100, 100);
        this.#dropInOpBorder.setColor(1, 0, 0, 1);
        this.#dropInOpBorder.visible = false;

        cgl.canvas.addEventListener(DomEvents.POINTER_MOVE, this._onCanvasMouseMove.bind(this), { "passive": false });
        cgl.canvas.addEventListener(DomEvents.POINTER_UP, this._onCanvasMouseUp.bind(this), { "passive": false });
        cgl.canvas.addEventListener(DomEvents.POINTER_DOWN, this._onCanvasMouseDown.bind(this), { "passive": false });

        cgl.canvas.addEventListener(DomEvents.POINTER_LEAVE, this._onCanvasMouseLeave.bind(this), { "passive": false });
        cgl.canvas.addEventListener(DomEvents.POINTER_ENTER, this._onCanvasMouseEnter.bind(this), { "passive": false });
        cgl.canvas.addEventListener(DomEvents.POINTER_DBL_CLICK, this._onCanvasDblClick.bind(this), { "passive": false });
        cgl.canvas.addEventListener("focus", this.isFocused.bind(this));
        cgl.canvas.addEventListener("blur", this.isFocused.bind(this));

        gui.on(Gui.EVENT_THEMECHANGED, this.updateTheme.bind(this));

        gui.keys.key("ArrowLeft", "Left", "down", cgl.canvas.id, { "cmdCtrl": true, }, () =>
        {
            this.viewBox.keyScrollX(-1);
        });
        gui.keys.key("ArrowRight", "Left", "down", cgl.canvas.id, { "cmdCtrl": true, }, () =>
        {
            this.viewBox.keyScrollX(1);
        });
        gui.keys.key("ArrowUp", "Left", "down", cgl.canvas.id, { "cmdCtrl": true, }, () =>
        {
            this.viewBox.keyScrollY(-1);
        });
        gui.keys.key("ArrowDown", "Left", "down", cgl.canvas.id, { "cmdCtrl": true, }, () =>
        {
            this.viewBox.keyScrollY(1);
        });
        gui.keys.key("ArrowUp", "", "down", cgl.canvas.id, {}, () =>
        {
            gui.patchView.cursorNavOps(0, -1);
        });
        gui.keys.key("ArrowDown", "", "down", cgl.canvas.id, {}, () =>
        {
            gui.patchView.cursorNavOps(0, 1);
        });
        gui.keys.key("ArrowLeft", "", "down", cgl.canvas.id, {}, () =>
        {
            gui.patchView.cursorNavOps(-1, 0);
        });
        gui.keys.key("ArrowRight", "", "down", cgl.canvas.id, {}, () =>
        {
            gui.patchView.cursorNavOps(1, 0);
        });

        gui.keys.key(["Delete", "Backspace"], "Delete selected ops", "down", cgl.canvas.id, {}, this._onKeyDelete.bind(this));
        gui.keys.key("f", "Toggle flow visualization", "down", cgl.canvas.id, {}, (_e) =>
        {
            let fm = this.vizFlowMode || 0;

            fm++;

            if (fm == 3)fm = 0;

            const modes = ["Off", "Highlight Active", "Show Dataflow"];

            notify("Flow Visualization: ", modes[fm]);

            userSettings.set("glflowmode", fm);
        });

        gui.keys.key(" ", "Drag left mouse button to pan patch", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this._spacePressed = true; this.emitEvent("spacedown"); });
        gui.keys.key(" ", "", "up", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this._spacePressed = false; this.emitEvent("spaceup"); });

        gui.keys.key("e", "Edit op code", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { CmdOp.editOp(true); });
        gui.keys.key("c", "Center Selected Ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) =>
        {
            this.viewBox.centerSelectedOps();
            if (gui.patchView.getSelectedOps().length == 1)
                this.focusOpAnim(gui.patchView.getSelectedOps()[0].id);
        });
        gui.keys.key("x", "Unlink selected ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { gui.patchView.unlinkSelectedOps(); });

        gui.keys.key("x", "Unlink selected ops first ports only", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { gui.patchView.unlinkSelectedOps(true); });

        gui.keys.key("u", "Goto parent subpatch", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { CmdPatch.gotoParentSubpatch(); });

        gui.keys.key("a", "Select all ops in current subpatch", "down", cgl.canvas.id, { "cmdCtrl": true, "displayGroup": "editor" }, (_e) => { gui.patchView.selectAllOpsSubPatch(this._currentSubpatch); });
        gui.keys.key("a", "Align selected ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) =>
        {
            for (let j = 0; j < 20; j++)
                for (const i in this._selectedGlOps)
                {
                    if (this._selectedGlOps[i].op)
                        this._selectedGlOps[i].op.setUiAttribs(
                            {
                                "translate":
                                {
                                    "x": this.snap.snapOpX(this._selectedGlOps[i].op.uiAttribs.translate.x, this._selectedGlOps[i].op, 1000),
                                    "y": this._selectedGlOps[i].op.uiAttribs.translate.y
                                } });

                    gui.patchView.testCollision(this._selectedGlOps[i].op);
                }
        });
        gui.keys.key("a", "Compress selected ops vertically", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps()); });

        gui.keys.key("o", "Navigate op history back", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { gui.opHistory.back(); });
        gui.keys.key("i", "Navigate op history forward", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { gui.opHistory.forward(); });

        // gui.keys.key("j", "Navigate op history back", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { gui.opHistory.back(); });
        // gui.keys.key("k", "Navigate op history forward", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { gui.opHistory.forward(); });

        gui.keys.key("d", "Disable Op", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this.toggleOpsEnable(); });
        // gui.keys.key("d", "Temporary unlink op", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { gui.patchView.tempUnlinkOp(); });

        gui.keys.key("!", "debug", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (_e) => { this._cycleDebug(); });

        gui.keys.key("+", "Zoom In", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this.zoomStep(-1); });
        gui.keys.key("=", "Zoom In", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this.zoomStep(-1); });
        gui.keys.key("-", "Zoom Out", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { this.zoomStep(1); });

        gui.keys.key("t", "Set Title", "down", cgl.canvas.id, { "displayGroup": "editor" }, (_e) => { CmdPatch.setOpTitle(); });

        gui.keys.key("y", "Cut Cables", "down", cgl.canvas.id, { "displayGroup": "editor" }, () =>
        {
            if (!this.cutLineActive) this._cutLine = [];
            this.cutLineActive = true;
        });

        gui.keys.key("y", "Cut Cables", "up", cgl.canvas.id, { "displayGroup": "editor" }, () =>
        {
            this.cutLineActive = false;
            this.#overlaySplines.setSpline(this._cutLineIdx, [0, 0, 0, 0, 0, 0]);
        });

        gui.on(Gui.EVENT_UILOADED, () =>
        {
            this.snap.update();
            // update remote cursor positions
            gui.on("netCursorPos", (msg) =>
            {
                if (!this._glCursors[msg.clientId]) this._glCursors[msg.clientId] = new GlCursor(this, this._overLayRects, msg.clientId);

                if (msg.hasOwnProperty("subpatch"))
                    this._glCursors[msg.clientId].setSubpatch(msg.subpatch);

                this._glCursors[msg.clientId].setPosition(msg.x, msg.y);
            });

            gui.on("netSelectionArea", (msg) =>
            {
                if (!this._glSelectionAreas[msg.clientId]) this._glSelectionAreas[msg.clientId] = new GlSelectionArea(this._overLayRects);
                const area = this._glSelectionAreas[msg.clientId];
                if (msg.hide)
                {
                    area.hideArea();
                }
                else
                {
                    if (msg.color) area.setColor([msg.color.r, msg.color.g, msg.color.b, gui.theme.colors_patch.patchSelectionArea[3]]);
                    area.setPos(msg.x, msg.y, 1000);
                    area.setSize(msg.sizeX, msg.sizeY);
                }
            });

            // jump to client position, aka. follow mode
            gui.on("netGotoPos", (msg) =>
            {
                if (msg.hasOwnProperty("scrollX") && msg.hasOwnProperty("scrollY"))
                {
                    if (msg.hasOwnProperty("subpatch"))
                    {

                        /*
                         * set subpatch and revert greyout-state to what is appropriate for this
                         * client in multiplayer session
                         */
                        if (msg.subpatch !== this.getCurrentSubPatch())
                        {
                            const mpGreyOut = gui.patchView.patchRenderer.greyOut;
                            gui.patchView.setCurrentSubPatch(msg.subpatch, () =>
                            {
                                gui.patchView.patchRenderer.greyOut = mpGreyOut;
                            });
                        }
                    }

                    if (msg.hasOwnProperty("zoom"))
                    {
                        if (gui.patchView.patchRenderer.viewBox)
                            gui.patchView.patchRenderer.viewBox.animateZoom(msg.zoom);
                    }

                    if (gui.patchView.patchRenderer.viewBox) gui.patchView.patchRenderer.viewBox.scrollTo(-msg.scrollX, msg.scrollY);
                    else this.center(msg.scrollX, msg.scrollY);
                }
            });

            // remove client on connection lost
            gui.on("netClientRemoved", (msg) =>
            {
                if (this._glCursors[msg.clientId]) this._glCursors[msg.clientId].visible = false;
            });

            gui.on("netLeaveSession", (msg) =>
            {
                if (msg.clients)
                {
                    msg.clients.forEach((client) =>
                    {
                        if (this._glCursors[client.clientId]) this._glCursors[client.clientId].visible = false;
                    });
                }
            });
        });

        gui.on("restrictionChange", (r) =>
        {
            gui.patchView.patchRenderer.greyOut = r === Gui.RESTRICT_MODE_FOLLOWER;
            this._updateGreyout();
        });

        this.vizLayer = new VizLayer(this);

        userSettings.on(UserSettings.EVENT_CHANGE, (key, value) =>
        {
            this.dblClickAction = userSettings.get("doubleClickAction");
            this.vizFlowMode = userSettings.get("glflowmode");
            this.updateVizFlowMode();

            if (key == "linetype")
                for (let i in this.links)
                    this.links[i].updateLineStyle();

            this.updateCableWidth();
        });

        if (userSettings.get("devinfos"))
        {
            gui.corePatch().on("subpatchesChanged", () =>
            {
                if (!this.subpatchAreaSpline) this.subpatchAreaSpline = this.#overlaySplines.getSplineIndex();

                const bounds = gui.patchView.getSubPatchBounds();

                this.#overlaySplines.setSpline(this.subpatchAreaSpline, [
                    bounds.minX, bounds.minY, 0,
                    bounds.maxX, bounds.minY, 0,

                    bounds.maxX, bounds.minY, 0,
                    bounds.maxX, bounds.maxY, 0,

                    bounds.maxX, bounds.maxY, 0,
                    bounds.minX, bounds.maxY, 0,

                    bounds.minX, bounds.maxY, 0,
                    bounds.minX, bounds.minY, 0
                ]);

                this.#overlaySplines.setSplineColor(this.subpatchAreaSpline, [0.25, 0.25, 0.25, 1]);
            });
        }

        this.snap.update();
        this._cablesHoverButtonRect = undefined;

    }

    get textWriter()
    { return this.#textWriter; }

    get name() { return "glpatch"; }

    get time() { return this._time; }

    set patchAPI(api) { this._patchAPI = api; }

    get patchAPI() { return this._patchAPI; }

    get rectDrawer() { return this.#rectInstancer; }

    get selectedGlOps() { return this._selectedGlOps; }

    get subPatch() { return this._currentSubpatch; }

    get isAreaSelecting() { return this.#selectionArea.active; }

    get cgl() { return this.#cgl; }

    updateVizFlowMode()
    {
        for (let i in this._glOpz)
            this._glOpz[i].updateVizFlowMode(this.vizFlowMode);
    }

    updateCursor()
    {
        let cur = "auto";
        if (this.greyOut)
        {
            cur = "not-allowed";
        }
        else
        {
            if (this.viewBox.cursor)cur = this.viewBox.cursor;
            else if (this._hoverOps.length > 0 || (this._cablesHoverButtonRect && this._cablesHoverButtonRect.isHovering())) cur = "pointer";
            else if (this._spacePressed) cur = "grabbing";
        }

        if (this._cursor != cur) this.#cgl.setCursor(cur);

        this._cursor = cur;
    }

    setCursor(c)
    {
        this._cursor = c;
    }

    _removeDropInRect()
    {
        this.#dropInOpBorder.visible = false;
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseMove(e)
    {
        if (this.startLinkButtonDrag)
            this.startLinkButtonDrag.startDragging(e);

        this._dropInCircleLink = this._dropInCircleRect = null;

        if (e.shiftKey) this._pressedShiftKey = true;
        else this._pressedShiftKey = false;

        if (e.ctrlKey) this._pressedCtrlKey = true;
        else this._pressedCtrlKey = false;

        this.emitEvent("mousemove", e);

        if (this._dropInCircleRect)
        {
            let visible = false;
            if (gui.patchView.getSelectedOps().length == 1)
            {
                for (const i in this.selectedGlOps)
                {
                    if (this.selectedGlOps[i].isHovering() && this.selectedGlOps[i].isDragging)
                    {
                        visible = true;

                        const border = 5;
                        this.#dropInOpBorder.setSize(this._selectedGlOps[i].w + border * 2, this._selectedGlOps[i].h + border * 2);
                        this.#dropInOpBorder.setPosition(this._selectedGlOps[i].x - border, this._selectedGlOps[i].y - border);
                        this.#dropInOpBorder.setColorArray(this._dropInCircleRect.color);
                        this.#dropInOpBorder.setOpacity(0.35);
                    }
                }
            }
            else visible = false;

            this.#dropInOpBorder.visible = visible;
        }
        else this.#dropInOpBorder.visible = false;

        this.debugData._onCanvasMouseMove = this.debugData._onCanvasMouseMove || 0;
        this.debugData._onCanvasMouseMove++;

        this.profileMouseEvents = this.profileMouseEvents || 0;
        this.profileMouseEvents++;
    }

    _cycleDebug()
    {
        this._debugRenderStyle = this._debugRenderStyle || 0;

        this._debugRenderStyle++;
        if (this._debugRenderStyle > 3) this._debugRenderStyle = 0;

        for (let i in this.#splineDrawers) this.#splineDrawers[i].setDebugRenderer(this._debugRenderStyle);

        this.#rectInstancer.setDebugRenderer(this._debugRenderStyle);
        this._overLayRects.setDebugRenderer(this._debugRenderStyle);

        this.#textWriter.setDebugRenderer(this._debugRenderStyle);
        this._textWriterOverlay.setDebugRenderer(this._debugRenderStyle);

        /*
         * if (this._debugRenderStyle == 3) this.clear = false;
         * else this.clear = true;
         */
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasDblClick(e)
    {
        let isOverSubPatchOp = false;
        if (this._hoverOps.length > 0)
        {
            isOverSubPatchOp = this._hoverOps[0].op && this._hoverOps[0].op.isSubPatchOp();
        }

        if (isOverSubPatchOp)
        {
            const hoverOp = this._hoverOps[0].op;
            gui.patchView.setCurrentSubPatch(hoverOp.patchId.get());
            gui.patchView.updateSubPatchBreadCrumb(hoverOp.patchId.get());
        }
        else
        if (!this.dblClickAction || this.dblClickAction == "parentSub")
        {
            if (this._currentSubpatch != 0)
            {
                const spOp = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
                if (spOp) gui.patchView.setCurrentSubPatch(spOp.uiAttribs.subPatch);
            }
        }
        else if (this.dblClickAction == "addOp")
        {
            CmdPatch.addOp();
        }
        else if (this.dblClickAction == "centerPatch")
        {
            this.viewBox.centerSelectedOps();
        }

        e.preventDefault();
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseLeave(e)
    {
        if (e.pointerType == "touch") return;

        if (this._pauseMouseUntilButtonUp)
        {
            this._pauseMouseUntilButtonUp = false;
            return;
        }

        if (this.#selectionArea.active)
        {
            this.#selectionArea.hideArea();
        }
        hideToolTip();

        this._lastButton = 0;
        this._mouseLeaveButtons = e.buttons;
        this.emitEvent("mouseleave", e);
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseEnter(e)
    {
        if (e.pointerType == "touch") return;
        if (this._mouseLeaveButtons != e.buttons && e.pointerType == "mouse")
        {
            // reentering with mouse down already - basically block all interaction
            this._pauseMouseUntilButtonUp = true;
            // this._log.log("reenter with different buttons!");
            return;
        }

        this.emitEvent("mouseenter", e);

        if (e.buttons == 0 && this._mouseLeaveButtons != e.buttons)
        {
            // when left while button down but re-entering button up...
            this._lastButton = 0;
            this._onCanvasMouseUp(e);
        }
    }

    _updateGreyout()
    {
        if (this.greyOut && !this._greyOutRect)
        {
            this._greyOutRect = this._overLayRects.createRect({ "interactive": false, "name": "greyoutrect" });
            this._greyOutRect.setColor(
                gui.theme.colors_patch.background[0],
                gui.theme.colors_patch.background[1],
                gui.theme.colors_patch.background[2],
                0.5);
            this._greyOutRect.setSize(20000000, 20000000);
            this._greyOutRect.setPosition(-10000000, -10000000, gluiconfig.zPosGreyOutRect);
        }
        else if (!this.greyOut && this._greyOutRect)
        {
            this._greyOutRect.dispose();
            this._greyOutRect = null;
        }

        /*
         * if (this.greyOutBlue && this._greyOutRect)
         * {
         *     this._greyOutRect.setColor(
         *         gui.theme.colors_patch.background[0] * 0.8,
         *         gui.theme.colors_patch.background[1] * 1.5,
         *         gui.theme.colors_patch.background[2] * 2.5,
         *         0.25);
         * }
         */
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;
        this._removeDropInRect();

        // this._onCanvasMouseMove(e);
        this.viewBox._onCanvasMouseMove(e);

        if (this.mouseState.buttonLeft && !this.isMouseOverOp() && gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();

        try { this.#cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mousedown", e);
        this.#rectInstancer.mouseDown(e);
        this._canvasMouseDown = true;
        this._canvasMouseDownSelecting = this.mouseState.buttonStateForSelecting;
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseUp(e)
    {
        this.linkStartedDragging = false;
        this.startLinkButtonDrag = null;

        if (!this.portDragLine.isActive)
        {
            if (this._pauseMouseUntilButtonUp)
            {
                this._pauseMouseUntilButtonUp = false;
                return;
            }

            if (!this._canvasMouseDown) return;
        }

        this._canvasMouseDown = false;
        const perf = gui.uiProfiler.start("[glpatch] _onCanvasMouseUp");

        this._removeDropInRect();
        this.#rectInstancer.mouseUp(e);

        try { this.#cgl.canvas.releasePointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        // gui.longPressConnector.longPressCancel();
        this.#rectInstancer.interactive = true;

        if (!this.#selectionArea.active && this._canvasMouseDownSelecting && !this.mouseState.buttonStateForSelecting)
        {
            if ((gui.patchView.getSelectedOps().length == 0) || (this._hoverOps.length == 0))
            {
                this.unselectAll();
                gui.showInfo(GuiText.patch);
                gui.patchView.showDefaultPanel();
            }
        }

        if (this.#selectionArea.active)
        {
            this.#selectionArea.hideArea();
        }
        this.emitEvent("mouseup", e);

        if (this._canvasMouseDownSelecting && !this.mouseState.buttonStateForSelecting) this._canvasMouseDownSelecting = false;

        if (this._dropInCircleLink)
        {
            if (gui.patchView.getSelectedOps().length == 1)
            {
                for (const i in this.selectedGlOps)
                {
                    if (this.selectedGlOps[i].isHovering()) // && this.selectedGlOps[i].isDragging
                    {
                        const coord = this.screenToPatchCoord(e.offsetX, e.offsetY);
                        gui.patchView.insertOpInLink(this._dropInCircleLink.link, this.selectedGlOps[i].op, coord[0], coord[1]);

                        this._selectedGlOps[i].op.setUiAttribs(
                            {
                                "translate":
                                {
                                    "x": this.snap.snapOpX(this._selectedGlOps[i].op.uiAttribs.translate.x, this._selectedGlOps[i].op, 100),
                                    "y": coord[1]
                                } });

                        return;
                    }
                }
            }
        }

        perf.finish();

        this._dropInCircleLink = this._dropInCircleRect = null;

        this.#selectionArea.mouseUp();
    }

    /**
     * @param {KeyboardEvent} e
     */
    _onKeyDelete(e)
    {
        gui.patchView.deleteSelectedOps();
        gui.patchView.showDefaultPanel();
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }

    isFocused()
    {
        const isf = document.activeElement == this.#cgl.canvas;

        this.wasFocussed = isf;
        return isf;
    }

    isMouseOverOp()
    {
        return this._hoverOps.length > 0;
    }

    center(x, y)
    {
        if (x === undefined) this.viewBox.centerSelectedOps();
        else this.viewBox.animateScrollTo(x, y, 0, false);
    }

    get lineDrawer()
    {
        return this._lines;
    }

    deleteLink(linkId)
    {
        const l = this.links[linkId];

        if (l)
        {
            delete this.links[linkId];
            l.dispose();
        }
        else
        {
            this._log.log("could not find link to remove!!", linkId);
        }
    }

    deleteOp(opid) // should work  th opid...
    {
        const glop = this._glOpz[opid];

        if (!glop)
        {
            this._log.log("could not find op to delete", opid);
            return;
        }

        delete this._glOpz[opid];
        glop.dispose();
    }

    toggleOpsEnable()
    {
        let willDisable = true;
        const ops = gui.patchView.getSelectedOps();
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.disabled)willDisable = false;
        }

        for (let i = 0; i < ops.length; i++)
        {
            ops[i].setUiAttribs({ "disabled": willDisable });
        }
        gui.opParams.refresh();
    }

    /**
     * @param {GlLink} l
     */
    addLink(l)
    {
        if (this.links[l.id]) this.links[l.id].dispose();
        this.links[l.id] = l;
    }

    /**
     * @param {string} opid
     */
    focusOpAnim(opid)
    {
        this._focusRectOp = this._glOpz[opid];

        this._focusRectAnim.clear();
        this._focusRectAnim.setValue(this._time, 0);
        this._focusRectAnim.setValue(this._time + 0.5, 1);
    }

    /**
     * @param {opid} opid
     */
    focusOp(opid)
    {
        gui.opParams.show(opid);
        this.focusOpAnim(opid);
    }

    /**
     * @param {boolean} _x
     * @param {boolean} _y
     */
    cursorNavOps(_x, _y)
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length == 0) return;
    }

    /**
     * @param {Op} op
     * @param {boolean} fromDeserialize
     */
    addOp(op, fromDeserialize = false)
    {
        if (!op) this._log.error("no op at addop", op);

        if (!fromDeserialize && !op.uiAttribs.hasOwnProperty("subPatch")) op.uiAttribs.subPatch = this._currentSubpatch;

        let glOp = this._glOpz[op.id];
        if (!glOp)
        {
            glOp = new GlOp(this, this.#rectInstancer, op);
            this._glOpz[op.id] = glOp;
        }
        else
        {
            glOp.uiAttribs = op.uiAttribs || {};
        }

        op.on("onPortRemoved", () => { glOp.refreshPorts(); });
        op.on("onPortAdd", () => { glOp.refreshPorts(); });
        op.on("onEnabledChange", () => { glOp.update(); });
        op.on("onUiAttribsChange",
            (newAttribs) =>
            {
                glOp.setUiAttribs(newAttribs, op.uiAttribs);
            });

        if (!op.uiAttribs.translate && op.uiAttribs.createdLocally)
        {
            if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0)
                op.uiAttr({ "translate": { "x": Snap.snapOpPosX(this.viewBox.mousePatchX), "y": Snap.snapOpPosY(this.viewBox.mousePatchY) } });
            else
            {
                if (!CABLES.UI.OPSELECT.newOpPos.noSnap)
                {
                    CABLES.UI.OPSELECT.newOpPos.x = Snap.snapOpPosX(CABLES.UI.OPSELECT.newOpPos.x);
                    CABLES.UI.OPSELECT.newOpPos.y = Snap.snapOpPosY(CABLES.UI.OPSELECT.newOpPos.y);
                }

                op.uiAttr({ "translate": { "x": CABLES.UI.OPSELECT.newOpPos.x, "y": CABLES.UI.OPSELECT.newOpPos.y } });
            }
        }

        glOp.setTitle(op.uiAttribs.title, this.#textWriter);

        if (!fromDeserialize)
        {
            glOp.update();
            this.unselectAll();

            if (gui.finishedLoading() && op.uiAttribs.subPatch == this.getCurrentSubPatch())
            {
                this.selectOpId(op.id);
                gui.opParams.show(op.id);
            }

            if (op.uiAttribs.translate && op.uiAttribs.createdLocally)
            {
                glOp.updatePosition();
            }
        }

        delete op.uiAttribs.createdLocally;
        this.portDragLine.stop();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    screenToPatchCoord(x, y)
    {
        return this.viewBox.screenToPatchCoord(x, y);
    }

    _drawCursor()
    {
        const drawGlCursor = userSettings.get("glpatch_cursor");

        /*
         * if (drawGlCursor) this._cgl.setCursor("none");
         * else
         * {
         *     if (this._cursor == CABLES.GLGUI.CURSOR_HAND) this._cgl.setCursor("move");
         *     else if (this._cursor == CABLES.GLGUI.CURSOR_POINTER) this._cgl.setCursor("pointer");
         *     else this._cgl.setCursor("auto");
         * }
         */

        this._localGlCursor.visible = drawGlCursor;

        const a = this.viewBox.screenToPatchCoord(0, 0);
        const b = this.viewBox.screenToPatchCoord(20, 20);
        const z = (b[0] - a[0]);

        if (drawGlCursor)
        {
            this._localGlCursor.setSize(z, z);
            this._localGlCursor.setPosition(this.viewBox.mousePatchX, this.viewBox.mousePatchY);
        }

        for (const i in this._glCursors)
        {
            if (this._glCursors[i].visible) this._glCursors[i].setSize(z, z);
        }
    }

    updateTime()
    {
        this._time = (performance.now() - this._timeStart) / 1000;
    }

    /**
     * @param {number} resX
     * @param {number} resY
     */
    render(resX, resY)
    {
        if (!gui || !gui.canvasManager) return;
        if (gui.canvasManager.mode == gui.canvasManager.CANVASMODE_PATCHBG)
        {
            this.#cgl.gl.clearColor(0, 0, 0, 0);
        }
        else
        {
            this.#cgl.gl.clearColor(
                gui.theme.colors_patch.background[0],
                gui.theme.colors_patch.background[1],
                gui.theme.colors_patch.background[2],
                gui.theme.colors_patch.background[3]);
        }

        this.updateSubPatchOpAnim();
        this.#cgl.gl.clear(this.#cgl.gl.COLOR_BUFFER_BIT | this.#cgl.gl.DEPTH_BUFFER_BIT);

        if (Object.keys(this._glOpz).length != gui.corePatch().ops.length)
        {
            for (let j = 0; j < gui.corePatch().ops.length; j++)
            {
                if (!this._glOpz[gui.corePatch().ops[j].id] && this._ignoreNonExistError.indexOf(gui.corePatch().ops[j].id) == -1)
                {
                    this._ignoreNonExistError.push(gui.corePatch().ops[j].id);
                    this._log.error("missing glop in glpatch: ", gui.corePatch().ops[j].name);
                }
            }
        }
        this.hasFocus = ele.hasFocus(this.#cgl.canvas);
        this.debugData.splineUpdate = 0;

        for (const i in this._glOpz)
        {
            this._glOpz[i].updateIfNeeded();
        }

        this.frameCount++;
        this.isAnimated = false;

        for (const i in this._glCursors)
            this._glCursors[i].updateAnim();

        this.snap.render(this._canvasMouseDown);

        this._fadeOutRect.visible = !this._fadeOutRectAnim.isFinished(this._time);

        if (this.suggestionTeaser) this.suggestionTeaser.setPos(this.viewBox.mouseX + 10, this.viewBox.mouseY + 30);

        /*
         * if (this._fadeOutRect.visible)
         * {
         *     this.isAnimated = true;
         *     const v = this._fadeOutRectAnim.getValue(this._time);
         */

        // this.subPatchAnim = 1.0 - this._fadeOutRectAnim.getValue(this._time);

        /*
         *     this._fadeOutRect.setColor(
         *         gui.theme.colors_patch.background[0],
         *         gui.theme.colors_patch.background[1],
         *         gui.theme.colors_patch.background[2],
         *         v);
         * }
         */

        this._focusRect.visible = !this._focusRectAnim.isFinished(this._time);
        if (this._focusRect.visible)
        {
            this.isAnimated = true;
            const v = 1.0 - this._focusRectAnim.getValue(this._time);
            const dist = 20;

            if (this._focusRectOp)
            {
                this._focusRect.setPosition(this._focusRectOp.x - v * dist, this._focusRectOp.y - v * dist);
                this._focusRect.setSize(this._focusRectOp.w + v * 2 * dist, this._focusRectOp.h + v * 2 * dist);
                this._focusRect.setColor(1, 1, 1, v);
            }
            else
            {
                this._log.log("no focusrectop");
            }
        }

        this.#cgl.pushDepthTest(true);
        this.#cgl.pushDepthWrite(true);

        // this._showRedrawFlash++;
        // this._redrawFlash.setPosition(0, this._showRedrawFlash % 30, 1000);
        this.viewBox.update();

        this._patchAPI.updateFlowModeActivity(this.vizFlowMode);

        this.viewBox.setSize(resX, resY);

        const starttime = performance.now();

        this.mouseMove(this.viewBox.mousePatchX, this.viewBox.mousePatchY);

        this._drawCursor();

        this.portDragLine.setPosition(this.viewBox.mousePatchX, this.viewBox.mousePatchY);

        const perf = gui.uiProfiler.start("[glpatch] render");

        // this._splineDrawer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);

        this.getSplineDrawer(this._currentSubpatch).render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);
        this.#rectInstancer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);
        this.#textWriter.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);
        this.#overlaySplines.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this.#cgl.popDepthTest();
        this.#cgl.pushDepthTest(false);

        this._overLayRects.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this.#cgl.popDepthTest();
        this.#cgl.pushDepthTest(true);

        this._textWriterOverlay.render(resX, resY, -0.98, 0.94, 600);

        this.#cgl.pushDepthTest(false);
        gui.longPressConnector.glRender(this, this.#cgl, resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);
        this.#cgl.popDepthTest();

        if (this._showingOpCursor)
        {
            this._eleDropOp.style.top = this.viewBox.mouseY - 12 + "px";
            this._eleDropOp.style.left = this.viewBox.mouseX - 37 + "px";
        }

        this.needsRedraw = false;

        if (performance.now() - this._fpsStartTime > 1000)
        {
            this._fpsStartTime = performance.now();
            this.debugData.mouseMovePS = this.profileMouseEvents;
            this.profileMouseEvents = 0;
        }

        this.debugData["glpatch.allowDragging"] = this.allowDragging;
        this.debugData.rects = this.#rectInstancer.getNumRects();
        this.debugData["text rects"] = this.#textWriter.rectDrawer.getNumRects();
        this.debugData.viewZoom = this.viewBox.zoom;
        this.debugData.viewScroll = this.viewBox.scrollX + "," + this.viewBox.scrollY;

        this.debugData._mousePatchX = Math.round(this.viewBox.mousePatchX * 100) / 100;
        this.debugData._mousePatchY = Math.round(this.viewBox.mousePatchY * 100) / 100;
        this.debugData.mouse_isDragging = this.mouseState.isDragging;

        this.debugData.rectInstancer = JSON.stringify(this.#rectInstancer.getDebug(), false, 2);

        // this.mouseState.debug(this.debugData);

        this.debugData.renderMs = Math.round((performance.now() - starttime) * 10) / 10;

        if (this.#cgl.profileData)
        {
            this.debugData.glPrimitives = this.#cgl.profileData.profileMeshNumElements;
            this.debugData.glUpdateAttribs = this.#cgl.profileData.profileMeshAttributes;

            for (let i in this.#cgl.profileData.profileSingleMeshAttribute)
                this.debugData["glUpdateAttribs " + i] = this.#cgl.profileData.profileSingleMeshAttribute[i];

            this.#cgl.profileData.clear();
        }

        this.#cgl.popDepthTest();
        this.#cgl.popDepthWrite();

        this._updateGreyout();
        perf.finish();

        this.updateCursor();

        this.#cgl.profileData.clearGlQuery();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {MouseEvent} [e]
     */
    mouseMove(x, y, e)
    {
        if (this.cutLineActive)
        {
            if (
                this.viewBox.mousePatchX == this._cutLine[this._cutLine.length - 3] &&
                this.viewBox.mousePatchY == this._cutLine[this._cutLine.length - 2]) return;

            for (let i in this.links)
            {
                if (this.links[i].collideLine(
                    this._cutLine[this._cutLine.length - 3], this._cutLine[this._cutLine.length - 2], this.viewBox.mousePatchX, this.viewBox.mousePatchY))
                {
                    this.links[i].unlink();
                }
            }

            this._cutLine.push(this.viewBox.mousePatchX, this.viewBox.mousePatchY, 0);

            if (!this._cutLineIdx)
                this._cutLineIdx = this.#overlaySplines.getSplineIndex();

            this.#overlaySplines.setSpline(this._cutLineIdx, [...this._cutLine]); // copy dat array
            this.#overlaySplines.setSplineColor(this._cutLineIdx, [1, 0, 0, 1]);

            return;
        }

        if (this._oldMouseMoveX == x && this._oldMouseMoveY == y) return;

        this._oldMouseMoveX = x;
        this._oldMouseMoveY = y;
        if (!this.portDragLine.isActive)
            if (this._pauseMouseUntilButtonUp) return;

        let allowSelectionArea = !this.portDragLine.isActive;
        if (this.#selectionArea.active)allowSelectionArea = true;

        this.#rectInstancer.mouseMove(x, y, this.mouseState.getButton(), e);

        if (this.#rectInstancer.isDragging()) return;

        /*
         * if (!this.mouseState.isDragging)
         * else this._hoverOps = [];
         */

        let preId = -1;
        if (this._hoverOps.length) preId = this._hoverOps[0].id;

        this._hoverOps = this._getGlOpsInRect(x, y, x + 1, y + 1);

        if (this._hoverOps.length && this._hoverOps[0].id != preId) this._hoverOpLongStartTime = performance.now();
        if (!this._hoverOps.length) this._hoverOpLongStartTime = 0;

        if (this.mouseState.isButtonDown())
        {
        }
        else
        {
            this._hoverDragOp = null;
        }

        if (this._cablesHoverButtonRect && this._cablesHoverButtonRect.isHovering()) allowSelectionArea = false;
        if (this.#selectionArea.h == 0 && this._hoverOps.length > 0) allowSelectionArea = false;
        if (this._lastButton == 1 && this.mouseState.buttonLeft) this.#selectionArea.hideArea();

        if (gui.longPressConnector.isActive())
        {
            const ops = this._getGlOpsInRect(x, y, x + 1, y + 1);
            if (ops.length > 0 && this._focusRectAnim.isFinished(this._time) && gui.longPressConnector.getStartOp().id != ops[0].id) this.focusOpAnim(ops[0].id);
        }

        if (this.mouseState.buttonStateForSelectionArea && allowSelectionArea && this.mouseState.isDragging && this.mouseState.mouseOverCanvas)
        {
            if (this.#rectInstancer.interactive)
                if (this._pressedShiftKey || this._pressedCtrlKey) this.#selectionArea.previousOps = gui.patchView.getSelectedOps();

            this.#rectInstancer.interactive = false;

            this.#selectionArea.setPos(this.#lastMouseX, this.#lastMouseY);
            this.#selectionArea.setSize((x - this.#lastMouseX), (y - this.#lastMouseY));
            this._selectOpsInRect(x, y, this.#lastMouseX, this.#lastMouseY);

            if (this._pressedShiftKey)
            {
                for (let i = 0; i < this.#selectionArea.previousOps.length; i++)
                {
                    this.#selectionArea.previousOps[i].selected = true;
                    this.selectOpId(this.#selectionArea.previousOps[i].id);
                }
            }

            if (this._pressedCtrlKey)
            {
                let unselIds = [];

                for (let i in this._selectedGlOps)
                    unselIds.push(this._selectedGlOps[i].id);

                for (let i = 0; i < this.#selectionArea.previousOps.length; i++)
                {
                    this.#selectionArea.previousOps[i].selected = true;
                    this.selectOpId(this.#selectionArea.previousOps[i].id);
                }

                for (let i = 0; i < unselIds.length; i++)
                    this.unSelectOpId(unselIds[i]);
            }

            gui.emitEvent("drawSelectionArea", this.#lastMouseX, this.#lastMouseY, (x - this.#lastMouseX), (y - this.#lastMouseY));

            gui.patchView.showSelectedOpsPanel();

            this._updateNumberOfSelectedOps();
        }
        else
        {
            this.#numSelectedGlOps = -1;
            if (this.#selectionArea.isVisible())
            {
                this.#selectionArea.previousOps = [];
                this.#selectionArea.hideArea();
            }
            this.#lastMouseX = x;
            this.#lastMouseY = y;
        }

        this._lastButton = this.mouseState.getButton();
    }

    _updateNumberOfSelectedOps()
    {
        if (this.#numSelOpsTimeout) clearTimeout(this.#numSelOpsTimeout);
        this.#numSelOpsTimeout = setTimeout(() =>
        {
            this.#numSelOpsTimeout = null;
            const numSelectedOps = Object.keys(this._selectedGlOps).length;
            const changedNumOps = this.#numSelectedGlOps != numSelectedOps;
            this.#numSelectedGlOps = numSelectedOps;
            if (changedNumOps) this.emitEvent("selectedOpsChanged", numSelectedOps);
        }, 20);
    }

    /**
     * @param {number} xa
     * @param {number} ya
     * @param {number} xb
     * @param {number} yb
     */
    _getGlOpsInRect(xa, ya, xb, yb)
    {
        if (this.cacheOIRxa == xa && this.cacheOIRya == ya && this.cacheOIRxb == xb && this.cacheOIRyb == yb)
            return this.cacheOIRops;

        const perf = gui.uiProfiler.start("[glpatch] ops in rect");
        const x = Math.min(xa, xb);
        const y = Math.min(ya, yb);
        const x2 = Math.max(xa, xb);
        const y2 = Math.max(ya, yb);
        const ops = [];

        const cops = gui.corePatch().getSubPatchOps();

        for (let j = 0; j < cops.length; j++)
        {
            // for (const i in this._glOpz)
            if (cops[j])
            {
                const glop = this._glOpz[cops[j].id];
                if (!glop || !glop.visible) continue;

                if (glop.x + glop.w >= x && // glop. right edge past r2 left
                        glop.x <= x2 && // glop. left edge past r2 right
                        glop.y + glop.h >= y && // glop. top edge past r2 bottom
                        glop.y <= y2) // r1 bottom edge past r2 top
                {
                    ops.push(glop);
                }
            }
            // else console.log("no c op");
        }

        perf.finish();

        this.cacheOIRxa = xa;
        this.cacheOIRya = ya;
        this.cacheOIRxb = xb;
        this.cacheOIRyb = yb;

        this.cacheOIRops = ops;
        return ops;
    }

    unselectAll()
    {
        const perf = gui.uiProfiler.start("[glpatch] unselectAll");

        for (const i in this._glOpz) if (this._glOpz[i].selected) this._glOpz[i].selected = false;
        this._selectedGlOps = {};
        this._cachedNumSelectedOps = 0;
        this._cachedFirstSelectedOp = null;
        this._updateNumberOfSelectedOps();

        perf.finish();
    }

    /**
     * @param {Op} op
     */
    getGlOp(op)
    {
        return this._glOpz[op.id];
    }

    /**
     * @param {String} id
     */
    setSelectedOpById(id)
    {
        this.unselectAll();

        if (this._glOpz[id] && !this._glOpz[id].isInCurrentSubPatch()) this.setCurrentSubPatch(this._glOpz[id].getSubPatch());
        this.selectOpId(id);
    }

    getNumSelectedOps()
    {
        return this._cachedNumSelectedOps;
    }

    getOnlySelectedOp()
    {
        if (this._cachedNumSelectedOps == 1 && this._cachedFirstSelectedOp) return this._cachedFirstSelectedOp.op;
    }

    isDraggingOps()
    {
        if (this._cachedFirstSelectedOp) return this._cachedFirstSelectedOp.isDragging;
        else return false;
    }

    /**
     * @param {String} id
     */
    selectOpId(id)
    {
        if (this._glOpz[id] && !this._selectedGlOps[id])
        {
            this._selectedGlOps[id] = this._glOpz[id];
            this._cachedNumSelectedOps++;
            if (this._cachedNumSelectedOps == 1) this._cachedFirstSelectedOp = this._glOpz[id];

            this._glOpz[id].selected = true;
            gui.corePatch().getOpById(id).setUiAttrib({ "selected": true });
        }

        if (gui.patchView.getSelectedOps().length > 1)gui.patchView.showSelectedOpsPanel();
    }

    /**
     * @param {String} id
     */
    unSelectOpId(id)
    {
        if (this._glOpz[id])
        {
            delete this._selectedGlOps[id];

            this._glOpz[id].selected = false;
            this._cachedNumSelectedOps--;
        }
    }

    updateSubPatchOpAnim()
    {
        if (this._subpatchoprect)
        {
            this._subpatchoprect.setPosition(this._subpatchAnimOutX.getValue(this._time), this._subpatchAnimOutY.getValue(this._time), gluiconfig.zPosGlRectSelected);
            this._subpatchoprect.setSize(this._subpatchAnimOutW.getValue(this._time), this._subpatchAnimOutH.getValue(this._time));
            this._subpatchoprect.setOpacity(this._subpatchAnimFade.getValue(this._time));
        }
    }

    /**
     * @param {import("cables-corelibs").BoundingBox} bounds
     * @param {Function} next
     */
    subPatchOpAnimStart(bounds, next)
    {
        this._subpatchAnimFade = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutX = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutY = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutW = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });
        this._subpatchAnimOutH = new Anim({ "defaultEasing": Anim.EASING_CUBIC_OUT });

        /*
         * this._subpatchAnimFade.clear();
         * this._subpatchAnimFade.setValue(this._time, 0.0);
         * this._subpatchAnimFade.setValue(this._time + 0.25, 1.0);
         */

        if (this._subpatchoprect) this._subpatchoprect.dispose();
        this._subpatchoprect = this._overLayRects.createRect({ "name": "subpatchoprect", "interactive": false });

        let col = gui.theme.colors_patch.opBgRect;
        this._subpatchoprect.setColorArray(col);

        let dur = 0.4;

        this._subpatchAnimFade.setValue(this._time, 0.0);
        this._subpatchAnimFade.setValue(this._time + dur, 0.4, () =>
        {
            if (next)
            {
                this.paused = true;
                next();
            }
        });
        this._subpatchoprect.setBorder(gluiconfig.subPatchOpBorder);
        this._subpatchAnimOutX.setValue(this._time, bounds.minX - gui.theme.patch.selectedOpBorderX / 2);
        this._subpatchAnimOutY.setValue(this._time, bounds.minY - gui.theme.patch.selectedOpBorderY / 2);
        this._subpatchAnimOutW.setValue(this._time, bounds.size[0] + gui.theme.patch.selectedOpBorderX);
        this._subpatchAnimOutH.setValue(this._time, bounds.size[1] + gui.theme.patch.selectedOpBorderY);

        this.updateSubPatchOpAnim();
    }

    /**
     * @param {string | number} opid
     */
    subPatchOpAnimEnd(opid)
    {
        // clearTimeout(this.pauseTimeOut);
        this.paused = false;
        const dur = 0.25;
        const glop = this._glOpz[opid];

        this._subpatchAnimOutX.clear();
        this._subpatchAnimOutX.setValue(this._time, this._subpatchoprect.x);
        this._subpatchAnimOutX.setValue(this._time + dur, glop.op.uiAttribs.translate.x);

        this._subpatchAnimOutY.clear();
        this._subpatchAnimOutY.setValue(this._time, this._subpatchoprect.y);
        this._subpatchAnimOutY.setValue(this._time + dur, glop.op.uiAttribs.translate.y);

        this._subpatchAnimOutW.clear();
        this._subpatchAnimOutW.setValue(this._time, this._subpatchoprect.w);
        this._subpatchAnimOutW.setValue(this._time + dur, glop.w);

        this._subpatchAnimOutH.clear();
        this._subpatchAnimOutH.setValue(this._time, this._subpatchoprect.h);
        this._subpatchAnimOutH.setValue(this._time + dur, glop.h);

        this._subpatchAnimFade.clear();
        this._subpatchAnimFade.setValue(this._time, 1);
        this._subpatchAnimFade.setValue(this._time + dur / 2, 1.0);
        this._subpatchAnimFade.setValue(this._time + dur, 0.0, () =>
        {
            this._subpatchoprect.dispose();
            this._subpatchoprect = null;
        });
    }

    /**
     * @param {number} xa
     * @param {number} ya
     * @param {number} xb
     * @param {number} yb
     */
    _selectOpsInRect(xa, ya, xb, yb)
    {
        const ops = this._getGlOpsInRect(xa, ya, xb, yb);

        const perf = gui.uiProfiler.start("[glpatch] _selectOpsInRect");

        const opIds = [];
        for (let i = 0; i < ops.length; i++)
            opIds.push(ops[i].id);

        for (let i in this._selectedGlOps)
        {
            if (opIds.indexOf(i) == -1)
            {
                this._selectedGlOps[i].selected = false;
                delete this._selectedGlOps[i];
            }
        }

        this._cachedNumSelectedOps = Object.keys(this._selectedGlOps).length;

        for (let i = 0; i < ops.length; i++)
        {
            ops[i].selected = true;
            this.selectOpId(ops[i].id);
        }
        perf.finish();
    }

    getZoomForAllOps()
    {
        // this._log.log(this.getOpBounds());
        return 1200;
    }

    /**
     * @param {Op[]} ops
     */
    getOpBounds(ops)
    {
        return gui.patchView.getOpBounds(ops);
    }

    dispose()
    {
        for (const i in this._glOpz)
        {
            this._glOpz[i].dispose();
            delete this._glOpz[i];
        }

        for (let i in this.links)
        {
            this.links[i].dispose();
        }

        this.links = {};
        this._glOpz = {};

        if (this.#rectInstancer) this.#rectInstancer.dispose();
        if (this._lines) this._lines.dispose();
    }

    reset()
    {
    }

    /**
     * @param {string} opid
     */
    getOp(opid)
    {
        return this._glOpz[opid];
    }

    // make static util thing...
    /**
     * @param {import("./glcable.js").default} e
     * @param {number} t
     * @param {number} [diff]
     */
    setDrawableColorByType(e, t, diff)
    {
        if (!e) return;
        diff = diff || gluiconfig.colorMulInActive;

        let col = [0, 0, 0, 0];
        if (!gui.theme.colors.types) return;

        if (t == portType.number) if (gui.theme.colors.types.num) col = [gui.theme.colors.types.num[0] * diff, gui.theme.colors.types.num[1] * diff, gui.theme.colors.types.num[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else if (t == portType.trigger) if (gui.theme.colors.types.trigger) col = [gui.theme.colors.types.trigger[0] * diff, gui.theme.colors.types.trigger[1] * diff, gui.theme.colors.types.trigger[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else if (t == portType.object) if (gui.theme.colors.types.obj) col = [gui.theme.colors.types.obj[0] * diff, gui.theme.colors.types.obj[1] * diff, gui.theme.colors.types.obj[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else if (t == portType.array) if (gui.theme.colors.types.arr) col = [gui.theme.colors.types.arr[0] * diff, gui.theme.colors.types.arr[1] * diff, gui.theme.colors.types.arr[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else if (t == portType.string) if (gui.theme.colors.types.str) col = [gui.theme.colors.types.str[0] * diff, gui.theme.colors.types.str[1] * diff, gui.theme.colors.types.str[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else if (t == portType.dynamic) if (gui.theme.colors.types.dynamic) col = [gui.theme.colors.types.dynamic[0] * diff, gui.theme.colors.types.dynamic[1] * diff, gui.theme.colors.types.dynamic[2] * diff, 1]; else col = [0.7, 0.7, 0.7, 1];
        else this._log.warn("unknown port color");
        e.setColor(col[0], col[1], col[2], col[3]);
    }

    isDraggingPort()
    {
        return this.portDragLine.isActive;
    }

    get dragLine()
    {
        return this.portDragLine;
    }

    get allowDragging()
    {
        return this.#rectInstancer.allowDragging;
    }

    set allowDragging(b)
    {
        this.#rectInstancer.allowDragging = b;
    }

    /**
     * @param {string} opid
     * @param {string} portname
     */
    getConnectedGlPorts(opid, portname)
    {
        const op = this.getOp(opid);
        return op.getGlPortsLinkedToPort(opid, portname);
    }

    focus()
    {
        this.#cgl.canvas.focus();
    }

    /**
     * @param {ClipboardEvent} e
     */
    cut(e)
    {
        gui.patchView.clipboardCutOps(e);
    }

    /**
     * @param {ClipboardEvent} e
     */
    copy(e)
    {

        /*
         * todo play copy indicator anim
         * for (const i in selectedOps) selectedOps[i].oprect.showCopyAnim();
         */
        gui.patchView.clipboardCopyOps(e);
    }

    /**
     * @param {ClipboardEvent} e
     */
    paste(e)
    {
        gui.patchView.clipboardPaste(e, this._currentSubpatch, this.viewBox.mousePatchX, this.viewBox.mousePatchY, (ops, _focusSubpatchop) =>
        {
            this.unselectAll();
            for (let i = 0; i < ops.length; i++)
            {
                this.selectOpId(ops[i].id);
            }

            if (ops[ops.length - 1])gui.opParams.show(ops[ops.length - 1].id);
            if (ops.length == 1) this.focusOpAnim(ops[0].id);
        });
    }

    getCurrentSubPatch()
    {
        if (this._currentSubpatch === undefined)
        {
            this._log.warn("current subpatch undefined");
            this.setCurrentSubPatch(0);
        }
        return this._currentSubpatch;
    }

    /**
     * @param {number|string} sub
     * @param {function} [next]
     */
    setCurrentSubPatch(sub, next)
    {
        if (this._currentSubpatch == sub)
        {
            for (const i in this._glOpz)
                this._glOpz[i].updateVisible();

            if (next)next();
            return;
        }

        if (sub === undefined)
        {
            this._log.warn("current subpatch undefined");
            return;
            // throw new Error("current subpatch undefined");
        }
        this.unselectAll();
        if (sub != 0 && sub != this._currentSubpatch) this._log.log("set subpatch: ", sub);
        this._currentSubpatch = sub;

        /*
         * this._fadeOutRectAnim.clear();
         * this._fadeOutRectAnim.setValue(this._time, 0);
         * this._fadeOutRectAnim.setValue(this._time + timeGrey, 1.0);
         * this._fadeOutRectAnim.setValue(this._time + timeGrey + 2, 1);
         * this._fadeOutRectAnim.setValue(this._time + timeVisibleAgain, 0);
         */

        gui.patchView.updateSubPatchBreadCrumb(sub);

        /*
         * setTimeout(() =>
         * {
         */
        for (const i in this._glOpz)
        {
            this._glOpz[i].updateVisible();
        }

        for (const i in this.links)
        {
            this.links[i].updateVisible();
        }

        this.restoreSubPatchViewBox(sub, next);
        this.snap.update();
    }

    /**
     * @param {string | number} sub
     * @param {Function} [next]
     */
    restoreSubPatchViewBox(sub, next)
    {
        const dur = 0.3;
        const timeGrey = dur * 1.5;
        const timeVisibleAgain = dur * 3.0;

        this.viewBox.animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain, next);
    }

    storeSubPatchViewBox()
    {
        this.viewBox.storeCurrentSubPatch();
    }

    serialize(dataUi)
    {
        this.viewBox.serialize(dataUi);
    }

    setProject(proj)
    {
        this.viewBox.deSerialize(proj.ui);
    }

    get spacePressed()
    {
        return this._spacePressed;
    }

    pause()
    {
        this.#cgl.canvas.style["background-color"] = "rgba(61,61,61,1)";
        this.paused = true;
        this.emitEvent("paused");
    }

    resume()
    {
        this.#cgl.canvas.style["background-color"] = "transparent";
        this.paused = false;
        this.emitEvent("resumed");
    }

    /**
     * @param {number} _x
     * @param {number} _y
     * @param {number} _w
     * @param {number} _h
     */
    setSize(_x, _y, _w, _h)
    {
    }

    /**
     * @param {number} s
     */
    zoomStep(s)
    {
        this.viewBox.zoomStep(s);
    }

    /**
     * @param {boolean} show
     */
    showOpCursor(show)
    {
        if (this._showingOpCursor != show)
        {
            this._showingOpCursor = show;
            if (show) ele.show(this._eleDropOp);
            else ele.hide(this._eleDropOp);
        }
    }

    pauseInteraction()
    {
        this.#cgl.canvas.style["pointer-events"] = "none";
        this.vizLayer.pauseInteraction();
    }

    resumeInteraction()
    {
        this.#cgl.canvas.style["pointer-events"] = "initial";
        this.vizLayer.resumeInteraction();
    }

    /**
     * @param {string|number} subpatchId
     * @returns {GlSplineDrawer} splinedrawer
     */
    getSplineDrawer(subpatchId)
    {
        if (this.#splineDrawers.hasOwnProperty(subpatchId)) return this.#splineDrawers[subpatchId];
        else
        {
            this.#splineDrawers[subpatchId] = new GlSplineDrawer(this.#cgl, "patchCableSplines_" + subpatchId);
            this.#splineDrawers[subpatchId].width = userSettings.get("glcablewidth") || 1 || gui.theme.patch.cablesWidth;
            return this.#splineDrawers[subpatchId];
        }
    }

    /**
     * @param {MouseEvent} e
     * @param {GlLink} link
     */
    setHoverLink(e, link)
    {
        this._hoverLink = link;
        if (link && e)
        {
            clearTimeout(this._ttTImeout);
            updateHoverToolTip(e, link._link.portOut, link);
        }

        if (!link)
        {
            clearTimeout(this._ttTImeout);

            this._ttTImeout = setTimeout(() =>
            {
                hideToolTip();
            }, 100);
        }
    }

    updateTheme()
    {
        this.#selectionArea.updateTheme();

        for (let i in this._glOpz)
            this._glOpz[i].updateTheme();

        this.updateCableWidth();
    }

    updateCableWidth()
    {
        for (const i in this.#splineDrawers)
        {
            this.#splineDrawers[i].width = userSettings.get(GlPatch.USERPREF_GLPATCH_CABLE_WIDTH) || gui.theme.patch.cablesWidth;
        }

    }

    /**
     * @param {string} ns
     */
    static getOpNamespaceColor(ns)
    {
    // make static util thing...
        const parts = ns.split(".");
        const nss = parts[0] + "." + parts[1];

        if (!gui.theme.colors_namespaces) return [1, 1, 1, 1];

        if (gui.theme.colors_namespaces[nss]) return gui.theme.colors_namespaces[nss];
        else return gui.theme.colors_namespaces.unknown || [1, 0, 0, 1];
    }

    get splineDrawers()// todo: delete, was debug
    {
        return this.#splineDrawers;
    }
}
