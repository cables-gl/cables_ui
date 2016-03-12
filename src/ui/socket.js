function guid()
{
  function s4()
  {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

CABLES = CABLES || {};
CABLES.API = CABLES.API || {};

CABLES.API.Socket=function(ui)
{
    var gui=ui;
    var url='ws:'+window.location.hostname+':5711/';
    var pingDelay=5000;
    var checkDelay=5000;
    var checkDelayError=2000;
    var connection=null;
    // $.ajax(
    // {
    //     url: "/api/ping/"+CABLES.API.PING.windowUUID+'/editor',
    // })
    // .done(function()
    // {
    //     CABLES.API.PING.delay=CABLES.API.PING.pingDelay;
    //     if(!CABLES.API.isConnected) CABLES.UI.setStatusText('connection to server ESTABLISHED...');
    //     CABLES.API.isConnected=true;
    // })
    // .fail(function()
    // {
    //     CABLES.API.PING.delay=CABLES.API.PING.pingDelay*2;
    //
    //     CABLES.API.isConnected=false;
    //     CABLES.UI.setStatusText('connection to server lost...');
    // });

    function checkConnection()
    {
        if(!connection || connection.readyState!=1)
        {
            connected=false;
            ui.jobs().start({id:'wsconnecting',title:'connecting to server'});

            connect();

            setTimeout(checkConnection,checkDelayError);
        }
        else
        {
            ui.jobs().finish('wsconnecting');
            CABLES.API.isConnected=true;
            connected=true;
            setTimeout(checkConnection,checkDelay);
        }
    }

    function ping()
    {
        if(connected)
        {
            if(Date.now()-CABLES.API.WsPingStart > 4000) CABLES.API.WsPingStart=0;
            if(CABLES.API.WsPingStart===0)
            {
                CABLES.API.WsPingStart=Date.now();
                connection.send( JSON.stringify({cmd:"ping"}) );
            }
        }
        setTimeout(ping,pingDelay);
    }

    function connect()
    {
        if(connected===true) return;
        if (!window.WebSocket) console.error('Sorry, but your browser doesn\'t support WebSockets.');

        window.WebSocket = window.WebSocket || window.MozWebSocket;


        if(!connection) connection = new WebSocket(url);


        connection.onerror = function (message)
        {
            console.log("ws error");
            connected=false;
            connection=null;
            ui.jobs().start({id:'wsconnecting',title:'trying to reconnect to server'});
        };

        connection.onclose = function (message)
        {
            console.log("ws close");
            connected=false;
            connection=null;
            ui.jobs().start({id:'wsconnecting',title:'trying to reconnect to server'});
        };

        connection.onopen = function (message)
        {
            connected=true;
            connectedTo=url;
        };

        connection.onmessage = function (message)
        {
            try
            {
                var json = JSON.parse(message.data);
                // self.result.val=json;
                if(json.cmd=='pong')
                {
                    var pingTime=Date.now()-CABLES.API.WsPingStart;
                    console.log('pingTime: '+pingTime);
                    CABLES.API.WsPingStart=0;
                    setTimeout(ping,pingDelay);
                }
            }
            catch(e)
            {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }
        };

        setTimeout(function()
        {
            if(connection && connection.readyState==1) ui.jobs().finish('wsconnecting');
        },500);
    }

    checkConnection();
};
