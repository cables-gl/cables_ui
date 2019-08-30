var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.LOCALSTORAGE_KEY = "cables.usersettings";

CABLES.UI.UserSettings = function ()
{
    CABLES.EventTarget.apply(this);

    this._wasLoaded = false;
    this._serverDelay = null;
    this._settings = {}; // JSON.parse(localStorage.getItem(CABLES.UI.LOCALSTORAGE_KEY))||{};
    this._lsSettings = JSON.parse(localStorage.getItem(CABLES.UI.LOCALSTORAGE_KEY)) || {};
    this.init();
};

CABLES.UI.UserSettings.prototype.init = function ()
{
    if (this.get("snapToGrid") === null) this.set("snapToGrid", true);
    if (this.get("bgpreview") === null) this.set("bgpreview", true);
    if (this.get("showTipps") === null) this.set("showTipps", true);

    this.updateNavBar();
};

CABLES.UI.UserSettings.prototype.load = function (settings)
{
    this._wasLoaded = true;

    for (var i in settings)
    {
        this.set(i, settings[i]);
        // console.log('set ',i,settings[i]);
    }
    this.updateNavBar();
};

CABLES.UI.UserSettings.prototype.setLS = function (key, value)
{
    this._lsSettings[key] = value || false;
    localStorage.setItem(CABLES.UI.LOCALSTORAGE_KEY, JSON.stringify(this._lsSettings));
};

CABLES.UI.UserSettings.prototype.getLS = function (key)
{
    if (!this._lsSettings || !this._lsSettings.hasOwnProperty(key)) return null;
    return this._lsSettings[key];
};

CABLES.UI.UserSettings.prototype.set = function (key, value)
{
    if (value === "true") value = true;
    else if (value === "false") value = false;

    if (CABLES.UTILS.isNumeric(value)) value = parseFloat(value);

    this._settings[key] = value || false;
    // localStorage.setItem(CABLES.UI.LOCALSTORAGE_KEY, JSON.stringify(this._settings));
    this.updateNavBar();

    if (this._wasLoaded)
    {
        clearTimeout(this._serverDelay);
        // this._serverDelay = setTimeout(() =>
        // {
        CABLESUILOADER.talkerAPI.send("saveUserSettings", { settings: this._settings });
        // }, 1000);

        this.emitEvent("onChange", key, value);
    }
};

CABLES.UI.UserSettings.prototype.get = function (key)
{
    if (!this._settings || !this._settings.hasOwnProperty(key)) return null;
    return this._settings[key];
};

CABLES.UI.UserSettings.prototype.getAll = function ()
{
    return this._settings;
};

CABLES.UI.UserSettings.prototype.updateNavBar = function ()
{
    if (this.get("snapToGrid")) $(".nav_usersettings_snaptogrid i").removeClass("unchecked");
    else $(".nav_usersettings_snaptogrid i").addClass("unchecked");

    if (this.get("touchpadmode")) $(".nav_usersettings_touchpadmode i").removeClass("unchecked");
    else $(".nav_usersettings_touchpadmode i").addClass("unchecked");

    if (this.get("theme-bright")) $(".nav_usersettings_theme-bright i").removeClass("unchecked");
    else $(".nav_usersettings_theme-bright i").addClass("unchecked");

    if (this.get("straightLines")) $(".nav_usersettings_straightLines i").removeClass("unchecked");
    else $(".nav_usersettings_straightLines i").addClass("unchecked");

    if (this.get("bgpreview")) $(".nav_usersettings_bgpreview i").removeClass("unchecked");
    else $(".nav_usersettings_bgpreview i").addClass("unchecked");

    if (this.get("helperMode")) $(".nav_usersettings_helpermode i").removeClass("unchecked");
    else $(".nav_usersettings_helpermode i").addClass("unchecked");

    if (this.get("introCompleted")) $(".nav_usersettings_introcompleted i").removeClass("unchecked");
    else $(".nav_usersettings_introcompleted i").addClass("unchecked");

    if (this.get("showMinimap"))
    {
        $(".nav_usersettings_showMinimap i").removeClass("unchecked");
    }
    else
    {
        $(".nav_usersettings_showMinimap i").addClass("unchecked");
    }

    this.straightLines = this.get("straightLines");
    this.snapToGrid = this.get("snapToGrid");
};

CABLES.UI.userSettings = new CABLES.UI.UserSettings();
