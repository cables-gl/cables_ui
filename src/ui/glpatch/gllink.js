import GlUiConfig from "./gluiconfig";
import GlCable from "./glcable";
import Logger from "../utils/logger";
import MouseState from "./mousestate";
import OpsMathInterpolate
    from "../../../../cables/src/ops/base/Ops.Math.Interpolate/Ops.Math.Interpolate.json";

export default class GlLink
{
    constructor(glpatch,
        link, id, opIdInput, opIdOutput,
        portNameIn,
        portNameOut, portIdInput, portIdOutput, type, visible = true, subpatch)
    {
        this._log = new Logger("gllink");
        this._id = id;
        this._link = link;
        this._visible = visible;
        this._cable = null;

        this._glPatch = glpatch;
        this._type = type;
        this._portNameInput = portNameIn;
        this._portNameOutput = portNameOut;
        this._opIdInput = opIdInput;
        this._opIdOutput = opIdOutput;
        this._portIdInput = portIdInput;
        this._portIdOutput = portIdOutput;
        this._subPatch = subpatch;

        this._buttonDown = MouseState.BUTTON_NONE;
        this._buttonDownTime = 0;

        this._buttonRect = this._glPatch.rectDrawer.createRect({});
        this._buttonRect.colorHoverMultiply = 1.0;
        this._buttonRect.setShape(1);
        this._buttonRect.setColorHover(1, 0, 0, 1);

        this._buttonRect.on("mouseup", (e) =>
        {
            if (this._glPatch.isDraggingPort())
            {
                if (this._glPatch._portDragLine.isActive)
                {
                    const fromOp = gui.corePatch().getOpById(this._glPatch._portDragLine._startPortOpId);
                    const fromPort = fromOp.getPort(this._glPatch._portDragLine._startPortName);

                    let otherPort = link.portOut;
                    if (fromPort.direction != link.portIn.direction)otherPort = link.portIn;

                    this._link.remove();
                    this._glPatch._portDragLine.stop();

                    gui.corePatch().link(
                        fromOp, this._glPatch._portDragLine._startPortName,
                        otherPort.parent, otherPort.name);

                    return;
                }

                return;
            }


            const pressTime = performance.now() - this._buttonDownTime;

            if (
                this._buttonDown == MouseState.BUTTON_RIGHT &&
                this._mouseDownX - e.offsetX == 0 &&
                this._mouseDownY - e.offsetY == 0 &&
                pressTime < GlUiConfig.clickMaxDuration)
            {
                this._glPatch.patchAPI.removeLink(this._opIdInput, this._opIdOutput, this._portIdInput, this._portIdOutput);
            }


            // if (this._cable.isHoveredButtonRect() && gui.patchView.getSelectedOps().length == 1)
            if (gui.patchView.getSelectedOps().length == 1)
            {
                for (const i in this._glPatch.selectedGlOps)
                {
                    if (this._glPatch.selectedGlOps[i].isHovering()) // && this._glPatch.selectedGlOps[i].isDragging
                    {
                        const coord = this._glPatch.screenToPatchCoord(e.offsetX, e.offsetY);
                        gui.patchView.insertOpInLink(this._link, this._glPatch.selectedGlOps[i].op, gui.patchView.snapOpPosX(coord[0]), gui.patchView.snapOpPosY(coord[1]));
                        return;
                    }
                }
            }

            if (this._buttonDown == MouseState.BUTTON_LEFT && pressTime < GlUiConfig.clickMaxDuration)
            {
                const opIn = gui.corePatch().getOpById(this._opIdInput);
                const pIn = opIn.getPortById(this._portIdInput);
                const opOut = gui.corePatch().getOpById(this._opIdOutput);
                const pOut = opOut.getPortById(this._portIdOutput);
                if (!pOut) return;
                const llink = pOut.getLinkTo(pIn);

                this._log.log("llink", llink);

                gui.opSelect().show(
                    {
                        "x": 0,
                        "y": 0,
                        "onOpAdd": (op) =>
                        {
                            const distOut = Math.sqrt(Math.pow(opOut.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX, 2) + Math.pow(opOut.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY, 2));
                            const distIn = Math.sqrt(Math.pow(opIn.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX, 2) + Math.pow(opIn.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY, 2));

                            let x = opOut.uiAttribs.translate.x;
                            if (distIn < distOut)x = opIn.uiAttribs.translate.x;

                            op.setUiAttrib({ "subPatch": this._glPatch.subPatch,
                                "translate": {
                                    "x": gui.patchView.snapOpPosX(x),
                                    "y": gui.patchView.snapOpPosY(this._glPatch.viewBox.mousePatchY)
                                } });
                        } }, null, null, llink);
            }

            this._buttonDown = MouseState.BUTTON_NONE;
        });

        this._buttonRect.on("mousedown", (e) =>
        {
            if (e.buttons == MouseState.BUTTON_RIGHT && e.altKey)
            {
                const
                    opIn = gui.corePatch().getOpById(this._opIdInput),
                    pIn = opIn.getPortById(this._portIdInput),
                    opOut = gui.corePatch().getOpById(this._opIdOutput),
                    pOut = opOut.getPortById(this._portIdOutput);

                const distOut = Math.sqrt(Math.pow(opOut.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX, 2) + Math.pow(opOut.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY, 2));
                const distIn = Math.sqrt(Math.pow(opIn.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX, 2) + Math.pow(opIn.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY, 2));

                if (distIn < distOut)
                {
                    const glop = this._glPatch.getGlOp(opOut);
                    const glport = glop.getGlPort(pOut.name);
                    this._glPatch.emitEvent("mouseDragLink", glport, opOut.id, pOut.name, e);
                }
                else
                {
                    const glop = this._glPatch.getGlOp(opIn);
                    const glport = glop.getGlPort(pIn.name);
                    this._glPatch.emitEvent("mouseDragLink", glport, opIn.id, pIn.name, e);
                }

                if (e.shiftKey) pIn.removeLinkTo(pOut);

                return;
            }

            this._mouseDownX = e.offsetX;
            this._mouseDownY = e.offsetY;

            this._buttonDown = e.buttons;
            this._buttonDownTime = performance.now();
        });

        this._cable = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);
        this._cableSub = null;
        this._glPatch.setDrawableColorByType(this._cable, this._type);


