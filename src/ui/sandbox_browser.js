
var CABLES=CABLES||{};

CABLES.SandboxBrowser=function(cfg)
{
    CABLES.EventTarget.apply(this);
    this._cfg=cfg;
};

CABLES.SandboxBrowser.prototype.isOffline=function()
{
    return false;
}

CABLES.SandboxBrowser.prototype.deleteProject=function(id)
{
    CABLES.api.delete('project/' + id, {},
    function() {
        document.location.href = "/";
    });
};

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
    const url=this._cfg.urlCables+"/assets/"+this._cfg.patch._id;
    console.log("asset prefix",url);
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

    if ( !window.chrome && !isFirefox && !CABLES.UI.userSettings.get('nobrowserWarning')) {
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
    gui.patch().setProject(this._cfg.patch);

    if(cb)cb();
};