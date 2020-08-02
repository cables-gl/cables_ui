CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.CanvasLens = class
{
    constructor(ele)
    {
        this._origCanvas = ele || document.getElementById("glcanvas");
        this._lensCanvas = document.createElement("canvas");
        this._lensCanvas.id = "canvaslens";
        this._lensCanvas.width = 100;
        this._lensCanvas.height = 100;
        this._lensCanvas.style["z-index"] = 999999999;
        this._lensCanvas.style.width = "100px";
        this._lensCanvas.style.height = "100px";
        this._lensCanvas.style.left = "9px";
        this._lensCanvas.style.top = "9px";
        this._lensCanvas.style.position = "absolute";
        this._lensCanvas.style["pointer-events"] = "none";
        this._lensCanvas.style.border = "2px solid white";

        this._scale = 5;
        this._size = 100;
        this._size2 = this._size / 2;
        this._origPixels = this._size / this._scale;
        this._origPixels2 = this._size / this._scale / 2;

        this._ctx = this._lensCanvas.getContext("2d");
        this._ctx.imageSmoothingEnabled = false;

        document.body.appendChild(this._lensCanvas);


        this._endFrameListener = this._onEndframe.bind(this);
        gui.corePatch().cgl.on("endFrame", this._endFrameListener);

        this._moveListener = this._onMouseMove.bind(this);
        this._origCanvas.addEventListener("mousemove", this._moveListener);

        this._origCanvas.addEventListener("mouseleave", (e) =>
        {
            setTimeout(() =>
            {
                this.close();
            }, 2000);
        });
    }

    _onMouseMove(e)
    {
        const rect = e.target.getBoundingClientRect();
        this._x = e.clientX - rect.left; // x position within the element.
        this._y = e.clientY - rect.top; // y position within the element.

        this._lensCanvas.style.left = e.clientX - this._size2;
        this._lensCanvas.style.top = e.clientY + 15;
    }

    _onEndframe()
    {
        console.log("!!!");
        this._ctx.clearRect(0, 0, this._size, this._size);
        this._ctx.drawImage(this._origCanvas, this._x - this._origPixels2, this._y - this._origPixels2, this._origPixels, this._origPixels, 0, 0, this._size, this._size);
    }

    close()
    {
        console.log("close!!!");
        gui.corePatch().cgl.off("endFrame", this._endFrameListener);
        this._origCanvas.removeEventListener("mousemove", this._moveListener);

        // this._lensCanvas.remove();
    }
};
