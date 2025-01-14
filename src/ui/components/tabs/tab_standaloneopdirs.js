import { ele, Logger } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import ModalDialog from "../../dialogs/modaldialog.js";

export default class StandaloneOpDirs
{
    constructor(tabs)
    {
        this._log = new Logger("StandaloneOpDirsTab");

        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("op directories", { "icon": "folder", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        this._tab.on("onActivate", this.show);
    }

    show()
    {
        if (!this._tab) return;
        CABLESUILOADER.talkerAPI.send("getProjectOpDirs", {}, (err, r) =>
        {
            if (!err && r.data)
            {
                const html = getHandleBarHtml("tab_standalone_opdirs", { "dirs": r.data });
                this._tab.html(html);

                const listEle = ele.byId("dirlist");
                const infoBlock = listEle.querySelector(".highlightBlock");
                const addButton = this._tab.contentEle.querySelector("#addOpProjectDir");
                if (addButton)
                {
                    addButton.addEventListener("click", () =>
                    {
                        CABLESUILOADER.talkerAPI.send("addProjectOpDir", (dirErr, _dirRes) =>
                        {
                            if (!dirErr)
                            {
                                this.show();
                                this._loadOpsInDirs();
                            }
                            else
                            {
                                new ModalDialog({ "showOkButton": true, "warning": true, "title": "Warning", "text": dirErr.msg });
                                this._log.info(dirErr.msg);
                            }
                        });
                    });
                }

                const packageButton = this._tab.contentEle.querySelector("#addOpPackage");
                if (packageButton)
                {
                    packageButton.addEventListener("click", () =>
                    {
                        CABLESUILOADER.talkerAPI.send("addOpPackage", {}, (dirErr, _dirRes) =>
                        {
                            if (!dirErr)
                            {
                                this.show();
                                this._loadOpsInDirs();
                            }
                            else
                            {
                                new ModalDialog({ "showOkButton": true, "warning": true, "title": "Warning", "text": dirErr.msg });
                                this._log.info(dirErr.msg);
                            }
                        });
                    });
                }

                const removeButtons = this._tab.contentEle.querySelectorAll(".removeOpProjectDir");
                removeButtons.forEach((removeButton) =>
                {
                    removeButton.addEventListener("click", () =>
                    {
                        const dir = removeButton.dataset.dir;
                        CABLESUILOADER.talkerAPI.send("removeProjectOpDir", dir, () =>
                        {
                            this.show();
                            this._loadOpsInDirs();
                        });
                    });
                });
                ele.hide(infoBlock);

                new Sortable(listEle, {
                    "animation": 150,
                    "handle": ".handle",
                    "ghostClass": "ghost",
                    "dragClass": "dragActive",
                    "onEnd": () =>
                    {
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
                                ele.show(infoBlock);
                            }
                            else
                            {
                                infoBlock.classList.remove("info");
                                infoBlock.classList.add("error");
                                infoBlock.innerHTML = orderErr;
                                ele.show(infoBlock);
                            }
                        });
                    }
                });
            }
        });
    }

    _loadOpsInDirs()
    {
        CABLESUILOADER.talkerAPI.send("getOpDocsAll", { "projectId": gui.patchId }, (_err, _data) =>
        {
            if (_err)
            {
                this._log.error("preloading error", _err);
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
            this._log.error("preloading error", response);
        });
    }
}
