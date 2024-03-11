import ModalDialog from "./dialogs/modaldialog";
import ChangelogToast from "./dialogs/changelog";
import text from "./text";
import userSettings from "./components/usersettings";

export default class SandboxBrowser extends CABLES.EventTarget
{
    constructor(cfg)
    {
        super();
        this._cfg = cfg;

        if (cfg.usersettings && cfg.usersettings.settings) userSettings.load(cfg.usersettings.settings);
        else userSettings.load({});

        window.addEventListener("online", this.updateOnlineIndicator.bind(this));
        window.addEventListener("offline", this.updateOnlineIndicator.bind(this));
        this.updateOnlineIndicator();
    }

    updateOnlineIndicator()
    {
        if (this.isOffline()) document.getElementById("offlineIndicator").classList.remove("hidden");
        else document.getElementById("offlineIndicator").classList.add("hidden");
    }

    isOffline()
    {
        return !navigator.onLine;
    }

    setManualScreenshot(b)
    {
        this._cfg.patch.settings.manualScreenshot = b;
    }

    manualScreenshot()
    {
        return this._cfg.patch.settings.manualScreenshot;
    }

    getCablesUrl()
    {
        return this._cfg.urlCables;
    }

    getSandboxUrl()
    {
        return this._cfg.urlSandbox || "";
    }

    getUrlOpsCode()
    {
        return this.getSandboxUrl() + "/api/ops/code";
    }

    getUrlProjectOpsCode(projectId)
    {
        return this.getCablesUrl() + "/api/ops/code/project/" + projectId;
    }

    getLocalOpCode()
    {
        return ""; // no local ops in browser version
    }

    getUrlApiPrefix()
    {
        return this._cfg.urlCables + "/api/";
    }

    getPatchVersion()
    {
        return this._cfg.patchVersion;
    }

    getSocketclusterConfig()
    {
        return this._cfg.socketcluster;
    }

    isDevEnv()
    {
        return this._cfg.isDevEnv;
    }

    showStartupChangelog()
    {
        const lastView = userSettings.get("changelogLastView");
        const cl = new ChangelogToast();
        cl.getHtml((clhtml) =>
        {
            if (clhtml !== null)
            {
                cl.showNotification();
            }
        }, lastView);
    }

    showBrowserWarning(id)
    {
        const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

        if (!gui.isRemoteClient && !window.chrome && !isFirefox && !userSettings.get("nobrowserWarning"))
        {
            iziToast.error({
                "position": "topRight",
                "theme": "dark",
                "title": text.notOptimizedBrowser_title,
                "message": text.notOptimizedBrowser_text,
                "progressBar": false,
                "animateInside": false,
                "close": true,
                "timeout": false,
            });
        }
    }

    addMeUserlist(options, cb)
    {
        CABLESUILOADER.talkerAPI.send("addMeUserlist", {}, (err, r) =>
        {
            gui.project().users.push(gui.user.id);

            if (cb)cb();
        });
    }

    getBlueprintOps(options, cb)
    {
        CABLESUILOADER.talkerAPI.send("getBlueprintOps", options, (err, r) =>
        {
            if (cb)cb(err, r);
        });
    }

    savePatch(options, cb)
    {
        CABLESUILOADER.talkerAPI.send("savePatch", options, cb);
    }

