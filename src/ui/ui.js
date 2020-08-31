CABLES.UI = CABLES.UI || {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI = function (cfg)
{
    CABLES.EventTarget.apply(this);

    const self = this;
    let showTiming = false;
    let showingEditor = false;
    let showMiniMap = false;

    this.keys = new CABLES.UI.KeyManager();
    this.opParams = new CABLES.UI.OpParampanel();
    this.socket = new CABLES.UI.ScConnection(CABLES.sandbox.getSocketclusterConfig());

    if (!cfg) cfg = {};
    if (!cfg.usersettings) cfg.usersettings = { "settings": {} };

    this._corePatch = CABLES.patch = new CABLES.Patch({
        "editorMode": true,
        "canvas":
        {
            "forceWebGl1": cfg.usersettings.settings.forceWebGl1 == "true",
            "alpha": true,
            "premultiplied": true,
            "prefixAssetPath": CABLES.sandbox.getAssetPrefix()
        }
    });

    this._corePatch.on("opcrash", (portTriggered) =>
    {
        this.showOpCrash(portTriggered.parent);
    });

    this.patchView = new CABLES.UI.PatchView(this._corePatch);

    this._corePatch.gui = true;
    let _patch = null;

    const _jobs = new CABLES.UI.Jobs();
    this.cmdPallet = new CABLES.UI.CommandPallet();
    const _opselect = new CABLES.UI.OpSelect();
    const _introduction = new CABLES.UI.Introduction();
    this._gizmo = null;
    this._transformOverlay = new CABLES.UI.TransformsOverlay();

    this.patchConnection = new CABLES.PatchConnectionSender(this._corePatch);
    this.opDocs = null;
    this.opHistory = new CABLES.UI.OpHistory();

    this.mainTabs = new CABLES.UI.TabPanel("maintabs");
    this.maintabPanel = new CABLES.UI.MainTabPanel(this.mainTabs);

    this.chat = new CABLES.UI.Chat(this.mainTabs, this.socket);


    this.metaTabs = new CABLES.UI.TabPanel("metatabpanel");
    // var _socket=null;
    // var _connection = null;
    let savedState = true;
    this.metaDoc = new CABLES.UI.MetaDoc(this.metaTabs);
    const metaCode = new CABLES.UI.MetaCode(this.metaTabs);
    // this.profiler = new CABLES.UI.Profiler(this.metaTabs);
    this.metaTexturePreviewer = new CABLES.UI.TexturePreviewer(this.metaTabs, this._corePatch.cgl);


    this.metaKeyframes = new CABLES.UI.MetaKeyframes(this.metaTabs);
    this.variables = new CABLES.UI.MetaVars(this.metaTabs);
    this.metaPaco = new CABLES.UI.Paco(this.metaTabs);
    this.bookmarks = new CABLES.UI.Bookmarks();
    this.history = new CABLES.UI.MetaHistory(this.metaTabs);
    // this.preview = new CABLES.UI.Preview();
    // this.hoverPreview = new CABLES.UI.Preview();

    // if(!CABLES.UI.userSettings.get("tabsLastTitle"))
    // {
    //     this.metaTabs.setTabNum(0);
    // }

    const favIconLink = document.createElement("link");
    document.getElementsByTagName("head")[0].appendChild(favIconLink);
    favIconLink.type = "image/x-icon";
    favIconLink.rel = "shortcut icon";

    this.user = null;
    this.onSaveProject = null;
    this.lastNotIdle = CABLES.now();

    this._oldCanvasWidth = 0;
    this._oldCanvasHeight = 0;
    this._oldShowingEditor = false;
    this._eventListeners = {};


    this.project = function ()
    {
        return this.patch().getCurrentProject();
    };

    this.opSelect = function ()
    {
        return _opselect;
    };

    this.timeLine = function ()
    {
        return _patch.timeLine;
    };

    this.corePatch = this.scene = function ()
    {
        return this._corePatch;
    };

    this.patch = function ()
    {
        return _patch;
    };

    // this.editor = function() {
    //     return _editor;
    // };

    this.jobs = function ()
    {
        return _jobs;
    };

    this.focusFindResult = (idx, opid, subpatch, x, y) =>
    {
        if (gui.keys.shiftKey)
        {
            gui.opParams.show(opid);
        }
        else
        {
            this.patchView.setCurrentSubPatch(subpatch);
            this.patchView.focusOp(opid);
            this.patchView.centerView(x, y);
            this.patchView.setSelectedOpById(opid);
            $("#patch").focus();
        }

        gui.find().setClicked(idx);
    };

    this.find = function (str)
    {
        if (this._find && this._find.isClosed()) this._find = null;

        if (str == undefined) return this._find;
        gui.maintabPanel.show();

        if (this._find)
        {
            this._find.search(str);
            this._find.setSearchInputValue(str);
        }
        else this._find = new CABLES.UI.FindTab(gui.mainTabs, str);

        this._find.focus();
    };

    this.texturePreview = function ()
    {
        return this.metaTexturePreviewer;
    };

    this.introduction = function ()
    {
        return _introduction;
    };

    this.infoHeight = 200;
    this.timingHeight = 250;
    this.rendererWidth = 640;
    this.rendererHeight = 360;


    this.editorWidth = CABLES.UI.userSettings.get("editorWidth") || 350;
    this.updateTheme();

    this.setLayout = function ()
    {
        gui.pauseProfiling();
        const perf = CABLES.uiperf.start("gui.setlayout");
        this._elCanvasIconbar = this._elCanvasIconbar || $("#canvasicons");
        this._elAceEditor = this._elAceEditor || $("#ace_editors");
        this._elSplitterPatch = this._elSplitterPatch || $("#splitterPatch");
        this._elSplitterRenderer = this._elSplitterRenderer || $("#splitterRenderer");

        this.patchView.updateBoundingRect();

        this._elPatch = this.patchView.element;

        this._elOptions = this._elOptions || $("#options");
        this._elMeta = this._elMeta || $("#meta");
        this._elMenubar = this._elMenubar || $("#menubar");
        this._elSplitterMeta = this._elSplitterMeta || $("#splitterMeta");
        this._elInforArea = this._elInforArea || $("#infoArea");
        this._elGlCanvas = this._elGlCanvas || $("#glcanvas");
        this._elCablesCanvas = this._elCablesCanvas || $("#cablescanvas");
        this._elEditorBar = this._elEditorBar || $("#editorbar");
        this._elIconBar = this._elIconBar || $("#icon-bar");

        this._elMaintab = this._elMaintab || document.getElementById("maintabs");
        this._elEditor = this._elEditor || document.getElementById("editor");
        this._elLibrary = this._elLibrary || document.getElementById("library");
        this._elCanvasInfoSize = this._elCanvasInfoSize || document.getElementById("canvasInfoSize");
        this._elSplitterEditor = this._elSplitterEditor || document.getElementById("splitterEditor");
        this._elSplitterMaintabs = this._elSplitterMaintabs || document.getElementById("splitterMaintabs");
        this._elEditorMinimized = this._elEditorMinimized || document.getElementById("editorminimized");
        this._elEditorMaximized = this._elEditorMaximized || document.getElementById("editormaximized");

        this._elMiniMapContainer = this._elMiniMapContainer || document.getElementById("minimapContainer");
        this._elMiniMap = this._elMiniMap || document.getElementById("minimap");
        this._elTLoverviewtimeline = this._elTLoverviewtimeline || document.getElementById("overviewtimeline");
        this._elTLtimelineTitle = this._elTLtimelineTitle || document.getElementById("timelineTitle");
        this._elTLkeycontrols = this._elTLkeycontrols || document.getElementById("keycontrols");
        this._elTLtimetimeline = this._elTLtimetimeline || document.getElementById("timetimeline");
        this._elTLsplitterTimeline = this._elTLsplitterTimeline || document.getElementById("splitterTimeline");

        const iconBarnav_patch_saveasWidth = this._elIconBar.outerWidth();

        this._elMenubar.show();

        if (self.rendererWidth === undefined || self.rendererHeight === undefined)
        {
            self.rendererWidth = window.innerWidth * 0.4;
            self.rendererHeight = window.innerHeight * 0.25;
        }
        if (self.rendererWidth === 0)
        {
            self.rendererWidth = window.innerWidth;
            self.rendererHeight = window.innerHeight;
        }

        self.rendererWidthScaled = self.rendererWidth * this._corePatch.cgl.canvasScale;
        self.rendererHeightScaled = self.rendererHeight * this._corePatch.cgl.canvasScale;

        self.rendererWidth = Math.floor(self.rendererWidth);
        self.rendererHeight = Math.floor(self.rendererHeight);

        const cgl = this._corePatch.cgl;
        if (cgl.canvasWidth)
        {
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString(cgl);
        }

        const iconBarWidth = 80;
        const menubarHeight = 30;
        const optionsWidth = Math.max(400, self.rendererWidthScaled / 2);

        let timelineUiHeight = 40;
        if (self.timeLine() && self.timeLine().hidden) timelineUiHeight = 0;

        const filesHeight = 0;
        // if (CABLES.UI.fileSelect.visible) filesHeight = $('#library').height();

        const timedisplayheight = 25;

        let patchHeight = window.innerHeight - menubarHeight - 2;
        const patchWidth = window.innerWidth - self.rendererWidthScaled - 6 - iconBarWidth;

        if (showTiming)
        {
            patchHeight = patchHeight - this.timingHeight - 2;

            $(".easingselect").css("bottom", 0);
            $(".easingselect").css("left", patchWidth + iconBarWidth);
        }
        else
        {
            patchHeight -= timelineUiHeight;
        }

        if (patchWidth < 600)
        {
            $("#username").hide();
            $(".projectname").hide();
            $(".naventry").hide();
        }
        else
        {
            $("#username").show();
            $(".projectname").show();
            $(".naventry").show();
        }

        $("#subpatch_nav").css(
            {
                "width": patchWidth + "px",
                "left": iconBarWidth + "px",
                "top": menubarHeight + 1
            });

        let editorWidth = self.editorWidth;
        if (editorWidth > patchWidth - 50) editorWidth = patchWidth - 50;

        const patchLeft = iconBarWidth;

        if (this.maintabPanel.isVisible())
        {
            const editorbarHeight = 76;
            const editorHeight = patchHeight - 2 - editorbarHeight;

            this._elMaintab.style.left = iconBarWidth + "px";
            this._elMaintab.style.top = menubarHeight;
            this._elMaintab.style.height = (editorHeight - 2) + "px";
            this._elMaintab.style.width = editorWidth;

            // var editEls=document.getElementsByClassName("tabcontent");
            // for(var i=0;i<editEls.length;i++)
            // {
            //     editEls[i].style.height=(editorHeight-10)+"px";
            //     console.log(editorHeight);
            // }

            this._elAceEditor.css("height", editorHeight);
            this._elSplitterMaintabs.style.display = "block";
            this._elSplitterMaintabs.style.left = editorWidth + iconBarWidth;
            this._elSplitterMaintabs.style.height = patchHeight - 2;
            this._elSplitterMaintabs.style.width = 5;
            this._elSplitterMaintabs.style.top = menubarHeight;

            this._elEditorMinimized.style.display = "none";
            this._elEditorMinimized.style.left = iconBarWidth;
            this._elEditorMinimized.style.top = menubarHeight;

            this._elEditorMaximized.style.display = "block";
            this._elEditorMaximized.style.left = editorWidth + iconBarWidth + 3;
            this._elEditorMaximized.style.top = menubarHeight;

            $("#subpatch_nav").css("left", editorWidth + iconBarWidth + 15);
        }
        else
        {
            this._elEditorMaximized.style.display = "none";

            if (this.mainTabs.getNumTabs() > 0) this._elEditorMinimized.style.display = "block";
            else this._elEditorMinimized.style.display = "none";

            this._elSplitterMaintabs.style.display = "none";
            this._elEditorMinimized.style.left = iconBarWidth;
            this._elEditorMinimized.style.top = menubarHeight;

            $("#subpatch_nav").css("left", iconBarWidth + 25);
        }

        // if(showingEditor)
        // {
        //     this._elEditorMinimized.style.display = "none";
        //     var editWidth=self.editorWidth;

        //     if (editWidth > window.innerWidth - self.rendererWidth -iconBarWidth)
        //     {
        //         self.rendererWidth = window.innerWidth - editWidth - iconBarWidth -20;
        //         this.updateCanvasIconBar();
        //     }

        //     var editorbarHeight = 76;

        //     this._elEditor.style.display = "block";
        //     this._elEditor.style.left = iconBarWidth;
        //     this._elEditor.style.top = menubarHeight;

        //     this._elEditorBar.css('height', editorbarHeight);
        //     this._elEditorBar.css('top',  1);

        //     var editorHeight = patchHeight - 2 - editorbarHeight;

        //     this._elAceEditor.css('height', editorHeight);
        //     this._elAceEditor.css('width', editWidth);
        //     $('#ace_editors .ace_tab_content').css('top',  1 + editorbarHeight);
        //     this._elAceEditor.css('left', 0);

        //     $('#editorfoot').css('width', editWidth);

        //     this._elEditorBar.css('width', editWidth);

        //     this._elSplitterEditor.style.display = "block";
        //     this._elSplitterEditor.style.left= editWidth + iconBarWidth;
        //     this._elSplitterEditor.style.height= patchHeight - 2;
        //     this._elSplitterEditor.style.width= 5;
        //     this._elSplitterEditor.style.top= menubarHeight;

        //     _editor.resize();

        // } else {

        //     this._elSplitterEditor.style.display = "none";
        //     this._elEditor.style.display = "none";
        //     editorWidth = 0;

        //     if(_editor.getNumTabs()>0)
        //     {
        //         this._elEditorMinimized.style.display = "block";
        //         this._elEditorMinimized.style.left = iconBarWidth;
        //         this._elEditorMinimized.style.top = patchHeight / 2 - 100;
        //     }
        //     else this._elEditorMinimized.style.display = "none";
        // }

        this._elIconBar.css("height", window.innerHeight - 60);
        this._elIconBar.css("top", 60);

        $("#jobs").css("left", iconBarWidth);

        if (self.rendererWidth < 100) self.rendererWidth = 100;

        $("#patch svg").css("height", patchHeight);
        $("#patch svg").css("width", patchWidth);

        this._elSplitterPatch.css("left", window.innerWidth - self.rendererWidthScaled - 4);
        this._elSplitterPatch.css("height", patchHeight + timelineUiHeight + 2);
        this._elSplitterPatch.css("top", menubarHeight);
        this._elSplitterRenderer.css("top", self.rendererHeightScaled);
        this._elSplitterRenderer.css("width", self.rendererWidthScaled);


        this._elPatch.css("height", patchHeight);
        this._elPatch.css("width", patchWidth);
        this._elPatch.css("top", menubarHeight);
        this._elPatch.css("left", patchLeft);

        $("#searchbox").css("left", patchLeft + patchWidth - CABLES.UI.uiConfig.miniMapWidth + 1);
        $("#searchbox").css("width", CABLES.UI.uiConfig.miniMapWidth);

        if (showMiniMap)
        {
            this._elMiniMapContainer.style.display = "block";
            this._elMiniMap.style.display = "block";

            this._elMiniMapContainer.style.left = patchLeft + patchWidth - CABLES.UI.uiConfig.miniMapWidth - 4;
            this._elMiniMapContainer.style.top = menubarHeight + patchHeight - CABLES.UI.uiConfig.miniMapHeight - 24;

            $("#minimapContainer .title_closed").hide();
            $("#minimapContainer .title_opened").show();
        }
        else
        {
            this._elMiniMapContainer.style.display = "none";
            this._elMiniMap.style.display = "none";
        }

        this._elLibrary.style.left = iconBarWidth;
        this._elLibrary.style.width = window.innerWidth - self.rendererWidthScaled - iconBarWidth;
        this._elLibrary.style.bottom = 0;

        const timelineWidth = window.innerWidth - self.rendererWidthScaled - 2 - iconBarWidth;


        if (showTiming)
        {
            $("#timelineui").css("width", timelineWidth);
            $("#timing").css("width", timelineWidth);
            $("#timing").css("bottom", filesHeight);

            $("#timelineui").show();
            $("#timing").css("height", this.timingHeight);
            $("#timing").css("left", iconBarWidth);

            $("#overviewtimeline").css("margin-top", timelineUiHeight);
            $("#overviewtimeline svg").css("width", timelineWidth);
            $("#overviewtimeline svg").css("height", 25);

            $("#timetimeline").css("margin-top", timelineUiHeight + timedisplayheight);
            $("#timetimeline svg").css("width", timelineWidth);
            $("#timetimeline svg").css("height", 25);

            $("#timeline svg").css("width", timelineWidth);
            $("#timeline svg").css("height", this.timingHeight - timedisplayheight);
            $("#timeline svg").css("margin-top", timelineUiHeight + timedisplayheight + timedisplayheight);

            $("#timeline svg").show();

            this._elTLoverviewtimeline.style.display = "block";
            this._elTLtimetimeline.style.display = "block";
            this._elTLkeycontrols.style.display = "block";
            this._elTLsplitterTimeline.style.display = "block";
            this._elTLtimelineTitle.style.display = "block";

            $("#splitterTimeline").css("bottom", this.timingHeight - 4);
        }
        else
        {
            this._elTLoverviewtimeline.style.display = "none";
            this._elTLtimetimeline.style.display = "none";
            this._elTLkeycontrols.style.display = "none";
            this._elTLtimelineTitle.style.display = "none";
            this._elTLsplitterTimeline.style.display = "none";

            $("#timeline svg").hide();
            $("#timing").css("height", timelineUiHeight);
            $("#splitterTimeline").hide();
        }

        if (self.timeLine()) self.timeLine().updateViewBox();

        $("#splitterTimeline").css("width", timelineWidth);
        $("#delayed").css("left", window.innerWidth - self.rendererWidth + 10);

        this._elOptions.css("left", window.innerWidth - self.rendererWidthScaled - 1);
        this._elOptions.css("top", self.rendererHeightScaled);
        this._elOptions.css("width", optionsWidth);
        this._elOptions.css("height", window.innerHeight - self.rendererHeightScaled);

        const metaWidth = self.rendererWidthScaled - optionsWidth + 1;
        this._elMeta.css("right", 0);
        this._elMeta.css("top", self.rendererHeightScaled);
        this._elMeta.css("width", metaWidth);
        this._elMeta.css("height", window.innerHeight - self.rendererHeightScaled);

        $("#performance_glcanvas").css("bottom", 0);
        $("#performance_glcanvas").css("right", self.rendererWidthScaled - optionsWidth - $("#performance_glcanvas").width() + 1);

        this._elMenubar.css("top", 0);
        this._elMenubar.css("width", window.innerWidth - self.rendererWidthScaled - 10);
        this._elMenubar.css("height", menubarHeight);

        this._elSplitterMeta.css("bottom", self.infoHeight + "px");
        this._elSplitterMeta.css("width", metaWidth - 28 + "px");

        if (self.infoHeight === 0)
        {
            this._elInforArea.hide();
            $("#splitterMeta").hide();
        }
        else
        {
            this._elInforArea.css("width", (metaWidth - 20) + "px");
            this._elInforArea.css("height", (self.infoHeight) + "px");
            this._elInforArea.css("top", (window.innerHeight - self.rendererHeight - self.infoHeight) + "px");
        }

        $("#metatabpanel .contentcontainer").css("height", window.innerHeight - self.rendererHeightScaled - self.infoHeight - 50);
        $("#maintabs").css("height", window.innerHeight - menubarHeight);
        $("#maintabs .contentcontainer").css("height", window.innerHeight - menubarHeight - 50);


        if (self.rendererWidth === 0)
        {
            this._elGlCanvas.attr("width", window.innerWidth);
            this._elGlCanvas.attr("height", window.innerHeight);
            this._elGlCanvas.css("z-index", 9999);
        }
        else
        {
            const density = this._corePatch.cgl.pixelDensity;

            this._elGlCanvas.attr("width", self.rendererWidth * density);
            this._elGlCanvas.attr("height", self.rendererHeight * density);
            this._elGlCanvas.css("width", self.rendererWidth);
            this._elGlCanvas.css("height", self.rendererHeight);
            // this._elGlCanvas.css('left', window.innerWidth-self.rendererWidth*density);
            // console.log("!!!",window.innerWidth,self.rendererWidth)

            this._elCablesCanvas.css("width", self.rendererWidth + "px");
            this._elCablesCanvas.css("height", self.rendererHeight + "px");

            this._elCablesCanvas.css("transform-origin", "top right");
            this._elCablesCanvas.css("transform", "scale(" + this._corePatch.cgl.canvasScale + ")");

            this._corePatch.cgl.updateSize();
        }

        $("#bgpreview").css("right", self.rendererWidth + "px");
        $("#bgpreview").css("top", menubarHeight + "px");

        this.emitEvent("setLayout");


        perf.finish();
    };

    this.importDialog = function ()
    {
        let html = "";
        html += "import:<br/><br/>";
        html += "<textarea id=\"serialized\"></textarea>";
        html += "<br/>";
        html += "<br/>";
        html += "<a class=\"button\" onclick=\"this._corePatch.clear();this._corePatch.deSerialize($('#serialized').val());CABLES.UI.MODAL.hide();\">import</a>";
        CABLES.UI.MODAL.show(html);
    };

    this.exportDialog = function ()
    {
        let html = "";
        html += "export:<br/><br/>";
        html += "<textarea id=\"serialized\"></textarea>";
        CABLES.UI.MODAL.show(html);
        $("#serialized").val(self.patch().scene.serialize());
    };

    this.cycleRendererSize = function ()
    {
        this.showCanvasModal(false);
        if (self.rendererWidth !== 0)
        {
            this._elGlCanvas.addClass("maximized");
            this._oldCanvasWidth = self.rendererWidth;
            this._oldCanvasHeight = self.rendererHeight;
            this._oldShowingEditor = showingEditor;

            self.rendererWidth = 0;
            showingEditor = false;
        }
        else
        {
            this._elGlCanvas.removeClass("maximized");
            self.rendererWidth = this._oldCanvasWidth;
            self.rendererHeight = this._oldCanvasHeight;
            showingEditor = this._oldShowingEditor;
            this.showCanvasModal(true);
        }

        self.setLayout();
    };


    function updateTimingIcon()
    {
        if (showTiming)
        {
            $("#button_toggleTiming i").removeClass("fa-caret-up");
            $("#button_toggleTiming i").addClass("fa-caret-down");
        }
        else
        {
            $("#button_toggleTiming i").removeClass("fa-caret-down");
            $("#button_toggleTiming i").addClass("fa-caret-up");
        }
    }

    this.showMiniMap = function ()
    {
        showMiniMap = true;
        self.setLayout();
    };

    this.hideMiniMap = function ()
    {
        showMiniMap = false;
        self.setLayout();
    };

    this.isShowingTiming = function ()
    {
        return showTiming;
    };

    this.showTiming = function ()
    {
        self.timeLine().hidden = false;
        showTiming = true;
        $("#timing").show();
        gui.setLayout();
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
    };

    this.hideTiming = function ()
    {
        self.timeLine().hidden = true;
        showTiming = false;
        $("#timing").hide();
        gui.setLayout();
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
    };

    this.toggleTiming = function ()
    {
        self.timeLine().hidden = false;
        $("#timing").show();
        CABLES.UI.userSettings.set("timelineOpened", true);

        showTiming = !showTiming;
        updateTimingIcon();
        self.setLayout();
        self.timeLine().redraw();
    };

    this.showUiDebug = function ()
    {
        let numVisibleOps = 0;
        for (const i in self.ops)
        {
            if (!self.ops[i].isHidden()) numVisibleOps++;
        }

        const canvass = [];
        const canvs = $("canvas");

        for (let i = 0; i < canvs.length; i++)
        {
            canvass.push({
                "name": canvs[i].id,
                "width": canvs[i].width,
                "height": canvs[i].height
            });
        }

        const gl = this._corePatch.cgl.gl;
        const dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
        let gl_renderer = "unknown";
        if (dbgRenderInfo) gl_renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);

        const html = CABLES.UI.getHandleBarHtml(
            "uiDebug", {

                "gl_ver": gl.getParameter(gl.VERSION),
                "gl_renderer": gl_renderer,
                "numOps": gui.corePatch().ops.length,
                "numVisibleOps": numVisibleOps,
                "canvass": canvass,
                "numSvgElements": $("#patch svg *").length,
                "startup": CABLES.startup.log
            });

        CABLES.UI.MODAL.show(html);
    };

    this.refreshFileManager = function ()
    {
        if (this.fileManager) this.fileManager.refresh();
        else this.showFileManager();
    };

    this.showFileManager = function (cb)
    {
        if (this.fileManager)
        {
            this.fileManager.show();
            gui.mainTabs.activateTabByName("Files");

            if (cb)cb();
        }
        else
        {
            this.fileManager = new CABLES.UI.FileManager(cb);
        }
    };

    this.showFileSelect = function (inputId, filterType, opid)
    {
        this.showFileManager(function ()
        {
            const portInputEle = document.querySelector(inputId);
            if (!portInputEle)
            {
                console.log("[showfileselect] no portInputEle");
                return;
            }
            const fn = portInputEle.value;

            this.fileManager.setFilterType(filterType);
            this.fileManager.setFilePort(portInputEle, gui.corePatch().getOpById(opid));
            this.fileManager.selectFile(fn);
        }.bind(this));
    };

    this.setProjectName = function (name)
    {
        $("#patchname").html(name);
        gui.corePatch().name = name;
    };

    this.createProject = function ()
    {
        CABLES.UI.MODAL.prompt(
            "New Project",
            "Enter a name for your new Project",
            "My new Project",
            function (name)
            {
                if (name)
                    CABLESUILOADER.talkerAPI.send("newPatch", { "name": name }, function (err, d)
                    {
                        console.log("newpatch", d);
                        CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": d._id });
                    });
            });
    };


    this.getUserOs = function ()
    {
        let OSName = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
        if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
        if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
        if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";

        return OSName;
    };

    /* Returns the default mod key for a OS */
    this.getModKeyForOs = function (os)
    {
        switch (os)
        {
        case "Windows":
            return "ctrl";
        case "MacOS":
            return "cmd";
        case "UNIX":
            return "cmd";
        default:
            return "mod";
        }
    };

    /* Goes through all nav items and replaces "mod" with the OS-dependent modifier key */
    this.replaceNavShortcuts = function ()
    {
        const osMod = gui.getModKeyForOs(gui.getUserOs());
        $("nav ul li .shortcut").each(function ()
        {
            const newShortcut = $(this).text().replace("mod", osMod);
            $(this).text(newShortcut);
        });
    };

    this.showFile = function (fileId, file)
    {
        console.log(file);
        const html = CABLES.UI.getHandleBarHtml(
            "params_file", {
                file,
                fileId,
                "projectId": self.patch().getCurrentProject()._id
            });

        $("#options").html(html);
    };

    this.converterStart = function (projectId, fileId, converterId)
    {
        $("#converterprogress").show();
        $("#converterform").hide();

        CABLESUILOADER.talkerAPI.send("fileConvert",
            {
                "fileId": fileId,
                "converterId": converterId,
                "options": CABLES.serializeForm("#converterform")
            },
            function (err, res)
            {
                $("#converterprogress").hide();
                $("#converteroutput").show();

                if (err)
                {
                    $("#converteroutput").html("Error: something went wrong while converting..." + (err.msg || ""));
                }
                else
                {
                    let html = "";

                    if (res && res.info) html = res.info;
                    else html = "Finished!";

                    html += "<br/><a class=\"button\" onclick=\"CABLES.UI.MODAL.hide()\">ok</a>";
                    $("#converteroutput").html(html);
                }
                gui.refreshFileManager();
            });
    };

    this.helperContextMenu = function (ele)
    {
        console.log("CABLES.UI.showCanvasTransforms", CABLES.UI.showCanvasTransforms);

        let iconTransforms = "fa fa-check fa-hide";
        if (CABLES.UI.showCanvasTransforms) iconTransforms = "fa fa-check";

        let iconShowAllHelpers = "fa fa-check fa-hide";
        if (CABLES.UI.userSettings.get("helperMode")) iconShowAllHelpers = "fa fa-check";

        let iconShowCurrentOpHelper = "fa fa-check fa-hide";
        if (CABLES.UI.userSettings.get("helperModeCurrentOp")) iconShowCurrentOpHelper = "fa fa-check";

        let iconCurrentOpTransform = "fa fa-check fa-hide";
        if (CABLES.UI.userSettings.get("toggleHelperCurrentTransforms")) iconCurrentOpTransform = "fa fa-check";

        CABLES.contextMenu.show(
            {
                "refresh": gui.helperContextMenu,
                "items":
                [
                    {
                        "title": "show selected op helper",
                        "func": CABLES.CMD.UI.toggleHelperCurrent,
                        "iconClass": iconShowCurrentOpHelper,
                    },
                    {
                        "title": "show all helper",
                        "func": CABLES.CMD.UI.toggleHelper,
                        "iconClass": iconShowAllHelpers,
                    },
                    {
                        "title": "show selected op transform gizmo",
                        "func": CABLES.CMD.UI.toggleHelperCurrentTransform,
                        "iconClass": iconCurrentOpTransform,
                    },
                    {
                        "title": "show all transforms",
                        "func": CABLES.CMD.UI.toggleTransformOverlay,
                        "iconClass": iconTransforms,
                    }
                ]
            }, ele);
    };

    this.rendererContextMenu = function (ele)
    {
        CABLES.contextMenu.show(
            {
                "items":
                [
                    {
                        "title": "set canvas size",
                        "func": CABLES.CMD.RENDERER.changeSize
                    },
                    {
                        "title": "set canvas scale",
                        "func": CABLES.CMD.RENDERER.scaleCanvas
                    }
                ]
            }, ele);
    };


    this.rendererAspectMenu = function (ele)
    {
        CABLES.contextMenu.show(
            {
                "items":
                [
                    {
                        "title": "32:9",
                        func() { CABLES.CMD.RENDERER.aspect(32 / 9); }
                    },
                    {
                        "title": "21:9",
                        func() { CABLES.CMD.RENDERER.aspect(21 / 9); }
                    },
                    {
                        "title": "16:9",
                        func() { CABLES.CMD.RENDERER.aspect(16 / 9); }
                    },
                    {
                        "title": "16:10",
                        func() { CABLES.CMD.RENDERER.aspect(16 / 10); }
                    },
                    {
                        "title": "4:3",
                        func() { CABLES.CMD.RENDERER.aspect(4 / 3); }
                    },
                    {
                        "title": "5:4",
                        func() { CABLES.CMD.RENDERER.aspect(5 / 4); }
                    },
                    {
                        "title": "1:1",
                        func() { CABLES.CMD.RENDERER.aspect(1); }
                    },
                    {
                        "title": "1:2",
                        func() { CABLES.CMD.RENDERER.aspect(1 / 2); }
                    },
                    {
                        "title": "9:16",
                        func() { CABLES.CMD.RENDERER.aspect(9 / 16); }
                    }
                ]
            }, ele);
    };

    this.showConverter = function (converterId, projectId, fileId, converterName)
    {
        const html = CABLES.UI.getHandleBarHtml(
            "params_convert", {
                "converterId": converterId,
                "converterName": converterName,
                "projectId": projectId,
                "fileId": fileId
            });

        CABLES.UI.MODAL.show(html);
    };

    this.bind = function (cb)
    {
        $("#glcanvas").attr("tabindex", "3");

        document.getElementsByClassName("nav_cmdplt")[0].addEventListener("click", () =>
        {
            this.cmdPallet.show();
        });

        document.getElementsByClassName("nav_search")[0].addEventListener("click", () =>
        {
            gui.find("");
        });

        $(".nav_createBackup").bind("click", function (event)
        {
            CABLES.CMD.PATCH.createBackup();
        });

        $(".nav_viewBackups").bind("click", function (event)
        {
            gui.mainTabs.addIframeTab("Patch Backups", CABLES.sandbox.getCablesUrl() + "/patch/" + self.project()._id + "/settingsiframe#t=versions", { "icon": "settings", "closable": true, "singleton": true });
        });

        $(".nav_cablesweb").bind("click", function (event)
        {
            const win = window.open(CABLES.sandbox.getCablesUrl(), "_blank");
            win.focus();
        });

        $(".nav_preferences").bind("click", function (event)
        {
            CABLES.CMD.UI.showPreferences();
        });

        $("#button_toggleTiming").bind("click", function (event)
        {
            self.toggleTiming();
        });

        $("#button_cycleRenderSize").bind("click", function (event)
        {
            self.cycleRendererSize();
        });

        $(".nav_viewProjectLink").bind("click", function (event)
        {
            const url = $(".viewProjectLink").attr("href");
            console.log("url", url);
            const win = window.open(url, "_blank");
            win.focus();
        });

        $(".nav_patch_save").bind("click", function (event)
        {
            CABLES.CMD.PATCH.save();
        });
        $(".nav_patch_saveas").bind("click", function (event)
        {
            CABLES.CMD.PATCH.saveAs();
        });
        $(".nav_patch_new").bind("click", function (event)
        {
            CABLES.CMD.PATCH.newPatch();
        });
        $(".nav_patch_clear").bind("click", function (event)
        {
            if (confirm("really?")) CABLES.CMD.PATCH.clear();
        });
        $(".nav_patch_export").bind("click", function (event)
        {
            CABLES.CMD.PATCH.export();
        });
        $(".nav_uploadfile").bind("click", function (event)
        {
            CABLES.CMD.PATCH.uploadFileDialog();
        });
        // $('.nav_patch_export_ignoreAssets').bind("click", function(event) {
        //     gui.patch().exportStatic(true);
        // });

        $(".nav_patch_settings").bind("click", function (event)
        {
            CABLES.CMD.UI.settings();
        });
        $(".nav_patch_browse_examples").bind("click", function (event)
        {
            const win = window.open("https://cables.gl/examples", "_blank");
            win.focus();
        });
        $(".nav_patch_browse_favourites").bind("click", function (event)
        {
            const win = window.open("https://cables.gl/myfavs", "_blank");
            win.focus();
        });
        $(".nav_patch_browse_public").bind("click", function (event)
        {
            const win = window.open("https://cables.gl/projects", "_blank");
            win.focus();
        });
        // $('.nav_patch_resolve_subpatch').bind("click", function(event) {
        //     self.patch().resolveSubpatch();
        // });

        $(".nav_patch_contributors").bind("click", CABLES.CMD.UI.settingsContributors);
        $(".nav_changelog").bind("click", CABLES.CMD.UI.showChangelog);
        // $('#username').bind("click", CABLES.CMD.UI.userSettings);

        $(".cables-logo").hover(function (e)
        {
            gui.jobs().updateJobListing();
            $("#jobs").show();
        }, function ()
        {
            $("#jobs").hide();
        });

        // --- Help menu
        // Documentation
        $(".nav_help_keys").bind("click", function (event)
        {
            CABLES.CMD.UI.showKeys();
        });


        $(".nav_help_about").bind("click", function (event)
        {
            // TODO: Show popup which explains what cables is and who develops it
        });
        $(".nav_help_documentation").bind("click", function (event)
        {
            const win = window.open("https://docs.cables.gl", "_blank");
            if (win)
            {
                // Browser has allowed it to be opened
                win.focus();
            }
            else
            {
                // Broswer has blocked it
                alert("Please allow popups for this site");
            }
        });

        $(".nav_help_forum").bind("click", function (event)
        {
            const win = window.open("https://forum.cables.gl", "_blank");
        });

        $(".nav_help_tipps").bind("click", function (event)
        {
            CABLES.UI.tipps.show();
        });

        // Introduction
        $(".nav_help_introduction").bind("click", function (event)
        {
            self.introduction().showIntroduction();
        });

        $(".nav_help_video").bind("click", function (event)
        {
            const win = window.open("https://www.youtube.com/cablesgl", "_blank");
            win.focus();
        });

        $(".nav_op_addOp").bind("click", function (event)
        {
            CABLES.CMD.PATCH.addOp();
        });
        $(".nav_op_createOp").bind("click", function (event)
        {
            self.serverOps.createDialog();
        });

        $(".nav_files").bind("click", function (event)
        {
            CABLES.CMD.UI.toggleFiles();
        });
        $(".nav_filemanager").bind("click", function (event)
        {
            // CABLES.CMD.UI.toggleFiles();
            gui.showFileManager();
        });
        $(".nav_timeline").bind("click", function (event)
        {
            CABLES.CMD.UI.toggleTimeline();
        });
        $(".nav_profiler").bind("click", function (event)
        {
            new CABLES.UI.Profiler(gui.mainTabs);
            gui.maintabPanel.show();
        });
        $(".nav_editor").bind("click", function (event)
        {
            CABLES.CMD.UI.toggleEditor();
        });

        // $("#button_subPatchBack").bind("click", function (event)
        // {
        //     self.patch().subpatchBack();
        // });
        // $('#button_editor').bind("click", function (event) { showingEditor=!showingEditor;self.setLayout(); });

        window.addEventListener("resize", () =>
        {
            this.showCanvasModal(false);
            $("#glcanvas").blur();
            this.setLayout();
            this.patch().getViewBox().update();
            this.mainTabs.emitEvent("resize");
        }, false);

        let spaceBarStart = 0;


        $(document).keydown(function (e)
        {
            if (CABLES.UI.suggestions && (e.keyCode > 64 && e.keyCode < 91))
            {
                if (CABLES.UI.suggestions)
                {
                    const suggs = CABLES.UI.suggestions;
                    CABLES.UI.suggestions.close();
                    suggs.showSelect();
                }
                return;
            }

            switch (e.which)
            {
            default:
                break;

            case 90: // z undo
                if (e.metaKey || e.ctrlKey)
                {
                    if (e.shiftKey) CABLES.undo.redo();
                    else CABLES.undo.undo();
                }
                break;


            case 78: // n - new project
                if (e.metaKey || e.ctrlKey)
                {
                    self.createProject();
                }
                break;

            case 9:
                if ($("#patch").is(":focus") && !e.metaKey && !e.ctrlKey)
                {
                    gui.opSelect().show({
                        "x": 0,
                        "y": 0
                    });
                    e.preventDefault();
                }

                break;
            }
        });

        $("#patch").keydown(function (e)
        {
            switch (e.which)
            {
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


        $("#patch").keyup(function (e)
        {
            switch (e.which)
            {
            case 32: // space play
                const timeused = Date.now() - spaceBarStart;
                if (timeused < 500) self.timeLine().togglePlay();
                spaceBarStart = 0;
                break;
            }
        });

        $("#timeline").keydown(function (e)
        {
            switch (e.which)
            {
            case 32: // space play
                self.timeLine().togglePlay();
                break;
            }
        });

        cb();
    };

    this.bindKeys = function ()
    {
        // opens editor for 1st string port found on an op with shift+e
        this.keys.key("e", "shift-e editor", "down", null, { "cmdCtrl": false, "shiftKey": true }, (e) =>
        {
            if (gui.patch().getSelectedOps().length !== 1 || !gui.patch().getSelectedOps()[0].portsIn.length)
            {
                return;
            }

            const selectedOp = gui.patch().getSelectedOps();
            const selectedOpId = selectedOp[0].op.id;

            let portName = null;

            for (let i = 0; i < selectedOp[0].portsIn.length; i++)
            {
                const port = selectedOp[0].portsIn[i].thePort;
                const type = port.getTypeString();

                if (type === "String")
                {
                    portName = port.name;
                    break;
                }
            }

            if (portName)
            {
                CABLES.UI.openParamStringEditor(selectedOpId, portName);
            }
        });

        this.keys.key("Escape", "Open Op Create (or close current dialog)", "down", null, { "ignoreInput": true }, (e) => { this.pressedEscape(e); });
        this.keys.key("p", "Open Command Palette", "down", null, { "cmdCtrl": true }, (e) => { this.cmdPallet.show(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true }, (e) => { this.cycleRendererSize(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            if (!$("#ace_editors textarea").is(":focus") && !CABLES.UI.MODAL.isVisible()) CABLES.CMD.UI.showSearch();
            else e.dontPreventDefault = true;
        });

        this.keys.key("s", "Save patch as new patch", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) => { gui.patch().saveCurrentProjectAs(); });

        this.keys.key("s", "Save patch", "down", null, { "cmdCtrl": true, "ignoreInput": true }, (e) =>
        {
            if ($("#patch").is(":focus"))
            {
                CABLES.CMD.PATCH.save();
            }
            else
            if (gui.mainTabs.getSaveButton())
            {
                // console.log("found savebutton",gui.mainTabs.getSaveButton());
                gui.mainTabs.getSaveButton().cb();
            }
            else
            {
                CABLES.CMD.PATCH.save();
            }
        });

        //     case 69: // e - editor save/execute/build
        //     if (e.metaKey || e.ctrlKey) {
        //         if (showingEditor) {
        //             self.editor().save();
        //         }
        //     }
        // break;
    };

    this.pressedEscape = function (e)
    {
        this.showCanvasModal(false);
        this.callEvent("pressedEscape");
        if (this.fileManager) this.fileManager.setFilePort(null);

        if (e && (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey))
        {
            this.maintabPanel.toggle();
            this.setLayout();
            return;
        }
        this.metaTexturePreviewer.pressedEscape();
        $(".tooltip").hide();

        if (self.rendererWidth * this._corePatch.cgl.canvasScale > window.innerWidth * 0.9)
        {
            if (this._elGlCanvas.hasClass("maximized"))
            {
                this.rendererWidth = this._oldCanvasWidth;
                this.rendererHeight = this._oldCanvasHeight;
            }
            else
            {
                this.rendererWidth = window.innerWidth * 0.4;
                this.rendererHeight = window.innerHeight * 0.25;
            }

            showingEditor = this._oldShowingEditor;
            this._elGlCanvas.removeClass("maximized");
            self.setLayout();
            this.showCanvasModal(true);
        }
        else if (CABLES.UI.suggestions)
        {
            console.log(CABLES.UI.suggestions);
            CABLES.UI.suggestions.close();
            CABLES.UI.suggestions = null;
        }
        else if ($("#cmdpalette").is(":visible")) gui.cmdPallet.close();
        else if ($(".contextmenu").is(":visible")) CABLES.contextMenu.close();
        // else if(gui.find().isVisible()) gui.find().close();
        // else if($('#library').is(':visible')) CABLES.UI.fileSelect.hide();
        else if ($("#sidebar").is(":visible")) $("#sidebar").animate({
            "width": "toggle"
        }, 200);
        else if ($(".easingselect").is(":visible")) $(".easingselect").hide();
        else if (vueStore.getters["sidebar/sidebarCustomizerVisible"]) vueStore.commit("sidebar/setCustomizerVisible", false);
        else if (CABLES.UI.MODAL._visible)
        {
            CABLES.UI.MODAL.hide(true);
            CABLES.UI.MODAL.hide();
            if (showingEditor)
            {
                console.log("focus editor ");
                self.editor().focus();
            }
        }
        else if (this.maintabPanel.isVisible()) this.maintabPanel.hide();
        else if (showingEditor) this.closeEditor();
        else
        {
            if (e) gui.opSelect().show({
                "x": 0,
                "y": 0
            });
        }
    };


    this.showOpCrash = function (op)
    {
        iziToast.error({
            "position": "topRight",
            "theme": "dark",
            "title": "error",
            "message": "an operator has crashed",
            "progressBar": false,
            "animateInside": false,
            "close": true,
            "timeout": false,
            "buttons": [
                ["<button>reload</button>", function (instance, toast)
                {
                    CABLES.CMD.PATCH.reload();
                }]
            ]
        });
    };


    this.showUiElements = function ()
    {
        $("#cablescanvas").show();
        $("#loadingstatus").hide();
        $("#mainContainer").show();

        if (CABLES.UI.userSettings.get("showUIPerf") == true) CABLES.uiperf.show();
        if (CABLES.UI.userSettings.get("showMinimap") == true) CABLES.CMD.UI.showMinimap();
        self.patch().getViewBox().update();


        if (CABLES.UI.userSettings.get("glpatchview") == true) CABLES.CMD.DEBUG.glguiFull();


        this._elGlCanvas.hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.canvas);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });

        if (CABLES.UI.userSettings.get("presentationmode")) CABLES.CMD.UI.startPresentationMode();

        if (this._corePatch.cgl.aborted)
        {
            console.log("errror...");
            CABLES.UI.MODAL.showError("no webgl", "your browser does not support webgl");
            return;
        }

        if (CABLES.UI.userSettings.get("fileManagerOpened") == true) this.showFileManager();
        if (CABLES.UI.userSettings.get("timelineOpened") == true) this.showTiming();


        if (CABLES.UI.userSettings.get("showTipps") && CABLES.UI.userSettings.get("introCompleted")) CABLES.UI.tipps.show();

        console.groupCollapsed("welcome to cables!");
        console.log("start up times:");
        console.table(CABLESUILOADER.startup.log);
        console.groupEnd();

        document.getElementById("patch").focus();
    };

    this.showWelcomeNotifications = function ()
    {
        function show(html)
        {
            if (html && html.length > 0) CABLES.UI.MODAL.show(
                "<div style=\"min-height:30px;max-height:500px;overflow-y:scroll;\">" + html + "</div>" +
                "<center><a class=\"bluebutton\" onclick=\"CABLES.UI.MODAL.hide()\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a></center>"
            );
        }

        // if (this.project().users.indexOf(this.user.id) == -1 &&
        //     this.project().userId+''!=''+this.user.id ){
        //     iziToast.show({
        //         position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
        //         theme: 'dark',
        //         title: 'Not your patch',
        //         message: 'Feel free to play around tho!<br />You cannot overwrite the patch, use «save as» in the menu bar instead.',
        //         progressBar: false,
        //         animateInside: false,
        //         close: true,
        //         timeout: false
        //     });
        // }

        if (CABLES.sandbox.showBrowserWarning) CABLES.sandbox.showBrowserWarning();
        if (CABLES.sandbox.showStartupChangelog) CABLES.sandbox.showStartupChangelog();
    };


    // this.importJson3D = function(id) {
    //     CABLES.api.get('json3dimport/' + id,
    //         function(data) {
    //             console.log('data', data);
    //         }
    //     );
    // };
    // var infoTimeout = -1;

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

    this.getOpDoc = function (opname, html, cb)
    {
        cb(this.opDocs.get2(opname));
    };


    // this.liveRecord = function() {
    //     $('#glcanvas').attr('width', parseFloat($('#render_width').val()));
    //     $('#glcanvas').attr('height', parseFloat($('#render_height').val()));

    //     if (!CABLES.UI.capturer) {
    //         $('#liveRecordButton').html("Stop Live Recording");
    //         CABLES.UI.capturer = new CCapture({
    //             format: 'gif',
    //             // format: 'webm',
    //             // quality:77,
    //             workersPath: '/ui/js/gifjs/',
    //             framerate: parseFloat($('#render_fps').val()),
    //             display: true,
    //             verbose: true
    //         });

    //         CABLES.UI.capturer.start(this._corePatch.cgl.canvas);
    //     } else {
    //         $('#liveRecordButton').html("Start Live Recording");
    //         CABLES.UI.capturer.stop();
    //         CABLES.UI.capturer.save();
    //         var oldCap = CABLES.UI.capturer;
    //         CABLES.UI.capturer = null;
    //     }

    // };


    // this.showProfiler = function() {
    //     if (!self.profiler) self.profiler = new CABLES.UI.Profiler();
    //     self.profiler.show();
    // };

    this.showMetaPaco = function ()
    {
        this.metaPaco.show();
    };

    this.metaCode = function ()
    {
        return metaCode;
    };


    this.showSettings = function ()
    {
        window.onmessage = function (e)
        {
            const c = e.data.split(":");
            if (c[0] == "projectname") gui.setProjectName(c[1]);
            if (c[0] == "notify") CABLES.UI.notify(c[1]);
            if (c[0] == "notifyerror") CABLES.UI.notifyError(c[1]);
            if (c[0] == "cmd" && c[1] == "saveproject") this.patch().saveCurrentProject();
        }.bind(this);

        const url = CABLES.sandbox.getCablesUrl() + "/patch/" + self.project()._id + "/settingsiframe";
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true });
    };

    // this.showOpDoc = function(opname) {
    //     this.getOpDoc(opname, true, function(html)
    //     {
    //         var doclink = '<div><a href="/op/' + opname + '" class="button ">view documentation</a>&nbsp;<br/><br/>';
    //         $('#meta_content_doc').html(html+doclink);
    //     });
    // };

    this.setWorking = function (active, where)
    {
        if (active)
        {
            let posX = 0;
            let posY = 0;
            let r = null;
            if (where == "patch") r = document.getElementById("patch").getBoundingClientRect();
            else if (where == "canvas")
            {
                r = document.getElementById("cablescanvas").getBoundingClientRect();
                this._elGlCanvas.css({ "opacity": 0.7 });
            }
            else r = document.body.getBoundingClientRect();

            posX = r.width / 2 + r.left;
            posY = r.height / 2 + r.top;

            $(".workingindicator").css(
                {
                    "left": posX,
                    "top": posY,
                    "display": "block"
                });
        }
        else
        {
            if (where == "canvas") this._elGlCanvas.css({ "opacity": 1 });
            $(".workingindicator").hide();
        }
    };

    this._cursor = "";
    this.setCursor = function (str)
    {
        if (!str)str = "auto";
        document.body.classList.remove("cursor_" + this._cursor);
        document.body.classList.add("cursor_" + str);
        this._cursor = str;
    };


    this.getSavedState = function ()
    {
        return savedState;
    };

    this.setTransformGizmo = function (params)
    {
        if (!this._gizmo) this._gizmo = new CABLES.Gizmo(this.scene().cgl);
        if (!CABLES.UI.userSettings.get("toggleHelperCurrentTransforms"))
        {
            this._gizmo.set(null);
            return;
        }

        this._gizmo.set(params);
    };


    this.transformOverlay = function ()
    {
        return this._transformOverlay;
    };

    this.setTransform = function (id, x, y, z)
    {
        this._transformOverlay.add(this.scene().cgl, id, x, y, z);
    };


    this.setElementBgPattern = function (ele)
    {
        if (!ele) return;
        ele.classList.remove("bgPatternDark");
        ele.classList.remove("bgPatternBright");
        ele.classList.remove("bgPatternBlack");
        ele.classList.remove("bgPatternWhite");
        ele.classList.remove("bgPatternRed");
        ele.classList.remove("bgPatternGrey");
        ele.classList.remove("bgPatternBlue");

        ele.classList.add(CABLES.UI.userSettings.get("bgpattern") || "bgPatternDark");
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


    this.notIdling = function ()
    {
        this.lastNotIdle = CABLES.now();
    };

    this.checkIdle = function ()
    {
        const idling = (CABLES.now() - self.lastNotIdle) / 1000;
        if (idling > 30 * 60)
        {
            console.log("idle mode simpleio disconnected!");
        }
        else
        {
            setTimeout(gui.checkIdle, 1000 * 60 * 2);
        }
    };

    // this.setMetaTab = function(which) {
    //     CABLES.UI.userSettings.set("metatab", which);

    //     $('.meta_content').hide();
    //     $('#metatabs a').removeClass('active');
    //     $('#metatabs .tab_' + which).addClass('active');
    //     $('#meta_content_' + which).show();

    //     // if (which == 'code') self.showMetaCode();
    //     if (which == 'keyframes') self.metaKeyframes.show();
    //     if (which == 'paco') self.showMetaPaco();
    //     // if (which == 'profiler') self.showProfiler();
    //     // if (which == 'variables') self.variables.show();
    //     if (which == 'preview') this.metaTexturePreviewer.show();
    //     else if (this.metaTexturePreviewer) this.metaTexturePreviewer.hide();
    // };

    this.startPacoSender = function ()
    {
        this.patchConnection.connectors.push(new CABLES.PatchConnectorSocketIO());
    };

    this.startPacoReceiver = function ()
    {
        this.patch().scene.clear();

        const conn = new CABLES.PatchConnectionReceiver(
            this.patch().scene, {},
            new CABLES.PatchConnectorSocketIO()
        );
    };

    this.setStateUnsaved = function ()
    {
        if (savedState)
        {
            let title = "";
            if (CABLES.sandbox.isDevEnv())title = "DEV ";
            title += gui.patch().getCurrentProject().name + " *";
            document.title = title;

            favIconLink.href = "/favicon/favicon_orange.ico";
            savedState = false;

            $("#patchname").addClass("warning");

            window.onbeforeunload = function (event)
            {
                const message = "unsaved content!";
                if (typeof event == "undefined")
                {
                    event = window.event;
                }
                if (event)
                {
                    event.returnValue = message;
                }
                return message;
            };
        }
    };

    this.closeInfo = function ()
    {
        this.infoHeight = 0;
        this.setLayout();
    };

    this.reloadDocs = function (cb)
    {
        gui.opDocs = new CABLES.UI.OpDocs(cb);
    };

    this.setStateSaved = function ()
    {
        savedState = true;
        favIconLink.href = "/favicon/favicon.ico";
        $("#patchname").removeClass("warning");

        let title = "";
        if (CABLES.sandbox.isDevEnv())title = "DEV ";
        title += gui.patch().getCurrentProject().name;
        document.title = title;
        window.onbeforeunload = function ()
        {
            gui.patchConnection.send(CABLES.PACO_CLEAR);
        };
    };


    this._timeoutPauseProfiler = null;

    this.pauseProfiling = function ()
    {
        CGL.profileData.pause = true;

        clearTimeout(this._timeoutPauseProfiler);
        this._timeoutPauseProfiler = setTimeout(function ()
        {
            CGL.profileData.pause = false;
        }, 200);
    };

    this.updateCanvasIconBar = function ()
    {
        if (!this._elCanvasIconbar) return;

        this._elCanvasIconbar.css({
            "width": document.body.getBoundingClientRect().width - this._elSplitterPatch.get()[0].getBoundingClientRect().width,
            "left": this._elSplitterPatch.get()[0].getBoundingClientRect().left,
            "top": this.rendererHeight * this._corePatch.cgl.canvasScale + 1,
        });
    };

    this.getCanvasSizeString = function (cgl)
    {
        let sizeStr = "<a class=\"button-small\" onclick=\"CABLES.CMD.RENDERER.changeSize()\" > Size " + cgl.canvasWidth + "x" + cgl.canvasHeight + "</a>";
        sizeStr += "<a class=\"button-small\" onclick=\"gui.rendererAspectMenu(this)\">Aspect</a>";
        if (cgl.canvasScale != 1)sizeStr += " Scale " + cgl.canvasScale + " ";
        if (cgl.pixelDensity != 1)sizeStr += " (" + (cgl.canvasWidth / cgl.pixelDensity) + "x" + (cgl.canvasHeight / cgl.pixelDensity) + "x" + cgl.pixelDensity + ")";


        const zoom = Math.round(window.devicePixelRatio * 100);
        if (zoom != 100)sizeStr += " Zoom " + zoom + "%";

        return sizeStr;
    };

    this.showCanvasModal = function (_show)
    {
        if (!this._elCanvasIconbar) return;
        if (_show)
        {
            $("#canvasmodal").show();
            this._elCanvasIconbar.show();
            this._elCanvasIconbar.css({ "opacity": 1 });
            const cgl = this._corePatch.cgl;
            this.updateCanvasIconBar();

            // var sizeStr='size: '+cgl.canvasWidth+' x '+cgl.canvasHeight;
            // if(cgl.canvasScale!=1)sizeStr+=' (scale: '+cgl.canvasScale+') '
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString(cgl);
        }
        else
        {
            this._elCanvasIconbar.hide();
            $("#canvasmodal").hide();
        }
    };

    this.init = function (next)
    {
        // if(CABLES.UI.userSettings.get("editorMinimized"))gui._ignoreOpenEditor=true;
        $("#infoArea").show();

        $("#infoArea").hover(
            function (e)
            {
                CABLES.UI.showInfo();
            }, function ()
            {
                CABLES.UI.hideInfo();
            });

        $("#canvasmodal").on("mousedown",
            function (e)
            {
                gui.patch().lastMouseMoveEvent = null;
                gui.showCanvasModal(false);
                $("#patch").focus();
                e.preventDefault();
            });

        _patch = new CABLES.UI.Patch(this);
        _patch.show(this._corePatch);
        this.patchView.setPatchRenderer("patch", _patch);

        $("#undev").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.undevLogo);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        $("#sidebar-menu").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.sidebarMenu);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        /* Tab pane on the right */
        // $('.tab_files').hover(function(e) {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_files);
        // }, function() {
        //     CABLES.UI.hideInfo();
        // });
        // $('.tab_profiler').hover(function(e) {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_profiler);
        // }, function() {
        //     CABLES.UI.hideInfo();
        // });
        // $('.tab_screen').hover(function(e) {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_screen);
        // }, function() {
        //     CABLES.UI.hideInfo();
        // });
        $(".download_screenshot").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.download_screenshot);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        $("#minimapContainer").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.minimapContainer);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        $("#project_settings_btn").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.project_settings_btn);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        $("#timelineui").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.timelineui);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        $(".op_background").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.op_background);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        gui.replaceNavShortcuts();
    };
};

