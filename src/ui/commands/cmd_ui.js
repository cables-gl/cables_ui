import GpuProfiler from "../components/tabs/tab_gpuprofiler.js";
import Preferences from "../components/tabs/tab_preferences.js";
import ChangelogToast from "../dialogs/changelog.js";
import WatchVarTab from "../components/tabs/tab_watchvars.js";
import JobsTab from "../components/tabs/tab_jobs.js";
import HtmlTab from "../components/tabs/tab_html.js";
import WelcomeTab from "../components/tabs/tab_welcome.js";
import CanvasLens from "../components/canvas/canvaslens.js";
import Keypresenter from "../components/keypresenter.js";
import Tips from "../dialogs/tips.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { userSettings } from "../components/usersettings.js";

const CABLES_CMD_UI = {};
const CMD_UI_COMMANDS = [];

const uiCommands =
{
    "commands": CMD_UI_COMMANDS,
    "functions": CABLES_CMD_UI
};

export default uiCommands;

CABLES_CMD_UI.settings = function ()
{
    if (gui.showGuestWarning()) return;
    gui.showSettings();
};

CABLES_CMD_UI.showTips = function ()
{
    this.tips = new Tips();
    this.tips.show();
};

CABLES_CMD_UI.canvasLens = function ()
{
    new CanvasLens();
};


CABLES_CMD_UI.activityFeed = function ()
{
    const url = platform.getCablesUrl() + "/myactivityfeed";
    gui.mainTabs.addIframeTab("Activity Feed", url + "?iframe=true", { "icon": "activity", "closable": true, "singleton": true, "gotoUrl": url }, true);
};

CABLES_CMD_UI.closeAllTabs = function ()
{
    gui.mainTabs.closeAllTabs();
};

CABLES_CMD_UI.openRemoteViewer = function ()
{
    let projectId = gui.patchId;
    if (gui.project())
    {
        projectId = gui.project().shortId || gui.project()._id;
    }
    if (gui.socket) gui.socket.startRemoteViewer(() =>
    {
        window.open(platform.getCablesUrl() + "/remote_client/" + projectId);
    });
};

CABLES_CMD_UI.files = function ()
{
    gui.showFileManager(null, true);
};

CABLES_CMD_UI.toggleFiles = function ()
{
    gui.showFileManager(null, true);
};


CABLES_CMD_UI.windowFullscreen = function ()
{
    if (document.documentElement.mozRequestFullScreen) document.documentElement.mozRequestFullScreen();
    if (document.documentElement.webkitRequestFullScreen) document.documentElement.webkitRequestFullScreen();
};

CABLES_CMD_UI.toggleMute = function ()
{
    if (gui.corePatch().config.masterVolume > 0.0)
    {
        document.getElementById("timelineVolume").classList.remove("icon-volume-2");
        document.getElementById("timelineVolume").classList.add("icon-volume-x");
        gui.corePatch().setVolume(0.0);
    }
    else
    {
        document.getElementById("timelineVolume").classList.add("icon-volume-2");
        document.getElementById("timelineVolume").classList.remove("icon-volume-x");
        gui.corePatch().setVolume(1.0);
    }
};

CABLES_CMD_UI.showChat = function ()
{
    if (gui.socket) gui.socket.showChat();
};


CABLES_CMD_UI.toggleBgTexturePreview = function ()
{
    userSettings.set("bgpreview", !userSettings.get("bgpreview"));
};

CABLES_CMD_UI.hideMinimap = function ()
{
    userSettings.set("showMinimap", false);
    gui.hideMiniMap();
};


CABLES_CMD_UI.toggleMinimap = function ()
{
    userSettings.set("showMinimap", !userSettings.get("showMinimap"));
    if (userSettings.get("showMinimap")) CABLES.CMD.PATCH.reload();
    else CABLES_CMD_UI.hideMinimap();
};

CABLES_CMD_UI.showSearch = function (str)
{
    gui.find(str || "");
};

CABLES_CMD_UI.toggleMaxRenderer = function ()
{
    gui.cycleFullscreen();
};


CABLES_CMD_UI.togglePatchBgPatchField = function ()
{
    if (gui && (gui.canvasManager.mode === gui.canvasManager.CANVASMODE_PATCHBG))
    {
        gui.patchView.toggleVisibility();
    }
};

CABLES_CMD_UI.togglePatchBgRenderer = function ()
{
    gui.cyclePatchBg();
};

CABLES_CMD_UI.showKeys = function ()
{
    gui.keys.show();
};

CABLES_CMD_UI.showCommandPallet = function ()
{
    gui.cmdPallet.show();
};

CABLES_CMD_UI.centerPatchOps = function ()
{
    gui.patchView.centerView();
};

CABLES_CMD_UI.flowVis = function ()
{
    userSettings.set("glflowmode", !userSettings.get("glflowmode"));
};

CABLES_CMD_UI.startPresentationMode = function ()
{
    if (!CABLES.UI.keyPresenter)
    {
        CABLES.UI.keyPresenter = new Keypresenter();
        CABLES.UI.keyPresenter.start();
    }
};

