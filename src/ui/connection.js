
var CABLES=CABLES || {};
CABLES.API=CABLES.API || {};

CABLES.API.Connection=function(ui)
{
    ui.jobs().start({id:'connecting',title:'connecting to server'});

    var simpleio = window.simpleio;
    var client = simpleio.create({ajax: jQuery.ajax});

    function doConnect()
    {
    }

    client.connect();

    client.on('message', function(message)
    {
        console.log('got new message:', message.data.data);

        if(message.data.data.success===true)
        {
            ui.jobs().finish('connecting');
        }
        else
        if(message.data.data.cmd && message.data.data.cmd=='filesprocessed')
        {
            ui.jobs().finish('processingfiles');
            gui.patch().updateProjectFiles();
        }
        else
        {
            console.log('unknown message',message.data.data);
        }
    });

    client.on('error', function()
    {
        console.log('simpleio error...');
        ui.jobs().start({id:'connecting',title:'reconnecting to server'});
        client.connect();
    });

    client.on('connect', function()
    {
        console.log('client connect');
    });
    client.send({"cmd":"ping"},
        function()
        {
            console.log('Message sent');
        });

        window.onbeforeunload = function(e)
        {
          client.disconnect();
        };

};
