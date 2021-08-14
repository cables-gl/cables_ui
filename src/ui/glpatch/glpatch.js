CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;

CABLES.GLGUI.GlPatch = class extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();

        this.logEvents(false, "glpatch");
        if (!cgl) console.error("[glpatch] need cgl");

        this.paused = false;

        this._cgl = cgl;
        this.mouseState = new CABLES.GLGUI.MouseState(cgl.canvas);

        this._time = 0;
        this._timeStart = performance.now();
        this.isAnimated = false;

        this._glOpz = {};
        this._hoverOps = [];
        this._patchAPI = null;
        this._showRedrawFlash = 0;
        this.debugData = {};
        this.activeButtonRect = null;

        this.greyOut = false;
        this._greyOutRect = null;

        this.frameCount = 0;

        this._overlaySplines = new CABLES.GLGUI.SplineDrawer(cgl, "overlaysplines");
        this._overlaySplines.zPos = 0.5;
        this._splineDrawer = new CABLES.GLGUI.SplineDrawer(cgl, "patchCableSplines");

        this.viewBox = new CABLES.GLGUI.ViewBox(cgl, this);

        this._rectInstancer = new CABLES.GLGUI.RectInstancer(cgl, { "name": "mainrects", "initNum": gui.corePatch().ops.length * 12 });
        this._lines = new CABLES.GLGUI.Linedrawer(cgl, { "name": "links", "initNum": gui.corePatch().ops.length * 1 });
        this._overLayRects = new CABLES.GLGUI.RectInstancer(cgl, { "name": "overlayrects" });
        this._textWriter = new CABLES.GLGUI.TextWriter(cgl, { "name": "mainText", "initNum": gui.corePatch().ops.length * 15 });
        this._textWriterOverlay = new CABLES.GLGUI.TextWriter(cgl, { "name": "textoverlay" });
        this._currentSubpatch = 0;
        this._selectionArea = new CABLES.GLGUI.GlSelectionArea(this._overLayRects, this);
        this._lastMouseX = this._lastMouseY = -1;
        this._portDragLine = new CABLES.GLGUI.GlDragLine(this._overlaySplines, this);

        this.cablesHoverText = new CABLES.GLGUI.Text(this._textWriter, "");
        this.cablesHoverText.setPosition(0, 0);
        this.cablesHoverText.setColor(1, 1, 1, 0);

        // this._hoverCable = new CABLES.GLGUI.GlCable(this, this._overlaySplines, this.rectDrawer.createRect({}), 10);
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

        this._focusRectAnim = new CABLES.TL.Anim({ "defaultEasing": CABLES.EASING_CUBIC_OUT });
        this._focusRect = this._overLayRects.createRect();
        this._focusRect.setSize(1, 1);
        this._focusRect.setDecoration(4);
        this._focusRect.setColor(0, 1, 1, 1);
        this._focusRect.visible = false;

        this._glCursors = {};
        this._localGlCursor = new CABLES.GLGUI.GlCursor(this, this._overLayRects);
        this._localGlCursor.setColor(1, 1, 1, 1);
        this._glCursors[0] = this._localGlCursor;

        this.opShakeDetector = new CABLES.ShakeDetector();
        this.opShakeDetector.on("shake", () => { if (gui.patchView.getSelectedOps().length == 1)gui.patchView.unlinkSelectedOps(); });

        this.snapLines = new CABLES.GLGUI.SnapLines(cgl, this, this._rectInstancer);

        this._redrawFlash = this._overLayRects.createRect();
        this._redrawFlash.setSize(50, 5);
        this._redrawFlash.setColor(0, 1, 0, 1);

        this._fadeOutRectAnim = new CABLES.TL.Anim({ "defaultEasing": CABLES.EASING_CUBIC_OUT });
        this._fadeOutRect = this._overLayRects.createRect();
        this._fadeOutRect.setSize(100000000, 100000000);
        this._fadeOutRect.setPosition(-50000000, -50000000);
        this._fadeOutRect.setColor(0, 0, 0, 0.0);
        this._fadeOutRect.visible = true;

        this._cursor = CABLES.GLGUI.CURSOR_NORMAL;

        this.quickLinkSuggestion = new CABLES.GLGUI.QuickLinkSuggestion(this);
        // this._debugtext = new CABLES.GLGUI.Text(this._textWriterOverlay, "hello");

        this._viewZoom = 0;
        this.needsRedraw = false;
        this._selectedGlOps = {};

        this.links = {};
        this.zIndex = 0;

        this._dropInCircleRect = null;

        this._dropInOpBorder = this._overLayRects.createRect();
        this._dropInOpBorder.setSize(100, 100);
        // this._dropInOpBorder.setDecoration(4);
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
            CABLES.UI.userSettings.set("glflowmode", !CABLES.UI.userSettings.get("glflowmode"));

            // console.log("flowmode", CABLES.UI.userSettings.get("glflowmode"));
        });

        gui.keys.key(" ", "Drag left mouse button to pan patch", "down", cgl.canvas.id, {}, (e) => { this._spacePressed = true; this.emitEvent("spacedown"); });
        gui.keys.key(" ", "", "up", cgl.canvas.id, {}, (e) => { this._spacePressed = false; this.emitEvent("spaceup"); });

        gui.keys.key("e", "Edit op code", "down", cgl.canvas.id, {}, (e) => { CABLES.CMD.PATCH.editOp(); });
        gui.keys.key("c", "Center Selected Ops", "down", cgl.canvas.id, { }, (e) => { this.viewBox.center(); });
        gui.keys.key("x", "Unlink selected ops", "down", cgl.canvas.id, {}, (e) => { gui.patchView.unlinkSelectedOps(); });

        gui.keys.key("a", "Select all ops in current subpatch", "down", cgl.canvas.id, { "cmdCtrl": true }, (e) => { gui.patchView.selectAllOpsSubPatch(this._currentSubpatch); });
        gui.keys.key("a", "Align selected ops", "down", cgl.canvas.id, {}, () => { gui.patchView.alignOps(gui.patchView.getSelectedOps()); });
        gui.keys.key("a", "Compress selected ops vertically", "down", cgl.canvas.id, { "shiftKey": true }, (e) => { console.log("compress0r"); gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps()); });

        gui.keys.key("j", "Navigate op history back", "down", cgl.canvas.id, {}, (e) => { gui.opHistory.back(); });
        gui.keys.key("k", "Navigate op history forward", "down", cgl.canvas.id, {}, (e) => { gui.opHistory.forward(); });

        gui.keys.key("j", "Navigate op history back", "down", cgl.canvas.id, { "shiftKey": true }, (e) => { gui.opHistory.back(); });
        gui.keys.key("k", "Navigate op history forward", "down", cgl.canvas.id, { "shiftKey": true }, (e) => { gui.opHistory.forward(); });

        gui.keys.key("d", "Disable Op", "down", cgl.canvas.id, {}, (e) => { this.toggleOpsEnable(); });
        gui.keys.key("d", "Temporary unlink op", "down", cgl.canvas.id, { "shiftKey": true }, (e) => { gui.patchView.tempUnlinkOp(); });

        gui.keys.key("+", "Zoom In", "down", cgl.canvas.id, {}, (e) => { this.zoomStep(-1); });
        gui.keys.key("=", "Zoom In", "down", cgl.canvas.id, {}, (e) => { this.zoomStep(-1); });
        gui.keys.key("-", "Zoom Out", "down", cgl.canvas.id, {}, (e) => { this.zoomStep(1); });

        // gui.keys.key("p", "Preview", "down", cgl.canvas.id, { }, (e) => { this.previewLayer.addCurrentPort(); });


        gui.keys.key(" ", "Play/Pause timeline", "up", cgl.canvas.id, {}, (e) =>
        {
            const timeused = Date.now() - gui.spaceBarStart;
            if (timeused < 500) gui.timeLine().togglePlay();
            gui.spaceBarStart = 0;
        });

        gui.on("uiloaded", () =>
        {
            gui.socket.on("netCursorPos", (msg) =>
            {
                if (!this._glCursors[msg.clientId]) this._glCursors[msg.clientId] = new CABLES.GLGUI.GlCursor(this, this._overLayRects, msg.clientId);

                this._glCursors[msg.clientId].setPosition(msg.x, msg.y);
            });

            gui.on("netGotoPos", (msg) =>
            {
                if (typeof msg.x !== "undefined" && typeof msg.y !== "undefined")
                {
                    this.center(msg.x, msg.y);
                }
            });

            // remove client on connection lost
            gui.socket.on("netClientRemoved", (msg) =>
            {
                if (this._glCursors[msg.clientId])
                {
                    this._glCursors[msg.clientId].visible = false;
                }
            });
        });

        this.previewLayer = new CABLES.GLGUI.GlPreviewLayer(this);


        CABLES.UI.userSettings.on("onChange", (key, value) =>
        {
            // console.log("linetype changed!", value);
            for (let i in this.links)
            {
                this.links[i].updateLineStyle();
            }
        });
    }

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
        // this._hoverCable.visible = false;

        this._dropInCircleRect = null;

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

        if (!this.quickLinkSuggestion.isActive()) this.quickLinkSuggestion.longPressCancel();
    }

    _onCanvasDblClick(e)
    {
        if (this._hoverOps.length > 0)
        {
            const ops = gui.patchView.getSelectedOps();
            if (ops.length != 1) return;
            if (CABLES.UI.OPNAME_SUBPATCH == ops[0].objName)
            {
                gui.patchView.setCurrentSubPatch(ops[0].patchId.get());
                gui.patchView.updateSubPatchBreadCrumb(ops[0].patchId.get());
            }
        }
        else
        {
            this.emitEvent("dblclick", e);
        }
        e.preventDefault();
    }

    _onCanvasMouseLeave(e)
    {
        if (this._selectionArea.active)
        {
            this._selectionArea.hideArea();
        }
        this._lastButton = 0;
        this._mouseLeaveButtons = e.buttons;
        this.emitEvent("mouseleave", e);
    }

    _onCanvasMouseEnter(e)
    {
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
                CABLES.GLGUI.VISUALCONFIG.colors.background[0],
                CABLES.GLGUI.VISUALCONFIG.colors.background[1],
                CABLES.GLGUI.VISUALCONFIG.colors.background[2], 0.5);
            this._greyOutRect.setSize(20000000, 20000000);
            this._greyOutRect.setPosition(-10000000, -10000000, -0.1);
        }
        else if (!this.greyOut && this._greyOutRect)
        {
            this._greyOutRect.dispose();
            this._greyOutRect = null;
        }
    }

    _onCanvasMouseDown(e)
    {
        this._removeDropInRect();

        try { this._cgl.canvas.setPointerCapture(e.pointerId); }
        catch (er) { console.log(er); }

        this.emitEvent("mousedown", e);
        this._rectInstancer.mouseDown(e);
    }

    _onCanvasMouseUp(e)
    {
        this._removeDropInRect();
        this._rectInstancer.mouseUp(e);

        try { this._cgl.canvas.releasePointerCapture(e.pointerId); }
        catch (er) { console.log(er); }

        this.emitEvent("mouseup", e);
        this.quickLinkSuggestion.longPressCancel();
        this._rectInstancer.interactive = true;
        // this._hoverCable.visible = false;

        if ((gui.patchView.getSelectedOps() == 0) || (this.mouseState.draggingDistance < 5 && this._hoverOps.length == 0))
        {
            this.unselectAll();
            gui.patchView.showDefaultPanel();
        }

        this._dropInCircleRect = null;
    }

    _onKeyDelete(e)
    {
        gui.patchView.deleteSelectedOps();
        gui.patchView.showDefaultPanel();
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }

    get name() { return "glpatch"; }

    get time() { return this._time; }

    set patchAPI(api) { this._patchAPI = api; }

    get patchAPI() { return this._patchAPI; }

    get rectDrawer() { return this._rectInstancer; }

    get selectedGlOps() { return this._selectedGlOps; }

    get subPatch() { return this._currentSubpatch; }

    isFocussed()
    {
        return document.activeElement == this._cgl.canvas;
    }

    isMouseOverOp()
    {
        return this._hoverOps.length > 0;
    }

    getOpAt(x, y)
    {
    }

    center(x, y)
    {
        if (x == undefined) this.viewBox.center();
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
            // console.log("this.links", this.links);
            console.log("could not find link to remove!!", linkId);
        }
    }

    deleteOp(opid) // should work  th opid...
    {
        const glop = this._glOpz[opid];


        if (!glop)
        {
            console.log("could not find op to delete", opid);
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

    focusOp(opid)
    {
        gui.opParams.show(opid);

        this._focusRectOp = this._glOpz[opid];
        this._focusRectAnim.clear();
        this._focusRectAnim.setValue(this._time, 0);
        this._focusRectAnim.setValue(this._time + 0.5, 1);
    }


    addOp(op, fromDeserialize)
    {
        if (!op) console.error("no op at addop", op);

        if (!fromDeserialize && !op.uiAttribs.hasOwnProperty("subPatch")) op.uiAttribs.subPatch = this._currentSubpatch;

        let glOp = this._glOpz[op.id];
        if (!glOp)
        {
            glOp = new CABLES.GLGUI.GlOp(this, this._rectInstancer, op);
            this._glOpz[op.id] = glOp;
        }
        else
        {
            glOp.uiAttribs = op.uiAttribs;
        }

        op.on("onPortRemoved", () => { glOp.refreshPorts(); });
        op.on("onPortAdd", () => { glOp.refreshPorts(); });

        op.on("onEnabledChange", () => { glOp.update(); });

        op.on("onUiAttribsChange",
            (newAttribs) =>
            {
                glOp.uiAttribs = op.uiAttribs;
                // glOp.opUiAttribs = op.uiAttribs;
                // glOp.update();

                if (newAttribs && newAttribs.translate)
                {
                    if (newAttribs.fromNetwork)
                    {
                        delete newAttribs.fromNetwork;
                    }
                    else
                        glOp.sendNetPos();
                }

                if (newAttribs.hasOwnProperty("translate"))
                {
                    glOp.updatePosition();
                }
            });

        if (!op.uiAttribs.translate && op.uiAttribs.createdLocally)
        {
            if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0)
                op.uiAttr({ "translate": { "x": gui.patchView.snapOpPosX(this.viewBox.mousePatchX), "y": gui.patchView.snapOpPosY(this.viewBox.mousePatchY) } });
            else
                op.uiAttr({ "translate": { "x": gui.patchView.snapOpPosX(CABLES.UI.OPSELECT.newOpPos.x), "y": gui.patchView.snapOpPosY(CABLES.UI.OPSELECT.newOpPos.y) } });
        }


        glOp.setTitle(op.uiAttribs.title || op.name.split(".")[op.name.split(".").length - 1], this._textWriter);


        if (!fromDeserialize)
        {
            glOp.update();
            this.unselectAll();

            if (CABLES.UI.loaded)
            {
                this.selectOpId(op.id);
                gui.opParams.show(op.id);
                this.focusOp(op.id);
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
        const drawGlCursor = CABLES.UI.userSettings.get("glpatch_cursor");

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
        // console.log(Object.keys(this._glOpz).length, gui.corePatch().ops.length);
        if (Object.keys(this._glOpz).length != gui.corePatch().ops.length)
        {
            console.error("BROKEN");
        }

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

        this.snapLines.render();

        this._fadeOutRect.visible = !this._fadeOutRectAnim.isFinished(this._time);
        if (this._fadeOutRect.visible)
        {
            this.isAnimated = true;
            const v = this._fadeOutRectAnim.getValue(this._time);

            this._fadeOutRect.setColor(
                CABLES.GLGUI.VISUALCONFIG.colors.background[0],
                CABLES.GLGUI.VISUALCONFIG.colors.background[1],
                CABLES.GLGUI.VISUALCONFIG.colors.background[2],
                v);
        }


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
            else console.log("no focusrectop");
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

        const perf = CABLES.uiperf.start("[glpatch] render");

        this._splineDrawer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);

        this._rectInstancer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);


        this._textWriter.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._overlaySplines.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._cgl.pushDepthTest(false);

        this._overLayRects.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._cgl.pushDepthTest(true);

        this._textWriterOverlay.render(resX, resY, -0.98, 0.94, 600);


        this.quickLinkSuggestion.glRender(this._cgl, resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);


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

        this.mouseState.debug(this.debugData);

        this.debugData.renderMs = Math.round((performance.now() - starttime) * 10) / 10;

        // this.performanceGraph.set(performance.now() - starttime); //

        if (this._cgl.profileData)
        {
            this.debugData.glPrimitives = this._cgl.profileData.profileMeshNumElements;
            this.debugData.glUpdateAttribs = this._cgl.profileData.profileMeshAttributes;


            for (let i in this._cgl.profileData.profileSingleMeshAttribute)
            {
                this.debugData["glUpdateAttribs " + i] = this._cgl.profileData.profileSingleMeshAttribute[i];
            }


            this._cgl.profileData.clear();
        }

        this._cgl.popDepthTest();
        this._cgl.popDepthWrite();

        this._updateGreyout();
        perf.finish();

        this._cgl.profileData.clearGlQuery();

        // this.previewLayer.render();
    }

    mouseMove(x, y)
    {
        if ((this._lastMouseX != x || this._lastMouseY != y) && !this.quickLinkSuggestion.isActive()) this.quickLinkSuggestion.longPressCancel();

        let allowSelectionArea = !this.quickLinkSuggestion.isActive() && !this._portDragLine.isActive;


        this._rectInstancer.mouseMove(x, y, this.mouseState.getButton());

        if (this._rectInstancer.isDragging()) return;

        // if (!this.mouseState.isDragging)
        // else this._hoverOps = [];
        this._hoverOps = this._getGlOpsInRect(x, y, x + 1, y + 1);

        if (this.mouseState.isButtonDown())
        {
            // remmeber start coordinates when start dragging hovered op
            // if(hoverops.length>0 && !this._hoverDragOp)
            // {
            //     console.log("START drag coords!!!");
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
            //     console.log('this._dragOpStartX',this._dragOpStartX,this._dragOpStartY);
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

        if (this._selectionArea.h == 0 && this._hoverOps.length > 0) allowSelectionArea = false;
        if (this._lastButton == 1 && this.mouseState.buttonLeft) this._selectionArea.hideArea();

        if (this.mouseState.buttonLeft && allowSelectionArea && this.mouseState.isDragging)
        {
            this._rectInstancer.interactive = false;
            this._selectionArea.setPos(this._lastMouseX, this._lastMouseY, 1000);
            this._selectionArea.setSize((x - this._lastMouseX), (y - this._lastMouseY));
            this._selectOpsInRect(x, y, this._lastMouseX, this._lastMouseY);

            const numSelectedOps = Object.keys(this._selectedGlOps).length;

            gui.patchView.showSelectedOpsPanel();
            this._numSelectedGlOps = numSelectedOps;
        }
        else
        {
            this._numSelectedGlOps = -1;
            this._selectionArea.hideArea();
            this._lastMouseX = x;
            this._lastMouseY = y;
        }

        this._lastButton = this.mouseState.getButton();
    }

    _getGlOpsInRect(xa, ya, xb, yb)
    {
        if (this.cacheOIRxa == xa && this.cacheOIRya == ya && this.cacheOIRxb == xb && this.cacheOIRyb == yb)
            return this.cacheOIRops;

        const perf = CABLES.uiperf.start("[glpatch] ops in rect");

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
        for (const i in this._glOpz) this._glOpz[i].selected = false;
        this._selectedGlOps = {};// .length=0;
        this._cachedNumSelectedOps = 0;
        this._cachedFirstSelectedOp = null;
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
        }
    }

    _selectOpsInRect(xa, ya, xb, yb)
    {
        // const x=Math.min(xa,xb);
        // const y=Math.min(ya,yb);
        // const x2=Math.max(xa,xb);
        // const y2=Math.max(ya,yb);

        // for(var i in this._glOpz)
        // {
        //     const glop=this._glOpz[i];
        //     glop.selected=false;

        //     if( glop.x + glop.w >= x &&     // glop. right edge past r2 left
        //         glop.x <= x2 &&       // glop. left edge past r2 right
        //         glop.y + glop.h >= y &&       // glop. top edge past r2 bottom
        //         glop.y <= y2)  // r1 bottom edge past r2 top
        //     {
        //         glop.selected=true;
        //     }
        // }
        const ops = this._getGlOpsInRect(xa, ya, xb, yb);


        this.unselectAll();

        for (let i = 0; i < ops.length; i++)
        {
            ops[i].selected = true;

            this.selectOpId(ops[i].id);
            // this._selectedGlOps[ops[i].id] = ops[i];
        }
    }

    getZoomForAllOps()
    {
        // console.log(this.getOpBounds());
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

        bounds.minx -= CABLES.GLGUI.VISUALCONFIG.opWidth;
        bounds.maxx += CABLES.GLGUI.VISUALCONFIG.opWidth * 2;

        bounds.miny -= CABLES.GLGUI.VISUALCONFIG.opHeight;
        bounds.maxy += CABLES.GLGUI.VISUALCONFIG.opHeight * 2;

        return bounds;
    }

    dispose()
    {
        for (const i in this._glOpz)
        {
            this._glOpz[i].dispose();
            delete this._glOpz[i];
        }

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

        if (CABLES.GLGUI.VISUALCONFIG.namespaceColors[nss]) return CABLES.GLGUI.VISUALCONFIG.namespaceColors[nss];
        else return CABLES.GLGUI.VISUALCONFIG.namespaceColors.unknown;
    }

    // make static util thing...
    setDrawableColorByType(e, t, darken)
    {
        let diff = 1;
        if (darken)diff = 0.7;

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
        // let mouseX = 0;
        // let mouseY = 0;
        // if (self.lastMouseMoveEvent)
        // {
        //     mouseX = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).x;
        //     mouseY = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).y;
        // }

        gui.patchView.clipboardPaste(e, this._currentSubpatch, this.viewBox.mousePatchX, this.viewBox.mousePatchY,
            (ops, focusSubpatchop) =>
            {
                // self.setSelectedOp(null);
                this.unselectAll();
                for (let i = 0; i < ops.length; i++)
                {
                    this.selectOpId(ops[i].id);
                    // const uiop = self.addSelectedOpById(ops[i].id);

                    // uiop.setSelected(false);
                    // uiop.setSelected(true);
                    // gui.setStateUnsaved();
                }

                // setTimeout(() => // todo timeout still needed in glrenderer?
                // {
                //     gui.patch().setCurrentSubPatch(this._currentSubpatch);

                //     if (focusSubpatchop)
                //     {
                //         console.log(focusSubpatchop, this.viewBox.mousePatchX, this.viewBox.mousePatchY);
                //         const op = gui.corePatch().getOpById(focusSubpatchop.id);
                //         // op.setUiAttrib({ "translate" : {"x":mouseX,"y":mouseY}});

                //         const uiop = gui.patch().getUiOp(op);
                //         uiop.setPos(this.viewBox.mouseX, this.viewBox.mouseY);

                //         // gui.patch().focusOp(op.id,true);
                //         // console.log(op);
                //         // gui.patch().centerViewBoxOps();
                //     }
                // }, 100);
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

        this._currentSubpatch = sub;
        // console.log("set subpatch", sub);

        const dur = 0.0;
        const timeGrey = dur * 1.5;
        const timeVisibleAgain = dur * 3.0;

        this._fadeOutRectAnim.clear();
        this._fadeOutRectAnim.setValue(this._time, 0);
        this._fadeOutRectAnim.setValue(this._time + timeGrey, 1.0);
        this._fadeOutRectAnim.setValue(this._time + timeGrey + 0.1, 1);
        this._fadeOutRectAnim.setValue(this._time + timeVisibleAgain, 0);

        gui.patchView.updateSubPatchBreadCrumb(sub);

        setTimeout(() =>
        {
            for (const i in this._glOpz)
            {
                this._glOpz[i].updateVisible();
            }
        }, timeGrey * 1000);

        this.viewBox.animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain, next);
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
};
