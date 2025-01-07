import { ele } from "cables-shared-client";
import Api from "./api/api.js";
import CMD from "./commands/commands.js";
import OverlayMeshes from "./components/overlay/overlaymeshes.js";
import Collapsable from "./components/collapsable.js";
import DragNDrop from "./components/filemanager_dragdrop.js";
import setHtmlDefaultListeners from "./components/htmldefaultlisteners.js";
import UserSettings from "./components/usersettings.js";
import paramsHelper from "./components/opparampanel/params_helper.js";
import ParamTabInputListener from "./components/opparampanel/param_inputtablistener.js";
import valueChanger from "./components/opparampanel/valuechanger.js";
import FindTab from "./components/tabs/tab_find.js";
import extendCoreAnim from "./components/timelinesvg/core_anim_extend.js";
import defaultOps from "./defaultops.js";
import GradientEditor from "./dialogs/gradienteditor.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ModalError from "./dialogs/modalerror.js";
import oldModalWrap from "./dialogs/modal_old_wrap.js";
import FileUploader from "./dialogs/upload.js";
import ContextMenu from "./elements/contextmenu.js";
import EditorSession from "./elements/tabpanel/editor_session.js";
import Tab from "./elements/tabpanel/tab.js";
import gluiconfig from "./glpatch/gluiconfig.js";
import extendCoreOp from "./core_extend_op.js";
import PlatformCommunity from "./platform_community.js";
import PlatformStandalone from "./platform_standalone.js";
import startUi from "./startgui.js";
import text from "./text.js";
import { uniqueArray } from "./utils/helper.js";
import LogFilter from "./utils/logfilter.js";
import undo from "./utils/undo.js";
import TabPortObjectInspect from "./components/tabs/tab_portobjectionspect.js";
import extendCorePatch from "./core_extend_patch.js";
import Gizmo from "./elements/canvasoverlays/transformgizmo.js";
import ModalSourceCode from "./dialogs/modalsourcecode.js";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};
CABLES.UTILS = CABLES.UTILS || {};
CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;
CABLES.GLGUI.CURSOR_POINTER = 2;

// used in footer.html
CABLES.PlatformCommunity = PlatformCommunity;
CABLES.PlatformStandalone = PlatformStandalone;

// expose global classes
CABLES.GLUI.glUiConfig = gluiconfig; // todo: could be removed, needs workaround in gltf ops
CABLES.UI.TabPortObjectInspect = TabPortObjectInspect;

window.ele = ele;

CABLES.UI.userSettings = new UserSettings();

CABLES.GradientEditor = GradientEditor;
CABLES.UI.Tab = Tab; // needs to stay - is used in ops
CABLES.UI.FindTab = FindTab; // move to command ?

CABLES.UI.getOpsForFilename = defaultOps.getOpsForFilename; // can be removed when not used in standalone
CABLES.UI.DEFAULTOPNAMES = defaultOps.defaultOpNames;

CABLES.UI.DEFAULTOPS = defaultOps;
// expose global objects
CABLES.api = new Api();
CABLES.contextMenu = new ContextMenu();
CABLES.fileUploader = new FileUploader();
CABLES.editorSession = new EditorSession();
CABLES.UI.Collapsable = Collapsable;

CABLES.UI.TEXTS = text;

CABLES.UI.ModalDialog = ModalDialog; // needs to stay - is used in ops
CABLES.UI.ModalError = ModalError;

// expose global functions

CABLES.UTILS.uniqueArray =
    CABLES.uniqueArray = uniqueArray;

CABLES.DragNDrop = DragNDrop;

CABLES.CMD = CMD;

CABLES.UI.logFilter = new LogFilter();

CABLES.GL_MARKER = OverlayMeshes;
CABLES.UI.OverlayMeshes = OverlayMeshes;

CABLES.UI.paramsHelper = paramsHelper;
CABLES.UI.valueChanger = valueChanger;
CABLES.UI.ParamTabInputListener = ParamTabInputListener;

CABLES.UI.undo = undo;

CABLES.UI.MODAL = oldModalWrap;
CABLES.UI.Gizmo = Gizmo;
CABLES.UI.ModalSourceCode = ModalSourceCode;


setHtmlDefaultListeners();
extendCoreOp();
extendCorePatch();
extendCoreAnim();

CABLES.UI.startUi = startUi;

// added during webpack build
CABLES.UI.build = window.BUILD_INFO;
