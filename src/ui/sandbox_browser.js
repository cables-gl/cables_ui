
var CABLES=CABLES||{};

CABLES.SandboxBrowser=function(cfg)
{
    CABLES.EventTarget.apply(this);

    this._cfg=cfg;
    console.log("starting browser sandbox",cfg,window.gui);

    // CABLES.UI.talker.onMessage=function(msg)
    // {
    //     console.log('[sandbox talker]',msg);
    //     // if(msg.namespace=="onPatchSaved")
    //     // {
    //     //     // console.log(msg.data,msg.data.urlCables);
    //     //     // CABLES.loadAll(msg.data);
    //     //     console.log("yay saved!");
            
    //     // }

    //     if(msg.data.event)
    //         this.emitEvent(msg.data.event,msg.data);
    // }.bind(this);

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
    console.log("sandbox save patch");
    CABLES.talkerAPI.send("savePatch",options,cb);

    // CABLES.UI.talker.send('cables', 
    // {
    //     "cmd":"savePatch",
    //     "options":options
    // } );


}


CABLES.SandboxBrowser.prototype.initRouting=function(cb)
{
    // if (!gui.serverOps || !gui.serverOps.finished()) {
    //     // wait for userops finished loading....
    //     setTimeout(function() {
    //         CABLES.sandbox.initRouting(cb);
    //     }, 100);
    //     return;
    // }

    // console.log("hallo route!");


    // console.log('viewer requesting patch!');

    // CABLES.UI.talker.onMessage = function(message)
    // {
    //     console.log('sandbox received', message.data);
    //     if(message.data.cmd=='patch')
    //     {
    //         this._loadPatch(message.data.patch,cb);
    //     }
    //     if(message.data.cmd=='cables.config')
    //     {
    //         console.log('got config!',message.data);
            // this._loadPatch(message.data.patch,cb);
    //     }
    // }.bind(this);

    // CABLES.UI.talker.send('cables', {"cmd":"sendpatch"} );
    // CABLES.UI.talker.send('cables', {"cmd":"sendConfig"} );


    gui.user=this._cfg.user;
    gui.patch().setProject(this._cfg.patch);

    if(cb)cb();











    // logStartup('init routing...');
    // var router = new Simrou();

    // router.addRoute('/').get(function(event, params) {});

    // function loadProject(id, ver) {
    //     if (gui.patch().scene.cgl.aborted) {
    //         cb();
    //         return;
    //     }

    //     if(ver) ver = '/version/' + ver;
    //     else ver = "";

    //     CABLES.UI.MODAL.showLoading('Loading');
    //     CABLES.api.get('project/' + id + ver, function(proj)
    //     {
    //         CABLES.api.get('project/'+id+'/users',
    //             function(userData)
    //             {
    //                 gui.user.isPatchOwner=true;
    //                 for(var i=0;i<userData.length;i++)
    //                 {
    //                     if(userData[i].owner && userData[i]._id!=gui.user.id)
    //                     {
    //                         gui.user.isPatchOwner=false;
    //                     }
    //                 }
            
    //                 incrementStartup();
    //                 var userOpsUrls = [];

    //                 for (var i in proj.userList) {
    //                     userOpsUrls.push('/api/ops/code/' + CABLES.UI.sanitizeUsername(proj.userList[i]));
    //                 }

    //                 var lid = 'userops' + proj._id + CABLES.generateUUID();
    //                 loadjs.ready(lid, function()
    //                     {
    //                         incrementStartup();
    //                         logStartup('User Ops loaded');
                            
    //                         gui.patch().setProject(proj);
                            
    //                         if (proj.ui)
    //                         {
    //                             gui.bookmarks.set(proj.ui.bookmarks);
    //                             $('#options').html(gui.bookmarks.getHtml());
    //                         }

    //                         gui.patch().showProjectParams();
    //                         cb();
    //                     });
    //                 loadjs(userOpsUrls, lid);
    //             });
    
                
    //     }, function(){
    //         $('#loadingInfo').append('Error: Unknown Project');
    //     });
    // }

    // router.addRoute('/project/:id/v/:ver').get(function(event, params)
    // {
    //     console.log('load version ',params.ver);
    //     loadProject(params.id, params.ver);
    //     // CABLES.UI.MODAL.showLoading('Loading');
    //     // CABLES.api.get('project/'+params.id+'/version/'+params.ver,function(proj)
    //     // {
    //     //     self.patch().setProject(proj);
    //     // });
    // });

    // router.addRoute('/project').get(function(event, params) {
    //     console.log('no projectid?');
    //     $('#loadingInfo').append('Error: No Project ID in URL');
    // });

    // router.addRoute('/project/:id').get(function(event, params) {
    //     loadProject(params.id);
    // });

    // router.start('/');
};