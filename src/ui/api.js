
var CABLES=CABLES || {};


CABLES.API=function()
{

    function request(method,url,cbSuccess)
    {

        $.ajax(
        {
            method: method,
            url: "/api/"+url,
            // data: { name: "John", location: "Boston" }
        })
        .done(function(data)
        {
            console.log( "success "+data );
            cbSuccess(data);
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
        request("GET",url,cb);
    };



};

if(!CABLES.api) CABLES.api=new CABLES.API();