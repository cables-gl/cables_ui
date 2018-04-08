
var CABLES=CABLES||{};

CABLES.SocketConnection=function(patchId)
{
    var socket = io(document.location.protocol+'//'+document.location.hostname+':3000');

    socket.on('connect', function()
    {
        console.log("socket connected");
    
        socket.emit('subscribe', 'global');
        socket.emit('subscribe', 'patch_'+patchId);
    });
    socket.on('event', function(data)
    {
        console.log("socket event",data);
    });
    
    
    socket.on('message', function(data)
    {
        console.log("message",data);

        if(data.cmd=='notify')
        {
            CABLES.UI.notify(data.message);
        }
        if(data.cmd=='notifyError')
        {
            CABLES.UI.notifyError(data.message);
        }

        if(data.cmd=='filesChanged')
        {
            CABLES.UI.fileSelect.refresh();
        }



    });
    
    
    socket.on('disconnect', function()
    {
        console.log("socket disconnect!");
    });

};

