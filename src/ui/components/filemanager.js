import ele from "../utils/ele";
import Logger from "../utils/logger";
import ItemManager from "./tabs/tab_item_manager";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";
import text from "../text";
import userSettings from "./usersettings";
import ModalLoading from "../dialogs/modalloading";

export default class FileManager
{
    constructor(cb, userInteraction)
    {
        this._log = new Logger("filemanager");
        this._filterType = null;
        this._manager = new ItemManager("Files", gui.mainTabs);
        this._filePortEle = null;
        this._firstTimeOpening = true;
        this._refreshDelay = null;
        this._orderReverse = false;
        this._order = userSettings.get("filemanager_order") || "name";
        this._files = [];

        gui.maintabPanel.show(userInteraction);
        userSettings.set("fileManagerOpened", true);

        CABLES.DragNDrop.loadImage();

        this._manager.setDisplay(userSettings.get("filemanager_display") || "icons");

        this.reload(cb);

        this._manager.addEventListener("onItemsSelected", (items) =>
        {
            this.setDetail(items);
        });

        this._manager.addEventListener("onClose", () =>
        {
            userSettings.set("fileManagerOpened", false);
            gui.fileManager = null;
        });
    }

    show(userInteraction)
    {
        gui.maintabPanel.show(userInteraction);
    }

    refresh()
    {
        clearTimeout(this._refreshDelay);
        this._refreshDelay = setTimeout(() =>
        {
            this.setSource("patch");
        }, 200);
    }

    setFilePort(portEle, op, previewEle)
    {
        if (!portEle)
        {
            this._filePortElePreview = null;
            this._filePortEle = null;
            this._filePortOp = null;

            if (this._filterType)
            {
                this._filterType = null;
                this._buildHtml();
            }
        }
        else
        {
            this._filePortElePreview = previewEle;
            this._filePortEle = portEle;
            this._filePortOp = op;
        }
        this.updateHeader();
    }

    reload(cb)
    {
        this._manager.clear();

        this._fileSource = this._fileSource || "lib";
        if (this._firstTimeOpening) this._fileSource = "patch";

        if (gui.isGuestEditor())
        {
            this._buildHtml();
            return;
        }

        gui.jobs().start({
            "id": "getFileList",
            "title": "Loading file list"
        });

        this._getFilesFromSource(this._fileSource, (files) =>
        {
            if (!files) files = [];
            const patchFiles = files.filter((file) => { return file.projectId && file.projectId === gui.project()._id; });
            if (this._firstTimeOpening && patchFiles.length === 0)
            {
                this._firstTimeOpening = false;
                this._fileSource = "lib";
                this.reload(cb);
                return;
            }

            this._firstTimeOpening = false;
            this._files = files;

            this._buildHtml();

            if (cb) cb();

            gui.jobs().finish("getFileList");
        });
    }

    _getFilesFromSource(source, cb)
    {
        CABLESUILOADER.talkerAPI.send(
            "getFilelist",
            {
                "source": source
            },
            (err, remoteFiles) =>
            {
                if (err)
                {
                    this._log.error(err);
                    cb([]);
                }
                else
                {
                    if (cb) cb(remoteFiles);
                }
            }
        );
    }

    _createItem(items, file, filterType)
    {
        let size = "";

        if (file.s) size = Math.ceil(file.s / 1024) + " kb";

        let shortTitle = file.n;
        if (shortTitle.length > 24)
        {
            shortTitle = shortTitle.substr(0, 24);
            shortTitle += "...";
        }

        const item = {
            "title": file.n,
            "shortTitle": shortTitle,
            "id": file._id || "lib" + CABLES.uuid(),
            "p": file.p,
            "date": file.d,
            "sizeKb": size,
            "size": file.s,
            "file": file,
            "isReference": file.isReference,
            "hasReference": file.hasReference,
            "viaBlueprint": file.viaBlueprint,
            "isLibraryFile": file.isLibraryFile,
            "referenceCount": file.referenceCount,
            "projectId": file.projectId,
            "icon": file.icon || "file"
        };

        if (file.t === "SVG") item.preview = file.p;
        else if (file.t === "image") item.preview = file.p;
        else if (file.t === "dir") item.divider = file.n;

        if (!filterType) items.push(item);
        else
        {
            if (this._compareFilter(file, filterType)) items.push(item);

            if (file.t == "dir")
            {
                // subdir has file with correct file type ??
                for (let i = 0; i < file.c.length; i++)
                {
                    if (this._compareFilter(file.c[i], filterType))
                    {
                        items.push(item);
                        break;
                    }
                }
            }
        }


        if (file.c) for (let i = 0; i < file.c.length; i++) this._createItem(items, file.c[i], filterType);
    }

