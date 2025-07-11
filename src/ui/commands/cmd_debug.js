import { Logger } from "cables-shared-client";
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

const CABLES_CMD_DEBUG = {};

/** @type {import("./commands.js").commandObject[]} */
const CMD_DEBUG_COMMANDS = [];

const log = new Logger("CMD DEBUG");

const debugCommands =
{
    "commands": CMD_DEBUG_COMMANDS,
    "functions": CABLES_CMD_DEBUG
};

export default debugCommands;

CABLES_CMD_DEBUG.showUserPrefs = function ()
{
    const t = new tab_PreferencesDebug(gui.mainTabs);
    gui.maintabPanel.show();

};
CABLES_CMD_DEBUG.testCommands = function ()
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
};

CABLES_CMD_DEBUG.testBlueprint2 = function ()
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
};

CABLES_CMD_DEBUG.globalVarDump = function ()
{
    CABLESUILOADER.GlobalVarTester.after(window);
};

CABLES_CMD_DEBUG.newGlguiTab = function ()
{
    const t = new GlGuiTab(gui.mainTabs);
};

CABLES_CMD_DEBUG.toggleMultiplayer = function ()
{
    platform.talkerAPI.send(
        "toggleMultiplayerSession",
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
};
CABLES_CMD_DEBUG.debugGlUiColors = function ()
{
    userSettings.set(UserSettings.SETTING_GLUI_DEBUG_COLORS, !userSettings.get(UserSettings.SETTING_GLUI_DEBUG_COLORS));

};

CABLES_CMD_DEBUG.debugGlUi = function ()
{
    new GlDebugTab(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_DEBUG.logConsole = function ()
{
    gui.showBottomTabs();
};

CABLES_CMD_DEBUG.logging = function ()
{
    new LoggingTab(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_DEBUG.logSocketCluster = function ()
{
    if (gui.socket) gui.socket.enableVerboseLogging();
};

CABLES_CMD_DEBUG.restrictRemoteView = () =>
{
    gui.setRestriction(Gui.RESTRICT_MODE_REMOTEVIEW);
};
CABLES_CMD_DEBUG.restrictFollow = () =>
{
    gui.setRestriction(Gui.RESTRICT_MODE_FOLLOWER);
};
CABLES_CMD_DEBUG.restrictExplorer = () =>
{
    gui.setRestriction(Gui.RESTRICT_MODE_EXPLORER);
};
CABLES_CMD_DEBUG.restrictFull = () =>
{
    gui.setRestriction(Gui.RESTRICT_MODE_FULL);
};

CABLES_CMD_DEBUG.testAllOps = function ()
{
    const ops = gui.opDocs.getAll();

    log.log(ops);

    for (const i in ops)
    {
        log.log(ops[i].name);
        const opname = ops[i].name;

        load(opname);
    }
};

CABLES_CMD_DEBUG.focusOpAnim = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length > 0) gui.patchView.patchRenderer.focusOpAnim(ops[0].id);
};

CABLES_CMD_DEBUG.testOp = function ()
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
};

function load(opname)
{
    gui.serverOps.loadOpDependencies(opname, function ()
    {
        gui.corePatch().addOp(opname);
    });
}

CABLES_CMD_DEBUG.watchOpSerialized = function ()
{
    new OpSerialized(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_DEBUG.watchOpDocsJson = function ()
{
    new OpDocsJson(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_DEBUG.watchOpUiAttribs = function ()
{
    new OpWatchUiAttribs(gui.mainTabs);
    gui.maintabPanel.show(true);
};

CABLES_CMD_DEBUG.saveWithOutObjnames = () =>
{
    gui.corePatch().storeObjNames = false;
    CmdPatch.save();
};

CABLES_CMD_DEBUG.undoHistory = () =>
{
    new MetaHistory(gui.mainTabs); gui.maintabPanel.show(true);
};

CMD_DEBUG_COMMANDS.push(
    {
        "cmd": "Glui debug",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.debugGlUi,
        "icon": "command"
    },
    {
        "cmd": "Glui debug colors",
        "category": "debug",
        "userSetting": UserSettings.SETTING_GLUI_DEBUG_COLORS,
        "func": CABLES_CMD_DEBUG.debugGlUiColors,
        "icon": "command"
    },
    {
        "cmd": "Test all ops",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.testAllOps,
        "icon": "command"
    },
    {
        "cmd": "Dump global vars",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.globalVarDump,
        "icon": "command"
    },
    {
        "cmd": "Logging",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.logging,
        "icon": "command"
    },
    {
        "cmd": "Log console",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.logConsole,
        "icon": "list"
    },
    {
        "cmd": "Log socketcluster traffic",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.logSocketCluster,
        "icon": "command"
    },
    {
        "cmd": "Glgui tab",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.newGlguiTab,
        "icon": "command"
    },
    {
        "cmd": "Toggle multiplayer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.toggleMultiplayer,
        "icon": "command"
    },
    {
        "cmd": "Restriction remoteviewer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictRemoteView,
        "icon": "command"
    },
    {
        "cmd": "Restriction follow",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictFollow,
        "icon": "command"
    },
    {
        "cmd": "Restriction explorer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictExplorer,
        "icon": "command"
    },
    {
        "cmd": "Restriction full",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictFull,
        "icon": "command"
    },
    {
        "cmd": "Test op",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.testOp,
        "icon": "op"
    },
    {
        "cmd": "Show op docs json",
        "func": CABLES_CMD_DEBUG.watchOpDocsJson,
        "category": "debug",
        "icon": "op"
    },
    {
        "cmd": "Show op serialized",
        "func": CABLES_CMD_DEBUG.watchOpSerialized,
        "category": "debug",
        "icon": "op"
    },
    {
        "cmd": "Show op uiattribs",
        "func": CABLES_CMD_DEBUG.watchOpUiAttribs,
        "category": "debug",
        "icon": "op"
    },
    {
        "cmd": "Save without objnames",
        "func": CABLES_CMD_DEBUG.saveWithOutObjnames,
        "category": "debug",
        "icon": "op"
    },
    {
        "cmd": "Glui focusOpAnim",
        "func": CABLES_CMD_DEBUG.focusOpAnim,
        "category": "debug",
    },
    {
        "cmd": "Undo history",
        "func": CABLES_CMD_DEBUG.undoHistory,
        "category": "debug",
    },
    {
        "cmd": "Test all commands",
        "func": CABLES_CMD_DEBUG.testCommands,
        "category": "debug",
    },
    {
        "cmd": "Show User Preferences Data",
        "func": CABLES_CMD_DEBUG.showUserPrefs,
        "category": "debug",
    },

);
