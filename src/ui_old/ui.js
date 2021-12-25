CABLES.UI = CABLES.UI || {};
CABLES.UI.undo = new UndoManager();


CABLES.UI.GUI = function (cfg)
{
    CABLES.EventTarget.apply(this);

    const self = this;

    this._log = new CABLES.UI.Logger("gui");

    this.patchId = cfg.patchId;
    let showTiming = false;
    this._showingEditor = false;

    this.keys = new CABLES.UI.KeyBindingsManager();
    this.opParams = new CABLES.UI.OpParampanel();
    this.opPortModal=new CABLES.UI.ModalPortValue();

    this.socket = null;
    this.isRemoteClient = cfg.remoteClient;
    this.spaceBarStart = 0;

    this.timingHeight = 250;
    this.rendererWidth = 640;
    this.rendererHeight = 360;

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
    this.bookmarks = new CABLES.UI.Bookmarks();
    this.history = new CABLES.UI.MetaHistory(this.metaTabs);
    this.bottomInfoArea = new CABLES.UI.BottomInfoAreaBar();

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
    };

    this.setProject = function (p)
    {
        this._currentProject = p;
        gui.setProjectName(p.name || "unknown");

        ele.byId("nav_viewProjectLink").setAttribute("href", CABLES.sandbox.getCablesUrl() + "/p/" + p.shortId || p._id);
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
        gui.maintabPanel.show(true);

        if (this._find)
        {
            this._find.search(str);
            this._find.setSearchInputValue(str);
        }
        else this._find = new CABLES.UI.FindTab(gui.mainTabs, str);

        this._find.focus();
        gui.maintabPanel.show(true);
    };

    this.texturePreview = function ()
    {
        return this.metaTexturePreviewer;
    };

    this.showSaveWarning = function ()
    {
        if (this.showGuestWarning()) return true;
        if (!gui.canSaveInMultiplayer())
        {
            iziToast.show({
                "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
                "theme": "dark",
                "title": "multiplayer session",
                "message": "you cannot save the patch, since you are not the pilot",
                "progressBar": false,
                "animateInside": false,
                "close": true,
                "timeout": 2000
            });
            return true;
        }
        return false;
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

    this.canSaveInMultiplayer = function ()
    {
        if (gui.socket && !gui.socket.canSaveInMultiplayer()) return false;
        else return true;
    };

    this.isGuestEditor = function ()
    {
        return this.user.username == "guest";
    };

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
        gui.maintabPanel.show(true);
    };

    this.pauseInteractionSplitpanes = function ()
    {
        const iframes = ele.byQueryAll("iframe,canvas");
        for (let i = 0; i < iframes.length; i++) iframes[i].style["pointer-events"] = "none";
        this.patchView.pauseInteraction();
    };

    this.resumeInteractionSplitpanes = function ()
    {
        const iframes = ele.byQueryAll("iframe,canvas");
        for (let i = 0; i < iframes.length; i++) iframes[i].style["pointer-events"] = "initial";
        this.patchView.resumeInteraction();
    };

    this.setLayout = function ()
    {
        this.pauseProfiling();
        const perf = CABLES.UI.uiProfiler.start("gui.setlayout");
        this._elCanvasIconbar = this._elCanvasIconbar || ele.byId("canvasIconBar");

        this._elAceEditor = ele.byId("ace_editors");
        this._elSplitterPatch = this._elSplitterPatch || ele.byId("splitterPatch");
        this._elSplitterRenderer = this._elSplitterRenderer || ele.byId("splitterRenderer");
        this._elCanvasFlash = this._elCanvasFlash || ele.byId("canvasflash");

        this._elIconbarLeft = this._elIconbarLeft || ele.byId("iconbar_sidebar_left");

        this.patchView.updateBoundingRect();

        this._elPatch = this.patchView.element;
        this._elBgPreview = ele.byId("bgpreview");
        this._elBgPreviewButtonContainer = ele.byId("bgpreviewButtonsContainer");

        this._elOptions = this._elOptions || ele.byId("options");
        this._elMeta = this._elMeta || ele.byId("meta");
        this._elMenubar = this._elMenubar || ele.byId("menubar");
        // this._elSplitterMeta = this._elSplitterMeta || ele.byId("splitterMeta");
        this._elInfoArea = this._elInfoArea || ele.byId("infoArea");

        this._elGlCanvasDom = this._elGlCanvasDom || ele.byId("glcanvas");

        this._elMaintab = this._elMaintab || ele.byId("maintabs");
        this._elEditor = this._elEditor || ele.byId("editor");
        this._elLibrary = this._elLibrary || ele.byId("library");
        this._elCanvasInfoSize = this._elCanvasInfoSize || ele.byId("canvasInfoSize");
        this._elSplitterMaintabs = this._elSplitterMaintabs || ele.byId("splitterMaintabs");
        this._elEditorMinimized = this._elEditorMinimized || ele.byId("editorminimized");
        this._elEditorMaximized = this._elEditorMaximized || ele.byId("editormaximized");

        this._elTLoverviewtimeline = this._elTLoverviewtimeline || ele.byId("overviewtimeline");
        this._elTLtimelineTitle = this._elTLtimelineTitle || ele.byId("timelineTitle");
        this._elTLkeycontrols = this._elTLkeycontrols || ele.byId("keycontrols");
        this._elTLtimetimeline = this._elTLtimetimeline || ele.byId("timetimeline");
        this._elTLsplitterTimeline = this._elTLsplitterTimeline || ele.byId("splitterTimeline");

        this._elSubpatchNav = this._elSubpatchNav || ele.byId("subpatch_nav");
        this._elCablesCanvas = this._elCablesCanvas || ele.byId("cablescanvas");
        this._elGlUiPreviewLayer = this._elGlUiPreviewLayer || ele.byId("gluiPreviewLayer");
        this._elMulitplayerMessageNav = this._elMulitplayerMessageNav || document.getElementById("multiplayer_message_nav");

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

        let patchHeight = window.innerHeight;

        if (this.isRemoteClient)
        {
            this._setCanvasMode(this.CANVASMODE_FULLSCREEN);
            this._elGlCanvasDom.classList.add("maximized");
            this.rendererWidth = 0;
            this._showingEditor = false;
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
        if (this.canvasUi) this.canvasUi.getCanvasSizeString(cgl);

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

        const infoAreaHeight = this.bottomInfoArea.getHeight();
        const menubarHeight = 0;
        const optionsWidth = Math.max(400, this.rendererWidthScaled / 2);

        let timelineUiHeight = 40;
        if (this.timeLine() && this.timeLine().hidden) timelineUiHeight = 0;

        const timedisplayheight = 25;

        patchHeight -= infoAreaHeight;

        if (showTiming) patchHeight -= this.timingHeight;
        else patchHeight -= timelineUiHeight;

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


            if (this._elAceEditor) this._elAceEditor.style.height = editorHeight + "px";
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
            this._elMulitplayerMessageNav.style.left = editorWidth + iconBarWidth + 15 + "px";

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
            this._elMulitplayerMessageNav.style.left = iconBarWidth + 15 + "px";
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

        // this._elMulitplayerMessageNav.style.left = menupos - 20 + "px";
        this._elMulitplayerMessageNav.style.top = 55 + "px";

        if (this.rendererWidth < 100) this.rendererWidth = 100;

        this.rightPanelWidth = this.rendererWidthScaled;
        if (this._canvasMode == this.CANVASMODE_PATCHBG) this.rightPanelWidth = this.splitpanePatchPos;

        this._elSplitterPatch.style.left = (window.innerWidth - this.rightPanelWidth - 4) + "px";
        this._elSplitterPatch.style.height = (patchHeight + timelineUiHeight + 2) + "px";
        this._elSplitterRenderer.style.top = this.rendererHeightScaled + "px";
        this._elSplitterRenderer.style.width = this.rendererWidthScaled + "px";

        this.patchView.setSize(patchLeft, menubarHeight, patchWidth, patchHeight);

        this._elPatch.style.height = patchHeight + "px";
        this._elPatch.style.width = patchWidth + "px";
        this._elPatch.style.top = 0 + "px";
        this._elPatch.style.left = patchLeft + "px";

        this._elLibrary.style.left = iconBarWidth + "px";
        this._elLibrary.style.width = window.innerWidth - this.rendererWidthScaled - iconBarWidth + "px";
        this._elLibrary.style.bottom = 0;

        const timelineWidth = window.innerWidth - this.rendererWidthScaled - 2 - iconBarWidth;

        if (this._elTLoverviewtimeline)
        {
            this._eleSplitterTimeline = this._eleSplitterTimeline || ele.byId("splitterTimeline");
            this._eleTiming = this._eleTiming || ele.byId("timing");

            if (showTiming)
            {
                this._eleTiming.style.width = timelineWidth + "px";
                this._eleTiming.style.bottom = infoAreaHeight + "px";
                this._eleTiming.style.height = this.timingHeight + "px";
                this._eleTiming.style.left = iconBarWidth + "px";

                ele.byId("timelineui").style.width = timelineWidth + "px";

                ele.byId("overviewtimeline").style["margin-top"] = timelineUiHeight + "px";
                ele.byQuery("#overviewtimeline svg").style.width = timelineWidth + "px";
                ele.byQuery("#overviewtimeline svg").style.height = 25 + "px";

                ele.byId("timetimeline").style["margin-top"] = timelineUiHeight + timedisplayheight + "px";
                ele.byQuery("#timetimeline svg").style.width = timelineWidth + "px";
                ele.byQuery("#timetimeline svg").style.height = 25 + "px";

                ele.byQuery("#timeline svg").style.width = timelineWidth + "px";
                ele.byQuery("#timeline svg").style.height = this.timingHeight - timedisplayheight + "px";
                ele.byQuery("#timeline svg").style["margin-top"] = timelineUiHeight + timedisplayheight + timedisplayheight + "px";

                this._elTLoverviewtimeline.style.display = "block";
                this._elTLtimetimeline.style.display = "block";
                this._elTLkeycontrols.style.display = "block";
                this._elTLsplitterTimeline.style.display = "block";
                this._elTLtimelineTitle.style.display = "block";

                this._eleSplitterTimeline.style.bottom = (this.timingHeight - 4 + infoAreaHeight) + "px";
                ele.show(this._eleSplitterTimeline);
            }
            else
            {
                timelineHeight = 0;
                this._elTLoverviewtimeline.style.display = "none";
                this._elTLtimetimeline.style.display = "none";
                this._elTLkeycontrols.style.display = "none";
                this._elTLtimelineTitle.style.display = "none";
                this._elTLsplitterTimeline.style.display = "none";

                this._eleTiming.style.height = timelineUiHeight + "px";

                ele.hide(this._eleSplitterTimeline);
            }
        }

        if (this.timeLine()) this.timeLine().updateViewBox();


        this._elCanvasIconbarBottom = this._elCanvasIconbarBottom || ele.byId("iconbar_sidebar_bottom");
        if (this._elCanvasIconbarBottom)
        {
            this._elCanvasIconbarBottom.style.right = this.rendererWidthScaled + 20 + "px";
            this._elCanvasIconbarBottom.style.bottom = 10 + timelineHeight + infoAreaHeight + "px";
        }

        this._elCanvasIconbarTimeline = this._elCanvasIconbarTimeline || ele.byId("iconbar_sidebar_timeline");
        if (this._elCanvasIconbarTimeline)
        {
            this._elCanvasIconbarTimeline.style.left = (patchWidth / 2) + "px";
            this._elCanvasIconbarTimeline.style.bottom = 10 + timelineHeight + infoAreaHeight + "px";

            if (!showTiming) this._elCanvasIconbarTimeline.style.display = "none";
            else this._elCanvasIconbarTimeline.style.display = "inline-block";
        }

        ele.byId("splitterTimeline").style.width = timelineWidth + "px";

        if (this._elIconbarLeft)
        {
            if (CABLES.UI.userSettings.get("hideSizeBar"))
            {
                this._elIconbarLeft.style.display = "none";
            }
            else
            {
                this._elIconbarLeft.style.display = "block";
                this._elIconbarLeft.style.bottom = 10 + timelineHeight + infoAreaHeight + "px";

                if (this.maintabPanel.isVisible()) this._elIconbarLeft.style.left = editorWidth + 20 + "px";
                else this._elIconbarLeft.style.left = 10 + "px";
            }
        }

        let metaWidth;

        if (this.showTwoMetaPanels())
        {
            metaWidth = this.rightPanelWidth - optionsWidth;

            this._elOptions.style.right = metaWidth + "px";
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

        // this._elSplitterMeta.style.bottom = self.infoAreaHeight + "px";
        // this._elSplitterMeta.style.width = metaWidth - 28 + "px";

        this._elMenubar.style.top = 0 + "px";
        // this._elMenubar.style.height = menubarHeight + "px";


        if (!this.bottomInfoArea.showing)
        {
            this._elInfoArea.style.height = 0 + "px";
            // ele.byId("infoAreaToggle").style.width = window.innerHeight + "px";
            // ele.byId("infoAreaToggle").classList.remove("hidden");
        }
        else
        {
            this._elInfoArea.style.height = infoAreaHeight + "px";
        }

        // if (this.infoAreaHeight === 0)
        // {
        //     // ele.hide(this._elInfoArea);
        //     this._elInfoArea.style.display = "none";
        //     ele.hide(this._elSplitterMeta);

        //     ele.byId("infoAreaMin").style.width = window.innerHeight + "px";
        //     ele.byId("infoAreaMin").classList.remove("hidden");
        // }
        // else
        // {
        //     ele.byId("infoAreaMin").classList.add("hidden");
        //     ele.show(this._elSplitterMeta);
        //     // ele.show(this._elInfoArea);
        //     this._elInfoArea.style.display = "block";
        //     this._elInfoArea.style.width = metaWidth - 20 + "px";
        //     this._elInfoArea.style.height = this.infoAreaHeight + "px";
        //     this._elInfoArea.style.top = (window.innerHeight - this.rendererHeight - this.infoAreaHeight) + "px";
        // }

        // this._elInfoArea.style.display = "block";
        // this._elInfoArea.style.width = window.innerWidth + "px";
        // this._elInfoArea.style.height = 22 + "px";
        // this._elInfoArea.style.bottom = 0 + "px";

        ele.byQuery("#metatabpanel .contentcontainer").style.height = window.innerHeight - this.rendererHeightScaled - infoAreaHeight - menubarHeight - timelineHeight + "px";

        ele.byId("maintabs").style.top = menubarHeight + "px";
        ele.byId("maintabs").style.height = (window.innerHeight - menubarHeight - timelineHeight - infoAreaHeight) + "px";

        ele.byQuery("#maintabs .contentcontainer").style.height = window.innerHeight - menubarHeight - timelineHeight - 50 + "px";

        if (this._canvasMode == this.CANVASMODE_FULLSCREEN)
        {
            this._elCablesCanvas.style.left = 0 + "px";
            this._elCablesCanvas.style.right = "initial";

            this._elCablesCanvas.style.width = this._elGlCanvasDom.style.width = window.innerWidth + "px";
            this._elCablesCanvas.style.height = this._elGlCanvasDom.style.height = window.innerHeight + "px";

            this._elGlCanvasDom.setAttribute("width", window.innerWidth);
            this._elGlCanvasDom.setAttribute("height", window.innerHeight);

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

            this._elGlCanvasDom.setAttribute("width", this.rendererWidth * density);
            this._elGlCanvasDom.setAttribute("height", self.rendererHeight * density);
            this._elGlCanvasDom.style.width = this.rendererWidth + "px";
            this._elGlCanvasDom.style.height = self.rendererHeight + "px";
            this._elCablesCanvas.style.width = this.rendererWidth + "px";
            this._elCablesCanvas.style.height = self.rendererHeight + "px";
            this._elCablesCanvas.style.right = "0px";
            this._elCablesCanvas.style.left = "initial";

            this._elCablesCanvas.style["transform-origin"] = "top right";
            this._elCablesCanvas.style.transform = "scale(" + this._corePatch.cgl.canvasScale + ")";
        }

        // flashing canvas overlay when sabing
        this._elCanvasFlash.style.width = this.rendererWidth * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.height = this.rendererHeight * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.right = 0 + "px";
        this._elCanvasFlash.style.top = 0 + "px";


        this._elBgPreview.style.right = this.rightPanelWidth + "px";
        this._elBgPreview.style.top = menubarHeight + "px";

        this._elBgPreviewButtonContainer.style.right = this.rightPanelWidth + "px";

        this.emitEvent("setLayout");

        perf.finish();
    };

    // this.importDialog = function ()
    // {
    //     let html = "";
    //     html += "import:<br/><br/>";
    //     html += "<textarea id=\"serialized\"></textarea>";
    //     html += "<br/>";
    //     html += "<br/>";
    //     html += "<a class=\"button\" onclick=\"this._corePatch.clear();this._corePatch.deSerialize(ele.byId('serialized').value);CABLES.UI.MODAL.hide();\">import</a>";
    //     CABLES.UI.MODAL.show(html);
    // };

    // this.exportDialog = function ()
    // {
    //     let html = "";
    //     html += "export:<br/><br/>";
    //     html += "<textarea id=\"serialized\"></textarea>";
    //     CABLES.UI.MODAL.show(html);
    //     ele.byId("serialized").value = self.patch().scene.serialize();
    // };

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
        this.canvasUi.showCanvasModal(false);
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

        this.canvasUi.showCanvasModal(false);
        this.setLayout();
    };

    function updateTimingIcon()
    {

    }

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
        ele.hide(ele.byId("timing"));
        gui.setLayout();
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
    };

    this.toggleTiming = function ()
    {
        gui.timeLine().hidden = false;
        ele.show(ele.byId("timing"));
        CABLES.UI.userSettings.set("timelineOpened", true);

        showTiming = !showTiming;
        CABLES.UI.userSettings.set("timelineOpened", showTiming);
        updateTimingIcon();
        this.setLayout();
        gui.timeLine().redraw();
    };

    this.refreshFileManager = function ()
    {
        if (this.fileManager) this.fileManager.refresh();
        else this.showFileManager(null, true);
    };

    this.showFileManager = function (cb, unserInteraction)
    {
        if (this.fileManager)
        {
            this.fileManager.show(unserInteraction);
            gui.mainTabs.activateTabByName("Files");

            if (cb)cb();
        }
        else
        {
            this.fileManager = new CABLES.UI.FileManager(cb, unserInteraction);
        }
    };

    this.showFileSelect = function (inputId, filterType, opid, previewId)
    {
        this.showFileManager(() =>
        {
            const portInputEle = ele.byQuery(inputId);
            if (!portInputEle)
            {
                this._log.warn("[showfileselect] no portInputEle");
                return;
            }
            const fn = portInputEle.value;

            this.fileManager.setFilterType(filterType);
            console.log("showfileselect", opid, gui.corePatch().getOpById(opid));
            this.fileManager.setFilePort(portInputEle, gui.corePatch().getOpById(opid), ele.byId(previewId));
            this.fileManager.selectFile(fn);
        });
    };

    this.setProjectName = function (name)
    {
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

        new CABLES.UI.ModalDialog({
            "prompt": true,
            "title": "New Project",
            "text": "Enter a name for your new Project",
            "promptValue": "My new Project",
            "promptOk": (name) =>
            {
                if (name)
                    CABLESUILOADER.talkerAPI.send("newPatch", { "name": name }, function (err, d)
                    {
                        CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": d._id });
                    });
            }
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

        let els = document.getElementsByClassName("shortcut");

        for (let i in els)
        {
            const newShortcut = (els[i].innerHTML || "").replace("mod", osMod);
            els[i].innerHTML = newShortcut;
        }
    };

    this.serializeForm = function (selector)
    {
        const json = {};
        Array.from(ele.byQuery(selector).elements).forEach((e) =>
        {
            json[e.getAttribute("name")] = e.value;
        });
        return json;
    };


    this.helperContextMenu = function (el)
    {
        let iconTransforms = "icon icon-check hidden";
        if (CABLES.UI.showCanvasTransforms) iconTransforms = "icon icon-check";

        let iconShowAllHelpers = "icon icon-check hidden";
        if (CABLES.UI.userSettings.get("helperMode")) iconShowAllHelpers = "icon icon-check";

        let iconShowCurrentOpHelper = "icon icon-check hidden";
        if (CABLES.UI.userSettings.get("helperModeCurrentOp")) iconShowCurrentOpHelper = "icon icon-check";

        let iconCurrentOpTransform = "icon icon-check hidden";
        if (CABLES.UI.userSettings.get("toggleHelperCurrentTransforms")) iconCurrentOpTransform = "icon icon-check";

        CABLES.contextMenu.show(
            {
                "refresh": gui.helperContextMenu,
                "items":
                [
                    {
                        "title": "Show selected op helper",
                        "func": CABLES.CMD.UI.toggleHelperCurrent,
                        "iconClass": iconShowCurrentOpHelper,
                    },
                    {
                        "title": "Show all helpers",
                        "func": CABLES.CMD.UI.toggleHelper,
                        "iconClass": iconShowAllHelpers,
                    },
                    {
                        "title": "Show selected op transform gizmo",
                        "func": CABLES.CMD.UI.toggleHelperCurrentTransform,
                        "iconClass": iconCurrentOpTransform,
                    },
                    {
                        "title": "Show all transforms",
                        "func": CABLES.CMD.UI.toggleTransformOverlay,
                        "iconClass": iconTransforms,
                    }
                ]
            }, el);
    };

    this.rendererContextMenu = function (el)
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
            }, el);
    };


    this.rendererAspectMenu = function (el)
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
            }, el);
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

    this.converterStart = function (projectId, fileId, converterId)
    {
        ele.show(ele.byId("converterprogress"));
        ele.hide(ele.byId("converterform"));

        CABLESUILOADER.talkerAPI.send("fileConvert",
            {
                "fileId": fileId,
                "converterId": converterId,
                "options": this.serializeForm("#converterform")
            },
            function (err, res)
            {
                ele.hide(ele.byId("converterprogress"));
                ele.show(ele.byId("converteroutput"));

                if (err)
                {
                    ele.byId("converteroutput").innerHTML = "Error: something went wrong while converting..." + (err.msg || "");
                }
                else
                {
                    let html = "";

                    if (res && res.info) html = res.info;
                    else html = "Finished!";

                    html += "<br/><a class=\"button\" onclick=\"CABLES.UI.MODAL.hide()\">ok</a>";
                    ele.byId("converteroutput").innerHTML = html;
                }
                gui.refreshFileManager();
            });
    };


    this.bind = function (cb)
    {
        this.bottomInfoArea.on("changed", this.setLayout.bind(this));

        // if (CABLES.UI.userSettings.get("closeInfoArea")) gui.closeInfo();


        ele.byId("nav_cmdplt").addEventListener("click", (event) => { gui.cmdPallet.show(); });
        ele.byId("nav_search").addEventListener("click", (event) => { gui.find(""); });

        ele.byId("nav_createBackup").addEventListener("click", (event) => { CABLES.CMD.PATCH.createBackup(); });
        ele.byId("nav_viewBackups").addEventListener("click", (event) => { CABLES.CMD.PATCH.showBackups(); });
        ele.byId("nav_cablesweb").addEventListener("click", (event) => { const win = window.open(CABLES.sandbox.getCablesUrl(), "_blank"); win.focus(); });

        ele.byQueryAll(".nav_create_from_template").forEach((el) =>
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
        ele.byId("nav_viewProjectLink").addEventListener("click", (e) =>
        {
            const url = e.target.getAttribute("href");
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

        ele.byId("nav_op_createOp").addEventListener("click", (event) => { gui.serverOps.createDialog(); });
        ele.byId("nav_filemanager").addEventListener("click", (event) => { gui.showFileManager(null, true); });

        ele.byId("nav_timeline").addEventListener("click", (event) =>
        {
            CABLES.CMD.TIMELINE.toggleTimeline();
        });

        ele.byId("nav_profiler").addEventListener("click", (event) => { new CABLES.UI.Profiler(gui.mainTabs); gui.maintabPanel.show(true); });

        window.addEventListener("resize", () =>
        {
            this.canvasUi.showCanvasModal(false);
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
                CABLES.UI.paramsHelper.openParamStringEditor(selectedOpId, portName, null, true);
            }
        });

        this.keys.key(["Escape", "Tab"], "Open \"Op Create\" dialog (or close current dialog)", "down", null, {},
            (e) =>
            {
                if (!(document.activeElement && !document.activeElement.classList.contains("ace_text-input") && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")))
                {
                    this.pressedEscape(e);
                    this.patchView.focus();
                }
                else
                {
                    if (e.target.hasAttribute("data-portnum"))
                    {
                        const n = e.target.dataset.portnum;
                        const nextInputEle = ele.byId("portval_" + (parseInt(n) + 1));
                        if (nextInputEle) nextInputEle.focus();
                    }
                }
            });

        this.keys.key(["Escape"], "Toggle Tab Area", "down", null, { "altKey": true }, (e) => { this.maintabPanel.toggle(); this.setLayout(); });

        this.keys.key("p", "Open Command Palette", "down", null, { "cmdCtrl": true }, (e) => { this.cmdPallet.show(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true }, (e) => { this.cycleFullscreen(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) => { this.cyclePatchBg(); });

        this.keys.key("z", "undo", "down", null, { "ignoreInput": true, "cmdCtrl": true }, (e) => { CABLES.UI.undo.undo(); });
        this.keys.key("z", "redo", "down", null, { "ignoreInput": true, "cmdCtrl": true, "shiftKey": true }, (e) => { CABLES.UI.undo.redo(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            const eleAceTextEditor = ele.byQuery("#ace_editors textarea");
            if (!(eleAceTextEditor && ele.hasFocus(eleAceTextEditor)) && !CABLES.UI.MODAL.isVisible()) CABLES.CMD.UI.showSearch();
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
        this.canvasUi.showCanvasModal(false);
        this.emitEvent("pressedEscape");

        if (this.fileManager) this.fileManager.setFilePort(null);

        if (e && (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return;

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

            this._showingEditor = this._oldShowingEditor;
            this._elGlCanvasDom.classList.remove("maximized");
            self.setLayout();
            this.canvasUi.showCanvasModal(true);
        }
        else if (CABLES.UI.suggestions)
        {
            CABLES.UI.suggestions.close();
            CABLES.UI.suggestions = null;
        }
        else if (gui.cmdPallet.isVisible()) gui.cmdPallet.close();
        else if (CABLES.contextMenu.isVisible()) CABLES.contextMenu.close();
        else if (CABLES.UI.MODAL._visible)
        {
            CABLES.UI.MODAL.hide(true);
            CABLES.UI.MODAL.hide();
            if (this._showingEditor) self.editor().focus();
        }
        else if (this.maintabPanel.isVisible()) this.maintabPanel.hide();
        else if (this._showingEditor) this.closeEditor();
        else
        {
            if (e) gui.opSelect().show({
                "subPatch": this.patchView.getCurrentSubPatch(),
                "x": 0,
                "y": 0
            });
        }

        setTimeout(() =>
        {
            ele.forEachClass("tooltip", (el) =>
            {
                ele.hide(el);
            });
        }, 50);
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
        ele.show(ele.byId("cablescanvas"));
        ele.hide(ele.byId("loadingstatus"));
        ele.show(ele.byId("mainContainer"));

        ele.byId("menubar").classList.remove("hidden");

        if (CABLES.UI.userSettings.get("showUIPerf") == true) CABLES.UI.uiProfiler.show();

        this._elGlCanvasDom.addEventListener("pointerenter", (e) =>
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.canvas);
        });

        this._elGlCanvasDom.addEventListener("pointerleave", (e) =>
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
        this._log.log("build info:");
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


    this.showSettings = function (unserInteraction)
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
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true, "gotoUrl": CABLES.sandbox.getCablesUrl() + "/patch/" + self.project()._id + "/settings" }, true);
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


    this.setElementBgPattern = function (el)
    {
        if (!el) return;
        el.classList.remove("bgPatternDark");
        el.classList.remove("bgPatternBright");
        el.classList.remove("bgPatternBlack");
        el.classList.remove("bgPatternWhite");
        el.classList.remove("bgPatternRed");
        el.classList.remove("bgPatternGrey");
        el.classList.remove("bgPatternBlue");

        el.classList.add(CABLES.UI.userSettings.get("bgpattern") || "bgPatternDark");
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


    this.init = function (next)
    {
        this.canvasUi = new CABLES.UI.CanvasUi(this.corePatch().cgl);

        ele.byId("timing").innerHTML = CABLES.UI.getHandleBarHtml("timeline_controler");
        this._timeLine = new CABLES.TL.UI.TimeLineUI();


        if (this.isRemoteClient)
        {
            ele.byId("undev").style.display = "none";
            ele.byId("infoAreaContainer").style.display = "none";
        }

        CABLES.UI.initSplitPanes();


        // _patch = new CABLES.UI.Patch(this);
        // _patch.show(this._corePatch);
        // this.patchView.store.setPatch(this._corePatch);

        // this.patchView.setPatchRenderer("patch", _patch);


        ele.byId("undev").addEventListener("pointerEnter", (e) =>
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.undevLogo);
        });
        ele.byId("undev").addEventListener("pointerLeave", (e) =>
        {
            CABLES.UI.hideInfo();
        });


        ele.byId("timelineui").addEventListener("pointerEnter", (e) =>
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.timelineui);
        });
        ele.byId("timelineui").addEventListener("pointerLeave", (e) =>

        {
            CABLES.UI.hideInfo();
        });

        gui.replaceNavShortcuts();
    };
};


CABLES.UI.GUI.prototype.setFontSize = function (v)
{
    document.documentElement.style.setProperty("--font-size-off", (v || 0) + "px");
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
        // CABLES.UI.MODAL.showException(ex, op);
        new CABLES.UI.ModalException(ex,{"op":op});
    });

    this._corePatch.on("exceptionOp", function (e, objName)
    {
        new CABLES.UI.ModalException(e,{"opname":objName});
        // CABLES.UI.MODAL.showOpException(e, objName);
    });

    this._corePatch.on("criticalError", function (title, msg)
    {
        CABLES.UI.MODAL.showError(title, msg);
    });

    this._corePatch.on("renderDelayStart", function ()
    {
    });

    this._corePatch.on("renderDelayEnd", function ()
    {
    });
};


function startUi(cfg)
{
    logStartup("Init UI");
    CABLES.UI.initHandleBarsHelper();


    window.gui = new CABLES.UI.GUI(cfg);

    gui.on("uiloaded", () =>
    {
        new CABLES.UI.Tracking(gui);
    });

    if (gui.isRemoteClient)
        new CABLES.UI.NoPatchEditor();
    else
        CABLES.CMD.DEBUG.glguiFull();

    incrementStartup();
    gui.serverOps = new CABLES.UI.ServerOps(gui, cfg.patchId, () =>
    {
        gui.init();
        gui.checkIdle();
        gui.initCoreListeners();

        gui.corePatch().timer.setTime(0);

        if (!gui.corePatch().cgl.gl)
        {
            // console.log("yep,b0rken!.............");
            ele.byId("loadingstatus").remove();
            ele.byId("loadingstatusLog").remove();
            // CABLES.UI.MODAL.showException({ "message": "could not initialize webgl. try to restart your browser, or try another one" });
            return;
        }


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

                CABLES.editorSession.open();

                gui.setFontSize(CABLES.UI.userSettings.get("fontSizeOff"));

                CABLES.UI.userSettings.addEventListener("onChange", function (key, v)
                {
                    if (key == "fontSizeOff")
                    {
                        gui.setFontSize(v);
                    }

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

                gui.bindKeys();

                const socketClusterConfig = CABLES.sandbox.getSocketclusterConfig();
                gui.socket = new CABLES.UI.ScConnection(socketClusterConfig);
                gui.socketUi = new CABLES.UI.ScUi(gui.socket);
                if (gui.socket.multiplayerEnabled)
                {
                    gui.multiplayerUi = new CABLES.UI.ScUiMultiplayer(gui.socket);
                    gui.chat = new CABLES.UI.Chat(gui.mainTabs, gui.socket);
                }

                CABLES.UI.startIdleListeners();

                gui.jobs().updateJobListing();

                new CABLES.UI.HtmlInspector();


                if (CABLES.UI.userSettings.get("timelineOpened") == true) gui.showTiming();

                gui.maintabPanel.init();

                logStartup("finished loading cables");

                setTimeout(() =>
                {
                    if (CABLES.UI.userSettings.get("forceWebGl1")) CABLES.UI.notify("Forcing WebGl v1 ");
                }, 1000);

                if (window.module) module = window.module; // electronn workaround/fix

                gui.patchView.checkPatchErrors();

                gui.patchView.setCurrentSubPatch(0);

                ele.byId("patchnavhelperEmpty").innerHTML = CABLES.UI.TEXTS.patch_hint_overlay_empty;
                ele.byId("patchnavhelperBounds").innerHTML = CABLES.UI.TEXTS.patch_hint_overlay_outofbounds;

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

    logStartup("Init UI done");
}
