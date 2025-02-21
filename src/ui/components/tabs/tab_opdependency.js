import { ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { fileUploader } from "../../dialogs/upload.js";
import namespace from "../../namespaceutils.js";
import { platform } from "../../platform.js";

/**
 *simple tab to just show html
 *
 * @export
 * @class OpDependencyTab
 * @extends {Tab}
 */
export default class OpDependencyTab extends Tab
{
    constructor(tabs, title, options = {})
    {
        super(title, options);
        this.options.docsUrl = platform.getCablesDocsUrl();
        this._tabs = tabs || gui.mainTabs;
        this._tabs.addTab(this);
        gui.maintabPanel.show(true);
        this.html(this.getHtml());
        this._initEventListeners();
    }

    getHtml()
    {
        return getHandleBarHtml("op_add_dependency_" + this.options.depSource, this.options);
    }

    _initEventListeners()
    {
        const depSource = this.options.depSource;
        const viewId = this.options.viewId;
        const opName = this.options.opDoc.name;
        const opDoc = this.options.opDoc;

        const selector = "addopdependency_" + depSource + "_" + viewId;
        const depsEle = ele.byId(selector);

        if (depsEle)
        {
            const srcEle = depsEle.querySelector(".depSrc");
            const submitEle = depsEle.querySelector(".button.add");
            const depTypeEle = depsEle.querySelector("input[name='depType']");
            const exportNameEle = depsEle.querySelector(".exportName");
            const typeSelectEle = depsEle.querySelector("select.type");

            if (typeSelectEle)
            {
                typeSelectEle.addEventListener("change", () =>
                {
                    depTypeEle.value = typeSelectEle.value;
                    if (exportNameEle && typeSelectEle.value === "module")
                    {
                        ele.show(exportNameEle);
                    }
                    else
                    {
                        ele.hide(exportNameEle);
                    }
                });
            }

            const warningEle = depsEle.querySelector(".warning-error");
            if (warningEle && depTypeEle.value === "op")
            {
                srcEle.addEventListener("input", () =>
                {
                    if (namespace.isOpNameValid(srcEle.value))
                    {
                        ele.hide(warningEle);
                    }
                    else
                    {
                        ele.show(warningEle);
                    }
                });
            }

            let fileInput = null;
            const selectFileButton = depsEle.querySelector(".button.upload");
            if (selectFileButton)
            {
                fileInput = depsEle.querySelector("input[type='file']");
                selectFileButton.addEventListener("click", () => { fileInput.click(); });
                fileInput.addEventListener("change", () =>
                {
                    srcEle.value = fileInput.files[0].name;
                });
            }
            submitEle.addEventListener("click", () =>
            {
                if (submitEle.disabled) return;
                const depSrc = srcEle.value;
                if (!depSrc) return;
                submitEle.innerText = "working...";
                submitEle.disabled = true;

                let exportName = null;
                if (exportNameEle)
                {
                    const exportNameInput = exportNameEle.querySelector("input");
                    if (exportNameInput) exportName = exportNameInput.value;
                }

                const depType = depTypeEle.value;
                if (fileInput && fileInput.files && fileInput.files.length > 0)
                {
                    const filename = fileInput.files[0].name;
                    fileUploader.uploadFile(fileInput.files[0], filename, opDoc.id, (err, newFilename) =>
                    {
                        if (!err)
                        {
                            gui.serverOps.addOpDependency(opName, "./" + newFilename, depType, exportName, () =>
                            {
                                submitEle.innerText = "Add";
                                submitEle.disabled = false;
                            });
                        }
                    });
                }
                else if (depType === "lib")
                {
                    gui.serverOps.addOpLib(opName, depSrc, () =>
                    {
                        submitEle.innerText = "Add";
                        submitEle.disabled = false;
                    });
                }
                else if (depType === "corelib")
                {
                    gui.serverOps.addCoreLib(opName, depSrc, () =>
                    {
                        submitEle.innerText = "Add";
                        submitEle.disabled = false;
                    });
                }
                else
                {
                    gui.serverOps.addOpDependency(opName, depSrc, depType, exportName, () =>
                    {
                        submitEle.innerText = "Add";
                        submitEle.disabled = false;
                    });
                }
            });
        }
    }
}
