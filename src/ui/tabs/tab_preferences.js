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
    this._tab = new CABLES.UI.Tab("Preferences", { icon: "settings", infotext: "tab_preferences", padding: true });
    tabs.addTab(this._tab, true);
    this.show();
};

CABLES.UI.Preferences.prototype.setSwitchValue = function (name, value)
{
    console.log("setSwitchValue",name,value);
    if(value===null)value=false;
    var elements = document.getElementsByClassName("prefswitch");
    for (var i = 0; i < elements.length; i++)
    {
        if (elements[i].dataset.setting == name)
        {
            if (elements[i].dataset.value == "" + value) elements[i].classList.add("switch-active");
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
        
    

};

CABLES.UI.Preferences.prototype.show = function ()
{
    var html = CABLES.UI.getHandleBarHtml("tab_preferences", {});
    this._tab.html(html);
    this.updateValues();

    var elements = document.getElementsByClassName("prefswitch");
    for (var i = 0; i < elements.length; i++)
    {
        elements[i].addEventListener("click", (e) =>
        {
            var v=e.target.dataset.value;
            if(v==="true")v=true;
            if(v==="false")v=false;

            CABLES.UI.userSettings.set(e.target.dataset.setting,v);
        });
    }


    CABLES.UI.userSettings.addEventListener("onChange", () =>
    {
        console.log("settings changed!!!");
        this.updateValues();
    });
};
