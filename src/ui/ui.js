CABLES.UI = CABLES.UI || {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI = function() {
    var self = this;
    var userOpsLoaded = false;
    var showTiming = false;
    var showingEditor = false;
    var showMiniMap = false;
    var _scene = CABLES.patch=new CABLES.Patch();
    _scene.gui = true;
    var _patch = null;
    var _editor = new CABLES.Editor();
    var _projectSettings = null;
    var _userOpManager = null;
    var _jobs = new CABLES.UI.Jobs();
    var _find = new CABLES.UI.Find();
    this.cmdPallet = new CABLES.UI.CommandPallet();
    var _opselect = new CABLES.UI.OpSelect();
    var _introduction = new CABLES.UI.Introduction();
    this._gizmo=new CABLES.Gizmo();

    this.variables = new CABLES.UI.Variables();
    this.patchConnection = new CABLES.PatchConnectionSender();
    this.opDocs = new CABLES.UI.OpDocs();
    // var _socket=null;
    // var _connection = null;
    var savedState = true;
    var metaCode = new CABLES.UI.MetaCode();
    this.metaPaco = new CABLES.UI.Paco();
    this.metaKeyframes = new CABLES.UI.MetaKeyframes();
    this.bookmarks = new CABLES.UI.Bookmarks();
    this.preview = new CABLES.UI.Preview();
    this.hoverPreview = new CABLES.UI.Preview();

    var favIconLink = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(favIconLink);
    favIconLink.type = 'image/x-icon';
    favIconLink.rel = 'shortcut icon';

    this.profiler = null;
    this.user = null;
    this.onSaveProject = null;
    this.lastNotIdle=CABLES.now();


    this.project = function() {
        return self.patch().getCurrentProject();
    };

    this.opSelect = function() {
        return _opselect;
    };

    this.timeLine = function() {
        return _patch.timeLine;
    };

    this.scene = function() {
        return _scene;
    };

    this.patch = function() {
        return _patch;
    };

    this.editor = function() {
        return _editor;
    };

    this.jobs = function() {
        return _jobs;
    };

    this.find = function() {
        return _find;
    };

    this.introduction = function() {
        return _introduction;
    };

    this.projectSettings = function() {
        return _projectSettings;
    };

    this.infoHeight = 200;
    this.timingHeight = 250;
    this.rendererWidth = 640;
    this.rendererHeight = 360;
    this.editorWidth = CABLES.UI.userSettings.get("editorWidth") || 400;

    this.toggleEditor = function() {
        if (showingEditor) self.closeEditor();
        else self.showEditor();
        self.setLayout();
    };

    this.showEditor = function() {
        if (!showingEditor) {
            showingEditor = true;
            _editor.focus();
            this.setLayout();
        }
    };

    this.closeEditor = function() {
        if (showingEditor) {
            showingEditor = false;
            this.setLayout();
        }
    };



    this.setLayout = function() {
        var startTime = performance.now();


        this._elAceEditor = this._elAceEditor || $('#ace_editor');
        this._elSplitterPatch = this._elSplitterPatch || $('#splitterPatch');
        this._elSplitterRenderer = this._elSplitterRenderer || $('#splitterRenderer');
        // this._elSplitterRendererWH = this._elSplitterRendererWH || $('#splitterRendererWH');
        this._elPatch = this._elPatch || $('#patch');
        this._elOptions = this._elOptions || $('#options');
        this._elMeta = this._elMeta || $('#meta');
        this._elMenubar = this._elMenubar || $('#menubar');
        this._elSplitterMeta = this._elSplitterMeta || $('#splitterMeta');
        this._elInforArea = this._elInforArea || $('#infoArea');
        this._elGlCanvas = this._elGlCanvas || $('#glcanvas');
        this._elCablesCanvas = this._elCablesCanvas || $('#cablescanvas');
        this._elEditorBar = this._elEditorBar || $('#editorbar');
        this._elSplitterEditor = this._elSplitterEditor || $('#splitterEditor');
        this._elIconBar = this._elIconBar || $('#icon-bar');

        var iconBarnav_patch_saveasWidth = this._elIconBar.outerWidth();


        this._elMenubar.show();
        // $('#timelineui').show();

        //|| self.rendererWidth > window.innerWidth * 0.99 || self.rendererHeight > window.innerHeight * 0.99
        if (self.rendererWidth === undefined || self.rendererHeight === undefined ) {
            self.rendererWidth = window.innerWidth * 0.4;
            self.rendererHeight = window.innerHeight * 0.25;
        }
        if (self.rendererWidth === 0) {
            self.rendererWidth = window.innerWidth;
            self.rendererHeight = window.innerHeight;
        }

        self.rendererWidth=Math.floor(self.rendererWidth);
        self.rendererHeight=Math.floor(self.rendererHeight);

        if(gui.patch().scene.cgl.canvasWidth)
        $('#canvasInfoSize').html('size: '+gui.patch().scene.cgl.canvasWidth+' x '+gui.patch().scene.cgl.canvasHeight);

        var iconBarWidth=iconBarWidth||80;


        // self.showCanvasModal(false);

        // var statusBarHeight=26;
        var menubarHeight = 30;
        var optionsWidth = 400;

        var timelineUiHeight = 40;
        if (self.timeLine().hidden) timelineUiHeight = 0;

        var filesHeight = 0;
        if (CABLES.UI.fileSelect.visible) filesHeight = $('#library').height();

        var timedisplayheight = 25;

        var patchHeight = window.innerHeight - menubarHeight - 2;
        var patchWidth = window.innerWidth - self.rendererWidth - 6 - iconBarWidth;

        if (showTiming) {
            patchHeight = patchHeight - this.timingHeight - 2;

            $('.easingselect').css('bottom', 0);
            $('.easingselect').css('left', patchWidth + iconBarWidth);
        } else {
            patchHeight -= timelineUiHeight;
        }

        if (patchWidth < 600) {
            $('#username').hide();
            $('.projectname').hide();
            $('.naventry').hide();
        } else {
            $('#username').show();
            $('.projectname').show();
            $('.naventry').show();
        }

        $('#subpatch_nav').css(
            {
                width:patchWidth+'px',
                left:iconBarWidth+'px',
                top:menubarHeight + 1
            });
        

        var editorWidth = self.editorWidth;
        var patchLeft = iconBarWidth;

        if (showingEditor) {
            if (self.editorWidth > window.innerWidth - self.rendererWidth) self.rendererWidth = window.innerWidth - self.editorWidth - iconBarWidth -40;

            var editorbarHeight = 76;
            $('#editor').show();
            $('#editor').css('left', iconBarWidth);

            this._elEditorBar.css('height', editorbarHeight);
            this._elEditorBar.css('top', menubarHeight + 1);

            var editorHeight = patchHeight - 2 - editorbarHeight;

            $('#ace_editor').css('height', editorHeight);

            this._elAceEditor.css('width', self.editorWidth);
            this._elAceEditor.css('top', menubarHeight + 1 + editorbarHeight);
            this._elAceEditor.css('left', 0);

            this._elEditorBar.css('width', self.editorWidth);
            this._elSplitterEditor.show();
            this._elSplitterEditor.css('left', self.editorWidth + iconBarWidth);
            this._elSplitterEditor.css('height', patchHeight - 2);
            this._elSplitterEditor.css('width', 5);
            this._elSplitterEditor.css('top', menubarHeight);

            _editor.resize();
        } else {
            $('#splitterEditor').hide();
            $('#editor').hide();
            editorWidth = 0;
        }


        this._elIconBar.css('height', window.innerHeight - 60);
        this._elIconBar.css('top', 60);

        $('#jobs').css('left', iconBarWidth);


        if (self.rendererWidth < 100) self.rendererWidth = 100;

        $('#patch svg').css('height', patchHeight);
        $('#patch svg').css('width', patchWidth);

        this._elSplitterPatch.css('left', window.innerWidth - self.rendererWidth - 4);
        this._elSplitterPatch.css('height', patchHeight + timelineUiHeight + 2);
        this._elSplitterPatch.css('top', menubarHeight);
        this._elSplitterRenderer.css('top', self.rendererHeight);
        this._elSplitterRenderer.css('width', self.rendererWidth);
        // this._elSplitterRendererWH.css('right', self.rendererWidth - 35);
        // this._elSplitterRendererWH.css('top', self.rendererHeight - 30);

        $('#subpatch_nav').css('left', editorWidth + iconBarWidth + 15);

        this._elPatch.css('height', patchHeight);
        this._elPatch.css('width', patchWidth);
        this._elPatch.css('top', menubarHeight);
        this._elPatch.css('left', patchLeft);

        $('#searchbox').css('left', patchLeft + patchWidth - CABLES.UI.uiConfig.miniMapWidth + 1);
        $('#searchbox').css('width', CABLES.UI.uiConfig.miniMapWidth);

        $('#minimapContainer').show();
        $('#minimapContainer').css('left', patchLeft + patchWidth - CABLES.UI.uiConfig.miniMapWidth - 4);
        if (showMiniMap) {
            $('#minimapContainer').css('top', menubarHeight + patchHeight - CABLES.UI.uiConfig.miniMapHeight - 24);
            $('#minimap').show();
            $('#minimapContainer .title_closed').hide();
            $('#minimapContainer .title_opened').show();
        } else {
            $('#minimapContainer').hide();
            // $('#minimapContainer .title_opened').hide();
            // $('#minimapContainer').css('top',menubarHeight+patchHeight-24);
            // $('#minimapContainer').css('width',CABLES.UI.uiConfig.miniMapWidth);
            $('#minimap').hide();
        }


        $('#library').css('left', iconBarWidth);
        $('#library').css('width', window.innerWidth - self.rendererWidth - iconBarWidth);
        $('#library').css('bottom', 0);

        var timelineWidth= window.innerWidth - self.rendererWidth - 2 - iconBarWidth;
        
        $('#timelineui').css('width', timelineWidth);
        $('#timing').css('width', timelineWidth);
        $('#timing').css('bottom', filesHeight);

        if (showTiming)
        {
            $('#timelineui').show();
            $('#timing').css('height', this.timingHeight);
            $('#timing').css('left', iconBarWidth);

            $('#overviewtimeline').css('margin-top', timelineUiHeight);
            $('#overviewtimeline svg').css('width', timelineWidth);
            $('#overviewtimeline svg').css('height', 25);

            $('#timetimeline').css('margin-top', timelineUiHeight + timedisplayheight);
            $('#timetimeline svg').css('width', timelineWidth);
            $('#timetimeline svg').css('height', 25);

            $('#timeline svg').css('width', timelineWidth);
            $('#timeline svg').css('height', this.timingHeight - timedisplayheight);
            $('#timeline svg').css('margin-top', timelineUiHeight + timedisplayheight + timedisplayheight);

            $('#timeline svg').show();
            $('#timetimeline').show();
            $('#overviewtimeline').show();
            $('#keycontrols').show();

            $('#splitterTimeline').show();
            $('#splitterTimeline').css('bottom', this.timingHeight - 4);
            $('#timelineTitle').show();
        } else {
            $('#overviewtimeline').hide();
            $('#timelineTitle').hide();
            $('#keycontrols').hide();
            $('#timetimeline').hide();
            $('#timeline svg').hide();
            $('#timing').css('height', timelineUiHeight);

            $('#splitterTimeline').hide();
        }

        if (self.timeLine()) self.timeLine().updateViewBox();

        $('#splitterTimeline').css('width', timelineWidth);


        $('#delayed').css('left', window.innerWidth - self.rendererWidth + 10);

        this._elOptions.css('left', window.innerWidth - self.rendererWidth - 1);
        this._elOptions.css('top', self.rendererHeight);
        this._elOptions.css('width', optionsWidth);
        this._elOptions.css('height', window.innerHeight - self.rendererHeight);

        var metaWidth = self.rendererWidth - optionsWidth + 1;
        this._elMeta.css('right', 0);
        this._elMeta.css('top', self.rendererHeight);
        this._elMeta.css('width', metaWidth);
        this._elMeta.css('height', window.innerHeight - self.rendererHeight);

        $('#performance_glcanvas').css('bottom', 0);
        // $('#performance_glcanvas').css('right',($('#performance_glcanvas').width()-(self.rendererWidth+optionsWidth))) ;
        $('#performance_glcanvas').css('right', self.rendererWidth - optionsWidth - $('#performance_glcanvas').width() + 1);
        // $('#performance_glcanvas').css('max-width',self.rendererWidth-optionsWidth);

        this._elMenubar.css('top', 0);
        this._elMenubar.css('width', window.innerWidth - self.rendererWidth - 10);
        this._elMenubar.css('height', menubarHeight);

        this._elSplitterMeta.css('bottom', self.infoHeight + 30 + 'px');
        this._elSplitterMeta.css('width', metaWidth - 22 + 'px');

        if (self.infoHeight === 0) {
            this._elInforArea.hide();
            $('#splitterMeta').hide();
        } else {
            this._elInforArea.css('width', (metaWidth - 20) + 'px');
            this._elInforArea.css('height', (self.infoHeight) + 'px');
            this._elInforArea.css('bottom', '0px');
        }

        $('#meta_content').css('height', window.innerHeight - self.rendererHeight - self.infoHeight - 50);

        if (self.rendererWidth === 0) {
            this._elGlCanvas.attr('width', window.innerWidth);
            this._elGlCanvas.attr('height', window.innerHeight);
            this._elGlCanvas.css('z-index', 9999);

        } else {

            var density=gui.patch().scene.cgl.pixelDensity;
            
            // this._elGlCanvas.css('transform',"scale("+(1/density)+")");
            // this._elCablesCanvas.css('transform-origin',"top right");

            this._elGlCanvas.attr('width', self.rendererWidth*density);
            this._elGlCanvas.attr('height', self.rendererHeight*density);
            this._elGlCanvas.css('width', self.rendererWidth);
            this._elGlCanvas.css('height', self.rendererHeight);
            // this._elCablesCanvas.attr('width', self.rendererWidth);
            // this._elCablesCanvas.attr('height', self.rendererHeight);
            this._elCablesCanvas.css('width', self.rendererWidth + 'px');
            this._elCablesCanvas.css('height', self.rendererHeight + 'px');

            gui.patch().scene.cgl.updateSize();
        }
        // CABLES.UI.setStatusText('webgl renderer set to size: '+self.rendererWidth+' x '+self.rendererHeight+' ESC to exit fullscreen');
        this._elGlCanvas.hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.canvas);
        }, function() {
            CABLES.UI.hideInfo();
        });

        window.avg = window.avg || (performance.now() - startTime);
        window.avg += (performance.now() - startTime);
        window.avg /= 2;
        // console.log('layout ',window.avg);
    };

    this.importDialog = function() {
        var html = '';
        html += 'import:<br/><br/>';
        html += '<textarea id="serialized"></textarea>';
        html += '<br/>';
        html += '<br/>';
        html += '<a class="button" onclick="gui.patch().scene.clear();gui.patch().scene.deSerialize($(\'#serialized\').val());CABLES.UI.MODAL.hide();">import</a>';
        CABLES.UI.MODAL.show(html);
    };

    this.exportDialog = function() {
        var html = '';
        html += 'export:<br/><br/>';
        html += '<textarea id="serialized"></textarea>';
        CABLES.UI.MODAL.show(html);
        $('#serialized').val(self.patch().scene.serialize());
    };

    this.userOpManager = function() {
        _userOpManager = _userOpManager || new CABLES.UI.UserOpManager(self.project()._id);
        return _userOpManager;
    };

    var oldRendwerWidth, oldRendwerHeight, oldShowingEditor;
    this.cycleRendererSize = function() {
        this.showCanvasModal(false);
        if (self.rendererWidth !== 0) {
            this._elGlCanvas.addClass('maximized');

            oldRendwerWidth = self.rendererWidth;
            oldRendwerHeight = self.rendererHeight;
            oldShowingEditor = showingEditor;

            self.rendererWidth = 0;
            // $('#glcanvas').addClass('maximized');

            showingEditor = false;
        } else {
            this._elGlCanvas.removeClass('maximized');
            self.rendererWidth = oldRendwerWidth;
            self.rendererHeight = oldRendwerHeight;
            showingEditor = oldShowingEditor;
            // $('#glcanvas').removeClass('maximized');
        }

        self.setLayout();
    };


    function updateTimingIcon() {
        if (showTiming) {
            $('#button_toggleTiming i').removeClass('fa-caret-up');
            $('#button_toggleTiming i').addClass('fa-caret-down');
        } else {
            $('#button_toggleTiming i').removeClass('fa-caret-down');
            $('#button_toggleTiming i').addClass('fa-caret-up');
        }
    }

    this.showMiniMap = function() {
        showMiniMap = true;
        self.setLayout();
    };

    this.hideMiniMap = function() {
        showMiniMap = false;
        self.setLayout();
    };

    // this.toggleMiniMap=function()
    // {
    //     showMiniMap=!showMiniMap;
    //     self.setLayout();
    // };
    this.isShowingTiming = function() {
        return showTiming;
    };

    this.showTiming = function() {
        self.timeLine().hidden = false;
        showTiming = true;
        $('#timing').show();
        gui.setLayout();
    };

    this.hideTiming = function() {
        self.timeLine().hidden = true;
        showTiming = false;
        $('#timing').hide();
        gui.setLayout();
    };

    this.toggleTiming = function() {
        self.timeLine().hidden = false;
        $('#timing').show();

        showTiming = !showTiming;
        updateTimingIcon();
        self.setLayout();
        self.timeLine().redraw();

    };

    this.showUiDebug = function() {
        var numVisibleOps = 0;
        for (var i in self.ops) {
            if (!self.ops[i].isHidden()) numVisibleOps++;
        }

        var canvass = [];
        var canvs = $('canvas');

        for (i = 0; i < canvs.length; i++) {
            canvass.push({
                "name": canvs[i].id,
                "width": canvs[i].width,
                "height": canvs[i].height
            });
        }

        var gl = gui.patch().scene.cgl.gl;
        var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
        var gl_renderer = "unknown";
        if (dbgRenderInfo) gl_renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);

        var html = CABLES.UI.getHandleBarHtml(
            'uiDebug', {

                "gl_ver": gl.getParameter(gl.VERSION),
                "gl_renderer": gl_renderer,
                "numOps": gui.scene().ops.length,
                "numVisibleOps": numVisibleOps,
                "canvass": canvass,
                "numSvgElements": $('#patch svg *').length,
                "startup": CABLES.startup.log
            });

        // $('#meta_content_debug').html(html);
        CABLES.UI.MODAL.show(html);
    };

    this.showLibrary = function(inputId, filterType, opid) {
        CABLES.UI.fileSelect.show(inputId, filterType, opid);
    };

    this.setProjectName = function(name) {
        $('.projectname').html('&nbsp;&nbsp;' + name);
    };

    this.createProject = function() {
        CABLES.UI.MODAL.prompt(
            "New Project",
            "Enter a name for your new Project",
            "My new Project",
            function(name) {
                // var name=prompt('projectname','');
                if (name) {
                    CABLES.api.post('project', {
                        "name": name
                    }, function(d) {
                        CABLES.UI.SELECTPROJECT.doReload = true;
                        document.location.href = '#/project/' + d._id;
                    });

                }
            });
    };

    this.deleteCurrentProject = function()
    {
        if(confirm('delete ?')) CABLES.sandbox.deleteProject(self.patch().getCurrentProject()._id);
    };

    this.getUserOs = function() {
        var OSName = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
        if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
        if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";

        return OSName;
    };

    /* Returns the default mod key for a OS */
    this.getModKeyForOs = function(os) {
        switch (os) {
            case 'Windows':
                return 'ctrl';
            case 'MacOS':
                return 'cmd';
            case 'UNIX':
                return 'cmd';
            default:
                return 'mod';
        }
    };

    /* Goes through all nav items and replaces "mod" with the OS-dependent modifier key */
    this.replaceNavShortcuts = function() {
        var osMod = gui.getModKeyForOs(gui.getUserOs());
        $("nav ul li .shortcut").each(function() {
            var newShortcut = $(this).text().replace("mod", osMod);
            $(this).text(newShortcut);
        });
    };

    this.showFile = function(fileId, file) {
        console.log(file);
        var html = CABLES.UI.getHandleBarHtml(
            'params_file', {
                file: file,
                fileId: fileId,
                projectId: self.patch().getCurrentProject()._id
            });

        $('#options').html(html);
    };

    this.converterStart=function(projectId,fileId,converterId)
    {
        $('#converterprogress').show();
        $('#converterform').hide();
        
        CABLES.api.post(
            'project/'+projectId+'/file/convert/'+fileId+'/'+converterId,
            {
                options:CABLES.serializeForm('#converterform')
            },
            function(res)
            {
                $('#converteroutput').show();
                console.log(res);
                $('#converterprogress').hide();
                if(res.info) $('#converteroutput').html(res.info);
                    else $('#converteroutput').html('finished!');

                CABLES.UI.fileSelect.refresh();
            });
    };

    this.showConverter = function(converterId, projectId, fileId, converterName)
        {
            var html = CABLES.UI.getHandleBarHtml(
                'params_convert', {
                    "converterId": converterId,
                    "converterName": converterName,
                    "projectId": projectId,
                    "fileId": fileId
                });

            CABLES.UI.MODAL.show(html);
        };

    this.bind = function(cb) {
        $('#glcanvas').attr('tabindex', '3');


        $('.nav_cables').bind("click", function(event) {
            var win = window.open('/');
            win.focus();
        });

        $('#button_toggleTiming').bind("click", function(event) {
            self.toggleTiming();
        });
        $('#button_cycleRenderSize').bind("click", function(event) {
            self.cycleRendererSize();
        });

        // $('.button_saveCurrentProject').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.nav_patch_save').bind("click", function(event) {
            CABLES.CMD.PATCH.save();
        });
        $('.nav_patch_saveas').bind("click", function(event) {
            CABLES.CMD.PATCH.saveAs();
        });
        $('.nav_patch_new').bind("click", function(event) {
            CABLES.CMD.PATCH.newPatch();
        });
        $('.nav_patch_clear').bind("click", function(event) {
            if (confirm('really?')) CABLES.CMD.PATCH.clear();
        });
        $('.nav_patch_export').bind("click", function(event) {
            CABLES.CMD.PATCH.export();
        });
        $('.nav_patch_export_ignoreAssets').bind("click", function(event) {
            gui.patch().exportStatic(true);
        });

        $('.nav_patch_settings').bind("click", function(event) {
            CABLES.CMD.UI.settings();
        });
        $('.nav_patch_browse_examples').bind("click", function(event) {
            var win = window.open('https://cables.gl/examples', '_blank');
            win.focus();
        });
        $('.nav_patch_browse_favourites').bind("click", function(event) {
            var win = window.open('https://cables.gl/myfavs', '_blank');
            win.focus();
        });
        $('.nav_patch_browse_public').bind("click", function(event) {
            var win = window.open('https://cables.gl/projects', '_blank');
            win.focus();
        });
        $('.nav_patch_resolve_subpatch').bind("click", function(event) {
            self.patch().resolveSubpatch();
        });

        $('.nav_patch_contributors').bind("click", CABLES.CMD.UI.settingsContributors);
        $('.nav_changelog').bind("click", CABLES.CMD.UI.showChangelog);


        $('#username').bind("click", CABLES.CMD.UI.userSettings);




        $('.cables-logo').hover(function(e) {
            $('#jobs').show();
        }, function() {
            $('#jobs').hide();
        });




        // --- Help menu
        // Documentation
        $('.nav_help_about').bind("click", function(event) {
            // TODO: Show popup which explains what cables is and who develops it
        });
        $('.nav_help_documentation').bind("click", function(event) {
            var win = window.open('https://docs.cables.gl', '_blank');
            if (win) {
                //Browser has allowed it to be opened
                win.focus();
            } else {
                //Broswer has blocked it
                alert('Please allow popups for this site');
            }
        });

        // Introduction
        $('.nav_help_introduction').bind("click", function(event) {
            self.introduction().showIntroduction();
        });
        $('.nav_help_video').bind("click", function(event) {
            var html = '<iframe width="800" height="640" src="https://www.youtube.com/embed/videoseries?list=PLYimpE2xWgBveaPOiV_2_42kZEl_1ExB0&showinfo=1" frameborder="0" allowfullscreen></iframe>';
            CABLES.UI.MODAL.show(html);
        });


        $('.nav_op_addOp').bind("click", function(event) {
            CABLES.CMD.PATCH.addOp();
        });
        $('.nav_op_createOp').bind("click", function(event) {
            self.serverOps.createDialog();
        });

        $('.nav_files').bind("click", function(event) {
            CABLES.CMD.UI.toggleFiles();
        });
        $('.nav_timeline').bind("click", function(event) {
            CABLES.CMD.UI.toggleTimeline();
        });
        $('.nav_editor').bind("click", function(event) {
            CABLES.CMD.UI.toggleEditor();
        });


        $('#button_subPatchBack').bind("click", function(event) {
            self.patch().setCurrentSubPatch(0);
        });
        // $('#button_editor').bind("click", function (event) { showingEditor=!showingEditor;self.setLayout(); });

        window.addEventListener('resize', function()
        {
            self.showCanvasModal(false);
            $('#glcanvas').blur();
            self.setLayout();
        }, false);

        document.addEventListener('copy', function(e) {
            if ($('#patch').is(":focus")) self.patch().copy(e);
            if ($('#timeline').is(":focus")) self.patch().timeLine.copy(e);
        });

        document.addEventListener('paste', function(e) {
            if ($('#patch').is(":focus")) self.patch().paste(e);
            if ($('#timeline').is(":focus")) self.patch().timeLine.paste(e);
        });

        document.addEventListener('cut', function(e) {
            if ($('#patch').is(":focus")) self.patch().cut(e);
            if ($('#timeline').is(":focus")) self.patch().timeLine.cut(e);
        });

        var spaceBarStart = 0;
        var spacebarPlayDelay = 150;

        $('#timeline, #patch').keyup(function(e) {
            switch (e.which) {
                case 32: // space play
                    var timeused = Date.now() - spaceBarStart;
                    if (timeused < spacebarPlayDelay) self.timeLine().togglePlay();
                    spaceBarStart = 0;
                    break;
            }
        });

        $(document).keydown(function(e)
        {
            if (CABLES.UI.suggestions && (e.keyCode > 64 && e.keyCode < 91)) {
                if (CABLES.UI.suggestions) {
                    var suggs = CABLES.UI.suggestions;
                    CABLES.UI.suggestions.close();
                    suggs.showSelect();
                }
                return;
            }

            switch (e.which) {
                default:
                    break;

                case 32:
                    if(gui.scene().timer.isPlaying())
                    {
                        self.timeLine().togglePlay();
                        spaceBarStart=0;
                    }
                break;
                case 13:
                        if (e.ctrlKey || e.metaKey) self.cycleRendererSize();
                    break;
                case 112: // f1
                        self.toggleEditor();
                    break;

                case 88: //x unlink
                        if ($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey) {
                            self.patch().unlinkSelectedOps();
                        }
                    break;


                case 67: //c center
                        if ($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey) {
                            
                            if(self.patch().getSelectedOps().length>0) self.patch().centerViewBoxOps();
                            else self.patch().toggleCenterZoom();
                        }
                    break;

                case 80:
                        if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        self.cmdPallet.show();
                    }
                    break;

                case 70:
                        if (e.metaKey || e.ctrlKey) {
                        if (!$('#ace_editor textarea').is(":focus")) {
                            CABLES.CMD.UI.showSearch();

                            e.preventDefault();
                        }
                    }
                    break;
                case 79: // o - open
                        if (e.metaKey || e.ctrlKey) {
                            CABLES.UI.SELECTPROJECT.show();
                            e.preventDefault();
                        }
                    break;
                case 69: // e - editor save/execute/build
                        if (e.metaKey || e.ctrlKey) {
                            if (showingEditor) {
                                self.editor().save();
                            }
                        }
                    break;
                case 83: // s - save
                        if (e.metaKey || e.ctrlKey) {
                            e.preventDefault();
                            if (!e.shiftKey) {
                                if ($('#patch').is(":focus")) {
                                    // self.patch().saveCurrentProject();
                                    CABLES.CMD.PATCH.save();
                                    CABLES.UI.SELECTPROJECT.doReload = true;
                                } else
                                if (showingEditor) {
                                    self.editor().save();
                                } else {
                                    CABLES.CMD.PATCH.save();
                                    // self.patch().saveCurrentProject();
                                }

                            } else {
                                self.patch().saveCurrentProjectAs();
                            }
                        }
                    break;
                case 78: // n - new project
                        if (e.metaKey || e.ctrlKey) {
                            self.createProject();
                        }
                    break;

                case 9:
                        if ($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey) {
                        gui.opSelect().showOpSelect({
                            x: 0,
                            y: 0
                        });
                        e.preventDefault();
                    }

                    break;
                case 27:
                        gui.pressedEscape(e);
                    break;
            }
        });

        $('#timeline, #patch').keydown(function(e) {
            switch (e.which) {
                case 32: // space play
                    if (spaceBarStart === 0) spaceBarStart = Date.now();
                    break;

                case 74: // j
                    self.timeLine().jumpKey(-1);
                    break;
                case 75: // k
                    self.timeLine().jumpKey(1);
                    break;
            }
        });

        if(CABLES.sandbox.initRouting)
        {
            CABLES.sandbox.initRouting(cb);
        }
        else
        {
            userOpsLoaded=true;
            cb();
        }

    };

    this.pressedEscape = function(e) {

        this.showCanvasModal(false);

        if (e && (e.metaKey || e.ctrlKey)) {
            CABLES.UI.SELECTPROJECT.show();
            return;
        }

        $('.tooltip').hide();

        if (self.rendererWidth > window.innerWidth * 0.9)
        {
            self.rendererWidth = window.innerWidth * 0.4;
            self.rendererHeight = window.innerHeight * 0.25;
            showingEditor = oldShowingEditor;
            this._elGlCanvas.removeClass('maximized');
            self.setLayout();
        } else
        if (CABLES.UI.suggestions) {
            console.log(CABLES.UI.suggestions);
            CABLES.UI.suggestions.close();
            CABLES.UI.suggestions = null;
        } else if ($('#cmdpalette').is(':visible')) gui.cmdPallet.close();
        else if ($('#searchbox').is(':visible')) $('#searchbox').hide();
        else if ($('#library').is(':visible')) $('#library').hide();
        else if ($('#sidebar').is(':visible')) $('#sidebar').animate({
            width: 'toggle'
        }, 200);
        else if ($('.easingselect').is(':visible')) $('.easingselect').hide();
        else if (vueStore.getters['sidebar/sidebarCustomizerVisible']) vueStore.commit('sidebar/setCustomizerVisible', false);
        else
        if (CABLES.UI.MODAL._visible) {
            CABLES.UI.MODAL.hide();
            if (showingEditor) self.editor().focus();
        } else {
            if (e) gui.opSelect().showOpSelect({
                x: 0,
                y: 0
            });
        }
    };

    this.waitToShowUI = function() {
        
        $('#cablescanvas').show();

        $('#loadingstatus').hide();
        $('#mainContainer').show();

        self.setMetaTab(CABLES.UI.userSettings.get("metatab") || 'doc');

        CABLES.showPacoRenderer();

        if (CABLES.UI.userSettings.get('presentationmode')) CABLES.CMD.UI.startPresentationMode();

        if (_scene.cgl.aborted) {
            console.log('errror...');
            CABLES.UI.MODAL.showError('no webgl', 'your browser does not support webgl');
            // _scene.pause();
            return;
        }


        // // load vue...
        // var script = document.createElement( 'script' );
        // script.type = 'text/javascript';
        // script.src = 'js/bundle.js';
        // $("body").append( script );

        logStartup('finished loading cables');
        CABLES.UI.loaded=true;

        console.groupCollapsed('welcome to cables!');
        console.log("start up times:");
        console.table(CABLES.startup.log);
        console.groupEnd();


    };

    this.showWelcomeNotifications = function() {
        function show(html) {
            if (html && html.length > 0) CABLES.UI.MODAL.show(
                '<div style="min-height:30px;max-height:500px;overflow-y:scroll;">' + html + '</div>' +
                '<center><a class="bluebutton" onclick="CABLES.UI.MODAL.hide()">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a></center>'
            );
        }

        var html = '';
        if (this.project().users.indexOf(this.user.id) == -1 &&
            this.project().userId+''!=''+this.user.id ){
            iziToast.show({
                position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
                theme: 'dark',
                title: 'not your patch',
                message: 'you can play around in this patch but not overwrite it. <br/> to save use menubar "save as..." ',
                progressBar: false,
                animateInside: false,
                close: true,
                timeout: false
            });
        }

        if(CABLES.sandbox.showBrowserWarning) CABLES.sandbox.showBrowserWarning();
        if(CABLES.sandbox.showStartupChangelog) CABLES.sandbox.showStartupChangelog();
    };


    this.importJson3D = function(id) {
        CABLES.api.get('json3dimport/' + id,
            function(data) {
                console.log('data', data);
            }
        );
    };

    var infoTimeout = -1;

    // this.editOpDoc = function(objName) {
    //     CABLES.api.clearCache();

    //     this.showEditor();

    //     CABLES.api.get(
    //         'doc/ops/md/' + objName,
    //         function(res) {
    //             var content = res.content || '';

    //             self.editor().addTab({
    //                 content: content,
    //                 title: objName,
    //                 syntax: 'Markdown',
    //                 onSave: function(setStatus, content) {
    //                     CABLES.api.post(
    //                         'doc/ops/edit/' + objName, {
    //                             content: content
    //                         },
    //                         function(res) {
    //                             setStatus('saved');
    //                             // console.log('res',res);
    //                         },
    //                         function(res) {
    //                             setStatus('error: not saved');
    //                             console.log('err res', res);
    //                         }
    //                     );
    //                 }
    //             });
    //         });
    // };

    this.getOpDoc = function(opname, html, cb) {
        cb(this.opDocs.get(opname));
    };



    this.liveRecord = function() {
        $('#glcanvas').attr('width', parseFloat($('#render_width').val()));
        $('#glcanvas').attr('height', parseFloat($('#render_height').val()));

        if (!CABLES.UI.capturer) {
            $('#liveRecordButton').html("Stop Live Recording");
            CABLES.UI.capturer = new CCapture({
                format: 'gif',
                // format: 'webm',
                // quality:77,
                workersPath: '/ui/js/gifjs/',
                framerate: parseFloat($('#render_fps').val()),
                display: true,
                verbose: true
            });

            CABLES.UI.capturer.start(gui.patch().scene.cgl.canvas);
        } else {
            $('#liveRecordButton').html("Start Live Recording");
            CABLES.UI.capturer.stop();
            CABLES.UI.capturer.save();
            var oldCap = CABLES.UI.capturer;
            CABLES.UI.capturer = null;
        }

    };


    this.showProfiler = function() {
        if (!self.profiler) self.profiler = new CABLES.UI.Profiler();
        self.profiler.show();
    };

    this.showMetaPaco = function() {
        this.metaPaco.show();
    };

    this.metaCode = function() {
        return metaCode;
    };


    this.showMetaCode = function() {
        metaCode.show();
    };

    this.showSettings = function() {
        _projectSettings = new CABLES.ProjectSettings(self.patch().getCurrentProject());
        _projectSettings.show();
    };

    this.showOpDoc = function(opname) {
        var docOpHead = '<div>'; //<img src="/api/op/layout/'+opname+'"/>
        // var docOpFooter = '<br/><br/><a onclick="gui.editOpDoc(\'' + opname + '\')" class="button fa fa-pencil" target="_blankkk">&nbsp;edit</a></div>';

        
        this.getOpDoc(opname, true, function(html) {
            $('#meta_content_doc').html(docOpHead + html);// + docOpFooter);
        });
    };



    this.redirectNotLoggedIn = function() {
        var theUrl = document.location.href;
        theUrl = theUrl.replace('#', '@HASH@');
        document.location.href = '/login?redir=' + theUrl;
    };

    this.getSavedState = function() {
        return savedState;
    };

    this.setTransformGizmo=function(params)
    {
        this._gizmo.set(params);
    };

    // this.updateProjectFiles=function(proj)
    // {
    //     if(!proj)proj=self.project();
    //     if(!proj)return;
    //     $('#meta_content_files').html('');
    //
    //     CABLES.api.get(
    //         'project/'+proj._id+'/files',
    //         function(files)
    //         {
    //             proj.files=files;
    //             var html='';
    //             html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_list',proj);
    //             html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_upload',proj);
    //
    //             $('#meta_content_files').html(html);
    //         });
    // };



    this.notIdling=function()
    {
        this.lastNotIdle=CABLES.now();
        // if(!_connection.isConnected())_connection.connect();
    };

    this.checkIdle=function()
    {
        var idling=(CABLES.now()-self.lastNotIdle)/1000;
        if(idling>30*60)
        {
            // _connection.disconnect();
            console.log('idle mode simpleio disconnected!');
        }
        else
        {
            setTimeout(gui.checkIdle,1000*60*2);
        }
    };

    this.setMetaTab = function(which) {
        CABLES.UI.userSettings.set("metatab", which);

        $('.meta_content').hide();
        $('#metatabs a').removeClass('active');
        $('#metatabs .tab_' + which).addClass('active');

        $('#meta_content_' + which).show();

        if (which == 'code') self.showMetaCode();
        if (which == 'keyframes') self.metaKeyframes.show();
        if (which == 'paco') self.showMetaPaco();

        if (which == 'profiler') self.showProfiler();
        if (which == 'variables') self.variables.show();

        if (which == 'preview') self.preview.show();
        else if (self.preview) self.preview.hide();
    };

    this.startPacoSender = function() {
        this.patchConnection.connectors.push(new CABLES.PatchConnectorSocketIO());
    };

    this.startPacoReceiver = function() {
        this.patch().scene.clear();

        var conn = new CABLES.PatchConnectionReceiver(
            this.patch().scene, {},
            new CABLES.PatchConnectorSocketIO()
        );
    };

    this.setStateUnsaved = function() {
        if(savedState)
        {
            document.title = gui.patch().getCurrentProject().name + ' *';
            favIconLink.href = '/favicon/favicon_orange.ico';
            savedState = false;
    
            window.onbeforeunload = function(event) {
    
                var message = 'unsaved content!';
                if (typeof event == 'undefined') {
                    event = window.event;
                }
                if (event) {
                    event.returnValue = message;
                }
                return message;
            };
    
        }
    };

    this.closeInfo = function() {
        this.infoHeight = 0;
        this.setLayout();
    };

    this.setStateSaved = function() {
        savedState = true;
        favIconLink.href = '/favicon/favicon.ico';

        document.title = '' + gui.patch().getCurrentProject().name;
        window.onbeforeunload = function() {
            gui.patchConnection.send(CABLES.PACO_CLEAR);
        };
    };

    this.showCanvasModal=function(_show)
    {
        if(_show)
        {
            $('#canvasmodal').show();
            $('#canvasicons').show();
            $('#canvasicons').css({opacity:1});
            var posCanvas = $('#glcanvas').offset();

            $('#canvasicons').css({
                width: $('#glcanvas').width(),
                top: $('#glcanvas').height() + 1,
                left: posCanvas.left
            });
            $('#canvasInfoSize').html('size: '+gui.patch().scene.cgl.canvasWidth+' x '+gui.patch().scene.cgl.canvasHeight);
        }
        else
        {
            $('#canvasicons').hide();
            $('#canvasmodal').hide();
        }
    };

    this.init = function()
    {
        $('#infoArea').show();

        $('#infoArea').hover(
            function(e)
            {
                CABLES.UI.showInfo();
            }, function() {
                CABLES.UI.hideInfo();
            });

        $('#canvasmodal').on('mousedown',
            function()
            {
                gui.showCanvasModal(false);
            });

        _patch = new CABLES.UI.Patch(this);
        _patch.show(_scene);
        

        // _socket=new CABLES.API.Socket(this);
        // _socket = new CABLES.API.Socket();
        // _connection = new CABLES.API.Connection(this);
        $('#undev').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.undevLogo);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('#sidebar-menu').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.sidebarMenu);
        }, function() {
            CABLES.UI.hideInfo();
        });
        /* Tab pane on the right */
        $('.tab_files').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_files);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('.tab_profiler').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_profiler);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('.tab_screen').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_screen);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('.download_screenshot').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.download_screenshot);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('#minimapContainer').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.minimapContainer);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('#project_settings_btn').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.project_settings_btn);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('#timelineui').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.timelineui);
        }, function() {
            CABLES.UI.hideInfo();
        });
        $('.op_background').hover(function(e) {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.op_background);
        }, function() {
            CABLES.UI.hideInfo();
        });
        gui.replaceNavShortcuts();
    };
    
    CABLES.sandbox.loadUser(
        function(user)
        {
            self.user = user;
            $('#loggedout').hide();
            $('#loggedin').show();
            $('#username').html('&nbsp;&nbsp;' + user.usernameLowercase);
            incrementStartup();
            self.serverOps = new CABLES.UI.ServerOps(self);

            logStartup('User Data loaded');
        });
};


