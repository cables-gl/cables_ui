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

CABLES.valueChangerSetSliderCSS = function (v, el)
{
    if (el.dataset.min || el.dataset.max)
        v = CABLES.map(v, parseFloat(el.dataset.min), parseFloat(el.dataset.max), 0, 1);

    v = Math.max(0, v);
    v = Math.min(1, v);
    const cssv = v * 100;
    const grad = "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";

    el.style.background = grad;
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

    const elemDom = document.getElementById(eleId);
    const elem = $("#" + eleId);
    const elemContainerJQ = $("#" + eleId + "-container");
    const eleContainer = ele.byId(eleId + "-container");

    const eleNumInputDisplay = $("#" + eleId + "-container .numberinput-display");

    const theOp = gui.corePatch().getOpById(opid);
    const thePort = theOp.getPort(portName);

    let isDown = false;
    const startVal = elem.val();
    const el = document.getElementById(eleId);
    let incMode = 0;
    let mouseDownTime = 0;
    const usePointerLock = true;

    if (focus)
    {
        setTextEdit(true);
        elem.keydown(CABLES.UI.inputListenerCursorKeys);
    }

    function onInput(e)
    {
        if (eleContainer.classList.contains("valuesliderinput"))
        {
            CABLES.valueChangerSetSliderCSS(elem.val(), eleContainer);
        }
        return true;
    }

    function switchToNextInput(dir)
    {
        const portNum = eleContainer.dataset.portnum;
        let count = 0;
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
        if (enabled)
        {
            elem.bind("input", onInput);
            eleNumInputDisplay.hide();
            $(".numberinput").removeClass("numberinputFocussed");
            eleContainer.classList.add("numberinputFocussed");
            elem.show();
            elem.focus();

            const vv = elem.val();
            elem[0].setSelectionRange(0, vv.length);
            elem.bind("keydown", tabKeyListener);
        }
        else
        {
            elem.unbind("input", onInput);
            $(".numberinput").removeClass("numberinputFocussed");
            eleNumInputDisplay.show();
            elem.hide();
            elem.blur();
            document.removeEventListener("mouseup", up);
            document.removeEventListener("mousedown", down);
        }
    }

    function down(e)
    {
        if (elem.is(":focus")) return;

        elem.unbind("mousewheel");
        elem.unbind("keydown");
        elem.bind("mousewheel", CABLES.UI.inputListenerMousewheel);
        elem.keydown(CABLES.UI.inputListenerCursorKeys);

        mouseDownTime = performance.now();
        isDown = true;

        const isString = elem.data("valuetype") == "string";

        if (!isString && usePointerLock)
        {
            document.addEventListener("pointerlockerror", lockError, false);

            document.addEventListener("pointerlockchange", lockChange, false);
            document.addEventListener("mozpointerlockchange", lockChange, false);
            document.addEventListener("webkitpointerlockchange", lockChange, false);

            if (el.classList.contains("inc_int")) incMode = 1;

            el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
            if (el.requestPointerLock) el.requestPointerLock();
        }

        CABLES.mouseDraggingValue = true;
    }

    function up(e)
    {
        if (elem.is(":focus")) return;
        const isString = elem.data("valuetype") == "string";

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
            }(portName, opid, parseFloat(startVal), parseFloat(elem.val())));
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
        CABLES.valueChangerSetSliderCSS(elem.val(), eleContainer);
        return v;
    }

    function move(e)
    {
        if (CABLES.UI.pointerLockFirstTime)
        {
            CABLES.UI.pointerLockFirstTime = false;
            return;
        }
        if (elem.is(":focus"))
        {
            return;
        }

        gui.setStateUnsaved();
        let v = parseFloat(elem.val(), 10);
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

        elemDom.value = v;
        eleNumInputDisplay.html(v);
        elem.trigger("input");
        elemDom.dispatchEvent(new Event("input"));
    }

    function lockError(e)
    {
        // console.log("pointer lock error...", e);
    }

    function lockChange(e)
    {
        if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        {
            CABLES.UI.pointerLockFirstTime = true;
            document.addEventListener("mousemove", move, false);
        }
        else
        {
            // propably cancled by escape key / reset value
            elem.val(startVal);
            eleNumInputDisplay.html(startVal);
            elem.trigger("input");
            elemDom.dispatchEvent(new Event("input"));
            up();
        }
    }

    function blur(e)
    {
        // value changed after blur
        if (startVal != elem.val())
        {
            if (opid && portName)
            {
                if (isNaN(elem.val()))
                {
                    const op = gui.corePatch().getOpById(opid);
                    const p = op.getPort(portName);

                    let mathParsed = elem.val();
                    try
                    {
                        mathParsed = CABLES.UI.mathparser.parse(elem.val());
                    }
                    catch (ex)
                    {
                        // failed to parse math, use unparsed value
                        mathParsed = elem.val();
                    }
                    elem.val(mathParsed);

                    p.set(mathParsed);
                    CABLES.UI.hideToolTip();
                }
            }
        }

        elem.unbind("blur");
        eleNumInputDisplay.html(elem.val());
        setTextEdit(false);
        if (elem.hasClass("valuesliderinput"))setProgress();
    }

    document.addEventListener("mouseup", up);
    document.addEventListener("mousedown", down);
    elem.bind("blur", blur);
};
