import { ele } from "cables-shared-client";
import CABLES from "cables";
import { CG, CGL, CGP, WEBAUDIO } from "cables-corelibs";
import { Platform } from "./platform.js";
import CMD from "./commands/commands.js";
import OverlayMeshes from "./components/overlay/overlaymeshes.js";
import Collapsable from "./components/collapsable.js";
import DragNDrop from "./components/filemanager_dragdrop.js";
import setHtmlDefaultListeners from "./components/htmldefaultlisteners.js";
import { userSettings } from "./components/usersettings.js";
import paramsHelper from "./components/opparampanel/params_helper.js";
import FindTab from "./components/tabs/tab_find.js";
import defaultOps from "./defaultops.js";
import GradientEditor from "./dialogs/gradienteditor.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ModalError from "./dialogs/modalerror.js";
import oldModalWrap from "./dialogs/modal_old_wrap.js";
import { contextMenu } from "./elements/contextmenu.js";
import Tab from "./elements/tabpanel/tab.js";
import gluiconfig from "./glpatch/gluiconfig.js";
import { UiOp } from "./core_extend_op.js";
import PlatformCommunity from "./platform_community.js";
import PlatformElectron from "./platform_electron.js";
import startUi from "./startgui.js";
import { logFilter } from "./utils/logfilter.js";
import undo from "./utils/undo.js";
import TabPortObjectInspect from "./components/tabs/tab_portobjectionspect.js";
import { UiPatch } from "./core_extend_patch.js";
import Gizmo from "./elements/canvasoverlays/transformgizmo.js";
import ModalSourceCode from "./dialogs/modalsourcecode.js";
import { showShaderError } from "./dialogs/modalshadererrorgl.js";
import { showShaderErrorCgp } from "./dialogs/modalshadererrorcgp.js";
import { GuiText } from "./text.js";

window.CABLES = CABLES || {};
CABLES.CG = CG;
CABLES.CGL = CGL;
CABLES.CGP = CGP;
CABLES.WEBAUDIO = WEBAUDIO;

CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};
CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;
CABLES.GLGUI.CURSOR_POINTER = 2;

// create "mock" to load dependencies, specific class is set in footer.html
CABLES.PlatformElectron = PlatformElectron;
CABLES.PlatformCommunity = PlatformCommunity;
CABLES.platform = new Platform();

// expose global classes
CABLES.GLUI.glUiConfig = gluiconfig; // todo: could be removed, needs workaround in gltf ops
CABLES.UI.TabPortObjectInspect = TabPortObjectInspect;

window.ele = ele;

CABLES.UI.userSettings = userSettings;

CABLES.GradientEditor = GradientEditor;
CABLES.UI.Tab = Tab; // needs to stay - is used in ops
CABLES.UI.FindTab = FindTab; // move to command ?

CABLES.UI.DEFAULTOPNAMES = defaultOps.defaultOpNames;

CABLES.UI.DEFAULTOPS = defaultOps;
// expose global objects
CABLES.contextMenu = contextMenu; // TODO: delete when old timeline is replaced
CABLES.UI.Collapsable = Collapsable;

CABLES.UI.TEXTS = GuiText;

CABLES.UI.ModalDialog = ModalDialog; // needs to stay - is used in ops
CABLES.UI.ModalError = ModalError;

// expose global functions

CABLES.DragNDrop = DragNDrop;

CABLES.CMD = CMD;

CABLES.UI.logFilter = logFilter;

CABLES.GL_MARKER = OverlayMeshes;
CABLES.UI.OverlayMeshes = OverlayMeshes;

CABLES.UI.paramsHelper = paramsHelper;

CABLES.UI.undo = undo;

CABLES.UI.MODAL = oldModalWrap;
CABLES.UI.Gizmo = Gizmo;
CABLES.UI.ModalSourceCode = ModalSourceCode;
CABLES.UI.showShaderError = showShaderError;
CABLES.UI.showShaderErrorCgp = showShaderErrorCgp;

setHtmlDefaultListeners();

CABLES.Op = UiOp;
CABLES.Patch = UiPatch;

CABLES.UI.startUi = startUi;

// added during webpack build
CABLES.UI.build = window.BUILD_INFO;
