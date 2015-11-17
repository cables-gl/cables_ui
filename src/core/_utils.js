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

Math.randomSeed=1;
Math.seededRandom = function(max, min)
{
    if(Math.randomSeed===0)Math.randomSeed=Math.random()*999;
    max = max || 1;
    min = min || 0;

    Math.randomSeed = (Math.randomSeed * 9301 + 49297) % 233280;
    var rnd = Math.randomSeed / 233280.0;

    return min + rnd * (max - min);
};

// ----------------------------------------------------------------

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};
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

// ----------------------------------------------------------------

CABLES=CABLES || {};

CABLES.ajax=function(url,cb,method,post,contenttype)
{
    var requestTimeout,xhr;
    try{ xhr = new XMLHttpRequest(); }catch(e){}

    // requestTimeout = setTimeout(function() {xhr.abort(); cb(new Error("tinyxhr: aborted by a timeout"), "",xhr); }, 30000);
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState != 4) return;
        clearTimeout(requestTimeout);


        cb(xhr.status != 200?new Error(url+"server response status is "+xhr.status):false, xhr.responseText,xhr);
    };
    xhr.open(method?method.toUpperCase():"GET", url, true);

    if(!post) xhr.send();
    else
    {
        xhr.setRequestHeader('Content-type', contenttype?contenttype:'application/x-www-form-urlencoded');
        xhr.send(post);
    }
};

// ----------------------------------------------------------------


String.prototype.endl = function(){return this+'\n';};

// ----------------------------------------------------------------

var arrayContains = function(arr,obj)
{
    var i = arr.length;
    while (i--)
    {
        if (arr[i] === obj)
        {
            return true;
        }
    }
    return false;
};

// ----------------------------------------------------------------

CGL=CGL || {};
CGL.DEG2RAD=3.14159/180.0;
CGL.numMaxLoadingAssets=0;
CGL.numLoadingAssets=0;

CGL.onLoadingAssetsFinished=null;


CGL.resetLoadingStatus=function()
{
    CGL.numMaxLoadingAssets=0;
    CGL.numLoadingAssets=0;
};

CGL.finishedLoading=function()
{
    return CGL.numLoadingAssets!==0;
};

CGL.incrementLoadingAssets=function()
{
    CGL.numLoadingAssets++;
    CGL.numMaxLoadingAssets=Math.max(CGL.numLoadingAssets,CGL.numMaxLoadingAssets);
};

CGL.decrementLoadingAssets=function()
{
    CGL.numLoadingAssets--;
    setTimeout(CGL.getLoadingStatus,500);
};

CGL.getLoadingStatus=function()
{
    if(CGL.numMaxLoadingAssets===0)return 0;

    var stat=(CGL.numMaxLoadingAssets-CGL.numLoadingAssets)/CGL.numMaxLoadingAssets;
    if(stat==1 && CGL.onLoadingAssetsFinished)
    {
        console.log('loading status: ',CGL.numMaxLoadingAssets,CGL.numLoadingAssets);
        CGL.onLoadingAssetsFinished();
    }
    if(CABLES.UI && CABLES.UI.GUI)
        if(stat==1)  $('#assetsloadingindicator').hide();
            else  $('#assetsloadingindicator').show();

    return stat;
};


CGL.getWheelSpeed=function(event)
{
    var normalized;
    if (event.wheelDelta)
    {
        normalized = (event.wheelDelta % 120 - 0) == -0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
    }
    else
    {
        var rawAmmount = event.deltaY ? event.deltaY : event.detail;
        normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
    }

    normalized*=-4.0;
    if(normalized>400)normalized=400;
    if(normalized<-400)normalized=-400;
    // console.log('normalized',normalized);
        

    return normalized;
};




