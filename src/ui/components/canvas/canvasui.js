import ele from "../../utils/ele";
import userSettings from "../usersettings";

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
            const p = CABLES.UI.uiProfiler.start("[canvasUi] on performance");

            if (this.isCanvasFocussed)
            {
                if (this._oldFps != perf.fps) this._elCanvasInfoFps.innerHTML = perf.fps + " FPS";
                this._oldFps = perf.fps;

                const ms = Math.round(this._cg.profileData.profileOnAnimFrameOps * 100) / 100;
                if (this._oldMs != ms) this._elCanvasInfoMs.innerHTML = ms + " MS";
                this._oldMs = ms;
            }

            p.finish();
        });

        this.canvasEle.setAttribute("tabindex", 3);

        this.canvasEle.addEventListener("focus", () =>
        {
            const p = CABLES.UI.uiProfiler.start("[canvasUi] on focus");

            this.showCanvasModal(true);
            gui.canvasManager.setCurrentCanvas(this.canvasEle);

            p.finish();
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

        const perf = CABLES.UI.uiProfiler.start("[canvasUi] updateCanvasIconBar");




        const splitterPatchRect = this._elSplitterPatch.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        const left = this._elSplitterPatch.getBoundingClientRect().left;
        const width = bodyRect.width - splitterPatchRect.width;

        if (width != this._oldIconBarWidth) this._elCanvasIconbarContainer.style.width = width + "px";
        if (this._oldIconBarLeft != left) this._elCanvasIconbarContainer.style.left = left + 4 + "px";

        this._oldIconBarLeft = left;
        this._oldIconBarWidth = width;

        let top = "";
        if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG)
            top = "0px";
        else
            top = gui.rendererHeight * this._cg.canvasScale + 1 + "px";


        if (this._oldIconBarTop != top) this._elCanvasIconbarContainer.style.top = top;

        this._oldIconBarTop = top;

        const w = gui.rendererWidth * this._cg.canvasScale;

        ele.show(this._elCanvasIconbar);

        if (this._oldIconBarW != w)
        {
            this._elCanvasIconbar.style["margin-left"] = ((w / 2)) + "px";
            this._oldIconBarW = w;
        }


        const r = this._elCanvasIconbar.getBoundingClientRect();
        const widthResizeIcon = 30;


        this.minimized = w < this.fullWidth;

        if (!this.minimized) this.fullWidth = r.width + widthResizeIcon;

        if (this._wasMinimized != this.minimized)
        {
            const hideeles = ele.byClassAll("canvasuihidable");
            for (let i = 0; i < hideeles.length; i++)
            {
                if (this.minimized)
                {
                    if (!this._wasMinimized) ele.hide(hideeles[i]);
                }
                else
                {
                    if (this._wasMinimized) ele.show(hideeles[i]);
                }
            }
        }
        this._wasMinimized = this.minimized;

        if (this.minimized && w < r.width + widthResizeIcon)
        {
            this._minimizedHiding = true;
            ele.hide(this._elCanvasIconbar);
        }
        else
        {
            if (this._minimizedHiding) ele.show(this._elCanvasIconbar);
            this._minimizedHiding = false;
        }

        perf.finish();
    }

    getCanvasSizeString()
    {
        this._eleCanvasInfoZoom = this._eleCanvasInfoZoom || document.getElementById("canvasInfoZoom");
        this._elCanvasInfoAspect = this._elCanvasInfoAspect || document.getElementById("canvasInfoAspect");

        let sizeStr = Math.floor(100 * this._cg.canvasWidth) / 100 + "x" + Math.floor(100 * this._cg.canvasHeight) / 100;
        if (this._cg.canvasScale != 1) sizeStr += " Scale " + this._cg.canvasScale + " ";
        if (this._cg.pixelDensity != 1) sizeStr += " (" + Math.floor(100 * this._cg.canvasWidth / this._cg.pixelDensity) / 100 + "x" + Math.floor(100 * this._cg.canvasHeight / this._cg.pixelDensity) / 100 + "x" + Math.round(this._cg.pixelDensity * 100) / 100 + ")";

        const apiName = this._cg.getGApiName();
        if (this._oldApiName != apiName) this._elcanvasCtxSwitcher.innerHTML = apiName;
        this._oldApiName = apiName;

        if (this._oldSizeStr != sizeStr) this._elCanvasInfoSize.innerHTML = sizeStr;
        this._oldSizeStr = sizeStr;

        const zoom = Math.round(window.devicePixelRatio);
        if (zoom != 1)
        {
            this._showingInfoZoom = true;
            if (!this.minimized) ele.show(this._eleCanvasInfoZoom);
            this._eleCanvasInfoZoom.innerHTML = "x" + zoom;
        }
        else
        {
            if (this._showingInfoZoom) ele.hide(this._eleCanvasInfoZoom);
            this._showingInfoZoom = false;
        }

        return sizeStr;
    }


    updateSizeDisplay()
    {
        const sizeStr = this.getCanvasSizeString();
        if (sizeStr != this._oldSizeStr) this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString();
        this._oldSizeStr = sizeStr;
    }

    showCanvasModal(_show)
    {
        if (userSettings.get("hideCanvasUi")) return;

        const perf = CABLES.UI.uiProfiler.start("[canvasUi] showCanvasModal");

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
            if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG)
            {
                ele.hide(this._elCanvasModalDarkener);
            }
            else
            {
                if (!this._showing) ele.show(this._elCanvasModalDarkener);
            }

            if (!this._showing) ele.show(this._elCanvasIconbarContainer);

            this.updateCanvasIconBar();

            const sizeStr = this.getCanvasSizeString();

            if (sizeStr != this._oldSizeStr) this._elCanvasInfoSize.innerHTML = sizeStr;
            this._oldSizeStr = sizeStr;
        }
        else
        {
            setTimeout(() =>
            {
                ele.hide(this._elCanvasIconbarContainer);
                ele.hide(this._elCanvasModalDarkener);
            }, 100);
        }

        this._showing = _show;

        perf.finish();
    }
}
