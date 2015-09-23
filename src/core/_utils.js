function generateUUID()
{
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
    {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// ----------------------------------------------------------------
function ajaxRequest(url, callback)
{
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function(e)
    {
        callback(e.target.response);
    };
    request.send();
}

String.prototype.endl = function(){return this+'\n';};


CGL=CGL || {};

CGL.numMaxLoadingAssets=0;
CGL.numLoadingAssets=0;

CGL.incrementLoadingAssets=function()
    {
        CGL.numLoadingAssets++;
        CGL.numMaxLoadingAssets=Math.max(CGL.numLoadingAssets,CGL.numMaxLoadingAssets);
        console.log('loading... ',CGL.numLoadingAssets+" / "+CGL.numMaxLoadingAssets);
        console.log('loading... ',CGL.getLoadingStatus());
    };

CGL.decrementLoadingAssets=function(){ CGL.numLoadingAssets--;};
CGL.getLoadingStatus=function(){ return CGL.numLoadingAssets/CGL.numMaxLoadingAssets; };


