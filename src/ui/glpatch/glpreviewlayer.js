

CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPreviewLayer = class extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();

        this._items = [];

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

        this._glPatch.on("mouseOverCablePort", (opid, portname) =>
        {
            this._hoverPort = portname;
            this._hoverOpid = opid;
        });
    }

    _updateSize()
    {
        this._eleCanvas.width = this._glPatch._cgl.canvasWidth;
        this._eleCanvas.height = this._glPatch._cgl.canvasHeight;
        this.drawCanvas();
    }

    render()
    {
    // check if needed...
        this.drawCanvas();
    }

    drawCanvas()
    {
        this._canvasCtx.clearRect(0, 0, this._eleCanvas.width, this._eleCanvas.height);

        this._canvasCtx.font = "13px Arial";
        this._canvasCtx.fillStyle = "#ffffff";
        // this._canvasCtx.fillText("Hello overlay preview", 10, 100);

        for (let i = 0; i < this._items.length; i++)
        {
            const pos = this._glPatch.viewBox.patchToScreenCoords(
                this._items[i].posX,
                this._items[i].posY);
                // this._items[i].op.uiAttribs.translate.x,
                // this._items[i].op.uiAttribs.translate.y);

            this._canvasCtx.fillRect(pos[0], pos[1], 100, 1);
            this._canvasCtx.fillText(this._items[i].port.name + ": " + this._items[i].port.get(), pos[0], pos[1]);
        }
    }

    addCurrentPort()
    {
        const ops = gui.patchView.getSelectedOps();

        const op = gui.corePatch().getOpById(this._glPatch.hoverLink.opIdOutput);
        // this._hoverPort = portname;
        // this._hoverOpid = opid;
        const port = op.getPort(this._glPatch.hoverLink.nameOutput);

        // for (let i = 0; i < ops.length; i++)
        this._items.push({ "op": op, "port": port, "posX": this._glPatch._dropInCircleRect.x, "posY": this._glPatch._dropInCircleRect.y });


        // console.log("this._items.length", this._items.length);
    }
};
