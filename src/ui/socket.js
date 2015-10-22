
var SocketConnection=function()
{
    var connection=null;
    var connected=false;
    var connectedTo=null;
    var url='ws://0.0.0.0:5712';
    // var url='ws://echo.websocket.org';

    function checkConnection()
    {
                console.log('connected',connected);
                
        if(!connected)
        {
            connect();
        }
        timeout=setTimeout(checkConnection,13000);
    }

    function connect()
    {
                
        if(connected===true && connectedTo==url) return;
        // if(connected===true)connection.close();
        
        console.log('connect');

        window.WebSocket = window.WebSocket || window.MozWebSocket;
     
         if (!window.WebSocket)
            console.error('Sorry, but your browser doesn\'t support WebSockets.');

        try
        {
            // if(connection!=null)
            // {
            //     console.log('close old connection');
            //     connection.close();
            // }
            connection = new WebSocket(url);
        }catch (e)
        {
            console.log('could not connect to',url);
        }
        
        connection.onerror = function (message,b)
        {
            console.log('error',message);
            console.log('error',b);
                    
            connected=false;
        };

        connection.onclose = function (message)
        {
                    console.log('close ',message);
                    
            connected=false;
        };

        connection.onopen = function (message)
        {
            console.log('connected YAY');
                    
            connected=true;
            connectedTo=url;
        };

        connection.onmessage = function (message)
        {
            connected=true;
            try
            {
                console.log('message',message);
                        
                var json = JSON.parse(message.data);
                self.result.val=json;
                        
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }
        };
    }

    // this.url.onValueChanged=connect;
    timeout=setTimeout(checkConnection,13000);
    
    connect();
};

// var socket=new SocketConnection();