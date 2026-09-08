import { utils } from "cables";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import OpAttachmentTabPanel from "../elements/tabpanel/opattachmenttabpanel.js";

/**
 * Opens a modal dialog and shows a loading indicator animation
 *
 * @param {String} title
 * @class
 */
export default class ModalOpAttachments
{

    /** @type {OpAttachmentTabPanel} */
    #tabs;

    /** @type {ModalDialog} */
    #dialog;

    #options = {};
    #opDoc;
    #opName;
    #canEdit;
    #modalOptions;

    constructor(options)
    {

        this.#options = options || {};
        this.#opDoc = this.#options.opDoc;
        this.#opName = this.#opDoc.name;
        this.#canEdit = this.#options.canEditOp;

        /** @type {import("./modaldialog.js").ModalDialogOptions} */
        this.#modalOptions = {
            "title": options.modalTitle || "Create attachment for " + this.#opName,
            "html": this.getHtml(),
            "showOkButton": !this.#canEdit,
            "warning": !this.#canEdit,
            "choice": this.#canEdit
        };

        if (this.#canEdit)
        {
            this.#modalOptions.okButton = {
                "text": "Add",
                "cssClasses": "",
                "callback": (done) =>
                {
                    const activeTab = this.#tabs.getActiveTab();
                    activeTab.submit(done);
                }
            };
        }

        this.#dialog = new ModalDialog(this.#modalOptions);
        this.#initTabs();

    }

    /**
     * @returns {string}
     */
    getHtml()
    {
        if (this.#canEdit)
        {
            return "<div id=\"" + this.#options.viewId + "_attachmenttabs\" class=\"attachmenttabs\"></div>";
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

            const allLibs = gui.opDocs.libs.sort((a, b) => { return a.localeCompare(b); });
            const libs = [];
            allLibs.forEach((lib) =>
            {
                libs.push({
                    "url": lib,
                    "name": utils.basename(lib),
                    "isAssetLib": lib.startsWith("/assets/")
                });
            });

            const panelOptions = {
                "opDoc": this.#opDoc,
                "libs": libs,
                "coreLibs": gui.opDocs.coreLibs,
                "user": gui.user,
                "canEditOp": this.#canEdit,
                "viewId": this.#options.viewId
            };

            this.#tabs = new OpAttachmentTabPanel(this.#options.viewId + "_attachmenttabs", panelOptions);
            this.#tabs.init();
        }
    }

    close()
    {
        this.#dialog.close();
        this.#dialog = null;
    }
}
