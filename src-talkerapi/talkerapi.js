var CABLES=CABLES||{};

//
// target: window.parent
// 

CABLES.TalkerAPI=function(target)
{
    CABLES.EventTarget.apply(this);

    this._talker = new Talker(target, '*');
    
    this._callbackCounter=0;
    this._callbacks={};

    this._talker.onMessage=function(msg)
    {
        console.log('onmessage',msg);


        if(msg.data.cmd=="callback")
        {
            console.log("got callback!")
            if(this._callbacks[msg.data.cb])
                this._callbacks[msg.data.cb](msg.data.response);
        }
        else
            this.emitEvent(msg.data.cmd,msg.data,function(r)
            {
                console.log("emitevent next execute!",msg.data.id);
                
                this._talker.send('cables',{"cmd":"callback","cb":msg.data.cb,"response":r});

            }.bind(this));

        // if(msg.cb)
        // {
        //     console.log("onmessage",cb);
        // }



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

    console.log("talkerapi send ",payload)

    this._talker.send('cables',payload);
};


