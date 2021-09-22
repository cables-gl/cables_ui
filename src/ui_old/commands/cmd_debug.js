CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.commands = CABLES.CMD.commands || [];

CABLES.CMD.DEBUG = {};

CABLES.CMD.DEBUG.testAllOps = function ()
{
    const tester = new CABLES.UI.OpTester();

    tester.run();
};

CABLES.CMD.DEBUG.showUiDebug = function ()
{
    gui.showUiDebug();
};

CABLES.CMD.DEBUG.globalVarDump = function ()
{
    CABLES.GlobalVarTester.after(window);
};

CABLES.CMD.DEBUG.glguiTab = function ()
{
    const t = new CABLES.GLGUI.GlGuiTab(gui.mainTabs);
};

CABLES.CMD.DEBUG.glguiFull = function ()
{
    new CABLES.GLGUI.GlGuiFull();
};

CABLES.CMD.DEBUG.debugGlUi = function ()
{
    new CABLES.UI.GlDebugTab(gui.mainTabs);
    gui.maintabPanel.show();
};


CABLES.CMD.commands.push(
    {
        "cmd": "glui debug",
        "category": "debug",
        "func": CABLES.CMD.DEBUG.debugGlUi,
        "icon": "command"
    },
    {
        "cmd": "test all ops",
        "category": "debug",
        "func": CABLES.CMD.DEBUG.testAllOps,
        "icon": "command"
    },
    {
        "cmd": "dump global vars",
        "category": "debug",
        "func": CABLES.CMD.DEBUG.globalVarDump,
        "icon": "command"
    },
    {
        "cmd": "glgui patchfield",
        "category": "debug",
        "func": CABLES.CMD.DEBUG.glguiFull,
        "icon": "command"
    },
    {
        "cmd": "glgui tab",
        "category": "debug",
        "func": CABLES.CMD.DEBUG.glguiTab,
        "icon": "command"
    }


);
