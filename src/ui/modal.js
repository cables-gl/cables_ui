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

CABLES.UI.MODAL.init=function(force)
{

    $('#modalcontent').empty();
    $('#modalcontainer').removeClass("transparent");
    $('#modalbg').on('click',
        function()
        {
            CABLES.UI.MODAL.hide(true);
            gui.pressedEscape();
        });


};

CABLES.UI.MODAL._setVisible=function(visible)
{
	if(visible)
	{
		$('#modalcontainer').show();
		// $('#modalcontainer').css({top:"10%"});
	}
	else
	{
		$('#modalcontainer').hide();
		// $('#modalcontainer').css({top:"-999100px"});
	}

};

CABLES.UI.MODAL.hide=function(force)
{
    if(CABLES.UI.MODAL.onClose)CABLES.UI.MODAL.onClose();

    if(!force && $('.modalerror').length>0)
    {
        return;
    }

    // console.log('modal hide ',$('.modalLoading').length);
    mouseNewOPX=0;
    mouseNewOPY=0;

	$('#modalclose').hide();
    CABLES.UI.MODAL.init();
	CABLES.UI.MODAL._setVisible(false);
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

    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

	if(options)
    {
        CABLES.UI.MODAL.setTitle(options.title);
        CABLES.UI.MODAL.onClose=options.onClose;

        if(options.transparent)$('#modalcontainer').addClass("transparent");
        if(options.nopadding) $('#modalcontent').css({padding:"0px"});
    }
    else
    {
        CABLES.UI.MODAL.onClose=null;
        $('#modalcontent').css({padding:"15px"});
        $('#modalcontainer').removeClass("transparent");
    }

    $('#modalcontent').append(content);
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();


};

CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div class="modalLoading" style="text-align:center;"><h3>'+title+'</h3><div class="loading" style="margin-top:0px;"><br/><br/><div>');
    $('#modalcontent').append(content);
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();
};


CABLES.UI.MODAL.showClose=function()
{
	$('#modalclose').show();

};

CABLES.UI.MODAL.showError=function(title,content)
{
    CABLES.UI.MODAL.showClose();
	CABLES.UI.MODAL.init();
    $('#modalcontent').append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;'+title+'!</h2>');
    $('#modalcontent').append(content);
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();

};


CABLES.UI.MODAL.showOpException=function(ex,opName)
{
    console.log(ex.stack);
    CABLES.UI.MODAL.showClose();
	CABLES.UI.MODAL.init();
	CABLES.UI.MODAL.setTitle('op cablefail :/');
    // $('#modalcontent').append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;</h2>');

    $('#modalcontent').append('Error in op: <b>'+opName+'</b><br/><br/>');


    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div><br/>');
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();

    var ops=gui.patch().scene.getOpsByObjName(opName);
    for(var i=0;i<ops.length;i++)
    {
        ops[i].uiAttr({"error":"exception"});
    }

    if(gui.user.isAdmin || opName.startsWith("Op.User."+gui.user.username))
    {
        $('#modalcontent').append('<a class="bluebutton fa fa-edit" onclick="gui.serverOps.edit(\''+opName+'\');CABLES.UI.MODAL.hide(true);">Edit op</a> &nbsp;&nbsp;');
    }

    CABLES.lastError=ex;
    $('#modalcontent').append('<a class="bluebutton fa fa-bug" onclick="CABLES.api.sendErrorReport();">Send Error Report</a>&nbsp;&nbsp;');



};

CABLES.UI.MODAL.showException=function(ex,op)
{
    if(op)
    {
        CABLES.UI.MODAL.showOpException(ex,op.objName);
        return;
    }
    console.log(ex.stack);
    CABLES.UI.MODAL.showClose();

    CABLES.UI.MODAL.init();
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail 123 :/</h2>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+ex.stack+'</div>');
    // $('#modalcontent').append('<br/><a onclick="gui.sendErrorReport();" id="errorReportButton" class="button">send error report</a><div id="errorReportSent" class="hidden">Report sent.</div>');
    // $('#modalcontainer').show();

    CABLES.lastError=ex;
    $('#modalcontent').append('<br/><a class="bluebutton fa fa-bug" onclick="CABLES.api.sendErrorReport();">Send Error Report</a>');


	CABLES.UI.MODAL._setVisible(true);



    $('#modalbg').show();

};




CABLES.UI.notify=function(title)
{
    $('#notify').html(title);
    $('#notify').show();
    $('#notify').css({top: "0px" ,opacity: 0 });

    $('#notify').animate(
        {
            top: "20px",
            opacity:1
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
    },1200);
};



CABLES.UI.MODAL.updatePortValuePreview=function(title)
{
    CABLES.UI.MODAL.showPortValue(title,CABLES.UI.MODAL.PORTPREVIEW);
};

CABLES.UI.MODAL.showPortValue=function(title,port)
{
    CABLES.UI.MODAL.PORTPREVIEW=port;
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();
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
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();


};

CABLES.UI.MODAL.showCode=function(title,code)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    $('#modalcontent').append('<h2><span class="fa fa-search"></span>&nbsp;inspect</h2>');
    $('#modalcontent').append('<b>'+title+'</b> ');
    $('#modalcontent').append('<br/><br/>');
    $('#modalcontent').append('<br/><br/>');

    $('#modalcontent').append('<div class="shaderErrorCode">'+code+'</div>');
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();

};

CABLES.UI.MODAL.promptCallbackExec=function()
{
    if(CABLES.UI.MODAL.promptCallback)
    {
        CABLES.UI.MODAL.promptCallback( $("#modalpromptinput").val() );
        CABLES.UI.MODAL.hide();
    }
    else
    {
        console.log("no callback found for prompt");
    }
};

CABLES.UI.MODAL.prompt=function(title,text,value,callback)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    CABLES.UI.MODAL.promptCallback=callback;

    $('#modalcontent').append('<h2>'+title+'</h2>');
    $('#modalcontent').append('<b>'+text+'</b> ');
    $('#modalcontent').append('<br/><br/>');

    $('#modalcontent').append('<input id="modalpromptinput" class="medium" value="'+(value||'')+'"/>');
    $('#modalcontent').append('<br/><br/>');
    $('#modalcontent').append('<a class="bluebutton" onclick="CABLES.UI.MODAL.promptCallbackExec()">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>');
	$('#modalcontent').append('&nbsp;&nbsp;<a class="greybutton" onclick="CABLES.UI.MODAL.hide()">&nbsp;&nbsp;&nbsp;cancel&nbsp;&nbsp;&nbsp;</a>');



    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);

    $('#modalbg').show();
	$("#modalpromptinput").focus();

};



window.onerror=function(err,file,row)
{
    setTimeout(function()
    {
        if(!CABLES.lastError)
        {
            CABLES.UI.MODAL.showException({message:err,stack:"file:"+file+" / row:"+row});
        }

    },100);
};
