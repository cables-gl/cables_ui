import { TalkerAPI } from "cables-shared-client";
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
import { UiProfilerTab } from "../components/tabs/tab_uiprofile.js";
import TabKeybindings from "../components/tabs/tab_keybinds.js";

export { CmdUi };

class CmdUi
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {

        return [{
            "cmd": "Show settings",
            "category": "ui",
            "func": CmdUi.settings,
            "icon": "settings",
            "infotext": "cmd_patchsettings"
        },
        {
            "cmd": "Show files",
            "category": "ui",
            "func": CmdUi.files,
            "icon": "file"
        },
        {
            "cmd": "Toggle files",
            "category": "ui",
            "func": CmdUi.toggleFiles,
            "icon": "file"
        },
        {
            "cmd": "Toggle mute",
            "category": "ui",
            "func": CmdUi.toggleMute
        },
        {
            "cmd": "Search",
            "category": "ui",
            "func": CmdUi.showSearch,
            "icon": "search",
            "hotkey": "CMD + f"
        },
        {
            "cmd": "Patch background renderer",
            "category": "ui",
            "func": CmdUi.togglePatchBgRenderer,
            "icon": "canvas_patchbg",
            "hotkey": "CMD + SHIFT + ENTER"
        },
        {
            "cmd": "Patch background renderer",
            "category": "ui",
            "func": CmdUi.togglePatchBgPatchField,
            "icon": "canvas_op",
            "hotkey": "SHIFT + ENTER"
        },
        {
            "cmd": "Show command pallet",
            "category": "ui",
            "func": CmdUi.showCommandPallet,
            "icon": "search",
            "hotkey": "CMD + P"
        },
        {
            "cmd": "Show changelog",
            "category": "cables",
            "func": CmdUi.showChangelog,
            "icon": "info"
        },
        {
            "cmd": "Show buildinfo",
            "category": "cables",
            "func": CmdUi.showBuildInfo,
            "icon": "info"
        },
        {
            "cmd": "Center patch",
            "category": "patch",
            "func": CmdUi.centerPatchOps,
            "hotkey": "c",
            "icon": "patch_center",
            "infotext": "cmd_centerpatch"
        },
        {
            "cmd": "Start presentation mode",
            "category": "ui",
            "func": CmdUi.startPresentationMode
        },
        {
            "cmd": "Toggle flow visualization",
            "category": "ui",
            "func": CmdUi.flowVis,
            "icon": "cables",
            "hotkey": "f"
        },
        {
            "cmd": "Jobs",
            "category": "ui",
            "func": CmdUi.jobs,
            "icon": "cables"
        },
        {
            "cmd": "Toggle window fullscreen",
            "category": "ui",
            "func": CmdUi.windowFullscreen,
            "icon": "cables"
        },

        {
            "cmd": "Toggle snap to grid",
            "category": "ui",
            "func": CmdUi.toggleSnapToGrid,
            "icon": "command"
        },
        {
            "cmd": "Toggle texture preview",
            "category": "ui",
            "func": CmdUi.toggleBgTexturePreview,
            "icon": "monitor"
        },
        {
            "cmd": "Ui profiler",
            "category": "ui",
            "func": CmdUi.profileUI,
            "icon": "command"
        },
        {
            "cmd": "Preferences",
            "category": "ui",
            "func": CmdUi.showPreferences,
            "icon": "cables_editor"
        },
        {
            "cmd": "Chat",
            "category": "ui",
            "func": CmdUi.showChat,
            "icon": "command",
            "frontendOption": "hasCommunity"
        },
        {
            "cmd": "Open remote viewer",
            "category": "ui",
            "func": CmdUi.openRemoteViewer,
            "icon": "command",
            "frontendOption": "showRemoteViewer"
        },
        {
            "cmd": "Zoom in",
            "category": "ui",
            "func": CmdUi.zoomIn,
            "icon": "plus",
            "hotkey": "+",
            "infotext": "cmd_zoomin"
        },
        {
            "cmd": "Zoom out",
            "category": "ui",
            "func": CmdUi.zoomOut,
            "icon": "minus",
            "hotkey": "-",
            "infotext": "cmd_zoomout"
        },
        {
            "cmd": "Watch variables",
            "category": "ui",
            "func": CmdUi.watchVars,
            "icon": "align-justify",
            "infotext": "cmd_watchvars"
        },
        {
            "cmd": "GPU Profiler",
            "category": "ui",
            "func": CmdUi.profileGPU,
            "icon": "align-justify",
            "infotext": ""
        },
        {
            "cmd": "Toggle Vizlayer Pause",
            "category": "ui",
            "func": CmdUi.togglePauseVizLayer,
            "infotext": ""
        },
        {
            "cmd": "Show Activity Feed",
            "category": "ui",
            "func": CmdUi.activityFeed,
            "icon": "activity",
            "frontendOption": "hasCommunity"
        },
        {
            "cmd": "Show Welcome",
            "category": "ui",
            "func": CmdUi.welcomeTab,
            "icon": "cables"
        },
        {
            "cmd": "Close all tabs",
            "category": "ui",
            "func": CmdUi.closeAllTabs
        },
        {
            "cmd": "Show Canvas Lens",
            "category": "ui",
            "func": CmdUi.canvasLens
        },
        {
            "cmd": "Show Tips",
            "category": "ui",
            "func": CmdUi.showTips
        },
        {
            "cmd": "Keybindings",
            "category": "ui",
            "func": CmdUi.keyBindings
        }];

    }

    static settings()
    {
        if (gui.showGuestWarning()) return;
        gui.showSettings();
    }

    static showPreferences()
    {
        if (gui.showGuestWarning()) return;
        new Preferences(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static showTips()
    {
        this.tips = new Tips();
        this.tips.show();
    }

    static keyBindings()
    {
        const t = new TabKeybindings(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static canvasLens()
    {
        new CanvasLens();
    }

    static activityFeed()
    {
        const url = platform.getCablesUrl() + "/myactivityfeed";
        gui.mainTabs.addIframeTab("Activity Feed", url + "?iframe=true", { "icon": "activity", "closable": true, "singleton": true, "gotoUrl": url }, true);
    }

    static closeAllTabs()
    {
        gui.mainTabs.closeAllTabs();
    }

    static openRemoteViewer()
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
    }

    static files()
    {
        gui.showFileManager(null, true);
    }

    static toggleFiles()
    {
        gui.showFileManager(null, true);
    }

    static windowFullscreen()
    {
        if (document.documentElement.mozRequestFullScreen) document.documentElement.mozRequestFullScreen();
        if (document.documentElement.webkitRequestFullScreen) document.documentElement.webkitRequestFullScreen();
    }

    static toggleMute()
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
    }

    static showChat()
    {
        if (gui.socket) gui.socket.showChat();
    }

    static toggleBgTexturePreview()
    {
        userSettings.set("bgpreview", !userSettings.get("bgpreview"));
    }

    static showSearch(str)
    {
        gui.find(str || "");
    }

    static togglePatchBgPatchField()
    {
        if (gui && (gui.canvasManager.mode === gui.canvasManager.CANVASMODE_PATCHBG))
        {
            gui.patchView.toggleVisibility();
        }
    }

    static togglePatchBgRenderer()
    {
        gui.cyclePatchBg();
    }

    static showKeys()
    {
        gui.keys.show();
    }

    static showCommandPallet()
    {
        gui.cmdPalette.show();
    }

    static centerPatchOps()
    {
        gui.patchView.centerView();
    }

    static flowVis()
    {
        userSettings.set("glflowmode", !userSettings.get("glflowmode"));
    }

    static startPresentationMode()
    {
        if (!CABLES.UI.keyPresenter)
        {
            CABLES.UI.keyPresenter = new Keypresenter();
            CABLES.UI.keyPresenter.start();
        }
    }

    /**
     * @param {number} since
     */
    static showChangelog(since)
    {
        (new ChangelogToast()).show(since);
    }

    static showBuildInfo()
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
    }

    static welcomeTab(userInteraction)
    {
        platform.talkerAPI.send(TalkerAPI.CMD_GET_RECENT_PATCHES, {}, (err, r) =>
        {
            const t = new WelcomeTab(gui.mainTabs, { "patches": r });
            gui.mainTabs.activateTab(t.id);
            gui.maintabPanel.show(userInteraction);
        });
    }

    static toggleOverlays()
    {
        const act = !userSettings.get("overlaysShow");
        userSettings.set("overlaysShow", act);
        gui.emitEvent("overlaysChanged", act);
        gui.transformOverlay.updateVisibility();
        gui.canvasManager.getCanvasUiBar().updateIconState();
    }

    static toggleSnapToGrid()
    {
        userSettings.set("snapToGrid", !userSettings.get("snapToGrid2"));
    }

    static toggleIntroCompleted()
    {
        userSettings.set("introCompleted", !userSettings.get("introCompleted"));

        if (!userSettings.get("introCompleted")) gui.introduction.showIntroduction();
    }

    static showAutomaton()
    {
        new CABLES.UI.AutomatonTab(gui.mainTabs);
    }

    static profileGPU()
    {
        new GpuProfiler(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static profileUI()
    {
    // gui.uiProfiler.show();
        new UiProfilerTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static zoomOut()
    {
        gui.patchView.zoomStep(1);
    }

    static zoomIn()
    {
        gui.patchView.zoomStep(-1);
    }

    static watchVars()
    {
        new WatchVarTab(gui.mainTabs);
    }

    static jobs()
    {
        new JobsTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static togglePauseVizLayer()
    {
        userSettings.set("vizlayerpaused", !userSettings.get("vizlayerpaused"));
    }

}
