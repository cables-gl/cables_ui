var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.UI = {};
CABLES.CMD.commands=CABLES.CMD.commands||[];

CABLES.CMD.UI.settings = function () {
  gui.showSettings();
};

CABLES.CMD.UI.files=function()
{
	gui.showLibrary();
};
CABLES.CMD.UI.toggleMute=function()
{
	if(gui.scene().config.masterVolume>0.0){
		$('#timelineVolume').removeClass('fa-volume-up');
		$('#timelineVolume').addClass('fa-volume-off');
		gui.scene().setVolume(0.0);
	} else {
		$('#timelineVolume').addClass('fa-volume-up');
		$('#timelineVolume').removeClass('fa-volume-off');
		gui.scene().setVolume(1.0);
	}
};

CABLES.CMD.UI.toggleTimeline=function()
{
	gui.toggleTiming();
};

CABLES.CMD.UI.hideTimeline=function()
{
	gui.hideTiming();
};


CABLES.CMD.UI.hideMinimap=function()
{
	gui.hideMiniMap();
};

CABLES.CMD.UI.showMinimap=function()
{
	gui.showMiniMap();
};


CABLES.CMD.UI.showSearch=function()
{
	gui.find().show();
};







CABLES.CMD.commands.push(
	{
		cmd:"show settings",
		category:"ui",
		func:CABLES.CMD.UI.settings,
		icon:'settings'
	},
	{
		cmd:"show files",
		category:"ui",
		func:CABLES.CMD.UI.files,
		icon:'file'
	},
	{
		cmd:"toggle mute",
		category:"ui",
		func:CABLES.CMD.UI.toggleMute
	},
	{
		cmd:"toggle timeline",
		category:"ui",
		func:CABLES.CMD.UI.toggleTimeline
	},
	{
		cmd:"hide timeline",
		category:"ui",
		func:CABLES.CMD.UI.hideTimeline
	},
	{
		cmd:"hide minimap",
		category:"ui",
		func:CABLES.CMD.UI.hideMinimap
	},
	{
		cmd:"show minimap",
		category:"ui",
		func:CABLES.CMD.UI.showMinimap
	},
	{
		cmd:"search",
		category:"ui",
		func:CABLES.CMD.UI.showSearch,
		icon:'search',
		hotkey:'CMD + f',
	}



);
