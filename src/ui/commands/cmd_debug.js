import { Logger, TalkerAPI } from "cables-shared-client";
import GlDebugTab from "../components/tabs/tab_debugglui.js";
import MetaHistory from "../components/tabs/tab_history.js";
import LoggingTab from "../components/tabs/tab_logfilter.js";
import OpDocsJson from "../components/tabs/tab_opdocsjson.js";
import OpSerialized from "../components/tabs/tab_opserialized.js";
import OpWatchUiAttribs from "../components/tabs/tab_uiattribs.js";
import GlGuiTab from "../components/tabs/tab_glpatch.js";

import CMD from "./commands.js";
import { portType } from "../core_constants.js";
import { platform } from "../platform.js";
import tab_PreferencesDebug from "../components/tabs/tab_preferencesdebug.js";
import { CmdPatch } from "./cmd_patch.js";
import UserSettings, { userSettings } from "../components/usersettings.js";

import Gui, { gui } from "../gui.js";
import GlTimelineDebugTab from "../components/tabs/tab_debugtimeline.js";
import TabThreeDebug from "../components/tabs/tab_threedebug.js";

export { CmdDebug };

const log = new Logger("CMD DEBUG");

class CmdDebug
{

    static get commands()
    {

        /** @type {import("./commands.js").commandObject[]} */
        return [
            {
                "cmd": "Glui debug",
                "category": "debug",
                "func": CmdDebug.debugGlUi,
                "icon": "command"
            },
            {
                "cmd": "timeline debug",
                "category": "debug",
                "func": CmdDebug.debugTimeline,
                "icon": "command"
            },
            {
                "cmd": "Glui debug colors",
                "category": "debug",
                "userSetting": UserSettings.SETTING_GLUI_DEBUG_COLORS,
                "func": CmdDebug.debugGlUiColors,
                "icon": "command"
            },
            {
                "cmd": "Test all ops",
                "category": "debug",
                "func": CmdDebug.testAllOps,
                "icon": "command"
            },
            {
                "cmd": "Dump global vars",
                "category": "debug",
                "func": CmdDebug.globalVarDump,
                "icon": "command"
            },
            {
                "cmd": "Logging",
                "category": "debug",
                "func": CmdDebug.logging,
                "icon": "command"
            },
            {
                "cmd": "Log console",
                "category": "debug",
                "func": CmdDebug.logConsole,
                "icon": "list"
            },
            {
                "cmd": "Log socketcluster traffic",
                "category": "debug",
                "func": CmdDebug.logSocketCluster,
                "icon": "command"
            },
            {
                "cmd": "Glgui tab",
                "category": "debug",
                "func": CmdDebug.newGlguiTab,
                "icon": "command"
            },
            {
                "cmd": "Toggle multiplayer",
                "category": "debug",
                "func": CmdDebug.toggleMultiplayer,
                "icon": "command"
            },
            {
                "cmd": "Restriction remoteviewer",
                "category": "debug",
                "func": CmdDebug.restrictRemoteView,
                "icon": "command"
            },
            {
                "cmd": "Restriction follow",
                "category": "debug",
                "func": CmdDebug.restrictFollow,
                "icon": "command"
            },
            {
                "cmd": "Restriction explorer",
                "category": "debug",
                "func": CmdDebug.restrictExplorer,
                "icon": "command"
            },
            {
                "cmd": "Restriction full",
                "category": "debug",
                "func": CmdDebug.restrictFull,
                "icon": "command"
            },
            {
                "cmd": "Test op",
                "category": "debug",
                "func": CmdDebug.testOp,
                "icon": "op"
            },
            {
                "cmd": "Show op docs json",
                "func": CmdDebug.watchOpDocsJson,
                "category": "debug",
                "icon": "op"
            },
            {
                "cmd": "Show op serialized",
                "func": CmdDebug.watchOpSerialized,
                "category": "debug",
                "icon": "op"
            },
            {
                "cmd": "Show op uiattribs",
                "func": CmdDebug.watchOpUiAttribs,
                "category": "debug",
                "icon": "op"
            },
            {
                "cmd": "Save without objnames",
                "func": CmdDebug.saveWithOutObjnames,
                "category": "debug",
                "icon": "op"
            },
            {
                "cmd": "Glui focusOpAnim",
                "func": CmdDebug.focusOpAnim,
                "category": "debug",
            },
            {
                "cmd": "Undo history",
                "func": CmdDebug.undoHistory,
                "category": "debug",
            },
            {
                "cmd": "Test all commands",
                "func": CmdDebug.testCommands,
                "category": "debug",
            },
            {
                "cmd": "Show User Preferences Data",
                "func": CmdDebug.showUserPrefs,
                "category": "debug",
            },

            {
                "cmd": "Three Debug",
                "func": CmdDebug.showThreeDebug,
                "category": "debug",
            },

        ];
    }

    static showUserPrefs()
    {
        const t = new tab_PreferencesDebug(gui.mainTabs);
        gui.maintabPanel.show();
    }

    static showThreeDebug()
    {
        const t = new TabThreeDebug(gui.mainTabs);
        gui.maintabPanel.show();
    }

    static testCommands()
    {
        for (let i = 0; i < CMD.commands.length; i++)
        {
            if (CMD.commands[i].cmd.indexOf("Test all") == -1 &&
            CMD.commands[i].cmd != "Upload file" &&
            CMD.commands[i].cmd != "Clear" &&
            CMD.commands[i].cmd != "Reload patch" &&
            CMD.commands[i].cmd != "Open patch website" &&
            CMD.commands[i].cmd != "Toggle window fullscreen")
            {
                log.log("CMD: " + CMD.commands[i].cmd);
                if (!CMD.commands[i].func)log.error("cmd has no function");
                else CMD.commands[i].func();
            }
        }
    }

