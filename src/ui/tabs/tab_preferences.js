CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// snapToGrid
// touchpadmode
// theme
// straightLines
// bgpreview
// helperMode
// introCompleted
// showMinimap
// straightLines

CABLES.UI.Preferences = function (tabs)
{
    this._tab = new CABLES.UI.Tab("Preferences", { "icon": "settings", "infotext": "tab_preferences", "singleton": true });
    tabs.addTab(this._tab, true);
    this.show();
};

CABLES.UI.Preferences.prototype.setInputValue = function (name, value)
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
};

CABLES.UI.Preferences.prototype.setSwitchValue = function (name, value)
{
    // console.log("setSwitchValue",name,value);
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
};

CABLES.UI.Preferences.prototype.updateValues = function ()
{
    this.setSwitchValue("snapToGrid", CABLES.UI.userSettings.get("snapToGrid"));
    this.setSwitchValue("theme-bright", CABLES.UI.userSettings.get("theme-bright"));
    this.setSwitchValue("bgpreview", CABLES.UI.userSettings.get("bgpreview"));
    this.setSwitchValue("texpreviewSize", CABLES.UI.userSettings.get("texpreviewSize"));
    this.setSwitchValue("straightLines", CABLES.UI.userSettings.get("straightLines"));
    this.setSwitchValue("touchpadmode", CABLES.UI.userSettings.get("touchpadmode"));
    this.setSwitchValue("presentationmode", CABLES.UI.userSettings.get("presentationmode"));
    this.setSwitchValue("nobrowserWarning", CABLES.UI.userSettings.get("nobrowserWarning"));
    this.setSwitchValue("introCompleted", CABLES.UI.userSettings.get("introCompleted"));
    this.setSwitchValue("showTipps", CABLES.UI.userSettings.get("showTipps"));
    this.setSwitchValue("showMinimap", CABLES.UI.userSettings.get("showMinimap"));
    this.setSwitchValue("hideSizeBar", CABLES.UI.userSettings.get("hideSizeBar"));

    this.setSwitchValue("helperMode", CABLES.UI.userSettings.get("helperMode"));
    this.setSwitchValue("noidlemode", CABLES.UI.userSettings.get("noidlemode"));

    this.setInputValue("wheelmultiplier", CABLES.UI.userSettings.get("wheelmultiplier") || 1);

    this.setSwitchValue("forceWebGl1", CABLES.UI.userSettings.get("forceWebGl1"));

    this.setSwitchValue("miniopselect", CABLES.UI.userSettings.get("miniopselect"));
    this.setSwitchValue("glpatchview", CABLES.UI.userSettings.get("glpatchview"));
    this.setSwitchValue("svgpatchviewdisable", CABLES.UI.userSettings.get("svgpatchviewdisable"));
    this.setSwitchValue("showOldOps", CABLES.UI.userSettings.get("showOldOps"));
    this.setSwitchValue("wheelmode", CABLES.UI.userSettings.get("wheelmode") || 0);

    this.setSwitchValue("bgpattern", CABLES.UI.userSettings.get("bgpattern") || "bgPatternDark");
};

CABLES.UI.Preferences.prototype.show = function ()
{
    const html = CABLES.UI.getHandleBarHtml("tab_preferences", { "user": gui.user });
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
            if (v == v)
            {
                console.log(e.target.dataset.setting, v);
                CABLES.UI.userSettings.set(e.target.dataset.setting, v);
            }
        });
    }

    CABLES.UI.userSettings.addEventListener("onChange", () =>
    {
        // console.log("settings changed!!!");
        this.updateValues();
    });
};
