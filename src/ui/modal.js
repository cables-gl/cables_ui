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

	$('#modalclose').hide();
    $('#modalcontent').html('');
    $('#modalcontainer').hide();
    $('#modalbg').hide();
    $('.tooltip').hide();
};

CABLES.UI.MODAL.showTop=function(content,options)
{
    // $('#modalcontainer').css({"top":0});
	// options=options||{};
	// options.ignoreTop=true;
    CABLES.UI.MODAL.show(content,options);
};

CABLES.UI.MODAL.setTitle=function(title)
{
	if(title)
	{
		$('#modalheader').html(title);
		$('#modalheader').show();
	}
	else $('#modalheader').hide();

};


CABLES.UI.MODAL.show=function(content,options)
{
    if(options && !options.ignoreTop)$('#modalcontent').css({"top":"10%"});


	if(options)CABLES.UI.MODAL.setTitle(options.title);
	CABLES.UI.MODAL.showClose();
    $('#modalcontent').append(content);
    $('#modalcontainer').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};

CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div class="modalLoading" style="text-align:center;"><h3>'+title+'</h3><div class="loading" style="margin-top:0px;"><br/><br/><div>');
    $('#modalcontent').append(content);
    $('#modalcontainer').show();
    $('#modalbg').show();
};


CABLES.UI.MODAL.showClose=function()
{
	$('#modalclose').show();

};

CABLES.UI.MODAL.showError=function(title,content)
{
    CABLES.UI.MODAL.showClose();
	$('#modalcontent').html('');
    $('#modalcontent').append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;'+title+'!</h2>');
    $('#modalcontent').append(content);
    $('#modalcontainer').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });
};


CABLES.UI.MODAL.showOpException=function(ex,opName)
{
    console.log(ex.stack);
    CABLES.UI.MODAL.showClose();
	$('#modalcontent').html('');
	CABLES.UI.MODAL.setTitle('cablefail :/');
    // $('#modalcontent').append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;</h2>');

    $('#modalcontent').append('Error in op: <b>'+opName+'</b><br/><br/>');

    CABLES.api.sendErrorReport(ex);

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    $('#modalcontainer').show();
    $('#modalbg').show();

    if(gui.user.isAdmin || opName.startsWith("Op.User."+gui.user.username))
    {
        $('#modalcontent').append('<br/><a class="bluebutton fa fa-edit" onclick="gui.serverOps.edit(\''+opName+'\');CABLES.UI.MODAL.hide(true);">Edit op</a>');
    }
    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });

};

CABLES.UI.MODAL.showException=function(ex,op)
{
    console.log(ex.stack);
    CABLES.UI.MODAL.showClose();

	$('#modalcontent').empty();
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail :/</h2>');

    if(op)
    {
        $('#modalcontent').append('<h3>in op:'+op.name+'</h3>');
    }

    CABLES.api.sendErrorReport(ex);

    $('#modalcontent').append(''+ex.message+'<br/><br/>');
    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    // $('#modalcontent').append('<br/><a onclick="gui.sendErrorReport();" id="errorReportButton" class="button">send error report</a><div id="errorReportSent" class="hidden">Report sent.</div>');
    $('#modalcontainer').show();
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



CABLES.UI.MODAL.updatePortValuePreview=function(title)
{
    CABLES.UI.MODAL.showPortValue(title,CABLES.UI.MODAL.PORTPREVIEW);
};

CABLES.UI.MODAL.showPortValue=function(title,port)
{

    CABLES.UI.MODAL.PORTPREVIEW=port;

    CABLES.UI.MODAL.showClose();

    $('#modalcontent').append('<h2><span class="fa fa-search"></span>&nbsp;inspect</h2>');

    $('#modalcontent').append('port: <b>'+title+'</b> of <b>'+port.parent.name+'</b> ');


    $('#modalcontent').append('<br/><br/>');



    $('#modalcontent').append('<a class="button fa fa-refresh" onclick="CABLES.UI.MODAL.updatePortValuePreview(\''+title+'\')">update</a>');

    $('#modalcontent').append('<br/><br/>');
    var thing=port.get();
    $('#modalcontent').append(''+thing.constructor.name+' \n');
    if(thing.constructor.name=="Array") $('#modalcontent').append( ' - length:'+thing.length +'\n');
    if(thing.constructor.name=="Float32Array") $('#modalcontent').append( ' - length:'+thing.length +'\n');

    $('#modalcontent').append('<br/><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+JSON.stringify(thing ,null, 4)+'</div>');
    $('#modalcontainer').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });

};

CABLES.UI.MODAL.showCode=function(title,code)
{



    CABLES.UI.MODAL.showClose();

    $('#modalcontent').append('<h2><span class="fa fa-search"></span>&nbsp;inspect</h2>');

    $('#modalcontent').append('<b>'+title+'</b> ');


    $('#modalcontent').append('<br/><br/>');

    $('#modalcontent').append('<br/><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+code+'</div>');
    $('#modalcontainer').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide(true);
    });

};
