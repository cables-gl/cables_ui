import paramsHelper from "./params_helper";
import { getHandleBarHtml } from "../../utils/handlebars";
import Logger from "../../utils/logger";
import WatchPortVisualizer from "./watchPortVisualizer";
import text from "../../text";
import ele from "../../utils/ele";
import { PortHtmlGenerator } from "./op_params_htmlgen";

class OpParampanel extends CABLES.EventTarget
{
    constructor(eleid)
    {
        super();

        console.log("experimental parampanel branch!");

        this.panelId = CABLES.simpleId();
        this._eleId = eleid;
        this._log = new Logger("OpParampanel");
        this._htmlGen = new PortHtmlGenerator(this.panelId);

        this._watchPorts = [];
        this._watchAnimPorts = [];
        this._watchColorPicker = [];
        this._watchStrings = [];

        this._currentOp = null;
        this._eventPrefix = CABLES.uuid();
        this._isPortLineDragDown = false;
        this._watchPortVisualizer = new WatchPortVisualizer();

        this._portsIn = [];
        this._portsOut = [];

        this._updateWatchPorts();
    }

    setParentElementId(eleid)
    {
        this._eleId = eleid;
    }

    dispose()
    {
        this._stopListeners();
        this._watchPorts.length = 0;
    }

    clear()
    {
        this._stopListeners();
        this._currentOp = null;
    }

