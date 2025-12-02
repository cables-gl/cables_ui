import TabPanel from "./tabpanel.js";
import OpDependencyTab from "../../components/tabs/tab_opdependency.js";
import { platform } from "../../platform.js";
import { gui } from "../../gui.js";

/**
 * a tab panel, that can contain tabs
 *
 * @export
 * @class OpDependencyTabPanel
 * @extends {TabPanel}
 */
export default class OpDependencyTabPanel extends TabPanel
{

    /**
     * Description
     * @param {string} eleId
     * @param {object} options
     */
    constructor(eleId, options)
    {
        super(eleId, { "noUserSetting": true });

        this._options = options;
        this._sources = [
            { "title": "Upload File", "value": "file" },
            { "title": "From URL", "value": "url" },
            { "title": "Op", "value": "op" },
            { "title": "Core-Lib", "value": "corelib" },
        ];
        if (gui && gui.user && gui.user.isStaff)
        {
            this._sources.push({ "title": "Lib", "value": "lib", "icon": "lock" });
        }
        if (platform.getSupportedOpDependencyTypes().includes("npm"))
        {
            this._sources.splice(2, 0, { "title": "From NPM", "value": "npm" });
        }

    }

    init()
    {
        let activeTab = null;
        this._sources.forEach((depSource, i) =>
        {
            const title = depSource.title || depSource.value;
            const tabOptions = { "hideToolbar": true, "closable": false, "depSource": depSource.value, "icon": depSource.icon, ...this._options };
            const depTab = new OpDependencyTab(this, title, tabOptions);
            if (i > 0)
            {
                depTab.deactivate();
            }
            else
            {
                activeTab = depTab;
            }
        });
        if (activeTab) this.activateTab(activeTab.id);
    }
}