CABLES.UI.GUI.prototype.setUser = function (u)
{
    gui.user = u;
    if (!this.user.isPro)
    {
        document.getElementById("nav_createBackup").remove();
        document.getElementById("nav_viewBackups").remove();
    }
};

CABLES.UI.GUI.prototype.updateTheme = function ()
{
    if (CABLES.UI.userSettings.get("theme-bright")) document.body.classList.add("bright");
    else document.body.classList.remove("bright");
};

// todo use eventtarget...
CABLES.UI.GUI.prototype.addEventListener = function (name, cb)
{
    this._eventListeners[name] = this._eventListeners[name] || [];
    this._eventListeners[name].push(cb);
};

// todo use eventtarget...
CABLES.UI.GUI.prototype.callEvent = function (name, params)
{
    if (this._eventListeners.hasOwnProperty(name))
    {
        for (const i in this._eventListeners[name])
        {
            this._eventListeners[name][i](params);
        }
    }
};

CABLES.UI.GUI.prototype.initCoreListeners = function ()
{
    // this._corePatch.on("onOpAdd",
    // function(op)
    // {
    //     if(op.objName.indexOf("Ops.User")==0)
    //     {
    //         console.log("jo shit!");
    //     }
    // });

    this._corePatch.on("exception", function (ex, op)
    {
        CABLES.UI.MODAL.showException(ex, op);
    });

    this._corePatch.on("exceptionOp", function (e, objName)
    {
        CABLES.UI.MODAL.showOpException(e, objName);
    });

    this._corePatch.on("criticalError", function (title, msg)
    {
        CABLES.UI.MODAL.showError(title, msg);
    });

    this._corePatch.on("renderDelayStart", function ()
    {
        $("#delayed").show();
    });

    this._corePatch.on("renderDelayEnd", function ()
    {
        $("#delayed").hide();
    });

    this._corePatch.on("performance", function (perf)
    {
        let str = " " + perf.fps + " FPS | " + perf.ms + " MS";
        if (gui.corePatch().cgl.glVersion == 1)str += " | WebGL 1";
        $("#canvasInfoFPS").html(str);
    });
};

