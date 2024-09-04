import { Events, Logger } from "cables-shared-client";
import ModalDialog from "./dialogs/modaldialog.js";
import ChangelogToast from "./dialogs/changelog.js";
import text from "./text.js";
import userSettings from "./components/usersettings.js";
import { notify, notifyError } from "./elements/notification.js";
import defaultOps from "./defaultops.js";
import StandaloneOpDirs from "./components/tabs/tab_standaloneopdirs.js";

/**
 * super class for platform implementations
 */
export default class Platform extends Events
{
    constructor(cfg)
    {
        super();

        this._log = new Logger("platform");
        this._cfg = cfg;

        this.paths = {};
        this.frontendOptions = {};

        if (CABLESUILOADER && CABLESUILOADER.talkerAPI)
        {
            CABLESUILOADER.talkerAPI.addEventListener("logError", (errorData) =>
            {
                if (errorData)
                {
                    const errorMessage = errorData.message || "unknown error";
                    switch (errorData.level)
                    {
                    case "error":
                        this._log.error(errorMessage);
                        break;
                    case "warn":
                        this._log.warn(errorMessage);
                        break;
                    case "verbose":
                        this._log.verbose(errorMessage);
                        break;
                    case "info":
                        this._log.info(errorMessage);
                        break;
                    default:
                        this._log.log(errorMessage);
                        break;
                    }
                }
                else
                {
                    this._log.warn("unknown error");
                }
            });
        }

        if (cfg.usersettings && cfg.usersettings.settings) userSettings.load(cfg.usersettings.settings);
        else userSettings.load({});

        window.addEventListener("online", this.updateOnlineIndicator.bind(this));
        window.addEventListener("offline", this.updateOnlineIndicator.bind(this));
        this.updateOnlineIndicator();
    }

    warnOpEdit(opName)
    {
        return (!CABLES.platform.isDevEnv() && defaultOps.isCoreOp(opName) && !CABLES.platform.isStandalone());
    }

    isStandalone()
    {
        return false;
    }

    isTrustedPatch()
    {
        return this._cfg.isTrustedPatch;
    }

    getCablesVersion()
    {
        return "unknown version";
    }

    getPrefixAssetPath()
    {
        if (!this._cfg || !this._cfg.patchConfig) return "";
        return this._cfg.patchConfig.prefixAssetPath;
    }

    getIssueTrackerUrl()
    {
        return "https://github.com/cables-gl/cables_docs/issues";
    }

