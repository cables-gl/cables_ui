import { TalkerAPI } from "cables-shared-client";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

export default class ModalOpNotFound
{

    /** @type ModalDialog */
    #modal;

    /** @type Function */
    #cb;

    /**
     *
     * @param {String} opIdentifier
     * @param {String} oldName
     * @param {import("../api/opsserver.js").OpNotFoundApiError} [apiError]
     * @param {Function} [cb]
     */
    constructor(opIdentifier, oldName, apiError = null, cb = null)
    {
        this.#cb = cb;

        let title = "Failed to load op";
        let otherEnvName = "dev.cables.gl";
        const project = gui.project();
        let editorLink = "";
        if (project) editorLink = "https://" + otherEnvName + "/edit/" + project.shortId;
        let otherEnvButton = "Try " + otherEnvName;
        let errMsg = "";
        let opLinks = [];
        let hideEnvButton = !platform.frontendOptions.suggestOtherEnvironmentsForOps;
        if (apiError && apiError.data)
        {
            if (apiError.data.text) errMsg = apiError.data.text;
            if (apiError.data.otherEnvName)
            {
                otherEnvButton = "Try " + apiError.data.otherEnvName;
            }
            if (apiError.data.ops)
            {
                for (let i = 0; i < apiError.data.ops.length; i++)
                {
                    const op = apiError.data.ops[i];
                    opLinks.push("Found <a href=\"https://" + op.env + "/op/" + op.name + "\">" + op.name + "</a> on <a href=\"https://" + op.env + "/edit/" + project.shortId + "\">" + op.env + "</a>");
                }
            }
            if (apiError.data.otherEnvUrl && project) editorLink = apiError.data.otherEnvUrl + "/edit/" + project.shortId;
            if (apiError.data.otherEnvButton) otherEnvButton = apiError.data.otherEnvButton;
            if (apiError.data.editorLink) editorLink = apiError.data.editorLink;
            if (apiError.data.hideEnvButton) hideEnvButton = true;
        }
        if (!editorLink)
        {
            hideEnvButton = true;
        }
        else
        {
            const opText = oldName || opIdentifier;
            if (!opLinks.includes(opText)) opLinks.push(opText);
        }

        const modalOptions = {
            "title": title,
            "text": errMsg,
            "notices": opLinks,
            "choice": true
        };

        if (!hideEnvButton)
        {
            modalOptions.okButton = {
                "text": "Continue loading",
                "callback": this.#continueLoadingCallback.bind(this)
            };
            modalOptions.cancelButton = { "text": otherEnvButton, "callback": () => { this.#tryOtherEnvCallback(editorLink); } };
        }
        else
        {
            modalOptions.okButton = { "text": "Continue loading", "callback": this.#continueLoadingCallback.bind(this) };
            modalOptions.cancelButton = {
                "cssClasses": "hidden"
            };

            if (platform.isElectron() && !gui.finishedLoading())
            {
                modalOptions.cancelButton = {
                    "text": "Open empty patch",
                    "callback": () => { platform.talkerAPI.send(TalkerAPI.CMD_CREATE_NEW_PATCH, {}); }
                };
            }
        }

        this.#modal = new ModalDialog(modalOptions);
        if (!hideEnvButton)
        {
            this.#modal.on("onClose", () => { this.#continueLoadingCallback(); });
        }
    }

    /**
     *
     * @param {Function} [done]
     */
    #continueLoadingCallback(done)
    {
        gui.patchView.store.opCrashed = true;
        if (this.#cb) this.#cb([]);
        if (done) done();
    }

    /**
     *
     * @param {String} editorLink
     */
    #tryOtherEnvCallback(editorLink)
    {
        window.open(editorLink);
    }

}
