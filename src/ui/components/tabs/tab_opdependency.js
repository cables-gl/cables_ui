import { ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

/**
 *simple tab to just show html
 *
 * @export
 * @class OpDependencyTab
 * @extends {Events}
 */
export default class OpDependencyTab extends Tab
{
    constructor(tabs, title, options = {})
    {
        super(title, options);
        this._tabs = tabs || gui.mainTabs;
        this._tab = new Tab(title, this.options);
        this.tabId = this._tab.id;
        this._tabs.addTab(this._tab);
        gui.maintabPanel.show(true);
        this._tab.html(this.getHtml());
        this._initEventListeners();
    }

    getHtml()
    {
        return getHandleBarHtml("op_add_dependency_" + this.options.depType, this.options);
    }

    _initEventListeners()
    {
        const depType = this.options.depType;
        const viewId = this.options.viewId;
        const opName = this.options.opDoc.name;
        const opDoc = this.options.opDoc;

        const depsEle = ele.byId("addopdependency_" + depType + "_" + viewId);
        depsEle.style.minHeight = "150px";
        const editEle = depsEle.querySelector(".edit");
        if (depsEle && editEle)
        {
            const srcEle = depsEle.querySelector(".depSrc");
            const submitEle = editEle.querySelector(".add");

            const exportNameEle = depsEle.querySelector(".exportName input");

            let fileInput = null;
            const selectFileButton = editEle.querySelector(".upload");
            if (selectFileButton)
            {
                fileInput = editEle.querySelector("input[type='file']");
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
                if (fileInput && fileInput.files && fileInput.files.length > 0)
                {
                    const filename = fileInput.files[0].name;
                    CABLES.fileUploader.uploadFile(fileInput.files[0], filename, opDoc.id, (err, newFilename) =>
                    {
                        if (!err)
                        {
                            gui.serverOps.addOpDependency(opName, "./" + newFilename, depType, () =>
                            {
                                submitEle.innerText = "Add";
                                submitEle.disabled = false;
                            });
                        }
                    });
                }
                else
                {
                    let exportName = null;
                    if (exportNameEle) exportName = exportNameEle.value;
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
