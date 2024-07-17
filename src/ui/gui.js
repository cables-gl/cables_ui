import { Logger, Events } from "cables-shared-client";
import MetaKeyframes from "./components/tabs/meta_keyframes.js";
import Bookmarks from "./components/bookmarks.js";
import Introduction from "./components/introduction.js";
import Jobs from "./components/jobs.js";
import OpHistory from "./components/ophistory.js";
import OpParampanel from "./components/opparampanel/op_parampanel.js";
import CommandPallete from "./dialogs/commandpalette.js";
import OpSelect from "./dialogs/opselect.js";
import BottomInfoAreaBar from "./elements/bottominfoareabar.js";
import TransformsOverlay from "./elements/canvasoverlays/transformsoverlay.js";
import MainTabPanel from "./elements/tabpanel/maintabpanel.js";
import TabPanel from "./elements/tabpanel/tabpanel.js";
import KeyBindingsManager from "./utils/keybindingsmanager.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ModalPortValue from "./components/opparampanel/show_port_value_modal.js";
import uiconfig from "./uiconfig.js";
import TexturePreviewer from "./components/texturepreviewer.js";
import OpDocs from "./components/opdocs.js";
import IconBar from "./elements/iconbar.js";
import ModalError from "./dialogs/modalerror.js";
import Tips from "./dialogs/tips.js";
import PatchView from "./components/patchview.js";
import TimeLineGui from "./components/timelinesvg/timeline.js";
import MetaOpParams from "./components/tabs/meta_opparams.js";
import { getHandleBarHtml } from "./utils/handlebars.js";
import WatchArrayTab from "./components/tabs/tab_watcharray.js";
import Gizmo from "./elements/canvasoverlays/transformgizmo.js";
import { showInfo } from "./elements/tooltips.js";
import text from "./text.js";
import userSettings from "./components/usersettings.js";
import LongPressConnector from "./elements/longpressconnector.js";
import CanvasManager from "./components/canvas/canvasmanager.js";
import GuiRestrictions from "./components/guirestrictions.js";
import PatchPanel from "./components/patchpanel.js";
import SavedState from "./components/savedstate.js";
import defaultTheme from "./defaulttheme.json";
import ModalLoading from "./dialogs/modalloading.js";
import FileManagerEditor from "./components/filemanager_edit.js";
import subPatchOpUtil from "./subpatchop_util.js";
import { notify, notifyError } from "./elements/notification.js";
import LoggingTab from "./components/tabs/tab_logfilter.js";
import HtmlElementOverlay from "./elements/canvasoverlays/htmlelementoverlay.js";
import FileManager from "./components/filemanager.js";
import BottomTabPanel from "./elements/tabpanel/bottomtabpanel.js";

export default class Gui extends Events
{
    constructor(cfg)
    {
        super();
        this._log = new Logger("gui");

        this.theme = defaultTheme;

        this._showTiming = false;

        /**
         * @type {ServerOps}
         */
        this.serverOps = null;

        this.canvasManager = new CanvasManager();
        this.keys = new KeyBindingsManager();
        this.opParams = new OpParampanel();
        this.opPortModal = new ModalPortValue();
        this.longPressConnector = new LongPressConnector(this);

        this.socket = null;
        this.isRemoteClient = cfg.remoteClient;
        this._spaceBarStart = 0;

        this.timingHeight = uiconfig.timingPanelHeight;
        this.rendererWidth = uiconfig.rendererDefaultWidth;
        this.rendererHeight = uiconfig.rendererDefaultHeight;
        this.showingtwoMetaPanel = true;

        this.patchParamPanel = new PatchPanel();

        this.canvasMagnifier = null;

        this.userSettings = userSettings;

        this.editorWidth = userSettings.get("editorWidth") || 350;
        this._timeoutPauseProfiler = null;
        this._cursor = "";
        this.restriction = new GuiRestrictions();
        this._restrictionMode = Gui.RESTRICT_MODE_LOADING;

        this._modalLoading = null;
        this._modalLoadingCount = 0;

        if (!cfg) cfg = {};
        if (!cfg.usersettings) cfg.usersettings = { "settings": {} };

        let patchConfig = {
            "editorMode": true,
            "canvas":
                {
                    "forceWebGl1": cfg.usersettings.settings.forceWebGl1 === true || cfg.usersettings.settings.forceWebGl1 === "true",
                    "alpha": true,
                    "premultipliedAlpha": true,
                },
            "variables": {}
        };
        if (cfg.patchConfig) patchConfig = Object.assign(patchConfig, cfg.patchConfig);
        this._corePatch = CABLES.patch = new CABLES.Patch(patchConfig);

        this._patchLoadEndiD = this._corePatch.on("patchLoadEnd",
            () =>
            {
                this._corePatch.off(this._patchLoadEndiD);
                if (window.logStartup) logStartup("patch loaded 2");

                gui.bookmarks.updateDynamicCommands();
                gui.patchView.highlightExamplePatchOps();
                gui.savedState.setSaved("patch load end", 0);

                if (window.logStartup) logStartup("Patch loaded");
            });

        this._corePatch.on("opcrash", (portTriggered) =>
        {
            this.showOpCrash(portTriggered.op);
        });

        this.on("libLoadError", (libName) =>
        {
            this.showLibLoadError(libName);
        });

        this.patchView = new PatchView(this._corePatch);

        this._corePatch.gui = true;

        this._jobs = new Jobs();
        this.cmdPallet = new CommandPallete();

        this.fileManager = null;
        this.fileManagerEditor = new FileManagerEditor();

        this._opselect = new OpSelect();
        this.introduction = new Introduction();
        this._gizmo = [];
        this.transformOverlay = new TransformsOverlay();
        this.htmlEleOverlay = null;

        this.opDocs = new OpDocs();
        this.opHistory = new OpHistory();

        this.mainTabs = new TabPanel("maintabs");
        this.maintabPanel = new MainTabPanel(this.mainTabs);

        this.bottomTabs = new TabPanel("bottomtabs");
        this.bottomTabPanel = new BottomTabPanel(this.bottomTabs);

        this.chat = null;

        this.metaTabs = new TabPanel("metatabpanel");

        this.savedState = new SavedState(this);
        this.savedState.pause();
        // this._savedState = true;
        this._savedStateChangesBlueprintSubPatches = [];

        this.metaOpParams = new MetaOpParams(this.metaTabs);

        // this.metaDoc = new MetaDoc(this.metaTabs);

        this.metaTexturePreviewer = new TexturePreviewer(this.metaTabs, this._corePatch.cgl);
        this.metaKeyframes = null;
        // this.metaKeyframes = new MetaKeyframes(this.metaTabs);
        this.bookmarks = new Bookmarks();
        // this.history = new MetaHistory(this.metaTabs);
        this.bottomInfoArea = new BottomInfoAreaBar(this);

        // this._favIconLink = document.createElement("link");
        // this._favIconLink.type = "image/x-icon";
        // this._favIconLink.rel = "shortcut icon";
        // document.head.appendChild(this._favIconLink);

        this.user = null;
        this.onSaveProject = null;
        this.lastNotIdle = CABLES.now();

        this._oldCanvasWidth = 0;
        this._oldCanvasHeight = 0;
        this._oldShowingEditor = false;
        // this._onBeforeUnloadListener = null;

        this._currentProject = null;
        this.tips = new Tips();
        this.currentModal = null;
    }


