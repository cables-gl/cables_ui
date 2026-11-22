import { TalkerAPI } from "cables-shared-client";
import { utils } from "cables";
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
        const project = gui.project();
        let otherEnvLink = "";
        let otherEnvButton = "";
        let errMsg = "";
        let opLinks = [];
        if (apiError && apiError.data)
        {
            if (apiError.data.text) errMsg = apiError.data.text;
            if (apiError.data.title) title = apiError.data.title;
            if (apiError.data.reasons) opLinks = opLinks.concat(apiError.data.reasons);
            if (apiError.data.ops)
            {
                for (let i = 0; i < apiError.data.ops.length; i++)
                {
                    const op = apiError.data.ops[i];
                    if (op.env === "electron")
                    {
                        opLinks.push(op.opDir);
                    }
                    else
                    {
                        opLinks.push("Found <a href=\"https://" + op.env + "/op/" + op.name + "\">" + op.name + "</a> on " + op.env);
                    }
                }
            }
            if (apiError.data.otherEnvUrl && apiError.data.otherEnvName && project)
            {
                otherEnvLink = apiError.data.otherEnvUrl + "/edit/" + project.shortId;
                otherEnvButton = "Try " + apiError.data.otherEnvName;
            }
        }
        const hideEnvButton = !platform.frontendOptions.suggestOtherEnvironmentsForOps || !otherEnvLink || apiError?.data?.hideEnvButton;
        const opText = apiError?.data?.name || oldName || opIdentifier;
        if (opText && !errMsg.includes(opText) && !opLinks.some((opLink) => { return opLink.includes(opText); })) opLinks.push(opText);
        opLinks = utils.uniqueArray(opLinks).filter((opLink) => { return opLink !== errMsg; });

        const modalOptions = {
            "title": title,
            "text": errMsg,
            "notices": opLinks,
            "footer": apiError?.data?.footer,
            "choice": true
        };

        if (!hideEnvButton)
        {
            modalOptions.okButton = {
                "text": "Continue",
                "callback": this.#continueLoadingCallback.bind(this)
            };
            modalOptions.cancelButton = { "text": otherEnvButton, "callback": () => { this.#tryOtherEnvCallback(otherEnvLink); } };
        }
        else
        {
            modalOptions.okButton = { "text": "Continue", "callback": this.#continueLoadingCallback.bind(this) };
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
     * @param {String} otherEnvLink
     */
    #tryOtherEnvCallback(otherEnvLink)
    {
        window.open(otherEnvLink);
    }

}
