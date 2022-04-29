import Bookmarks from "./components/bookmarks";
import Introduction from "./components/introduction";
import Jobs from "./components/jobs";
import OpHistory from "./components/ophistory";
import OpParampanel from "./components/opparampanel/op_parampanel";
import CommandPallete from "./dialogs/commandpalette";
import OpSelect from "./dialogs/opselect";
import BottomInfoAreaBar from "./elements/bottomInfoAreaBar";
import TransformsOverlay from "./elements/canvasoverlays/transformsoverlay";
import MainTabPanel from "./elements/tabpanel/maintabpanel";
import TabPanel from "./elements/tabpanel/tabpanel";
import KeyBindingsManager from "./utils/keybindingsmanager";
import ModalDialog from "./dialogs/modaldialog";
import ModalPortValue from "./components/opparampanel/show_port_value_modal";
import uiconfig from "./uiconfig";
import MetaKeyframes from "./components/tabs/meta_keyframes";
import MetaCode from "./components/tabs/meta_code";
import MetaDoc from "./components/tabs/meta_doc";
import TexturePreviewer from "./components/texturepreviewer";
import MetaHistory from "./components/tabs/meta_history";
import Logger from "./utils/logger";
import OpDocs from "./components/opdocs";
import IconBar from "./elements/iconbar";
import ModalException from "./dialogs/modalexception";
import Tips from "./dialogs/tips";
import PatchView from "./components/patchview";
import TimeLineGui from "./components/timelinesvg/timeline";
import MetaOpParams from "./components/tabs/meta_opparams";
import { getHandleBarHtml } from "./utils/handlebars";
import WatchArrayTab from "./components/tabs/tab_watcharray";
import Gizmo from "./elements/canvasoverlays/transformgizmo";
import { showInfo } from "./elements/tooltips";
import ele from "./utils/ele";
import text from "./text";
import userSettings from "./components/usersettings";


export default class Gui
{
    constructor(cfg)
    {
        CABLES.EventTarget.apply(this);

        this._log = new Logger("gui");

        this.patchId = cfg.patchId;
        this._showTiming = false;
        this._showingEditor = false;

        this.keys = new KeyBindingsManager();
        this.opParams = new OpParampanel();
        this.opPortModal = new ModalPortValue();

        this.socket = null;
        this.isRemoteClient = cfg.remoteClient;
        this.spaceBarStart = 0;

        this.timingHeight = uiconfig.timingPanelHeight;
        this.rendererWidth = uiconfig.rendererDefaultWidth;
        this.rendererHeight = uiconfig.rendererDefaultHeight;

        this.CANVASMODE_NORMAL = 0;
        this.CANVASMODE_FULLSCREEN = 2;
        this.CANVASMODE_PATCHBG = 1;
        this._canvasMode = this.CANVASMODE_NORMAL;
        this.editorWidth = userSettings.get("editorWidth") || 350;
        this._timeoutPauseProfiler = null;
        this._cursor = "";
        this._restrictionMode = Gui.RESTRICT_MODE_LOADING;

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

        this._patchLoadEndiD = this._corePatch.on("patchLoadEnd",
            () =>
            {
                this._corePatch.off(this._patchLoadEndiD);
                this.setStateSaved();

                logStartup("Patch loaded");
            });

        this._corePatch.on("opcrash", (portTriggered) =>
        {
            this.showOpCrash(portTriggered.parent);
        });

        this.patchView = new PatchView(this._corePatch);

        this._corePatch.gui = true;

        this._jobs = new Jobs();
        this.cmdPallet = new CommandPallete();
        this._opselect = new OpSelect();
        this.introduction = new Introduction();
        this._gizmo = null;
        this._transformOverlay = new TransformsOverlay();

        this.opDocs = null;
        this.opHistory = new OpHistory();

        this.mainTabs = new TabPanel("maintabs");
        this.maintabPanel = new MainTabPanel(this.mainTabs);

        this.chat = null;

        this.metaTabs = new TabPanel("metatabpanel");
        this._savedState = true;

        this.metaOpParams = new MetaOpParams(this.metaTabs);

        this.metaDoc = new MetaDoc(this.metaTabs);
        this._metaCode = new MetaCode(this.metaTabs);


        this.metaTexturePreviewer = new TexturePreviewer(this.metaTabs, this._corePatch.cgl);
        this.metaKeyframes = new MetaKeyframes(this.metaTabs);
        this.bookmarks = new Bookmarks();
        this.history = new MetaHistory(this.metaTabs);
        this.bottomInfoArea = new BottomInfoAreaBar(this);

        this._favIconLink = document.createElement("link");
        document.getElementsByTagName("head")[0].appendChild(this._favIconLink);
        this._favIconLink.type = "image/x-icon";
        this._favIconLink.rel = "shortcut icon";

        this.user = null;
        this.onSaveProject = null;
        this.lastNotIdle = CABLES.now();

        this._oldCanvasWidth = 0;
        this._oldCanvasHeight = 0;
        this._oldShowingEditor = false;
        this._eventListeners = {};
        this._onBeforeUnloadListener = null;

        this._currentProject = null;
        this.tips = new Tips();
        this.currentModal = null;
        this.updateTheme();
    }

