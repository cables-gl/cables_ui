
Ops.Net=Ops.Net || {};

Ops.Net.Websocket = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Websocket';
    this.url=this.addInPort(new Port(this,"url"));
    this.result=this.addOutPort(new Port(this,"result"), OP_PORT_TYPE_OBJECT);
    this.connected=this.addOutPort(new Port(this,"connected"));

    var connection;
    var timeout=null;
    var connectedTo='';

    function checkConnection()
    {
        if(self.connected.val===false)
        {
            connect();
        }
    }

    function connect()
    {
        if(self.connected.val===true && connectedTo==self.url.val) return;

        if(self.connected.val===true)connection.close();

        window.WebSocket = window.WebSocket || window.MozWebSocket;
     
         if (!window.WebSocket)
            console.error('Sorry, but your browser doesn\'t support WebSockets.');


        try
        {
            connection = new WebSocket(self.url.val);
        }catch (e)
        {
            console.log('could not connect to',self.url.val);
        }

        
        connection.onerror = function (message)
        {
            self.connected.val=false;
            timeout=setTimeout(checkConnection,1000);
        };

        connection.onclose = function (message)
        {
            self.connected.val=false;
            timeout=setTimeout(checkConnection,1000);
        };

        connection.onopen = function (message)
        {
            self.connected.val=true;
            connectedTo=self.url.val;
        };

        connection.onmessage = function (message)
        {
            try
            {
                var json = JSON.parse(message.data);
                self.result.val=json;
                        
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }
        };

        clearTimeout(timeout);
        timeout=setTimeout(checkConnection,1000);
    }

    this.url.onValueChanged=connect;
    

    this.url.val='ws://127.0.0.1:1337';
};

Ops.Net.Websocket.prototype = new Op();

// -------------------------------------------------------------

Ops.Json=Ops.Json || {};


Ops.Json.jsonValue = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonValue';
    this.data=this.addInPort(new Port(this,"data"),OP_PORT_TYPE_OBJECT);
    this.key=this.addInPort(new Port(this,"key"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.data.onValueChanged=function()
    {
        self.result.val=self.data.val[self.key.val];
    };

};

Ops.Json.jsonValue.prototype = new Op();

