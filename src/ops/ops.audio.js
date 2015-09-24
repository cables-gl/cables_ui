
// TODO: CLAMP!

Ops.WebAudio=Ops.WebAudio || {};

Ops.WebAudio.Output = function()
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

Ops.WebAudio.Output.prototype = new Op();

// -----------------------------------

Ops.WebAudio.AudioPlayer = function()
{
    var self = this;
    Op.apply(this, arguments);
    this.name='AudioPlayer';

    this.file=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',filter:'mp3' }));
    this.volume=this.addInPort(new Port(this,"volume",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.volume.val=1.0;

    if(!window.audioContext) audioContext = new AudioContext();

    this.filter = audioContext.createGain();
    self.audio=null;

    this.volume.onValueChanged = function()
    {
        self.filter.gain.value=self.volume.val;
    };

    function seek()
    {
        if(!self.audio)return;

        if(self.patch.timer.isPlaying() && self.audio.paused) self.audio.play();
        else if(!self.patch.timer.isPlaying() && !self.audio.paused) self.audio.pause();
        self.audio.currentTime=self.patch.timer.getTime();
    }

    function playPause()
    {
        if(!self.audio)return;
                
        if(self.patch.timer.isPlaying()) self.audio.play();
            else self.audio.pause();
    }

    this.file.onValueChanged = function()
    {
        CGL.incrementLoadingAssets();

        self.audio = new Audio();

        self.audio.src = self.file.val;

        self.audio.addEventListener('canplaythrough', function()
        {
            console.log('audio loaded!');
            CGL.decrementLoadingAssets();
        }, false);

        self.media = audioContext.createMediaElementSource(self.audio);
        self.patch.timer.onPlayPause(playPause);
        self.patch.timer.onTimeChange(seek);

        self.media.connect(self.filter);
        self.audioOut.val = self.filter;
    };

    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));

};

Ops.WebAudio.AudioPlayer.prototype = new Op();

// -----------------------------------

Ops.WebAudio.Oscillator = function()
{
    var self = this;
    Op.apply(this, arguments);
    
    if(!window.audioContext){
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

Ops.WebAudio.Oscillator.prototype = new Op();

// --------------------------------------------

Ops.WebAudio.MicrophoneIn = function ()
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

Ops.WebAudio.MicrophoneIn.prototype = new Op();

// --------------------------------------------

Ops.WebAudio.Analyser = function()
{
    var self=this;
    Op.apply(this, arguments);

    if(!window.audioContext) {
         audioContext = new AudioContext();
    }

    this.name='Audio Analyser';
    this.audioIn=this.addInPort(new Port(this,"audio in",OP_PORT_TYPE_OBJECT));
    this.refresh=this.addInPort(new Port(this,"refresh",OP_PORT_TYPE_FUNCTION));

    this.audioOut=this.addOutPort(new Port(this, "audio out",OP_PORT_TYPE_OBJECT));
    this.avgVolume=this.addOutPort(new Port(this, "average volume",OP_PORT_TYPE_VALUE));
    this.fftOut=this.addOutPort(new Port(this, "fft",OP_PORT_TYPE_ARRAY));



    this.oldAudioIn=null;

    this.analyser = audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.3;
    this.analyser.fftSize = 256;
    var fftBufferLength=0;
    var fftDataArray =null;

    this.refresh.onTriggered = function()
    {
        var array =  new Uint8Array(self.analyser.frequencyBinCount);
        self.analyser.getByteFrequencyData(array);
        
        var values = 0;
        var average;

        for (var i = 0; i < array.length; i++)
        {
            values += array[i];
        }
 
        average = values / array.length;
        self.avgVolume.val=average;



        self.analyser.getByteFrequencyData(fftDataArray);
        self.fftOut.val=fftDataArray;
        // console.log('',fftDataArray);
                

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

        fftBufferLength = self.analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
    };

    this.audioOut.val = this.analyser;
};

Ops.WebAudio.Analyser.prototype = new Op();


