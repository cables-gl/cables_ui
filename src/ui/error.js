
window.onerror=function(err,file,row)
{
    var str="";
    str+='<h2>error</h2>';
    str+='<br/>';
    str+='message:'+err+'<br/>';
    str+='<br/>';
    str+='file: '+file+'<br/>';
    str+='row: '+row+'<br/>';

    CABLES.UI.MODAL.show(str);

};

