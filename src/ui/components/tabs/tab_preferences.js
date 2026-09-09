import { ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { GuiText } from "../../text.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { platform } from "../../platform.js";
import { UserSettings, userSettings } from "../usersettings.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import GlPatch from "../../glpatch/glpatch.js";

/**
 * show user editor preferences, stored in {@link UserSettings}
 *
 * @export
 * @class Preferences
 */
export default class Preferences
{
    static TABSESSION_NAME = "userprefs";

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this._tab = new Tab("Preferences", { "icon": "settings", "infotext": "tab_preferences", "singleton": true });
        tabs.addTab(this._tab, true);

        editorSession.rememberOpenEditor(Preferences.TABSESSION_NAME, "Preferences", { }, true);
        this._tab.on("close", () =>
        {
            editorSession.remove(Preferences.TABSESSION_NAME, "Preferences");
        });
        this.show();
    }

    setInputValue(name, value)
    {
        if (value === null)value = false;
        const elements = document.getElementsByClassName("valinput");
        for (let i = 0; i < elements.length; i++)
        {
            if (elements[i].dataset.setting == name)
            {
                elements[i].value = value;
                // if (elements[i].dataset.value == "" + value || (elements[i].dataset.value == "false" && !value)) elements[i].classList.add("switch-active");
                // else elements[i].classList.remove("switch-active");
            }
        }
    }

    setSwitchValue(name, value)
    {
        if (value === null)value = false;
        const elements = document.getElementsByClassName("prefswitch");

        for (let i = 0; i < elements.length; i++)
        {
            if (elements[i].dataset.setting == name)
            {
                if (elements[i].dataset.value == "" + value || (elements[i].dataset.value == "false" && !value)) elements[i].classList.add("switch-active");
                else elements[i].classList.remove("switch-active");
            }
        }
    }

    updateValues()
    {
        this.setSwitchValue("snapToGrid2", userSettings.get(UserSettings.PREF_SNAPTOGRID));
        this.setSwitchValue(UserSettings.PREF_OPSELECT_AUTOLINKOPS, userSettings.get(UserSettings.PREF_OPSELECT_AUTOLINKOPS));
        this.setSwitchValue("checkOpCollisions", userSettings.get(UserSettings.PREF_CHECK_OP_COLLISIONS));

        this.setSwitchValue("hideCanvasUi", userSettings.get(UserSettings.PREF_HIDE_CANVAS_UI));
        this.setSwitchValue("bgpreview", userSettings.get(UserSettings.PREF_BGPREVIEW));

        this.setSwitchValue("texpreviewTransparent", userSettings.get(UserSettings.PREF_TEXPREVIEW_TRANSPARENT) || false);
        this.setSwitchValue("texpreviewMode", userSettings.get(UserSettings.PREF_TEXPREVIEW_MODE) || "");

        this.setSwitchValue("linetype", userSettings.get(UserSettings.PREF_LINETYPE) || "curved");
        this.setSwitchValue("touchpadmode", userSettings.get(UserSettings.PREF_TOUCHPADMODE));
        this.setSwitchValue("presentationmode", userSettings.get(UserSettings.PREF_PRESENTATIONMODE));
        this.setSwitchValue("nobrowserWarning", userSettings.get(UserSettings.PREF_NO_BROWSER_WARNING));
        this.setSwitchValue("introCompleted", userSettings.get(UserSettings.PREF_INTRO_COMPLETED));
        this.setSwitchValue("randomizePatchName", userSettings.get(UserSettings.PREF_RANDOMIZE_PATCH_NAME, true));
        this.setSwitchValue("showTipps", userSettings.get(UserSettings.PREF_SHOW_TIPPS));
        this.setSwitchValue("showMinimap", userSettings.get(UserSettings.PREF_SHOW_MINIMAP));
        this.setSwitchValue("hideSizeBar", userSettings.get(UserSettings.PREF_HIDE_SIZE_BAR));

        this.setSwitchValue("helperMode", userSettings.get(UserSettings.PREF_HELPERMODE));
        this.setSwitchValue("idlemode", userSettings.get(UserSettings.PREF_IDLEMODE));

        this.setInputValue("wheelmultiplier", userSettings.get(UserSettings.PREF_WHEELMULTIPLIER) || 1);
        this.setInputValue("fontsize_ace", userSettings.get(UserSettings.PREF_FONTSIZE_ACE) || 12);
        this.setSwitchValue("wrapmode_ace", userSettings.get(UserSettings.PREF_WRAPMODE_ACE) || false);

        this.setSwitchValue("quickLinkLongPress", userSettings.get(UserSettings.PREF_QUICKLINK_LONGPRESS));
        this.setSwitchValue("quickLinkMiddleMouse", userSettings.get(UserSettings.PREF_QUICKLINK_MIDDLEMOUSE));

        // this.setSwitchValue("forceWebGl1", userSettings.get(UserSettings.PREF_FORCE_WEBGL1));
        this.setSwitchValue("devinfos", userSettings.get(UserSettings.PREF_DEVINFOS) || false);

        this.setSwitchValue(UserSettings.PREF_GLPATCH_PAN, userSettings.get(UserSettings.PREF_GLPATCH_PAN) || "2");
        this.setSwitchValue(UserSettings.PREF_GLPATCH_SELECT, userSettings.get(UserSettings.PREF_GLPATCH_SELECT) || "1");
        this.setSwitchValue("patch_allowCableDrag", userSettings.get(UserSettings.PREF_PATCH_ALLOW_CABLEDRAG) || false);

        this.setSwitchValue("miniopselect", userSettings.get(UserSettings.PREF_MINIOPSELECT));
        this.setSwitchValue("glpatch_cursor", userSettings.get(UserSettings.PREF_GLPATCH_CURSOR));
        this.setSwitchValue("noFadeOutCables", userSettings.get(UserSettings.PREF_NO_FADEOUT_CABLES));

        this.setSwitchValue("texteditor", userSettings.get(UserSettings.PREF_TEXTEDITOR) || "");

        // this.setSwitchValue("glpatch_showboundings", userSettings.get("glpatch_showboundings") || false);

        this.setSwitchValue("bgpattern", userSettings.get(UserSettings.PREF_BGPATTERN) || "bgPatternDark");
        this.setSwitchValue("fontSizeOff", userSettings.get(UserSettings.PREF_FONT_SIZE_OFF) || 0);

        this.setSwitchValue("formatcode", userSettings.get(UserSettings.PREF_FORMATCODE) || false);
        this.setSwitchValue("notlocalizeNumberformat", userSettings.get(UserSettings.PREF_NOTLOCALIZE_NUMBERFORMAT) || false);

        this.setSwitchValue("openlastproject", userSettings.get(UserSettings.PREF_OPENLASTPROJECT) || false);
        this.setSwitchValue("openfullscreen", userSettings.get(UserSettings.PREF_OPENFULLSCREEN) || false);
        this.setSwitchValue("maximizerenderer", userSettings.get(UserSettings.PREF_MAXIMIZERENDERER) || false);
        this.setSwitchValue("transparentpopout", userSettings.get(UserSettings.PREF_TRANSPARENTPOPOUT) || false);

        this.setInputValue("authorName", userSettings.get(UserSettings.PREF_AUTHOR_NAME) || "");
        this.setSwitchValue("escape_closetabs", userSettings.get(UserSettings.PREF_ESCAPE_CLOSETABS) || false);

        this.setSwitchValue("ace_keymode", userSettings.get(UserSettings.PREF_ACE_KEYMODE) || "");
        this.setSwitchValue(GlPatch.USERPREF_GLPATCH_CABLE_WIDTH, userSettings.get(GlPatch.USERPREF_GLPATCH_CABLE_WIDTH) || 3);

        if (platform.frontendOptions.selectableDownloadPath)
        {
            const currentValue = userSettings.get(UserSettings.PREF_DOWNLOAD_PATH) || "";
            this.setInputValue("downloadPath", currentValue);
            const pathSelectEle = ele.byId("usersetting_downloadPath");
            if (pathSelectEle)
            {
                const valueEle = pathSelectEle.querySelector(".value");
                if (valueEle) valueEle.innerText = currentValue;
                pathSelectEle.addEventListener("click", () =>
                {
                    platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_SELECT_DIR, { "dir": currentValue }, (err, dirName) =>
                    {
                        if (!err)
                        {
                            userSettings.set(UserSettings.PREF_DOWNLOAD_PATH, dirName);
                        }
                    });
                });
            }
        }

        this.setSwitchValue("patch_wheelmode", userSettings.get(UserSettings.PREF_PATCH_WHEELMODE) || "zoom");
        this.setInputValue("patch_panspeed", userSettings.get(UserSettings.PREF_PATCH_PANSPEED) || 0.25);
        this.setInputValue("keybind_escape", userSettings.get(UserSettings.PREF_KEYBIND_ESCAPE) || "escape");
    }

    show()
    {
        const html = getHandleBarHtml("tab_preferences", { "user": gui.user, "texts": GuiText.preferences });
        this._tab.html(html);
        this.updateValues();

        let elements = document.getElementsByClassName("prefswitch");
        for (let i = 0; i < elements.length; i++)
        {
            elements[i].addEventListener("click", (e) =>
            {
                let v = e.target.dataset.value;

                if (v === "true") v = true;
                if (v === "false") v = false;

                userSettings.set(e.target.dataset.setting, v);
            });
        }

        elements = document.getElementsByClassName("valinput");
        for (let i = 0; i < elements.length; i++)
        {
            elements[i].addEventListener("input", (e) =>
            {
                let v = e.target.value;
                if (e.target.classList.contains("numberinput")) v = parseFloat(v);
                if (v == v) userSettings.set(e.target.dataset.setting, v);
            });
        }

        ele.byId("resetPrefs").addEventListener("click", () =>
        {
            userSettings.reset();
        });

        userSettings.on(UserSettings.EVENT_CHANGE, () =>
        {
            this.updateValues();
        });
    }
}
editorSession.addListener(Preferences.TABSESSION_NAME, (id, data) =>
{
    new Preferences(gui.mainTabs);
});
