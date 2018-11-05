
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI ||{};

CABLES.UI.UserSettings=function()
{
    var settings=JSON.parse(localStorage.getItem("cables.usersettings"))||{};

    this.set=function(key,value)
    {
        settings[key]=value;
        localStorage.setItem("cables.usersettings",JSON.stringify(settings));
        this.updateNavBar();
    };

    this.get=function(key)
    {
        if(!settings || !settings.hasOwnProperty(key))return null;
        return settings[key];
    };

    this.getAll=function()
    {
        return settings;
    };


};

CABLES.UI.UserSettings.prototype.updateNavBar=function()
{
    if (this.get('snapToGrid')) $('.nav_usersettings_snaptogrid i').removeClass('unchecked');
        else $('.nav_usersettings_snaptogrid i').addClass('unchecked');

    if (this.get('showMinimap'))
    {
        $('.nav_usersettings_showMinimap i').removeClass('unchecked');
        gui.showMiniMap();
    }
    else
    {
        $('.nav_usersettings_showMinimap i').addClass('unchecked');
        gui.hideMiniMap();
    }
        

}

CABLES.UI.userSettings=new CABLES.UI.UserSettings();
CABLES.UI.userSettings.straightLines=CABLES.UI.userSettings.get("straightLines");
CABLES.UI.userSettings.snapToGrid = CABLES.UI.userSettings.get("snapToGrid");

