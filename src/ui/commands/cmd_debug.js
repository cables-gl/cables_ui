import GlDebugTab from "../components/tabs/tab_debugglui.js";
import MetaHistory from "../components/tabs/tab_history.js";
import LoggingTab from "../components/tabs/tab_logfilter.js";
import OpDocsJson from "../components/tabs/tab_opdocsjson.js";
import OpSerialized from "../components/tabs/tab_opserialized.js";
import OpWatchUiAttribs from "../components/tabs/tab_uiattribs.js";
import GlGuiFull from "../glpatch/gluifull.js";
import GlGuiTab from "../glpatch/gluitab.js";
import Gui from "../gui.js";
import CMD from "./commands.js";

const CABLES_CMD_DEBUG = {};
const CMD_DEBUG_COMMANDS = [];

const debugCommands =
{
    "commands": CMD_DEBUG_COMMANDS,
    "functions": CABLES_CMD_DEBUG
};

export default debugCommands;

CABLES_CMD_DEBUG.testCommands = function ()
{
    for (let i = 0; i < CMD.commands.length; i++)
    {
        if (CMD.commands[i].cmd.indexOf("Test all") == -1 &&
            CMD.commands[i].cmd != "Upload file" &&
            CMD.commands[i].cmd != "Reload patch" &&
            CMD.commands[i].cmd != "Open patch website" &&
            CMD.commands[i].cmd != "Toggle window fullscreen")
        {
            console.log("CMD: " + CMD.commands[i].cmd);
            if (!CMD.commands[i].func)console.error("cmd has no function");
            else CMD.commands[i].func();
        }
    }
};

CABLES_CMD_DEBUG.testBlueprint2 = function ()
{
    const p = gui.corePatch();

    const sub = gui.patchView.getCurrentSubPatch();

    let ops = p.getSubPatchOps(sub, true);
    console.log(ops);
    const serOps = [];

    for (let i = 0; i < ops.length; i++)
    {
        serOps.push(ops[i].getSerialized());
    }

    console.log(JSON.stringify(serOps));
};

CABLES_CMD_DEBUG.globalVarDump = function ()
{
    CABLESUILOADER.GlobalVarTester.after(window);
};

CABLES_CMD_DEBUG.glguiTab = function ()
{
    const t = new GlGuiTab(gui.mainTabs);
};

CABLES_CMD_DEBUG.toggleMultiplayer = function ()
{
    CABLESUILOADER.talkerAPI.send(
        "toggleMultiplayerSession",
        { "projectId": this._patchId },
        (err, res) =>
        {
            // window reloaded from outside
        },
    );
    /*
    if (!gui.getSavedState())
    {
        console.log("SHOW MODAL");
    }
    else
    {
        CABLESUILOADER.talkerAPI.send(
            "toggleMultiplayerSession",
            { "projectId": this._patchId },
            (err, res) =>
            {
                // window reloaded from outside
            },
        );
    }
     */
};


CABLES_CMD_DEBUG.glguiFull = function ()
{
    new GlGuiFull();
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

    console.log(ops);

    for (const i in ops)
    {
        console.log(ops[i].name);
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

                if (p.type == CABLES.OP_PORT_TYPE_ARRAY)
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
                if (p.type == CABLES.OP_PORT_TYPE_VALUE)
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
                if (p.type == CABLES.OP_PORT_TYPE_STRING)
                {
                    const tests = [
                        () => { p.set("hello"); },
                        () => { p.set(""); },
                        () => { p.set(null); },
                        () => { p.set(undefined); }
                    ];
                    tests[Math.floor(tests.length * Math.random())]();
                }
                if (p.type == CABLES.OP_PORT_TYPE_OBJECT)
                {
                    const tests = [
                        () => { p.set(null); },
                        () => { p.set(undefined); },
                        () => { p.set({ "a": () => { console.log(1); } }); },
                        () => { p.set({ "a": 1234 }); },
                        () => { p.set({ "b": null }); }
                    ];
                    tests[Math.floor(tests.length * Math.random())]();
                }
                if (p.type == CABLES.OP_PORT_TYPE_FUNCTION)
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

    console.log("op test finished!");
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
    CABLES.CMD.PATCH.save();
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
        "func": CABLES_CMD_DEBUG.glguiTab,
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


);
