CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.FileManager = function (cb)
{
    this._filterType = null;
    this._manager = new CABLES.UI.ItemManager("Files", gui.mainTabs);
    this._filePortEle = null;
    this._firstTimeOpening = true;
    this._refreshDelay = null;
    this._orderReverse = false;
    this._order = CABLES.UI.userSettings.get("filemanager_order") || "name";
    this._files = [];

    gui.maintabPanel.show();
    CABLES.UI.userSettings.set("fileManagerOpened", true);

    CABLES.DragNDrop.loadImage();

    this._manager.setDisplay(CABLES.UI.userSettings.get("filemanager_display") || "icons");

    this.reload(cb);

    this._manager.addEventListener("onItemsSelected", (items) =>
    {
        this.setDetail(items);
    });

    this._manager.addEventListener("onClose", () =>
    {
        CABLES.UI.userSettings.set("fileManagerOpened", false);
        gui.fileManager = null;
    });
};

CABLES.UI.FileManager.prototype.show = function ()
{
    gui.maintabPanel.show();
};

CABLES.UI.FileManager.prototype.refresh = function ()
{
    clearTimeout(this._refreshDelay);
    this._refreshDelay = setTimeout(() =>
    {
        this.setSource("patch");
    }, 200);
};

CABLES.UI.FileManager.prototype.setFilePort = function (portEle, op, previewEle)
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
};

CABLES.UI.FileManager.prototype.reload = function (cb)
{
    this._manager.clear();
    this._fileSource = this._fileSource || "lib";
    if (this._firstTimeOpening) this._fileSource = "patch";

    if (gui.isGuestEditor())
    {
        this._buildHtml();
        return;
    }

    gui.jobs().start({ "id": "getFileList", "title": "Loading file list" });

    CABLESUILOADER.talkerAPI.send(
        "getFilelist",
        {
            "source": this._fileSource,
        },
        (err, files) =>
        {
            if (err)
            {
                console.error(err);
                return;
            }

            if (!files)files = [];

            if (this._firstTimeOpening && files.length == 0)
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
        },
    );
};

CABLES.UI.FileManager.prototype._createItem = function (items, file, filterType)
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
        shortTitle,
        "id": file._id || "lib" + CABLES.uuid(),
        "p": file.p,
        "date": file.d,
        "dateFromNow": file.dfr,
        "sizeKb": size,
        "size": file.s,
    };

    item.icon = "file";

    if (file.t == "SVG")
    {
        item.preview = file.p;
        item.icon = "pen-tool";
    }
    else if (file.t == "image")
    {
        item.preview = file.p;
        item.icon = "image";
    }
    else if (file.t == "gltf" || file.t == "3d json") item.icon = "cube";
    else if (file.t == "video") item.icon = "film";
    else if (file.t == "font") item.icon = "type";
    else if (file.t == "JSON") item.icon = "code";
    else if (file.t == "audio") item.icon = "headphones";
    else if (file.t == "dir") item.divider = file.n;

    if (!filterType)items.push(item);
    else
    {
        if (this._compareFilter(file, filterType)) items.push(item);

        if (file.t == "dir")
        {
            // subdir has file with correct file type ??
            for (let i = 0; i < file.c.length; i++)
            {
                if (this._compareFilter(file.c[i], filterType))
                // if (file.c[i].t == filterType) //sss
                {
                    items.push(item);
                    break;
                }
            }
        }
    }


    if (file.c) for (let i = 0; i < file.c.length; i++) this._createItem(items, file.c[i], filterType);
};

CABLES.UI.FileManager.prototype._compareFilter = function (file, filterType)
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
};

CABLES.UI.FileManager.prototype._buildHtml = function (o)
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
            return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
        });
    }
    if (this._order == "type")
    {
        this._files.sort(function (a, b)
        {
            return (a.t || "").toLowerCase().localeCompare((b.t || "").toLowerCase());
        });
    }

    if (this._orderReverse) this._files.reverse();

    for (let i = 0; i < this._files.length; i++)
    {
        this._createItem(items, this._files[i], this._filterType);
    }

    this._manager.listHtmlOptions.showHeader = this._fileSource != "lib";
    this._manager.listHtmlOptions.order = this._order;
    this._manager.listHtmlOptions.orderReverse = this._orderReverse;
    this._manager.setItems(items);

    this.updateHeader();
};

CABLES.UI.FileManager.prototype.setFilter = function (f)
{
    this._manager.setTitleFilter(f);
};

CABLES.UI.FileManager.prototype.setOrder = function (o)
{
    if (this._order != o) this._orderReverse = false;
    else this._orderReverse = !this._orderReverse;

    this._order = o;
    CABLES.UI.userSettings.set("filemanager_order", this._order);
    this._buildHtml();
};

CABLES.UI.FileManager.prototype.setFilterType = function (f)
{
    this._filterType = f;
    this._buildHtml();
};

CABLES.UI.FileManager.prototype.setSource = function (s, cb)
{
    this._fileSource = s;
    this.reload(cb);
    this.updateHeader();
};

CABLES.UI.FileManager.prototype._selectFile = function (filename)
{
    this._manager.unselectAll();
    const item = this._manager.getItemByTitleContains(filename);
    if (!item) return;
    this._manager.selectItemById(item.id);
    const el = document.getElementById("item" + item.id);
    if (el) el.scrollIntoView();
};

