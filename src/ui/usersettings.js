var CABLES=CABLES||{};
CABLES.UI=CABLES.UI ||{};

CABLES.UI.LOCALSTORAGE_KEY="cables.usersettings";

CABLES.UI.UserSettings=function()
{
    this._settings=JSON.parse(localStorage.getItem(CABLES.UI.LOCALSTORAGE_KEY))||{};
    this.init();
};

CABLES.UI.UserSettings.prototype.init = function ()
{
    if (this.get("bgpreview") === null) this.set("bgpreview", true);
    if (this.get("showTipps") === null) this.set("showTipps", true);

    this.updateNavBar();
}

CABLES.UI.UserSettings.prototype.set = function (key, value) {
    this._settings[key] = value||false;
    localStorage.setItem(CABLES.UI.LOCALSTORAGE_KEY, JSON.stringify(this._settings));
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

    if (this.get('touchpadmode')) $('.nav_usersettings_touchpadmode i').removeClass('unchecked');
        else $('.nav_usersettings_touchpadmode i').addClass('unchecked');

    if (this.get('theme-bright')) $('.nav_usersettings_theme-bright i').removeClass('unchecked');
        else $('.nav_usersettings_theme-bright i').addClass('unchecked');

    if (this.get('straightLines')) $('.nav_usersettings_straightLines i').removeClass('unchecked');
        else $('.nav_usersettings_straightLines i').addClass('unchecked');
    
    if (this.get('bgpreview')) $('.nav_usersettings_bgpreview i').removeClass('unchecked');
        else $('.nav_usersettings_bgpreview i').addClass('unchecked');

    if (this.get('showMinimap'))
    {
        $('.nav_usersettings_showMinimap i').removeClass('unchecked');
    }
    else
    {
        $('.nav_usersettings_showMinimap i').addClass('unchecked');
    }

    this.straightLines = this.get("straightLines");
    this.snapToGrid = this.get("snapToGrid");
}

CABLES.UI.userSettings=new CABLES.UI.UserSettings();

