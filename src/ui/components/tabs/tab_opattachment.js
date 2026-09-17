import { CablesConstants, ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { fileUploader } from "../../dialogs/upload.js";
import { platform } from "../../platform.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import ModalDialog from "../../dialogs/modaldialog.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */

/**
 * tab to manage op dependencies like libs or npm-modules
 *
 * @export
 * @class OpDependencyTab
 * @extends {Tab}
 */
export default class OpAttachmentTab extends Tab
{

    /** @type {TabPanel} */
    #tabs;

    /** @type {string} */
    #sourceType;

    /** @type {OpDoc} */
    #opDoc;

    /** @type {HTMLElement} */
    #containerEle;

    /** @type {HTMLInputElement} */
    #srcEle;

    /** @type {HTMLInputElement} */
    #fileInputEle;

    /** @type {HTMLElement} */
    #errorsEle;

    /**
     *
     * @param {TabPanel} tabs
     * @param {string} title
     * @param {string} sourceType
     * @param {OpDoc} opDoc
     * @param {import("../../elements/tabpanel/tab.js").TabOptions} tabOptions
     */
    constructor(tabs, title, sourceType, opDoc, tabOptions = {})
    {
        super(title, tabOptions);

        this.#sourceType = sourceType;
        this.#opDoc = opDoc;

        this.#tabs = tabs;
        this.#tabs.addTab(this);
        gui.maintabPanel.show(true);
        this.html(this.getHtml());
        this.#initEventListeners();
    }

    getHtml()
    {
        const acceptedFiles = CablesConstants.FILETYPES.opattachment_static;
        const templateOptions = {
            "acceptedFileTypesUpload": acceptedFiles,
            "docsUrl": platform.getCablesDocsUrl()
        };
        return getHandleBarHtml("op_add_attachment_" + this.#sourceType, templateOptions);
    }

    activate()
    {
        this.active = true;
        this.contentEle.style.display = "block";
        this.toolbarContainerEle.style.display = "block";
        if (this.#srcEle) this.#srcEle.focus();
        this.#validate();
        this.emitEvent(Tab.EVENT_ACTIVATE);
    }

    submit(done)
    {

        let attachmentName = this.#srcEle.value;
        let binary = null;
        if (this.#sourceType === "js")
        {
            if (!attachmentName.startsWith("inc_")) attachmentName = "inc_" + attachmentName;
            if (!attachmentName.endsWith(".js")) attachmentName += ".js";
        }
        else if (this.#sourceType === "binary")
        {

            attachmentName = this.#fileInputEle.files[0].name;
            if (!attachmentName.startsWith("att_bin_")) attachmentName = "att_bin_" + attachmentName;
            binary = this.#fileInputEle.files[0];
        }

        this.#addAttachment(this.#opDoc, attachmentName, binary, done);
    }

    #validate()
    {
        const modal = gui.currentModal;
        ele.hide(this.#errorsEle);

        const src = this.#srcEle.value;

        let valid = !!src;
        let errors = [];
        switch (this.#sourceType)
        {
        case "string":
            break;
        case "js":
            break;
        case "binary":
            break;
        }

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

    #initEventListeners()
    {
        const selector = "addopattachment_" + this.#sourceType;
        this.#containerEle = ele.byId(selector);

        if (this.#containerEle)
        {
            this.#srcEle = this.#containerEle.querySelector(".src");

            this.#fileInputEle = this.#containerEle.querySelector("input[type='file']");
            this.#errorsEle = this.#containerEle.querySelector(".highlightBlock.error");

            if (this.#fileInputEle)
            {
                const selectFileButton = this.#containerEle.querySelector(".cblbutton.upload");
                if (selectFileButton)
                {
                    selectFileButton.addEventListener("click", () => { this.#fileInputEle.click(); });
                    this.#fileInputEle.addEventListener("change", this.#uploadFileChange.bind(this));
                }
            }

            if (this.#srcEle)
            {
                this.#srcEle.addEventListener("keydown", (e) =>
                {
                    if (e.code == "Enter")
                    {
                        this.submit();
                        if (gui && gui.currentModal) gui.currentModal.close();
                    }
                });
                this.#srcEle.addEventListener("input", this.#textInputChange.bind(this));
            }
        }
    }

    /**
     * @param {OpDoc} opDoc
     * @param {string} filename
     * @param {any} [binary]
     * @param {function} [cb]
     */
    #addAttachment(opDoc, filename, binary = null, cb = null)
    {
        const opName = opDoc.name;
        const opId = opDoc.id;

        if (binary)
        {
            fileUploader.uploadFile(binary, filename, opId, (err, newFilename) =>
            {
                if (!err)
                {
                    gui.serverOps.loadOpDependencies(opName, (op) =>
                    {
                        gui.emitEvent("refreshManageOp", opName);
                        if (cb) cb();
                    }, true);
                }
                else
                {
                    this.#showErrors([err]);
                    if (cb) cb(err);
                }
            });
        }
        else
        {
            platform.talkerAPI.send(TalkerAPI.CMD_ADD_OP_ATTACHMENT, {
                "opname": opId,
                "name": filename
            }, (err, res) =>
            {
                if (!err)
                {
                    if (res && res.data && res.data.name)
                    {
                        const newDoc = gui.opDocs.getOpDocByName(opName);
                        if (newDoc)
                        {
                            if (!newDoc.attachmentFiles) newDoc.attachmentFiles = [];
                            if (newDoc.attachmentFiles && !newDoc.attachmentFiles.includes(res.data.name)) newDoc.attachmentFiles.push(res.data.name);
                        }
                    }

                    gui.serverOps.editAttachment(opName, "att_" + filename);
                    gui.emitEvent("refreshManageOp", opName);
                    if (cb) cb();
                }
                else
                {
                    this.#showErrors([err]);
                    if (cb) cb(err);
                }
            });
        }

    }

    #textInputChange()
    {
        this.#validate();
        const usageEle = this.#containerEle.querySelector(".usage.string .codehint");
        if (usageEle)
        {
            let attachmentName = this.#srcEle.value;
            if (this.#sourceType === "js" && attachmentName.startsWith("inc_")) attachmentName += "inc_";
            usageEle.innerText = "attachments." + attachmentName.replaceAll(".", "_");
        }
    }

    #uploadFileChange()
    {
        this.#validate();
        const uploadNameEle = this.#containerEle.querySelector(".uploadName");
        if (uploadNameEle) uploadNameEle.innerText = this.#fileInputEle.files[0].name;
        const usageEle = this.#containerEle.querySelector(".usage.binary .codehint");
        if (usageEle) usageEle.innerText = "staticAttachments." + this.#fileInputEle.files[0].name.replaceAll(".", "_");
    }

    /**
     *
     * @param {string[]} msgs
     */
    #showErrors(msgs)
    {
        if (!this.#errorsEle) return;
        this.#errorsEle.innerHTML = "";
        if (!msgs || msgs.length === 0)
        {
            ele.hide(this.#errorsEle);
            return;
        }
        msgs.forEach((msg) =>
        {
            this.#errorsEle.innerHTML += msg + "<br/>";
        });
        ele.show(this.#errorsEle);
    }

}
