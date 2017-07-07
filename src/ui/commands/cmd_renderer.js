var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.RENDERER={};

CABLES.CMD.RENDERER.screenshot=function()
{
	gui.saveScreenshot();
};

CABLES.CMD.RENDERER.fullscreen=function()
{
	gui.cycleRendererSize();
};


CABLES.CMD.commands.push(
	{
		cmd:"save screenshot",
		category:"renderer",
		func:CABLES.CMD.RENDERER.screenshot,
		icon:'image'
	},
	{
		cmd:"toggle fullscreen",
		category:"renderer",
		func:CABLES.CMD.RENDERER.fullscreen,
		icon:'monitor'
	}

);