        const op1 = gui.corePatch().getOpById(this._opIdInput);
        const op2 = gui.corePatch().getOpById(this._opIdOutput);

        if (op1.uiAttribs.subPatch != this._subPatch) this._cableSub = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(op1.uiAttribs.subPatch), this._buttonRect, this._type, this, op1.uiAttribs.subPatch);
        if (op2.uiAttribs.subPatch != this._subPatch) this._cableSub = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(op2.uiAttribs.subPatch), this._buttonRect, this._type, this, op2.uiAttribs.subPatch);

        if (this._cableSub) this._glPatch.setDrawableColorByType(this._cableSub, this._type);

        this._opIn = null;
        this._opOut = null;

        this._offsetXInput = 0;
        this._offsetXOutput = 0;

        this._glPatch.addLink(this);
        this.update();
    }

    get link() { return this._link; }

    get opIn() { return this._opIn; }

    get opOut() { return this._opOut; }

    get id() { return this._id; }

    get nameInput() { return this._portNameInput; }

    get nameOutput() { return this._portNameOutput; }

    get opIdOutput() { return this._opIdOutput; }

    get opIdInput() { return this._opIdInput; }

    get portIdIn() { return this._portIdInput; }

    get portIdOut() { return this._portIdOutput; }

    get subPatch() { return this._subPatch; }

    updateLineStyle()
    {
        this._cable.dispose();
        this._cable = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);

        this._glPatch.setDrawableColorByType(this._cable, this._type);
        this.update();
    }


    updateVisible()
    {
    }

    set visible(v)
    {
        v = true;
        this._cable.visible = v;
        if (this._cableSub) this._cableSub.visible = true;
        this._visible = v;
        this._updatePosition();
    }

    _updatePosition()
    {
        if (this._visible)
        {
            if (!this._cableSub)
            {
                if (!this._opOut) this.update();

                if (this._opOut && this._opIn && this._opIn.getUiAttribs().translate && this._opOut.getUiAttribs().translate)
                {
                    const pos1x = this._opIn.getUiAttribs().translate.x + this._offsetXInput;
                    const pos1y = this._opIn.getUiAttribs().translate.y;

                    const pos2x = this._opOut.getUiAttribs().translate.x + this._offsetXOutput;
                    const pos2y = this._opOut.getUiAttribs().translate.y + this._opOut.h;

                    this._cable.setPosition(pos1x, pos1y, pos2x, pos2y);
                }
            }
            else
            {
                if (!this._subPatchOp)
                    this._subPatchOp = gui.patchView.getSubPatchOuterOp(this._cable.subPatch);

                if (!this._subPatchInputOp)
                    this._subPatchInputOp = gui.corePatch().getSubPatchOp(this._cable.subPatch, "Ops.Ui.PatchInput");

                // inner input port op to subpatch-input op
                if (this._opIn &&
                    this._subPatchInputOp &&
                    this._opIn.uiAttribs.subPatch == this._cable.subPatch)
                    this._cable.setPosition(
                        this._opIn.getUiAttribs().translate.x + this._offsetXInput,
                        this._opIn.getUiAttribs().translate.y,
                        this._subPatchInputOp.uiAttribs.translate.x,
                        this._subPatchInputOp.uiAttribs.translate.y,
                    );


                // outer output port op to subpatch op
                if (this._opOut &&
                    this._subPatchOp &&
                    this._opOut.uiAttribs.subPatch != this._cable.subPatch)
                    this._cableSub.setPosition(
                        this._subPatchOp.uiAttribs.translate.x,
                        this._subPatchOp.uiAttribs.translate.y,
                        this._opOut.getUiAttribs().translate.x,
                        this._opOut.getUiAttribs().translate.y,
                    );
            }
        }
    }


    update()
    {
        if (!this._opIn)
        {
            this._opIn = this._glPatch.getOp(this._opIdInput);
            if (this._opIn)
            {
                this._opIn.addLink(this);
                this._offsetXInput = this._opIn.getPortPos(this._portIdInput);
            }
        }

        if (!this._opOut)
        {
            this._opOut = this._glPatch.getOp(this._opIdOutput);
            if (this._opOut)
            {
                this._opOut.addLink(this);
                this._offsetXOutput = this._opOut.getPortPos(this._portIdOutput);
            }
        }

        if (!this._opIn || !this._opOut)
        {
            this._log.warn("unknown ops...", this._opIdInput, this._opIdOutput, this._opIn, this._opOut);
            return;
        }

        this._opIn.updateVisible();
        this._opOut.updateVisible();

        this._updatePosition();
    }

    dispose()
    {
        if (this._opOut) this._opOut.removeLink(this._id);
        if (this._opIn) this._opIn.removeLink(this._id);

        if (this._cable) this._cable.dispose();
        this._cable = null;

        if (this._buttonRect) this._buttonRect.dispose();
        this._buttonRect = null;
    }

    _singleValueToString(v)
    {
        let r = null;
        if (typeof v == "number") r = String(Math.round(v * 1000) / 1000);
        else if (typeof v == "string") r = "\"" + v + "\"";
        return r;
    }

    setFlowModeActivity(act, v)
    {
        let r = "";
        if (typeof v == "number") r = this._singleValueToString(v);// v = Math.round(v * 1000) / 1000;
        else if (typeof v == "string") r = this._singleValueToString(v);// v = "\"" + v + "\"";
        else if (Array.isArray(v))
        {
            r = "[";

            for (let i = 0; i < Math.min(v.length, 3); i++)
            {
                r += this._singleValueToString(v[i]);
                r += ", ";
            }

            if (v.length > 3)r += "...";
            r += "]";
            r += " (" + v.length + ")";
        }

        if (r.length > 10) r = r.substr(0, 43) + "...";

        this._cable.setText(r);
        this._cable.setSpeed(act);
    }

    highlight(b)
    {
        this._glPatch.setDrawableColorByType(this._cable, this._type, b ? 2 : 0);
        if (this._cableSub) this._glPatch.setDrawableColorByType(this._cableSub, this._type, b ? 2 : 0);
    }
}
