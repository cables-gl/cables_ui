import { Events, TalkerAPI } from "cables-shared-client";
import { utils } from "cables";
import { platform } from "../platform.js";
import OpSelect from "../dialogs/opselect.js";

/**
 * storing/loading user settings/ sending to the user and in localstorage etc.
 *
 * @class UserSettings
 * @extends {Events}
 */
export default class UserSettings extends Events
{
    static PREF_OPSELECT_AUTOLINKOPS = "autoLinkOps";
    static PREF_SNAPTOGRID = "snapToGrid2";

    static EVENT_CHANGE = "change";
    static EVENT_LOADED = "loaded";
    static SETTING_GLUI_DEBUG_COLORS = "gluidebugcolors";
    #wasLoaded = false;
    #active = true;

    constructor()
    {
        super();

        this._settings = {};
        this._LOCALSTORAGE_KEY = "cables.usersettings";
        this.#wasLoaded = false;
        this._serverDelay = null;
        this.init();

        if (window.gui && window.gui.isRemoteClient) this.#active = false;

        if (this.#active)
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
        if (!this.get("patch_wheelmode")) this.set("patch_wheelmode", "zoom");
        if (this.get("glflowmode") === null) this.set("glflowmode", 2);
        if (this.get(UserSettings.PREF_SNAPTOGRID) === null) this.set(UserSettings.PREF_SNAPTOGRID, false);
        if (this.get("checkOpCollisions") === null) this.set("checkOpCollisions", true);
        if (this.get("bgpreview") === null) this.set("bgpreview", true);
        if (this.get("idlemode") === null) this.set("idlemode", false);
        if (this.get("showTipps") === null) this.set("showTipps", true);
        if (this.get("overlaysShow") === null) this.set("overlaysShow", false);
        if (this.get("quickLinkMiddleMouse") === null) this.set("quickLinkMiddleMouse", true);
        if (this.get(UserSettings.PREF_OPSELECT_AUTOLINKOPS) === null) this.set(UserSettings.PREF_OPSELECT_AUTOLINKOPS, true);
    }

    load(settings)
    {
        if (this.#active)
        {

            for (const i in settings)
            {
                this.set(i, settings[i]);
            }

            if (!this.#wasLoaded) this.emitEvent(UserSettings.EVENT_LOADED);
            this.emitEvent(UserSettings.EVENT_CHANGE);

        }
        else
        {
            this.set("introCompleted", true);
        }

        this.#wasLoaded = true;
    }

    setLS(key, value)
    {
        if (!this.#active) return;
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
        if (!this.#active) return;
        platform.talkerAPI.send(TalkerAPI.CMD_SAVE_USER_SETTINGS, { "settings": this._settings });
    }

    /**
     * @param {String} key
     * @param {any} value
     */
    set(key, value)
    {
        if (value === "true") value = true;
        else if (value === "false") value = false;

        if (typeof value == "string" && utils.isNumeric(value)) value = parseFloat(value);

        const wasChanged = this._settings[key] != value;

        this._settings[key] = value || false;

        if (this.#wasLoaded)
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
            if (wasChanged) this.emitEvent(UserSettings.EVENT_CHANGE, key, value);
        }
    }

    /**
     * @param {String} key
     * @param {any} defaultValue=null
     */
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

/**
 * @type {UserSettings}
 */
const userSettings = new UserSettings();
export { userSettings };
