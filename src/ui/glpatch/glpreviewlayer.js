CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPreviewLayer = class extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();

        this._glPatch = glPatch;

        this._glPatch.on("resize", this._updateSize.bind(this));

        this._eleCanvas = document.createElement("canvas");

        this._eleCanvas.id = "gluiPreviewLayer";
        this._eleCanvas.classList.add("gluiPreviewLayer");
        this._eleCanvas.style.zIndex = this._glPatch._cgl.canvas.style.zIndex + 10;
        this._eleCanvas.style.position = "absolute";
        this._eleCanvas.style.pointerEvents = "none";

        document.body.appendChild(this._eleCanvas);


        this._canvasCtx = this._eleCanvas.getContext("2d");
        this.drawCanvas();

        console.log("glui overlay preview");
    }

    _updateSize()
    {
        this._eleCanvas.width = this._glPatch._cgl.canvasWidth;
        this._eleCanvas.height = this._glPatch._cgl.canvasHeight;
        this.drawCanvas();
    }

    drawCanvas()
    {
        this._canvasCtx.font = "10px Arial";
        this._canvasCtx.fillStyle = "#ffffff";
        this._canvasCtx.fillText("Hello overlay preview", 10, 100);

        // this._canvasCtx.fillRect(0, 0, this._eleCanvas.width, this._eleCanvas.height);
    }
};
