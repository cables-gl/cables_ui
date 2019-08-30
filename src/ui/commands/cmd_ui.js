var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.UI = {};
CABLES.CMD.commands = CABLES.CMD.commands || [];

CABLES.CMD.UI.settings = function ()
{
    gui.showSettings();
};

// CABLES.CMD.UI.settingsContributors = function() {
//     gui.showSettings();
//     gui.projectSettings().setTab('users');
// };

CABLES.CMD.UI.userSettings = function ()
{
    var settings = new CABLES.UI.UserSettingsDialog();
    settings.show();
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
    if (gui.scene().config.masterVolume > 0.0)
    {
        $("#timelineVolume").removeClass("icon-volume-2");
        $("#timelineVolume").addClass("icon-volume-x");
        gui.scene().setVolume(0.0);
    }
    else
    {
        $("#timelineVolume").addClass("icon-volume-2");
        $("#timelineVolume").removeClass("icon-volume-x");
        gui.scene().setVolume(1.0);
    }
};

CABLES.CMD.UI.toggleEditor = function ()
{
    gui.toggleEditor();
};

CABLES.CMD.UI.hideEditor = function ()
{
    gui.closeEditor();
};

CABLES.CMD.UI.showEditor = function ()
{
    // gui.showEditor();
    console.log("todo: add showeditor for maintabs");
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

CABLES.CMD.UI.toggleBgTexturePreview = function ()
{
    CABLES.UI.userSettings.set("bgpreview", !CABLES.UI.userSettings.get("bgpreview"));
    if (CABLES.UI.userSettings.get("bgpreview"))
    {
        gui.texturePreview().enableBgPreview(true);
    }
    else
    {
        gui.texturePreview().enableBgPreview(false);
    }
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
    gui.find().show(str);
};

CABLES.CMD.UI.toggleMaxRenderer = function ()
{
    gui.cycleRendererSize();
};

CABLES.CMD.UI.showCommandPallet = function ()
{
    gui.cmdPallet.show();
};

CABLES.CMD.UI.centerPatchOps = function ()
{
    gui.patch().centerViewBoxOps();
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

CABLES.CMD.UI.toggleHelper = function ()
{
    CABLES.UI.userSettings.set("helperMode", !CABLES.UI.userSettings.get("helperMode"));
    // CABLES.UI.renderHelper=CABLES.UI.userSettings.get('helperMode');
    console.log("helper", CABLES.UI.userSettings.get("helperMode"));
};

CABLES.CMD.UI.gradientTest = function ()
{
    var ge = new CABLES.GradientEditor();
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

CABLES.CMD.UI.showPreferences = function ()
{
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

CABLES.CMD.commands.push(
    {
        cmd: "show settings",
        category: "ui",
        func: CABLES.CMD.UI.settings,
        icon: "settings",
    },
    // {
    //     cmd: "manage patch contributors",
    //     category: "ui",
    //     func: CABLES.CMD.UI.settingsContributors,
    //     icon: 'settings'
    // },
    {
        cmd: "show files",
        category: "ui",
        func: CABLES.CMD.UI.files,
        icon: "file",
    },
    {
        cmd: "toggle files",
        category: "ui",
        func: CABLES.CMD.UI.toggleFiles,
        icon: "file",
    },
    {
        cmd: "toggle mute",
        category: "ui",
        func: CABLES.CMD.UI.toggleMute,
    },
    {
        cmd: "toggle timeline",
        category: "ui",
        func: CABLES.CMD.UI.toggleTimeline,
    },
    {
        cmd: "hide timeline",
        category: "ui",
        func: CABLES.CMD.UI.hideTimeline,
    },
    {
        cmd: "show timeline",
        category: "ui",
        func: CABLES.CMD.UI.showTimeline,
    },
    {
        cmd: "toggle editor",
        category: "ui",
        func: CABLES.CMD.UI.toggleEditor,
    },
    {
        cmd: "hide editor",
        category: "ui",
        func: CABLES.CMD.UI.hideEditor,
    },
    {
        cmd: "show editor",
        category: "ui",
        func: CABLES.CMD.UI.showEditor,
    },
    {
        cmd: "hide minimap",
        category: "ui",
        func: CABLES.CMD.UI.hideMinimap,
    },
    {
        cmd: "show minimap",
        category: "ui",
        func: CABLES.CMD.UI.showMinimap,
    },
    {
        cmd: "search",
        category: "ui",
        func: CABLES.CMD.UI.showSearch,
        icon: "search",
        hotkey: "CMD + f",
    },
    {
        cmd: "user settings",
        category: "ui",
        func: CABLES.CMD.UI.userSettings,
        icon: "settings",
    },
    {
        cmd: "maximize renderer [CMD+ENTER]",
        category: "ui",
        func: CABLES.CMD.UI.toggleMaxRenderer,
        icon: "maximize",
        hotkey: "CMD + ENTER",
    },
    {
        cmd: "show command pallet",
        category: "ui",
        func: CABLES.CMD.UI.showCommandPallet,
        icon: "search",
        hotkey: "CMD + P",
    },
    {
        cmd: "show changelog",
        category: "cables",
        func: CABLES.CMD.UI.showChangelog,
        icon: "info",
    },
    {
        cmd: "center patch",
        category: "patch",
        func: CABLES.CMD.UI.centerPatchOps,
        hotkey: "c",
    },
    {
        cmd: "start presentation mode",
        category: "ui",
        func: CABLES.CMD.UI.startPresentationMode,
    },
    {
        cmd: "toggle flow visualization",
        category: "ui",
        func: CABLES.CMD.UI.flowVis,
        icon: "cables",
        hotkey: "f",
    },
    {
        cmd: "download patch svg",
        category: "ui",
        func: CABLES.CMD.UI.downloadSVG,
        icon: "cables",
    },
    {
        cmd: "toggle window fullscreen",
        category: "ui",
        func: CABLES.CMD.UI.windowFullscreen,
        icon: "cables",
    },
    {
        cmd: "toggle helper",
        category: "ui",
        func: CABLES.CMD.UI.toggleHelper,
        icon: "command",
    },
    {
        cmd: "gradient test",
        category: "ui",
        func: CABLES.CMD.UI.gradientTest,
        icon: "command",
    },
    {
        cmd: "toggle snap to grid",
        category: "ui",
        func: CABLES.CMD.UI.toggleSnapToGrid,
        icon: "command",
    },
    {
        cmd: "toggle mini map",
        category: "ui",
        func: CABLES.CMD.UI.toggleMinimap,
        icon: "command",
    },
    {
        cmd: "toggle texture preview",
        category: "ui",
        func: CABLES.CMD.UI.toggleBgTexturePreview,
        icon: "monitor",
    },
    {
        cmd: "ui profiler",
        category: "ui",
        func: CABLES.CMD.UI.profileUI,
        icon: "command",
    },
    {
        cmd: "toggle touchpad mode",
        category: "ui",
        func: CABLES.CMD.UI.toggleTouchpadMode,
        icon: "command",
    },
    {
        cmd: "Preferences",
        category: "ui",
        func: CABLES.CMD.UI.showPreferences,
        icon: "command",
    },
);
