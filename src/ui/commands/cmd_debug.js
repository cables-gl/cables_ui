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

CABLES.CMD.DEBUG.globalVarDump=function()
{
    CABLES.GlobalVarTester.after(window);
};

CABLES.CMD.DEBUG.glgui=function()
{
	// var a=new CABLES.GLGUI.GlUiCanvas(CABLES.patch);
	// a.setSize(640,360);

	var t=new CABLES.GLGUI.GlGuiTab(gui.mainTabs);

};



CABLES.CMD.commands.push(
    {
		cmd:"test all ops",
		category:"debug",
		func:CABLES.CMD.DEBUG.testAllOps,
        icon:'command'
	},
    {
		cmd:"dump global vars",
		category:"debug",
		func:CABLES.CMD.DEBUG.globalVarDump,
        icon:'command'
	},
    {
		cmd:"glgui",
		category:"debug",
		func:CABLES.CMD.DEBUG.glgui,
        icon:'command'
	}


);
