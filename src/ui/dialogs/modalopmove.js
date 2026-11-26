import { ele } from "cables-shared-client";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import { getHandleBarHtml } from "../utils/handlebars.js";

/**
 * @callback ModalOpMoveCallback
 * @param {String} targetDir
 */

export class ModalOpMove
{

    /** @type String */
    #opName;

    /** @type String */
    #opId;

    /** @type String */
    #currentDir;

    /** @type ModalOpMoveCallback */
    #callback;

    /** @type HTMLSelectElement */
    #selectEle;

    /**
     * @param {String} opName
     * @param {String} opId
     * @param {String} currentDir
     * @param {import("cables-shared-client").OpDirInfo[]} opDirs
     * @param {ModalOpMoveCallback} callback
     */
    constructor(opName, opId, currentDir, opDirs, callback)
    {
        this.#opName = opName;
        this.#opId = opId;
        this.#currentDir = currentDir;
        this.#callback = callback;

        new ModalDialog({
            "title": "Move op",
            "html": this.#getHtml(opDirs),
            "choice": true,
            "okButton": {
                "text": "Move",
                "disabled": true,
                "callback": (close) =>
                {
                    const targetDir = this.#selectEle.value;
                    if (targetDir === this.#currentDir) return;
                    close();
                    gui.serverOps.rename(this.#opName, this.#opName, (err) =>
                    {
                        if (err)
                        {
                            new ModalDialog({ "warning": true, "title": "Could not move op", "text": err });
                        }
                        else
                        {
                            if (this.#callback) this.#callback(targetDir);
                        }
                    }, targetDir, this.#opId);
                }
            },
            "cancelButton": { "text": "Cancel" }
        });

        this.#selectEle = ele.byId("moveOpTargetDir");
        this.#selectEle.addEventListener("change", () =>
        {
            const unchanged = this.#selectEle.value === this.#currentDir;
            const okEle = ele.byId(ModalDialog.MODAL_CHOICE_OK_BUTTON_ID);
            if (okEle)
            {
                okEle.classList.toggle("button-disabled", unchanged);
                okEle.classList.toggle("button-inactive", unchanged);
            }
        });
    }

    /**
     * @param {import("cables-shared-client").OpDirInfo[]} [opDirs]
     * @returns {String}
     */
    #getHtml(opDirs = [])
    {
        return getHandleBarHtml("dialog_moveop", {
            "opName": this.#opName,
            "currentDir": this.#currentDir,
            "opDirs": opDirs
        });
    }
}
