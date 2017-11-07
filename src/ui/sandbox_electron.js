
var CABLES=CABLES||{};

CABLES.SandboxElectron=function()
{
    console.log("starting electron sandbox");

    var ipc = require('electron').ipcRenderer; // for communication with electron main thread
    
    // called when open patch was clicked
    ipc.on('loadPatch', function(event, patchContentAsString) {
      console.log('patchContentAsString: ', patchContentAsString);
      var patch = JSON.parse(patchContentAsString);
      gui.patch().setProject(patch);
    });
};

CABLES.SandboxElectron.prototype.getUrlOpsCode=function()
{
    return 'code.js';
}

CABLES.SandboxElectron.prototype.initRouting=function(cb)
{
    if (!gui.serverOps || !gui.serverOps.finished()) {
        // wait for userops finished loading....
        setTimeout(function() {
            CABLES.sandbox.initRouting(cb);
        }, 100);
        // console.log("wait...");
        return;
    }

    gui.patch().setProject(
        {
            users:[],
            tags:[],
            ops:[]
        });
    cb();
}

CABLES.SandboxElectron.prototype.getUrlDocOpsAll=function(id)
{
    return 'docops.json';
};

CABLES.SandboxElectron.prototype.getUrlApiPrefix=function(id)
{
    return "";
};

CABLES.SandboxElectron.prototype.getUrlOpsList=function(id)
{
    return 'ops.json';
};



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





