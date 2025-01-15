import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";

/**
 *simple tab to just show html
 *
 * @export
 * @class HtmlTab
 * @extends {Events}
 */
export default class HtmlTab extends Events
{
    constructor(tabs, html, title, options = {})
    {
        super();
        this._tabs = tabs || gui.mainTabs;

        this._tab = new Tab(title, { "icon": options.icon || "list", "infotext": "tab_logging", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);
        gui.maintabPanel.show(true);

        this._tab.html(html);
    }
}
