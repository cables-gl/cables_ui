CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.UI = {};
CABLES.CMD.commands = CABLES.CMD.commands || [];

CABLES.CMD.UI.settings = function ()
{
    if (gui.showGuestWarning()) return;
    gui.showSettings();
};

CABLES.CMD.UI.openRemoteViewer = function ()
{
    window.open(CABLES.sandbox.getCablesUrl() + "/remote_client/" + gui.patchId);
};

CABLES.CMD.UI.files = function ()
{
    gui.showFileManager();
};

CABLES.CMD.UI.toggleFiles = function ()
{
    gui.showFileManager();
};

CABLES.CMD.UI.downloadSVG = function ()
{
    gui.patch().downloadSVG();
};

CABLES.CMD.UI.windowFullscreen = function ()
{
    document.documentElement.webkitRequestFullScreen();
};

CABLES.CMD.UI.toggleMute = function ()
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

// CABLES.CMD.UI.toggleEditor = function ()
// {
//     gui.toggleEditor();
// };

// CABLES.CMD.UI.hideEditor = function ()
// {
//     gui.closeEditor();
// };

// CABLES.CMD.UI.showEditor = function ()
// {
//     // gui.showEditor();
//     console.log("todo: add showeditor for maintabs");
// };

CABLES.CMD.UI.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
};


CABLES.CMD.UI.TimelinePause = function ()
{
    gui.corePatch().timer.pause();
};

CABLES.CMD.UI.TimelineRewind = function ()
{
    gui.corePatch().timer.setTime(0);
};

CABLES.CMD.UI.toggleTimeline = function ()
{
    gui.toggleTiming();
};

CABLES.CMD.UI.hideTimeline = function ()
{
    gui.hideTiming();
};

CABLES.CMD.UI.showTimeline = function ()
{
    gui.showTiming();
};

CABLES.CMD.UI.showChat = function ()
{
    gui.chat.show();
};


CABLES.CMD.UI.toggleBgTexturePreview = function ()
{
    CABLES.UI.userSettings.set("bgpreview", !CABLES.UI.userSettings.get("bgpreview"));
};

CABLES.CMD.UI.hideMinimap = function ()
{
    CABLES.UI.userSettings.set("showMinimap", false);
    gui.hideMiniMap();
};

CABLES.CMD.UI.showMinimap = function ()
{
    CABLES.UI.userSettings.set("showMinimap", true);
    gui.showMiniMap();
};
CABLES.CMD.UI.toggleMinimap = function ()
{
    CABLES.UI.userSettings.set("showMinimap", !CABLES.UI.userSettings.get("showMinimap"));
    if (CABLES.UI.userSettings.get("showMinimap")) CABLES.CMD.PATCH.reload();
    else CABLES.CMD.UI.hideMinimap();
};

CABLES.CMD.UI.showSearch = function (str)
{
    // new CABLES.UI.FindTab(gui.mainTabs);
    gui.find(str || "");
};

CABLES.CMD.UI.toggleMaxRenderer = function ()
{
    gui.cycleFullscreen();
};

CABLES.CMD.UI.togglePatchBgRenderer = function ()
{
    gui.cyclePatchBg();
};

CABLES.CMD.UI.showKeys = function ()
{
    gui.keys.show();
};

CABLES.CMD.UI.showCommandPallet = function ()
{
    gui.cmdPallet.show();
};

CABLES.CMD.UI.centerPatchOps = function ()
{
    gui.patchView.centerView();
    // gui.patch().centerViewBoxOps();
};

CABLES.CMD.UI.flowVis = function ()
{
    gui.patch().toggleFlowVis();
};

CABLES.CMD.UI.startPresentationMode = function ()
{
    if (!CABLES.UI.keyPresenter)
    {
        CABLES.UI.keyPresenter = new CABLES.UI.Keypresenter();
        CABLES.UI.keyPresenter.start();
    }
};

CABLES.CMD.UI.showChangelog = function (since)
{
    CABLES.CHANGELOG.show(since);
};

// CABLES.CMD.UI.updateCanvasIcons=function()
// {
//     if(CABLES.UI.showCanvasTransforms) document.getElementById("canvasIconTransforms").classList.add("iconToggleActive");
//     else document.getElementById("canvasIconTransforms").classList.remove("iconToggleActive");

//     if(CABLES.UI.userSettings.get("helperMode")) document.getElementById("canvasIconHelper").classList.add("iconToggleActive");
//     else document.getElementById("canvasIconHelper").classList.remove("iconToggleActive");
// }