    get patchId()
    {
        return gui.project().shortId;
    }

    project()
    {
        return this._currentProject;
    }

    setProject(p)
    {
        this._currentProject = p;
        gui.setProjectName(p.name || "unknown");
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

    get shouldDrawOverlay()
    {
        // if (gui.canvasManager.getCanvasUiBar().isCanvasFocussed) return false;


        if (!userSettings.get("overlaysShow")) return false;

        return true;
    }

    startModalLoading(title)
    {
        this._modalLoadingCount++;
        this._modalLoading = this._modalLoading || new ModalLoading(title);
        return this._modalLoading;
    }

    endModalLoading()
    {
        this._modalLoadingCount--;
        if (this._modalLoadingCount == 0 && this._modalLoading)
        {
            this._modalLoading.close();
            this._modalLoading = null;
        }
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
            this.patchView.unselectAllOps();
            this.patchView.selectOpId(opid);
            this.patchView.setCurrentSubPatch(subpatch, () =>
            {
                // this.patchView.focus();

                gui.opParams.show(opid);
                this.patchView.focusOpAnim(opid);
                this.patchView.patchRenderer.viewBox.centerSelectedOps();
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
                text.guestHint + "<br/><br/><a href=\"" + CABLES.platform.getCablesUrl() + "/signup\" target=\"_blank\" class=\"bluebutton\">Sign up</a> <a onclick=\"gui.pressedEscape();\" target=\"_blank\" class=\"button\">Close</a>"
            );
            return true;
        }
    }

    showBackupSaveWarning()
    {
        if (!CABLES.platform.getPatchVersion()) return false;

        const html = "You are overwriting your original patch with a backup! Are you sure?<br/><br/>Saving will redirect back to the original patch.<br/><br/>" +
            "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('');\"><span class=\"icon icon-save\"></span>Yes, save</a>&nbsp;&nbsp;" +
            "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.saveAs();\"><span class=\"icon icon-save\"></span>No, save as a copy</a>&nbsp;&nbsp;" +
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
        if (this.rendererWidth < 1000) r = false;

        const haschanged = this.showingtwoMetaPanel != r;
        this.showingtwoMetaPanel = r;

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


        this._elGlCanvasDom = this.canvasManager.currentCanvas() || ele.byId("glcanvas");

        this._elMaintab = this._elMaintab || ele.byId("maintabs");
        this._elEditor = this._elEditor || ele.byId("editor");
        this._elLibrary = this._elLibrary || ele.byId("library");
        this._elSplitterMaintabs = this._elSplitterMaintabs || ele.byId("splitterMaintabs");
        this._elEditorMinimized = this._elEditorMinimized || ele.byId("editorminimized");
        this._elEditorMaximized = this._elEditorMaximized || ele.byId("editormaximized");

        this._elTLoverviewtimeline = this._elTLoverviewtimeline || ele.byId("overviewtimeline");
        this._elTLtimelineTitle = this._elTLtimelineTitle || ele.byId("timelineTitle");
        this._elTLkeycontrols = this._elTLkeycontrols || ele.byId("keycontrols");
        this._elTLtimetimeline = this._elTLtimetimeline || ele.byId("timetimeline");
        this._elTLsplitterTimeline = this._elTLsplitterTimeline || ele.byId("splitterTimeline");

        this._elBreadcrumbNav = this._elBreadcrumbNav || ele.byId("breadcrumb_nav");

        this._elCablesCanvasContainer = this._elCablesCanvasContainer || ele.byId("cablescanvas");
        this._elGlUiPreviewLayer = this._elGlUiPreviewLayer || ele.byId("gluiPreviewLayer");

        let timelineHeight = this.timingHeight;

        const iconBarWidth = 0;
        this.canvasInfoUiHeight = 36;

        let patchHeight = window.innerHeight;

        if (this.isRemoteClient)
        {
            this.canvasManager.mode = this.canvasManager.CANVASMODE_FULLSCREEN;
            this._elGlCanvasDom.classList.add("maximized");
            this.rendererWidth = 0;
        }

        if (this.isRemoteClient)
        {
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
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN)
        {
            this.rendererWidth = window.innerWidth;
            this.rendererHeight = window.innerHeight;
        }

        this.rendererWidthScaled = this.rendererWidth * this._corePatch.cgl.canvasScale;
        this.rendererHeightScaled = this.rendererHeight * this._corePatch.cgl.canvasScale;

        this.rendererWidth = Math.floor(this.rendererWidth);
        this.rendererHeight = Math.floor(this.rendererHeight);

        let patchWidth = window.innerWidth - this.rendererWidthScaled;
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_PATCHBG)
        {
            patchWidth = window.innerWidth - this.rightPanelWidth;
            this.rendererHeightScaled = 0;
        }
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_POPOUT) this.rendererHeightScaled = 0;



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

        if (this._showTiming || this.bottomTabPanel.isVisible()) patchHeight -= this.timingHeight;
        else patchHeight -= timelineUiHeight;

        let editorWidth = this.editorWidth;
        if (editorWidth > patchWidth - 50) editorWidth = patchWidth - 50;

        const patchLeft = iconBarWidth;
        const acds = 1;

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
            this._elSplitterMaintabs.style.height = (patchHeight) + 2 + "px";
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
        const mpMenuBar = ele.byId("multiplayerbar");
        if (mpMenuBar) mpMenuBar.style.left = rMenuBar.x + rMenuBar.width + 10 + "px";

        this._elProgressbar.style.left = menupos + 10 + 8 + "px";
        this._elProgressbar.style.top = rMenuBar.y + rMenuBar.height - 5 + "px";

        // this._elProgressbar.style.left = menupos + 10 + "px";

        this._elBreadcrumbNav.style.left = menupos + 5 + "px";
        this._elBreadcrumbNav.style.top = 60 + "px";

        if (this.rendererWidth < 100) this.rendererWidth = 100;

