CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.ViewBox = class
{
    constructor(cgl, glPatch)
    {
        this._cgl = cgl;
        this.glPatch = glPatch;

        this.mousePatchNotPredicted = vec2.create();
        this._lastPosPixel = vec2.create();
        this._mouseSmooth = [];
        this._mouseSmoothCount = 0;

        this._mouseX = 0;
        this._mouseY = 0;
        this._mousePatchX = this._mousePatchY = 0;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._viewResX = 0;
        this._viewResY = 0;
        this._boundingRect = null;
        this._boundingRectSelection = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        this._smoothedZoom = new CABLES.UI.ValueSmoother(this._zoom, CABLES.GLGUI.VISUALCONFIG.zoomSmooth);
        this._smoothedZoomValue = this._zoom;

        cgl.canvas.addEventListener("mouseenter", this._onCanvasMouseEnter.bind(this));
        cgl.canvas.addEventListener("mouseleave", this._onCanvasMouseLeave.bind(this));
        cgl.canvas.addEventListener("mousedown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("mousemove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("mouseup", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this));
        this.glPatch.on("dblclick", this._onCanvasDblClick.bind(this));
    }

    setSize(w, h)
    {
        this._viewResX = w;
        this._viewResY = h;
    }

    setMousePos(x, y)
    {
        // const frames = 3;
        // let dx = (x - this._lastPosPixel[0]);
        // const dy = (y - this._lastPosPixel[1]);


        // this._mouseSmoothCount = this._mouseSmoothCount++ % frames;

        // this._mouseSmooth[this._mouseSmoothCount++] = dx;
        // dx = 0;
        // for (let i = 0; i < frames; i++)
        // {
        //     dx += this._mouseSmooth[i];
        //     this._mouseSmooth[i] *= 0.33333;
        // }

        // dx /= frames;
        // // console.log(dx);
        // dx *= Math.abs(dx * 0.333);

        const dx = 0;
        const dy = 0;
        // console.log(dx);

        // dx *= dx;
        // console.log(this._mouseSmooth);

        // console.log(this._lastPosPixel, dx, dy);

        const coord = this.screenToPatchCoord(x + dx, y + dy);
        this.mousePatchNotPredicted = this.screenToPatchCoord(x, y);

        this._mousePatchX = coord[0];
        this._mousePatchY = coord[1];
        this._mouseX = x;
        this._mouseY = y;
    }

    _onCanvasMouseEnter(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasMouseLeave(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasMouseDown(e)
    {
        if (this.glPatch.mouseState.buttonRight)
        {
            this._oldScrollX = this._scrollX;
            this._oldScrollY = this._scrollY;
            this._mouseRightDownStartX = e.offsetX;
            this._mouseRightDownStartY = e.offsetY;
        }
    }

    _onCanvasMouseMove(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
        this._lastPosPixel[0] = e.offsetX;
        this._lastPosPixel[1] = e.offsetY;

        if (this.glPatch.mouseState.buttonRight && this.glPatch.allowDragging)
        {
            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.5 / this._cgl.pixelDensity;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.5 / this._cgl.pixelDensity;

            this._scrollX = this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX;
            this._scrollY = this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY;
        }
    }

    _onCanvasMouseUp(e)
    {
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
    }

    _onCanvasDblClick(e)
    {
        if (this._zoom == CABLES.GLGUI.VISUALCONFIG.zoomDefault) this._zoom = this.glPatch.getZoomForAllOps();
        else this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        this._smoothedZoom.set(this._zoom);
        this._smoothedZoomValue = this._zoom;
    }

    _onCanvasWheel(event)
    {
        this.setMousePos(event.offsetX, event.offsetY);

        let delta = 5;
        if (event.deltaY < 0)delta *= -1;

        if (event.altKey) this._scrollY -= delta;
        else if (event.shiftKey) this._scrollX -= delta;

        this.wheelZoom(delta);
        this.setMousePos(this._mouseX, this._mouseY);
    }

    wheelZoom(delta)
    {
        if (delta == 0) return;

        const wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

        if (delta < 0) delta = 1.0 - 0.2 * wheelMultiplier;
        else delta = 1 + 0.2 * wheelMultiplier;

        const mouse = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        const newZoom = this._smoothedZoomValue * delta;

        const x = this._scrollX + mouse[0];
        const y = this._scrollY + mouse[1];

        this._zoom = newZoom;
        this._smoothedZoom.set(this._zoom);
        this._smoothedZoomValue = this._zoom;

        const mouseAfterZoom = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        this.scrollTo(
            x - mouseAfterZoom[0],
            y - mouseAfterZoom[1]);

        gui.patchView.emitEvent("viewBoxChange");
    }

    get zoom() { return this._smoothedZoomValue; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom() { return -this._scrollX / this._smoothedZoomValue; }

    get scrollYZoom() { return this._scrollY / this._smoothedZoomValue; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    get mousePatchX() { return this._mousePatchX; }

    get mousePatchY() { return this._mousePatchY; }

    update()
    {
        this._smoothedZoom.update();

        if (!this._boundingRect)
        {
            this._boundingRect = this.glPatch.rectDrawer.createRect();
            this._boundingRect.interactive = false;
            this._boundingRect.setPosition(0, 0, 1);
            this._boundingRect.setSize(110, 110);
            this._boundingRect.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opBoundsRect);
        }

        if (!this._boundingRect2)
        {
            this._boundingRect2 = this.glPatch.rectDrawer.createRect();
            this._boundingRect2.interactive = false;
            this._boundingRect2.setPosition(0, 0, 1);
            this._boundingRect2.setSize(110, 110);
            this._boundingRect2.setColor([1, 1, 1, 0.1]);
        }

        const bounds = this.glPatch.rectDrawer.bounds;
        this._boundingRect.setPosition(bounds.minX, bounds.minY, 0.1);
        this._boundingRect.setSize(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    scrollTo(x, y)
    {
        this._scrollX = x;
        this._scrollY = y;

        gui.patchView.emitEvent("viewBoxChange");
    }

    center()
    {
        let ops = gui.patchView.getSelectedOps();
        if (ops.length == 0)ops = gui.corePatch().ops;

        const bb = new CGL.BoundingBox();
        const subp = this.glPatch.getCurrentSubPatch();

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch != subp) continue;

            bb.applyPos(
                ops[i].uiAttribs.translate.x,
                ops[i].uiAttribs.translate.y,
                0);

            bb.applyPos(
                ops[i].uiAttribs.translate.x + this.glPatch.getGlOp(ops[i]).w,
                ops[i].uiAttribs.translate.y + this.glPatch.getGlOp(ops[i]).h,
                0);
        }

        bb.calcCenterSize();
        const padding = 1.05;
        console.log("bb size", bb.size[0], bb.size[1]);
        bb.size[0] *= padding;
        bb.size[1] *= padding;

        const zx = bb.size[0] / 2; // zoom on x
        const zy = (bb.size[1]) / 2 * (this._viewResX / this._viewResY);
        const z = Math.max(300, Math.max(zy, zx));

        this._smoothedZoom.set(z);
        this._smoothedZoomValue = z;

        const cy = bb.center[1] * (this._viewResX / this._viewResY);

        this.scrollTo(bb.center[0], cy);

        this._boundingRect2.setPosition(
            bb.center[0] - (bb.size[0] / 2),
            bb.center[1] - (bb.size[1] / 2),
            0.1);
        this._boundingRect2.setSize(bb.size[0], bb.size[1]);
        this._boundingRect2.setDecoration(4);
    }

    screenToPatchCoord(x, y, aspect)
    {
        const z = 1 / (this._viewResX / 2 / this.zoom);
        let zy = z;
        if (aspect)zy = 1 / (this._viewResY / 2 / this.zoom);
        const asp = this._viewResY / this._viewResX;

        const mouseAbsX = (x - (this._viewResX / 2)) * z - (this.scrollX);
        const mouseAbsY = (y - (this._viewResY / 2)) * zy + (this.scrollY * asp);

        return [mouseAbsX, mouseAbsY];
    }

    serialize(dataui)
    {
        dataui.viewBoxGl = { "x": this._scrollX, "y": this._scrollY, "z": this._zoom };
        console.log("serialize glviewbox!!!");
    }

    deSerialize(dataui)
    {
        console.log(dataui.viewBoxGl);
        const data = dataui.viewBoxGl || { "x": 0, "y": 0, "z": CABLES.GLGUI.VISUALCONFIG.zoomDefault };
        this._scrollX = data.x;
        this._scrollY = data.y;
        this._smoothedZoomValue = this._zoom = data.z;
    }
};