    _compareFilter(file, filterType)
    {
        if (typeof filterType == "string")
        {
            if (filterType === file.t) return true;
        }
        else
        {
            if (Array.isArray(filterType))
            {
                for (let i = 0; i < filterType.length; i++)
                {
                    if (file.n.toLowerCase().indexOf(filterType[i].toLowerCase()) > 0) return true;
                }
            }
        }
        return false;
    }

    _buildHtml(o)
    {
        const items = [];

        if (!this._files) this._files = [];

        if (this._order == "size")
        {
            this._files.sort(function (a, b)
            {
                return a.s - b.s;
            });
        }
        if (this._order == "date")
        {
            this._files.sort(function (a, b)
            {
                return b.d - a.d;
            });
        }
        if (this._order == "name")
        {
            this._files.sort(function (a, b)
            {
                return (a.name || "").toLowerCase()
                    .localeCompare((b.name || "").toLowerCase());
            });
        }
        if (this._order == "type")
        {
            this._files.sort(function (a, b)
            {
                return (a.t || "").toLowerCase()
                    .localeCompare((b.t || "").toLowerCase());
            });
        }

        if (this._orderReverse) this._files.reverse();

        for (let i = 0; i < this._files.length; i++)
        {
            this._createItem(items, this._files[i], this._filterType);
        }

        this._manager.listHtmlOptions.showHeader = this._fileSource !== "lib";
        this._manager.listHtmlOptions.order = this._order;
        this._manager.listHtmlOptions.orderReverse = this._orderReverse;
        this._manager.setItems(items);

        this.updateHeader();
    }

    setFilter(f)
    {
        this._manager.setTitleFilter(f);
    }

    setOrder(o)
    {
        if (this._order != o) this._orderReverse = false;
        else this._orderReverse = !this._orderReverse;

        this._order = o;
        userSettings.set("filemanager_order", this._order);
        this._buildHtml();
    }

    setFilterType(f)
    {
        this._filterType = f;
        this._buildHtml();
    }

    setSource(s, cb)
    {
        this._fileSource = s;
        this.reload(cb);
        this.updateHeader();
    }

    _selectFile(filename)
    {
        this._manager.unselectAll();
        const item = this._manager.getItemByTitleContains(filename);
        if (!item) return;
        this._manager.selectItemById(item.id);
        const el = document.getElementById("item" + item.id);
        if (el) el.scrollIntoView();
    }

    selectFile(filename)
    {
        if (this._fileSource === "patch")
        {
            this._selectFile(filename);
        }
        else
        {
            if (filename.indexOf(gui.project()._id) > -1)
            {
                this.setSource(
                    "patch",
                    () =>
                    {
                        this._selectFile(filename);
                    }
                );
            }
        }
        gui.maintabPanel.show(true);
    }

    setDisplay(type)
    {
        userSettings.set("filemanager_display", type);
        this._manager.setDisplay(type);
        this._manager.setItems();
        this.updateHeader();
    }

