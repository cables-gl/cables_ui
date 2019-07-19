CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.MainTabPanel=function(tabs)
{
    this._tabs=tabs;
    this._visible=false;
    this._ele=document.getElementById("maintabs");
    this._ele.style.display="none";
    // this._tabs.addTab(new CABLES.UI.Tab("welcome",{"icon":"cables","closable":true}));

    this._tabs.addEventListener("onTabAdded",function(tab)
    {
        var wasVisible=this._visible;
        if(!wasVisible) this.show();
        
        tabs.activateTab(tab.id);
        
        if(!wasVisible && window.gui) gui.setLayout();

    }.bind(this));

    this._tabs.addEventListener("onTabRemoved",function(tab)
    {
        if(this._tabs.getNumTabs()==0)
        {
            this.hide();
            gui.setLayout();
        }
    }.bind(this));
};

CABLES.UI.MainTabPanel.prototype.init=function()
{
    if(CABLES.UI.userSettings.get("maintabsVisible"))
        this.show();
}

CABLES.UI.MainTabPanel.prototype.isVisible=function()
{
    return this._visible;
}

CABLES.UI.MainTabPanel.prototype.show=function()
{
    this._visible=true;
    this._ele.style.display="block";
    CABLES.UI.userSettings.set("maintabsVisible",true);
}

CABLES.UI.MainTabPanel.prototype.hide=function()
{
    this._visible=false;
    this._ele.style.display="none";
    if(window.gui)gui.setLayout();
    CABLES.UI.userSettings.set("maintabsVisible",false);
}

CABLES.UI.MainTabPanel.prototype.toggle=function()
{
    if(this._visible) this.hide();
        else this.show();
}