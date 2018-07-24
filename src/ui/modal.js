//http://html5doctor.com/drag-and-drop-to-server/


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.MODAL=CABLES.UI.MODAL || {};
CABLES.UI.MODAL._visible=false;
CABLES.UI.MODAL.contentElement=null;
CABLES.UI.MODAL.headerElement = null; // the (small) header shown in the title bar of the modal

CABLES.UI.MODAL.hideLoading=function()
{
    if($('.modalLoading').length>0)
    {
        CABLES.UI.MODAL.hide();
    }
};

CABLES.UI.MODAL.init=function(options)
{
    if(window.gui)gui.showCanvasModal(false);

    if(CABLES.UI.MODAL.contentElement)CABLES.UI.MODAL.contentElement.hide();
    CABLES.UI.MODAL.contentElement=$('#modalcontent');
    CABLES.UI.MODAL.headerElement = $('#modalheader');
    CABLES.UI.MODAL.headerElement.empty();
    if(options && options.element)CABLES.UI.MODAL.contentElement=$(options.element);
        else CABLES.UI.MODAL.contentElement.empty();

    $('#modalcontainer').removeClass("transparent");
    CABLES.UI.MODAL.contentElement.css({padding:"15px"});
};

CABLES.UI.MODAL._setVisible=function(visible)
{
	if(visible)
	{
        CABLES.UI.MODAL._visible=true;

        CABLES.UI.MODAL.contentElement.show();

		// $('#modalcontainer').show();
		$('#modalcontainer').css({top:"10%"});
        CABLES.UI.MODAL.contentElement.css({top:"10%"});
	}
	else
	{
        CABLES.UI.MODAL._visible=false;
        CABLES.UI.MODAL.contentElement.hide();
        CABLES.UI.MODAL.contentElement.css({top:"-999100px"});

		// $('#modalcontainer').hide();
		$('#modalcontainer').css({top:"-999100px"});
	}

};

