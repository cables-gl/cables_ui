CABLES = CABLES || {};

CABLES.SandboxBrowser = function (cfg)
{
    CABLES.EventTarget.apply(this);
    this._cfg = cfg;

    if (cfg.usersettings && cfg.usersettings.settings) CABLES.UI.userSettings.load(cfg.usersettings.settings);
    else CABLES.UI.userSettings.load({});

    window.addEventListener("online", this.updateOnlineIndicator.bind(this));
    window.addEventListener("offline", this.updateOnlineIndicator.bind(this));
    this.updateOnlineIndicator();
};

CABLES.SandboxBrowser.prototype.updateOnlineIndicator = function ()
{
    if (this.isOffline()) document.getElementById("offlineIndicator").classList.remove("hidden");
    else document.getElementById("offlineIndicator").classList.add("hidden");
};

CABLES.SandboxBrowser.prototype.isOffline = function ()
{
    return !navigator.onLine;
};

CABLES.SandboxBrowser.prototype.setManualScreenshot = function (b)
{
    this._cfg.patch.settings.manualScreenshot = b;
};

CABLES.SandboxBrowser.prototype.manualScreenshot = function ()
{
    return this._cfg.patch.settings.manualScreenshot;
};

CABLES.SandboxBrowser.prototype.getCablesUrl = function ()
{
    return this._cfg.urlCables;
};

CABLES.SandboxBrowser.prototype.getUrlOpsCode = function ()
{
    return this._cfg.urlCables + "/api/ops/code";
};

CABLES.SandboxBrowser.prototype.getLocalOpCode = function ()
{
    return ""; // no local ops in browser version
};

CABLES.SandboxBrowser.prototype.getUrlDocOpsAll = function ()
{
    return "doc/ops/all";
};

CABLES.SandboxBrowser.prototype.getAssetPrefix = function ()
{
    const url = this._cfg.urlCables + "/assets/" + this._cfg.patchId + "/";
    return url;
};

CABLES.SandboxBrowser.prototype.getUrlApiPrefix = function ()
{
    return this._cfg.urlCables + "/api/";
};

CABLES.SandboxBrowser.prototype.getUrlOpsList = function ()
{
    return "ops/";
};

CABLES.SandboxBrowser.prototype.getPatchId = function ()
{
    return this._cfg.patchId;
};

CABLES.SandboxBrowser.prototype.getPatchVersion = function ()
{
    return this._cfg.patchVersion;
};

CABLES.SandboxBrowser.prototype.getSocketclusterConfig = function ()
{
    return this._cfg.socketcluster;
};

CABLES.SandboxBrowser.prototype.isDevEnv = function ()
{
    return this._cfg.isDevEnv;
};


CABLES.SandboxBrowser.prototype.showStartupChangelog = function ()
{
    const lastView = CABLES.UI.userSettings.get("changelogLastView");
    const cl = new CABLES.UI.ChangelogToast();

    cl.getHtml((clhtml) =>
    {
        if (clhtml !== null)
        {
            iziToast.show({
                "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
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
            // if(html.length>0)html+='<hr/><br/><br/>';
            // html+=clhtml;
        }
        // show(html);
    }, CABLES.UI.userSettings.get("changelogLastView"));
};

CABLES.SandboxBrowser.prototype.showBrowserWarning = function (id)
{
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

    if (!gui.isRemoteClient && !window.chrome && !isFirefox && !CABLES.UI.userSettings.get("nobrowserWarning"))
    {
        iziToast.error({
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            "title": CABLES.UI.TEXTS.notOptimizedBrowser_title,
            "message": CABLES.UI.TEXTS.notOptimizedBrowser_text,
            "progressBar": false,
            "animateInside": false,
            "close": true,
            "timeout": false,
        });
    }
};


CABLES.SandboxBrowser.prototype.addMeUserlist = function (options, cb)
{
    CABLESUILOADER.talkerAPI.send("addMeUserlist", {}, (err, r) =>
    {
        gui.project().users.push(gui.user.id);

        if (cb)cb();
    });
};

CABLES.SandboxBrowser.prototype.getBlueprintOps = function (options, cb)
{
    CABLESUILOADER.talkerAPI.send("getBlueprintOps", options, (err, r) =>
    {
        if (cb)cb(err, r);
    });
};

CABLES.SandboxBrowser.prototype.savePatch = function (options, cb)
{
    const proj = this._cfg.patch;

    // const cansave=proj.userList.indexOf(this._cfg.user.username);
    // console.log("can save",cansave,proj.userList);

    // for (var i in proj.userList) //userOpsUrls.push(this.getablesUrl() + "/api/ops/code/" + CABLES.UI.sanitizeUsername(proj.userList[i]));
    // console.log(proj.userList[i]1)


    CABLESUILOADER.talkerAPI.send("savePatch", options, cb);
};

CABLES.SandboxBrowser.prototype.initRouting = function (cb)
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
        CABLES.UI.MODAL.hide();
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
};

CABLES.SandboxBrowser.prototype.createBackup = function ()
{
    CABLES.UI.MODAL.prompt(
        "New Backup",
        "Enter a name for the backup",
        "Manual Backup",
        function (name)
        {
            CABLESUILOADER.talkerAPI.send("patchCreateBackup", { "title": name || "" }, (err, result) =>
            {
                if (result.success)
                    CABLES.UI.notify("Backup created!");
            });
        });
};

CABLES.SandboxBrowser.prototype.loadUserOps = function (cb)
{
    const userOpsUrls = [];
    const proj = this._cfg.patch;

    for (const i in proj.userList) userOpsUrls.push(this.getCablesUrl() + "/api/ops/code/" + CABLES.UI.sanitizeUsername(proj.userList[i]));

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
};
