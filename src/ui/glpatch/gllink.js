import GlUiConfig from "./gluiconfig";
import GlCable from "./glcable";
import Logger from "../utils/logger";
import MouseState from "./mousestate";
import OpsMathInterpolate
    from "../../../../cables/src/ops/base/Ops.Math.Interpolate/Ops.Math.Interpolate.json";
import userSettings from "../components/usersettings";
import defaultOps from "../defaultops";

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
        this._debugColor = true;// userSettings.get("devinfos");

        this._glPatch = glpatch;
        this._type = type;
        this._portNameInput = portNameIn;
        this._portNameOutput = portNameOut;
        this._opIdInput = opIdInput;
        this._opIdOutput = opIdOutput;
        this._portIdInput = portIdInput;
        this._portIdOutput = portIdOutput;
        this._subPatch = subpatch;
        this._cableSub = null;

        this._buttonDown = MouseState.BUTTON_NONE;
        this._buttonDownTime = 0;
        this.crossSubpatch = false;

        this._buttonRect = this._glPatch.rectDrawer.createRect({});
        // this._buttonRect.colorHoverMultiply = 1.0;
        this._buttonRect.setShape(1);


        this._buttonRect.on("mouseup", (e) =>
        {
            this._glPatch.startLinkButtonDrag = null;

            if (this._glPatch.isDraggingPort())
            {
                if (this._glPatch._portDragLine.isActive)
                {
                    const fromOp = gui.corePatch().getOpById(this._glPatch._portDragLine._startPortOpId);
                    const fromPort = fromOp.getPort(this._glPatch._portDragLine._startPortName);

                    let otherPort = link.portOut;

                    if (!otherPort || !fromPort)
                    {
                        this._log.warn("port not found");
                        return;
                    }

                    if (fromPort.type == otherPort.type)
                    {
                        if (fromPort.direction != link.portIn.direction)otherPort = link.portIn;

                        this._link.remove();
                        this._glPatch._portDragLine.stop();

                        gui.corePatch().link(
                            fromOp, this._glPatch._portDragLine._startPortName, otherPort.op, otherPort.name);

                        return;
                    }
                }
                return;
            }

            const pressTime = performance.now() - this._buttonDownTime;

            if (
                this._buttonDown == this._glPatch.mouseState.buttonForRemoveLink &&
                this._mouseDownX - e.offsetX == 0 &&
                this._mouseDownY - e.offsetY == 0 &&
                pressTime < GlUiConfig.clickMaxDuration)
            {
                this._glPatch.patchAPI.removeLink(this._opIdInput, this._opIdOutput, this._portIdInput, this._portIdOutput);
                // console
            }




            if (
                this._buttonDown == this._glPatch.mouseState.buttonForLinkInsertOp && pressTime < GlUiConfig.clickMaxDuration)
            {
                const opIn = this._glOpIn.op;// || gui.corePatch().getOpById(this._opIdInput);


                const pIn = opIn.getPortById(this._portIdInput);
                const opOut = this._glOpOut || gui.corePatch().getOpById(this._opIdOutput);
                const pOut = this._glOpOut.op.getPortById(this._portIdOutput);
                if (!pOut) return;
                const llink = pOut.getLinkTo(pIn);


                gui.opSelect().show(
                    {
                        "x": 0,
                        "y": 0,
                        "onOpAdd": (op) =>
                        {
                            const distOut = Math.sqrt((opOut.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX) ** 2 + (opOut.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY) ** 2);
                            const distIn = Math.sqrt((opIn.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX) ** 2 + (opIn.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY) ** 2);

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
            if (this._glPatch.mouseState.buttonStateForLinkDrag && userSettings.get("patch_allowCableDrag"))
            {
                this._glPatch.startLinkButtonDrag = this;
                this._startDragEvent = e;
            }

            this._mouseDownX = e.offsetX;
            this._mouseDownY = e.offsetY;

            this._buttonDown = e.buttons;
            this._buttonDownTime = performance.now();
        });

        this._initSubCables();

        this._glOpIn = null;
        this._glOpOut = null;

        this._offsetXInput = 0;
        this._offsetXOutput = 0;

        this._glPatch.addLink(this);
        this.updateVisible();
        this.update();
    }

    get hovering()
    {
        if (this._cableSub && this._cableSub.hovering) return true;
        return this._cable.hovering;
    }

    get type() { return this._type; }

    get link() { return this._link; }

    get opIn() { return this._glOpIn; }

    get opOut() { return this._glOpOut; }

    get id() { return this._id; }

    get nameInput() { return this._portNameInput; }

    get nameOutput() { return this._portNameOutput; }

    get opIdOutput() { return this._opIdOutput; }

    get opIdInput() { return this._opIdInput; }

    get portIdIn() { return this._portIdInput; }

    get portIdOut() { return this._portIdOutput; }

    get subPatch() { return this._subPatch; }

    startDragging(e)
    {
        if (this._glPatch.spacePressed || this._glPatch.linkStartedDragging) return;

        this._glPatch.linkStartedDragging = true;

        CABLES.UI.hideToolTip();
        const
            opIn = gui.corePatch().getOpById(this._opIdInput),
            opOut = gui.corePatch().getOpById(this._opIdOutput);

        if (!opIn || !opOut)
        {
            console.log("[gllink] no in/out op");
            return;
        }

        const
            pIn = opIn.getPortById(this._portIdInput),
            pOut = opOut.getPortById(this._portIdOutput);

        const distOut = Math.sqrt((opOut.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX) ** 2 + (opOut.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY) ** 2);
        const distIn = Math.sqrt((opIn.uiAttribs.translate.x - this._glPatch.viewBox.mousePatchX) ** 2 + (opIn.uiAttribs.translate.y - this._glPatch.viewBox.mousePatchY) ** 2);

        if (distIn < distOut)
        {
            const glop = this._glPatch.getGlOp(opOut);
            const glport = glop.getGlPort(pOut.name);
            this._glPatch.emitEvent("mouseDragLink", glport, opOut.id, pOut.name, this._startDragEvent);
        }
        else
        {
            const glop = this._glPatch.getGlOp(opIn);
            const glport = glop.getGlPort(pIn.name);
            this._glPatch.emitEvent("mouseDragLink", glport, opIn.id, pIn.name, this._startDragEvent);
        }

        if (!e.altKey)
            pIn.removeLinkTo(pOut);
    }

    _initSubCables()
    {
        if (this._cable) this._cable = this._cable.dispose();
        if (this._cableSub) this._cableSub = this._cableSub.dispose();

        this._cable = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);
        this._glPatch.setDrawableColorByType(this._cable, this._type);

        const op1 = gui.corePatch().getOpById(this._opIdInput);
        const op2 = gui.corePatch().getOpById(this._opIdOutput);

        if (!op1 || !op1.uiAttribs || !op2 || !op2.uiAttribs) return;
        this.crossSubpatch = op1.uiAttribs.subPatch != op2.uiAttribs.subPatch;

        if (op1.uiAttribs.subPatch != this._subPatch) this._cableSub = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(op1.uiAttribs.subPatch), this._buttonRect, this._type, this, op1.uiAttribs.subPatch);
        if (op2.uiAttribs.subPatch != this._subPatch) this._cableSub = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(op2.uiAttribs.subPatch), this._buttonRect, this._type, this, op2.uiAttribs.subPatch);

        if (this._cableSub) this._glPatch.setDrawableColorByType(this._cableSub, this._type);

        if (this.crossSubpatch)
        {
            const subpatchop = gui.patchView.getSubPatchOuterOp(op1.uiAttribs.subPatch) || gui.patchView.getSubPatchOuterOp(op2.uiAttribs.subPatch);

            if (subpatchop && subpatchop.uiAttribs && subpatchop.uiAttribs.subPatchOp)
            {
                const opIn = gui.corePatch().getOpById(this._opIdInput);
                const pIn = opIn.getPortById(this._portIdInput);
                const opOut = gui.corePatch().getOpById(this._opIdOutput);
                const pOut = opOut.getPortById(this._portIdOutput);

                // if (opOut.uiAttribs.subPatch != this._subPatch)
                // {
                //     pIn.setUiAttribs({ "expose": true });
                // }

                // if (opIn.uiAttribs.subPatch != this._subPatch)
                // {
                //     pOut.setUiAttribs({ "expose": true });
                // }
            }
            // this._subPatch
        }
    }

    updateLineStyle()
    {
        this._cable.dispose();
        this._cable = new GlCable(this._glPatch, this._glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);

        this._glPatch.setDrawableColorByType(this._cable, this._type);
        this.update();
    }

    isInCurrentSubPatch()
    {
        const sub = this._glPatch.getCurrentSubPatch();
        if (this._cable.subPatch == sub || this._cableSub.subPatch == sub) return true;

        return false;
    }

    updateVisible()
    {
        const sub = this._glPatch.getCurrentSubPatch();



        if (!this._glOpIn || !this._glOpOut)
        {
            return;
        }

        if (
            (
                this._glOpIn.uiAttribs.subPatch != this._cable.subPatch &&
                this._glOpOut.uiAttribs.subPatch != this._cable.subPatch
            )
            ||
            (
                this._cableSub &&
                this._glOpIn.uiAttribs.subPatch != this._cableSub.subPatch &&
                this._glOpOut.uiAttribs.subPatch != this._cableSub.subPatch
            )
        )
        { // redo everything when ops were moved into another subpatch
            this._subPatch = this._glOpIn.uiAttribs.subPatch;
            this._initSubCables();
        }

        // if (this._cable.subPatch == sub) this._cable.visible = true;
        // if (this._cableSub && this._cableSub.subPatch == sub) this._cableSub.visible = true;


        if (this._cable) this._cable.updateVisible();
        if (this._cableSub) this._cableSub.updateVisible();

        // this._cable.visible =
        // this._visible = (this._cable.subPatch == sub || (this._cableSub && this._cableSub.subPatch == sub));
        this._updatePosition();
    }

    set visible(v)
    {
        // debugger;
        this.updateVisible();
    }

    _updatePosition()
    {
        if (this._visible)
        {
            if (!this.crossSubpatch)
            {
                if (!this._glOpOut) this.update();

                if (this._cable && this._glOpOut && this._glOpIn && this._glOpIn.getUiAttribs().translate && this._glOpOut.getUiAttribs().translate)
                {
                    const pos1x = this._glOpIn.getUiAttribs().translate.x + this._offsetXInput;
                    const pos1y = this._glOpIn.getUiAttribs().translate.y;

                    const pos2x = this._glOpOut.getUiAttribs().translate.x + this._offsetXOutput;
                    const pos2y = this._glOpOut.getUiAttribs().translate.y + this._glOpOut.h;

                    this._cable.setPosition(pos1x, pos1y, pos2x, pos2y);
                }
            }
            else
            {
                if (!this._subPatchOp && this._glOpIn && this._glOpOut)
                {
                    const a = gui.patchView.getSubPatchOuterOp(this._glOpIn.op.uiAttribs.subPatch);
                    const b = gui.patchView.getSubPatchOuterOp(this._glOpOut.op.uiAttribs.subPatch);

                    this._subPatchOp = a || b;
                    if (a && b)
                        if (a.uiAttribs.subPatch == b.patchId.get()) this._subPatchOp = a;
                        else this._subPatchOp = b;

                    // this._glSubPatchOp = this._glPatch.getOp(this._subPatchOp.id);

                    if (this._subPatchOp) this._subPatchOp.on("move", () => { this.update(); });
                }

                if (!this._subPatchInputOp && this._cable)
                {
                    this._subPatchInputOp = gui.corePatch().getSubPatchOp(this._cable.subPatch, defaultOps.subPatchInput2);
                    // this._glSubPatchInputOp = this._glPatch.getOp(this._subPatchInputOp.id);
                    if (this._subPatchInputOp) this._subPatchInputOp.on("move", () => { this.update(); });
                }

                if (!this._subPatchOutputOp)
                {
                    this._subPatchOutputOp = gui.corePatch().getSubPatchOp(this._glOpOut.op.uiAttribs.subPatch, defaultOps.subPatchOutput2);
                    // this._glSubPatchOutputOp = this._glPatch.getOp(this._subPatchOutputOp.id);
                    if (this._subPatchOutputOp) this._subPatchOutputOp.on("move", () => { this.update(); });
                }

                if (!this._glOpIn || !this._glOpOut) this.update();


                let foundCableSub = false;
                let foundCable = false;

                // inner input port op to subpatch-input op
                if (
                    this._cable &&
                    this._subPatchInputOp &&
                    this._glOpIn.uiAttribs.subPatch == this._cable.subPatch)
                {
                    if (!this._glOpIn.getUiAttribs().translate) return;
                    if (this._debugColor) this._cable.setColor(1, 0, 1, 1);

                    foundCable = true;
                    this._cable.setPosition(
                        this._glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this._glOpIn.getUiAttribs().translate.y,
                        this._subPatchInputOp.uiAttribs.translate.x + this._subPatchInputOp.getPortPosX(this._portNameInput, this._subPatchInputOp.id),
                        this._subPatchInputOp.uiAttribs.translate.y + 30,
                    );
                }

                // inner output port op to subpatch output op
                else if (
                    this._cableSub &&
                    this._subPatchOutputOp &&
                    this._glOpOut.uiAttribs.subPatch == this._subPatchOutputOp.uiAttribs.subPatch)
                {
                    if (!this._glOpOut.getUiAttribs().translate) return;
                    if (this._debugColor) this._cableSub.setColor(0, 0, 1, 1);

                    foundCableSub = true;
                    this._cableSub.setPosition(
                        this._subPatchOutputOp.uiAttribs.translate.x,
                        this._subPatchOutputOp.uiAttribs.translate.y,
                        this._glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this._glOpOut.getUiAttribs().translate.y + 30,
                    );
                }

                // ----------------------
                //
                //
                //
                //
                //
                // outer output port op TO subpatch op
                if (this._cableSub &&
                    this._glOpOut &&
                    this._subPatchOp &&
                    this._glOpOut.getUiAttribs().translate &&
                    this._glOpOut.op.uiAttribs.subPatch == this._subPatchOp.uiAttribs.subPatch)
                {
                    if (!this._glOpOut.getUiAttribs().translate) return;
                    if (!this._subPatchOp.uiAttribs.translate) return;

                    if (this._debugColor) this._cableSub.setColor(0, 1, 0, 1); // green

                    foundCableSub = true;
                    this._cableSub.setPosition(
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameInput, this._subPatchOp.id),
                        this._subPatchOp.uiAttribs.translate.y,
                        this._glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this._glOpOut.getUiAttribs().translate.y + 30,
                    );
                }


                else

                // outer input port op FROM subpatch op
                if (
                    this._cable &&
                    this._subPatchOp &&
                    this._glOpIn.getUiAttribs().translate &&
                    this._subPatchOp.uiAttribs.translate &&
                    this._glOpIn.op.uiAttribs.subPatch == this._subPatchOp.uiAttribs.subPatch
                )
                {
                    if (this._debugColor) this._cable.setColor(1, 0, 0, 1); // red
                    foundCable = true;
                    this._cable.setPosition(
                        this._glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this._glOpIn.getUiAttribs().translate.y,
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameOutput, this._subPatchOp.id),
                        this._subPatchOp.uiAttribs.translate.y + 30,
                    );
                }
                // else

                if (!foundCable &&
                    this._cable &&
                    this._subPatchOp &&
                    this._glOpIn.getUiAttribs() &&
                    this._glOpIn.getUiAttribs().translate &&
                    this._subPatchOp.uiAttribs.translate)
                {
                    if (this._debugColor) this._cable.setColor(0, 0, 0, 1);
                    this._cable.setPosition(
                        this._glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this._glOpIn.getUiAttribs().translate.y,
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameOutput, this._subPatchOp.id),
                        this._subPatchOp.uiAttribs.translate.y + 30,
                    );
                }

                if (!foundCableSub && this._cableSub && this._subPatchOutputOp)
                {
                    if (this._debugColor) this._cableSub.setColor(1, 0.5, 0.4, 1);
                    this._cableSub.setPosition(
                        this._subPatchOutputOp.uiAttribs.translate.x + this._subPatchOutputOp.getPortPosX(this._portNameOutput, this._subPatchOutputOp.id),
                        this._subPatchOutputOp.uiAttribs.translate.y,

                        this._glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this._glOpOut.getUiAttribs().translate.y + 30,
                    );
                }
            }
        }
    }


    update()
    {
        if (!this._glOpIn)
        {
            this._glOpIn = this._glPatch.getOp(this._opIdInput);
            if (this._glOpIn)
            {
                this._glOpIn.addLink(this);
            }
        }

        if (!this._glOpOut)
        {
            this._glOpOut = this._glPatch.getOp(this._opIdOutput);
            if (this._glOpOut)
            {
                this._glOpOut.addLink(this);
            }
        }

        if (!this._glOpIn || !this._glOpOut)
        {
            this._log.warn("unknown ops...", this._opIdInput, this._opIdOutput, this._glOpIn, this._glOpOut);
            return;
        }

        this._offsetXInput = this._glOpIn.getPortPos(this._portNameInput);
        this._offsetXOutput = this._glOpOut.getPortPos(this._portNameOutput);

        if (!this.addedOrderListeners)
        {
            this.addedOrderListeners = true;
            if (this._glOpIn) this._glOpIn.op.on("glportOrderChanged", () =>
            {
                // console.log("glport order changed!@!!");
                this.update();
            });
            if (this._glOpOut) this._glOpOut._op.on("glportOrderChanged", () =>
            {
                // console.log("glport order changed!@!!");
                this.update();
            });

            if (this._subPatchOp) this._subPatchOp.on("glportOrderChanged", () =>
            {
                console.log("this._subPatchOp --- glport order changed!@!!");
                this.update();
            });

            if (this._subPatchInputOp) this._subPatchInputOp.on("glportOrderChanged", () =>
            {
                // console.log("glport order changed!@!!");
                this.update();
            });

            if (this._subPatchOutputOp) this._subPatchOutputOp.on("glportOrderChanged", () =>
            {
                // console.log("glport order changed!@!!");
                this.update();
            });
        }

        this._glOpIn.updateVisible();
        this._glOpOut.updateVisible();
        this._updatePosition();
    }

    unlink()
    {
        this._link.remove();
        // if (this._glOpOut) this._glOpOut.removeLink(this._id);
        // if (this._glOpIn) this._glOpIn.removeLink(this._id);
    }

    dispose()
    {
        if (this._glOpOut) this._glOpOut.removeLink(this._id);
        if (this._glOpIn) this._glOpIn.removeLink(this._id);

        if (this._cable) this._cable = this._cable.dispose();
        if (this._cableSub) this._cableSub = this._cableSub.dispose();

        if (this._buttonRect) this._buttonRect = this._buttonRect.dispose();
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
        if (this._activity == act) return;
        this._activity = act;

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
        if (this._cableSub)
        {
            this._cableSub.setText(r);
            this._cableSub.setSpeed(act);
        }
    }

    highlight(b)
    {
        if (this._oldHighlight !== b)
        {
            this._cable.updateColor();
            if (this._cableSub) this._cableSub.updateColor();
            // if (this._cableSub) this._glPatch.setDrawableColorByType(this._cableSub, this._type, b ? 1 : 0);
            this._oldHighlight = b;
        }
    }

    collideLine(x1, y1, x2, y2)
    {
        return this._cable.collideLine(x1, y1, x2, y2) || this._cableSub?.collideLine(x1, y1, x2, y2);
    }

    updateTheme()
    {
        this.highlight(false);
    }

    isAOpSelected()
    {
        if (this._glOpOut && this._glOpOut.selected) return true;
        if (this._glOpIn && this._glOpIn.selected) return true;
        return false;
    }

    isAPortHovering()
    {
        const perf = CABLES.UI.uiProfiler.start("[gllink] cableHoverChangeisAPortHoveringd");

        if (this._glOpOut)
        {
            let port = this._glOpOut.op.getPortById(this._portIdOutput);
            let glport = this._glOpOut.getGlPort(port.name);
            if (glport && glport.hovering) return true;
        }

        if (this._glOpIn)
        {
            let port = this._glOpIn.op.getPortById(this._portIdInput);
            let glport = this._glOpIn.getGlPort(port.name);

            if (glport && glport.hovering) return true;
        }

        perf.finish();
        return false;
    }

    updateColor()
    {
        this._cable.updateColor();
        if (this._cableSub) this._cableSub.updateColor();
    }

    cableHoverChanged()
    {
        const perf = CABLES.UI.uiProfiler.start("[gllink] cableHoverChanged");

        if (this._glOpOut)
        {
            // console.log("cableHoverChanged", this._glOpOut);
            // let glop = this._glPatch.getGlOp(this._glOpOut);
            let port = this._glOpOut.op.getPortById(this._portIdOutput);
            let glport = this._glOpOut.getGlPort(port.name);

            if (glport)glport._updateColor();
            // else console.log("no glport");
        }

        if (this._glOpIn)
        {
            let port = this._glOpIn.op.getPortById(this._portIdInput);
            let glport = this._glOpIn.getGlPort(port.name);

            if (glport)glport._updateColor();
            // else console.log("no glport");
        }


        perf.finish();

        // const glopIn = this._glPatch.getGlOp(this._glOpIn);
        // glport = glopIn.getGlPort(pIn.name);
    }
}
