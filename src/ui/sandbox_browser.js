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

    getUrlOpsCode()
    {
        return this._cfg.urlCables + "/api/ops/code";
    }

    getLocalOpCode()
    {
        return ""; // no local ops in browser version
    }

    getUrlDocOpsAll()
    {
        return "doc/ops/all";
    }

    getAssetPrefix()
    {
        const url = this._cfg.urlCables + "/assets/" + this._cfg.patchId + "/";
        return url;
    }

    getUrlApiPrefix()
    {
        return this._cfg.urlCables + "/api/";
    }

    getUrlOpsList()
    {
        return "ops/";
    }

    getPatchId()
    {
        return this._cfg.patchId;
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
                iziToast.show({
                    "position": "topRight",
                    "theme": "dark",
                    "title": "update",
                    "message": "cables has been updated! ",
                    "progressBar": false,
                    "animateInside": false,
                    "close": true,
                    "timeout": false,
                    "buttons": [
                        [
                            "<button>read more</button>",
                            function (instance, toast)
                            {
                                CABLES.CMD.UI.showChangelog();
                                iziToast.hide({}, toast);
                            },
                        ],
                    ],
                });
            }
        }, userSettings.get("changelogLastView"));
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
            CABLES.UI.notifyError(options.msg);
        });

        CABLESUILOADER.talkerAPI.addEventListener("refreshFileManager", (options, next) =>
        {
            gui.closeModal();
            gui.refreshFileManager();
        });

        CABLESUILOADER.talkerAPI.addEventListener("fileUpdated", (options, next) =>
        {
            for (let j = 0; j < gui.corePatch().ops.length; j++)
            {
                if (gui.corePatch().ops[j])
                {
                    if (gui.corePatch().ops[j].onFileChanged) gui.corePatch().ops[j].onFileChanged(options.filename);
                    else if (gui.corePatch().ops[j].onFileUploaded) gui.corePatch().ops[j].onFileUploaded(options.filename); // todo deprecate , rename to onFileChanged
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

        CABLESUILOADER.talkerAPI.send("getPatch", {}, (err, r) =>
        {
            this._cfg.patch = r;
            incrementStartup();
            this.loadUserOps(() =>
            {
                if (cb) cb();
            });
        });
    }

    createBackup()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({
                "showOkButton": true,
                "title": "Backup",
                "warning": true,
                "text": text.projectBackupNotSaved,
            });

            return;
        }

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
    }

    sanitizeUsername(name)
    {
        name = name.toLowerCase();
        name = name.split(" ").join("_");
        name = name.replace(/\./g, "_");
        if (name.match(/^\d/))name = "u_" + name;
        return name;
    }

    loadUserOps(cb)
    {
        const userOpsUrls = [];
        const proj = this._cfg.patch;


        for (const i in proj.userList) userOpsUrls.push(CABLESUILOADER.noCacheUrl(this.getCablesUrl() + "/api/ops/code/" + this.sanitizeUsername(proj.userList[i])));

        const lid = "userops" + proj._id + CABLES.generateUUID();
        loadjs.ready(lid, () =>
        {
            incrementStartup();
            logStartup("User Ops loaded");

            gui.patchView.setProject(proj, cb);

            if (proj.ui)
            {
                gui.bookmarks.set(proj.ui.bookmarks);
                document.getElementById("options").innerHTML = gui.bookmarks.getHtml();
            }
        });

        loadjs(userOpsUrls, lid);
    }
}
