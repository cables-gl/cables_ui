import ele from "../../utils/ele";
import undo from "../../utils/undo";
import EditorTab from "../tabs/tab_editor";

const paramsHelper =
{
    "valueChangerInitSliders": () =>
    {
        const els = document.querySelectorAll(".valuesliderinput input");
        for (let i = 0; i < els.length; i++)
        {
            const v = els[i].value;
            CABLES.UI.paramsHelper.valueChangerSetSliderCSS(v, els[i].parentElement);
        }
    },

    "valueChangerSetSliderCSS": (v, eleInput) =>
    {
        if (eleInput.dataset.min || eleInput.dataset.max)
            v = CABLES.map(v, parseFloat(eleInput.dataset.min), parseFloat(eleInput.dataset.max), 0, 1);

        v = Math.max(0, v);
        v = Math.min(1, v);
        const cssv = v * 100;
        const grad = "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";

        eleInput.style.background = grad;
    },

    "inputIncrement": (v, dir, e) =>
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
    },


    "checkDefaultValue": (op, index) =>
    {
        if (op.portsIn[index].defaultValue !== undefined && op.portsIn[index].defaultValue !== null)
        {
            const titleEl = ele.byId("portTitle_in_" + index);
            if (titleEl) titleEl.classList.toggle("nonDefaultValue", op.portsIn[index].get() != op.portsIn[index].defaultValue);
        }
    },

    "inputListenerMousewheel": (event) =>
    {
        event.preventDefault();
        let delta = -event.deltaY;
        if (ele.hasFocus(event.target))
        {
            if (delta > 0)
            {
                if (event.shiftKey) event.target.value = CABLES.UI.paramsHelper.inputIncrement(event.target.value, 0.1, event);
                else event.target.value = CABLES.UI.paramsHelper.inputIncrement(event.target.value, 1, event);
            }
            else
            {
                if (event.shiftKey) event.target.value = CABLES.UI.paramsHelper.inputIncrement(event.target.value, -0.1, event);
                else event.target.value = CABLES.UI.paramsHelper.inputIncrement(event.target.value, -1, event);
            }
            event.target.dispatchEvent(new Event("input"));

            return false;
        }
    },

    "inputListenerCursorKeys": (e) =>
    {
        switch (e.which)
        {
        case 38: // up
            e.target.value = CABLES.UI.paramsHelper.inputIncrement(e.target.value, 1, e);
            e.target.dispatchEvent(new Event("input"));
            return false;

        case 40: // down
            e.target.value = CABLES.UI.paramsHelper.inputIncrement(e.target.value, -1, e);
            e.target.dispatchEvent(new Event("input"));
            return false;
        }
    },


    "togglePortValBool": (which, checkbox) =>
    {
        gui.setStateUnsaved();
        const inputEle = document.getElementById(which);
        const checkBoxEle = document.getElementById(checkbox);

        let bool_value = inputEle.value == "true";
        bool_value = !bool_value;

        if (bool_value)
        {
            checkBoxEle.parentElement.classList.add("checkbox-active");
            checkBoxEle.parentElement.classList.remove("checkbox-inactive");
        }
        else
        {
            checkBoxEle.parentElement.classList.add("checkbox-inactive");
            checkBoxEle.parentElement.classList.remove("checkbox-active");
        }

        inputEle.value = bool_value;
        inputEle.dispatchEvent(new Event("input"));
    },


    "openParamSpreadSheetEditor": (opid, portname, cb) =>
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op) return console.warn("paramedit op not found");

        const port = op.getPortByName(portname);
        if (!port) return console.warn("paramedit port not found");

        new CABLES.UI.SpreadSheetTab(gui.mainTabs, port, port.get(),
            {
                "title": gui.mainTabs.getUniqueTitle("Array " + portname),
                "onchange": (content) =>
                {
                    console.warn(content);
                    port.set(content);
                    gui.emitEvent("portValueEdited", op, port, content);
                }
            });
    },


    "updateLinkedColorBoxes": (thePort, thePort1, thePort2) =>
    {
        const id = "watchcolorpick_" + thePort.watchId;
        const splits = id.split("_");
        const portNum = parseInt(splits[splits.length - 1]);

        const colEle = ele.byId(id);

        if (colEle && thePort1 && thePort && thePort2)
        {
            const inputElements =
            [
                ele.byId("portval_" + portNum),
                ele.byId("portval_" + (portNum + 1)),
                ele.byId("portval_" + (portNum + 2))
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
    },
    "watchColorPickerPort": (thePort) =>
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
            ele.byId("portval_" + portNum),
            ele.byId("portval_" + (portNum + 1)),
            ele.byId("portval_" + (portNum + 2))
        ];

        const colEle = ele.byId(id);

        if (!inputElements[0] || !inputElements[1] || !inputElements[2])
        {
            return;
        }

        const getCurrentColor = () =>
        {
            return [
                Math.round(255 * parseFloat(inputElements[0].value)),
                Math.round(255 * parseFloat(inputElements[1].value)),
                Math.round(255 * parseFloat(inputElements[2].value))];
        };

        inputElements[0].addEventListener("input", updateColorBox);
        inputElements[1].addEventListener("input", updateColorBox);
        inputElements[2].addEventListener("input", updateColorBox);

        updateColorBox();

        colEle.addEventListener("click", (e) =>
        {
            let undoGroup;
            const cr = new ColorRick({
                "ele": colEle,
                "color": getCurrentColor(), // "#ffffff",
                "onChange": (col) =>
                {
                    updateColorBox();
                    const glRgb = col.gl();

                    ele.byId("numberinputDisplay_in_" + portNum).innerHTML =
                    inputElements[0].value = glRgb[0];

                    ele.byId("numberinputDisplay_in_" + (portNum + 1)).innerHTML =
                    inputElements[1].value = glRgb[1];

                    ele.byId("numberinputDisplay_in_" + (portNum + 2)).innerHTML =
                    inputElements[2].value = glRgb[2];

                    inputElements[0].dispatchEvent(new Event("input"));
                    inputElements[1].dispatchEvent(new Event("input"));
                    inputElements[2].dispatchEvent(new Event("input"));
                },
                "onStart": () =>
                {
                    undoGroup = undo.startGroup();
                },
                "onEnd": () =>
                {
                    undo.endGroup(undoGroup, "Change Color");
                },
            });
        });
    },


    "initPortClickListener": (op, index) =>
    {
        if (op.portsIn[index].isAnimated()) ele.byId("portanim_in_" + index).classList.add("timingbutton_active");
        if (op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) ele.byId("portgraph_in_" + index).classList.add("timingbutton_active");

        if (ele.byId("portTitle_in_" + index))
            ele.byId("portTitle_in_" + index).addEventListener("click", function (e)
            {
                const p = op.portsIn[index];
                if (!p.uiAttribs.hidePort)
                    gui.opSelect().show(
                        {
                            "x": p.parent.uiAttribs.translate.x + (index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding)),
                            "y": p.parent.uiAttribs.translate.y - 50,
                        }, op, p);
            });

        if (ele.byId("portCreateOp_in_" + index))
            ele.byId("portCreateOp_in_" + index).addEventListener("click", function (e)
            {
                const thePort = op.portsIn[index];
                if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE)
                {
                    gui.corePatch().addOp(CABLES.UI.DEFAULTOPNAMES.defaultOpImage, {}, function (newop)
                    {
                        gui.corePatch().link(op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
                    });
                }
            });

        if (ele.byId("portspreadsheet_in_" + index))
            ele.byId("portspreadsheet_in_" + index).addEventListener("click", function (e)
            {
                const thePort = op.portsIn[index];

                CABLES.UI.paramsHelper.openParamSpreadSheetEditor(op.id, op.portsIn[index].name);
            });


        // /////////////////////
        //
        // input text editor tab
        //

        let el = ele.byId("portedit_in_" + index);
        if (el) el.addEventListener("click", () =>
        {
            const thePort = op.portsIn[index];
            CABLES.UI.paramsHelper.openParamStringEditor(op.id, op.portsIn[index].name, null, true);
        });

        // /////////////////////
        //
        // input button click!!!!
        //
        el = ele.byId("portbutton_" + index);
        if (el) el.addEventListener("click", function (e)
        {
            op.portsIn[index]._onTriggered();
        });

        if (op.portsIn[index].uiAttribs.display === "buttons")
        {
            for (let i = 0; i < op.portsIn[index].value.length; i++)
            {
                let eli = ele.byId("portbutton_" + index + "_" + i);
                if (eli)eli.addEventListener("click", function (e)
                {
                    const name = e.target.dataset.title;
                    op.portsIn[index]._onTriggered(name);
                });
            }
        }


        //

        el = ele.byId("portgraph_in_" + index);
        if (el)el.addEventListener("click", function (e)
        {
            if (op.portsIn[index].isAnimated())
            {
                op.portsIn[index].anim.stayInTimeline = !op.portsIn[index].anim.stayInTimeline;

                gui.timeLine().setAnim(op.portsIn[index].anim, {
                    "name": op.getTitle() + ": " + op.portsIn[index].name,
                    "opid": op.id,
                    "defaultValue": parseFloat(ele.byId("portval_" + index).value)
                });
            }
        });

        el = ele.byId("portsetvar_" + index);
        if (el)el.addEventListener("input", (e) =>
        {
            const port = op.getPortById(e.target.dataset.portid);

            if (port) port.setVariable(e.target.value);
            else console.warn("[portsetvar] PORT NOT FOUND!! ", e.target.dataset.portid, e);

            gui.setStateUnsaved();
        });

        el = ele.byId("portremovevar_" + index);
        if (el)el.addEventListener("click", (e) =>
        {
            const port = op.getPortById(e.target.dataset.portid);
            if (port) port.setVariable(null);
            port.parent.refreshParams();
            gui.setStateUnsaved();
        });

        el = ele.byId("port_contextmenu_in_" + index);
        if (el) el.addEventListener("click", (e) =>
        {
            const port = op.getPortById(e.target.dataset.portid);

            CABLES.contextMenu.show(
                { "items":
                    [
                        {
                            "title": "Assign variable",
                            "func": () =>
                            {
                                gui.setStateUnsaved();
                                port.setVariable("unknown");
                                port.parent.refreshParams();
                            }
                        },
                        {
                            "title": "Set animated",
                            "func": () =>
                            {
                                gui.setStateUnsaved();
                                el = ele.byId("portanim_in_" + index);
                                if (el)el.dispatchEvent(new Event("click"));
                            }
                        }
                    ] }, e.target);
        });

        el = ele.byId("portanim_in_" + index);
        if (el)el.addEventListener("click", (e) =>
        {
            const targetState = !el.classList.contains("timingbutton_active");
            const elVal = ele.byId("portval_" + index);

            gui.setStateUnsaved();
            CABLES.UI.paramsHelper.setPortAnimated(op, index, targetState, elVal.value);
            gui.emitEvent("portValueSetAnimated", op, index, targetState, elVal.value);
        });
    },

    "setPortAnimated": (op, index, targetState, defaultValue) =>
    {
        const isOpen = gui.patchView.getSelectedOps()[0] ? op.id === gui.patchView.getSelectedOps()[0].id : false;

        const elVal = ele.byId("portval_" + index);

        if (!targetState)
        {
            const val = gui.timeLine().removeAnim(op.portsIn[index].anim);
            op.portsIn[index].setAnimated(false);

            gui.timeLine().setAnim(null);

            if (isOpen && elVal)
            {
                elVal.value = val;
                elVal.dispatchEvent(new Event("input"));
                elVal.focus();
            }

            op.portsIn[index].parent.refreshParams();
            return;
        }

        const portAnimEle = ele.byId("portanim_in_" + index);
        if (isOpen && portAnimEle) portAnimEle.classList.add("timingbutton_active");

        op.portsIn[index].toggleAnim();
        const animOptions = {
            "opid": op.id,
            "name": op.getTitle() + ": " + op.portsIn[index].name,
            "defaultValue": defaultValue
        };
        gui.timeLine().setAnim(op.portsIn[index].anim, animOptions);
        op.portsIn[index].parent.refreshParams();
    },

    "openParamStringEditor": (opid, portname, cb, userInteraction) =>
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op) return console.warn("paramedit op not found", opid);
        CABLES.editorSession.startLoadingTab();

        const port = op.getPortByName(portname);
        if (!port) return console.warn("paramedit port not found", portname);

        let name = op.name + " " + port.name;

        name = gui.mainTabs.getUniqueTitle(name);

        const dataId = opid + portname;
        const existingTab = gui.mainTabs.getTabByDataId(dataId);
        if (existingTab)
        {
            gui.mainTabs.activateTabByName(existingTab.title);
            gui.maintabPanel.show(userInteraction);
            return;
        }

        const editorObj = CABLES.editorSession.rememberOpenEditor("param", name, { "opid": opid, "portname": portname });

        if (editorObj)
        {
            new EditorTab(
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
                        setStatus("updated " + port.name);
                        gui.setStateUnsaved();
                        gui.jobs().finish("saveeditorcontent");
                        port.set(content);
                        gui.emitEvent("portValueEdited", op, port, content);
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
        else gui.maintabPanel.show(userInteraction);


        CABLES.editorSession.finishLoadingTab();
    },


    "initPortInputListener": (op, index) =>
    {
        if (!CABLES.UI.mathparser)CABLES.UI.mathparser = new MathParser();
        CABLES.UI.paramsHelper.checkDefaultValue(op, index);

        // added missing math constants
        CABLES.UI.mathparser.add("pi", function (n, m) { return Math.PI; });

        const eleId = "portval_" + index;

        if (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == "number" || op.portsIn[index].uiAttribs.type == "int")
        {
            const el = ele.byId(eleId);

            if (el)el.addEventListener("keypress", (e) =>
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
                            mathParsed = e.target.value || 0;
                        }
                        e.target.value = mathParsed;
                        op.portsIn[index].set(mathParsed);
                        CABLES.UI.hideToolTip();
                    }
                }
            });
        }

        const el = ele.byId(eleId);

        if (el) el.addEventListener("input", (e) =>
        {
            let v = "" + el.value;

            gui.setStateUnsaved();

            if (
                op.portsIn[index].uiAttribs.display != "bool" &&
                (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == "number"))
            {
                if (v.length >= 3 && (isNaN(v) || v === ""))
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
                        el.classList.remove("invalid");
                    }
                    else
                    {
                        el.classList.add("invalid");
                        // console.log("invalid number", op.portsIn[index], mathParsed);
                    }
                    return;
                }
                else
                {
                    el.classList.remove("invalid");
                    v = parseFloat(v) || 0;
                }
            }

            if (op.portsIn[index].uiAttribs.type == "int")
            {
                if (isNaN(v) || v === "")
                {
                    el.classList.add("invalid");
                    return;
                }
                else
                {
                    el.classList.remove("invalid");
                    v = parseInt(v, 10) || 0;
                    // console.log("invalid int");
                }
            }

            if (op.portsIn[index].uiAttribs.display == "bool")
            {
                if (!v || v == "false" || v == "0" || v == 0) v = false;
                else v = true;

                el.value = v;
            }

            if (!CABLES.mouseDraggingValue)
            {
                const undoAdd = (function (oldv, newv, opid, portname)
                {
                    if (oldv != newv)
                        undo.add({
                            "title": "Value change " + oldv + " to " + newv,
                            undo()
                            {
                                try
                                {
                                    const uop = gui.corePatch().getOpById(opid);
                                    const p = uop.getPort(portname);
                                    gui.patchView.showDefaultPanel();

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
                                    gui.patchView.showDefaultPanel();

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

            op.portsIn[index].set(v || 0);

            // update history on change
            if (!op.uiAttribs) op.uiAttribs = {};
            if (!op.uiAttribs.history) op.uiAttribs.history = {};
            op.uiAttribs.history.lastInteractionAt = Date.now();
            op.uiAttribs.history.lastInteractionBy = {
                "name": gui.user.usernameLowercase
            };

            CABLES.UI.paramsHelper.checkDefaultValue(op, index);
            if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();

            gui.emitEvent("portValueEdited", op, op.portsIn[index], v);
        });
    }


};


export default paramsHelper;
