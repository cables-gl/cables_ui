
var CABLES = CABLES || {};

CABLES.UI.PacoConnector = class extends CABLES.EventTarget
{
    constructor(sccon, paco)
    {
        super();
        this._sccon = sccon;
        this._paco = paco;
    }

    send(event, vars)
    {
        if (!this._sccon)
        {
            console.log("NOPE!");
            return;
        }
        const data = { "event": event, "vars": vars };
        this._sccon.sendPaco({ "type": "paco", "data": data });
    }

    receive(pacoMsg)
    {
        if (!this._receiver)
            this._receiver = new CABLES.PatchConnectionReceiver(
                gui.patch().scene
            );

        this._receiver._receive(pacoMsg);
    }
};

// const PatchConnectorBroadcastChannel = function ()
// {
//     if (!window.BroadcastChannel) return;

//     this.bc = new BroadcastChannel("test_channel");
// };

// PatchConnectorBroadcastChannel.prototype.receive = function (paco)
// {
//     if (!this.bc) return;
//     Log.log("init");
//     this.bc.onmessage = paco._receive.bind(paco);
// };

// PatchConnectorBroadcastChannel.prototype.send = function (event, vars)
// {
//     if (!this.bc) return;
//     var data = {};
//     data.event = event;
//     data.vars = vars;
//     this.bc.postMessage(JSON.stringify(data));
//     // Log.log(data);
// };