function startUi(cfg)
{
    logStartup("Init UI");
    CABLES.UI.initHandleBarsHelper();

    window.gui = new CABLES.UI.GUI(cfg);

    incrementStartup();
    gui.serverOps = new CABLES.UI.ServerOps(gui, cfg.patchId, () =>
    {
        $("#patch").bind("contextmenu", function (e)
        {
            if (e.preventDefault) e.preventDefault();
        });

        gui.init();
        gui.checkIdle();
        gui.initCoreListeners();

        gui.bind(function ()
        {
            incrementStartup();
            CABLES.sandbox.initRouting(function ()
            {
                incrementStartup();
                gui.opDocs = new CABLES.UI.OpDocs(function ()
                {
                    CABLES.UI.userSettings.init();
                    incrementStartup();
                    $("#username").html(gui.user.usernameLowercase);
                    $("#delayed").hide();

                    gui.metaCode().init();
                    gui.metaDoc.init();
                    gui.opSelect().reload();
                    // gui.setMetaTab(CABLES.UI.userSettings.get("metatab") || 'doc');
                    gui.showWelcomeNotifications();
                    incrementStartup();
                    gui.showUiElements();
                    gui.setLayout();
                    gui.patch().fixTitlePositions();
                    gui.opSelect().prepare();
                    incrementStartup();
                    gui.opSelect().search();
                    gui.setElementBgPattern(ele.byId("cablescanvas"));


                    CABLES.UI.userSettings.addEventListener("onChange", function (key, v)
                    {
                        if (key == "bgpattern")
                        {
                            gui.setElementBgPattern(ele.byId("cablescanvas"));
                            gui.setElementBgPattern(ele.byId("bgpreview"));
                        }

                        if (key == "theme-bright")
                        {
                            gui.updateTheme();
                        }

                        if (key == "straightLines")
                        {
                            gui.patch().updateSubPatches();
                        }
                    });

                    if (!CABLES.UI.userSettings.get("introCompleted"))gui.introduction().showIntroduction();

                    CABLES.editorSession.open();
                    gui.bindKeys();

                    logStartup("finished loading cables");

                    if (window.module) module = window.module; // electronn workaround/fix

                    gui.socket.sendInfo(gui.user.username + " joined");
                    gui.socket.updateMembers();

                    CABLES.UI.loaded = true;
                });
            });
        });
    });


    // $('#cablescanvas').on("click", function(e)
    // {
    //     var isFocused = (document.activeElement === document.getElementById("#cablescanvas"));
    //     console.log("isFocused???!",isFocused);
    //     if(!isFocused) $('#glcanvas').focus();
    // });

    $("#glcanvas").on("focus",
        function ()
        {
            gui.showCanvasModal(true);
        });

    // $(document).on("click", '.panelhead',
    //     function(e)
    //     {
    //         var panelselector = $(this).data("panelselector");
    //         if (panelselector) {
    //             $(panelselector).toggle();

    //             if ($(panelselector).is(":visible")) {
    //                 $(this).addClass("opened");
    //                 $(this).removeClass("closed");
    //             } else {
    //                 $(this).addClass("closed");
    //                 $(this).removeClass("opened");
    //             }
    //         }
    //     });

    CABLES.watchPortVisualize.init();

    document.addEventListener("visibilitychange", function ()
    {
        if (!document.hidden)
        {
            gui.setLayout();
            gui.patchView.store.checkUpdated();
        }
    }, false);

    logStartup("Init UI done");
}
