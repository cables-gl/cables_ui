// http://html5doctor.com/drag-and-drop-to-server/
import { Logger } from "cables-shared-client";
import { notifyError } from "../elements/notification.js";
import FileManager from "../components/filemanager.js";


/**
 * file upload dialog
 *
 * @export
 * @class FileUploader
 */
export default class FileUploader
{
    constructor()
    {
        this._log = new Logger("fileuploader");

        this._uploadDropEvent = null;
        this._uploadDropListener = this.uploadDrop.bind(this);
        this._uploadDragOverListener = this.uploadDragOver.bind(this);
        this._uploadDragLeaveListener = this.uploadDragLeave.bind(this);

        this.bindUploadDragNDrop();
    }

    bindUploadDragNDrop()
    {
        document.body.addEventListener("drop", this._uploadDropListener);
        document.body.addEventListener("dragover", this._uploadDragOverListener);
        document.body.addEventListener("dragleave", this._uploadDragLeaveListener);
    }

    unBindUploadDragNDrop()
    {
        document.body.removeEventListener("drop", this._uploadDropListener);
        document.body.removeEventListener("dragover", this._uploadDragOverListener);
        document.body.removeEventListener("dragleave", this._uploadDragLeaveListener);
    }

    uploadDragOver(event)
    {
        if (gui.isRemoteClient) return;

        this._uploadDropEvent = event.originalEvent;

        if (event.dataTransfer.types.indexOf("Files") == -1)
        {
            console.log("drag has no files...");
            return;
        }

        if (CABLES.DragNDrop.internal)
        {
            this._log.error("cancel because internal");
            return;
        }

        event.preventDefault();
        event.stopPropagation();


        if (CABLES.platform.frontendOptions.uploadFiles)
        {
            const el = document.getElementById("uploadarea");
            if (el)
            {
                if (event.target.classList.contains("uploadarea")) el.classList.add("uploadareaActive");
                else el.classList.remove("uploadareaActive");
            }

            let openDialog = true;

            if (el) openDialog = window.getComputedStyle(el).display === "none";
            if (openDialog) CABLES.CMD.PATCH.uploadFileDialog();
        }
    }

    uploadDragLeave(event)
    {
        event.preventDefault();
        event.stopPropagation();
    }


    uploadFile(file, filename)
    {
        if (gui.isRemoteClient) return;


        if (CABLES.platform.frontendOptions.uploadFiles)
        {
            const reader = new FileReader();

            reader.addEventListener("load",
                () =>
                {
                    CABLESUILOADER.talkerAPI.send("fileUploadStr",
                        {
                            "fileStr": reader.result,
                            "filename": filename || file.name,
                        },
                        (err, res) =>
                        {
                            if (err) notifyError("ERROR: fileUploadStr " + err.msg || "Unknown error");

                            FileManager.updatedFiles.push(filename || file.name);
                        });
                },
                false);
            reader.readAsDataURL(file);
        }


        if (CABLES.platform.frontendOptions.dragDropLocalFiles)
        {
            const assetPath = CABLES.platform.getPrefixAssetPath();
            let finalPath = "file://" + file.path;
            if (file.path.startsWith(assetPath))
            {
                finalPath = file.path.replace(assetPath, "./");
            }
            finalPath = finalPath.replaceAll("\\", "/");
            gui.patchView.addAssetOpAuto(finalPath, this._uploadDropEventOrig);
        }
    }

    handleFileInputReUpload(files)
    {
        if (!window.gui) return;
        if (gui.isRemoteClient) return;

        gui.jobs().start({ "id": "prepareuploadfiles", "title": "preparing files for upload..." });


        if (files.length > 0)
        {
            console.log("upload as", files[0].name, CABLES.reuploadName);

            const partsNew = files[0].name.split(".");
            const partsOld = CABLES.reuploadName.split(".");

            if (partsNew[partsNew.length - 1] != partsOld[partsOld.length - 1])
            {
                notifyError("ERROR: different file ending " + partsNew[partsNew.length - 1] + "/" + partsOld[partsOld.length - 1]);
            }
            else
            {
                this.uploadFile(files[0], CABLES.reuploadName);
            }
        }

        gui.jobs().finish("prepareuploadfiles");
    }

    uploadFiles(files)
    {
        if (!window.gui) return;
        if (gui.isRemoteClient) return;

        gui.jobs().start({ "id": "prepareuploadfiles", "title": "preparing files for upload..." });

        for (let i = 0; i < files.length; i++)
            this.uploadFile(files[i]);

        gui.jobs().finish("prepareuploadfiles");
    }


    uploadDrop(event)
    {
        if (event.dataTransfer.files.length === 0)
        {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        if (gui.isRemoteClient) return;

        this._uploadDropEventOrig = event;

        gui.closeModal();


        const files = event.dataTransfer.files;

        this.uploadFiles(files);
    }

    handleFileInputUpload(files)
    {
        this.uploadFiles(files);
    }
}
