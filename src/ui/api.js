
var CABLES=CABLES || {};


CABLES.API=function()
{

    function request(method,url,data,cbSuccess)
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
        })
        .always(function()
        {
            console.log( "complete" );
        });

    }

    this.get=function(url,cb)
    {
        request("GET",url,{},cb);
    };

    this.post=function(url,data,cb)
    {
        request("POST",url,data,cb);
    };



};

if(!CABLES.api) CABLES.api=new CABLES.API();