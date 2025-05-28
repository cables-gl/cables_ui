import { Logger, Events, ele } from "cables-shared-client";
import { now } from "cables";
import { platform } from "./platform.js";
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
import MetaOpParams from "./components/tabs/meta_opparams.js";
import { getHandleBarHtml } from "./utils/handlebars.js";
import WatchArrayTab from "./components/tabs/tab_watcharray.js";
import Gizmo from "./elements/canvasoverlays/transformgizmo.js";
import { hideInfo, showInfo } from "./elements/tooltips.js";
import text from "./text.js";
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
import LogTab from "./components/tabs/tab_log.js";
import UiProfiler from "./components/uiprofiler.js";
import FindTab from "./components/tabs/tab_find.js";
import initSplitPanes from "./elements/splitpane.js";
import undo from "./utils/undo.js";
import paramsHelper from "./components/opparampanel/params_helper.js";
import { contextMenu } from "./elements/contextmenu.js";
import UserSettings, { userSettings } from "./components/usersettings.js";
import ServerOps from "./api/opsserver.js";
import GlTimelineTab from "./components/tabs/tab_gltimeline.js";
import { GlTimeline } from "./gltimeline/gltimeline.js";
import { UiPatch } from "./core_extend_patch.js";
import PatchView from "./components/patchview.js";
import { CmdPatch } from "./commands/cmd_patch.js";
import { CmdRenderer } from "./commands/cmd_renderer.js";
import { CmdUi } from "./commands/cmd_ui.js";

/**
 * @type {Gui}
 */
// eslint-disable-next-line import/no-mutable-exports
let gui = null;
export { gui };

/**
 * main singleton class for starting the editor
 */
export default class Gui extends Events
{

    static EVENT_RESIZE = "resize";
    static EVENT_RESIZE_CANVAS = "resizecanvas";

    static RESTRICT_MODE_LOADING = 0;
    static RESTRICT_MODE_BLUEPRINT = 5;
    static RESTRICT_MODE_REMOTEVIEW = 10;
    static RESTRICT_MODE_FOLLOWER = 20;
    static RESTRICT_MODE_EXPLORER = 30;
    static RESTRICT_MODE_FULL = 40;

    hasAnims = false;
    unload = false;

    /** @type {GlTimeline} */
    glTimeline = null;

    /** @type {GlTimelineTab} */
    glTimeLineTab = null;

    splitpanePatchPos = 0;

