CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.MetaOpParams = function (tabs)
{
    console.log("create metaop params!!!", tabs);
    this._tabs = tabs;
    this._tab = new CABLES.UI.Tab("op", { "icon": "cables", "infotext": "tab_doc", "showTitle": false, "hideToolbar": true, "padding": true });

    this._op = null;
    this.html = "";

    this._tab.addEventListener("onActivate", () =>
    {
        this.show();
    });

    this.updateVisibility();
};

CABLES.UI.MetaOpParams.prototype.updateVisibility = function (b)
{
    if (!window.gui) return;

    if (this._tabs.getActiveTab() != this._tab) this._prevTab = this._tabs.getActiveTab();
    console.log(this._prevTab);
    this._tabs.closeTab(this._tab.id);

    if (this._prevTab) this._tabs.activateTab(this._prevTab.id);
    // if (this._tabs.previousActiveTab) this.activateTab(this.previousActiveTab.id);


    if (b === undefined)b = !gui.showTwoMetaPanels();

    if (b === false)
    {
        this._prevTab = this._tabs.getActiveTab();
        this._tabs.addTab(this._tab);
        this._tabs.activateTab(this._tab.id);
    }
};

CABLES.UI.MetaOpParams.prototype.init = function ()
{
};

CABLES.UI.MetaOpParams.prototype.show = function ()
{
    this._tab.html("<div id=\"options_meta\"></div>");
    if (window.gui)gui.opParams.refresh();
};