        this.rightPanelWidth = this.rendererWidthScaled;
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_PATCHBG) this.rightPanelWidth = this.splitpanePatchPos;

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

            if (this._showTiming || this.bottomTabPanel.isVisible())
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
                timelineHeight = timelineUiHeight;
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


        this._elIconbarBottom = this._elIconbarBottom || ele.byId("iconbar_sidebar_bottom");
        if (this._elIconbarBottom)
        {
            this._elIconbarBottom.style.right = this.rendererWidthScaled + 20 + "px";
            this._elIconbarBottom.style.bottom = 10 + timelineHeight + infoAreaHeight + "px";
        }

        this._elIconbarTimeline = this._elIconbarTimeline || ele.byId("iconbar_sidebar_timeline");
        if (this._elIconbarTimeline)
        {
            this._elIconbarTimeline.style.left = (patchWidth / 2) + "px";
            this._elIconbarTimeline.style.bottom = 10 + timelineHeight + infoAreaHeight + "px";

            if (!this._showTiming) this._elIconbarTimeline.style.display = "none";
            else this._elIconbarTimeline.style.display = "inline-block";
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
            this._elOptions.style.top = (this.rendererHeightScaled + this.canvasInfoUiHeight) + "px";
            this._elOptions.style.width = optionsWidth + "px";
            this._elOptions.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elMeta.style.right = 0 + "px";
            this._elMeta.style.top = (this.rendererHeightScaled + this.canvasInfoUiHeight) + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elOptions.style.display = "block";
        }
        else
        {
            metaWidth = this.rightPanelWidth;
            this._elMeta.style.right = 0 + "px";

            this._elMeta.style.top = (this.rendererHeightScaled + this.canvasInfoUiHeight) + "px";
            this._elMeta.style.width = metaWidth + "px";
            this._elMeta.style.height = window.innerHeight - this.rendererHeightScaled + "px";

            this._elOptions.style.width = 0 + "px";
            this._elOptions.style.height = 0 + "px";
            this._elOptions.style.display = "none";
        }

        ele.byId("canvasicons").style.height = this.canvasInfoUiHeight + "px";
        ele.byId("canvasicons").style.width = (this.rendererWidth * this._corePatch.cgl.canvasScale) + "px";
        ele.byId("canvasicons").style.right = (0) + "px";

        const widthResizeIcon = 30;
        ele.byId("canvasIconBar").style.width = (this.rendererWidth - widthResizeIcon - 10) + "px";


        let top = 0;
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_PATCHBG) top = 0;
        else top = this.rendererHeightScaled + 1;
        ele.byId("canvasicons").style.top = top + "px";

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


        if (this.bottomTabPanel.isVisible())
        {
            this._eleBottomTabs = ele.byId("bottomtabs");

            this._eleBottomTabs.style.width = timelineWidth + "px";
            this._eleBottomTabs.style.bottom = infoAreaHeight + "px";
            this._eleBottomTabs.style.height = this.timingHeight + "px";
            this._eleBottomTabs.style.left = iconBarWidth + "px";
        }

        const tabPanelTop = ele.byQuery("#maintabs .tabpanel");
        let tabPanelTopHeight = 0;
        if (tabPanelTop)tabPanelTopHeight = tabPanelTop.getBoundingClientRect().height;

        ele.byQuery("#maintabs .contentcontainer").style.height = window.innerHeight - menubarHeight - infoAreaHeight - timelineHeight - tabPanelTopHeight + "px";

        let metaTabPanelTabsHeight = 0;
        const metaTabPanelTabs = ele.byQuery("#metatabpanel .tabpanel");
        if (metaTabPanelTabs)metaTabPanelTabsHeight = metaTabPanelTabs.getBoundingClientRect().height;


        ele.byQuery("#metatabpanel .contentcontainer").style.height = window.innerHeight - this.rendererHeightScaled - infoAreaHeight - metaTabPanelTabsHeight - menubarHeight - 1 + "px";
        // console.log("tabPanelTopHeight", tabPanelTopHeight);


        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_POPOUT)
        {
            this._elCablesCanvasContainer.style.left = iconBarWidth + "px";
            this._elCablesCanvasContainer.style.right = "initial";
            this._elCablesCanvasContainer.style.top = "0px";
            this._elCablesCanvasContainer.style.width = "0px";
            this._elCablesCanvasContainer.style.height = "0px";
            this._elCablesCanvasContainer.style["z-index"] = 1;
        }
        else
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN)
        {
            this._elCablesCanvasContainer.style.left = 0 + "px";
            this._elCablesCanvasContainer.style.right = "initial";

            this._elCablesCanvasContainer.style.width = this._elGlCanvasDom.style.width = window.innerWidth + "px";
            this._elCablesCanvasContainer.style.height = this._elGlCanvasDom.style.height = window.innerHeight + "px";

            this._elGlCanvasDom.setAttribute("width", window.innerWidth);
            this._elGlCanvasDom.setAttribute("height", window.innerHeight);

            this._elCablesCanvasContainer.style["z-index"] = 40;
        }
        else if (this.canvasManager.mode == this.canvasManager.CANVASMODE_PATCHBG)
        {
            this._elGlCanvasDom.style.width = this._elPatch.style.width;
            this._elGlCanvasDom.style.height = this._elPatch.style.height;

            this._elCablesCanvasContainer.style.left = iconBarWidth + "px";
            this._elCablesCanvasContainer.style.right = "initial";
            this._elCablesCanvasContainer.style.top = "0px";
            this._elCablesCanvasContainer.style.width = this._elGlCanvasDom.style.width;
            this._elCablesCanvasContainer.style.height = this._elGlCanvasDom.style.height;
            this._elCablesCanvasContainer.style["z-index"] = 1;
        }
        else if (this.canvasManager.mode == this.canvasManager.CANVASMODE_NORMAL)
        {
            this._elCablesCanvasContainer.style["z-index"] = 10;

            this.canvasManager.setSize(this.rendererWidth, this.rendererHeight);

            this._elCablesCanvasContainer.style.width = this.rendererWidth + "px";
            this._elCablesCanvasContainer.style.height = this.rendererHeight + "px";
            this._elCablesCanvasContainer.style.right = "0px";
            this._elCablesCanvasContainer.style.left = "initial";
            this._elCablesCanvasContainer.style["transform-origin"] = "top right";
            this._elCablesCanvasContainer.style.transform = "scale(" + this._corePatch.cgl.canvasScale + ")";
        }

        // flashing canvas overlay when saving
        this._elCanvasFlash.style.width = this.rendererWidth * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.height = this.rendererHeight * this._corePatch.cgl.canvasScale + "px";
        this._elCanvasFlash.style.right = 0 + "px";
        this._elCanvasFlash.style.top = 0 + "px";

        this._elBgPreview.style.right = (this.rightPanelWidth + 10) + "px";
        this._elBgPreview.style.top = (menubarHeight + 55) + "px";

        this._elBgPreviewButtonContainer.style.right = this.rightPanelWidth + "px";
        // this._elBgPreviewButtonContainer.style.top = this._elBgPreview.height + "px";

        this.emitEvent("setLayout");


        perf.finish();
    }

    // _setCanvasMode(m)
    // {
    //     this.canvasManager.mode = m;
    // }


    // getCanvasMode()
    // {
    //     return this.canvasManager.mode;
    // }

    _switchCanvasSizeNormal()
    {
        this.canvasManager.mode = this.canvasManager.CANVASMODE_NORMAL;
        this.rendererWidth = this._oldCanvasWidth;
        this.rendererHeight = this._oldCanvasHeight;
    }

    _switchCanvasPatchBg()
    {
        this._oldCanvasWidth = this.rendererWidth;
        this._oldCanvasHeight = this.rendererHeight;
        this.rightPanelWidth = this.rendererWidth;

        this.canvasManager.mode = this.canvasManager.CANVASMODE_PATCHBG;
        userSettings.set("canvasMode", "patchbg");

        this.rendererHeight = 100;
        this.rightPanelWidth = this._oldCanvasWidth;
    }

    cyclePatchBg()
    {
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN) this.cycleFullscreen();

        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_NORMAL)
        {
            this._switchCanvasPatchBg();
        }
        else
        {
            userSettings.set("canvasMode", "");
            this._switchCanvasSizeNormal();
        }

        this.setLayout();
        this.canvasManager.getCanvasUiBar().showCanvasModal(false);
    }

    cycleFullscreen()
    {
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN)
        {
            this.canvasManager.mode = this.canvasManager.CANVASMODE_NORMAL;
            this.rendererWidth = this._oldCanvasWidth;
            this.rendererHeight = this._oldCanvasHeight;
        }
        else
        {
            this._oldCanvasWidth = this.rendererWidth;
            this._oldCanvasHeight = this.rendererHeight;
            this.rightPanelWidth = this.rendererWidth;
            this.canvasManager.mode = this.canvasManager.CANVASMODE_FULLSCREEN;

            if (!this.notifiedFullscreen)CABLES.UI.notify("press escape to exit fullscreen mode");
            this.notifiedFullscreen = true;
        }

        this.canvasManager.getCanvasUiBar().showCanvasModal(false);
        this.setLayout();
    }

    isShowingTiming()
    {
        return this._showTiming;
    }

    showTiming()
    {
        this._showTiming = true;

        this.bottomTabPanel.hide(true);
        this.timeLine().show();
        this.setLayout();
        userSettings.set("timelineOpened", this._showTiming);
    }

    showLoadingProgress(show)
    {
        if (show)
        {
            ele.byId("nav-logo_idle").classList.add("logoFadeout");
            ele.byId("nav-logo_idle").classList.remove("logoFadein");
            ele.byId("nav-loading").classList.remove("hidden");
        }
        else
        {
            setTimeout(() =>
            {
                ele.byId("nav-logo_idle").classList.remove("logoFadeout");
                ele.byId("nav-logo_idle").classList.add("logoFadein");
                ele.byId("nav-loading").classList.add("hidden");
            }, 250);
        }
    }

    updateActivityFeedIcon(data)
    {
        if (!data) return;
        const feedIcon = ele.byId("nav-item-activity");
        if (feedIcon)
        {
            const actionable = feedIcon.querySelector(".dot");
            if (data.action_required)
            {
                ele.show(feedIcon);
                ele.show(actionable);
            }
            else
            {
                ele.hide(feedIcon);
                ele.hide(actionable);
            }
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

        this.setLayout();
        gui.timeLine().redraw();
    }

    refreshFileManager()
    {
        if (this.fileManager) this.fileManager.refresh();
        else this.showFileManager(null, true);
    }




    getFileManager(cb, userInteraction)
    {
        if (!this.fileManager) this.fileManager = new CABLES.UI.FileManager(cb, userInteraction);
        return this.fileManager;
    }

    showLogging()
    {
        new LoggingTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    showFileManager(cb, userInteraction)
    {
        // if (!this.fileManager) this.fileManager = new CABLES.UI.FileManager(cb, userInteraction);
        this.getFileManager(cb, userInteraction);

        this.fileManager.show(userInteraction);
        gui.mainTabs.activateTabByName("Files");

        if (cb)cb();
    }

    setProjectName(name)
    {
        if (name && name !== "undefined")
        {
            ele.byId("patchname").innerHTML = name;
            ele.byId("patchname").dataset.patchname = name;
            gui.corePatch().name = name;
            if (this._currentProject) this._currentProject.name = name;
        }
    }

    createProject()
    {
        if (gui.showGuestWarning()) return;

        const randomize = userSettings.get("randomizePatchName", true);
        let title = "Enter a name for your new project";
        if (randomize) title += ", leave empty for random name";
        new ModalDialog({
            "prompt": true,
            "title": "New Project",
            "text": title,
            "promptValue": randomize ? "" : "new project",
            "promptOk": (name) =>
            {
                if (randomize || name) CABLESUILOADER.talkerAPI.send("newPatch", { "name": name });
            }
        });
    }


    /* Goes through all nav items and replaces "mod" with the OS-dependent modifier key */
    replaceNavShortcuts()
    {
        let els = ele.byQueryAll(".shortcut");

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
        CABLES.CMD.UI.toggleOverlays();

        // let iconShowOverlays = "icon icon-empty";
        // if (userSettings.get("overlaysShow")) iconShowOverlays = "icon icon-check";

        // let iconTransforms = "icon icon-check hidden";
        // if (CABLES.UI.showCanvasTransforms) iconTransforms = "icon icon-check";

        // let items = [{
        //     "title": "Show Overlays",
        //     "func": CABLES.CMD.UI.toggleOverlays,
        //     "iconClass": iconShowOverlays,
        // }];

        // // if (userSettings.get("overlaysShow"))
        // //     items.push(
        // //         {
        // //             "title": "Show all transforms",
        // //             "func": CABLES.CMD.UI.toggleTransformOverlay,
        // //             "iconClass": iconTransforms,
        // //         });

        // CABLES.contextMenu.show(
        //     {
        //         "refresh": () => { gui.corePatch().cgl.canvas.focus(); gui.helperContextMenu(el); },
        //         "items": items
        //     }, el);
    }

    rendererContextMenu(el)
    {
        CABLES.contextMenu.show(
            {
                "items":
                [
                    {
                        "title": "Reset canvas size",
                        "func": CABLES.CMD.RENDERER.resetSize
                    },
                    {
                        "title": "Set canvas size",
                        "func": CABLES.CMD.RENDERER.changeSize
                    },
                    {
                        "title": "Set canvas scale",
                        "func": CABLES.CMD.RENDERER.scaleCanvas
                    },
                    {
                        "title": "Canvas Magnifier",
                        "func": CABLES.CMD.RENDERER.canvasMagnifier
                    },
                    {
                        "title": "Maximize Canvas",
                        "func": CABLES.CMD.UI.toggleMaxRenderer,
                        "icon": "icon-picker"
                    },
                    {
                        "title": "Canvas As Patch Background",
                        "func": CABLES.CMD.UI.togglePatchBgRenderer
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

                    FileManager.updatedFiles.push(fileId);
                }
                gui.refreshFileManager();
            });
    }

    bind(cb)
    {
        this.canvasManager.addContext(gui.corePatch().cgl);

        if (userSettings.get("canvasMode") == "patchbg") this._switchCanvasPatchBg();

        this.bottomInfoArea.on("changed", this.setLayout.bind(this));

        let lastTimeRecent = 0;
        const navCablesLogo = ele.byId("nav_logo_area");

        navCablesLogo.addEventListener("pointerenter", (event) =>
        {
            if (lastTimeRecent != 0 && performance.now() - lastTimeRecent < 30000) return;
            CABLESUILOADER.talkerAPI.send("getRecentPatches", {}, (err, r) =>
            {
                lastTimeRecent = performance.now();
                if (!r) return;

                let str = "";
                if (CABLES.platform.frontendOptions.showOpenPatch)
                {
                    let item = "<li><a class=\"mine openPatch\" target=\"_top\" data-short-id=\"\">Open Patch<span class=\"shortcut\">[cmd_ctrl]`O`</span></a></li>";
                    str += this.bottomInfoArea.replaceShortcuts(item);
                }

                for (let i = 0; i < r.length; i++)
                    str += "<li><a class=\"mine\" target=\"_top\" data-short-id=\"" + r[i].shortId + "\">Open Patch " + r[i].name + "</a></li>";

                str += "<li class=\"divide\"></li>";

                if (CABLES.platform.frontendOptions.showMyLinks)
                    str += "<li id=\"nav_mypatches\"><a target=\"_top\" href=\"" + CABLES.platform.getCablesUrl() + "/mypatches\">My Patches</a></li>";

                str += "<li id=\"nav_cablesweb\"><a target=\"_top\" href=\"" + CABLES.platform.getCablesUrl() + "/\">Open cables.gl</a></li>";

                ele.byId("nav_recentpatches").innerHTML = str;
                ele.byId("nav_recentpatches").querySelectorAll("li a.mine").forEach((el) =>
                {
                    if (el.dataset.hasOwnProperty("shortId"))
                    {
                        el.addEventListener("click", () =>
                        {
                            const data = { "id": el.dataset.shortId };
                            CABLESUILOADER.talkerAPI.send("gotoPatch", data);
                        });
                    }
                });
            });
        });


        ele.byId("nav_cmdplt").addEventListener("click", (event) => { gui.cmdPallet.show(); });
        ele.byId("nav_search").addEventListener("click", (event) => { gui.find(""); });

        ele.byId("nav_createBackup").addEventListener("click", (event) => { CABLES.CMD.PATCH.createBackup(); });
        ele.byId("nav_viewBackups").addEventListener("click", (event) => { CABLES.CMD.PATCH.showBackups(); });

        ele.byId("nav_preferences").addEventListener("click", () => { CABLES.CMD.UI.showPreferences(); });
        ele.byId("button_toggleTiming").addEventListener("click", () => { gui.toggleTiming(); });
        ele.byId("nav_viewProjectLink").addEventListener("click", (e) =>
        {
            e.preventDefault();
            const projectId = this._currentProject ? this._currentProject.shortId : null;
            if (projectId)
            {
                const url = CABLES.platform.getCablesUrl() + "/p/" + projectId;
                const win = window.open(url, "_blank");
                win.focus();
            }
        });
        ele.byId("nav_remoteViewerLink").addEventListener("click", (event) => { CABLES.CMD.UI.openRemoteViewer(); });

        ele.byId("nav_patch_save").addEventListener("click", (event) => { CABLES.CMD.PATCH.save(); });
        ele.byId("nav_patch_saveas").addEventListener("click", (event) => { CABLES.CMD.PATCH.saveAs(); });
        ele.byId("nav_patch_export").addEventListener("click", (event) => { CABLES.CMD.PATCH.export(); });

        ele.byId("nav_patch_new").addEventListener("click", (event) => { CABLES.CMD.PATCH.newPatch(); });
        if (CABLES.platform.frontendOptions.chooseOpDir)
        {
            const opDirEle = ele.byId("nav_patch_add_opdir");
            if (opDirEle)
            {
                ele.show(opDirEle);
                opDirEle.addEventListener("click", (event) => { CABLES.CMD.STANDALONE.addProjectOpDir(); });
            }
        }


        if (CABLES.platform.frontendOptions.showAssetUpload) ele.byId("nav_uploadfile").addEventListener("click", CABLES.CMD.PATCH.uploadFileDialog);
        else ele.hide(ele.byId("nav_uploadfile"));

        if (!CABLES.platform.frontendOptions.showPatchSettings) ele.hide(ele.byId("nav_patch_settings"));
        if (!CABLES.platform.frontendOptions.showPatchViewPage) ele.hide(ele.byId("nav_patch_page"));
        if (!CABLES.platform.frontendOptions.showExport) ele.hide(ele.byId("nav_patch_export"));
        if (!CABLES.platform.frontendOptions.showMyLinks) ele.hide(ele.byId("nav_mypatches"));



        if (!CABLES.platform.frontendOptions.showPatchBackups)
        {
            ele.hide(ele.byId("nav_viewBackups"));
            ele.hide(ele.byId("nav_createBackup"));
        }





        if (CABLES.platform.frontendOptions.showChangeLogLink) ele.byId("nav_changelog").addEventListener("click", () => { window.open(CABLES.platform.getCablesDocsUrl() + "/changelog", "_blank"); });
        else ele.hide(ele.byId("nav_changelog"));

        if (CABLES.platform.frontendOptions.showBuildInfoMenuLink) ele.byId("nav_buildinfo").addEventListener("click", () => { CABLES.CMD.UI.showBuildInfo(); });
        else ele.hide(ele.byId("nav_buildinfo"));


        // --- Help menu
        // Documentation

        ele.byId("nav_help_keys").addEventListener("click", (event) => { CABLES.CMD.UI.showKeys(); });
        ele.byId("nav_help_documentation").addEventListener("click", (event) => { window.open(CABLES.platform.getCablesDocsUrl() + "/docs", "_blank"); });
        ele.byId("nav_help_forum").addEventListener("click", (event) => { window.open("https://github.com/cables-gl/cables_docs/discussions", "_blank"); });
        ele.byId("nav_help_tipps").addEventListener("click", (event) => { gui.tips.show(); });

        // Introduction
        ele.byId("nav_help_introduction").addEventListener("click", (event) => { gui.introduction.showIntroduction(); });
        ele.byId("nav_help_video").addEventListener("click", (event) => { const win = window.open("https://www.youtube.com/cablesgl", "_blank"); });

        ele.byId("nav_op_createOp").addEventListener("click", (event) => { gui.serverOps.createDialog(null); });
        ele.byId("nav_op_patchOp").addEventListener("click", (event) =>
        {
            gui.patchView.unselectAllOps();
            CABLES.CMD.PATCH.createSubPatchOp();
        });
        ele.byId("nav_filemanager").addEventListener("click", (event) => { gui.showFileManager(null, true); });

        ele.byId("nav_timeline").addEventListener("click", (event) =>
        {
            CABLES.CMD.TIMELINE.toggleTimeline();
        });

        ele.byId("nav_gpuprofiler").addEventListener("click", (event) => { CABLES.CMD.UI.profileGPU(); });
        ele.byId("nav_log").addEventListener("click", (event) => { CABLES.CMD.DEBUG.logConsole(); });

        ele.byId("nav_profiler").addEventListener("click", (event) => { new CABLES.UI.Profiler(gui.mainTabs); gui.maintabPanel.show(true); });
        ele.byId("nav_patchanalysis").addEventListener("click", (event) => { CABLES.CMD.PATCH.analyze(); });

        if (!CABLES.platform.isTrustedPatch())
        {
            ele.byId("nav_op_createOp").classList.add("nav-greyout");
            ele.byId("nav_op_patchOp").classList.add("nav-greyout");
            ele.byId("nav_uploadfile").classList.add("nav-greyout");

            ele.byId("nav_createBackup").classList.add("nav-greyout");
            ele.byId("nav_patch_settings").classList.add("nav-greyout");
            ele.byId("nav_viewBackups").classList.add("nav-greyout");
            ele.byId("nav_patch_save").classList.add("nav-greyout");
        }

        ele.byId("nav-item-activity").addEventListener("click", (event) =>
        {
            CABLES.CMD.UI.activityFeed();
        });

        ele.byId("nav-item-bpReload").addEventListener("click", (event) => { CABLES.CMD.PATCH.updateLocalChangedBlueprints(); });

        window.addEventListener("resize", () =>
        {
            this.canvasManager.getCanvasUiBar().showCanvasModal(false);
            this.canvasManager.blur();
            this.mainTabs.emitEvent("resize");
            this.setLayout();
            this.setLayout(); // yes, twice....
        }, false);

        if (CABLES.platform.frontendOptions.showWelcome)
        {
            CABLES.CMD.UI.welcomeTab(true);
        }
        this.htmlEleOverlay = new HtmlElementOverlay();


        console.log(this.opDocs.getStats());


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

            let port = null;

            for (let i = 0; i < selectedOp[0].portsIn.length; i++)
            {
                port = selectedOp[0].portsIn[i];
                const type = port.getTypeString();

                if (port.uiAttribs && port.uiAttribs.editShortcut) break;
            }

            if (port)
            {
                if (port.uiAttribs.display === "editor")
                    CABLES.UI.paramsHelper.openParamStringEditor(selectedOpId, port.name, null, true);
                if (port.uiAttribs.display === "gradient")
                {
                    const editor = new CABLES.GradientEditor(selectedOpId, port.name, { "openerEle": ele.byClass("gradienteditbutton") });
                    editor.show();

                    port.on("change", () =>
                    {
                        console.log(editor);
                    });
                }
            }
        });

        this.keys.key(["Escape", "Tab"], "Open \"Op Create\" dialog (or close current dialog)", "down", null, {}, (e) =>
        {
            if (
                !(document.activeElement && !document.activeElement.classList.contains("ace_text-input") &&
                    (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")) ||
                    (document.activeElement && document.activeElement.classList.contains("notIgnoreEscape")))
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
        this.keys.key("Enter", "Cycle patchfield visibility", "down", null, { "cmdCtrl": false, "shiftKey": true }, (e) =>
        {
            CABLES.CMD.UI.togglePatchBgPatchField();
        });

        this.keys.key("z", "undo", "down", null, { "ignoreInput": true, "cmdCtrl": true }, (e) => { CABLES.UI.undo.undo(); });
        this.keys.key("z", "redo", "down", null, { "ignoreInput": true, "cmdCtrl": true, "shiftKey": true }, (e) => { CABLES.UI.undo.redo(); });
        this.keys.key(",", "Patch Settings", "down", null, { "ignoreInput": true, "cmdCtrl": true }, (e) => { CABLES.CMD.UI.settings(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            const eleAceTextEditor = ele.byQuery("#ace_editors textarea");
            if (!(eleAceTextEditor && ele.hasFocus(eleAceTextEditor)) && !gui.isShowingModal()) CABLES.CMD.UI.showSearch();
            else e.dontPreventDefault = true;
        });

        this.keys.key("s", "Save patch as new patch", "down", null, { "cmdCtrl": true, "shiftKey": true }, (e) =>
        {
            CABLES.CMD.PATCH.saveAs();
        });

        this.keys.key("s", "Save patch", "down", null, { "cmdCtrl": true }, (e) =>
        {
            if (document.activeElement.classList.contains("ace_text-input") && gui.mainTabs.getSaveButton() && gui.maintabPanel.isVisible()) // && !this.patchView.hasFocus()
            {
                gui.mainTabs.getSaveButton().cb();
            }
            else
            {
                const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
                if (subOuter)
                {
                    const bp = subOuter.isBlueprint2() || subOuter.isInBlueprint2();
                    if (bp)
                    {
                        gui.showLoadingProgress(true);

                        subPatchOpUtil.updateBluePrint2Attachment(gui.patchView.getSubPatchOuterOp(bp),
                            {
                                "oldSubId": bp,
                                "next": () =>
                                {
                                    if (!gui.savedState.getStateBlueprint(0))
                                        CABLES.CMD.PATCH.save();
                                }
                            });
                    }
                    else
                    {
                        CABLES.CMD.PATCH.save();
                    }
                }
                else
                {
                    CABLES.CMD.PATCH.save();
                }
            }
        });

        this.keys.key(" ", "Play/Pause timeline", "down", null, { "ignoreInput": true }, (e) =>
        {
            if (document.activeElement.tagName == "BODY" || document.activeElement.tagName == "DIV") gui.timeLine().togglePlay();

            if (this._spaceBarStart === 0) this._spaceBarStart = Date.now();
        });

        this.keys.key(" ", "Play/Pause timeline", "up", null, { "ignoreInput": true }, (e) =>
        {
            if (document.activeElement.tagName == "CANVAS")
            {
                const timeused = Date.now() - this._spaceBarStart;
                if (timeused < 500) gui.timeLine().togglePlay();
            }
            this._spaceBarStart = 0;
        });

        this.keys.key("o", "Toggle Overlays", "down", null, { "ignoreInput": true }, (e) =>
        {
            CABLES.CMD.UI.toggleOverlays();
        });
    }

    metaKeyframesShowAnim(opid, portname)
    {
        // if (!gui.metaKeyframes)
        // {
        // gui.metaKeyframes = new MetaKeyframes(gui.mainTabs);
        // }
        gui.metaKeyframes = new MetaKeyframes(gui.mainTabs);
        gui.maintabPanel.show(true);

        if (opid && portname)
            gui.metaKeyframes.showAnim(opid, portname);
    }

    pressedEscape(e)
    {
        this.canvasManager.getCanvasUiBar().showCanvasModal(false);
        this.emitEvent("pressedEscape");

        if (this.fileManager) this.fileManager.setFilePort(null);

        if (e && (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey)) return;

        if (gui.longPressConnector.isActive()) gui.longPressConnector.longPressCancel();
        else if (this.canvasMagnifier) this.canvasMagnifier = this.canvasMagnifier.close();
        else if (this.rendererWidth * this._corePatch.cgl.canvasScale > window.innerWidth * 0.9)
        {
            if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN)
            {
                this.cycleFullscreen();
            }
            else
            {
                this.rendererWidth = window.innerWidth * 0.4;
                this.rendererHeight = window.innerHeight * 0.25;
            }

            this._elGlCanvasDom.classList.remove("maximized");
            this.setLayout();
            this.canvasManager.getCanvasUiBar().showCanvasModal(true);
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
            console.log("closing modal...");
            gui.closeModal();

            if (this.maintabPanel?._tabs?.getActiveTab()?.editor)
            {
                setTimeout(() =>
                {
                    this.maintabPanel?._tabs?.getActiveTab().editor.focus();
                }, 50); // why...
            }
        }
        else if (this._opselect.isOpen()) this._opselect.close();
        else if (this.maintabPanel.isVisible()) this.maintabPanel.hide();
        else
        {
            if (e)
            {
                CABLES.UI.OPSELECT.linkNewOpToPort =
                CABLES.UI.OPSELECT.linkNewLink = null;
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
        console.warn("an operator has crashed", op);
        // iziToast.error({
        //     "position": "topRight",
        //     "theme": "dark",
        //     "title": "error",
        //     "message": "an operator has crashed",
        //     "progressBar": false,
        //     "animateInside": false,
        //     "close": true,
        //     "timeout": false,
        //     "buttons": [
        //         ["<button>reload</button>", function (instance, toast)
        //         {
        //             CABLES.CMD.PATCH.reload();
        //         }]
        //     ]
        // });
    }

    showLibLoadError(libName)
    {
        iziToast.error({
            "position": "topRight",
            "theme": "dark",
            "title": "error",
            "message": "failed to load library: " + libName,
            "progressBar": false,
            "animateInside": false,
            "close": true,
            "timeout": false
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
        if (userSettings.get("loggingOpened") == true) this.showLogging();

        gui.transformOverlay.updateVisibility();

        this.iconBarLeft = new IconBar("sidebar_left");
        this.iconBarPatchNav = new IconBar("sidebar_bottom");
        this.iconBarTimeline = new IconBar("sidebar_timeline");


        if (this.getRestriction() != Gui.RESTRICT_MODE_REMOTEVIEW &&
                userSettings.get("showTipps") &&
                userSettings.get("introCompleted")) gui.tips.show();


        if (CABLES.platform.frontendOptions.showWelcome && this.corePatch().ops.length == 0) CABLES.CMD.UI.welcomeTab();

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


        if (CABLES.platform.getPatchVersion())
            gui.restriction.setMessage("backup", "This is a backup version, saving will overwrite the current version!");


        console.table(buildInfoTable);
        console.log("start up times:");
        console.table(CABLESUILOADER.startup.log);
        console.groupEnd();

        gui.savedState.setSavedAll("showUiElements");
        gui.savedState.resume();

        gui.metaTabs.loadCurrentTabUsersettings();

        gui.patchView.focus();
    }

    showWelcomeNotifications()
    {
        if (!gui.isRemoteClient && CABLES.platform.showGitBranchWarning) CABLES.platform.showGitBranchWarning();
        if (!gui.isRemoteClient && CABLES.platform.showBrowserWarning) CABLES.platform.showBrowserWarning();
        if (!gui.isRemoteClient && CABLES.platform.showStartupChangelog) CABLES.platform.showStartupChangelog();
    }

    getOpDoc(opname, html, cb)
    {
        cb(this.opDocs.getHtml(opname));
    }

    showSettings(userInteraction)
    {
        window.onmessage = (e) =>
        {
            if (e.data && typeof e.data == "string")
            {
                const c = e.data.split(":");
                if (c.length > 1)
                {
                    if (c[0] == "projectname") gui.setProjectName(c[1]);
                    if (c[0] == "notify") notify(c[1]);
                    if (c[0] == "notifyerror") notifyError(c[1]);
                    if (c[0] == "cmd" && c[1] == "saveproject") this.patch().saveCurrentProject();
                }
            }
        };

        const url = CABLES.platform.getCablesUrl() + "/patch/" + this.project().shortId + "/settings?iframe=true";
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true, "gotoUrl": CABLES.platform.getCablesUrl() + "/patch/" + this.project().shortId + "/settings" }, true);
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
        return this.savedState.isSaved;
    }

    setTransformGizmo(params, idx)
    {
        if (params == null && idx === undefined)
        {
            for (let i = 0; i < this._gizmo.length; i++) this._gizmo[i].set(params);
            return;
        }

        idx = idx || 0;
        if (!this._gizmo[idx]) this._gizmo[idx] = new Gizmo(this.scene().cgl);

        if (!userSettings.get("overlaysShow"))
        {
            this._gizmo[idx].set(null);
            return;
        }

        this._gizmo[idx].set(params);
    }



    setTransform(id, x, y, z)
    {
        // if (CABLES.UI.showCanvasTransforms)

        if (this.shouldDrawOverlay) this.transformOverlay.add(this.scene().cgl, id, x, y, z);
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

    setStateUnsaved(options)
    {
        // if (this.ignoreSaveStateChanges) return;
        // let subPatch = this.patchView.getCurrentSubPatch();
        // if (options && options.op)subPatch = options.op.uiAttribs.subPatch;

        // this.setSavedStateChangesBlueprintSubPatches(subPatch, true);

        // this._savedState = this.savedState.isSaved;

        this.savedState.setUnSaved("unknown", 0);

        // if (this._savedState)
        // {
        // let title = "";
        // if (CABLES.platform.isDevEnv())title = "DEV ";
        // title += gui.project.name + " *";
        // document.title = title;

        // CABLESUILOADER.talkerAPI.send("setIconUnsaved");
        // this.changeFavicon(CABLES.platform.getCablesUrl() + "/favicon/favicon-32_orange.png");
        // this._favIconLink.href = CABLES.platform.getCablesUrl() + "/favicon/favicon_orange.ico";

        // ele.byId("patchname").classList.add("warning");

        // this._onBeforeUnloadListener = (event) =>
        // {
        //     const message = "unsaved content!";
        //     if (typeof event == "undefined")
        //     {
        //         event = window.event;
        //     }
        //     if (event)
        //     {
        //         event.returnValue = message;
        //     }
        //     return message;
        // };
        // window.addEventListener("beforeunload", this._onBeforeUnloadListener);
        // }
    }

    // setStateSaved()
    // {
    //     // this._savedState = true;
    //     // this.resetSavedStateChangesBlueprintSubPatches();

    //     // CABLESUILOADER.talkerAPI.send("setIconSaved");
    //     // this.changeFavicon(CABLES.platform.getCablesUrl() + "/favicon/favicon.ico");
    //     // this._favIconLink.href = "/favicon/favicon.ico";
    //     // ele.byId("patchname").classList.remove("warning");


    //     // const subOuter = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());

    //     // // console.log("subouter",subOuter,subOuter.isInBlueprint2())

    //     // if (subOuter)
    //     // {
    //     //     const bp = subOuter.isBlueprint2() || subOuter.isInBlueprint2();
    //     //     if (bp)
    //     //     {
    //     //         gui.serverOps.updateBluePrint2Attachment(gui.patchView.getSubPatchOuterOp(bp), { "oldSubId": bp });
    //     //     }
    //     // }


    //     this.savedState.setSaved("unknown", 0);

    //     // let title = "";
    //     // if (CABLES.platform.isDevEnv())title = "DEV ";
    //     // title += gui.project.name;
    //     // document.title = title;
    //     // window.removeEventListener("beforeunload", this._onBeforeUnloadListener);
    // }

    reloadDocs(cb)
    {
        gui.opDocs.addCoreOpDocs();
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
            ele.forEachClass("splitter", (el) =>
            {
                ele.hide(el);
            });
        }

        if (r < Gui.RESTRICT_MODE_FULL)
        {
            const optionsPanel = ele.byId("options");
            if (optionsPanel) optionsPanel.classList.add("readonly");

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
            if (timeline) timeline.classList.add("readonly");

            const tlIconBar = ele.byId("iconbar_sidebar_timeline");
            if (tlIconBar) ele.hide(tlIconBar);
        }
        else
        {
            const optionsPanel = ele.byId("options");
            if (optionsPanel)
            {
                optionsPanel.classList.remove("readonly");
            }
            const tabpanel = ele.byId("metatabpanel");
            if (tabpanel)
            {
                tabpanel.querySelectorAll(".tabcontent").forEach((tab) =>
                {
                    tab.classList.remove("readonly");
                    tab.inert = false;
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
        // this.canvasManager.getCanvasUiBar() = new CABLES.UI.CanvasUi(this.corePatch().cgl);

        this.setTheme(JSON.parse(JSON.stringify(defaultTheme)));

        if (window.localStorage.getItem("cables_theme") && window.localStorage.getItem("cables_theme") != "null" && window.localStorage.getItem("cables_theme") != "undefined")
        {
            try
            {
                console.log("🌈 found theme in localstorage!", JSON.parse(window.localStorage.getItem("cables_theme")));
                this.setTheme(JSON.parse(window.localStorage.getItem("cables_theme")));
            }
            catch (e)
            {
                console.log(e);
            }
        }

        hljs.configure({ "ignoreUnescapedHTML": true });

        ele.byId("timing").innerHTML = getHandleBarHtml("timeline_controler");
        this._timeLine = new TimeLineGui();

        if (this.isRemoteClient)
        {
            this.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
        }
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

    initCoreListeners()
    {
        this._corePatch.on("exception", function (ex, op)
        {
            new ModalError({ "exception": ex, "op": op });
        });

        this._corePatch.on("exceptionOp", function (e, objName, op)
        {
            console.log("core error2");
            new ModalError({ "exception": e, "opname": objName, "op": op });
        });

        this._corePatch.on("criticalError", function (options)
        {
            console.log("core error3");
            new ModalError(options);
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
        if (this._restrictionMode !== r)
        {
            this._restrictionMode = r;
            this.hideElementsByRestriction(r);
            this.emitEvent("restrictionChange", r);
            this.setLayout();
        }
    }

    getRestriction()
    {
        return this._restrictionMode;
    }

    getSavedStateChangesBlueprintSubPatches()
    {
        return [];// this._savedStateChangesBlueprintSubPatches; // old blueprints
    }

    // resetSavedStateChangesBlueprintSubPatches()
    // {
    //     this._savedStateChangesBlueprintSubPatches = [];
    // }

    // setSavedStateChangesBlueprintSubPatches(subPatchId)
    // {
    //     const oldLength = this._savedStateChangesBlueprintSubPatches.length;
    //     if (!this._savedStateChangesBlueprintSubPatches.includes(subPatchId)) this._savedStateChangesBlueprintSubPatches.push(subPatchId);
    //     const newLength = this._savedStateChangesBlueprintSubPatches.length;
    //     if (newLength > oldLength)
    //     {
    //         const blueprintOps = gui.patchView.getBlueprintOpsForSubPatches([subPatchId], true);
    //         if (blueprintOps.length > 0)
    //         {
    //             const reloadIcon = ele.byId("nav-item-bpReload");
    //             if (reloadIcon) ele.show(reloadIcon);
    //         }
    //     }
    // }


    setTheme(theme = {})
    {
        if (!theme) return;

        theme = JSON.parse(JSON.stringify(theme));
        theme.colors = theme.colors || {};

        const missing = {};

        function rgbtohex(rgb)
        {
            return "#" + ((rgb[2] * 255 | (rgb[1] * 255) << 8 | (rgb[0] * 255) << 16) | 1 << 24).toString(16).slice(1);
        }


        const topics = Object.keys(defaultTheme);

        for (let i = 0; i < topics.length; i++)
        {
            const topic = topics[i];
            theme[topic] = theme[topic] || {};
            missing[topic] = {};

            for (let j in defaultTheme[topic])
            {
                if (!theme[topic].hasOwnProperty(j))
                    missing[topic][j] = theme[topic][j] = defaultTheme[topic][j];
            }
        }

        for (let i in theme.colors_html)
        {
            document.documentElement.style.setProperty("--" + i, rgbtohex(theme.colors_html[i] || [1, 1, 1, 1]));
        }

        for (let i in theme.colors_textedit)
        {
            document.documentElement.style.setProperty("--" + i, rgbtohex(theme.colors_textedit[i] || [1, 1, 1, 1]));
        }

        theme.colors_vizlayer = theme.colors_vizlayer || {};
        for (let i in theme.colors_vizlayer)
        {
            theme.colors_vizlayer[i] = rgbtohex(theme.colors_vizlayer[i] || [1, 1, 1, 1]);
        }

        document.documentElement.style.setProperty("--color_port_function", rgbtohex(theme.colors_types.trigger || [1, 1, 1, 1]));
        document.documentElement.style.setProperty("--color_port_value", rgbtohex(theme.colors_types.num || [1, 1, 1, 1]));
        document.documentElement.style.setProperty("--color_port_object", rgbtohex(theme.colors_types.obj || [1, 1, 1, 1]));
        document.documentElement.style.setProperty("--color_port_string", rgbtohex(theme.colors_types.string || [1, 1, 1, 1]));
        document.documentElement.style.setProperty("--color_port_array", rgbtohex(theme.colors_types.array || [1, 1, 1, 1]));

        this.theme = theme;



        const nsColors = document.createElement("style");
        document.body.appendChild(nsColors);

        let strNsCss = "";


        for (let i in theme.colors_namespaces)
        {
            let ns = i;
            ns = ns.replaceAll(".", "_");
            strNsCss += ".nsColor_" + ns + "{color:" + rgbtohex(theme.colors_namespaces[i]) + " !important;}\n";
        }

        nsColors.textContent = strNsCss;

        this.emitEvent("themeChanged");
        return missing;
    }

    getDefaultTheme()
    {
        // return gluiconfig._colors_dark;
        return JSON.parse(JSON.stringify(defaultTheme));
    }
}

Gui.RESTRICT_MODE_LOADING = 0;

Gui.RESTRICT_MODE_BLUEPRINT = 5;

Gui.RESTRICT_MODE_REMOTEVIEW = 10;
Gui.RESTRICT_MODE_FOLLOWER = 20;
Gui.RESTRICT_MODE_EXPLORER = 30;
Gui.RESTRICT_MODE_FULL = 40;


// !!!!!///!!
