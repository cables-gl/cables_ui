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

        cgl.canvas.addEventListener("mousedown", (e) =>
        {
            if (this.glPatch.mouseState.buttonRight)
            {
                this._oldScrollX = this._scrollX;
                this._oldScrollY = this._scrollY;
                this._mouseRightDownStartX = e.offsetX;
                this._mouseRightDownStartY = e.offsetY;
            }
        });

        cgl.canvas.addEventListener("mousemove", (e) =>
        {
            if (this.glPatch.mouseState.buttonRight && this.glPatch.allowDragging)
            {
                const pixelMulX = cgl.canvas.width / this._zoom * 0.5;
                const pixelMulY = cgl.canvas.height / this._zoom * 0.5;

                this._scrollX = this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX;
                this._scrollY = this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY;
            }
            this._mouseX = e.offsetX;
            this._mouseY = e.offsetY;
        });

        cgl.canvas.addEventListener("mouseup", (e) =>
        {
            this._oldScrollX = this._scrollX;
            this._oldScrollY = this._scrollY;
        });

        cgl.canvas.addEventListener("dblclick", (e) =>
        {
            if (this._zoom == CABLES.GLGUI.VISUALCONFIG.zoomDefault) this._zoom = this.glPatch.getZoomForAllOps();
            else this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
            this._smoothedZoom.set(this._zoom);
        });

        cgl.canvas.addEventListener("wheel", (event) =>
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
        });
    }

    get zoom() { return this._zoom; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom() { return -this._scrollX / this._zoom; }

    get scrollYZoom() { return this._scrollY / this._zoom; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    update()
    {
        this._smoothedZoom.update();
    }
};
