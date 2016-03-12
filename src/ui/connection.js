
var CABLES=CABLES || {};
CABLES.API=CABLES.API || {};

CABLES.API.Connection=function(ui)
{
    ui.jobs().start({id:'connecting',title:'connecting to server'});

    var simpleio = window.simpleio;
    var client = simpleio.create({ajax: jQuery.ajax});
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

    client.on('error', console.log);

    client.send({"cmd":"ping"},
        function()
        {
            console.log('Message sent');
        });

};