    updateHeader(detailItems)
    {
        if (gui.isGuestEditor())
        {
            if (ele.byId("itemmanager_header")) ele.byId("itemmanager_header").innerHTML = (text.guestHint);
            return;
        }


        const html = getHandleBarHtml("filemanager_header", {
            "fileSelectOp": this._filePortOp,
            "filterType": this._filterType,
            "source": this._fileSource,
            "display": this._manager.getDisplay(),
            "filter": this._manager.titleFilter

        });
        if (ele.byId("itemmanager_header")) ele.byId("itemmanager_header").innerHTML = (html);

        const elSwitchIcons = document.getElementById("switch-display-icons");
        const elSwitchList = document.getElementById("switch-display-list");

        if (elSwitchIcons)
        {
            elSwitchIcons.addEventListener(
                "click",
                function ()
                {
                    // elSwitchIcons.classList.add("switch-active");
                    // elSwitchList.classList.remove("switch-active");
                    this.setDisplay("icons");
                }.bind(this)
            );
        }
        if (elSwitchList)
        {
            elSwitchList.addEventListener(
                "click",
                () =>
                {
                    // elSwitchList.classList.add("switch-active");
                    // elSwitchIcons.classList.remove("switch-active");
                    this.setDisplay("list");
                }
            );
        }
    }

