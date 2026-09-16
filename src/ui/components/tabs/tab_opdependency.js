import { CablesConstants, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { fileUploader } from "../../dialogs/upload.js";
import namespace from "../../namespaceutils.js";
import { platform } from "../../platform.js";
import ModalDialog from "../../dialogs/modaldialog.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";

/** @typedef {import("cables-shared-client").OpDoc} OpDoc */

/**
 * tab to manage op dependencies like libs or npm-modules
 *
 * @export
 * @class OpDependencyTab
 * @extends {Tab}
 */
export default class OpDependencyTab extends Tab
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

    /** @type {HTMLElement} */
    #exportNameContainer;

    /** @type {HTMLInputElement} */
    #exportNameEle;

    /** @type {HTMLSelectElement} */
    #jsTypeSelectEle;

    /** @type {HTMLInputElement} */
    #fileInputEle;

    /** @type {HTMLElement} */
    #errorsEle;

    /**
     * @type {string}
     */
    #jsType;

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

        this.#opDoc = opDoc;
        this.#sourceType = sourceType;

        this.#tabs = tabs;
        this.#tabs.addTab(this);
        gui.maintabPanel.show(true);
        this.html(this.getHtml());
        this.#initEventListeners();
    }

    getHtml()
    {
        const templateOptions = {
            "coreLibs": gui.opDocs.coreLibs,
            "acceptedFileTypesUpload": CablesConstants.FILETYPES.opdependency,
            "docsUrl": platform.getCablesDocsUrl()
        };
        return getHandleBarHtml("op_add_dependency_" + this.#sourceType, templateOptions);
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

    #initEventListeners()
    {
        const selector = "addopdependency_" + this.#sourceType;
        this.#containerEle = ele.byId(selector);
        if (this.#containerEle)
        {
            this.#srcEle = this.#containerEle.querySelector(".src");

            this.#exportNameContainer = this.#containerEle.querySelector(".exportName");
            if (this.#exportNameContainer) this.#exportNameEle = this.#exportNameContainer.querySelector("input[type='text']");

            this.#jsTypeSelectEle = this.#containerEle.querySelector("select.type");
            if (this.#jsTypeSelectEle) this.#jsType = this.#jsTypeSelectEle.value;

            this.#fileInputEle = this.#containerEle.querySelector("input[type='file']");
            this.#errorsEle = this.#containerEle.querySelector(".highlightBlock.error");

            if (this.#jsTypeSelectEle) this.#jsTypeSelectEle.addEventListener("change", this.#exportTypeChange.bind(this));
            if (this.#exportNameEle) this.#exportNameEle.addEventListener("input", this.#exportNameChange.bind(this));
            if (this.#srcEle) this.#srcEle.addEventListener("input", this.#textInputChange.bind(this));

            if (this.#fileInputEle)
            {
                const selectFileButton = this.#containerEle.querySelector(".cblbutton.upload");
                if (selectFileButton)
                {
                    selectFileButton.addEventListener("click", () => { this.#fileInputEle.click(); });
                    this.#fileInputEle.addEventListener("change", this.#uploadFileChange.bind(this));
                }
            }
        }
    }

    /**
     *
     * @param {function} done
     * @returns
     */
    submit(done)
    {
        const opDoc = this.#opDoc;
        const opName = opDoc.name;

        const src = this.#srcEle.value;
        if (!src)
        {
            this.#showErrors(["Invalid dependency source"]);
            return;
        }

        let exportName = null;
        if (this.#exportNameEle) exportName = this.#exportNameEle.value;

        if (this.#sourceType === "file")
        {
            if (this.#fileInputEle.files && this.#fileInputEle.files.length > 0)
            {
                let filename = this.#fileInputEle.files[0].name;
                fileUploader.uploadFile(this.#fileInputEle.files[0], filename, opDoc.id, (err, newFilename) =>
                {
                    if (!err)
                    {
                        gui.serverOps.addOpDependency(opDoc.id, "./" + newFilename, this.#sourceType, exportName, (addErr) =>
                        {
                            if (!addErr)
                            {
                                gui.emitEvent("refreshManageOp", opName);
                                if (done) done();
                            }
                            else
                            {
                                this.#showErrors(["Failed to add op dependency for " + opName + ": " + filename + ":" + addErr]);
                            }

                        });
                    }
                    else
                    {
                        this.#showErrors(["Failed to add op dependency for " + opName + ": " + filename + ":" + err]);
                    }
                });
            }
            else
            {

            }
        }
        else if (this.#sourceType === "corelib")
        {
            gui.serverOps.addCoreLib(opName, src, (addErr) =>
            {
                if (!addErr)
                {
                    gui.emitEvent("refreshManageOp", opName);
                    if (done) done();
                }
                else
                {
                    this.#showErrors(["Failed to add op dependency for " + opName + ": " + src + ":" + addErr]);
                }
            });
        }
        else
        {
            gui.serverOps.addOpDependency(opDoc.id, src, this.#sourceType, exportName, (addErr) =>
            {
                if (!addErr)
                {
                    gui.emitEvent("refreshManageOp", opName);
                    if (done) done();
                }
                else
                {
                    this.#showErrors(["Failed to add op dependency for " + opName + ": " + src + ":" + addErr]);
                }

            });
        }
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
        case "file":
            if (this.#jsType === "module" && this.#exportNameEle)
            {
                let exportName = this.#exportNameEle.value;
                if (!exportName) valid = false;

                if (exportName)
                {
                    try
                    {
                        exportName = exportName.trim();
                        exportName = exportName.replaceAll(";", "");
                        // eslint-disable-next-line no-new-func
                        new Function("var " + exportName + ";");
                    }
                    catch
                    {
                        errors.push("Invalid export name");
                        valid = false;
                    }
                }
            }
            break;
        case "url":
            if (src)
            {
                try
                {
                    new URL(src);
                }
                catch (e)
                {
                    errors.push("Invalid URL");
                    valid = false;
                }
            }
            else
            {
                valid = false;
            }

            if (this.#jsType === "module" && this.#exportNameEle)
            {
                let exportName = this.#exportNameEle.value;
                if (!exportName) valid = false;

                if (exportName)
                {
                    try
                    {
                        exportName = exportName.trim();
                        exportName = exportName.replaceAll(";", "");
                        // eslint-disable-next-line no-new-func
                        new Function("var " + exportName + ";");
                    }
                    catch
                    {
                        errors.push("Invalid export name");
                        valid = false;
                    }
                }

            }
            break;
        case "op":
            if (src)
            {
                if (!namespace.isOpNameValid(src))
                {
                    errors.push("Invalid Op name");
                    valid = false;
                }
            }
            break;
        case "corelib":
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

    #exportNameChange()
    {
        this.#validate();
        if (!this.#exportNameEle) return;
        if (this.#containerEle)
        {

            const usageEle = this.#containerEle.querySelector(".usage.module .codehint");
            if (usageEle)
            {
                const exportNameInput = this.#exportNameEle.querySelector("input");
                if (exportNameInput) usageEle.innerText = exportNameInput.value;
            }
        }
    }

    #exportTypeChange()
    {
        this.#validate();
        this.#jsType = this.#jsTypeSelectEle.value;
        const usageEles = this.#containerEle.querySelectorAll(".usage");
        usageEles.forEach((usageEle) => { ele.hide(usageEle); });
        const usageEle = this.#containerEle.querySelector(".usage." + this.#jsType);

        this.#exportNameEle.removeEventListener("input", this.#exportNameChange.bind(this));
        if (this.#exportNameEle && this.#jsType === "module")
        {
            this.#exportNameEle.addEventListener("input", this.#exportNameChange.bind(this));
            ele.show(this.#exportNameContainer);
        }
        else
        {
            ele.hide(this.#exportNameContainer);
        }
        if (usageEle)
        {
            ele.show(usageEle);
        }
    }

    #textInputChange()
    {
        this.#validate();
    }

    #uploadFileChange()
    {
        this.#validate();
        const uploadNameEle = this.#containerEle.querySelector(".uploadName");
        if (uploadNameEle) uploadNameEle.innerText = this.#fileInputEle.files[0].name;
    }
}
