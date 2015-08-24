
// TODO: CLAMP!

Ops.Audio=Ops.Audio || {};

Ops.Audio.Output = function()
{
    var self=this;
    Op.apply(this, arguments);

    if(!window.audioContext) {
         audioContext = new AudioContext();
    }

    this.name='audioOutput';
    this.audioIn=this.addInPort(new Port(this,"audio in",OP_PORT_TYPE_OBJECT));

    this.oldAudioIn=null;

    this.audioIn.onValueChanged = function()
    {
        console.log(self.audioIn.val);
        if (self.audioIn.val === null) {
            if (self.oldAudioIn !== null) {
                self.oldAudioIn.disconnect(audioContext.destination);
            };
        } else {
            self.audioIn.val.connect(audioContext.destination);
        }
        self.oldAudioIn=self.audioIn.val;
    };
};

Ops.Audio.Output.prototype = new Op();


Ops.Audio.Oscillator = function()
{
    var self = this
    Op.apply(this, arguments);
    
    if(!window.audioContext) {
         audioContext = new AudioContext();
    }
    this.oscillator = audioContext.createOscillator();
    this.oscillator.start(0);

    this.oscillator.frequency.value = 200;

    this.name='Oscillator';

    this.frequency=this.addInPort(new Port(this,"frequency",OP_PORT_TYPE_VALUE));
    this.frequency.onValueChanged = function()
    {
        self.oscillator.frequency.value = self.frequency.val;
    }

    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));
    this.audioOut.val = this.oscillator;
}

Ops.Audio.Oscillator.prototype = new Op();
