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
                        if (usageEle) usageEle.innerText = "staticAttachments[\"" + fileInput.files[0].name.replace(".", "_") + "\"]";
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
                        if (usageEle) usageEle.innerText = "attachments[\"" + srcEle.value.replace(".", "_") + "\"]";
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
        const fileInput = depsEle.querySelector("input[type='file']");
        const inputEle = depsEle.querySelector("input[type='text']");
        let attName = inputEle.value;
        const opName = this.options.opDoc.name;
        const opId = this.options.opDoc.id;
        if (attSource === "js")
        {
            if (!attName.startsWith("inc_")) attName = "inc_" + attName;
            if (!attName.endsWith(".js")) attName += ".js";

            platform.talkerAPI.send(TalkerAPI.CMD_ADD_OP_ATTACHMENT, {
                "opname": opId,
                "name": attName
            }, (err, res) =>
            {
                if (!err)
                {
                    if (res && res.data && res.data.name)
                    {
                        const opDoc = gui.opDocs.getOpDocByName(opName);
                        if (opDoc)
                        {
                            if (!opDoc.attachmentFiles) opDoc.attachmentFiles = [];
                            if (opDoc.attachmentFiles && !opDoc.attachmentFiles.includes(res.data.name)) opDoc.attachmentFiles.push(res.data.name);
                        }
                    }

                    gui.serverOps.editAttachment(opName, "att_" + attName);
                    gui.emitEvent("refreshManageOp", opName);
                    return;
                }
                else
                {
                    this.#showError(err);
                }
            });
        }
        else if (attSource === "string")
        {
            platform.talkerAPI.send(TalkerAPI.CMD_ADD_OP_ATTACHMENT, {
                "opname": opId,
                "name": attName
            }, (err, res) =>
            {
                if (!err)
                {
                    if (res && res.data && res.data.name)
                    {
                        const opDoc = gui.opDocs.getOpDocByName(opName);
                        if (opDoc)
                        {
                            if (!opDoc.attachmentFiles) opDoc.attachmentFiles = [];
                            if (opDoc.attachmentFiles && !opDoc.attachmentFiles.includes(res.data.name)) opDoc.attachmentFiles.push(res.data.name);
                        }
                    }

                    gui.serverOps.editAttachment(opName, "att_" + attName);
                    gui.emitEvent("refreshManageOp", opName);
                }
                else
                {
                    this.#showError(err);
                    return;
                }
            });
        }
        else if (attSource === "binary")
        {
            let filename = fileInput.files[0].name;
            if (!filename.startsWith("att_bin_")) filename = "att_bin_" + filename;
            fileUploader.uploadFile(fileInput.files[0], filename, opId, (err, newFilename) =>
            {
                if (!err)
                {
                    gui.serverOps.loadOpDependencies(opName, (op) =>
                    {
                        gui.emitEvent("refreshManageOp", opName);
                    }, true);
                }
                else
                {
                    this.#showError(err);
                    return;
                }
            });
        }
    }

    #showError(err)
    {
        gui.serverOps.showApiError(err);
    }

}
