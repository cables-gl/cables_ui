
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.pointerLockFirstTime = true;

CABLES.UI.togglePortValBool = function (which, checkbox)
{
    gui.setStateUnsaved();
    const inputEle = document.getElementById(which);
    const checkBoxEle = document.getElementById(checkbox);

    let bool_value = inputEle.value == "true";
    bool_value = !bool_value;

    if (bool_value)
    {
        checkBoxEle.classList.add("fa-check-square");
        checkBoxEle.classList.remove("fa-square");
    }
    else
    {
        checkBoxEle.classList.add("fa-square");
        checkBoxEle.classList.remove("fa-check-square");
    }

    inputEle.value = bool_value;
    inputEle.dispatchEvent(new Event("input"));
};


CABLES.UI.inputIncrement = function (v, dir, e)
{
    if (e.target.type == "search") return v;
    gui.setStateUnsaved();
    if (v == "true") return "false";
    if (v == "false") return "true";

    const val = parseFloat(v);
    if (val != val) return v;

    let add = 0.1;

    if (e.target.classList.contains("inc_int"))add = 1;

    if (e && e.shiftKey && e.metaKey)add = 0.001;
    else if (e && e.altKey && e.shiftKey) add = 10;
    else if (e && e.shiftKey) add = 0.01;
    else if (e && e.altKey) add = 1;

    let r = val + add * dir;

    if (isNaN(r)) r = 0.0;
    else r = Math.round(1000 * r) / 1000;
    return r;
};


CABLES.valueChangerInitSliders = function ()
{
    const els = document.querySelectorAll(".valuesliderinput input");
    for (let i = 0; i < els.length; i++)
    {
        const v = els[i].value;
        CABLES.valueChangerSetSliderCSS(v, els[i].parentElement);
    }
};

CABLES.valueChangerSetSliderCSS = function (v, eleInput)
{
    if (eleInput.dataset.min || eleInput.dataset.max)
        v = CABLES.map(v, parseFloat(eleInput.dataset.min), parseFloat(eleInput.dataset.max), 0, 1);

    v = Math.max(0, v);
    v = Math.min(1, v);
    const cssv = v * 100;
    const grad = "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";

    eleInput.style.background = grad;
};

// CABLES.valueChangerGetSliderCss = function (v, el)
// {
//     v = Math.max(0, v);
//     v = Math.min(1, v);
//     const cssv = v * 100;
//     return "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";
// };

// CABLES.UI.lastValueChanger=null;

CABLES.UI.showInputFieldInfo = function ()
{
    if (document.activeElement.tagName == "INPUT") CABLES.UI.showInfo(CABLES.UI.TEXTS.valueChangerInput);
    else CABLES.UI.showInfo(CABLES.UI.TEXTS.valueChangerHover);
};


