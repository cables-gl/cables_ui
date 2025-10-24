import { ele } from "cables-shared-client";
import { utils } from "cables";
import { GuiText } from  "../../text.js";
import { hideToolTip } from "../../elements/tooltips.js";
import undo from "../../utils/undo.js";
import paramsHelper from "./params_helper.js";
import { gui } from "../../gui.js";

let pointerLockFirstTime = true;

export default valueChanger;

/**
 * mouse and keyboard interactions with port parameters
 */
function valueChanger(eleId, focus, portName, opid)
{
    gui.showInfo(GuiText.valueChangerInput);

    const eleInput = ele.byId(eleId);
    const eleContainer = ele.byId(eleId + "-container");
    const eleNumInputDisplay = document.querySelector("#" + eleId + "-container .numberinput-display");

    const theOp = gui.corePatch().getOpById(opid);
    if (!theOp) return;

    const thePort = theOp.getPort(portName);

    let isDown = false;
    const startVal = eleInputValue();
    let incMode = 0;
    let mouseDownTime = 0;

    let usePointerLock = true;

    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) usePointerLock = false;

    document.addEventListener("pointerup", up);
    document.addEventListener("pointerdown", down);
    eleInput.addEventListener("focusout", blur);

    if (focus)
    {
        setTextEdit(true);
        eleInput.addEventListener("keydown", paramsHelper.inputListenerCursorKeys);
        // elem.keydown(paramsHelper.inputListenerCursorKeys);
    }

    function setTextEdit(enabled)
    {
        ele.forEachClass("numberinput", (elm) => { elm.classList.remove("numberinputFocussed"); });

        if (enabled)
        {
            if (eleContainer.classList.contains("valuesliderinput"))
                eleInput.addEventListener("input", () => { paramsHelper.valueChangerSetSliderCSS(eleInput.value, eleContainer); });
            ele.hide(eleNumInputDisplay);

            eleContainer.classList.add("numberinputFocussed");
            ele.show(eleInput);
            eleInput.focus();

            const vv = eleInput.value;
            eleInput.setSelectionRange(0, vv.length);
        }
        else
        {
            if (eleContainer.classList.contains("valuesliderinput")) eleInput.addEventListener("input",
                () =>
                {
                    paramsHelper.valueChangerSetSliderCSS(eleInput.value, eleContainer);
                });

            ele.show(eleNumInputDisplay);
            ele.hide(eleInput);
            eleInput.blur();

            document.removeEventListener("pointerup", up);
            document.removeEventListener("pointerdown", down);
        }
    }

    function down(e)
    {
        if (ele.hasFocus(eleInput)) return;

        eleInput.removeEventListener("wheel", paramsHelper.inputListenerMousewheel);
        eleInput.addEventListener("wheel", paramsHelper.inputListenerMousewheel);
        eleInput.addEventListener("keydown", paramsHelper.inputListenerCursorKeys);
        mouseDownTime = performance.now();
        isDown = true;

        if (usePointerLock)
        {
            document.addEventListener("pointerlockerror", lockError);
            document.addEventListener("pointerlockchange", lockChange);
            document.addEventListener("mozpointerlockchange", lockChange);
            document.addEventListener("webkitpointerlockchange", lockChange);

            if (eleInput.classList.contains("inc_int")) incMode = 1;

            eleInput.requestPointerLock = eleInput.requestPointerLock || eleInput.mozRequestPointerLock || eleInput.webkitRequestPointerLock;
            if (eleInput.requestPointerLock) eleInput.requestPointerLock();
        }
        else
        {
            document.addEventListener("pointermove", move);
        }

        CABLES.mouseDraggingValue = true;
    }

    function up(e)
    {
        if (ele.hasFocus(eleInput)) return;

        CABLES.mouseDraggingValue = false;

        if (opid && portName)
        {
            const undofunc = (function (_portName, opId, oldVal, newVal)
            {
                if (oldVal != newVal)
                    undo.add({
                        "title": "Value mousedrag " + oldVal + " to " + newVal,
                        undo()
                        {
                            const op = gui.corePatch().getOpById(opid);
                            const p = op.getPort(_portName);
                            gui.patchView.showDefaultPanel();

                            p.set(oldVal);
                            gui.opParams.show(op);
                            gui.patchView.focusOp(null);
                            gui.patchView.focusOp(op.id);
                            gui.patchView.centerSelectOp(op.id);
                        },
                        redo()
                        {
                            const op = gui.corePatch().getOpById(opid);
                            const p = op.getPort(_portName);
                            gui.patchView.showDefaultPanel();

                            p.set(newVal);
                            gui.opParams.show(op);
                            gui.patchView.focusOp(null);
                            gui.patchView.focusOp(op.id);
                            gui.patchView.centerSelectOp(op.id);
                        }
                    });
            }(portName, opid, parseFloat(startVal), parseFloat(eleInput.value)));
        }

        // gui.setStateUnsaved();
        gui.savedState.setUnSaved("valuechangerUp", thePort.op.getSubPatch());

        isDown = false;

        if (usePointerLock)
        {
            document.removeEventListener("pointerlockerror", lockError, false);
            document.removeEventListener("pointerlockchange", lockChange, false);
            document.removeEventListener("mozpointerlockchange", lockChange, false);
            document.removeEventListener("webkitpointerlockchange", lockChange, false);

            if (document.exitPointerLock)document.exitPointerLock();
        }

        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointerdown", down);
        document.removeEventListener("pointermove", move, false);
        if (performance.now() - mouseDownTime < 200) setTextEdit(true);
    }

    function setProgress(v)
    {
        paramsHelper.valueChangerSetSliderCSS(eleInput.value, eleContainer);
        return v;
    }

    function eleInputValue()
    {
        eleInput.value = eleInput.value.replaceAll(",", ".");

        let str = eleInput.value;
        let v = parseFloat(str);
        if (v != v)v = 0;

        return v;
    }

    function move(e)
    {
        if (pointerLockFirstTime)
        {
            pointerLockFirstTime = false;
            return;
        }

        if (ele.hasFocus(eleInput)) return;

        // gui.setStateUnsaved();
        gui.savedState.setUnSaved("valuechangerMove", thePort.op.getSubPatch());
        let v = eleInputValue();
        let inc = 0;

        if (thePort.uiAttribs.min != undefined)
            v = utils.map(v, thePort.uiAttribs.min, thePort.uiAttribs.max, 0, 1);

        if (Math.abs(e.movementX) > 5) mouseDownTime = 0;

        if (eleContainer.classList.contains("valuesliderinput"))
        {
            inc = e.movementX * 0.001;
            v += inc;
            v = Math.max(0, v);
            v = Math.min(1, v);
            v = Math.round(v * 1000) / 1000;
            v = setProgress(v);
        }
        else
        if (incMode == 0)
        {
            inc = e.movementX * 0.01;
            if (e.shiftKey || e.which == 3)inc = e.movementX * 0.5;

            v += inc;
            v = Math.round(v * 1000) / 1000;
        }
        else
        {
            inc = e.movementX * 1;
            if (e.shiftKey || e.which == 3)inc = e.movementX * 5;

            v += inc;
            v = Math.floor(v);
        }

        if (thePort.uiAttribs.min != undefined)
            v = utils.map(v, 0, 1, thePort.uiAttribs.min, thePort.uiAttribs.max);

        eleInput.value = v;
        eleNumInputDisplay.innerHTML = v;

        eleInput.dispatchEvent(new Event("input"));
    }

    function lockError(e)
    {
        // console.log("pointer lock error...", e);
    }

    function lockChange(e)
    {
        if (document.pointerLockElement === eleInput || document.mozPointerLockElement === eleInput || document.webkitPointerLockElement === eleInput)
        {
            pointerLockFirstTime = true;
            document.addEventListener("pointermove", move);
        }
        else
        {
            // propably cancled by escape key / reset value
            eleInput.value = startVal;
            eleNumInputDisplay.innerHTML = startVal;
            eleInput.dispatchEvent(new Event("input"));
            up();
        }
    }

    function blur(e)
    {
        // value changed after blur
        if (startVal != eleInputValue())
        {
            if (opid && portName)
            {
                if (isNaN(eleInput.value))
                {
                    const op = gui.corePatch().getOpById(opid);
                    const p = op.getPort(portName);

                    let mathParsed = eleInput.value;

                    mathParsed = mathParsed.replaceAll(",", ".");

                    try
                    {
                        mathParsed = CABLES.UI.mathparser.parse(eleInput.value);
                    }
                    catch (ex)
                    {
                        // failed to parse math, use unparsed value
                        mathParsed = eleInputValue();
                    }
                    eleInput.value = mathParsed;

                    p.set(mathParsed);
                    hideToolTip();
                }
            }
        }

        hideToolTip();
        eleInput.removeEventListener("focusout", blur);
        eleNumInputDisplay.innerHTML = eleInput.value;
        setTextEdit(false);

        if (eleInput.classList.contains("valuesliderinput"))setProgress();
    }
}
