
window.onerror=function(err,file,row)
{
    var str="";
    str+='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/ ...</h2>';
    str+='error:'+err+'<br/>';
    str+='<br/>';
    str+='file: '+file+'<br/>';
    str+='row: '+row+'<br/>';

    if(CABLES && CABLES.UI && CABLES.UI.MODAL) CABLES.UI.MODAL.show(str);
};
