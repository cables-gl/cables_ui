import TabPanel from "./tabpanel.js";
import OpAttachmentTab from "../../components/tabs/tab_opattachment.js";
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
export default class OpAttachmentTabPanel extends TabPanel
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
            { "title": "Attachment", "type": "string", "icon": "file" },
            { "title": "Include JS", "type": "js", "icon": "file" },
            { "title": "Binary Attachment", "type": "binary", "icon": "file" }
        ];
    }

    /**
     *
     * @returns {OpAttachmentTab}
     */
    getActiveTab()
    {
        return super.getActiveTab();
    }

    init()
    {
        let activeTab = null;
        this.#sources.forEach((source, i) =>
        {

            /** @type {TabOptions} */
            const tabOptions = { "hideToolbar": true, "closable": false, "icon": source.icon };
            const depTab = new OpAttachmentTab(this, source.title, source.type, this.#opDoc, tabOptions);
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
