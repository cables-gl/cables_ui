import ele from "../../utils/ele";

export default class CanvasUi
{
    constructor(cg)
    {
        this._cg = cg;

        this.isCanvasFocussed = false;
        this.minimized = false;

        this._elCanvasIconbarContainer = this._elCanvasIconbarContainer || ele.byId("canvasicons");
        this._elCanvasIconbar = this._elCanvasIconbar || ele.byId("canvasIconBar");
        this._elcanvasCtxSwitcher = this._elcanvasCtxSwitcher || ele.byId("canvasCtxSwitcher");
        this._elCanvasInfoSize = this._elCanvasInfoSize || ele.byId("canvasInfoSize");
        this._elSplitterPatch = this._elSplitterPatch || ele.byId("splitterPatch");
        this._elCanvasInfoFps = this._elCanvasInfoFps || document.getElementById("canvasInfoFPS");
        this._elCtxSwitcher = this._elCtxSwitcher || document.getElementById("canvasCtxSwitcher");

        this._elCanvasInfoMs = this._elCanvasInfoMs || document.getElementById("canvasInfoMS");
        this._elInfoVersion = ele.byId("canvasInfoVersion");

        if (this._elInfoVersion)
        {
            if (this._cg.glVersion == 1)
            {
                this._elCanvasInfoVer = this._elCanvasInfoVer || document.getElementById("canvasInfoVersion");
                this._elCanvasInfoVer.innerHTML = "WebGL 1";
            }
            else this._elInfoVersion.remove();
        }

        this.canvasEle = this._cg.canvas;

        cg.fpsCounter.on("performance", (perf) =>
        {
            if (this.isCanvasFocussed)
            {
                this._elCanvasInfoFps.innerHTML = perf.fps + " FPS";
                this._elCanvasInfoMs.innerHTML = Math.round(this._cg.profileData.profileOnAnimFrameOps * 100) / 100 + " MS";
                this._elCanvasInfoFps.style.opacity = 1;
                this._elCanvasInfoMs.style.opacity = 1;
            }
        });

        this.canvasEle.setAttribute("tabindex", 3);

        this.canvasEle.addEventListener("focus", () =>
        {
            this.showCanvasModal(true);
            gui.canvasManager.setCurrentCanvas(this.canvasEle);
        });

        document.body.addEventListener("mousedown",
            (e) =>
            {
                if (this.isCanvasFocussed &&
                    !e.target.classList.contains("item") &&
                    !e.target.classList.contains("icon") &&
                    e.target != this.canvasEle
                ) this.showCanvasModal(false);
            },
            true);
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


        if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG)
            this._elCanvasIconbarContainer.style.top = "0px";
        else
            this._elCanvasIconbarContainer.style.top = gui.rendererHeight * this._cg.canvasScale + 1 + "px";

        const w = gui.rendererWidth * this._cg.canvasScale;


        ele.show(this._elCanvasIconbar);
        // this._elCanvasIconbar.style.display = "inline-block";
        this._elCanvasIconbar.style.transform = "translate(-50%)";
        this._elCanvasIconbar.style["margin-left"] = ((w / 2)) + "px";


        const r = this._elCanvasIconbar.getBoundingClientRect();
        const widthResizeIcon = 30;

        if (!this.minimized)
        {
            this.fullWidth = r.width + widthResizeIcon;
        }
        this.minimized = w < this.fullWidth;

        const hideeles = ele.byClassAll("canvasuihidable");
        for (let i = 0; i < hideeles.length; i++)
        {
            if (this.minimized)ele.hide(hideeles[i]);
            else ele.show(hideeles[i]);
        }

        if (this.minimized && w < r.width + widthResizeIcon) ele.hide(this._elCanvasIconbar);
        else ele.show(this._elCanvasIconbar);
    }

    getCanvasSizeString()
    {
        this._eleCanvasInfoZoom = this._eleCanvasInfoZoom || document.getElementById("canvasInfoZoom");

        let sizeStr = Math.floor(100 * this._cg.canvasWidth) / 100 + "x" + Math.floor(100 * this._cg.canvasHeight) / 100;
        if (this._cg.canvasScale != 1) sizeStr += " Scale " + this._cg.canvasScale + " ";
        if (this._cg.pixelDensity != 1) sizeStr += " (" + Math.floor(100 * this._cg.canvasWidth / this._cg.pixelDensity) / 100 + "x" + Math.floor(100 * this._cg.canvasHeight / this._cg.pixelDensity) / 100 + "x" + this._cg.pixelDensity + ")";

        this._elcanvasCtxSwitcher.innerHTML = this._cg.getGApiName();

        this._elCanvasInfoSize.innerHTML = sizeStr;
        this._elCanvasInfoAspect = this._elCanvasInfoAspect || document.getElementById("canvasInfoAspect");

        const zoom = Math.round(window.devicePixelRatio);
        if (zoom != 1)
        {
            if (!this.minimized) ele.show(this._eleCanvasInfoZoom);
            this._eleCanvasInfoZoom.innerHTML = "x" + zoom;
        }
        else
        {
            ele.hide(this._eleCanvasInfoZoom);
        }

        return sizeStr;
    }


    updateSizeDisplay()
    {
        this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString();
    }

    showCanvasModal(_show)
    {
        this._elCanvasModalDarkener = this._elCanvasModalDarkener || document.getElementById("canvasmodal");

        if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG)
        {
            ele.show(this._elCanvasIconbarContainer);
            _show = true;

            this.updateCanvasIconBar();
            this.updateSizeDisplay();

            return;
        }

        this.isCanvasFocussed = _show;

        if (!this._elCanvasIconbarContainer) return;


        if (_show)
        {
            if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG)ele.hide(this._elCanvasModalDarkener);
            else ele.show(this._elCanvasModalDarkener);

            ele.show(this._elCanvasIconbarContainer);
            this.updateCanvasIconBar();
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString();
        }
        else
        {
            if (this._elCanvasInfoFps) this._elCanvasInfoFps.style.opacity = 0.3;
            if (this._elCanvasInfoFps) this._elCanvasInfoFps.style.opacity = 0.3;
            if (this._elCanvasInfoMs) this._elCanvasInfoMs.style.opacity = 0.3;

            ele.hide(this._elCanvasIconbarContainer);
            ele.hide(this._elCanvasModalDarkener);
        }
    }
}
