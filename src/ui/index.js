
import { ele } from "cables-shared-client";
import subPatchOpUtil from "./subpatchop_util.js";
import Api from "./api/api.js";
import LibLoader from "./api/libloader.js";
import CMD from "./commands/commands.js";
import CanvasLens from "./components/canvas/canvaslens.js";
import CanvasUi from "./components/canvas/canvasui.js";
import helperMeshes from "./components/overlay/overlaymeshes.js";
import Collapsable from "./components/collapsable.js";
import FileManager from "./components/filemanager.js";
import DragNDrop from "./components/filemanager_dragdrop.js";
import setHtmlDefaultListeners from "./components/htmldefaultlisteners.js";
import startIdleListeners from "./components/idlemode.js";
import Keypresenter from "./components/keypresenter.js";
import paramsHelper from "./components/opparampanel/params_helper.js";
import ParamTabInputListener from "./components/opparampanel/param_inputtablistener.js";
import valueChanger from "./components/opparampanel/valuechanger.js";
import Chat from "./components/tabs/tab_chat.js";
import FindTab from "./components/tabs/tab_find.js";
import Profiler from "./components/tabs/tab_profiler.js";
import SpreadSheetTab from "./components/tabs/tab_spreadsheet.js";
import TexturePreviewer from "./components/texturepreviewer.js";
import extendCoreAnim from "./components/timelinesvg/core_anim_extend.js";
import UiProfiler from "./components/uiperformance.js";
import userSettings from "./components/usersettings.js";
import defaultOps from "./defaultops.js";
import Exporter from "./dialogs/exporter.js";
import GradientEditor from "./dialogs/gradienteditor.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ModalError from "./dialogs/modalerror.js";
import ModalLoading from "./dialogs/modalloading.js";
import oldModalWrap from "./dialogs/modal_old_wrap.js";
import FileUploader from "./dialogs/upload.js";
import ContextMenu from "./elements/contextmenu.js";
import { notify, notifyError, notifyWarn } from "./elements/notification.js";
import initSplitPanes from "./elements/splitpane.js";
import EditorSession from "./elements/tabpanel/editor_session.js";
import Tab from "./elements/tabpanel/tab.js";
import { hideInfo, hideToolTip, showToolTip, updateHoverToolTip } from "./elements/tooltips.js";
import GlPatch from "./glpatch/glpatch.js";
import GlUiCanvas from "./glpatch/gluicanvas.js";
import gluiconfig from "./glpatch/gluiconfig.js";
import GlGuiFull from "./glpatch/gluifull.js";
import GlGuiTab from "./glpatch/gluitab.js";
import GlPatchAPI from "./glpatch/patchapi.js";
import extendCoreOp from "./core_extend_op.js";
import PlatformCommunity from "./platform_community.js";
import PlatformStandalone from "./platform_standalone.js";
import startUi from "./startgui.js";
import text from "./text.js";
import uiconfig from "./uiconfig.js";
import { initHandleBarsHelper } from "./utils/handlebars.js";
import { uniqueArray } from "./utils/helper.js";
import LogFilter from "./utils/loggerfilter.js";
import undo from "./utils/undo.js";
import TabPortObjectInspect from "./components/tabs/tab_portobjectionspect.js";
import ManageOp from "./components/tabs/tab_manage_op.js";
import extendCorePatch from "./core_extend_patch.js";
import Gizmo from "./elements/canvasoverlays/transformgizmo.js";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};
CABLES.UTILS = CABLES.UTILS || {};

CABLES.PlatformCommunity = PlatformCommunity;
CABLES.PlatformStandalone = PlatformStandalone;

CABLES.UI.userSettings = userSettings;

// CONSTANTS

window.ele = ele;

CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;
CABLES.GLGUI.CURSOR_POINTER = 2;