    project()
    {
        return this._currentProject;
    }

    setProject(p)
    {
        this._currentProject = p;
        gui.setProjectName(p.name || "unknown");

        ele.byId("nav_viewProjectLink").setAttribute("href", CABLES.sandbox.getCablesUrl() + "/p/" + p.shortId || p._id);
    }

    opSelect()
    {
        return this._opselect;
    }

    timeLine()
    {
        // if (!this._timeline) this._timeLine = new TimeLineUI();
        return this._timeLine;
    }

    scene()
    {
        return this._corePatch;
    }

    corePatch()
    {
        return this._corePatch;
    }

    jobs()
    {
        return this._jobs;
    }

    finishedLoading()
    {
        return CABLES.UI.loaded;
    }

    focusFindResult(idx, opid, subpatch, x, y)
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

        if (gui.find()) gui.find().setClicked(idx);
    }

    find(str)
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

        gui.maintabPanel.show(true);
        this._find.focus();
    }

    texturePreview()
    {
        return this.metaTexturePreviewer;
    }

    showSaveWarning()
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
        if (this.showBackupSaveWarning()) return true;
        return false;
    }

    showGuestWarning()
    {
        if (gui.isGuestEditor())
        {
            CABLES.UI.MODAL.showError(
                "Demo Editor",
                text.guestHint + "<br/><br/><a href=\"" + CABLES.sandbox.getCablesUrl() + "/signup\" target=\"_blank\" class=\"bluebutton\">Sign up</a> <a onclick=\"gui.pressedEscape();\" target=\"_blank\" class=\"greybutton\">Close</a>"
            );
            return true;
        }
    }

    showBackupSaveWarning()
    {
        if (!CABLES.sandbox.getPatchVersion()) return false;

        const html = "You are overwriting your current patch with a backup! Are you sure?<br/><br/>" +
            "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('');\"><span class=\"icon icon-save\"></span>Yes, save</a>&nbsp;&nbsp;" +
            "<a class=\"button\" onclick=\"gui.patchView.store.saveAs();\"><span class=\"icon icon-save\"></span>No, save as a copy</a>&nbsp;&nbsp;" +
            "<a class=\"button\" onclick=\"gui.closeModal();\">Cancel</a>&nbsp;&nbsp;";

        new ModalDialog(
            {
                "title": "Saving Backup",
                "html": html
            });
        return true;
    }

    canSaveInMultiplayer()
    {
        if (gui.socket && !gui.socket.canSaveInMultiplayer()) return false;
        else return true;
    }

    isGuestEditor()
    {
        return this.user.username == "guest";
    }

    getParamPanelEleId()
    {
        let eleId = "options";
        if (!gui.showTwoMetaPanels()) eleId = "options_meta";
        return eleId;
    }

    isShowingModal()
    {
        return gui.currentModal != null;
    }

    closeModal()
    {
        if (gui.currentModal)gui.currentModal.close();
    }

    showTwoMetaPanels()
    {
        let r = true;
        if (this.rendererWidth < 700) r = false;

        const haschanged = this._showingtwoMetaPanel != r;
        this._showingtwoMetaPanel = r;

        if (haschanged)
            this.metaOpParams.updateVisibility(r);

        return r;
    }

    watchArray(opid, which)
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op)
        {
            this._warn("opid not found:", opid);
            return;
        }
        const port = op.getPort(which);
        if (!port) this._warn("port not found:", which);

        new WatchArrayTab(gui.mainTabs, op, port, {});
        gui.maintabPanel.show(true);
    }

    pauseInteractionSplitpanes()
    {
        const iframes = ele.byQueryAll("iframe,canvas");
        for (let i = 0; i < iframes.length; i++) iframes[i].style["pointer-events"] = "none";
        this.patchView.pauseInteraction();
    }

    resumeInteractionSplitpanes()
    {
        const iframes = ele.byQueryAll("iframe,canvas");
        for (let i = 0; i < iframes.length; i++) iframes[i].style["pointer-events"] = "initial";
        this.patchView.resumeInteraction();
    }

    setLayout()
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
        this._elInfoArea = this._elInfoArea || ele.byId("infoArea");
        this._elInfoAreaParam = this._elInfoAreaParam || ele.byId("infoAreaParam");
        this._elProgressbar = this._elProgressbar || ele.byId("uploadprogresscontainer");


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

        this._elBreadcrumbNav = this._elBreadcrumbNav || ele.byId("breadcrumb_nav");

        this._elCablesCanvas = this._elCablesCanvas || ele.byId("cablescanvas");
        this._elGlUiPreviewLayer = this._elGlUiPreviewLayer || ele.byId("gluiPreviewLayer");

        let timelineHeight = this.timingHeight;

        const iconBarWidth = 0;

        let patchHeight = window.innerHeight;

        if (this.isRemoteClient)
        {
            this._setCanvasMode(this.CANVASMODE_FULLSCREEN);
            this._elGlCanvasDom.classList.add("maximized");
            this.rendererWidth = 0;
            this._showingEditor = false;

            this._elMenubar.style.zIndex = 40;
            const lis = ele.byQueryAll("#menubar li");

            lis[0].onclick = "";
            for (let i = 1; i < lis.length; i++)
            {
                lis[i].classList.add("hidden");
            }
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

        if (this._showTiming) patchHeight -= this.timingHeight;
        else patchHeight -= timelineUiHeight;

        let editorWidth = this.editorWidth;
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

            this._elBreadcrumbNav.style.left = editorWidth + iconBarWidth + 15 + "px";

            gui.mainTabs.updateSize();
        }
        else
        {
            this._elEditorMaximized.style.display = "none";

            if (this.mainTabs.getNumTabs() > 0) this._elEditorMinimized.style.display = "block";
            else this._elEditorMinimized.style.display = "none";

            this._elSplitterMaintabs.style.display = "none";
            // this._elEditorMinimized.style.top = 80 + "px";

            this._elBreadcrumbNav.style.left = iconBarWidth + 15 + "px";
        }


        // menu bar top
        let menupos = 0;
        const minmaxButtonSize = 35;
        if (this.maintabPanel.isVisible()) menupos += editorWidth;
        if (this.mainTabs.getNumTabs() > 0) menupos += minmaxButtonSize;
        this._elMenubar.style.left = menupos + 10 + "px";
        const rMenuBar = this._elMenubar.getBoundingClientRect();
        const mpMenuBar = document.getElementById("multiplayerbar");
        if (mpMenuBar) mpMenuBar.style.left = rMenuBar.x + rMenuBar.width + 10 + "px";

        this._elProgressbar.style.left = menupos + 10 + 8 + "px";
        this._elProgressbar.style.top = rMenuBar.y + rMenuBar.height - 5 + "px";

        // this._elProgressbar.style.left = menupos + 10 + "px";

        this._elBreadcrumbNav.style.left = menupos + 5 + "px";
        this._elBreadcrumbNav.style.top = 60 + "px";

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

            if (this._showTiming)
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

            if (!this._showTiming) this._elCanvasIconbarTimeline.style.display = "none";
            else this._elCanvasIconbarTimeline.style.display = "inline-block";
        }

        ele.byId("splitterTimeline").style.width = timelineWidth + "px";

        if (this._elIconbarLeft)
        {
            if (userSettings.get("hideSizeBar"))
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
            this._elOptions.style.top = this.rendererHeightScaled + "px";
            this._elOptions.style.width = optionsWidth + "px";
            this._elOptions.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elMeta.style.right = 0 + "px";
            this._elMeta.style.top = this.rendererHeightScaled + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elOptions.style.display = "block";
        }
        else
        {
            metaWidth = this.rightPanelWidth;
            this._elMeta.style.right = 0 + "px";

            this._elMeta.style.top = this.rendererHeightScaled + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elOptions.style.width = 0 + "px";
            this._elOptions.style.height = 0 + "px";
            this._elOptions.style.display = "none";
        }


        this._elMenubar.style.top = 0 + "px";


        if (!this.bottomInfoArea.showing)
        {
            this._elInfoArea.style.height = 0 + "px";
        }
        else
        {
            this._elInfoArea.style.height = infoAreaHeight + "px";
        }
        this._elInfoAreaParam.style.right = "0px";
        this._elInfoAreaParam.style.width = this.rendererWidth + "px";

        ele.byId("maintabs").style.top = menubarHeight + "px";
        ele.byId("maintabs").style.height = (window.innerHeight - menubarHeight - timelineHeight - infoAreaHeight) + "px";

        const tabPanelTop = ele.byQuery("#maintabs .tabpanel");
        let tabPanelTopHeight = 0;
        if (tabPanelTop)tabPanelTopHeight = tabPanelTop.getBoundingClientRect().height;

        ele.byQuery("#maintabs .contentcontainer").style.height = window.innerHeight - menubarHeight - infoAreaHeight - timelineHeight - tabPanelTopHeight + "px";

        ele.byQuery("#metatabpanel .contentcontainer").style.height = window.innerHeight - this.rendererHeightScaled - infoAreaHeight - menubarHeight + "px";

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
            this._elGlCanvasDom.setAttribute("height", this.rendererHeight * density);
            this._elGlCanvasDom.style.width = this.rendererWidth + "px";
            this._elGlCanvasDom.style.height = this.rendererHeight + "px";
            this._elCablesCanvas.style.width = this.rendererWidth + "px";
            this._elCablesCanvas.style.height = this.rendererHeight + "px";
            this._elCablesCanvas.style.right = "0px";
            this._elCablesCanvas.style.left = "initial";

            this._elCablesCanvas.style["transform-origin"] = "top right";
            this._elCablesCanvas.style.transform = "scale(" + this._corePatch.cgl.canvasScale + ")";
        }

        // flashing canvas overlay when saving
        this._elCanvasFlash.style.width = this.rendererWidth * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.height = this.rendererHeight * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.right = 0 + "px";
        this._elCanvasFlash.style.top = 0 + "px";

        this._elBgPreview.style.right = this.rightPanelWidth + "px";
        this._elBgPreview.style.top = menubarHeight + "px";

        this._elBgPreviewButtonContainer.style.right = this.rightPanelWidth + "px";

        this.emitEvent("setLayout");

        perf.finish();
    }

    _setCanvasMode(m)
    {
        this._canvasMode = m;
        this.emitEvent("canvasModeChange", m);
    }

    _switchCanvasSizeNormal()
    {
        this._setCanvasMode(this.CANVASMODE_NORMAL);
        this.rendererWidth = this._oldCanvasWidth;
        this.rendererHeight = this._oldCanvasHeight;
    }

    getCanvasMode()
    {
        return this._canvasMode;
    }

    cyclePatchBg()
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
    }

    cycleFullscreen()
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
    }

    isShowingTiming()
    {
        return this._showTiming;
    }

    showTiming()
    {
        this._showTiming = true;
        this.timeLine().show();
        this.setLayout();
        userSettings.set("timelineOpened", this._showTiming);
    }

    showLoadingProgress(show)
    {
        if (show)
        {
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
    }

    hideTiming()
    {
        gui.timeLine().hidden = true;
        this._showTiming = false;
        ele.hide(ele.byId("timing"));
        gui.setLayout();
        userSettings.set("timelineOpened", this._showTiming);
    }

    toggleTiming()
    {
        gui.timeLine().hidden = false;
        ele.show(ele.byId("timing"));
        userSettings.set("timelineOpened", true);

        this._showTiming = !this._showTiming;
        userSettings.set("timelineOpened", this._showTiming);
        // updateTimingIcon();
        this.setLayout();
        gui.timeLine().redraw();
    }

    refreshFileManager()
    {
        if (this.fileManager) this.fileManager.refresh();
        else this.showFileManager(null, true);
    }

    showFileManager(cb, unserInteraction)
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
    }

    showFileSelect(inputId, filterType, opid, previewId)
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
    }

    setProjectName(name)
    {
        if (name && name !== "undefined")
        {
            document.getElementById("patchname").innerHTML = name;
            document.getElementById("patchname").dataset.patchname = name;
            gui.corePatch().name = name;
        }
    }

    createProject()
    {
        if (gui.showGuestWarning()) return;


        new ModalDialog({
            "prompt": true,
            "title": "New Project",
            "text": "Enter a name for your new Project",
            "promptValue": "My new Project",
            "promptOk": (name) =>
            {
                if (name)
                    CABLESUILOADER.talkerAPI.send("newPatch", { "name": name }, function (err, d)
                    {
                        let id = d._id;
                        if (d.shortId) id = d.shortId;
                        CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": id });
                    });
            }
        });
    }


    /* Goes through all nav items and replaces "mod" with the OS-dependent modifier key */
    replaceNavShortcuts()
    {
        let els = ele.byClassAll("shortcut");

        for (let i in els)
        {
            const newShortcut = this.bottomInfoArea.replaceShortcuts(els[i].innerHTML || "");
            // const newShortcut = (els[i].innerHTML || "").replace("mod", osMod);
            if (els[i].innerHTML) els[i].innerHTML = newShortcut;
        }
    }

    serializeForm(selector)
    {
        const json = {};
        Array.from(ele.byQuery(selector).elements).forEach((e) =>
        {
            json[e.getAttribute("name")] = e.value;
        });
        return json;
    }

    helperContextMenu(el)
    {
        let iconTransforms = "icon icon-check hidden";
        if (CABLES.UI.showCanvasTransforms) iconTransforms = "icon icon-check";

        let iconShowAllHelpers = "icon icon-check hidden";
        if (userSettings.get("helperMode")) iconShowAllHelpers = "icon icon-check";

        let iconShowCurrentOpHelper = "icon icon-check hidden";
        if (userSettings.get("helperModeCurrentOp")) iconShowCurrentOpHelper = "icon icon-check";

        let iconCurrentOpTransform = "icon icon-check hidden";
        if (userSettings.get("toggleHelperCurrentTransforms")) iconCurrentOpTransform = "icon icon-check";

        CABLES.contextMenu.show(
            {
                "refresh": () => { gui.corePatch().cgl.canvas.focus(); gui.helperContextMenu(el); },
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
    }

    rendererContextMenu(el)
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
    }

    rendererAspectMenu(el)
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
    }

    showConverter(converterId, projectId, fileId, converterName, fileName = null)
    {
        const html = getHandleBarHtml(
            "params_convert", {
                "converterId": converterId,
                "converterName": converterName,
                "projectId": projectId,
                "fileId": fileId,
                "fileName": fileName
            });

        new ModalDialog({ "html": html });
    }

    converterStart(projectId, fileId, converterId)
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
                ele.show(ele.byId("modalClose"));

                if (err)
                {
                    ele.byId("converteroutput").innerHTML = "Error: something went wrong while converting..." + (err.msg || "");
                }
                else
                {
                    let html = "";

                    if (res && res.info) html = res.info;
                    else html = "Finished!";

                    ele.byId("modalClose").classList.remove("hidden");
                    ele.byId("converteroutput").innerHTML = html;
                }
                gui.refreshFileManager();
            });
    }

    bind(cb)
    {
        this.bottomInfoArea.on("changed", this.setLayout.bind(this));

        ele.byId("nav_cmdplt").addEventListener("click", (event) => { gui.cmdPallet.show(); });
        ele.byId("nav_search").addEventListener("click", (event) => { gui.find(""); });

        ele.byId("nav_createBackup").addEventListener("click", (event) => { CABLES.CMD.PATCH.createBackup(); });
        ele.byId("nav_viewBackups").addEventListener("click", (event) => { CABLES.CMD.PATCH.showBackups(); });
        ele.byId("nav_cablesweb").addEventListener("click", (event) => { const win = window.open(CABLES.sandbox.getCablesUrl(), "_blank"); win.focus(); });

        // ele.byQueryAll(".nav_create_from_template").forEach((el) =>
        // {
        //     const href = el.dataset.href;
        //     el.addEventListener("click", () =>
        //     {
        //         const win = window.open(CABLES.sandbox.getCablesUrl() + href, "_blank");
        //         win.focus();
        //     });
        // });

        ele.byId("nav_preferences").addEventListener("click", () => { CABLES.CMD.UI.showPreferences(); });
        ele.byId("button_toggleTiming").addEventListener("click", () => { gui.toggleTiming(); });
        ele.byId("nav_viewProjectLink").addEventListener("click", (e) =>
        {
            e.preventDefault();
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
        ele.byId("nav_help_forum").addEventListener("click", (event) => { window.open("https://github.com/cables-gl/cables_docs/discussions", "_blank"); });
        ele.byId("nav_help_tipps").addEventListener("click", (event) => { gui.tips.show(); });

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
    }

    bindKeys()
    {
        if (gui.isRemoteClient) return;

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
                if (!(document.activeElement && !document.activeElement.classList.contains("ace_text-input") && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA"))
                || (document.activeElement && document.activeElement.classList.contains("notIgnoreEscape")))
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

        this.keys.key(["Escape"], "Toggle Tab Area", "down", null, { "altKey": true }, (e) => { this.maintabPanel.toggle(true); this.setLayout(); });

        this.keys.key("p", "Open Command Palette", "down", null, { "cmdCtrl": true }, (e) => { this.cmdPallet.show(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true }, (e) => { this.cycleFullscreen(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) => { this.cyclePatchBg(); });

        this.keys.key("z", "undo", "down", null, { "ignoreInput": true, "cmdCtrl": true }, (e) => { CABLES.UI.undo.undo(); });
        this.keys.key("z", "redo", "down", null, { "ignoreInput": true, "cmdCtrl": true, "shiftKey": true }, (e) => { CABLES.UI.undo.redo(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            const eleAceTextEditor = ele.byQuery("#ace_editors textarea");
            if (!(eleAceTextEditor && ele.hasFocus(eleAceTextEditor)) && !gui.isShowingModal()) CABLES.CMD.UI.showSearch();
            else e.dontPreventDefault = true;
        });

        this.keys.key("s", "Save patch as new patch", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) =>
        {
            gui.patchView.store.saveAs();
        });

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
    }

    pressedEscape(e)
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
            this.setLayout();
            this.canvasUi.showCanvasModal(true);
        }
        else if (CABLES.UI.suggestions)
        {
            CABLES.UI.suggestions.close();
            CABLES.UI.suggestions = null;
        }
        else if (gui.cmdPallet.isVisible()) gui.cmdPallet.close();
        else if (CABLES.contextMenu.isVisible()) CABLES.contextMenu.close();
        else if (gui.isShowingModal())
        {
            gui.closeModal();
            if (this._showingEditor) this.editor().focus();
        }
        else if (this.maintabPanel.isVisible()) this.maintabPanel.hide();
        else if (this._showingEditor) this.closeEditor();
        else
        {
            if (this._opselect.isOpen()) this._opselect.close();
            else
            if (e)
            {
                gui.opSelect().show({
                    "subPatch": this.patchView.getCurrentSubPatch(),
                    "x": 0,
                    "y": 0
                });
            }
        }

        setTimeout(() =>
        {
            ele.forEachClass("tooltip", (el) =>
            {
                ele.hide(el);
            });
        }, 50);
    }

    showOpCrash(op)
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
    }

    showUiElements()
    {
        ele.show(ele.byId("cablescanvas"));
        ele.hide(ele.byId("loadingstatus"));
        ele.show(ele.byId("mainContainer"));

        ele.byId("menubar").classList.remove("hidden");

        if (userSettings.get("showUIPerf") == true) CABLES.UI.uiProfiler.show();

        this._elGlCanvasDom.addEventListener("pointerenter", (e) =>
        {
            gui.showInfo(text.canvas);
        });

        this._elGlCanvasDom.addEventListener("pointerleave", (e) =>
        {
            CABLES.UI.hideInfo();
        });

        if (userSettings.get("presentationmode")) CABLES.CMD.UI.startPresentationMode();

        if (this._corePatch.cgl.aborted)
        {
            CABLES.UI.MODAL.showError("no webgl", "your browser does not support webgl");
            return;
        }

        if (userSettings.get("fileManagerOpened") == true) this.showFileManager();

        this.iconBarLeft = new IconBar("sidebar_left");
        this.iconBarPatchNav = new IconBar("sidebar_bottom");
        this.iconBarTimeline = new IconBar("sidebar_timeline");


        if (this.getRestriction() != Gui.RESTRICT_MODE_REMOTEVIEW &&
                userSettings.get("showTipps") &&
                userSettings.get("introCompleted")) gui.tips.show();

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

        gui.metaTabs.loadCurrentTabUsersettings();

        gui.patchView.focus();
    }

    showWelcomeNotifications()
    {
        function show(html)
        {
            if (html && html.length > 0) CABLES.UI.MODAL.show(
                "<div style=\"min-height:30px;max-height:500px;overflow-y:scroll;\">" + html + "</div>" +
                "<center><a class=\"bluebutton\" onclick=\"gui.closeModal();\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a></center>"
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


        if (!gui.isRemoteClient && CABLES.sandbox.showBrowserWarning) CABLES.sandbox.showBrowserWarning();
        if (!gui.isRemoteClient && CABLES.sandbox.showStartupChangelog) CABLES.sandbox.showStartupChangelog();
    }

    getOpDoc(opname, html, cb)
    {
        cb(this.opDocs.get2(opname));
    }

    metaCode()
    {
        return this._metaCode;
    }

    showSettings(unserInteraction)
    {
        window.onmessage = (e) =>
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
        };

        const url = CABLES.sandbox.getCablesUrl() + "/patch/" + this.project()._id + "/settingsiframe";
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true, "gotoUrl": CABLES.sandbox.getCablesUrl() + "/patch/" + this.project()._id + "/settings" }, true);
    }

    setCursor(str)
    {
        if (!str)str = "auto";
        document.body.classList.remove("cursor_" + this._cursor);
        document.body.classList.add("cursor_" + str);
        this._cursor = str;
    }

    getSavedState()
    {
        return this._savedState;
    }

    setTransformGizmo(params)
    {
        if (!this._gizmo) this._gizmo = new Gizmo(this.scene().cgl);
        if (!userSettings.get("toggleHelperCurrentTransforms"))
        {
            this._gizmo.set(null);
            return;
        }

        this._gizmo.set(params);
    }

    transformOverlay()
    {
        return this._transformOverlay;
    }

    setTransform(id, x, y, z)
    {
        this._transformOverlay.add(this.scene().cgl, id, x, y, z);
    }

    setElementBgPattern(el)
    {
        if (!el) return;
        el.classList.remove("bgPatternDark");
        el.classList.remove("bgPatternBright");
        el.classList.remove("bgPatternBlack");
        el.classList.remove("bgPatternWhite");
        el.classList.remove("bgPatternRed");
        el.classList.remove("bgPatternGrey");
        el.classList.remove("bgPatternBlue");

        el.classList.add(userSettings.get("bgpattern") || "bgPatternDark");
    }

    notIdling()
    {
        this.lastNotIdle = CABLES.now();
    }

    checkIdle()
    {
        const idling = (CABLES.now() - this.lastNotIdle) / 1000;
        if (idling > 30 * 60)
        {
        }
        else
        {
            setTimeout(gui.checkIdle, 1000 * 60 * 2);
        }
    }

    setStateUnsaved()
    {
        if (this._savedState)
        {
            let title = "";
            if (CABLES.sandbox.isDevEnv())title = "DEV ";
            title += gui.project.name + " *";
            document.title = title;

            this._favIconLink.href = "/favicon/favicon_orange.ico";
            this._savedState = false;

            document.getElementById("patchname").classList.add("warning");

            this._onBeforeUnloadListener = (event) =>
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
            window.addEventListener("beforeunload", this._onBeforeUnloadListener);
        }
    }

    setStateSaved()
    {
        this._savedState = true;
        this._favIconLink.href = "/favicon/favicon.ico";
        document.getElementById("patchname").classList.remove("warning");

        let title = "";
        if (CABLES.sandbox.isDevEnv())title = "DEV ";
        title += gui.project.name;
        document.title = title;
        window.removeEventListener("beforeunload", this._onBeforeUnloadListener);
    }

    reloadDocs(cb)
    {
        gui.opDocs = new OpDocs();
        if (cb)cb();
    }

    pauseProfiling()
    {
        if (!this._corePatch.cgl || !this._corePatch.cgl.profileData) return;
        this._corePatch.cgl.profileData.pause = true;

        clearTimeout(this._timeoutPauseProfiler);
        this._timeoutPauseProfiler = setTimeout(() =>
        {
            this._corePatch.cgl.profileData.pause = false;
        }, 200);
    }

    hideElementsByRestriction(r)
    {
        if (r == Gui.RESTRICT_MODE_REMOTEVIEW)
        {
            ele.byId("undev").style.display = "none";
            ele.byId("infoAreaContainer").style.display = "none";
        }

        if (r < Gui.RESTRICT_MODE_FULL)
        {
            const tabpanel = ele.byId("metatabpanel");
            if (tabpanel)
            {
                tabpanel.querySelectorAll(".tabcontent").forEach((tab) =>
                {
                    tab.classList.add("readonly");
                    tab.inert = true;
                });
            }
            const timeline = ele.byId("timing");
            if (timeline)
            {
                timeline.classList.add("readonly");
            }
            const tlIconBar = ele.byId("iconbar_sidebar_timeline");
            if (tlIconBar) ele.hide(tlIconBar);
        }
        else
        {
            const tabpanel = ele.byId("metatabpanel");
            if (tabpanel)
            {
                tabpanel.querySelectorAll(".tabcontent").forEach((tab) =>
                {
                    tab.inert = false;
                    tab.classList.remove("readonly");
                });
            }
            const timeline = ele.byId("timing");
            if (timeline)
            {
                timeline.classList.remove("readonly");
            }

            const tlIconBar = ele.byId("iconbar_sidebar_timeline");
            if (tlIconBar) ele.show(tlIconBar);
        }

        if (this.iconBarLeft) this.iconBarLeft.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
        if (this.iconBarPatchNav) this.iconBarPatchNav.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
        if (this.bottomInfoArea) this.bottomInfoArea.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
    }

    init(next)
    {
        this.canvasUi = new CABLES.UI.CanvasUi(this.corePatch().cgl);

        ele.byId("timing").innerHTML = getHandleBarHtml("timeline_controler");
        this._timeLine = new TimeLineGui();

        if (this.isRemoteClient) this.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
        else this.setRestriction(Gui.RESTRICT_MODE_FULL);

        CABLES.UI.initSplitPanes();

        ele.byId("undev").addEventListener("pointerEnter", (e) =>
        {
            gui.showInfo(text.undevLogo);
        });
        ele.byId("undev").addEventListener("pointerLeave", (e) =>
        {
            CABLES.UI.hideInfo();
        });

        ele.byId("timelineui").addEventListener("pointerEnter", (e) =>
        {
            gui.showInfo(text.timelineui);
        });

        ele.byId("timelineui").addEventListener("pointerLeave", (e) =>
        {
            CABLES.UI.hideInfo();
        });

        gui.replaceNavShortcuts();
    }

    setFontSize(v)
    {
        document.documentElement.style.setProperty("--font-size-off", (v || 0) + "px");
    }

    setUser(u)
    {
        gui.user = u;
    }

    updateTheme()
    {
        if (userSettings.get("theme-bright")) document.body.classList.add("bright");
        else document.body.classList.remove("bright");
    }

    // todo use eventtarget...
    addEventListener(name, cb)
    {
        this._log.warn("deprecated eventlistener:", name);
        console.log((new Error()).stack);
        this._eventListeners[name] = this._eventListeners[name] || [];
        this._eventListeners[name].push(cb);
    }

    initCoreListeners()
    {
        this._corePatch.on("exception", function (ex, op)
        {
            new ModalException(ex, { "op": op });
        });

        this._corePatch.on("exceptionOp", function (e, objName, op)
        {
            new ModalException(e, { "opname": objName, "op": op });
        });

        this._corePatch.on("criticalError", function (title, msg)
        {
            new ModalException(new Error(msg), {});
        });

        this._corePatch.on("renderDelayStart", function ()
        {
        });

        this._corePatch.on("renderDelayEnd", function ()
        {
        });

        this._corePatch.cgl.on("webglcontextlost", () =>
        {
            new CABLES.UI.ModalDialog({
                "warnning": true,
                "title": "Context lost",
                "text": "something went wrong. webgl context was lost. reload page or try restarting your browser",
            });
        });
    }

    showInfoParam(txt)
    {
        showInfo(txt, true);
    }

    showInfo(txt)
    {
        showInfo(txt);
    }

    setRestriction(r)
    {
        this._restrictionMode = r;
        this.hideElementsByRestriction(r);
        this.emitEvent("restrictionChange", r);
        this.setLayout();
    }

    getRestriction()
    {
        return this._restrictionMode;
    }
}

Gui.RESTRICT_MODE_LOADING = 0;
Gui.RESTRICT_MODE_REMOTEVIEW = 10;
Gui.RESTRICT_MODE_FOLLOWER = 20;
Gui.RESTRICT_MODE_EXPLORER = 30;
Gui.RESTRICT_MODE_FULL = 40;
