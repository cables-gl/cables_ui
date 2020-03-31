
var CABLES=CABLES||{};

CABLES.UI.ScConnection=class extends CABLES.EventTarget
{
    constructor(cfg)
    {
        super();
        this.channelName=null;
        this._socket=null;
        this._scConfig=cfg;
        this._connected=false;

        if(cfg)this._init();
    }

    _init()
    {
        this._socket = socketClusterClient.create(this._scConfig);
        this._socket.channelName = "patchchannel_"+CABLES.sandbox.getPatchId();
        this.channelName = this._socket.channelName;

        console.info("socketcluster clientId", this._socket.clientId);

        (async () =>
        {
            for await (const { error } of this._socket.listener("error"))
            {
                console.error(error);
                this._connected=false;
            }
        })();
        (async () =>
        {
            for await (const event of this._socket.listener("connect"))
            {
                console.log("socket connected!");
                this._connected=true;
            }
        })();


        (async () =>
        {
            const channel = this._socket.subscribe(this._socket.channelName );
            for await (const obj of channel)
            {
                console.log("received ",obj);

                if(obj.type=="chatmsg")
                {
                    this.emitEvent("onChatMessage",obj);
                }
                if(obj.type=="info")
                {
                    this.emitEvent("onInfoMessage",obj);
                }
                if(obj.type=="pingMembers") {
                    this.send({type: "pingAnswer", data: {username: gui.user.usernameLowercase }});
                }
                if(obj.type=="pingAnswer") {
                    this.emitEvent("onPingAnswer",obj);
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

    sendInfo(text)
    {
        if(this._connected) this.send({"type":"info","text":text});
    }

    send(payload)
    {
        if(this._connected) this._socket.transmitPublish(this._socket.channelName, payload);
    }

    updateMembers()
    {
        this.send({"type": "pingMembers"});
    }
}
