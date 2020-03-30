
var CABLES=CABLES||{};

CABLES.UI.ScConnection=class extends CABLES.EventTarget
{

    constructor(id)
    {
        super();
        this._socket=null;       

        this._init();
    }

    _init()
    {
        this._socket = socketClusterClient.create({
            hostname: "ws.dev.cables.gl",
            secure: true,
            port: 443,
        });

        

        this._socket.channelName = "patchchannel_"+CABLES.sandbox.getPatchId();
        
        
        console.info("socketcluster clientId", this._socket.clientId);

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                console.error(error);
                errorOut.set(error);
            }
        })();
        (async () =>
        {
            for await (const event of this._socket.listener("connect"))
            {
                console.log("socket connected!");
            }
        })();


        (async () =>
        {
            const channel = this._socket.subscribe(this._socket.channelName );
            for await (const obj of channel)
            {
                console.log("received ",obj);

                if(obj.type="chatmsg")
                {
                    this.emitEvent("onChatMessage",obj);
                }
                // if (obj.clientId != socket.clientId && obj.topic == inTopic.get())
                // {
                //     outData.set(obj.payload);
                //     clientIdOut.set(obj.clientId);
                //     outTrigger.trigger();
                // }
            }
        })();

    }

    send(payload)
    {
        this._socket.transmitPublish(this._socket.channelName, payload);
    }

    
}