CABLES_CMD_UI.showChangelog = function (since)
{
    (new ChangelogToast()).show(since);
};


CABLES_CMD_UI.showBuildInfo = function ()
{
    let infoHtml = "no info available";
    if (CABLESUILOADER.buildInfo)
    {
        infoHtml = "";
        const uiBuild = CABLESUILOADER.buildInfo.ui;
        const coreBuild = CABLESUILOADER.buildInfo.core;
        const apiBuild = CABLESUILOADER.buildInfo.api;

        if (coreBuild)
        {
            infoHtml += "<h3>Core</h3>";
            infoHtml += "created: " + moment(coreBuild.created).fromNow() + " (" + coreBuild.created + ")<br/>";
            if (coreBuild.git)
            {
                infoHtml += "branch: " + coreBuild.git.branch + "<br/>";
                infoHtml += "message: " + coreBuild.git.message + "<br/>";
            }
        }

        if (uiBuild)
        {
            infoHtml += "<h3>UI</h3>";
            infoHtml += "created: " + moment(uiBuild.created).fromNow() + " (" + uiBuild.created + ")<br/>";
            if (uiBuild.git)
            {
                infoHtml += "branch: " + uiBuild.git.branch + "<br/>";
                infoHtml += "message: " + uiBuild.git.message + "<br/>";
            }
        }

        if (apiBuild)
        {
            infoHtml += "<h3>Platform</h3>";
            infoHtml += "created: " + moment(apiBuild.created).fromNow() + " (" + apiBuild.created + ")<br/>";
            if (apiBuild.git)
            {
                infoHtml += "branch: " + apiBuild.git.branch + "<br/>";
                infoHtml += "message: " + apiBuild.git.message + "<br/>";
                if (apiBuild.version) infoHtml += "version: " + apiBuild.version + "<br/>";
                if (apiBuild.git.tag) infoHtml += "tag: " + apiBuild.git.tag + "<br/>";
            }
            if (apiBuild.platform)
            {
                if (apiBuild.platform.node) infoHtml += "node: " + apiBuild.platform.node + "<br/>";
                if (apiBuild.platform.npm) infoHtml += "npm: " + apiBuild.platform.npm + "<br/>";
            }
        }
    }

    new HtmlTab(gui.mainTabs, infoHtml);
};


CABLES_CMD_UI.welcomeTab = function (userInteraction)
{
    CABLESUILOADER.talkerAPI.send("getRecentPatches", {}, (err, r) =>
    {
        const t = new WelcomeTab(gui.mainTabs, { "patches": r });
        gui.mainTabs.activateTab(t.id);
        gui.maintabPanel.show(userInteraction);
    });
};

CABLES_CMD_UI.toggleOverlays = function ()
{
    const act = !userSettings.get("overlaysShow");
    userSettings.set("overlaysShow", act);
    gui.emitEvent("overlaysChanged", act);
    gui.transformOverlay.updateVisibility();
    gui.canvasManager.getCanvasUiBar().updateIconState();
};

CABLES_CMD_UI.toggleSnapToGrid = function ()
{
    userSettings.set("snapToGrid", !userSettings.get("snapToGrid2"));
};

CABLES_CMD_UI.toggleIntroCompleted = function ()
{
    userSettings.set("introCompleted", !userSettings.get("introCompleted"));

    if (!userSettings.get("introCompleted")) gui.introduction.showIntroduction();
};

CABLES_CMD_UI.showAutomaton = function ()
{
    new CABLES.UI.AutomatonTab(gui.mainTabs);
};

CABLES_CMD_UI.showPreferences = function ()
{
    if (gui.showGuestWarning()) return;
    new Preferences(gui.mainTabs);
    gui.maintabPanel.show(true);
};