CABLES.CMD.UI.toggleHelperCurrentTransform = function ()
{
    const mode = !CABLES.UI.userSettings.get("toggleHelperCurrentTransforms");
    CABLES.UI.userSettings.set("toggleHelperCurrentTransforms", mode);
};

CABLES.CMD.UI.toggleHelperCurrent = function ()
{
    const mode = !CABLES.UI.userSettings.get("helperModeCurrentOp");
    CABLES.UI.userSettings.set("helperModeCurrentOp", mode);
};

CABLES.CMD.UI.toggleHelper = function ()
{
    const mode = !CABLES.UI.userSettings.get("helperMode");
    CABLES.UI.userSettings.set("helperMode", mode);
};


// CABLES.CMD.UI.toggleFloorGrid = function ()
// {
//     const mode=!CABLES.UI.userSettings.get("floorGrid");
//     CABLES.UI.userSettings.set("floorGrid", mode);
//     // CABLES.CMD.UI.updateCanvasIcons();
// };

CABLES.CMD.UI.toggleTransformOverlay = function ()
{
    CABLES.UI.showCanvasTransforms = !CABLES.UI.showCanvasTransforms;
    gui.transformOverlay().setVisible(CABLES.UI.showCanvasTransforms);
    // CABLES.CMD.UI.updateCanvasIcons();
};

CABLES.CMD.UI.gradientTest = function ()
{
    const ge = new CABLES.GradientEditor();
    ge.show();
};

CABLES.CMD.UI.toggleSnapToGrid = function ()
{
    CABLES.UI.userSettings.set("snapToGrid", !CABLES.UI.userSettings.get("snapToGrid"));
};

CABLES.CMD.UI.toggleIntroCompleted = function ()
{
    CABLES.UI.userSettings.set("introCompleted", !CABLES.UI.userSettings.get("introCompleted"));

    if (!CABLES.UI.userSettings.get("introCompleted")) gui.introduction().showIntroduction();
};

CABLES.CMD.UI.showAutomaton = function ()
{
    new CABLES.UI.AutomatonTab(gui.mainTabs);
};

CABLES.CMD.UI.showPreferences = function ()
{
    if (gui.showGuestWarning()) return;
    new CABLES.UI.Preferences(gui.mainTabs);
    gui.maintabPanel.show();
};

CABLES.CMD.UI.toggleTheme = function ()
{
    CABLES.UI.userSettings.set("theme-bright", !CABLES.UI.userSettings.get("theme-bright"));
    gui.updateTheme();
};

CABLES.CMD.UI.profileUI = function ()
{
    console.log("CABLES.CMD.UI.profileUI");
    CABLES.uiperf.show();
};

CABLES.CMD.UI.toggleTouchpadMode = function ()
{
    gui.patch().modeTouchPad = !CABLES.UI.userSettings.get("touchpadmode");
    CABLES.UI.userSettings.set("touchpadmode", gui.patch().modeTouchPad);

    if (gui.patch().modeTouchPad) CABLES.UI.notify("Touchpad Mode enabled");
    else CABLES.UI.notify("Touchpad Mode disabled");
};

CABLES.CMD.UI.zoomOut = function ()
{
    gui.patchView.zoomStep(1);
};
CABLES.CMD.UI.zoomIn = function ()
{
    gui.patchView.zoomStep(-1);
};

CABLES.CMD.UI.watchVars = function ()
{
    new CABLES.UI.WatchVarTab(gui.mainTabs);

    // gui.patchView.zoomStep(-1);
};

