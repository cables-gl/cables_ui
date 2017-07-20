var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.UI = {};
CABLES.CMD.commands=CABLES.CMD.commands||[];

CABLES.CMD.UI.settings = function () {
  gui.showSettings();
};

CABLES.CMD.UI.settingsContributors = function () {
  gui.showSettings();
  gui.projectSettings().setTab('users');
};


CABLES.CMD.UI.userSettings=function()
{
	var settings=new CABLES.UserSettings();
    settings.show();
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

CABLES.CMD.UI.toggleMaxRenderer=function()
{
	gui.cycleRendererSize();
};

CABLES.CMD.UI.showCommandPallet=function()
{
	gui.cmdPallet.show();
};

CABLES.CMD.UI.showChangelog=function()
{
    CABLES.api.get('changelog',function(obj)
    {
        console.log(obj);
        var html = CABLES.UI.getHandleBarHtml('changelog',obj);
        CABLES.UI.MODAL.show(html,{'title':'Changelog'});
    });

};



CABLES.CMD.commands.push(
	{
		cmd:"show settings",
		category:"ui",
		func:CABLES.CMD.UI.settings,
		icon:'settings'
	},
	{
		cmd:"manage patch contributors",
		category:"ui",
		func:CABLES.CMD.UI.settingsContributors,
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
	},
	{
		cmd:"user settings",
		category:"ui",
		func:CABLES.CMD.UI.userSettings,
		icon:'settings',
	},
	{
		cmd:"maximize renderer",
		category:"ui",
		func:CABLES.CMD.UI.toggleMaxRenderer,
		icon:'monitor',
        hotkey:'CMD + ENTER',
	},
	{
		cmd:"show command pallet",
		category:"ui",
		func:CABLES.CMD.UI.showCommandPallet,
		icon:'search',
        hotkey:'CMD + P',
	},
	{
		cmd:"show changelog",
		category:"cables",
		func:CABLES.CMD.UI.showChangelog,
		icon:'info',
	}




);
