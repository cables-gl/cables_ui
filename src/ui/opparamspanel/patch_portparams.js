CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.inputListenerCursorKeys = function (e)
{
    switch (e.which)
    {
    case 38: // up
        this.value = CABLES.UI.inputIncrement(this.value, 1, e);
        $(this).trigger("input");
        return false;

    case 40: // down
        this.value = CABLES.UI.inputIncrement(this.value, -1, e);
        $(this).trigger("input");
        return false;

    default: // exit this handler for other keys
    }
    // e.preventDefault(); // prevent the default action (scroll / move caret)
};

CABLES.UI.inputListenerMousewheel = function (event, delta)
{
    if (ele.hasFocus(event.target))
    {
        if (delta > 0)
        {
            if (event.shiftKey) this.value = CABLES.UI.inputIncrement(this.value, 0.1, event);
            else this.value = CABLES.UI.inputIncrement(this.value, 1, event);
        }
        else
        {
            if (event.shiftKey) this.value = CABLES.UI.inputIncrement(this.value, -0.1, event);
            else this.value = CABLES.UI.inputIncrement(this.value, -1, event);
        }

        $(this).trigger("input");
        event.target.dispatchEvent(new Event("input"));

        return false;
    }
};

CABLES.UI.bindInputListeners = function ()
{
};


CABLES.UI.checkDefaultValue = function (op, index)
{
    if (op.portsIn[index].defaultValue !== undefined && op.portsIn[index].defaultValue !== null)
    {
        const titleEl = document.getElementById("portTitle_in_" + index);
        if (titleEl) titleEl.classList.toggle("nonDefaultValue", op.portsIn[index].get() != op.portsIn[index].defaultValue);
    }
};


CABLES.UI.openParamSpreadSheetEditor = function ()
{

};

CABLES.UI.openParamSpreadSheetEditor = function (opid, portname, cb)
{
    const op = gui.corePatch().getOpById(opid);
    if (!op) return console.log("paramedit op not found");

    const port = op.getPortByName(portname);
    if (!port) return console.log("paramedit port not found");


    new CABLES.UI.SpreadSheetTab(gui.mainTabs, port, port.get(),
        {
            "title": gui.mainTabs.getUniqueTitle("Array " + portname),
            "onchange": (content) =>
            {
                console.log(content);
                port.set(content);
            }
        });
};
CABLES.UI.openParamStringEditor = function (opid, portname, cb)
{
    const op = gui.corePatch().getOpById(opid);
    if (!op) return console.log("paramedit op not found");

    const port = op.getPortByName(portname);
    if (!port) return console.log("paramedit port not found");

    let name = op.name + " " + port.name;

    name = gui.mainTabs.getUniqueTitle(name);

    // let existingTab = gui.mainTabs.getTabByTitle(name);
    // let count = 0;
    // while (existingTab)
    // {
    //     count++;
    //     if (!gui.mainTabs.getTabByTitle(name + " (" + count + ")")) break;
    // }
    // if (count > 0)
    //     name = name + " (" + count + ")";


    const dataId = opid + portname;
    const existingTab = gui.mainTabs.getTabByDataId(dataId);
    if (existingTab)
    {
        gui.mainTabs.activateTabByName(existingTab.title);

        return;
    }

    const editorObj = CABLES.editorSession.rememberOpenEditor("param", name, { "opid": opid, "portname": portname });


    if (editorObj)
    {
        new CABLES.UI.EditorTab(
            {
                "title": name,
                "dataId": dataId,
                "content": port.get() + "",
                "name": editorObj.name,
                "syntax": port.uiAttribs.editorSyntax,
                "hideFormatButton": port.uiAttribs.hideFormatButton,
                "editorObj": editorObj,
                "onClose": function (which)
                {
                    CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                },
                "onSave": function (setStatus, content)
                {
                    setStatus("saved");
                    gui.setStateUnsaved();
                    gui.jobs().finish("saveeditorcontent");
                    port.set(content);
                },
                "onChange": function (e)
                {
                    gui.setStateUnsaved();
                }
            });
    }
    else
    {
        gui.mainTabs.activateTabByName(name);
    }

    if (cb)cb();
    else gui.maintabPanel.show();
};

