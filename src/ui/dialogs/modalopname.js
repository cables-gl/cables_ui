import { ele, Logger, TalkerAPI } from "cables-shared-client";
import { platform } from "../platform.js";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import namespace from "../namespaceutils.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import defaultOps from "../defaultops.js";

/**
 * @typedef DialogOptions
 * @property {String} title
 * @property {String} shortName
 * @property {String} type
 * @property {String} suggestedNamespace
 * @property {Boolean} showReplace
 * @property {Boolean} rename
 * @property {String} sourceOpName
 * @property {Boolean} hasOpDirectories
 */

/**
 * @typedef CheckOpNameRequest
 * @property {String} namespace
 * @property {String} v
 * @property {String} sourceName
 * @property {Boolean} rename
 * @property {String} [opTargetDir]
 */

/**
 * @callback ModalOpNameCallback
 * @param {String} newNamespace
 * @param {String} newName
 * @param {{replace: boolean, opTargetDir?: string}} callbackOptions
 */

/**
 * @typedef ModalOpNameOptions
 * @property {String} title title of the dialog
 * @property {String} shortName shortname of the new op
 * @property {String} type type of op (patch/user/team/...)
 * @property {String} suggestedNamespace suggested namespace in dropdown
 * @property {Boolean} showReplace show "create and replace existing" button
 * @property {Boolean} rename rename or create a new op?
 * @property {String|null} sourceOpName opname to clone from or create op into
 * @property {Boolean} hasOpDirectories electron has directories for additional ops, setting comes from platform_electron.js
 */

export class ModalOpName
{

    #log = new Logger("modalopname");

    /** @type ModalOpNameOptions */
    #options;

    /** @type ModalOpNameCallback */
    #callback;

    /** @type String */
    #opTargetDir;

    /** @type number */
    #currentCheckNameTimeout;

    /** @type String */
    #checkedName;

    /**
     * @param {ModalOpNameOptions} options
     * @param {ModalOpNameCallback} callback
     */
    constructor(options, callback)
    {

        this.#options = options;
        this.#callback = callback;

        if (!platform.isTrustedPatch())
        {
            new ModalDialog({
                "title": "Untrusted Patch",
                "text": "You need write access in the patch to create ops<br/>Try creating a new patch and try there again",
                "showOkButton": true
            });
        }
        else if (this.#options.hasOpDirectories)
        {
            platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_GET_PROJECT_OPDIRS, { "opName": this.#options.sourceOpName }, (err, res) =>
            {
                const opDirs = res?.data || [];
                for (let i = 0; i < opDirs.length; i++)
                {
                    const dirInfo = opDirs[i];
                    if (i === 0) this.#opTargetDir = dirInfo.dir;
                    if (dirInfo.selected) this.#opTargetDir = dirInfo.dir;
                }
                this.#createModal(options, opDirs);
            });
        }
        else
        {
            this.#createModal(options);
        }
    }

    /**
     * @param {DialogOptions} options
     */
    #createModal(options, opDirs = [])
    {
        this._modalDialog = new ModalDialog({
            "title": options.title,
            "text": this.#getHtml(opDirs)
        });
        const opNameInput = ele.byId("opNameDialogInput");
        opNameInput.value = this.#options.sourceOpName || this.#options.shortName;

        this.#updateDialog(options, {
            "namespaces": [options.suggestedNamespace],
            "problems": []
        }, opNameInput.value);
        this.#checkOpName();

