import GlLinedrawer from "../gldraw/gllinedrawer";
import GlRectInstancer from "../gldraw/glrectinstancer";
import GlSplineDrawer from "../gldraw/glsplinedrawer";
import GlTextWriter from "../gldraw/gltextwriter";
import GlText from "../gldraw/gltext";
import GlDragLine from "./gldragline";
import GlSelectionArea from "./glselectionarea";
import GlViewBox from "./glviewbox";
import GlOp from "./glop";
import MouseState from "./mousestate";
import GlCursor from "./glcursor";
import glUiConfig from "./gluiconfig";
import ShakeDetector from "./shakedetect";
import SnapLines from "./snaplines";
import VizLayer from "./vizlayer";
import Logger from "../utils/logger";
import ele from "../utils/ele";
import text from "../text";
import userSettings from "../components/usersettings";
import Gui from "../gui";
import glEditableSpline from "./gleditablespline";
import defaultops from "../defaultops";


export default class GlPatch extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();

        this.logEvents(false, "glpatch");
        if (!cgl) this._logonsole.error("[glpatch] need cgl");


        this._log = new Logger("glpatch");
        this.paused = false;
        this.blueprint = false;

        this.clear = true;
        this._cgl = cgl;
        this.mouseState = new MouseState(cgl.canvas);

        this._time = 0;
        this._timeStart = performance.now();
        this.isAnimated = false;

        this._mouseLeaveButtons = 0;

        this._cutLine = [];
        this.cutLineActive = false;

        this._glOpz = {};
        this._hoverOps = [];
        this._hoverOpLongStartTime = 0;
        this._patchAPI = null;
        this._showRedrawFlash = 0;
        this.debugData = {};

        this.greyOut = false;
        this._greyOutRect = null;
        this.startLinkButtonDrag = null;

        this.frameCount = 0;

        this._overlaySplines = new GlSplineDrawer(cgl, "overlaysplines");
        this._overlaySplines.zPos = 0.5;
        // this._splineDrawer = new GlSplineDrawer(cgl, "patchCableSplines");
        this._splineDrawers = { "0": new GlSplineDrawer(cgl, "patchCableSplines_0") };

        this.viewBox = new GlViewBox(cgl, this);

        this._rectInstancer = new GlRectInstancer(cgl, { "name": "mainrects", "initNum": 1000 });
        this._lines = new GlLinedrawer(cgl, { "name": "links", "initNum": 100 });
        this._overLayRects = new GlRectInstancer(cgl, { "name": "overlayrects" });

        this._textWriter = new GlTextWriter(cgl, { "name": "mainText", "initNum": 1000 });
        this._textWriterOverlay = new GlTextWriter(cgl, { "name": "textoverlay" });
        this._currentSubpatch = 0;
        this._selectionArea = new GlSelectionArea(this._overLayRects, this);
        this._lastMouseX = this._lastMouseY = -1;
        this._portDragLine = new GlDragLine(this._overlaySplines, this);

        // this._glTestSpline = new glEditableSpline(this._overlaySplines, this._rectInstancer, this);

        this.cablesHoverText = new GlText(this._textWriter, "");
        this.cablesHoverText.setPosition(0, 0);
        this.cablesHoverText.setColor(1, 1, 1, 0);

        // this._hoverCable = new GlCable(this, this._overlaySplines, this.rectDrawer.createRect({}), 10);
        // this._hoverCable.setPosition(0, 0, 100, 100);
        // this._hoverCable.setColor(1, 1, 1, 0.5);
        this._showingOpCursor = false;
        this._eleDropOp = ele.byId("drop-op-cursor");

        this._fpsStartTime = 0;

        this.cacheOIRxa = 0;
        this.cacheOIRya = 0;
        this.cacheOIRxb = 0;
        this.cacheOIRyb = 0;
        this.cacheOIRops = null;

        this._focusRectAnim = new CABLES.Anim({ "defaultEasing": CABLES.EASING_CUBIC_OUT });
        this._focusRect = this._overLayRects.createRect();
        this._focusRect.setSize(1, 1);
        this._focusRect.setShape(4);
        this._focusRect.setColor(0, 1, 1, 1);
        this._focusRect.visible = false;


        // this._testAreaRect = this._overLayRects.createRect();
        // this._testAreaRect.setSize(0, 0);
        // this._testAreaRect.setShape(4);
        // this._testAreaRect.setColor(0, 0, 0, 0.2);
        // this._testAreaRect.visible = true;


        this._glCursors = {};
        this._localGlCursor = new GlCursor(this, this._overLayRects);
        this._localGlCursor.setColor(1, 1, 1, 1);
        this._glCursors[0] = this._localGlCursor;

        this._glSelectionAreas = {};

        this.opShakeDetector = new ShakeDetector();
        this.opShakeDetector.on("shake", () => { if (gui.patchView.getSelectedOps().length === 1)gui.patchView.unlinkSelectedOps(); });

        this.snapLines = new SnapLines(cgl, this, this._rectInstancer);

        this._redrawFlash = this._overLayRects.createRect();
        this._redrawFlash.setSize(50, 5);
        this._redrawFlash.setColor(0, 1, 0, 1);

        this._fadeOutRectAnim = new CABLES.Anim({ "defaultEasing": CABLES.EASING_LINEAR });
        this._fadeOutRect = this._overLayRects.createRect();
        this._fadeOutRect.setSize(100000000, 100000000);
        this._fadeOutRect.setPosition(-50000000, -50000000);
        this._fadeOutRect.setColor(0, 0, 0, 0.0);
        this._fadeOutRect.visible = true;

        this._cursor = CABLES.GLGUI.CURSOR_NORMAL;


        // this._debugtext = new Text(this._textWriterOverlay, "hello");

        this._viewZoom = 0;
        this.needsRedraw = false;
        this._selectedGlOps = {};

        this.links = {};
        this.zIndex = 0;

        this._dropInCircleRect = null;

        this._dropInOpBorder = this._overLayRects.createRect();
        this._dropInOpBorder.setSize(100, 100);
        // this._dropInOpBorder.setShape(4);
        this._dropInOpBorder.setColor(1, 0, 0, 1);
        this._dropInOpBorder.visible = false;

        this._cachedNumSelectedOps = 0;
        this._cachedFirstSelectedOp = null;

        cgl.canvas.addEventListener("touchstart", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("touchend", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("touchmove", this._onCanvasMouseMove.bind(this));

        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("pointerleave", this._onCanvasMouseLeave.bind(this));
        cgl.canvas.addEventListener("pointerenter", this._onCanvasMouseEnter.bind(this));
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("dblclick", this._onCanvasDblClick.bind(this));


        gui.keys.key(["Delete", "Backspace"], "Delete selected ops", "down", cgl.canvas.id, {}, this._onKeyDelete.bind(this));
        gui.keys.key("f", "Toggle flow visualization", "down", cgl.canvas.id, {}, (e) =>
        {
            let fm = userSettings.get("glflowmode") || 0;
            fm++;

            if (fm == 3)fm = 0;

            const modes = ["Off", "Highlight Active", "Show Dataflow"];

            CABLES.UI.notify("Flow Visualization: ", modes[fm]);

            userSettings.set("glflowmode", fm);
        });

        gui.keys.key(" ", "Drag left mouse button to pan patch", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this._spacePressed = true; this.emitEvent("spacedown"); });
        gui.keys.key(" ", "", "up", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this._spacePressed = false; this.emitEvent("spaceup"); });

        gui.keys.key("e", "Edit op code", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { CABLES.CMD.PATCH.editOp(true); });
        gui.keys.key("c", "Center Selected Ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) =>
        {
            this.viewBox.centerSelectedOps();
            if (gui.patchView.getSelectedOps().length == 1)
                this.focusOpAnim(gui.patchView.getSelectedOps()[0].id);
        });
        gui.keys.key("x", "Unlink selected ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { gui.patchView.unlinkSelectedOps(); });

        gui.keys.key("x", "Unlink selected ops first ports only", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { gui.patchView.unlinkSelectedOps(true); });

        gui.keys.key("u", "Goto parent subpatch", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { CABLES.CMD.PATCH.gotoParentSubpatch(); });

        gui.keys.key("a", "Select all ops in current subpatch", "down", cgl.canvas.id, { "cmdCtrl": true, "displayGroup": "editor" }, (e) => { gui.patchView.selectAllOpsSubPatch(this._currentSubpatch); });
        gui.keys.key("a", "Align selected ops", "down", cgl.canvas.id, { "displayGroup": "editor" }, () => { gui.patchView.alignOps(gui.patchView.getSelectedOps()); });
        gui.keys.key("a", "Compress selected ops vertically", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps()); });

        gui.keys.key("j", "Navigate op history back", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { gui.opHistory.back(); });
        gui.keys.key("k", "Navigate op history forward", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { gui.opHistory.forward(); });

        gui.keys.key("j", "Navigate op history back", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { gui.opHistory.back(); });
        gui.keys.key("k", "Navigate op history forward", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { gui.opHistory.forward(); });

        gui.keys.key("d", "Disable Op", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this.toggleOpsEnable(); });
        gui.keys.key("d", "Temporary unlink op", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { gui.patchView.tempUnlinkOp(); });

        gui.keys.key("!", "debug", "down", cgl.canvas.id, { "shiftKey": true, "displayGroup": "editor" }, (e) => { this._cycleDebug(); });

        gui.keys.key("+", "Zoom In", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this.zoomStep(-1); });
        gui.keys.key("=", "Zoom In", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this.zoomStep(-1); });
        gui.keys.key("-", "Zoom Out", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { this.zoomStep(1); });

        gui.keys.key("t", "Set Title", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) => { CABLES.CMD.PATCH.setOpTitle(); });

        gui.keys.key("y", "Cut Cables", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) =>
        {
            if (!this.cutLineActive) this._cutLine = [];
            this.cutLineActive = true;
        });

        gui.keys.key("y", "Cut Cables", "up", cgl.canvas.id, { "displayGroup": "editor" }, (e) =>
        {
            this.cutLineActive = false;
            this._overlaySplines.setSpline(this._cutLineIdx, [0, 0, 0, 0, 0, 0]);
        });


        // gui.keys.key("Enter", "enter subpatch", "down", cgl.canvas.id, { "displayGroup": "editor" }, (e) =>
        // {
        //     if (!this.isMouseOverOp()) return;

        //     console.log(this._hoverOps[0]);
        //     if (defaultops.isSubPatchOpName(this._hoverOps[0].objName))
        //     {
        //         console.log("jo...");
        //         gui.patchView.setCurrentSubPatch(this._hoverOps[0]._op.patchId.get());
        //     }
        // });


        // gui.keys.key("p", "Preview", "down", cgl.canvas.id, { }, (e) => { this.vizLayer.addCurrentPort(); });
        // gui.keys.key(" ", "Play/Pause timeline", "up", cgl.canvas.id, { "displayGroup": "editor" }, this.spaceButtonUp);

        gui.on("uiloaded", () =>
        {
            this.snapLines.update();
            // update remote cursor positions
            gui.on("netCursorPos", (msg) =>
            {
                if (!this._glCursors[msg.clientId]) this._glCursors[msg.clientId] = new GlCursor(this, this._overLayRects, msg.clientId);
                if (msg.hasOwnProperty("subpatch") && gui.patchView.getCurrentSubPatch() !== msg.subpatch)
                {
                    this._glCursors[msg.clientId].visible = false;
                }
                else
                {
                    this._glCursors[msg.clientId].visible = true;
                    this._glCursors[msg.clientId].setPosition(msg.x, msg.y);
                }
            });

            gui.on("netSelectionArea", (msg) =>
            {
                if (!this._glSelectionAreas[msg.clientId]) this._glSelectionAreas[msg.clientId] = new GlSelectionArea(this._overLayRects, this);
                const area = this._glSelectionAreas[msg.clientId];
                if (msg.hide)
                {
                    area.hideArea();
                }
                else
                {
                    area.setColor([msg.color.r, msg.color.g, msg.color.b, glUiConfig.colors.patchSelectionArea[3]]);
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
                        // set subpatch and revert greyout-state to what is appropriate for this
                        // client in multiplayer session
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
                        {
                            gui.patchView.patchRenderer.viewBox.animateZoom(msg.zoom);
                        }
                    }


                    if (gui.patchView.patchRenderer.viewBox)
                    {
                        // why negate X here?
                        gui.patchView.patchRenderer.viewBox.scrollTo(-msg.scrollX, msg.scrollY);
                    }
                    else
                    {
                        this.center(msg.scrollX, msg.scrollY);
                    }
                }
            });

            // remove client on connection lost
            gui.on("netClientRemoved", (msg) =>
            {
                if (this._glCursors[msg.clientId])
                {
                    this._glCursors[msg.clientId].visible = false;
                }
            });

            gui.on("netLeaveSession", (msg) =>
            {
                if (msg.clients)
                {
                    msg.clients.forEach((client) =>
                    {
                        if (this._glCursors[client.clientId])
                        {
                            this._glCursors[client.clientId].visible = false;
                        }
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


        userSettings.on("onChange", (key, value) =>
        {
            // this._log.log("linetype changed!", value);
            if (key == "linetype")
                for (let i in this.links)
                    this.links[i].updateLineStyle();
        });

        this.snapLines.update();
    }


    get name() { return "glpatch"; }

    get time() { return this._time; }

    set patchAPI(api) { this._patchAPI = api; }

    get patchAPI() { return this._patchAPI; }

    get rectDrawer() { return this._rectInstancer; }

    get selectedGlOps() { return this._selectedGlOps; }

    get subPatch() { return this._currentSubpatch; }

    get isAreaSelecting() { return this._selectionArea.active; }


    zIndex()
    {
        return this.zIndex++;
    }

    setCursor(c)
    {
        this._cursor = c;
    }

    _removeDropInRect()
    {
        this._dropInOpBorder.visible = false;
    }


    _onCanvasMouseMove(e)
    {
        if (this.startLinkButtonDrag)
        {
            this.startLinkButtonDrag.startDragging(e);
        }

        this._dropInCircleRect = null;

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

                        const border = 3;
                        this._dropInOpBorder.setSize(this._selectedGlOps[i].w + border * 2, this._selectedGlOps[i].h + border * 2);
                        this._dropInOpBorder.setPosition(this._selectedGlOps[i].x - border, this._selectedGlOps[i].y - border);
                        this._dropInOpBorder.setColor(this._dropInCircleRect.color);
                        this._dropInOpBorder.setOpacity(0.5);
                    }
                }
            }
            else visible = false;

            this._dropInOpBorder.visible = visible;
        }
        else this._dropInOpBorder.visible = false;

        this.debugData._onCanvasMouseMove = this.debugData._onCanvasMouseMove || 0;
        this.debugData._onCanvasMouseMove++;

        this.profileMouseEvents = this.profileMouseEvents || 0;
        this.profileMouseEvents++;

        // if (!gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();
    }

    _cycleDebug()
    {
        this._debugRenderStyle = this._debugRenderStyle || 0;

        this._debugRenderStyle++;
        if (this._debugRenderStyle > 3) this._debugRenderStyle = 0;

        for (let i in this._splineDrawers) this._splineDrawers[i].setDebugRenderer(this._debugRenderStyle);

        this._rectInstancer.setDebugRenderer(this._debugRenderStyle);
        this._overLayRects.setDebugRenderer(this._debugRenderStyle);

        this._textWriter.setDebugRenderer(this._debugRenderStyle);
        this._textWriterOverlay.setDebugRenderer(this._debugRenderStyle);

        if (this._debugRenderStyle == 3) this.clear = false;
        else this.clear = true;
    }


    _onCanvasDblClick(e)
    {
        if (this._hoverOps.length > 0)
        {
            const ops = gui.patchView.getSelectedOps();
            if (ops.length != 1) return;



            if (ops[0].isSubPatchOp())
            {
                console.log("dblclick subpatch!", ops[0].patchId.get());
                gui.patchView.setCurrentSubPatch(ops[0].patchId.get());
                gui.patchView.updateSubPatchBreadCrumb(ops[0].patchId.get());
            }
            if (CABLES.UI.DEFAULTOPNAMES.blueprint == ops[0].objName)
            {
                // console.log(ops[0].storage);



                const subid = gui.patchView.getSubPatchIdFromBlueprintOpId(ops[0].id);

                console.log("subid", subid, ops[0].id);

                if (subid)gui.patchView.setCurrentSubPatch(subid);
                // gui.patchView.updateSubPatchBreadCrumb(ops[0].patchId.get());
            }
        }
        else
        {
            if (this._currentSubpatch != 0)
            {
                const spOp = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
                if (spOp) gui.patchView.setCurrentSubPatch(spOp.uiAttribs.subPatch);
            }
        }
        e.preventDefault();
    }

    _onCanvasMouseLeave(e)
    {
        if (this._pauseMouseUntilButtonUp)
        {
            this._pauseMouseUntilButtonUp = false;
            return;
        }

        if (this._selectionArea.active)
        {
            this._selectionArea.hideArea();
            gui.emitEvent("hideSelectionArea");
        }
        CABLES.UI.hideToolTip();

        this._lastButton = 0;
        this._mouseLeaveButtons = e.buttons;
        this.emitEvent("mouseleave", e);
    }

    _onCanvasMouseEnter(e)
    {
        if (this._mouseLeaveButtons != e.buttons && e.pointerType == "mouse")
        {
            // reentering with mouse down already - basically block all interaction
            this._pauseMouseUntilButtonUp = true;
            this._log.log("reenter with different buttons!");
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
            this._greyOutRect = this._overLayRects.createRect();
            this._greyOutRect.setColor(
                glUiConfig.colors.background[0],
                glUiConfig.colors.background[1],
                glUiConfig.colors.background[2],
                0.25);
            this._greyOutRect.setSize(20000000, 20000000);
            this._greyOutRect.setPosition(-10000000, -10000000, -0.1);

            this._cgl.canvas.style.cursor = "not-allowed";
        }
        else if (!this.greyOut && this._greyOutRect)
        {
            this._greyOutRect.dispose();
            this._greyOutRect = null;
            this._cgl.canvas.style.cursor = "auto";
        }

        if (this.greyOutBlue && this._greyOutRect)
        {
            this._greyOutRect.setColor(
                glUiConfig.colors.background[0] * 0.8,
                glUiConfig.colors.background[1] * 1.5,
                glUiConfig.colors.background[2] * 2.5,
                0.25);
        }
    }

    _onCanvasMouseDown(e)
    {
        if (!e.pointerType) return;
        this._removeDropInRect();


        if (this.mouseState.buttonLeft && !this.isMouseOverOp() && gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();

        try { this._cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mousedown", e);
        this._rectInstancer.mouseDown(e);
        this._canvasMouseDown = true;
    }

    _onCanvasMouseUp(e)
    {
        this.linkStartedDragging = false;
        this.startLinkButtonDrag = null;

        if (!this._portDragLine.isActive)
        {
            if (this._pauseMouseUntilButtonUp)
            {
                this._pauseMouseUntilButtonUp = false;
                return;
            }

            if (!this._canvasMouseDown) return;
        }

        this._canvasMouseDown = false;
        const perf = CABLES.UI.uiProfiler.start("[glpatch] _onCanvasMouseUp");

        this._removeDropInRect();
        this._rectInstancer.mouseUp(e);

        try { this._cgl.canvas.releasePointerCapture(e.pointerId); }
        catch (er) { this._log.log(er); }

        this.emitEvent("mouseup", e);
        // gui.longPressConnector.longPressCancel();
        this._rectInstancer.interactive = true;

        if ((gui.patchView.getSelectedOps().length == 0) || (this.mouseState.draggingDistance < 5 && this._hoverOps.length == 0))
        {
            this.unselectAll();
            gui.showInfo(text.patch);
            gui.patchView.showDefaultPanel();
        }

        if (CABLES.mouseButtonWheelDown)
        {
            CABLES.mouseButtonWheelDown = false;
            if (this._hoverOps.length == 0 && gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();
        }

        perf.finish();

        this._dropInCircleRect = null;

        this._selectionArea.mouseUp();
    }

    _onKeyDelete(e)
    {
        gui.patchView.deleteSelectedOps();
        gui.patchView.showDefaultPanel();
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }

    isFocussed()
    {
        return document.activeElement == this._cgl.canvas;
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
            if (!ops[i].enabled)willDisable = false;
        }

        for (let i = 0; i < ops.length; i++)
        {
            ops[i].setEnabled(!willDisable);
        }
    }

    addLink(l)
    {
        if (this.links[l.id]) this.links[l.id].dispose();
        this.links[l.id] = l;
    }

    focusOpAnim(opid)
    {
        this._focusRectOp = this._glOpz[opid];

        this._focusRectAnim.clear();
        this._focusRectAnim.setValue(this._time, 0);
        this._focusRectAnim.setValue(this._time + 0.5, 1);
    }

    focusOp(opid)
    {
        gui.opParams.show(opid);
        this.focusOpAnim(opid);
    }

    addOp(op, fromDeserialize)
    {
        if (!op) this._log.error("no op at addop", op);

        if (!fromDeserialize && !op.uiAttribs.hasOwnProperty("subPatch")) op.uiAttribs.subPatch = this._currentSubpatch;


        let glOp = this._glOpz[op.id];
        if (!glOp)
        {
            glOp = new GlOp(this, this._rectInstancer, op);
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
                op.uiAttr({ "translate": { "x": gui.patchView.snapOpPosX(this.viewBox.mousePatchX), "y": gui.patchView.snapOpPosY(this.viewBox.mousePatchY) } });
            else
                op.uiAttr({ "translate": { "x": gui.patchView.snapOpPosX(CABLES.UI.OPSELECT.newOpPos.x), "y": gui.patchView.snapOpPosY(CABLES.UI.OPSELECT.newOpPos.y) } });
        }


        glOp.setTitle(op.uiAttribs.title, this._textWriter);


        if (!fromDeserialize)
        {
            glOp.update();
            this.unselectAll();

            if (CABLES.UI.loaded && op.uiAttribs.subPatch == this.getCurrentSubPatch())
            {
                this.selectOpId(op.id);
                gui.opParams.show(op.id);
            }

            if (op.uiAttribs.translate && op.uiAttribs.createdLocally)
            {
                glOp.sendNetPos();
                glOp.updatePosition();
            }
        }

        delete op.uiAttribs.createdLocally;
        this._portDragLine.stop();
    }

    screenToPatchCoord(x, y)
    {
        return this.viewBox.screenToPatchCoord(x, y);
    }

    _drawCursor()
    {
        const drawGlCursor = userSettings.get("glpatch_cursor");

        if (drawGlCursor) this._cgl.setCursor("none");
        else
        {
            if (this._cursor == CABLES.GLGUI.CURSOR_HAND) this._cgl.setCursor("move");
            else this._cgl.setCursor("auto");
        }

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
            this._glCursors[i].setSize(z, z);
        }
    }

    render(resX, resY)
    {
        if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG || !this.clear)
            this._cgl.gl.clearColor(0, 0, 0, 0);
        else
        {
            this._cgl.gl.clearColor(
                glUiConfig.colors.background[0],
                glUiConfig.colors.background[1],
                glUiConfig.colors.background[2],
                glUiConfig.colors.background[3]);
        }

        // if (
        //     this._portDragLine.isActive &&
        //     this._hoverOps.length == 1 &&
        //     this._hoverOpLongStartTime != 0 &&
        //     performance.now() - this._hoverOpLongStartTime > 1000 &&
        //     defaultops.isSubPatchOpNameV2(this._hoverOps[0].objName))
        // {
        //     gui.patchView.setCurrentSubPatch(this._hoverOps[0].op.patchId.get());
        // }

        this._cgl.gl.clear(this._cgl.gl.COLOR_BUFFER_BIT | this._cgl.gl.DEPTH_BUFFER_BIT);

        if (Object.keys(this._glOpz).length != gui.corePatch().ops.length)
        {
            // for(let i in this._glOpz)
            // {
            for (let j = 0; j < gui.corePatch().ops.length; j++)
            {
                if (!this._glOpz[gui.corePatch().ops[j].id])
                {
                    console.log("missing glop in glpatch: ", gui.corePatch().ops[j].name);
                }
            }
            // }
            // console.log(this._glOpz,gui.corePatch().ops)

            this._log.error("BROKEN");
        }

        this.hasFocus = ele.hasFocus(this._cgl.canvas);
        this.debugData.splineUpdate = 0;

        for (const i in this._glOpz)
        {
            this._glOpz[i].updateIfNeeded();
        }

        this.frameCount++;
        this.isAnimated = false;
        this._time = (performance.now() - this._timeStart) / 1000;

        for (const i in this._glCursors)
            this._glCursors[i].updateAnim();

        this.snapLines.render(this._canvasMouseDown);

        this._fadeOutRect.visible = !this._fadeOutRectAnim.isFinished(this._time);
        // if (this._fadeOutRect.visible)
        // {
        //     this.isAnimated = true;
        //     const v = this._fadeOutRectAnim.getValue(this._time);

        // this.subPatchAnim = 1.0 - this._fadeOutRectAnim.getValue(this._time);
        // console.log(this.subPatchAnim);

        //     this._fadeOutRect.setColor(
        //         glUiConfig.colors.background[0],
        //         glUiConfig.colors.background[1],
        //         glUiConfig.colors.background[2],
        //         v);
        // }


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
            else this._log.log("no focusrectop");
        }

        this._cgl.pushDepthTest(true);
        this._cgl.pushDepthWrite(true);

        this._showRedrawFlash++;
        this._redrawFlash.setPosition(0, this._showRedrawFlash % 30, 1000);
        this.viewBox.update();

        this._patchAPI.updateFlowModeActivity();

        this.viewBox.setSize(resX, resY);

        const starttime = performance.now();

        this.mouseMove(this.viewBox.mousePatchX, this.viewBox.mousePatchY);

        this._drawCursor();

        this._portDragLine.setPosition(this.viewBox.mousePatchX, this.viewBox.mousePatchY);

        const perf = CABLES.UI.uiProfiler.start("[glpatch] render");

        // this._splineDrawer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);


        this.getSplineDrawer(this._currentSubpatch).render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);
        this._rectInstancer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);
        this._textWriter.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);
        this._overlaySplines.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._cgl.popDepthTest();
        this._cgl.pushDepthTest(false);

        this._overLayRects.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._cgl.popDepthTest();
        this._cgl.pushDepthTest(true);

        this._textWriterOverlay.render(resX, resY, -0.98, 0.94, 600);

        this._cgl.pushDepthTest(false);
        gui.longPressConnector.glRender(this, this._cgl, resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);
        this._cgl.popDepthTest();

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
        this.debugData.rects = this._rectInstancer.getNumRects();
        this.debugData["text rects"] = this._textWriter.rectDrawer.getNumRects();
        this.debugData.viewZoom = this.viewBox.zoom;

        this.debugData._mousePatchX = Math.round(this.viewBox._mousePatchX * 100) / 100;
        this.debugData._mousePatchY = Math.round(this.viewBox._mousePatchY * 100) / 100;
        this.debugData.mouse_isDragging = this.mouseState.isDragging;


        this.debugData.rectInstancer = JSON.stringify(this._rectInstancer.getDebug(), false, 2);

        // this.mouseState.debug(this.debugData);

        this.debugData.renderMs = Math.round((performance.now() - starttime) * 10) / 10;

        if (this._cgl.profileData)
        {
            this.debugData.glPrimitives = this._cgl.profileData.profileMeshNumElements;
            this.debugData.glUpdateAttribs = this._cgl.profileData.profileMeshAttributes;

            for (let i in this._cgl.profileData.profileSingleMeshAttribute)
                this.debugData["glUpdateAttribs " + i] = this._cgl.profileData.profileSingleMeshAttribute[i];

            this._cgl.profileData.clear();
        }

        this._cgl.popDepthTest();
        this._cgl.popDepthWrite();

        this._updateGreyout();
        perf.finish();

        // this._cgl.pushCullFace(false);


        this._cgl.profileData.clearGlQuery();
    }


    mouseMove(x, y)
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
            {
                this._cutLineIdx = this._overlaySplines.getSplineIndex();
            }

            this._overlaySplines.setSpline(this._cutLineIdx, [...this._cutLine]); // copy dat array
            this._overlaySplines.setSplineColor(this._cutLineIdx, [1, 0, 0, 1]);

            return;
        }

        if (this._oldMouseMoveX == x && this._oldMouseMoveY == y) return;

        this._oldMouseMoveX = x;
        this._oldMouseMoveY = y;
        if (!this._portDragLine.isActive)
            if (this._pauseMouseUntilButtonUp) return;

        // if ((this._lastMouseX != x || this._lastMouseY != y) && !gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();

        let allowSelectionArea = !this._portDragLine.isActive;
        if (this._selectionArea.active)allowSelectionArea = true;


        this._rectInstancer.mouseMove(x, y, this.mouseState.getButton());

        if (this._rectInstancer.isDragging()) return;

        // if (!this.mouseState.isDragging)
        // else this._hoverOps = [];

        let preId = -1;
        if (this._hoverOps.length) preId = this._hoverOps[0].id;

        this._hoverOps = this._getGlOpsInRect(x, y, x + 1, y + 1);

        if (this._hoverOps.length && this._hoverOps[0].id != preId) this._hoverOpLongStartTime = performance.now();
        if (!this._hoverOps.length) this._hoverOpLongStartTime = 0;

        if (this.mouseState.isButtonDown())
        {
            // remmeber start coordinates when start dragging hovered op
            // if(hoverops.length>0 && !this._hoverDragOp)
            // {
            //     this._log.log("START drag coords!!!");
            //     this._dragOpStartX=x;
            //     this._dragOpStartY=y;
            //     this._dragOpOffsetX=x-hoverops[0].x;
            //     this._dragOpOffsetY=y-hoverops[0].y;
            // }

            // if(hoverops.length>0) this._hoverDragOp=hoverops[0];
            // else this._hoverDragOp=null;

            // drag hoverered op
            // if(this._hoverDragOp)
            // {
            //     this._log.log('this._dragOpStartX',this._dragOpStartX,this._dragOpStartY);
            //     if(this._dragOpStartX)
            //         this._patchAPI.setOpUiAttribs(this._hoverDragOp.id,
            //             "translate",
            //             {
            //                 "x":x-this._dragOpOffsetX,
            //                 "y":y-this._dragOpOffsetY
            //             });
            // }
        }
        else
        {
            this._hoverDragOp = null;
        }

        if (this._cablesHoverButtonRect && this._cablesHoverButtonRect.isHovering()) allowSelectionArea = false;
        if (this._selectionArea.h == 0 && this._hoverOps.length > 0) allowSelectionArea = false;
        if (this._lastButton == 1 && this.mouseState.buttonLeft) this._selectionArea.hideArea();


        if (gui.longPressConnector.isActive())
        {
            // const ops = this._getGlOpsInRect(xa, ya, xb, yb);

            const ops = this._getGlOpsInRect(x, y, x + 1, y + 1);
            if (ops.length > 0 && this._focusRectAnim.isFinished(this._time) && gui.longPressConnector.getStartOp().id != ops[0].id) this.focusOpAnim(ops[0].id);
        }

        if (this.mouseState.buttonStateForSelectionArea && allowSelectionArea && this.mouseState.isDragging && this.mouseState.mouseOverCanvas)
        {
            if (this._rectInstancer.interactive)
                if (this._pressedShiftKey || this._pressedCtrlKey) this._selectionArea.previousOps = gui.patchView.getSelectedOps();

            this._rectInstancer.interactive = false;
            this._selectionArea.setPos(this._lastMouseX, this._lastMouseY, 1000);
            this._selectionArea.setSize((x - this._lastMouseX), (y - this._lastMouseY));
            this._selectOpsInRect(x, y, this._lastMouseX, this._lastMouseY);

            if (this._pressedShiftKey)
            {
                for (let i = 0; i < this._selectionArea.previousOps.length; i++)
                {
                    this._selectionArea.previousOps[i].selected = true;
                    this.selectOpId(this._selectionArea.previousOps[i].id);
                }
            }
            if (this._pressedCtrlKey)
            {
                let unselIds = [];

                for (let i in this._selectedGlOps)
                    unselIds.push(this._selectedGlOps[i].id);

                for (let i = 0; i < this._selectionArea.previousOps.length; i++)
                {
                    this._selectionArea.previousOps[i].selected = true;
                    this.selectOpId(this._selectionArea.previousOps[i].id);
                }

                for (let i = 0; i < unselIds.length; i++)
                    this.unSelectOpId(unselIds[i]);
            }

            gui.emitEvent("drawSelectionArea", this._lastMouseX, this._lastMouseY, (x - this._lastMouseX), (y - this._lastMouseY));

            const numSelectedOps = Object.keys(this._selectedGlOps).length;

            gui.patchView.showSelectedOpsPanel();
            this._numSelectedGlOps = numSelectedOps;
        }
        else
        {
            this._numSelectedGlOps = -1;
            if (this._selectionArea.isVisible())
            {
                this._selectionArea.previousOps = [];
                this._selectionArea.hideArea();
                gui.emitEvent("hideSelectionArea");
            }
            this._lastMouseX = x;
            this._lastMouseY = y;
        }

        this._lastButton = this.mouseState.getButton();
    }

    _getGlOpsInRect(xa, ya, xb, yb)
    {
        if (this.cacheOIRxa == xa && this.cacheOIRya == ya && this.cacheOIRxb == xb && this.cacheOIRyb == yb)
            return this.cacheOIRops;

        const perf = CABLES.UI.uiProfiler.start("[glpatch] ops in rect");

        const x = Math.min(xa, xb);
        const y = Math.min(ya, yb);
        const x2 = Math.max(xa, xb);
        const y2 = Math.max(ya, yb);
        const ops = [];

        for (const i in this._glOpz)
        {
            const glop = this._glOpz[i];
            if (!glop.visible) continue;

            if (glop.x + glop.w >= x && // glop. right edge past r2 left
                glop.x <= x2 && // glop. left edge past r2 right
                glop.y + glop.h >= y && // glop. top edge past r2 bottom
                glop.y <= y2) // r1 bottom edge past r2 top
            {
                ops.push(glop);
            }
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
        const perf = CABLES.UI.uiProfiler.start("[glpatch] unselectAll");

        for (const i in this._glOpz) if (this._glOpz[i].selected) this._glOpz[i].selected = false;
        this._selectedGlOps = {};
        this._cachedNumSelectedOps = 0;
        this._cachedFirstSelectedOp = null;

        perf.finish();
    }

    getGlOp(op)
    {
        return this._glOpz[op.id];
    }

    setSelectedOpById(id)
    {
        this.unselectAll();
        this.selectOpId(id);

        if (this._glOpz[id] && !this._glOpz[id].isInCurrentSubPatch()) this.setCurrentSubPatch(this._glOpz[id].getSubPatch());
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

    selectOpId(id)
    {
        if (this._glOpz[id] && !this._selectedGlOps[id])
        {
            this._selectedGlOps[id] = this._glOpz[id];
            this._cachedNumSelectedOps++;
            if (this._cachedNumSelectedOps == 1) this._cachedFirstSelectedOp = this._glOpz[id];

            this._glOpz[id].selected = true;

            // const bounds = this._glOpz[id].op.getChildsBoundings(this);
            // if (bounds.maxx)
            // {
            //     this._testAreaRect.setPosition(bounds.minx, bounds.miny, -1);
            //     this._testAreaRect.setSize(bounds.maxx - bounds.minx, bounds.maxy - bounds.miny);
            // }
            // else this._testAreaRect.setSize(0, 0);
        }
    }

    unSelectOpId(id)
    {
        if (this._glOpz[id])
        {
            delete this._selectedGlOps[id];

            this._glOpz[id].selected = false;
            this._cachedNumSelectedOps--;
        }
    }

    _selectOpsInRect(xa, ya, xb, yb)
    {
        const ops = this._getGlOpsInRect(xa, ya, xb, yb);

        const perf = CABLES.UI.uiProfiler.start("[glpatch] _selectOpsInRect");

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

    getOpBounds()
    {
        const ops = this._glOpz;
        const bounds =
        {
            "minx": 9999,
            "maxx": -9999,
            "miny": 9999,
            "maxy": -9999,
        };

        for (const i in ops)
        {
            const op = ops[i];
            bounds.minx = Math.min(bounds.minx, op.x);
            bounds.maxx = Math.max(bounds.maxx, op.x);
            bounds.miny = Math.min(bounds.miny, op.y);
            bounds.maxy = Math.max(bounds.maxy, op.y);
        }

        bounds.minx -= glUiConfig.opWidth;
        bounds.maxx += glUiConfig.opWidth * 2;

        bounds.miny -= glUiConfig.opHeight;
        bounds.maxy += glUiConfig.opHeight * 2;

        return bounds;
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

        if (this._rectInstancer) this._rectInstancer.dispose();
        if (this._lines) this._lines.dispose();
    }

    reset()
    {
    }

    getOp(opid)
    {
        return this._glOpz[opid];
    }


    // make static util thing...
    getOpNamespaceColor(ns)
    {
        const parts = ns.split(".");
        const nss = parts[0] + "." + parts[1];

        if (glUiConfig.colors.namespaceColors[nss]) return glUiConfig.colors.namespaceColors[nss];
        else return glUiConfig.colors.namespaceColors.unknown;
    }

    // make static util thing...
    setDrawableColorByType(e, t, diff)
    {
        if (!e) return;
        diff = diff || 1;
        diff *= 0.8;

        // if (brightness == 1)diff = 0.8;
        // if (brightness == 2)diff = 1.5;

        let col = [0, 0, 0, 0];

        // p[ut colors into gluiconfig...]
        if (t == CABLES.OP_PORT_TYPE_VALUE) col = [92 / 255 * diff, 181 / 255 * diff, 158 / 255 * diff, 1];
        else if (t == CABLES.OP_PORT_TYPE_FUNCTION) col = [240 / 255 * diff, 209 / 255 * diff, 101 / 255 * diff, 1];
        else if (t == CABLES.OP_PORT_TYPE_OBJECT) col = [171 / 255 * diff, 90 / 255 * diff, 148 / 255 * diff, 1];
        else if (t == CABLES.OP_PORT_TYPE_ARRAY) col = [128 / 255 * diff, 132 / 255 * diff, 212 / 255 * diff, 1];
        else if (t == CABLES.OP_PORT_TYPE_STRING) col = [213 / 255 * diff, 114 / 255 * diff, 114 / 255 * diff, 1];
        else if (t == CABLES.OP_PORT_TYPE_DYNAMIC) col = [1, 1, 1, 1];


        e.setColor(col[0], col[1], col[2], col[3]);
    }

    isDraggingPort()
    {
        return this._portDragLine.isActive;
    }

    get dragLine()
    {
        return this._portDragLine;
    }

    get allowDragging()
    {
        return this._rectInstancer.allowDragging;
    }

    set allowDragging(b)
    {
        this._rectInstancer.allowDragging = b;
    }

    getConnectedGlPorts(opid, portname)
    {
        const op = this.getOp(opid);
        return op.getGlPortsLinkedToPort(opid, portname);
    }

    focus()
    {
        this._cgl.canvas.focus();
    }

    cut(e)
    {
        gui.patchView.clipboardCutOps(e);
    }

    copy(e)
    {
        // todo play copy indicator anim
        // for (const i in selectedOps) selectedOps[i].oprect.showCopyAnim();
        gui.patchView.clipboardCopyOps(e);
    }

    paste(e)
    {
        gui.patchView.clipboardPaste(e, this._currentSubpatch, this.viewBox.mousePatchX, this.viewBox.mousePatchY, (ops, focusSubpatchop) =>
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
        return this._currentSubpatch;
    }

    setCurrentSubPatch(sub, next)
    {
        if (this._currentSubpatch == sub)
        {
            for (const i in this._glOpz)
                this._glOpz[i].updateVisible();

            if (next)next();
            return;
        }

        this.unselectAll();
        if (sub != 0 && sub != this._currentSubpatch) this._log.log("set subpatch: ", sub);
        this._currentSubpatch = sub;

        const dur = 0.3;
        const timeGrey = dur * 1.5;
        const timeVisibleAgain = dur * 3.0;

        // this._fadeOutRectAnim.clear();
        // this._fadeOutRectAnim.setValue(this._time, 0);
        // this._fadeOutRectAnim.setValue(this._time + timeGrey, 1.0);
        // this._fadeOutRectAnim.setValue(this._time + timeGrey + 2, 1);
        // this._fadeOutRectAnim.setValue(this._time + timeVisibleAgain, 0);

        gui.patchView.updateSubPatchBreadCrumb(sub);

        // setTimeout(() =>
        // {
        for (const i in this._glOpz)
        {
            this._glOpz[i].updateVisible();
        }

        for (const i in this._links)
        {
            this._links[i].updateVisible();
        }
        // }, timeGrey * 1000);

        this.viewBox.animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain, next);
        this.snapLines.update();
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
        this.paused = true;
        this.emitEvent("paused");
    }

    resume()
    {
        this.paused = false;
        this.emitEvent("resumed");
    }

    setSize(x, y, w, h)
    {

    }

    zoomStep(s)
    {
        this.viewBox.zoomStep(s);
    }


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
        this._cgl.canvas.style["pointer-events"] = "none";
        this.vizLayer.pauseInteraction();
    }

    resumeInteraction()
    {
        this._cgl.canvas.style["pointer-events"] = "initial";
        this.vizLayer.resumeInteraction();
    }

    getSplineDrawer(subpatchId)
    {
        if (this._splineDrawers.hasOwnProperty(subpatchId)) return this._splineDrawers[subpatchId];
        else
        {
            this._splineDrawers[subpatchId] = new GlSplineDrawer(this._cgl, "patchCableSplines_" + subpatchId);
            return this._splineDrawers[subpatchId];
        }
    }

    setHoverLink(e, link)
    {
        // console.log(link);

        if (link && e)
        {
            clearTimeout(this._ttTImeout);
            CABLES.UI.updateHoverToolTip(e, link._link.portOut, true);
            // console.log(e.offsetY);
            // console.log("show!");
        }
        // if(!link) CABLES.UI.hideToolTip();


        // console.log(link);

        if (!link)
        {
            clearTimeout(this._ttTImeout);

            this._ttTImeout = setTimeout(() =>
            {
                CABLES.UI.hideToolTip();
            }, 100);
        }
        // console.log(link);
    }
}