    static testBlueprint2()
    {
        const p = gui.corePatch();
        const sub = gui.patchView.getCurrentSubPatch();

        let ops = p.getSubPatchOps(sub, true);

        const serOps = [];

        for (let i = 0; i < ops.length; i++)
        {
            serOps.push(ops[i].getSerialized());
        }

        log.log(JSON.stringify(serOps));
    }

    static globalVarDump()
    {
        CABLESUILOADER.GlobalVarTester.after(window);
    }

    static newGlguiTab()
    {
        const t = new GlGuiTab(gui.mainTabs);
    }

    static toggleMultiplayer()
    {
        platform.talkerAPI.send(
            TalkerAPI.CMD_TOGGLE_MULTIPLAYER_SESSION,
            { "projectId": this._patchId },
            (err, res) =>
            {
            // window reloaded from outside
            },
        );

    /*
     *if (!gui.getSavedState())
     *{
     *    log.log("SHOW MODAL");
     *}
     *else
     *{
     *    platform.talkerAPI.send(
     *        "toggleMultiplayerSession",
     *        { "projectId": this._patchId },
     *        (err, res) =>
     *        {
     *            // window reloaded from outside
     *        },
     *    );
     *}
     */
    }

    static debugGlUiColors()
    {
        userSettings.set(UserSettings.SETTING_GLUI_DEBUG_COLORS, !userSettings.get(UserSettings.SETTING_GLUI_DEBUG_COLORS));

    }

    static debugGlUi()
    {
        new GlDebugTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static debugTimeline()
    {
        new GlTimelineDebugTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static logConsole()
    {
        gui.showBottomTabs();
    }

    static logging()
    {
        new LoggingTab(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static logSocketCluster()
    {
        if (gui.socket) gui.socket.enableVerboseLogging();
    }

    static restrictRemoteView = () =>
    {
        gui.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
    };

    static restrictFollow = () =>
    {
        gui.setRestriction(Gui.RESTRICT_MODE_FOLLOWER);
    };

    static restrictExplorer = () =>
    {
        gui.setRestriction(Gui.RESTRICT_MODE_EXPLORER);
    };

    static restrictFull = () =>
    {
        gui.setRestriction(Gui.RESTRICT_MODE_FULL);
    };

    static testAllOps()
    {
        function load(opname)
        {
            gui.serverOps.loadOpDependencies(opname, function ()
            {
                gui.corePatch().addOp(opname);
            });
        }

        const ops = gui.opDocs.getAll();

        log.log(ops);

        for (const i in ops)
        {
            log.log(ops[i].name);
            const opname = ops[i].name;

            load(opname);
        }
    }

    static focusOpAnim()
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length > 0) gui.patchView.patchRenderer.focusOpAnim(ops[0].id);
    }

    static testOp()
    {
        const ops = gui.patchView.getSelectedOps();

        for (let i = 0; i < ops.length; i++)
        {
            for (let j = 0; j < 100; j++)
            {
                for (let ip = 0; ip < ops[i].portsIn.length; ip++)
                {
                    const p = ops[i].portsIn[ip];

                    if (p.type == portType.array)
                    {
                        const tests = [
                            () => { p.set([]); },
                            () => { p.set(null); },
                            () => { p.set(undefined); },
                            () => { p.set([0]); },
                            () => { p.set([0, 1]); },
                            () => { p.set([0, 1, 2]); },
                            () => { p.set([-0, -1, -2]); },
                            () => { p.set([0, 1, 2, 3]); },
                            () => { p.set([0, 1, 2, 3, 4]); },
                            () => { p.set([0, 1, null, 3, 4]); },
                            () => { p.set([0, "hallo", 2, 3, 4]); },
                        ];
                        tests[Math.floor(tests.length * Math.random())]();
                    }
                    if (p.type == portType.number)
                    {
                        const tests = [
                            () => { p.set(0); },
                            () => { p.set(1); },
                            () => { p.set(1.2); },
                            () => { p.set(100); },
                            () => { p.set(-100); },
                        ];
                        tests[Math.floor(tests.length * Math.random())]();
                    }
                    if (p.type == portType.string)
                    {
                        const tests = [
                            () => { p.set("hello"); },
                            () => { p.set(""); },
                            () => { p.set(null); },
                            () => { p.set(undefined); }
                        ];
                        tests[Math.floor(tests.length * Math.random())]();
                    }
                    if (p.type == portType.object)
                    {
                        const tests = [
                            () => { p.set(null); },
                            () => { p.set(undefined); },
                            () => { p.set({ "a": () => { log.log(1); } }); },
                            () => { p.set({ "a": 1234 }); },
                            () => { p.set({ "b": null }); }
                        ];
                        tests[Math.floor(tests.length * Math.random())]();
                    }
                    if (p.type == portType.trigger)
                    {
                        const tests = [
                            () => { p.trigger(); },
                            () => { },
                        ];
                        tests[Math.floor(tests.length * Math.random())]();
                    }
                }
            }
        }

        log.log("op test finished!");
    }

    static watchOpSerialized()
    {
        new OpSerialized(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static watchOpDocsJson()
    {
        new OpDocsJson(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static watchOpUiAttribs()
    {
        new OpWatchUiAttribs(gui.mainTabs);
        gui.maintabPanel.show(true);
    }

    static saveWithOutObjnames()
    {
        gui.corePatch().storeObjNames = false;
        CmdPatch.save();
    }

    static undoHistory()
    {
        new MetaHistory(gui.mainTabs); gui.maintabPanel.show(true);
    }
}