CABLES.UI.MODAL.hide=function(force)
{
    if(CABLES.UI.MODAL.onClose)CABLES.UI.MODAL.onClose();

    if(!force && $('.modalerror').length>0)
    {
        console.log('not forcing close');
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

    if(options && !options.ignoreTop)CABLES.UI.MODAL.contentElement.css({"top":"10%"});

    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init(options);

	if(options)
    {
        CABLES.UI.MODAL.setTitle(options.title);
        CABLES.UI.MODAL.onClose=options.onClose;

        if(options.transparent)$('#modalcontainer').addClass("transparent");
        if(options.nopadding)
        {
            CABLES.UI.MODAL.contentElement.css({padding:"0px"});
            $('#modalcontainer').css({padding:"0px"});
        }
    }
    else
    {
        CABLES.UI.MODAL.onClose=null;
        $('#modalcontainer').removeClass("transparent");
    }



    if(content)
        CABLES.UI.MODAL.contentElement.append(content);


    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();


};

CABLES.UI.MODAL.showLoading=function(title,content)
{
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.html('<div class="modalLoading" style="text-align:center;"><h3>'+title+'</h3><div class="loading" style="margin-top:0px;"><br/><br/><div>');
    CABLES.UI.MODAL.contentElement.append(content);
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
    CABLES.UI.MODAL.contentElement.append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;'+title+'</h2>');
    CABLES.UI.MODAL.contentElement.append(content);
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();

    $('.shadererrorcode').each(function(i, block) {
        hljs.highlightBlock(block);
      });

};

CABLES.UI.MODAL.getFileSnippet=function(url,line,cb)
{
    CABLES.ajax(
        url,
        function(err,_data,xhr)
        {
            if(err)
            {
                cb('err');
            }
            var lines=_data.split('\n');
            var linesAround=4;
            var sliced = lines.slice(line-(linesAround+1), line+linesAround);
            var html='';
            for(var i in sliced)
            {
                if(i==linesAround)
                {
                    html+='<span class="error">';
                    CABLES.lastError.errorLine=sliced[i];
                }
                html+=sliced[i];
                html+='</span>';
                html+='<br/>';
            }
            cb(html);
        });
};

CABLES.UI.MODAL.showOpException=function(ex,opName)
{
    console.log(ex.stack);
    CABLES.UI.MODAL.showClose();
	CABLES.UI.MODAL.init();
	CABLES.UI.MODAL.setTitle('op cablefail :/');
    // CABLES.UI.MODAL.contentElement.append('<h2><span class="fa modalerror fa-exclamation-triangle"></span>&nbsp;</h2>');

    CABLES.UI.MODAL.contentElement.append('Error in op: <b>'+opName+'</b><br/><br/>');

    CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');
    CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode">'+ex.stack+'</div><br/>');
    CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode hidden" id="stackFileContent"></div><br/>');

    var info = stackinfo(ex);
    console.log('This is line '+(info[0].line + 1));
    console.log('This is file '+(info[0].file));

    CABLES.UI.MODAL.getFileSnippet(info[0].file,info[0].line,function(html)
        {
            $('#stackFileContent').show();
            $('#stackFileContent').html(html);
        });


	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();

    var ops=gui.patch().scene.getOpsByObjName(opName);
    for(var i=0;i<ops.length;i++)
    {
        ops[i].uiAttr({"error":"exception"});
    }

    if(gui.user.isAdmin || opName.startsWith("Op.User."+gui.user.usernameLowercase))
    {
        CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-edit" onclick="gui.serverOps.edit(\''+opName+'\');CABLES.UI.MODAL.hide(true);">Edit op</a> &nbsp;&nbsp;');
    }

    CABLES.lastError={exception:ex,opName:opName};

    CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-bug" onclick="CABLES.api.sendErrorReport();">Send Error Report</a>&nbsp;&nbsp;');
    CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-refresh" onclick="document.location.reload();">reload patch</a>&nbsp;&nbsp;');
};

CABLES.UI.MODAL.showException=function(ex,op)
{
    if(op)
    {
        CABLES.UI.MODAL.showOpException(ex,op.objName);
        return;
    }
    console.log(ex.stack);
    if(!CABLES.UI.loaded)
    {
        var html='';
        html+='<div class="startuperror"><b>error</b>\n';
        html+='<br/>';
        html+=ex.message;
        html+='<br/><br/><a class="button" onclick="document.location.reload();">reload</a>';
        html+='</div>';


        $('body').append(html);
    }
    CABLES.UI.MODAL.showClose();

    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;cablefail :/</h2>');

    CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode">'+ex.message+'</div><br/>');

    CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode">'+ex.stack+'</div>');

    CABLES.lastError={exception:ex};
    CABLES.UI.MODAL.contentElement.append('<br/><a class="bluebutton fa fa-bug" onclick="CABLES.api.sendErrorReport();">Send Error Report</a>');


	CABLES.UI.MODAL._setVisible(true);



    $('#modalbg').show();

};





CABLES.UI.notifyError=function(title,text)
{
    iziToast.error(
        {
            position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            theme: 'dark',
            title: title,
            message: text||'',
            progressBar:false,
            animateInside:false,
            close:false,
            timeout:2000
        });

};

CABLES.UI.lastNotify='';
CABLES.UI.lastText='';

CABLES.UI.notify=function(title,text)
{
    if(title==CABLES.UI.lastNotify && text==CABLES.UI.lastText)
    {
        setTimeout(function()
        {
            CABLES.UI.lastNotify='';
            CABLES.UI.lastText='';
            
        },1000);
        return;
    }

    CABLES.UI.lastNotify=title;
    CABLES.UI.lastText=text;

    iziToast.show(
        {
            position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            theme: 'dark',
            title: title,
            message: text||'',
            progressBar:false,
            animateInside:false,
            close:false,
            timeout:2000
        });
};

CABLES.UI.MODAL.updatePortValuePreview=function(title)
{
    CABLES.UI.MODAL.showPortValue(title,CABLES.UI.MODAL.PORTPREVIEW);
};

CABLES.UI.MODAL.showPortValue=function(title,port)
{
    try
    {
        CABLES.UI.MODAL.PORTPREVIEW=port;
        CABLES.UI.MODAL.showClose();
        CABLES.UI.MODAL.init();
        CABLES.UI.MODAL.contentElement.append('<h2><span class="fa fa-search"></span>&nbsp;inspect</h2>');
    
        CABLES.UI.MODAL.contentElement.append('port: <b>'+title+'</b> of <b>'+port.parent.name+'</b> ');
    
    
        CABLES.UI.MODAL.contentElement.append('<br/><br/>');
    
        CABLES.UI.MODAL.contentElement.append('<a class="button fa fa-refresh" onclick="CABLES.UI.MODAL.updatePortValuePreview(\''+title+'\')">update</a>');
    
        CABLES.UI.MODAL.contentElement.append('<br/><br/>');
        var thing=port.get();
        CABLES.UI.MODAL.contentElement.append(''+thing.constructor.name+' \n');
        if(thing.constructor.name=="Array") CABLES.UI.MODAL.contentElement.append( ' - length:'+thing.length +'\n');
        if(thing.constructor.name=="Float32Array") CABLES.UI.MODAL.contentElement.append( ' - length:'+thing.length +'\n');
    
        CABLES.UI.MODAL.contentElement.append('<br/><br/>');
    
        CABLES.UI.MODAL.contentElement.append('<div class="shaderErrorCode">'+JSON.stringify(thing ,null, 4)+'</div>');
        // $('#modalcontainer').show();
        CABLES.UI.MODAL._setVisible(true);
        $('#modalbg').show();
    
    }
    catch(ex)
    {
        console.log(ex);
    }


};

CABLES.UI.MODAL.showCode=function(title,code,type)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    CABLES.UI.MODAL.contentElement.append('<h2><span class="fa fa-search"></span>&nbsp;inspect</h2>');
    CABLES.UI.MODAL.contentElement.append('<b>'+title+'</b> ');
    CABLES.UI.MODAL.contentElement.append('<br/><br/>');
    CABLES.UI.MODAL.contentElement.append('<br/><br/>');

    CABLES.UI.MODAL.contentElement.append('<pre><code class="'+(type||'javascript')+'">'+code+'</code></pre>');
    // $('#modalcontainer').show();
	CABLES.UI.MODAL._setVisible(true);
    $('#modalbg').show();
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
      });
    

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

    CABLES.UI.MODAL.contentElement.append('<h2>'+title+'</h2>');
    CABLES.UI.MODAL.contentElement.append('<b>'+text+'</b> ');
    CABLES.UI.MODAL.contentElement.append('<br/><br/>');
    CABLES.UI.MODAL.contentElement.append('<input id="modalpromptinput" class="medium" value="'+(value||'')+'"/>');
    CABLES.UI.MODAL.contentElement.append('<br/><br/>');
    CABLES.UI.MODAL.contentElement.append('<a class="bluebutton" onclick="CABLES.UI.MODAL.promptCallbackExec()">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>');
	CABLES.UI.MODAL.contentElement.append('&nbsp;&nbsp;<a class="greybutton" onclick="CABLES.UI.MODAL.hide()">&nbsp;&nbsp;&nbsp;cancel&nbsp;&nbsp;&nbsp;</a>');
	CABLES.UI.MODAL._setVisible(true);

    $('#modalbg').show();

    setTimeout(function()
    {
        $("#modalpromptinput").focus();
        $("#modalpromptinput").select();
    },100);

    $('#modalpromptinput').on( "keydown",
        function(e)
        {
            if(e.which==13)
            {
                CABLES.UI.MODAL.promptCallbackExec();
                e.preventDefault();
            }
        });

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
