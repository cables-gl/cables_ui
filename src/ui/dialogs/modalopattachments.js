import ModalDialog from "./modaldialog.js";
import OpAttachmentTabPanel from "../elements/tabpanel/opattachmenttabpanel.js";
import { gui } from "../gui.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */

export default class ModalOpAttachments
{

    /** @type {OpAttachmentTabPanel} */
    #tabs;

    /** @type {ModalDialog} */
    #dialog;

    /** @type {OpDoc} */
    #opDoc;

    /** @type {boolean} */
    #canEdit;

    /**
     *
     * @param {OpDoc} opDoc
     */
    constructor(opDoc)
    {

        this.#opDoc = opDoc;
        this.#canEdit = gui.serverOps.canEditOp(gui.user, this.#opDoc.name);

        /** @type {import("./modaldialog.js").ModalDialogOptions} */
        const modalOptions = {
            "title": "Create attachment for " + this.#opDoc.name,
            "html": this.getHtml()
        };

        if (this.#canEdit)
        {
            modalOptions.choice = true;
            modalOptions.okButton = {
                "text": "Add",
                "disabled": true,
                "callback": (done) =>
                {
                    const activeTab = this.#tabs.getActiveTab();
                    activeTab.submit(done);
                }
            };
        }
        else
        {
            modalOptions.showOkButton = true;
            modalOptions.warning = true;
        }

        this.#dialog = new ModalDialog(modalOptions);
        this.#initTabs();

    }

    /**
     * @returns {string}
     */
    getHtml()
    {
        if (this.#canEdit)
        {
            return "<div id=\"attachmenttabs\" class=\"attachmenttabs\"></div>";
        }
        else
        {
            return "You are not allowed to change dependencies of this op";
        }
    }

    #initTabs()
    {
        if (this.#canEdit)
        {
            this.#tabs = new OpAttachmentTabPanel("attachmenttabs", this.#opDoc);
            this.#tabs.init();
        }
    }

    close()
    {
        this.#dialog.close();
        this.#dialog = null;
    }
}
