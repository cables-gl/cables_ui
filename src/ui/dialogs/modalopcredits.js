import ele from "cables-shared-client/src/ele.js";
import ModalDialog from "./modaldialog.js";
import OpAttachmentTabPanel from "../elements/tabpanel/opattachmenttabpanel.js";
import { gui } from "../gui.js";
import { getHandleBarHtml } from "../utils/handlebars.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */

/**
 * Opens a modal dialog and shows a loading indicator animation
 *
 * @param {String} title
 * @class
 */
export default class ModalOpCredits
{

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
            "title": "Add credits to " + this.#opDoc.name,
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
                    const dialogElement = this.#dialog.getElement();
                    const inputs = dialogElement.querySelectorAll("input");
                    const credit = {
                        "title": "",
                        "author": "",
                        "url": "",
                        "licence": "",
                        "version": ""
                    };
                    inputs.forEach((input) =>
                    {
                        const name = input.getAttribute("name");
                        if (name && credit.hasOwnProperty(name))
                        {
                            credit[name] = input.value;
                        }
                    });

                    gui.serverOps.addOpCredit(opDoc, credit, (err, res) =>
                    {
                        if (!err)
                        {
                            gui.emitEvent("refreshManageOp", this.#opDoc.name);
                            if (done) done();
                        }
                        else
                        {
                            new ModalDialog({
                                "title": "Failed to add credit",
                                "warning": true,
                                "text": err ? err.msg || err : "unknown error"
                            });
                        }
                    });
                }
            };
        }
        else
        {
            modalOptions.showOkButton = true;
            modalOptions.warning = true;
        }

        this.#dialog = new ModalDialog(modalOptions);
        this.#addEventListeners();

    }

    /**
     * @returns {string}
     */
    getHtml()
    {
        if (this.#canEdit)
        {
            const templateOptions = {};
            return getHandleBarHtml("op_add_credits", templateOptions);
        }
        else
        {
            return "You are not allowed to add credits to this op";
        }
    }

    #addEventListeners()
    {
        const dialogElement = this.#dialog.getElement();
        const inputs = dialogElement.querySelectorAll("input");
        inputs.forEach((input) =>
        {
            input.addEventListener("input", this.#validate.bind(this));
        });
    }

    #validate()
    {
        const dialogElement = this.#dialog.getElement();
        const inputs = dialogElement.querySelectorAll("input");
        const errorsEle = dialogElement.querySelector(".highlightBlock.error");

        const modal = gui.currentModal;
        ele.hide(errorsEle);

        let valid = true;
        let errors = [];
        inputs.forEach((input) =>
        {
            const value = input.value;
            switch (input.getAttribute("name"))
            {
            case "title":
                if (!value)
                {
                    errors.push("Please enter a title");
                    valid = false;
                }
                break;
            case "author":
                if (!value)
                {
                    errors.push("Please enter an author");
                    valid = false;
                }
                break;
            case "url":
                if (value)
                {
                    try
                    {
                        new URL(value);
                    }
                    catch (e)
                    {
                        errors.push("Invalid URL");
                        valid = false;
                    }
                }
                break;
            case "version":
                break;
            case "licence":
                break;
            }
        });

        if (valid)
        {
            if (modal) modal.enableButton(ModalDialog.MODAL_CHOICE_OK_BUTTON_ID);
        }
        else
        {
            this.#showErrors(errors);
            if (modal) modal.disableButton(ModalDialog.MODAL_CHOICE_OK_BUTTON_ID);
        }
    }

    /**
     *
     * @param {string[]} msgs
     */
    #showErrors(msgs)
    {
        const dialogElement = this.#dialog.getElement();
        const errorsEle = dialogElement.querySelector(".highlightBlock.error");
        if (!errorsEle) return;
        errorsEle.innerHTML = "";
        if (!msgs || msgs.length === 0)
        {
            ele.hide(errorsEle);
            return;
        }
        msgs.forEach((msg) =>
        {
            errorsEle.innerHTML += msg + "<br/>";
        });
        ele.show(errorsEle);
    }

    close()
    {
        this.#dialog.close();
        this.#dialog = null;
    }
}
