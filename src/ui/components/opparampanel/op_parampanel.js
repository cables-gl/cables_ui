import paramsHelper from "./params_helper";
import { getHandleBarHtml } from "../../utils/handlebars";
import Logger from "../../utils/logger";

import text from "../../text";
import ele from "../../utils/ele";
import { PortHtmlGenerator } from "./op_params_htmlgen";
import ParamsListener from "./params_listener";

class OpParampanel extends CABLES.EventTarget
{
    constructor(eleid)
    {
        super();

        this.panelId = CABLES.simpleId();
        this._eleId = eleid;
        this._log = new Logger("OpParampanel");
        this._htmlGen = new PortHtmlGenerator(this.panelId);


        this._currentOp = null;
        this._eventPrefix = CABLES.uuid();
        this._isPortLineDragDown = false;

        this._portsIn = [];
        this._portsOut = [];

        this._paramsListener = new ParamsListener(this.panelId);

        this._portUiAttrListeners = [];
    }

    get op()
    {
        return this._currentOp;
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

        for (let i = 0; i < this._portUiAttrListeners.length; i++)
        {
            const listener = this._portUiAttrListeners[i];
            listener.port.off(listener.listenId);
        }
        this._portUiAttrListeners.length = 0;
        this.onOpUiAttrChange = op.off(this.onOpUiAttrChange);
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
            const listenId = this._portsIn[i].on(
                "onUiAttrChange",
                this._onUiAttrChangePort.bind(this),
                this._eventPrefix);
            this._portUiAttrListeners.push({ "listenId": listenId, "port": this._portsIn[i] });
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

        // if (this._currentOp != op)
        // {
        if (this._currentOp) this._stopListeners();

        // }

        this._currentOp = op;


        if (!op)
        {
            return;
        }

        this._portsIn = op.portsIn;
        this._portsOut = op.portsOut;

        this._startListeners(this._currentOp);

        op.emitEvent("uiParamPanel", op);

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


        let html = this._htmlGen.getHtmlOpHeader(op);

        gui.showInfo(text.patchSelectedOp);

        if (this._portsIn.length > 0)
        {
            const perfLoop = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP IN");
            html += this._htmlGen.getHtmlHeaderPorts("in", "input");
            html += this._htmlGen.getHtmlInputPorts(this._portsIn);

            perfLoop.finish();
        }

        if (this._portsOut.length > 0)
        {
            html += this._htmlGen.getHtmlHeaderPorts("out", "output");

            const perfLoopOut = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP OUT");

            html += this._htmlGen.getHtmlOutputPorts(this._portsOut);

            perfLoopOut.finish();
        }

        html += getHandleBarHtml("params_op_foot", { "op": op });

        const el = document.getElementById(this._eleId || gui.getParamPanelEleId());

        if (el) el.innerHTML = html;
        else return;

        this._paramsListener.init({ "op": op });

        perfHtml.finish();


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

                    if (glOp && this._portsIn[i])
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
                    if (!navigator.clipboard) return;

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
                    if (glOp && this._portsOut[ipo])
                    {
                        const glPort = glOp.getGlPort(this._portsOut[ipo].name);
                        if (this._portsOut[ipo].name == this._portLineDraggedName)
                            gui.patchView._patchRenderer.emitEvent("mouseDownOverPort", glPort, glOp.id, this._portsOut[ipo].name, e);
                    }
                }
            });
        }


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


    setCurrentOpComment(v)
    {
        if (this._currentOp)
        {
            this._currentOp.uiAttr({ "comment": v });
            if (v.length == 0) this._currentOp.uiAttr({ "comment": null });
            this._currentOp.patch.emitEvent("commentChanged");
            gui.setStateUnsaved({ "op": this._currentOp });
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
            "title": "Show Op Serialized",
            func()
            {
                CABLES.CMD.PATCH.watchOpSerialized();
            },
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
