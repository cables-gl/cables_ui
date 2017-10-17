
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