        opNameInput.addEventListener("input", () => { this.#nameChangeListener(this.#options); });
        ele.byId("opNameDialogNamespace").addEventListener("input", () => { this.#namespaceChangeListener(this.#options); });

        const cbOptions = {
            "replace": false
        };

        if (this.#options.hasOpDirectories)
        {
            ele.clickable(ele.byId("opNameDialogManageOpDirs"), () =>
            {
                this._modalDialog.close();
                platform.openOpDirsTab();
            });
        }

        ele.clickable(ele.byId("opNameDialogSubmit"), () =>
        {
            if (this.#opTargetDir) cbOptions.opTargetDir = this.#opTargetDir;
            const checkedName = this.#checkedName || opNameInput?.value;
            this.#callback(ele.byId("opNameDialogNamespace").value, namespace.capitalizeNamespaceParts(checkedName), cbOptions);
        });

        if (this.#options.showReplace)
        {
            ele.clickable(ele.byId("opNameDialogSubmitReplace"), (event) =>
            {
                cbOptions.replace = true;
                if (this.#opTargetDir) cbOptions.opTargetDir = this.#opTargetDir;
                const checkedName = this.#checkedName || opNameInput?.value;
                this.#callback(ele.byId("opNameDialogNamespace").value, namespace.capitalizeNamespaceParts(checkedName), cbOptions);
            });
        }
    }

    #checkOpName()
    {
        const newName = this.#options.sourceOpName || this.#options.shortName;

        /** @type CheckOpNameRequest */
        const checkNameRequest = {
            "namespace": this.#options.suggestedNamespace?.trim(),
            "v": newName?.trim(),
            "sourceName": this.#options.sourceOpName?.trim(),
            "rename": this.#options.rename
        };
        if (this.#opTargetDir) checkNameRequest.opTargetDir = this.#opTargetDir;
        this.#apiCheckName(checkNameRequest);
    }

    /**
     *
     * @param {import("cables-shared-client").OpDir[]} opDirs
     * @returns {String}
     */
    #getHtml(opDirs = [])
    {
        return getHandleBarHtml("dialog_opname", {
            "showTeamHint": !platform.isElectron(),
            "sourceOpName": this.#options.sourceOpName,
            "defaultOpName": platform.getDefaultOpName(),
            "rename": this.#options.rename,
            "opDirs": opDirs
        });
    }

    /**
     * @param {DialogOptions} dialogOptions
     * @param {any} data
     * @param {String} newOpName
     * @param {String} [newNamespace]
     */
    #updateDialog(dialogOptions, data, newOpName, newNamespace = null)
    {
        let hintsHtml = "";
        const eleHints = ele.byId("opNameDialogHints");
        const inputField = ele.byId("opNameDialogInput");

        if (eleHints) ele.hide(eleHints);
        if (data.hints && data.hints.length > 0)
        {
            hintsHtml += "<ul>";
            data.hints.forEach((hint) =>
            {
                hintsHtml += "<li>" + hint + "</li>";
            });
            hintsHtml += "</ul>";

            if (eleHints)
            {
                eleHints.innerHTML = "<h3>Hints</h3>" + hintsHtml;
                ele.show(eleHints);
            }
        }

        let consequencesHtml = "";
        const eleCons = ele.byId("opNameDialogConsequences");
        if (eleCons) ele.hide(eleCons);
        if (data.consequences && data.consequences.length > 0)
        {
            if (!data.problems || data.problems.length === 0)
            {
                data.consequences.unshift("New op: <a href=\"/op/" + newOpName + "\">" + newOpName + "</a>");
                this.#checkedName = newOpName;
            }
            consequencesHtml += "<ul>";
            data.consequences.forEach((consequence) =>
            {
                consequencesHtml += "<li>" + consequence + "</li>";
            });
            consequencesHtml += "</ul>";

            if (eleCons)
            {
                eleCons.innerHTML = "<h3>Consequences</h3>" + consequencesHtml;
                ele.show(eleCons);
            }
        }

        if (newOpName)
        {
            const currentName = inputField.value?.trim().toLowerCase();
            if (!currentName.startsWith(defaultOps.prefixes.op))
            {
                // if (currentName !== newOpName) inputField.value = newOpName;
            }
            if (data.problems.length > 0)
            {
                let htmlIssue = "<h3>Issues</h3>";
                htmlIssue += "<ul>";
                for (let i = 0; i < data.problems.length; i++) htmlIssue += "<li>" + data.problems[i] + "</li>";
                htmlIssue += "</ul>";
                const errorsEle = ele.byId("opcreateerrors");
                errorsEle.innerHTML = htmlIssue;
                ele.hide(ele.byId("opNameDialogSubmit"));
                ele.hide(ele.byId("opNameDialogSubmitReplace"));
                errorsEle.classList.remove("hidden");

                const versionSuggestions = errorsEle.querySelectorAll(".versionSuggestion");
                if (versionSuggestions) versionSuggestions.forEach((suggest) =>
                {
                    if (suggest.dataset.nextName)
                    {
                        suggest.addEventListener("pointerdown", (_e) =>
                        {
                            inputField.value = namespace.capitalizeNamespaceParts(suggest.dataset.nextName);
                            this.#nameChangeListener(dialogOptions);
                        });
                    }
                });
            }
            else
            {
                ele.byId("opcreateerrors").innerHTML = "";
                ele.byId("opcreateerrors").classList.add("hidden");
                ele.show(ele.byId("opNameDialogSubmit"));
                if (dialogOptions.showReplace) ele.show(ele.byId("opNameDialogSubmitReplace"));
            }
        }

        const namespaceEle = ele.byId("opNameDialogNamespace");
        namespaceEle.innerHTML = "";
        if (data.namespaces)
        {
            data.namespaces.forEach((ns) =>
            {
                const option = document.createElement("option");
                option.value = ns;
                option.text = ns;
                if (newNamespace && ns === newNamespace) option.selected = true;
                namespaceEle.add(option);
            });
        }

        ele.byId("opNameDialogInput").focus();
    }

    /**
     *
     * @param {CheckOpNameRequest} checkNameRequest
     * @param {Function} [cb]
     */
    #apiCheckName(checkNameRequest, cb = null)
    {
        clearTimeout(this.#currentCheckNameTimeout);
        this.#currentCheckNameTimeout = setTimeout(() =>
        {
            gui.jobs().start({
                "id": "checkOpName" + checkNameRequest.v,
                "title": "checking op name " + checkNameRequest.v
            });
            platform.talkerAPI.send(TalkerAPI.CMD_CHECK_OP_NAME, checkNameRequest, (err, res) =>
            {
                if (err)
                {
                    if (!res) res = {};
                    if (!res.problems) res.problems = [];
                    if (!res.checkedName) res.checkedName = checkNameRequest.v;
                    res.problems.push("failed to check op-name with api, try again");
                }

                const opNameInput = ele.byId("opNameDialogInput");
                const checkedName = res.checkedName || this.#options.sourceOpName;
                this.#updateDialog(this.#options, res, checkedName);
                if (opNameInput && opNameInput.value) opNameInput.focus();

                const opTargetDirEle = ele.byId("opTargetDir");
                if (opTargetDirEle)
                {
                    opTargetDirEle.addEventListener("change", () =>
                    {
                        if (opTargetDirEle)
                        {
                            this.#opTargetDir = opTargetDirEle.value;
                        }
                        else
                        {
                            this.#opTargetDir = null;
                        }
                        this.#nameChangeListener(this.#options);
                    });
                }

                gui.jobs().finish("checkOpName" + checkNameRequest.v);
                this.#currentCheckNameTimeout = null;
                if (cb) cb(checkedName);
            });
        }, 250);

    }

    /**
     * @param {DialogOptions} dialogOptions
     */
    #namespaceChangeListener(dialogOptions)
    {
        const opNameInput = ele.byId("opNameDialogInput");
        const selectEle = ele.byId("opNameDialogNamespace");

        if (selectEle.value && namespace.isNamespaceNameValid(selectEle.value))
        {
            const opName = opNameInput.value;
            const opBasename = opName.substring(opName.lastIndexOf(".") + 1);
            const newNamespace = selectEle.value;
            const newOpName = newNamespace + opBasename;
            if (opNameInput)
            {
                opNameInput.value = newOpName;
                this.#nameChangeListener(dialogOptions);
            }
        }
    }

    /**
     * @param {DialogOptions} dialogOptions
     */
    #nameChangeListener(dialogOptions)
    {
        const newNamespace = ele.byId("opNameDialogNamespace").value;
        const fullName = ele.byId("opNameDialogInput").value;

        ele.hide(ele.byId("opNameDialogSubmit"));
        ele.hide(ele.byId("opNameDialogSubmitReplace"));

        if (fullName)
        {
            const checkNameRequest = {
                "namespace": newNamespace?.trim(),
                "v": fullName?.trim(),
                "sourceName": dialogOptions.sourceOpName?.trim(),
                "rename": dialogOptions.rename
            };
            const opTargetDirEle = ele.byId("opTargetDir");
            if (opTargetDirEle) checkNameRequest.opTargetDir = opTargetDirEle.value;
            this.#apiCheckName(checkNameRequest);
        }
    }
}
