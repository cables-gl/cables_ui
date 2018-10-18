
var CABLES=CABLES||{};

CABLES.SandboxBrowser=function()
{
    // console.log("starting browser sandbox");
};


CABLES.SandboxBrowser.prototype.loadUser=function(cb,cbError)
{

    CABLES.api.get('user/me',
        function(data) {
            if (data.user)
            {
                if(cb)cb(data.user);
            }
            else
            {
                console.log("not logged in ???");
            }
        },
        function(data) {
            gui.redirectNotLoggedIn();
        });
};

CABLES.SandboxBrowser.prototype.deleteProject=function(id)
{
    CABLES.api.delete('project/' + id, {},
    function() {
        // CABLES.UI.SELECTPROJECT.doReload=true;
        document.location.href = "/";
    });
};

CABLES.SandboxBrowser.prototype.getUrlOpsCode=function(id)
{
    return '/api/ops/code';
};

CABLES.SandboxBrowser.prototype.getLocalOpCode = function() {
    return ''; // no local ops in browser version
};

CABLES.SandboxBrowser.prototype.getUrlDocOpsAll=function(id)
{
    return 'doc/ops/all';
};

CABLES.SandboxBrowser.prototype.getUrlApiPrefix=function(id)
{
    return "/api/";
};

CABLES.SandboxBrowser.prototype.getUrlOpsList=function(id)
{
    return 'ops/';
};

CABLES.SandboxBrowser.prototype.showStartupChangelog = function() {
    var lastView = CABLES.UI.userSettings.get('changelogLastView');
    
    CABLES.CHANGELOG.getHtml(function(clhtml) {
        if (clhtml !== null) {
            iziToast.show({
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
    if (!window.chrome && !CABLES.UI.userSettings.get('nobrowserWarning')) {
        iziToast.error({
            position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            theme: 'dark',
            title: 'yikes!',
            message: 'cables is optimized for chrome, you are using something else<br/>feel free to continue, but be warned, it might behave strange',
            progressBar: false,
            animateInside: false,
            close: true,
            timeout: false
        });
    }
};

CABLES.SandboxBrowser.prototype.initRouting=function(cb)
{
    if (!gui.serverOps || !gui.serverOps.finished()) {
        // wait for userops finished loading....
        setTimeout(function() {
            CABLES.sandbox.initRouting(cb);
        }, 100);
        // console.log("wait...");
        return;
    }

    logStartup('init routing...');
    var router = new Simrou();

    router.addRoute('/').get(function(event, params) {});


    function loadProject(id, ver) {
        if (gui.patch().scene.cgl.aborted) {
            cb();
            return;
        }

        if(ver) ver = '/version/' + ver;
        else ver = "";

        CABLES.UI.MODAL.showLoading('Loading');
        CABLES.api.get('project/' + id + ver, function(proj)
        {


            CABLES.api.get('project/'+id+'/users',
                function(userData)
                {
                    console.log('userData',userData);

                    gui.user.isPatchOwner=true;
                    for(var i=0;i<userData.length;i++)
                    {
                        if(userData[i].owner && userData[i]._id!=gui.user.id)
                        {
                            gui.user.isPatchOwner=false;
                        }
                    }
            
                    incrementStartup();
                    var userOpsUrls = [];

                    for (var i in proj.userList) {
                        userOpsUrls.push('/api/ops/code/' + CABLES.UI.sanitizeUsername(proj.userList[i]));
                    }

                    var lid = 'userops' + proj._id + CABLES.generateUUID();
                    loadjs.ready(lid, function()
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
                        });
                    loadjs(userOpsUrls, lid);
                });
    
                
        }, function(){
            $('#loadingInfo').append('Error: Unknown Project');
        });
    }

    router.addRoute('/project/:id/v/:ver').get(function(event, params)
    {
        console.log('load version ',params.ver);
        loadProject(params.id, params.ver);
        // CABLES.UI.MODAL.showLoading('Loading');
        // CABLES.api.get('project/'+params.id+'/version/'+params.ver,function(proj)
        // {
        //     self.patch().setProject(proj);
        // });
    });

    router.addRoute('/project').get(function(event, params) {
        console.log('no projectid?');
        $('#loadingInfo').append('Error: No Project ID in URL');
    });

    router.addRoute('/project/:id').get(function(event, params) {
        loadProject(params.id);
    });

    router.start('/');
};