function startUi(event)
{
    // if(window.process && window.process.versions['electron']) CABLES.sandbox=new CABLES.SandboxElectron();
    //     else CABLES.sandbox=new CABLES.SandboxBrowser();

    logStartup('Init UI');

    CABLES.UI.initHandleBarsHelper();

    $("#patch").bind("contextmenu", function(e) {
        if (e.preventDefault) e.preventDefault();
    });

    gui = new CABLES.UI.GUI();

    gui.init();
    gui.checkIdle();

    gui.bind(function() {

        console.log("BIND FINISHED!");
        gui.metaCode().init();
        gui.opSelect().reload();
        gui.setMetaTab(CABLES.UI.userSettings.get("metatab") || 'doc');
        gui.showWelcomeNotifications();

        gui.waitToShowUI();
        gui.setLayout();
        gui.patch().fixTitlePositions();
        gui.opSelect().prepare();
        gui.opSelect().search();
    });

    $('#glcanvas').on("focus", function() {
        gui.showCanvasModal(true);
    });

    $(document).on("click", '.panelhead', function(e) {
        var panelselector = $(this).data("panelselector");
        if (panelselector) {
            $(panelselector).toggle();

            if ($(panelselector).is(":visible")) {
                $(this).addClass("opened");
                $(this).removeClass("closed");
            } else {
                $(this).addClass("closed");
                $(this).removeClass("opened");
            }
        }
    });

    CABLES.watchPortVisualize.init();

    logStartup('Init UI done');

}
