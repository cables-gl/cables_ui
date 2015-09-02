
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
            }
        } else {
            self.audioIn.val.connect(audioContext.destination);
        }
        self.oldAudioIn=self.audioIn.val;
    };
};

Ops.Audio.Output.prototype = new Op();


Ops.Audio.Oscillator = function()
{
    var self = this;
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
    };

    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));
    this.audioOut.val = this.oscillator;
};

Ops.Audio.Oscillator.prototype = new Op();


Ops.Audio.MicrophoneIn = function ()
{
    var self = this;
    Op.apply(this, arguments);
    this.microphone = null;

    this.name='microphone';
    
    //detect availability of userMedia
    this.userMediaAvailable = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));

    if (this.userMediaAvailable){
        if(!window.audioContext) {
             audioContext = new AudioContext();
        }

        navigator.getUserMedia(
            {audio:true},
            function(stream){
                self.microphone = audioContext.createMediaStreamSource(stream);
                self.audioOut.val = self.microphone;
            },
            function(e){console.log('No live audio input ' + e);}
        );
    }
};

Ops.Audio.MicrophoneIn.prototype = new Op();

Ops.Audio.Analyser = function()
{
    var self=this;
    Op.apply(this, arguments);

    if(!window.audioContext) {
         audioContext = new AudioContext();
    }

    this.name='Audio Analyser';
    this.audioIn=this.addInPort(new Port(this,"audio in",OP_PORT_TYPE_OBJECT));
    this.refresh=this.addInPort(new Port(this,"refresh",OP_PORT_TYPE_FUNCTION));

    this.oldAudioIn=null;

    this.analyser = audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.3;
    this.analyser.fftSize = 1024;

    this.refresh.onTriggered = function()
    {
        var array =  new Uint8Array(self.analyser.frequencyBinCount);
        self.analyser.getByteFrequencyData(array);
        
        var values = 0;
        var average;

        for (var i = 0; i < array.length; i++) {
            values += array[i];
        }
 
        average = values / array.length;
        self.avgVolume.val=average;
    };

    this.audioIn.onValueChanged = function()
    {
        console.log(self.audioIn.val);
        if (self.audioIn.val === null) {
            if (self.oldAudioIn !== null) {
                self.oldAudioIn.disconnect(self.analyser);
            }
        } else {
            self.audioIn.val.connect(self.analyser);
        }
        self.oldAudioIn=self.audioIn.val;
    };

    this.avgVolume=this.addOutPort(new Port(this, "average volume",OP_PORT_TYPE_VALUE));
    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));
    this.audioOut.val = this.analyser;
};

Ops.Audio.Analyser.prototype = new Op();


