import { Logger } from "cables-shared-client";
import { Link, Op } from "cables";
import GlCable from "./glcable.js";
import MouseState from "./mousestate.js";
import defaultOps from "../defaultops.js";
import Snap from "./snap.js";
import gluiconfig from "./gluiconfig.js";
import { hideToolTip } from "../elements/tooltips.js";
import { gui } from "../gui.js";
import { userSettings } from "../components/usersettings.js";
import GlPatch from "./glpatch.js";
import GlRect from "../gldraw/glrect.js";
import GlOp from "./glop.js";
import { UiOp } from "../core_extend_op.js";

/**
 * drawing gl links {@link GlCable}
 *
 * @export
 * @class GlLink
 */
export default class GlLink
{

    #log = new Logger("gllink");

    /** @type {GlOp} */
    #glOpIn = null;

    /** @type {GlOp} */
    #glOpOut = null;

    _offsetXInput = 0;
    _offsetXOutput = 0;

    /** @type {GlCable} */
    #cableSub;

    /** @type {GlCable} */
    #cable;
    #visible;

    /** @type {Link} */
    #link;

    /** @type {GlPatch} */
    #glPatch;

    /**
     *
     * @param {GlPatch} glpatch
     * @param {Link} link
     * @param {string} id
     * @param {string} opIdInput
     * @param {string} opIdOutput
     * @param {string} portNameIn
     * @param {string} portNameOut
     * @param {string} portIdInput
     * @param {string} portIdOutput
     * @param {number} type
     * @param {boolean} visible
     * @param {string|number} subpatch
     */
    constructor(glpatch,
        link, id, opIdInput, opIdOutput,
        portNameIn,
        portNameOut, portIdInput, portIdOutput, type, visible = true, subpatch = 0)
    {
        this._id = id;

        this.#link = link;
        this.#visible = visible;

        /** @type {GlCable} */
        this.#cable = null;
        this._debugColor = true;

        this.#glPatch = glpatch;
        this._type = type;
        this._portNameInput = portNameIn;
        this._portNameOutput = portNameOut;
        this._opIdInput = opIdInput;
        this._opIdOutput = opIdOutput;
        this._portIdInput = portIdInput;
        this._portIdOutput = portIdOutput;
        this._subPatch = subpatch;

        /** @type {GlCable} */
        this.#cableSub = null;

        this._buttonDown = MouseState.BUTTON_NONE;
        this._buttonDownTime = 0;
        this.crossSubpatch = false;

        /** @type {GlRect} */
        this._buttonRect = this.#glPatch.rectDrawer.createRect({ "name": "buttonrect", "interactive": true });
        this._buttonRect.setShape(1);

        this._buttonRect.on("mouseup", (e) =>
        {
            this.#glPatch.startLinkButtonDrag = null;

            if (this.#glPatch.isDraggingPort())
            {
                if (this.#glPatch.portDragLine.isActive)
                {

                    const fromOp = gui.corePatch().getOpById(this.#glPatch.portDragLine._startPortOpId);

                    if (!fromOp) return;
                    const fromPort = fromOp.getPortById(this.#glPatch.portDragLine._startPortId);

                    let otherPort = link.portOut;

                    if (!otherPort || !fromPort)
                    {
                        this.#log.warn("port not found", otherPort, fromPort, this.#glPatch.portDragLine);
                        return;
                    }

                    if (fromPort.type == otherPort.type)
                    {
                        if (fromPort.direction != link.portIn.direction) otherPort = link.portIn;

                        this.#link.remove();
                        this.#glPatch.portDragLine.stop();

                        gui.corePatch().link(
                            fromOp, fromPort.name, otherPort.op, otherPort.name);

                        return;
                    }
                }
                return;
            }

            const pressTime = performance.now() - this._buttonDownTime;

            if (
                this._buttonDown == this.#glPatch.mouseState.buttonForRemoveLink &&
                this._mouseDownX - e.offsetX == 0 &&
                this._mouseDownY - e.offsetY == 0 &&
                pressTime < gluiconfig.clickMaxDuration)
            {
                this.#glPatch.patchAPI.removeLink(this._opIdInput, this._opIdOutput, this._portIdInput, this._portIdOutput);
            }

            if (
                this._buttonDown == this.#glPatch.mouseState.buttonForLinkInsertOp && pressTime < gluiconfig.clickMaxDuration)
            {
                const opIn = this.#glOpIn.op;// || gui.corePatch().getOpById(this._opIdInput);

                const pIn = opIn.getPortById(this._portIdInput);
                const opOut = this.#glOpOut || gui.corePatch().getOpById(this._opIdOutput);
                const pOut = this.#glOpOut.op.getPortById(this._portIdOutput);
                if (!pOut) return;
                const llink = pOut.getLinkTo(pIn);

                gui.opSelect().show(
                    {
                        "x": 0,
                        "y": 0,
                        "onOpAdd": (op) =>
                        {
                            const distOut = Math.sqrt((opOut.uiAttribs.translate.x - this.#glPatch.viewBox.mousePatchX) ** 2 + (opOut.uiAttribs.translate.y - this.#glPatch.viewBox.mousePatchY) ** 2);
                            const distIn = Math.sqrt((opIn.uiAttribs.translate.x - this.#glPatch.viewBox.mousePatchX) ** 2 + (opIn.uiAttribs.translate.y - this.#glPatch.viewBox.mousePatchY) ** 2);

                            let x = opOut.uiAttribs.translate.x;
                            let y = this.#glPatch.viewBox.mousePatchY;
                            if (distIn < distOut)x = opIn.uiAttribs.translate.x;

                            if (userSettings.get("snapToGrid2"))
                            {
                                x = Snap.snapOpPosX(x);
                                y = Snap.snapOpPosY(y);
                            }

                            op.setUiAttrib(
                                {
                                    "subPatch": this.#glPatch.subPatch,
                                    "translate": {
                                        "x": x,
                                        "y": y
                                    } });
                        } }, null, null, llink);
            }

            this._buttonDown = MouseState.BUTTON_NONE;
        });

        this._buttonRect.on("mousedown", (e) =>
        {
            if (this.#glPatch.mouseState.buttonStateForLinkDrag && userSettings.get("patch_allowCableDrag"))
            {
                this.#glPatch.startLinkButtonDrag = this;
                this._startDragEvent = e;
            }

            this._mouseDownX = e.offsetX;
            this._mouseDownY = e.offsetY;

            this._buttonDown = e.buttons;
            this._buttonDownTime = performance.now();
        });

        this._initSubCables();
        this.#glPatch.addLink(this);
        this.updateVisible();
        this.update();
    }

    get hovering()
    {
        if (this.#cableSub && this.#cableSub.hovering) return true;
        return this.#cable.hovering;
    }

    get type() { return this._type; }

    get link() { return this.#link; }

    get opIn() { return this.#glOpIn; }

    get opOut() { return this.#glOpOut; }

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
        if (this.#glPatch.spacePressed || this.#glPatch.linkStartedDragging) return;

        this.#glPatch.linkStartedDragging = true;

        hideToolTip();
        const
            opIn = gui.corePatch().getOpById(this._opIdInput),
            opOut = gui.corePatch().getOpById(this._opIdOutput);

        if (!opIn || !opOut)
        {
            this.#log.log("[gllink] no in/out op");
            return;
        }

        const
            pIn = opIn.getPortById(this._portIdInput),
            pOut = opOut.getPortById(this._portIdOutput);

        const distOut = Math.sqrt((opOut.uiAttribs.translate.x - this.#glPatch.viewBox.mousePatchX) ** 2 + (opOut.uiAttribs.translate.y - this.#glPatch.viewBox.mousePatchY) ** 2);
        const distIn = Math.sqrt((opIn.uiAttribs.translate.x - this.#glPatch.viewBox.mousePatchX) ** 2 + (opIn.uiAttribs.translate.y - this.#glPatch.viewBox.mousePatchY) ** 2);

        if (distIn < distOut)
        {
            const glop = this.#glPatch.getGlOp(opOut);
            const glport = glop.getGlPort(pOut.name);
            this.#glPatch.emitEvent("mouseDragLink", glport, opOut.id, pOut.name, this._startDragEvent);
        }
        else
        {
            const glop = this.#glPatch.getGlOp(opIn);
            const glport = glop.getGlPort(pIn.name);
            this.#glPatch.emitEvent("mouseDragLink", glport, opIn.id, pIn.name, this._startDragEvent);
        }

        if (!e.altKey)
            pIn.removeLinkTo(pOut);
    }

    _initSubCables()
    {
        if (this.#cable) this.#cable = this.#cable.dispose();
        if (this.#cableSub) this.#cableSub = this.#cableSub.dispose();

        this.#cable = new GlCable(this.#glPatch, this.#glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);
        this.#glPatch.setDrawableColorByType(this.#cable, this._type);

        /** @type {UiOp} */
        const op1 = gui.corePatch().getOpById(this._opIdInput);
        const op2 = gui.corePatch().getOpById(this._opIdOutput);

        if (!op1 || !op1.uiAttribs || !op2 || !op2.uiAttribs) return;
        this.crossSubpatch = op1.uiAttribs.subPatch != op2.uiAttribs.subPatch;

        if (op1.uiAttribs.subPatch != this._subPatch) this.#cableSub = new GlCable(this.#glPatch, this.#glPatch.getSplineDrawer(op1.uiAttribs.subPatch), this._buttonRect, this._type, this, op1.uiAttribs.subPatch);
        if (op2.uiAttribs.subPatch != this._subPatch) this.#cableSub = new GlCable(this.#glPatch, this.#glPatch.getSplineDrawer(op2.uiAttribs.subPatch), this._buttonRect, this._type, this, op2.uiAttribs.subPatch);

        if (this.#cableSub) this.#glPatch.setDrawableColorByType(this.#cableSub, this._type);

        if (this.crossSubpatch)
        {
            const subpatchop = gui.patchView.getSubPatchOuterOp(op1.uiAttribs.subPatch) || gui.patchView.getSubPatchOuterOp(op2.uiAttribs.subPatch);

            if (subpatchop && subpatchop.uiAttribs && subpatchop.uiAttribs.subPatchOp)
            {
                // const opIn = gui.corePatch().getOpById(this._opIdInput);
                // const pIn = opIn.getPortById(this._portIdInput);
                // const opOut = gui.corePatch().getOpById(this._opIdOutput);
                // const pOut = opOut.getPortById(this._portIdOutput);

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
        this.#cable.dispose();
        this.#cable = new GlCable(this.#glPatch, this.#glPatch.getSplineDrawer(this._subPatch), this._buttonRect, this._type, this, this._subPatch);

        this.#glPatch.setDrawableColorByType(this.#cable, this._type);
        this.update();
    }

    isInCurrentSubPatch()
    {
        const sub = this.#glPatch.getCurrentSubPatch();
        if (this.#cable.subPatch == sub || this.#cableSub.subPatch == sub) return true;

        return false;
    }

    updateVisible()
    {
        // const sub = this._glPatch.getCurrentSubPatch();

        if (!this.#glOpIn || !this.#glOpOut)
        {
            return;
        }

        if (
            (
                this.#glOpIn.uiAttribs.subPatch != this.#cable.subPatch &&
                this.#glOpOut.uiAttribs.subPatch != this.#cable.subPatch
            )
            ||
            (
                this.#cableSub &&
                this.#glOpIn.uiAttribs.subPatch != this.#cableSub.subPatch &&
                this.#glOpOut.uiAttribs.subPatch != this.#cableSub.subPatch
            )
        )
        { // redo everything when ops were moved into another subpatch
            this._subPatch = this.#glOpIn.uiAttribs.subPatch;
            this._initSubCables();
        }

        // if (this._cable.subPatch == sub) this._cable.visible = true;
        // if (this._cableSub && this._cableSub.subPatch == sub) this._cableSub.visible = true;

        if (this.#cable) this.#cable.updateVisible();
        if (this.#cableSub) this.#cableSub.updateVisible();

        // this._cable.visible =
        // this._visible = (this._cable.subPatch == sub || (this._cableSub && this._cableSub.subPatch == sub));
        this._updatePosition();
    }

    /**
     * @param {boolean} _v
     */
    set visible(_v)
    {
        // debugger;
        this.updateVisible();
    }

    _updatePosition()
    {
        if (this.#visible)
        {
            if (!this.crossSubpatch)
            {
                if (!this.#glOpOut) this.update();

                if (this.#cable && this.#glOpOut && this.#glOpIn && this.#glOpIn.getUiAttribs().translate && this.#glOpOut.getUiAttribs().translate)
                {
                    let topy = this.#glOpIn.getUiAttribs().translate.y;
                    let boty = this.#glOpOut.getUiAttribs().translate.y + this.#glOpOut.h;

                    if (this.#glOpIn.displayType === this.#glOpIn.DISPLAY_REROUTE_DOT) topy += this.#glOpIn.h / 2;
                    if (this.#glOpOut.displayType === this.#glOpOut.DISPLAY_REROUTE_DOT) boty -= this.#glOpOut.h / 2;

                    const pos1x = this.#glOpIn.getUiAttribs().translate.x + this._offsetXInput;
                    const pos1y = topy;

                    const pos2x = this.#glOpOut.getUiAttribs().translate.x + this._offsetXOutput;
                    const pos2y = boty;

                    this.#cable.setPosition(pos1x, pos1y, pos2x, pos2y);
                }
            }
            else
            {
                if (!this._subPatchOp && this.#glOpIn && this.#glOpOut)
                {
                    const a = gui.patchView.getSubPatchOuterOp(this.#glOpIn.op.uiAttribs.subPatch);
                    const b = gui.patchView.getSubPatchOuterOp(this.#glOpOut.op.uiAttribs.subPatch);

                    this._subPatchOp = a || b;
                    if (a && b)
                        if (a.uiAttribs.subPatch == b.patchId.get()) this._subPatchOp = a;
                        else this._subPatchOp = b;

                    // this._glSubPatchOp = this._glPatch.getOp(this._subPatchOp.id);

                    if (this._subPatchOp) this._subPatchOp.on("move", () => { this.update(); });
                }

                if (!this._subPatchInputOp && this.#cable)
                {
                    this._subPatchInputOp = gui.corePatch().getFirstSubPatchOpByName(this.#cable.subPatch, defaultOps.subPatchInput2);
                    // this._glSubPatchInputOp = this._glPatch.getOp(this._subPatchInputOp.id);
                    if (this._subPatchInputOp) this._subPatchInputOp.on("move", () => { this.update(); });
                }

                if (!this._subPatchOutputOp && this.#glOpOut && this.#glOpOut.op)
                {
                    this._subPatchOutputOp = gui.corePatch().getFirstSubPatchOpByName(this.#glOpOut.op.uiAttribs.subPatch, defaultOps.subPatchOutput2);
                    // this._glSubPatchOutputOp = this._glPatch.getOp(this._subPatchOutputOp.id);
                    if (this._subPatchOutputOp) this._subPatchOutputOp.on("move", () => { this.update(); });
                }

                if (!this.#glOpIn || !this.#glOpOut) this.update();

                let foundCableSub = false;
                let foundCable = false;

                // inner input port op to subpatch-input op
                if (
                    this.#cable &&
                    this._subPatchInputOp &&
                    this.#glOpIn.uiAttribs.subPatch == this.#cable.subPatch)
                {
                    if (!this.#glOpIn.getUiAttribs().translate) return;

                    foundCable = true;
                    this.#cable.setPosition(
                        this.#glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this.#glOpIn.getUiAttribs().translate.y,
                        this._subPatchInputOp.uiAttribs.translate.x + this._subPatchInputOp.getPortPosX(this._portNameInput, this._subPatchInputOp.id, true),
                        this._subPatchInputOp.uiAttribs.translate.y + 30,
                    );
                }

                // inner output port op to subpatch output op
                else if (
                    this.#cableSub &&
                    this._subPatchOutputOp &&
                    this.#glOpOut.uiAttribs.subPatch == this._subPatchOutputOp.uiAttribs.subPatch)
                {
                    if (!this.#glOpOut.getUiAttribs().translate) return;
                    if (this._debugColor) this.#cableSub.setColor(0, 0, 1, 1);

                    foundCableSub = true;
                    this.#cableSub.setPosition(
                        this._subPatchOutputOp.uiAttribs.translate.x,
                        this._subPatchOutputOp.uiAttribs.translate.y,
                        this.#glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this.#glOpOut.getUiAttribs().translate.y + 30,
                    );
                }

                // ----------------------
                //
                //
                //
                //
                //
                // outer output port op TO subpatch op
                if (this.#cableSub &&
                    this.#glOpOut &&
                    this._subPatchOp &&
                    this.#glOpOut.getUiAttribs().translate &&
                    this.#glOpOut.op.uiAttribs.subPatch == this._subPatchOp.uiAttribs.subPatch)
                {
                    if (!this.#glOpOut.getUiAttribs().translate) return;
                    if (!this._subPatchOp.uiAttribs.translate) return;

                    if (this._debugColor) this.#cableSub.setColor(0, 1, 0, 1); // green

                    foundCableSub = true;
                    this.#cableSub.setPosition(
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameInput, this._subPatchOp.id, true),
                        this._subPatchOp.uiAttribs.translate.y,
                        this.#glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this.#glOpOut.getUiAttribs().translate.y + 30,
                    );
                }

                else

                // outer input port op FROM subpatch op
                if (
                    this.#cable &&
                    this._subPatchOp &&
                    this.#glOpIn.getUiAttribs().translate &&
                    this._subPatchOp.uiAttribs.translate &&
                    this.#glOpIn.op.uiAttribs.subPatch == this._subPatchOp.uiAttribs.subPatch
                )
                {
                    if (this._debugColor) this.#cable.setColor(1, 0, 0, 1); // red
                    foundCable = true;
                    this.#cable.setPosition(
                        this.#glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this.#glOpIn.getUiAttribs().translate.y,
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameOutput, this._subPatchOp.id, true),
                        this._subPatchOp.uiAttribs.translate.y + 30,
                    );
                }
                // else

                if (!foundCable &&
                    this.#cable &&
                    this._subPatchOp &&
                    this.#glOpIn.getUiAttribs() &&
                    this.#glOpIn.getUiAttribs().translate &&
                    this._subPatchOp.uiAttribs.translate)
                {
                    if (this._debugColor) this.#cable.setColor(0, 0, 0, 1);
                    this.#cable.setPosition(
                        this.#glOpIn.getUiAttribs().translate.x + this._offsetXInput,
                        this.#glOpIn.getUiAttribs().translate.y,
                        this._subPatchOp.uiAttribs.translate.x + this._subPatchOp.getPortPosX(this._portNameOutput, this._subPatchOp.id, true),
                        this._subPatchOp.uiAttribs.translate.y + 30,
                    );
                }

                if (!foundCableSub && this.#cableSub && this._subPatchOutputOp)
                {
                    if (this._debugColor) this.#cableSub.setColor(1, 0.5, 0.4, 1);
                    this.#cableSub.setPosition(
                        this._subPatchOutputOp.uiAttribs.translate.x + this._subPatchOutputOp.getPortPosX(this._portNameOutput, this._subPatchOutputOp.id, true),
                        this._subPatchOutputOp.uiAttribs.translate.y,

                        this.#glOpOut.getUiAttribs().translate.x + this._offsetXOutput,
                        this.#glOpOut.getUiAttribs().translate.y + 30,
                    );
                }
            }
        }
    }

    update()
    {
        if (!this.#glOpIn)
        {
            this.#glOpIn = this.#glPatch.getOp(this._opIdInput);
            if (this.#glOpIn)
            {
                this.#glOpIn.addLink(this);
                this.#glOpIn.on("move", () => { this.update(); });
            }
        }

        if (!this.#glOpOut)
        {
            this.#glOpOut = this.#glPatch.getOp(this._opIdOutput);
            if (this.#glOpOut)
            {
                this.#glOpOut.addLink(this);
                this.#glOpOut.on("move", () => { this.update(); });
            }
        }

        if (!this.#glOpIn || !this.#glOpOut)
        {
            this.#log.warn("unknown ops...", this._opIdInput, this._opIdOutput, this.#glOpIn, this.#glOpOut);
            return;
        }

        this._offsetXInput = this.#glOpIn.getPortPos(this._portNameInput);
        this._offsetXOutput = this.#glOpOut.getPortPos(this._portNameOutput);

        if (!this.addedOrderListeners)
        {
            this.addedOrderListeners = true;
            if (this.#glOpIn) this.#glOpIn.op.on("glportOrderChanged", () =>
            {
                this.update();
            });
            if (this.#glOpOut) this.#glOpOut.op.on("glportOrderChanged", () =>
            {
                this.update();
            });

            if (this._subPatchOp) this._subPatchOp.on("glportOrderChanged", () =>
            {
                this.#log.log("this._subPatchOp --- glport order changed!@!!");
                this.update();
            });

            if (this._subPatchInputOp) this._subPatchInputOp.on("glportOrderChanged", () =>
            {
                this.update();
            });

            if (this._subPatchOutputOp) this._subPatchOutputOp.on("glportOrderChanged", () =>
            {
                this.update();
            });
        }

        this.#glOpIn.updateVisible();
        this.#glOpOut.updateVisible();
        this._updatePosition();
    }

    unlink()
    {
        this.#link.remove();
        // if (this._glOpOut) this._glOpOut.removeLink(this._id);
        // if (this._glOpIn) this._glOpIn.removeLink(this._id);
    }

    dispose()
    {
        if (this.#glOpOut) this.#glOpOut.removeLink(this._id);
        if (this.#glOpIn) this.#glOpIn.removeLink(this._id);

        if (this.#cable) this.#cable = this.#cable.dispose();
        if (this.#cableSub) this.#cableSub = this.#cableSub.dispose();

        if (this._buttonRect) this._buttonRect = this._buttonRect.dispose();
    }

    /**
     * @param {string | number} v
     */
    _singleValueToString(v)
    {
        let r = null;
        if (typeof v == "number") r = String(Math.round(v * 1000) / 1000);
        else if (typeof v == "string") r = "\"" + v + "\"";
        return r;
    }

    /**
     * @param {number} act
     * @param {string | any[]} v
     */
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

        this.#cable.setText(r);
        this.#cable.setSpeed(act);
        if (this.#cableSub)
        {
            this.#cableSub.setText(r);
            this.#cableSub.setSpeed(act);
        }
    }

    highlight(b)
    {
        if (this._oldHighlight !== b)
        {
            this.#cable.updateColor();
            if (this.#cableSub) this.#cableSub.updateColor();
            // if (this._cableSub) this._glPatch.setDrawableColorByType(this._cableSub, this._type, b ? 1 : 0);
            this._oldHighlight = b;
        }
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    collideLine(x1, y1, x2, y2)
    {
        return this.#cable.collideLine(x1, y1, x2, y2) || this.#cableSub?.collideLine(x1, y1, x2, y2);
    }

    updateTheme()
    {
        this.highlight(false);
    }

    isAOpSelected()
    {
        if (this.#glOpOut && this.#glOpOut.selected) return true;
        if (this.#glOpIn && this.#glOpIn.selected) return true;
        return false;
    }

    isAPortHovering()
    {
        const perf = gui.uiProfiler.start("[gllink] cableHoverChangeisAPortHoveringd");

        if (this.#glOpOut)
        {
            let port = this.#glOpOut.op.getPortById(this._portIdOutput);
            let glport = this.#glOpOut.getGlPort(port.name);
            if (glport && glport.hovering) return true;
        }

        if (this.#glOpIn && this.#glOpIn.op)
        {
            let port = this.#glOpIn.op.getPortById(this._portIdInput);
            let glport = this.#glOpIn.getGlPort(port.name);

            if (glport && glport.hovering) return true;
        }

        perf.finish();
        return false;
    }

    updateColor()
    {
        this.#cable.updateColor();
        if (this.#cableSub) this.#cableSub.updateColor();
    }

    cableHoverChanged()
    {
        const perf = gui.uiProfiler.start("[gllink] cableHoverChanged");

        if (this.#glOpOut && this.#glOpOut.op)
        {
            let port = this.#glOpOut.op.getPortById(this._portIdOutput);
            let glport = this.#glOpOut.getGlPort(port.name);

            if (glport)glport._updateColor();
        }

        if (this.#glOpIn && this.#glOpIn.op)
        {
            let port = this.#glOpIn.op.getPortById(this._portIdInput);
            let glport = this.#glOpIn.getGlPort(port.name);

            if (glport)glport._updateColor();
        }

        perf.finish();

    }
}
