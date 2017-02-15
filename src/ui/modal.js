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

CABLES.UI.MODAL.showTop=function(content,options)
{
    $('#modalcontent').css({"top":0});
    CABLES.UI.MODAL.show(content,{ignoreTop:true});
};


CABLES.UI.MODAL.show=function(content,options)
{
    if(options && !options.ignoreTop)$('#modalcontent').css({"top":"10%"});
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
    $('#modalcontent').html('<div class="modalLoading" style="text-align:center;"><h3>'+title+'</h3><div class="loading" style="margin-top:0px;"><br/><br/><div>');
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


CABLES.UI.MODAL.showOpException=function(ex,opName)
{
    console.log(ex.stack);
    $('#modalcontent').html('<div class="modalclose modalerror"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide(true);"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail :/</h2>');

    $('#modalcontent').append('in op: <b>'+opName+'</b><br/><br/>');

    CABLES.api.sendErrorReport(ex);

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');

    if(gui.user.isAdmin || opName.startsWith("Op.User."+gui.user.username))
    {
        $('#modalcontent').append('<a class="bluebutton fa fa-edit" onclick="gui.serverOps.edit(\''+opName+'\');CABLES.UI.MODAL.hide(true);">Edit op</a><br/><br/>');
    }

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });

};

CABLES.UI.MODAL.showException=function(ex,op)
{
    console.log(ex.stack);
    $('#modalcontent').html('<div class="modalclose modalerror"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide(true);"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail :/</h2>');

    if(op)
    {
        $('#modalcontent').append('<h3>in op:'+op.name+'</h3>');
    }

    CABLES.api.sendErrorReport(ex);

    $('#modalcontent').append(''+ex.message+'<br/><br/>');
    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    // $('#modalcontent').append('<br/><a onclick="gui.sendErrorReport();" id="errorReportButton" class="button">send error report</a><div id="errorReportSent" class="hidden">Report sent.</div>');
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};




CABLES.UI.notify=function(title)
{
    $('#notify').html(title);
    $('#notify').show();
    $('#notify' ).css({top: "0px" ,opacity: 0 });

    $('#notify').animate(
        {
            top: "20px",
            opacity:0.8
        }, 150);

    setTimeout(function()
    {
        $( "#notify" ).animate({
           top: "40px",
           opacity:0
       }, 150,function()
       {
           $('#notify').hide();
       });
    },800);
};
