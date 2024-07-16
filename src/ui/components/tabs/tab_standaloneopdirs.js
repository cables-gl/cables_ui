import { helper } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

export default class StandaloneOpDirs
{
    constructor(tabs)
    {
        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("op directories", { "icon": "folder", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        const listenerId = CABLESUILOADER.talkerAPI.addEventListener("projectOpDirsChanged", (err, res) =>
        {
            this.show();
            CABLESUILOADER.talkerAPI.send("getOpDocsAll", { "projectId": gui.patchId }, (_err, _data) =>
            {
                if (_err)
                {
                    console.error("preloading error", _err);
                }
                else
                {
                    if (gui.opDocs)
                    {
                        gui.opDocs.addOpDocs(_data.opDocs);
                    }
                    gui.opSelect().reload();
                }
            }, (response) =>
            {
                console.error("preloading error", response);
            });
        });
        this._tab.on("onActivate", this.show);
        this._tab.on("close", () =>
        {
            CABLESUILOADER.talkerAPI.removeEventListener(listenerId);
        });
    }

    show()
    {
        CABLESUILOADER.talkerAPI.send("getOpTargetDirs", {}, (err, r) =>
        {
            if (!err && r.data)
            {
                const html = getHandleBarHtml("tab_standalone_opdirs", { "dirs": r.data });
                this._tab.html(html);

                const listEle = ele.byId("dirlist");
                const infoBlock = listEle.querySelector(".highlightBlock");
                const saveButton = this._tab.contentEle.querySelector("#saveProjectOpDirOrder");
                if (saveButton)
                {
                    saveButton.addEventListener("click", () =>
                    {
                        ele.hide(infoBlock);
                        infoBlock.classList.add("info");
                        infoBlock.classList.remove("error");
                        const order = [];
                        const dirs = listEle.querySelectorAll("[data-dir]");
                        dirs.forEach((dirEle) =>
                        {
                            order.push(dirEle.dataset.dir);
                        });
                        CABLESUILOADER.talkerAPI.send("saveProjectOpDirOrder", order, (orderErr, orderRes) =>
                        {
                            if (orderRes && orderRes.success)
                            {
                                infoBlock.innerHTML = "Saved, please reload the patch to see the changes";
                                saveButton.innerHTML = "Reload";
                                ele.show(infoBlock);
                                saveButton.addEventListener("click", () =>
                                {
                                    window.location.reload();
                                });
                            }
                            else
                            {
                                infoBlock.classList.remove("info");
                                infoBlock.classList.add("error");
                                infoBlock.innerHTML = orderErr;
                                ele.show(infoBlock);
                            }
                        });
                    });
                }

                new Sortable(listEle, {
                    "animation": 150,
                    "handle": ".handle",
                    "ghostClass": "ghost",
                    "dragClass": "dragActive"
                });
            }
        });
    }
}
