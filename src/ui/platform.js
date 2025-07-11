import { Events, Logger, TalkerAPI, ele } from "cables-shared-client";
import ModalDialog from "./dialogs/modaldialog.js";
import ChangelogToast from "./dialogs/changelog.js";
import text from "./text.js";
import { notify, notifyError } from "./elements/notification.js";
import defaultOps from "./defaultops.js";
import ElectronOpDirs from "./components/tabs/tab_electronopdirs.js";
import namespace from "./namespaceutils.js";
import { gui } from "./gui.js";
import { userSettings } from "./components/usersettings.js";

/**
 * @type {Platform}
 */
let platform = null;
export { platform };

/**
 * super class for platform implementations
 */
export class Platform extends Events
{

    constructor(cfg = null)
    {
        super();
        platform = this;
        this._log = new Logger("platform");
        this._cfg = cfg;
        this._isOffline = false;
        this._checkOfflineInterval = null;
        this._checkOfflineIntervalSeconds = 2000;

        this.paths = {};
        this.frontendOptions = {};

        if (this._cfg)
        {
            if (CABLESUILOADER && this.talkerAPI)
            {
                this.talkerAPI.addEventListener("logError", (errorData) =>
                {
                    if (errorData)
                    {
                        const errorMessage = errorData.message || "unknown error";
                        if (errorData.type && errorData.type === "network")
                        {
                            this.setOffline();
                        }
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

            if (this._cfg.usersettings && this._cfg.usersettings.settings) userSettings.load(this._cfg.usersettings.settings);
            else userSettings.load({});

            window.addEventListener("online", this.updateOnlineIndicator.bind(this));
            window.addEventListener("offline", this.updateOnlineIndicator.bind(this));
            this.updateOnlineIndicator();
        }

    }

    get config()
    {
        return this._cfg;
    }

    /** @type {TalkerAPI} */
    get talkerAPI()
    {
        return CABLESUILOADER.talkerAPI;
    }

    /** @abstract */
    getCablesDocsUrl()
    {
        return "";
    }

    /**
     * @param {String} opName
     */
    warnOpEdit(opName)
    {
        return (!platform.isDevEnv() && namespace.isCoreOp(opName) && !platform.isElectron());
    }

    isElectron()
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
        return "https://github.com/cables-gl/cables/issues";
    }

    isOffline()
    {
        return !navigator.onLine || this._isOffline;
    }

    setOnline()
    {
        this._isOffline = false;
        ele.hide(ele.byId("nav-item-offline"));
        if (this._checkOfflineInterval) clearInterval(this._checkOfflineInterval);
    }

    setOffline()
    {
        ele.show(ele.byId("nav-item-offline"));
        this._isOffline = true;
        if (!this._checkOfflineInterval)
        {
            this._checkOfflineInterval = setInterval(() =>
            {
                gui.patchView.store.checkUpdated(null, false, true);
            }, this._checkOfflineIntervalSeconds);
        }
    }

    updateOnlineIndicator()
    {
        if (this.frontendOptions.needsInternet)
        {
            if (this.isOffline()) this.setOffline();
            else this.setOnline();
        }
    }

    /**
     * @param {boolean} b
     */
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
        if (
            !gui.project() ||
            !gui.project().buildInfo ||
            !gui.project().buildInfo.host
        )
            return true;
        return (
            gui.project().buildInfo.host ==
            platform
                .getCablesUrl()
                .replaceAll("https://", "")
                .replaceAll("http://", "")
        );
    }

    getSandboxUrl()
    {
        return this._cfg.urlSandbox || "";
    }

    getUrlOpsCode()
    {
        let url = this.getSandboxUrl() + "/api/ops/code";
        if (this.config.previewMode) url += "?preview=true";
        return url;
    }

    getUrlProjectOpsCode(projectId)
    {
        let url = this.getCablesUrl() + "/api/ops/code/project/" + projectId;
        if (this.config.previewMode) url += "?preview=true";
        return url;
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

    showBrowserWarning()
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
        if (
            document.location.hostname != "cables.gl" &&
            document.location.hostname != "sandbox.cables.gl" &&
            CABLES.build &&
            CABLES.build.git.branch == "master"
        )
            notifyError("core: using master branch not on live?!");
        if (
            document.location.hostname != "cables.gl" &&
            document.location.hostname != "sandbox.cables.gl" &&
            CABLES.UI.build &&
            CABLES.UI.build.git.branch == "master"
        )
            notifyError("UI: using master branch not on live?!");
    }

    savePatch(options, cb)
    {
        this.talkerAPI.send("savePatch", options, cb);
    }

    initRouting(cb)
    {
        gui.setUser(this._cfg.user);

        this.talkerAPI.addEventListener("notify", (options, _next) =>
        {
            notify(options.msg, options.text, options.options);
        });

        this.talkerAPI.addEventListener(
            "notifyError",
            (options, _next) =>
            {
                notifyError(options.msg, options.text, options.options);
            },
        );

        this.talkerAPI.addEventListener(
            "refreshFileManager",
            (_options, _next) =>
            {
                gui.closeModal();
                gui.refreshFileManager();
            },
        );

        this.talkerAPI.addEventListener("executeOp", (options, _next) =>
        {
            if (options && options.name)
            {
                gui.serverOps.execute(options.id || options.name, () =>
                {
                    if (options.forceReload && options.name)
                    {
                        const editorTab = gui.mainTabs.getTabByDataId(options.name);
                        if (
                            editorTab &&
                            editorTab.editor &&
                            options.hasOwnProperty("code")
                        )
                        {
                            editorTab.editor.setContent(options.code, true);
                        }
                    }
                    notify("reloaded op " + options.name);
                });
            }
        });

        this.talkerAPI.addEventListener(
            "fileUpdated",
            (options, _next) =>
            {
                if (options && options.filename)
                {
                    for (let j = 0; j < gui.corePatch().ops.length; j++)
                    {
                        if (gui.corePatch().ops[j])
                        {
                            if (gui.corePatch().ops[j].onFileChanged)
                                gui.corePatch().ops[j].onFileChanged(options.filename);
                            else if (gui.corePatch().ops[j].onFileUploaded)
                                gui.corePatch().ops[j].onFileUploaded(options.filename); // todo deprecate , rename to onFileChanged
                        }
                    }
                    if (options.filename.endsWith(".js"))
                    {
                        const libUrl =
                            "/assets/" + gui.project()._id + "/" + options.filename;
                        if (
                            gui &&
                            gui.opDocs &&
                            gui.opDocs.libs &&
                            !gui.opDocs.libs.includes(libUrl)
                        )
                        {
                            gui.opDocs.libs.push(libUrl);
                            gui.emitEvent("refreshManageOp");
                        }
                    }
                }
            },
        );

        this.talkerAPI.addEventListener(
            "fileDeleted",
            (options, _next) =>
            {
                if (options && options.fileName && options.fileName.endsWith(".js"))
                {
                    for (let j = 0; j < gui.corePatch().ops.length; j++)
                    {
                        if (gui.corePatch().ops[j])
                        {
                            if (gui.corePatch().ops[j].onFileChanged)
                                gui.corePatch().ops[j].onFileChanged(options.fileName);
                            else if (gui.corePatch().ops[j].onFileUploaded)
                                gui.corePatch().ops[j].onFileUploaded(options.fileName); // todo deprecate , rename to onFileChanged
                        }
                    }

                    const libUrl =
                        "/assets/" + gui.project()._id + "/" + options.fileName;
                    if (
                        gui &&
                        gui.opDocs &&
                        gui.opDocs.libs &&
                        gui.opDocs.libs.includes(libUrl)
                    )
                    {
                        const libIndex = gui.opDocs.libs.findIndex((lib) =>
                        {
                            return lib === libUrl;
                        });
                        if (libIndex !== -1)
                        {
                            gui.opDocs.libs.splice(libIndex, 1);
                            gui.emitEvent("refreshManageOp");
                        }
                    }
                }
            },
        );

        this.talkerAPI.addEventListener("jobStart", (options, _next) =>
        {
            gui.jobs().start({ "id": options.id, "title": options.title });
        });

        this.talkerAPI.addEventListener("jobFinish", (options, _next) =>
        {
            gui.jobs().finish(options.id);
        });

        this.talkerAPI.addEventListener(
            "jobProgress",
            (options, _next) =>
            {
                gui.jobs().setProgress(options.id, options.progress);
            },
        );

        this.talkerAPI.addEventListener(
            "updatePatchName",
            (opts, _next) =>
            {
                gui.setProjectName(opts.name);
                this.talkerAPI.send("updatePatchName", opts, (_err, _r) => { });
            },
        );

        this.talkerAPI.addEventListener(
            "updatePatchSummary",
            (opts, _next) =>
            {
                const project = gui.project();
                if (project) gui.project().summary = opts;
                gui.patchParamPanel.show(true);
            },
        );

        this.talkerAPI.send("getPatch", {}, (_err, r) =>
        {
            this._cfg.patch = r;
            incrementStartup();
            this.initializeProject(() =>
            {
                if (cb) cb();
            });
        });
    }

    createBackup()
    {
        const backupOptions = { "title": name || "" };

        const modalNotices = [];
        if (gui && gui.user && platform.isTrustedPatch() && gui.user.supporterFeatures && !this.patchIsBackup())
        {
            const exportUrl = platform.getCablesUrl() + "/export/" + gui.patchId + "#patch";
            const importUrl = platform.getCablesUrl() + "/mydata#import";
            const quotaOverviewUrl = platform.getCablesUrl() + "/mydata";

            if (gui.user.supporterFeatures.includes("full_project_backup") || gui.user.supporterFeatures.includes("overquota_full_project_backup"))
            {
                let modalText = "Enter a name for the backup";
                if (gui.user.supporterFeatures.includes("overquota_full_project_backup"))
                {
                    modalText = "You are currently using all of your <a href=\"" + quotaOverviewUrl + "\" target=\"_blank\">backup storage space</a>. Upgade your <a href=\"https://cables.gl/support\" target=\"_blank\">cables supporter level</a> to get more space.<br/>";
                    modalText += "To free space your oldest backup will automatically be deleted, automatic backups are currently disabled!<br/><br/>";
                    modalText += "You can still <a href=\"" + exportUrl + "\" target=\"_blank\">export your patch</a> and <a href=\"" + importUrl + "\" target=\"_blank\">import</a> it later.";
                }
                const backupModalOptions = {
                    "prompt": true,
                    "title": "Patch Backup",
                    "text": modalText,
                    "notices": modalNotices,
                    "promptValue": "Manual Backup",
                    "promptOk": (title) =>
                    {
                        backupOptions.title = title;
                        gui.jobs().start({ "id": "patchCreateBackup", "title": "creating backup", "indicator": "canvas" });
                        this.talkerAPI.send("patchCreateBackup", backupOptions);
                    }
                };

                if (!gui.getSavedState())
                {
                    new ModalDialog({
                        "choice": true,
                        "cancelButton": {
                            "text": "Backup last saved state",
                            "callback": () =>
                            {
                                new ModalDialog(backupModalOptions);
                            },
                        },
                        "title": "Backup",
                        "warning": true,
                        "text": text.projectBackupNotSaved,
                    });

                }
                else
                {
                    new ModalDialog(backupModalOptions);
                }

            }
            else
            {
                let modalText = "Become a <a href=\"https://cables.gl/support\" target=\"_blank\">cables supporter</a>, to backup projects including assets and ops!<br/>";
                modalText += "You can still <a href=\"" + exportUrl + "\" target=\"_blank\">export your patch</a> and <a href=\"" + importUrl + "\" target=\"_blank\">import</a> it later.";
                new ModalDialog({
                    "title": "Patch Backup",
                    "text": modalText,
                    "showOkButton": true
                });
            }
        }
        else
        {
            let modalText = "Not possible to create a backup of this patch.";
            if (this.patchIsBackup()) modalText += "<br/>You cannot create a backup of a backup!";
            new ModalDialog({
                "showOkButton": true,
                "warning": true,
                "title": "Patch Backup",
                "text": modalText
            });
        }

    }

    initializeProject(cb)
    {
        const proj = this._cfg.patch;
        incrementStartup();
        if (window.logStartup) logStartup("set project");
        gui.patchView.setProject(proj, cb);
        if (proj.ui) gui.bookmarks.set(proj.ui.bookmarks);
    }

    /**
     * @param {string} inputId
     * @param {number} filterType
     * @param {string} opid
     * @param {string} previewId
     */
    showFileSelect(inputId, filterType, opid, previewId)
    {
        this._log.log("showFileSelect", inputId, filterType, opid, previewId);
        gui.showFileManager(() =>
        {
            this._log.log("showFileSelect22222");
            const portInputEle = ele.byQuery(inputId);
            if (!portInputEle)
            {
                this._log.warn("[showfileselect] no portInputEle");
                return;
            }
            const fn = portInputEle.value;

            gui.fileManager.setFilterType(filterType);
            gui.fileManager.setFilePort(
                portInputEle,
                gui.corePatch().getOpById(opid),
                ele.byId(previewId),
            );
            gui.fileManager.selectFile(fn);

            ele.byId("menubar").scrollIntoView({ "block": "end" }); // dont ask why... without "some"(background image op) file selects make the page scroll............
        });
    }

    openOpDirsTab()
    {
        if (this.frontendOptions.hasOpDirectories)
        {
            new ElectronOpDirs(gui.mainTabs);
            gui.maintabPanel.show(true);
        }
    }

    patchIsBackup()
    {
        return this._cfg && !!this._cfg.patchVersion;
    }

    /**
     * @param {string} projectId
     */
    exportPatch(projectId)
    {
        let gotoUrl = platform.getCablesUrl() + "/export/" + projectId;
        let url = "";
        if (this.patchIsBackup())
        {
            gotoUrl += "?version=" + this._cfg.patchVersion;
            url = gotoUrl + "&iframe=true";
        }
        else
        {
            url = gotoUrl + "?iframe=true";
        }

        gui.mainTabs.addIframeTab(
            "Export Patch",
            url,
            {
                "icon": "settings",
                "closable": true,
                "singleton": false,
                "gotoUrl": gotoUrl,
            },
            true,
        );
    }

    getPatchOpsNamespace()
    {
        const PATCHOPS_ID_REPLACEMENTS = {
            "-": "___",
        };
        let ns = gui.project().shortId;
        Object.keys(PATCHOPS_ID_REPLACEMENTS).forEach((key) =>
        {
            if (ns) ns = ns.replaceAll(key, PATCHOPS_ID_REPLACEMENTS[key]);
        });
        return defaultOps.prefixes.patchOp + ns + ".";
    }

    getSupportedOpDependencyTypes()
    {
        const types = ["lib", "corelib", "commonjs", "module", "op"];
        if (this.frontendOptions.npm) types.push("npm");
        return types;
    }

    /**
     *
     * @param {Boolean} state
     */
    setSaving(state)
    {
        gui.patchView.store.isSaving = state;
    }

    /**
     *
     * @return {Boolean}
     */
    isSaving()
    {
        return gui.patchView.store.isSaving;
    }

    getDefaultOpName()
    {
        return defaultOps.newOpNameSuggestion;
    }
}
