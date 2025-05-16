import { ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import text from "../../text.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { platform } from "../../platform.js";
import { userSettings } from "../usersettings.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";

/**
 * show user editor preferences, stored in {@link UserSettings}
 *
 * @export
 * @class Preferences
 */
export default class tab_PreferencesDebug
{

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this._tab = new Tab("Prefsdebug", { "icon": "settings", "infotext": "tab_prefsdebug", "singleton": true });
        tabs.addTab(this._tab, true);
        this._id = "hljs" + CABLES.uuid();

        userSettings.on("change", () =>
        {
            this.show();
        });
        this.show();
    }

    _sortObject(obj)
    {
        return Object.keys(obj).sort().reduce(function (result, key)
        {
            result[key] = obj[key];
            return result;
        }, {});
    }

    show()
    {

        let html = "<div class=\"tabContentScrollContainer\">";
        html += "<code ><pre id=\"" + this._id + "\"  class=\"hljs language-json\">" + JSON.stringify(this._sortObject(userSettings.getAll()), false, 4) + "</code></pre>";

        html += "</div>";
        this._tab.html(html);

        const el = ele.byId(this._id);
        if (el) hljs.highlightElement(el);

    }
}