CABLES.UI.FileManager.prototype.selectFile = function (filename)
{
    if (this._fileSource != "patch")
    {
        if (filename.indexOf(gui.project()._id) > -1)
        {
            this.setSource(
                "patch",
                function ()
                {
                    this._selectFile(filename);
                }.bind(this),
            );
        }
    }
    else
    {
        this._selectFile(filename);
    }
};

CABLES.UI.FileManager.prototype.setDisplay = function (type)
{
    CABLES.UI.userSettings.set("filemanager_display", type);
    this._manager.setDisplay(type);
    this._manager.setItems();
    this.updateHeader();
};

CABLES.UI.FileManager.prototype.updateHeader = function (detailItems)
{
    if (gui.isGuestEditor())
    {
        if (ele.byId("itemmanager_header"))ele.byId("itemmanager_header").innerHTML = (CABLES.UI.TEXTS.guestHint);
        return;
    }


    const html = CABLES.UI.getHandleBarHtml("filemanager_header", {
        "fileSelectOp": this._filePortOp,
        "filterType": this._filterType,
        "source": this._fileSource,
        "display": this._manager.getDisplay(),
        "filter": this._manager.titleFilter

    });
    if (ele.byId("itemmanager_header"))ele.byId("itemmanager_header").innerHTML = (html);

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
            }.bind(this),
        );
    }
    if (elSwitchList)
    {
        elSwitchList.addEventListener(
            "click",
            function ()
            {
            // elSwitchList.classList.add("switch-active");
            // elSwitchIcons.classList.remove("switch-active");
                this.setDisplay("list");
            }.bind(this),
        );
    }
};

CABLES.UI.FileManager.prototype.setDetail = function (detailItems)
{
    let html = "";
    document.getElementById("item_details").innerHTML = "";

    if (detailItems.length == 1)
    {
        const itemId = detailItems[0].id;
        CABLESUILOADER.talkerAPI.send(
            "getFileDetails",
            {
                "fileid": itemId,
            },
            function (err, r)
            {
                if (r.fileDb)r.ops = CABLES.UI.getOpsForFilename(r.fileDb.fileName);
                if (this._fileSource != "lib")
                {
                    html = CABLES.UI.getHandleBarHtml("filemanager_details", {
                        "projectId": gui.project()._id,
                        "file": r,
                        "source": this._fileSource,
                    });
                }
                else
                {
                    // * it's a library file
                    const item = detailItems[0];

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

                            try
                            {
                                // * use file-type specific template
                                html = CABLES.UI.getHandleBarHtml(templateName, {
                                    "filename": item.p,
                                    "file": item,
                                    "fileInfo": itemInfo
                                });
                            }
                            catch (e)
                            {
                                // * use default template
                                html = CABLES.UI.getHandleBarHtml("filemanager_details_lib", {
                                    "filename": item.p,
                                    "file": item,
                                    "fileInfo": itemInfo
                                });
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
                        function (e)
                        {
                            CABLESUILOADER.talkerAPI.send(
                                "deleteFile",
                                { "fileid": r.fileDb._id },
                                function (errr, rr)
                                {
                                    if (rr && rr.success) this._manager.removeItem(itemId);
                                    else CABLES.UI.notifyError("Error: Could not delete file. " + errr.msg);
                                }.bind(this),
                            );
                        }.bind(this),
                    );
                }
            }.bind(this),
        );

        if (this._filePortEle)
        {
            this._filePortEle.value = detailItems[0].p;
            const event = document.createEvent("Event");
            event.initEvent("input", true, true);
            this._filePortEle.dispatchEvent(event);

            if (this._filePortElePreview) this._filePortElePreview.innerHTML =
                "<img class=\"dark\" src=\"" + detailItems[0].p + "\" style=\"max-width:100%;margin-top:10px;\"/>";

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
                function (e)
                {
                    this._manager.unselectAll();

                    for (let i = 0; i < detailItems.length; i++)
                    {
                        const detailItem = detailItems[i];

                        CABLESUILOADER.talkerAPI.send(
                            "deleteFile",
                            {
                                "fileid": detailItem.id,
                            },
                            (err, r) =>
                            {
                                if (r.success)
                                {
                                    this._manager.removeItem(detailItem.id);
                                }
                                else
                                {
                                    CABLES.UI.notifyError("error: could not delete file", err);
                                    console.log(err);
                                }

                                this._manager.unselectAll();
                            },
                            function (r)
                            {
                                console.log("api err", r);
                            },
                        );
                    }
                }.bind(this),
            );
        }
    }
};

CABLES.UI.FileManager.prototype.createFile = function ()
{
    CABLES.UI.MODAL.prompt("Create new file", "Enter filename", "newfile.txt", function (fn)
    {
        CABLESUILOADER.talkerAPI.send("createFile", { "name": fn }, (err, res) =>
        {
            if (err)
            {
                CABLES.UI.notifyError("Error: " + err.msg);
                console.log("[createfile]", res);
                gui.refreshFileManager();
                return;
            }
            CABLES.UI.notify("file created");
            gui.refreshFileManager();
        });
    });
};
