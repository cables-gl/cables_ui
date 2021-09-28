CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPNAME_SUBPATCH = "Ops.Ui.SubPatch";

CABLES.UI.Patch = function (_gui)
{
    CABLES.EventTarget.apply(this);

    const self = this;
    this.ops = [];
    this.scene = null;
    this.disabled = true;
    const gui = _gui;
    this._svgEle = null;

    let currentProject = null;
    let currentOp = null;
    let spacePressed = false;
    const selectedOps = [];
    let currentSubPatch = 0;


    let mouseRubberBandStartPos = null;
    let mouseRubberBandPos = null;
    const mouseRubberBandSelectedBefore = [];
    let rubberBandRect = null;
    let isLoading = false;

    let timeoutRubberBand = -1;

    let subPatchViewBoxes = [];
    this._serverDate = "";

    this.background = null;
    this._elPatchSvg = null;
    this._elPatch = null;
    this._elBody = null;
    this._viewBox = null;
    this.currentPatchBounds = null;

    this._oldOpParamsId = null;

    this._uiAttrFpsLast = 0;
    this._uiAttrFpsCount = 0;

    this.name = "svgpatch";

    const pastedupdateTimeout = null;

    // CABLES.editorSession.addListener("param",
    //     function (name, data)
    //     {
    //         const lastTab = CABLES.UI.userSettings.get("editortab");

    //         if (data && data.opid && data.portname) CABLES.UI.openParamStringEditor(data.opid, data.portname,
    //             function ()
    //             {
    //                 gui.mainTabs.activateTabByName(lastTab);
    //                 CABLES.UI.userSettings.set("editortab", lastTab);
    //             });
    //     });

    this.isLoading = function () { return isLoading; };
    // this.getPaper = function () { return self.paper; };

    // this.isCurrentOp = function (op)
    // {
    //     if (op.op) return gui.patchView.isCurrentOp(op.op); // if is uiop
    //     return gui.patchView.isCurrentOp(op);
    // };

    // this.isCurrentOpId = function (opid)
    // {
    //     return gui.opParams.isCurrentOpId(opid);
    // };


    // this.focus = function ()
    // {
    //     $("#patch").focus();
    // };

    // this.isFocussed = function ()
    // {
    //     return $("#patch").is(":focus");
    // };

    // this.serialize = function (dataUi)
    // {
    //     dataUi.viewBox = this._viewBox.serialize();
    // };


    // this.cut = function (e)
    // {
    //     gui.patchView.clipboardCutOps(e);
    // };

    // this.copy = function (e)
    // {
    //     for (const i in selectedOps) selectedOps[i].oprect.showCopyAnim();
    //     gui.patchView.clipboardCopyOps(e);
    // };

    // this.paste = function (e)
    // {
    //     let mouseX = 0;
    //     let mouseY = 0;
    //     if (self.lastMouseMoveEvent)
    //     {
    //         mouseX = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).x;
    //         mouseY = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).y;
    //     }

    //     gui.patchView.clipboardPaste(e, currentSubPatch, mouseX, mouseY,
    //         (ops, focusSubpatchop) =>
    //         {
    //             isLoading = false;

    //             self.setSelectedOp(null);
    //             gui.patch().checkOpsInSync();

    //             // setTimeout(function ()
    //             // {
    //             for (let i = 0; i < ops.length; i++)
    //             {
    //                 const uiop = self.addSelectedOpById(ops[i].id);

    //                 if (uiop)
    //                 {
    //                     uiop.setSelected(false);
    //                     uiop.setSelected(true);
    //                 }
    //                 else console.log("paste: cant find uiop", ops[i].id);

    //                 gui.setStateUnsaved();
    //             }

    //             gui.patch().setCurrentSubPatch(currentSubPatch);

    //             if (focusSubpatchop)
    //             {
    //                 console.log(focusSubpatchop, mouseX, mouseY);
    //                 const op = gui.corePatch().getOpById(focusSubpatchop.id);
    //                 // op.setUiAttrib({ "translate" : {"x":mouseX,"y":mouseY}});

    //                 const uiop = gui.patch().getUiOp(op);
    //                 // uiop.setPos(mouseX, mouseY);

    //                 // gui.patch().focusOp(op.id,true);
    //                 // console.log(op);
    //                 // gui.patch().centerViewBoxOps();
    //             }
    //             // }, 100);
    //         });
    // };

    // this.createCommentFromSelection = function ()
    // {
    //     const bounds = this.getSelectionBounds();
    //     const padding = 100;

    //     gui.corePatch().addOp("Ops.Ui.Comment", {
    //         "size": [
    //             (bounds.maxx - bounds.minx) + padding * 3,
    //             (bounds.maxy - bounds.miny) + padding * 2
    //         ],
    //         "translate": {
    //             "x": bounds.minx - padding,
    //             "y": bounds.miny - padding
    //         }
    //     });
    // };

    // this.highlightNamespace = function (ns)
    // {
    //     for (let i = 0; i < self.ops.length; i++)
    //         if (self.ops[i].op.objName.startsWith(ns)) self.ops[i].highlight(true);
    //         else self.ops[i].highlight(false);
    // };

    // this.highlightOpNamespace = function (op)
    // {
    //     const parts = op.objName.split(".");
    //     parts.length -= 1;
    //     const ns = parts.join(".");
    //     self.highlightNamespace(ns);
    // };

    // this.unPatchSubPatch = function (patchId)
    // {
    //     const toSelect = [];
    //     for (const i in this.ops)
    //     {
    //         if (this.ops[i].op.uiAttribs.subPatch == patchId)
    //         {
    //             this.ops[i].op.uiAttribs.subPatch = currentSubPatch;
    //             toSelect.push(this.ops[i]);
    //         }
    //     }

    //     this.setCurrentSubPatch(currentSubPatch);

    //     for (const j in toSelect) this.addSelectedOp(toSelect[j]);
    // };

    // this._distance2dDir = function (x1, y1, x2, y2)
    // {
    //     const xd = x2 - x1;
    //     const yd = y2 - y1;
    //     const d = Math.sqrt(xd * xd + yd * yd);
    //     if (xd < 0) return 0 - d;
    //     return d;
    // };

    // this.cursorNavigateHor = function (dir)
    // {
    //     if (selectedOps.length == 0) return;

    //     let nextOp = null;
    //     let nextOpDist = 999999;

    //     for (let i = 0; i < this.ops.length; i++)
    //     {
    //         let startx = selectedOps[0].getPosX();
    //         if (dir == 1) startx += selectedOps[0].getWidth();
    //         const starty = selectedOps[0].getPosY();

    //         let endx = this.ops[i].getPosX();
    //         if (dir == 0) endx += this.ops[i].getWidth();

    //         let dist = this._distance2dDir(
    //             startx,
    //             starty,
    //             endx,
    //             this.ops[i].getPosY()
    //         );

    //         if (selectedOps[0].getPosX() == this.ops[i].getPosX()) continue;

    //         if ((dir == 0 && dist < 0) || (dir == 1 && dist > 0))
    //         {
    //             dist = Math.abs(dist);
    //             if (dist < nextOpDist)
    //             {
    //                 nextOpDist = dist;
    //                 nextOp = this.ops[i];
    //             }
    //         }
    //     }

    //     if (nextOp)
    //     {
    //         this.setSelectedOp(null);
    //         this.setSelectedOp(nextOp);
    //         self._viewBox.centerIfNotVisible(selectedOps[0]);
    //     }
    // };

    // this.zoomStep = function (step)
    // {
    //     this._viewBox.zoomStep(step);
    // };

    // this.cursorNavigate = function (dir)
    // {
    //     if (selectedOps.length == 0) return;

    //     let ports = selectedOps[0].op.portsIn;
    //     if (dir == 0)ports = selectedOps[0].op.portsOut;

    //     for (let i = 0; i < ports.length; i++)
    //     {
    //         if (ports[i].isLinked())
    //         {
    //             const otherPort = ports[i].links[0].getOtherPort(ports[i]);
    //             this.setSelectedOpById(otherPort.parent.id);
    //             self._viewBox.centerIfNotVisible(selectedOps[0]);

    //             break;
    //         }
    //     }
    // };

    // $("#patch").hover(
    //     function (e)
    //     {
    //         CABLES.UI.showInfo(CABLES.UI.TEXTS.patch);
    //     },
    //     function ()
    //     {
    //         CABLES.UI.hideInfo();
    //     });


    // ele.byId("patch").addEventListener("keyup", (e) =>
    // {
    //     switch (e.which)
    //     {
    //     case 32:
    //         spacePressed = false;
    //         gui.setCursor();
    //         break;
    //     }
    // });

    // gui.keys.key("c", "Center/Zoom to all or selected ops", "down", "patch", {}, (e) =>
    // {
    //     if (self.getSelectedOps().length > 0) self.centerViewBoxOps();
    //     else self.toggleCenterZoom();
    // });

    // gui.keys.key("x", "Unlink selected ops", "down", "patch", {}, (e) => { gui.patchView.unlinkSelectedOps(); });
    // gui.keys.key("f", "Toggle data flow visualization", "down", "patch", {}, (e) => { console.log(this); this.toggleFlowVis(); });
    // gui.keys.key("e", "Edit op code", "down", "patch", {}, (e) => { CABLES.CMD.PATCH.editOp(); });

    // gui.keys.key("a", "Align selected ops vertical or horizontal", "down", "patch", {}, (e) => { this.alignSelectedOps(); });
    // gui.keys.key("a", "Select all ops in current subpatch", "down", "patch", { "cmdCtrl": true }, (e) => { this.selectAllOps(); });
    // gui.keys.key("a", "Compress selected ops vertically", "down", "patch", { "shiftKey": true }, (e) => { console.log("COMPRESS!"); this.compressSelectedOps(); });

    // gui.keys.key(" ", "Drag left mouse button to pan patch", "down", "patch", {}, (e) => { spacePressed = true; gui.setCursor("grab"); });

    // gui.keys.key("/", "Go to root subpatch", "down", "patch", {}, (e) => { this.setCurrentSubPatch(0); });

    // gui.keys.key("t", "Change current op title", "down", "patch", {}, (e) => { CABLES.CMD.PATCH.setOpTitle(); });

    // gui.keys.key("PageUp", "Snap op below previous op", "down", "patch", {}, (e) => { this.snapToNextOp(-1); });
    // gui.keys.key("PageDown", "Snap op above next op", "down", "patch", {}, (e) => { this.snapToNextOp(1); });

    // gui.keys.key("d", "Temporary unlink op", "down", "patch", { "shiftKey": true }, (e) => { this.tempUnlinkOp(); });
    // gui.keys.key("d", "Disable op and all childs", "down", "patch", {}, (e) => { self.disableEnableOps(); });

    // gui.keys.key("j", "Navigate op history back", "down", "patch", {}, (e) => { gui.opHistory.back(); });
    // gui.keys.key("k", "Navigate op history forward", "down", "patch", {}, (e) => { gui.opHistory.forward(); });

    // gui.keys.key("j", "Navigate op history back", "down", "patch", { "shiftKey": true }, (e) => { gui.opHistory.back(); });
    // gui.keys.key("k", "Navigate op history forward", "down", "patch", { "shiftKey": true }, (e) => { gui.opHistory.forward(); });

    // gui.keys.key(["Delete", "Backspace"], "Delete selected ops", "down", "patch", {}, (e) =>
    // {
    //     self.deleteSelectedOps();
    //     if (e.stopPropagation) e.stopPropagation();
    //     if (e.preventDefault) e.preventDefault();
    //     self.showProjectParams();
    // });

    // gui.keys.key(" ", "Play/Pause timeline", "up", "patch", {}, (e) =>
    // {
    //     console.log("space!!!", gui.spaceBarStart);
    //     const timeused = Date.now() - gui.spaceBarStart;
    //     if (timeused < 500) gui.timeLine().togglePlay();
    //     gui.spaceBarStart = 0;
    // });

    // gui.keys.key("-", "Zoom out", "down", "patch", {}, (e) => { this._viewBox.zoomStep(1); });
    // gui.keys.key("=", "Zoom in", "down", "patch", {}, (e) => { this._viewBox.zoomStep(-1); });
    // gui.keys.key("+", "Zoom in", "down", "patch", {}, (e) => { this._viewBox.zoomStep(-1); });

    // $("#patch").keydown(function (e)
    // {
    //     switch (e.which)
    //     {
    //     case 38: // up
    //         this.cursorNavigate(1);
    //         break;
    //     case 40: // down
    //         this.cursorNavigate(0);
    //         break;
    //     case 37: // left
    //         this.cursorNavigateHor(0);
    //         break;
    //     case 39: // right
    //         this.cursorNavigateHor(1);
    //         break;
    //     case 27:
    //         gui.setCursor();
    //         break;
    //     case 71: // g show graphs
    //         self.showSelectedOpsGraphs();
    //         break;
    //     default:
    //         // console.log('key ',e.which,e.key);
    //         break;
    //     }
    // }.bind(this));

    // this.getSubPatchViewBoxes = function ()
    // {
    //     return subPatchViewBoxes;
    // };

    this.saveCurrentProjectAs = function (cb, _id, _name)
    {
        gui.patchView.store.saveAs(cb, _id, _name);
    };

    // -----------------------------------------------

    this._timeoutLinkWarnings = null;
    this._checkLinkCounter = -1;

    this.checkLinkTimeWarnings = function (cont)
    {
        if (!cont) self._checkLinkCounter = -1;

        clearTimeout(this._timeoutLinkWarnings);
        this._timeoutLinkWarnings = setTimeout(function ()
        {
            const perf = CABLES.UI.uiProfiler.start("checkLinkTimeWarnings");

            self._checkLinkCounter++;
            if (self._checkLinkCounter >= self.ops.length)
            {
                self._checkLinkCounter = -1;
            }
            else
            {
                // console.log(self._checkLinkCounter);
                const op = self.ops[self._checkLinkCounter];

                if (op.op.uiAttribs.subPatch == currentSubPatch)
                {
                    op.op.checkLinkTimeWarnings();
                    op.op._checkLinksNeededToWork();
                }

                self.checkLinkTimeWarnings(true);
            }
            perf.finish();
        }, 2);
    };

    this.checkUpdatedSaveForce = function (updated)
    {
        this._serverDate = updated;
        CABLES.UI.MODAL.hide(true);
        CABLES.CMD.PATCH.save(true);
    };

    this.saveCurrentProject = function (cb, _id, _name, _force)
    {
        // for (let i = 0; i < this.ops.length; i++)
        //     this.ops[i].removeDeadLinks();

        gui.patchView.store.saveCurrentProject(cb, _id, _name, _force);
    };

    this.getCurrentProject = function ()
    {
        return currentProject;
    };

    this.setCurrentProject = function (proj)
    {
        // if (self.timeLine) self.timeLine.clear();

        currentProject = proj;
        // if (currentProject === null)
        // {
        //     $("#meta_content_files").hide();
        // }
        // else
        // {
        //     $("#meta_content_files").show();
        // }
        // $("#meta_content_files").hover(function (e)
        // {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.projectFiles);
        // }, function ()
        // {
        //     CABLES.UI.hideInfo();
        // });
    };

    this.loadingError = false;

    this.setProject = function (proj)
    {
        this.loadingError = false;
        if (proj.ui)
        {
            if (proj.ui.subPatchViewBoxes) subPatchViewBoxes = proj.ui.subPatchViewBoxes;
            if (proj.ui.viewBox) this._viewBox.deSerialize(proj.ui.viewBox);
        }

        // self.updateViewBox();
        currentSubPatch = 0;
        gui.setProjectName(proj.name);
        self.setCurrentProject(proj);

        gui.corePatch().clear();
        // gui.patch().updateBounds();
    };

    this.show = function (_scene)
    {
        this.scene = _scene;

        // $("#meta").append();

        // this.paper = Raphael("patch", 0, 0);
        // this._viewBox = new CABLES.UI.PatchViewBox(this, this.paper);
        this.bindScene(self.scene);

        // this._elPatchSvg = this._elPatchSvg || $("#patch svg");
        // this._elPatch = this._elPatch || $("#patch");
        // this._elBody = this._elBody || $("body");


        // this._elPatchSvg.oncontextmenu =
        // this._elPatch.oncontextmenu = function (e) { e.preventDefault(); };
        // document.addEventListener("contextmenu", function (e) { e.preventDefault(); }, false);

        // this._viewBox.bindWheel(this._elPatchSvg);


        // this._elPatchSvg.bind("mouseup", function (event)
        // {
        //     rubberBandHide();
        //     mouseRubberBandSelectedBefore.length = 0;
        //     gui.setCursor();
        // });

        // this._elPatchSvg.bind("mouseenter", function (event) { gui.setCursor(); });
        // this._elPatchSvg.bind("mouseleave", function (event) { gui.setCursor(); });

        // this._elPatchSvg.bind("touchstart", (e) =>
        // {
        //     e = CABLES.mouseEvent(e);
        //     this.lastMouseMoveEvent = null;
        // });


        // gui.setLayout();
    };


    function doLink() {}

    this.checkOpsInSync = function ()
    {
        console.log("core ops / ui ops: ", gui.corePatch().ops.length, this.ops.length);

        let notFound = 0;
        for (let i = 0; i < gui.corePatch().ops.length; i++)
        {
            let found = false;
            for (let j = 0; j < this.ops.length; j++)
            {
                if (gui.corePatch().ops[i] == this.ops[j].op)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                notFound++;
                console.log("creating unfound uiop..... ", gui.corePatch().ops[i]);
                this.initUiOp(gui.corePatch().ops[i], true);
            }
        }
    };

    // this.removeQuickLinkLine = function ()
    // {
    //     if (self.quickLinkLine)
    //     {
    //         self.quickLinkLine.remove();
    //         self.quickLinkLine = null;
    //     }
    // };

    // this.removeDeadLinks = function ()
    // {
    //     setTimeout(function ()
    //     {
    //         for (const i in self.ops)
    //             self.ops[i].removeDeadLinks();
    //         console.log("removeDeadLinks");
    //     }, 10);
    // };

    // function doAddOp(uiOp)
    // {
    //     function checkDuplicatePorts(op)
    //     {
    //         let objName = null;
    //         let portName = null;

    //         for (let k = 0; k < op.portsOut.length; k++)
    //         {
    //             for (let j = 0; j < op.portsIn.length; j++)
    //             {
    //                 if (op.portsIn[j].name == op.portsOut[k].name)
    //                 {
    //                     objName = op.objName;
    //                     portName = op.portsIn[j].name;
    //                 }
    //                 for (let i = 0; i < op.portsIn.length; i++)
    //                 {
    //                     if ((i != j && op.portsIn[i].name == op.portsIn[j].name))
    //                     {
    //                         objName = op.objName;
    //                         portName = op.portsIn[j].name;
    //                     }
    //                 }
    //             }
    //         }

    //         if (portName)
    //         {
    //             console.error("op " + objName + " has duplicate port names (" + portName + "), they must be unique. ");
    //             CABLES.UI.notifyError("Warning! Op has duplicate port name they must be unique. ");
    //         }
    //     }

    //     const op = uiOp.op;


    //     if (!isLoading)
    //     {
    //         const undofunc = (function (opid, objName)
    //         {
    //             CABLES.UI.undo.add({
    //                 "title": "Add op",
    //                 undo()
    //                 {
    //                     gui.corePatch().deleteOp(opid, true);
    //                 },
    //                 redo()
    //                 {
    //                     gui.corePatch().addOp(objName, op.uiAttribs, opid);
    //                 }
    //             });
    //         }(op.id, op.objName));
    //     }

    //     op.on("onPortAdd", (p) =>
    //     {
    //         uiOp.addPort(p.direction, p);
    //         uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
    //     });
    //     // op.onAddPort = function (p)
    //     // {
    //     //     uiOp.addPort(p.direction, p);
    //     //     uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
    //     // };

    //     if (op.uiAttribs && op.uiAttribs.subPatch)
    //     {
    //         if (op.uiAttribs.subPatch != currentSubPatch) uiOp.hide();
    //     }

    //     uiOp.initPorts();

    //     checkDuplicatePorts(op);

    //     if (!op.uiAttribs) op.uiAttribs = {};

    //     if (!op.uiAttribs.translate)
    //     {
    //         if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0) op.uiAttribs.translate = { "x": self._viewBox.getCenterX(), "y": self._viewBox.getCenterY() };
    //         else op.uiAttribs.translate = { "x": CABLES.UI.OPSELECT.newOpPos.x, "y": CABLES.UI.OPSELECT.newOpPos.y };
    //     }

    //     if (op.uiAttribs.hasOwnProperty("translate"))
    //     {
    //         if (CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.x = gui.patchView.snapOpPosX(op.uiAttribs.translate.x);
    //         if (CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.y = gui.patchView.snapOpPosY(op.uiAttribs.translate.y);
    //         uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
    //     }

    //     if (op.uiAttribs.hasOwnProperty("title")) gui.patch().setOpTitle(uiOp, op.uiAttribs.title);

    //     if (!op.uiAttribs.hasOwnProperty("subPatch")) op.uiAttribs.subPatch = currentSubPatch;

    //     if (CABLES.UI.OPSELECT.linkNewOpToSuggestedPort)
    //     {
    //         console.log("CABLES.UI.OPSELECT.linkNewOpToSuggestedPort");
    //         const link = gui.corePatch().link(
    //             CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op,
    //             CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName,
    //             op,
    //             CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName);
    //     }

    //     CABLES.UI.OPSELECT.linkNewLink = null;
    //     CABLES.UI.OPSELECT.newOpPos = { "x": 0, "y": 0 };
    //     CABLES.UI.OPSELECT.linkNewOpToSuggestedPort = null;
    //     CABLES.UI.OPSELECT.linkNewOpToPort = null;

    //     uiOp.setPos();
    //     uiOp.setPos(uiOp.getPosX(), uiOp.getPosY());

    //     if (!isLoading)
    //     {
    //         // setTimeout(function ()
    //         // {
    //         if (currentSubPatch == uiOp.getSubPatch()) uiOp.show();

    //         if (showAddedOpTimeout != -1) clearTimeout(showAddedOpTimeout);
    //         showAddedOpTimeout = setTimeout(function ()
    //         {
    //             gui.patch().setSelectedOp(null);
    //             gui.patch().setSelectedOp(uiOp);
    //             gui.opParams.show(op);
    //             // gui.patch().updateBounds();
    //             gui.patch().getViewBox().update();
    //             uiOp.oprect.showFocus();
    //         }, 30);
    //         // }, 30);
    //     }

    //     // select ops after pasting...
    //     if (uiOp.op.uiAttribs.pasted)
    //     {
    //         delete uiOp.op.uiAttribs.pasted;
    //         gui.patch().addSelectedOpById(uiOp.op.id);
    //         uiOp.setSelected(true);
    //         uiOp.show();
    //         setStatusSelectedOps();
    //         self.updateSubPatches();
    //         uiOp.oprect.showFocus();
    //         // gui.patch().updateBounds();

    //         // setTimeout(function ()
    //         // {
    //         // this fixes links not showing up after pasting
    //         uiOp.setPos();
    //         // gui.patch().getViewBox().update();
    //         // }, 30);
    //     }

    //     if (uiOp.op.objName.startsWith("Ops.Deprecated.")) uiOp.op.uiAttr({ "error": "Op is deprecated" });
    //     uiOp.wasAdded = true;
    // }

    // let showAddedOpTimeout = -1;


    this.bindScene = function (scene)
    {
        // scene.onLoadStart = function ()
        // {
        isLoading = true;
        // };

        let patchLoadEndiD = scene.on("patchLoadEnd", () =>
        {
            scene.off(patchLoadEndiD);
            isLoading = false;
            gui.setStateSaved();

            logStartup("Patch loaded");
        });

        // scene.addEventListener("onUnLink", function (p1, p2)
        // {
        //     if (this.disabled) return;
        //     gui.setStateUnsaved();

        //     // todo: check if needs to be updated ?
        //     self.updateCurrentOpParams();

        //     for (const i in this.ops)
        //     {
        //         for (const j in this.ops[i].links)
        //         {
        //             if (this.ops[i].links[j].p1 && this.ops[i].links[j].p2 &&
        //                 ((this.ops[i].links[j].p1.thePort == p1 && this.ops[i].links[j].p2.thePort == p2) ||
        //                     (this.ops[i].links[j].p1.thePort == p2 && this.ops[i].links[j].p2.thePort == p1)))
        //             {
        //                 const undofunc = (function (p1Name, p2Name, op1Id, op2Id)
        //                 {
        //                     CABLES.UI.undo.add({
        //                         "title": "Unlink port",
        //                         undo()
        //                         {
        //                             scene.link(scene.getOpById(op1Id), p1Name, scene.getOpById(op2Id), p2Name);
        //                         },
        //                         redo()
        //                         {
        //                             const op1 = scene.getOpById(op1Id);
        //                             const op2 = scene.getOpById(op2Id);
        //                             if (!op1 || !op2)
        //                             {
        //                                 console.warn("undo: op not found");
        //                                 return;
        //                             }
        //                             op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
        //                         }
        //                     });
        //                 }(this.ops[i].links[j].p1.thePort.getName(),
        //                     this.ops[i].links[j].p2.thePort.getName(),
        //                     this.ops[i].links[j].p1.thePort.parent.id,
        //                     this.ops[i].links[j].p2.thePort.parent.id
        //                 ));

        //                 this.ops[i].links[j].hideAddButton();

        //                 this.ops[i].links[j].p1.updateUI();
        //                 this.ops[i].links[j].p2.updateUI();
        //                 this.ops[i].links[j].p1 = null;
        //                 this.ops[i].links[j].p2 = null;
        //                 this.ops[i].links[j].remove();
        //             }
        //         }
        //         // this.ops[i].removeDeadLinks();
        //     }
        //     this.checkLinkTimeWarnings();
        // }.bind(this));

        // scene.addEventListener("onLink", this.onLinkEvent.bind(this));
        // scene.addEventListener("onOpAdd", this.initUiOp.bind(this));

        // scene.addEventListener("onOpDelete", function (op)
        // {
        //     if (this.disabled)
        //     {
        //         // console.log("wont delete, patch is disabled");
        //         return;
        //     }
        //     const undofunc = (function (opname, opid)
        //     {
        //         const oldValues = {};
        //         for (let i = 0; i < op.portsIn.length; i++) oldValues[op.portsIn[i].name] = op.portsIn[i].get();

        //         CABLES.UI.undo.add({
        //             "title": "delete op",
        //             undo()
        //             {
        //                 const newop = gui.corePatch().addOp(opname, op.uiAttribs, opid);

        //                 for (const i in oldValues) if (newop.getPortByName(i))newop.getPortByName(i).set(oldValues[i]);
        //             },
        //             redo()
        //             {
        //                 gui.corePatch().deleteOp(opid, false);
        //             }
        //         });
        //     }(op.objName, op.id));

        //     let found = false;
        //     for (const i in self.ops)
        //     {
        //         if (self.ops[i].op == op)
        //         {
        //             const theUi = self.ops[i];
        //             found = true;

        //             theUi.hideAddButtons();
        //             theUi.remove();
        //             self.ops.splice(i, 1);
        //         }
        //     }

        //     gui.setStateUnsaved();
        //     self.checkLinkTimeWarnings();
        // }.bind(this));
    };

    // this.onLinkEvent = function (p1, p2)
    // {
    //     if (this.disabled) return;

    //     if (!isLoading)
    //         console.log("onlink event!", p1.parent.name, p1.name);

    //     gui.setStateUnsaved();

    //     let uiPort1 = null;
    //     let uiPort2 = null;
    //     for (let i = 0; i < self.ops.length; i++)
    //     {
    //         for (let j = 0; j < self.ops[i].portsIn.length; j++)
    //         {
    //             if (this.ops[i].portsIn[j].thePort == p1)
    //             {
    //                 uiPort1 = this.ops[i].portsIn[j];
    //                 break;
    //             }
    //             if (this.ops[i].portsIn[j].thePort == p2) uiPort2 = this.ops[i].portsIn[j];
    //         }
    //         // for (var jo in this.ops[i].portsOut) {
    //         for (let jo = 0; jo < this.ops[i].portsOut.length; jo++)
    //         {
    //             if (this.ops[i].portsOut[jo].thePort == p1) uiPort1 = this.ops[i].portsOut[jo];
    //             if (this.ops[i].portsOut[jo].thePort == p2) uiPort2 = this.ops[i].portsOut[jo];
    //         }
    //     }

    //     if (!uiPort1 || !uiPort2)
    //     {
    //         if (!isLoading)
    //             console.warn("no uiport found");

    //         gui.patch().checkOpsInSync();

    //         this.onLinkEvent(p1, p2);
    //         return;
    //     }

    //     const thelink = new UiLink(uiPort1, uiPort2);

    //     uiPort1.opUi.links.push(thelink);
    //     uiPort2.opUi.links.push(thelink);

    //     if (!isLoading)
    //     {
    //         uiPort1.opUi.redrawLinks();
    //         uiPort2.opUi.redrawLinks();

    //         if (!uiPort1.opUi.isHidden()) thelink.show();

    //         // todo: update is too often ?? check if current op is linked else do not update!!!

    //         const undofunc = (function (scene, p1Name, p2Name, op1Id, op2Id)
    //         {
    //             CABLES.UI.undo.add({
    //                 "title": "link",
    //                 undo()
    //                 {
    //                     const op1 = scene.getOpById(op1Id);
    //                     const op2 = scene.getOpById(op2Id);
    //                     if (!op1 || !op2)
    //                     {
    //                         console.warn("undo: op not found");
    //                         return;
    //                     }
    //                     op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
    //                 },
    //                 redo()
    //                 {
    //                     scene.link(scene.getOpById(op1Id), p1Name, scene.getOpById(op2Id), p2Name);
    //                 }
    //             });
    //         }(this.scene, p1.getName(), p2.getName(), p1.parent.id, p2.parent.id));
    //     }
    //     this.checkLinkTimeWarnings();
    // };

    // this.initUiOp = function (op, norandom)
    // {
    //     // if (!norandom && Math.random() > 0.9) return;
    //     if (this.disabled) return;

    //     // console.log("onopadd 2");
    //     if (!isLoading)
    //         gui.setStateUnsaved();

    //     this._elPatch.focus();
    //     let width = CABLES.UI.uiConfig.opWidth;
    //     if (op.name.length == 1) width = CABLES.UI.uiConfig.opWidthSmall;

    //     // console.log("onopadd 3");

    //     const x = CABLES.UI.OPSELECT.newOpPos.x;
    //     const y = CABLES.UI.OPSELECT.newOpPos.y;
    //     const uiOp = new OpUi(self.paper, op, x, y, width, CABLES.UI.uiConfig.opHeight, op.name);

    //     self.ops.push(uiOp);

    //     uiOp.wasAdded = false;

    //     // setTimeout(
    //     // ()=>{
    //     doAddOp(uiOp);
    //     this.opCollisionTest(uiOp);
    //     self.checkLinkTimeWarnings();

    //     // },10);
    // };


    // this.setOpTitle = function (uiop, t)
    // {
    //     uiop.op.setTitle(t);
    //     uiop.oprect.setTitle(t);
    // };

    // this.updateSubPatches = function ()
    // {
    //     if (isLoading) return;
    //     for (let i = 0; i < self.ops.length; i++)
    //     {
    //         if (!self.ops[i].op.uiAttribs.subPatch) self.ops[i].op.uiAttribs.subPatch = 0;
    //         if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch) self.ops[i].show();
    //         else self.ops[i].hide();
    //     }
    // };

    this.getCurrentSubPatch = function ()
    {
        return currentSubPatch;
    };

    this.isOpCurrentSubpatch = function (op)
    {
        return op.uiAttribs.subPatch == currentSubPatch;
    };

    // this.setCurrentSubPatch = function (which, next)
    // {
    //     if (currentSubPatch == which)
    //     {
    //         if (next)next();
    //         return;
    //     }

    //     // console.log("switch subpatch:", which);
    //     gui.log.userInteraction("switch subpatch " + which);

    //     gui.setWorking(true, "patch");

    //     // setTimeout(function ()
    //     // {
    //     subPatchViewBoxes[currentSubPatch] = this._viewBox.serialize();

    //     for (let i = 0; i < self.ops.length; i++) self.ops[i].isDragging = self.ops[i].isMouseOver = false;

    //     currentSubPatch = which;
    //     // self.updateSubPatches();

    //     // if (subPatchViewBoxes[which])
    //     // {
    //     //     // viewBox = subPatchViewBoxes[which];
    //     //     this._viewBox.deSerialize(subPatchViewBoxes[which]);
    //     //     this.updateViewBox();
    //     // }

    //     this._elPatch.focus();

    //     gui.setWorking(false, "patch");

    //     // this.currentPatchBounds = this.getSubPatchBounds();
    //     // }.bind(this), 10);

    //     if (next) next();
    // };


    // this.findSubpatchOp = function (subId, arr)
    // {
    //     arr = arr || [];
    //     for (let i = 0; i < self.ops.length; i++)
    //     {
    //         if (self.ops[i].op.objName == CABLES.UI.OPNAME_SUBPATCH && self.ops[i].op.patchId)
    //         {
    //             if (self.ops[i].op.patchId.get() == subId)
    //             {
    //                 arr.push({
    //                     "name": self.ops[i].op.name,
    //                     "id": self.ops[i].op.patchId.get()
    //                 });
    //                 if (self.ops[i].op.uiAttribs.subPatch !== 0)
    //                 {
    //                     self.findSubpatchOp(self.ops[i].op.uiAttribs.subPatch, arr);
    //                 }
    //             }
    //         }
    //     }
    //     return arr;
    // };

    this.getSubPatchPathString = function (subId)
    {
        const arr = this.findSubpatchOp(subId);
        let str = "";

        for (let i = 0; i < arr.length; i++) str += arr[i].name + " ";

        return str;
    };

    // this.subpatchBack = function ()
    // {
    //     const names = gui.patchView.getSubpatchPathArray(currentSubPatch);
    //     if (names[1]) this.setCurrentSubPatch(names[1].id);
    //     else this.setCurrentSubPatch(0);
    // };


    this.getSelectedOps = function ()
    {
        return selectedOps;
    };

    this.showSelectedOpsGraphs = function ()
    {
        gui.timeLine().clear();

        let doShow = true;
        let count = 0;
        if (selectedOps.length > 0)
        {
            for (let j = 0; j < selectedOps.length; j++)
            {
                for (let i = 0; i < selectedOps[j].portsIn.length; i++)
                {
                    if (selectedOps[j].portsIn[i].thePort.isAnimated() && selectedOps[j].portsIn[i].thePort.anim)
                    {
                        if (count === 0) doShow = !selectedOps[j].portsIn[i].thePort.anim.stayInTimeline;

                        selectedOps[j].portsIn[i].thePort.anim.stayInTimeline = doShow;
                        self.timeLine.setAnim(selectedOps[j].portsIn[i].thePort.anim);
                        count++;
                    }
                }
            }
        }

        if (!doShow) gui.timeLine().clear();
    };

    // this.opCollisionTest = function (uiOp)
    // {
    //     if (!uiOp) return;
    //     const perf = CABLES.UI.uiProfiler.start("opCollisionTest");
    //     let found = false;
    //     let count = 1;

    //     do
    //     {
    //         found = false;
    //         for (let i = 0; i < this.ops.length; i++)
    //         {
    //             const testOp = this.ops[i];
    //             if (testOp.op.objName.indexOf("Ui.Comment") != -1) continue;

    //             if (!testOp.op.deleted &&
    //                 (uiOp.op.objName.indexOf("Comment") == -1) &&
    //                 uiOp.op.id != testOp.op.id &&
    //                 uiOp.getSubPatch() == testOp.getSubPatch())
    //             {
    //                 const spacing = 8;

    //                 if ((uiOp.op.uiAttribs.translate.x >= testOp.op.uiAttribs.translate.x &&
    //                         uiOp.op.uiAttribs.translate.x <= testOp.op.uiAttribs.translate.x + testOp.getWidth())
    //                 )
    //                 {
    //                     let fixPos = false;
    //                     if (uiOp.op.uiAttribs.translate.y >= testOp.op.uiAttribs.translate.y &&
    //                         uiOp.op.uiAttribs.translate.y <= testOp.op.uiAttribs.translate.y + testOp.getHeight())
    //                     {
    //                         fixPos = true;
    //                         uiOp.setPos(
    //                             testOp.op.uiAttribs.translate.x,
    //                             testOp.op.uiAttribs.translate.y + (count * testOp.getHeight()) + spacing);
    //                         found = true;
    //                         break;
    //                     }

    //                     if (uiOp.op.uiAttribs.translate.y + testOp.getHeight() >= testOp.op.uiAttribs.translate.y &&
    //                         uiOp.op.uiAttribs.translate.y <= testOp.op.uiAttribs.translate.y + testOp.getHeight())
    //                     {
    //                         fixPos = true;
    //                         uiOp.setPos(
    //                             testOp.op.uiAttribs.translate.x,
    //                             testOp.op.uiAttribs.translate.y - (count * testOp.getHeight()) - spacing);
    //                         found = true;
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //         count++;
    //     }
    //     while (found);

    //     this._viewBox.setMinimapBounds();
    //     perf.finish();
    // };

    // this.checkCollisionsEdge = function ()
    // {
    //     const perf = CABLES.UI.uiProfiler.start("checkCollisionsEdge");

    //     for (let i = 0; i < this.ops.length; i++)
    //     {
    //         for (let j = 0; j < this.ops.length; j++)
    //         {
    //             if (i == j) continue;

    //             const a = this.ops[i].op;
    //             const b = this.ops[j].op;

    //             if (a.uiAttribs.translate.x == b.uiAttribs.translate.x &&
    //                 a.uiAttribs.translate.y == b.uiAttribs.translate.y)
    //             {
    //                 console.log("colliding!");
    //                 this.ops[j].setPos(
    //                     a.uiAttribs.translate.x,
    //                     a.uiAttribs.translate.y + 50
    //                 );
    //             }
    //         }
    //     }
    //     perf.finish();
    // };

    // this.testCollisionOpPosition = function (x, y, opid)
    // {
    //     return false;
    // };

    // this.findNonCollidingPosition = function (x, y, opid, dir)
    // {
    //     const pos = { "x": x, "y": y };
    //     return pos;
    // };

    // this.snapToNextOp = function (dir)
    // {
    //     if (!selectedOps || selectedOps.length === 0) return;

    //     for (let j = 0; j < selectedOps.length; j++)
    //     {
    //         const uiop = selectedOps[j];
    //         let startPort = uiop.op.portsIn[0];
    //         let otherport = null;

    //         if (dir > 0) startPort = uiop.op.portsOut[0];

    //         if (startPort.links.length > 0)
    //         {
    //             otherport = startPort.links[0].getOtherPort(startPort);
    //             if (startPort.isLinked())
    //             {
    //                 const transNextOp = otherport.parent.uiAttribs.translate;

    //                 let y = transNextOp.y;
    //                 if (dir > 0) y -= (uiop.getHeight() + 10);
    //                 else y += (uiop.getHeight() + 10);
    //                 uiop.setPos(transNextOp.x, y);
    //                 this.opCollisionTest(uiop);
    //             }
    //         }
    //     }
    // };

    // this.compressSelectedOps = function ()
    // {
    //     gui.patchView.compressSelectedOps(gui.patchView.getSelectedOps());
    //     this.updateSelectedOpPositions();
    // };

    // this.alignSelectedOps = function ()
    // {
    //     gui.patchView.alignOps(gui.patchView.getSelectedOps());
    //     this.updateSelectedOpPositions();
    // };

    // this.updatedOpPositionsFromUiAttribs = function (ops)
    // {
    //     self.checkOpsInSync();
    //     for (let i = 0; i < ops.length; i++)
    //     {
    //         if (ops[i].op) ops[i].setPos(ops[i].op.uiAttribs.translate.x, ops[i].op.uiAttribs.translate.y);
    //         else
    //         {
    //             const uiop = gui.patch().getUiOp(ops[i]);
    //             if (!uiop) console.log("NO UIOP", ops[i], uiop);
    //             else uiop.setPos(ops[i].uiAttribs.translate.x, ops[i].uiAttribs.translate.y);
    //         }
    //     }
    // };

    // this.updateSelectedOpPositions = function ()
    // {
    //     this.updatedOpPositionsFromUiAttribs(selectedOps);
    // };

    // this.selectChilds = function (id)
    // {
    //     if (!id)
    //     {
    //         if (selectedOps.length === 0) return;
    //         id = selectedOps[0].op.id;
    //     }
    //     const op = gui.corePatch().getOpById(id);
    //     gui.jobs().start({
    //         "id": "selectchilds",
    //         "title": "selecting child ops"
    //     },
    //     function ()
    //     {
    //         let i = 0;
    //         for (i in self.ops) self.ops[i].op.marked = false;

    //         op.markChilds();
    //         op.marked = false;

    //         for (i in self.ops)
    //         {
    //             if (self.ops[i].op.marked)
    //             {
    //                 self.addSelectedOp(self.ops[i]);
    //                 self.ops[i].setSelected(true);
    //             }
    //             else
    //             {
    //                 self.removeSelectedOp(self.ops[i]);
    //                 self.ops[i].setSelected(false);
    //             }
    //         }
    //         setStatusSelectedOps();

    //         gui.jobs().finish("selectchilds");
    //     }
    //     );
    // };

    // this.deleteChilds = function (id)
    // {
    //     const op = gui.corePatch().getOpById(id);
    //     gui.jobs().start({
    //         "id": "deletechilds",
    //         "title": "deleting ops"
    //     },
    //     function ()
    //     {
    //         op.deleteChilds();
    //         gui.jobs().finish("deletechilds");
    //     }
    //     );
    // };

    // this.deleteSelectedOps = function ()
    // {
    //     gui.patchView.deleteSelectedOps();
    //     this.updateBounds();
    // };

    // this.removeSelectedOp = function (uiop)
    // {
    //     for (const i in selectedOps)
    //     {
    //         if (selectedOps[i] == uiop)
    //         {
    //             uiop.op.setUiAttrib({ "selected": false });
    //             selectedOps.splice(i, 1);
    //             return;
    //         }
    //     }
    //     self.updateBounds();
    // };

    // this.focusOp = function (id, center)
    // {
    //     for (let i = 0; i < gui.patch().ops.length; i++)
    //     {
    //         if (gui.patch().ops[i].op.id == id)
    //         {
    //             gui.patch().ops[i].oprect.showFocus();

    //             if (center)
    //                 self._viewBox.center(
    //                     gui.patch().ops[i].op.uiAttribs.translate.x,
    //                     gui.patch().ops[i].op.uiAttribs.translate.y);
    //         }
    //     }
    // };

    // this.setSelectedOpById = function (id)
    // {
    //     // for (const i in gui.patch().ops)
    //     // {
    //     //     if (gui.patch().ops[i].op.id == id)
    //     //     {
    //     //         self.setCurrentSubPatch(gui.patch().ops[i].getSubPatch());

    //     //         gui.patch().setSelectedOp(null);
    //     //         gui.patch().setSelectedOp(gui.patch().ops[i]);
    //     //         gui.opParams.show(gui.patch().ops[i].op);
    //     //         return;
    //     //     }
    //     // }
    // };

    // this.addSelectedOpById = function (id)
    // {
    //     for (const i in gui.patch().ops)
    //     {
    //         if (gui.patch().ops[i].op.id == id)
    //         {
    //             self.addSelectedOp(gui.patch().ops[i]);
    //             return gui.patch().ops[i];
    //         }
    //     }
    // };

    // this.setSelectedOp = function (uiop)
    // {
    //     if (uiop === null)
    //     {
    //         selectedOps.length = 0;
    //         for (const i in gui.patch().ops)
    //         {
    //             gui.patch().ops[i].op.setUiAttrib({ "selected": false });
    //             gui.patch().ops[i].setSelected(false);
    //             gui.patch().ops[i].hideAddButtons();
    //         }
    //         return;
    //     }

    //     self.addSelectedOp(uiop);
    //     uiop.setSelected(true);
    // };

    // this.addSelectedOp = function (uiop)
    // {
    //     uiop.op.setUiAttrib({ "selected": true });
    //     uiop.oprect.setSelected(true);
    //     uiop.setSelected(true);
    //     for (const i in selectedOps)
    //         if (selectedOps[i] == uiop) return;
    //     selectedOps.push(uiop);
    // };

    // this.moveSelectedOpsFinished = function ()
    // {
    //     let i = 0;
    //     const undoGroup = CABLES.UI.undo.startGroup();

    //     if (selectedOps.length == 1) this.opCollisionTest(selectedOps[0]);
    //     for (i in selectedOps) selectedOps[i].doMoveFinished();

    //     CABLES.UI.undo.endGroup(undoGroup, "Move selected ops");
    // };

    // this.prepareMovingOps = function ()
    // {
    //     let i = 0;
    //     if (selectedOps.length == 1)
    //         for (i = 0; i < self.ops.length; i++)
    //             if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch)
    //                 for (let j = 0; j < self.ops[i].links.length; j++)
    //                     self.ops[i].links[j].setElementOrder();
    // };

    // this.moveSelectedOps = function (dx, dy, a, b, e)
    // {
    //     let i = 0;
    //     if (selectedOps.length == 1)
    //         for (i = 0; i < self.ops.length; i++)
    //             if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch)
    //                 for (let j = 0; j < self.ops[i].links.length; j++)
    //                     self.ops[i].links[j].showAddButton();

    //     for (i = 0; i < selectedOps.length; i++)
    //         selectedOps[i].doMove(dx, dy, a, b, e);
    // };

    // this.getUiOp = function (op)
    // {
    //     for (let i = 0; i < self.ops.length; i++)
    //         if (self.ops[i].op == op) return self.ops[i];
    //     return null;
    // };

    // this.updateOpParams = function (id)
    // {
    //     if (CABLES.UI.DRAGGINGOPS || CABLES.UI.selectedEndOp || CABLES.UI.selectedStartOp) return false;
    //     if (selectedOps.length != 1) return;
    //     if (selectedOps[0].op.id != id) return;
    //     gui.setTransformGizmo(null);
    //     const op = gui.corePatch().getOpById(id);
    //     self.showOpParams(op);
    //     return true;
    // };

    this.showProjectParams = function ()
    {
        // gui.opParams.dispose();
        // if (gui.fileManager)gui.fileManager.setFilePort(null);
        // const perf = CABLES.UI.uiProfiler.start("showProjectParams");

        // const s = {};
        // if (currentOp && currentOp)currentOp = null;

        // s.name = currentProject.name;
        // s.settings = gui.corePatch().settings;

        gui.patchView.showDefaultPanel();

        // perf.finish();
    };

    // this.updateCurrentOpParams = function ()
    // {
    //     if (currentOp) self.showOpParams(currentOp.op);
    // };

    // this.refreshOpParams = function (op)
    // {
    //     if (currentOp && currentOp.op == op) this.showOpParams(op);
    // };

    // let delayedShowOpParams = 0;
    // this.showOpParams = function (op)
    // {
    //     gui.setTransformGizmo(null);

    //     if (op)
    //     {
    //         if (gui.find() && gui.find().isVisible()) gui.find().setSelectedOp(op.id);
    //         clearTimeout(delayedShowOpParams);
    //         delayedShowOpParams = setTimeout(function ()
    //         {
    //             self._showOpParams(op);
    //         }, 10);
    //     }
    // };

    this.setSize = function (x, y, w, h)
    {
    };


    // this._showOpParams = function (op)
    // {
    //     gui.opParams.show(op);
    // };

    // let uupos = null;
    // let ctm;

    // this.getCanvasCoordsMouse = function (evt)
    // {
    //     ctm = this._elPatchSvg[0].getScreenCTM();
    //     ctm = ctm.inverse();

    //     uupos = this._elPatchSvg[0].createSVGPoint();
    //     uupos.x = evt.clientX || 0;
    //     uupos.y = evt.clientY || 0;
    //     uupos = uupos.matrixTransform(ctm);
    //     return uupos;
    // };

    // this.addAssetOpAuto = function (filename, event)
    // {
    //     gui.patchView.addAssetOpAuto(filename, event);
    // };
    // {
    //     if (!event) return;

    //     const ops = CABLES.UI.getOpsForFilename(filename);

    //     if (ops.length == 0)
    //     {
    //         CABLES.UI.notify("no known operator found");
    //         return;
    //     }

    //     const opname = ops[0];

    //     const x = gui.patch().getCanvasCoordsMouse(event).x;
    //     const y = gui.patch().getCanvasCoordsMouse(event).y;

    //     const uiAttr = { "translate": { "x": x, "y": y } };
    //     const op = gui.corePatch().addOp(opname, uiAttr);

    //     for (let i = 0; i < op.portsIn.length; i++)
    //         if (op.portsIn[i].uiAttribs.display == "file")
    //             op.portsIn[i].set(filename);
    // };

    // this.addAssetOp = function (opname, portname, filename, title)
    // {
    //     if (!title) title = filename;

    //     const uiAttr = {
    //         "title": title,
    //         "translate": {
    //             "x": this._viewBox.getCenterX(),
    //             "y": this._viewBox.getCenterY()
    //         }
    //     };
    //     gui.corePatch().addOp(opname, uiAttr, function (op)
    //     {
    //         if (op) op.getPort(portname).set("/assets/" + currentProject._id + "/" + filename);
    //         console.log("new op", op, opname);
    //     });
    // };

    this.disableEnableOps = function ()
    {
        if (!selectedOps.length) return;
        for (let i = 0; i < self.ops.length; i++) self.ops[i].op.marked = false;

        let newstate = false;
        if (!selectedOps[0].op.enabled) newstate = true;

        for (let j = 0; j < selectedOps.length; j++)
        {
            selectedOps[j].setEnabled(newstate);
        }
    };

    let lastTempOP = null;
    this.tempUnlinkOp = function ()
    {
        if (lastTempOP)
        {
            lastTempOP.op.undoUnLinkTemporary();
            lastTempOP.setEnabled(true);
            lastTempOP = null;
        }
        else
        {
            const op = selectedOps[0];
            if (op)
            {
                op.setEnabled(false);
                op.op.unLinkTemporary();
                lastTempOP = op;
            }
        }
    };
};
