
var CABLES=CABLES || {};


CABLES.API=function()
{
    var cache=[];

    function request(method,url,data,cbSuccess,cbError,doCache)
    {
        $.ajax(
        {
            method: method,
            url: "/api/"+url,
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
    this.sendErrorReport=function(exc)
    {
        var report={};
        if(Date.now()-lastErrorReport<1000)
        {
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

            if(exc)
            {
                report.stack=exc.stack;
                report.exception=exc;
            }

            console.log('error report sent.');

            CABLES.api.post('errorReport',report,function(d)
            {
                $('#errorReportSent').show();
            });
        }
    };

};

if(!CABLES.api) CABLES.api=new CABLES.API();
