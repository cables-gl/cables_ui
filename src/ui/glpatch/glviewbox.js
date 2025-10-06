import { vec2 } from "gl-matrix";
import { BoundingBox, CG } from "cables-corelibs";
import { Anim } from "cables";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import GlUiConfig from "./gluiconfig.js";
import Gui, { gui } from "../gui.js";
import { hideToolTip } from "../elements/tooltips.js";
import { userSettings } from "../components/usersettings.js";
import GlPatch from "./glpatch.js";

/**
 * Viewbox of current patch
 *
 */
export default class GlViewBox
{

    /**
     * @param {CglContext} cgl
     * @param {GlPatch} glPatch
     */
    constructor(cgl, glPatch)
    {
        this._cgl = cgl;
        this.glPatch = glPatch;

        this.mousePatchNotPredicted = vec2.create();
        this._lastPosPixel = vec2.create();
        this._mouseSmooth = [];
        this._mouseSmoothCount = 0;
        this._subPatchViewBoxes = {};

        /** @type {number|string} */
        this._currentSubPatchId = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this._mousePatchX = this._mousePatchY = 0;
        this.cursor = null;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._viewResX = 0;
        this._viewResY = 0;
        this._panStarted = 0;
        this.wheelMode = userSettings.get("patch_wheelmode");
        // this._opsBoundingRect = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = GlUiConfig.zoomDefault;
        this._spaceDown = false;
        this._outOfBounds = false;

        this._defaultEasing = Anim.EASING_EXPO_OUT;
        console.log("Anim.EASING_EXPO_OUT", Anim.EASING_EXPO_OUT);

        this._animScrollX = new Anim({ "defaultEasing": this._defaultEasing });
        this._animScrollY = new Anim({ "defaultEasing": this._defaultEasing });
        this._animZoom = new Anim({ "defaultEasing": this._defaultEasing });

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

        // this._eleTabs = document.getElementById("splitterMaintabs");

        // this._drawBoundingRect = userSettings.get("glpatch_showboundings");

        userSettings.on("change", (which, _v) =>
        {
            this.wheelMode = userSettings.get("patch_wheelmode");
        });
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h)
    {
        const first = (this._viewResX === 0 && this._viewResY === 0);
        this._viewResX = w;
        this._viewResY = h;

        if (first) this.setMousePos(this._cgl.canvasWidth / 2, this._cgl.canvasHeight / 2);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
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

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseEnter(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    /**
     * @param {MouseEvent} e
     */
    _onCanvasMouseLeave(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    /**
     * @param {MouseEvent} _e
     */
    _onCanvasSpaceUp(_e)
    {
        this._spaceDown = false;
    }

    /**
     * @param {MouseEvent} _e
     */
    _onCanvasSpaceDown(_e)
    {
        if (this._spaceDown) return;
        this._spaceDown = true;
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this._mouseRightDownStartX = this._mouseX;
        this._mouseRightDownStartY = this._mouseY;
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseDown(e)
    {
        this._onCanvasMouseMove(e);
        if (this.glPatch.mouseState.buttonStateForScrolling || this.glPatch.spacePressed || this.glPatch.mouseState.numFingers)
        {
            this._oldScrollX = this._scrollX;
            this._oldScrollY = this._scrollY;
            this._mouseRightDownStartX = e.offsetX;
            this._mouseRightDownStartY = e.offsetY;
        }
    }

    /**
     * @param {PointerEvent} e
     */
    _onCanvasMouseMove(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);

        this._lastPosPixel[0] = e.offsetX;
        this._lastPosPixel[1] = e.offsetY;

        if (gui.getRestriction() < Gui.RESTRICT_MODE_EXPLORER) return;

        if (
            (this.glPatch.mouseState.buttonStateForScrolling) ||
            ((this.glPatch.spacePressed || this.glPatch.mouseState.numFingers == 2) && (this.glPatch.mouseState.buttonLeft || this.glPatch.mouseState.buttonRight || this.glPatch.mouseState.buttonStateForScrolling)))
        {
            this.cursor = "grabbing";
            hideToolTip();
            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.5 / this._cgl.pixelDensity;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.5 / this._cgl.pixelDensity;

            this.scrollTo(
                this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX,
                this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY,
                true);
        }
    }

    /**
     * @param {PointerEvent} _e
     */
    _onCanvasMouseUp(_e)
    {
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this.cursor = null;
    }

    // _onCanvasDblClick(e)
    // {
    //     const z = GlUiConfig.zoomDefault;
    //     if (Math.abs(this._zoom - GlUiConfig.zoomDefault) < 200)
    //     {
    //         this.glPatch.unselectAll();
    //         this.centerSelectedOps();
    //     }
    //     else
    //     {
    //         this.animateZoom(z);
    //         this.animateToCenterAtMouseCoords();
    //     }
    // }

    animateToCenterAtMouseCoords()
    {
        this.animateToCenterAt(this.mousePatchX, this.mousePatchY);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    animateToCenterAt(x, y)
    {
        this.animateScrollTo(x, y * (this._viewResX / this._viewResY), 0);
    }

    /**
     * @param {WheelEvent} event
     */
    _onCanvasWheel(event)
    {
        if (this.glPatch.mouseState.buttonMiddle) return;
        this.setMousePos(event.offsetX, event.offsetY);

        let delta = 5;

        if (event.deltaY < 0)delta *= -1;

        let doPan = this.wheelMode == "pan";
        let doZoom = this.wheelMode == "zoom";

        if (this.wheelMode == "auto")
        {
            if (performance.now() - this._panStarted < 500 || Math.abs(event.deltaX) > 0)
            {
                this._panStarted = performance.now();
                doPan = true;
            }
            else doZoom = true;
        }

        if (doPan)
        {
            let speed = parseFloat(userSettings.get("patch_panspeed")) || 0.25;

            this.scrollTo(
                this._scrollX - event.deltaX * speed,
                this._scrollY - event.deltaY * speed);
        }

        if (doZoom)
        {
            if (event.altKey) this._scrollY -= delta;
            else if (event.shiftKey) this.scrollTo(this._scrollX - delta, this._scrollY);

            this.wheelZoom(delta);
        }

        this.setMousePos(this._mouseX, this._mouseY);

        gui.on("themeChanged", () =>
        {
            // this._opsBoundingRect.setColor(gui.theme.colors_patch.opBoundsRect);
        });
    }

    /**
     * @param {number} delta
     */
    wheelZoom(delta)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FOLLOWER) return;

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

    get scrollXZoom() { return (-this._scrollX) / this._zoom; }

    get scrollYZoom() { return (this._scrollY) / this._zoom; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    get mousePatchX() { return this._mousePatchX; }

    get mousePatchY() { return this._mousePatchY; }

    get width() { return this._cgl.canvasWidth; }

    get height() { return this._cgl.canvasHeight; }

    update()
    {
        const time = this.glPatch.time;
        if (!this._animZoom.isFinished(time)) this._zoom = this._animZoom.getValue(time);
        this._scrollX = this._animScrollX.getValue(time);
        this._scrollY = this._animScrollY.getValue(time);

        if (this._zoom != this._zoom) this._zoom = 400;

        this.setMousePos(this._mouseX, this._mouseY);
    }

    /**
     * @param {number} z
     * @param {number} [dur]
     */
    animateZoom(z, dur)
    {
        dur = dur || 0.25;

        if (isNaN(z)) return console.error("zoom is nan");
        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + dur, z);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [dur]
     * @param {boolean} [_userInteraction]
     */
    animateScrollTo(x, y, dur, _userInteraction)
    {
        // let p = this._eleTabs.getBoundingClientRect().left / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        let ox = (gui.editorWidth) * 0.5 / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        ox -= (gui.rightPanelWidth) * 0.5 / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);

        let oy = (gui.bottomTabPanel.height) / this._viewResY * this._animZoom.getValue(this.glPatch.time + 10);

        if (_userInteraction)ox = 0;
        if (ox != ox)ox = 0;

        if (_userInteraction || !gui.bottomTabPanel.isVisible())oy = 0;
        if (oy != oy)oy = 0;

        dur = dur || 0.2;

        this._animScrollX.clear(this.glPatch.time);
        this._animScrollX.setValue(this.glPatch.time + dur, x - ox);
        this._animScrollY.clear(this.glPatch.time);
        this._animScrollY.setValue(this.glPatch.time + dur, y + oy);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} [_userInteraction]
     */
    scrollTo(x, y, _userInteraction)
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

    /**
     * @param {boolean} [noAnim]
     */
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
        if (this._viewResX == 0 || this._viewResY == 0) return;

        const bb = new BoundingBox();
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

        // gui.patchView.getSubPatchBounds();
        this.animateScrollTo(bb.center[0], cy);
    }

    /**
     * @param {any} _x
     * @param {any} _y
     */
    patchToScreenConv(_x, _y)
    {
        let x = _x;
        let y = _y;

        // const asp = this._viewResY / this._viewResX;
        const zx = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = zx;

        x /= zx;
        y /= zy;

        return [x, y];
    }

    /**
     * @param {number} _x
     * @param {number} _y
     */
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

    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} [aspect]
     */
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

        if (isNaN(mouseAbsY)) this.centerSelectedOps(true);

        return [mouseAbsX, mouseAbsY];
    }

    serialize(dataui)
    {
        this.storeCurrentSubPatch();

        dataui.viewBoxesGl = this._subPatchViewBoxes;
    }

    deSerialize(dataui)
    {
        dataui = dataui || {};
        if (!dataui.viewBoxesGl)
        {
            this.centerSelectedOps();
            this.storeCurrentSubPatch();
        }
        else this._subPatchViewBoxes = dataui.viewBoxesGl;
        this._restoreSubPatch(this._currentSubPatchId);
    }

    storeCurrentSubPatch()
    {
        const o = { "x": this._scrollX, "y": this._scrollY, "z": this._zoom };
        this._subPatchViewBoxes[this._currentSubPatchId] = o;
    }

    /**
     * @param {number|string} sub
     */
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
            this.storeCurrentSubPatch();
            this.centerSelectedOps(true);
        }
    }

    /**
     * @param {number} dur
     * @param {string | number} sub
     * @param {number} [_timeGrey]
     * @param {number} [_timeVisibleAgain]
     * @param {Function} [next]
     */
    animSwitchSubPatch(dur, sub, _timeGrey, _timeVisibleAgain, next)
    {
        this.storeCurrentSubPatch();

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

    /**
     * @param {number} s
     */
    zoomStep(s)
    {
        let z = this._zoom + 200 * s;
        z = Math.max(50, z);
        this.animateZoom(z);
    }

    /**
     * @param {number} d
     */
    keyScrollX(d)
    {
        this.animateScrollTo(
            this._scrollX + d * 100,
            this._scrollY,
            0.15,
            true);
    }

    /**
     * @param {number} d
     */
    keyScrollY(d)
    {
        this.animateScrollTo(
            this._scrollX,
            this._scrollY + d * 100,
            0.15,
            true);
    }

    startResize()
    {

        this._oldCenterx = this._scrollX;
        this._oldCentery = this._scrollY;
        // const mouse = this.screenToPatchCoord(this.width / 2, this.height / 2, true);
        this._oldCenterW = this.width;

        console.log("scroll", this._oldCenterx, this._oldCentery);
        // this._oldCenterx = mouse[0];
        // this._oldCentery = mouse[1];
        // console.log("center", mouse, this._zoom);
    }

    endResize()
    {

        // this._oldCenterx = this.scrollX;
        // this._oldCentery = this.scrollY;

    }
}
