import { ele, Events } from "cables-shared-client";
import ModalDialog from "../../dialogs/modaldialog.js";
import gluiconfig from "../../glpatch/gluiconfig.js";
import undo from "../../utils/undo.js";
import userSettings from "../usersettings.js";
import paramsHelper from "./params_helper.js";
import WatchPortVisualizer from "./watchportvisualizer.js";
import subPatchOpUtil from "../../subpatchop_util.js";
import defaultOps from "../../defaultops.js";


/**
 *listen to user interactions with ports in {@link OpParampanel}
 *
 * @class ParamsListener
 * @extends {Events}
 */
class ParamsListener extends Events
{
    constructor(panelid)
    {
        super();
        this.panelId = panelid;

        this._watchPorts = [];
        this._watchAnimPorts = [];
        this._watchColorPicker = [];
        this._watchStrings = [];
        this._portsIn = [];
        this._portsOut = [];
        this._doFormatNumbers = !(userSettings.get("notlocalizeNumberformat") || false);
        this._watchPortVisualizer = new WatchPortVisualizer();

        this._updateWatchPorts();
    }

    init(options)
    {
        this.removePorts();

        if (options.op)
        {
            this._portsIn = options.op.portsIn;
            this._portsOut = options.op.portsOut;
        }
        else
        {
            this._portsIn = options.portsIn || [];
            this._portsOut = options.portsOut || [];
        }

        if (this._portsIn.length > 0)
        {
            for (let i = 0; i < this._portsIn.length; i++)
            {
                if (this._portsIn[i].getType() == CABLES.OP_PORT_TYPE_STRING) this._watchStrings.push(this._portsIn[i]);
                if (this._portsIn[i].uiAttribs.colorPick) this._watchColorPicker.push(this._portsIn[i]);
                if (this._portsIn[i].isLinked() || this._portsIn[i].isAnimated()) this._watchPorts.push(this._portsIn[i]);
                this._watchAnimPorts.push(this._portsIn[i]);
            }
        }

        if (this._portsOut.length > 0)
        {
            for (const i in this._portsOut)
            {
                if (
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_VALUE ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_ARRAY ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_STRING ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_OBJECT) this._watchPorts.push(this._portsOut[i]);
            }
        }

        for (let i = 0; i < this._portsIn.length; i++) this.initPortClickListener(this._portsIn, i, this.panelId, "in");
        for (let i = 0; i < this._portsOut.length; i++) this.initPortClickListener(this._portsOut, i, this.panelId, "out");

        for (let i = 0; i < this._portsIn.length; i++)
        {
            ((index) =>
            {
                const elm = ele.byId("portdelete_in_" + index);
                if (elm)elm.addEventListener("click", (e) =>
                {
                    this._portsIn[index].removeLinks();
                    gui.opParams.show(this._portsIn[index].op);
                });
            })(i);
        }

        for (let i = 0; i < this._portsIn.length; i++) this.initPortInputListener(this._portsIn, i, this.panelId);



        function addListenersMultiport(port)
        {
            const elToggle = ele.byId("multiport_toggleauto_" + port.op.id + "_" + port.name);
            if (elToggle)elToggle.addEventListener("click", () =>
            {
                port.toggleManual();
            });
            else console.log("cant find multiport");


            const elInc = ele.byId("multiport_inc_" + port.op.id + "_" + port.name);
            if (elInc)elInc.addEventListener("click", () =>
            {
                port.incDec(1);
            });

            const elDec = ele.byId("multiport_dec_" + port.op.id + "_" + port.name);
            if (elDec)elDec.addEventListener("click", () =>
            {
                port.incDec(-1);
            });
        }

        for (let i = 0; i < this._portsIn.length; i++)
            if (this._portsIn[i].uiAttribs.multiPort)
                addListenersMultiport(this._portsIn[i]);

        for (let i = 0; i < this._portsOut.length; i++)
            if (this._portsOut[i].uiAttribs.multiPort)
                addListenersMultiport(this._portsOut[i]);


        // watch anim ports... this should be in initPOrtInputListener !!
        for (const iwap in this._watchAnimPorts)
        {
            const thePort = this._watchAnimPorts[iwap];
            (function (_thePort, panelid)
            {
                const id = "watchPortValue_" + _thePort.watchId + "_" + panelid;
                const elm = ele.byClass(id);
                if (elm)elm.addEventListener("focus", () =>
                {
                    if (_thePort.isAnimated())
                    {
                        gui.timeLine().setAnim(_thePort.anim, {
                            "opid": _thePort.op.id,
                            "name": _thePort.op.getTitle() + ": " + _thePort.name,
                        });
                    }
                });
            }(thePort, this.panelId));
        }

        for (const iwcp in this._watchColorPicker)
        {
            const thePort2 = this._watchColorPicker[iwcp];
            const idx = this._portsIn.indexOf(thePort2);
            this.watchColorPickerPort(thePort2, this.panelId, idx);
        }

        this.valueChangerInitSliders();

        this._watchPortVisualizer.bind();
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

    // togglePortValBool(which, checkbox)
    // {
    //     console.log("HJSAHJKLSHJKLS");
    //     // gui.setStateUnsaved();
    //     gui.savedState.setUnSaved("togglePortValBool");

    //     const inputEle = document.getElementById(which);
    //     const checkBoxEle = document.getElementById(checkbox);

    //     let bool_value = inputEle.value == "true";
    //     bool_value = !bool_value;

    //     checkBoxEle.opElement.classList.remove("checkbox-inactive");
    //     checkBoxEle.opElement.classList.remove("checkbox-active");

    //     if (bool_value) checkBoxEle.opElement.classList.add("checkbox-active");
    //     else checkBoxEle.opElement.classList.add("checkbox-inactive");

    //     inputEle.value = bool_value;
    //     inputEle.dispatchEvent(new Event("input"));
    // }

    watchColorPickerPort(thePort, panelid, idx)
    {
        let foundOpacity = false;
        const inputElements =
        [
            ele.byId("portval_" + idx + "_" + panelid),
            ele.byId("portval_" + (idx + 1) + "_" + panelid),
            ele.byId("portval_" + (idx + 2) + "_" + panelid)
        ];
        const eleA = ele.byId("portval_" + (idx + 3) + "_" + panelid);
        if (eleA && eleA.dataset.portname && eleA.dataset.portname.toLowerCase() == "a")
        {
            inputElements.push(ele.byId("portval_" + (idx + 3) + "_" + panelid));
            foundOpacity = true;
        }

        if (!inputElements[0] || !inputElements[1] || !inputElements[2])
        {
            // console.log("NOPEY", "portval_" + idx + "_" + panelid, ele.byId("portval_" + idx + "_" + panelid));
            return;
        }

        const getCurrentColor = () =>
        {
            const arr = [
                Math.round(255 * parseFloat(inputElements[0].value)),
                Math.round(255 * parseFloat(inputElements[1].value)),
                Math.round(255 * parseFloat(inputElements[2].value))];

            // if (inputElements[3])arr.push(inputElements[3].value);
            return arr;
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
            let opacity = 1;
            if (inputElements[3])opacity = inputElements[3].value;

            const cr = new ColorRick({
                "ele": colEle,
                "showOpacity": foundOpacity,
                "color": getCurrentColor(), // "#ffffff",
                "opacity": opacity,
                "onChange": (col, _opacity) =>
                {
                    updateColorBox();
                    const glRgb = col.gl();

                    const elR = ele.byId("numberinputDisplay_in_" + idx + "_" + panelid);
                    const elG = ele.byId("numberinputDisplay_in_" + (idx + 1) + "_" + panelid);
                    const elB = ele.byId("numberinputDisplay_in_" + (idx + 2) + "_" + panelid);
                    const elA = ele.byId("numberinputDisplay_in_" + (idx + 3) + "_" + panelid);

                    if (elR)elR.innerHTML = inputElements[0].value = glRgb[0];
                    if (elG)elG.innerHTML = inputElements[1].value = glRgb[1];
                    if (elB)elB.innerHTML = inputElements[2].value = glRgb[2];
                    if (elA && inputElements[3])elA.innerHTML = inputElements[3].value = _opacity;

                    inputElements[0].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                    inputElements[1].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                    inputElements[2].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
                    if (inputElements[3])inputElements[3].dispatchEvent(new CustomEvent("input", { "detail": { "ignorePaco": true } }));
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


    initPortClickListener(ports, index, panelid, dirStr)
    {
        const thePort = ports[index];

        if (ele.byId("portTitle_" + dirStr + "_" + index))
            ele.byId("portTitle_" + dirStr + "_" + index).addEventListener("click", function (e)
            {
                const p = ports[index];
                if (!p.uiAttribs.hidePort)
                    gui.opSelect().show(
                        {
                            "x": p.op.uiAttribs.translate.x + (index * (gluiconfig.portWidth + gluiconfig.portPadding)),
                            "y": p.op.uiAttribs.translate.y - 50,
                        }, thePort.op, p);
            });

        if (ele.byId("portCreateOp_" + dirStr + "_" + index))
            ele.byId("portCreateOp_" + dirStr + "_" + index).addEventListener("click", function (e)
            {
                if (thePort.objType && thePort.objType.indexOf("sg_"))
                {
                    gui.corePatch().addOp("Ops.Team.ShaderGraph.Input", {}, function (newop)
                    {
                        gui.corePatch().link(thePort.op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
                    });
                }
                if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE)
                {
                    gui.corePatch().addOp(CABLES.UI.DEFAULTOPNAMES.defaultOpImage, {}, function (newop)
                    {
                        gui.corePatch().link(thePort.op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
                    });
                }
            });

        if (ele.byId("portspreadsheet_" + dirStr + "_" + index + "_" + panelid))
            ele.byId("portspreadsheet_" + dirStr + "_" + index + "_" + panelid).addEventListener("click", function (e)
            {
                CABLES.UI.paramsHelper.openParamSpreadSheetEditor(thePort.op.id, thePort.name);
            });

        // /////////////////////
        //
        // input text editor tab
        //
        let el = ele.byId("portedit_" + dirStr + "_" + index + "_" + panelid);
        if (el) el.addEventListener("click", () =>
        {
            CABLES.UI.paramsHelper.openParamStringEditor(thePort.op.id, thePort.name, null, true);
        });

        // /////////////////////
        //
        // input button click!!!!
        //
        el = ele.byId("portbutton_" + index + "_" + panelid);
        if (el) el.addEventListener("click", (e) =>
        {
            thePort._onTriggered();
        });

        if (ports[index].uiAttribs.display === "buttons")
        {
            for (let i = 0; i < ports[index].value.length; i++)
            {
                let eli = ele.byId("portbutton_" + index + "_" + panelid + "_" + i);
                if (eli)eli.addEventListener("click", (e) =>
                {
                    const name = e.target.dataset.title;
                    ports[index]._onTriggered(name);
                });
            }
        }

        //

        // el = ele.byId("portgraph_" + dirStr + "_" + index);
        // if (el)el.addEventListener("click", function (e)
        // {
        //     if (ports[index].isAnimated())
        //     {
        //         ports[index].anim.stayInTimeline = !ports[index].anim.stayInTimeline;

        //         gui.timeLine().setAnim(ports[index].anim, {
        //             "name": op.getTitle() + ": " + ports[index].name,
        //             "opid": op.id,
        //             "defaultValue": parseFloat(ele.byId("portval_" + index).value)
        //         });
        //     }
        // });

        el = ele.byId("portsetvar_" + index);
        if (el)el.addEventListener("input", (e) =>
        {
            const port = ports[index].op.getPortById(e.target.dataset.portid);

            if (port) port.setVariable(e.target.value);
            else console.warn("[portsetvar] PORT NOT FOUND!! ", e.target.dataset.portid, e);


            // gui.setStateUnsaved();
            gui.savedState.setUnSaved("initPortClickListener");
        });

        // el = ele.byId("portremovevar_" + index);
        // if (el)el.addEventListener("click", (e) =>
        // {
        //     const port = ports[index].op.getPortById(e.target.dataset.portid);
        //     if (port) port.setVariable(null);
        //     port.op.refreshParams();
        //     gui.setStateUnsaved();
        // });

        el = ele.byId("port_contextmenu_" + dirStr + "_" + index + "_" + panelid);
        if (el) el.addEventListener("click", (e) =>
        {
            const port = thePort;// ports[index].op.getPortById(e.target.dataset.portid);
            if (!thePort) return;

            let items = [];

            if (!port.uiAttribs.display || port.uiAttribs.display != "readonly")
            {
                if (port.type == CABLES.OP_PORT_TYPE_STRING)
                    items.push(
                        {
                            "title": "Create String Op",
                            "func": () =>
                            {
                                gui.savedState.setUnSaved("initPortClickListener");
                                const oldValue = port.get();

                                gui.patchView.addOpAndLink(defaultOps.defaultOpNames.string, port.op.id, port.name, (op) =>
                                {
                                    op.getPort("value").set(oldValue);
                                    op.setTitle(port.getName());

                                    gui.corePatch().link(port.op, port.name, op, op.getFirstOutPortByType(port.type).name);
                                    op.refreshParams();
                                });
                            }
                        });

                if (port.type == CABLES.OP_PORT_TYPE_NUMBER)
                    items.push(
                        {
                            "title": "Create Number Op",
                            "func": () =>
                            {
                                gui.savedState.setUnSaved("initPortClickListener");
                                const oldValue = port.get();

                                gui.patchView.addOpAndLink(defaultOps.defaultOpNames.number, port.op.id, port.name, (op) =>
                                {
                                    op.getPort("value").set(oldValue);
                                    op.setTitle(port.getName());

                                    gui.corePatch().link(port.op, port.name, op, op.getFirstOutPortByType(port.type).name);
                                    op.refreshParams();
                                });
                            }
                        });


                if (
                    port.type != CABLES.OP_PORT_TYPE_FUNCTION &&
                    !port.uiAttribs.expose &&
                    dirStr == "in" &&
                    !port.isAnimated())
                {
                    const item =
                    {
                        "title": "Assign variable",
                        "func": () =>
                        {
                            // gui.setStateUnsaved();
                            gui.savedState.setUnSaved("initPortClickListener");


                            if (port.isBoundToVar()) port.setVariable(null);
                            else port.setVariable("unknown");

                            port.op.refreshParams();
                        }
                    };

                    if (port.isBoundToVar())
                    {
                        item.title = "Remove variable assignment";
                        item.iconClass = "icon icon-x";
                    }

                    items.push(item);
                }
            }


            if (
                port.type == CABLES.OP_PORT_TYPE_VALUE &&
                !port.uiAttribs.expose &&
                !port.isBoundToVar() &&
                dirStr == "in")
            {
                let title = "Animate Parameter";
                let icon = "";
                if (thePort.isAnimated())
                {
                    title = "Remove Animation";
                    icon = "icon icon-x";
                }
                items.push({
                    "title": title,
                    "iconClass": icon,
                    "func": () =>
                    {
                        // gui.setStateUnsaved();
                        gui.savedState.setUnSaved("setPortAnimated");

                        CABLES.UI.paramsHelper.setPortAnimated(thePort.op, index, !thePort.isAnimated(), thePort.get());
                    }
                });
            }

            if (port.type == CABLES.OP_PORT_TYPE_STRING || port.type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (port.op.uiAttribs.extendTitlePort == port.name)
                    items.push({
                        "title": "Remove extended title",
                        "iconClass": "icon icon-x",
                        "func": () =>
                        {
                            port.op.setUiAttrib({ "extendTitlePort": null });
                        }
                    });
                else
                    items.push({
                        "title": "Extend title: \"" + port.getTitle() + ": x\"",
                        "func": () =>
                        {
                            port.op.setUiAttrib({ "extendTitlePort": port.name });
                        }
                    });
            }

            // console.log("port.op.uiAttribs",);

            if (port.op.isInBlueprint2() && port.op.objName.indexOf("Ops.Ui.") == -1)
            {
                items.push(
                    {
                        "title": "Subpatch Op: Create Port",
                        "iconClass": "",
                        "func": () =>
                        {
                            const subOuter = gui.patchView.getSubPatchOuterOp(port.op.isInBlueprint2());

                            // console.log("isSavedSubOp", gui.savedState.isSavedSubPatch(port.op.uiAttribs.subPatch));
                            if (!gui.savedState.isSavedSubPatch(port.op.uiAttribs.subPatch))
                            {
                                new ModalDialog({
                                    "showOkButton": true,
                                    "title": "Can't create port",
                                    "text": "You need to save the subPatch before creating a port!"
                                });
                                return;
                            }


                            gui.patchView.unselectAllOps();


                            subPatchOpUtil.addPortToBlueprint(subOuter.opId, port);
                        }
                    });
            }
            // else
            // if (
            //     (gui.patchView.getCurrentSubPatch() != 0 || gui.patchView.getCurrentSubPatch() != port.op.uiAttribs.subPatch) &&
            //     !port.isAnimated())
            // {
            //     let title = "Subpatch Expose Port ";
            //     let icon = "";
            //     if (port.uiAttribs.expose)
            //     {
            //         title = "Subpatch Remove Exposed Port";
            //         icon = "icon icon-x";
            //     }

            //     items.push(
            //         {
            //             "title": title,
            //             "iconClass": icon,
            //             "func": () =>
            //             {
            //                 const subOp = gui.patchView.getSubPatchOuterOp(port.op.uiAttribs.subPatch);

            //                 if (!subOp)
            //                 { console.error("could not find subpatchop!!!!!!!", port.op.uiAttribs.subPatch); }

            //                 port.removeLinks();

            //                 subOp.removePort(port);
            //                 port.setUiAttribs({ "expose": !port.uiAttribs.expose });
            //                 port.op.refreshParams();

            //                 gui.savedState.setUnSaved("Subpatch Expose Port", port.op.uiAttribs.subPatch);
            //             }
            //         });
            // }

            if (port.uiAttribs.expose)
            {
                // items.push(
                //     {
                //         "title": "Exposed Port: move up",
                //         "iconClass": "icon icon-chevron-up",
                //         "func": () =>
                //         {
                //             gui.patchView.setExposedPortOrder(port, -1);
                //         }
                //     });
                // items.push(
                //     {
                //         "title": "Exposed Port: move down",
                //         "iconClass": "icon icon-chevron-down",
                //         "func": () =>
                //         {
                //             gui.patchView.setExposedPortOrder(port, 1);
                //         }
                //     });
            }

            let strEditTitle = "Edit title";
            let icon = "";
            if (port.uiAttribs.title)
            {
                strEditTitle = "Remove Custom title";
                icon = "icon icon-x";
            }
            items.push(
                {
                    "title": strEditTitle,
                    "iconClass": icon,
                    "func": () =>
                    {
                        if (port.uiAttribs.title)
                        {
                            port.setUiAttribs({ "title": null });
                            gui.opParams.show(port.op.id);
                        }
                        else gui.patchView.setPortTitle(port.op.id, port.name, port.title);
                    }
                });


            CABLES.contextMenu.show({ "items": items }, e.target);
        });
        else console.log("contextmenu ele not found...", dirStr + "_" + panelid + "_" + index);
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

            op.portsIn[index].op.refreshParams();
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
        op.portsIn[index].op.refreshParams();
    }

    initPortInputListener(ports, index, panelid)
    {
        if (!CABLES.UI.mathparser)CABLES.UI.mathparser = new MathParser();
        CABLES.UI.paramsHelper.checkDefaultValue(ports[index], index, panelid);

        // added missing math constants
        CABLES.UI.mathparser.add("pi", function (n, m) { return Math.PI; });

        const eleId = "portval_" + index + "_" + panelid;

        // if (op.portsIn[index].uiAttribs.type == "string")
        // {
        //     console.log("yes string...");

        //     // el.addEventListener("keydown", tabKeyListener);
        // }

        if (!ports[index].uiAttribs.type || ports[index].uiAttribs.type == "number" || ports[index].uiAttribs.type == "int")
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

                        ports[index].set(mathParsed);
                        CABLES.UI.hideToolTip();
                    }
                }
            });
        }

        const el = ele.byId(eleId);

        if (el) el.addEventListener("input", (e) =>
        {
            let v = "" + el.value;

            // gui.setStateUnsaved();
            gui.savedState.setUnSaved("paramsInput");


            if (
                ports[index].uiAttribs.display != "bool" &&
                (!ports[index].uiAttribs.type || ports[index].uiAttribs.type == "number"))
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
                        // console.log("invalid number", ports[index], mathParsed);
                    }
                    return;
                }
                else
                {
                    el.classList.remove("invalid");
                    v = parseFloat(v) || 0;
                }
            }


            if (ports[index].uiAttribs.type == "int")
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
                }(ports[index].get(), v, ports[index].op.id, ports[index].name));
            }


            if (ports[index].uiAttribs.type == "string")
            {
                if (v && ports[index].uiAttribs.stringTrim)v = String(v).trim();
                if ((v || v == "") && v.length < ports[index].uiAttribs.minLength)
                {
                    ports[index].op.setUiError("uiminlength", "User Input: Minimum length of string " + ports[index].title + " is " + ports[index].uiAttribs.minLength, 2);
                }
                else ports[index].op.setUiError("uiminlength", null);

                ports[index].set(v || "");
            }
            else if (ports[index].uiAttribs.display == "bool")
            {
                if (!v || v == "false" || v == "0" || v == 0) v = false;
                else v = true;

                ports[index].set(v ? 1 : 0);
            }
            else
            {
                ports[index].set(v || 0);
            }



            if (ports[index].op.storage && ports[index].op.storage.ref)
            {
                const ops = ports[index].op.patch.getOpsByRefId(ports[index].op.storage.ref);
                for (let i = 0; i < ops.length; i++)
                {
                    const p = ops[i].getPort(ports[index].name);
                    p.set(v || 0);
                }
            }



            const op = ports[index].op;
            // update history on change
            if (op && !op.uiAttribs) op.uiAttribs = {};
            if (op && !op.uiAttribs.history) op.uiAttribs.history = {};

            if (op)
            {
                op.uiAttribs.history.lastInteractionAt = Date.now();
                op.uiAttribs.history.lastInteractionBy = { "name": gui.user.usernameLowercase };
            }

            CABLES.UI.paramsHelper.checkDefaultValue(ports[index], index, panelid);
            if (ports[index].isAnimated()) gui.timeLine().scaleHeightDelayed();

            ports[index].emitEvent("onValueChangeUi");

            if (!e.detail || !e.detail.ignorePaco)
            {
                gui.emitEvent("portValueEdited", op, ports[index], v);
            }
        });
    }

    _updateWatchPorts()
    {
        if (this._watchPorts.length)
        {
            const perf = CABLES.UI.uiProfiler.start("[opparampanel] watch ports");

            for (let i = 0; i < this._watchPorts.length; i++)
            {
                const thePort = this._watchPorts[i];

                if (thePort.type != CABLES.OP_PORT_TYPE_VALUE && thePort.type != CABLES.OP_PORT_TYPE_STRING && thePort.type != CABLES.OP_PORT_TYPE_ARRAY && thePort.type != CABLES.OP_PORT_TYPE_OBJECT) continue;

                let newValue = "";
                const id = "watchPortValue_" + thePort.watchId + "_" + this.panelId;

                if (thePort.isAnimated())
                {
                    thePort._tempLastUiValue = thePort.get();
                    const valDisp = thePort.getValueForDisplay();


                    // hier
                    if (thePort.type == CABLES.OP_PORT_TYPE_VALUE)
                    {
                        const elVal = ele.byClass(id);

                        if (elVal && elVal != document.activeElement)
                            if (parseFloat(elVal.value) != parseFloat(valDisp)) elVal.value = valDisp;
                            else if (elVal.value != valDisp) elVal.value = valDisp;

                        const elDisp = ele.byId("numberinputDisplay_" + thePort.watchId + "_" + this.panelId);
                        if (elDisp) elDisp.innerHTML = valDisp;
                    }
                }
                if (thePort.type == CABLES.OP_PORT_TYPE_VALUE)
                {
                    if (thePort.uiAttribs.display == "boolnum")
                    {
                        if (thePort.get() === 0)newValue = "0 - false";
                        else if (thePort.get() === 1)newValue = "1 - true";
                        else newValue = "invlaid bool value! " + thePort.get();
                        // if (!v || v == "false" || v == "0" || v == 0) v = false;
                        // else v = true;
                    }
                    else
                        newValue = this._formatNumber(thePort.getValueForDisplay());
                }
                else if (thePort.type == CABLES.OP_PORT_TYPE_ARRAY)
                {
                    let name = "Array";
                    if (thePort.uiAttribs.stride)name += thePort.uiAttribs.stride;
                    if (thePort.get()) newValue = name + " (" + String(thePort.get().length) + ")";
                    else newValue = name + " (null)";
                }
                else if (thePort.type == CABLES.OP_PORT_TYPE_STRING)
                {
                    const v = thePort.getValueForDisplay();

                    if (v && (typeof v === "string" || v instanceof String)) newValue = "\"" + v + "\"";
                    else newValue = String(v);
                }
                else if (thePort.type == CABLES.OP_PORT_TYPE_OBJECT)
                {
                    if (thePort.get()) newValue = "";
                    else newValue = "null";
                }
                else
                {
                    newValue = String(thePort.get());
                }


                if (thePort._tempLastUiValue != newValue)
                {
                    let el = thePort._tempLastUiEle;
                    if (!el || thePort._tempLastUiEleId != id)
                    {
                        el = document.getElementsByClassName(id);
                        if (el.length > 0)
                        {
                            el = thePort._tempLastUiEle = el[0];
                            thePort._tempLastUiEleId = id;
                        }
                    }

                    if (el)
                    {
                        el.innerHTML = newValue;
                        thePort._tempLastUiValue = newValue;
                    }
                    else
                    {
                        console.log("paramlistener ele unknown", id);
                    }
                }

                for (const iwcp in this._watchColorPicker)
                {
                    const thePort2 = this._watchColorPicker[iwcp];
                    const idx = thePort.op.portsIn.indexOf(thePort2);
                    paramsHelper.updateLinkedColorBoxes(
                        thePort2,
                        thePort.op.portsIn[idx + 1],
                        thePort.op.portsIn[idx + 2],
                        this.panelId,
                        idx);
                }

                this._watchPortVisualizer.update(id, thePort.watchId, thePort.get());
            }

            perf.finish();
        }

        if (CABLES.UI.uiConfig.watchValuesInterval == 0) return;

        setTimeout(this._updateWatchPorts.bind(this), CABLES.UI.uiConfig.watchValuesInterval);
    }

    removePorts()
    {
        for (let i = 0; i < this._watchPorts.length; i++)
        {
            delete this._watchPorts[i]._tempLastUiValue;
            delete this._watchPorts[i]._tempLastUiEle;
            delete this._watchPorts[i]._tempLastUiEleId;
        }

        this._watchPorts.length = 0;
        this._watchAnimPorts.length = 0;
        this._watchColorPicker.length = 0;
        this._watchStrings.length = 0;
    }

    _formatNumber(n)
    {
        const options = { "useGrouping": false, "maximumSignificantDigits": 16 };
        n = n || 0;
        if (this._doFormatNumbers) return n.toLocaleString("fullwide", options);
        else return String(n);
    }
}


export default ParamsListener;
