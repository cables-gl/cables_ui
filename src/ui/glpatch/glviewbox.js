CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.ViewBox = class
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
        this._boundingRect = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;

        this._defaultEasing = CABLES.EASING_EXPO_OUT;

        this._animScrollX = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });
        this._animScrollY = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });
        this._animZoom = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });

        cgl.canvas.addEventListener("mouseenter", this._onCanvasMouseEnter.bind(this));
        cgl.canvas.addEventListener("mouseleave", this._onCanvasMouseLeave.bind(this));
        cgl.canvas.addEventListener("mousedown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("mousemove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("mouseup", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this));
        // this.glPatch.on("dblclick", this._onCanvasDblClick.bind(this));

        cgl.canvas.addEventListener("touchmove", this._onCanvasTouchMove.bind(this));

        this._eleTabs = document.getElementById("splitterMaintabs");
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
        // const frames = 3;
        // let dx = (x - this._lastPosPixel[0]);
        // const dy = (y - this._lastPosPixel[1]);


        // this._mouseSmoothCount = this._mouseSmoothCount++ % frames;

        // this._mouseSmooth[this._mouseSmoothCount++] = dx;
        // dx = 0;
        // for (let i = 0; i < frames; i++)
        // {
        //     dx += this._mouseSmooth[i];
        //     this._mouseSmooth[i] *= 0.33333;
        // }

        // dx /= frames;
        // // console.log(dx);
        // dx *= Math.abs(dx * 0.333);

        const dx = 0;
        const dy = 0;
        // console.log(dx);

        // dx *= dx;
        // console.log(this._mouseSmooth);

        // console.log(this._lastPosPixel, dx, dy);

        const coord = this.screenToPatchCoord(x + dx, y + dy);
        this.mousePatchNotPredicted = this.screenToPatchCoord(x, y);

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

    _onCanvasMouseDown(e)
    {
        if (this.glPatch.mouseState.buttonRight || this.glPatch.spacePressed || this.glPatch.mouseState.numFingers)
        {
            this._oldScrollX = this._scrollX;
            this._oldScrollY = this._scrollY;
            this._mouseRightDownStartX = e.offsetX;
            this._mouseRightDownStartY = e.offsetY;
        }
    }

    _onCanvasTouchMove(e)
    {
        console.log(e);
        console.log(e.touches.length);
    }

    _onCanvasMouseMove(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
        this._lastPosPixel[0] = e.offsetX;
        this._lastPosPixel[1] = e.offsetY;

        if ((this.glPatch.mouseState.buttonRight || ((this.glPatch.spacePressed || this.glPatch.mouseState.numFingers == 2) && this.glPatch.mouseState.buttonLeft)) && this.glPatch.allowDragging)
        {
            this.glPatch.setCursor(CABLES.GLGUI.CURSOR_HAND);

            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.5 / this._cgl.pixelDensity;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.5 / this._cgl.pixelDensity;

            this._scrollX = this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX;
            this._scrollY = this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY;
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
        const z = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        if (Math.abs(this._zoom - CABLES.GLGUI.VISUALCONFIG.zoomDefault) < 200)
        {
            this.glPatch.unselectAll();
            this.center();
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
        this.setMousePos(event.offsetX, event.offsetY);

        let delta = 5;
        if (event.deltaY < 0)delta *= -1;

        if (event.altKey) this._scrollY -= delta;
        else if (event.shiftKey) this._scrollX -= delta;

        this.wheelZoom(delta);
        this.setMousePos(this._mouseX, this._mouseY);
    }

    wheelZoom(delta)
    {
        if (delta == 0) return;

        const wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

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
            const dur = 0.3;
            this.animateZoom(newZoom, dur);
            this.animateScrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1], dur);
        }
        else
        {
            this.scrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1]);
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

    get scrollYZoom() { return this._scrollY / this._zoom; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    get mousePatchX() { return this._mousePatchX; }

    get mousePatchY() { return this._mousePatchY; }

    update()
    {
        const time = this.glPatch.time;
        if (!this._animZoom.isFinished(time)) this._zoom = this._animZoom.getValue(time);
        if (!this._animScrollX.isFinished(time)) this._scrollX = this._animScrollX.getValue(time);
        if (!this._animScrollY.isFinished(time)) this._scrollY = this._animScrollY.getValue(time);


        if (this._zoom != this._zoom)
        {
            this._zoom = 400;
        }


        this.setMousePos(this._mouseX, this._mouseY);

        if (!this._boundingRect)
        {
            this._boundingRect = this.glPatch.rectDrawer.createRect();
            this._boundingRect.interactive = false;
            this._boundingRect.setPosition(-500, -500, 1);
            this._boundingRect.setSize(1000, 1000);
            this._boundingRect.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opBoundsRect);
        }


        const bounds = this.glPatch.rectDrawer.bounds;
        this._boundingRect.visible = bounds.changed;
        this._boundingRect.setPosition(bounds.minX, bounds.minY, 0.999);
        this._boundingRect.setSize(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    animateZoom(z, dur)
    {
        dur = dur || 0.25;
        // console.log(this.glPatch.time, this._zoom, z);
        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + dur, z);
    }

    animateScrollTo(x, y, dur)
    {
        const p = this._eleTabs.getBoundingClientRect().left / 4;

        dur = dur || 0.25;

        this._animScrollX.clear();
        this._animScrollX.setValue(this.glPatch.time, this._scrollX);
        this._animScrollX.setValue(this.glPatch.time + dur, x - p);

        this._animScrollY.clear();
        this._animScrollY.setValue(this.glPatch.time, this._scrollY);
        this._animScrollY.setValue(this.glPatch.time + dur, y);
    }

    scrollTo(x, y)
    {
        const p = this._eleTabs.getBoundingClientRect().left / 4;

        this._scrollX = x;
        this._scrollY = y;

        gui.patchView.emitEvent("viewBoxChange");
    }

    center(noAnim)
    {
        let ops = gui.patchView.getSelectedOps();
        if (ops.length == 0)ops = gui.corePatch().ops;
        if (ops.length == 0)
        {
            this._zoom = 400;
            this._scrollX = 0;
            this._scrollY = 0;
            return;
        }

        const bb = new CGL.BoundingBox();
        const subp = this.glPatch.getCurrentSubPatch();

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch != subp) continue;

            bb.applyPos(
                ops[i].uiAttribs.translate.x,
                ops[i].uiAttribs.translate.y,
                0);

            bb.applyPos(
                ops[i].uiAttribs.translate.x + this.glPatch.getGlOp(ops[i]).w,
                ops[i].uiAttribs.translate.y + this.glPatch.getGlOp(ops[i]).h,
                0);
        }

        bb.calcCenterSize();
        const padding = 1.05;
        // console.log("bb size", bb.size[0], bb.size[1]);

        bb.size[0] = Math.max(bb.size[0], 200);
        bb.size[1] = Math.max(bb.size[1], 200);

        bb.size[0] *= padding;
        bb.size[1] *= padding;


        const zx = bb.size[0] / 2; // zoom on x
        const zy = (bb.size[1]) / 2 * (this._viewResX / this._viewResY);
        let z = Math.max(400, Math.max(zy, zx));
        if (z > 99999)z = 400;

        if (noAnim) this._zoom = z;
        else this.animateZoom(z);

        const cy = bb.center[1] * (this._viewResX / this._viewResY);

        // this.scrollTo(bb.center[0], cy);


        this.animateScrollTo(bb.center[0], cy);


        // if (glop.x + glop.w >= x && // glop. right edge past r2 left
        //     glop.x <= x2 && // glop. left edge past r2 right
        //     glop.y + glop.h >= y && // glop. top edge past r2 bottom
        //     glop.y <= y2) // r1 bottom edge past r2 top


        // this._boundingRect2.setPosition(
        //     bb.center[0] - (bb.size[0] / 2),
        //     bb.center[1] - (bb.size[1] / 2),
        //     0.1);
        // this._boundingRect2.setSize(bb.size[0], bb.size[1]);
        // this._boundingRect2.setDecoration(4);
    }


    screenToPatchCoord(x, y, aspect)
    {
        if (this._scrollY != this._scrollY) this._scrollY = 0;
        const z = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = z;
        if (aspect)zy = 1 / (this._viewResY / 2 / this.zoom);
        const asp = this._viewResY / this._viewResX;

        if (this._scrollX != this._scrollX) this._scrollX = 0;

        const mouseAbsX = (x - (this._viewResX / 2)) * z - (this.scrollX);
        const mouseAbsY = (y - (this._viewResY / 2)) * zy + (this.scrollY * asp);

        if (mouseAbsY != mouseAbsY) this.center(true);

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
            this.center();
            this._storeCurrentSubPatch();
        }
        else this._subPatchViewBoxes = dataui.viewBoxesGl;
        this._restoreSubPatch(this._currentSubPatchId);
    }

    _storeCurrentSubPatch()
    {
        this._subPatchViewBoxes[this._currentSubPatchId] = { "x": this._scrollX, "y": this._scrollY, "z": this._zoom };
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
            this.center(true);
        }
    }

    animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain)
    {
        this._storeCurrentSubPatch();

        const zoomFactor = 0.03;
        const _timeVisibleagain = this.glPatch.time + timeVisibleAgain + dur * 2;

        this._animZoom.clear();
        this._animZoom.defaultEasing = CABLES.EASING_LINEAR;
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + timeGrey, this._zoom - (this._zoom * zoomFactor));

        setTimeout(
            () =>
            {
                this._animZoom.defaultEasing = this._defaultEasing;
                this._restoreSubPatch(sub);

                this._animZoom.clear();
                this._animZoom.setValue(this.glPatch.time, this._zoom + (this._zoom * zoomFactor));
                this._animZoom.setValue(this.glPatch.time + timeVisibleAgain + dur * 5, this._zoom);
            }, timeGrey * 1000 + 10);
    }
};
