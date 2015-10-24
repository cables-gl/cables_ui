
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
                    CABLES.UI.MODAL.show('ajax error: '+data.statusText);
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



};

if(!CABLES.api) CABLES.api=new CABLES.API();