CABLES.UI.updateLinkedColorBoxes = function (thePort, thePort1, thePort2)
{
    const id = "watchcolorpick_" + thePort.watchId;
    const splits = id.split("_");
    const portNum = parseInt(splits[splits.length - 1]);

    const colEle = document.getElementById(id);

    if (colEle && thePort1 && thePort && thePort2)
    {
        const inputElements =
        [
            document.getElementById("portval_" + portNum),
            document.getElementById("portval_" + (portNum + 1)),
            document.getElementById("portval_" + (portNum + 2))
        ];

        if (!inputElements[0] || !inputElements[1] || !inputElements[2])
        {
            colEle.style.backgroundColor = chroma(
                Math.round(255 * thePort.get()),
                Math.round(255 * thePort1.get()),
                Math.round(255 * thePort2.get()),
            ).hex();
        }
    }
};

CABLES.UI.watchColorPickerPort = function (thePort)
{
    const id = "watchcolorpick_" + thePort.watchId;
    const splits = id.split("_");
    const portNum = parseInt(splits[splits.length - 1]);

    const updateColorBox = () =>
    {
        colEle.style.backgroundColor = chroma(getCurrentColor()).hex();
    };

    const inputElements =
    [
        document.getElementById("portval_" + portNum),
        document.getElementById("portval_" + (portNum + 1)),
        document.getElementById("portval_" + (portNum + 2))
    ];

    const colEle = document.getElementById(id);


    if (!inputElements[0] || !inputElements[1] || !inputElements[2])
    {
        // if (colEle)colEle.remove();

        return;
    }

    const getCurrentColor = () =>
        [
            Math.round(255 * parseFloat(inputElements[0].value)),
            Math.round(255 * parseFloat(inputElements[1].value)),
            Math.round(255 * parseFloat(inputElements[2].value))];

    inputElements[0].addEventListener("input", updateColorBox);
    inputElements[1].addEventListener("input", updateColorBox);
    inputElements[2].addEventListener("input", updateColorBox);

    updateColorBox();

    colEle.addEventListener("click", (e) =>
    {
        const cr = new ColorRick({
            "ele": colEle,
            "color": getCurrentColor(), // "#ffffff",
            "onChange": (col) =>
            {
                updateColorBox();
                const glRgb = col.gl();

                document.getElementById("numberinputDisplay_in_" + portNum).innerHTML =
                inputElements[0].value = glRgb[0];

                document.getElementById("numberinputDisplay_in_" + (portNum + 1)).innerHTML =
                inputElements[1].value = glRgb[1];

                document.getElementById("numberinputDisplay_in_" + (portNum + 2)).innerHTML =
                inputElements[2].value = glRgb[2];

                inputElements[0].dispatchEvent(new Event("input"));
                inputElements[1].dispatchEvent(new Event("input"));
                inputElements[2].dispatchEvent(new Event("input"));
            }
        });
    });
};


