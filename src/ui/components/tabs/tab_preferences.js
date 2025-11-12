import { ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { GuiText } from "../../text.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { platform } from "../../platform.js";
import { userSettings } from "../usersettings.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

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
        this.setSwitchValue("snapToGrid2", userSettings.get("snapToGrid2"));
        this.setSwitchValue("checkOpCollisions", userSettings.get("checkOpCollisions"));
        this.setSwitchValue("canvasMode", userSettings.get("canvasMode"));

        this.setSwitchValue("hideCanvasUi", userSettings.get("hideCanvasUi"));
        this.setSwitchValue("bgpreview", userSettings.get("bgpreview"));

        this.setSwitchValue("texpreviewTransparent", userSettings.get("texpreviewTransparent") || false);
        this.setSwitchValue("texpreviewMode", userSettings.get("texpreviewMode") || "");

        this.setSwitchValue("linetype", userSettings.get("linetype") || "curved");
        this.setSwitchValue("touchpadmode", userSettings.get("touchpadmode"));
        this.setSwitchValue("presentationmode", userSettings.get("presentationmode"));
        this.setSwitchValue("nobrowserWarning", userSettings.get("nobrowserWarning"));
        this.setSwitchValue("introCompleted", userSettings.get("introCompleted"));
        this.setSwitchValue("randomizePatchName", userSettings.get("randomizePatchName", true));
        this.setSwitchValue("showTipps", userSettings.get("showTipps"));
        this.setSwitchValue("showMinimap", userSettings.get("showMinimap"));
        this.setSwitchValue("hideSizeBar", userSettings.get("hideSizeBar"));

        this.setSwitchValue("helperMode", userSettings.get("helperMode"));
        this.setSwitchValue("idlemode", userSettings.get("idlemode"));

        this.setInputValue("wheelmultiplier", userSettings.get("wheelmultiplier") || 1);
        this.setInputValue("fontsize_ace", userSettings.get("fontsize_ace") || 12);
        this.setSwitchValue("wrapmode_ace", userSettings.get("wrapmode_ace") || false);

        this.setSwitchValue("quickLinkLongPress", userSettings.get("quickLinkLongPress"));
        this.setSwitchValue("quickLinkMiddleMouse", userSettings.get("quickLinkMiddleMouse"));
        this.setSwitchValue("doubleClickAction", userSettings.get("doubleClickAction"));

        // this.setSwitchValue("forceWebGl1", userSettings.get("forceWebGl1"));
        this.setSwitchValue("devinfos", userSettings.get("devinfos") || false);

        this.setSwitchValue("patch_button_scroll", userSettings.get("patch_button_scroll") || "2");
        this.setSwitchValue("patch_allowCableDrag", userSettings.get("patch_allowCableDrag") || false);

        this.setSwitchValue("miniopselect", userSettings.get("miniopselect"));
        this.setSwitchValue("glpatch_cursor", userSettings.get("glpatch_cursor"));
        this.setSwitchValue("noFadeOutCables", userSettings.get("noFadeOutCables"));

        // this.setSwitchValue("glpatch_showboundings", userSettings.get("glpatch_showboundings") || false);

        this.setSwitchValue("bgpattern", userSettings.get("bgpattern") || "bgPatternDark");
        this.setSwitchValue("fontSizeOff", userSettings.get("fontSizeOff") || 0);

        this.setSwitchValue("formatcode", userSettings.get("formatcode") || false);
        this.setSwitchValue("notlocalizeNumberformat", userSettings.get("notlocalizeNumberformat") || false);

        this.setSwitchValue("openlastproject", userSettings.get("openlastproject") || false);
        this.setSwitchValue("openfullscreen", userSettings.get("openfullscreen") || false);
        this.setSwitchValue("maximizerenderer", userSettings.get("maximizerenderer") || false);

        this.setInputValue("authorName", userSettings.get("authorName") || "");
        this.setSwitchValue("escape_closetabs", userSettings.get("escape_closetabs") || false);

        this.setSwitchValue("ace_keymode", userSettings.get("ace_keymode") || "");

        if (platform.frontendOptions.selectableDownloadPath)
        {
            const currentValue = userSettings.get("downloadPath") || "";
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
                            userSettings.set("downloadPath", dirName);
                        }
                    });
                });
            }
        }

        this.setSwitchValue("patch_wheelmode", userSettings.get("patch_wheelmode") || "zoom");
        this.setInputValue("patch_panspeed", userSettings.get("patch_panspeed") || 0.25);
        this.setInputValue("keybind_escape", userSettings.get("keybind_escape") || "escape");
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

        userSettings.on("change", () =>
        {
            this.updateValues();
        });
    }
}
editorSession.addListener(Preferences.TABSESSION_NAME, (id, data) =>
{
    new Preferences(gui.mainTabs);
});
