import Platform from "./platform.js";
import ModalDialog from "./dialogs/modaldialog.js";
import text from "./text.js";

/**
 * platform for standalone / electron version
 *
 * @export
 * @class PlatformStandalone
 * @extends {Platform}
 */
export default class PlatformStandalone extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        this.paths = cfg.paths;

        this.frontendOptions.npm = true;

        this.frontendOptions.isStandalone =
        this.frontendOptions.openLocalFiles =
        this.frontendOptions.dragDropLocalFiles =
        this.frontendOptions.showLocalAssetDirOpen =
        this.frontendOptions.showLocalOpDirButton =
        this.frontendOptions.chooseOpDir =
        this.frontendOptions.showWelcome =
        this.frontendOptions.showBuildInfoMenuLink =
        this.frontendOptions.opDependencies =
        this.frontendOptions.showOpenPatch =
        this.frontendOptions.showExport =
        this.frontendOptions.opRenameInEditor =
        this.frontendOptions.showStartUpLog = true;

        this.frontendOptions.showFormatCodeButton = false;
    }

    isStandalone()
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
        return "https://cables.gl";
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
        CABLESUILOADER.talkerAPI.send("selectFile", { "url": value, "filter": filterType, "opId": opId }, (_err, file) =>
        {
            if (file && inputEle)
            {
                gui.savedState.setUnSaved("filemanager");
                inputEle.value = file;
                const event = document.createEvent("Event");
                event.initEvent("input", true, true);
                inputEle.dispatchEvent(event);
                gui.opParams.show(opId);
            }
        });
    }

    createBackup()
    {
        const showBackupDialog = () =>
        {
            CABLESUILOADER.talkerAPI.send("patchCreateBackup", { }, (err, result) =>
            {
                if (result.success) CABLES.UI.notify("Backup created!");
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
                "text": text.projectBackupNotSaved,
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

    exportPatch(projectId)
    {
        const loadingModal = gui.startModalLoading("Exporting patch...");
        loadingModal.setTask("Exporting patch...");
        CABLESUILOADER.talkerAPI.send("exportPatch", { "projectId": projectId }, (err, result) =>
        {
            if (err)
            {
                loadingModal.setTask("ERROR", err.msg);
                loadingModal.setTask(err.data);
            }
            else
            {
                if (result.data && result.data.log)
                {
                    result.data.log.forEach((log) =>
                    {
                        loadingModal.setTask(log.text);
                    });
                }
            }
        });
    }
}
