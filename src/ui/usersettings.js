
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI ||{};

CABLES.UI.UserSettings=function()
{
    this._settings=JSON.parse(localStorage.getItem("cables.usersettings"))||{};
};

CABLES.UI.UserSettings.prototype.set = function (key, value) {
    this._settings[key] = value;
    localStorage.setItem("cables.usersettings", JSON.stringify(this._settings));
    this.updateNavBar();
};

CABLES.UI.UserSettings.prototype.get = function (key) {
    if (!this._settings || !this._settings.hasOwnProperty(key)) return null;
    return this._settings[key];
};

CABLES.UI.UserSettings.prototype.getAll = function () {
    return this._settings;
};

CABLES.UI.UserSettings.prototype.updateNavBar=function()
{
    if (this.get('snapToGrid')) $('.nav_usersettings_snaptogrid i').removeClass('unchecked');
        else $('.nav_usersettings_snaptogrid i').addClass('unchecked');

    if (this.get('theme-bright')) $('.nav_usersettings_theme-bright i').removeClass('unchecked');
        else $('.nav_usersettings_theme-bright i').addClass('unchecked');

    if (this.get('straightLines')) $('.nav_usersettings_straightLines i').removeClass('unchecked');
        else $('.nav_usersettings_straightLines i').addClass('unchecked');
    
    if (this.get('bgpreview')) $('.nav_usersettings_bgpreview i').removeClass('unchecked');
        else $('.nav_usersettings_bgpreview i').addClass('unchecked');

    if (this.get('showMinimap'))
    {
        $('.nav_usersettings_showMinimap i').removeClass('unchecked');
        if(window.gui)gui.showMiniMap();
    }
    else
    {
        $('.nav_usersettings_showMinimap i').addClass('unchecked');
        if (window.gui)gui.hideMiniMap();
    }

    CABLES.UI.userSettings.straightLines = CABLES.UI.userSettings.get("straightLines");
    CABLES.UI.userSettings.snapToGrid = CABLES.UI.userSettings.get("snapToGrid");
}

CABLES.UI.userSettings=new CABLES.UI.UserSettings();

if(CABLES.UI.userSettings.get("bgpreview")===null) CABLES.UI.userSettings.set("bgpreview",true);

CABLES.UI.userSettings.updateNavBar();
