import { Events, TalkerAPI } from "cables-shared-client";
import { utils } from "cables";
import { platform } from "../platform.js";

/**
 * storing/loading user settings/ sending to the user and in localstorage etc.
 *
 * @class UserSettings
 * @extends {Events}
 */
export class UserSettings extends Events
{

    static PREF_GLPATCH_PAN = "patch_button_scroll";
    static PREF_GLPATCH_SELECT = "patch_button_select";
    static PREF_OPSELECT_AUTOLINKOPS = "autoLinkOps";
    static PREF_SNAPTOGRID = "snapToGrid2";
    static PREF_SNAPTOGRID_LEGACY = "snapToGrid";

    static PREF_BGPREVIEW = "bgpreview";
    static PREF_GLFLOWMODE = "glflowmode";
    static PREF_OVERLAYS_SHOW = "overlaysShow";
    static PREF_INTRO_COMPLETED = "introCompleted";
    static PREF_VIZLAYER_PAUSED = "vizlayerpaused";
    static PREF_FONT_SIZE_OFF = "fontSizeOff";
    static PREF_OPEN_LOG_TAB = "openLogTab";
    static PREF_FORCE_WEBGL1 = "forceWebGl1";
    static PREF_CHANGELOG_LAST_VIEW = "changelogLastView";
    static PREF_NO_BROWSER_WARNING = "nobrowserWarning";
    static PREF_SHOW_ALL_SHADER_ERRORS = "showAllShaderErrors";
    static PREF_HIDE_SIZE_BAR = "hideSizeBar";
    static PREF_RANDOMIZE_PATCH_NAME = "randomizePatchName";
    static PREF_ESCAPE_CLOSETABS = "escape_closetabs";
    static PREF_SHOW_UI_PERF = "showUIPerf";
    static PREF_PRESENTATIONMODE = "presentationmode";
    static PREF_SHOW_TIPPS = "showTipps";
    static PREF_BGPATTERN = "bgpattern";
    static PREF_OPEN_EDITORS = "openEditors";
    static PREF_EDITORTAB = "editortab";
    static PREF_PATCH_WHEELMODE = "patch_wheelmode";
    static PREF_WHEELMULTIPLIER = "wheelmultiplier";
    static PREF_QUICKLINK_LONGPRESS = "quickLinkLongPress";
    static PREF_QUICKLINK_MIDDLEMOUSE = "quickLinkMiddleMouse";
    static PREF_GLPATCH_CURSOR = "glpatch_cursor";
    static PREF_MAINTABS_VISIBLE = "maintabsVisible";
    static PREF_CHECK_OP_COLLISIONS = "checkOpCollisions";
    static PREF_DEVINFOS = "devinfos";
    static PREF_HIDE_CANVAS_UI = "hideCanvasUi";
    static PREF_PATCH_ALLOW_CABLEDRAG = "patch_allowCableDrag";
    static PREF_LINETYPE = "linetype";
    static PREF_FILEMANAGER_ORDER = "filemanager_order";
    static PREF_FILEMANAGER_DISPLAY = "filemanager_display";
    static PREF_MINIFIED_OP_HEAD = "minifiedOpHead";
    static PREF_FADEOUT_OPTIONS = "fadeOutOptions";
    static PREF_STRAIGHT_LINES = "straightLines";
    static PREF_MINIOPSELECT = "miniopselect";
    static PREF_LOGGING_FILTER = "loggingFilter";
    static PREF_TEXTEDITOR = "texteditor";
    static PREF_IDLEMODE = "idlemode";
    static PREF_TEXPREVIEW_MODE = "texpreviewMode";
    static PREF_TEXPREVIEW_TRANSPARENT = "texpreviewTransparent";
    static PREF_TEXPREVIEW_SIZE = "texpreviewSize";
    static PREF_BGPREVIEW_MAX = "bgpreviewMax";
    static PREF_UIPERF_LAST_HIGHLIGHT = "uiPerfLastHighlight";
    static PREF_SHOW_UIPERF_FILTER = "showUIPerfFilter";
    static PREF_GLTIMELINE_OPENED = "glTimelineOpened";
    static PREF_SIDEBAR_LEFT = "sidebar_left";
    static PREF_SHOW_MINIMAP = "showMinimap";
    static PREF_TOUCHPADMODE = "touchpadmode";
    static PREF_HELPERMODE = "helperMode";
    static PREF_FONTSIZE_ACE = "fontsize_ace";
    static PREF_WRAPMODE_ACE = "wrapmode_ace";
    static PREF_NO_FADEOUT_CABLES = "noFadeOutCables";
    static PREF_FORMATCODE = "formatcode";
    static PREF_NOTLOCALIZE_NUMBERFORMAT = "notlocalizeNumberformat";
    static PREF_OPENLASTPROJECT = "openlastproject";
    static PREF_OPENFULLSCREEN = "openfullscreen";
    static PREF_MAXIMIZERENDERER = "maximizerenderer";
    static PREF_TRANSPARENTPOPOUT = "transparentpopout";
    static PREF_AUTHOR_NAME = "authorName";
    static PREF_ACE_KEYMODE = "ace_keymode";
    static PREF_DOWNLOAD_PATH = "downloadPath";
    static PREF_PATCH_PANSPEED = "patch_panspeed";
    static PREF_KEYBIND_ESCAPE = "keybind_escape";

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

    /**
     * @param {Object} settings
     */
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

    /**
     * @param {string | number} key
     * @param {boolean} value
     */
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
