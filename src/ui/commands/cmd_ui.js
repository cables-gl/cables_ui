import GpuProfiler from "../components/tabs/tab_gpuprofiler";
import Preferences from "../components/tabs/tab_preferences";
import ChangelogToast from "../dialogs/changelog";
import WatchVarTab from "../components/tabs/tab_watchvars";
import userSettings from "../components/usersettings";
import JobsTab from "../components/tabs/tab_jobs";

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

CABLES_CMD_UI.openRemoteViewer = function ()
{
    if (gui.socket) gui.socket.startRemoteViewer(() =>
    {
        window.open(CABLES.sandbox.getCablesUrl() + "/remote_client/" + gui.patchId);
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
    document.documentElement.webkitRequestFullScreen();
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

// CABLES_CMD_UI.toggleEditor = function ()
// {
//     gui.toggleEditor();
// };

// CABLES_CMD_UI.hideEditor = function ()
// {
//     gui.closeEditor();
// };

// CABLES_CMD_UI.showEditor = function ()
// {
//     // gui.showEditor();
// };


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
    // new CABLES.UI.FindTab(gui.mainTabs);
    gui.find(str || "");
};

CABLES_CMD_UI.toggleMaxRenderer = function ()
{
    gui.cycleFullscreen();
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
        CABLES.UI.keyPresenter = new CABLES.UI.Keypresenter();
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
            infoHtml += "<h3>API</h3>";
            infoHtml += "created: " + moment(apiBuild.created).fromNow() + " (" + apiBuild.created + ")<br/>";
            if (apiBuild.git)
            {
                infoHtml += "branch: " + apiBuild.git.branch + "<br/>";
                infoHtml += "message: " + apiBuild.git.message + "<br/>";
            }
        }
    }

    CABLES.UI.MODAL.show(infoHtml, { "title": "build info" });
};


// CABLES_CMD_UI.updateCanvasIcons=()=>
// {
//     if(CABLES.UI.showCanvasTransforms) document.getElementById("canvasIconTransforms").classList.add("iconToggleActive");
//     else document.getElementById("canvasIconTransforms").classList.remove("iconToggleActive");

//     if(userSettings.get("helperMode")) document.getElementById("canvasIconHelper").classList.add("iconToggleActive");
//     else document.getElementById("canvasIconHelper").classList.remove("iconToggleActive");
// }


CABLES_CMD_UI.toggleHelperCurrentTransform = function ()
{
    const mode = !userSettings.get("toggleHelperCurrentTransforms");
    userSettings.set("toggleHelperCurrentTransforms", mode);
};

CABLES_CMD_UI.toggleHelperCurrent = function ()
{
    const mode = !userSettings.get("helperModeCurrentOp");
    userSettings.set("helperModeCurrentOp", mode);
};

CABLES_CMD_UI.toggleHelper = function ()
{
    const mode = !userSettings.get("helperMode");
    userSettings.set("helperMode", mode);
};


// CABLES_CMD_UI.toggleFloorGrid = function ()
// {
//     const mode=!userSettings.get("floorGrid");
//     userSettings.set("floorGrid", mode);
//     // CABLES_CMD_UI.updateCanvasIcons();
// };

CABLES_CMD_UI.toggleTransformOverlay = function ()
{
    CABLES.UI.showCanvasTransforms = !CABLES.UI.showCanvasTransforms;
    gui.transformOverlay().setVisible(CABLES.UI.showCanvasTransforms);
    // CABLES_CMD_UI.updateCanvasIcons();
};

CABLES_CMD_UI.gradientTest = function ()
{
    const ge = new CABLES.GradientEditor();
    ge.show();
};