    initRouting(cb)
    {
        gui.setUser(this._cfg.user);

        CABLESUILOADER.talkerAPI.addEventListener("notify", (options, next) =>
        {
            CABLES.UI.notify(options.msg);
        });

        CABLESUILOADER.talkerAPI.addEventListener("notifyError", (options, next) =>
        {
            CABLES.UI.notifyError(options.msg, options.text, options.options);
        });

        CABLESUILOADER.talkerAPI.addEventListener("refreshFileManager", (options, next) =>
        {
            gui.closeModal();
            gui.refreshFileManager();
        });

        CABLESUILOADER.talkerAPI.addEventListener("fileUpdated", (options, next) =>
        {
            if (options && options.filename)
            {
                for (let j = 0; j < gui.corePatch().ops.length; j++)
                {
                    if (gui.corePatch().ops[j])
                    {
                        if (gui.corePatch().ops[j].onFileChanged) gui.corePatch().ops[j].onFileChanged(options.filename);
                        else if (gui.corePatch().ops[j].onFileUploaded) gui.corePatch().ops[j].onFileUploaded(options.filename); // todo deprecate , rename to onFileChanged
                    }
                }
                if (options.filename.endsWith(".js"))
                {
                    const libUrl = "/assets/" + gui.project()._id + "/" + options.filename;
                    if (gui && gui.opDocs && gui.opDocs.libs && !gui.opDocs.libs.includes(libUrl))
                    {
                        gui.opDocs.libs.push(libUrl);
                        gui.emitEvent("refreshManageOp");
                    }
                }
            }
        });

        CABLESUILOADER.talkerAPI.addEventListener("fileDeleted", (options, next) =>
        {
            if (options && options.fileName && options.fileName.endsWith(".js"))
            {
                const libUrl = "/assets/" + gui.project()._id + "/" + options.fileName;
                if (gui && gui.opDocs && gui.opDocs.libs && gui.opDocs.libs.includes(libUrl))
                {
                    const libIndex = gui.opDocs.libs.findIndex((lib) => { return lib === libUrl; });
                    if (libIndex !== -1)
                    {
                        gui.opDocs.libs.splice(libIndex, 1);
                        gui.emitEvent("refreshManageOp");
                    }
                }
            }
        });

        CABLESUILOADER.talkerAPI.addEventListener("jobStart", (options, next) =>
        {
            gui.jobs().start({ "id": options.id, "title": options.title });
        });

        CABLESUILOADER.talkerAPI.addEventListener("jobFinish", (options, next) =>
        {
            gui.jobs().finish(options.id);
        });

        CABLESUILOADER.talkerAPI.addEventListener("jobProgress", (options, next) =>
        {
            gui.jobs().setProgress(options.progress);
        });

        CABLESUILOADER.talkerAPI.send("getPatch", {}, (err, r) =>
        {
            this._cfg.patch = r;
            incrementStartup();
            this.initializeProject(() =>
            {
                if (cb) cb();
            });
        });
    }

    reloadLastSavedVersion(cb)
    {
        CABLESUILOADER.talkerAPI.send("getPatch", {}, (err, project) =>
        {
            if (!err)
            {
                let saveText = "";
                if (project.updated)
                {
                    saveText += "on " + moment(project.updated).format("DD.MM.YYYY HH:mm");
                }
                let content = "<div>Do you want to restore your patch to the last version saved " + saveText + "</div>";
                content += "<div style='margin-top: 20px; text-align: center;'>";
                content += "<a class=\"button bluebutton accept\">Ok</a>&nbsp;&nbsp;";
                content += "<a class=\"button decline\">Cancel</a>";
                content += "</div>";

                const modal = new ModalDialog({
                    "title": "Restore Patch",
                    "html": content
                }, false);
                modal.on("onShow", () =>
                {
                    const modalElement = modal.getElement();
                    const acceptButton = modalElement.querySelector(".button.accept");
                    const declineButton = modalElement.querySelector(".button.decline");

                    if (acceptButton)
                    {
                        acceptButton.addEventListener("pointerdown", () =>
                        {
                            gui.corePatch().clear();
                            this._cfg.patch = project;
                            incrementStartup();
                            this.initializeProject(() =>
                            {
                                if (cb) cb(null, project);
                            });
                            modal.close();
                        });
                    }
                    if (declineButton)
                    {
                        declineButton.addEventListener("pointerdown", () =>
                        {
                            modal.close();
                        });
                    }
                });
                modal.show();
            }
            else
            {
                new ModalDialog({
                    "showOkButton": true,
                    "title": "ERROR - Restore Patch",
                    "text": "Error while trying to restore patch to last saved version: " + err + "<br/>Maybe try again?"
                });
            }
        });
    }

    createBackup()
    {
        const showBackupDialog = () =>
        {
            new ModalDialog({
                "prompt": true,
                "title": "New Backup",
                "text": "Enter a name for the backup",
                "promptValue": "Manual Backup",
                "promptOk": function (name)
                {
                    CABLESUILOADER.talkerAPI.send("patchCreateBackup", { "title": name || "" }, (err, result) =>
                    {
                        if (result.success)
                            CABLES.UI.notify("Backup created!");
                    });
                } });
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

    initializeProject(cb)
    {
        const proj = this._cfg.patch;
        incrementStartup();
        if (window.logStartup) logStartup("set project");
        gui.patchView.setProject(proj, cb);
        if (proj.ui) gui.bookmarks.set(proj.ui.bookmarks);
    }
}
