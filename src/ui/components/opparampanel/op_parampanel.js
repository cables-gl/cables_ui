import { Logger, ele, Events } from "cables-shared-client";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";
import { PortHtmlGenerator } from "./op_params_htmlgen.js";
import ParamsListener from "./params_listener.js";
import userSettings from "../usersettings.js";
import gluiconfig from "../../glpatch/gluiconfig.js";
import defaultOps from "../../defaultops.js";

/**
 * op parameter panel
 *
 * @class OpParampanel
 * @extends {Events}
 */
class OpParampanel extends Events
{
    constructor(eleid)
    {
        super();

        this.panelId = CABLES.simpleId();
        this._eleId = eleid;
        this._log = new Logger("OpParampanel");
        this._htmlGen = new PortHtmlGenerator(this.panelId);

        this._currentOp = null;
        this._eventPrefix = CABLES.shortId();
        this._isPortLineDragDown = false;

        this._portsIn = [];
        this._portsOut = [];

        this._paramsListener = new ParamsListener(this.panelId);

        this._portUiAttrListeners = [];
        this._startedGlobalListeners = false;

        this.reloadListener = null;
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

        if (!this.hasExposeListener)
        {
            this.hasExposeListener = gui.corePatch().on("subpatchExpose",
                (subpatchid) =>
                {
                    if (
                        op &&
                        op.storage && op.storage.subPatchVer &&
                        op.patchId.get() === subpatchid
                    )
                    {
                        op.refreshParams();
                    }
                });
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
        if (!CABLES.UI.loaded) return;
        if (!this._startedGlobalListeners)
        {
            this._startedGlobalListeners = true;

            gui.corePatch().on("bookmarkschanged", () => { gui.bookmarks.needRefreshSubs = true; this._startedGlobalListeners = true; if (!this._currentOp) gui.patchParamPanel.show(true); });
            gui.corePatch().on("subpatchesChanged", () => { gui.bookmarks.needRefreshSubs = true; this._startedGlobalListeners = true; if (!this._currentOp) gui.patchParamPanel.show(true); });
            gui.corePatch().on("subpatchCreated", () => { gui.bookmarks.needRefreshSubs = true; this._startedGlobalListeners = true; if (!this._currentOp) gui.patchParamPanel.show(true); });
            gui.corePatch().on("patchLoadEnd", () => { gui.bookmarks.needRefreshSubs = true; this._startedGlobalListeners = true; if (!this._currentOp) gui.patchParamPanel.show(true); });
        }

        if (this.reloadListener)
            this.reloadListener = gui.corePatch().on("opReloaded", () =>
            {
                this.refreshDelayed();
            });

        const perf = CABLES.UI.uiProfiler.start("[opparampanel] show");


        if (typeof op == "string") op = gui.corePatch().getOpById(op);

        if (!gui.showingtwoMetaPanel && gui.metaTabs.getActiveTab() && gui.metaTabs.getActiveTab().title != "op")
            gui.metaTabs.activateTabByName("op");


        if (this._currentOp) this._stopListeners();

        this._currentOp = op;


        if (!op)
        {
            return;
        }

        this._portsIn = op.portsIn;
        this._portsOut = op.portsOut;

        if (op.storage && op.storage.subPatchVer)
        {
            const ports = gui.patchView.getSubPatchExposedPorts(op.patchId.get());
            for (let i = 0; i < ports.length; i++)
            {
                if (ports[i].direction === CABLES.PORT_DIR_IN && this._portsIn.indexOf(ports[i]) == -1) this._portsIn.push(ports[i]);
                if (ports[i].direction === CABLES.PORT_DIR_OUT && this._portsOut.indexOf(ports[i]) == -1) this._portsOut.push(ports[i]);
            }
        }

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


        this._portsIn.sort(function (a, b) { return (a.uiAttribs.order || 0) - (b.uiAttribs.order || 0); });


        let html = this._htmlGen.getHtmlOpHeader(op);

        gui.showInfo(text.patchSelectedOp);

        if (this._portsIn.length > 0)
        {
            const perfLoop = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP IN");
            html += this._htmlGen.getHtmlHeaderPorts("in", "Input");
            html += this._htmlGen.getHtmlInputPorts(this._portsIn);

            perfLoop.finish();
        }

        if (this._portsOut.length > 0)
        {
            html += this._htmlGen.getHtmlHeaderPorts("out", "Output");

            const perfLoopOut = CABLES.UI.uiProfiler.start("[opparampanel] _showOpParamsLOOP OUT");

            html += this._htmlGen.getHtmlOutputPorts(this._portsOut);

            perfLoopOut.finish();
        }

        html += getHandleBarHtml("params_op_foot", { "op": op, "showDevInfos": userSettings.get("devinfos") });

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

                if (op.getSubPatch())
                {
                    const subouterOp = op.patch.getSubPatchOuterOp(op.getSubPatch());
                    if (subouterOp)
                    {
                        const subOuterName = subouterOp.objName;

                        if (!defaultOps.isPatchOp(subOuterName) &&
                        this._portsIn[i].get() &&
                            defaultOps.isCoreOp(subOuterName) &&
                            defaultOps.isExtensionOp(subOuterName) &&
                            String(this._portsIn[i].get()).startsWith("/assets/") &&
                            !this._portsIn[i].isLinked())
                            this._portsIn[i].op.setUiError("nonpatchopassets", "This Operator uses assets from a patch, this file will probably not be found when exporting the patch or using in standalone etc.!", 1);
                    }
                }

                if (ele.byId("portFilename_" + i))
                    ele.byId("portFilename_" + i).innerHTML = "<span class=\"button-small tt\" data-tt=\"" + this._portsIn[i].get() + "\" style=\"text-transform:none;\"><span style=\"pointer-events:none;\" class=\"icon icon-file\"></span>" + shortName + "</span>";

                let srcEle = ele.byId("portFilename_" + i + "_src");
                if (srcEle)
                {
                    let src = "";
                    let fn = this._portsIn[i].get() || "";

                    if (fn == "" || fn == 0)src = "";
                    else if (!fn.startsWith("/")) src = "relative";
                    if (fn.startsWith("/")) src = "abs";

                    if (fn.startsWith("file:")) src = "file";
                    if (fn.startsWith("data:")) src = "dataUrl";

                    if (fn.startsWith("http://") || fn.startsWith("https://"))
                    {
                        const parts = fn.split("/");
                        if (parts && parts.length > 1) src = "ext: " + parts[2];
                    }
                    if (fn.startsWith("/assets/" + gui.project()._id)) src = "this patch";
                    if (fn.startsWith("/assets/") && !fn.startsWith("/assets/" + gui.project()._id))
                    {
                        const parts = fn.split("/");
                        if (parts && parts.length > 1) src = "<a target=\"_blank\" class=\"link\" href=\"" + CABLES.platform.getCablesUrl() + "/edit/" + parts[2] + "\">other patch</a>";
                    }
                    if (fn.startsWith("/assets/library/")) src = "lib";


                    if (src != "") src = "[ " + src + " ]";

                    srcEle.innerHTML = src;
                }
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

            document.getElementById("portLineTitle_in_" + i).addEventListener("pointerup", () => { this._isPortLineDragDown = false; this._portLineDraggedName = null; }, { "passive": false });
            document.getElementById("portLineTitle_in_" + i).addEventListener("pointerdown", (e) => { this._isPortLineDragDown = true; this._portLineDraggedName = e.target.dataset.portname; }, { "passive": false });
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
                        gui.opSelect().show({ "x": p.parent.uiAttribs.translate.x + index * (gluiconfig.portWidth + gluiconfig.portPadding), "y": p.op.uiAttribs.translate.y + 50, }, op, p);
                }, { "passive": false });
                else this._log.warn("ele not found: portTitle_out_" + index);
            }.bind(this)(ipo));

            document.getElementById("portLineTitle_out_" + ipo).addEventListener("pointerup", () => { this._isPortLineDragDown = false; this._portLineDraggedName = null; }, { "passive": false });
            document.getElementById("portLineTitle_out_" + ipo).addEventListener("pointerdown", (e) => { this._isPortLineDragDown = true; this._portLineDraggedName = e.target.dataset.portname; }, { "passive": false });

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
            }, { "passive": false });
        }



        ele.asButton(ele.byId("parampanel_manage_op"), () => { CABLES.CMD.OP.manageOp(op.opId); });
        ele.asButton(ele.byId("parampanel_edit_op"), CABLES.CMD.OP.editOp);
        ele.asButton(ele.byId("watchOpSerialized"), CABLES.CMD.DEBUG.watchOpSerialized);
        ele.asButton(ele.byId("watchOpUiAttribs"), CABLES.CMD.DEBUG.watchOpUiAttribs);
        ele.asButton(ele.byId("watchOpDocsJson"), CABLES.CMD.DEBUG.watchOpDocsJson);



        ele.forEachClass("portCopyClipboard", (ell) =>
        {
            ell.addEventListener("click", (e) =>
            {
                if (!navigator.clipboard) return;

                const cop = gui.corePatch().getOpById(e.target.dataset.opid);
                const port = cop.getPortByName(e.target.dataset.portname);

                navigator.clipboard
                    .writeText(String(port.get()))
                    .then(() =>
                    {
                        CABLES.UI.notify("Copied value to clipboard");
                    })
                    .catch((err) =>
                    {
                        console.warn("copy to clipboard failed", err);
                    });

                e.preventDefault();
            }, { "passive": false });
        });


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
                    if (CABLES.UTILS.isNumeric(err.level))
                        div.classList.add("warning-error-level" + err.level);
                    else
                    {
                        console.error("err level not numeric", err.level);
                        console.log((new Error().stack));
                    }

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
            // gui.setStateUnsaved({ "op": this._currentOp });
            gui.savedState.setUnSaved("op comment", this._currentOp.uiAttribs.subPatch);
        }
        else
        {
            this._log.warn("no current op comment");
        }
    }

    setCurrentOpTitle(t)
    {
        if (this._currentOp) this._currentOp.setTitle(t);

        // if (defaultops.isSubPatchOpName(this._currentOp.objName))
        if (this._currentOp && this._currentOp.storage && this._currentOp.storage.subPatchVer)
        {
            this._currentOp.patch.emitEvent("subpatchesChanged");
        }
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

    // OLD SUBPATCH LIST!!!!!! REMOVE
    subPatchContextMenu(el)
    {
        const outer = gui.patchView.getSubPatchOuterOp(el.dataset.id);

        const items = [];
        if (outer && outer.storage && outer.storage.blueprint)
        {
            items.push({
                "title": "Goto Blueprint Op",
                func()
                {
                    gui.patchView.focusSubpatchOp(el.dataset.id);
                },
            });
            items.push({
                "title": "Update Blueprint",
                func()
                {
                    const bp = gui.patchView.getBlueprintOpFromBlueprintSubpatchId(el.dataset.id);
                    if (bp) gui.patchView.updateBlueprints([bp]);
                },
            });
            items.push({
                "title": "Open Patch",
                "iconClass": "icon icon-external",
                func()
                {
                    const url = CABLES.platform.getCablesUrl() + "/edit/" + outer.storage.blueprint.patchId;
                    window.open(url, "_blank");
                },
            });
        }
        else
        {
            items.push({
                "title": "Rename",
                func()
                {
                    gui.patchView.focusSubpatchOp(el.dataset.id);
                    CABLES.CMD.PATCH.setOpTitle();
                },
            });

            items.push({
                "title": "Goto Subpatch Op",
                func()
                {
                    gui.patchView.focusSubpatchOp(el.dataset.id);
                },
            });


            if (el.dataset.subpatchver == "2" && el.dataset.blueprintver != 2)
                items.push({
                    "title": "Create op from subpatch",
                    func()
                    {
                        gui.serverOps.createBlueprint2Op(el.dataset.id);
                        // gui.patchView.focusSubpatchOp(el.dataset.id);
                    },
                });

            if (el.dataset.blueprintver == 2)
            {
                items.push({
                    "title": "Save Blueprint Op",
                    func()
                    {
                        const op = gui.patchView.getSubPatchOuterOp(el.dataset.id);


                        gui.serverOps.updateSubPatchOpAttachment(op, { "oldSubId": el.dataset.id });
                        // gui.patchView.focusSubpatchOp(el.dataset.id);
                    },
                });
            }
        }
        CABLES.contextMenu.show({ items }, el);
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
            "title": "Manage Op Code",
            func()
            {
                CABLES.CMD.OP.manageSelectedOp();
            },
        });


        items.push({
            "title": "Clone Op",
            func()
            {
                CABLES.CMD.OP.cloneSelectedOp();
            },
        });

        CABLES.contextMenu.show({ items }, el);
    }
}


export default OpParampanel;
