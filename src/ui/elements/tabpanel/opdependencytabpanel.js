import TabPanel from "./tabpanel.js";
import OpDependencyTab from "../../components/tabs/tab_opdependency.js";
import { platform } from "../../platform.js";

/**
 * a tab panel, that can contain tabs
 *
 * @export
 * @class OpDependencyTabPanel
 * @extends {Events}
 */
export default class OpDependencyTabPanel extends TabPanel
{
    constructor(eleId, options)
    {
        super(eleId);
        this._options = options;
        this._titles = {
            "lib": "Add Lib",
            "corelib": "Add Core-Lib",
            "commonjs": "Add CommonJs",
            "module": "Add JS-Module",
            "npm": "Add NPM",
            "op": "Add Op"
        };
    }

    init()
    {
        console.log("init panel?");
        let activeTab;
        platform.getSupportedOpDependencyTypes().forEach((depType, i) =>
        {
            const title = this._titles[depType] || depType;
            const tabOptions = { "hideToolbar": true, "closable": false, "depType": depType, ...this._options };
            const depTab = new OpDependencyTab(this, title, tabOptions);
            if (i === 0) activeTab = depTab;
        });
        this.activateTab(activeTab.tabId);
    }
}
