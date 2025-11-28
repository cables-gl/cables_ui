import { ele, TalkerAPI } from "cables-shared-client";
import { Platform } from "./platform.js";
import ModalDialog from "./dialogs/modaldialog.js";
import { notify } from "./elements/notification.js";
import { gui } from "./gui.js";
import { GuiText } from "./text.js";

/**
 * platform for standalone / electron version
 *
 * @export
 * @class PlatformElectron
 * @extends {Platform}
 */
export default class PlatformElectron extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        this.paths = cfg.paths;

        this.frontendOptions.npm = true;
        this.frontendOptions.isElectron =
        this.frontendOptions.openLocalFiles =
        this.frontendOptions.selectableDownloadPath =
        this.frontendOptions.dragDropLocalFiles =
        this.frontendOptions.showLocalAssetDirOpen =
        this.frontendOptions.showLocalOpDirButton =
        this.frontendOptions.editOpSummary =
        this.frontendOptions.hasOpDirectories =
        this.frontendOptions.hasAssetDirectories =
        this.frontendOptions.showWelcome =
        this.frontendOptions.showBuildInfoMenuLink =
        this.frontendOptions.opDependencies =
        this.frontendOptions.showOpenPatch =
        this.frontendOptions.showExport =
        this.frontendOptions.showExportPatch =
        this.frontendOptions.opRenameInEditor =
        this.frontendOptions.opDeleteInEditor =
        this.frontendOptions.showSetProjectTitle =
        this.frontendOptions.showStartUpLog = true;
        this.frontendOptions.showFormatCodeButton = false;

        this.bindHrTimer();
    }

    bindHrTimer()
    {
        const process = window.nodeRequire("node:process");
        const startTime = process.hrtime();
        performance.now = () =>
        {
            let t = process.hrtime(startTime);
            return t[0] * 1000 + t[1] / 1000000;
        };
    }

    isElectron()
    {
        return true;
    }

    getCablesVersion()
    {
        let version = "Electron Standalone";

        if (CABLESUILOADER && CABLESUILOADER.buildInfo && CABLESUILOADER.buildInfo.api && CABLESUILOADER.buildInfo.api.version) version += " v" + CABLESUILOADER.buildInfo.api.version;
        else version += " development version";
        return version;
    }

    getCablesDocsUrl()
    {
        return this._cfg.communityUrl || "https://cables.gl";
    }

    getIssueTrackerUrl()
    {
        return "https://github.com/cables-gl/cables_electron/issues";
    }

    getCablesStaticUrl()
    {
        return "";
    }

    noCacheUrl(url)
    {
        let separator = "?";
        if (url.includes("?")) separator = "&";
        return url + separator + "nc=" + (Date.now() + "").substr(-6);
    }

    showFileSelect(inputId, filterType, opId, previewId)
    {
        let value = null;
        let inputEle = null;
        if (inputId)
        {
            inputEle = ele.byQuery(inputId);
            if (inputEle) value = inputEle.value;
        }
        this.talkerAPI.send(TalkerAPI.CMD_ELECTRON_SELECT_FILE, { "url": value, "filter": filterType, "opId": opId }, (_err, file) =>
        {
            if (file && inputEle)
            {
                const op = gui.corePatch().getOpById(opId);
                gui.savedState.setUnSaved("filemanager", op.getSubPatch());
                inputEle.value = file;
                const event = document.createEvent("Event");
                event.initEvent("input", true, true);
                inputEle.dispatchEvent(event);
                gui.opParams.show(op);
            }
        });
    }

    createBackup()
    {
        const showBackupDialog = () =>
        {
            this.talkerAPI.send(TalkerAPI.CMD_CREATE_PATCH_BACKUP, {}, (err, result) =>
            {
                if (result.success) notify("Backup created!");
            });
        };

        if (!gui.getSavedState())
        {
            new ModalDialog({
                "choice": true,
                "cancelButton": {
                    "text": "Backup last saved state",
                    "callback": showBackupDialog
                },
                "title": "Backup",
                "warning": true,
                "text": GuiText.projectBackupNotSaved,
            });

            return;
        }

        showBackupDialog();
    }

    showGitBranchWarning() {}

    currentUserIsPatchOwner()
    {
        return true;
    }

    exportPatch(projectId, exportType = null)
    {
        let talkerCommand = TalkerAPI.CMD_ELECTRON_EXPORT_PATCH;
        if (exportType === "patch") talkerCommand = TalkerAPI.CMD_ELECTRON_EXPORT_PATCH_BUNDLE;
        gui.jobs().start({ "id": "exportPatch", "title": "export patch", "indicator": "canvas" });
        this.talkerAPI.send(talkerCommand, { "projectId": projectId }, (err, result) =>
        {
            const modalOptions = {
                "title": "Patch Export"
            };
            gui.jobs().finish("exportPatch");
            if (err || result.error)
            {
                modalOptions.warning = true;
                modalOptions.text = "Failed to export patch:<br/>" + (err || "") + (result.error || "");
            }
            else
            {
                modalOptions.showOkButton = true;
                modalOptions.okButton = {
                    "text": "Show",
                    "callback": (a, b, c) =>
                    {
                        CABLES.CMD.ELECTRON.openFileManager(result.data.url);
                    }
                };
                modalOptions.text = "Successfully exported patch:";
            }
            if (result && result.data && result.data.log)
            {
                modalOptions.notices = result.data.log.map((l) => { return l.text; });
            }
            new ModalDialog(modalOptions);
        });
    }

    getPatchOpsNamespace()
    {
        return "Ops.Local.";
    }

    isSaving()
    {
        return false;
    }

    getDefaultOpName()
    {
        return this.getPatchOpsNamespace() + super.getDefaultOpName();
    }
}
