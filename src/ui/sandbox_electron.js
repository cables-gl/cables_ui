
var CABLES=CABLES||{};

CABLES.SandboxElectron=function()
{
    console.log("starting electron sandbox");
};

CABLES.SandboxElectron.prototype.getUrlOpsCode=function()
{
    return 'code.js';
}

CABLES.SandboxElectron.prototype.initRouting=function(cb)
{
    gui.patch().setProject(
        {
            users:[],
            tags:[],
            ops:[]
        });
    cb();
}

CABLES.SandboxElectron.prototype.loadUser=function(cb,cbError)
{

    if(cb)
    {
        cb(
            {
                username:"cables",
                usernameLowercase:"cables",
                isAdmin:true,
                isStaff:true
            });
    }
    
};





