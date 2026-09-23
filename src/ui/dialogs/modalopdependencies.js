import { utils } from "cables";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import OpDependencyTabPanel from "../elements/tabpanel/opdependencytabpanel.js";
import OpDependencyTab from "../components/tabs/tab_opdependency.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */

export default class ModalOpDependencies
{

    /** @type {OpDependencyTabPanel} */
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
            "title": "Add dependency for " + this.#opDoc.name,
            "html": this.getHtml(),
            "showOkButton": !this.#canEdit,
            "warning": !this.#canEdit,
            "choice": this.#canEdit
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
            return "<div id=\"dependencytabs\" class=\"dependencytabs\"></div>";
        }
        else
        {
            return "You are not allowed to change attachments of this op";
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

            this.#tabs = new OpDependencyTabPanel("dependencytabs", this.#opDoc);
            this.#tabs.init();
        }
    }

    close()
    {
        this.#dialog.close();
        this.#dialog = null;
    }
}