CABLES_CMD_UI.toggleSnapToGrid = function ()
{
    userSettings.set("snapToGrid", !userSettings.get("snapToGrid"));
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

CABLES_CMD_UI.toggleTheme = function ()
{
    userSettings.set("theme-bright", !userSettings.get("theme-bright"));
    gui.updateTheme();
};

CABLES_CMD_UI.profileGPU = function ()
{
    new GpuProfiler(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_UI.profileUI = function ()
{
    CABLES.UI.uiProfiler.show();
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
        "cmd": "show settings",
        "category": "ui",
        "func": CABLES_CMD_UI.settings,
        "icon": "settings",
        "infotext": "cmd_patchsettings"
    },
    {
        "cmd": "show files",
        "category": "ui",
        "func": CABLES_CMD_UI.files,
        "icon": "file"
    },
    {
        "cmd": "toggle files",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleFiles,
        "icon": "file"
    },
    {
        "cmd": "toggle mute",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleMute
    },


    {
        "cmd": "hide minimap",
        "category": "ui",
        "func": CABLES_CMD_UI.hideMinimap
    },
    {
        "cmd": "search",
        "category": "ui",
        "func": CABLES_CMD_UI.showSearch,
        "icon": "search",
        "hotkey": "CMD + f"
    },
    {
        "cmd": "maximize renderer",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleMaxRenderer,
        "icon": "canvas_max",
        "hotkey": "CMD + ENTER"
    },
    {
        "cmd": "patch background renderer",
        "category": "ui",
        "func": CABLES_CMD_UI.togglePatchBgRenderer,
        "icon": "canvas_patchbg",
        "hotkey": "CMD + ENTER"
    },

    {
        "cmd": "show keyboard shortcutds",
        "category": "ui",
        "func": CABLES_CMD_UI.showKeys,
        "icon": "command"
    },

    {
        "cmd": "show command pallet",
        "category": "ui",
        "func": CABLES_CMD_UI.showCommandPallet,
        "icon": "search",
        "hotkey": "CMD + P"
    },
    {
        "cmd": "show changelog",
        "category": "cables",
        "func": CABLES_CMD_UI.showChangelog,
        "icon": "info"
    },
    {
        "cmd": "show buildinfo",
        "category": "cables",
        "func": CABLES_CMD_UI.showBuildInfo,
        "icon": "info"
    },
    {
        "cmd": "center patch",
        "category": "patch",
        "func": CABLES_CMD_UI.centerPatchOps,
        "hotkey": "c",
        "icon": "patch_center",
        "infotext": "cmd_centerpatch"
    },
    {
        "cmd": "start presentation mode",
        "category": "ui",
        "func": CABLES_CMD_UI.startPresentationMode
    },
    {
        "cmd": "toggle flow visualization",
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

    // {
    //     "cmd": "download patch svg",
    //     "category": "ui",
    //     "func": CABLES_CMD_UI.downloadSVG,
    //     "icon": "cables",
    // },
    {
        "cmd": "toggle window fullscreen",
        "category": "ui",
        "func": CABLES_CMD_UI.windowFullscreen,
        "icon": "cables"
    },
    {
        "cmd": "toggle helper",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleHelper,
        "icon": "command"
    },
    {
        "cmd": "gradient test",
        "category": "ui",
        "func": CABLES_CMD_UI.gradientTest,
        "icon": "command"
    },
    {
        "cmd": "toggle snap to grid",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleSnapToGrid,
        "icon": "command"
    },
    // {
    //     "cmd": "toggle mini map",
    //     "category": "ui",
    //     "func": CABLES_CMD_UI.toggleMinimap,
    //     "icon": "command",
    // },
    {
        "cmd": "toggle texture preview",
        "category": "ui",
        "func": CABLES_CMD_UI.toggleBgTexturePreview,
        "icon": "monitor"
    },
    {
        "cmd": "ui profiler",
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
        "cmd": "chat",
        "category": "ui",
        "func": CABLES_CMD_UI.showChat,
        "icon": "command"
    },
    {
        "cmd": "open remote viewer",
        "category": "ui",
        "func": CABLES_CMD_UI.openRemoteViewer,
        "icon": "command"
    },

    {
        "cmd": "zoom in",
        "category": "ui",
        "func": CABLES_CMD_UI.zoomIn,
        "icon": "plus",
        "hotkey": "+",
        "infotext": "cmd_zoomin"
    },
    {
        "cmd": "zoom out",
        "category": "ui",
        "func": CABLES_CMD_UI.zoomOut,
        "icon": "minus",
        "hotkey": "-",
        "infotext": "cmd_zoomout"
    },
    {
        "cmd": "watch variables",
        "category": "ui",
        "func": CABLES_CMD_UI.watchVars,
        "icon": "align-justify",
        "infotext": "cmd_watchvars"
    },
    // {
    //     "cmd": "test automaton",
    //     "category": "ui",
    //     "func": CABLES_CMD_UI.showAutomaton,
    //     "icon": "align-justify",
    //     "infotext": "cmd_watchvars"
    // },
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
    }

);
