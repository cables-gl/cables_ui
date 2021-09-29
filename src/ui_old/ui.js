CABLES.UI = CABLES.UI || {};
CABLES.UI.undo = new UndoManager();

CABLES.UI.GUI = function (cfg)
{
    CABLES.EventTarget.apply(this);

    const self = this;
    // this.log = new CABLES.UI.Logger();

    this._log = new CABLES.UI.Logger("gui");
    this.patchId = cfg.patchId;
    let showTiming = false;
    let showingEditor = false;

    this.keys = new CABLES.UI.KeyBindingsManager();
    this.opParams = new CABLES.UI.OpParampanel();
    this.socket = null;
    this.watchPortVisualizer = null;
    this.isRemoteClient = cfg.remoteClient;
    this.spaceBarStart = 0;

    this.CANVASMODE_NORMAL = 0;
    this.CANVASMODE_FULLSCREEN = 2;
    this.CANVASMODE_PATCHBG = 1;
    this._canvasMode = this.CANVASMODE_NORMAL;

    if (!cfg) cfg = {};
    if (!cfg.usersettings) cfg.usersettings = { "settings": {} };

    this._corePatch = CABLES.patch = new CABLES.Patch({
        "editorMode": true,
        "canvas":
        {
            "forceWebGl1": cfg.usersettings.settings.forceWebGl1 === true || cfg.usersettings.settings.forceWebGl1 === "true",
            "alpha": true,
            "premultipliedAlpha": true,
        },
        "variables":
        {
        }
    });

    let patchLoadEndiD = this._corePatch.on("patchLoadEnd",
        () =>
        {
            this._corePatch.off(patchLoadEndiD);
            this.setStateSaved();

            logStartup("Patch loaded");
        });

    this._corePatch.on("opcrash", (portTriggered) =>
    {
        this.showOpCrash(portTriggered.parent);
    });

    this.patchView = new CABLES.UI.PatchView(this._corePatch);

    this._corePatch.gui = true;
    let _patch = null;

    const _jobs = new CABLES.UI.Jobs();
    this.cmdPallet = new CABLES.UI.CommandPallete();
    const _opselect = new CABLES.UI.OpSelect();
    this.introduction = new CABLES.UI.Introduction();
    this._gizmo = null;
    this._transformOverlay = new CABLES.UI.TransformsOverlay();

    this.patchConnection = new CABLES.PatchConnectionSender(this._corePatch);
    this.opDocs = null;
    this.opHistory = new CABLES.UI.OpHistory();

    this.mainTabs = new CABLES.UI.TabPanel("maintabs");
    this.maintabPanel = new CABLES.UI.MainTabPanel(this.mainTabs);

    this.chat = null;

    this.metaTabs = new CABLES.UI.TabPanel("metatabpanel");
    this._savedState = true;


    this.metaOpParams = new CABLES.UI.MetaOpParams(this.metaTabs);

    this.metaDoc = new CABLES.UI.MetaDoc(this.metaTabs);
    const metaCode = new CABLES.UI.MetaCode(this.metaTabs);
    this.metaTexturePreviewer = new CABLES.UI.TexturePreviewer(this.metaTabs, this._corePatch.cgl);

    this.metaKeyframes = new CABLES.UI.MetaKeyframes(this.metaTabs);
    // this.variables = new CABLES.UI.MetaVars(this.metaTabs);
    // this.metaPaco = new CABLES.UI.Paco(this.metaTabs);
    this.bookmarks = new CABLES.UI.Bookmarks();
    this.history = new CABLES.UI.MetaHistory(this.metaTabs);

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

    this._currentProject = null;

    this.tipps = new CABLES.UI.Tipps();


    this.project = function ()
    {
        return this._currentProject;
        // return this.project;
    };

    this.setProject = function (p)
    {
        this._currentProject = p;
        $(".viewProjectLink").attr("href", CABLES.sandbox.getCablesUrl() + "/p/" + p._id);
    };

    this.opSelect = function ()
    {
        return _opselect;
    };

    this.timeLine = function ()
    {
        // if (!this._timeline) this._timeLine = new CABLES.TL.UI.TimeLineUI();
        return this._timeLine;
    };

    this.corePatch = this.scene = function ()
    {
        return this._corePatch;
    };

    this.patch = function ()
    {
        return _patch;
    };

    this.jobs = function ()
    {
        return _jobs;
    };

    this.finishedLoading = function ()
    {
        return CABLES.UI.loaded;
    };

    this.focusFindResult = (idx, opid, subpatch, x, y) =>
    {
        if (gui.keys.shiftKey)
        {
            gui.opParams.show(opid);
        }
        else
        {
            this.patchView.setCurrentSubPatch(subpatch, () =>
            {
                this.patchView.focus();
                this.patchView.focusOp(opid);
                this.patchView.centerSelectOp(opid);
            });
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


    this.showGuestWarning = function ()
    {
        if (gui.isGuestEditor())
        {
            CABLES.UI.MODAL.showError("Demo Editor", CABLES.UI.TEXTS.guestHint +
            "<br/><br/><a href=\"" + CABLES.sandbox.getCablesUrl() + "/signup\" target=\"_blank\" class=\"bluebutton\">Sign up</a> <a onclick=\"gui.pressedEscape();\" target=\"_blank\" class=\"greybutton\">Close</a>"
            );
            return true;
        }
    };

    this.isGuestEditor = function ()
    {
        return this.user.username == "guest";
    };

    this.infoHeight = 200;
    this.timingHeight = 250;
    this.rendererWidth = 640;
    this.rendererHeight = 360;


    this.editorWidth = CABLES.UI.userSettings.get("editorWidth") || 350;
    this.updateTheme();

    this.getParamPanelEleId = function ()
    {
        let eleId = "options";
        if (!gui.showTwoMetaPanels()) eleId = "options_meta";
        return eleId;
    };

    this.showTwoMetaPanels = function ()
    {
        let r = true;
        if (this.rendererWidth < 700) r = false;

        const haschanged = this._showingtwoMetaPanel != r;
        this._showingtwoMetaPanel = r;

        if (haschanged)
            this.metaOpParams.updateVisibility(r);

        return r;
    };


    this.watchArray = function (opid, which)
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op)
        {
            this._warn("opid not found:", opid);
            return;
        }
        const port = op.getPort(which);
        if (!port)
        {
            this._warn("port not found:", which);
        }

        // if (port.type == 2)
        // new CABLES.UI.WatchTextureSpreadsheetTab(gui.mainTabs, op, port, {});
        // else
        new CABLES.UI.WatchArrayTab(gui.mainTabs, op, port, {});
    };

    this.setLayout = function ()
    {
        this.pauseProfiling();
        const perf = CABLES.UI.uiProfiler.start("gui.setlayout");
        this._elCanvasIconbarContainer = this._elCanvasIconbarContainer || ele.byId("canvasicons");
        this._elCanvasIconbar = this._elCanvasIconbar || ele.byId("canvasIconBar");


        this._elAceEditor = this._elAceEditor || $("#ace_editors");
        this._elSplitterPatch = this._elSplitterPatch || $("#splitterPatch");
        this._elSplitterRenderer = this._elSplitterRenderer || $("#splitterRenderer");

        this._elIconbarLeft = document.getElementById("iconbar_sidebar_left");

        this.patchView.updateBoundingRect();

        this._elPatch = this.patchView.element;
        this._elBgPreview = ele.byId("bgpreview");
        this._elBgPreviewButtonContainer = ele.byId("bgpreviewButtonsContainer");

        this._elOptions = this._elOptions || document.getElementById("options");
        this._elMeta = this._elMeta || document.getElementById("meta");
        this._elMenubar = this._elMenubar || document.getElementById("menubar");
        this._elSplitterMeta = this._elSplitterMeta || $("#splitterMeta");
        this._elInforArea = this._elInforArea || $("#infoArea");
        this._elGlCanvas = this._elGlCanvas || $("#glcanvas");
        this._elGlCanvasDom = this._elGlCanvasDom || document.getElementById("glcanvas");


        this._elEditorBar = this._elEditorBar || $("#editorbar");
        // this._elIconBar = this._elIconBar || $("#icon-bar");

        this._elMaintab = this._elMaintab || document.getElementById("maintabs");
        this._elEditor = this._elEditor || document.getElementById("editor");
        this._elLibrary = this._elLibrary || document.getElementById("library");
        this._elCanvasInfoSize = this._elCanvasInfoSize || document.getElementById("canvasInfoSize");
        this._elSplitterMaintabs = this._elSplitterMaintabs || document.getElementById("splitterMaintabs");
        this._elEditorMinimized = this._elEditorMinimized || document.getElementById("editorminimized");
        this._elEditorMaximized = this._elEditorMaximized || document.getElementById("editormaximized");

        // this._elMiniMapContainer = this._elMiniMapContainer || document.getElementById("minimapContainer");
        // this._elMiniMap = this._elMiniMap || document.getElementById("minimap");
        this._elTLoverviewtimeline = this._elTLoverviewtimeline || document.getElementById("overviewtimeline");
        this._elTLtimelineTitle = this._elTLtimelineTitle || document.getElementById("timelineTitle");
        this._elTLkeycontrols = this._elTLkeycontrols || document.getElementById("keycontrols");
        this._elTLtimetimeline = this._elTLtimetimeline || document.getElementById("timetimeline");
        this._elTLsplitterTimeline = this._elTLsplitterTimeline || document.getElementById("splitterTimeline");

        this._elSubpatchNav = this._elSubpatchNav || document.getElementById("subpatch_nav");

        this._elCablesCanvas = this._elCablesCanvas || document.getElementById("cablescanvas");

        this._elGlUiPreviewLayer = this._elGlUiPreviewLayer || ele.byId("gluiPreviewLayer");


        // const iconBarnav_patch_saveasWidth = this._elIconBar.outerWidth();

        let timelineHeight = this.timingHeight;

        const iconBarWidth = 0;

        // if (CABLES.UI.userSettings.get("hideSizeBar"))
        // {
        //     iconBarWidth = 0;
        //     this._elIconBar.hide();
        // }
        // else
        // {
        //     this._elIconBar.show();
        // }

        let patchHeight = window.innerHeight - 2;

        if (this.isRemoteClient)
        {
            this._setCanvasMode(this.CANVASMODE_FULLSCREEN);
            this._elGlCanvas.addClass("maximized");
            this.rendererWidth = 0;
            showingEditor = false;
        }

        if (this.rendererWidth === undefined || this.rendererHeight === undefined)
        {
            this.rendererWidth = window.innerWidth * 0.4;
            this.rendererHeight = window.innerHeight * 0.25;
        }
        if (this._canvasMode == this.CANVASMODE_FULLSCREEN)
        {
            this.rendererWidth = window.innerWidth;
            this.rendererHeight = window.innerHeight;
        }


        this.rendererWidthScaled = this.rendererWidth * this._corePatch.cgl.canvasScale;
        this.rendererHeightScaled = this.rendererHeight * this._corePatch.cgl.canvasScale;

        this.rendererWidth = Math.floor(this.rendererWidth);
        this.rendererHeight = Math.floor(this.rendererHeight);

        let patchWidth = window.innerWidth - this.rendererWidthScaled;
        if (this._canvasMode == this.CANVASMODE_PATCHBG) patchWidth = window.innerWidth - this.rightPanelWidth;


        const cgl = this._corePatch.cgl;
        this.getCanvasSizeString(cgl);

        this.corePatch().pause();
        this.patchView.pause();
        clearTimeout(this.delayedResizeCanvas);
        this.delayedResizeCanvas = setTimeout(() =>
        {
            this._corePatch.cgl.updateSize();
            this.corePatch().resume();
            this.patchView.resume();
        }, 50);


        // document.getElementsByTagName("nav")[0].style["margin-left"] = iconBarWidth + "px";
        // this._elIconBar[0].style.width = iconBarWidth + "px";

        const menubarHeight = 0;
        const optionsWidth = Math.max(400, this.rendererWidthScaled / 2);

        let timelineUiHeight = 40;
        if (this.timeLine() && this.timeLine().hidden) timelineUiHeight = 0;

        const filesHeight = 0;
        const timedisplayheight = 25;


        if (showTiming)
        {
            patchHeight -= this.timingHeight;
        }
        else
        {
            patchHeight -= timelineUiHeight;
        }

        let editorWidth = self.editorWidth;
        if (editorWidth > patchWidth - 50) editorWidth = patchWidth - 50;

        const patchLeft = iconBarWidth;

        if (this.maintabPanel.isVisible())
        {
            const editorbarHeight = 767;
            const editorHeight = patchHeight - editorbarHeight;

            this._elMaintab.style.left = iconBarWidth + "px";
            this._elMaintab.style.top = 0 + "px";
            this._elMaintab.style.height = (editorHeight - 2) + "px";
            this._elMaintab.style.width = editorWidth + "px";


            this._elAceEditor.css("height", editorHeight);
            this._elSplitterMaintabs.style.display = "block";
            this._elSplitterMaintabs.style.left = editorWidth + iconBarWidth + "px";
            this._elSplitterMaintabs.style.height = patchHeight + 2 + "px";
            this._elSplitterMaintabs.style.width = 5 + "px";
            this._elSplitterMaintabs.style.top = menubarHeight + "px";

            this._elEditorMinimized.style.display = "none";
            this._elEditorMinimized.style.left = iconBarWidth + "px";
            // this._elEditorMinimized.style.top = subPatchNavPosY + "px";

            this._elEditorMaximized.style.display = "block";
            this._elEditorMaximized.style.left = editorWidth + iconBarWidth + 3 + "px";
            // this._elEditorMaximized.style.top = subPatchNavPosY + "px";

            this._elSubpatchNav.style.left = editorWidth + iconBarWidth + 15 + "px";

            gui.mainTabs.updateSize();
        }
        else
        {
            this._elEditorMaximized.style.display = "none";

            if (this.mainTabs.getNumTabs() > 0) this._elEditorMinimized.style.display = "block";
            else this._elEditorMinimized.style.display = "none";

            this._elSplitterMaintabs.style.display = "none";
            // this._elEditorMinimized.style.top = 80 + "px";

            this._elSubpatchNav.style.left = iconBarWidth + 15 + "px";
        }


        // menu bar top
        let menupos = 0;
        const minmaxButtonSize = 35;
        if (this.maintabPanel.isVisible()) menupos += editorWidth;
        if (this.mainTabs.getNumTabs() > 0) menupos += minmaxButtonSize;
        this._elMenubar.style.left = menupos + 10 + "px";
        const rMenuBar = this._elMenubar.getBoundingClientRect();
        document.getElementById("multiplayerbar").style.left = rMenuBar.x + rMenuBar.width + 10 + "px";

        // this._elSubpatchNav.style.width = patchWidth + "px";
        this._elSubpatchNav.style.left = menupos - 20 + "px";
        this._elSubpatchNav.style.top = 55 + "px";


        if (this.rendererWidth < 100) this.rendererWidth = 100;

        this.rightPanelWidth = this.rendererWidthScaled;
        if (this._canvasMode == this.CANVASMODE_PATCHBG) this.rightPanelWidth = this.splitpanePatchPos;

        this._elSplitterPatch.css("left", window.innerWidth - this.rightPanelWidth - 4);
        this._elSplitterPatch.css("height", patchHeight + timelineUiHeight + 2);
        this._elSplitterRenderer.css("top", this.rendererHeightScaled);
        this._elSplitterRenderer.css("width", this.rendererWidthScaled);

        this.patchView.setSize(patchLeft, menubarHeight, patchWidth, patchHeight);

        this._elPatch.style.height = patchHeight + "px";
        this._elPatch.style.width = patchWidth + "px";
        this._elPatch.style.top = 0 + "px";
        this._elPatch.style.left = patchLeft + "px";


        // if (showMiniMap)
        // {
        //     this._elMiniMapContainer.style.display = "block";
        //     this._elMiniMap.style.display = "block";

        //     this._elMiniMapContainer.style.left = patchLeft + patchWidth - CABLES.UI.uiConfig.miniMapWidth - 4 + "px";
        //     this._elMiniMapContainer.style.top = menubarHeight + patchHeight - CABLES.UI.uiConfig.miniMapHeight - 24 + "px";

        //     $("#minimapContainer .title_closed").hide();
        //     $("#minimapContainer .title_opened").show();
        // }
        // else
        // {
        //     this._elMiniMapContainer.style.display = "none";
        //     this._elMiniMap.style.display = "none";
        // }

        this._elLibrary.style.left = iconBarWidth + "px";
        this._elLibrary.style.width = window.innerWidth - this.rendererWidthScaled - iconBarWidth + "px";
        this._elLibrary.style.bottom = 0;

        const timelineWidth = window.innerWidth - this.rendererWidthScaled - 2 - iconBarWidth;


        if (this._elTLoverviewtimeline)
        {
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
                timelineHeight = 0;
                this._elTLoverviewtimeline.style.display = "none";
                this._elTLtimetimeline.style.display = "none";
                this._elTLkeycontrols.style.display = "none";
                this._elTLtimelineTitle.style.display = "none";
                this._elTLsplitterTimeline.style.display = "none";

                $("#timeline svg").hide();
                $("#timing").css("height", timelineUiHeight);
                $("#splitterTimeline").hide();
            }
        }

        if (this.timeLine()) this.timeLine().updateViewBox();


        this._elCanvasIconbarBottom = this._elCanvasIconbarBottom || ele.byId("iconbar_sidebar_bottom");
        if (this._elCanvasIconbarBottom)
        {
            this._elCanvasIconbarBottom.style.right = this.rendererWidth + 20 + "px";
            this._elCanvasIconbarBottom.style.bottom = 10 + timelineHeight + "px";
        }


        this._elCanvasIconbarTimeline = this._elCanvasIconbarTimeline || ele.byId("iconbar_sidebar_timeline");
        if (this._elCanvasIconbarTimeline)
        {
            this._elCanvasIconbarTimeline.style.left = (patchWidth / 2) + "px";
            this._elCanvasIconbarTimeline.style.bottom = 10 + timelineHeight + "px";

            if (!showTiming) this._elCanvasIconbarTimeline.style.display = "none";
            else this._elCanvasIconbarTimeline.style.display = "inline-block";
        }


        $("#splitterTimeline").css("width", timelineWidth);
        $("#delayed").css("left", window.innerWidth - this.rendererWidth + 10);

        if (this._elIconbarLeft)
        {
            if (CABLES.UI.userSettings.get("hideSizeBar"))
            {
                this._elIconbarLeft.style.display = "none";
            }
            else
            {
                this._elIconbarLeft.style.display = "block";
                this._elIconbarLeft.style.bottom = 10 + timelineHeight + "px";

                if (this.maintabPanel.isVisible()) this._elIconbarLeft.style.left = editorWidth + 20 + "px";
                else this._elIconbarLeft.style.left = 10 + "px";
            }
        }

        let metaWidth;


        if (this.showTwoMetaPanels())
        {
            metaWidth = this.rightPanelWidth - optionsWidth + 1;

            this._elOptions.style.left = window.innerWidth - this.rightPanelWidth - 1 + "px";
            this._elOptions.style.top = self.rendererHeightScaled + "px";
            this._elOptions.style.width = optionsWidth + "px";
            this._elOptions.style.height = window.innerHeight - self.rendererHeightScaled + "px";

            this._elMeta.style.right = 0 + "px";
            this._elMeta.style.top = self.rendererHeightScaled + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - self.rendererHeightScaled + "px";

            this._elOptions.style.display = "block";
        }
        else
        {
            metaWidth = this.rightPanelWidth;
            this._elMeta.style.right = 0 + "px";

            this._elMeta.style.top = self.rendererHeightScaled + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - self.rendererHeightScaled + "px";

            this._elOptions.style.width = 0 + "px";
            this._elOptions.style.height = 0 + "px";
            this._elOptions.style.display = "none";
        }

        this._elSplitterMeta.css("bottom", self.infoHeight + "px");
        this._elSplitterMeta.css("width", metaWidth - 28 + "px");

        this._elMenubar.style.top = 0 + "px";
        // this._elMenubar.style.height = menubarHeight + "px";

        if (self.infoHeight === 0)
        {
            this._elInforArea.hide();
            $("#splitterMeta").hide();

            document.getElementById("infoAreaMin").style.width = (metaWidth - 20) + "px";
            document.getElementById("infoAreaMin").classList.remove("hidden");
        }
        else
        {
            document.getElementById("infoAreaMin").classList.add("hidden");

            $("#splitterMeta").show();
            this._elInforArea.show();
            this._elInforArea.css("width", (metaWidth - 20) + "px");
            this._elInforArea.css("height", (self.infoHeight) + "px");
            this._elInforArea.css("top", (window.innerHeight - self.rendererHeight - self.infoHeight) + "px");
        }

        $("#metatabpanel .contentcontainer").css("height", window.innerHeight - self.rendererHeightScaled - self.infoHeight - 50);
        $("#maintabs").css("top", menubarHeight);
        $("#maintabs").css("height", window.innerHeight - menubarHeight - timelineHeight);
        $("#maintabs .contentcontainer").css("height", window.innerHeight - menubarHeight - timelineHeight - 50);


        if (this._canvasMode == this.CANVASMODE_FULLSCREEN)
        {
            this._elCablesCanvas.style.left = 0 + "px";
            this._elCablesCanvas.style.right = "initial";

            this._elCablesCanvas.style.width = this._elGlCanvasDom.style.width = window.innerWidth + "px";
            this._elCablesCanvas.style.height = this._elGlCanvasDom.style.height = window.innerHeight + "px";

            this._elGlCanvas.attr("width", window.innerWidth);
            this._elGlCanvas.attr("height", window.innerHeight);

            this._elCablesCanvas.style["z-index"] = 40;
        }
        else if (this._canvasMode == this.CANVASMODE_PATCHBG)
        {
            this._elGlCanvasDom.style.width = this._elPatch.style.width;
            this._elGlCanvasDom.style.height = this._elPatch.style.height;

            this._elCablesCanvas.style.left = iconBarWidth + "px";
            this._elCablesCanvas.style.right = "initial";
            this._elCablesCanvas.style.top = "0px";
            this._elCablesCanvas.style.width = this._elGlCanvasDom.style.width;
            this._elCablesCanvas.style.height = this._elGlCanvasDom.style.height;
            this._elCablesCanvas.style["z-index"] = 1;
        }
        if (this._canvasMode == this.CANVASMODE_NORMAL)
        {
            const density = this._corePatch.cgl.pixelDensity;

            this._elCablesCanvas.style["z-index"] = 10;

            this._elGlCanvas.attr("width", this.rendererWidth * density);
            this._elGlCanvas.attr("height", self.rendererHeight * density);
            this._elGlCanvas.css("width", this.rendererWidth);
            this._elGlCanvas.css("height", self.rendererHeight);
            this._elCablesCanvas.style.width = this.rendererWidth + "px";
            this._elCablesCanvas.style.height = self.rendererHeight + "px";
            this._elCablesCanvas.style.right = "0px";
            this._elCablesCanvas.style.left = "initial";

            this._elCablesCanvas.style["transform-origin"] = "top right";
            this._elCablesCanvas.style.transform = "scale(" + this._corePatch.cgl.canvasScale + ")";
        }


        document.getElementById("canvasflash").style.width = this.rendererWidth + "px";
        document.getElementById("canvasflash").style.height = this.rendererHeight + "px";
        document.getElementById("canvasflash").style.right = 0 + "px";
        document.getElementById("canvasflash").style.top = 0 + "px";


        this._elBgPreview.style.right = this.rightPanelWidth + "px";
        this._elBgPreview.style.top = menubarHeight + "px";

        this._elBgPreviewButtonContainer.style.right = this.rightPanelWidth + "px";

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

    this._setCanvasMode = function (m)
    {
        this._canvasMode = m;
        this.emitEvent("canvasModeChange", m);
    };

    this._switchCanvasSizeNormal = function ()
    {
        this._setCanvasMode(this.CANVASMODE_NORMAL);
        this.rendererWidth = this._oldCanvasWidth;
        this.rendererHeight = this._oldCanvasHeight;
    };

    this.getCanvasMode = function ()
    {
        return this._canvasMode;
    };

    this.cyclePatchBg = function ()
    {
        if (this._canvasMode == this.CANVASMODE_FULLSCREEN) this.cycleFullscreen();

        if (this._canvasMode == this.CANVASMODE_NORMAL)
        {
            this._oldCanvasWidth = this.rendererWidth;
            this._oldCanvasHeight = this.rendererHeight;
            this.rightPanelWidth = this.rendererWidth;

            this._setCanvasMode(this.CANVASMODE_PATCHBG);
            this.rendererHeight = 100;
            this.rightPanelWidth = this._oldCanvasWidth;
        }
        else
        {
            this._switchCanvasSizeNormal();
        }

        this.setLayout();
        this.showCanvasModal(false);
    };

    this.cycleFullscreen = function ()
    {
        if (this._canvasMode == this.CANVASMODE_FULLSCREEN)
        {
            this._setCanvasMode(this.CANVASMODE_NORMAL);
            this.rendererWidth = this._oldCanvasWidth;
            this.rendererHeight = this._oldCanvasHeight;
        }
        else
        {
            this._oldCanvasWidth = this.rendererWidth;
            this._oldCanvasHeight = this.rendererHeight;
            this.rightPanelWidth = this.rendererWidth;
            this._setCanvasMode(this.CANVASMODE_FULLSCREEN);

            if (!this.notifiedFullscreen)CABLES.UI.notify("press escape to exit fullscreen mode");
            this.notifiedFullscreen = true;
        }

        this.showCanvasModal(false);
        this.setLayout();
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

    // this.showMiniMap = function ()
    // {
    //     showMiniMap = true;
    //     self.setLayout();
    // };

    // this.hideMiniMap = function ()
    // {
    //     showMiniMap = false;
    //     self.setLayout();
    // };

    this.isShowingTiming = function ()
    {
        return showTiming;
    };

    this.showTiming = function ()
    {
        showTiming = true;
        this.timeLine().show();
        this.setLayout();
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
    };

    this.showLoadingProgress = function (show)
    {
        if (show)
        {
            // document.getElementById("nav-logo_idle").style.opacity = 0.3;

            document.getElementById("nav-logo_idle").classList.add("logoFadeout");
            document.getElementById("nav-logo_idle").classList.remove("logoFadein");


            document.getElementById("nav-loading").classList.remove("hidden");
        }
        else
        {
            setTimeout(() =>
            {
                document.getElementById("nav-logo_idle").classList.remove("logoFadeout");
                document.getElementById("nav-logo_idle").classList.add("logoFadein");
                document.getElementById("nav-loading").classList.add("hidden");
            }, 250);
        }
    };

    this.hideTiming = function ()
    {
        gui.timeLine().hidden = true;
        showTiming = false;
        $("#timing").hide();
        gui.setLayout();
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
    };

    this.toggleTiming = function ()
    {
        gui.timeLine().hidden = false;
        $("#timing").show();
        CABLES.UI.userSettings.set("timelineOpened", true);

        showTiming = !showTiming;
        updateTimingIcon();
        this.setLayout();
        gui.timeLine().redraw();
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

    this.showFileSelect = function (inputId, filterType, opid, previewId)
    {
        this.showFileManager(() =>
        {
            const portInputEle = document.querySelector(inputId);
            if (!portInputEle)
            {
                this._log.warn("[showfileselect] no portInputEle");
                return;
            }
            const fn = portInputEle.value;

            this.fileManager.setFilterType(filterType);
            this.fileManager.setFilePort(portInputEle, gui.corePatch().getOpById(opid), ele.byId(previewId));
            this.fileManager.selectFile(fn);
        });
    };

    this.setProjectName = function (name)
    {
        console.log("setProjectName", name);
        if (name && name !== "undefined")
        {
            document.getElementById("patchname").innerHTML = name;
            document.getElementById("patchname").dataset.patchname = name;
            gui.corePatch().name = name;
        }
    };

    this.createProject = function ()
    {
        if (gui.showGuestWarning()) return;

        CABLES.UI.MODAL.prompt(
            "New Project",
            "Enter a name for your new Project",
            "My new Project",
            function (name)
            {
                if (name)
                    CABLESUILOADER.talkerAPI.send("newPatch", { "name": name }, function (err, d)
                    {
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
        const html = CABLES.UI.getHandleBarHtml(
            "params_file", {
                file,
                fileId,
                "projectId": this.patchId
            });

        $("#options").html(html);
    };


    this.serializeForm = function (selector)
    {
        const json = {};
        Array.from(document.querySelector(selector).elements).forEach((e) =>
        {
            json[e.getAttribute("name")] = e.value;
        });
        return json;
    };

    this.converterStart = function (projectId, fileId, converterId)
    {
        $("#converterprogress").show();
        $("#converterform").hide();

        CABLESUILOADER.talkerAPI.send("fileConvert",
            {
                "fileId": fileId,
                "converterId": converterId,
                "options": this.serializeForm("#converterform")
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

        ele.byId("nav_cmdplt").addEventListener("click", (event) => { gui.cmdPallet.show(); });
        ele.byId("nav_search").addEventListener("click", (event) => { gui.find(""); });

        ele.byId("nav_createBackup").addEventListener("click", (event) => { CABLES.CMD.PATCH.createBackup(); });
        ele.byId("nav_viewBackups").addEventListener("click", (event) => { CABLES.CMD.PATCH.showBackups(); });
        ele.byId("nav_cablesweb").addEventListener("click", (event) => { const win = window.open(CABLES.sandbox.getCablesUrl(), "_blank"); win.focus(); });

        document.querySelectorAll(".nav_create_from_template").forEach((el) =>
        {
            const href = el.dataset.href;
            el.addEventListener("click", () =>
            {
                const win = window.open(CABLES.sandbox.getCablesUrl() + href, "_blank");
                win.focus();
            });
        });

        ele.byId("nav_preferences").addEventListener("click", () => { CABLES.CMD.UI.showPreferences(); });
        ele.byId("button_toggleTiming").addEventListener("click", () => { gui.toggleTiming(); });
        ele.byId("nav_viewProjectLink").addEventListener("click", () =>
        {
            const url = $(".viewProjectLink").attr("href");
            const win = window.open(url, "_blank");
            win.focus();
        });

        ele.byId("nav_patch_save").addEventListener("click", (event) => { CABLES.CMD.PATCH.save(); });
        ele.byId("nav_patch_saveas").addEventListener("click", (event) => { CABLES.CMD.PATCH.saveAs(); });
        ele.byId("nav_patch_export").addEventListener("click", (event) => { CABLES.CMD.PATCH.export(); });


        ele.byId("nav_patch_new").addEventListener("click", (event) => { CABLES.CMD.PATCH.newPatch(); });
        ele.byId("nav_uploadfile").addEventListener("click", CABLES.CMD.PATCH.uploadFileDialog);
        ele.byId("nav_changelog").addEventListener("click", CABLES.CMD.UI.showChangelog);

        // --- Help menu
        // Documentation

        ele.byId("nav_help_keys").addEventListener("click", (event) => { CABLES.CMD.UI.showKeys(); });
        ele.byId("nav_help_documentation").addEventListener("click", (event) => { window.open("https://docs.cables.gl", "_blank"); });
        ele.byId("nav_help_forum").addEventListener("click", (event) => { window.open("https://forum.cables.gl", "_blank"); });
        ele.byId("nav_help_tipps").addEventListener("click", (event) => { gui.tipps.show(); });

        // Introduction
        ele.byId("nav_help_introduction").addEventListener("click", (event) => { gui.introduction.showIntroduction(); });
        ele.byId("nav_help_video").addEventListener("click", (event) => { const win = window.open("https://www.youtube.com/cablesgl", "_blank"); win.focus(); });


        $(".nav_op_addOp").bind("click", function (event)
        {
            CABLES.CMD.PATCH.addOp();
        });

        ele.byId("nav_op_createOp").addEventListener("click", (event) => { gui.serverOps.createDialog(); });
        ele.byId("nav_filemanager").addEventListener("click", (event) => { gui.showFileManager(); });


        ele.byId("nav_timeline").addEventListener("click", (event) =>
        {
            CABLES.CMD.TIMELINE.toggleTimeline();
        });

        ele.byId("nav_profiler").addEventListener("click", (event) => { new CABLES.UI.Profiler(gui.mainTabs); gui.maintabPanel.show(); });

        window.addEventListener("resize", () =>
        {
            this.showCanvasModal(false);
            const eleCanvas = ele.byId("glcanvas");
            if (eleCanvas)eleCanvas.blur();
            this.setLayout();
            // this.patch().getViewBox().update();
            this.mainTabs.emitEvent("resize");
        }, false);

        cb();
    };

    this.bindKeys = function ()
    {
        // opens editor for 1st string port found on an op with shift+e
        this.keys.key("e", "shift-e editor", "down", null, { "cmdCtrl": false, "shiftKey": true, "ignoreInput": true }, (e) =>
        {
            if (gui.patchView.getSelectedOps().length !== 1 || !gui.patchView.getSelectedOps()[0].portsIn.length) return;

            const selectedOp = gui.patchView.getSelectedOps();
            const selectedOpId = selectedOp[0].id;

            let portName = null;

            for (let i = 0; i < selectedOp[0].portsIn.length; i++)
            {
                const port = selectedOp[0].portsIn[i];
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

        this.keys.key(["Escape", "Tab"], "Open \"Op Create\" dialog (or close current dialog)", "down", null, { "ignoreInput": true }, (e) => { this.pressedEscape(e); });
        this.keys.key(["Escape"], "Toggle Tab Area", "down", null, { "altKey": true }, (e) => { this.maintabPanel.toggle(); this.setLayout(); });

        this.keys.key("p", "Open Command Palette", "down", null, { "cmdCtrl": true }, (e) => { this.cmdPallet.show(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true }, (e) => { this.cycleFullscreen(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) => { this.cyclePatchBg(); });

        this.keys.key("z", "undo", "down", null, { "ignoreInput": true, "cmdCtrl": true }, (e) => { CABLES.UI.undo.undo(); });
        this.keys.key("z", "redo", "down", null, { "ignoreInput": true, "cmdCtrl": true, "shiftKey": true }, (e) => { CABLES.UI.undo.redo(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            if (!$("#ace_editors textarea").is(":focus") && !CABLES.UI.MODAL.isVisible()) CABLES.CMD.UI.showSearch();
            else e.dontPreventDefault = true;
        });

        this.keys.key("s", "Save patch as new patch", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) => { gui.patchView.store.saveAs(); });
        this.keys.key("s", "Save patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            if (this.patchView.hasFocus())
            {
                CABLES.CMD.PATCH.save();
            }
            else
            if (gui.mainTabs.getSaveButton())
            {
                gui.mainTabs.getSaveButton().cb();
            }
            else
            {
                CABLES.CMD.PATCH.save();
            }
        });

        this.keys.key(" ", "Play/Pause timeline", "down", null, { "ignoreInput": true }, (e) => { if (gui.spaceBarStart === 0) gui.spaceBarStart = Date.now(); });

        this.keys.key(" ", "Timeline play/pause", "down", "timeline", { "ignoreInput": true }, (e) => { gui.timeLine().togglePlay(); });
    };

    this.pressedEscape = function (e)
    {
        this.showCanvasModal(false);
        this.emitEvent("pressedEscape");

        if (this.fileManager) this.fileManager.setFilePort(null);

        if (e && (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return;

        $(".tooltip").hide();

        if (this.rendererWidth * this._corePatch.cgl.canvasScale > window.innerWidth * 0.9)
        {
            if (this._canvasMode == this.CANVASMODE_FULLSCREEN)
            {
                this.cycleFullscreen();
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
            CABLES.UI.suggestions.close();
            CABLES.UI.suggestions = null;
        }
        else if ($("#cmdpalette").is(":visible")) gui.cmdPallet.close();
        else if ($(".contextmenu").is(":visible")) CABLES.contextMenu.close();
        else if ($("#sidebar").is(":visible")) $("#sidebar").animate({
            "width": "toggle"
        }, 200);
        else if (CABLES.UI.MODAL._visible)
        {
            CABLES.UI.MODAL.hide(true);
            CABLES.UI.MODAL.hide();
            if (showingEditor)
            {
                self.editor().focus();
            }
        }
        else if (this.maintabPanel.isVisible()) this.maintabPanel.hide();
        else if (showingEditor) this.closeEditor();
        else
        {
            if (e) gui.opSelect().show({
                "subPatch": this.patchView.getCurrentSubPatch(),
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
        document.getElementById("menubar").classList.remove("hidden");


        if (CABLES.UI.userSettings.get("showUIPerf") == true) CABLES.UI.uiProfiler.show();


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
            CABLES.UI.MODAL.showError("no webgl", "your browser does not support webgl");
            return;
        }

        if (CABLES.UI.userSettings.get("fileManagerOpened") == true) this.showFileManager();

        gui.iconBarLeft = new CABLES.UI.IconBar("sidebar_left");
        gui.iconBarPatchNav = new CABLES.UI.IconBar("sidebar_bottom");
        gui.iconBarTimeline = new CABLES.UI.IconBar("sidebar_timeline");


        if (CABLES.UI.userSettings.get("showTipps") && CABLES.UI.userSettings.get("introCompleted")) gui.tipps.show();

        const buildInfo = this.project().buildInfo;
        this._log.groupCollapsed("welcome to cables!");
        console.log("build info:");
        const buildInfoTable = [];
        const displayInfo = {
            "title": "cables",
            "host": null,
            "core": undefined,
            "ui": undefined,
            "core_branch": undefined,
            "core_git": undefined,
            "ui_branch": undefined,
            "ui_git": undefined
        };
        if (CABLESUILOADER.buildInfo.core)
        {
            displayInfo.core = CABLESUILOADER.buildInfo.core.created;
            displayInfo.core_branch = CABLESUILOADER.buildInfo.core.git.branch;
            displayInfo.core_git = CABLESUILOADER.buildInfo.core.git.commit;
        }
        if (CABLESUILOADER.buildInfo.ui)
        {
            displayInfo.ui = CABLESUILOADER.buildInfo.ui.created;
            displayInfo.ui_branch = CABLESUILOADER.buildInfo.ui.git.branch;
            displayInfo.ui_git = CABLESUILOADER.buildInfo.ui.git.commit;
        }
        buildInfoTable.push(displayInfo);
        if (buildInfo)
        {
            const infoRow = {
                "title": "project"
            };
            if (buildInfo.host)
            {
                infoRow.host = buildInfo.host;
            }
            if (buildInfo.core)
            {
                if (buildInfo.core.created)
                {
                    infoRow.core = buildInfo.core.created;
                }
                if (buildInfo.core.git)
                {
                    infoRow.core_branch = buildInfo.core.git.branch;
                    infoRow.core_git = buildInfo.core.git.commit;
                }
            }
            if (buildInfo.ui)
            {
                if (buildInfo.ui.created)
                {
                    infoRow.ui = buildInfo.ui.created;
                }
                if (buildInfo.ui.git)
                {
                    infoRow.ui_branch = buildInfo.ui.git.branch;
                    infoRow.ui_git = buildInfo.ui.git.commit;
                }
            }
            buildInfoTable.push(infoRow);
        }
        console.table(buildInfoTable);
        console.log("start up times:");
        console.table(CABLESUILOADER.startup.log);
        console.groupEnd();


        gui.patchView.focus();
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

    this.getOpDoc = function (opname, html, cb)
    {
        cb(this.opDocs.get2(opname));
    };

    this.metaCode = function ()
    {
        return metaCode;
    };


    this.showSettings = function ()
    {
        window.onmessage = function (e)
        {
            if (e.data && typeof e.data == "string")
            {
                const c = e.data.split(":");
                if (c.length > 1)
                {
                    if (c[0] == "projectname") gui.setProjectName(c[1]);
                    if (c[0] == "notify") CABLES.UI.notify(c[1]);
                    if (c[0] == "notifyerror") CABLES.UI.notifyError(c[1]);
                    if (c[0] == "cmd" && c[1] == "saveproject") this.patch().saveCurrentProject();
                }
            }
        }.bind(this);

        const url = CABLES.sandbox.getCablesUrl() + "/patch/" + self.project()._id + "/settingsiframe";
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true, "gotoUrl": CABLES.sandbox.getCablesUrl() + "/patch/" + self.project()._id + "/settings" });
    };

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
                // this._elGlCanvas.css({ "opacity": 0.7 });
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
            // if (where == "canvas") this._elGlCanvas.css({ "opacity": 1 });
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
        return this._savedState;
    };

    this.setTransformGizmo = function (params)
    {
        if (!this._gizmo) this._gizmo = new CABLES.UI.Gizmo(this.scene().cgl);
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

    this.notIdling = function ()
    {
        this.lastNotIdle = CABLES.now();
    };

    this.checkIdle = function ()
    {
        const idling = (CABLES.now() - self.lastNotIdle) / 1000;
        if (idling > 30 * 60)
        {
        }
        else
        {
            setTimeout(gui.checkIdle, 1000 * 60 * 2);
        }
    };

    this.startPacoSender = function ()
    {
        this.patchConnection.connectors.push(new CABLES.PatchConnectorSocketIO());
    };

    this.startPacoReceiver = function ()
    {
        // this.patch().scene.clear();

        // const conn = new CABLES.PatchConnectionReceiver(
        //     this.patch().scene, {},
        //     new CABLES.PatchConnectorSocketIO(),
        //     this.connector = new PatchConnectorBroadcastChannel()

        // );
    };

    this.setStateUnsaved = function ()
    {
        if (this._savedState)
        {
            let title = "";
            if (CABLES.sandbox.isDevEnv())title = "DEV ";
            title += gui.project.name + " *";
            document.title = title;

            favIconLink.href = "/favicon/favicon_orange.ico";
            this._savedState = false;

            document.getElementById("patchname").classList.add("warning");

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


    this.setStateSaved = function ()
    {
        this._savedState = true;
        favIconLink.href = "/favicon/favicon.ico";
        document.getElementById("patchname").classList.remove("warning");

        let title = "";
        if (CABLES.sandbox.isDevEnv())title = "DEV ";
        title += gui.project.name;
        document.title = title;
        window.onbeforeunload = null;
    };


    this.openInfo = function ()
    {
        CABLES.UI.userSettings.set("closeInfoArea", false);
        this.infoHeight = 200;
        this.setLayout();
    };
    this.closeInfo = function ()
    {
        CABLES.UI.userSettings.set("closeInfoArea", true);
        this.infoHeight = 0;
        this.setLayout();
    };

    this.reloadDocs = function (cb)
    {
        gui.opDocs = new CABLES.UI.OpDocs();
        if (cb)cb();
    };


    this._timeoutPauseProfiler = null;

    this.pauseProfiling = function ()
    {
        if (!this._corePatch.cgl || !this._corePatch.cgl.profileData) return;
        this._corePatch.cgl.profileData.pause = true;

        clearTimeout(this._timeoutPauseProfiler);
        this._timeoutPauseProfiler = setTimeout(() =>
        {
            this._corePatch.cgl.profileData.pause = false;
        }, 200);
    };

    this.updateCanvasIconBar = function ()
    {
        if (!this._elCanvasIconbarContainer) return;

        this._elCanvasIconbarContainer.style.width = document.body.getBoundingClientRect().width - this._elSplitterPatch.get()[0].getBoundingClientRect().width + "px";
        this._elCanvasIconbarContainer.style.left = this._elSplitterPatch.get()[0].getBoundingClientRect().left + 4 + "px";

        if (this._canvasMode == this.CANVASMODE_PATCHBG)
            this._elCanvasIconbarContainer.style.top = 0;
        else
            this._elCanvasIconbarContainer.style.top = this.rendererHeight * this._corePatch.cgl.canvasScale + 1 + "px";


        const w = this.rendererWidth * gui.corePatch().cgl.canvasScale;

        if (w < 400)
        {
            this._elCanvasIconbar.style.display = "none";
        }
        else
        if (w < 600)
        {
            this._elCanvasIconbar.style.display = "inline-block";
            this._elCanvasIconbar.style["margin-left"] = 0;
            this._elCanvasIconbar.style.right = w + "px";
            this._elCanvasIconbar.style.transform = "initial";
        }
        else
        {
            this._elCanvasIconbar.style.display = "inline-block";
            this._elCanvasIconbar.style.right = 0;
            this._elCanvasIconbar.style.transform = "translate(-50%)";
            this._elCanvasIconbar.style["margin-left"] = w / 2 + "px";
        }
    };

    this.getCanvasSizeString = function (cgl)
    {
        this._eleCanvasInfoZoom = this._eleCanvasInfoZoom || document.getElementById("canvasInfoZoom");

        let sizeStr = " Size " + Math.floor(100 * cgl.canvasWidth) / 100 + "x" + Math.floor(100 * cgl.canvasHeight) / 100;
        if (cgl.canvasScale != 1) sizeStr += " Scale " + cgl.canvasScale + " ";
        if (cgl.pixelDensity != 1) sizeStr += " (" + Math.floor(100 * cgl.canvasWidth / cgl.pixelDensity) / 100 + "x" + Math.floor(100 * cgl.canvasHeight / cgl.pixelDensity) / 100 + "x" + cgl.pixelDensity + ")";

        this._elCanvasInfoSize.innerHTML = sizeStr;
        this._elCanvasInfoAspect = this._elCanvasInfoAspect || document.getElementById("canvasInfoAspect");

        const zoom = Math.round(window.devicePixelRatio * 100);
        if (zoom != 100)
        {
            ele.show(this._eleCanvasInfoZoom);
            this._eleCanvasInfoZoom.innerHTML = "Zoom " + zoom + "% ";
        }
        else
        {
            ele.hide(this._eleCanvasInfoZoom);
        }

        return sizeStr;
    };

    this.showCanvasModal = function (_show)
    {
        this._elCanvasModalDarkener = this._elCanvasModalDarkener || document.getElementById("canvasmodal");

        if (this._canvasMode == this.CANVASMODE_PATCHBG)
        {
            ele.show(this._elCanvasIconbarContainer);
            this.isCanvasFocussed = false;

            ele.hide(this._elCanvasModalDarkener);

            const cgl = this._corePatch.cgl;
            this.updateCanvasIconBar();
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString(cgl);
            return;
        }

        this.isCanvasFocussed = _show;

        if (!this._elCanvasIconbarContainer) return;


        if (_show)
        {
            ele.show(this._elCanvasModalDarkener);
            ele.show(this._elCanvasIconbarContainer);
            const cgl = this._corePatch.cgl;
            this.updateCanvasIconBar();
            this._elCanvasInfoSize.innerHTML = this.getCanvasSizeString(cgl);
        }
        else
        {
            if (this._elCanvasInfoFps) this._elCanvasInfoFps.style.opacity = 0.3;
            if (this._elCanvasInfoMs) this._elCanvasInfoMs.style.opacity = 0.3;

            ele.hide(this._elCanvasIconbarContainer);
            ele.hide(this._elCanvasModalDarkener);
        }
    };

    this.init = function (next)
    {
        document.body.addEventListener("contextmenu", (e) =>
        {
            if (e.target.currentSrc) return;
            if (e.target.classList.contains("selectable")) return;
            if (e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT") return;

            e.preventDefault();
        });

        ele.byId("timing").innerHTML = CABLES.UI.getHandleBarHtml("timeline_controler");
        this._timeLine = new CABLES.TL.UI.TimeLineUI();

        gui.watchPortVisualizer = new CABLES.UI.WatchPortVisualizer();

        if (this.isRemoteClient)
            document.getElementById("undev").style.display = "none";

        CABLES.UI.initSplitPanes();

        document.getElementById("canvasmodal").addEventListener("mousedown",
            (e) =>
            {
                gui.showCanvasModal(false);
                gui.patchView.focus();
                e.preventDefault();
            });

        // _patch = new CABLES.UI.Patch(this);
        // _patch.show(this._corePatch);
        // this.patchView.store.setPatch(this._corePatch);


        // this.patchView.setPatchRenderer("patch", _patch);

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

        $(".download_screenshot").hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.download_screenshot);
        }, function ()
        {
            CABLES.UI.hideInfo();
        });
        // $("#minimapContainer").hover(function (e)
        // {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.minimapContainer);
        // }, function ()
        // {
        // CABLES.UI.hideInfo();
        // });
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
};

CABLES.UI.GUI.prototype.updateTheme = function ()
{
    if (CABLES.UI.userSettings.get("theme-bright")) document.body.classList.add("bright");
    else document.body.classList.remove("bright");
};


// todo use eventtarget...
CABLES.UI.GUI.prototype.addEventListener = function (name, cb)
{
    this._log.warn("deprecated eventlistener:", name);
    console.log((new Error()).stack);
    this._eventListeners[name] = this._eventListeners[name] || [];
    this._eventListeners[name].push(cb);
};


CABLES.UI.GUI.prototype.initCoreListeners = function ()
{
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

    this._corePatch.on("performance", (perf) =>
    {
        if (gui.corePatch().cgl.glVersion == 1)
        {
            this._elCanvasInfoVer = this._elCanvasInfoVer || document.getElementById("canvasInfoVersion");
            this._elCanvasInfoVer.innerHTML = "WebGL 1";
        }
        else ele.hide(document.getElementById("canvasInfoVersion"));

        if (this.isCanvasFocussed)
        {
            this._elCanvasInfoFps = this._elCanvasInfoFps || document.getElementById("canvasInfoFPS");
            this._elCanvasInfoFps.innerHTML = perf.fps + " FPS";

            this._elCanvasInfoMs = this._elCanvasInfoMs || document.getElementById("canvasInfoMS");
            this._elCanvasInfoMs.innerHTML = perf.ms + " MS";

            this._elCanvasInfoFps.style.opacity = 1;
            this._elCanvasInfoMs.style.opacity = 1;
        }
    });
};


function startUi(cfg)
{
    logStartup("Init UI");
    CABLES.UI.initHandleBarsHelper();


    window.gui = new CABLES.UI.GUI(cfg);

    if (gui.isRemoteClient)
        new CABLES.UI.NoPatchEditor();
    else
        CABLES.CMD.DEBUG.glguiFull();

    incrementStartup();
    gui.serverOps = new CABLES.UI.ServerOps(gui, cfg.patchId, () =>
    {
        // $("#patch").bind("contextmenu", function (e)
        // {
        //     if (e.preventDefault) e.preventDefault();
        // });

        gui.init();
        gui.checkIdle();
        gui.initCoreListeners();

        gui.corePatch().timer.setTime(0);

        gui.bind(() =>
        {
            incrementStartup();
            CABLES.sandbox.initRouting(() =>
            {
                document.addEventListener("visibilitychange", function ()
                {
                    if (!document.hidden)
                    {
                        gui.setLayout();
                        gui.patchView.store.checkUpdated();
                    }
                }, false);

                incrementStartup();
                gui.opDocs = new CABLES.UI.OpDocs();
                gui.opSelect().prepare();
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

                    if (key == "hideSizeBar")
                    {
                        gui.setLayout();
                    }
                });

                if (!CABLES.UI.userSettings.get("introCompleted"))gui.introduction.showIntroduction();

                CABLES.editorSession.open();
                gui.bindKeys();

                gui.socket = new CABLES.UI.ScConnection(CABLES.sandbox.getSocketclusterConfig());
                gui.socketUi = new CABLES.UI.ScGui(gui.socket);
                gui.chat = new CABLES.UI.Chat(gui.mainTabs, gui.socket);

                CABLES.UI.startIdleListeners();

                gui.jobs().updateJobListing();

                new CABLES.UI.HtmlInspector();

                if (CABLES.UI.userSettings.get("closeInfoArea")) gui.closeInfo();

                if (CABLES.UI.userSettings.get("timelineOpened") == true) gui.showTiming();

                logStartup("finished loading cables");

                setTimeout(() =>
                {
                    if (CABLES.UI.userSettings.get("forceWebGl1")) CABLES.UI.notify("Forcing WebGl v1 ");
                }, 1000);

                if (window.module) module = window.module; // electronn workaround/fix

                gui.patchView.checkPatchErrors();

                gui.patchView.setCurrentSubPatch(0);

                document.getElementById("loadingstatusLog").style.display = "none";

                new QRCode(document.getElementById("remote_view_qr"), {
                    "text": CABLES.sandbox.getCablesUrl() + "/remote_client/" + gui.patchId,
                    "width": 200,
                    "height": 200,
                    "colorDark": "#000000",
                    "colorLight": "#ffffff",
                    "correctLevel": QRCode.CorrectLevel.H
                });


                CABLES.UI.loaded = true;
                setTimeout(() =>
                {
                    window.gui.emitEvent("uiloaded");
                    gui.corePatch().timer.setTime(0);
                }, 100);
            });
        });
    });

    document.getElementById("glcanvas").addEventListener("focus", function ()
    {
        gui.showCanvasModal(true);
    });

    logStartup("Init UI done");
}
