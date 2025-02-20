import { Events, Logger, ele } from "cables-shared-client";
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
    constructor(cfg)
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

        if (cfg.usersettings && cfg.usersettings.settings) userSettings.load(cfg.usersettings.settings);
        else userSettings.load({});

        window.addEventListener("online", this.updateOnlineIndicator.bind(this));
        window.addEventListener("offline", this.updateOnlineIndicator.bind(this));
        this.updateOnlineIndicator();
    }

    get config()
    {
        return this._cfg;
    }

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
        return "https://github.com/cables-gl/cables_docs/issues";
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
            this._checkOfflineInterval = setInterval(() =>
            {
                gui.patchView.store.checkUpdated(() => { }, false, true);
            }, this._checkOfflineIntervalSeconds);
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

        this.talkerAPI.addEventListener("notify", (options, next) =>
        {
            notify(options.msg, options.text, options.options);
        });

        this.talkerAPI.addEventListener(
            "notifyError",
            (options, next) =>
            {
                notifyError(options.msg, options.text, options.options);
            },
        );

        this.talkerAPI.addEventListener(
            "refreshFileManager",
            (options, next) =>
            {
                gui.closeModal();
                gui.refreshFileManager();
            },
        );

        this.talkerAPI.addEventListener("executeOp", (options, next) =>
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
            (options, next) =>
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
            (options, next) =>
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

        this.talkerAPI.addEventListener("jobStart", (options, next) =>
        {
            gui.jobs().start({ "id": options.id, "title": options.title });
        });

        this.talkerAPI.addEventListener("jobFinish", (options, next) =>
        {
            gui.jobs().finish(options.id);
        });

        this.talkerAPI.addEventListener(
            "jobProgress",
            (options, next) =>
            {
                gui.jobs().setProgress(options.id, options.progress);
            },
        );

        this.talkerAPI.addEventListener(
            "updatePatchName",
            (opts, next) =>
            {
                gui.setProjectName(opts.name);
                this.talkerAPI.send("updatePatchName", opts, (err, r) => { });
            },
        );

        this.talkerAPI.addEventListener(
            "updatePatchSummary",
            (opts, next) =>
            {
                const project = gui.project();
                if (project) gui.project().summary = opts;
                gui.patchParamPanel.show(true);
            },
        );

        this.talkerAPI.send("getPatch", {}, (err, r) =>
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
        const showBackupDialog = () =>
        {
            const backupOptions = { "title": name || "" };

            const checkboxGroups = [];
            const modalNotices = [];
            if (gui && gui.user && gui.user.supporterFeatures)
            {
                if (gui.user.supporterFeatures.includes("full_project_backup"))
                {
                    new ModalDialog({
                        "prompt": true,
                        "title": "Patch Backup",
                        "text": "Enter a name for the backup",
                        "notices": modalNotices,
                        "checkboxGroups": checkboxGroups,
                        "promptValue": "Manual Backup",
                        "promptOk": (name, checkboxStates) =>
                        {
                            backupOptions.destination = 1;
                            this.talkerAPI.send("patchCreateBackup", backupOptions, (err, result) =>
                            {
                                if (result.success) notify("Backup created!");
                            });
                        }
                    });
                }
                else
                {
                    const exportUrl = platform.getCablesUrl() + "/export/" + gui.patchId + "#patch";
                    const importUrl = platform.getCablesUrl() + "/mydata#import";
                    new ModalDialog({
                        "title": "Patch Backup",
                        "text": "Become a <a href=\"https://cables.gl/support\" target=\"_blank\">cables supporter</a>, to backup projects including assets and ops!</a><br/>You can still <a href=\"" + exportUrl + "\" target=\"_blank\">export your patch</a> and <a href=\"" + importUrl + "\" target=\"_blank\">import</a> it later.",
                        "showOkButton": true
                    });
                }
            }
        };

        if (!gui.getSavedState())
        {
            new ModalDialog({
                "choice": true,
                "cancelButton": {
                    "text": "Backup last saved state",
                    "callback": showBackupDialog,
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

    exportPatch(projectId)
    {
        let gotoUrl = platform.getCablesUrl() + "/export/" + projectId;
        if (this._versionId) gotoUrl += "?version=" + this._versionId;

        const iframeParam = this._versionId ? "&iframe=true" : "?iframe=true";
        const url = gotoUrl + iframeParam;

        gui.mainTabs.addIframeTab(
            "Export Patch ",
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
}
