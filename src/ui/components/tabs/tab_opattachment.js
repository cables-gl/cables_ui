import { CablesConstants, ele, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { fileUploader } from "../../dialogs/upload.js";
import { platform } from "../../platform.js";

/**
 * tab to manage op dependencies like libs or npm-modules
 *
 * @export
 * @class OpDependencyTab
 * @extends {Tab}
 */
export default class OpAttachmentTab extends Tab
{
    constructor(tabs, title, options = {})
    {
        super(title, options);
        this._tabs = tabs || gui.mainTabs;
        this._tabs.addTab(this);
        gui.maintabPanel.show(true);
        this.html(this.getHtml());
        this._initEventListeners();
    }

    getHtml()
    {
        const templateOptions = {
            ...this.options,
            "acceptedFileTypesUpload": CablesConstants.FILETYPES.opattachment,
            "docsUrl": platform.getCablesDocsUrl()
        };
        return getHandleBarHtml("op_add_attachment_" + this.options.attSource, templateOptions);
    }

    activate()
    {
        this.active = true;
        this.contentEle.style.display = "block";
        this.toolbarContainerEle.style.display = "block";

        const attSource = this.options.attSource;
        const viewId = this.options.viewId;
        const selector = "addopattachment_" + attSource + "_" + viewId;
        const attsEle = ele.byId(selector);
        if (attsEle)
        {
            const srcEle = attsEle.querySelector(".attSrc");
            if (srcEle) srcEle.focus();
        }
        this.emitEvent(Tab.EVENT_ACTIVATE);
    }

    _initEventListeners()
    {
        const attSource = this.options.attSource;
        const viewId = this.options.viewId;

        const selector = "addopattachment_" + attSource + "_" + viewId;
        const attsEle = ele.byId(selector);

        if (attsEle)
        {
            const srcEle = attsEle.querySelector(".attSrc");
            const attTypeEle = attsEle.querySelector("input[name='attType']");

            const selectFileButton = attsEle.querySelector(".cblbutton.upload");
            if (selectFileButton)
            {
                const fileInput = attsEle.querySelector("input[type='file']");
                selectFileButton.addEventListener("click", () => { fileInput.click(); });
                fileInput.addEventListener("change", () =>
                {
                    srcEle.value = fileInput.files[0].name;
                    if (attTypeEle && attTypeEle.value === "binary")
                    {
                        const usageEle = attsEle.querySelector(".usage.static code");
                        if (usageEle) usageEle.innerText = "staticAttachments." + fileInput.files[0].name.replace(".", "_");
                    }
                });
            }
            else
            {
                srcEle.addEventListener("keydown", (e) =>
                {
                    if (e.code == "Enter")
                    {
                        this.submit();
                        if (gui && gui.currentModal) gui.currentModal.close();
                    }
                });

                if (attTypeEle && attTypeEle.value === "string")
                {
                    srcEle.addEventListener("input", () =>
                    {
                        const usageEle = attsEle.querySelector(".usage.string code");
                        if (usageEle) usageEle.innerText = "attachments." + srcEle.value.replace(".", "_");
                    });
                }
            }
        }
    }

    submit()
    {
        const attSource = this.options.attSource;
        const selector = "addopattachment_" + attSource + "_" + this.options.viewId;
        const depsEle = ele.byId(selector);
        const inputEle = depsEle.querySelector("input[type='text']");
        let filename = inputEle.value;
        let binary = null;
        if (attSource === "js")
        {
            if (!filename.startsWith("inc_")) filename = "inc_" + filename;
            if (!filename.endsWith(".js")) filename += ".js";
        }
        else if (attSource === "binary")
        {

            const fileInput = depsEle.querySelector("input[type='file']");
            filename = fileInput.files[0].name;
            if (!filename.startsWith("att_bin_")) filename = "att_bin_" + filename;
            binary = fileInput.files[0];
        }

        this.#addAttachment(this.options.opDoc, filename, binary);
    }

    /**
     *
     * @param {import("cables-shared-client").OpDoc} opDoc
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
                    this.#showError(err);
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
                    this.#showError(err);
                    if (cb) cb(err);
                }
            });
        }

    }

    #showError(err)
    {
        gui.serverOps.showApiError(err);
    }

}
