var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.commands=CABLES.CMD.commands||[];

CABLES.CMD.DEBUG = {};

CABLES.CMD.DEBUG.testAllOps=function()
{
	var tester=new CABLES.UI.OpTester();

	tester.run();

};

CABLES.CMD.DEBUG.showUiDebug=function()
{
    gui.showUiDebug();
};

CABLES.CMD.commands.push(
    {
		cmd:"test all ops",
		category:"debug",
		func:CABLES.CMD.DEBUG.testAllOps,
        icon:'command'
	},
    {
		cmd:"cables ui debug",
		category:"debug",
		func:CABLES.CMD.DEBUG.showUiDebug,
        icon:'command'
	}

);
