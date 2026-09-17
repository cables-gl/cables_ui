import TabPanel from "./tabpanel.js";
import OpDependencyTab from "../../components/tabs/tab_opdependency.js";
import { platform } from "../../platform.js";
import Tab from "./tab.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */
/** @typedef {import("./tab.js").TabOptions} TabOptions */

/**
 * a tab panel, that can contain tabs
 *
 * @export
 * @class OpDependencyTabPanel
 * @extends {TabPanel}
 */
export default class OpDependencyTabPanel extends TabPanel
{

    /** @type {OpDoc} */
    #opDoc;

    /** @type {Object[]} */
    #sources;

    /**
     * Description
     * @param {string} eleId
     * @param {OpDoc} opDoc
     */
    constructor(eleId, opDoc)
    {
        super(eleId, { "noUserSetting": true });

        this.#opDoc = opDoc;

        this.#sources = [
            { "title": "Upload File", "type": "file", "icon": "file" },
            { "title": "From URL", "type": "url", "icon": "globe" },
            { "title": "Op", "type": "op", "icon": "op" },
            { "title": "Core-Lib", "type": "corelib", "icon": "cables" }
        ];
        if (platform.getSupportedOpDependencyTypes().includes("npm"))
        {
            this.#sources.splice(2, 0, { "title": "From NPM", "type": "npm", "icon": "file" });
        }
    }

    /**
     *
     * @returns {OpDependencyTab}
     */
    getActiveTab()
    {
        return /** @type {OpDependencyTab} */(super.getActiveTab());
    }

    init()
    {

        /** @type {Tab} */
        let activeTab = null;
        this.#sources.forEach((source, i) =>
        {

            /** @type {TabOptions} */
            const tabOptions = { "hideToolbar": true, "closable": false, "icon": source.icon };
            const depTab = new OpDependencyTab(this, source.title, source.type, this.#opDoc, tabOptions);
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
