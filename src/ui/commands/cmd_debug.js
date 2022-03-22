import GlDebugTab from "../components/tabs/tab_debugglui";
import LoggingTab from "../components/tabs/tab_logging";
import Gui from "../gui";

const CABLES_CMD_DEBUG = {};
const CMD_DEBUG_COMMANDS = [];


const debugCommands =
{
    "commands": CMD_DEBUG_COMMANDS,
    "functions": CABLES_CMD_DEBUG
};

export default debugCommands;

CABLES_CMD_DEBUG.globalVarDump = function ()
{
    CABLES.GlobalVarTester.after(window);
};

CABLES_CMD_DEBUG.glguiTab = function ()
{
    const t = new CABLES.GLGUI.GlGuiTab(gui.mainTabs);
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
    new CABLES.GLGUI.GlGuiFull();
};

CABLES_CMD_DEBUG.debugGlUi = function ()
{
    new GlDebugTab(gui.mainTabs);
    gui.maintabPanel.show(true);
};


CABLES_CMD_DEBUG.logging = function ()
{
    new LoggingTab(gui.mainTabs);
    gui.maintabPanel.show(true);
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

function load(opname)
{
    gui.serverOps.loadOpLibs(opname, function ()
    {
        gui.corePatch().addOp(opname);
    });
}

CMD_DEBUG_COMMANDS.push(
    {
        "cmd": "glui debug",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.debugGlUi,
        "icon": "command"
    },
    {
        "cmd": "test all ops",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.testAllOps,
        "icon": "command"
    },
    {
        "cmd": "dump global vars",
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
        "cmd": "glgui tab",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.glguiTab,
        "icon": "command"
    },
    {
        "cmd": "toggle multiplayer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.toggleMultiplayer,
        "icon": "command"
    },
    {
        "cmd": "restriction remoteviewer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictRemoteView,
        "icon": "command"
    },
    {
        "cmd": "restriction follow",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictFollow,
        "icon": "command"
    },
    {
        "cmd": "restriction explorer",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictExplorer,
        "icon": "command"
    },
    {
        "cmd": "restriction full",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.restrictFull,
        "icon": "command"
    }

);
