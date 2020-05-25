CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPatch = class extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();

        this.logEvents(false, "glpatch");
        if (!cgl) console.error("[glpatch] need cgl");

        this._cgl = cgl;
        this.mouseState = new CABLES.GLGUI.MouseState(cgl.canvas);

        this._glOpz = {};
        this._patchAPI = null;
        this._showRedrawFlash = 0;
        this.debugData = {};
        this.viewBox = new CABLES.GLGUI.ViewBox(cgl, this);
        this._rectInstancer = new CABLES.GLGUI.RectInstancer(cgl);
        this._lines = new CABLES.GLGUI.Linedrawer(cgl);
        this._overLayRects = new CABLES.GLGUI.RectInstancer(cgl);
        this._textWriter = new CABLES.GLGUI.TextWriter(cgl);
        this._currentSubpatch = 0;
        this._selectionArea = new CABLES.GLGUI.GlSelectionArea(this._overLayRects, this);
        this._lastMouseX = this._lastMouseY = -1;
        this._portDragLine = new CABLES.GLGUI.GlRectDragLine(this._lines, this);

        this.cacheOIRxa = 0;
        this.cacheOIRya = 0;
        this.cacheOIRxb = 0;
        this.cacheOIRyb = 0;
        this.cacheOIRops = null;

        this._cursor2 = this._overLayRects.createRect();
        this._cursor2.setSize(2, 2);

        this._redrawFlash = this._overLayRects.createRect();
        this._redrawFlash.setSize(50, 5);
        this._redrawFlash.setColor(0, 1, 0, 1);

        this.quickLinkSuggestion = new CABLES.GLGUI.QuickLinkSuggestion(this);
        this._debugtext = new CABLES.GLGUI.Text(this._textWriter, "hello");

        this._viewZoom = 0;

        this.needsRedraw = false;

        this._selectedGlOps = {};

        this.links = {};

        cgl.canvas.addEventListener("mousedown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("mousemove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("mouseleave", this._onCanvasMouseLeave.bind(this));
        cgl.canvas.addEventListener("mouseup", this._onCanvasMouseUp.bind(this));

        gui.keys.key(["Delete", "Backspace"], "Delete selected ops", "down", cgl.canvas.id, {}, this._onKeyDelete.bind(this));
        gui.keys.key("f", "Toggle flow visualization", "down", cgl.canvas.id, {}, (e) => { CABLES.UI.userSettings.set("glflowmode", !CABLES.UI.userSettings.get("glflowmode")); });

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
    }

    _onCanvasMouseDown(e)
    {
        this.emitEvent("mousedown", e);
        this._rectInstancer.mouseDown(e);
    }

    _onCanvasMouseMove(e)
    {
        if (!this.quickLinkSuggestion.isActive()) this.quickLinkSuggestion.longPressCancel();
    }

    _onCanvasMouseLeave(e)
    {
        if (this._selectionArea.active)
        {
            console.log("hide area44");
            this._selectionArea.hideArea();
        }
        this._lastButton = 0;
        this.emitEvent("mouseleave", e);
        this.emitEvent("mouseup", e);
    }

    _onCanvasMouseUp(e)
    {
        this._rectInstancer.mouseUp(e);
        this.emitEvent("mouseup", e);
        this.quickLinkSuggestion.longPressCancel();
        this._rectInstancer.interactive = true;

        if (Object.keys(this._selectedGlOps).length == 0)gui.patchView.showBookmarkParamsPanel();
    }

    _onKeyDelete(e)
    {
        gui.patchView.deleteSelectedOps();
        gui.patchView.showDefaultPanel();
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }

    set patchAPI(api) { this._patchAPI = api; }

    get patchAPI() { return this._patchAPI; }

    get rectDrawer() { return this._rectInstancer; }

    get selectedGlOps() { return this._selectedGlOps; }

    get subPatch() { return this._currentSubpatch; }

    getOpAt(x, y)
    {
    }

    center(x, y)
    {
        this.viewBox.scrollTo(x, y);
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
            console.log("this.links", this.links);
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

    addLink(l)
    {
        if (this.links[l.id]) this.links[l.id].dispose();
        this.links[l.id] = l;
    }

    addOp(op)
    {
        if (!op) console.error("no op at addop", op);

        if (!op.uiAttribs.hasOwnProperty("subPatch")) op.uiAttribs.subPatch = 0;

        op.addEventListener("onUiAttribsChange",
            (newAttribs) =>
            {
                glOp.opUiAttribs = op.uiAttribs;
                glOp.update();
                // if (newAttribs.hasOwnProperty("translate"))
                // {
                //     glOp.updatePosition();
                // }
            });

        if (!op.uiAttribs.translate)
        {
            if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0) op.uiAttribs.translate = { "x": this.viewBox.mousePatchX, "y": this.viewBox.mousePatchY };
            else op.uiAttribs.translate = { "x": CABLES.UI.OPSELECT.newOpPos.x, "y": CABLES.UI.OPSELECT.newOpPos.y };
        }

        // if (op.uiAttribs.hasOwnProperty("translate"))
        // {
        //     if (CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.x = CABLES.UI.snapOpPosX(op.uiAttribs.translate.x);
        //     if (CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.y = CABLES.UI.snapOpPosY(op.uiAttribs.translate.y);
        //     uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        // }


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
        glOp.updatePosition();
        glOp.setTitle(this._textWriter, op.name);
        glOp.update();

        if (CABLES.UI.loaded)
        {
            console.log("op added by hand...");
            this.unselectAll();
            this.selectOpId(op.id);
            gui.opParams.show(op.id);
        }
    }


    setFont(f)
    {
        this._textWriter.setFont(f);
    }

    render(resX, resY, scrollX, scrollY, zoom, mouseX, mouseY, mouseButton)
    {
        this._showRedrawFlash++;
        this.viewBox.update();

        if (CABLES.UI.userSettings.get("glflowmode")) this._patchAPI.updateFlowModeActivity();

        this.viewBox.setSize(resX, resY);

        const starttime = performance.now();

        this.mouseMove(this.viewBox.mousePatchX, this.viewBox.mousePatchY, mouseButton);
        this._cursor2.setPosition(this.viewBox.mousePatchX - 2, this.viewBox.mousePatchY - 2);
        this._portDragLine.setPosition(this.viewBox.mousePatchX, this.viewBox.mousePatchY);

        const perf = CABLES.uiperf.start("[glpatch] render");

        this._rectInstancer.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._textWriter.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);
        this._lines.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this._overLayRects.render(resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom);

        this.quickLinkSuggestion.glRender(this._cgl, resX, resY, this.viewBox.scrollXZoom, this.viewBox.scrollYZoom, this.viewBox.zoom, this.viewBox.mouseX, this.viewBox.mouseY);

        this.needsRedraw = false;

        this.debugData["glpatch.allowDragging"] = this.allowDragging;
        this.debugData.rects = this._rectInstancer.getNumRects();
        this.debugData["text rects"] = this._textWriter.rectDrawer.getNumRects();

        this.debugData.viewZoom = this.viewBox.zoom;
        this.debugData.viewbox_scrollX = this.viewBox.scrollX;
        this.debugData.viewbox_scrollY = this.viewBox.scrollY;
        this.debugData.viewResX = this._viewResX;
        this.debugData.viewResY = this._viewResY;
        this.mouseState.debug(this.debugData);

        // this.debugData.renderMs = Math.round(((this.debugData.renderMs || 0) + performance.now() - starttime) * 0.5 * 10) / 10;
        this.debugData.renderMs = Math.round((performance.now() - starttime) * 10) / 10;

        let str = "";
        for (const n in this.debugData)
            str += n + ": " + this.debugData[n] + "\n";

        this._debugtext.text = str;

        perf.finish();
    }


    mouseMove(x, y, button)
    {
        if ((this._lastMouseX != x || this._lastMouseY != y) && !this.quickLinkSuggestion.isActive()) this.quickLinkSuggestion.longPressCancel();

        let allowSelectionArea = !this.quickLinkSuggestion.isActive() && !this._portDragLine.isActive;


        // console.log("sel active",this._selectionArea.active);

        this._rectInstancer.mouseMove(x, y, button);

        if (this._rectInstancer.isDragging()) return;

        const hoverops = this._getGlOpsInRect(x, y, x + 1, y + 1);

        if (button == 1)
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

        if (this._selectionArea.h == 0 && hoverops.length > 0) allowSelectionArea = false;
        if (this._lastButton == 1 && button != 1)
        {
            if (this._selectionArea.active) console.log("hide area2");
            this._selectionArea.hideArea();
        }

        if (this.mouseState.buttonLeft && allowSelectionArea)
        {
            this._rectInstancer.interactive = false;
            this._selectionArea.setPos(this._lastMouseX, this._lastMouseY, 1000);
            this._selectionArea.setSize((x - this._lastMouseX), (y - this._lastMouseY));
            this._selectOpsInRect(x, y, this._lastMouseX, this._lastMouseY);
            if (x - this._lastMouseX != 0 && y - this._lastMouseY != 0) gui.patchView.showSelectedOpsPanel(Object.keys(this._selectedGlOps));
        }
        else
        {
            this._selectionArea.hideArea();
            this._lastMouseX = x;
            this._lastMouseY = y;
        }

        this._lastButton = button;
    }


    _getGlOpsInRect(xa, ya, xb, yb)
    {
        if (this.cacheOIRxa == xa && this.cacheOIRya == ya && this.cacheOIRxb == xb && this.cacheOIRyb == yb)
        {
            return this.cacheOIRops;
        }

        const perf = CABLES.uiperf.start("[glpatch] ops in rect");

        const x = Math.min(xa, xb);
        const y = Math.min(ya, yb);
        const x2 = Math.max(xa, xb);
        const y2 = Math.max(ya, yb);
        const ops = [];

        for (const i in this._glOpz)
        {
            const glop = this._glOpz[i];

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
    }

    selectOpId(id)
    {
        if (this._glOpz[id])
        {
            this._selectedGlOps[id] = this._glOpz[id];
            this._glOpz[id].selected = true;
        }
        else console.warn("[glpatch selectOpId] unknown opid", id);
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
            this._selectedGlOps[ops[i].id] = ops[i];
        }
    }

    getZoomForAllOps()
    {
        console.log(this.getOpBounds());
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
    setDrawableColorByType(e, t)
    {
        const diff = 1;
        // p[ut colors into gluiconfig...]
        if (t == CABLES.OP_PORT_TYPE_VALUE) e.setColor(92 / 255 * diff, 181 / 255 * diff, 158 / 255 * diff, 1);
        else if (t == CABLES.OP_PORT_TYPE_FUNCTION) e.setColor(240 / 255 * diff, 209 / 255 * diff, 101 / 255 * diff, 1);
        else if (t == CABLES.OP_PORT_TYPE_OBJECT) e.setColor(171 / 255 * diff, 90 / 255 * diff, 148 / 255 * diff, 1);
        else if (t == CABLES.OP_PORT_TYPE_ARRAY) e.setColor(128 / 255 * diff, 132 / 255 * diff, 212 / 255 * diff, 1);
        else if (t == CABLES.OP_PORT_TYPE_STRING) e.setColor(213 / 255 * diff, 114 / 255 * diff, 114 / 255 * diff, 1);
        else if (t == CABLES.OP_PORT_TYPE_DYNAMIC) e.setColor(1, 1, 1, 1);
    }

    snapOpPosX(posX)
    {
        return Math.round(posX / CABLES.UI.uiConfig.snapX) * CABLES.UI.uiConfig.snapX;
    }

    snapOpPosY(posY)
    {
        return Math.round(posY / CABLES.UI.uiConfig.snapY) * CABLES.UI.uiConfig.snapY;
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
};