    updateOnlineIndicator()
    {
        if (this.frontendOptions.needsInternet)
        {
            if (this.isOffline()) ele.show(ele.byId("nav-item-offline"));
            else ele.hide(ele.byId("nav-item-offline"));
        }
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

    getCablesStaticUrl()
    {
        return this.getCablesUrl();
    }

    isPatchSameHost()
    {
        if (!gui.project() || !gui.project().buildInfo || !gui.project().buildInfo.host) return true;
        return gui.project().buildInfo.host == CABLES.platform.getCablesUrl().replaceAll("https://", "").replaceAll("http://", "");
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

    noCacheUrl(url)
    {
        return url;
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

    showGitBranchWarning()
    {
        if ((document.location.hostname != "cables.gl" && document.location.hostname != "sandbox.cables.gl") && CABLES.build && CABLES.build.git.branch == "master") notifyError("core: using master branch not on live?!");
        if ((document.location.hostname != "cables.gl" && document.location.hostname != "sandbox.cables.gl") && CABLES.UI.build && CABLES.UI.build.git.branch == "master") notifyError("UI: using master branch not on live?!");
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
            notify(options.msg);
        });

        CABLESUILOADER.talkerAPI.addEventListener("notifyError", (options, next) =>
        {
            notifyError(options.msg, options.text, options.options);
        });

        CABLESUILOADER.talkerAPI.addEventListener("refreshFileManager", (options, next) =>
        {
            gui.closeModal();
            gui.refreshFileManager();
        });

        CABLESUILOADER.talkerAPI.addEventListener("executeOp", (options, next) =>
        {
            if (options && options.name)
            {
                gui.closeModal();
                const loadingModal = gui.startModalLoading("Saving and executing op...");
                loadingModal.setTask("Saving Op");
                const opname = options.name;
                if (CABLES.platform.warnOpEdit(opname)) notifyError("WARNING: op editing on live environment");

                if (!CABLES.Patch.getOpClass(opname))gui.opSelect().reload();

                loadingModal.setTask("Executing code");

                const selOps = gui.patchView.getSelectedOps();
                let selOpTranslate = null;
                if (selOps && selOps.length > 0) selOpTranslate = selOps[0].uiAttribs.translate;

                gui.serverOps.execute(opname, (newOps, refOldOp) =>
                {
                    if (selOpTranslate)
                    {
                        for (let i = 0; i < gui.corePatch().ops.length; i++)
                        {
                            if (gui.corePatch().ops[i].uiAttribs && gui.corePatch().ops[i].uiAttribs.translate && gui.corePatch().ops[i].uiAttribs.translate.x == selOpTranslate.x && gui.corePatch().ops[i].uiAttribs.translate.y == selOpTranslate.y)
                            {
                                gui.opParams.show(gui.corePatch().ops[i].id);
                                gui.patchView.setSelectedOpById(gui.corePatch().ops[i].id);
                            }
                        }
                    }
                    gui.endModalLoading();
                    const editorTab = gui.mainTabs.activateTabByName(opname);
                    if (editorTab && newOps && newOps[0])
                    {
                        CABLESUILOADER.talkerAPI.send(
                            "getOpCode",
                            {
                                "opname": newOps[0].opId,
                                "projectId": this._patchId
                            },
                            (er, rslt) =>
                            {
                                if (rslt && rslt.hasOwnProperty("code"))
                                {
                                    editorTab.editor.setContent(rslt.code);
                                }
                            });
                    }
                });
            }
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
                for (let j = 0; j < gui.corePatch().ops.length; j++)
                {
                    if (gui.corePatch().ops[j])
                    {
                        if (gui.corePatch().ops[j].onFileChanged) gui.corePatch().ops[j].onFileChanged(options.fileName);
                        else if (gui.corePatch().ops[j].onFileUploaded) gui.corePatch().ops[j].onFileUploaded(options.fileName); // todo deprecate , rename to onFileChanged
                    }
                }

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
            gui.jobs().setProgress(options.id, options.progress);
        });

        CABLESUILOADER.talkerAPI.addEventListener("updatePatchName", (opts, next) =>
        {
            gui.setProjectName(opts.name);
            CABLESUILOADER.talkerAPI.send("updatePatchName", opts, (err, r) => {});
        });

        CABLESUILOADER.talkerAPI.addEventListener("updatePatchSummary", (opts, next) =>
        {
            const project = gui.project();
            if (project) gui.project().summary = opts;
            gui.patchParamPanel.show(true);
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
                    saveText += "on " + DateTime(project.updated).format("DD.MM.YYYY HH:mm");
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

    showFileSelect(inputId, filterType, opid, previewId)
    {
        gui.showFileManager(() =>
        {
            const portInputEle = ele.byQuery(inputId);
            if (!portInputEle)
            {
                this._log.warn("[showfileselect] no portInputEle");
                return;
            }
            const fn = portInputEle.value;

            gui.fileManager.setFilterType(filterType);
            gui.fileManager.setFilePort(portInputEle, gui.corePatch().getOpById(opid), ele.byId(previewId));
            gui.fileManager.selectFile(fn);

            ele.byId("menubar").scrollIntoView({ "block": "end" }); // dont ask why... without "some"(background image op) file selects make the page scroll............
        });
    }

    openOpDirsTab()
    {
        if (this.frontendOptions.chooseOpDir)
        {
            new StandaloneOpDirs(gui.mainTabs);
            gui.maintabPanel.show(true);
        }
    }

    exportPatch(projectId)
    {
        let gotoUrl = CABLES.platform.getCablesUrl() + "/export/" + projectId;
        if (this._versionId)
        {
            gotoUrl += "?version=" + this._versionId;
        }

        const iframeParam = this._versionId ? "&iframe=true" : "?iframe=true";
        const url = gotoUrl + iframeParam;

        gui.mainTabs.addIframeTab(
            "Export Patch ",
            url,
            {
                "icon": "settings",
                "closable": true,
                "singleton": false,
                "gotoUrl": gotoUrl
            },
            true);
    }
}
