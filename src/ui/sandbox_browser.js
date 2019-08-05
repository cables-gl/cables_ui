
var CABLES=CABLES||{};

CABLES.SandboxBrowser=function(cfg)
{
    CABLES.EventTarget.apply(this);
    this._cfg=cfg;

    if(cfg.usersettings && cfg.usersettings.settings)  CABLES.UI.userSettings.load(cfg.usersettings.settings);
        else CABLES.UI.userSettings.load({});
};

CABLES.SandboxBrowser.prototype.isOffline=function()
{
    return false;
}

CABLES.SandboxBrowser.prototype.getCablesUrl=function()
{
    return this._cfg.urlCables;
};

CABLES.SandboxBrowser.prototype.getUrlOpsCode=function()
{
    return this._cfg.urlCables+'/api/ops/code';
};

CABLES.SandboxBrowser.prototype.getLocalOpCode = function() {
    return ''; // no local ops in browser version
};

CABLES.SandboxBrowser.prototype.getUrlDocOpsAll=function()
{
    return 'doc/ops/all';
};

CABLES.SandboxBrowser.prototype.getAssetPrefix=function()
{
    const url=this._cfg.urlCables+"/assets/"+this._cfg.patchId;
    return url;
};

CABLES.SandboxBrowser.prototype.getUrlApiPrefix=function()
{
    return this._cfg.urlCables+"/api/";
};

CABLES.SandboxBrowser.prototype.getUrlOpsList=function()
{
    return 'ops/';
};

CABLES.SandboxBrowser.prototype.showStartupChangelog = function() {
    var lastView = CABLES.UI.userSettings.get('changelogLastView');
    
    CABLES.CHANGELOG.getHtml(function(clhtml) {
        if (clhtml !== null)
        {
            iziToast.show(
                {
                    position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
                    theme: 'dark',
                    title: 'update',
                    message: 'cables has been updated! ',
                    progressBar: false,
                    animateInside: false,
                    close: true,
                    timeout: false,
                    buttons: [
                        ['<button>read more</button>', function(instance, toast) {
                            CABLES.CMD.UI.showChangelog();
                            iziToast.hide({}, toast);
                        }]
                    ]

                });
            // if(html.length>0)html+='<hr/><br/><br/>';
            // html+=clhtml;
        }
        // show(html);
    }, CABLES.UI.userSettings.get('changelogLastView'));
};

CABLES.SandboxBrowser.prototype.showBrowserWarning=function(id)
{
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if(!window.chrome && !isFirefox && !CABLES.UI.userSettings.get('nobrowserWarning'))
    {
        iziToast.error({
            position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            theme: 'dark',
            title: 'oops!', //yikes!
            message: 'cables is optimized for firefox and chrome, you are using something else<br/>feel free to continue, but be warned, it might behave strange',
            progressBar: false,
            animateInside: false,
            close: true,
            timeout: false
        });
    }
};

CABLES.SandboxBrowser.prototype.savePatch=function(options,cb)
{
    CABLES.talkerAPI.send("savePatch",options,cb);
}

CABLES.SandboxBrowser.prototype.initRouting=function(cb)
{
    gui.user=this._cfg.user;


    CABLES.talkerAPI.addEventListener(
        "notify",
        function(options,next)
        {
            CABLES.UI.notify(options.msg);
        });

    CABLES.talkerAPI.addEventListener(
        "notifyError",
        function(options,next)
        {
            CABLES.UI.notifyError(options.msg);
        });

    CABLES.talkerAPI.addEventListener(
        "refreshFileManager",
        function(options,next)
        {
            CABLES.UI.MODAL.hide();
            gui.refreshFileManager();
        });

    // CABLES.talkerAPI.addEventListener(
    //     "uploadProgress",
    //     function(options,next)
    //     {
    //         if(options.complete>=100)
    //         {
    //             $('#uploadprogresscontainer').hide();
    //             CABLES.UI.notify("File Uploaded");
    //         }
    //         else $('#uploadprogresscontainer').show();


    //         console.log("file upl!",options.complete);
    //         $('#uploadprogress').css({"width":options.complete+'%'});
    
    //         gui.refreshFileManager();
    //     });

    CABLES.talkerAPI.addEventListener(
        "jobStart",
        function(options,next)
        {
            gui.jobs().start({id:options.id,title:options.title});
        });

    CABLES.talkerAPI.addEventListener(
        "jobFinish",
        function(options,next)
        {
            gui.jobs().finish(options.id);
        });

    CABLES.talkerAPI.addEventListener(
        "jobProgress",
        function(options,next)
        {
            gui.jobs().setProgress(options.id,options.progress);
        });
        
    CABLES.talkerAPI.send("getPatch",{},function(err,r)
    {
        this._cfg.patch=r;
        incrementStartup();
        this.loadUserOps(function()
        {
            console.log("setpatch...");
            if(cb)cb();
        }.bind(this));
    }.bind(this));
    
};

CABLES.SandboxBrowser.prototype.loadUserOps=function(cb)
{
    var userOpsUrls = [];
    var proj=this._cfg.patch;

    for (var i in proj.userList)
        userOpsUrls.push(this.getCablesUrl()+'/api/ops/code/' + CABLES.UI.sanitizeUsername(proj.userList[i]));

    var lid = 'userops' + proj._id + CABLES.generateUUID();
    loadjs.ready(lid, 
        function()
        {
            incrementStartup();
            logStartup('User Ops loaded');

            gui.patch().setProject(proj);

            if (proj.ui)
            {
                gui.bookmarks.set(proj.ui.bookmarks);
                $('#options').html(gui.bookmarks.getHtml());
            }

            gui.patch().showProjectParams();
            cb();
        }.bind(this));

    loadjs(userOpsUrls, lid);
    
    
}

