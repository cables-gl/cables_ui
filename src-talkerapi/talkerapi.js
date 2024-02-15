var CABLESUILOADER = CABLESUILOADER || {};

CABLESUILOADER.TalkerAPI = function (target)
{
    CABLES.EventTarget.apply(this);

    this._talker = new Talker(target, "*");
    this._callbackCounter = 0;
    this._callbacks = {};

    this._talker.onMessage = (msg) =>
    {
        if (msg.data.cmd === "callback")
        {
            if (this._callbacks[msg.data.cb]) this._callbacks[msg.data.cb](msg.data.error, msg.data.response);
        }
        else
        {
            if (!this.hasListenerForEventName(msg.data.cmd))
            {
                console.error("TalkerAPI in ui has no listener for", msg.data.cmd);
            }
            this.emitEvent(msg.data.cmd, msg.data.data, (error, r) =>
            {
                this._talker.send("cables", { "cmd": "callback", "cb": msg.data.cb, "response": r, "error": error });
            });
        }
    };
};

CABLESUILOADER.TalkerAPI.prototype.send = function (cmd, data, cb)
{
    const payload = { "cmd": cmd, "data": data };
    if (cb)
    {
        this._callbackCounter++;
        this._callbacks[this._callbackCounter] = cb;
        payload.cb = this._callbackCounter;
    }

    this._talker.send("cables", payload);
};