// expose global classes
CABLES.GLGUI.GlUiCanvas = GlUiCanvas;
CABLES.GLGUI.GlPatch = GlPatch;
CABLES.GLGUI.GlPatchAPI = GlPatchAPI;
CABLES.GLUI.glUiConfig = gluiconfig;
CABLES.UI.uiConfig = uiconfig;
CABLES.UI.TabPortObjectInspect = TabPortObjectInspect;

CABLES.UI.CanvasLens = CanvasLens;
CABLES.UI.Keypresenter = Keypresenter;
CABLES.UI.UiProfiler = UiProfiler;
CABLES.UI.Exporter = Exporter;
// CABLES.UI.PatchServer = PatchSaveServer;
CABLES.GradientEditor = GradientEditor;
CABLES.UI.Tab = Tab; // needs to stay - is used in ops
CABLES.UI.FindTab = FindTab;
CABLES.UI.SpreadSheetTab = SpreadSheetTab;
CABLES.UI.FileManager = FileManager;
CABLES.UI.Profiler = Profiler;
CABLES.UI.Chat = Chat;
CABLES.LibLoader = LibLoader;
CABLES.UI.CanvasUi = CanvasUi;
CABLES.UI.TexturePreviewer = TexturePreviewer;

CABLES.GLGUI.GlGuiFull = GlGuiFull;
CABLES.GLGUI.GlGuiTab = GlGuiTab;

CABLES.UI.getOpsForFilename = defaultOps.getOpsForFilename;
CABLES.UI.getVarGetterOpNameByType = defaultOps.getVarGetterOpNameByType;
CABLES.UI.DEFAULTOPNAMES = defaultOps.defaultOpNames;
CABLES.UI.DEFAULTMATHOPS = defaultOps.defaultMathOps;
CABLES.UI.DEFAULTOPS = defaultOps;
// expose global objects
CABLES.api = new Api();
CABLES.contextMenu = new ContextMenu();
CABLES.fileUploader = new FileUploader();
CABLES.editorSession = new EditorSession();
CABLES.UI.Collapsable = Collapsable;

CABLES.UI.TIPS = text.tips;
CABLES.UI.TEXTS = text;

CABLES.UI.ModalDialog = ModalDialog; // needs to stay - is used in ops
CABLES.UI.ModalLoading = ModalLoading;
CABLES.UI.ModalError = ModalError;

// expose global functions
CABLES.UI.initSplitPanes = initSplitPanes;
CABLES.UI.initHandleBarsHelper = initHandleBarsHelper;
CABLES.UTILS.uniqueArray = uniqueArray;

CABLES.UI.startIdleListeners = startIdleListeners;

CABLES.UI.hideToolTip = hideToolTip;
CABLES.UI.showToolTip = showToolTip;
CABLES.UI.hideInfo = hideInfo;
CABLES.UI.updateHoverToolTip = updateHoverToolTip;

CABLES.UI.notify = notify;
CABLES.UI.notifyError = notifyError;
CABLES.UI.notifyWarn = notifyWarn;
CABLES.DragNDrop = DragNDrop;

CABLES.CMD = CMD;


CABLES.uniqueArray = uniqueArray;
CABLES.UI.uiProfiler = new CABLES.UI.UiProfiler();

CABLES.UI.logFilter = new LogFilter();

CABLES.GL_MARKER = helperMeshes;

CABLES.UI.paramsHelper = paramsHelper;
CABLES.UI.valueChanger = valueChanger;
CABLES.UI.ParamTabInputListener = ParamTabInputListener;

CABLES.UI.undo = undo;

CABLES.UI.MODAL = oldModalWrap;
CABLES.UI.ManageOp = ManageOp;
CABLES.UI.SubPatchOpUtil = subPatchOpUtil;
CABLES.UI.Gizmo = Gizmo;


setHtmlDefaultListeners();
extendCoreOp();
extendCorePatch();
extendCoreAnim();

CABLES.UI.startUi = startUi;

// added during webpack build
CABLES.UI.build = window.BUILD_INFO;
