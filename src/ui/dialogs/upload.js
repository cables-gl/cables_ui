// http://html5doctor.com/drag-and-drop-to-server/
import { Logger } from "cables-shared-client";
import { notifyError } from "../elements/notification.js";
import FileManager from "../components/filemanager.js";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

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

    /**
     * @param {DragEvent} event
     */
    uploadDragOver(event)
    {
        if (gui.isRemoteClient) return;

        this._uploadDropEvent = event.originalEvent;

        if (!event || !event.dataTransfer || event.dataTransfer.types.indexOf("Files") == -1)
        {
            this._log.log("drag has no files...");
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (platform.frontendOptions.uploadFiles)
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

    /**
     * @param {File} file
     * @param {String} [filename]
     * @param {String} [opId]
     * @param {function} [next]
     */
    uploadFile(file, filename = null, opId = null, next = null)
    {
        if (gui.isRemoteClient) return;

        if (platform.frontendOptions.uploadFiles || CABLES.reuploadName) // allow reupload in electron via `|| CABLES.reuploadName`
        {
            CABLES.reuploadName = null;
            const reader = new FileReader();

            let uploadFileName = filename || file.name;
            reader.addEventListener("load",
                () =>
                {
                    const talkerCommand = opId ? "uploadFileToOp" : "fileUploadStr";
                    platform.talkerAPI.send(talkerCommand,
                        {
                            "fileStr": reader.result,
                            "filename": uploadFileName,
                            "opId": opId
                        },
                        (err, res) =>
                        {
                            let newFilename = uploadFileName;
                            if (res && res.filename) newFilename = res.filename;

                            if (err)
                            {
                                if (err.msg === "FAILED_PARSE_DATAURI")
                                {
                                    const modalOptions = {
                                        "title": "Error uploading files",
                                        "choice": true,
                                        "okButton": {
                                            "text": "Try different method"
                                        }
                                    };
                                    const modal = new ModalDialog(modalOptions);
                                    modal.on("onSubmit", () =>
                                    {
                                        CABLES.CMD.PATCH.uploadFileTab();
                                    });
                                }
                                else
                                {
                                    notifyError("ERROR: fileUploadStr " + err.msg || "Unknown error");
                                    FileManager.updatedFiles.push(newFilename);
                                }
                            }
                            else
                            {
                                FileManager.updatedFiles.push(newFilename);
                            }
                            if (next) next(err, newFilename);
                        });
                },
                false);
            reader.readAsDataURL(file);
        }
        else if (platform.frontendOptions.dragDropLocalFiles)
        {
            const assetPath = platform.getPrefixAssetPath();
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

    /**
     * @param {string} [opName]
     */
    uploadFiles(files, opName)
    {
        if (!window.gui) return;
        if (gui.isRemoteClient) return;

        gui.jobs().start({ "id": "prepareuploadfiles", "title": "preparing files for upload..." });

        for (let i = 0; i < files.length; i++)
        {
            this.uploadFile(files[i], files[i].name, opName);
        }

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

/**
 * @type {FileUploader}
 */
const fileUploader = new FileUploader();
CABLES.fileUploader = fileUploader;
export { fileUploader };
