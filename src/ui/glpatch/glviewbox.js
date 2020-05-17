CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.ViewBox = class
{
    constructor(cgl, glPatch)
    {
        this.glPatch = glPatch;
        this._mouseX = 0;
        this._mouseY = 0;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        this._smoothedZoom = new CABLES.UI.ValueSmoother(this._zoom, CABLES.GLGUI.VISUALCONFIG.zoomSmooth);
        this._cgl = cgl;

        cgl.canvas.addEventListener("mousedown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("mousemove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("mouseup", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("dblclick", this._onCanvasDblClick.bind(this));
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this));
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
        if (this.glPatch.mouseState.buttonRight && this.glPatch.allowDragging)
        {
            const pixelMulX = this._cgl.canvas.width / this._zoom * 0.5;
            const pixelMulY = this._cgl.canvas.height / this._zoom * 0.5;

            this._scrollX = this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX;
            this._scrollY = this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY;
        }
        this._mouseX = e.offsetX;
        this._mouseY = e.offsetY;
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

        let delta = CGL.getWheelSpeed(event);
        event = CABLES.mouseEvent(event);
        delta *= wheelMultiplier;

        if (event.altKey) this._scrollY -= delta;
        else if (event.shiftKey) this._scrollX -= delta;
        else this._zoom += delta * (this._zoom / 155);

        this._zoom = Math.max(CABLES.GLGUI.VISUALCONFIG.minZoom, this._zoom);
        this._smoothedZoom.set(this._zoom);

        if (event.ctrlKey || event.altKey) // disable chrome pinch/zoom gesture
        {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    get zoom() { return this._smoothedZoom.value; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom() { return -this._scrollX / this._smoothedZoom.value; }

    get scrollYZoom() { return this._scrollY / this._smoothedZoom.value; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    update()
    {
        this._smoothedZoom.update();
    }

    scrollTo(x, y)
    {
        // const pixelMulX = cgl.canvas.width / this._zoom * 0.5;
        // const pixelMulY = cgl.canvas.height / this._zoom * 0.5;

        this._scrollX = x;
        this._scrollY = y;
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
};
