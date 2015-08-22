
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
        .fail(function()
        {
            console.log('error ajax');
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