

var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.pointerLockFirstTime = true;

CABLES.UI.togglePortValBool = function (which, checkbox)
{
    gui.setStateUnsaved();
    const inputEle = $("#" + which);
    const checkBoxEle = $("#" + checkbox);

    let bool_value = inputEle.val() == "true";
    bool_value = !bool_value;

    if (bool_value)
    {
        checkBoxEle.addClass("fa-check-square");
        checkBoxEle.removeClass("fa-square");
    }
    else
    {
        checkBoxEle.addClass("fa-square");
        checkBoxEle.removeClass("fa-check-square");
    }

    inputEle.val(bool_value);
    inputEle.trigger("input");
};


CABLES.UI.inputIncrement = function (v, dir, e)
{
    // console.log(e.target.type=="search");
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
    $(".valuesliderinput input").each(function (e)
    {
        const grad = CABLES.valueChangerGetSliderCss($(this).val());
        $(this).parent().css({ "background": grad });
    });
};

CABLES.valueChangerGetSliderCss = function (v)
{
    v = Math.max(0, v);
    v = Math.min(1, v);
    const cssv = v * 100;
    return "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";
};

// CABLES.UI.lastValueChanger=null;

CABLES.UI.showInputFieldInfo = function ()
{
    if (document.activeElement.tagName == "INPUT") CABLES.UI.showInfo(CABLES.UI.TEXTS.valueChangerInput);
    else CABLES.UI.showInfo(CABLES.UI.TEXTS.valueChangerHover);
};


CABLES.valueChanger = function (ele, focus, portName, opid)
{
    CABLES.UI.showInputFieldInfo();

    const elem = $("#" + ele);
    const elemContainer = $("#" + ele + "-container");

    let isDown = false;
    const startVal = elem.val();
    const el = document.getElementById(ele);
    let incMode = 0;
    let mouseDownTime = 0;
    if (focus)
    {
        setTextEdit(true);
        elem.keydown(CABLES.UI.inputListenerCursorKeys);
    }

    const usePointerLock = true;

    function onInput(e)
    {
        if (elemContainer.hasClass("valuesliderinput"))
        {
            const grad = CABLES.valueChangerGetSliderCss(elem.val());
            elemContainer.css({ "background": grad });
        }
        return true;
    }

    function switchToNextInput(dir)
    {
        const portNum = elemContainer.data("portnum");
        let count = 0;
        while (count < 10)
        {
            const i = (portNum + dir) + count * dir;
            const pEle = document.getElementById("portval_" + i + "-container");

            // if($('#portval_'+i+'-container').length)
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
            $("#" + ele + "-container .numberinput-display").hide();
            $(".numberinput").removeClass("numberinputFocussed");
            elemContainer.addClass("numberinputFocussed");
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
            $("#" + ele + "-container .numberinput-display").show();
            elem.hide();
            elem.blur();
            $(document).unbind("mouseup", up);
            $(document).unbind("mousedown", down);
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
                    CABLES.undo.add({
                        "title": "Value mousedrag " + oldVal + " to " + newVal,
                        undo()
                        {
                            const op = gui.patch().scene.getOpById(opid);
                            const p = op.getPort(_portName);
                            gui.patch().showProjectParams();
                            p.set(oldVal);
                            gui.patch().showOpParams(op);
                        },
                        redo()
                        {
                            const op = gui.patch().scene.getOpById(opid);
                            const p = op.getPort(_portName);
                            gui.patch().showProjectParams();
                            p.set(newVal);
                            gui.patch().showOpParams(op);
                        }
                    });
            }(portName, opid, startVal, elem.val()));
        }


        gui.setStateUnsaved();
        isDown = false;

        if (usePointerLock)
        {
            document.removeEventListener("pointerlockchange", lockChange, false);
            document.removeEventListener("mozpointerlockchange", lockChange, false);
            document.removeEventListener("webkitpointerlockchange", lockChange, false);

            if (document.exitPointerLock)document.exitPointerLock();
        }

        $(document).unbind("mouseup", up);
        $(document).unbind("mousedown", down);

        document.removeEventListener("mousemove", move, false);

        if (performance.now() - mouseDownTime < 200)
        {
            setTextEdit(true);
        }
    }

    function setProgress(v)
    {
        const grad = CABLES.valueChangerGetSliderCss(v);
        elemContainer.css({ "background": grad });
        return v;
    }

    function move(e)
    {
        if (CABLES.UI.pointerLockFirstTime)
        {
            CABLES.UI.pointerLockFirstTime = false;
            return;
        }
        if (elem.is(":focus")) return;

        gui.setStateUnsaved();
        let v = parseFloat(elem.val(), 10);
        let inc = 0;

        if (Math.abs(e.movementX) > 5) mouseDownTime = 0;

        if (elemContainer.hasClass("valuesliderinput"))
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

        elem.val(v);
        $("#" + ele + "-container .numberinput-display").html(v);
        elem.trigger("input");
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
            $("#" + ele + "-container .numberinput-display").html(startVal);
            elem.trigger("input");
            up();
        }
    }

    $(document).bind("mouseup", up);
    $(document).bind("mousedown", down);

    elem.bind("blur",
        function ()
        {
            // value changed after blur
            if (startVal != elem.val())
            {
                // console.log("value changed after blur!",startVal,elem.val());
                // console.log(portName,opid);

                if (opid && portName)
                {
                    if (isNaN(elem.val()))
                    {
                        const op = gui.patch().scene.getOpById(opid);
                        const p = op.getPort(portName);

                        let mathParsed = elem.val();
                        try
                        {
                            mathParsed = CABLES.UI.mathparser.parse(elem.val());
                        }
                        catch (e)
                        {
                            // failed to parse math, use unparsed value
                            mathParsed = elem.val();
                        }
                        elem.val(mathParsed);
                        p.set(mathParsed);
                        CABLES.UI.hideToolTip();
                    }

                    // var undofunc = function(portName,opId,oldVal,newVal) {
                    //     CABLES.undo.add({
                    //         title:"value blur",
                    //         undo: function() {
                    //             const op=gui.patch().scene.getOpById(opid);
                    //             const p=op.getPort(portName);
                    //             gui.patch().showProjectParams();
                    //             p.set(oldVal);
                    //             gui.patch().showOpParams(op);
                    //         },
                    //         redo: function() {
                    //             const op=gui.patch().scene.getOpById(opid);
                    //             const p=op.getPort(portName);
                    //             gui.patch().showProjectParams();
                    //             p.set(newVal);
                    //             gui.patch().showOpParams(op);
                    //         }
                    //     });
                    // }(portName,opid,startVal,elem.val());
                }
            }

            elem.unbind("blur");
            $("#" + ele + "-container .numberinput-display").html(elem.val());
            setTextEdit(false);
            if (elem.hasClass("valuesliderinput"))setProgress();
        });
};
