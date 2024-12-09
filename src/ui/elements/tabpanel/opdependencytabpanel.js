import TabPanel from "./tabpanel.js";
import OpDependencyTab from "../../components/tabs/tab_opdependency.js";


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
        CABLES.platform.getSupportedOpDependencyTypes().forEach((depType) =>
        {
            const title = this._titles[depType] || depType;
            const tabOptions = { "hideToolbar": true, "closable": false, "depType": depType, ...this._options };
            new OpDependencyTab(this, title, tabOptions);
        });
    }
}
