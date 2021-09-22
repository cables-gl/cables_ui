
import ContextMenu from "./contextmenu";
import Bookmarks from "./components/bookmarks";
import GlUiCanvas from "./glpatch/gluicanvas";
import GlPatch from "./glpatch/glpatch";
import CanvasLens from "./components/canvaslens";
import HtmlInspector from "./components/htmlinspect";
import IconBar from "./elements/iconbar";
import Keypresenter from "./components/keypresenter";
import analyzePatch from "./components/analyze_patch";


CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.contextMenu = new ContextMenu();

// expose global things

CABLES.GLGUI.GlUiCanvas = GlUiCanvas;
CABLES.GLGUI.GlPatch = GlPatch;

CABLES.UI.Bookmarks = Bookmarks;
CABLES.UI.CanvasLens = CanvasLens;
CABLES.UI.HtmlInspector = HtmlInspector;
CABLES.UI.IconBar = IconBar;
CABLES.UI.Keypresenter = Keypresenter;

CABLES.UI.analyzePatch = analyzePatch;

// CONSTANTS

CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;
