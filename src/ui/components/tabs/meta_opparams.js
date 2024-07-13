import Tab from "../../elements/tabpanel/tab.js";

export default class MetaOpParams
{
    constructor(tabs)
    {
        this._tabs = tabs;
        this._tab = new Tab("op", { "icon": "op", "infotext": "tab_op", "showTitle": false, "hideToolbar": true, "padding": false });

        this._tab.addEventListener("onActivate", () =>
        {
            this.show();
        });

        this.updateVisibility();
    }

    updateVisibility(b)
    {
        if (!window.gui) return;

        if (this._tabs.getActiveTab() != this._tab) this._prevTab = this._tabs.getActiveTab();
        this._tabs.closeTab(this._tab.id);

        if (this._prevTab) this._tabs.activateTab(this._prevTab.id);

        if (b === undefined) b = !gui.showTwoMetaPanels();

        if (b === false)
        {
            this._prevTab = this._tabs.getActiveTab();
            this._tabs.addTab(this._tab);
            this._tabs.activateTab(this._tab.id);
        }
    }

    init()
    {
    }

    show()
    {
        this._tab.html("<div id=\"options_meta\"></div>");
        if (window.gui)gui.opParams.refresh();
    }
}