CABLES.UI.initPortInputListener = function (op, index)
{
    if (!CABLES.UI.mathparser)CABLES.UI.mathparser = new MathParser();
    CABLES.UI.checkDefaultValue(op, index);

    // added missing math constants
    CABLES.UI.mathparser.add("pi", function (n, m) { return Math.PI; });

    const eleId = "portval_" + index;

    if (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == "number" || op.portsIn[index].uiAttribs.type == "int")
    {
        function parseMath(e)
        {
            const keyCode = e.keyCode || e.which;
            if (keyCode == 13 || keyCode == 8)
            {
                if (isNaN(e.target.value))
                {
                    let mathParsed = e.target.value;
                    try
                    {
                        mathParsed = CABLES.UI.mathparser.parse(e.target.value);
                    }
                    catch (ex)
                    {
                        // failed to parse math, use unparsed value
                        mathParsed = e.target.value;
                    }
                    e.target.value = mathParsed;
                    console.log(mathParsed, typeof mathParsed);
                    op.portsIn[index].set(mathParsed);
                    CABLES.UI.hideToolTip();
                }
            }
        }

        const ele = document.getElementById(eleId);
        if (ele)ele.onkeypress = parseMath;
        // document.getElementById(eleId).onblur = parseMath;
    }

    const ele = $("#" + eleId);
    ele.on("input", function (e)
    {
        let v = "" + ele.val();


        if (
            op.portsIn[index].uiAttribs.display != "bool" &&
            (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == "number"))
        {
            if (isNaN(v) || v === "")
            {
                let mathParsed = v;
                try
                {
                    mathParsed = CABLES.UI.mathparser.parse(v);
                }
                catch (ex)
                {
                    // failed to parse math, use unparsed value
                    mathParsed = v;
                }
                if (!isNaN(mathParsed))
                {
                    CABLES.UI.showToolTip(e.target, " = " + mathParsed);
                    ele.removeClass("invalid");
                }
                else
                {
                    ele.addClass("invalid");
                    console.log("invalid number", op.portsIn[index], mathParsed);
                }
                return;
            }
            else
            {
                ele.removeClass("invalid");
                v = parseFloat(v);
            }
        }

        if (op.portsIn[index].uiAttribs.type == "int")
        {
            if (isNaN(v) || v === "")
            {
                ele.addClass("invalid");
                return;
            }
            else
            {
                ele.removeClass("invalid");
                v = parseInt(v, 10);
                console.log("invalid int");
            }
        }

        if (op.portsIn[index].uiAttribs.display == "bool")
        {
            // if (v != "true" && v != "false")
            // {
            //     v = false;
            //     ele.val("false");
            // }
            if (!v || v == "false" || v == "0" || v == 0) v = false;
            else v = true;

            ele.val(v);
        }

        if (!CABLES.mouseDraggingValue)
        {
            const undoAdd = (function (oldv, newv, opid, portname)
            {
                if (oldv != newv)
                    CABLES.UI.undo.add({
                        "title": "Value change " + oldv + " to " + newv,
                        undo()
                        {
                            try
                            {
                                const uop = gui.corePatch().getOpById(opid);
                                const p = uop.getPort(portname);
                                gui.patch().showProjectParams();
                                p.set(oldv);
                                gui.opParams.show(uop);
                                gui.patchView.focusOp(null);
                                gui.patchView.focusOp(opid);
                                gui.patchView.centerSelectOp(opid);
                            }
                            catch (ex) { console.warn("undo failed"); }
                        },
                        redo()
                        {
                            try
                            {
                                const rop = gui.corePatch().getOpById(opid);
                                const p = rop.getPort(portname);
                                gui.patch().showProjectParams();
                                p.set(newv);
                                gui.opParams.show(rop);
                                gui.patchView.focusOp(null);
                                gui.patchView.focusOp(opid);
                                gui.patchView.centerSelectOp(opid);
                            }
                            catch (ex) { console.warn("undo failed"); }
                        }
                    });
            }(op.portsIn[index].get(), v, op.id, op.portsIn[index].name));
        }

        op.portsIn[index].set(v);

        // update history on change
        if (!op.uiAttribs) op.uiAttribs = {};
        if (!op.uiAttribs.history) op.uiAttribs.history = {};
        op.uiAttribs.history.lastInteractionAt = Date.now();
        op.uiAttribs.history.lastInteractionBy = {
            "name": gui.user.usernameLowercase
        };

        gui.patchConnection.send(CABLES.PACO_VALUECHANGE, {
            "op": op.id,
            "port": op.portsIn[index].name,
            "v": v
        });

        CABLES.UI.checkDefaultValue(op, index);

        if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();
    });
};


