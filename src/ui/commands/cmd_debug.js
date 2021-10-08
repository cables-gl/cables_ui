
const CABLES_CMD_DEBUG = {};
const CMD_DEBUG_COMMANDS = [];

const debugCommands =
{
    "commands": CMD_DEBUG_COMMANDS,
    "functions": CABLES_CMD_DEBUG
};

export default debugCommands;

CABLES_CMD_DEBUG.showUiDebug = function ()
{
    gui.showUiDebug();
};

CABLES_CMD_DEBUG.globalVarDump = function ()
{
    CABLES.GlobalVarTester.after(window);
};

CABLES_CMD_DEBUG.glguiTab = function ()
{
    const t = new CABLES.GLGUI.GlGuiTab(gui.mainTabs);
};

CABLES_CMD_DEBUG.glguiFull = function ()
{
    new CABLES.GLGUI.GlGuiFull();
};

CABLES_CMD_DEBUG.debugGlUi = function ()
{
    new CABLES.UI.GlDebugTab(gui.mainTabs);
    gui.maintabPanel.show();
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
    // {
    //     "cmd": "glgui patchfield",
    //     "category": "debug",
    //     "func": CABLES_CMD_DEBUG.glguiFull,
    //     "icon": "command"
    // },
    {
        "cmd": "glgui tab",
        "category": "debug",
        "func": CABLES_CMD_DEBUG.glguiTab,
        "icon": "command"
    }
);