CABLES.CMD.commands.push(
    {
        "cmd": "show settings",
        "category": "ui",
        "func": CABLES.CMD.UI.settings,
        "icon": "settings",
        "infotext": "cmd_patchsettings"
    },
    // {
    //     cmd: "manage patch contributors",
    //     category: "ui",
    //     func: CABLES.CMD.UI.settingsContributors,
    //     icon: 'settings'
    // },
    {
        "cmd": "show files",
        "category": "ui",
        "func": CABLES.CMD.UI.files,
        "icon": "file",
    },
    {
        "cmd": "toggle files",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleFiles,
        "icon": "file",
    },
    {
        "cmd": "toggle mute",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleMute,
    },


    {
        "cmd": "timeline play",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelinePlay,
    },
    {
        "cmd": "timeline pause",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelinePause,
    },
    {
        "cmd": "timeline rewind",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelineRewind,
    },


    {
        "cmd": "toggle timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "hide timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.hideTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "show timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.showTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "hide minimap",
        "category": "ui",
        "func": CABLES.CMD.UI.hideMinimap,
    },
    {
        "cmd": "show minimap",
        "category": "ui",
        "func": CABLES.CMD.UI.showMinimap,
    },
    {
        "cmd": "search",
        "category": "ui",
        "func": CABLES.CMD.UI.showSearch,
        "icon": "search",
        "hotkey": "CMD + f",
    },
    {
        "cmd": "maximize renderer [CMD+ENTER]",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleMaxRenderer,
        "icon": "canvas_max",
        "hotkey": "CMD + ENTER",
    },
    {
        "cmd": "patch background renderer [CMD+SHIFT+ENTER]",
        "category": "ui",
        "func": CABLES.CMD.UI.togglePatchBgRenderer,
        "icon": "canvas_patchbg",
        "hotkey": "CMD + ENTER",
    },

    {
        "cmd": "show keyboard shortcutds",
        "category": "ui",
        "func": CABLES.CMD.UI.showKeys,
        "icon": "command"
    },

    {
        "cmd": "show command pallet",
        "category": "ui",
        "func": CABLES.CMD.UI.showCommandPallet,
        "icon": "search",
        "hotkey": "CMD + P",
    },
    {
        "cmd": "show changelog",
        "category": "cables",
        "func": CABLES.CMD.UI.showChangelog,
        "icon": "info",
    },
    {
        "cmd": "center patch",
        "category": "patch",
        "func": CABLES.CMD.UI.centerPatchOps,
        "hotkey": "c",
        "icon": "patch_center",
        "infotext": "cmd_centerpatch"
    },
    {
        "cmd": "start presentation mode",
        "category": "ui",
        "func": CABLES.CMD.UI.startPresentationMode,
    },
    {
        "cmd": "toggle flow visualization",
        "category": "ui",
        "func": CABLES.CMD.UI.flowVis,
        "icon": "cables",
        "hotkey": "f",
    },
    {
        "cmd": "download patch svg",
        "category": "ui",
        "func": CABLES.CMD.UI.downloadSVG,
        "icon": "cables",
    },
    {
        "cmd": "toggle window fullscreen",
        "category": "ui",
        "func": CABLES.CMD.UI.windowFullscreen,
        "icon": "cables",
    },
    {
        "cmd": "toggle helper",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleHelper,
        "icon": "command",
    },
    {
        "cmd": "gradient test",
        "category": "ui",
        "func": CABLES.CMD.UI.gradientTest,
        "icon": "command",
    },
    {
        "cmd": "toggle snap to grid",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleSnapToGrid,
        "icon": "command",
    },
    {
        "cmd": "toggle mini map",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleMinimap,
        "icon": "command",
    },
    {
        "cmd": "toggle texture preview",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleBgTexturePreview,
        "icon": "monitor",
    },
    {
        "cmd": "ui profiler",
        "category": "ui",
        "func": CABLES.CMD.UI.profileUI,
        "icon": "command",
    },
    {
        "cmd": "toggle touchpad mode",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleTouchpadMode,
        "icon": "command",
    },
    {
        "cmd": "Preferences",
        "category": "ui",
        "func": CABLES.CMD.UI.showPreferences,
        "icon": "cables_editor",
    },
    {
        "cmd": "chat",
        "category": "ui",
        "func": CABLES.CMD.UI.showChat,
        "icon": "command",
    },
    {
        "cmd": "open remote viewer",
        "category": "ui",
        "func": CABLES.CMD.UI.openRemoteViewer,
        "icon": "command",
    },

    {
        "cmd": "zoom in",
        "category": "ui",
        "func": CABLES.CMD.UI.zoomIn,
        "icon": "plus",
        "hotkey": "+",
        "infotext": "cmd_zoomin"
    },
    {
        "cmd": "zoom out",
        "category": "ui",
        "func": CABLES.CMD.UI.zoomOut,
        "icon": "minus",
        "hotkey": "-",
        "infotext": "cmd_zoomout"
    },
    {
        "cmd": "watch variables",
        "category": "ui",
        "func": CABLES.CMD.UI.watchVars,
        "icon": "align-justify",
        "infotext": "cmd_watchvars"
    },
    {
        "cmd": "test automaton",
        "category": "ui",
        "func": CABLES.CMD.UI.showAutomaton,
        "icon": "align-justify",
        "infotext": "cmd_watchvars"
    },


);
