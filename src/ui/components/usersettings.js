
class UserSettings extends CABLES.EventTarget
{
    constructor()
    {
        super();

        this._settings = {};
        this._LOCALSTORAGE_KEY = "cables.usersettings";
        this._wasLoaded = false;
        this._serverDelay = null;
        this.init();

        this._lsSettings = JSON.parse(localStorage.getItem(this._LOCALSTORAGE_KEY)) || {};
    }

    reset()
    {
        this._settings = {};
        this.init();
        this.save();
    }

    init()
    {
        if (this.get("glflowmode") === null) this.set("glflowmode", 2);
        if (this.get("snapToGrid") === null) this.set("snapToGrid", true);
        if (this.get("bgpreview") === null) this.set("bgpreview", true);
        if (this.get("showTipps") === null) this.set("showTipps", true);
        if (this.get("quickLinkMiddleMouse") === null) this.set("quickLinkMiddleMouse", true);

        if (this.get("toggleHelperCurrent") === null) this.set("toggleHelperCurrent", true);
        if (this.get("toggleHelperCurrentTransforms") === null) this.set("toggleHelperCurrentTransforms", true);
    }

    load(settings)
    {
        for (const i in settings)
        {
            this.set(i, settings[i]);
        }

        if (!this._wasLoaded) this.emitEvent("loaded");
        this._wasLoaded = true;
    }

    setLS(key, value)
    {
        this._lsSettings[key] = value || false;
        localStorage.setItem(CABLES.UI.LOCALSTORAGE_KEY, JSON.stringify(this._lsSettings));
    }

    getLS(key)
    {
        if (!this._lsSettings || !this._lsSettings.hasOwnProperty(key)) return null;
        return this._lsSettings[key];
    }


    save()
    {
        CABLESUILOADER.talkerAPI.send("saveUserSettings", { "settings": this._settings });
    }

    set(key, value)
    {
        // console.log("usersetting", key, value);
        // console.log((new Error()).stack);

        if (value === "true") value = true;
        else if (value === "false") value = false;

        if (CABLES.UTILS.isNumeric(value)) value = parseFloat(value);

        const wasChanged = this._settings[key] != value;

        this._settings[key] = value || false;

        if (this._wasLoaded)
        {
            let delay = 250;
            if (!CABLES.UI.loaded)delay = 2000;
            if (wasChanged)
            {
                clearTimeout(this._serverDelay);
                this._serverDelay = setTimeout(() =>
                {
                    this.save();
                }, delay);
            }
            if (wasChanged) this.emitEvent("onChange", key, value);
        }
    }

    get(key, defaultValue = null)
    {
        if (!this._settings || !this._settings.hasOwnProperty(key)) return defaultValue;
        return this._settings[key];
    }

    getAll()
    {
        return this._settings;
    }
}


const userSettings = new UserSettings();

export default userSettings;