    constructor(cfg)
    {
        super();

        this.editorSessionId = cfg.editorSessionId;

        this._log = new Logger("gui");

        /** @type {CablesTheme} */
        this.theme = defaultTheme;

        /** @type {ServerOps} */
        this.serverOps = null;

        /** @type {UserSettings} */
        this.userSettings = userSettings;
        this.uiProfiler = new UiProfiler();

        this.canvasManager = new CanvasManager();
        this.keys = new KeyBindingsManager();
        this.opParams = new OpParampanel();
        this.opPortModal = new ModalPortValue();
        this.longPressConnector = new LongPressConnector();

        this.socket = null;
        this.isRemoteClient = cfg.remoteClient;
        this._spaceBarStart = 0;

        this.rendererWidth = uiconfig.rendererDefaultWidth;
        this.rendererHeight = uiconfig.rendererDefaultHeight;
        this.showingtwoMetaPanel = true;

        this.patchParamPanel = new PatchPanel();

        this.canvasMagnifier = null;

        this.editorWidth = this.userSettings.get("editorWidth") || 350;
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
                // "forceWebGl1": cfg.usersettings.settings.forceWebGl1 === true || cfg.usersettings.settings.forceWebGl1 === "true",
                "alpha": true,
                "premultipliedAlpha": true,
            },
            "variables": {}
        };
        if (cfg.patchConfig) patchConfig = Object.assign(patchConfig, cfg.patchConfig);

        /** @type {UiPatch} */
        // @ts-ignore
        this._corePatch = CABLES.patch = new CABLES.Patch(patchConfig);
        this._patchLoadEndiD = this._corePatch.on("patchLoadEnd",
            () =>
            {
                this._corePatch.off(this._patchLoadEndiD);
                this.corePatch().logStartup("patch loaded 2");

                this.bookmarks.updateDynamicCommands();
                this.patchView.highlightExamplePatchOps();
                this.savedState.setSaved("patch load end", 0);

                this.corePatch().logStartup("Patch loaded");
            });
        this.on("libLoadError",

            (/** @type {String} */ libName) =>
            {
                this.showLibLoadError(libName);
            });

        this.on("ShaderError",

            /**
             * @param {CgShader} shader
             */
            (shader) =>
            {
                if (this.userSettings.get("showAllShaderErrors"))
                    CABLES.UI.showShaderError(shader);
            });

        /** @type {PatchView} */
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

        this.savedState = new SavedState();
        this.savedState.pause();
        this._savedStateChangesBlueprintSubPatches = [];

        this.metaTexturePreviewer = new TexturePreviewer();
        this.metaKeyframes = null;
        this.bookmarks = new Bookmarks();
        this.bottomInfoArea = new BottomInfoAreaBar();

        this.metaOpParams = new MetaOpParams(this.metaTabs);

        this.user = null;
        this.onSaveProject = null;
        this.lastNotIdle = now();

        this._oldCanvasWidth = 0;
        this._oldCanvasHeight = 0;
        this._oldShowingEditor = false;

        this._currentProject = null;

        this.currentModal = null;
        // @ts-ignore
        gui = window.gui = this;
    }

    get patchId()
    {
        return this.project().shortId;
    }

    project()
    {
        return this._currentProject;
    }

    /**
     * @param {Object} p
     */
    setProject(p)
    {
        this._currentProject = p;
        this.setProjectName(p.name || "unknown");
        this.patchParamPanel.deserialize(p);
    }

    opSelect()
    {
        if (!this._opselect) this._opselect = new OpSelect();
        return this._opselect;
    }

    /** @returns {GlTimeline} */
    timeLine()
    {
        return this.glTimeline;
    }

    /** @deprecated */
    scene()
    {
        return this._corePatch;
    }

    /**
     * @returns {UiPatch}
     */
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
        if (!this.userSettings.get("overlaysShow")) return false;

        return true;
    }

    /**
     * @param {string} title
     */
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

    /**
     * @param {Number} idx
     * @param {string} opid
     * @param {String} subpatch
     */
    focusFindResult(idx, opid, subpatch)
    {
        if (this.keys.shiftKey)
        {
            this.opParams.show(opid);
        }
        else
        {
            this.patchView.unselectAllOps();
            this.patchView.selectOpId(opid);
            this.patchView.setCurrentSubPatch(subpatch, () =>
            {
                this.opParams.show(opid);
                this.patchView.focusOpAnim(opid);
                this.patchView.patchRenderer.viewBox.centerSelectedOps();
                this.patchView.centerSelectOp(opid);
            });
        }

        if (this.find()) this.find().setClicked(idx);
    }

    /**
     * @param {String} str
     */
    find(str = "")
    {
        if (this._find && this._find.isClosed()) this._find = null;

        if (str == undefined) return this._find;
        this.maintabPanel.show(true);

        if (!this._find) this._find = new FindTab(this.mainTabs, str);
        this._find.search(str);

        this.maintabPanel.show(true);
        this._find.focus();
    }

    texturePreview()
    {
        return this.metaTexturePreviewer;
    }

    showSaveWarning()
    {
        if (this.showGuestWarning()) return true;
        if (!this.canSaveInMultiplayer())
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
                text.guestHint + "<br/><br/><a href=\"" + platform.getCablesUrl() + "/signup\" target=\"_blank\" class=\"bluebutton\">Sign up</a> <a onclick=\"gui.pressedEscape();\" target=\"_blank\" class=\"button\">Close</a>"
            );
            return true;
        }
    }

    showBackupSaveWarning()
    {
        if (!platform.getPatchVersion()) return false;

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
        return true;
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
        if (gui.currentModal) gui.currentModal.close();
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

    /**
     * @param {String} opid
     * @param {String} which
     */
    watchArray(opid, which)
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op)
        {
            this._log.warn("opid not found:", opid);
            return;
        }
        const port = op.getPort(which);
        if (!port) this._log.warn("port not found:", which);

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

    showBottomTabs()
    {
        if (!this.bottomTabPanel.isVisible())
        {
            new LogTab(this.bottomTabs);
            this.bottomTabPanel.show(true);
            gui.setLayout();
            gui.mainTabs.emitEvent("resize");
        }
    }

    hideBottomTabs()
    {
        this.bottomTabPanel.hide(true);

        gui.mainTabs.emitEvent("resize");
        gui.setLayout();
        gui.mainTabs.emitEvent("resize");
    }

    setLayout()
    {
        if (this.unload) return;
        this.pauseProfiling();
        const wasFocussed = this.patchView.patchRenderer.isFocused;

        if (document.body.scrollTop > 0)
        {
            console.log("page is scrolled wtf...");
            document.body.scrollTo(0, 0);
        }

        const perf = this.uiProfiler.start("gui.setlayout");
        let canvasScale = 1;
        // this._elAceEditor = ele.byId("ace_editors");
        this._elSplitterPatch = this._elSplitterPatch || ele.byId("splitterPatch");
        this._elSplitterRenderer = this._elSplitterRenderer || ele.byId("splitterRenderer");
        this._elSplitterBottom = this._elSplitterBottom || ele.byId("splitterBottomTabs");

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

        this._elBreadcrumbNav = this._elBreadcrumbNav || ele.byId("breadcrumb_nav");

        this._elCablesCanvasContainer = this._elCablesCanvasContainer || ele.byId("cablescanvas");
        this._elGlUiPreviewLayer = this._elGlUiPreviewLayer || ele.byId("gluiPreviewLayer");

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

            lis[0].setAttribute("onclick", "");
            for (let i = 1; i < lis.length; i++) lis[i].classList.add("hidden");
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

        if (this._corePatch.cgl && this._corePatch.cgl.canvasScale) canvasScale = this._corePatch.cgl.canvasScale;

        this.rendererWidthScaled = this.rendererWidth * canvasScale;
        this.rendererHeightScaled = this.rendererHeight * canvasScale;

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

        const infoAreaHeight = this.bottomInfoArea.getHeight();
        const menubarHeight = 0;
        const optionsWidth = Math.max(400, this.rendererWidthScaled / 2);

        patchHeight -= infoAreaHeight;

        let editorWidth = this.editorWidth;
        if (editorWidth > patchWidth - 50) editorWidth = patchWidth - 50;

        const patchLeft = iconBarWidth;

        if (this.maintabPanel.isVisible())
        {
            const editorbarHeight = 767;
            const editorHeight = patchHeight - editorbarHeight - this.bottomTabPanel.getHeight();

            this._elMaintab.style.left = iconBarWidth + "px";
            this._elMaintab.style.top = 0 + "px";
            this._elMaintab.style.height = (editorHeight - 2) + "px";
            this._elMaintab.style.width = editorWidth + "px";

            this._elSplitterMaintabs.style.display = "block";
            this._elSplitterMaintabs.style.left = editorWidth + iconBarWidth + "px";
            this._elSplitterMaintabs.style.height = (patchHeight - this.bottomTabPanel.getHeight()) + 2 + "px";
            this._elSplitterMaintabs.style.width = 5 + "px";
            this._elSplitterMaintabs.style.top = menubarHeight + "px";

            this._elEditorMinimized.style.display = "none";
            this._elEditorMinimized.style.left = iconBarWidth + "px";

            this._elEditorMaximized.style.display = "block";
            this._elEditorMaximized.style.left = editorWidth + iconBarWidth + 3 + "px";

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
        this._elSplitterPatch.style.height = (patchHeight + 2) + "px";
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

        this._elIconbarTimeline = this._elIconbarTimeline || ele.byId("iconbar_sidebar_timeline");
        if (this._elIconbarTimeline)
        {
            this._elIconbarTimeline.style.left = (patchWidth / 2) + "px";
            this._elIconbarTimeline.style.bottom = 10 + infoAreaHeight + "px";
            if (!this.hasAnims) this._elIconbarTimeline.style.display = "none";
            else this._elIconbarTimeline.style.display = "inline-block";
        }

        this._elIconbarBottom = this._elIconbarBottom || ele.byId("iconbar_sidebar_bottom");
        if (this._elIconbarBottom)
        {
            this._elIconbarBottom.style.right = this.rendererWidthScaled + 20 + "px";
            this._elIconbarBottom.style.bottom = 10 + infoAreaHeight + "px";
        }

        if (this._elIconbarLeft)
        {
            if (this.userSettings.get("hideSizeBar"))
            {
                this._elIconbarLeft.style.display = "none";
            }
            else
            {
                this._elIconbarLeft.style.display = "block";
                this._elIconbarLeft.style.bottom = 10 + infoAreaHeight + "px";

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
        ele.byId("canvasicons").style.width = (this.rendererWidth * canvasScale) + "px";
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
        ele.byId("maintabs").style.height = (window.innerHeight - menubarHeight - infoAreaHeight - this.bottomTabPanel.getHeight()) + "px";

        if (this.bottomTabPanel.isVisible())
        {
            this._elSplitterBottom.style.display = "block";
            this._elSplitterBottom.style.width = patchWidth + "px";
            this._elSplitterBottom.style.bottom = (infoAreaHeight + this.bottomTabPanel.getHeight()) + "px";

            this._eleBottomTabs = ele.byId("bottomtabs");
            this._eleBottomTabs.style.width = patchWidth + "px";
            this._eleBottomTabs.style.bottom = infoAreaHeight + "px";
            this._eleBottomTabs.style.height = this.bottomTabPanel.getHeight() + "px";
            this._eleBottomTabs.style.left = iconBarWidth + "px";

            this.bottomTabs.updateSize();
        }

        const tabPanelTop = ele.byQuery("#maintabs .tabpanel");
        let tabPanelTopHeight = 0;
        if (tabPanelTop) tabPanelTopHeight = tabPanelTop.getBoundingClientRect().height;

        ele.byQuery("#maintabs .contentcontainer").style.height = window.innerHeight - menubarHeight - infoAreaHeight - this.bottomTabPanel.getHeight() - tabPanelTopHeight + "px";

        let metaTabPanelTabsHeight = 0;
        const metaTabPanelTabs = ele.byQuery("#metatabpanel .tabpanel");
        if (metaTabPanelTabs) metaTabPanelTabsHeight = metaTabPanelTabs.getBoundingClientRect().height;

        ele.byQuery("#metatabpanel .contentcontainer").style.height = window.innerHeight - this.rendererHeightScaled - infoAreaHeight - metaTabPanelTabsHeight - tabPanelTopHeight - menubarHeight - 1 + "px";

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
            this._elCablesCanvasContainer.style["z-index"] = -1;
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
            this._elCablesCanvasContainer.style.transform = "scale(" + canvasScale + ")";
        }

        // flashing canvas overlay when saving
        this._elCanvasFlash.style.width = this.rendererWidth * canvasScale + "px";
        this._elCanvasFlash.style.height = this.rendererHeight * canvasScale + "px";
        this._elCanvasFlash.style.right = 0 + "px";
        this._elCanvasFlash.style.top = 0 + "px";

        this._elBgPreview.style.right = (this.rightPanelWidth + 10) + "px";
        this._elBgPreview.style.top = (menubarHeight + 55) + "px";

        this._elBgPreviewButtonContainer.style.right = this.rightPanelWidth + "px";
        // this._elBgPreviewButtonContainer.style.top = this._elBgPreview.height + "px";

        this.emitEvent("setLayout");

        if (wasFocussed && this.patchView.patchRenderer.focus) this.patchView.patchRenderer.focus();

        perf.finish();
    }

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
        this.userSettings.set("canvasMode", "patchbg");

        this.rendererHeight = 100;
        this.rightPanelWidth = this._oldCanvasWidth;
    }

    cyclePatchBg()
    {
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN) this.toggleMaximizeCanvas();

        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_NORMAL)
        {
            this._switchCanvasPatchBg();
        }
        else
        {
            this.userSettings.set("canvasMode", "");
            this._switchCanvasSizeNormal();
        }

        this.setLayout();

        if (this.canvasManager.getCanvasUiBar())
            this.canvasManager.getCanvasUiBar().showCanvasModal(false);
    }

    toggleMaximizeCanvas()
    {
        if (this.canvasManager.mode == this.canvasManager.CANVASMODE_FULLSCREEN)
        {
            this.patchView.patchRenderer.storeSubPatchViewBox();
            this.canvasManager.mode = this.canvasManager.CANVASMODE_NORMAL;
            this.rendererWidth = this._oldCanvasWidth;
            this.rendererHeight = this._oldCanvasHeight;
        }
        else
        {
            this.patchView.patchRenderer.restoreSubPatchViewBox(this.patchView.getCurrentSubPatch());
            this._oldCanvasWidth = this.rendererWidth;
            this._oldCanvasHeight = this.rendererHeight;
            this.rightPanelWidth = this.rendererWidth;
            this.canvasManager.mode = this.canvasManager.CANVASMODE_FULLSCREEN;

            if (!this.notifiedFullscreen) notify("press escape to exit fullscreen mode");
            this.notifiedFullscreen = true;
        }

        if (this.canvasManager.getCanvasUiBar())
            this.canvasManager.getCanvasUiBar().showCanvasModal(false);
        this.setLayout();
    }

    isShowingTiming()
    {
        return this.hasAnims;
    }

    showTiming()
    {
        this.bottomTabPanel.show(true);
        this.setLayout();
    }

    /**
     * @param {boolean} show
     */
    showLoadingProgress(show)
    {
        if (this.unload) return;
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

    /**
     * @param {Object} data
     */
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
        this._showTiming = false;
        ele.hide(ele.byId("timing"));
        gui.setLayout();

    }

    hideTimeline()
    {
        if (this.timeLineTab)
            this.timeLineTab.close();
    }

    toggleTimeline()
    {
        console.log(" gui toggle timeline");
        if (this.glTimeline) this.glTimeline.toggle();
        else
            this.timeLineTab = new GlTimelineTab(gui.bottomTabs);
    }

    refreshFileManager()
    {
        if (this.fileManager) this.fileManager.refresh();
        else this.showFileManager(null, true);
    }

    savingTitleAnimEnd()
    {
        const elePatchName = ele.byId("patchname");
        elePatchName.classList.remove("blinking");

        if (elePatchName.dataset.patchname != "undefined")
            setTimeout(() =>
            {
                elePatchName.innerHTML = elePatchName.dataset.patchname;
            }, 200);
    }

    /**
     * @param {string} title
     */
    savingTitleAnimStart(title)
    {
        document.getElementById("patchname").innerHTML = title;
        document.getElementById("patchname").classList.add("blinking");
    }

    /**
     * @param {Function} cb
     * @param {boolean} userInteraction
     */
    getFileManager(cb, userInteraction)
    {
        if (!this.fileManager) this.fileManager = new FileManager(cb, userInteraction);
        return this.fileManager;
    }

    showLogging()
    {
        new LoggingTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    /**
     * @param {Function} cb
     * @param {boolean} userInteraction
     */
    showFileManager(cb = null, userInteraction = false)
    {
        this.getFileManager(cb, userInteraction);

        this.fileManager.show(userInteraction);
        gui.mainTabs.activateTabByName("Files");

        if (cb) cb();
    }

    /**
     * @param {string} name
     */
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

        const randomize = this.userSettings.get("randomizePatchName", true);
        let title = "Enter a name for your new project";
        if (randomize) title += ", leave empty for random name";
        new ModalDialog({
            "prompt": true,
            "title": "New Project",
            "text": title,
            "promptValue": randomize ? "" : "new project",
            "promptOk": (name) =>
            {
                if (randomize || name) platform.talkerAPI.send("newPatch", { "name": name });
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
            if (els[i].innerHTML) els[i].innerHTML = newShortcut;
        }
    }

    /**
     * @param {string} selector
     */
    serializeForm(selector)
    {
        const json = {};
        Array.from(ele.byQuery(selector).elements).forEach((e) =>
        {
            json[e.getAttribute("name")] = e.value;
        });
        return json;
    }

    helperContextMenu()
    {
        CmdUi.toggleOverlays();
    }

    /**
     * @param {HTMLBaseElement} el
     */
    rendererContextMenu(el)
    {
        contextMenu.show(
            {
                "items":
                    [
                        {
                            "title": "Reset canvas size",
                            "func": CmdRenderer.resetSize
                        },
                        {
                            "title": "Set canvas size",
                            "func": CmdRenderer.changeSize
                        },
                        {
                            "title": "Set canvas scale",
                            "func": CmdRenderer.scaleCanvas
                        },
                        {
                            "title": "Canvas Magnifier",
                            "func": CmdRenderer.canvasMagnifier
                        },
                        {
                            "title": "Maximize Canvas",
                            "func": CmdRenderer.maximizeCanvas,
                            "icon": "icon-picker"
                        },
                        {
                            "title": "Canvas As Patch Background",
                            "func": CmdUi.togglePatchBgRenderer
                        }

                    ]
            }, el);
    }

    /**
     * @param {HTMLElement} el
     */
    rendererAspectMenu(el)
    {
        contextMenu.show(
            {
                "items":
                    [
                        {
                            "title": "32:9",
                            func() { CmdRenderer.aspect(32 / 9); }
                        },
                        {
                            "title": "21:9",
                            func() { CmdRenderer.aspect(21 / 9); }
                        },
                        {
                            "title": "16:9",
                            func() { CmdRenderer.aspect(16 / 9); }
                        },
                        {
                            "title": "16:10",
                            func() { CmdRenderer.aspect(16 / 10); }
                        },
                        {
                            "title": "4:3",
                            func() { CmdRenderer.aspect(4 / 3); }
                        },
                        {
                            "title": "5:4",
                            func() { CmdRenderer.aspect(5 / 4); }
                        },
                        {
                            "title": "1:1",
                            func() { CmdRenderer.aspect(1); }
                        },
                        {
                            "title": "1:2",
                            func() { CmdRenderer.aspect(1 / 2); }
                        },
                        {
                            "title": "9:16",
                            func() { CmdRenderer.aspect(9 / 16); }
                        }
                    ]
            }, el);
    }

    /**
     * @param {String} converterId
     * @param {String} projectId
     * @param {String} fileId
     * @param {String} converterName
     */
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

    /**
     * @param {String} _projectId
     * @param {String} fileId
     * @param {String} converterId
     */
    converterStart(_projectId, fileId, converterId)
    {
        ele.show(ele.byId("converterprogress"));
        ele.hide(ele.byId("converterform"));

        platform.talkerAPI.send("fileConvert",
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
                    const converterOutput = ele.byId("converteroutput");
                    if (err.msg === "OVER_QUOTA")
                    {
                        converterOutput.innerHTML = "You are over quota for this action. Increase your <a href=\"" + platform.getCablesUrl() + "/support\" target='_blank'>support level</a> to get more space!";
                    }
                    else
                    {
                        converterOutput.innerText = "Error: something went wrong while converting..." + (err.msg || "");
                    }
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

    /**
     * @param {Function} cb
     */
    bind(cb)
    {
        this.canvasManager.addContext(this.corePatch().cgl);

        if (this.userSettings.get("canvasMode") == "patchbg") this._switchCanvasPatchBg();

        this.bottomInfoArea.on("changed", this.setLayout.bind(this));

        let lastTimeRecent = 0;
        const navCablesLogo = ele.byId("nav_logo_area");

        navCablesLogo.addEventListener("pointerenter", () =>
        {
            if (lastTimeRecent != 0 && performance.now() - lastTimeRecent < 30000) return;
            platform.talkerAPI.send("getRecentPatches", {}, (_err, r) =>
            {

                lastTimeRecent = performance.now();

                let str = "";
                str += "<li id=\"nav_support\" class=\"nav_support\" >❤️ &nbsp;Support cables</li>";
                str += "<li id=\"nav_help_forum\">Report Problems</li>";

                str += "<li class=\"divide\"></li>";

                if (platform.frontendOptions.showMyLinks)
                    str += "<li id=\"nav_mypatches\"><a target=\"_blank\" href=\"" + platform.getCablesUrl() + "/mypatches\">My Patches</a></li>";

                str += "<li id=\"nav_patch_new\">Create New Empty Patch</li>";

                str += "<li class=\"divide\"></li>";

                if (platform.frontendOptions.showOpenPatch)
                {
                    let item = "<li><a onclick='CABLES.platform.talkerAPI.send(\"gotoPatch\");' class=\"mine\" target=\"_top\">Open Patch<span class='shortcut'><p><span class='key key_cmd'></span><code>o</code></p></span></a></li>";
                    str += this.bottomInfoArea.replaceShortcuts(item);
                }

                if (r)
                    for (let i = 0; i < Math.min(5, r.length); i++)
                    {
                        const url = platform.getCablesUrl() + "/edit/" + r[i].shortId;
                        str += "<li><a href=\"" + url + "\" class=\"mine\" target=\"_top\">Open Patch " + r[i].name + "</a></li>";
                    }

                str += "<li class=\"divide\"></li>";

                str += "<li id=\"nav_cablesweb\"><a target=\"_top\" href=\"" + platform.getCablesUrl() + "/\">Open cables.gl</a></li>";
                ele.byId("nav_recentpatches").innerHTML = str;

                ele.byId("nav_patch_new").addEventListener("click", () => { CmdPatch.newPatch(); });
                ele.byId("nav_help_forum").addEventListener("click", () => { window.open("https://github.com/cables-gl/cables/issues", "_blank"); });
                ele.byId("nav_support").addEventListener("click", () => { window.open(platform.getCablesDocsUrl() + "/support", "_blank"); });

                if (this.user.isSupporter) ele.hide(ele.byId("nav_support"));
            });
        });

        ele.byId("nav_cmdplt").addEventListener("click", () => { gui.cmdPallet.show(); });
        ele.byId("nav_search").addEventListener("click", () => { gui.find(""); });

        ele.byId("nav_createBackup").addEventListener("click", () => { CmdPatch.createBackup(); });
        ele.byId("nav_viewBackups").addEventListener("click", () => { CmdPatch.showBackups(); });

        ele.byId("nav_preferences").addEventListener("click", () => { CmdUi.showPreferences(); });
        ele.byId("nav_viewProjectLink").addEventListener("click", (e) =>
        {
            e.preventDefault();
            const projectId = this._currentProject ? this._currentProject.shortId : null;
            if (projectId)
            {
                const url = platform.getCablesUrl() + "/p/" + projectId;
                const win = window.open(url, "_blank");
                win.focus();
            }
        });
        ele.byId("nav_remoteViewerLink").addEventListener("click", () => { CmdUi.openRemoteViewer(); });

        ele.byId("nav_patch_save").addEventListener("click", () => { CmdPatch.save(); });
        ele.byId("nav_patch_saveas").addEventListener("click", () => { CmdPatch.saveAs(); });
        ele.byId("nav_patch_export").addEventListener("click", () => { CmdPatch.export(); });
        ele.byId("nav_patch_export_patch").addEventListener("click", () => { CmdPatch.export("patch"); });

        if (platform.frontendOptions.hasOpDirectories)
        {
            const opDirEle = ele.byId("nav_patch_add_opdir");
            if (opDirEle)
            {
                ele.show(opDirEle);
                opDirEle.addEventListener("click", () => { platform.openOpDirsTab(); });
            }
        }

        const uploadEle = ele.byId("nav_uploadfile");
        if (uploadEle)
        {
            uploadEle.addEventListener("click", CmdPatch.uploadFileDialog);
            if (!platform.frontendOptions.showAssetUpload) uploadEle.innerText = "Add file";
        }

        if (!platform.frontendOptions.showPatchSettings) ele.hide(ele.byId("nav_patch_settings"));
        if (!platform.frontendOptions.showPatchViewPage) ele.hide(ele.byId("nav_patch_page"));

        const exportLink = ele.byId("nav_patch_export");
        if (!platform.frontendOptions.showExport)
        {
            ele.hide(exportLink);
        }
        if (platform.isElectron())
        {
            if (exportLink) exportLink.innerText = "Export - HTML";
        }

        if (!platform.frontendOptions.showExportPatch)
        {
            ele.hide(ele.byId("nav_patch_export_patch"));
        }

        if (!platform.frontendOptions.showMyLinks) ele.hide(ele.byId("nav_mypatches"));

        if (!platform.frontendOptions.showPatchBackups)
        {
            ele.hide(ele.byId("nav_viewBackups"));
            ele.hide(ele.byId("nav_createBackup"));
        }

        if (platform.frontendOptions.showChangeLogLink) ele.byId("nav_changelog").addEventListener("click", () => { window.open(platform.getCablesDocsUrl() + "/changelog", "_blank"); });
        else ele.hide(ele.byId("nav_changelog"));

        if (platform.frontendOptions.showBuildInfoMenuLink) ele.byId("nav_buildinfo").addEventListener("click", () => { CmdUi.showBuildInfo(); });
        else ele.hide(ele.byId("nav_buildinfo"));

        // --- Help menu
        // Documentation

        ele.byId("nav_help_keys").addEventListener("click", () => { CmdUi.showKeys(); });
        ele.byId("nav_help_documentation").addEventListener("click", () => { window.open(platform.getCablesDocsUrl() + "/docs", "_blank"); });

        ele.byId("nav_help_tips").addEventListener("click", () => { CmdUi.showTips(); });

        // Introduction
        ele.byId("nav_help_introduction").addEventListener("click", () => { gui.introduction.showIntroduction(); });
        ele.byId("nav_help_video").addEventListener("click", () => { window.open("https://www.youtube.com/cablesgl", "_blank"); });

        ele.byId("nav_op_createOp").addEventListener("click", () => { gui.serverOps.createDialog(); });
        ele.byId("nav_op_patchOp").addEventListener("click", () =>
        {
            gui.patchView.unselectAllOps();
            CmdPatch.createSubPatchOp();
        });
        ele.byId("nav_filemanager").addEventListener("click", () => { gui.showFileManager(null, true); });

        ele.byId("nav_timeline").addEventListener("click", () =>
        {
            CABLES.CMD.TIMELINE.toggleTimeline();
        });

        ele.byId("nav_gpuprofiler").addEventListener("click", () => { CmdUi.profileGPU(); });
        ele.byId("nav_log").addEventListener("click", () => { CABLES.CMD.DEBUG.logConsole(); });

        ele.byId("nav_profiler").addEventListener("click", () => { CmdPatch.patchProfiler(); });
        ele.byId("nav_patchanalysis").addEventListener("click", () => { CmdPatch.analyze(); });

        if (!platform.isTrustedPatch())
        {
            ele.byId("nav_op_createOp").classList.add("nav-greyout");
            ele.byId("nav_op_patchOp").classList.add("nav-greyout");
            ele.byId("nav_uploadfile").classList.add("nav-greyout");

            ele.byId("nav_createBackup").classList.add("nav-greyout");
            // ele.byId("nav_patch_settings").classList.add("nav-greyout");
            ele.byId("nav_viewBackups").classList.add("nav-greyout");
            ele.byId("nav_patch_save").classList.add("nav-greyout");
        }
        else if (platform.patchIsBackup())
        {
            ele.hide(ele.byId("nav_createBackup"));
        }

        ele.byId("nav-item-activity").addEventListener("click", () =>
        {
            CmdUi.activityFeed();
        });

        ele.byId("nav-item-bpReload").addEventListener("click", () => { CmdPatch.updateLocalChangedBlueprints(); });

        this.htmlEleOverlay = new HtmlElementOverlay();
        this.canvasManager.updateCanvasUi();
        cb();
    }

    onResize()
    {
        if (this.canvasManager.getCanvasUiBar())
            this.canvasManager.getCanvasUiBar().showCanvasModal(false);
        this.canvasManager.blur();
        this.mainTabs.emitEvent("resize");
        this.setLayout();
        this.setLayout(); // yes, twice....
        gui.emitEvent(Gui.EVENT_RESIZE);
    }

    bindKeys()
    {
        if (gui.isRemoteClient) return;

        this.keys.key("Tab", "cycle tab", "down", null, { "altKey": true, "ignoreInput": false }, () =>
        {
            gui.maintabPanel.tabs.cycleActiveTab();
        });

        // opens editor for 1st string port found on an op with shift+e
        this.keys.key("e", "shift-e editor", "down", null, { "cmdCtrl": false, "shiftKey": true, "ignoreInput": true }, () =>
        {
            if (gui.patchView.getSelectedOps().length !== 1 || !gui.patchView.getSelectedOps()[0].portsIn.length) return;

            const selectedOp = gui.patchView.getSelectedOps();
            const selectedOpId = selectedOp[0].id;

            let port = null;

            for (let i = 0; i < selectedOp[0].portsIn.length; i++)
            {
                port = selectedOp[0].portsIn[i];
                if (port.uiAttribs && port.uiAttribs.editShortcut) break;
            }

            if (port)
            {
                if (port.uiAttribs.display === "editor")
                    paramsHelper.openParamStringEditor(selectedOpId, port.name, null, true);
                if (port.uiAttribs.display === "gradient")
                {
                    const editor = new CABLES.GradientEditor(selectedOpId, port.name, { "openerEle": ele.byClass("gradienteditbutton") });
                    editor.show();
                }
            }
        });

        const getSettingKeys = (keybindName, defaultKey) =>
        {
            let val = defaultKey;
            const setting = String(this.userSettings.get(keybindName) || "");
            if (setting)
            {
                if (setting.indexOf(",") > 0)
                {
                    const keys = setting.split(",");
                    if (keys) keys.map((item) => { return item.trim(); });
                    val = keys;
                }
                else val = setting;
            }

            return val;
        };

        this.keys.key(getSettingKeys("keybind_escape", "escape"), "Open \"Op Create\" dialog (or close current dialog)", "down", null, {}, (e) =>
        {
            if (document.activeElement)
                if (
                    gui.isShowingModal() ||
                    (
                        !document.activeElement.classList.contains("ace_text-input") &&
                        document.activeElement.tagName != "INPUT" &&
                        document.activeElement.tagName != "TEXTAREA"
                    ) ||
                    !document.activeElement.classList.contains("notIgnoreEscape"))
                {
                    this.pressedEscape(e);
                    this.patchView.focus();
                }
                else
                {
                    return false;
                    // if (e.target.hasAttribute("data-portnum"))
                    // {
                    //     const n = e.target.dataset.portnum;
                    //     const nextInputEle = ele.byId("portval_" + (parseInt(n) + 1));
                    //     if (nextInputEle) nextInputEle.focus();
                    // }
                }
        });

        this.keys.key("Escape", "Toggle Tab Area", "down", null, { "cmdCtrl": true }, () => { this.maintabPanel.toggle(true); this.setLayout(); });

        this.keys.key("p", "Open Command Palette", "down", null, { "cmdCtrl": true }, () => { this.cmdPallet.show(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true }, () => { this.toggleMaximizeCanvas(); });
        this.keys.key("Enter", "Cycle size of renderer between normal and Fullscreen", "down", null, { "cmdCtrl": true, "shiftKey": true }, () => { this.cyclePatchBg(); });
        this.keys.key("Enter", "Cycle patchfield visibility", "down", null, { "cmdCtrl": false, "shiftKey": true }, () =>
        {
            CmdUi.togglePatchBgPatchField();
        });

        this.keys.key("z", "undo", "down", null, { "ignoreInput": true, "cmdCtrl": true }, () => { undo.undo(); });
        this.keys.key("z", "redo", "down", null, { "ignoreInput": true, "cmdCtrl": true, "shiftKey": true }, () => { undo.redo(); });
        this.keys.key(",", "Patch Settings", "down", null, { "ignoreInput": true, "cmdCtrl": true }, () => { CmdUi.settings(); });

        this.keys.key("f", "Find/Search in patch", "down", null, { "cmdCtrl": true }, (/** @type {HtmlElementOverlay} */ e) =>
        {
            const eleAceTextEditor = ele.byQuery("#ace_editors textarea");
            if (!(eleAceTextEditor && ele.hasFocus(eleAceTextEditor)) && !gui.isShowingModal()) CmdUi.showSearch();
            else e.dontPreventDefault = true;
        });

        this.keys.key("s", "Save patch as new patch", "down", null, { "cmdCtrl": true, "shiftKey": true }, () =>
        {
            CmdPatch.saveAs();
        });

        this.keys.key("s", "Save patch", "down", null, { "cmdCtrl": true }, () =>
        {
            gui.corePatch().checkExtensionOpPatchAssets();

            if (document.activeElement.classList.contains("ace_text-input") && gui.mainTabs.getSaveButton() && gui.maintabPanel.isVisible()) // && !this.patchView.hasFocus()
            {
                gui.mainTabs.getSaveButton().cb();
            }
            else
            {
                CmdPatch.save();
            }
        });

        this.keys.key(" ", "show/hide timeline", "down", null, { "cmdCtrl": true, "ignoreInput": true }, () =>
        {
            gui.toggleTimeline();
        });

        this.keys.key(" ", "Play/Pause timeline", "down", null, { "ignoreInput": true }, () =>
        {
            if (document.activeElement.tagName == "BODY" || document.activeElement.tagName == "DIV") gui.toggleTimelinePlay();

            if (this._spaceBarStart === 0) this._spaceBarStart = Date.now();
        });

        this.keys.key(" ", "Play/Pause timeline", "up", null, { "ignoreInput": true }, () =>
        {
            if (document.activeElement.tagName == "CANVAS")
            {
                const timeused = Date.now() - this._spaceBarStart;
                if (timeused < 250) gui.toggleTimelinePlay();
            }
            this._spaceBarStart = 0;
        });

        this.keys.key("o", "Toggle Overlays", "down", null, { "ignoreInput": true }, () =>
        {
            CmdUi.toggleOverlays();
        });
    }

    toggleTimelinePlay()
    {
        gui.corePatch().timer.togglePlay();

    }

    /**
     * @param {KeyboardEvent} e
     */
    pressedEscape(e)
    {
        if (this.canvasManager.getCanvasUiBar())
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
                this.toggleMaximizeCanvas();
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
        else if (contextMenu.isVisible()) contextMenu.close();
        else if (gui.isShowingModal())
        {
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
        else if (this.maintabPanel.isVisible() && gui.userSettings.get("escape_closetabs")) this.maintabPanel.hide();
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
            ele.forEachClass("tooltip", (/** @type {Element | HTMLElement} */ el) =>
            {
                ele.hide(el);
            });
        }, 50);
    }

    /**
     * @param {string} libName
     */
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
        this._log.logGui("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;____&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;________&nbsp;&nbsp;___________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______");
        this._log.logGui("._(//&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;___)\\_&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/(_\\___&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/(___&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/");
        this._log.logGui("|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_/___)\\&nbsp;_&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/______)/&nbsp;&nbsp;&nbsp;&nbsp;_/(___&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/(_____..___&nbsp;");
        this._log.logGui("|_&nbsp;&nbsp;&nbsp;&nbsp;\\/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;_&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/_/&nbsp;&nbsp;&nbsp;&nbsp;_/&nbsp;&nbsp;&nbsp;_//&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;_)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;____&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;||&nbsp;&nbsp;//");
        this._log.logGui("&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/_\\&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\\&nbsp;&nbsp;&nbsp;&nbsp;\\(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\\&nbsp;&nbsp;&nbsp;&nbsp;_/&nbsp;&nbsp;&nbsp;_&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_||_/&nbsp;&nbsp;");
        this._log.logGui("/___________)__/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__________\\____________\\______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\\\\/________)diP");
        this._log.logGui("-&nbsp;------------/________/------------------------------\\_______\\-------------&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;");

        this._log.logGui("");

        ele.show(ele.byId("cablescanvas"));
        ele.show(ele.byId("mainContainer"));

        ele.byId("menubar").classList.remove("hidden");

        if (this.userSettings.get("showUIPerf") == true) gui.uiProfiler.show();

        if (this.userSettings.get(GlTimeline.USERSETTING_TL_OPENED)) CABLES.CMD.TIMELINE.openGlTimeline();

        this._elGlCanvasDom.addEventListener("pointerenter", () =>
        {
            gui.showInfo(text.canvas);
        });

        this._elGlCanvasDom.addEventListener("pointerleave", () =>
        {
            hideInfo();
        });

        if (this.userSettings.get("presentationmode")) CmdUi.startPresentationMode();

        if (this._corePatch.cgl.aborted)
        {
            CABLES.UI.MODAL.showError("no webgl", "your browser does not support webgl");
            return;
        }

        if (this.userSettings.get("fileManagerOpened") == true) this.showFileManager();
        if (this.userSettings.get("openLogTab") == true) this.showLogging();

        gui.transformOverlay.updateVisibility();

        this.iconBarLeft = new IconBar("sidebar_left");
        this.iconBarPatchNav = new IconBar("sidebar_bottom");
        this.iconBarTimeline = new IconBar("sidebar_timeline");

        if (this.getRestriction() != Gui.RESTRICT_MODE_REMOTEVIEW &&
            this.userSettings.get("showTipps") &&
            this.userSettings.get("introCompleted")) CmdUi.showTips();

        if (platform.frontendOptions.showWelcome && this.corePatch().ops.length == 0) CmdUi.welcomeTab(true);

        let ver = "";
        ver += platform.getCablesVersion();
        if (platform.isDevEnv()) ver += " (dev)";
        this._log.groupCollapsed("welcome to cables " + ver + "!");

        if (platform.getPatchVersion())
            gui.restriction.setMessage("backup", "This is a backup version, saving will overwrite the current version!");

        console.log("start up times:"); // eslint-disable-line no-console
        console.table(CABLESUILOADER.startup.log); // eslint-disable-line no-console
        console.groupEnd(); // eslint-disable-line no-console

        if (this.isRemoteClient) this._log.logGui("REMOTE CLIENT SESSION");

        this._log.logGui("browser: " + platformLib.description);

        const branches = {};

        const buildInfo = CABLESUILOADER.buildInfo;
        if (buildInfo.ui && buildInfo.ui.git)
        {
            const branch = buildInfo.ui.git.branch;
            if (!branches.hasOwnProperty(branch)) branches[branch] = [];
            branches[branch].push("ui");
            this._log.logGui("BuildInfo: [" + branch + "] UI buildmessage: " + buildInfo.ui.git.message);
        }

        if (buildInfo.core && buildInfo.core.git)
        {
            const branch = buildInfo.core.git.branch;
            if (!branches.hasOwnProperty(branch)) branches[branch] = [];
            branches[branch].push("core");
            this._log.logGui("BuildInfo: [" + branch + "] CORE buildmessage: " + buildInfo.core.git.message);
        }

        if (buildInfo.api && buildInfo.api.git)
        {
            const branch = buildInfo.api.git.branch;
            if (!branches.hasOwnProperty(branch)) branches[branch] = [];
            branches[branch].push("api");
            this._log.logGui("BuildInfo: [" + branch + "] API buildmessage: " + buildInfo.api.git.message);
        }

        if (buildInfo.shared && buildInfo.shared.git)
        {
            const branch = buildInfo.shared.git.branch;
            if (!branches.hasOwnProperty(branch)) branches[branch] = [];
            branches[branch].push("shared");
            this._log.logGui("BuildInfo: [" + branch + "] SHARED buildmessage: " + buildInfo.shared.git.message);
        }

        if (Object.keys(branches).length > 1)
        {
            let msg = "Diverting branches: ";
            let first = true;
            for (const branch in branches)
            {
                if (!first) msg += ", ";
                first = false;
                const repos = branches[branch].join(" and ");
                msg += repos + " on " + branch;
            }
            this._log.error(msg);
        }

        gui.savedState.setSavedAll("showUiElements");
        gui.savedState.resume();

        gui.metaTabs.loadCurrentTabUsersettings();
        gui.patchView.focus();

        setTimeout(() =>
        {
            gui.setLayout();
            gui.mainTabs.emitEvent("resize");
        }, 100);

        setTimeout(() =>
        {
            ele.hide(ele.byId("loadingstatus"));
        }, 0);
    }

    showWelcomeNotifications()
    {
        if (!gui.isRemoteClient && platform.showGitBranchWarning) platform.showGitBranchWarning();
        if (!gui.isRemoteClient && platform.showBrowserWarning) platform.showBrowserWarning();
        if (!gui.isRemoteClient && platform.showStartupChangelog) platform.showStartupChangelog();
    }

    getOpDoc(opname, _html, cb)
    {
        cb(this.opDocs.getHtml(opname));
    }

    showSettings()
    {
        window.onmessage = (e) =>
        {
            if (e.data && typeof e.data == "string")
            {
                const c = e.data.split(":");
                if (c.length > 1)
                {
                    if (c[0] == "projectname") this.setProjectName(c[1]);
                    if (c[0] == "notify") notify(c[1]);
                    if (c[0] == "notifyerror") notifyError(c[1]);
                    if (c[0] == "cmd" && c[1] == "saveproject") this.patchView.store.saveCurrentProject();
                }
            }
        };

        const url = platform.getCablesUrl() + "/patch/" + this.project().shortId + "/settings?iframe=true";
        gui.mainTabs.addIframeTab("Patch Settings", url, { "icon": "settings", "closable": true, "singleton": true, "gotoUrl": platform.getCablesUrl() + "/patch/" + this.project().shortId + "/settings" }, true);
    }

    setCursor(str)
    {
        if (!str) str = "auto";
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
        if (!this._gizmo[idx]) this._gizmo[idx] = new Gizmo(this.corePatch().cgl);

        if (!this.userSettings.get("overlaysShow"))
        {
            this._gizmo[idx].set(null);
            return;
        }

        this._gizmo[idx].set(params);
    }

    /**
     * @param {string} id
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setTransform(id, x, y, z)
    {
        if (this.shouldDrawOverlay) this.transformOverlay.add(this.corePatch().cgl, id, x, y, z);
    }

    /**
     * @param {HTMLElement} el
     */
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

        el.classList.add(this.userSettings.get("bgpattern") || "bgPatternDark");
    }

    notIdling()
    {
        this.lastNotIdle = now();
    }

    checkIdle()
    {
        const idling = (now() - this.lastNotIdle) / 1000;
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
        this.savedState.setUnSaved("unknown", 0);
    }

    reloadDocs(cb)
    {
        gui.opDocs.addCoreOpDocs();
        if (cb) cb();
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
                tabpanel.querySelectorAll(".tabcontent").forEach(
                    (tab) =>
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
                    // @ts-ignore
                    tab.inert = false;
                });
            }
            const timeline = ele.byId("timing");
            if (timeline)
                timeline.classList.remove("readonly");

            const tlIconBar = ele.byId("iconbar_sidebar_timeline");
            if (tlIconBar) ele.show(tlIconBar);
        }

        if (this.iconBarLeft) this.iconBarLeft.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
        if (this.iconBarPatchNav) this.iconBarPatchNav.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
        if (this.bottomInfoArea) this.bottomInfoArea.setVisible(r > Gui.RESTRICT_MODE_FOLLOWER);
    }

    init()
    {
        // this.canvasManager.getCanvasUiBar() = new CABLES.UI.CanvasUi(this.corePatch().cgl);

        this.setTheme(JSON.parse(JSON.stringify(defaultTheme)));

        if (window.localStorage.getItem("cables_theme") && window.localStorage.getItem("cables_theme") != "null" && window.localStorage.getItem("cables_theme") != "undefined")
        {
            try
            {
                this._log.log("🌈 found theme in localstorage!", JSON.parse(window.localStorage.getItem("cables_theme")));
                this.setTheme(JSON.parse(window.localStorage.getItem("cables_theme")));
            }
            catch (e)
            {
                this._log.error(e);
            }
        }

        hljs.configure({ "ignoreUnescapedHTML": true });

        if (this.isRemoteClient) this.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
        else this.setRestriction(Gui.RESTRICT_MODE_FULL);

        initSplitPanes();

        ele.byId("undev").addEventListener("pointerEnter", () =>
        {
            gui.showInfo(text.undevLogo);
        });
        ele.byId("undev").addEventListener("pointerLeave", () =>
        {
            hideInfo();
        });

        this.replaceNavShortcuts();
    }

    /**
     * @param {number} v
     */
    setFontSize(v)
    {
        v = v || 0;
        document.documentElement.style.setProperty("--font-size-off", (v || 0) + "px");
    }

    /**
     * @param {object} u
     */
    setUser(u)
    {
        this.user = u;
    }

    initCoreListeners()
    {

        this._corePatch.on("portAnimToggle", (_options) =>
        {
            this.hasAnims = true;
        });

        this._corePatch.on("portAnimUpdated", (_options) =>
        {
            if (!this.hasAnims)
            {
                this.hasAnims = true;
                this.setLayout();
            }
        });

        this._corePatch.on("criticalError", (options) =>
        {
            new ModalError(options);
        });

        this._corePatch.on("renderDelayStart", () =>
        {
        });

        this._corePatch.on("renderDelayEnd", () =>
        {
        });

        this._corePatch.cgl.on("webglcontextlost", () =>
        {
            new ModalDialog({
                "warnning": true,
                "title": "Context lost",
                "text": "something went wrong. webgl context was lost. reload page or try restarting your browser",
            });
        });

        this._corePatch.checkExtensionOpPatchAssets();

    }

    /**
     * @param {string} txt
     */
    showInfoParam(txt)
    {
        showInfo(txt, true);
    }

    /**
     * @param {string} txt
     */
    showInfo(txt)
    {
        showInfo(txt);
    }

    /**
     * @param {number} r
     */
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

    /** @param {CablesTheme} theme */
    setTheme(theme = {})
    {
        if (!theme) return;

        theme = JSON.parse(JSON.stringify(theme));
        theme.colors = theme.colors || {};

        const missing = {};

        /**
         * @param {Array<Number>} rgb
         */
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
        return JSON.parse(JSON.stringify(defaultTheme));
    }

    hide()
    {

        if (gui)gui.unload = true;
        this._corePatch.pause();

        ele.byId("gluiPreviewLayer").style.opacity =
            ele.byId("maincomponents").style.opacity =
            ele.byId("mainContainer").style.opacity =
            ele.byId("cablescanvas").style.opacity = "0.0000000001";
        document.body.style["pointer-events"] = "none";
    }

}
