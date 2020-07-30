CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.MainTabPanel = function (tabs)
{
    CABLES.EventTarget.apply(this);
    this._tabs = tabs;
    this._tabs.showTabListButton = true;
    this._visible = false;
    this._ele = document.getElementById("maintabs");
    this._ele.style.display = "none";


    // this._tabs.addTab(new CABLES.UI.Tab("welcome",{"icon":"cables","closable":true}));

    // this._tabs.addEventListener("onTabActivated",function(tab)
    // {
    //     if(!this.isVisible())this.show();
    //     gui.setLayout();
    // }.bind(this));

    this._tabs.addEventListener("onTabAdded", (tab, existedBefore) =>
    {
        const wasVisible = this._visible;
        if (!existedBefore) this.show();
        console.log("existedBefore", existedBefore);

        document.getElementById("editorminimized").classList.add("editorminimized_changed");
        setTimeout(() => { document.getElementById("editorminimized").classList.remove("editorminimized_changed"); }, 200);

        tabs.activateTab("");
        tabs.activateTab(tab.id);

        if (!wasVisible && window.gui) gui.setLayout();
    });

    this._tabs.addEventListener("onTabRemoved", (tab) =>
    {
        if (this._tabs.getNumTabs() == 0)
        {
            this.hide();
            gui.setLayout();
        }
    });
};

CABLES.UI.MainTabPanel.prototype.init = function ()
{
};

CABLES.UI.MainTabPanel.prototype.isVisible = function ()
{
    return this._visible;
};

CABLES.UI.MainTabPanel.prototype.show = function (force)
{
    if (!force && this._tabs.getNumTabs() == 0)
    {
        // if(CABLES.UI.loaded) CABLES.UI.userSettings.set("maintabsVisible",false);
        this.hide(true);
        return;
    }

    this._visible = true;
    this._ele.style.display = "block";
    document.getElementById("editorminimized").style.display = "none";
    if (CABLES.UI.loaded) CABLES.UI.userSettings.set("maintabsVisible", true);
    gui.setLayout();

    this._tabs.updateSize();
};

CABLES.UI.MainTabPanel.prototype.hide = function (donotsave)
{
    this._visible = false;
    document.getElementById("editorminimized").style.display = "block";
    this._ele.style.display = "none";
    if (window.gui)gui.setLayout();
    if (!donotsave && CABLES.UI.loaded) CABLES.UI.userSettings.set("maintabsVisible", false);
};

CABLES.UI.MainTabPanel.prototype.toggle = function ()
{
    if (!CABLES.UI.loaded) return;
    if (this._visible) this.hide();
    else this.show();
};
