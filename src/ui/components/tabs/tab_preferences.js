import { ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import text from "../../text.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

/**
 * show user editor preferences, stored in {@link UserSettings}
 *
 * @export
 * @class Preferences
 */
export default class Preferences
{
    constructor(tabs)
    {
        this._tab = new Tab("Preferences", { "icon": "settings", "infotext": "tab_preferences", "singleton": true });
        tabs.addTab(this._tab, true);

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
        this.setSwitchValue("snapToGrid2", CABLES.UI.userSettings.get("snapToGrid2"));
        this.setSwitchValue("canvasMode", CABLES.UI.userSettings.get("canvasMode"));


        this.setSwitchValue("hideCanvasUi", CABLES.UI.userSettings.get("hideCanvasUi"));
        this.setSwitchValue("bgpreview", CABLES.UI.userSettings.get("bgpreview"));

        this.setSwitchValue("texpreviewTransparent", CABLES.UI.userSettings.get("texpreviewTransparent") || false);
        this.setSwitchValue("texpreviewMode", CABLES.UI.userSettings.get("texpreviewMode") || "");

        this.setSwitchValue("linetype", CABLES.UI.userSettings.get("linetype") || "curved");
        this.setSwitchValue("touchpadmode", CABLES.UI.userSettings.get("touchpadmode"));
        this.setSwitchValue("presentationmode", CABLES.UI.userSettings.get("presentationmode"));
        this.setSwitchValue("nobrowserWarning", CABLES.UI.userSettings.get("nobrowserWarning"));
        this.setSwitchValue("introCompleted", CABLES.UI.userSettings.get("introCompleted"));
        this.setSwitchValue("randomizePatchName", CABLES.UI.userSettings.get("randomizePatchName", true));
        this.setSwitchValue("showTipps", CABLES.UI.userSettings.get("showTipps"));
        this.setSwitchValue("showMinimap", CABLES.UI.userSettings.get("showMinimap"));
        this.setSwitchValue("hideSizeBar", CABLES.UI.userSettings.get("hideSizeBar"));

        this.setSwitchValue("helperMode", CABLES.UI.userSettings.get("helperMode"));
        this.setSwitchValue("idlemode", CABLES.UI.userSettings.get("idlemode"));

        this.setInputValue("wheelmultiplier", CABLES.UI.userSettings.get("wheelmultiplier") || 1);
        this.setInputValue("fontsize_ace", CABLES.UI.userSettings.get("fontsize_ace") || 12);
        this.setSwitchValue("wrapmode_ace", CABLES.UI.userSettings.get("wrapmode_ace") || false);

        this.setSwitchValue("quickLinkLongPress", CABLES.UI.userSettings.get("quickLinkLongPress"));
        this.setSwitchValue("quickLinkMiddleMouse", CABLES.UI.userSettings.get("quickLinkMiddleMouse"));
        this.setSwitchValue("doubleClickAction", CABLES.UI.userSettings.get("doubleClickAction"));


        // this.setSwitchValue("forceWebGl1", CABLES.UI.userSettings.get("forceWebGl1"));
        this.setSwitchValue("devinfos", CABLES.UI.userSettings.get("devinfos") || false);

        this.setSwitchValue("patch_button_scroll", CABLES.UI.userSettings.get("patch_button_scroll") || "2");
        this.setSwitchValue("patch_allowCableDrag", CABLES.UI.userSettings.get("patch_allowCableDrag") || false);

        this.setSwitchValue("miniopselect", CABLES.UI.userSettings.get("miniopselect"));
        this.setSwitchValue("glpatch_cursor", CABLES.UI.userSettings.get("glpatch_cursor"));
        this.setSwitchValue("noFadeOutCables", CABLES.UI.userSettings.get("noFadeOutCables"));

        // this.setSwitchValue("glpatch_showboundings", CABLES.UI.userSettings.get("glpatch_showboundings") || false);


        this.setSwitchValue("bgpattern", CABLES.UI.userSettings.get("bgpattern") || "bgPatternDark");
        this.setSwitchValue("fontSizeOff", CABLES.UI.userSettings.get("fontSizeOff") || 0);

        this.setSwitchValue("formatcode", CABLES.UI.userSettings.get("formatcode") || false);
        this.setSwitchValue("notlocalizeNumberformat", CABLES.UI.userSettings.get("notlocalizeNumberformat") || false);

        this.setSwitchValue("openlastproject", CABLES.UI.userSettings.get("openlastproject") || false);
        this.setInputValue("authorName", CABLES.UI.userSettings.get("authorName") || "");

        if (CABLES.platform.frontendOptions.selectableDownloadPath)
        {
            const currentValue = CABLES.UI.userSettings.get("downloadPath") || "";
            this.setInputValue("downloadPath", currentValue);
            const pathSelectEle = ele.byId("usersetting_downloadPath");
            if (pathSelectEle)
            {
                const valueEle = pathSelectEle.querySelector(".value");
                if (valueEle) valueEle.innerText = currentValue;
                pathSelectEle.addEventListener("click", () =>
                {
                    CABLESUILOADER.talkerAPI.send("selectDir", { "dir": currentValue }, (err, dirName) =>
                    {
                        if (!err)
                        {
                            CABLES.UI.userSettings.set("downloadPath", dirName);
                        }
                    });
                });
            }
        }

        this.setSwitchValue("patch_wheelmode", CABLES.UI.userSettings.get("patch_wheelmode") || "zoom");
        this.setInputValue("patch_panspeed", CABLES.UI.userSettings.get("patch_panspeed") || 0.25);
        this.setInputValue("keybind_escape", CABLES.UI.userSettings.get("keybind_escape") || "escape");
    }

    show()
    {
        const html = getHandleBarHtml("tab_preferences", { "user": gui.user, "texts": text.preferences });
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

                CABLES.UI.userSettings.set(e.target.dataset.setting, v);
            });
        }

        elements = document.getElementsByClassName("valinput");
        for (let i = 0; i < elements.length; i++)
        {
            elements[i].addEventListener("input", (e) =>
            {
                let v = e.target.value;
                if (e.target.classList.contains("numberinput")) v = parseFloat(v);
                if (v == v) CABLES.UI.userSettings.set(e.target.dataset.setting, v);
            });
        }

        ele.byId("resetPrefs").addEventListener("click", () =>
        {
            gui.userSettings.reset();
        });

        gui.userSettings.on("change", () =>
        {
            this.updateValues();
        });
    }
}