    refresh()
    {
        this.show(this._currentOp);
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

    _onUiAttrChangeOp(attr)
    {
        if (attr.hasOwnProperty("uierrors")) this.updateUiErrors();
    }

    _onUiAttrChangePort(attr, port)
    {
        if (!attr) return;
        if (attr.hasOwnProperty("greyout")) this.refreshDelayed();
        // todo: only update this part of the html
    }

    _stopListeners(op)
    {
        op = op || this._currentOp;
        if (!op) return;

        this.onOpUiAttrChange = op.off(this.onOpUiAttrChange);

        for (let i = 0; i < this._portsIn.length; i++) this._portsIn[i].off(this._eventPrefix);
    }

    _startListeners(op)
    {
        if (!op)
        {
            this._stopListeners();
            return;
        }

        this.onOpUiAttrChange = op.on("onUiAttribsChange", this._onUiAttrChangeOp.bind(this));
        for (let i = 0; i < this._portsIn.length; i++)
        {
            this._portsIn[i].on("onUiAttrChange", this._onUiAttrChangePort.bind(this), this._eventPrefix);
        }
    }

    refreshDelayed()
    {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = setTimeout(() =>
        {
            this.show(this._currentOp);
        }, 50);
    }

    show(op)
    {
        const perf = CABLES.UI.uiProfiler.start("[opparampanel] show");

        if (typeof op == "string") op = gui.corePatch().getOpById(op);

        if (!gui.showingtwoMetaPanel && gui.metaTabs.getActiveTab().title != "op")
            gui.metaTabs.activateTabByName("op");

        if (this._currentOp != op)
        {
            if (this._currentOp) this._stopListeners();
            this._startListeners(op);
        }

        this._currentOp = op;

        if (!op)
        {
            this.removePorts();
            return;
        }

        this._portsIn = op.portsIn;
        this._portsOut = op.portsOut;

        op.emitEvent("uiParamPanel");
        // if (op.id != self._oldOpParamsId)
        // {
        //     if (gui.fileManager) gui.fileManager.setFilePort(null);
        //     self._oldOpParamsId = op.id;
        // }

        const perfHtml = CABLES.UI.uiProfiler.start("[opparampanel] build html ");

        gui.opHistory.push(op.id);
        gui.setTransformGizmo(null);

        this.emitEvent("opSelected", op);

        op.isServerOp = gui.serverOps.isServerOp(op.objName);

        // show first anim in timeline
        // if (self.timeLine)
        // {
        //     let foundAnim = false;
        //     for (let i = 0; i < this._portsIn.length; i++)
        //     {
        //         if (this._portsIn[i].isAnimated())
        //         {
        //             self.timeLine.setAnim(this._portsIn[i].anim, {
        //                 "name": this._portsIn[i].name,
        //             });
        //             foundAnim = true;
        //             continue;
        //         }
        //     }
        //     if (!foundAnim) self.timeLine.setAnim(null);
        // }

        this.removePorts();

        let html = this._htmlGen.getHtmlOpHeader(op);

        gui.showInfo(text.patchSelectedOp);

        if (this._portsIn.length > 0)
        {
            const perfLoop = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP IN");
            html += this._htmlGen.getHtmlHeaderPorts("in", "input");
            html += this._htmlGen.getHtmlInputPorts(this._portsIn);

            for (let i = 0; i < this._portsIn.length; i++)
            {
                if (this._portsIn[i].getType() == CABLES.OP_PORT_TYPE_STRING) this._watchStrings.push(this._portsIn[i]);
                if (this._portsIn[i].uiAttribs.colorPick) this._watchColorPicker.push(this._portsIn[i]);
                if (this._portsIn[i].isLinked() || this._portsIn[i].isAnimated()) this._watchPorts.push(this._portsIn[i]);
                this._watchAnimPorts.push(this._portsIn[i]);
            }
            perfLoop.finish();
        }

        if (this._portsOut.length > 0)
        {
            html += this._htmlGen.getHtmlHeaderPorts("out", "output");

            const perfLoopOut = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP OUT");

            html += this._htmlGen.getHtmlOutputPorts(this._portsOut);

            for (const i in this._portsOut)
            {
                if (
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_VALUE ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_ARRAY ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_STRING ||
                    this._portsOut[i].getType() == CABLES.OP_PORT_TYPE_OBJECT) this._watchPorts.push(this._portsOut[i]);
            }
            perfLoopOut.finish();
        }

        html += getHandleBarHtml("params_op_foot", {
            "op": op,
            "opserialized": op.getSerialized(),
            "user": gui.user,
        });

        const el = document.getElementById(this._eleId || gui.getParamPanelEleId());

        if (el) el.innerHTML = html;
        else return;

        perfHtml.finish();

        CABLES.UI.paramsHelper.valueChangerInitSliders();

        this.updateUiAttribs();

        for (let i = 0; i < this._portsIn.length; i++)
        {
            if (this._portsIn[i].uiAttribs.display && this._portsIn[i].uiAttribs.display == "file")
            {
                let shortName = String(this._portsIn[i].get() || "none");
                if (shortName.indexOf("/") > -1) shortName = shortName.substr(shortName.lastIndexOf("/") + 1);

                if (ele.byId("portFilename_" + i))
                    ele.byId("portFilename_" + i).innerHTML = "<span class=\"button button-small \" style=\"text-transform:none;\"><span class=\"icon icon-file\"></span>" + shortName + "</span>";
            }

            const f = (e) =>
            {
                if (!this._isPortLineDragDown) return;

                if (gui.patchView._patchRenderer.getOp)
                {
                    const glOp = gui.patchView._patchRenderer.getOp(op.id);

                    if (glOp)
                    {
                        const glPort = glOp.getGlPort(this._portsIn[i].name);

                        if (this._portsIn[i].name == this._portLineDraggedName)
                            gui.patchView._patchRenderer.emitEvent("mouseDownOverPort", glPort, glOp.id, this._portsIn[i].name, e);
                    }
                }
            };

            ele.forEachClass("portCopyClipboard", (ell) =>
            {
                ell.addEventListener("click", (e) =>
                {
                    if (!navigator.clipboard)
                    {
                        return;
                    }

                    const cop = gui.corePatch().getOpById(e.target.dataset.opid);
                    const port = cop.getPortByName(e.target.dataset.portname);

                    navigator.clipboard
                        .writeText(JSON.stringify(port.get()))
                        .then(() =>
                        {
                            CABLES.UI.notify("Copied value to clipboard");
                        })
                        .catch((err) =>
                        {
                            console.warn("copy to clipboard failed", err);
                        });

                    e.preventDefault();
                });
            });

            document.getElementById("portLineTitle_in_" + i).addEventListener("pointerup", () => { this._isPortLineDragDown = false; this._portLineDraggedName = null; });
            document.getElementById("portLineTitle_in_" + i).addEventListener("pointerdown", (e) => { this._isPortLineDragDown = true; this._portLineDraggedName = e.target.dataset.portname; });
            if (document.getElementById("patchviews")) document.getElementById("patchviews").addEventListener("pointerenter", f);
        }

        for (const ipo in this._portsOut)
        {
            this._showOpParamsCbPortDelete(ipo, op);
            (function (index)
            {
                const elem = ele.byId("portTitle_out_" + index);
                if (elem)elem.addEventListener("click", (e) =>
                {
                    const p = this._portsOut[index];
                    if (!p.uiAttribs.hidePort)
                        gui.opSelect().show({ "x": p.parent.uiAttribs.translate.x + index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding), "y": p.parent.uiAttribs.translate.y + 50, }, op, p);
                });
                else this._log.warn("ele not found: portTitle_out_" + index);
            }.bind(this)(ipo));

            document.getElementById("portLineTitle_out_" + ipo).addEventListener("pointerup", () => { this._isPortLineDragDown = false; this._portLineDraggedName = null; });
            document.getElementById("portLineTitle_out_" + ipo).addEventListener("pointerdown", (e) => { this._isPortLineDragDown = true; this._portLineDraggedName = e.target.dataset.portname; });

            if (document.getElementById("patchviews")) document.getElementById("patchviews").addEventListener("pointerenter", (e) =>
            {
                if (!this._isPortLineDragDown) return;
                if (gui.patchView._patchRenderer.getOp)
                {
                    const glOp = gui.patchView._patchRenderer.getOp(op.id);
                    if (glOp)
                    {
                        const glPort = glOp.getGlPort(this._portsOut[ipo].name);
                        if (this._portsOut[ipo].name == this._portLineDraggedName)
                            gui.patchView._patchRenderer.emitEvent("mouseDownOverPort", glPort, glOp.id, this._portsOut[ipo].name, e);
                    }
                }
            });
        }

        for (let ipi = 0; ipi < this._portsIn.length; ipi++) paramsHelper.initPortClickListener(op, ipi);

        for (let ipip = 0; ipip < this._portsIn.length; ipip++)
        {
            (function (index)
            {
                const elm = ele.byId("portdelete_in_" + index);
                if (elm)elm.addEventListener("click", (e) =>
                {
                    this._portsIn[index].removeLinks();
                    gui.opParams.show(op);
                });
            }(ipip));
        }

        for (let ipii = 0; ipii < this._portsIn.length; ipii++) CABLES.UI.paramsHelper.initPortInputListener(op, ipii, this.panelId);

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
                            "opid": _thePort.parent.id,
                            "name": _thePort.parent.getTitle() + ": " + _thePort.name,
                        });
                    }
                });
            }(thePort, this.panelId));
        }

        for (const iwcp in this._watchColorPicker)
        {
            const thePort2 = this._watchColorPicker[iwcp];

            const idx = this._portsIn.indexOf(thePort2);
            console.log(parseInt(iwcp));
            CABLES.UI.paramsHelper.watchColorPickerPort(thePort2, this.panelId, idx);
        }

        this._watchPortVisualizer.bind();

        perf.finish();
    }

    updateUiErrors()
    {
        if (!this._currentOp) return;
        const el = document.getElementById("op_params_uierrors");

        if (!this._currentOp.uiAttribs.uierrors || this._currentOp.uiAttribs.uierrors.length == 0)
        {
            if (el)el.innerHTML = "";
            return;
        }
        else
        if (document.getElementsByClassName("warning-error") != this._currentOp.uiAttribs.uierrors.length)
        {
            if (el)el.innerHTML = "";
        }

        if (!el)
        {
            this._log.warn("no uiErrors html ele?!");
        }
        else
        {
            for (let i = 0; i < this._currentOp.uiAttribs.uierrors.length; i++)
            {
                const err = this._currentOp.uiAttribs.uierrors[i];

                let div = document.getElementById("uierror_" + err.id);

                let str = "";
                if (err.level == 0) str += "<b>Hint: </b>";
                if (err.level == 1) str += "<b>Warning: </b>";
                if (err.level == 2) str += "<b>Error: </b>";
                str += err.txt;

                if (!div)
                {
                    div = document.createElement("div");
                    div.id = "uierror_" + err.id;
                    div.classList.add("warning-error");
                    div.classList.add("warning-error-level" + err.level);
                    el.appendChild(div);
                }

                div.innerHTML = str;
            }
            gui.patchView.checkPatchErrors();
        }
    }

    updateUiAttribs()
    {
        if (gui.patchView.isPasting) return;
        if (!this._currentOp) return;

        this._uiAttrFpsLast = this._uiAttrFpsLast || performance.now();
        this._uiAttrFpsCount++;

        if (performance.now() - this._uiAttrFpsLast > 1000)
        {
            this._uiAttrFpsLast = performance.now();
            if (this._uiAttrFpsCount >= 10) this._log.log("many ui attr updates! ", this._uiAttrFpsCount, this._currentOp.name);
            this._uiAttrFpsCount = 0;
        }

        const perf = CABLES.UI.uiProfiler.start("[opparampanel] updateUiAttribs");
        let el = null;

        el = document.getElementById("options_warning");
        if (el)
        {
            if (!this._currentOp.uiAttribs.warning || this._currentOp.uiAttribs.warning.length === 0) el.style.display = "none";
            else
            {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.warning;
            }
        }

        el = document.getElementById("options_hint");
        if (el)
        {
            if (!this._currentOp.uiAttribs.hint || this._currentOp.uiAttribs.hint.length === 0) el.style.display = "none";
            else
            {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.hint;
            }
        }

        el = document.getElementById("options_error");
        if (el)
        {
            if (!this._currentOp.uiAttribs.error || this._currentOp.uiAttribs.error.length === 0) el.style.display = "none";
            else
            {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.error;
            }
        }

        el = document.getElementById("options_info");
        if (el)
        {
            if (!this._currentOp.uiAttribs.info) el.style.display = "none";
            else
            {
                el.style.display = "block";
                el.innerHTML = "<div class=\"panelhead\">info</div><div class=\"panel\">" + this._currentOp.uiAttribs.info + "</div>";
            }
        }

        this.updateUiErrors();

        perf.finish();
    }

    _showOpParamsCbPortDelete(index, op)
    {
        const el = ele.byId("portdelete_out_" + index);
        if (el)el.addEventListener("click", (e) =>
        {
            this._portsOut[index].removeLinks();
            this.show(op);
        });
    }

    _formatNumber(n)
    {
        const options = { "useGrouping": false, "maximumSignificantDigits": 16 };
        n = n || 0;
        return n.toLocaleString("fullwide", options);
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

                    if (thePort.type == CABLES.OP_PORT_TYPE_VALUE)
                    {
                        const elVal = ele.byClass(id);
                        if (elVal)
                            if (parseFloat(elVal.value) != parseFloat(valDisp)) elVal.value = valDisp;
                            else if (elVal.value != valDisp) elVal.value = valDisp;

                        const elDisp = ele.byId("numberinputDisplay_" + thePort.watchId + "_" + this.panelId);
                        if (elDisp) elDisp.innerHTML = valDisp;
                    }
                }
                if (thePort.type == CABLES.OP_PORT_TYPE_VALUE)
                {
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
                    newValue = "\"" + thePort.getValueForDisplay() + "\"";
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
                }

                for (const iwcp in this._watchColorPicker)
                {
                    const thePort2 = this._watchColorPicker[iwcp];
                    const idx = thePort.parent.portsIn.indexOf(thePort2);
                    CABLES.UI.paramsHelper.updateLinkedColorBoxes(
                        thePort2,
                        thePort.parent.portsIn[idx + 1], thePort.parent.portsIn[idx + 2], this.panelId, idx);
                }

                this._watchPortVisualizer.update(id, thePort.watchId, thePort.get());
            }

            perf.finish();
        }

        if (CABLES.UI.uiConfig.watchValuesInterval == 0) return;

        setTimeout(this._updateWatchPorts.bind(this), CABLES.UI.uiConfig.watchValuesInterval);
    }

    setCurrentOpComment(v)
    {
        if (this._currentOp)
        {
            this._currentOp.uiAttr({ "comment": v });
            if (v.length == 0) this._currentOp.uiAttr({ "comment": null });
            this._currentOp.patch.emitEvent("commentChanged");
            gui.setStateUnsaved();
        }
        else
        {
            this._log.warn("no current op comment");
        }
    }

    setCurrentOpTitle(t)
    {
        if (this._currentOp) this._currentOp.setTitle(t);
    }

    isCurrentOp(op)
    {
        return this._currentOp == op;
    }

    isCurrentOpId(opid)
    {
        if (!this._currentOp) return false;
        return this._currentOp.id == opid;
    }

    opContextMenu(el)
    {
        const items = [];

        const opname = this._currentOp.objName;
        const opid = this._currentOp.id;

        items.push({
            "title": "Set title",
            "func": CABLES.CMD.PATCH.setOpTitle,
        });

        items.push({
            "title": "Set default values",
            func()
            {
                gui.patchView.resetOpValues(opid);
            },
        });

        items.push({
            "title": "Bookmark",
            func()
            {
                gui.bookmarks.add();
            }
        });

        items.push({
            "title": "Clone op code",
            func()
            {
                gui.serverOps.cloneDialog(opname);
            }
        });

        items.push({
            "title": "View op code",
            func()
            {
                gui.serverOps.edit(opname, false, false, true);
            }
        });

        if (gui.user.isAdmin)
        {
            items.push({
                "title": "Edit op ",
                "iconClass": "icon icon-lock",
                func()
                {
                    gui.serverOps.edit(opname, false, false, true);
                },
            });
        }
        CABLES.contextMenu.show({ items }, el);
    }
}


export default OpParampanel;
