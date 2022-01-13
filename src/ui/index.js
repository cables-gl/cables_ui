import ContextMenu from "./elements/contextmenu";
import GlUiCanvas from "./glpatch/gluicanvas";
import GlPatch from "./glpatch/glpatch";
import CanvasLens from "./components/canvaslens";
import HtmlInspector from "./elements/canvasoverlays/htmlinspect";
import IconBar from "./elements/iconbar";
import Keypresenter from "./components/keypresenter";
import gluiconfig from "./glpatch/gluiconfig";
import OpTreeList from "./components/opselect_treelist";
import UiProfiler from "./components/uiperformance";
import UserSettings from "./components/usersettings";
import Api from "./api/api";
import Exporter from "./dialogs/exporter";
import ele from "./utils/ele";
import GradientEditor from "./dialogs/gradienteditor";
import initSplitPanes from "./elements/splitpane";
import PatchSaveServer from "./api/patchServerApi";
import CMD from "./commands/commands";
import Tab from "./elements/tabpanel/tab";
import FindTab from "./components/tabs/tab_find";
import LoggingTab from "./components/tabs/tab_logging";
import SpreadSheetTab from "./components/tabs/tab_spreadsheet";
import WatchArrayTab from "./components/tabs/tab_watcharray";
import WatchVarTab from "./components/tabs/tab_watchvars";
import FileManager from "./components/filemanager";
import Preferences from "./components/tabs/tab_preferences";
import Profiler from "./components/tabs/tab_profiler";
import GlDebugTab from "./components/tabs/tab_debugglui";
import GpuProfiler from "./components/tabs/tab_gpuprofiler";
import FileUploader from "./dialogs/upload";
import ItemManager from "./components/tabs/tab_item_manager";
import MetaCode from "./components/tabs/meta_code";
import MetaHistory from "./components/tabs/meta_history";
import MetaKeyframes from "./components/tabs/meta_keyframes";
import MetaDoc from "./components/tabs/meta_doc";
import ChangelogToast from "./dialogs/changelog";
import Logger from "./utils/logger";
import Gizmo from "./elements/canvasoverlays/transformgizmo";
import OpDocs from "./components/opdocs";
import ScConnection from "./multiplayer/sc_connection";
import ScUi from "./multiplayer/sc_ui";
import ScUiMultiplayer from "./multiplayer/sc_ui_multiplayer";
import EditorTab from "./components/tabs/tab_editor";
import Chat from "./components/tabs/tab_chat";
import MetaOpParams from "./components/tabs/meta_opparams";
import ServerOps from "./api/opsserver";
import text from "./text.json";
import EditorSession from "./elements/tabpanel/editor_session";
import defaultops from "./defaultops";
import { arrayContains, uniqueArray } from "./utils/helper";
import { getHandleBarHtml, initHandleBarsHelper } from "./utils/handlebars";
import GlPatchAPI from "./glpatch/patchapi";
import setHtmlDefaultListeners from "./components/htmldefaultlisteners";
import PatchView from "./components/patchview";
import { notify, notifyError } from "./elements/notification";
import DragNDrop from "./components/filemananager_dragdrop";
import startIdleListeners from "./components/idlemode";
import { hideInfo, hideToolTip, showInfo, showToolTip, updateHoverToolTip } from "./elements/tooltips";
import NoPatchEditor from "./components/nopatcheditor";
import CoreLibLoader from "./api/corelibloader";
import LibLoader from "./api/libloader";
import LogFilter from "./utils/loggerfilter";
import ModalDialog from "./dialogs/modaldialog";
import WatchPortVisualizer from "./components/opparampanel/watchPortVisualizer";
import SuggestPortDialog from "./components/suggestionportdialog";
import ModalBackground from "./dialogs/modalbg";
import SuggestionDialog from "./components/suggestiondialog";
import SandboxBrowser from "./sandbox_browser";
import CanvasUi from "./components/canvasui";
import valueChanger from "./components/opparampanel/valuechanger";
import GlGuiFull from "./glpatch/gluifull";
import GlGuiTab from "./glpatch/gluitab";
import paramsHelper from "./components/opparampanel/params_helper";
import helperMeshes from "./components/cgl_helpermeshes";
import TexturePreviewer from "./components/texturepreviewer";
import uiconfig from "./uiconfig";
import extendCore from "./op_core_extend";
import ModalPortValue from "./components/opparampanel/show_port_value_modal";
import ModalLoading from "./dialogs/modalloading";
import ModalException from "./dialogs/modalexception";
import startUi from "./startgui";
import extendCoreAnim from "./components/timelinesvg/core_anim_extend";
import TimeLineGui from "./components/timelinesvg/timeline";
import oldModalWrap from "./dialogs/modal_old_wrap";
import { copyArray } from "../../../cables/src/core/utils";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};

CABLES.UI.MOUSE_BUTTON_NONE = 0;
CABLES.UI.MOUSE_BUTTON_LEFT = 1;
CABLES.UI.MOUSE_BUTTON_RIGHT = 2;
CABLES.UI.MOUSE_BUTTON_WHEEL = 4;


CABLES.SandboxBrowser = SandboxBrowser;

CABLES.UI.userSettings = new UserSettings();

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
CABLES.UI.DEFAULTOPS = defaultops;

// expose global objects
CABLES.api = new Api();
CABLES.contextMenu = new ContextMenu();
CABLES.fileUploader = new FileUploader();
CABLES.editorSession = new EditorSession();

CABLES.UI.TIPS = text.tips;
CABLES.UI.TEXTS = text.text;

CABLES.UI.ModalDialog = ModalDialog; // needs to stay - is used in ops
CABLES.UI.ModalLoading = ModalLoading;
CABLES.UI.ModalException = ModalException;

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

CABLES.UI.undo = new UndoManager();

CABLES.UI.MODAL = oldModalWrap;


setHtmlDefaultListeners();
extendCore();
extendCoreAnim();

CABLES.UI.startUi = startUi;
