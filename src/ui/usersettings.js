CABLES = CABLES || {};
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

    if (this.get("toggleHelperCurrent") === null) this.set("toggleHelperCurrent", true);
    if (this.get("toggleHelperCurrentTransforms") === null) this.set("toggleHelperCurrentTransforms", true);
};

CABLES.UI.UserSettings.prototype.load = function (settings)
{
    this._wasLoaded = true;

    for (const i in settings)
    {
        this.set(i, settings[i]);
    }
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

    const wasChanged = this._settings[key] != value;

    this._settings[key] = value || false;

    if (this._wasLoaded)
    {
        if (wasChanged)
        {
            clearTimeout(this._serverDelay);
            this._serverDelay = setTimeout(() =>
            {
                CABLESUILOADER.talkerAPI.send("saveUserSettings", { "settings": this._settings });
            }, 250);
        }
        if (wasChanged) this.emitEvent("onChange", key, value);
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

CABLES.UI.userSettings = new CABLES.UI.UserSettings();