CABLES.UI.initPortClickListener = function (op, index)
{
    if (op.portsIn[index].isAnimated()) document.getElementById("portanim_in_" + index).classList.add("timingbutton_active");
    if (op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) document.getElementById("portgraph_in_" + index).classList.add("timingbutton_active");

    $("#portTitle_in_" + index).on("click", function (e)
    {
        const p = op.portsIn[index];
        if (!p.uiAttribs.hidePort)
            gui.opSelect().show(
                {
                    "x": p.parent.uiAttribs.translate.x + (index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding)),
                    "y": p.parent.uiAttribs.translate.y - 50,
                }, op, p);
    });

    $("#portCreateOp_in_" + index).on("click", function (e)
    {
        const thePort = op.portsIn[index];
        if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE)
        {
            gui.corePatch().addOp("Ops.Gl.Texture", {}, function (newop)
            {
                gui.corePatch().link(op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
            });
        }
    });

    $("#portspreadsheet_in_" + index).on("click", function (e)
    {
        const thePort = op.portsIn[index];

        CABLES.UI.openParamSpreadSheetEditor(op.id, op.portsIn[index].name);
    });


    $("#portedit_in_" + index).on("click", function (e)
    {
        const thePort = op.portsIn[index];
        // console.log('thePort.uiAttribs.editorSyntax',thePort.uiAttribs.editorSyntax);

        CABLES.UI.openParamStringEditor(op.id, op.portsIn[index].name);

        // gui.showEditor();
        // gui.editor().addTab({
        //     content: op.portsIn[index].get() + '',
        //     title: '' + op.portsIn[index].name,
        //     syntax: thePort.uiAttribs.editorSyntax,
        //     onSave: function(setStatus, content) {
        //         // console.log('setvalue...');
        //         gui.setStateUnsaved();
        //         gui.jobs().finish('saveeditorcontent');
        //         thePort.set(content);
        //     }
        // });
    });

    $("#portbutton_" + index).on("click", function (e)
    {
        op.portsIn[index]._onTriggered();
    });

    if (op.portsIn[index].uiAttribs.display === "buttons")
    {
        for (let i = 0; i < op.portsIn[index].value.length; i++)
        {
            $("#portbutton_" + index + "_" + i).on("click", function (e)
            {
                const name = e.target.dataset.title;

                op.portsIn[index]._onTriggered(name);
            });
        }
    }

    $("#portgraph_in_" + index).on("click", function (e)
    {
        if (op.portsIn[index].isAnimated())
        {
            op.portsIn[index].anim.stayInTimeline = !op.portsIn[index].anim.stayInTimeline;
            $("#portgraph_in_" + index).toggleClass("timingbutton_active");
            gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
                "name": op.getTitle() + ": " + op.portsIn[index].name,
                "opid": op.id,
                "defaultValue": parseFloat($("#portval_" + index).val())
            });
        }
    });

    $("#portsetvar_" + index).on("input", function (e)
    {
        const port = op.getPortById(e.target.dataset.portid);


        if (port) port.setVariable(e.target.value);
        else console.log("[portsetvar] PORT NOT FOUND!! ", e.target.dataset.portid, e);
    });

    $("#portremovevar_" + index).on("click", function (e)
    {
        const port = op.getPortById(e.target.dataset.portid);
        if (port) port.setVariable(null);
        port.parent.refreshParams();
    });

    $("#port_contextmenu_in_" + index).on("click", function (e)
    {
        const port = op.getPortById(e.target.dataset.portid);

        CABLES.contextMenu.show(
            { "items":
                [
                    {
                        "title": "Assign variable",
                        "func": () =>
                        {
                            port.setVariable("unknown");
                            console.log("SET VARIABLE SOURCE!!");
                            port.parent.refreshParams();
                        }
                    },
                    {
                        "title": "Set animated",
                        "func": () =>
                        {
                            $("#portanim_in_" + index).click();
                        }
                    }
                ] }, e.target);
    });

    $("#portanim_in_" + index).on("click", function (e)
    {
        if ($("#portanim_in_" + index).hasClass("timingbutton_active"))
        {
            const val = gui.patch().timeLine.removeAnim(op.portsIn[index].anim);
            op.portsIn[index].setAnimated(false);

            gui.patch().timeLine.setAnim(null);
            document.getElementById("portanim_in_" + index).classList.remove("timingbutton_active");
            $("#portval_" + index).val(val);
            $("#portval_" + index).trigger("input");
            $("#portval_" + index).focus();
            op.portsIn[index].parent.refreshParams();
            return;
        }

        document.getElementById("portanim_in_" + index).classList.add("timingbutton_active");

        op.portsIn[index].toggleAnim();
        gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
            "opid": op.id,
            "name": op.getTitle() + ": " + op.portsIn[index].name,
            "defaultValue": parseFloat($("#portval_" + index).val())
        });
        op.portsIn[index].parent.refreshParams();
    });
};
