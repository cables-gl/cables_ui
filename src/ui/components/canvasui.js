import ele from "../utils/ele";

export default class CanvasUi
{
    constructor(cgl)
    {
        this._cgl = cgl;

        this.isCanvasFocussed = false;

        this._elCanvasIconbarContainer = this._elCanvasIconbarContainer || ele.byId("canvasicons");
        this._elCanvasIconbar = this._elCanvasIconbar || ele.byId("canvasIconBar");
        this._elCanvasInfoSize = this._elCanvasInfoSize || ele.byId("canvasInfoSize");
        this._elSplitterPatch = this._elSplitterPatch || ele.byId("splitterPatch");
        this._elCanvasInfoFps = this._elCanvasInfoFps || document.getElementById("canvasInfoFPS");
        this._elCanvasInfoMs = this._elCanvasInfoMs || document.getElementById("canvasInfoMS");
        this._elInfoVersion = ele.byId("canvasInfoVersion");

        if (this._cgl.glVersion == 1)
        {
            this._elCanvasInfoVer = this._elCanvasInfoVer || document.getElementById("canvasInfoVersion");
            this._elCanvasInfoVer.innerHTML = "WebGL 1";
        }
        else ele.hide(this._elInfoVersion);


        gui.corePatch().on("performance", (perf) =>
        {
            if (this.isCanvasFocussed)
            {
                this._elCanvasInfoFps.innerHTML = perf.fps + " FPS";
                this._elCanvasInfoMs.innerHTML = perf.ms + " MS";
                this._elCanvasInfoFps.style.opacity = 1;
                this._elCanvasInfoMs.style.opacity = 1;
            }
        });


        ele.byId("glcanvas").addEventListener("focus", () =>
        {
            this.showCanvasModal(true);
        });

        document.body.addEventListener("mousedown",
            (e) =>
            {
                if (this.isCanvasFocussed &&
                    !e.target.classList.contains("item") &&
                    !e.target.classList.contains("icon") &&
                    e.target.id != "glcanvas"
                ) this.showCanvasModal(false);
            }, true);
    }

    get canvasMode()
    {
        return gui._canvasMode;
    }

    updateCanvasIconBar()
    {
        if (!this._elCanvasIconbarContainer) return;

        const left = this._elSplitterPatch.getBoundingClientRect().left;

        this._elCanvasIconbarContainer.style.width = document.body.getBoundingClientRect().width - this._elSplitterPatch.getBoundingClientRect().width + "px";
        this._elCanvasIconbarContainer.style.left = left + 4 + "px";


        if (gui._canvasMode == this.CANVASMODE_PATCHBG)
            this._elCanvasIconbarContainer.style.top = 0;
        else
            this._elCanvasIconbarContainer.style.top = gui.rendererHeight * this._cgl.canvasScale + 1 + "px";


        const w = gui.rendererWidth * this._cgl.canvasScale;


        this._elCanvasIconbar.style.display = "inline-block";
        this._elCanvasIconbar.style.transform = "translate(-50%)";
        this._elCanvasIconbar.style["margin-left"] = ((w / 2)) + "px";

        if (w < 400)
        {
            this._elCanvasIconbar.style.display = "none";
        }
        else
        if (w < 600)
        {
            ele.hide(this._elCanvasInfoFps);
            ele.hide(this._elCanvasInfoMs);
        }
        else
        {
            ele.show(this._elCanvasInfoFps);
            ele.show(this._elCanvasInfoMs);
        }
    }

    getCanvasSizeString()
    {
        this._eleCanvasInfoZoom = this._eleCanvasInfoZoom || document.getElementById("canvasInfoZoom");

        let sizeStr = " " + Math.floor(100 * this._cgl.canvasWidth) / 100 + "x" + Math.floor(100 * this._cgl.canvasHeight) / 100;
        if (this._cgl.canvasScale != 1) sizeStr += " Scale " + this._cgl.canvasScale + " ";
        if (this._cgl.pixelDensity != 1) sizeStr += " (" + Math.floor(100 * this._cgl.canvasWidth / this._cgl.pixelDensity) / 100 + "x" + Math.floor(100 * this._cgl.canvasHeight / this._cgl.pixelDensity) / 100 + "x" + this._cgl.pixelDensity + ")";

        this._elCanvasInfoSize.innerHTML = sizeStr;
        this._elCanvasInfoAspect = this._elCanvasInfoAspect || document.getElementById("canvasInfoAspect");


        const zoom = Math.round(window.devicePixelRatio * 100);
        if (zoom != 100)
        {
            ele.show(this._eleCanvasInfoZoom);
            this._eleCanvasInfoZoom.innerHTML = "Zoom " + zoom + "% ";
        }
        else
        {
            ele.hide(this._eleCanvasInfoZoom);
        }

        return sizeStr;
    }

    showCanvasModal(_show)
    {
        this._elCanvasModalDarkener = this._elCanvasModalDarkener || document.getElementById("canvasmodal");

        if (gui._canvasMode == this.CANVASMODE_PATCHBG)
        {
            ele.show(this._elCanvasIconbarContainer);
            this.isCanvasFocussed = false;

            ele.hide(this._elCanvasModalDarkener);

            this.updateCanvasIconBar();
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString();
            return;
        }

        this.isCanvasFocussed = _show;

        if (!this._elCanvasIconbarContainer) return;


        if (_show)
        {
            ele.show(this._elCanvasModalDarkener);
            ele.show(this._elCanvasIconbarContainer);
            this.updateCanvasIconBar();
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString();
        }
        else
        {
            if (this._elCanvasInfoFps) this._elCanvasInfoFps.style.opacity = 0.3;
            if (this._elCanvasInfoMs) this._elCanvasInfoMs.style.opacity = 0.3;

            ele.hide(this._elCanvasIconbarContainer);
            ele.hide(this._elCanvasModalDarkener);
        }
    }
}
