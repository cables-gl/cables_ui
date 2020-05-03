// http://html5doctor.com/drag-and-drop-to-server/

var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.handleFileInputUpload = function (files)
{
    CABLES.uploadFiles(files);
    gui.showFileManager();
};

CABLES.uploadSelectFile = function ()
{
    CABLES.CMD.PATCH.uploadFile();
};

CABLES.uploadDragOver = function (event)
{
    CABLES.uploadDropEvent = event.originalEvent;

    if (CABLES.DragNDrop.internal)
    {
        console.log("cancel because internal");
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const el = document.getElementById("uploadarea");
    if (el)
    {
        if (event.target.classList.contains("uploadarea")) el.classList.add("uploadareaActive");
        else el.classList.remove("uploadareaActive");
    }

    let openDialog = true;

    if (el) openDialog = window.getComputedStyle(el).display === "none";
    if (openDialog) CABLES.CMD.PATCH.uploadFileDialog();

    jQuery.event.props.push("dataTransfer");
};

CABLES.uploadDragLeave = function (event)
{
    $(this).removeClass("dragging");

    event.preventDefault();
    event.stopPropagation();
};


CABLES.uploadFile = function (file)
{
    const reader = new FileReader();
    reader.addEventListener("load",
        () =>
        {
            CABLESUILOADER.talkerAPI.send("fileUploadStr",
                {
                    "fileStr": reader.result,
                    "filename": file.name,
                },
                function (err, res)
                {
                    console.log("file uploaded!");
                });
        }, false);
    reader.readAsDataURL(file);
};

CABLES.uploadFiles = function (files)
{
    gui.jobs().start({ "id": "prepareuploadfiles", "title": "preparing files for upload..." });

    for (let i = 0; i < files.length; i++)
        CABLES.uploadFile(files[i]);

    gui.jobs().finish("prepareuploadfiles");
};

CABLES.uploadDropEvent = null;

CABLES.uploadDrop = function (event)
{
    event.preventDefault();
    event.stopPropagation();

    CABLES.UI.MODAL.hide();

    if (event.dataTransfer.files.length === 0)
    {
        console.log("no files to upload...");
        return;
    }
    const files = event.dataTransfer.files;

    CABLES.uploadFiles(files);
};

CABLES.bindUploadDragNDrop = function ()
{
    $("body").on("drop", CABLES.uploadDrop);
    $("body").on("dragover", CABLES.uploadDragOver);
    $("body").on("dragleave", CABLES.uploadDragLeave);
};

CABLES.unBindUploadDragNDrop = function ()
{
    $("body").off("drop", CABLES.uploadDrop);
    $("body").off("dragover", CABLES.uploadDragOver);
    $("body").off("dragleave", CABLES.uploadDragLeave);
};

CABLES.bindUploadDragNDrop();
