var CABLES=CABLES||{};

CABLES.TalkerAPI=function(target)
{
    CABLES.EventTarget.apply(this);

    this._talker = new Talker(target, '*');
    this._callbackCounter=0;
    this._callbacks={};

    this._talker.onMessage=function(msg)
    {
        if(msg.data.cmd=="callback")
        {
            if(this._callbacks[msg.data.cb])
                this._callbacks[msg.data.cb](msg.data.error,msg.data.response);
        }
        else
            this.emitEvent(msg.data.cmd,msg.data.data,function(error,r)
            {
                this._talker.send('cables',{"cmd":"callback","cb":msg.data.cb,"response":r,"error":error});
            }.bind(this));

    }.bind(this);
};

CABLES.TalkerAPI.prototype.send=function(cmd,data,cb)
{
    var payload={"cmd":cmd,"data":data};

    if(cb)
    {
        this._callbackCounter++
        this._callbacks[this._callbackCounter]=cb;
        payload.cb=this._callbackCounter;
    }

    this._talker.send('cables',payload);
};