CABLES_CMD_UI.profileGPU = function ()
{
    new GpuProfiler(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_UI.profileUI = function ()
{
    gui.uiProfiler.show();
};

CABLES_CMD_UI.zoomOut = function ()
{
    gui.patchView.zoomStep(1);
};
CABLES_CMD_UI.zoomIn = function ()
{
    gui.patchView.zoomStep(-1);
};

CABLES_CMD_UI.watchVars = function ()
{
    new WatchVarTab(gui.mainTabs);
};

CABLES_CMD_UI.jobs = function ()
{
    new JobsTab(gui.mainTabs);
    gui.maintabPanel.show(true);
};


CABLES_CMD_UI.togglePauseVizLayer = function ()
{
    userSettings.set("vizlayerpaused", !userSettings.get("vizlayerpaused"));
};


CMD_UI_COMMANDS.push(
    {
        "cmd": "Show settings",
        "category": "ui",
        "func": CABLES_CMD_UI.settings,
        "icon": "settings",
        "infotext": "cmd_patchsettings"
    },
    {
        "cmd": "Show files",
        "category": "ui",
        "func": CABLES_CMD_UI.files,
        "icon": "file"
    },
    {
        "cmd": "Toggle files",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleFiles,
        "icon": "file"
    },
    {
        "cmd": "Toggle mute",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleMute
    },
    {
        "cmd": "Search",
        "category": "ui",
        "func": CABLES_CMD_UI.showSearch,
        "icon": "search",
        "hotkey": "CMD + f"
    },
    {
        "cmd": "Maximize renderer",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleMaxRenderer,
        "icon": "canvas_max",
        "hotkey": "CMD + ENTER"
    },
    {
        "cmd": "Patch background renderer",
        "category": "ui",
        "func": CABLES_CMD_UI.togglePatchBgRenderer,
        "icon": "canvas_patchbg",
        "hotkey": "CMD + SHIFT + ENTER"
    },
    {
        "cmd": "Patch background renderer",
        "category": "ui",
        "func": CABLES_CMD_UI.togglePatchBgPatchField,
        "icon": "canvas_op",
        "hotkey": "SHIFT + ENTER"
    },
    {
        "cmd": "Show command pallet",
        "category": "ui",
        "func": CABLES_CMD_UI.showCommandPallet,
        "icon": "search",
        "hotkey": "CMD + P"
    },
    {
        "cmd": "Show changelog",
        "category": "cables",
        "func": CABLES_CMD_UI.showChangelog,
        "icon": "info"
    },
    {
        "cmd": "Show buildinfo",
        "category": "cables",
        "func": CABLES_CMD_UI.showBuildInfo,
        "icon": "info"
    },
    {
        "cmd": "Center patch",
        "category": "patch",
        "func": CABLES_CMD_UI.centerPatchOps,
        "hotkey": "c",
        "icon": "patch_center",
        "infotext": "cmd_centerpatch"
    },
    {
        "cmd": "Start presentation mode",
        "category": "ui",
        "func": CABLES_CMD_UI.startPresentationMode
    },
    {
        "cmd": "Toggle flow visualization",
        "category": "ui",
        "func": CABLES_CMD_UI.flowVis,
        "icon": "cables",
        "hotkey": "f"
    },
    {
        "cmd": "Jobs",
        "category": "ui",
        "func": CABLES_CMD_UI.jobs,
        "icon": "cables"
    },
    {
        "cmd": "Toggle window fullscreen",
        "category": "ui",
        "func": CABLES_CMD_UI.windowFullscreen,
        "icon": "cables"
    },

    {
        "cmd": "Toggle snap to grid",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleSnapToGrid,
        "icon": "command"
    },
    {
        "cmd": "Toggle texture preview",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleBgTexturePreview,
        "icon": "monitor"
    },
    {
        "cmd": "Ui profiler",
        "category": "ui",
        "func": CABLES_CMD_UI.profileUI,
        "icon": "command"
    },
    {
        "cmd": "Preferences",
        "category": "ui",
        "func": CABLES_CMD_UI.showPreferences,
        "icon": "cables_editor"
    },
    {
        "cmd": "Chat",
        "category": "ui",
        "func": CABLES_CMD_UI.showChat,
        "icon": "command",
        "frontendOption": "hasCommunity"
    },
    {
        "cmd": "Open remote viewer",
        "category": "ui",
        "func": CABLES_CMD_UI.openRemoteViewer,
        "icon": "command",
        "frontendOption": "showRemoteViewer"
    },
    {
        "cmd": "Zoom in",
        "category": "ui",
        "func": CABLES_CMD_UI.zoomIn,
        "icon": "plus",
        "hotkey": "+",
        "infotext": "cmd_zoomin"
    },
    {
        "cmd": "Zoom out",
        "category": "ui",
        "func": CABLES_CMD_UI.zoomOut,
        "icon": "minus",
        "hotkey": "-",
        "infotext": "cmd_zoomout"
    },
    {
        "cmd": "Watch variables",
        "category": "ui",
        "func": CABLES_CMD_UI.watchVars,
        "icon": "align-justify",
        "infotext": "cmd_watchvars"
    },
    {
        "cmd": "GPU Profiler",
        "category": "ui",
        "func": CABLES_CMD_UI.profileGPU,
        "icon": "align-justify",
        "infotext": ""
    },
    {
        "cmd": "Toggle Vizlayer Pause",
        "category": "ui",
        "func": CABLES_CMD_UI.togglePauseVizLayer,
        "infotext": ""
    },
    {
        "cmd": "Show Activity Feed",
        "category": "ui",
        "func": CABLES_CMD_UI.activityFeed,
        "icon": "activity",
        "frontendOption": "hasCommunity"
    },
    {
        "cmd": "Show Welcome",
        "category": "ui",
        "func": CABLES_CMD_UI.welcomeTab,
        "icon": "cables"
    },
    {
        "cmd": "Close all tabs",
        "category": "ui",
        "func": CABLES_CMD_UI.closeAllTabs
    },
    {
        "cmd": "Show Canvas Lens",
        "category": "ui",
        "func": CABLES_CMD_UI.canvasLens
    },
    {
        "cmd": "Show Tips",
        "category": "ui",
        "func": CABLES_CMD_UI.showTips
    }



);
