import { ele, Logger, TalkerAPI } from "cables-shared-client";
import { platform } from "../platform.js";
import ModalDialog from "./modaldialog.js";
import { gui } from "../gui.js";
import namespace from "../namespaceutils.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import defaultOps from "../defaultops.js";

export class ModalOpName
{

    #log = new Logger("modalopname");

    /**
     * @param {object} options
     * @param {string} options.title title of the dialog
     * @param {string} options.shortName shortname of the new op
     * @param {string} options.type type of op (patch/user/team/...)
     * @param {string} options.suggestedNamespace suggested namespace in dropdown
     * @param {boolean} options.showReplace show "create and replace existing" button
     * @param {boolean} options.rename rename or create a new op?
     * @param {string|null} options.sourceOpName opname to clone from or create op into
     * @param {boolean} options.hasOpDirectories electron has directories for additional ops, setting comes from platform_electron.js
     * @param {function} callback
     */
    constructor(options, callback)
    {

        this._options = options;
        this._callback = callback;
        this._opTargetDir = null;
        this._currentCheckNameTimeout = null;

        if (!platform.isTrustedPatch())
        {
            new ModalDialog({
                "title": "Untrusted Patch",
                "text": "You need write access in the patch to create ops<br/>Try creating a new patch and try there again",
                "showOkButton": true
            });
        }
        else if (this._options.hasOpDirectories)
        {
            platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_GET_PROJECT_OPDIRS, {}, (err, res) =>
            {
                const opDirs = res?.data || [];
                for (let i = 0; i < opDirs.length; i++)
                {
                    const dirInfo = opDirs[i];
                    if (i === 0) this._opTargetDir = dirInfo.dir;
                }
                this._createModal(options, opDirs);
            });
        }
        else
        {
            this._createModal(options);
        }
    }

    _createModal(options, opDirs = [])
    {
        this._modalDialog = new ModalDialog({
            "title": options.title,
            "text": this._getHtml(opDirs)
        });
        const opNameInput = ele.byId("opNameDialogInput");
        opNameInput.value = this._options.sourceOpName || this._options.shortName;

        this._updateDialog(options, {
            "namespaces": [options.suggestedNamespace],
            "problems": []
        }, opNameInput.value);
        this._checkOpName();

        opNameInput.addEventListener("input", () => { this._nameChangeListener(this._options); });
        ele.byId("opNameDialogNamespace").addEventListener("input", () => { this._namespaceChangeListener(this._options); });

        const cbOptions = {
            "replace": false
        };

        ele.clickable(ele.byId("opNameDialogSubmit"), () =>
        {
            if (this._opTargetDir) cbOptions.opTargetDir = this._opTargetDir;
            this._callback(ele.byId("opNameDialogNamespace").value, namespace.capitalizeNamespaceParts(opNameInput?.value), cbOptions);
        });

        if (this._options.showReplace)
        {
            ele.clickable(ele.byId("opNameDialogSubmitReplace"), (event) =>
            {
                cbOptions.replace = true;
                if (this._opTargetDir) cbOptions.opTargetDir = this._opTargetDir;
                this._callback(ele.byId("opNameDialogNamespace").value, namespace.capitalizeNamespaceParts(opNameInput?.value), cbOptions);
            });
        }
    }

    _checkOpName()
    {
        const newName = this._options.sourceOpName || this._options.shortName;
        const checkNameRequest = {
            "namespace": this._options.suggestedNamespace,
            "v": newName,
            "sourceName": this._options.sourceOpName,
            "rename": this._options.rename
        };
        if (this._opTargetDir) checkNameRequest.opTargetDir = this._opTargetDir;
        this._apiCheckName(checkNameRequest);
    }

    _getHtml(opDirs = [])
    {
        return getHandleBarHtml("dialog_opname", {
            "showTeamHint": !platform.isElectron(),
            "sourceOpName": this._options.sourceOpName,
            "defaultOpName": platform.getDefaultOpName(),
            "rename": this._options.rename,
            "opDirs": opDirs
        });
    }

    _updateDialog(dialogOptions, data, newOpName, newNamespace = null)
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
            data.consequences.unshift("New op: <a href=\"/op/" + newOpName + "\">" + newOpName + "</a>");
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
            const currentName = inputField.value;
            if (!currentName.startsWith(defaultOps.prefixes.op))
            {
                if (currentName !== newOpName) inputField.value = newOpName;
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
                            this._nameChangeListener(dialogOptions);
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

    _apiCheckName(checkNameRequest, cb = null)
    {
        clearTimeout(this._currentCheckNameTimeout);
        this._currentCheckNameTimeout = setTimeout(() =>
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

                if (platform.frontendOptions.hasOpDirectories)
                {
                    ele.clickables(this._modalDialog.getElement(), ".clickable", (event, dataset) =>
                    {
                        const selectElement = ele.byId("opTargetDir");
                        const selectedDir = ele.getSelectValue(selectElement);
                        switch (event.currentTarget.id)
                        {
                        case "addOpTargetDir":
                            gui.jobs().start({ "id": "addprojectdir" });
                            platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_ADD_PROJECT_OPDIR, {}, (dirErr, dirRes) =>
                            {
                                gui.jobs().finish("addprojectdir");
                                if (!dirErr)
                                {
                                    if (selectElement)
                                    {
                                        selectElement.length = 0;
                                        dirRes.data.forEach((dir) =>
                                        {
                                            const selected = dir.new;
                                            selectElement.add(new Option(dir.path, dir.path, selected, selected));
                                            if (selected) this._opTargetDir = dir.path;
                                        });
                                    }
                                }
                                else
                                {
                                    new ModalDialog({
                                        "showOkButton": true,
                                        "warning": true,
                                        "title": "Warning",
                                        "text": dirErr.msg
                                    });
                                    this.#log.info(dirErr.msg);
                                }
                            });
                            break;
                        case "openOpTargetDir":
                        default:
                            platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_OPEN_DIR, { "dir": selectedDir });
                            break;
                        }
                    });
                }

                const opNameInput = ele.byId("opNameDialogInput");
                const checkedName = res.checkedName || this._options.sourceOpName;
                this._updateDialog(this._options, res, checkedName);
                if (opNameInput && opNameInput.value) opNameInput.focus();

                const opTargetDirEle = ele.byId("opTargetDir");
                if (opTargetDirEle)
                {
                    opTargetDirEle.addEventListener("change", () =>
                    {
                        if (opTargetDirEle)
                        {
                            this._opTargetDir = opTargetDirEle.value;
                        }
                        else
                        {
                            this._opTargetDir = null;
                        }
                        this._nameChangeListener(this._options);
                    });
                }

                gui.jobs().finish("checkOpName" + checkNameRequest.v);
                this._currentCheckNameTimeout = null;
                if (cb) cb(checkedName);
            });
        }, 250);

    }

    _namespaceChangeListener(dialogOptions)
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
                this._nameChangeListener(dialogOptions);
            }
        }
    }

    _nameChangeListener(dialogOptions)
    {
        const newNamespace = ele.byId("opNameDialogNamespace").value;
        const fullName = ele.byId("opNameDialogInput").value;

        ele.hide(ele.byId("opNameDialogSubmit"));
        ele.hide(ele.byId("opNameDialogSubmitReplace"));

        if (fullName)
        {
            const checkNameRequest = {
                "namespace": newNamespace,
                "v": fullName,
                "sourceName": dialogOptions.sourceOpName,
                "rename": dialogOptions.rename
            };
            const opTargetDirEle = ele.byId("opTargetDir");
            if (opTargetDirEle) checkNameRequest.opTargetDir = opTargetDirEle.value;
            this._apiCheckName(checkNameRequest);
        }
    }
}
