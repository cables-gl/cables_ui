
var CABLES=CABLES||{};

CABLES.SandboxBrowser=function()
{
    console.log("starting browser sandbox");
};


CABLES.SandboxBrowser.prototype.loadUser=function(cb,cbError)
{

    CABLES.api.get('user/me',
        function(data) {
            if (data.user)
            {
                if(cb)cb(data.user);
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


CABLES.SandboxBrowser.prototype.showBrowserWarning=function(id)
{
    if (!window.chrome) {
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
}    

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
            incrementStartup();
            var userOpsUrls = [];
            // console.log(proj.userList[i]+'!!!',proj);

            for (var i in proj.userList) {
                userOpsUrls.push('/api/ops/code/' + proj.userList[i]);
            }

            var lid = 'userops' + proj._id + CABLES.generateUUID();
            loadjs.ready(lid, function()
                {
                    userOpsLoaded = true;
                    incrementStartup();
                    logStartup('User Ops loaded');
                    
                    gui.patch().setProject(proj);
                    
                    if (proj.ui)
                    {
                        gui.bookmarks.set(proj.ui.bookmarks);
                        $('#options').html(gui.bookmarks.getHtml());
                    }
                    cb();
                });
            loadjs(userOpsUrls, lid);
                
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
        console.log('load project');
        loadProject(params.id);
    });

    router.start('/');
}