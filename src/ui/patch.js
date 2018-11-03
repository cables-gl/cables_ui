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

    var viewBox = {x: 0,y: 0,w: 1100,h: 1010 };
    var lastMouseMoveEvent = null;

    var rubberBandStartPos = null;
    var rubberBandPos = null;
    var mouseRubberBandStartPos = null;
    var mouseRubberBandPos = null;
    var rubberBandRect = null;
    var isLoading = false;

    var timeoutPan = 0;
    var timeoutFpsLimit = 0;
    var fpsLimitBefore = 0;
    var timeoutRubberBand = -1;

    var subPatchViewBoxes = [];
    this._serverDate='';

    this.updateBounds = false;
    var miniMapBounding = null;

    this.background = null;
    this._elPatchSvg = null;
    this._elPatch = null;
    this._elBody = null;

    var pastedupdateTimeout=null;

    CABLES.editorSession.addListener("param",
        function(name,data)
        {
            if(data && data.opid && data.portname) this.openParamEditor(data.opid,data.portname)
        }.bind(this));

    this.isLoading = function() { return isLoading; };
    this.getPaper = function() { return self.paper; };
    this.getPaperMap = function() { return self.paperMap; };

    this.isCurrentOp=function(op)
    {
        if(!currentOp)return false;
        return currentOp.op==op;
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

            var json = null;
            try {
                json = JSON.parse(str);
            } catch (exp) {
                CABLES.UI.notifyError("Paste failed");
                console.log(exp);
            }

            var k = 0;

            if (json) {
                if (json.ops) {
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

                            var fixedSubPatches = [];
                            for (i = 0; i < json.ops.length; i++) {
                                if (CABLES.Op.isSubpatchOp(json.ops[i].objName)) {
                                    for (k in json.ops[i].portsIn) {
                                        if (json.ops[i].portsIn[k].name == 'patchId') {
                                            var oldSubPatchId = json.ops[i].portsIn[k].value;
                                            var newSubPatchId = json.ops[i].portsIn[k].value = CABLES.generateUUID();

                                            console.log('oldSubPatchId', oldSubPatchId);
                                            console.log('newSubPatchId', newSubPatchId);

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
                                    if (lastMouseMoveEvent) {
                                        mouseX = gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).x;
                                        mouseY = gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).y;
                                    }

                                    json.ops[i].uiAttribs.translate.x = json.ops[i].uiAttribs.translate.x + mouseX - minx;
                                    json.ops[i].uiAttribs.translate.y = json.ops[i].uiAttribs.translate.y + mouseY - miny;
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
                            uiop.oprect.setSelected
                        }
                        
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

    this.resolveSubpatch = function() {
        if (currentSubPatch == 0) return;
        for (var i in self.ops)
            self.ops[i].op.uiAttribs.subPatch = 0;

        this.setCurrentSubPatch(0);
    };

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

    $('#patch').keydown(function(e) {
        switch (e.which)
        {
            case 27:
            gui.setCursor();
            break;
            case 84:
                CABLES.CMD.PATCH.setOpTitle();
            break;
            case 32:
                spacePressed = true;
                gui.setCursor("grab");
                break;

            case 70:
                if (!e.metaKey && !e.ctrlKey && !e.altKey) gui.patch().toggleFlowVis();
                break;

            case 46:
            case 8: // delete

                if ($("input").is(":focus")) return;

                // if (gui.patch().hoverPort) {
                //     gui.patch().hoverPort.removeLinks();
                //     return;
                // }

                // if (CABLES.UI.LINKHOVER && CABLES.UI.LINKHOVER.p2) {
                //     CABLES.UI.LINKHOVER.p1.thePort.removeLinkTo(CABLES.UI.LINKHOVER.p2.thePort);
                //     return;
                // }

                self.deleteSelectedOps();
                if (e.stopPropagation) e.stopPropagation();
                if (e.preventDefault) e.preventDefault();
                self.showProjectParams();
                break;

            case 69: // e - edit
                CABLES.CMD.PATCH.editOp();
                break;

            case 68: // d - disable
                if (e.shiftKey) self.tempUnlinkOp();
                else self.disableEnableOps();
                break;

            case 90: // z undo
                if (e.metaKey || e.ctrlKey) {
                    if (e.shiftKey) CABLES.undo.redo();
                    else CABLES.undo.undo();
                }
                break;

            case 33: // snapto pageUp
                self.snapToNextOp(-1);
                break;

            case 34: // snapto pageDown
                self.snapToNextOp(1);
                break;

            case 65: // a - align
                if (e.metaKey || e.ctrlKey) {
                    self.selectAllOps();
                } else
                if (e.shiftKey) {
                    self.compressSelectedOps();
                } else {
                    self.alignSelectedOps();
                }
                break;

            case 71: // g show graphs
                // self.setCurrentSubPatch(0);
                self.showSelectedOpsGraphs();
                break;

            case 49: // / - test
                self.setCurrentSubPatch(0);
                break;

            // case 38: // arrow up
            //     break;
            // case 40: // arrow down
            //     break;

            default:
                // console.log('key ',e.which,e.key);
                break;
        }
    });

    this.exportStatic = function(ignoreAssets) {
        if (!gui.getSavedState()) {
            CABLES.UI.MODAL.show(CABLES.UI.TEXTS.projectExportNotSaved);
            return;
        }
        CABLES.UI.MODAL.showLoading('exporting project');

        var apiUrl = 'project/' + currentProject._id + '/export';
        if (ignoreAssets) apiUrl += '?ignoreAssets=true';

        CABLES.api.get(
            apiUrl,
            function(r) {
                var msg = '';

                if (r.error) {
                    msg = "<h2>export error</h2>";
                    msg += '<pre class="shaderErrorCode">' + JSON.stringify(r) + '<pre>';
                } else {
                    msg = "<h2>export finished</h2>";
                    msg += 'size: ' + r.size + ' mb';
                    msg += '<br/><br/><br/>';
                    msg += '<a class="bluebutton" href="' + r.path + '">download</a>';
                    msg += '<br/><br/>';
                    msg += '<div class="shaderErrorCode">' + r.log + '</div>';
                }

                CABLES.UI.MODAL.show(msg);
            });
    };


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

    this.saveCurrentProjectAs = function(cb, _id, _name) {

        if(window.process && window.process.versions['electron']) {
            var electron = require('electron');
            var ipcRenderer = electron.ipcRenderer;
            var remote = electron.remote; 
            var dialog = remote.dialog;

            var data = gui.patch().scene.serialize(true);
            
            data.ui = {
                "viewBox": {},
                "timeLineLength": gui.timeLine().getTimeLineLength()
            };


            gui.bookmarks.cleanUp();
            data.ui.bookmarks = gui.bookmarks.getBookmarks();

            data.ui.viewBox.w = viewBox.w;
            data.ui.viewBox.h = viewBox.h;
            data.ui.viewBox.x = viewBox.x;
            data.ui.viewBox.y = viewBox.y;
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
            "My new Project",
            function(name) {
                CABLES.api.post('project', {
                    name: name
                }, function(d) {
                    CABLES.UI.SELECTPROJECT.doReload = true;

                    gui.scene().settings=gui.scene().settings||{};
                    gui.scene().settings.isPublic = false;
                    gui.scene().settings.secret = '';
                    gui.scene().settings.isExample = false;
                    gui.scene().settings.isTest = false;
                    gui.scene().settings.isFeatured = false;
                    gui.scene().settings.opExample = '';

                    self.saveCurrentProject(function() {
                        document.location.href = '#/project/' + d._id;
                    }, d._id, d.name);

                });
            });
    };

    this.checkUpdatedSaveForce=function(updated)
    {
        this._serverDate=updated;
        CABLES.UI.MODAL.hide(true);
        CABLES.CMD.PATCH.save();
    }

    this.checkUpdated=function(cb)
    {
        if(!gui.project())return;

        gui.jobs().start({
            id: 'checkupdated',
            title: 'check if patch was updated',
            indicator:'canvas'
        });

        CABLES.api.get('project/' + gui.project()._id+'/updated',
            function(data)
            {
                if(this._serverDate!=data.updated)
                {
                    CABLES.UI.MODAL.showError('meanwhile...', 'this patch was changed. your version is out of date. <br/><br/>last update: '+data.updatedReadable+' by '+(data.updatedByUser||'unknown')+'<br/><br/>' );
                    CABLES.UI.MODAL.contentElement.append('<a class="button" onclick="CABLES.UI.MODAL.hide(true);">close</a>&nbsp;&nbsp;');
                    CABLES.UI.MODAL.contentElement.append('<a class="button" onclick="gui.patch().checkUpdatedSaveForce(\''+data.updated+'\');">save anyway</a>&nbsp;&nbsp;');
                    CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-refresh" onclick="document.location.reload();">reload patch</a>&nbsp;&nbsp;');
                }
                else
                {
                    CABLES.UI.MODAL.hide(true);
                    if(cb)cb(null);
                }
                gui.jobs().finish('checkupdated');
                
            }.bind(this)
        );
    };

    this.saveCurrentProject = function(cb, _id, _name)
    {
        // if(this.scene._crashedOps.length>0)
        // {
        //     CABLES.UI.MODAL.showError('ops crashed, are you sure?');
        //     return;
        // }

        if (this.loadingError) {
            CABLES.UI.MODAL.showError('project not saved', 'could not save project: had errors while loading!');
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
        const doSaveScreenshot=gui.patch().scene.isPlaying();

        for (var i = 0; i < this.ops.length; i++) {
            this.ops[i].removeDeadLinks();
            if (this.ops[i].op.uiAttribs.error) delete this.ops[i].op.uiAttribs.error;
            if (this.ops[i].op.uiAttribs.warning) delete this.ops[i].op.uiAttribs.warning;
        }

        gui.jobs().start({ id: 'projectsave', title: 'saving project',indicator:'canvas' });
        

        var w = $('#glcanvas').attr('width');
        var h = $('#glcanvas').attr('height');

        if(doSaveScreenshot)
        {
            $('#glcanvas').attr('width', 640);
            $('#glcanvas').attr('height', 360);
        }

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

        data.ui.viewBox.w = viewBox.w;
        data.ui.viewBox.h = viewBox.h;
        data.ui.viewBox.x = viewBox.x;
        data.ui.viewBox.y = viewBox.y;
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

        try {
            data = JSON.stringify(data);
            gui.patch().getLargestPort();

            CABLES.api.put(
                'project/' + id, {
                    "name": name,
                    "namespace": currentProject.namespace,
                    "data": data,
                },
                function(r) {
                    gui.jobs().finish('projectsave');

                    gui.setStateSaved();
                    if (cb) cb();
                    
                    self._serverDate=r.updated;
                    if(!r.success)CABLES.UI.MODAL.showError('project not saved', 'could not save project: server error');
                        else CABLES.UI.notify('patch saved');

                    if(doSaveScreenshot)
                    {
                        var screenshotTimeout = setTimeout(function() {
                            gui.patch().scene.cgl.setSize(w,h);
                            gui.patch().scene.resume();
                            
                        }, 1000);

                        gui.patch().scene.pause();
                        gui.patch().scene.cgl.setSize(640,360);
                        gui.patch().scene.renderOneFrame();
                        gui.patch().scene.renderOneFrame();
    
                        gui.jobs().start({ id: 'screenshotsave', title: 'saving screenshot' });
                        gui.patch().scene.cgl.screenShot(function(screenBlob) {
                            clearTimeout(screenshotTimeout);
    
                            gui.patch().scene.cgl.setSize(w,h);
                            gui.patch().scene.resume();
    
                            var reader = new FileReader();
    
                            reader.onload = function(event) {
                                CABLES.api.put(
                                    'project/' + id + '/screenshot', {
                                        "screenshot": event.target.result //gui.patch().scene.cgl.screenShotDataURL
                                    },
                                    function(r) {
                                        gui.jobs().finish('screenshotsave');
                                        if (gui.onSaveProject) gui.onSaveProject();
                                    });
                            };
                            reader.readAsDataURL(screenBlob);
                        });
                    }
                },
                function(response,data) // ERROR CALLBACK    
                {
                    if(data.status==401)
                    {
                        var msg='could not save patch. you do not have the required rights. you can save a copy of this patch.<br/><br/>'
                        msg+='<a class="bluebutton" onclick="gui.patch().saveCurrentProjectAs();">copy patch</a>&nbsp;&nbsp;';
                        msg+='<a class="greybutton" onclick="CABLES.UI.MODAL.hide(true);">close</a>';
                        CABLES.UI.MODAL.showError('Could not save',msg);
                        console.log('no rights');
                    }
                    else
                    {
                        CABLES.UI.MODAL.showError('Could not save','unknown error while saving patch. please try again later...');
                    }
                    
                });
        } catch (e) {
            console.log(e);
            CABLES.UI.notifyError('error saving patch - try to delete disables ops');
        } finally {


        }
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

            CABLES.UI.fileSelect.load();
            $('.viewProjectLink').attr('href', '/p/' + proj._id);
        }
        $('#meta_content_files').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.projectFiles);
        }, function() {
            CABLES.UI.hideInfo();
        });
    };

    this.centerViewBoxOps = function() {
        var minX = 99999;
        var minY = 99999;
        var maxX = -99999;
        var maxY = -99999;

        var arr = self.ops;
        if (selectedOps.length > 0) arr = selectedOps;

        for (var i in arr) {
            if (arr[i].getSubPatch() == currentSubPatch) {
                minX = Math.min(minX, arr[i].op.uiAttribs.translate.x - 40);
                maxX = Math.max(maxX, arr[i].op.uiAttribs.translate.x + 150);
                minY = Math.min(minY, arr[i].op.uiAttribs.translate.y);
                maxY = Math.max(maxY, arr[i].op.uiAttribs.translate.y);
            }
        }

        var vb = {};
        vb.w = 1 * (Math.abs(maxX - minX));
        vb.h = 1 * (Math.abs(maxY - minY));

        if (selectedOps.length > 0) {
            vb.w = Math.max(600, vb.w);
            vb.h = Math.max(600, vb.h);
        }

        if (selectedOps.length > 0) {
            vb.x = minX - vb.w / 2;
            vb.y = minY - vb.h / 2;
        } else {
            vb.x = minX;
            vb.y = minY;
        }

        self.animViewBox(vb.x, vb.y, vb.w, vb.h);
    };

    this.fixTitlePositions=function()
    {
        for(var i in this.ops)
        {
            this.ops[i].fixTitle();
        }
    }

    this.centerViewBoxOp=function(opid)
    {
        this.centerViewBox(
            this.scene.getOpById(opid).uiAttribs.translate.x,
            this.scene.getOpById(opid).uiAttribs.translate.y);
    }

    this.centerViewBox = function(x, y) {
        self.animViewBox(
            x - viewBox.w / 2,
            y - viewBox.h / 2,
            viewBox.w, viewBox.h);
    };

    var minimapBounds = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    };

    this.getSubPatchBounds = function(subPatch) {
        var bounds = {
            minx: 9999999,
            maxx: -9999999,
            miny: 9999999,
            maxy: -9999999,
        };

        for (var j = 0; j < self.ops.length; j++)
            if (self.ops[j].op.objName.indexOf("Ops.Ui.") == -1) {
                if (self.ops[j].op.uiAttribs && self.ops[j].op.uiAttribs.translate)
                    if (self.ops[j].op.uiAttribs.subPatch == subPatch) {
                        bounds.minx = Math.min(bounds.minx, self.ops[j].op.uiAttribs.translate.x);
                        bounds.maxx = Math.max(bounds.maxx, self.ops[j].op.uiAttribs.translate.x);
                        bounds.miny = Math.min(bounds.miny, self.ops[j].op.uiAttribs.translate.y);
                        bounds.maxy = Math.max(bounds.maxy, self.ops[j].op.uiAttribs.translate.y);
                    }
            }

        bounds.x = bounds.minx - 100;
        bounds.y = bounds.miny - 100;
        bounds.w = Math.abs(bounds.maxx - bounds.minx) + 300;
        bounds.h = Math.abs(bounds.maxy - bounds.miny) + 300;
        return bounds;
    };

    this.setMinimapBounds = function() {
        if (!self.updateBounds) return;
        self.updateBounds = false;

        minimapBounds = this.getSubPatchBounds(currentSubPatch);

        if(self.paperMap)
            self.paperMap.setViewBox(
                minimapBounds.x,
                minimapBounds.y,
                minimapBounds.w,
                minimapBounds.h
            );
    };

    var oldVBW = 0;
    var oldVBH = 0;
    var oldVBX = 0;
    var oldVBY = 0;

    var viewBoxAnim = {
        x: new CABLES.TL.Anim(),
        y: new CABLES.TL.Anim(),
        w: new CABLES.TL.Anim(),
        h: new CABLES.TL.Anim()
    };

    this._animViewBox = function() {
        var t = (CABLES.now() - viewBoxAnim.start) / 1000;

        viewBox.x = viewBoxAnim.x.getValue(t);
        viewBox.y = viewBoxAnim.y.getValue(t);
        viewBox.w = viewBoxAnim.w.getValue(t);
        viewBox.h = viewBoxAnim.h.getValue(t);
        self.updateViewBox();

        if (viewBoxAnim.x.isFinished(t)) return;

        setTimeout(self._animViewBox, 20);
    };

    this.animViewBox = function(x, y, w, h) {
        viewBoxAnim.start = CABLES.now();
        viewBoxAnim.x.clear();

        viewBoxAnim.x.defaultEasing =
            viewBoxAnim.y.defaultEasing =
            viewBoxAnim.w.defaultEasing =
            viewBoxAnim.h.defaultEasing = CABLES.TL.EASING_CUBIC_OUT;

        viewBoxAnim.y.clear();
        viewBoxAnim.w.clear();
        viewBoxAnim.h.clear();

        viewBoxAnim.x.setValue(0, viewBox.x);
        viewBoxAnim.y.setValue(0, viewBox.y);
        viewBoxAnim.w.setValue(0, viewBox.w);
        viewBoxAnim.h.setValue(0, viewBox.h);

        viewBoxAnim.x.setValue(0.25, x);
        viewBoxAnim.y.setValue(0.25, y);
        viewBoxAnim.w.setValue(0.25, w);
        viewBoxAnim.h.setValue(0.25, h);

        this._animViewBox();
    };

    this.updateViewBox = function() {
        oldVBW = viewBox.w;
        oldVBH = viewBox.h;
        oldVBX = viewBox.x;
        oldVBY = viewBox.y;

        if (!isNaN(viewBox.x) && !isNaN(viewBox.y) && !isNaN(viewBox.w) && !isNaN(viewBox.h))
            self.paper.setViewBox(viewBox.x, viewBox.y, viewBox.w, viewBox.h);

        if(miniMapBounding)
            miniMapBounding.attr({
                x: viewBox.x,
                y: viewBox.y,
                width: viewBox.w,
                height: viewBox.h
            });

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
        if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && !spacePressed) {
            gui.setTransformGizmo(null);
            
            if(!mouseRubberBandStartPos && !e.shiftKey)
            {
                gui.patch().setSelectedOp(null);
                
            }
            
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
                timeoutRubberBand = setTimeout(function() {
                    for (var i in self.ops) {
                        if (!self.ops[i].isHidden()) {
                            var rect = self.ops[i].oprect.getRect();
                            if (rect && rect.matrix) {
                                var opX = rect.matrix.e;
                                var opY = rect.matrix.f;
                                var opW = rect.attr("width");
                                var opH = rect.attr("height");

                                if (
                                    (opX > start.x && opX < end.x && opY > start.y && opY < end.y) || // left upper corner
                                    (opX + opW > start.x && opX + opW < end.x && opY + opH > start.y && opY + opH < end.y) // right bottom corner
                                ) {
                                    self.addSelectedOp(self.ops[i]);
                                    self.ops[i].setSelected(true);
                                } else {
                                    self.removeSelectedOp(self.ops[i]);
                                    self.ops[i].setSelected(false);
                                }
                            }
                        }
                    }

                    if (selectedOps.length !== 0) setStatusSelectedOps();
                    timeoutRubberBand = -1;

                }, 50);

        }
    }

    // ---------------------------------------------

    this.loadingError = false;

    this.setProject = function(proj) {
        this.loadingError = false;
        if (proj.ui) {
            if (proj.ui.subPatchViewBoxes) subPatchViewBoxes = proj.ui.subPatchViewBoxes;
            if (proj.ui.viewBox) {
                viewBox.x = proj.ui.viewBox.x;
                viewBox.y = proj.ui.viewBox.y;
                viewBox.w = proj.ui.viewBox.w;
                viewBox.h = proj.ui.viewBox.h;
            }

            if (proj.ui.renderer) {
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

        gui.serverOps.loadProjectLibs(proj, function() {
            gui.scene().deSerialize(proj);
            CABLES.undo.clear();
            CABLES.UI.MODAL.hideLoading();
            self.updateSubPatches();

            gui.patchConnection.send(CABLES.PACO_LOAD, {
                "patch": JSON.stringify(proj),
            });
        });
    };

    function dragMiniMap(e) {
        if (mouseRubberBandPos) return;
        e = mouseEvent(e);

        if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT) {
            var p = e.offsetX / CABLES.UI.uiConfig.miniMapWidth;
            var ph = e.offsetY / CABLES.UI.uiConfig.miniMapHeight;

            viewBox.x = (minimapBounds.x + p * minimapBounds.w) - viewBox.w / 3;
            viewBox.y = (minimapBounds.y + ph * minimapBounds.h) - viewBox.h / 3;
            self.updateViewBox();
        }
    }

    this.show = function(_scene) {
        this.scene = _scene;

        $('#timing').append(CABLES.UI.getHandleBarHtml('timeline_controler'), {});
        $('#meta').append();

        if (!CABLES.UI.userSettings.get("hideMinimap"))
        {
            this.paperMap = Raphael("minimap", CABLES.UI.uiConfig.miniMapWidth, CABLES.UI.uiConfig.miniMapHeight);
            this.paperMap.setViewBox(-500, -500, 4000, 4000);
    
            miniMapBounding = this.paperMap.rect(0, 0, 10, 10).attr({
                "stroke": "#666",
                "fill": "#1a1a1a",
                "stroke-width": 1
            });
    
            $('#minimap svg').on("mousemove touchmove", dragMiniMap);
            $('#minimap svg').on("mousedown", dragMiniMap);
        }

        this.paper = Raphael("patch", 0, 0);
        this.bindScene(self.scene);

        viewBox = {
            x: 0,
            y: 0,
            w: $('#patch svg').width(),
            h: $('#patch svg').height()
        };
        self.updateViewBox();

        this._elPatchSvg = this._elPatchSvg || $('#patch svg');
        this._elPatch = this._elPatch || $('#patch');
        this._elBody = this._elBody || $('body');

        this._elPatchSvg.bind("mousewheel", function(event, delta, nbr) {
            if (!event.metaKey && !event.altKey && !event.ctrlKey && CABLES.UI.userSettings.get("touchpadmode")) {
                if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.deltaY *= 0.5;
                else event.deltaX *= 0.5;

                viewBox.x += event.deltaX;
                viewBox.y += -1 * event.deltaY;

                self.updateViewBox();

                event.preventDefault();
                event.stopImmediatePropagation();

                return;
            }

            delta = CGL.getWheelSpeed(event);
            delta = Math.min(delta, 10);
            delta = Math.max(delta, -10);
            if (!CABLES.UI.userSettings.get("touchpadmode")) delta *= 13;

            event = mouseEvent(event);

            delta = (viewBox.w / delta) * 10;

            if (viewBox.w - delta > 0 && viewBox.h - delta > 0) {
                var oldWidth = viewBox.w;
                var oldHeight = viewBox.h;

                viewBox.w -= delta;
                viewBox.h -= delta;

                viewBox.x -= (event.offsetX / 1000 * (viewBox.w - oldWidth));
                viewBox.y -= (event.offsetY / 1000 * (viewBox.h - oldHeight));
            }

            self.setMinimapBounds();
            self.updateViewBox();

            if (event.ctrlKey) // disable chrome pinch/zoom gesture
            {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            callEvent('patch_zoom');
        });

        this.background = self.paper.rect(-99999, -99999, 2 * 99999, 2 * 99999).attr({
            fill: CABLES.UI.uiConfig.colorBackground,
            opacity: 0.01,
            "stroke-width": 0
        });

        this.background.toBack();

        this.background.node.onmousemove = function(ev) {
            CABLES.UI.selectedEndOp = null;
        };

        this.background.node.onmousedown = function(ev) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.patch);
            this._elPatch.focus();
            CABLES.UI.OPSELECT.linkNewOpToPort=null;
            if (!ev.shiftKey && !spacePressed && ev.buttons == CABLES.UI.MOUSE_BUTTON_LEFT)
            {
                gui.patch().setSelectedOp(null);
                self.showProjectParams();
            }
            
        }.bind(this);

        var lastZoomDrag = -1;

        this.toggleCenterZoom=function(e)
        {
            e=e||lastMouseMoveEvent;
            var x = gui.patch().getCanvasCoordsMouse(e).x;
            var y = gui.patch().getCanvasCoordsMouse(e).y;

            var sizeSmall = 650;
            var size = Math.max(minimapBounds.w, minimapBounds.h);

            if (viewBox.w >= sizeSmall * 2) {
                var vb={};
                vb.x = x - sizeSmall / 2;
                vb.y = y - sizeSmall / 2;
                vb.w = sizeSmall;
                vb.h = sizeSmall;
                self.animViewBox(vb.x, vb.y, vb.w, vb.h);
            } else {
                // console.log("center");
                self.centerViewBoxOps();
            }
        }

        this.background.node.ondblclick = function(e) {
            e = mouseEvent(e);

            self.toggleCenterZoom(e);
            // self.updateViewBox();
        };

        $('#patch').on("mousemove touchmove", function(e) {
            e = mouseEvent(e);
            gui.notIdling();

            if (e.metaKey || e.altKey) {
                if (CABLES.UI.quickAddOpStart) {

                    if (!self.quickLinkLine) self.quickLinkLine = new CABLES.UI.SVGLine(
                        CABLES.UI.quickAddOpStart.op.uiAttribs.translate.x + 30,
                        CABLES.UI.quickAddOpStart.op.uiAttribs.translate.y + 15);
                    self.quickLinkLine.updateEnd(
                        gui.patch().getCanvasCoordsMouse(e).x,
                        gui.patch().getCanvasCoordsMouse(e).y
                    );

                    return;
                }

            } else if (self.quickLinkLine) {
                self.removeQuickLinkLine();
            }

            if (CABLES.UI.MOUSEOVERPORT) return; // cancel when dragging port...

            if (e.buttons == CABLES.UI.MOUSE_BUTTON_WHEEL) {
                if (lastZoomDrag != -1) {
                    var delta = lastZoomDrag - e.clientY;

                    viewBox.x += delta / 2;
                    viewBox.y += delta / 2;
                    viewBox.w -= delta;
                    viewBox.h -= delta;
                    self.updateViewBox();
                }
                lastZoomDrag = e.clientY;
            }

            if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && !spacePressed) {
                for (var i in self.ops)
                    if (!self.ops[i].isHidden() && (self.ops[i].isDragging || self.ops[i].isMouseOver)) return;
                rubberBandMove(e);

            }
        });

        // $('#patch svg').bind("mouseup", function (event)
        this._elPatchSvg.bind("mouseup", function(event) {
            rubberBandHide();
            lastZoomDrag = -1;

            gui.setCursor();
            
        }.bind(this));

        this._elPatchSvg.bind("mouseenter", function(event) { gui.setCursor(); }.bind(this));
        this._elPatchSvg.bind("mouseleave", function(event) { gui.setCursor(); }.bind(this));


        this._elPatchSvg.bind("mousemove touchmove", function(e) {
            e = mouseEvent(e);


            if ( (CABLES.UI.MOUSEOVERPORT && !spacePressed) || (mouseRubberBandStartPos && e.buttons != CABLES.UI.MOUSE_BUTTON_LEFT) ) {
                rubberBandHide();
                lastMouseMoveEvent = e;
                return;
            }

            if (lastMouseMoveEvent && (e.buttons == CABLES.UI.MOUSE_BUTTON_RIGHT || (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT && spacePressed))) { // && !CABLES.UI.MOUSEOVERPORT

                gui.setCursor("grab");
                
                var mouseX = gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).x;
                var mouseY = gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).y;

                viewBox.x += mouseX - gui.patch().getCanvasCoordsMouse(e).x;
                viewBox.y += mouseY - gui.patch().getCanvasCoordsMouse(e).y;

                this._elBody.css({
                    "background-position": "" + (-1 * viewBox.x) + " " + (-1 * viewBox.y)
                });

                clearTimeout(timeoutFpsLimit);
                timeoutFpsLimit = setTimeout(function() {
                    self.scene.config.fpsLimit = fpsLimitBefore;
                }, 100);

                self.updateViewBox();
                callEvent('patch_pan');
            }

            lastMouseMoveEvent = e;

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
                            console.error('op '+op.objName+' has duplicate port names ('+op.portsIn[j].name+'), they must be unique. ');
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

        if (!op.uiAttribs) {
            op.uiAttribs = {};
        }

        if (!op.uiAttribs.translate)
        {
            if (CABLES.UI.OPSELECT.newOpPos.y === 0 && CABLES.UI.OPSELECT.newOpPos.x === 0) op.uiAttribs.translate = { x: viewBox.x + viewBox.w / 2, y: viewBox.y + viewBox.h / 2 };
                else  op.uiAttribs.translate = { x: CABLES.UI.OPSELECT.newOpPos.x, y: CABLES.UI.OPSELECT.newOpPos.y };
        }

        if (op.uiAttribs.hasOwnProperty('translate')) {
            uiOp.setPos(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        }

        if (op.uiAttribs.hasOwnProperty('title')) {
            gui.patch().setOpTitle(uiOp, op.uiAttribs.title);
        }

        if (!op.uiAttribs.hasOwnProperty('subPatch')) {
            op.uiAttribs.subPatch = currentSubPatch;
        }

        if (CABLES.UI.OPSELECT.linkNewOpToSuggestedPort) {
            console.log('CABLES.UI.OPSELECT.linkNewOpToSuggestedPort');
            var link = gui.patch().scene.link(
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op,
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName,
                op,
                CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName);
        } else
        if (CABLES.UI.OPSELECT.linkNewLink) {
            var op1 = CABLES.UI.OPSELECT.linkNewLink.p1.op;
            var port1 = CABLES.UI.OPSELECT.linkNewLink.p1.thePort;
            var op2 = CABLES.UI.OPSELECT.linkNewLink.p2.op;
            var port2 = CABLES.UI.OPSELECT.linkNewLink.p2.thePort;

            for (var il in port1.links) {
                if (
                    port1.links[il].portIn == port1 && port1.links[il].portOut == port2 ||
                    port1.links[il].portOut == port1 && port1.links[il].portIn == port2) {
                    port1.links[il].remove();
                }
            }

            var foundPort1 = op.findFittingPort(port1);
            var foundPort2 = op.findFittingPort(port2);

            if (foundPort2 && foundPort1) {
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
        if (CABLES.UI.OPSELECT.linkNewOpToPort) {

            var foundPort = op.findFittingPort(CABLES.UI.OPSELECT.linkNewOpToPort);

            if (foundPort)
            {
                // console.log(op.objName,'op.objName');
                if(op.objName=='Ops.Value.Value')
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

        // uiOp.setPos(op.uiAttribs.translate.x,op.uiAttribs.translate.y);

        var dir=null;
        if(CABLES.UI.OPSELECT.linkNewOpToPort)dir=CABLES.UI.OPSELECT.linkNewOpToPort.direction;

        CABLES.UI.OPSELECT.linkNewOpToOp = null;
        CABLES.UI.OPSELECT.linkNewLink = null;
        CABLES.UI.OPSELECT.newOpPos = {
            x: 0,
            y: 0
        };
        CABLES.UI.OPSELECT.linkNewOpToSuggestedPort = null;
        CABLES.UI.OPSELECT.linkNewOpToPort = null;
        
        uiOp.setPos();

        
        var pos = self.findNonCollidingPosition(uiOp.getPosX(), uiOp.getPosY(), uiOp.op.id,dir);
        
        // uiOp.setPos(pos.x, pos.y);
        uiOp.setPos( uiOp.getPosX(), uiOp.getPosY() );
        




        if (!isLoading) {
            setTimeout(function() {
                if (currentSubPatch == uiOp.getSubPatch()) uiOp.show();

                if (showAddedOpTimeout != -1) clearTimeout(showAddedOpTimeout);
                showAddedOpTimeout = setTimeout(function() {
                    gui.patch().setSelectedOp(null);
                    gui.patch().setSelectedOp(uiOp);
                    gui.patch().showOpParams(op);
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

            setTimeout(function() {
                // this fixes links not showing up after pasting
                uiOp.setPos();
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

            if (self.ops.length > CABLES.UI.uiConfig.miniMapShowAutomaticallyNumOps) {
                gui.showMiniMap();
            }

            logStartup('Patch loaded');
        };

        scene.onUnLink = function(p1, p2) {
            gui.setStateUnsaved();

            // console.log('onunlink',p1,p2);

            // console.log('unlink',p1,p2 );
            // todo: check if needs to be updated ?
            self.updateCurrentOpParams();

            for (var i in self.ops) {

                for (var j in self.ops[i].links) {
                    if (self.ops[i].links[j].p1 && self.ops[i].links[j].p2 &&
                        ((self.ops[i].links[j].p1.thePort == p1 && self.ops[i].links[j].p2.thePort == p2) ||
                            (self.ops[i].links[j].p1.thePort == p2 && self.ops[i].links[j].p2.thePort == p1))) {
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
                        }(self.ops[i].links[j].p1.thePort.getName(),
                            self.ops[i].links[j].p2.thePort.getName(),
                            self.ops[i].links[j].p1.thePort.parent.id,
                            self.ops[i].links[j].p2.thePort.parent.id
                        );

                        gui.patchConnection.send(CABLES.PACO_UNLINK, {
                            "op1": self.ops[i].links[j].p1.thePort.parent.id,
                            "op2": self.ops[i].links[j].p2.thePort.parent.id,
                            "port1": self.ops[i].links[j].p1.thePort.getName(),
                            "port2": self.ops[i].links[j].p2.thePort.getName(),
                        });

                        self.ops[i].links[j].hideAddButton();

                        self.ops[i].links[j].p1.updateUI();
                        self.ops[i].links[j].p2.updateUI();
                        self.ops[i].links[j].p1 = null;
                        self.ops[i].links[j].p2 = null;
                        self.ops[i].links[j].remove();
                    }
                }
                self.ops[i].removeDeadLinks();
            }
        };

        scene.onLink = function(p1, p2) {
            gui.setStateUnsaved();

            var uiPort1 = null;
            var uiPort2 = null;
            for (var i=0;i<self.ops.length;i++) {
                for (var j=0;j<self.ops[i].portsIn.length;j++) {
                    if (self.ops[i].portsIn[j].thePort == p1) uiPort1 = self.ops[i].portsIn[j];
                    if (self.ops[i].portsIn[j].thePort == p2) uiPort2 = self.ops[i].portsIn[j];
                }
                // for (var jo in self.ops[i].portsOut) {
                for (var jo=0;jo<self.ops[i].portsOut.length;jo++) {
                    if (self.ops[i].portsOut[jo].thePort == p1) uiPort1 = self.ops[i].portsOut[jo];
                    if (self.ops[i].portsOut[jo].thePort == p2) uiPort2 = self.ops[i].portsOut[jo];
                }
            }

            var thelink = new UiLink(uiPort1, uiPort2);

            if (!uiPort1) {
                console.log('no uiport found');
                return;
            }
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
                self.updateCurrentOpParams();

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
        };

        scene.onDelete = function(op) {
            var undofunc = function(opname, opid) {
                CABLES.undo.add({
                    undo: function() {
                        gui.scene().addOp(opname, op.uiAttribs, opid);
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

        };

        scene.onAdd = function(op) {
            gui.setStateUnsaved();
            $('#patch').focus();
            var width = CABLES.UI.uiConfig.opWidth;
            if (op.name.length == 1) width = CABLES.UI.uiConfig.opWidthSmall;

            var uiOp = new OpUi(self.paper, op, CABLES.UI.OPSELECT.newOpPos.x, CABLES.UI.OPSELECT.newOpPos.y, width, CABLES.UI.uiConfig.opHeight, op.name);

            self.ops.push(uiOp);

            uiOp.wasAdded = false;
            gui.patch().updateBounds = true;

            doAddOp(uiOp);
            
            this.opCollisionTest(uiOp);

        }.bind(this);
    };



    this.setOpColor=function(col)
    {
        for(var i=0;i<selectedOps.length;i++)
        {
            selectedOps[i].op.uiAttr({"color":col});
        }
    }

    this.setOpTitle = function(uiop, t) {

        uiop.op.setTitle(t);
        // uiop.op.uiAttribs.title = t;
        // uiop.op.name = t;
        uiop.oprect.setTitle(t);
    };

    this.setCurrentOpTitle = function(t) {
        if (currentOp) this.setOpTitle(currentOp, t);
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

        gui.setWorking(true,'patch');

        setTimeout(function()
        {
            subPatchViewBoxes[currentSubPatch] = {
                x: viewBox.x,
                y: viewBox.y,
                w: viewBox.w,
                h: viewBox.h
            };
    
            for (var i=0;i<self.ops.length;i++) self.ops[i].isDragging = self.ops[i].isMouseOver = false;
    
            if (which === 0) $('#subpatch_nav').hide();
            else $('#subpatch_nav').show();
    
            currentSubPatch = which;
            self.updateSubPatches();
    
            if (subPatchViewBoxes[which]) {
                viewBox = subPatchViewBoxes[which];
                this.updateViewBox();
            }
    
            $('#patch').focus();
            self.updateBounds = true;
            self.updateSubPatchBreadCrumb();
    
            gui.setWorking(false,'patch');
            
        }.bind(this),10);

        

    };

    this.getSubPatchPathString=function(subId)
    {
        var arr=this.findSubpatchOp(subId);

        var str='';
        for(var i=0;i<arr.length;i++)
        {
            str+=arr[i].name+' ';
        }
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

    this.getSelectionBounds = function() {
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

        return bounds;
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
        var found=false;
        var count=1;

        do
        {
            found=false;
            for (var i =0;i<this.ops.length;i++)
            {
                var testOp = this.ops[i];
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
    };


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


    this.compressSelectedOps = function() {
        if (!selectedOps || selectedOps.length === 0) return;
        this.saveUndoSelectedOpsPositions();

        selectedOps.sort(function(a, b) {
            return a.op.uiAttribs.translate.y - b.op.uiAttribs.translate.y;
        });

        var y = selectedOps[0].op.uiAttribs.translate.y;

        for (var j = 0; j < selectedOps.length; j++) {
            if (j > 0) y += selectedOps[j].getHeight() + 10;
            selectedOps[j].setPos(selectedOps[j].op.uiAttribs.translate.x, y);

        }
    };


    this.alignSelectedOps = function() {
        var sumX = 0,
            minX = 9999999,
            sumY = 0,
            minY = 9999999,
            maxX = -9999999,
            maxY= -9999999

        var j = 0;

        this.saveUndoSelectedOpsPositions();

        for (j in selectedOps) {
            minX = Math.min(minX, selectedOps[j].op.uiAttribs.translate.x);
            minY = Math.min(minY, selectedOps[j].op.uiAttribs.translate.y);

            maxX = Math.max(maxX, selectedOps[j].op.uiAttribs.translate.x);
            maxY = Math.max(maxY, selectedOps[j].op.uiAttribs.translate.y);
        }

        if (Math.abs(maxX-minX) > Math.abs(maxY-minY)) self.alignSelectedOpsHor();
            else self.alignSelectedOpsVert();
    };

    this.saveUndoSelectedOpsPositions = function() {
        var opPositions = [];
        for (var j = 0; j < selectedOps.length; j++) {
            var obj = {};
            obj.id = selectedOps[j].op.id;
            obj.x = selectedOps[j].op.uiAttribs.translate.x;
            obj.y = selectedOps[j].op.uiAttribs.translate.y;
            opPositions.push(obj);
        }

        CABLES.undo.add({
            undo: function() {
                for (var j = 0; j < opPositions.length; j++) {
                    var obj = opPositions[j];
                    for (var i in self.ops)
                        if (self.ops[i].op.id == obj.id)
                            self.ops[i].setPos(obj.x, obj.y);
                }
            },
            redo: function() {
                gui.scene().addOp(objName, op.uiAttribs, opid);
            }
        });


    };

    this.alignSelectedOpsVert = function() {
        if (selectedOps.length > 0) {
            var j = 0;
            var sum = 0;
            for (j in selectedOps) sum += selectedOps[j].op.uiAttribs.translate.x;

            var avg = sum / selectedOps.length;

            for (j in selectedOps) selectedOps[j].setPos(avg, selectedOps[j].op.uiAttribs.translate.y);
        }
    };

    this.alignSelectedOpsHor = function() {
        if (selectedOps.length > 0) {
            var j = 0;
            var sum = 0;
            for (j in selectedOps)
                sum += selectedOps[j].op.uiAttribs.translate.y;

            var avg = sum / selectedOps.length;

            for (j in selectedOps)
                selectedOps[j].setPos(selectedOps[j].op.uiAttribs.translate.x, avg);
        }
    };

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
    };

    this.removeSelectedOp = function(uiop) {
        for (var i in selectedOps) {
            if (selectedOps[i] == uiop) {
                selectedOps.splice(i, 1);
                return;
            }
        }
    };

    this.focusOp = function(id,center) {
        for (var i =0;i<gui.patch().ops.length;i++)
        {
            if (gui.patch().ops[i].op.id == id)
            {
                gui.patch().ops[i].oprect.showFocus();

                if(center)
                {

                    self.animViewBox(
                        gui.patch().ops[i].op.uiAttribs.translate.x - viewBox.w / 2,
                        gui.patch().ops[i].op.uiAttribs.translate.y - viewBox.h / 2,
                        viewBox.w, viewBox.h);
            
                }

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
                // console.log('found sel op by id !');
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
        // if(uiop.op.objName=='Ops.Ui.Patch')
        // self.selectAllOpsSubPatch(uiop.op.patchId.val);

        uiop.oprect.setSelected(true);
        for (var i in selectedOps)
            if (selectedOps[i] == uiop) return;
        selectedOps.push(uiop);
    };

    this.moveSelectedOpsFinished = function() {
        var i = 0;
        // if(selectedOps.length==1)
        //     for(i in self.ops)
        //         if(self.ops[i].op.uiAttribs.subPatch==currentSubPatch)
        //             for(var j in self.ops[i].links)
        //                 self.ops[i].links[j].hideAddButton();

        if (selectedOps.length == 1)
            this.opCollisionTest(selectedOps[0]);

            for (i in selectedOps)
            selectedOps[i].doMoveFinished();
    };



    this.moveSelectedOps = function(dx, dy, a, b, e) {
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
        for (var i = 0; i < self.ops.length; i++) {
            if (self.ops[i].op == op) return self.ops[i];
        }
        return null;

    };

    this.updateOpParams = function(id) {
        if(selectedOps.length!=1)return;
        if(selectedOps[0].op.id!=id)return;
        gui.setTransformGizmo(null);
        var op=gui.scene().getOpById(id);
        self.showOpParams(op);
    };

    this.showProjectParams = function() {
        var s = {};
        if(currentOp && currentOp)currentOp=null;
        gui.setTransformGizmo(null);

        s.name = currentProject.name;
        s.settings = gui.scene().settings;

        var numVisibleOps = 0;
        var errorOps=[];
        var warnOps=[];
        var colors=[];

        for (var i =0;i< self.ops.length;i++)
        {
            var op=this.ops[i].op;
            if (!this.ops[i].isHidden()) numVisibleOps++;
            if (op.uiAttribs.error)
            {
                errorOps.push(op);
                if(op.objName.toLowerCase().indexOf("Deprecated")>-1)op.isDeprecated=true;
            }
            if (op.uiAttribs.warning) warnOps.push(op);
            if (op.uiAttribs.color) colors.push(op.uiAttribs.color);
        }

        var html='';

        if(!gui.user.isPatchOwner)
        {
            html+=CABLES.UI.getHandleBarHtml('clonepatch', {});
        }

        html+=gui.bookmarks.getHtml();

        if(errorOps.length==0)errorOps=null;
        if(warnOps.length==0)warnOps=null;
        colors = CABLES.uniqueArray(colors);

        html += CABLES.UI.getHandleBarHtml('error_ops', { "errorOps":errorOps, "warnOps":warnOps });
        html += CABLES.UI.getHandleBarHtml('filter_colors', { "colors":colors });

        $('#options').html(html);
    };

    function updateUiAttribs() {

        self.setCurrentOpTitle(currentOp.op.name);

        if (!currentOp.op.uiAttribs.warning || currentOp.op.uiAttribs.warning.length === 0) {
            $('#options_warning').hide();
        } else {
            $('#options_warning').show();
            $('#options_warning').html(currentOp.op.uiAttribs.warning);
        }

        if (!currentOp.op.uiAttribs.hint || currentOp.op.uiAttribs.hint.length === 0) {
            $('#options_hint').hide();
        } else {
            $('#options_hint').show();
            $('#options_hint').html(currentOp.op.uiAttribs.hint);
        }

        if (!currentOp.op.uiAttribs.error || currentOp.op.uiAttribs.error.length === 0) {
            $('#options_error').hide();
        } else {
            $('#options_error').show();
            $('#options_error').html(currentOp.op.uiAttribs.error);
        }

        if (!currentOp.op.uiAttribs.info) $('#options_info').hide();
        else {
            $('#options_info').show();
            $('#options_info').html('<div class="panelhead">info</div><div class="panel">' + currentOp.op.uiAttribs.info + '</div>');
        }
    }

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

    var delayedShowOpParams = 0;
    this.showOpParams = function(op) {
        // self.highlightOpNamespace(op);
        gui.setTransformGizmo(null);
        clearTimeout(delayedShowOpParams);
        delayedShowOpParams = setTimeout(function() {
            self._showOpParams(op);
        }, 30);
    };

    this.openParamEditor=function(opid,portname)
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

        var editorObj=CABLES.editorSession.rememberOpenEditor("param",opid+portname,{"opid":opid,"portname":portname} );

        gui.showEditor();
        gui.editor().addTab({
            content: port.get() + '',
            editorObj:editorObj,
            id:CABLES.Editor.sanitizeId('editparam_'+opid+'_'+port.name),
            title: '' + port.name,
            syntax: port.uiAttribs.editorSyntax,
            onSave: function(setStatus, content) {
                // console.log('setvalue...');
                setStatus('saved');
                gui.setStateUnsaved();
                gui.jobs().finish('saveeditorcontent');
                port.set(content);
            },
            onClose: function(which)
            {
                CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
            }
        });

    }

    // function paramsAddAutoSpacers()
    // {
    //     var lastName='';
    //     var groupCount=0;
    //     var dir=0;

    //     function testSpacers()
    //     {
    //         var name=$(this).data("portname");
    //         if(name.substring(0,3) == lastName.substring(0,3))
    //         {
    //             groupCount++;
    //         }
    //         else
    //         {
    //             if(groupCount>0)
    //             {
    //                 groupCount=0;
    //                 // $(this).css({"background-color":"red"});
    //                 // $(this).addClass("paramGroupSpacer");
    //                 if(dir==0)
    //                 {
    //                     $(this).before("<tr><td></td></tr>");
    //                     $(this).data('hasBefore',true);
    //                 }
    //                 else
    //                 {
    //                     $(this).after("<tr><td></td></tr>");
    //                     $(this).data('hasAfter',true);
    //                 }
                    
    //                 console.log("----");
    //             }
    //         }
    //         console.log(name);
    //         lastName=name;
    //     }

    //     $('.opports_in').each(testSpacers);

    //     lastName='';
    //     groupCount=0;
    //     dir=1;

    //     jQuery.fn.reverse = [].reverse;
    //     $('.opports_in').reverse().each(testSpacers);

    // }

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

    function checkDefaultValue(op, index) {
        if (op.portsIn[index].defaultValue !== undefined && op.portsIn[index].defaultValue !== null) {
            var titleEl = $('#portTitle_in_' + index);
            if (op.portsIn[index].val != op.portsIn[index].defaultValue) {
                if (!titleEl.hasClass('nonDefaultValue')) titleEl.addClass('nonDefaultValue');
            } else {
                if (titleEl.hasClass('nonDefaultValue')) titleEl.removeClass('nonDefaultValue');
            }
        }

    }
    this._showOpParams = function(op) {

        gui.setTransformGizmo(null);

        var i = 0;
        callEvent('opSelected', op);

        op.isServerOp=gui.serverOps.isServerOp(op.objName);

        // show first anim in timeline
        if (self.timeLine) {
            var foundAnim = false;
            for (i =0;i<op.portsIn.length;i++) {
                if (op.portsIn[i].isAnimated()) {
                        self.timeLine.setAnim(op.portsIn[i].anim, {
                        name: op.portsIn[i].name
                    });
                    foundAnim = true;
                    continue;
                }
            }
            if (!foundAnim) self.timeLine.setAnim(null);
        }

        for (var iops =0; iops<this.ops.length;iops++)
            if (this.ops[iops].op == op)
                currentOp = this.ops[iops];
        op.summary = gui.opDocs.getSummary(op.objName);
        var doc = gui.opDocs.getOpDocByName(op.objName);
        var hasScreenshot=(doc && doc.hasScreenshot);

        if (!currentOp) return;

        watchPorts = [];
        watchAnimPorts = [];
        watchColorPicker = [];

        var ownsOp = false;
        if (op.objName.startsWith('Ops.User.' + gui.user.username)) ownsOp = true;
        if (op.objName.startsWith('Ops.Deprecated.')) {
            op.isDeprecated = true;
            var notDeprecatedName = op.objName.replace("Deprecated.", '');
            var alt = CABLES.Patch.getOpClass(notDeprecatedName);
            if (alt) op.isDeprecatedAlternative = notDeprecatedName;
        }
        if (op.objName.startsWith('Ops.Exp.')) op.isExperimental = true;

        var isBookmarked=false;
        if (op) isBookmarked = gui.bookmarks.hasBookmarkWithId(op.id);

        var html = CABLES.UI.getHandleBarHtml('params_op_head', {
            "op": op,
            "isBookmarked": isBookmarked,
            "colorClass": "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.objName),
            "texts": CABLES.UI.TEXTS,
            "user": gui.user,
            "ownsOp": ownsOp,
            "hasExample":hasScreenshot
        });
        var sourcePort = $("#params_port").html();
        var templatePort = Handlebars.compile(sourcePort);

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedOp);

        if (op.portsIn.length > 0) {
            html += CABLES.UI.getHandleBarHtml('params_ports_head', {
                "dirStr": 'in',
                "title": 'Input Parameters',
                "texts": CABLES.UI.TEXTS
            });

            for (i in op.portsIn) {
                op.portsIn[i].watchId = 'in_' + i;
                watchAnimPorts.push(op.portsIn[i]);

                if (op.portsIn[i].uiAttribs.colorPick) watchColorPicker.push(op.portsIn[i]);
                if (op.portsIn[i].isLinked() || op.portsIn[i].isAnimated()) watchPorts.push(op.portsIn[i]);

                html += templatePort({
                    port: op.portsIn[i],
                    "dirStr": "in",
                    "portnum": i,
                    "isInput": true,
                    "op": op,
                    "texts": CABLES.UI.TEXTS
                });
            }
        }

        if (op.portsOut.length > 0) {
            html += CABLES.UI.getHandleBarHtml('params_ports_head', {
                "dirStr": 'out',
                "title": 'Output Parameters',
                "op": op,
                texts: CABLES.UI.TEXTS
            });

            var foundPreview = false;
            for (var i2 in op.portsOut) {
                if (op.portsOut[i2].getType() == CABLES.OP_PORT_TYPE_VALUE || op.portsOut[i2].getType() == CABLES.OP_PORT_TYPE_ARRAY) {
                    op.portsOut[i2].watchId = 'out_' + i2;
                    watchPorts.push(op.portsOut[i2]);
                }

                // set auto preview
                if (!foundPreview && op.portsOut[i2].uiAttribs.preview) {
                    foundPreview = true;
                    gui.texturePreview().selectTexturePort(op.portsOut[i2]);
                    
                }

                html += templatePort({
                    "port": op.portsOut[i2],
                    "dirStr": "out",
                    "portnum": i2,
                    "isInput": false,
                    "op": op
                });
            }
        }

        html += CABLES.UI.getHandleBarHtml('params_op_foot', {
            "op": op,
            "user": gui.user
        });

        $('#options').html(html);
        CABLES.valueChangerInitSliders();
        // paramsAddAutoSpacers();

        updateUiAttribs();



        for (i = 0; i < op.portsIn.length; i++) {
            if (op.portsIn[i].uiAttribs.display && op.portsIn[i].uiAttribs.display == 'file')
            {
                var shortName=op.portsIn[i].get()||'none';
                if(shortName.indexOf("/")>-1) shortName=shortName.substr(shortName.lastIndexOf("/")+1);

                $('#portFilename_' + i).html('<span class="button fa fa-folder-open-o monospace" style="text-transform:none;font-family:monospace;font-size: 13px;">'+shortName+'</span>');

{/* <a class="graphbutton " onclick="gui.showLibrary('.portFileVal_{{ portnum }}','{{port.uiAttribs.filter}}','{{ ../port.parent.id }}');"></a> --> */}


                if (op.portsIn[i].get() && ((op.portsIn[i].get() + '').endsWith('.jpg') || (op.portsIn[i].get() + '').endsWith('.png'))) {
                    $('#portFileVal_' + i+'_preview').css('max-width', '100%');
                    $('#portFileVal_' + i+'_preview').html('<img class="dark" src="' + op.portsIn[i].get() + '" style="max-width:100%;margin-top:10px;"/>');
                    
                } else {

                    $('#portFileVal_' + i+'_preview').html('');
                }
            }
        }



        function cbPortDelete(index) {
            $('#portdelete_out_' + index).on('click', function(e) {
                op.portsOut[index].removeLinks();
                self.showOpParams(op);
            });
        }

        for (var ipo in op.portsOut) {
            cbPortDelete(ipo);
        }

        for (var ipi in op.portsIn) {
            (function(index) {
                if (op.portsIn[index].isAnimated()) $('#portanim_in_' + index).addClass('timingbutton_active');
                if (op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) $('#portgraph_in_' + index).addClass('timingbutton_active');

                $('#portTitle_in_' + index).on('click', function(e) {
                    const p=op.portsIn[index];

                    if(!p.uiAttribs.hidePort)
                    {
                        gui.opSelect().show(
                            {
                                x:p.parent.uiAttribs.translate.x+(index*(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)),
                                y:p.parent.uiAttribs.translate.y-50,
                            },op,p);
                    }
                });

                
                $('#portCreateOp_in_' + index).on('click', function(e) {
                    var thePort = op.portsIn[index];
                    if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE) {
                        gui.scene().addOp('Ops.Gl.Texture', {}, function(newop) {
                            gui.scene().link(op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
                        });
                        
                    }
                });

                $('#portedit_in_' + index).on('click', function(e) {
                    var thePort = op.portsIn[index];
                    // console.log('thePort.uiAttribs.editorSyntax',thePort.uiAttribs.editorSyntax);

                    self.openParamEditor(op.id,op.portsIn[index].name)

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

                $('#portbutton_' + index).on('click', function(e) {
                    op.portsIn[index]._onTriggered();
                });


                $('#portgraph_in_' + index).on('click', function(e) {
                    if (op.portsIn[index].isAnimated()) {
                        op.portsIn[index].anim.stayInTimeline = !op.portsIn[index].anim.stayInTimeline;
                        $('#portgraph_in_' + index).toggleClass('timingbutton_active');
                        self.timeLine.setAnim(op.portsIn[index].anim, {
                            name: op.portsIn[index].name,
                            defaultValue: parseFloat($('#portval_' + index).val())
                        });
                    }
                });

                $('#portanim_in_' + index).on('click', function(e) {
                    if ($('#portanim_in_' + index).hasClass('timingbutton_active')) {
                        var val = self.timeLine.removeAnim(op.portsIn[index].anim);
                        op.portsIn[index].setAnimated(false);

                        self.timeLine.setAnim(null);
                        // op.portsIn[index].anim=null;
                        $('#portanim_in_' + index).removeClass('timingbutton_active');
                        $('#portval_' + index).val(val);
                        $('#portval_' + index).trigger('input');
                        $('#portval_' + index).focus();
                        return;
                    }

                    $('#portanim_in_' + index).addClass('timingbutton_active');

                    op.portsIn[index].toggleAnim();
                    self.timeLine.setAnim(op.portsIn[index].anim, {
                        name: op.portsIn[index].name,
                        defaultValue: parseFloat($('#portval_' + index).val())
                    });
                });
            })(ipi);
        }

        for (var ipip in op.portsIn) {
            (function(index) {
                $('#portdelete_in_' + index).on('click', function(e) {
                    op.portsIn[index].removeLinks();
                    self.showOpParams(op);
                });
            })(ipip);
        }

        for (var ipii in op.portsIn) {
            (function(index) {
                checkDefaultValue(op, index);

                $('#portval_' + index).on('input', function(e) {
                    var v = '' + $('#portval_' + index).val();

                    if (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == 'number') {
                        if (isNaN(v) || v === '') {
                            $('#portval_' + index).addClass('invalid');
                            return;
                        } else {
                            $('#portval_' + index).removeClass('invalid');
                            v = parseFloat(v);
                        }
                    }

                    if (op.portsIn[index].uiAttribs.type == 'int') {
                        if (isNaN(v) || v === '') {
                            $('#portval_' + index).addClass('invalid');
                            return;
                        } else {
                            $('#portval_' + index).removeClass('invalid');
                            v = parseInt(v, 10);
                        }
                    }

                    if (op.portsIn[index].uiAttribs.display == 'bool') {
                        if (v != 'true' && v != 'false') {
                            v = false;
                            $('#portval_' + index).val('false');
                        }
                        if (v == 'true') v = true;
                        else v = false;
                    }

                    op.portsIn[index].set(v);
                    gui.patchConnection.send(CABLES.PACO_VALUECHANGE, {
                        "op": op.id,
                        "port": op.portsIn[index].name,
                        "v": v
                    });

                    checkDefaultValue(op, index);

                    if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();
                });
            })(ipii);
        }

        for (var iwap in watchAnimPorts) {
            var thePort = watchAnimPorts[iwap];
            (function(thePort) {
                var id = '.watchPortValue_' + thePort.watchId;

                $(id).on("focusin", function() {
                    if (thePort.isAnimated()) gui.timeLine().setAnim(thePort.anim, {
                        name: thePort.name
                    });
                });

            })(thePort);
        }

        var ignoreColorChanges = true;
        var colors;

        for (var iwcp in watchColorPicker) {
            var thePort2 = watchColorPicker[iwcp];
            (function(thePort) {
                function updateColorPickerButton(id) {
                    var splits = id.split('_');
                    var portNum = parseInt(splits[splits.length - 1]);

                    var c1 = Math.round(255 * $('#portval_' + portNum).val());
                    var c2 = Math.round(255 * $('#portval_' + (portNum + 1)).val());
                    var c3 = Math.round(255 * $('#portval_' + (portNum + 2)).val());

                    $(id).css('background-color', 'rgb(' + c1 + ',' + c2 + ',' + c3 + ')');
                }

                var id = '#watchcolorpick_' + thePort.watchId;
                updateColorPickerButton(id);

                $(id).colorPicker({
                    opacity: true,
                    animationSpeed: 0,
                    margin: '-80px -40px 0',
                    doRender: 'div div',
                    renderCallback: function(res, toggled) {
                        var id = res[0].id;
                        var splits = id.split('_');
                        var portNum = parseInt(splits[splits.length - 1]);

                        if (toggled === false) {
                            ignoreColorChanges = true;
                        }
                        if (toggled === true) {
                            updateColorPickerButton(id);
                            colors = this.color.colors;
                            ignoreColorChanges = false;
                        }

                        if (!ignoreColorChanges) {
                            $('#portval_' + portNum + '').val(colors.rgb.r).trigger('input');
                            $('#portval_' + (portNum + 1) + '').val(colors.rgb.g).trigger('input');
                            $('#portval_' + (portNum + 2) + '').val(colors.rgb.b).trigger('input');
                        } else {
                            updateColorPickerButton(id);
                        }

                        modes = {
                            r: Math.round(colors.rgb.r * 255),
                            g: Math.round(colors.rgb.g * 255),
                            b: Math.round(colors.rgb.b * 255),
                            h: colors.hsv.h,
                            s: colors.hsv.s,
                            v: colors.hsv.v,
                            HEX: this.color.colors.HEX
                        };

                        $('input', '.cp-panel').each(function() {
                            this.value = modes[this.className.substr(3)];
                        });

                    },
                    buildCallback: function($elm) {
                        var colorInstance = this.color,
                            colorPicker = this;

                        $elm.prepend('<div class="cp-panel">' +
                                'R <input type="text" class="cp-r" /><br>' +
                                'G <input type="text" class="cp-g" /><br>' +
                                'B <input type="text" class="cp-b" /><hr>' +
                                'H <input type="text" class="cp-h" /><br>' +
                                'S <input type="text" class="cp-s" /><br>' +
                                'B <input type="text" class="cp-v" /><hr>' +
                                '<input type="text" class="cp-HEX" />' +
                                '</div>')
                            .on('change', 'input',
                                function(e) {
                                    var value = this.value,
                                        className = this.className,
                                        type = className.split('-')[1],
                                        color = {};

                                    color[type] = value;
                                    colorInstance.setColor(type === 'HEX' ? value : color,
                                        type === 'HEX' ? 'HEX' : /(?:r|g|b)/.test(type) ? 'rgb' : 'hsv');
                                    colorPicker.render();
                                    this.blur();
                                });
                    }
                });

            })(thePort2);
        }
    };


    var cycleWatchPort = false;

    function doWatchPorts() {

        cycleWatchPort = !cycleWatchPort;

        for (var i=0;i< watchPorts.length;i++)
        {
            if (watchPorts[i].type != CABLES.OP_PORT_TYPE_VALUE && watchPorts[i].type != CABLES.OP_PORT_TYPE_ARRAY) continue;
            var id = '.watchPortValue_' + watchPorts[i].watchId;

            var el = $(id);

            if (watchPorts[i].isAnimated()) {
                if (el.val() != watchPorts[i].get()) el.val(watchPorts[i].get());
            } else
            if (watchPorts[i].type == CABLES.OP_PORT_TYPE_ARRAY) {
                if (watchPorts[i].get())
                    el.html('length: ' + String(watchPorts[i].get().length));
            } else {
                el.html(String(watchPorts[i].get()));
            }

            CABLES.watchPortVisualize.update(id, watchPorts[i].watchId, watchPorts[i].get());
        }

        if (CABLES.UI.uiConfig.watchValuesInterval > 0)
            setTimeout(doWatchPorts, CABLES.UI.uiConfig.watchValuesInterval);
    }

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
        var title = filename.substr(filename.lastIndexOf('/') + 1);

        if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
            opname = "Ops.Gl.Texture";
            title = "Texture: " + title;
        } else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac")) {
            opname = "Ops.WebAudio.AudioPlayer";
            title = "Audio: " + title;
        } else if (filename.endsWith(".3d.json")) {
            opname = "Ops.Json3d.Json3dMesh";
            title = "Json: " + title;
        } else {
            CABLES.UI.notify("no known operator found");
            return;
        }

        var x = gui.patch().getCanvasCoordsMouse(event).x;
        var y = gui.patch().getCanvasCoordsMouse(event).y;

        var uiAttr = {
            'title': title,
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
                x: viewBox.x + viewBox.w / 2,
                y: viewBox.y + viewBox.h / 2
            }
        };
        gui.scene().addOp(opname, uiAttr, function(op) {
            op.getPort(portname).set('/assets/' + currentProject._id + '/' + filename);
        });
    };

    doWatchPorts();

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
    this.tempUnlinkOp = function() {
        var j = 0;

        var op = null;
        if (selectedOps.length === 0 && lastTempOP) op = lastTempOP;
        else {
            if (selectedOps.length === 0) return;
            op = selectedOps[0];
        }
        lastTempOP = op;

        op.setEnabled(!op.op.enabled);

        if (!op.op.enabled) op.op.unLinkTemporary();
        else op.op.undoUnLinkTemporary();
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

    this.getSubPatches = function() {
        var foundPatchIds = [];
        var subPatches = [];
        var i = 0;

        for (i = 0; i < this.ops.length; i++) {
            if (this.ops[i].op.patchId && this.ops[i].op.patchId.get() !== 0) {
                foundPatchIds.push(this.ops[i].op.patchId.get());
            }
        }

        // find lost ops, which are in subpoatches, but no subpatch op exists for that subpatch..... :(
        for (i = 0; i < this.ops.length; i++) {
            if (this.ops[i].op.uiAttribs && this.ops[i].op.uiAttribs.subPatch)
                if (foundPatchIds.indexOf(this.ops[i].op.uiAttribs.subPatch) == -1)
                    foundPatchIds.push(this.ops[i].op.uiAttribs.subPatch);
        }

        foundPatchIds = CABLES.uniqueArray(foundPatchIds);

        for (i = 0; i < foundPatchIds.length; i++) {
            var found = false;
            for (var j = 0; j < this.ops.length; j++) {
                if (this.ops[j].op.patchId!=0 && this.ops[j].op.patchId && this.ops[j].op.patchId.get() == foundPatchIds[i]) {
                    subPatches.push({
                        "name": this.ops[j].op.name,
                        "id": foundPatchIds[i]
                    });
                    found = true;
                }
            }

            if (!found) {
                subPatches.push({
                    "name": "lost patch " + foundPatchIds[i],
                    "id": foundPatchIds[i]
                });
            }
        }

        return subPatches;
    };

    this.linkTwoOps = function(op1, op2) {
        this.removeQuickLinkLine();

        var suggestions = [];
        if (!op1 || !op2) return;

        console.log('op1', op1.op.name);
        console.log('op2', op2.op.name);

        for (var j = 0; j < op1.portsOut.length; j++) {
            var p = op1.portsOut[j].thePort;

            if (op2.op.countFittingPorts(p) > 0) {
                suggestions.push({
                    p: p,
                    name: p.name + '<span class="icon icon-arrow-right"></span>',
                    classname: "port_text_color_" + p.getTypeString()
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
            clientX: lastMouseMoveEvent.clientX,
            clientY: lastMouseMoveEvent.clientY
        };

        new CABLES.UI.SuggestionDialog(suggestions, op1, fakeMouseEvent, null,
            function(id) {
                var p = suggestions[id].p;
                var sugIn = [];

                for (var i = 0; i < op2.portsIn.length; i++) {
                    if (CABLES.Link.canLink(op2.portsIn[i].thePort, p)) {
                        sugIn.push({
                            p: op2.portsIn[i].thePort,
                            name: '<span class="icon icon-arrow-right"></span>' + op2.portsIn[i].thePort.name,
                            classname: "port_text_color_" + op2.portsIn[i].thePort.getTypeString()
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
            }, false);
    };

    this.opContextMenu=function(ele)
    {
        var items=[];

        var opname=selectedOps[0].op.objName;
        var opid=selectedOps[0].op.id;

        items.push(
            {
                title:'set title',
                func:CABLES.CMD.PATCH.setOpTitle
            });

        items.push(
            {
                title:'set default values',
                func:function()
                {
                    gui.patch().resetOpValues(opid);
                }
            });

        items.push(
            {
                title:'bookmark',
                func:function(){ gui.bookmarks.add(); }
            });

        items.push(
            {
                title:'clone op code',
                "func":function(){ gui.serverOps.cloneDialog(opname); }
            });

        items.push(
            {
                title:'view op code',
                "func":function(){ gui.serverOps.edit(opname); }
            });

        if(gui.user.isAdmin)
        {
            items.push(
                {
                    "title":'edit op ',
                    "iconClass":'fa fa-lock',
                    "func":function(){ gui.serverOps.edit(opname); }
                });

            items.push(
                {
                    "title":'rename op ',
                    "iconClass":'fa fa-lock',
                    "func":function(){ CABLES.UI.MetaCode.rename(opname); }
                });
        }
        CABLES.contextMenu.show({"items":items},ele);
    };
};