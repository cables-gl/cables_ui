import { ele } from "cables-shared-client";
import { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";

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

        this._elCanvasInfoSizeOverlay = ele.byId("canvasInfoOverlay");

        this._elCanvasIconbarContainer.addEventListener("click", () =>
        {
            this.canvasEle.focus();
        });

        this._elCanvasInfoSize.addEventListener("pointerenter", () =>
        {
            this._elCanvasInfoSizeOverlay.style.top = this._elCanvasInfoSize.getBoundingClientRect().y + 30 + "px";
            this._elCanvasInfoSizeOverlay.style.left = this._elCanvasInfoSize.getBoundingClientRect().x + "px";
            // this._elCanvasInfoSizeOverlay.innerHTML = "";
            this._elCanvasInfoSizeOverlay.classList.remove("hidden");
        });
        this._elCanvasInfoSize.addEventListener("pointerleave", () =>
        {
            this._elCanvasInfoSizeOverlay.classList.add("hidden");
        });

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

        cg.on("resize", () =>
        {
            this.updateSizeDisplay();
        });

        cg.fpsCounter.on("performance", (perf) =>
        {
            const p = gui.uiProfiler.start("[canvasUi] on performance");

            // if (this.isCanvasFocussed)
            // {
            if (this._oldFps != perf.fps) this._elCanvasInfoFps.innerHTML = perf.fps + " FPS";
            this._oldFps = perf.fps;

            if (this._cg.profileData)
            {
                let ms = ((Math.round(this._cg.profileData.profileOnAnimFrameOps * 100) / 100) || "0.0") + "ms";

                if (window.gui && gui.patchView.patchRenderer.vizLayer && gui.patchView.patchRenderer.vizLayer.renderMs > 3)
                {
                    ms += " vizLayer: " + Math.round(gui.patchView.patchRenderer.vizLayer.renderMs) + "ms";
                }

                if (this._oldMs != ms) this._elCanvasInfoMs.innerHTML = ms;
                this._oldMs = ms;
            }
            // }

            p.finish();
        });

        this.canvasEle.setAttribute("tabindex", 0);

        this.canvasEle.addEventListener("focus", () =>
        {
            const p = gui.uiProfiler.start("[canvasUi] on focus");

            this.showCanvasModal(true);
            gui.canvasManager.setCurrentCanvas(this.canvasEle);
            p.finish();
        });

        document.body.addEventListener("pointerdown",
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

        const perf = gui.uiProfiler.start("[canvasUi] updateCanvasIconBar");

        const splitterPatchRect = this._elSplitterPatch.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        perf.finish();
    }

    updateSizeDisplay()
    {
        if (!gui.corePatch().cgl) return;

        const canvas = gui.canvasManager.currentCanvas();

        const ctx = gui.canvasManager.currentContext();

        this._elCanvasInfoAspect = this._elCanvasInfoAspect || document.getElementById("canvasInfoAspect");

        let sizeStr = canvas.width + "x" + canvas.height;
        if (ctx.pixelDensity != 1) sizeStr += " (" + Math.round(ctx.pixelDensity * 100) / 100 + "x)";

        gui.canvasManager.updateCanvasUi();

        if (this._oldSizeStr != sizeStr) this._elCanvasInfoSize.innerHTML = sizeStr;
        this._oldSizeStr = sizeStr;

        this.updateIconState();

        let str = "<table>";
        str += "<tr><td>Canvas API</td><td>" + ctx.getGApiName() + "</td></tr>";
        str += "<tr><td>Canvas id</td><td>" + canvas.id + "</td></tr>";
        str += "<tr><td>Canvas CSS Size:</td><td><code>" + canvas.clientWidth + "&nbsp;x&nbsp;" + canvas.clientHeight + "</td></tr>";
        str += "<tr><td>Canvas Pixel Size:</td><td><code>" + canvas.width + " x " + canvas.height + "</td></tr>";
        str += "<tr><td>Device Pixel Ratio/Density:</td><td><code>" + window.devicePixelRatio + "</td></tr>";
        str += "<tr><td>Canvas Pixel Ratio/Density:</td><td><code>" + ctx.pixelDensity + "</td></tr>";
        str += "</table>";
        this._elCanvasInfoSizeOverlay.innerHTML = str;

        return sizeStr;
    }

    updateIconState()
    {
        const act = userSettings.get("overlaysShow");
        const icon = ele.byId("canvUitoggleOverlay");
        if (icon)
            if (act)icon.style.backgroundColor = "var(--color-special)";
            else icon.style.backgroundColor = "var(--color-07)";
    }

    showCanvasModal(_show)
    {
        if (userSettings.get("hideCanvasUi")) return;

        const perf = gui.uiProfiler.start("[canvasUi] showCanvasModal");

        this._elCanvasModalDarkener = this._elCanvasModalDarkener || document.getElementById("canvasmodal");

        this.updateSizeDisplay();
        this.updateCanvasIconBar();

        this.isCanvasFocussed = _show;
        if (this.isCanvasFocussed) this._elCanvasIconbar.classList.remove("hidden");
        else this._elCanvasIconbar.classList.add("hidden");

        if (_show)
        {
            if (gui.canvasManager.mode == gui.canvasManager.CANVASMODE_PATCHBG)

            {
                ele.hide(this._elCanvasModalDarkener);
            }
            else
            {
                if (!this._showing) ele.show(this._elCanvasModalDarkener);
            }

            // if (!this._showing) ele.show(this._elCanvasIconbarContainer);

            // const sizeStr = this.getCanvasSizeString();

            // if (sizeStr != this._oldSizeStr) this._elCanvasInfoSize.innerHTML = sizeStr;
            // this._oldSizeStr = sizeStr;
        }
        else
        {
            setTimeout(() =>
            {
            // ele.hide(this._elCanvasIconbarContainer);
                ele.hide(this._elCanvasModalDarkener);
            }, 100);
        }

        this._showing = _show;

        perf.finish();
    }
}
