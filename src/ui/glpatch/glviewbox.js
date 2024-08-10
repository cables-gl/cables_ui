import GlUiConfig from "./gluiconfig.js";
import userSettings from "../components/usersettings.js";
import Gui from "../gui.js";


/**
 * Viewbox of current patch
 *
 * @export
 * @class GlViewBox
 */
export default class GlViewBox
{
    constructor(cgl, glPatch)
    {
        this._cgl = cgl;
        this.glPatch = glPatch;

        this.mousePatchNotPredicted = vec2.create();
        this._lastPosPixel = vec2.create();
        this._mouseSmooth = [];
        this._mouseSmoothCount = 0;
        this._subPatchViewBoxes = {};
        this._currentSubPatchId = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this._mousePatchX = this._mousePatchY = 0;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._viewResX = 0;
        this._viewResY = 0;
        // this._opsBoundingRect = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = GlUiConfig.zoomDefault;
        this._spaceDown = false;
        this._touchpadMode = false;
        this._outOfBounds = false;

        this._defaultEasing = CABLES.EASING_EXPO_OUT;

        this._animScrollX = new CABLES.Anim({ "defaultEasing": this._defaultEasing });
        this._animScrollY = new CABLES.Anim({ "defaultEasing": this._defaultEasing });
        this._animZoom = new CABLES.Anim({ "defaultEasing": this._defaultEasing });

        cgl.canvas.addEventListener("pointerenter", this._onCanvasMouseEnter.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointerleave", this._onCanvasMouseLeave.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this), { "passive": true });
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this), { "passive": true });
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this), { "passive": true });
        // this.glPatch.on("dblclick", this._onCanvasDblClick.bind(this));

        this.glPatch.addEventListener("spacedown", this._onCanvasSpaceDown.bind(this));
        this.glPatch.addEventListener("spaceup", this._onCanvasSpaceUp.bind(this));

        // cgl.canvas.addEventListener("touchmove", this._onCanvasTouchMove.bind(this), { "passive": true });

        this._eleTabs = document.getElementById("splitterMaintabs");

        // this._drawBoundingRect = userSettings.get("glpatch_showboundings");

        // userSettings.on("change", (which, v) =>
        // {
        //     if (which == "glpatch_showboundings")
        //     {
        //         this._drawBoundingRect = v;
        //         // // if (this._opsBoundingRect) this._opsBoundingRect.visible = v;
        //     }
        // });
    }

    setSize(w, h)
    {
        const first = (this._viewResX === 0 && this._viewResY === 0);
        this._viewResX = w;
        this._viewResY = h;

        if (first) this.setMousePos(this._cgl.canvasWidth / 2, this._cgl.canvasHeight / 2);
    }

    setMousePos(x, y)
    {
        const dx = 0;
        const dy = 0;

        x = Math.ceil(x);
        y = Math.ceil(y);

        const coord = this.screenToPatchCoord(x + dx, y + dy);
        this.mousePatchNotPredicted = this.screenToPatchCoord(x, y);

        gui.patchView.emitEvent("mouseMove", this._mousePatchX, this._mousePatchY);
        gui.patchView.emitEvent("viewBoxChange");

        this._mousePatchX = coord[0];
        this._mousePatchY = coord[1];
        this._mouseX = x;
        this._mouseY = y;
    }

    _onCanvasMouseEnter(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasMouseLeave(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasSpaceUp(e)
    {
        this._spaceDown = false;
    }

    _onCanvasSpaceDown(e)
    {
        if (this._spaceDown) return;
        this._spaceDown = true;
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this._mouseRightDownStartX = this._mouseX;
        this._mouseRightDownStartY = this._mouseY;
    }

    _onCanvasMouseDown(e)
    {
        this._onCanvasMouseMove(e);
        // (e.offsetX, e.offsetY);
        if (this.glPatch.mouseState.buttonStateForScrolling || this.glPatch.spacePressed || this.glPatch.mouseState.numFingers)
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

        this._lastPosPixel[0] = e.offsetX;
        this._lastPosPixel[1] = e.offsetY;

        if (window.gui.getRestriction() < gui.RESTRICT_MODE_EXPLORER) return;

        if (
            (this.glPatch.mouseState.buttonStateForScrolling) ||
            ((this.glPatch.spacePressed || this.glPatch.mouseState.numFingers == 2) && (this.glPatch.mouseState.buttonLeft || this.glPatch.mouseState.buttonRight || this.glPatch.mouseState.buttonStateForScrolling)))
        {
            this.glPatch.setCursor(CABLES.GLGUI.CURSOR_HAND);
            CABLES.UI.hideToolTip();
            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.5 / this._cgl.pixelDensity;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.5 / this._cgl.pixelDensity;

            this.scrollTo(
                this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX,
                this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY,
                true);
        }
    }

    _onCanvasMouseUp(e)
    {
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this.glPatch.setCursor(CABLES.GLGUI.CURSOR_NORMAL);
    }

    _onCanvasDblClick(e)
    {
        const z = GlUiConfig.zoomDefault;
        if (Math.abs(this._zoom - GlUiConfig.zoomDefault) < 200)
        {
            this.glPatch.unselectAll();
            this.centerSelectedOps();
        }
        else
        {
            this.animateZoom(z);
            this.animateToCenterAtMouseCoords();
        }
    }

    animateToCenterAtMouseCoords()
    {
        this.animateScrollTo(this.mousePatchX, this.mousePatchY * (this._viewResX / this._viewResY));
    }

    _onCanvasWheel(event)
    {
        if (this.glPatch.mouseState.buttonMiddle) return;
        this.setMousePos(event.offsetX, event.offsetY);

        let delta = 5;

        // auto detect - it's crap
        // if (!this._touchpadMode)
        //     if (event.deltaX && event.deltaX > 1)
        //     {
        //         this._touchpadMode = true;
        //         console.log("touchpad mode!");
        //     }

        if (event.deltaY < 0)delta *= -1;

        if (!this._touchpadMode)
        {
            if (event.altKey) this._scrollY -= delta;
            else if (event.shiftKey) this.scrollTo(this._scrollX - delta, this._scrollY);

            this.wheelZoom(delta);
        }
        else
        {
            this.scrollTo(
                this._scrollX - event.deltaX * 4.0,
                this._scrollY - event.deltaY * 4.0);
        }


        this.setMousePos(this._mouseX, this._mouseY);

        if (this._touchpadMode && event.metaKey) this.wheelZoom(delta);

        gui.on("themeChanged", () =>
        {
            // this._opsBoundingRect.setColor(gui.theme.colors_patch.opBoundsRect);
        });
    }

    wheelZoom(delta)
    {
        if (window.gui.getRestriction() < Gui.RESTRICT_MODE_FOLLOWER) return;

        if (delta == 0) return;

        const wheelMultiplier = (userSettings.get("wheelmultiplier") || 1) * 1.5;

        if (delta < 0) delta = 1.0 - 0.2 * wheelMultiplier;
        else delta = 1 + 0.2 * wheelMultiplier;

        const mouse = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        const newZoom = this._zoom * delta;

        const x = this._scrollX + mouse[0];
        const y = this._scrollY + mouse[1];


        const oldZoom = this._zoom;
        this._zoom = newZoom;

        const mouseAfterZoom = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        const animate = true;
        if (animate)
        {
            this._zoom = oldZoom;
            const dur = 0.5;
            this.animateZoom(newZoom, dur);
            this.animateScrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1],
                dur,
                true);
        }
        else
        {
            this.scrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1],
                true);
        }

        gui.patchView.emitEvent("viewBoxChange");
    }

    get zoom() { return this._zoom; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom()
    {
        return (-this._scrollX) / this._zoom;
    }

    get scrollYZoom()
    {
        return (this._scrollY) / this._zoom;
    }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    get mousePatchX() { return this._mousePatchX; }

    get mousePatchY() { return this._mousePatchY; }

    update()
    {
        const time = this.glPatch.time;
        if (!this._animZoom.isFinished(time)) this._zoom = this._animZoom.getValue(time);
        this._scrollX = this._animScrollX.getValue(time);
        this._scrollY = this._animScrollY.getValue(time);

        if (this._zoom != this._zoom) this._zoom = 400;

        this.setMousePos(this._mouseX, this._mouseY);
    }

    animateZoom(z, dur)
    {
        dur = dur || 0.25;

        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + dur, z);
    }

    animateScrollTo(x, y, dur, userInteraction)
    {
        let p = this._eleTabs.getBoundingClientRect().left / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        if (userInteraction)p = 0;
        if (p != p)p = 0;

        dur = dur || 0.2;

        this._animScrollX.clear(this.glPatch.time);
        this._animScrollX.setValue(this.glPatch.time + dur, x - p);
        this._animScrollY.clear(this.glPatch.time);
        this._animScrollY.setValue(this.glPatch.time + dur, y);
    }

    scrollTo(x, y, userInteraction)
    {
        // let p = this._eleTabs.getBoundingClientRect().left / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        // if (userInteraction)p = 0;
        // if (p != p)p = 0;

        this._animScrollX.clear();
        this._animScrollY.clear();

        this._animScrollX.setValue(this.glPatch.time, x);
        this._animScrollY.setValue(this.glPatch.time, y);

        gui.patchView.emitEvent("viewBoxChange");
    }

    centerSelectedOps(noAnim)
    {
        let ops = gui.patchView.getSelectedOps();
        if (ops.length == 0) ops = gui.corePatch().ops;

        if (ops.length == 0)
        {
            // no ops in patch at all
            this._zoom = 400;
            this.scrollTo(0, 0);
            return;
        }

        const bb = new CABLES.CG.BoundingBox();
        const subp = this.glPatch.getCurrentSubPatch();

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch != subp) continue;

            if (ops[i].uiAttribs.translate && !ops[i].uiAttribs.hidden)
            {
                // console.log(ops[i].uiAttribs.translate.x, ops[i].uiAttribs.translate.y);
                bb.applyPos(
                    ops[i].uiAttribs.translate.x,
                    ops[i].uiAttribs.translate.y,
                    0);

                if (this.glPatch.getGlOp(ops[i]))
                    bb.applyPos(
                        ops[i].uiAttribs.translate.x + this.glPatch.getGlOp(ops[i]).w,
                        ops[i].uiAttribs.translate.y + this.glPatch.getGlOp(ops[i]).h,
                        0);
            }
        }

        bb.calcCenterSize();
        const padding = 1.05;

        bb.size[0] = Math.max(bb.size[0], 250);
        bb.size[1] = Math.max(bb.size[1], 250);

        bb.size[0] *= padding;
        bb.size[1] *= padding;

        const zx = bb.size[0] / 2; // zoom on x
        const zy = (bb.size[1]) / 2 * (this._viewResX / this._viewResY);
        let z = Math.max(400, Math.max(zy, zx));
        if (z > 99999)z = 400;

        if (noAnim) this._zoom = z;
        else this.animateZoom(z);

        let cy = bb.center[1] * (this._viewResX / this._viewResY);

        if (cy != cy) cy = 0;


        gui.patchView.getSubPatchBounds();
        this.animateScrollTo(bb.center[0], cy);
    }

    patchToScreenConv(_x, _y)
    {
        let x = _x;
        let y = _y;

        const asp = this._viewResY / this._viewResX;
        const zx = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = zx;

        x /= zx;
        y /= zy;

        return [x, y];
    }

    patchToScreenCoords(_x, _y)
    {
        let x = _x;
        let y = _y;

        const asp = this._viewResY / this._viewResX;
        const zx = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = zx;

        x -= this._scrollX;
        y -= this._scrollY * asp;

        x /= zx;
        y /= zy;

        x += (this._viewResX / 2);
        y += (this._viewResY / 2);

        return [x, y];
    }

    screenToPatchCoord(x, y, aspect)
    {
        if (this._scrollY != this._scrollY) this._scrollY = 0;
        const zx = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = zx;
        if (aspect)zy = 1 / (this._viewResY / 2 / this.zoom);
        const asp = this._viewResY / this._viewResX;

        if (this._scrollX != this._scrollX) this._scrollX = 0;

        const mouseAbsX = (x - (this._viewResX / 2)) * zx - (this.scrollX);
        const mouseAbsY = (y - (this._viewResY / 2)) * zy + (this.scrollY * asp);

        if (mouseAbsY != mouseAbsY) this.centerSelectedOps(true);

        return [mouseAbsX, mouseAbsY];
    }

    serialize(dataui)
    {
        this._storeCurrentSubPatch();

        dataui.viewBoxesGl = this._subPatchViewBoxes;
    }

    deSerialize(dataui)
    {
        dataui = dataui || {};
        if (!dataui.viewBoxesGl)
        {
            this.centerSelectedOps();
            this._storeCurrentSubPatch();
        }
        else this._subPatchViewBoxes = dataui.viewBoxesGl;
        this._restoreSubPatch(this._currentSubPatchId);
    }

    _storeCurrentSubPatch()
    {
        const o = { "x": this._scrollX, "y": this._scrollY, "z": this._zoom };
        this._subPatchViewBoxes[this._currentSubPatchId] = o;
    }

    _restoreSubPatch(sub)
    {
        this._currentSubPatchId = sub;

        if (this._subPatchViewBoxes[sub])
        {
            this.scrollTo(this._subPatchViewBoxes[sub].x, this._subPatchViewBoxes[sub].y);
            this._zoom = this._subPatchViewBoxes[sub].z;
        }
        else
        {
            this._storeCurrentSubPatch();
            this.centerSelectedOps(true);
        }
    }

    animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain, next)
    {
        this._storeCurrentSubPatch();

        const zoomFactor = 0.1;

        dur = 0.25;

        // this._animZoom.clear();
        // this._animZoom.defaultEasing = CABLES.EASING_LINEAR;
        // this._animZoom.setValue(this.glPatch.time, this._zoom);
        // this._animZoom.setValue(this.glPatch.time + timeGrey, this._zoom - (this._zoom * zoomFactor));

        // this._animZoom.defaultEasing = this._defaultEasing;
        this._restoreSubPatch(sub);

        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom + (this._zoom * zoomFactor));
        this._animZoom.setValue(this.glPatch.time + dur, this._zoom);

        if (next)next();
    }

    zoomStep(s)
    {
        let z = this._zoom + 200 * s;
        z = Math.max(50, z);
        this.animateZoom(z);
    }
}
