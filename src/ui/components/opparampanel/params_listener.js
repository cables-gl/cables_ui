import ele from "../../utils/ele";
import undo from "../../utils/undo";
import EditorTab from "../tabs/tab_editor";


class ParamsListener extends CABLES.EventTarget
{
    constructor(paramPanel)
    {
        super();

        this._paramPanel = paramPanel;
    }

    valueChangerInitSliders()
    {
        const els = document.querySelectorAll(".valuesliderinput input");
        for (let i = 0; i < els.length; i++)
        {
            const v = els[i].value;
            CABLES.UI.paramsHelper.valueChangerSetSliderCSS(v, els[i].parentElement);
        }
    }

    emitChangeEvent(port)
    {
        gui.emitEvent("paramsChangedUserInteraction", { "port": port, "panelId": this.panelId });
    }


    togglePortValBool(which, checkbox)
    {
        gui.setStateUnsaved();
        const inputEle = document.getElementById(which);
        const checkBoxEle = document.getElementById(checkbox);

        let bool_value = inputEle.value == "true";
        bool_value = !bool_value;

        checkBoxEle.parentElement.classList.remove("checkbox-inactive");
        checkBoxEle.parentElement.classList.remove("checkbox-active");

        if (bool_value) checkBoxEle.parentElement.classList.add("checkbox-active");
        else checkBoxEle.parentElement.classList.add("checkbox-inactive");

        inputEle.value = bool_value;
        inputEle.dispatchEvent(new Event("input"));
    }

    watchColorPickerPort(thePort, panelid, idx)
    {
        const inputElements =
        [
            ele.byId("portval_" + idx + "_" + panelid),
            ele.byId("portval_" + (idx + 1) + "_" + panelid),
            ele.byId("portval_" + (idx + 2) + "_" + panelid)
        ];

        if (!inputElements[0] || !inputElements[1] || !inputElements[2])
        {
            console.log("NOPEY", "portval_" + idx + "_" + panelid, ele.byId("portval_" + idx + "_" + panelid));
            return;
        }

        const getCurrentColor = () =>
        {
            return [
                Math.round(255 * parseFloat(inputElements[0].value)),
                Math.round(255 * parseFloat(inputElements[1].value)),
                Math.round(255 * parseFloat(inputElements[2].value))];
        };


        const id = "watchcolorpick_in_" + idx + "_" + panelid;
        const colEle = ele.byId(id);

        if (!colEle)
        {
            console.log("color ele not found!", id);
            return;
        }

        const updateColorBox = () =>
        {
            colEle.style.backgroundColor = chroma(getCurrentColor()).hex();
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

                    ele.byId("numberinputDisplay_in_" + idx + "_" + panelid).innerHTML =
                    inputElements[0].value = glRgb[0];

                    ele.byId("numberinputDisplay_in_" + (idx + 1) + "_" + panelid).innerHTML =
                    inputElements[1].value = glRgb[1];

                    ele.byId("numberinputDisplay_in_" + (idx + 2) + "_" + panelid).innerHTML =
                    inputElements[2].value = glRgb[2];

                    inputElements[0].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                    inputElements[1].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                    inputElements[2].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                },
                "onStart": () =>
                {
                    undoGroup = undo.startGroup();
                },
                "onEnd": () =>
                {
                    inputElements[0].dispatchEvent(new Event("input"));
                    inputElements[1].dispatchEvent(new Event("input"));
                    inputElements[2].dispatchEvent(new Event("input"));
                    undo.endGroup(undoGroup, "Change Color");
                },
            });
        });
    }


    initPortClickListener(op, index, panelid)
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

        if (ele.byId("portspreadsheet_in_" + index + "_" + panelid))
            ele.byId("portspreadsheet_in_" + index + "_" + panelid).addEventListener("click", function (e)
            {
                const thePort = op.portsIn[index];

                CABLES.UI.paramsHelper.openParamSpreadSheetEditor(op.id, op.portsIn[index].name);
            });


        // /////////////////////
        //
        // input text editor tab
        //

        let el = ele.byId("portedit_in_" + index + "_" + panelid);
        if (el) el.addEventListener("click", () =>
        {
            const thePort = op.portsIn[index];
            CABLES.UI.paramsHelper.openParamStringEditor(op.id, op.portsIn[index].name, null, true);
        });

        // /////////////////////
        //
        // input button click!!!!
        //
        el = ele.byId("portbutton_" + index + "_" + panelid);
        if (el) el.addEventListener("click", function (e)
        {
            op.portsIn[index]._onTriggered();
        });

        if (op.portsIn[index].uiAttribs.display === "buttons")
        {
            for (let i = 0; i < op.portsIn[index].value.length; i++)
            {
                let eli = ele.byId("portbutton_" + index + "_" + panelid + "_" + i);
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
            const elVal = ele.byId("portval_" + index + "_" + panelid);

            gui.setStateUnsaved();
            CABLES.UI.paramsHelper.setPortAnimated(op, index, panelid, targetState, elVal.value);
            gui.emitEvent("portValueSetAnimated", op, index, targetState, elVal.value);
        });
    }

    setPortAnimated(op, index, panelid, targetState, defaultValue)
    {
        const isOpen = gui.patchView.getSelectedOps()[0] ? op.id === gui.patchView.getSelectedOps()[0].id : false;

        const elVal = ele.byId("portval_" + index + "_" + panelid);

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
    }

    initPortInputListener(op, index, panelid)
    {
        if (!CABLES.UI.mathparser)CABLES.UI.mathparser = new MathParser();
        CABLES.UI.paramsHelper.checkDefaultValue(op, index, panelid);

        // added missing math constants
        CABLES.UI.mathparser.add("pi", function (n, m) { return Math.PI; });

        const eleId = "portval_" + index + "_" + panelid;

        // if (op.portsIn[index].uiAttribs.type == "string")
        // {
        //     console.log("yes string...");

        //     // el.addEventListener("keydown", tabKeyListener);
        // }

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
                            "context": {
                                portname
                            },
                            undo()
                            {
                                try
                                {
                                    const uop = gui.corePatch().getOpById(opid);
                                    const p = uop.getPort(portname);
                                    gui.patchView.showDefaultPanel();

                                    p.set(oldv);
                                    gui.emitEvent("portValueEdited", op, p, oldv);

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
                                    gui.emitEvent("portValueEdited", op, p, newv);
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


            if (op.portsIn[index].uiAttribs.type == "string")op.portsIn[index].set(v || "");
            else op.portsIn[index].set(v || 0);

            // update history on change
            if (!op.uiAttribs) op.uiAttribs = {};
            if (!op.uiAttribs.history) op.uiAttribs.history = {};
            op.uiAttribs.history.lastInteractionAt = Date.now();
            op.uiAttribs.history.lastInteractionBy = {
                "name": gui.user.usernameLowercase
            };

            CABLES.UI.paramsHelper.checkDefaultValue(op, index, panelid);
            if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();

            if (!e.detail || !e.detail.ignorePaco)
            {
                gui.emitEvent("portValueEdited", op, op.portsIn[index], v);
            }
        });
    }
}


export default ParamsListener;
