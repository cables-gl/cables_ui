import TabPanel from "./tabpanel.js";
import OpAttachmentTab from "../../components/tabs/tab_opattachment.js";

/**
 * a tab panel, that can contain tabs
 *
 * @export
 * @class OpDependencyTabPanel
 * @extends {TabPanel}
 */
export default class OpAttachmentTabPanel extends TabPanel
{

    /** @type {OpAttachmentTab[]} */
    tabs = [];

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
            { "title": "Include JS", "value": "js" },
            { "title": "String Attachment", "value": "string" },
            { "title": "Binary Attachment", "value": "binary" }
        ];
    }

    /**
     * @returns {OpAttachmentTab}
     */
    getActiveTab()
    {
        for (let i = 0; i < this.tabs.length; i++) if (this.tabs[i].active) return this.tabs[i];
    }

    init()
    {
        let activeTab = null;
        this._sources.forEach((attSource, i) =>
        {
            const title = attSource.title || attSource.value;
            const tabOptions = { "hideToolbar": true, "closable": false, "attSource": attSource.value, "icon": attSource.icon, ...this._options };
            const depTab = new OpAttachmentTab(this, title, tabOptions);
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