    setDetail(detailItems)
    {
        let html = "";
        document.getElementById("item_details").innerHTML = "";

        if (detailItems.length === 1)
        {
            const detailItem = detailItems[0];
            const itemId = detailItem.id;
            let projectId = gui.project()._id;
            if (detailItem.isReference && detailItem.file) projectId = detailItem.file.projectId;

            CABLESUILOADER.talkerAPI.send(
                "getFileDetails",
                {
                    "projectId": projectId,
                    "fileid": itemId
                },
                function (err, r)
                {
                    if (r.fileDb) r.ops = CABLES.UI.getOpsForFilename(r.fileDb.fileName);
                    if (this._fileSource !== "lib")
                    {
                        if (detailItem.isReference)
                        {
                            delete r.converters;
                        }
                        let downloadUrl = detailItem.p;
                        if (detailItem.file && detailItem.file.cachebuster) downloadUrl += "?rnd=" + detailItem.file.cachebuster;

                        html = getHandleBarHtml("filemanager_details", {
                            "projectId": gui.project()._id,
                            "file": r,
                            "source": this._fileSource,
                            "isReference": detailItem.isReference,
                            "viaBlueprint": detailItem.viaBlueprint,
                            "isLibraryFile": detailItem.isLibraryFile,
                            "referenceCount": detailItem.referenceCount,
                            "projectUrl": CABLES.sandbox.getCablesUrl() + "/edit/" + detailItem.projectId,
                            "downloadUrl": downloadUrl,
                            "assetPageUrl": CABLES.sandbox.getCablesUrl() + "/asset/patches/?filename=" + detailItem.p
                        });
                    }
                    else
                    {
                        // * it's a library file
                        const item = detailItem;

                        const fileInfoPath = item.p.substring("/assets/library/".length);

                        const fileCategory = fileInfoPath.split("/")[0];
                        const fileName = fileInfoPath.split("/")[1];
                        CABLESUILOADER.talkerAPI.send(
                            "getLibraryFileInfo",
                            {
                                "filename": fileName,
                                "fileCategory": fileCategory,
                                "filepath": fileInfoPath
                            },
                            (_err, _r) =>
                            {
                                const itemInfo = _r;
                                const templateName = "filemanager_details_lib_" + itemInfo.type;
                                const templateOptions = {
                                    "filename": item.p,
                                    "file": item,
                                    "fileInfo": itemInfo
                                };

                                try
                                {
                                    // * use file-type specific template
                                    html = getHandleBarHtml(templateName, templateOptions);
                                }
                                catch (e)
                                {
                                    // * use default template
                                    html = getHandleBarHtml("filemanager_details_lib", templateOptions);
                                }

                                if (document.getElementById("item_details"))
                                    document.getElementById("item_details").innerHTML = html;
                            }
                        );
                    }

                    if (document.getElementById("item_details"))
                        document.getElementById("item_details").innerHTML = html;

                    const delEle = document.getElementById("filedelete" + itemId);
                    if (delEle)
                    {
                        delEle.addEventListener(
                            "click",
                            (e) =>
                            {
                                const loadingModal = new ModalLoading("Checking asset dependencies");
                                loadingModal.setTask("Checking patches and ops...");
                                const fullName = "/assets/" + gui.project()._id + "/" + r.fileDb.fileName;
                                CABLESUILOADER.talkerAPI.send(
                                    "checkNumAssetPatches",
                                    { "filenames": [fullName] },
                                    (countErr, countRes) =>
                                    {
                                        loadingModal.close();
                                        let content = "";
                                        let allowDelete = true;
                                        if (countRes && countRes.data)
                                        {
                                            const otherCount = countRes.data.countPatches ? countRes.data.countPatches - 1 : 0;
                                            if (otherCount)
                                            {
                                                let linkText = otherCount + " other patch";
                                                if (otherCount > 1) linkText += "es";
                                                content += "It is used in <a href=\"" + CABLES.sandbox.getCablesUrl() + "/asset/patches/?filename=" + fullName + "\" target=\"_blank\">" + linkText + "</a>";
                                                if (countRes.data.viaBlueprint) content += ". " + countRes.data.viaBlueprint + " times via blueprint.";
                                            }
                                            if (countRes.data.countOps)
                                            {
                                                let linkText = countRes.data.countOps + " op";
                                                if (countRes.data.countOps > 1) content += "s";
                                                content += "It is used in <a href=\"" + CABLES.sandbox.getCablesUrl() + "/asset/patches/?filename=" + fullName + "\" target=\"_blank\">" + linkText + "</a>";
                                                if (countRes.data.viaBlueprint) content += ". " + countRes.data.viaBlueprint + " times via blueprint.";
                                                allowDelete = false;
                                            }
                                        }
                                        else
                                        {
                                            content += "It may be used in other patches.";
                                        }

                                        let title = "Really delete this file?";
                                        let okButton = null;
                                        if (!allowDelete)
                                        {
                                            title = "You cannot delete this file!";
                                        }
                                        else
                                        {
                                            okButton = {
                                                "text": "Really delete",
                                                "cssClasses": "redbutton"
                                            };
                                        }

                                        const options = {
                                            "title": title,
                                            "html": content,
                                            "warning": true,
                                            "choice": allowDelete,
                                            "okButton": okButton
                                        };

                                        const modal = new ModalDialog(options);
                                        if (allowDelete)
                                        {
                                            modal.on("onSubmit", () =>
                                            {
                                                CABLESUILOADER.talkerAPI.send(
                                                    "deleteFile",
                                                    { "fileid": r.fileDb._id },
                                                    (errr, rr) =>
                                                    {
                                                        if (rr && rr.success) this._manager.removeItem(itemId);
                                                        else CABLES.UI.notifyError("Error: Could not delete file. " + errr.msg);
                                                    }
                                                );
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    }
                }.bind(this)
            );

            if (this._filePortEle)
            {
                gui.setStateUnsaved();
                this._filePortEle.value = detailItems[0].p;
                const event = document.createEvent("Event");
                event.initEvent("input", true, true);
                this._filePortEle.dispatchEvent(event);

                if (detailItems[0].t == "image" || detailItems[0].icon == "image")
                    if (this._filePortElePreview)
                        this._filePortElePreview.innerHTML = "<img class=\"dark\" src=\"" + detailItems[0].p + "\" style=\"max-width:100%;margin-top:10px;\"/>";

                gui.opParams.show(this._filePortOp);
            }
        }
        else if (detailItems.length > 1)
        {
            let allSize = 0;
            for (let i = 0; i < detailItems.length; i++) allSize += detailItems[i].size;

            if (allSize) allSize = Math.ceil(allSize / 1024);

            html = "<center><br/><br/>" + detailItems.length + " files selected<br/>";
            if (allSize) html += "Size: " + allSize + " kb<br/>";

            html += "<br/>";

            if (this._fileSource == "patch") html += "<a class=\"button\" id=\"filesdeletmulti\">delete " + detailItems.length + " files</a>";
            html += "</center>";

            document.getElementById("item_details").innerHTML = html;

            const elDelMulti = document.getElementById("filesdeletmulti");
            if (elDelMulti)
            {
                elDelMulti.addEventListener(
                    "click",
                    (e) =>
                    {
                        const selectedItems = this._manager.getSelectedItems();
                        this._manager.unselectAll();

                        const selectedFileIds = [];
                        const fullNames = [];
                        for (let i = 0; i < selectedItems.length; i++)
                        {
                            const detailItem = selectedItems[i];
                            selectedFileIds.push(detailItem.id);
                            fullNames.push(detailItem.p);
                        }

                        const loadingModal = new ModalLoading("Checking asset dependencies");
                        loadingModal.setTask("Checking patches and ops...");
                        CABLESUILOADER.talkerAPI.send(
                            "checkNumAssetPatches",
                            { "filenames": fullNames },
                            (countErr, countRes) =>
                            {
                                loadingModal.close();
                                let content = "";
                                let allowDelete = true;
                                if (countRes && countRes.data)
                                {
                                    const projectId = gui.project().shortId || gui.project()._id;
                                    if (countRes.data.countPatches > 1)
                                    {
                                        let linkText = countRes.data.countPatches + " other patch";
                                        if (countRes.data.countPatches > 1) linkText += "es";
                                        content += "They are used in <a href=\"" + CABLES.sandbox.getCablesUrl() + "/asset/dependencies/" + projectId + "\" target=\"_blank\">" + linkText + "</a>";
                                    }
                                    if (countRes.data.countOps)
                                    {
                                        let linkText = countRes.data.countPatches + " op";
                                        if (countRes.data.countPatches > 1) linkText += "s";
                                        content += "They are used in <a href=\"" + CABLES.sandbox.getCablesUrl() + "/asset/dependencies/" + projectId + "\" target=\"_blank\">" + linkText + "</a>";
                                        allowDelete = false;
                                    }
                                }
                                else
                                {
                                    content += "They may be used in other patches.";
                                }

                                let title = "Really delete " + selectedFileIds.length + " files?";
                                if (!allowDelete)
                                {
                                    title = "You cannot delete all of these files!";
                                }

                                const options = {
                                    "title": title,
                                    "html": content,
                                    "warning": true,
                                    "choice": allowDelete,
                                    "okButton": {
                                        "text": "Really delete",
                                        "cssClasses": "redbutton"
                                    }
                                };

                                const modal = new ModalDialog(options);
                                if (allowDelete)
                                {
                                    modal.on("onSubmit", () =>
                                    {
                                        selectedFileIds.forEach((fileId) =>
                                        {
                                            CABLESUILOADER.talkerAPI.send(
                                                "deleteFile",
                                                {
                                                    "fileid": fileId
                                                },
                                                (err, r) =>
                                                {
                                                    if (r.success)
                                                    {
                                                        this._manager.removeItem(fileId);
                                                    }
                                                    else
                                                    {
                                                        CABLES.UI.notifyError("error: could not delete file", err);
                                                        this._log.warn(err);
                                                    }

                                                    this._manager.unselectAll();
                                                },
                                                (r) =>
                                                {
                                                    this._log.warn("api err", r);
                                                }
                                            );
                                        });
                                    });
                                }
                            }
                        );
                    }
                );
            }
        }
    }

    createFile()
    {
        new ModalDialog({
            "prompt": true,
            "title": "Create new file",
            "text": "Enter filename",
            "promptValue": "newfile.txt",
            "promptOk": (fn) =>
            {
                CABLESUILOADER.talkerAPI.send("createFile", { "name": fn }, (err, res) =>
                {
                    if (err)
                    {
                        CABLES.UI.notifyError("Error: " + err.msg);
                        gui.refreshFileManager();
                        return;
                    }
                    CABLES.UI.notify("file created");
                    gui.refreshFileManager();
                });
            }
        });
    }
}
