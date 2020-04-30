
var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPNAME_SUBPATCH = 'Ops.Ui.SubPatch';

CABLES.UI.Patch = function(_gui) {
    var self = this;
    this.ops = [];
    this.scene = null;
    var gui = _gui;

    var watchPorts = [];
    var watchAnimPorts=[];
    var watchColorPicker=[];
    var currentProject = null;
    var currentOp = null;
    var spacePressed = false;
    var selectedOps = [];
    var currentSubPatch = 0;

    this.lastMouseMoveEvent = null;

    // var rubberBandStartPos = null;
    // var rubberBandPos = null;

    var mouseRubberBandStartPos = null;
    var mouseRubberBandPos = null;
    var mouseRubberBandSelectedBefore=[];
    var rubberBandRect = null;
    var isLoading = false;

    // var timeoutPan = 0;
    // var timeoutFpsLimit = 0;
    // var fpsLimitBefore = 0;
    var timeoutRubberBand = -1;

    var subPatchViewBoxes = [];
    this._serverDate='';

    // var miniMapBounding = null;

    this.background = null;
    this._elPatchSvg = null;
    this._elPatch = null;
    this._elBody = null;
    this._viewBox=null;
    this.currentPatchBounds=null;
    // var zoom=null;

    this._oldOpParamsId=null;

    this._uiAttrFpsLast=0;
    this._uiAttrFpsCount=0;

    var pastedupdateTimeout=null;

    CABLES.editorSession.addListener("param",
        function(name,data)
        {
            var lastTab=CABLES.UI.userSettings.get('editortab');

            if(data && data.opid && data.portname) this.openParamEditor(data.opid,data.portname,
                function()
                {
                    gui.mainTabs.activateTabByName(lastTab);
                    CABLES.UI.userSettings.set('editortab',lastTab);
                });
        }.bind(this));

    this.isLoading = function() { return isLoading; };
    this.getPaper = function() { return self.paper; };
    // this.getPaperMap = function() { return self.paperMap; };

    this.isCurrentOp=function(op)
    {
        if(op.op)return gui.opParams.isCurrentOp(op.op); // if is uiop
        return gui.opParams.isCurrentOp(op);
        // if(!currentOp)return false;
        // return currentOp.op==op;
    };
    this.isCurrentOpId=function(opid)
    {
        return gui.opParams.isCurrentOpId(opid);
        // if(!currentOp)return false;
        // return currentOp.op.id==opid;
    };

    this.getLargestPort = function() {
        var max = 0;
        var maxName = 'unknown';
        var j = 0;
        var ser = '';
        var maxValue = '';

        try {
            for (var i in this.ops) {
                for (j in this.ops[i].op.portsIn) {
                    ser = JSON.stringify(this.ops[i].op.portsIn[j].getSerialized());
                    if (ser.length > max) {
                        max = ser.length;
                        maxValue = ser;
                        maxName = this.ops[i].op.name + ' - in: ' + this.ops[i].op.portsIn[j].name;
                    }
                }
                for (j in this.ops[i].op.portsOut) {
                    ser = JSON.stringify(this.ops[i].op.portsOut[j].getSerialized());
                    if (ser.length > max) {
                        max = ser.length;
                        maxValue = ser;
                        maxName = this.ops[i].op.name + ' - out: ' + this.ops[i].op.portsOut[j].name;
                    }
                }
            }

            if (max > 10000) CABLES.UI.notify('warning big port: ' + maxName + ' / ' + max + ' chars');

        } catch (e) {
            console.error(e);
        } finally {

        }
    };

    this.paste = function(e) {
        if (e.clipboardData.types.indexOf('text/plain') > -1) {
            var str = e.clipboardData.getData('text/plain');
            e.preventDefault();


            str=str.replace("```",'');
            str=str.replace("```",'');

            var json = null;
            try {
                json = JSON.parse(str);
            } catch (exp) {
                CABLES.UI.notifyError("Paste failed");
                console.log(str);
                console.log(exp);
            }

            var oldSub=currentSubPatch;
            var k = 0;

            if (json) {
                if (json.ops) {

                    var focusSubpatchop=null;
                    gui.serverOps.loadProjectLibs(json, function() {
                        var i = 0,
                            j = 0; { // change ids
                            for (i in json.ops) {
                                var searchID = json.ops[i].id;
                                var newID = json.ops[i].id = CABLES.generateUUID();

                                json.ops[i].uiAttribs.pasted = true;

                                for (j in json.ops)
                                {
                                    if (json.ops[j].portsIn)
                                        for (k in json.ops[j].portsIn) {
                                            if (json.ops[j].portsIn[k].links) {
                                                var l = json.ops[j].portsIn[k].links.length;
                                                while (l--) {
                                                    if (json.ops[j].portsIn[k].links[l] === null) {
                                                        console.log('delete null link');
                                                        json.ops[j].portsIn[k].links.splice(l, 1);
                                                    }
                                                }

                                                for (l in json.ops[j].portsIn[k].links) {
                                                    if (json.ops[j].portsIn[k].links[l].objIn == searchID) json.ops[j].portsIn[k].links[l].objIn = newID;
                                                    if (json.ops[j].portsIn[k].links[l].objOut == searchID) json.ops[j].portsIn[k].links[l].objOut = newID;
                                                }
                                            }
                                        }
                                }
                            }
                        } { // set correct subpatch


                            var subpatchIds = [];
                            var fixedSubPatches = [];
                            for (i = 0; i < json.ops.length; i++)
                            {
                                if (CABLES.Op.isSubpatchOp(json.ops[i].objName))
                                {
                                    for (k in json.ops[i].portsIn)
                                    {
                                        if (json.ops[i].portsIn[k].name == 'patchId')
                                        {
                                            var oldSubPatchId = json.ops[i].portsIn[k].value;
                                            var newSubPatchId = json.ops[i].portsIn[k].value = CABLES.generateUUID();

                                            console.log('oldSubPatchId', oldSubPatchId);
                                            console.log('newSubPatchId', newSubPatchId);
                                            subpatchIds.push(newSubPatchId);

                                            focusSubpatchop=json.ops[i];

                                            for (j = 0; j < json.ops.length; j++) {
                                                // console.log('json.ops[j].uiAttribs.subPatch',json.ops[j].uiAttribs.subPatch);

                                                if (json.ops[j].uiAttribs.subPatch == oldSubPatchId) {
                                                    console.log('found child patch');

                                                    json.ops[j].uiAttribs.subPatch = newSubPatchId;
                                                    fixedSubPatches.push(json.ops[j].id);
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            for (i in json.ops) {
                                var found = false;
                                for (j = 0; j < fixedSubPatches.length; j++) {
                                    if (json.ops[i].id == fixedSubPatches[j]) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    json.ops[i].uiAttribs.subPatch = currentSubPatch;
                                }
                            }


                            for(i in subpatchIds)
                            {
                                gui.patch().setCurrentSubPatch(subpatchIds[i]);

                            }
                        }


                        { // change position of ops to paste
                            var minx = Number.MAX_VALUE;
                            var miny = Number.MAX_VALUE;

                            for (i in json.ops) {
                                if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate) {
                                    minx = Math.min(minx, json.ops[i].uiAttribs.translate.x);
                                    miny = Math.min(miny, json.ops[i].uiAttribs.translate.y);
                                }
                            }

                            for (i in json.ops) {
                                if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate) {
                                    var mouseX = 0,
                                        mouseY = 0;
                                    if (self.lastMouseMoveEvent) {
                                        mouseX = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).x;
                                        mouseY = gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent).y;
                                    }

                                    var x=json.ops[i].uiAttribs.translate.x + mouseX - minx;
                                    var y=json.ops[i].uiAttribs.translate.y + mouseY - miny;
                                    if(CABLES.UI.userSettings.get("snapToGrid"))
                                    {
                                        x=CABLES.UI.snapOpPosX(x);
                                        y=CABLES.UI.snapOpPosY(y);
                                    }
                                    json.ops[i].uiAttribs.translate.x = x;
                                    json.ops[i].uiAttribs.translate.y = y;

                                }
                            }
                        }

                        CABLES.UI.notify('Pasted ' + json.ops.length + ' ops');
                        self.setSelectedOp(null);


                        gui.patch().scene.deSerialize(json, false);

                        for(var i=0;i<json.ops.length;i++)
                        {
                            var uiop=self.addSelectedOpById(json.ops[i].id);

                            uiop.setSelected(false);
                            uiop.setSelected(true);
                            gui.setStateUnsaved();
                        }

                        setTimeout(function(){
                            gui.patch().setCurrentSubPatch(oldSub);

                            if(focusSubpatchop)
                            {
                                console.log(focusSubpatchop,mouseX,mouseY);
                                var op=gui.patch().scene.getOpById(focusSubpatchop.id);
                                // op.setUiAttrib({ "translate" : {"x":mouseX,"y":mouseY}});

                                var uiop=gui.patch().getUiOp(op);
                                uiop.setPos(mouseX,mouseY);

                                // gui.patch().focusOp(op.id,true);

                                console.log(op);
                                // gui.patch().centerViewBoxOps();
                            }

                        },100);

                        return;
                    });
                }
            }
        }
    };

    this.createCommentFromSelection = function() {
        var bounds = this.getSelectionBounds();
        var padding = 100;

        gui.scene().addOp('Ops.Ui.Comment', {
            size: [
                (bounds.maxx - bounds.minx) + padding * 3,
                (bounds.maxy - bounds.miny) + padding * 2
            ],
            translate: {
                x: bounds.minx - padding,
                y: bounds.miny - padding
            }
        });
    };

    this.highlightNamespace =function(ns)
    {
        for (var i=0;i<self.ops.length;i++)
            if(self.ops[i].op.objName.startsWith(ns)) self.ops[i].highlight(true);
                else self.ops[i].highlight(false);
    };

    this.highlightOpNamespace =function(op)
    {
        var parts=op.objName.split('.');
        parts.length=parts.length-1;
        var ns=parts.join(".");
        self.highlightNamespace(ns);
    };

    this.unPatchSubPatch = function(patchId) {
        var toSelect = [];
        for (var i in this.ops) {
            if (this.ops[i].op.uiAttribs.subPatch == patchId) {
                this.ops[i].op.uiAttribs.subPatch = currentSubPatch;
                toSelect.push(this.ops[i]);
            }
        }

        this.setCurrentSubPatch(currentSubPatch);

        for (var j in toSelect) {
            this.addSelectedOp(toSelect[j]);
            this.ops[i].setSelected(true);
        }
    };

    // this.resolveSubpatch = function() {
    //     if (currentSubPatch == 0) return;
    //     for (var i in self.ops)
    //         self.ops[i].op.uiAttribs.subPatch = 0;

    //     this.setCurrentSubPatch(0);
    // };

    this.createSubPatchFromSelection = function() {
        if (selectedOps.length == 1 && selectedOps[0].op.objName == CABLES.UI.OPNAME_SUBPATCH) {
            this.unPatchSubPatch(selectedOps[0].op.patchId.val);
            return;
        }

        var bounds = this.getSelectionBounds();
        var trans = {
            x: bounds.minx + (bounds.maxx - bounds.minx) / 2,
            y: bounds.miny
        };
        var patchOp = gui.scene().addOp(CABLES.UI.OPNAME_SUBPATCH, { "translate": trans });
        var patchId = patchOp.patchId.get();

        patchOp.uiAttr({ "translate": trans });

        var i, j, k;
        for (i in selectedOps) selectedOps[i].op.uiAttribs.subPatch = patchId;

        for (i = 0; i < selectedOps.length; i++)
        {
            for (j = 0; j < selectedOps[i].op.portsIn.length; j++)
            {
                var theOp = selectedOps[i].op;
                var found=null;
                for (k = 0; k < theOp.portsIn[j].links.length; k++)
                {
                    var otherPort = theOp.portsIn[j].links[k].getOtherPort(theOp.portsIn[j]);
                    var otherOp = otherPort.parent;
                    if (otherOp.uiAttribs.subPatch != patchId)
                    {
                        theOp.portsIn[j].links[k].remove();
                        k--;

                        if(found)
                        {
                            gui.scene().link(
                                otherPort.parent,
                                otherPort.getName(),
                                patchOp,
                                found
                            );
                        }
                        else
                        {
                            gui.scene().link(
                                otherPort.parent,
                                otherPort.getName(),
                                patchOp,
                                patchOp.dyn.name
                            );

                            found=patchOp.addSubLink(theOp.portsIn[j], otherPort);
                        }
                    }
                }

                if (theOp.portsOut[j])
                    for (k = 0; k < theOp.portsOut[j].links.length; k++) {
                        var otherPortOut = theOp.portsOut[j].links[k].getOtherPort(theOp.portsOut[j]);
                        if (otherPortOut) {
                            var otherOpOut = otherPortOut.parent;
                            if (otherOpOut.uiAttribs.subPatch != patchId) {
                                console.log('found outside connection!! ', otherPortOut.name);
                                theOp.portsOut[j].links[k].remove();
                                gui.scene().link(
                                    otherPortOut.parent,
                                    otherPortOut.getName(),
                                    patchOp,
                                    patchOp.dynOut.name
                                );
                                patchOp.addSubLink(theOp.portsOut[j], otherPortOut);
                            }
                        }
                    }
            }
        }

        self.setSelectedOpById(patchOp.id);
        self.updateSubPatches();
    };


    this._distance2dDir=function (x1,y1,x2,y2)
    {
        const xd = x2-x1;
        const yd = y2-y1;
        var d= Math.sqrt(xd*xd + yd*yd);
        if(xd<0)return 0-d;
        return d;
    }

    this.cursorNavigateHor=function(dir)
    {
        if(selectedOps.length==0)return;

        var nextOp=null;
        var nextOpDist=999999;

        for(var i=0;i<this.ops.length;i++)
        {
            // var dist=selectedOps[0].getPosX()-this.ops[i].getPosX();

            var startx=selectedOps[0].getPosX();
            if(dir==1) startx+=selectedOps[0].getWidth();
            var starty=selectedOps[0].getPosY();

            var endx=this.ops[i].getPosX();
            if(dir==0) endx+=this.ops[i].getWidth();


            var dist=this._distance2dDir(
                startx,
                starty,
                endx,
                this.ops[i].getPosY()

            );

            if(selectedOps[0].getPosX()==this.ops[i].getPosX())continue;

            if(dir==0 && dist<0 || dir==1 && dist>0)
            {
                dist=Math.abs(dist);
                if(dist<nextOpDist)
                {
                    nextOpDist=dist;
                    nextOp=this.ops[i];
                }
            }
        }

        if(nextOp)
        {
            this.setSelectedOp(null);
            this.setSelectedOp(nextOp);
            self._viewBox.centerIfNotVisible(selectedOps[0]);
        }

    };

    this.cursorNavigate=function(dir)
    {
        if(selectedOps.length==0)return;

        var ports=selectedOps[0].op.portsIn;
        if(dir==0)ports=selectedOps[0].op.portsOut;

        for(var i=0;i<ports.length;i++)
        {
            if(ports[i].isLinked())
            {
                var otherPort=ports[i].links[0].getOtherPort(ports[i]);
                this.setSelectedOpById(otherPort.parent.id);
                self._viewBox.centerIfNotVisible(selectedOps[0]);

                break;
            }
        }
    };

    this.cut = function(e) {
        self.copy(e);
        self.deleteSelectedOps();
    };

    this.copy = function(e) {
        var ops = [];
        var opIds = [];
        var j = 0,
            i = 0,
            k = 0,
            l = 0;

        for (i in selectedOps) {
            if (selectedOps[i].op.objName == CABLES.UI.OPNAME_SUBPATCH) {
                console.log('selecting subpatch', selectedOps[i].op.patchId.get());
                self.selectAllOpsSubPatch(selectedOps[i].op.patchId.get());
            }
        }

        for (i in selectedOps) {
            ops.push(selectedOps[i].op.getSerialized());
            opIds.push(selectedOps[i].op.id);
            selectedOps[i].oprect.showCopyAnim();
        }

        // remove links that are not fully copied...
        for (i = 0; i < ops.length; i++) {
            for (j = 0; j < ops[i].portsIn.length; j++) {
                if (ops[i].portsIn[j].links) {
                    k = ops[i].portsIn[j].links.length;
                    while (k--) {
                        if (ops[i].portsIn[j].links[k] && ops[i].portsIn[j].links[k].objIn && ops[i].portsIn[j].links[k].objOut) {
                            if (!CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objIn) || !CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objOut)) {
                                ops[i].portsIn[j].links[k] = null;
                            }
                        }
                    }
                }
            }
        }

        var objStr = JSON.stringify({
            "ops": ops
        });
        CABLES.UI.notify('Copied ' + selectedOps.length + ' ops');

        e.clipboardData.setData('text/plain', objStr);
        e.preventDefault();
    };

    $('#patch').hover(
        function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.patch);
        },
        function() {
            CABLES.UI.hideInfo();
        });

    $('#patch').keyup(function(e) {
        switch (e.which) {
            case 32:
                spacePressed = false;
                gui.setCursor();
                break;
        }
    });

    gui.keys.key("x","Unlink selected ops","down","patch",{}, (e) => { this.unlinkSelectedOps(); });
    gui.keys.key("f","Toggle data flow visualization","down","patch",{}, (e) => { this.toggleFlowVis(); });
    gui.keys.key("e","Edit op code","down","patch",{}, (e) => { CABLES.CMD.PATCH.editOp(); });

    gui.keys.key("a","Select all ops in current subpatch","down","patch",{"cmdCtrl":true}, (e) => { this.selectAllOps(); });
    gui.keys.key("a","Align selected ops vertical or horizontal","down","patch",{}, (e) => { this.alignSelectedOps(); });
    gui.keys.key("a","Compress selected ops vertically","down","patch",{"shiftKey":true}, (e) => { console.log("COMPRESS!");this.compressSelectedOps(); });

    gui.keys.key(" ","Drag left mouse button to pan patch","down","patch",{}, (e) => { spacePressed = true; gui.setCursor("grab"); });

    gui.keys.key("/","Go to root subpatch","down","patch",{}, (e) => { this.setCurrentSubPatch(0); });


    gui.keys.key("t","Change current op title","down","patch",{}, (e) => { CABLES.CMD.PATCH.setOpTitle(); });

    gui.keys.key("PageUp","Snap op below previous op","down","patch",{}, (e) => { this.snapToNextOp(-1); });
    gui.keys.key("PageDown","Snap op above next op","down","patch",{}, (e) => { this.snapToNextOp(1); });

    gui.keys.key("d","Temporary unlink op","down","patch",{shiftKey:true}, (e) => { this.tempUnlinkOp(); });
    gui.keys.key("d","Disable op and all childs","down","patch",{}, (e) => { self.disableEnableOps(); });

    gui.keys.key("j","Navigate op history back","down","patch",{}, (e) => { gui.opHistory.back(); });
    gui.keys.key("k","Navigate op history forward","down","patch",{}, (e) => { gui.opHistory.forward(); });

    gui.keys.key("j","Navigate op history back","down","patch",{"shiftKey":true}, (e) => { gui.opHistory.back(); });
    gui.keys.key("k","Navigate op history forward","down","patch",{"shiftKey":true}, (e) => { gui.opHistory.forward(); });



    gui.keys.key(["Delete","Backspace"],"Delete selected ops","down","patch",{}, (e) =>
    {
        self.deleteSelectedOps();
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        self.showProjectParams();
    });


    $('#patch').keydown(function(e)
    {
        switch (e.which)
        {
            case 38: // up
            this.cursorNavigate(1);
            break;
            case 40: // down
            this.cursorNavigate(0);
            break;
            case 37: // left
            this.cursorNavigateHor(0);
            break;
            case 39: // right
            this.cursorNavigateHor(1);
            break;


            case 27:
                gui.setCursor();
            break;


            // case 46:
            // case 8: // delete

            //     if(document.activeElement && document.activeElement.tagName=="INPUT")return;

            //     self.deleteSelectedOps();
            //     if (e.stopPropagation) e.stopPropagation();
            //     if (e.preventDefault) e.preventDefault();
            //     self.showProjectParams();
            //     break;



            case 90: // z undo
                if (e.metaKey || e.ctrlKey) {
                    if (e.shiftKey) CABLES.undo.redo();
                    else CABLES.undo.undo();
                }
                break;

            case 71: // g show graphs
                // self.setCurrentSubPatch(0);
                self.showSelectedOpsGraphs();
                break;



            case 187:
                this._viewBox.zoomStep(-1);
                break;
            case 189:
                this._viewBox.zoomStep(1);
                break;

            default:
                // console.log('key ',e.which,e.key);
                break;
        }
    }.bind(this));


    /**
     * Saves a patch to a file, overwrites the file it exists
     *
     * @param {object} patchData The data-object to be saved
     * @param string} path The file-path to store the patch, e.g. '/Users/ulf/myPatch.cables'
     */
    this.nativeWritePatchToFile = function(patchData, path) {
        console.log('Saving patch to: ', path);
        var fs = require('fs');
        // var os = require('os');
        // var path = require('path');
        if (path) {
            fs.writeFile(path, JSON.stringify(patchData, null, 2), function(err) {
                if(err) {
                    CABLES.UI.notifyError('Error saving patch');
                    return console.log(err);
                }
                console.log('Patch successfully saved');
                CABLES.UI.notify('patch saved');
                gui.jobs().finish('projectsave');
                gui.setStateSaved();
            });
        }
    }


    /**
     * Extracts the postfix-filename from a full filename
     *
     * @param {string} filename e.g. '/Users/Ulf/foo.cables'
     * @returns {string} filename prefix, e.g. 'foo'
     */
    this.getProjectnameFromFilename = function(filename) {
        if(!filename) { return ''; }
        var lastDotIndex = filename.lastIndexOf('.');
        var separator = filename.indexOf('/') > -1 ? '/' : '\\';
        var lastSeparatorIndex = filename.lastIndexOf(separator);
        var name = filename.substring(lastSeparatorIndex + 1, lastDotIndex);
        return name;
    };

    this.saveCurrentProjectAs = function(cb, _id, _name)
    {
        if(window.process && window.process.versions['electron'])
        {
            var electron = require('electron');
            var remote = electron.remote;
            var dialog = remote.dialog;

            var data = gui.patch().scene.serialize(true);

            data.ui = {
                "viewBox": {},
                "timeLineLength": gui.timeLine().getTimeLineLength()
            };

            gui.bookmarks.cleanUp();
            data.ui.bookmarks = gui.bookmarks.getBookmarks();
            data.ui.viewBox = this._viewBox.serialize();
            data.ui.subPatchViewBoxes = subPatchViewBoxes;
            data.ui.renderer = {};
            data.ui.renderer.w = gui.rendererWidth;
            data.ui.renderer.h = gui.rendererHeight;
            data.ui.renderer.s = gui.patch().scene.cgl.canvasScale||1;

            dialog.showSaveDialog(
                {
                    // file filters, only display files with these extensions
                    filters: [{
                        name: 'cables',
                        extensions: ['cables']
                    }]
                },
                function(filePath) {
                    self.nativeWritePatchToFile(data, filePath);
                    gui.patch().filename = filePath; // store the path so we don't have to ask on next save
                    console.log('gui.patch().filename saved: ', gui.patch().filename);
                    var projectName = self.getProjectnameFromFilename(filePath);
                    gui.setProjectName(projectName);
                }
            );
            return;
        }

        CABLES.UI.MODAL.prompt(
            "Save As...",
            "Enter a name for the copy of this Project ",
            gui.scene().name,
            function(name)
            {
                CABLESUILOADER.talkerAPI.send("newPatch",{"name":name},
                    function(err,d)
                    {
                        gui.scene().settings=gui.scene().settings||{};
                        gui.scene().settings.isPublic = false;
                        gui.scene().settings.secret = '';
                        gui.scene().settings.isExample = false;
                        gui.scene().settings.isTest = false;
                        gui.scene().settings.isFeatured = false;
                        gui.scene().settings.opExample = '';

                        self.saveCurrentProject(
                            function()
                            {
                                CABLESUILOADER.talkerAPI.send("gotoPatch",{"id":d._id});
                            }, d._id, d.name);

                    });
            });
    };

    this._timeoutLinkWarnings=null;
    this._checkLinkCounter=-1;

    this.checkLinkTimeWarnings=function(cont)
    {
        if (!cont) self._checkLinkCounter=-1;

        clearTimeout(this._timeoutLinkWarnings)
        this._timeoutLinkWarnings = setTimeout(function()
        {
            var perf = CABLES.uiperf.start('checkLinkTimeWarnings');

            self._checkLinkCounter++;
            if (self._checkLinkCounter >= self.ops.length)
            {
                self._checkLinkCounter=-1;
            }
            else
            {
                // console.log(self._checkLinkCounter);
                var op = self.ops[self._checkLinkCounter];

                if (op.op.uiAttribs.subPatch == currentSubPatch) {
                    op.op.checkLinkTimeWarnings();
                    op.op._checkLinksNeededToWork();
                }

                self.checkLinkTimeWarnings(true);
            }
            perf.finish();
        },2);

    }

    this.checkUpdatedSaveForce=function(updated)
    {
        this._serverDate=updated;
        CABLES.UI.MODAL.hide(true);
        CABLES.CMD.PATCH.save();
    }

    this.checkUpdated=function(cb)
    {
        if(!gui.project())return;
        if(CABLES.sandbox.isOffline())
        {
            if(cb)cb();
            return;
        }

        gui.jobs().start({
            id: 'checkupdated',
            title: 'check if patch was updated',
            indicator:'canvas'
        });

        // todo is this protected ?
        CABLES.api.get('project/' + gui.project()._id+'/updated',
            function(data)
            {
                if(this._serverDate!=data.updated)
                {
                    CABLES.UI.MODAL.showError('meanwhile...', 'This patch was changed. Your version is out of date. <br/><br/>Last update: '+data.updatedReadable+' by '+(data.updatedByUser||'unknown')+'<br/><br/>' );
                    CABLES.UI.MODAL.contentElement.append('<a class="button" onclick="CABLES.UI.MODAL.hide(true);">close</a>&nbsp;&nbsp;');
                    CABLES.UI.MODAL.contentElement.append('<a class="button" onclick="gui.patch().checkUpdatedSaveForce(\''+data.updated+'\');">save anyway</a>&nbsp;&nbsp;');
                    CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-refresh" onclick="CABLES.CMD.PATCH.reload();">reload patch</a>&nbsp;&nbsp;');
                }
                else
                {
                    if(cb)cb(null);
                }
                gui.jobs().finish('checkupdated');

            }.bind(this),function(){/*ignore errors*/}
        );
    };

    this.saveCurrentProject = function(cb, _id, _name)
    {
        if (this.loadingError) {
            CABLES.UI.MODAL.showError('Project not saved', 'Could not save project: had errors while loading!');
            return;
        }

        this.checkUpdated(
            function(err)
            {
                if(!err)this._saveCurrentProject(cb,_id,_name);

            }.bind(this)
        );
    }

    this._saveCurrentProject = function(cb, _id, _name)
    {
        this._savedPatchCallback=cb;

        for (var i = 0; i < this.ops.length; i++) {
            this.ops[i].removeDeadLinks();
            if (this.ops[i].op.uiAttribs.error) delete this.ops[i].op.uiAttribs.error;
            if (this.ops[i].op.uiAttribs.warning) delete this.ops[i].op.uiAttribs.warning;
        }

        gui.jobs().start({ id: 'projectsave', title: 'saving project',indicator:'canvas' });



        var id = currentProject._id;
        var name = currentProject.name;
        if (_id) id = _id;
        if (_name) name = _name;
        var data = gui.patch().scene.serialize(true);

        data.ui = {
            "viewBox": {},
            "timeLineLength": gui.timeLine().getTimeLineLength()
        };

        data.ui.bookmarks = gui.bookmarks.getBookmarks();
        data.ui.viewBox=this._viewBox.serialize();
        data.ui.subPatchViewBoxes = subPatchViewBoxes;

        data.ui.renderer = {};
        data.ui.renderer.w = gui.rendererWidth;
        data.ui.renderer.h = gui.rendererHeight;
        data.ui.renderer.s = data.ui.renderer.s = gui.patch().scene.cgl.canvasScale||1;

        // electron
        if(window.process && window.process.versions['electron']) {
            var electron = require('electron');
            var ipcRenderer = electron.ipcRenderer;
            var remote = electron.remote;
            var dialog = remote.dialog;

            console.log('gui.patch().filename before check: ', gui.patch().filename);
            // patch has been saved before, overwrite the patch
            if(gui.patch().filename) {
                self.nativeWritePatchToFile(data, gui.patch().filename);
            } else {
                dialog.showSaveDialog(
                    {
                        // file filters, only display files with these extensions
                        filters: [{
                            name: 'cables',
                            extensions: ['cables']
                        }]
                    },
                    function(filePath) {
                        self.nativeWritePatchToFile(data, filePath);
                        gui.patch().filename = filePath; // store the path so we don't have to ask on next save
                        console.log('gui.patch().filename saved: ', gui.patch().filename);
                        var projectName = self.getProjectnameFromFilename(filePath);
                        gui.setProjectName(projectName);
                    }
                );
            }

            return;
        }

        CABLES.patch.namespace=currentProject.namespace;

        try
        {
            data = JSON.stringify(data);
            gui.patch().getLargestPort();

            CABLES.sandbox.savePatch(
                {
                    "id":id,
                    "name":name,
                    "namespace":currentProject.namespace,
                    "data":data,
                },
                function(err,r)
                {
                    if(err)
                    {
                        console.warn('[save patch error]',err)
                    }

                    gui.jobs().finish('projectsave');

                    gui.setStateSaved();
                    if(this._savedPatchCallback) this._savedPatchCallback();
                    this._savedPatchCallback=null;

                    if(!r || !r.success)
                    {
                        var msg="no response";
                        if(r)msg=r.msg;
                        CABLES.UI.MODAL.showError('Patch not saved', 'Could not save patch: '+msg);
                        console.log(r);
                        return;
                    }
                    else CABLES.UI.notify('Patch saved');

                    self._serverDate=r.updated;

                    const thePatch=gui.patch().scene;
                    const cgl=thePatch.cgl;

                    const doSaveScreenshot=gui.patch().scene.isPlaying();
                    var w = $('#glcanvas').attr('width');
                    var h = $('#glcanvas').attr('height');

                    if(doSaveScreenshot)
                    {
                        $('#glcanvas').attr('width', 640);
                        $('#glcanvas').attr('height', 360);
                    }

                    if(doSaveScreenshot)
                    {
                        var screenshotTimeout = setTimeout(function() {
            //                             gui.patch().scene.cgl.setSize(w,h);
            //                             gui.patch().scene.resume();
                            cgl.setSize(w/cgl.pixelDensity,h/cgl.pixelDensity);
                            thePatch.resume();

                        }, 300);

                        thePatch.pause();
                        cgl.setSize(640,360);
                        thePatch.renderOneFrame();
                        thePatch.renderOneFrame();
                        gui.jobs().start({ id: 'screenshotsave', title: 'saving screenshot' });

                        cgl.screenShot(function(screenBlob)
                        {
                            clearTimeout(screenshotTimeout);

                            cgl.setSize(w/cgl.pixelDensity,h/cgl.pixelDensity);
                            thePatch.resume();

                            var reader = new FileReader();

                            reader.onload = function(event)
                            {
                                CABLESUILOADER.talkerAPI.send(
                                    "saveScreenshot",
                                    {
                                        "id":currentProject._id,
                                        "screenshot":event.target.result
                                    },
                                    function(err,r)
                                    {
                                        if(err)
                                        {
                                            console.warn('[screenshot save error]',err)
                                        }
                                        // console.log("screenshot saved!");
                                        gui.jobs().finish('screenshotsave');
                                        if (gui.onSaveProject) gui.onSaveProject();
                                    });
                            };
                            reader.readAsDataURL(screenBlob);
                        });
                    }

                }.bind(this)





                );
        } catch (e) {
            console.log(e);
            CABLES.UI.notifyError('error saving patch - try to delete disables ops');
        } finally {}
    };






    this.getCurrentProject = function() {

        return currentProject;
    };

    this.setCurrentProject = function(proj) {
        if (self.timeLine) self.timeLine.clear();

        currentProject = proj;
        if (currentProject === null) {
            $('#meta_content_files').hide();
        } else {
            $('#meta_content_files').show();

            // CABLES.UI.fileSelect.load();
            // gui.showFileManager();

            $('.viewProjectLink').attr('href', CABLES.sandbox.getCablesUrl()+'/p/' + proj._id);
        }
        $('#meta_content_files').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.projectFiles);
        }, function() {
            CABLES.UI.hideInfo();
        });
    };


    this.fixTitlePositions=function()
    {
        for(var i in this.ops)
        {
            this.ops[i].fixTitle();
        }
    }

    this.centerViewBoxOps = function() {

        if(selectedOps.length>0) this._viewBox.centerSelectedOps();
        else this._viewBox.centerAllOps();
    };

    this.centerViewBoxOp=function(opid)
    {
        this._viewBox.center(
            this.scene.getOpById(opid).uiAttribs.translate.x,
            this.scene.getOpById(opid).uiAttribs.translate.y);
    }


    this._setBoundsXYWH=function(bounds)
    {
        bounds.x = bounds.minx - 100;
        bounds.y = bounds.miny - 100;
        bounds.w = Math.abs(bounds.maxx - bounds.minx) ;
        bounds.h = Math.abs(bounds.maxy - bounds.miny) ;

        if (bounds.h > bounds.w) bounds.x -= Math.abs(bounds.maxx - bounds.minx) / 2;

        bounds.w += 200;
        bounds.h += 200;
    }

    this.getSelectionBounds = function () {
        var bounds = {
            minx: 9999999,
            maxx: -9999999,
            miny: 9999999,
            maxy: -9999999,
        };

        for (var j = 0; j < selectedOps.length; j++) {
            if (selectedOps[j].op.uiAttribs && selectedOps[j].op.uiAttribs.translate) {
                // console.log(selectedOps[j].op.uiAttribs.translate.x);
                bounds.minx = Math.min(bounds.minx, selectedOps[j].op.uiAttribs.translate.x);
                bounds.maxx = Math.max(bounds.maxx, selectedOps[j].op.uiAttribs.translate.x);
                bounds.miny = Math.min(bounds.miny, selectedOps[j].op.uiAttribs.translate.y);
                bounds.maxy = Math.max(bounds.maxy, selectedOps[j].op.uiAttribs.translate.y);
            }
        }

        this._setBoundsXYWH(bounds);

        return bounds;
    };

    this.getSubPatchBounds = function(subPatch) {

        var perf = CABLES.uiperf.start('patch.getSubPatchBounds');

        if (subPatch === undefined) subPatch=currentSubPatch;

        var bounds = {
            minx: 9999999,
            maxx: -9999999,
            miny: 9999999,
            maxy: -9999999,
        };

        for (var j = 0; j < self.ops.length; j++)
            if (self.ops[j].op.objName.indexOf("Ops.Ui.") == -1) {
                if (self.ops[j].op.uiAttribs && self.ops[j].op.uiAttribs.translate)
                    if (!self.ops[j].op.uiAttribs.subPatch || self.ops[j].op.uiAttribs.subPatch == subPatch) {
                        bounds.minx = Math.min(bounds.minx, self.ops[j].op.uiAttribs.translate.x);
                        bounds.maxx = Math.max(bounds.maxx, self.ops[j].op.uiAttribs.translate.x);
                        bounds.miny = Math.min(bounds.miny, self.ops[j].op.uiAttribs.translate.y);
                        bounds.maxy = Math.max(bounds.maxy, self.ops[j].op.uiAttribs.translate.y);
                    }
            }

        this._setBoundsXYWH(bounds);

        perf.finish();

        return bounds;
    };

    this.updateViewBox = function() {
        this._viewBox.update();
    };

    function rubberBandHide() {
        mouseRubberBandStartPos = null;
        mouseRubberBandPos = null;
        if (rubberBandRect) rubberBandRect.hide();
    }


    function setStatusSelectedOps() {
        var html = CABLES.UI.getHandleBarHtml(
            'params_ops', {
                numOps: selectedOps.length,
            });

        $('#options').html(html);
        gui.setTransformGizmo(null);

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedMultiOps);
    }
    this.setStatusSelectedOps=setStatusSelectedOps;

    this.selectAllOpsSubPatch = function(subPatch) {
        for (var i in self.ops) {
            if (self.ops[i].getSubPatch() == subPatch) {
                self.addSelectedOp(self.ops[i]);
                self.ops[i].setSelected(true);
            }
        }
        setStatusSelectedOps();
    };

    this.selectAllOps = function() {
        this.selectAllOpsSubPatch(currentSubPatch);
    };

    function rubberBandMove(e) {

        gui.pauseProfiling();

        if(CABLES.SPLITPANE.bound)return;

        if(e.altKey || e.metaKey)
        {
            // zoom in for tablets ?
            var delta=e.originalEvent.movementY;

            if(delta==0)return;
            if (delta < 0) delta = 0.95;
            else delta = 1.05;

            self._viewBox.zoom(delta);

        }

        if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && !spacePressed && !e.altKey && !e.metaKey) {
            gui.setTransformGizmo(null);

            if(!mouseRubberBandStartPos && !e.shiftKey) gui.patch().setSelectedOp(null);
            if(!mouseRubberBandStartPos) mouseRubberBandStartPos = gui.patch().getCanvasCoordsMouse(e); //e.offsetX,e.offsetY);

            mouseRubberBandPos = gui.patch().getCanvasCoordsMouse(e); //e.offsetX,e.offsetY);

            if (!rubberBandRect) {
                rubberBandRect = self.paper.rect(0, 0, 10, 10).attr({});
                rubberBandRect.node.classList.add("rubberband");
            }
            rubberBandRect.show();
            var start = {
                x: mouseRubberBandStartPos.x,
                y: mouseRubberBandStartPos.y
            };
            var end = {
                x: mouseRubberBandPos.x,
                y: mouseRubberBandPos.y
            };

            if (end.x - start.x < 0) {
                var tempx = start.x;
                start.x = end.x;
                end.x = tempx;
            }

            if (end.y - start.y < 0) {
                var tempy = start.y;
                start.y = end.y;
                end.y = tempy;
            }

            rubberBandRect.attr({
                x: start.x,
                y: start.y,
                width: end.x - start.x,
                height: end.y - start.y
            });

            rubberBandRect.toFront();

            if (timeoutRubberBand == -1)
                timeoutRubberBand = setTimeout(function()
                {
                    for (var i in self.ops)
                    {
                        if (!self.ops[i].isHidden())
                        {
                            var rect = self.ops[i].oprect.getRect();
                            if (rect && rect.matrix)
                            {
                                var opX = rect.matrix.e;
                                var opY = rect.matrix.f;
                                var opW = rect.attr("width");
                                var opH = rect.attr("height");

                                if( opX + opW >= start.x &&     // glop. right edge past r2 left
                                    opX <= end.x &&       // glop. left edge past r2 right
                                    opY + opH >= start.y &&       // glop. top edge past r2 bottom
                                    opY <= end.y)  // r1 bottom edge past r2 top
                                {
                                    self.addSelectedOp(self.ops[i]);
                                    self.ops[i].setSelected(true);
                                } else {
                                    self.removeSelectedOp(self.ops[i]);
                                    self.ops[i].setSelected(false);
                                }
                            }
                        }
                    }

                    for(var i=0;i<mouseRubberBandSelectedBefore.length;i++)
                    {
                        var o=mouseRubberBandSelectedBefore[i];
                        self.addSelectedOp(o);
                        o.setSelected(true);
                    }

                    if (selectedOps.length !== 0) setStatusSelectedOps();
                    timeoutRubberBand = -1;

                }, 10);

        }
    }

    // ---------------------------------------------

    this.loadingError = false;

    this.setProject = function(proj) {
        this.loadingError = false;
        if (proj.ui) {
            if (proj.ui.subPatchViewBoxes) subPatchViewBoxes = proj.ui.subPatchViewBoxes;
            if (proj.ui.viewBox) {
                this._viewBox.deSerialize(proj.ui.viewBox);
            }

            if (proj.ui.renderer) {

                if(proj.ui.renderer.w>document.body.clientWidth*0.9 || proj.ui.renderer.h>document.body.clientHeight*0.9)
                {
                    proj.ui.renderer.w=640;
                    proj.ui.renderer.h=360;
                }

                gui.rendererWidth = proj.ui.renderer.w;
                gui.rendererHeight = proj.ui.renderer.h;
                gui.patch().scene.cgl.canvasScale=proj.ui.renderer.s||1;
                gui.setLayout();
            }

            gui.timeLine().setTimeLineLength(proj.ui.timeLineLength);

        }

        self.updateViewBox();
        currentSubPatch = 0;
        gui.setProjectName(proj.name);
        self.setCurrentProject(proj);
        this._serverDate=proj.updated;
        gui.scene().clear();
        gui.patch().updateBounds();

        gui.serverOps.loadProjectLibs(proj, function() {
            gui.scene().deSerialize(proj);
            CABLES.undo.clear();
            CABLES.UI.MODAL.hideLoading();
            self.updateSubPatches();
            gui.patch().updateBounds();

            // gui.patchConnection.send(CABLES.PACO_LOAD, {
            //     "patch": JSON.stringify(proj),
            // });
        });
    };

    this.show = function(_scene) {
        this.scene = _scene;

        $('#timing').append(CABLES.UI.getHandleBarHtml('timeline_controler'), {});
        $('#meta').append();

        this.paper = Raphael("patch", 0, 0);
        this._viewBox = new CABLES.UI.PatchViewBox(this, this.paper);
        this.bindScene(self.scene);

        this._elPatchSvg = this._elPatchSvg || $('#patch svg');
        this._elPatch = this._elPatch || $('#patch');
        this._elBody = this._elBody || $('body');

        this._elBody.oncontextmenu =
        this._elPatchSvg.oncontextmenu =
        this._elPatch.oncontextmenu = function(e){ e.preventDefault(); }
        document.addEventListener("contextmenu", function(e){ e.preventDefault(); }, false);

        this._viewBox.bindWheel(this._elPatchSvg);

        this.background = this.paper.rect(-99999, -99999, 2 * 99999, 2 * 99999).attr({
            fill: CABLES.UI.uiConfig.colorBackground,
            opacity: 0.01,
            "stroke-width": 0
        });

        this.background.toBack();

        this.background.node.onmousemove = function(ev) {
            CABLES.UI.selectedEndOp = null;
        };

        this.background.node.onmousedown = function(ev)
        {
            gui.pauseProfiling();

            CABLES.UI.showInfo(CABLES.UI.TEXTS.patch);
            this._elPatch.focus();
            CABLES.UI.OPSELECT.linkNewOpToPort=null;

            if(ev.shiftKey)
            {
                mouseRubberBandSelectedBefore.length=0;
                for(var i=0;i<selectedOps.length;i++)
                    mouseRubberBandSelectedBefore.push(selectedOps[i]);
            }
            if (!ev.shiftKey && !spacePressed && ev.buttons == CABLES.UI.MOUSE_BUTTON_LEFT)
            {
                gui.patch().setSelectedOp(null);
                self.showProjectParams();
            }
        }.bind(this);


        this.toggleCenterZoom=function(e)
        {
            this._viewBox.centerAllOps();
        }

        this.background.node.ondblclick = function(e) {
            e = mouseEvent(e);
            self.toggleCenterZoom(e);
        };

        $('#patch').on("mousemove", function(e)
        {
            if (CABLES.SPLITPANE.bound) return;

            e = mouseEvent(e);

            if (CABLES.UI.MOUSEOVERPORT) return;
            gui.notIdling();

            if (e.metaKey || e.altKey || e.buttons===CABLES.UI.MOUSE_BUTTON_WHEEL)
            {
                if (CABLES.UI.quickAddOpStart)
                {
                    gui.setCursor("copy");

                    if (!self.quickLinkLine)
                    {
                        self.quickLinkLine = new CABLES.UI.SVGLine(
                        gui.patch().getCanvasCoordsMouse(e).x,// CABLES.UI.quickAddOpStart.op.uiAttribs.translate.x + 30,
                        CABLES.UI.quickAddOpStart.op.uiAttribs.translate.y + 28);

                    }
                    self.quickLinkLine.updateEnd(
                        gui.patch().getCanvasCoordsMouse(e).x,
                        gui.patch().getCanvasCoordsMouse(e).y
                    );

                    return;
                }

            } else if (self.quickLinkLine) {
                self.removeQuickLinkLine();
                gui.setCursor();
            }

            if (CABLES.UI.MOUSEDRAGGINGPORT) return; // cancel when dragging port...

            if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && !spacePressed) {
                for (var i in self.ops)
                    if (!self.ops[i].isHidden() && (self.ops[i].isDragging || self.ops[i].isMouseOver)) return;
                rubberBandMove(e);
            }
        });

        this._elPatchSvg.bind("mouseup", function(event) {
            rubberBandHide();
            mouseRubberBandSelectedBefore.length=0;
            gui.setCursor();
        }.bind(this));

        this._elPatchSvg.bind("mouseenter", function(event) { gui.setCursor(); }.bind(this));
        this._elPatchSvg.bind("mouseleave", function(event) { gui.setCursor(); }.bind(this));

        this._elPatchSvg.bind("touchstart", (e) =>
        {
            e = mouseEvent(e);
            this.lastMouseMoveEvent = null;
        });

        this._elPatchSvg.bind("touchmove", (e) => {
            e = mouseEvent(e);

            if (this.lastMouseMoveEvent && selectedOps.length==0)
            {
                const lastMouseCoord=gui.patch().getCanvasCoordsMouse(this.lastMouseMoveEvent)
                this._viewBox.setXY(
                    this._viewBox.getX() + lastMouseCoord.x - gui.patch().getCanvasCoordsMouse(e).x,
                    this._viewBox.getY() + lastMouseCoord.y - gui.patch().getCanvasCoordsMouse(e).y);
                callEvent('patch_pan');
            }
            this.lastMouseMoveEvent = e;
            e.preventDefault();
        });


        this._elPatchSvg.bind("mousemove", function(e)
        {
            e = mouseEvent(e);

            if (CABLES.UI.MOUSEOVERPORT) return;

            if ((CABLES.UI.MOUSEDRAGGINGPORT && !spacePressed) || (mouseRubberBandStartPos && e.buttons != CABLES.UI.MOUSE_BUTTON_LEFT) ) {
                rubberBandHide();
                self.lastMouseMoveEvent = e;
                return;
            }

            // panning
            if (self.lastMouseMoveEvent &&
                (e.buttons == CABLES.UI.MOUSE_BUTTON_RIGHT || (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && spacePressed) )) { // && !CABLES.UI.MOUSEDRAGGINGPORT

                gui.pauseProfiling();

                gui.setCursor("grab");
                this._elPatch.focus();
                const lastMouseCoord=gui.patch().getCanvasCoordsMouse(self.lastMouseMoveEvent)

                this._viewBox.setXY(
                    this._viewBox.getX() + lastMouseCoord.x - gui.patch().getCanvasCoordsMouse(e).x,
                    this._viewBox.getY() + lastMouseCoord.y - gui.patch().getCanvasCoordsMouse(e).y);

                callEvent('patch_pan');
            }

            self.lastMouseMoveEvent = e;

        }.bind(this));

        this.timeLine = new CABLES.TL.UI.TimeLineUI();

        gui.setLayout();

    };

    function doLink() {}

    this.removeQuickLinkLine = function() {
        if (self.quickLinkLine) {
            self.quickLinkLine.remove();
            self.quickLinkLine = null;
        }
    };

    this.removeDeadLinks = function() {
        setTimeout(function() {
            for (var i in self.ops)
                self.ops[i].removeDeadLinks();
            console.log("removeDeadLinks");
        }, 10);
    };

    function doAddOp(uiOp) {

        function checkDuplicatePorts(op)
        {
            for(var j=0;j<op.portsIn.length;j++)
                for(var i=0;i<op.portsIn.length;i++)
                    if(i!=j)
                        if(op.portsIn[i].name==op.portsIn[j].name)
                        {
                            console.error('op '+op.objName+' has duplicate port names ('+op.portsIn[j].name+'), they must be unique. ');
                            CABLES.UI.notifyError("Warning! Op has duplicate port name they must be unique. ");
                        }
        }
        var op = uiOp.op;

        if (!isLoading) {
            var undofunc = function(opid, objName) {
                CABLES.undo.add({
                    undo: function() {
                        gui.scene().deleteOp(opid, true);
                    },
                    redo: function() {
                        gui.scene().addOp(objName, op.uiAttribs, opid);
                    }
                });

            }(op.id, op.objName);

            gui.patchConnection.send(CABLES.PACO_OP_CREATE, {
                "opId": op.id,
                "objName": op.objName
            });
        }


        op.onAddPort = function(p) {
            uiOp.addPort(p.direction, p);
            uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        };

        if (op.uiAttribs && op.uiAttribs.subPatch) {
            if (op.uiAttribs.subPatch != currentSubPatch) uiOp.hide();
        }

        uiOp.initPorts();

        checkDuplicatePorts(op);

        if (!op.uiAttribs) op.uiAttribs = {};

        if (!op.uiAttribs.translate)
        {
            if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0)  op.uiAttribs.translate = { x: self._viewBox.getCenterX(), y: self._viewBox.getCenterY()  };
                else  op.uiAttribs.translate = { x: CABLES.UI.OPSELECT.newOpPos.x, y: CABLES.UI.OPSELECT.newOpPos.y };
        }

        if (op.uiAttribs.hasOwnProperty('translate'))
        {
            if(CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.x=CABLES.UI.snapOpPosX(op.uiAttribs.translate.x);
            if(CABLES.UI.userSettings.get("snapToGrid")) op.uiAttribs.translate.y=CABLES.UI.snapOpPosY(op.uiAttribs.translate.y);
            uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        }

        if (op.uiAttribs.hasOwnProperty('title')) gui.patch().setOpTitle(uiOp, op.uiAttribs.title);

        if (!op.uiAttribs.hasOwnProperty('subPatch')) op.uiAttribs.subPatch = currentSubPatch;

        if (CABLES.UI.OPSELECT.linkNewOpToSuggestedPort) {
            console.log('CABLES.UI.OPSELECT.linkNewOpToSuggestedPort');
            var link = gui.patch().scene.link(
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op,
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName,
                op,
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName);
        } else
        if (CABLES.UI.OPSELECT.linkNewLink) {

            var op1 = null;
            var op2 = null;
            var port1 = null;
            var port2 = null;

            if(CABLES.UI.OPSELECT.linkNewLink.p1)
            {
                // patch_link
                op1 = CABLES.UI.OPSELECT.linkNewLink.p1.op;
                op2 = CABLES.UI.OPSELECT.linkNewLink.p2.op;
                port1 = CABLES.UI.OPSELECT.linkNewLink.p1.thePort;
                port2 = CABLES.UI.OPSELECT.linkNewLink.p2.thePort;
            }
            else
            {
                // core link
                op2 = CABLES.UI.OPSELECT.linkNewLink.portIn.parent;
                op1 = CABLES.UI.OPSELECT.linkNewLink.portOut.parent;
                port2 = CABLES.UI.OPSELECT.linkNewLink.portIn;
                port1 = CABLES.UI.OPSELECT.linkNewLink.portOut;
            }

            var foundPort1 = op.findFittingPort(port1);
            var foundPort2 = op.findFittingPort(port2);

            if (foundPort2 && foundPort1) {

                for (var il in port1.links) {
                    if (
                        port1.links[il].portIn == port1 && port1.links[il].portOut == port2 ||
                        port1.links[il].portOut == port1 && port1.links[il].portIn == port2) {
                            port1.links[il].remove();
                    }
                }

                gui.scene().link(
                    op,
                    foundPort1.getName(),
                    op1,
                    port1.getName()
                );

                gui.scene().link(
                    op,
                    foundPort2.getName(),
                    op2,
                    port2.getName()
                );
            }
        } else
        if (CABLES.UI.OPSELECT.linkNewOpToPort)
        {
            const foundPort = op.findFittingPort(CABLES.UI.OPSELECT.linkNewOpToPort);
            if (foundPort)
            {
                // console.log(op.objName,'op.objName');
                if(op.objName=='Ops.Value.Number')
                {
                    var oldValue=CABLES.UI.OPSELECT.linkNewOpToPort.get();
                    op.getPort("value").set(oldValue);
                    op.setTitle(CABLES.UI.OPSELECT.linkNewOpToPort.getName());
                }

                gui.patch().scene.link(
                    CABLES.UI.OPSELECT.linkNewOpToOp,
                    CABLES.UI.OPSELECT.linkNewOpToPort.getName(),
                    op,
                    foundPort.getName());
            }
        }

        // var dir=null;
        // if(CABLES.UI.OPSELECT.linkNewOpToPort)dir=CABLES.UI.OPSELECT.linkNewOpToPort.direction;

        CABLES.UI.OPSELECT.linkNewOpToOp = null;
        CABLES.UI.OPSELECT.linkNewLink = null;
        CABLES.UI.OPSELECT.newOpPos = { x: 0, y: 0 };
        CABLES.UI.OPSELECT.linkNewOpToSuggestedPort = null;
        CABLES.UI.OPSELECT.linkNewOpToPort = null;

        uiOp.setPos();

        // var pos = self.findNonCollidingPosition(uiOp.getPosX(), uiOp.getPosY(), uiOp.op.id,dir);

        uiOp.setPos( uiOp.getPosX(), uiOp.getPosY() );

        if (!isLoading) {
            setTimeout(function() {
                if (currentSubPatch == uiOp.getSubPatch()) uiOp.show();

                if (showAddedOpTimeout != -1) clearTimeout(showAddedOpTimeout);
                showAddedOpTimeout = setTimeout(function() {
                    gui.patch().setSelectedOp(null);
                    gui.patch().setSelectedOp(uiOp);
                    gui.patch().showOpParams(op);
                    gui.patch().updateBounds();
                    gui.patch().getViewBox().update();
                    uiOp.oprect.showFocus();
                }, 30);
            }, 30);
        }

        // select ops after pasting...
        if (uiOp.op.uiAttribs.pasted) {
            delete uiOp.op.uiAttribs.pasted;
            gui.patch().addSelectedOpById(uiOp.op.id);
            uiOp.setSelected(true);
            uiOp.show();
            setStatusSelectedOps();
            self.updateSubPatches();
            uiOp.oprect.showFocus();
            gui.patch().updateBounds();

            setTimeout(function() {
                // this fixes links not showing up after pasting
                uiOp.setPos();
                gui.patch().getViewBox().update();
            }, 30);

        }



        if (uiOp.op.objName.startsWith('Ops.Deprecated.')) uiOp.op.uiAttr({
            error: "Op is deprecated"
        });
        uiOp.wasAdded = true;
    }

    var showAddedOpTimeout = -1;


    this.bindScene = function(scene) {
        scene.onLoadStart = function() {
            isLoading = true;
        };
        scene.onLoadEnd = function() {
            isLoading = false;
            self.setCurrentSubPatch(currentSubPatch);
            self.showProjectParams();
            gui.setStateSaved();

            // if (self.ops.length > CABLES.UI.uiConfig.miniMapShowAutomaticallyNumOps) {
            //     gui.showMiniMap();
            // }

            logStartup('Patch loaded');
        };

        scene.addEventListener("onUnLink",function(p1, p2) {
            gui.setStateUnsaved();

            // todo: check if needs to be updated ?
            self.updateCurrentOpParams();

            for (var i in this.ops) {

                for (var j in this.ops[i].links) {
                    if (this.ops[i].links[j].p1 && this.ops[i].links[j].p2 &&
                        ((this.ops[i].links[j].p1.thePort == p1 && this.ops[i].links[j].p2.thePort == p2) ||
                            (this.ops[i].links[j].p1.thePort == p2 && this.ops[i].links[j].p2.thePort == p1))) {
                        var undofunc = function(p1Name, p2Name, op1Id, op2Id) {
                            CABLES.undo.add({
                                undo: function() {
                                    scene.link(scene.getOpById(op1Id), p1Name, scene.getOpById(op2Id), p2Name);
                                },
                                redo: function() {
                                    var op1 = scene.getOpById(op1Id);
                                    var op2 = scene.getOpById(op2Id);
                                    if (!op1 || !op2) {
                                        console.warn('undo: op not found');
                                        return;
                                    }
                                    op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
                                }
                            });
                        }(this.ops[i].links[j].p1.thePort.getName(),
                            this.ops[i].links[j].p2.thePort.getName(),
                            this.ops[i].links[j].p1.thePort.parent.id,
                            this.ops[i].links[j].p2.thePort.parent.id
                        );

                        gui.patchConnection.send(CABLES.PACO_UNLINK, {
                            "op1": this.ops[i].links[j].p1.thePort.parent.id,
                            "op2": this.ops[i].links[j].p2.thePort.parent.id,
                            "port1": this.ops[i].links[j].p1.thePort.getName(),
                            "port2": this.ops[i].links[j].p2.thePort.getName(),
                        });

                        this.ops[i].links[j].hideAddButton();

                        this.ops[i].links[j].p1.updateUI();
                        this.ops[i].links[j].p2.updateUI();
                        this.ops[i].links[j].p1 = null;
                        this.ops[i].links[j].p2 = null;
                        this.ops[i].links[j].remove();
                    }
                }
                this.ops[i].removeDeadLinks();
            }
            this.checkLinkTimeWarnings();
        }.bind(this));

        scene.addEventListener("onLink",function(p1, p2)
        {
            gui.setStateUnsaved();

            var uiPort1 = null;
            var uiPort2 = null;
            for (var i=0;i<self.ops.length;i++)
            {
                for (var j=0;j<self.ops[i].portsIn.length;j++)
                {
                    if (this.ops[i].portsIn[j].thePort == p1)
                    {
                        uiPort1 = this.ops[i].portsIn[j];
                        break;
                    }
                    if (this.ops[i].portsIn[j].thePort == p2) uiPort2 = this.ops[i].portsIn[j];
                }
                // for (var jo in this.ops[i].portsOut) {
                for (var jo=0;jo<this.ops[i].portsOut.length;jo++) {
                    if (this.ops[i].portsOut[jo].thePort == p1) uiPort1 = this.ops[i].portsOut[jo];
                    if (this.ops[i].portsOut[jo].thePort == p2) uiPort2 = this.ops[i].portsOut[jo];
                }
            }

            if (!uiPort1 || !uiPort2) {
                console.log('no uiport found');
                return;
            }

            var thelink = new UiLink(uiPort1, uiPort2);

            uiPort1.opUi.links.push(thelink);
            uiPort2.opUi.links.push(thelink);

            if(!isLoading && !uiPort1.opUi.isHidden()) thelink.show();

            gui.patchConnection.send(CABLES.PACO_LINK, {
                "op1": p1.parent.id,
                "op2": p2.parent.id,
                "port1": p1.name,
                "port2": p2.name,
            });

            if (!isLoading)
            {
                // todo: update is too often ?? check if current op is linked else do not update!!!
                this.updateCurrentOpParams();

                var undofunc = function(p1Name, p2Name, op1Id, op2Id) {
                    CABLES.undo.add({
                        undo: function() {
                            var op1 = scene.getOpById(op1Id);
                            var op2 = scene.getOpById(op2Id);
                            if (!op1 || !op2) {
                                console.warn('undo: op not found');
                                return;
                            }
                            op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
                        },
                        redo: function() {
                            scene.link(scene.getOpById(op1Id), p1Name, scene.getOpById(op2Id), p2Name);
                        }
                    });
                }(p1.getName(), p2.getName(), p1.parent.id, p2.parent.id);
            }
            this.checkLinkTimeWarnings();
        }.bind(this));

        scene.addEventListener("onOpDelete",function(op) {
            var undofunc = function(opname, opid) {
                var oldValues={};
                for(var i=0;i<op.portsIn.length;i++) oldValues[ op.portsIn[i].name ]=op.portsIn[i].get();

                CABLES.undo.add({
                    undo: function() {
                        var newop=gui.scene().addOp(opname, op.uiAttribs, opid);

                        for(var i in oldValues) if(newop.getPortByName(i))newop.getPortByName(i).set(oldValues[i]);
                    },
                    redo: function() {
                        gui.scene().deleteOp(opid, false);
                    }
                });
            }(op.objName, op.id);

            gui.patchConnection.send(CABLES.PACO_OP_DELETE, {
                "op": op.id,
            });

            for (var i in self.ops) {
                if (self.ops[i].op == op) {
                    var theUi = self.ops[i];

                    theUi.hideAddButtons();
                    theUi.remove();
                    self.ops.splice(i, 1);
                }
            }
            gui.setStateUnsaved();
            self.checkLinkTimeWarnings();
        });

        scene.addEventListener("onOpAdd",
            function(op)
            {
                gui.setStateUnsaved();
                this._elPatch.focus();
                var width = CABLES.UI.uiConfig.opWidth;
                if (op.name.length == 1) width = CABLES.UI.uiConfig.opWidthSmall;

                var x=CABLES.UI.OPSELECT.newOpPos.x;
                var y=CABLES.UI.OPSELECT.newOpPos.y;
                var uiOp = new OpUi(self.paper, op, x,y, width, CABLES.UI.uiConfig.opHeight, op.name);

                self.ops.push(uiOp);

                uiOp.wasAdded = false;

                // setTimeout(
                    // ()=>{
                        doAddOp(uiOp);
                        this.opCollisionTest(uiOp);
                        self.checkLinkTimeWarnings();

                    // },10);
            }.bind(this));
    };

    this.setOpColor=function(col)
    {
        for(var i=0;i<selectedOps.length;i++)
            selectedOps[i].op.uiAttr({"color":col});
    }

    this.setOpTitle = function(uiop, t) {
        uiop.op.setTitle(t);
        uiop.oprect.setTitle(t);
    };

    this.updateSubPatches = function() {
        if (isLoading) return;
        for (var i=0;i<self.ops.length;i++) {
            if (!self.ops[i].op.uiAttribs.subPatch) self.ops[i].op.uiAttribs.subPatch = 0;
            if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch) self.ops[i].show();
                else self.ops[i].hide();
        }
    };

    this.getCurrentSubPatch = function() {
        return currentSubPatch;
    };

    this.isOpCurrentSubpatch=function(op)
    {
        return op.uiAttribs.subPatch==currentSubPatch;
    }

    this.setCurrentSubPatch = function(which) {
        if (currentSubPatch == which) return;

        console.log("switch subpatch:",which);

        gui.setWorking(true,'patch');

        setTimeout(function()
        {
            subPatchViewBoxes[currentSubPatch] = this._viewBox.serialize();

            for (var i=0;i<self.ops.length;i++) self.ops[i].isDragging = self.ops[i].isMouseOver = false;

            if (which === 0) $('#subpatch_nav').hide();
                else $('#subpatch_nav').show();

            currentSubPatch = which;
            self.updateSubPatches();

            if (subPatchViewBoxes[which]) {
                // viewBox = subPatchViewBoxes[which];
                this._viewBox.deSerialize(subPatchViewBoxes[which]);
                this.updateViewBox();
            }

            this._elPatch.focus();
            self.updateSubPatchBreadCrumb();

            gui.setWorking(false,'patch');

            this.currentPatchBounds = this.getSubPatchBounds();

        }.bind(this),10);
    };

    this.getSubPatchPathString=function(subId)
    {
        var arr=this.findSubpatchOp(subId);
        var str='';

        for(var i=0;i<arr.length;i++)
            str+=arr[i].name+' ';

        return str;
    }

    this.findSubpatchOp=function(subId, arr) {
        arr = arr || [];
        for (var i=0;i< self.ops.length;i++) {
            if (self.ops[i].op.objName == CABLES.UI.OPNAME_SUBPATCH && self.ops[i].op.patchId) {
                if (self.ops[i].op.patchId.get() == subId) {
                    arr.push({
                        name: self.ops[i].op.name,
                        id: self.ops[i].op.patchId.get()
                    });
                    if (self.ops[i].op.uiAttribs.subPatch !== 0) {
                        self.findSubpatchOp(self.ops[i].op.uiAttribs.subPatch, arr);
                    }
                }
            }
        }
        return arr;
    }

    this.subpatchBack=function()
    {
        var names = this.findSubpatchOp(currentSubPatch);
        if(names[1]) this.setCurrentSubPatch(names[1].id);
            else this.setCurrentSubPatch(0);
    };

    this.updateSubPatchBreadCrumb = function()
    {
        var names = this.findSubpatchOp(currentSubPatch);
        var str = '<a onclick="gui.patch().setCurrentSubPatch(0)">root</a>';

        for (var i = names.length - 1; i >= 0; i--) {
            str += '<a onclick="gui.patch().setCurrentSubPatch(\'' + names[i].id + '\')">' + names[i].name + '</a>';
        }

        $('#subpatch_breadcrumb').html(str);
    };

    this.getSelectedOps = function() {
        return selectedOps;
    };


    this.showSelectedOpsGraphs = function() {
        gui.timeLine().clear();

        var doShow = true;
        var count = 0;
        if (selectedOps.length > 0) {
            for (var j = 0; j < selectedOps.length; j++) {
                for (var i = 0; i < selectedOps[j].portsIn.length; i++) {
                    if (selectedOps[j].portsIn[i].thePort.isAnimated() && selectedOps[j].portsIn[i].thePort.anim) {
                        if (count === 0) {
                            doShow = !selectedOps[j].portsIn[i].thePort.anim.stayInTimeline;
                        }

                        selectedOps[j].portsIn[i].thePort.anim.stayInTimeline = doShow;
                        self.timeLine.setAnim(selectedOps[j].portsIn[i].thePort.anim);
                        count++;
                    }
                }
            }
        }

        if (!doShow) gui.timeLine().clear();
    };

    this.opCollisionTest = function(uiOp)
    {
        var perf = CABLES.uiperf.start('opCollisionTest');

        var found=false;
        var count=1;

        do
        {
            found=false;
            for (var i =0;i<this.ops.length;i++)
            {
                var testOp = this.ops[i];
                if(testOp.op.objName.indexOf("Ui.Comment")!=-1) continue;

                if (!testOp.op.deleted &&
                    (uiOp.op.objName.indexOf("Comment")==-1) &&
                    uiOp.op.id != testOp.op.id &&
                    uiOp.getSubPatch() == testOp.getSubPatch()) {
                    // if(uiOp.op.uiAttribs.translate.x>=testOp.op.uiAttribs.translate.x-10)result.x=0;
                    // if(uiOp.op.uiAttribs.translate.x<=testOp.op.uiAttribs.translate.x+200)result.x=1;
                    var spacing = 8;


                    if ((uiOp.op.uiAttribs.translate.x >= testOp.op.uiAttribs.translate.x &&
                            uiOp.op.uiAttribs.translate.x <= testOp.op.uiAttribs.translate.x + testOp.getWidth())
                        // ||
                        // (uiOp.op.uiAttribs.translate.x+uiOp.getWidth()>=testOp.op.uiAttribs.translate.x &&
                        //     uiOp.op.uiAttribs.translate.x+uiOp.getWidth()<=testOp.op.uiAttribs.translate.x+testOp.getWidth)
                    ) {

                        var fixPos = false;
                        if (uiOp.op.uiAttribs.translate.y >= testOp.op.uiAttribs.translate.y &&
                            uiOp.op.uiAttribs.translate.y <= testOp.op.uiAttribs.translate.y + testOp.getHeight()) {
                            fixPos = true;
                            uiOp.setPos(
                                testOp.op.uiAttribs.translate.x,
                                testOp.op.uiAttribs.translate.y + (count*testOp.getHeight()) + spacing);
                            // return true;
                            found=true;
                            break;
                        }

                        if (uiOp.op.uiAttribs.translate.y + testOp.getHeight() >= testOp.op.uiAttribs.translate.y &&
                            uiOp.op.uiAttribs.translate.y <= testOp.op.uiAttribs.translate.y + testOp.getHeight()) {
                            fixPos = true;
                            uiOp.setPos(
                                testOp.op.uiAttribs.translate.x,
                                testOp.op.uiAttribs.translate.y - (count*testOp.getHeight()) - spacing);
                            found=true;
                            break;
                            // return true;
                        }
                    }
                }
            }
            count++;
        }
        while(found)

        this._viewBox.setMinimapBounds();
        perf.finish();
    };

    this.checkCollisionsEdge = function()
    {
        var perf = CABLES.uiperf.start('checkCollisionsEdge');

        for(var i=0;i<this.ops.length;i++)
        {
            for(var j=0;j<this.ops.length;j++)
            {
                if(i==j)continue;

                var a=this.ops[i].op;
                var b=this.ops[j].op;

                if(
                    a.uiAttribs.translate.x==b.uiAttribs.translate.x &&
                    a.uiAttribs.translate.y==b.uiAttribs.translate.y
                    )
                    {
                        console.log("colliding!");
                        this.ops[j].setPos(
                            a.uiAttribs.translate.x,
                            a.uiAttribs.translate.y+50
                            );
                    }

            }

        }
        perf.finish();
    }



    this.testCollisionOpPosition = function(x, y, opid) {
        // for(var i in this.ops)
        // {
        //
        //     var op=this.ops[i].op;
        //     if(
        //         !op.deleted &&
        //         opid!=op.id &&
        //         x>=op.uiAttribs.translate.x-10 &&
        //         x<=op.uiAttribs.translate.x+200 &&
        //         y>=op.uiAttribs.translate.y &&
        //         y<=op.uiAttribs.translate.y+47)
        //     {
        //         // console.log('colliding...',op.id);
        //         return true;
        //     }
        // }
        return false;
    };

    this.findNonCollidingPosition = function(x, y, opid,dir) {

        // var ystep=17;
        // if(dir==PORT_DIR_IN)ystep*=-1;

        // console.log('ystep',ystep);

        // var count = 0;
        // console.log(y);
        // while (this.testCollisionOpPosition(x, y, opid) && count < 400) {
        //     y +=ystep;
        //     console.log(y);
        //     count++;
        // }

        var pos = {
            "x": x,
            "y": y
        };
        return pos;
    };


    this.arrangeSelectedOps = function() {
        // var i=0;
        // selectedOps.sort(function(a,b)
        // {
        //     return a.op.uiAttribs.translate.y-b.op.uiAttribs.translate.y;
        // });
        //
        // for(i=0;i<selectedOps.length;i++)
        //
        // for(i=1;i<selectedOps.length;i++)
        // {
        //     selectedOps[i].setPos(
        //         selectedOps[i].op.uiAttribs.translate.x,
        //         selectedOps[0].op.uiAttribs.translate.y
        //     );
        // }
        //
        // for(i=1;i<selectedOps.length;i++)
        // {
        //     var newpos=self.findNonCollidingPosition(
        //         selectedOps[i].op.uiAttribs.translate.x,
        //         selectedOps[i].op.uiAttribs.translate.y,
        //         selectedOps[i].op.id);
        //
        //     if(Math.abs(selectedOps[i].op.uiAttribs.translate.x-selectedOps[0].op.uiAttribs.translate.x)<60)
        //     {
        //         newpos.x=selectedOps[0].op.uiAttribs.translate.x;
        //     }
        //
        //     selectedOps[i].setPos(newpos.x,newpos.y);
        // }
    };


    this.snapToNextOp = function(dir) {
        if (!selectedOps || selectedOps.length === 0) return;

        for (var j = 0; j < selectedOps.length; j++) {
            var uiop = selectedOps[j];
            var startPort = uiop.op.portsIn[0];
            var otherport=null;

            if (dir > 0)
                startPort = uiop.op.portsOut[0];

            if (startPort.links.length > 0) {
                otherport = startPort.links[0].getOtherPort(startPort);
                if (startPort.isLinked()) {
                    var transNextOp = otherport.parent.uiAttribs.translate;

                    var y = transNextOp.y;
                    if (dir > 0) y -= (uiop.getHeight() + 10);
                    else y += (uiop.getHeight() + 10);
                    uiop.setPos(transNextOp.x, y);
                    this.opCollisionTest(uiop);
                }
            }
        }
    };


    this.compressSelectedOps = function()
    {
        CABLES.UI.TOOLS.compressSelectedOps(this.getSelectedOpsAsCoreOps());
        this.updateSelectedOpPositions();
    };

    this.getSelectedOpsAsCoreOps=function()
    {
        var ops=[];
        for(var i=0;i<selectedOps.length;i++)
        {
            ops.push(selectedOps[i].op);
        }
        return ops;

    };

    this.alignSelectedOps = function()
    {
        CABLES.UI.TOOLS.alignOps(this.getSelectedOpsAsCoreOps());
        this.updateSelectedOpPositions();
    };

    this.updatedOpPositionsFromUiAttribs=function(ops)
    {
        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].op) ops[i].setPos(ops[i].op.uiAttribs.translate.x,ops[i].op.uiAttribs.translate.y);
            else
            {
                var uiop=gui.patch().getUiOp(ops[i]);
                if(!uiop) console.log('NO UIOP',ops[i],uiop);
                else uiop.setPos(ops[i].uiAttribs.translate.x,ops[i].uiAttribs.translate.y);
            }
        }
    }

    this.updateSelectedOpPositions=function()
    {
        this.updatedOpPositionsFromUiAttribs(selectedOps);
    }


    this.selectChilds = function(id) {
        if (!id) {
            if (selectedOps.length === 0) return;
            id = selectedOps[0].op.id;
        }
        var op = gui.scene().getOpById(id);
        gui.jobs().start({
                id: 'selectchilds',
                title: 'selecting child ops'
            },
            function() {
                var i = 0;
                for (i in self.ops) self.ops[i].op.marked = false;

                op.markChilds();
                op.marked = false;

                for (i in self.ops) {
                    if (self.ops[i].op.marked) {
                        self.addSelectedOp(self.ops[i]);
                        self.ops[i].setSelected(true);
                    } else {
                        self.removeSelectedOp(self.ops[i]);
                        self.ops[i].setSelected(false);
                    }
                }
                setStatusSelectedOps();

                gui.jobs().finish('selectchilds');
            }
        );
    };

    this.deleteChilds = function(id) {
        var op = gui.scene().getOpById(id);
        gui.jobs().start({
                id: 'deletechilds',
                title: 'deleting ops'
            },
            function() {
                op.deleteChilds();
                gui.jobs().finish('deletechilds');
            }
        );
    };

    this.unlinkSelectedOps = function() {
        for (var i in selectedOps) selectedOps[i].op.unLinkTemporary();
    };

    this.deleteSelectedOps = function() {
        for (var i in selectedOps)
            gui.patch().scene.deleteOp(selectedOps[i].op.id, true);

        this.updateBounds();
    };

    this.removeSelectedOp = function(uiop) {
        for (var i in selectedOps) {
            if (selectedOps[i] == uiop) {
                selectedOps.splice(i, 1);
                return;
            }
        }
        self.updateBounds();
    };

    this.focusOp = function(id,center) {
        for (var i =0;i<gui.patch().ops.length;i++)
        {
            if (gui.patch().ops[i].op.id == id)
            {
                gui.patch().ops[i].oprect.showFocus();

                if(center)
                    self._viewBox.center(
                        gui.patch().ops[i].op.uiAttribs.translate.x,
                        gui.patch().ops[i].op.uiAttribs.translate.y);
            }
        }
    };

    this.setSelectedOpById = function(id) {
        for (var i in gui.patch().ops) {
            if (gui.patch().ops[i].op.id == id) {
                self.setCurrentSubPatch(gui.patch().ops[i].getSubPatch());

                gui.patch().setSelectedOp(null);
                gui.patch().setSelectedOp(gui.patch().ops[i]);
                gui.patch().showOpParams(gui.patch().ops[i].op);
                return;
            }
        }
    };

    this.addSelectedOpById = function(id) {
        for (var i in gui.patch().ops) {
            if (gui.patch().ops[i].op.id == id) {
                self.addSelectedOp(gui.patch().ops[i]);
                return gui.patch().ops[i];
            }
        }
    };

    this.setSelectedOp = function(uiop) {
        if (uiop === null) {
            selectedOps.length = 0;
            for (var i in gui.patch().ops) {
                gui.patch().ops[i].setSelected(false);
                gui.patch().ops[i].hideAddButtons();
            }
            return;
        }

        self.addSelectedOp(uiop);
        uiop.setSelected(true);
    };

    this.addSelectedOp = function(uiop) {
        uiop.oprect.setSelected(true);
        uiop.setSelected(true);
        for (var i in selectedOps)
            if (selectedOps[i] == uiop) return;
        selectedOps.push(uiop);
    };

    this.moveSelectedOpsFinished = function() {
        var i = 0;

        if (selectedOps.length == 1) this.opCollisionTest(selectedOps[0]);
        for (i in selectedOps) selectedOps[i].doMoveFinished();
    };

    this.prepareMovingOps = function ()
    {
        var i=0;
        if (selectedOps.length == 1)
            for (i = 0; i < self.ops.length; i++)
                if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch)
                    for (var j = 0; j < self.ops[i].links.length; j++)
                        self.ops[i].links[j].setElementOrder();
    }

    this.moveSelectedOps = function (dx, dy, a, b, e) {
        var i = 0;
        if (selectedOps.length == 1)
            for (i = 0; i < self.ops.length; i++)
                if (self.ops[i].op.uiAttribs.subPatch == currentSubPatch)
                    for (var j=0;j< self.ops[i].links.length;j++)
                        self.ops[i].links[j].showAddButton();

        for (i =0;i<selectedOps.length;i++)
            selectedOps[i].doMove(dx, dy, a, b, e);
    };

    this.getUiOp = function(op) {
        for (var i = 0; i < self.ops.length; i++)
            if (self.ops[i].op == op) return self.ops[i];
        return null;
    };

    this.updateOpParams = function(id) {
        if(CABLES.UI.DRAGGINGOPS || CABLES.UI.selectedEndOp || CABLES.UI.selectedStartOp) return false;
        if(selectedOps.length!=1)return;
        if(selectedOps[0].op.id!=id)return;
        gui.setTransformGizmo(null);
        var op=gui.scene().getOpById(id);
        self.showOpParams(op);
        return true;
    };

    this.showProjectParams = function()
    {
        gui.opParams.dispose();
        if(gui.fileManager)gui.fileManager.setFilePort(null);
        gui.texturePreview().pressedEscape();
        var perf = CABLES.uiperf.start('showProjectParams');

        var s = {};
        if(currentOp && currentOp)currentOp=null;
        gui.setTransformGizmo(null);

        s.name = currentProject.name;
        s.settings = gui.scene().settings;

        var numVisibleOps = 0;
        var errorOps=[];
        var warnOps=[];

        var html='';

        if(!gui.user.isPatchOwner) html += CABLES.UI.getHandleBarHtml('clonepatch', {});

        html+=gui.bookmarks.getHtml();

        if(errorOps.length==0)errorOps=null;
        if(warnOps.length==0)warnOps=null;
        // colors = CABLES.uniqueArray(colors);

        html += CABLES.UI.getHandleBarHtml('error_ops', { "errorOps":errorOps, "warnOps":warnOps });
        // html += CABLES.UI.getHandleBarHtml('filter_colors', { "colors":colors });

        $('#options').html(html);

        perf.finish();
    };




    this.updateCurrentOpParams = function() {
        if (currentOp) self.showOpParams(currentOp.op);
    };

    var eventListeners = {};
    this.addEventListener = function(name, cb) {
        eventListeners[name] = eventListeners[name] || [];
        eventListeners[name].push(cb);
    };

    function callEvent(name, params) {
        if (eventListeners.hasOwnProperty(name)) {
            for (var i in eventListeners[name]) {
                eventListeners[name][i](params);
            }
        }
    }

    this.refreshOpParams=function(op)
    {
        if(currentOp && currentOp.op==op)
        {
            this.showOpParams(op);
        }
    }

    var delayedShowOpParams = 0;
    this.showOpParams = function(op) {
        // self.highlightOpNamespace(op);
        gui.setTransformGizmo(null);

        if(op)
        {
            if(gui.find() && gui.find().isVisible()) gui.find().setSelectedOp(op.id);
            clearTimeout(delayedShowOpParams);
            delayedShowOpParams = setTimeout(function() {
                self._showOpParams(op);
            }, 10);

        }
    };

    this.openParamEditor=function(opid,portname,cb)
    {
        var op=self.scene.getOpById(opid);
        if(!op)
        {
            console.log('paramedit op not found');
            return;
        }

        var port=op.getPortByName(portname);
        if(!port)
        {
            console.log('paramedit port not found');
            return;
        }
        var name=op.name+' '+port.name;

        var editorObj=CABLES.editorSession.rememberOpenEditor("param",name,{"opid":opid,"portname":portname});
        if(!editorObj && gui.mainTabs.getTabByTitle(name))
        {
            CABLES.editorSession.remove(name,"param");
            var tab=gui.mainTabs.getTabByTitle(name);
            gui.mainTabs.closeTab(tab.id);

            editorObj=CABLES.editorSession.rememberOpenEditor("param",name,{"opid":opid,"portname":portname});
        }

        if(editorObj)
        {
            new CABLES.UI.EditorTab(
                {
                    "title":name,
                    "content":port.get() + '',
                    "name":editorObj.name,
                    "syntax": port.uiAttribs.editorSyntax,
                    "editorObj":editorObj,
                    "onClose":function(which)
                    {
                        console.log('close!!! missing infos...');
                        CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
                    },
                    "onSave":function(setStatus, content) {
                                setStatus('saved');
                                gui.setStateUnsaved();
                                gui.jobs().finish('saveeditorcontent');
                                port.set(content);
                            }
                });
        }
        else
        {
            gui.mainTabs.activateTabByName(name);
        }



        if(cb)cb();
        else gui.maintabPanel.show();
        // gui.showEditor();
        // gui.editor().addTab({
        //     content: port.get() + '',
        //     editorObj:editorObj,
        //     id:CABLES.Editor.sanitizeId('editparam_'+opid+'_'+port.name),
        //     title: '' + port.name,
        //     syntax: port.uiAttribs.editorSyntax,
        //     onSave: function(setStatus, content) {
        //         // console.log('setvalue...');
        //         setStatus('saved');
        //         gui.setStateUnsaved();
        //         gui.jobs().finish('saveeditorcontent');
        //         port.set(content);
        //     },
        //     onClose: function(which)
        //     {
        //         CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
        //     }
        // });
    }

    this.resetOpValues=function(opid)
    {
        var op=this.scene.getOpById(opid);
        if(!op)
        {
            console.error('reset op values: op not found...',opid);
            return;
        }
        for(var i=0;i<op.portsIn.length;i++)
        {
            if(op.portsIn[i].defaultValue!=null)
            {
                op.portsIn[i].set(op.portsIn[i].defaultValue);
            }
        }
        gui.patch().showOpParams(op);
    }

    this._showOpParams = function(op) {
        gui.opParams.show(op);
    };


    var uupos = null;
    var ctm;

    this.getCanvasCoordsMouse = function(evt) {
        ctm = this._elPatchSvg[0].getScreenCTM();
        ctm = ctm.inverse();

        uupos = this._elPatchSvg[0].createSVGPoint();
        uupos.x = evt.clientX || 0;
        uupos.y = evt.clientY || 0;
        uupos = uupos.matrixTransform(ctm);
        return uupos;
    };

    this.addAssetOpAuto = function(filename, event) {
        if (!event) return;
        var opname = '';

        if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg")) opname = CABLES.UI.DEFAULTOPNAMES.defaultOpImage;
        else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac"))   opname = CABLES.UI.DEFAULTOPNAMES.defaultOpAudio;
        else if (filename.endsWith(".3d.json")) opname = CABLES.UI.DEFAULTOPNAMES.defaultOpJson3d;
        else if (filename.endsWith(".mp4" || ".m4a" || ".mpg")) opname = CABLES.UI.DEFAULTOPNAMES.defaultOpVideo;
        else if (filename.endsWith(".glb")) opname = CABLES.UI.DEFAULTOPNAMES.defaultOpGltf;
        else if (filename.endsWith(".json")) opname = CABLES.UI.DEFAULTOPNAMES.defaultOpJson;
        else
        {
            CABLES.UI.notify("no known operator found");
            return;
        }

        var x = gui.patch().getCanvasCoordsMouse(event).x;
        var y = gui.patch().getCanvasCoordsMouse(event).y;

        var uiAttr = {
            translate: {
                x: x,
                y: y
            }
        };
        var op = gui.scene().addOp(opname, uiAttr);

        for (var i = 0; i < op.portsIn.length; i++) {
            if (op.portsIn[i].uiAttribs.display == 'file') {

                op.portsIn[i].set(filename);
            }
        }
    };


    this.addAssetOp = function(opname, portname, filename, title) {
        if (!title) title = filename;

        var uiAttr = {
            'title': title,
            translate: {
                x: this._viewBox.getCenterX(),
                y: this._viewBox.getCenterY()
            }
        };
        gui.scene().addOp(opname, uiAttr, function(op)
        {
            if(op) op.getPort(portname).set('/assets/' + currentProject._id + '/' + filename);
            console.log("new op",op,opname);
        });
    };

    // doWatchPorts();

    this.disableEnableOps = function() {
        if (!selectedOps.length) return;
        var i = 0;
        for (i = 0; i < self.ops.length; i++) {
            self.ops[i].op.marked = false;
        }

        var newstate = false;
        if (!selectedOps[0].op.enabled) newstate = true;

        for (var j = 0; j < selectedOps.length; j++)
        {
            var op = selectedOps[j].op;

            op.markChilds();

            for (i = 0; i < self.ops.length; i++)
                if (self.ops[i].op.marked) self.ops[i].setEnabled(newstate);
        }
    };

    var lastTempOP = null;
    this.tempUnlinkOp = function()
    {


        if(lastTempOP)
        {
            lastTempOP.op.undoUnLinkTemporary();
            lastTempOP.setEnabled(true);
            lastTempOP=null;
        }
        else
        {

            const op = selectedOps[0];
            if(op)
            {
                op.setEnabled(false);
                op.op.unLinkTemporary();
                lastTempOP=op;
            }
        }


        // var j = 0;

        // var op = null;
        // // if (selectedOps.length === 0 && lastTempOP) op = lastTempOP;
        // if (lastTempOP) op = lastTempOP;
        // else {
        //     if (selectedOps.length === 0) return;
        //     op = selectedOps[0];
        // }
        // lastTempOP = op;

        // op.setEnabled(!op.op.enabled);

        // if (!op.op.enabled) op.op.unLinkTemporary();
        // else
        // {
        //     op.op.undoUnLinkTemporary();
        //     lastTempOP=null;
        // }
    };

    this.downloadSVG=function()
    {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($('#patch').html()));
        element.setAttribute('download', 'patch.svg');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    this.getSubPatches = function(sort) {
        var foundPatchIds = [];
        var subPatches = [];
        var i = 0;

        for (i = 0; i < this.ops.length; i++)
            if (this.ops[i].op.patchId && this.ops[i].op.patchId.get() !== 0)
                foundPatchIds.push(this.ops[i].op.patchId.get());

        // find lost ops, which are in subpoatches, but no subpatch op exists for that subpatch..... :(
        for (i = 0; i < this.ops.length; i++) 
            if (this.ops[i].op.uiAttribs && this.ops[i].op.uiAttribs.subPatch)
                if (foundPatchIds.indexOf(this.ops[i].op.uiAttribs.subPatch) == -1)
                    foundPatchIds.push(this.ops[i].op.uiAttribs.subPatch);

        foundPatchIds = CABLES.uniqueArray(foundPatchIds);

        for (i = 0; i < foundPatchIds.length; i++)
        {
            var found = false;
            for (var j = 0; j < this.ops.length; j++)
                if (this.ops[j].op.patchId!=0 && this.ops[j].op.patchId && this.ops[j].op.patchId.get() == foundPatchIds[i])
                {
                    subPatches.push({
                        "name": this.ops[j].op.name,
                        "id": foundPatchIds[i]
                    });
                    found = true;
                }

            if (!found) 
                subPatches.push({
                    "name": "lost patch " + foundPatchIds[i],
                    "id": foundPatchIds[i]
                });
        }

        if(sort)
            subPatches.sort(function(a,b)
            {
                return a.name.localeCompare(b.name);
            });

        return subPatches;
    };

    this.linkTwoOps = function(op1, op2) {
        this.removeQuickLinkLine();

        var suggestions = [];
        if (!op1 || !op2) return;

        console.log('op1', op1.op.name);
        console.log('op2', op2.op.name);

        for (var j = 0; j < op1.portsOut.length; j++)
        {
            var p = op1.portsOut[j].thePort;

            // console.log(p.name,'num:',op2.op.countFittingPorts(p));

            const numFitting=op2.op.countFittingPorts(p);
            var addText="...";
            if (numFitting > 0)
            {
                if(numFitting==1)
                {
                    const p2=op2.op.findFittingPort(p);
                    addText=p2.name;
                }

                suggestions.push({
                    p: p,
                    name: p.name + '<span class="icon icon-arrow-right"></span>'+addText,
                    classname: "port_text_color_" + p.getTypeString().toLowerCase()
                });
            }
        }

        if (suggestions.length === 0) {
            CABLES.UI.notify("can not link!");
            return;
        }
        if (suggestions.length > 1)
            op1.oprect.showFocus();

        var fakeMouseEvent = {
            clientX: self.lastMouseMoveEvent.clientX,
            clientY: self.lastMouseMoveEvent.clientY
        };


        function showSuggestions2(id)
        {
            var p = suggestions[id].p;
            var sugIn = [];

            for (var i = 0; i < op2.portsIn.length; i++)
            {
                if (CABLES.Link.canLink(op2.portsIn[i].thePort, p))
                {
                    sugIn.push({
                        p: op2.portsIn[i].thePort,
                        name: '<span class="icon icon-arrow-right"></span>' + op2.portsIn[i].thePort.name,
                        classname: "port_text_color_" + op2.portsIn[i].thePort.getTypeString().toLowerCase()
                    });
                }
            }

            if (sugIn.length == 1) {
                gui.patch().scene.link(
                    p.parent,
                    p.name,
                    sugIn[0].p.parent,
                    sugIn[0].p.name);
                return;
            }

            op2.oprect.showFocus();

            new CABLES.UI.SuggestionDialog(sugIn, op2, fakeMouseEvent, null,
                function(id) {
                    gui.patch().scene.link(
                        p.parent,
                        p.name,
                        sugIn[id].p.parent,
                        sugIn[id].p.name);
                    return;
                });
        }

        if(suggestions.length==1) showSuggestions2(0);
        else new CABLES.UI.SuggestionDialog(suggestions, op1, fakeMouseEvent, null, showSuggestions2, false);
    };

};

CABLES.UI.Patch.prototype.getViewBox=function()
{
    return this._viewBox;
}

CABLES.UI.Patch.prototype.updateBounds = function () {
    this.currentPatchBounds = this.getSubPatchBounds();
}

CABLES.UI.Patch.prototype.getNumOps = function () {
    return this.ops.length;
}

CABLES.UI.Patch.prototype.createOpAndLink=function(opname,opid,portname)
{
    var oldOp=this.scene.getOpById(opid);
    var trans={"translate": {
        "x":oldOp.uiAttribs.translate.x,
        "y":oldOp.uiAttribs.translate.y-100 }};

    const newOp=this.scene.addOp(opname,trans);
    var newPort=newOp.getFirstOutPortByType(oldOp.getPortByName(portname).type);
    this.scene.link(oldOp,portname,newOp,newPort.name);

    newOp.setUiAttrib({"translate":trans});
}

