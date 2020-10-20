CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.ViewBox = class
{
    constructor(cgl, glPatch)
    {
        this._cgl = cgl;
        this.glPatch = glPatch;

        this._mouseX = 0;
        this._mouseY = 0;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._viewResX = 0;
        this._viewResY = 0;
        this._boundingRect = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        this._smoothedZoom = new CABLES.UI.ValueSmoother(this._zoom, CABLES.GLGUI.VISUALCONFIG.zoomSmooth);

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
        const coord = this.screenToPatchCoord(x, y);
        this._mousePatchX = coord[0];
        this._mousePatchY = coord[1];
        this._mouseX = x;
        this._mouseY = y;
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
        if (this.glPatch.mouseState.buttonRight && this.glPatch.allowDragging)
        {
            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.25;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.25;

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
    }

    _onCanvasWheel(event)
    {
        const wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

        // let delta = CGL.getWheelSpeed(event);
        // event = CABLES.mouseEvent(event);

        // console.log(event.deltaY);

        let delta = 5;
        if (event.deltaY < 0)delta *= -1;

        delta *= wheelMultiplier;

        if (event.altKey) this._scrollY -= delta;
        else if (event.shiftKey) this._scrollX -= delta;
        else this._zoom += delta * (this._zoom / 155) * 2;


        this._zoom = Math.max(CABLES.GLGUI.VISUALCONFIG.minZoom, this._zoom);
        this._smoothedZoom.set(this._zoom);

        if (event.ctrlKey || event.altKey) // disable chrome pinch/zoom gesture
        {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        gui.patchView.emitEvent("viewBoxChange");
    }

    get zoom() { return this._smoothedZoom.value; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom() { return -this._scrollX / this._smoothedZoom.value; }

    get scrollYZoom() { return this._scrollY / this._smoothedZoom.value; }

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

        const bounds = this.glPatch.rectDrawer.bounds;
        this._boundingRect.setPosition(bounds.minX, bounds.minY, 0.1);
        this._boundingRect.setSize(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    scrollTo(x, y)
    {
        // const pixelMulX = cgl.canvas.width / this._zoom * 0.5;
        // const pixelMulY = cgl.canvas.height / this._zoom * 0.5;

        this._scrollX = x;
        this._scrollY = y;

        gui.patchView.emitEvent("viewBoxChange");
    }

    center()
    {
        const ops = gui.patchView.getSelectedOps();

        console.log("center!", ops.length + " ops...");

        if (ops.length > 0)
        {
            const x = ops[0].uiAttribs.translate.x;
            const y = ops[0].uiAttribs.translate.y;
            this.scrollTo(x, y);
        }
    }

    screenToPatchCoord(x, y)
    {
        const z = 1 / (this._viewResX / 2 / this.zoom);
        const asp = this._viewResY / this._viewResX;

        const mouseAbsX = (x - (this._viewResX / 2)) * z - (this.scrollX);
        const mouseAbsY = (y - (this._viewResY / 2)) * z + (this.scrollY * asp);

        return [mouseAbsX, mouseAbsY];
    }
};
