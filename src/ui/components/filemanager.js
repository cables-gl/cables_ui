import { Logger, ele, CablesConstants } from "cables-shared-client";
import { utils } from "cables";
import ItemManager from "./tabs/tab_item_manager.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import ModalDialog from "../dialogs/modaldialog.js";
import text from "../text.js";
import { notify, notifyError, notifyWarn } from "../elements/notification.js";
import opNames from "../opnameutils.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { userSettings } from "./usersettings.js";

/**
 * manage files/assets of the patch
 *
 * @export
 * @class FileManager
 */
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

        this._manager.addEventListener("close", () =>
        {
            userSettings.set("fileManagerOpened", false);
            gui.fileManager = null;
        });

        if (platform.frontendOptions.isElectron)
            gui.on("patchsaved", () =>
            {
                if (!ele.byId("filemanagercontainer")) return;
                gui.refreshFileManager();
            });
    }

    show(userInteraction)
    {
        gui.maintabPanel.show(userInteraction);
        gui.maintabPanel.show(true);
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

            gui.fileManager.setFilter("");
        }
        this.updateHeader();
    }

    reload(cb)
    {
        this._manager.clear();

        this._fileSource = this._fileSource || "patch";
        // if (this._firstTimeOpening) this._fileSource = "patch";

        if (gui.isGuestEditor())
        {
            this._buildHtml();
            return;
        }

        const eleContent = ele.byQuery("#item_manager .filelistcontainer");
        if (eleContent)eleContent.innerHTML = "<div class=\"loading\" style=\"margin-top:50px;\"></div>";

        gui.jobs().start({
            "id": "getFileList",
            "title": "Loading file list"
        });

        this._getFilesFromSource(this._fileSource, (files) =>
        {
            if (!files) files = [];
            const patchFiles = files.filter((file) => { return file.projectId && file.projectId === gui.project()._id; });

            this._firstTimeOpening = false;
            this._files = files;

            this._buildHtml();
            if (cb) cb();
            gui.jobs().finish("getFileList");
        });
    }

    _getFilesFromSource(source, cb)
    {
        platform.talkerAPI.send(
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

        const item = {
            "title": file.n,
            "shortTitle": file.n.replaceAll(".", "<wbr>."),
            "id": file._id || "lib" + utils.uuid(),
            "p": file.p,
            "dir": file.d,
            "updated": file.updated,
            "sizeKb": size,
            "size": file.s,
            "file": file,
            "isReference": file.isReference,
            "hasReference": file.hasReference,
            "isLibraryFile": file.isLibraryFile,
            "referenceCount": file.referenceCount,
            "projectId": file.projectId,
            "icon": file.icon || "file"
        };

        if (file.t === "SVG") item.preview = file.p;
        else if (file.t === "image") item.preview = file.p;
        else if (file.t === "dir") item.divider = file.n;

        if (item.preview && FileManager.updatedFiles.indexOf(file.n) > -1) item.preview += "?cb=" + Math.random();

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

        if (this._files.length == 0)
        {
            const els = ele.byQuery("#filemanagercontainer .filelistcontainer");
            if (els)
            {
                let uploadText = "";
                if (platform.frontendOptions.uploadFiles)
                {
                    uploadText = "<br/><br/><br/><br/><div class=\"text-center\">This Patch contains no files yet!<br/><br/>";
                    uploadText += "<a class=\"button-small\" onclick=\"CABLES.CMD.PATCH.uploadFileDialog();\">Upload files</a> or ";
                    uploadText += "use files from our <a class=\"button-small\" onclick=\"gui.fileManager.setSource('lib');\">Library</a>";
                }
                else
                {
                    uploadText = "<br/><br/><br/><br/><div class=\"text-center\">Patch does not use any files, yet!<br/><br/>";
                    uploadText += "<a class=\"button-small\" onclick=\"CABLES.CMD.PATCH.uploadFileDialog();\">Add files</a> or ";
                    uploadText += "drag them onto the patchfiled to use them";
                }
                uploadText += "</div>";
                els.innerHTML = uploadText;
            }
        }
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

    /**
     * @param {string} f
     */
    setFilterType(f)
    {
        this._filterType = f;
        this._buildHtml();
    }

    setSource(s, cb)
    {
        this._fileSource = s;
        this.updateHeader();

        this.reload(cb);
    }

    /**
     * @param {string} filename
     */
    _selectFile(filename)
    {
        this._manager.unselectAll();
        const item = this._manager.getItemByTitleContains(filename);
        if (!item) return;
        this._manager.selectItemById(item.id);
        const el = document.getElementById("item" + item.id);
        if (el) el.scrollIntoView();
    }

    /**
     * @param {string} filename
     */
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

        const item = this._manager.getItemByTitleContains(filename);
        if (item && !item.isLibraryFile) this.setDetail([item]);
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
            const filename = detailItem.file ? detailItem.file.p : null;

            platform.talkerAPI.send(
                "getFileDetails",
                {
                    "projectId": projectId,
                    "fileid": itemId,
                    "filename": filename
                },
                function (err, r)
                {
                    if (r.fileDb) r.ops = opNames.getOpsForFilename(r.fileDb.fileName);
                    if (this._fileSource !== "lib")
                    {
                        let downloadUrl = detailItem.p;
                        if (detailItem.file && detailItem.file.cachebuster) downloadUrl += "?rnd=" + detailItem.file.cachebuster;

                        const editableFiles = CablesConstants.EDITABLE_FILETYPES || [];
                        const editable = !platform.isElectron() && editableFiles.includes(r.type);
                        let assetPath = "";
                        if (r && r.fileDb) assetPath = "/assets/" + r.fileDb.projectId + "/" + r.fileDb.fileName;
                        if (platform.frontendOptions.isElectron) assetPath = r.path;

                        html = getHandleBarHtml("filemanager_details", {
                            "projectId": gui.project()._id,
                            "file": r,
                            "source": this._fileSource,
                            "isEditable": editable,
                            "assetPath": assetPath,
                            "isPlatformCommunity": platform.frontendOptions.hasCommunity,
                            "isReference": detailItem.isReference,
                            "isLibraryFile": detailItem.isLibraryFile,
                            "referenceCount": detailItem.referenceCount,
                            "projectUrl": platform.getCablesUrl() + "/edit/" + detailItem.projectId,
                            "downloadUrl": downloadUrl,
                            "assetPageUrl": platform.getCablesUrl() + "/asset/patches/?filename=" + detailItem.p
                        });
                    }
                    else
                    {
                        // * it's a library file
                        const item = detailItem;

                        const fileParts = item.p.split("/assets/library/");
                        const fileInfoPath = fileParts.length > 1 ? fileParts[1] : "";

                        const fileCategory = fileInfoPath.split("/")[0];
                        const fileName = fileInfoPath.split("/")[1];
                        platform.talkerAPI.send(
                            "getLibraryFileInfo",
                            {
                                "filename": fileName,
                                "fileCategory": fileCategory,
                                "filepath": fileInfoPath
                            },
                            (_err, _r) =>
                            {
                                const itemInfo = _r;

                                let templateName = "filemanager_details_lib";
                                if (itemInfo.type) templateName += "_" + itemInfo.type;
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

                    const copyEle = document.querySelector("*[data-info=filemanager_copy_file_url]");
                    if (copyEle)
                    {
                        copyEle.addEventListener(
                            "click",
                            (e) =>
                            {
                                navigator.clipboard
                                    .writeText(JSON.stringify(r.path))
                                    .then(() =>
                                    {
                                        notify("Copied to clipboard");
                                    })
                                    .catch((copyError) =>
                                    {
                                        notifyWarn("Copied to clipboard failed");
                                        this._log.warn("copy to clipboard failed", copyError);
                                    });
                            });
                    }

                    const editEle = document.querySelector("*[data-info=filemanager_edit_file]");
                    if (editEle)
                    {
                        editEle.addEventListener(
                            "click",
                            (e) =>
                            {
                                let fileName = r.fileDb.fileName;
                                if (platform.frontendOptions.isElectron) fileName = r.path;
                                gui.fileManagerEditor.editAssetTextFile(fileName, r.fileDb.type);
                            });
                    }

                    const delEle = document.getElementById("filedelete" + itemId);
                    if (delEle)
                    {
                        delEle.addEventListener(
                            "click",
                            (e) =>
                            {
                                const loadingModal = gui.startModalLoading("Checking asset dependencies");
                                loadingModal.setTask("Checking patches and ops...");
                                const fullName = "/assets/" + gui.project()._id + "/" + r.fileDb.fileName;
                                platform.talkerAPI.send(
                                    "checkNumAssetPatches",
                                    { "filenames": [fullName] },
                                    (countErr, countRes) =>
                                    {
                                        gui.endModalLoading();
                                        let content = "";
                                        let allowDelete = true;
                                        if (countRes && countRes.data)
                                        {
                                            const otherCount = countRes.data.countPatches ? countRes.data.countPatches - 1 : 0;
                                            if (otherCount)
                                            {
                                                let linkText = otherCount + " other patch";
                                                if (otherCount > 1) linkText += "es";
                                                content += "It is used in <a href=\"" + platform.getCablesUrl() + "/asset/patches/?filename=" + fullName + "\" target=\"_blank\">" + linkText + "</a>";
                                            }
                                            if (countRes.data.countOps)
                                            {
                                                let linkText = countRes.data.countOps + " op";
                                                if (countRes.data.countOps > 1) linkText += "s";
                                                if (otherCount) content += "<br/>";
                                                content += "It is used in <a href=\"" + platform.getCablesUrl() + "/asset/patches/?filename=" + fullName + "\" target=\"_blank\">" + linkText + "</a>";
                                                allowDelete = false;
                                            }
                                        }
                                        else
                                        {
                                            content += "It may be used in other patches.";
                                        }

                                        let title = "Really delete this file?";
                                        let okButton = null;

                                        if (gui.project().summary.visibility == "public")content += "<div class=\"error warning-error warning-error-level2 text-center\"><br/><br/>this asset is in a public patch, please make sure your patch continues to work!<br/><br/><br/></div>";

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
                                                platform.talkerAPI.send(
                                                    "deleteFile",
                                                    { "fileid": r.fileDb._id },
                                                    (errr, rr) =>
                                                    {
                                                        if (rr && rr.success)
                                                        {
                                                            this._manager.removeItem(itemId);
                                                            this.reload();
                                                        }
                                                        else notifyError("Error: Could not delete file. " + errr.msg);
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
                gui.savedState.setUnSaved("filemanager", this._filePortOp.getSubPatch());
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

            html = "<div class=\"text-center\"><br/><br/>" + detailItems.length + " files selected<br/>";
            if (allSize) html += "Size: " + allSize + " kb<br/>";

            html += "<br/>";

            if (this._fileSource == "patch") html += "<a class=\"button\" id=\"filesdeletmulti\">delete " + detailItems.length + " files</a>";
            html += "</div>";

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

                        const loadingModal = gui.startModalLoading("Checking asset dependencies");
                        loadingModal.setTask("Checking patches and ops...");
                        platform.talkerAPI.send(
                            "checkNumAssetPatches",
                            { "filenames": fullNames },
                            (countErr, countRes) =>
                            {
                                gui.endModalLoading();
                                let content = "";
                                let allowDelete = true;
                                let showAssets = false;
                                if (countRes && countRes.data)
                                {
                                    const projectId = gui.project().shortId || gui.project()._id;
                                    if (countRes.data.countPatches > 1)
                                    {
                                        let linkText = countRes.data.countPatches + " other patch";
                                        if (countRes.data.countPatches > 1) linkText += "es";
                                        content += "Some are used in " + linkText;
                                        showAssets = true;
                                    }
                                    if (countRes.data.countOps)
                                    {
                                        let linkText = countRes.data.countPatches + " op";
                                        if (countRes.data.countOps > 1) linkText += "s";
                                        if (countRes.data.countPatches > 1) content += "<br/>";
                                        content += "Some are used in " + linkText;
                                        allowDelete = false;
                                        showAssets = true;
                                    }
                                }
                                else
                                {
                                    content += "They may be used in other patches.";
                                }

                                if (showAssets && countRes.data.assets)
                                {
                                    content += "<br><ul>";
                                    countRes.data.assets.forEach((asset) =>
                                    {
                                        const link = platform.getCablesUrl() + "/asset/patches/?filename=" + asset;
                                        content += "<li>Check usages of <a href='" + link + "' target='_blank'>" + utils.filename(asset) + "</a></li>";
                                    });
                                    content += "</ul>";
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
                                            platform.talkerAPI.send(
                                                "deleteFile",
                                                {
                                                    "fileid": fileId
                                                },
                                                (err, r) =>
                                                {
                                                    if (r.success)
                                                    {
                                                        this._manager.removeItem(fileId);
                                                        this.reload();
                                                    }
                                                    else
                                                    {
                                                        notifyError("error: could not delete file", err);
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
                platform.talkerAPI.send("createFile", { "name": fn }, (err, res) =>
                {
                    if (err)
                    {
                        notifyError("Error: " + err.msg);
                        gui.refreshFileManager();
                        return;
                    }
                    if (res) notify("file created");
                    gui.refreshFileManager();
                });
            }
        });
    }

    /**
     * @param {string} filename
     * @param {string} content
     * @param {Function} cb
     */
    uploadFile(filename, content, cb)
    {
        gui.jobs().finish("uploadfile" + filename);
        gui.jobs().start({ "id": "uploadfile" + filename, "title": "uploading file " + filename });

        platform.talkerAPI.send(
            "fileUploadStr",
            {
                "fileStr": content,
                "filename": filename,
            },
            (err3, res3) =>
            {
                gui.savedState.setSaved("editorOnChangeFile");
                gui.jobs().finish("uploadfile" + filename);
                gui.refreshFileManager();
                if (cb)cb(err3, res3);
            }
        );
    }

    replaceAssetPorts(search, replace, cb = null)
    {
        const ops = gui.corePatch().ops;
        let numPorts = 0;
        for (let i = 0; i < ops.length; i++)
        {
            for (let j = 0; j < ops[i].portsIn.length; j++)
            {
                if (ops[i].portsIn[j].uiAttribs && ops[i].portsIn[j].uiAttribs.display && ops[i].portsIn[j].uiAttribs.display == "file")
                {
                    this._log.log("filename:", ops[i].portsIn[j].get());
                    let v = ops[i].portsIn[j].get();

                    if (v) this._log.log("srch index", v.indexOf(search));
                    if (v && v.indexOf(search) == 0)
                    {
                        numPorts++;
                        this._log.log("found str!");
                        v = replace + v.substring(search.length);
                        ops[i].portsIn[j].set(v);
                        this._log.log("result filename:", v);
                    }
                }
            }
        }
        if (cb) cb(numPorts);
    }

    copyFileToPatch(url, options = null)
    {
        platform.talkerAPI.send("fileConvert", {
            "url": url,
            "converterId": "copytopatch",
            "options": options
        }, (err, res) =>
        {
            if (err)
            {
                if (err.msg === "OVER_QUOTA")
                {
                    notifyError("Over storage quota!");
                }
                else
                {
                    notifyError("Failed to copy file", err.msg);
                }
                gui.opParams.refresh();
                gui.refreshFileManager();
            }
            else
            {
                if (res && res.converterResult && res.converterResult.sourceUrl && res.converterResult.targetUrl)
                {
                    this.replaceAssetPorts(res.converterResult.sourceUrl, res.converterResult.targetUrl, (numPorts) =>
                    {
                        gui.setStateUnsaved();
                        notify("Copied file, updated " + numPorts + " ports");
                        gui.opParams.refresh();
                        gui.refreshFileManager();
                    });
                }
            }

        });
    }

}

FileManager.updatedFiles = [];
