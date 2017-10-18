
var CABLES=CABLES || {};

CABLES.lastError=null;

CABLES.API=function()
{
    var cache=[];

    function request(method,url,data,cbSuccess,cbError,doCache)
    {

        url= CABLES.sandbox.getUrlApiPrefix()+url;

        $.ajax(
        {
            method: method,
            url:url,
            data: data
        })
        .done(function(data)
        {
            if(doCache)
            {
                cache.push({url:url,method:method,data:data});
            }

            // console.log( "success "+data );
            if(cbSuccess) cbSuccess(data);
        })
        .fail(function(data)
        {
            if(CABLES && CABLES.UI && CABLES.UI.MODAL)
            {
                if(data.statusText=='NOT_LOGGED_IN')
                {
                    CABLES.UI.MODAL.showError('not logged in','<br/>you are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class="bluebutton" href="/signup">sign up</a> <a class="bluebutton" style="background-color:#222" onclick="CABLES.UI.MODAL.hide()">continue</a> <br/><br/> ');
                }
                else
                {
                    CABLES.UI.MODAL.show('ajax error: '+data.statusText+'<br/><br/><a class="bluebutton" style="background-color:#222" onclick="CABLES.UI.MODAL.hide()">ok</a> <br/><br/>'
                    );
                }

            }

            if(cbError)cbError(data.responseJSON);
        })
        .always(function()
        {
            // console.log( "complete" );
        });

    }

    this.hasCached=function(url,method)
    {
        if(!method)method='GET';
        for(var i=0;i<cache.length;i++)
        {
            if(cache[i].url==url && cache[i].method==method)
                return cache[i];
        }
        return null;
    };

    this.clearCache=function()
    {
        console.log('cache cleared....');
        cache.length=0;
    };

    this.getCached=function(url,cb,cbErr)
    {
        for(var i=0;i<cache.length;i++)
        {
            if(cache[i].url==url)
            {
                cb(cache[i].data);
                return;
            }
        }

        request("GET",url,{},cb,cbErr,true);
    };

    this.get=function(url,cb,cbErr)
    {
        request("GET",url,{},cb,cbErr);
    };

    this.post=function(url,data,cb,cbErr)
    {
        request("POST",url,data,cb,cbErr);
    };

    this.delete=function(url,data,cb,cbErr)
    {
        request("DELETE",url,data,cb,cbErr);
    };

    this.put=function(url,data,cb,cbErr)
    {
        request("PUT",url,data,cb,cbErr);
    };


    var lastErrorReport=0;
    this.sendErrorReport=function(err)
    {
        err=err||CABLES.lastError;
        var report={};
        report.time=Date.now();

        lastErrorReport=Date.now();
        if(window.gui)report.projectId=gui.patch().getCurrentProject()._id;
        if(window.gui)report.username=gui.user.username;
        if(window.gui)report.userId=gui.user.id;
        report.url=document.location.href;

        report.infoPlatform=navigator.platform;
        report.infoLanguage=navigator.language;
        report.infoUserAgent=navigator.userAgent;

        if(window.gui)
        {
            try
            {
                var dbgRenderInfo = gui.patch().scene.cgl.gl.getExtension("WEBGL_debug_renderer_info");
                report.glRenderer=gui.patch().scene.cgl.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            }
            catch(e)
            {
                console.log(e);
            }
        }


        report.exception=err.exception;
        if(err.exception && err.exception.stack)
            report.stack=err.exception.stack;

        report.opName=err.opName;
        report.errorLine=err.errorLine;

        console.log('error report sent.');
        console.log(report);

        CABLES.api.post('errorReport',report,function(d)
        {
            CABLES.UI.MODAL.showClose();
            CABLES.UI.MODAL.init();

            var html='';
            html+='<center>';
            html+='<img src="/img/bug.gif"/><br/><br/>';
            html+='<h2>thank you</h2>';
            html+='we will look into it<br/>';
            html+='<br/>';
        	html+='&nbsp;&nbsp;<a class="greybutton" onclick="CABLES.UI.MODAL.hide()">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>';
            html+='</center>';

            CABLES.UI.MODAL.show(html,{title:''});
            CABLES.lastError=null;

            $('#modalbg').on('click',function(){
                CABLES.UI.MODAL.hide(true);
            });

        });
    };

};

if(!CABLES.api) CABLES.api=new CABLES.API();