CABLES.valueChanger = function (eleId, focus, portName, opid)
{
    CABLES.UI.showInputFieldInfo();

    const elem = $("#" + eleId);
    const eleInput = ele.byId(eleId);
    // const el = document.getElementById(eleId);

    const eleContainer = ele.byId(eleId + "-container");
    const eleNumInputDisplay = document.querySelector("#" + eleId + "-container .numberinput-display");

    const theOp = gui.corePatch().getOpById(opid);
    const thePort = theOp.getPort(portName);

    let isDown = false;
    const startVal = eleInputValue();
    let incMode = 0;
    let mouseDownTime = 0;
    const usePointerLock = true;


    document.addEventListener("mouseup", up);
    document.addEventListener("mousedown", down);
    eleInput.addEventListener("focusout", blur);

    if (focus)
    {
        setTextEdit(true);
        elem.keydown(CABLES.UI.inputListenerCursorKeys);
    }

    function switchToNextInput(dir)
    {
        const portNum = parseInt(eleContainer.dataset.portnum);
        let count = 0;

        dir = parseInt(dir);
        while (count < 10)
        {
            const i = (portNum + dir) + count * dir;
            const pEle = document.getElementById("portval_" + i + "-container");

            if (pEle)
            {
                const portname = pEle.dataset.portname;

                setTextEdit(false);
                elem.unbind("keydown", tabKeyListener);
                CABLES.valueChanger("portval_" + i, true, portname, opid);

                return;
            }

            count++;
        }
    }

    function tabKeyListener(event)
    {
        if (event.which == 9)
        {
            event.preventDefault();
            if (event.shiftKey)switchToNextInput(-1);
            else switchToNextInput(1);
        }
    }

    function setTextEdit(enabled)
    {
        ele.forEachClass("numberinput", (elm) => { elm.classList.remove("numberinputFocussed"); });

        if (enabled)
        {
            if (eleContainer.classList.contains("valuesliderinput")) eleInput.addEventListener("input", () => { CABLES.valueChangerSetSliderCSS(eleInput.value, eleContainer); });
            ele.hide(eleNumInputDisplay);

            eleContainer.classList.add("numberinputFocussed");
            ele.show(eleInput);
            eleInput.focus();

            const vv = eleInput.value;
            elem[0].setSelectionRange(0, vv.length);
            elem.bind("keydown", tabKeyListener);
        }
        else
        {
            if (eleContainer.classList.contains("valuesliderinput")) eleInput.addEventListener("input", () => { CABLES.valueChangerSetSliderCSS(eleInput.value, eleContainer); });

            ele.show(eleNumInputDisplay);
            ele.hide(eleInput);
            eleInput.blur();

            document.removeEventListener("mouseup", up);
            document.removeEventListener("mousedown", down);
        }
    }

    function down(e)
    {
        if (ele.hasFocus(eleInput)) return;

        elem.unbind("mousewheel");
        elem.unbind("keydown");
        elem.bind("mousewheel", CABLES.UI.inputListenerMousewheel);
        elem.keydown(CABLES.UI.inputListenerCursorKeys);

        mouseDownTime = performance.now();
        isDown = true;


        if (usePointerLock)
        {
            document.addEventListener("pointerlockerror", lockError, false);
            document.addEventListener("pointerlockchange", lockChange, false);
            document.addEventListener("mozpointerlockchange", lockChange, false);
            document.addEventListener("webkitpointerlockchange", lockChange, false);

            if (eleInput.classList.contains("inc_int")) incMode = 1;

            eleInput.requestPointerLock = eleInput.requestPointerLock || eleInput.mozRequestPointerLock || eleInput.webkitRequestPointerLock;
            if (eleInput.requestPointerLock) eleInput.requestPointerLock();
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
                    CABLES.UI.undo.add({
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

        gui.setStateUnsaved();
        isDown = false;

        if (usePointerLock)
        {
            document.removeEventListener("pointerlockerror", lockError, false);
            document.removeEventListener("pointerlockchange", lockChange, false);
            document.removeEventListener("mozpointerlockchange", lockChange, false);
            document.removeEventListener("webkitpointerlockchange", lockChange, false);

            if (document.exitPointerLock)document.exitPointerLock();
        }

        document.removeEventListener("mouseup", up);
        document.removeEventListener("mousedown", down);
        document.removeEventListener("mousemove", move, false);

        if (performance.now() - mouseDownTime < 200) setTextEdit(true);
    }

    function setProgress(v)
    {
        CABLES.valueChangerSetSliderCSS(eleInput.value, eleContainer);
        return v;
    }

    function eleInputValue()
    {
        return parseFloat(eleInput.value);
    }

    function move(e)
    {
        if (CABLES.UI.pointerLockFirstTime)
        {
            CABLES.UI.pointerLockFirstTime = false;
            return;
        }

        if (ele.hasFocus(eleInput)) return;

        gui.setStateUnsaved();
        let v = eleInputValue();
        let inc = 0;

        if (thePort.uiAttribs.min != undefined)
            v = CABLES.map(v, thePort.uiAttribs.min, thePort.uiAttribs.max, 0, 1);

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
            v = CABLES.map(v, 0, 1, thePort.uiAttribs.min, thePort.uiAttribs.max);

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
            CABLES.UI.pointerLockFirstTime = true;
            document.addEventListener("mousemove", move, false);
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
                    CABLES.UI.hideToolTip();
                }
            }
        }

        eleInput.removeEventListener("focusout", blur);
        eleNumInputDisplay.innerHTML = eleInput.value;
        setTextEdit(false);

        if (eleInput.classList.contains("valuesliderinput"))setProgress();
    }
};
