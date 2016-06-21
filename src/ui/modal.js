//http://html5doctor.com/drag-and-drop-to-server/


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.MODAL=CABLES.UI.MODAL || {};

CABLES.UI.MODAL.hideLoading=function()
{
    if($('.modalLoading').length>0)
    {
        CABLES.UI.MODAL.hide();
    }
};

CABLES.UI.MODAL.hide=function(force)
{
    if(!force && $('.modalerror').length>0)
    {
        return;
    }

    // console.log('modal hide ',$('.modalLoading').length);
    mouseNewOPX=0;
    mouseNewOPY=0;

    $('#modalcontent').html('');
    $('#modalcontent').hide();
    $('#modalbg').hide();
    $('.tooltip').hide();
};

CABLES.UI.MODAL.show=function(content,options)
{
    $('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide(true);"></a></div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};

CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div class="modalLoading" style="text-align:center;"><h3>'+title+'</h3><i class="fa fa-2x fa-circle-o-notch fa-spin"></i><br/><br/><div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();
};

CABLES.UI.MODAL.showError=function(title,content)
{
    $('#modalcontent').html('<div class="modalclose modalerror"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide(true);"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;'+title+'!</h2>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};


CABLES.UI.MODAL.showException=function(ex,op)
{
    // str+='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
    // str+='error:'+err+'<br/>';
    // str+='<br/>';
    // str+='file: '+file+'<br/>';
    // str+='row: '+row+'<br/>';
    console.log(ex.stack);
    $('#modalcontent').html('<div class="modalclose modalerror"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide(true);"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail :/</h2>');

    CABLES.UI.errorReport={
        exception:ex
    };

    if(op)
    {
        $('#modalcontent').append('<h3>in op:'+op.name+'</h3>');
        CABLES.UI.errorReport.opname=op.name;
    }

    $('#modalcontent').append(''+ex.message+'<br/><br/>');
    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    $('#modalcontent').append('<br/><a onclick="gui.sendErrorReport();" id="errorReportButton" class="button">send error report</a><div id="errorReportSent" class="hidden">Report sent.</div>');
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};
