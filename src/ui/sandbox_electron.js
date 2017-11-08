
var CABLES=CABLES||{};

CABLES.SandboxElectron=function()
{
    console.log("starting electron sandbox");

    var ipc = require('electron').ipcRenderer; // for communication with electron main thread
    
    /**
     * called when open patch was clicked
     * @param event
     * @param message Object with filepath of patch and patch data as string – { path: '/Users/Ulf/somePatch.cables', patchAsString: '...'}
     */
    ipc.on('loadPatch', function(event, message) {
      console.log('patchContentAsString: ', message.patchAsString);
      var patch = JSON.parse(message.patchAsString);
      gui.patch().setProject(patch);
      gui.patch().filename = message.path; // store the path, so we can oversave it without a select-file prompt later
      var projectName = gui.patch().getProjectnameFromFilename(message.path);
      gui.setProjectName(projectName);
    });
};

CABLES.SandboxElectron.prototype.showStartupChangelog = function() {
    CABLES.UI.MODAL.hide(); // quickfix to hide empty modal on startup
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

// CABLES.SandboxElectron.prototype.changelog = function() {
//     console.log('fake changelog called...'); // not called
// };

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





