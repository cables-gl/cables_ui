
var CABLES=CABLES || {};
CABLES.API=CABLES.API || {};

CABLES.API.Connection=function(ui)
{
    ui.jobs().start({id:'connecting',title:'connecting to server'});

    var pingStart=0;
    var simpleio = window.simpleio;
    var client = simpleio.create({ajax: jQuery.ajax});
    var connected=false;

    function ping()
    {
        if(connected)
        {
            pingStart=Date.now();
            client.send({"cmd":"ping"});
        }
        else
        setTimeout(ping,3000);
    }

    function checkConnection()
    {
        if(!connected)
        {
            console.log('checkConnection');
        }
    }


    client.on('message', function(message)
    {
        if(message.data.data.success===true)
        {
            connected=true;
            ui.jobs().finish('connecting');
            setTimeout(ping,3000);
        }
        else
        if(message.data.data.cmd)
        {
            // if(message.data.data.cmd && message.data.data.cmd=='filesprocessed')
            // {
            //     ui.jobs().finish('processingfiles');
            //     gui.patch().updateProjectFiles();
            // }
            // else
            if(message.data.data.cmd=='pong')
            {
                if(pingStart!==0)
                {
                    var delay=Date.now()-pingStart;
                    // console.log("ping time:",delay);
                    pingStart=0;
                    setTimeout(ping,60000);
                }
            }
            else
            if(message.data.data.cmd=='startJob')
            {
                ui.jobs().start({id:message.data.data.jobId,title:message.data.data.jobTitle});
            }
            else
            if(message.data.data.cmd=='finishJob')
            {
                ui.jobs().finish(message.data.data.jobId);
                gui.updateProjectFiles();

                // TODO: send filename back from server to client...
                // TODO: update files with filename
                // for(var i=0;i<gui.patch().ops.length;i++)
                // {
                //     console.log(1);
                //     if(gui.patch().ops[i].op.onFileUploaded)
                //     {
                //         console.log('file uploaded callback');
                //         this.ops[i].op.onFileUploaded(fn);
                //     }
                // }

            }
            else
            {
                console.log('unknown message',message.data.data);
            }
        }
        else
        {
            console.log('unknown message',message.data.data);
        }
    });

    var checkTimeout=null;

    client.on('error', function()
    {
        connected=false;
        // console.log('simpleio error...');
        ui.jobs().start({id:'connecting',title:'reconnecting to server'});
        clearTimeout(checkTimeout);
    });

    client.on('success', function()
    {
        connected=true;
        // console.log('success');
        ui.jobs().finish('connecting');
    });


    window.onbeforeunload = function(e)
    {
        client.disconnect();
    };


    client.connect();

    client.send(
        {"cmd":"connect"},
        function()
        {
            // console.log('connecting to server...');
        });

    // checkTimeout=setTimeout(checkConnection,500);

};
