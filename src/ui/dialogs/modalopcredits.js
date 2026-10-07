import ele from "cables-shared-client/src/ele.js";
import ModalDialog from "./modaldialog.js";
import Gui, { gui } from "../gui.js";
import { getHandleBarHtml } from "../utils/handlebars.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */
/** @typedef {import("cables-shared-client").OpCredit} OpCredit */

/** Modal dialog to show and edit the credits of an op. */
export default class ModalOpCredits
{

    /** @type {ModalDialog} */
    #dialog;

    /** @type {OpDoc} */
    #opDoc;

    /** @type {OpCredit} */
    #opCredit;

    /** @type {boolean} */
    #canEdit;

    /**
     *
     * @param {OpDoc} opDoc
     * @param {OpCredit} opCredit
     */
    constructor(opDoc, opCredit = null)
    {

        this.#opDoc = opDoc;
        this.#opCredit = opCredit;
        this.#canEdit = gui.serverOps.canEditOp(gui.user, this.#opDoc.name);

        /** @type {import("./modaldialog.js").ModalDialogOptions} */
        const modalOptions = {
            "title": "Add credits to " + this.#opDoc.name,
            "html": this.getHtml(opCredit)
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
                        "date": null,
                        "title": null,
                        "author": null,
                        "url": null,
                        "licence": null,
                        "version": null
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
                            gui.emitEvent(Gui.EVENT_REFRESH_MANAGE_OP, this.#opDoc.name);
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
     * @param {OpCredit} opCredit
     * @returns {string}
     */
    getHtml(opCredit)
    {
        if (this.#canEdit)
        {
            const templateOptions = {
                "credit": opCredit
            };
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
