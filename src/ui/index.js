
import Api from "./api/api";
import LibLoader from "./api/libloader";
import PatchSaveServer from "./api/patchServerApi";
import CMD from "./commands/commands";
import CanvasLens from "./components/canvas/canvaslens";
import CanvasUi from "./components/canvas/canvasui";
import helperMeshes from "./components/cgl_helpermeshes";
import Collapsable from "./components/collapsable";
import FileManager from "./components/filemanager";
import DragNDrop from "./components/filemananager_dragdrop";
import setHtmlDefaultListeners from "./components/htmldefaultlisteners";
import startIdleListeners from "./components/idlemode";
import Keypresenter from "./components/keypresenter";
import paramsHelper from "./components/opparampanel/params_helper";
import valueChanger from "./components/opparampanel/valuechanger";
import Chat from "./components/tabs/tab_chat";
import FindTab from "./components/tabs/tab_find";
import Profiler from "./components/tabs/tab_profiler";
import SpreadSheetTab from "./components/tabs/tab_spreadsheet";
import TexturePreviewer from "./components/texturepreviewer";
import extendCoreAnim from "./components/timelinesvg/core_anim_extend";
import UiProfiler from "./components/uiperformance";
import userSettings from "./components/usersettings";
import defaultops from "./defaultops";
import Exporter from "./dialogs/exporter";
import GradientEditor from "./dialogs/gradienteditor";
import ModalDialog from "./dialogs/modaldialog";
import ModalError from "./dialogs/modalerror";
import ModalLoading from "./dialogs/modalloading";
import oldModalWrap from "./dialogs/modal_old_wrap";
import FileUploader from "./dialogs/upload";
import ContextMenu from "./elements/contextmenu";
import { notify, notifyError } from "./elements/notification";
import initSplitPanes from "./elements/splitpane";
import EditorSession from "./elements/tabpanel/editor_session";
import Tab from "./elements/tabpanel/tab";
import { hideInfo, hideToolTip, showToolTip, updateHoverToolTip } from "./elements/tooltips";
import GlPatch from "./glpatch/glpatch";
import GlUiCanvas from "./glpatch/gluicanvas";
import gluiconfig from "./glpatch/gluiconfig";
import GlGuiFull from "./glpatch/gluifull";
import GlGuiTab from "./glpatch/gluitab";
import GlPatchAPI from "./glpatch/patchapi";
import extendCore from "./op_core_extend";
import SandboxBrowser from "./sandbox_browser";
import startUi from "./startgui";
import text from "./text";
import uiconfig from "./uiconfig";
import ele from "./utils/ele";
import { initHandleBarsHelper } from "./utils/handlebars";
import { arrayContains, uniqueArray } from "./utils/helper";
import LogFilter from "./utils/loggerfilter";
import undo from "./utils/undo";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};


CABLES.SandboxBrowser = SandboxBrowser;

CABLES.UI.userSettings = userSettings;

// CONSTANTS

window.ele = ele;

CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;

// expose global classes
CABLES.GLGUI.GlUiCanvas = GlUiCanvas;
CABLES.GLGUI.GlPatch = GlPatch;
CABLES.GLGUI.GlPatchAPI = GlPatchAPI;
CABLES.GLUI.glUiConfig = gluiconfig;
CABLES.UI.uiConfig = uiconfig;

CABLES.UI.CanvasLens = CanvasLens;
CABLES.UI.Keypresenter = Keypresenter;
CABLES.UI.UiProfiler = UiProfiler;
CABLES.UI.Exporter = Exporter;
CABLES.UI.PatchServer = PatchSaveServer;
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

CABLES.UI.getOpsForFilename = defaultops.getOpsForFilename;
CABLES.UI.getVarGetterOpNameByType = defaultops.getVarGetterOpNameByType;
CABLES.UI.DEFAULTOPNAMES = defaultops.defaultOpNames;
CABLES.UI.DEFAULTMATHOPS = defaultops.defaultMathOps;
CABLES.UI.DEFAULTOPS = defaultops;
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
CABLES.UTILS.arrayContains = arrayContains;

CABLES.UI.startIdleListeners = startIdleListeners;

CABLES.UI.hideToolTip = hideToolTip;
CABLES.UI.showToolTip = showToolTip;
CABLES.UI.hideInfo = hideInfo;
CABLES.UI.updateHoverToolTip = updateHoverToolTip;

CABLES.UI.notify = notify;
CABLES.UI.notifyError = notifyError;
CABLES.DragNDrop = DragNDrop;

CABLES.CMD = CMD;


CABLES.uniqueArray = uniqueArray;
CABLES.UI.uiProfiler = new CABLES.UI.UiProfiler();

CABLES.UI.logFilter = new LogFilter();

CABLES.GL_MARKER = helperMeshes;

CABLES.UI.paramsHelper = paramsHelper;
CABLES.UI.valueChanger = valueChanger;

CABLES.UI.undo = undo;

CABLES.UI.MODAL = oldModalWrap;


setHtmlDefaultListeners();
extendCore();
extendCoreAnim();

CABLES.UI.startUi = startUi;

// added during webpack build
CABLES.UI.build = window.BUILD_INFO;
