
var CABLES=CABLES || {};


CABLES.API=function()
{

    function request(method,url,data,cbSuccess,cbError)
    {

        $.ajax(
        {
            method: method,
            url: "/api/"+url,
            data: data
        })
        .done(function(data)
        {
            console.log( "success "+data );
            if(cbSuccess) cbSuccess(data);
        })
        .fail(function(data)
        {

            if(data.statusText=='NOT_LOGGED_IN')
            {
                CABLES.UI.MODAL.showError('not logged in','<br/>you are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class="bluebutton" href="/signup">sign up</a> <a class="bluebutton" style="background-color:#222" onclick="CABLES.UI.MODAL.hide()">continue</a> <br/><br/> ');
            }
            else
            {
                CABLES.UI.MODAL.show('ajax error: '+data.statusText);
            }

            if(cbError)cbError();
        })
        .always(function()
        {
            // console.log( "complete" );
        });

    }

    this.get=function(url,cb,cbErr)
    {
        request("GET",url,{},cb,cbErr);
    };

    this.post=function(url,data,cb,cbErr)
    {
        request("POST",url,data,cb);
    };

    this.delete=function(url,data,cb,cbErr)
    {
        request("DELETE",url,data,cb);
    };

    this.put=function(url,data,cb,cbErr)
    {
        request("PUT",url,data,cb);
    };



};

if(!CABLES.api) CABLES.api=new CABLES.API();