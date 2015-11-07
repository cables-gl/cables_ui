

Ops.Array=Ops.Array||{};

// -----------------------------------------

Ops.Array.RandomArray = function()
{
    var self=this;
    Op.apply(this, arguments);


    this.name='RandomArray';
    this.numValues=this.addInPort(new Port(this, "numValues",OP_PORT_TYPE_VALUE));
    this.values=this.addOutPort(new Port(this, "values",OP_PORT_TYPE_ARRAY));
    var arr=[];


    this.numValues.onValueChanged = function()
    {
        arr.length=self.numValues.val;
        for(var i=0;i<arr.length;i++)
        {
            arr[i]=Math.random();
        }
        self.values.val=arr;
    };

    this.numValues.val=100;
};

Ops.Array.RandomArray.prototype = new Op();

// -----------------------------------------


Ops.Array.ArrayGetValue = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='ArrayGetValue';
    this.array=this.addInPort(new Port(this, "array",OP_PORT_TYPE_ARRAY));
    this.index=this.addInPort(new Port(this, "index",OP_PORT_TYPE_VALUE,{type:'int'}));
    this.value=this.addOutPort(new Port(this, "value",OP_PORT_TYPE_VALUE));
    var arr=[];

    function update()
    {
        self.value.set( self.array.val[self.index.get()] );
        // console.log('self.array.val',self.array.val[self.index.val]);
    }

    this.index.onValueChanged=update;
    this.array.onValueChanged=update;
};

Ops.Array.ArrayGetValue.prototype = new Op();




// TODO: CLAMP!

Ops.WebAudio=Ops.WebAudio || {};

Ops.WebAudio.Output = function()
{
    var self=this;
    Op.apply(this, arguments);

    if(!window.audioContext) 
        if('webkitAudioContext' in window) audioContext = new webkitAudioContext();
            else audioContext = new AudioContext();

    this.name='audioOutput';
    this.audioIn=this.addInPort(new Port(this,"audio in",OP_PORT_TYPE_OBJECT));

    this.oldAudioIn=null;

    this.audioIn.onValueChanged = function()
    {
        if(!self.audioIn.val)return;
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

    if(!window.audioContext) 
        if('webkitAudioContext' in window) audioContext = new webkitAudioContext();
            else audioContext = new AudioContext();

    this.filter = audioContext.createGain();
    self.audio=null;
    var buffer=null;
    var playing=false;

    this.volume.onValueChanged = function()
    {
        self.filter.gain.value=self.volume.val;
    };

    function stop()
    {
        self.media.stop();
        self.media = audioContext.createBufferSource();

        self.media.buffer = buffer;
        self.media.connect(self.filter);
        self.audioOut.val = self.filter;
    }


    function seek()
    {
        if(!window.gui && CGL.getLoadingStatus()>=1.0)
        {
            console.log('seek canceled',CGL.getLoadingStatus());
            return;
        }

        if(window.gui)
        {
            if(!self.audio)return;

            if(self.patch.timer.isPlaying() && self.audio.paused) self.audio.play();
                else if(!self.patch.timer.isPlaying() && !self.audio.paused) self.audio.pause();

            self.audio.currentTime=self.patch.timer.getTime();
        }
        else
        {
            if(buffer===null)return;

            var t=self.patch.timer.getTime();
            if(!isFinite(t))
            {
                console.log('not finite time...',t);
                t=0.0;
            }

            if(playing) stop();
            playing=false;

            console.log('seek.....',self.patch.timer.isPlaying());

            if(self.patch.timer.isPlaying() )
            {
                console.log('play!');
                            
                self.media.start(t);
                playing=true;
            }
        }

    }

    function playPause()
    {
        if(!self.audio)return;
                
        if(self.patch.timer.isPlaying()) self.audio.play();
            else self.audio.pause();
    }

    var loadingFilename='';
    this.file.onValueChanged = function()
    {
        // if(self.file.val==loadingFilename)return;
        loadingFilename=self.file.val;

        CGL.incrementLoadingAssets();

        if(window.gui)
        {
            self.audio = new Audio();
            self.audio.src = self.file.val;

            var canplaythrough=function()
            {
                CGL.decrementLoadingAssets();
                self.audio.removeEventListener('canplaythrough',canplaythrough, false);
            };

            self.audio.addEventListener('canplaythrough',canplaythrough, false);
            self.media = audioContext.createMediaElementSource(self.audio);
            self.media.connect(self.filter);
            self.audioOut.val = self.filter;

        }
        else
        {
            self.media = audioContext.createBufferSource();

            var request = new XMLHttpRequest();

            request.open( 'GET', self.file.val, true );
            request.responseType = 'arraybuffer';

            request.onload = function()
            {
                var audioData = request.response;

                audioContext.decodeAudioData( audioData, function(res)
                {
                    buffer=res;
                    console.log('sound load complete');
                    self.media.buffer = res;
                    self.media.connect(self.filter);
                    self.audioOut.val = self.filter;

                    CGL.decrementLoadingAssets();
                } );

            };

            request.send();

        }

        // var firstProgress=true;
        // var progress=function(e)
        // {
        //     if(firstProgress)
        //     {
        //         // self.audio.play(); self.audio.pause(); // force browser to download complete file at one.... wtf...
        //         firstProgress=false;
        //     }
        //     console.log('progress e',self.audio.duration);

        //     for(var i = 0; i < self.audio.buffered.length; i ++)
        //     {
        //         if(self.audio.buffered.end(i)==self.audio.duration)
        //         {
        //             self.audio.removeEventListener('progress',progress, false);
        //             // self.audio.play(); self.audio.pause();
        //             CGL.decrementLoadingAssets();
        //             return;
        //         }
        //     }


        //     // console.log('progress e',e);
                    
        // };









        self.patch.timer.onPlayPause(seek);
        self.patch.timer.onTimeChange(seek);


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




Ops.Devices= Ops.Devices || {};




Ops.Devices.MotionSensor = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='MotionSensor';
    

    this.mulAxis=this.addInPort(new Port(this,"mulAxis"));
    this.mulAxis.val=1.0;
    
    this.foundSensor=this.addOutPort(new Port(this,"foundSensor"));
    
    this.axis1=this.addOutPort(new Port(this,"axis1"));
    this.axis2=this.addOutPort(new Port(this,"axis2"));
    this.axis3=this.addOutPort(new Port(this,"axis3"));

    this.accX=this.addOutPort(new Port(this,"accX"));
    this.accY=this.addOutPort(new Port(this,"accY"));
    this.accZ=this.addOutPort(new Port(this,"accX"));

    this.axis1.set(0);
    this.axis2.set(0);
    this.axis3.set(0);

    this.accX.set(0);
    this.accY.set(0);
    this.accZ.set(0);

    var lastTime=0;
    var lastTimeAcc=0;

    window.ondevicemotion = function(event)
    {
        if(Date.now()-lastTimeAcc>15)
        {
            lastTimeAcc=Date.now();

            self.accX.set( event.accelerationIncludingGravity.x );
            self.accY.set( event.accelerationIncludingGravity.y );
            self.accZ.set( event.accelerationIncludingGravity.z );
        }
    };

    window.addEventListener("deviceorientation", function (event)
    {
        if(Date.now()-lastTime>15)
        {
            lastTime=Date.now();
            self.axis1.set( (event.alpha || 0) *self.mulAxis.get() );
            self.axis2.set( (event.beta || 0 ) *self.mulAxis.get() );
            self.axis3.set( (event.gamma || 0) *self.mulAxis.get() );

        }
    }, true);


};

Ops.Devices.MotionSensor.prototype = new Op();



// -------------------------------------------------------------------------

Ops.Devices.GamePad = function()
{
    Op.apply(this, arguments);

    this.name='GamePad';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.numPads=this.addOutPort(new Port(this,"numPads"));
    this.axis1=this.addOutPort(new Port(this,"axis1"));
    this.axis2=this.addOutPort(new Port(this,"axis2"));
    this.axis3=this.addOutPort(new Port(this,"axis3"));
    this.axis4=this.addOutPort(new Port(this,"axis4"));
    this.button0=this.addOutPort(new Port(this,"button0"));
    this.button1=this.addOutPort(new Port(this,"button1"));
    this.button2=this.addOutPort(new Port(this,"button2"));
    this.button3=this.addOutPort(new Port(this,"button3"));
    this.button4=this.addOutPort(new Port(this,"button4"));

    var self=this;
    var startTime=Date.now()/1000.0;

    this.exe.onTriggered=function()
    {
        var gamePads=navigator.getGamepads();
        var count=0;

        for(var gp in gamePads)
        {
            if(gamePads[gp].axes)
            {
                self.axis1.val=gamePads[gp].axes[0];
                self.axis2.val=gamePads[gp].axes[1];
                self.axis3.val=gamePads[gp].axes[2];
                self.axis4.val=gamePads[gp].axes[3];

                self.button0.val=gamePads[gp].buttons[0].pressed;
                self.button0.val=gamePads[gp].buttons[1].pressed;
                self.button2.val=gamePads[gp].buttons[2].pressed;
                self.button3.val=gamePads[gp].buttons[3].pressed;
                self.button4.val=gamePads[gp].buttons[4].pressed;

                count++;
            }
        }

        self.numPads.val=count;
    };

    this.exe.onTriggered();

};

Ops.Devices.GamePad.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Devices.LeapMotion = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='LeapMotion';

    this.transX=this.addOutPort(new Port(this,"translationX"));
    this.transY=this.addOutPort(new Port(this,"translationY"));
    this.transZ=this.addOutPort(new Port(this,"translationZ"));

    this.finger0X=this.addOutPort(new Port(this,"finger0X"));
    this.finger0Y=this.addOutPort(new Port(this,"finger0Y"));
    this.finger0Z=this.addOutPort(new Port(this,"finger0Z"));

    Leap.loop(function (frame)
    {
        self.transX.val=frame._translation[0];
        self.transY.val=frame._translation[1];
        self.transZ.val=frame._translation[2];

        if(frame.fingers.length>0)
        {
            self.finger0X.val=frame.fingers[0].tipPosition[0];
            self.finger0Y.val=frame.fingers[0].tipPosition[1];
            self.finger0Z.val=frame.fingers[0].tipPosition[2];
        }
    });
};

Ops.Devices.LeapMotion.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Experimental=Ops.Experimental || {};

// --------------------------------------------------------------------------

Ops.Experimental.ImageStream = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ImageStream';

    this.url=this.addInPort(new Port(this,"url"));
    this.url.val="http://localhost:5600/images";

    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));

    var texture=new CGL.Texture(cgl);
    texture.setSize(320,240);

    $('#glcanvas').append('<img id="imagestream">');

    var image = document.getElementById('imagestream');

    this.tex.val=texture;

    image.onload = function ()
    {
        texture.image=image;
        texture.initTexture(image);
        console.log('loaded');
    };

    function run()
    {
        var source = new EventSource(self.url.val);

        source.addEventListener('message', function(event)
        {
            image.src = event.data;
        });
    }

setTimeout(run, 500);
};

Ops.Experimental.ImageStream.prototype = new Op();

// -----------------------------------------------

Ops.Experimental.SaltedPerceptionMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='SaltedPerceptionMaterial';

    this.zBufferTex=this.addInPort(new Port(this,"zBufferTexture",OP_PORT_TYPE_TEXTURE));

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(self.zBufferTex.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.zBufferTex.val.tex);
        }

        self.trigger.call();
        cgl.setPreviousShader();
    };


    var shader_vert=""
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'

        .endl()+'precision highp float;'
        // .endl()+"uniform mat4 projMatrix,viewMatrix,modelMatrix;"
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'

        .endl()+"uniform float time;"
        .endl()+"uniform float zscale;"

        // .endl()+"attribute vec3 Position;"
        .endl()+"attribute vec3 Normal;"
        .endl()+"varying  vec2 texcoord;"
        // .endl()+"attribute vec2 TexCoordIn;"

        .endl()+'varying vec3 norm;'

        .endl()+"uniform sampler2D texDepth;"
        .endl()+"void main(void)"
        .endl()+"{"
        // .endl()+"   mat4 modelViewMatrix = viewMatrix*modelMatrix;"
        .endl()+'   norm=attrVertNormal;'
        .endl()+"   texcoord=attrTexCoord;"
        .endl()+"   float offX=1.0/640.0;"
        .endl()+"   float offY=1.0/480.0;"
        .endl()+"   vec4 texCol= 0.2*texture2D(texDepth, vec2(1.0-texcoord.s,1.0-texcoord.t));"
        .endl()+"   texCol+=0.2* texture2D(texDepth, vec2(1.0-texcoord.s+offX,1.0-texcoord.t+offY));"
        .endl()+"   texCol+=0.2* texture2D(texDepth, vec2(1.0-texcoord.s-offX,1.0-texcoord.t-offY));"
        .endl()+"   texCol+=0.2* texture2D(texDepth, vec2(1.0-texcoord.s+offX,1.0-texcoord.t-offY));"
        .endl()+"   texCol+=0.2* texture2D(texDepth, vec2(1.0-texcoord.s-offX,1.0-texcoord.t+offY));"

        .endl()+"   vec3 vertex=vPosition;"

        .endl()+"   vertex.z+=zscale*(texCol.r*190.0+sin(texCol.r*8.0+time*2.0)*5.0+sin(vertex.y+texture2D(texDepth,texcoord).r*10.0));"
        .endl()+"   texCol.b=0.0;"
        .endl()+"   gl_Position = projMatrix * mvMatrix * vec4(vertex,1.0);"
        .endl()+"}";


    var shader_frag=""
        .endl()+'precision highp float;'
        .endl()+"uniform sampler2D texColor;"
        .endl()+"uniform sampler2D texDepth;"

        .endl()+"uniform float time;"
        .endl()+"varying  vec2 texcoord;"
        .endl()+"void main(){ "
        .endl()+"vec4 color=texture2D(texDepth, vec2(1.0-texcoord.s,1.0-texcoord.t));"
        .endl()+"color.a=1.0;"
        .endl()+"//float d= texture2D(texDepth, vec2(1.0-texcoord.s,texcoord.t)).r;"
        .endl()+"//if(d==1.0)color=vec4(0.0,0.0,0.0,0.0);"
        .endl()+"gl_FragColor = color;"
        .endl()+"}";

    var shader=new CGL.Shader(cgl);
    shader.setSource(shader_vert,shader_frag);



    this.zBufferTexUniform=null;

    this.zBufferTex.onValueChanged=function()
    {

        if(self.zBufferTex.val)
        {
            if(self.zBufferTexUniform!==null)return;
            // console.log('TEXTURE ADDED');
            shader.removeUniform('texDepth');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.zBufferTexUniform=new CGL.Uniform(shader,'t','texDepth',0);
        }
        else
        {
            // console.log('TEXTURE REMOVED');
            shader.removeUniform('texDepth');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.zBufferTexUniform=null;
        }
    };

    this.zScale=this.addInPort(new Port(this,"zscale",OP_PORT_TYPE_VALUE));
    this.zScale.onValueChanged=function()
    {
        if(!self.zScale.uniform) self.zScale.uniform=new CGL.Uniform(shader,'f','zscale',self.zScale.val);
        else self.zScale.uniform.setValue(self.zScale.val);
    };



    this.time=this.addInPort(new Port(this,"time",OP_PORT_TYPE_VALUE));
    this.time.onValueChanged=function()
    {
        if(!self.time.uniform) self.time.uniform=new CGL.Uniform(shader,'f','time',self.time.val);
        else self.time.uniform.setValue(self.time.val);
    };


    this.zScale.val=1.0;

    this.render.onTriggered=this.doRender;
    this.doRender();

};
Ops.Experimental.SaltedPerceptionMaterial.prototype = new Op();


Ops.Gl=Ops.Gl || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.ImageCompose = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='image compose';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.texOut=this.addOutPort(new Port(this,"texture_out",OP_PORT_TYPE_TEXTURE,{preview:true}));

    var effect=new CGL.TextureEffect(cgl);

    cgl.currentTextureEffect=effect;
    this.tex=new CGL.Texture(cgl);

    var w=8,h=8;

    function updateResolution()
    {
        if(self.useVPSize.val)
        {
            w=cgl.getViewPort()[2];
            h=cgl.getViewPort()[3];
        }
        
        if((w!= self.tex.width || h!= self.tex.height) && (w!==0 && h!==0))
        {
     
            self.height.val=h;
            self.width.val=w;
            self.tex.setSize(w,h);
            effect.setSourceTexture(self.tex);
            self.texOut.val=effect.getCurrentSourceTexture();
        }
    }

    this.onResize=updateResolution;

    this.useVPSize.onValueChanged=function()
    {
        if(self.useVPSize.val)
        {
            self.width.onValueChanged=null;
            self.height.onValueChanged=null;
        }
        else
        {
            self.width.onValueChanged=resize;
            self.height.onValueChanged=resize;
        }
    };
    this.useVPSize.val=true;


    function resize()
    {
        h=parseInt(self.height.val,10);
        w=parseInt(self.width.val,10);
        updateResolution();
    }

    render=function()
    {
        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

        updateResolution();
        
        cgl.currentTextureEffect=effect;

        effect.startEffect();

            // cgl.currentTextureEffect.bind();

            // cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
            // cgl.gl.clearColor(0,0,0,0.0);

            // cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

            // cgl.currentTextureEffect.finish();

        self.trigger.trigger();
        self.texOut.val=effect.getCurrentSourceTexture();

        cgl.gl.enable(cgl.gl.SCISSOR_TEST);

    };


    this.texOut.onPreviewChanged=function()
    {
        if(self.texOut.showPreview) self.render.onTriggered=self.texOut.val.preview;
        else self.render.onTriggered=render;
                console.log('jaja changed');
    };
    

    this.width.val=1920;
    this.height.val=1080;
    this.render.onTriggered=render;
};

Ops.Gl.TextureEffects.ImageCompose.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Invert = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Invert';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.rgb=1.0-col.rgb;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}\n';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);


    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Invert.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Scroll = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Scroll';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.amountX=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+'  uniform float amountX;'
        .endl()+'  uniform float amountY;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,vec2(mod(texCoord.x+amountX*0.1,1.0),mod(texCoord.y+amountY*0.1,1.0) ));'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}\n';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);


    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };

    var amountXUniform=new CGL.Uniform(shader,'f','amountX',1.0);

    this.amountX.onValueChanged=function()
    {
        amountXUniform.setValue(self.amountX.val);
    };

    var amountYUniform=new CGL.Uniform(shader,'f','amountY',1.0);

    this.amountY.onValueChanged=function()
    {
        amountYUniform.setValue(self.amountY.val);
    };

    this.amountY.val=0.0;
    this.amountX.val=0.0;


};

Ops.Gl.TextureEffects.Scroll.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Desaturate = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Desaturate';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'vec3 desaturate(vec3 color, float amount)'
        .endl()+'{'
        .endl()+'   vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));'
        .endl()+'   return vec3(mix(color, gray, amount));'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.rgb=desaturate(col.rgb,amount);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Desaturate.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.PixelDisplacement = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='PixelDisplacement';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.amount=this.addInPort(new Port(this,"amountX",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountY=this.addInPort(new Port(this,"amountY",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.displaceTex=this.addInPort(new Port(this,"displaceTex",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D displaceTex;'
        .endl()+'#endif'
        .endl()+'uniform float amountX;'
        .endl()+'uniform float amountY;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,vec2(mod(texCoord.x+texture2D(displaceTex,texCoord).g*1.0*amountX,1.0),mod(texCoord.y+texture2D(displaceTex,texCoord).g*1.0*amountY,1.0) ) );'
        // .endl()+'       col.rgb=desaturate(col.rgb,amount);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','displaceTex',1);

    var amountXUniform=new CGL.Uniform(shader,'f','amountX',0.0);
    var amountYUniform=new CGL.Uniform(shader,'f','amountY',0.0);

    this.amount.onValueChanged=function()
    {
        amountXUniform.setValue(self.amount.val);
    };

    this.amountY.onValueChanged=function()
    {
        amountYUniform.setValue(self.amountY.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.displaceTex.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.displaceTex.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };

    self.amount.val=0.0;
    self.amountY.val=0.0;
};

Ops.Gl.TextureEffects.PixelDisplacement.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.MixImage = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='MixImage';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord)*(1.0-amount);'
        .endl()+'       col+=texture2D(image,texCoord)*amount;'
        .endl()+'   #endif'
        // .endl()+'   col.a=1.0;'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {

            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.MixImage.prototype = new Op();



// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.DrawImage = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='DrawImage';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE,{preview:true }));
    this.blendMode=this.addInPort(new Port(this,"blendMode",OP_PORT_TYPE_VALUE,{ display:'dropdown',values:[
        'normal','lighten','darken','multiply','average','add','substract','difference','negation','exclusion','overlay','screen',
        'color dodge',
        'color burn',
        'softlight',
        'hardlight'
        ] }));
    self.blendMode.val='normal';
    this.imageAlpha=this.addInPort(new Port(this,"imageAlpha",OP_PORT_TYPE_TEXTURE,{preview:true }));
    this.alphaSrc=this.addInPort(new Port(this,"alphaSrc",OP_PORT_TYPE_VALUE,{ display:'dropdown',values:[
        'alpha channel','luminance'
        ] }));
    this.removeAlphaSrc=this.addInPort(new Port(this,"removeAlphaSrc",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.removeAlphaSrc.val=true;
    this.invAlphaChannel=this.addInPort(new Port(this,"invert alpha channel",OP_PORT_TYPE_VALUE,{ display:'bool' }));


    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'

        .endl()+'#ifdef HAS_TEXTUREALPHA'
        .endl()+'  uniform sampler2D imageAlpha;'
        .endl()+'#endif'

        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       blendRGBA=texture2D(image,texCoord);'


        .endl()+'vec3 blend=blendRGBA.rgb;'
        .endl()+'vec4 baseRGBA=texture2D(tex,texCoord);'
        .endl()+'vec3 base=baseRGBA.rgb;'

        .endl()+'vec3 colNew=blend;'
        .endl()+'#define Blend(base, blend, funcf)       vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))'


        .endl()+'#ifdef BM_NORMAL'
        .endl()+'colNew=blend;'
        .endl()+'#endif'

        .endl()+'#ifdef BM_MULTIPLY'
        .endl()+'colNew=base*blend;'
        .endl()+'#endif'


        .endl()+'#ifdef BM_AVERAGE'
        .endl()+'colNew=((base + blend) / 2.0);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_ADD'
        .endl()+'colNew=min(base + blend, vec3(1.0));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SUBSTRACT'
        .endl()+'colNew=max(base + blend - vec3(1.0), vec3(0.0));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_DIFFERENCE'
        .endl()+'colNew=abs(base - blend);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_NEGATION'
        .endl()+'colNew=(vec3(1.0) - abs(vec3(1.0) - base - blend));'
        .endl()+'#endif'

        .endl()+'#ifdef BM_EXCLUSION'
        .endl()+'colNew=(base + blend - 2.0 * base * blend);'
        .endl()+'#endif'
  
        .endl()+'#ifdef BM_LIGHTEN'
        .endl()+'colNew=max(blend, base);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_DARKEN'
        .endl()+'colNew=min(blend, base);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_OVERLAY'
        .endl()+'   #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
        .endl()+'   colNew=Blend(base, blend, BlendOverlayf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SCREEN'
        .endl()+'   #define BlendScreenf(base, blend)       (1.0 - ((1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendScreen(base, blend)        Blend(base, blend, BlendScreenf)'
        .endl()+'   colNew=Blend(base, blend, BlendScreenf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_SOFTLIGHT'
        .endl()+'   #define BlendSoftLightf(base, blend)    ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)))'
        // .endl()+'   #define BlendSoftLight(base, blend)     Blend(base, blend, BlendSoftLightf)'
        .endl()+'   colNew=Blend(base, blend, BlendSoftLightf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_HARDLIGHT'
        .endl()+'   #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))'
        // .endl()+'   #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
        .endl()+'   colNew=Blend(blend, base, BlendOverlayf);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_COLORDODGE'
        .endl()+'   #define BlendColorDodgef(base, blend)   ((blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0))'
        .endl()+'   colNew=Blend(base, blend, BlendColorDodgef);'
        .endl()+'#endif'

        .endl()+'#ifdef BM_COLORBURN'
        .endl()+'   #define BlendColorBurnf(base, blend)    ((blend == 0.0) ? blend : max((1.0 - ((1.0 - base) / blend)), 0.0))'
        .endl()+'   colNew=Blend(base, blend, BlendColorBurnf);'
        .endl()+'#endif'




        .endl()+'#ifdef REMOVE_ALPHA_SRC'
        .endl()+'   blendRGBA.a=1.0;'
        .endl()+'#endif'

        .endl()+'#ifdef HAS_TEXTUREALPHA'

        .endl()+'   vec4 colImgAlpha=texture2D(imageAlpha,texCoord);'
        .endl()+'   float colImgAlphaAlpha=colImgAlpha.a;'

        .endl()+'   #ifdef INVERT_ALPHA'
        .endl()+'       colImgAlphaAlpha=1.0-colImgAlphaAlpha;'
        .endl()+'   #endif'


        .endl()+'   #ifdef ALPHA_FROM_LUMINANCE'
        .endl()+'       vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));'
        .endl()+'       colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;'
        .endl()+'   #endif'

        .endl()+'   blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;'


        .endl()+'#endif'
        

        // .endl()+'vec4 finalColor=vec4(colNew*amount*blendRGBA.a,blendRGBA.a);'
        // .endl()+'finalColor+=vec4(base*(1.0-amount)*baseRGBA.a,baseRGBA.a);'//, base ,1.0-blendRGBA.a*amount);'
        .endl()+'blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);'
        .endl()+'blendRGBA.a=baseRGBA.a+blendRGBA.a;'


        // .endl()+'blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);'
        // .endl()+'blendRGBA.a=alpha;'

        .endl()+'#endif'
   

        .endl()+'   gl_FragColor = blendRGBA;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);
    var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

    this.invAlphaChannel.onValueChanged=function()
    {
        if(self.invAlphaChannel.val) shader.define('INVERT_ALPHA');
            else shader.removeDefine('INVERT_ALPHA');
        shader.compile();
    };

    this.removeAlphaSrc.onValueChanged=function()
    {
        if(self.removeAlphaSrc.val) shader.define('REMOVE_ALPHA_SRC');
            else shader.removeDefine('REMOVE_ALPHA_SRC');
        shader.compile();
    };

    this.alphaSrc.onValueChanged=function()
    {
        if(self.alphaSrc.val=='luminance') shader.define('ALPHA_FROM_LUMINANCE');
            else shader.removeDefine('ALPHA_FROM_LUMINANCE');
        shader.compile();
    };

    this.alphaSrc.val="alpha channel";

    this.blendMode.onValueChanged=function()
    {
        if(self.blendMode.val=='normal') shader.define('BM_NORMAL');
            else shader.removeDefine('BM_NORMAL');

        if(self.blendMode.val=='multiply') shader.define('BM_MULTIPLY');
            else shader.removeDefine('BM_MULTIPLY');

        if(self.blendMode.val=='average') shader.define('BM_AVERAGE');
            else shader.removeDefine('BM_AVERAGE');

        if(self.blendMode.val=='add') shader.define('BM_ADD');
            else shader.removeDefine('BM_ADD');

        if(self.blendMode.val=='substract') shader.define('BM_SUBSTRACT');
            else shader.removeDefine('BM_SUBSTRACT');

        if(self.blendMode.val=='difference') shader.define('BM_DIFFERENCE');
            else shader.removeDefine('BM_DIFFERENCE');

        if(self.blendMode.val=='negation') shader.define('BM_NEGATION');
            else shader.removeDefine('BM_NEGATION');

        if(self.blendMode.val=='exclusion') shader.define('BM_EXCLUSION');
            else shader.removeDefine('BM_EXCLUSION');

        if(self.blendMode.val=='lighten') shader.define('BM_LIGHTEN');
            else shader.removeDefine('BM_LIGHTEN');

        if(self.blendMode.val=='darken') shader.define('BM_DARKEN');
            else shader.removeDefine('BM_DARKEN');

        if(self.blendMode.val=='overlay') shader.define('BM_OVERLAY');
            else shader.removeDefine('BM_OVERLAY');

        if(self.blendMode.val=='screen') shader.define('BM_SCREEN');
            else shader.removeDefine('BM_SCREEN');
        
        if(self.blendMode.val=='softlight') shader.define('BM_SOFTLIGHT');
            else shader.removeDefine('BM_SOFTLIGHT');

        if(self.blendMode.val=='hardlight') shader.define('BM_HARDLIGHT');
            else shader.removeDefine('BM_HARDLIGHT');

        if(self.blendMode.val=='color dodge') shader.define('BM_COLORDODGE');
            else shader.removeDefine('BM_COLORDODGE');

        if(self.blendMode.val=='color burn') shader.define('BM_COLORBURN');
            else shader.removeDefine('BM_COLORBURN');

        shader.compile();
    };

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.imageAlpha.onValueChanged=function()
    {
        if(self.imageAlpha.val && self.imageAlpha.val.tex) shader.define('HAS_TEXTUREALPHA');
            else shader.removeDefine('HAS_TEXTUREALPHA');
        shader.compile();
    };

    function render()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {

            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            if(self.imageAlpha.val && self.imageAlpha.val.tex)
            {
                cgl.gl.activeTexture(cgl.gl.TEXTURE2);
                cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.imageAlpha.val.tex );
            }

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    }

    function preview()
    {
        render();
        self.image.val.preview();
    }

    function previewAlpha()
    {
        render();
        self.imageAlpha.val.preview();
    }

    this.image.onPreviewChanged=function()
    {
        if(self.image.showPreview) self.render.onTriggered=preview;
        else self.render.onTriggered=render;
    };

    this.imageAlpha.onPreviewChanged=function()
    {
        if(self.imageAlpha.showPreview) self.render.onTriggered=previewAlpha;
        else self.render.onTriggered=render;
    };
    
    this.render.onTriggered=render;


};

Ops.Gl.TextureEffects.DrawImage.prototype = new Op();



// ---------------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.DepthTexture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='DepthTexture';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.farPlane=this.addInPort(new Port(this,"farplane",OP_PORT_TYPE_VALUE));
    this.nearPlane=this.addInPort(new Port(this,"nearplane",OP_PORT_TYPE_VALUE));
    
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        .endl()+'uniform float n;'
        .endl()+'uniform float f;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(image,texCoord);'
        .endl()+'       float z=col.r;'
        .endl()+'       float c=(2.0*n)/(f+n-z*(f-n));'
        .endl()+'       col=vec4(c,c,c,1.0);'

        .endl()+'       if(c>=0.99)col.a=0.0;'
        .endl()+'           else col.a=1.0;'
        .endl()+'   #endif'
        
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','image',0);

    var uniFarplane=new CGL.Uniform(shader,'f','f',1.0);
    var uniNearplane=new CGL.Uniform(shader,'f','n',1.0);

    this.farPlane.onValueChanged=function()
    {
        uniFarplane.setValue(self.farPlane.val);
    };
    self.farPlane.val=5.0;

    this.nearPlane.onValueChanged=function()
    {
        uniNearplane.setValue(self.nearPlane.val);
    };
    self.nearPlane.val=0.01;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.DepthTexture.prototype = new Op();



// ---------------------------------------------------------------------------------------------



Ops.Gl.TextureEffects.SSAO = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='SSAO';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.farPlane=this.addInPort(new Port(this,"farplane",OP_PORT_TYPE_VALUE));
    this.nearPlane=this.addInPort(new Port(this,"nearplane",OP_PORT_TYPE_VALUE));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.dist=this.addInPort(new Port(this,"dist",OP_PORT_TYPE_VALUE,{display:'range'}));

    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'  uniform sampler2D colTex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+'uniform float dist;'
        
        .endl()+'uniform float near;'
        .endl()+'uniform float far;'
        .endl()+''

.endl()+'#define samples 8.0'
.endl()+'#define rings 4.0'
.endl()+'#define PI    3.14159265'
.endl()+''

.endl()+'float readDepth(vec2 coord)'
.endl()+'{'
.endl()+'    return (2.0 * near) / (far + near - texture2D(image, coord ).x * (far-near));'
.endl()+'}'

.endl()+'float compareDepths( in float depth1, in float depth2 )'
.endl()+'{'
.endl()+'    float aoCap = 1.9;'
.endl()+'    float aoMultiplier =40.0;'
.endl()+'    float depthTolerance = 0.001;'
.endl()+'    float aorange = 100.0;'// units in space the AO effect extends to (this gets divided by the camera far range
.endl()+'    float diff = sqrt(clamp(1.0-(depth1-depth2) / (aorange/(far-near)),0.0,1.0));'
.endl()+'    float ao = min(aoCap,max(0.0,depth1-depth2-depthTolerance) * aoMultiplier) * diff;'
.endl()+'    return ao;'
.endl()+'}'

        .endl()+'void main()'
        .endl()+'{'

        .endl()+'float d;float ao=1.0;    float depth = readDepth(texCoord);'

        .endl()+'float w=1.0/640.0;'
        .endl()+'float h=1.0/360.0;'

        .endl()+'float pw;'
        .endl()+'float ph;'

        .endl()+'float s=0.0;'
        .endl()+'float fade = 1.0;'

        .endl()+'for (float i = 0.0 ; i < rings; i += 1.0)'
        .endl()+'{'
        .endl()+'   fade *= 0.5;'
        .endl()+'   for (float j = 0.0 ; j < samples; j += 1.0)'
        .endl()+'   {'
        .endl()+'       float step = PI*2.0 / (samples*i);'
        .endl()+'       float jj=j*2.0*i*2.0;'

        .endl()+'       pw = (cos(jj*step)*i);'
        .endl()+'       ph = (sin(jj*step)*i)*2.0;'

        .endl()+'       pw*=dist;'
        .endl()+'       ph*=dist;'

        .endl()+'       d = readDepth( vec2(texCoord.s+pw*w,texCoord.t+ph*h));'

        .endl()+'       ao += compareDepths(depth,d)*fade;'
        .endl()+'       s += 1.0*fade*1.0;'
        .endl()+'   }'
        .endl()+'}'

        .endl()+'ao /= s;'
        .endl()+'ao = 1.0-ao;'
        // .endl()+'ao *= amount;'
        .endl()+'ao = 1.0-ao;'
        
        .endl()+'vec4 col=vec4(ao,ao,ao,1.0);'
        // .endl()+'col.r=0.0;'
        .endl()+'col=texture2D(colTex,texCoord)-col*amount;'
        .endl()+'       col.a=1.0;'


        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','image',0);
    var textureColorUniform=new CGL.Uniform(shader,'t','colTex',1);

    var uniFarplane=new CGL.Uniform(shader,'f','far',1.0);
    var uniNearplane=new CGL.Uniform(shader,'f','near',1.0);
    var uniAmount=new CGL.Uniform(shader,'f','amount',1.0);
    var uniDist=new CGL.Uniform(shader,'f','dist',1.0);
    


    this.dist.onValueChanged=function()
    {
        uniDist.setValue(self.dist.val*5);
    };
    self.dist.val=0.2;

    this.amount.onValueChanged=function()
    {
        uniAmount.setValue(self.amount.val);
    };
    self.amount.val=1.0;

    this.farPlane.onValueChanged=function()
    {
        uniFarplane.setValue(self.farPlane.val);
    };
    self.farPlane.val=5.0;

    this.nearPlane.onValueChanged=function()
    {
        uniNearplane.setValue(self.nearPlane.val);
    };
    self.nearPlane.val=0.01;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );


            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.SSAO.prototype = new Op();



// ---------------------------------------------------------------------------------------------






Ops.Gl.TextureEffects.AlphaMask = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='AlphaMask';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    // this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'
        // .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        
        .endl()+'   #ifdef FROM_RED'
        .endl()+'       col.a=texture2D(image,texCoord).r;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_GREEN'
        .endl()+'       col.a=texture2D(image,texCoord).g;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_BLUE'
        .endl()+'       col.a=texture2D(image,texCoord).b;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_ALPHA'
        .endl()+'       col.a=texture2D(image,texCoord).a;'
        .endl()+'   #endif'

        .endl()+'   #ifdef FROM_LUMINANCE'
        .endl()+'       vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), texture2D(image,texCoord).rgb ));'
        .endl()+'       col.a=(gray.r+gray.g+gray.b)/3.0;'
        .endl()+'   #endif'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    this.method=this.addInPort(new Port(this,"method",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:["luminance","image alpha","red","green","blue"]} ));

    this.method.onValueChanged=function()
    {
        if(self.method.val=='luminance') shader.define('FROM_LUMINANCE');
            else shader.removeDefine('FROM_LUMINANCE');
        if(self.method.val=='image alpha') shader.define('FROM_ALPHA');
            else shader.removeDefine('FROM_ALPHA');
        if(self.method.val=='red') shader.define('FROM_RED');
            else shader.removeDefine('FROM_RED');
        if(self.method.val=='green') shader.define('FROM_GREEN');
            else shader.removeDefine('FROM_GREEN');
        if(self.method.val=='blue') shader.define('FROM_BLUE');
            else shader.removeDefine('FROM_BLUE');
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.image.val && self.image.val.tex)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.AlphaMask.prototype = new Op();



// ---------------------------------------------------------------------------------------------




Ops.Gl.TextureEffects.WipeTransition = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='WipeTransition';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.fade=this.addInPort(new Port(this,"fade",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.fadeWidth=this.addInPort(new Port(this,"fadeWidth",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'#endif'

        .endl()+'uniform float fade;'
        .endl()+'uniform float fadeWidth;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       vec4 colWipe=texture2D(image,texCoord);'

        .endl()+'       float w=fadeWidth;'
        .endl()+'       float v=colWipe.r;'
        .endl()+'       float f=fade+fade*w;'

        .endl()+'       if(f<v) col.a=1.0;'
        .endl()+'       else if(f>v+w) col.a=0.0;'
        .endl()+'       else if(f>v && f<=v+w) col.a = 1.0-(f-v)/w; ;'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);
    var fadeUniform=new CGL.Uniform(shader,'f','fade',0);
    var fadeWidthUniform=new CGL.Uniform(shader,'f','fadeWidth',0);

    this.fade.onValueChanged=function()
    {
        fadeUniform.setValue(self.fade.val);
    };

    this.fadeWidth.onValueChanged=function()
    {
        fadeWidthUniform.setValue(self.fadeWidth.val);
    };

    this.fade.val=0.5;
    this.fadeWidth.val=0.2;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;

        if(self.image.val && self.image.val.tex)
        {
            cgl.setShader(shader);
            cgl.currentTextureEffect.bind();

            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

            cgl.currentTextureEffect.finish();
            cgl.setPreviousShader();
        }

        self.trigger.trigger();
    };

};

Ops.Gl.TextureEffects.WipeTransition.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.ColorLookup = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorLookup';

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.posy=this.addInPort(new Port(this,"posy",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.image=this.addInPort(new Port(this,"image",OP_PORT_TYPE_TEXTURE));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform sampler2D image;'
        .endl()+'  uniform float posy;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.r=col.r*(1.0-amount)+texture2D(image,vec2(col.r,posy)).r*amount;'
        .endl()+'       col.g=col.g*(1.0-amount)+texture2D(image,vec2(col.g,posy)).g*amount;'
        .endl()+'       col.b=col.b*(1.0-amount)+texture2D(image,vec2(col.b,posy)).b*amount;'
        .endl()+'   #endif'
        .endl()+'   col.a=1.0;'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    var posyUniform=new CGL.Uniform(shader,'f','posy',0.0);

    this.posy.onValueChanged=function()
    {
        posyUniform.setValue(self.posy.val);
    };

    this.posy.val=0.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(self.image.val && self.image.val.tex)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.ColorLookup.prototype = new Op();



// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.BrightnessContrast = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='BrightnessContrast';

    this.amount=this.addInPort(new Port(this,"contrast",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.amountBright=this.addInPort(new Port(this,"brightness",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+'uniform float amountbright;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'

        .endl()+'       // apply contrast'
        .endl()+'       col.rgb = ((col.rgb - 0.5) * max(amount*2.0, 0.0))+0.5;'

        .endl()+'       // apply brightness'
        .endl()+'       col.rgb += amountbright;'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var amountUniform=new CGL.Uniform(shader,'f','amount',0.4);
    var amountBrightUniform=new CGL.Uniform(shader,'f','amountbright',0.0);

    this.amount.onValueChanged=function()
    {
        console.log('amount changed! '+self.amount.val);
        amountUniform.setValue(self.amount.val);
    };

    this.amountBright.onValueChanged=function()
    {
        amountBrightUniform.setValue(self.amountBright.val);
    };
    

    this.amountBright.val=0;
    this.amount.val=0.5;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.BrightnessContrast.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.RemoveAlpha = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='RemoveAlpha';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.a=1.0;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.RemoveAlpha.prototype = new Op();

// ---------------------------------------------------------------------------------------------





Ops.Gl.TextureEffects.ColorOverlay = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorOverlay';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform float r;'
        .endl()+'  uniform float g;'
        .endl()+'  uniform float b;'
        .endl()+'  uniform float a;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        // .endl()+'       col.a=1.0;'
        .endl()+'   #endif'


        .endl()+'   vec4 overCol=vec4(r,g,b,col.a);'
        .endl()+'   col=mix(col,overCol, a);'

        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };



    var uniformR=new CGL.Uniform(shader,'f','r',1.0);
    var uniformG=new CGL.Uniform(shader,'f','g',1.0);
    var uniformB=new CGL.Uniform(shader,'f','b',1.0);
    var uniformA=new CGL.Uniform(shader,'f','a',1.0);


    this.r.onValueChanged=function()
    {
        uniformR.setValue(self.r.val);
    };

    this.g.onValueChanged=function()
    {
        uniformG.setValue(self.g.val);
    };

    this.b.onValueChanged=function()
    {
        uniformB.setValue(self.b.val);
    };

    this.a.onValueChanged=function()
    {
        uniformA.setValue(self.a.val);
    };

    this.a.val=1.0;
    this.r.val=1.0;
    this.g.val=0.0;
    this.b.val=0.0;

};

Ops.Gl.TextureEffects.ColorOverlay.prototype = new Op();

// ---------------------------------------------------------------------------------------------



Ops.Gl.TextureEffects.ColorChannel = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ColorChannel';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(0.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        
        .endl()+'   #ifdef CHANNEL_R'
        .endl()+'       col.r=texture2D(tex,texCoord).r;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.g=col.b=col.r;'
        .endl()+'       #endif'

        .endl()+'   #endif'

        .endl()+'   #ifdef CHANNEL_G'
        .endl()+'       col.g=texture2D(tex,texCoord).g;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.r=col.b=col.g;'
        .endl()+'       #endif'
        .endl()+'   #endif'

        .endl()+'   #ifdef CHANNEL_B'
        .endl()+'       col.b=texture2D(tex,texCoord).b;'
        .endl()+'       #ifdef MONO'
        .endl()+'           col.g=col.r=col.b;'
        .endl()+'       #endif'
        .endl()+'   #endif'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };

    this.channelR=this.addInPort(new Port(this,"channelR",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelR.onValueChanged=function()
    {
        if(self.channelR.val) shader.define('CHANNEL_R');
            else shader.removeDefine('CHANNEL_R');
    };
    this.channelR.val=true;

    this.channelG=this.addInPort(new Port(this,"channelG",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelG.val=false;
    this.channelG.onValueChanged=function()
    {
        if(self.channelG.val)shader.define('CHANNEL_G');
            else shader.removeDefine('CHANNEL_G');
    };


    this.channelB=this.addInPort(new Port(this,"channelB",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.channelB.val=false;
    this.channelB.onValueChanged=function()
    {
        if(self.channelB.val) shader.define('CHANNEL_B');
            else shader.removeDefine('CHANNEL_B');
    };

    this.mono=this.addInPort(new Port(this,"mono",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.mono.val=false;
    this.mono.onValueChanged=function()
    {
        if(self.mono.val) shader.define('MONO');
            else shader.removeDefine('MONO');
    };


};

Ops.Gl.TextureEffects.ColorChannel.prototype = new Op();

// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.RgbMultiply = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='RgbMultiply';

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));
    this.r.val=1.0;
    this.g.val=1.0;
    this.b.val=1.0;

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       col.r*=r;'
        .endl()+'       col.g*=g;'
        .endl()+'       col.b*=b;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformR=new CGL.Uniform(shader,'f','r',1.0);
    var uniformG=new CGL.Uniform(shader,'f','g',1.0);
    var uniformB=new CGL.Uniform(shader,'f','b',1.0);

    this.r.onValueChanged=function()
    {
        uniformR.setValue(self.r.val);
    };

    this.g.onValueChanged=function()
    {
        uniformG.setValue(self.g.val);
    };

    this.b.onValueChanged=function()
    {
        uniformB.setValue(self.b.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.RgbMultiply.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Hue = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Hue';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.hue=this.addInPort(new Port(this,"hue",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.hue.val=1.0;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float hue;'
        .endl()+''

        .endl()+'vec3 rgb2hsv(vec3 c)'
        .endl()+'{'
        .endl()+'    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);'
        .endl()+'    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));'
        .endl()+'    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));'
        .endl()+''
        .endl()+'    float d = q.x - min(q.w, q.y);'
        .endl()+'    float e = 1.0e-10;'
        .endl()+'    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);'
        .endl()+'}'

        .endl()+'vec3 hsv2rgb(vec3 c)'
        .endl()+'{'
        .endl()+'    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);'
        .endl()+'    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);'
        .endl()+'    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);'
        .endl()+'}'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        
        .endl()+'       vec3 hsv = rgb2hsv(col.rgb);'
        .endl()+'       hsv.x=hsv.x+hue;'
        .endl()+'       col.rgb = hsv2rgb(hsv);'

        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformHue=new CGL.Uniform(shader,'f','hue',1.0);

    this.hue.onValueChanged=function()
    {
        uniformHue.setValue(self.hue.val);
    };

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Hue.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Color = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Color';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+'uniform float a;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(r,g,b,a);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniformR=new CGL.Uniform(shader,'f','r',1.0);
    var uniformG=new CGL.Uniform(shader,'f','g',1.0);
    var uniformB=new CGL.Uniform(shader,'f','b',1.0);
    var uniformA=new CGL.Uniform(shader,'f','a',1.0);


    this.r.onValueChanged=function()
    {
        uniformR.setValue(self.r.val);
    };

    this.g.onValueChanged=function()
    {
        uniformG.setValue(self.g.val);
    };

    this.b.onValueChanged=function()
    {
        uniformB.setValue(self.b.val);
    };

    this.a.onValueChanged=function()
    {
        uniformA.setValue(self.a.val);
    };

    this.r.val=1.0;
    this.g.val=1.0;
    this.b.val=1.0;
    this.a.val=1.0;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Color.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Vignette = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Vignette';

    this.lensRadius1=this.addInPort(new Port(this,"lensRadius1"));
    this.lensRadius2=this.addInPort(new Port(this,"lensRadius2"));
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float lensRadius1;'
        .endl()+'uniform float lensRadius2;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       vec2 tcPos=vec2(texCoord.x,texCoord.y/1.777+0.25);'

        .endl()+'       float dist = distance(tcPos, vec2(0.5,0.5));'
        .endl()+'       col.rgb *= smoothstep(lensRadius1, lensRadius2, dist);'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniLensRadius1=new CGL.Uniform(shader,'f','lensRadius1',0.4);
    var uniLensRadius2=new CGL.Uniform(shader,'f','lensRadius2',0.3);

    this.lensRadius1.onValueChanged=function()
    {
        uniLensRadius1.setValue(self.lensRadius1.val);
    };

    this.lensRadius2.onValueChanged=function()
    {
        uniLensRadius2.setValue(self.lensRadius2.val);
    };

    this.lensRadius1.val=0.8;
    this.lensRadius2.val=0.4;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Vignette.prototype = new Op();

// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Blur = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Blur';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.iterations=this.addInPort(new Port(this,"iterations",OP_PORT_TYPE_VALUE));
    this.iterations.val=10;

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'  uniform float dirX;'
        .endl()+'  uniform float dirY;'
        .endl()+'  uniform float width;'
        .endl()+'  uniform float height;'
        .endl()+'#endif'
        .endl()+''
        .endl()+'vec4 blur9(sampler2D texture, vec2 uv, vec2 red, vec2 dir)'
        .endl()+'{'
        .endl()+'   vec4 color = vec4(0.0);'
        .endl()+'   vec2 offset1 = vec2(1.3846153846) * dir;'
        .endl()+'   vec2 offset2 = vec2(3.2307692308) * dir;'
        .endl()+'   color += texture2D(texture, uv) * 0.2270270270;'
        .endl()+'   color += texture2D(texture, uv + (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv - (offset1 / red)) * 0.3162162162;'
        .endl()+'   color += texture2D(texture, uv + (offset2 / red)) * 0.0702702703;'
        .endl()+'   color += texture2D(texture, uv - (offset2 / red)) * 0.0702702703;'
        .endl()+'   return color;'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=blur9(tex,texCoord,vec2(width,height),vec2(dirX,dirY));'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniDirX=new CGL.Uniform(shader,'f','dirX',0);
    var uniDirY=new CGL.Uniform(shader,'f','dirY',0);

    var uniWidth=new CGL.Uniform(shader,'f','width',0);
    var uniHeight=new CGL.Uniform(shader,'f','height',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        cgl.setShader(shader);

        uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
        uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

        for(var i =0;i<self.iterations.val;i++)
        {
            // first pass

            cgl.currentTextureEffect.bind();
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            uniDirX.setValue(0.0);
            uniDirY.setValue(1.0);

            cgl.currentTextureEffect.finish();

            // second pass

            cgl.currentTextureEffect.bind();
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

            uniDirX.setValue(1.0);
            uniDirY.setValue(0.0);

            cgl.currentTextureEffect.finish();
        }

        cgl.setPreviousShader();
        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.Blur.prototype = new Op();





// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.FXAA = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    // shader from: https://github.com/mattdesl/glsl-fxaa

    this.name='FXAA';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    
    this.fxaa_span=this.addInPort(new Port(this,"span",OP_PORT_TYPE_VALUE,{display:'dropdown',values:[0,2,4,8,16,32,64]}));
    this.fxaa_reduceMin=this.addInPort(new Port(this,"reduceMin",OP_PORT_TYPE_VALUE));
    this.fxaa_reduceMul=this.addInPort(new Port(this,"reduceMul",OP_PORT_TYPE_VALUE));

    this.texWidth=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.texHeight=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    var srcFrag=''
               
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'    uniform float FXAA_SPAN_MAX;'

        .endl()+'    uniform float FXAA_REDUCE_MUL;'
        .endl()+'    uniform float FXAA_REDUCE_MIN;'
        .endl()+'    uniform float width;'
        .endl()+'    uniform float height;'

        .endl()+'vec4 getColorFXAA(vec2 coord)'
        .endl()+'{'
        .endl()+'    vec2 invtexsize=vec2(1.0/width,1.0/height);'
        .endl()+''
        .endl()+'    float step=1.0;'
        .endl()+''
        .endl()+'    vec3 rgbNW = texture2D(tex, coord.xy + (vec2(-step, -step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbNE = texture2D(tex, coord.xy + (vec2(+step, -step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbSW = texture2D(tex, coord.xy + (vec2(-step, +step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbSE = texture2D(tex, coord.xy + (vec2(+step, +step)*invtexsize )).xyz;'
        .endl()+'    vec3 rgbM  = texture2D(tex, coord.xy).xyz;'
        .endl()+''
        .endl()+'    vec3 luma = vec3(0.299, 0.587, 0.114);'
        .endl()+'    float lumaNW = dot(rgbNW, luma);'
        .endl()+'    float lumaNE = dot(rgbNE, luma);'
        .endl()+'    float lumaSW = dot(rgbSW, luma);'
        .endl()+'    float lumaSE = dot(rgbSE, luma);'
        .endl()+'    float lumaM  = dot( rgbM, luma);'
        .endl()+''
        .endl()+'    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));'
        .endl()+'    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));'
        .endl()+''
        .endl()+'    vec2 dir;'
        .endl()+'    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));'
        .endl()+'    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));'
        .endl()+''
        .endl()+'    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);'
        .endl()+''
        .endl()+'    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);'
        .endl()+''
        .endl()+'    dir = min(vec2(FXAA_SPAN_MAX,  FXAA_SPAN_MAX),'
        .endl()+'          max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin))*invtexsize ;'
        .endl()+''
        .endl()+'    vec3 rgbA = (1.0/2.0) * ('
        .endl()+'                texture2D(tex, coord.xy + dir * (1.0/3.0 - 0.5)).xyz +'
        .endl()+'                texture2D(tex, coord.xy + dir * (2.0/3.0 - 0.5)).xyz);'
        .endl()+'    vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * ('
        .endl()+'                texture2D(tex, coord.xy + dir * (0.0/3.0 - 0.5)).xyz +'
        .endl()+'                texture2D(tex, coord.xy + dir * (3.0/3.0 - 0.5)).xyz);'
        .endl()+'    float lumaB = dot(rgbB, luma);'
        .endl()+''
        .endl()+'    vec4 color=texture2D(tex,coord).rgba;'
        .endl()+''
        .endl()+'    if((lumaB < lumaMin) || (lumaB > lumaMax)){'
        .endl()+'      color.xyz=rgbA;'
        .endl()+'    } else {'
        .endl()+'      color.xyz=rgbB;'
        .endl()+'    }'
        .endl()+'    return color;'
        .endl()+'}'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   gl_FragColor = getColorFXAA(texCoord);'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        cgl.setShader(shader);

        cgl.currentTextureEffect.bind();
        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        
        cgl.setPreviousShader();

        self.trigger.trigger();
    };


    var uniformSpan=new CGL.Uniform(shader,'f','FXAA_SPAN_MAX',0);

    var uniformMul=new CGL.Uniform(shader,'f','FXAA_REDUCE_MUL',0);
    var uniformMin=new CGL.Uniform(shader,'f','FXAA_REDUCE_MIN',0);

    this.fxaa_span.onValueChanged=function()
    {
        uniformSpan.setValue(parseInt(self.fxaa_span.val,10));
    };

    var uWidth=new CGL.Uniform(shader,'f','width',0);
    var uHeight=new CGL.Uniform(shader,'f','height',0);

    function changeRes()
    {
        uWidth.setValue(self.texWidth.val);
        uHeight.setValue(self.texHeight.val);
    }

    this.texWidth.onValueChanged=changeRes;
    this.texHeight.onValueChanged=changeRes;
    
    this.fxaa_span.val=8;
    this.texWidth.val=1920;
    this.texHeight.val=1080;

    this.fxaa_reduceMul.onValueChanged=function()
    {
        uniformMul.setValue(1.0/self.fxaa_reduceMul.val);
    };

    this.fxaa_reduceMin.onValueChanged=function()
    {
        uniformMin.setValue(1.0/self.fxaa_reduceMin.val);
    };

    this.fxaa_reduceMul.val=8;
    this.fxaa_reduceMin.val=128;


};

Ops.Gl.TextureEffects.FXAA.prototype = new Op();


// ---------------------------------------------------------------------------------------------

Ops.Gl.TextureEffects.Noise = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Noise';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'

        .endl()+'uniform float amount;'
        .endl()+'uniform float time;'

        .endl()+'float random(vec2 co)'
        .endl()+'{'
        .endl()+'   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);'
        .endl()+'}'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   float c=random(time*texCoord.xy);'
        .endl()+'   vec4 col=texture2D(tex,texCoord);'
        .endl()+'   col.rgb=mix(col.rgb,vec3(c),amount);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        timeUniform.setValue(self.patch.timer.getTime());

        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };

    var amountUniform=new CGL.Uniform(shader,'f','amount',1.0);
    var timeUniform=new CGL.Uniform(shader,'f','time',1.0);

    this.amount.onValueChanged=function()
    {
        amountUniform.setValue(self.amount.val);
    };

    this.amount.val=0.3;

};

Ops.Gl.TextureEffects.Noise.prototype = new Op();



// ---------------------------------------------------------------------------------------------


Ops.Gl.TextureEffects.ChromaticAberration = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='ChromaticAberration';

    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'  varying vec2 texCoord;'
        .endl()+'  uniform sampler2D tex;'
        .endl()+'#endif'
        .endl()+'uniform float amount;'
        .endl()+''
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1.0,0.0,0.0,1.0);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'       col=texture2D(tex,texCoord);'
        .endl()+'       vec2 tcPos=vec2(texCoord.x,texCoord.y/1.777+0.25);'
        .endl()+'       float dist = distance(tcPos, vec2(0.5,0.5));'
        .endl()+'       col.r=texture2D(tex,texCoord+(dist)*-amount).r;'
        .endl()+'       col.b=texture2D(tex,texCoord+(dist)*amount).b;'
        .endl()+'   #endif'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';

    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    var textureUniform=new CGL.Uniform(shader,'t','tex',0);
    var uniAmount=new CGL.Uniform(shader,'f','amount',0);

    this.amount.onValueChanged=function()
    {
        uniAmount.setValue(self.amount.val*0.1);
    };
    this.amount.val=0.5;

    this.render.onTriggered=function()
    {
        if(!cgl.currentTextureEffect)return;
        
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.gl.activeTexture(cgl.gl.TEXTURE0);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();

        self.trigger.trigger();
    };
};

Ops.Gl.TextureEffects.ChromaticAberration.prototype = new Op();


//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl=Ops.Gl || {};





Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    if(!this.patch.cgl)
    {
        console.log(' no cgl!');
    }

    var cgl=this.patch.cgl;

    this.name='renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var identTranslate=vec3.create();
    vec3.set(identTranslate, 0,0,-2);

    this.onDelete=function()
    {
        self.patch.removeOnAnimFrame(self);
    };

    this.onAnimFrame=function(time)
    {
        if(cgl.canvasWidth==-1)
        {
            cgl.setCanvas(self.patch.config.glCanvasId);
            return;
        }

        if(cgl.canvasWidth!=cgl.canvas.clientWidth || cgl.canvasHeight!=cgl.canvas.clientHeight)
        {
            cgl.canvasWidth=cgl.canvas.clientWidth;
            self.width.set(cgl.canvasWidth);
            cgl.canvasHeight=cgl.canvas.clientHeight;
            self.height.set(cgl.canvasHeight);
        }

        Ops.Gl.Renderer.renderStart(cgl,identTranslate);

        self.trigger.trigger();

        if(CGL.Texture.previewTexture)
        {
            if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
            CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
        }
        Ops.Gl.Renderer.renderEnd(cgl);
    };

};


Ops.Gl.Renderer.renderStart=function(cgl,identTranslate)
{
    cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.gl.clearColor(0,0,0,1);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    cgl.setViewPort(0,0,cgl.canvas.clientWidth,cgl.canvas.clientHeight);
    mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.01, 1100.0);

    cgl.pushPMatrix();
    cgl.pushMvMatrix();

    mat4.identity(cgl.mvMatrix);
    mat4.translate(cgl.mvMatrix,cgl.mvMatrix, identTranslate);

    cgl.gl.enable(cgl.gl.BLEND);
    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.beginFrame();
};

Ops.Gl.Renderer.renderEnd=function(cgl,identTranslate)
{
    cgl.popMvMatrix();
    cgl.popPMatrix();

    cgl.endFrame();
};

Ops.Gl.Renderer.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Gl.Perspective = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Perspective';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.fovY=this.addInPort(new Port(this,"fov y",OP_PORT_TYPE_VALUE ));
    this.fovY.val=45;

    this.zNear=this.addInPort(new Port(this,"frustum near",OP_PORT_TYPE_VALUE ));
    this.zNear.val=0.01;

    this.zFar=this.addInPort(new Port(this,"frustum far",OP_PORT_TYPE_VALUE ));
    this.zFar.val=2000.0;


    this.render.onTriggered=function()
    {
        mat4.perspective(cgl.pMatrix,self.fovY.val*0.0174533, cgl.getViewPort()[2]/cgl.getViewPort()[3], self.zNear.val, self.zFar.val);
        cgl.pushPMatrix();

        self.trigger.trigger();

        cgl.popPMatrix();
    };

    function changed()
    {
        cgl.frameStore.perspective=
        {
            fovy:self.fovY.val,
            zFar:self.zFar.val,
            zNear:self.zNear.val,
        };
    }

    this.fovY.onValueChanged=changed;
    this.zFar.onValueChanged=changed;
    this.zNear.onValueChanged=changed;

};

Ops.Gl.Perspective.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.LetterBox = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='letterbox';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.ratio=this.addInPort(new Port(this,"ratio",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:[1.25,1.3333333333,1.777777777778,2.33333333333333]} ));
    this.ratio.val=1.777777777778;

    var x=0,y=0,w=1000,h=1000;


    function resize()
    {
        var _w=cgl.canvasHeight*self.ratio.val;
        var _h=cgl.canvasHeight;
        var _x=0;
        var _y=0;
        if(_w>cgl.canvasWidth)
        {
           _w=cgl.canvasWidth;
           _h=cgl.canvasWidth/self.ratio.val;
        }

        if(_w<cgl.canvasWidth) _x=(cgl.canvasWidth-_w)/2;
        if(_h<cgl.canvasHeight) _y=(cgl.canvasHeight-_h)/2;


        if(_w!=w || _h!=h || _x!=x ||_y!=y)
        {
            w=_w;
            h=_h;
            x=_x;
            y=_y;

            cgl.setViewPort(x,y,w,h);

            for(var i=0;i<self.patch.ops.length;i++)
            {
                if(self.patch.ops[i].onResize)self.patch.ops[i].onResize();
            }

        }
        

    }

    this.render.onTriggered=function()
    {
        cgl.gl.enable(cgl.gl.SCISSOR_TEST);

        resize();

        cgl.gl.scissor(x,y,w,h);
        cgl.setViewPort(x,y,w,h);
        
        mat4.perspective(cgl.pMatrix,45, self.ratio.val, 0.01, 1100.0);


        self.trigger.trigger();
        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

    };
};

Ops.Gl.LetterBox.prototype = new Op();
Ops.Gl.AspectRatioBorder=Ops.Gl.LetterBox;

// --------------------------------------------------------------------------





Ops.Gl.ClearAlpha = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ClearAlpha';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.a.val=1.0;

    this.render.onTriggered=function()
    {
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clearColor(0, 0, 0, self.a.val);
        cgl.gl.clear(cgl.gl.GL_COLOR_BUFFER_BIT | cgl.gl.GL_DEPTH_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);

        self.trigger.trigger();
    };
};

Ops.Gl.ClearAlpha.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.ClearColor = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ClearColor';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true'}));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r.val=0.3;
    this.g.val=0.3;
    this.b.val=0.3;
    this.a.val=1.0;
    this.render.onTriggered=function()
    {
        cgl.gl.clearColor(self.r.val,self.g.val,self.b.val,self.a.val);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        self.trigger.trigger();
    };
};

Ops.Gl.ClearColor.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.FaceCulling = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='FaceCulling';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.enable=this.addInPort(new Port(this,"enable",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.enable.val=true;

    this.facing=this.addInPort(new Port(this,"facing",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:['back','front','both']} ));
    this.facing.val='back';

    var whichFace=cgl.gl.BACK;
    this.render.onTriggered=function()
    {
        cgl.gl.cullFace(whichFace);

        if(self.enable.val) cgl.gl.enable(cgl.gl.CULL_FACE);
        else cgl.gl.disable(cgl.gl.CULL_FACE);

        self.trigger.trigger();

        cgl.gl.disable(cgl.gl.CULL_FACE);
    };

    this.facing.onValueChanged=function()
    {
        whichFace=cgl.gl.BACK;
        if(self.facing.val=='front')whichFace=cgl.gl.FRONT;
        if(self.facing.val=='both')whichFace=cgl.gl.FRONT_AND_BACK;
    };
};

Ops.Gl.FaceCulling.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Depth = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Depth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.clear=this.addInPort(new Port(this,"clear depth",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.enable=this.addInPort(new Port(this,"enable depth testing",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.write=this.addInPort(new Port(this,"write to depth buffer",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.depthFunc=this.addInPort(new Port(this,"ratio",OP_PORT_TYPE_VALUE ,{display:'dropdown',values:['never','always','less','less or equal','greater', 'greater or equal','equal','not equal']} ));

    var theDepthFunc=cgl.gl.LEQUAL;

    this.depthFunc.onValueChanged=function()
    {
        if(self.depthFunc.val=='never') theDepthFunc=cgl.gl.NEVER;
        if(self.depthFunc.val=='always') theDepthFunc=cgl.gl.ALWAYS;
        if(self.depthFunc.val=='less') theDepthFunc=cgl.gl.LESS;
        if(self.depthFunc.val=='less or equal') theDepthFunc=cgl.gl.LEQUAL;
        if(self.depthFunc.val=='greater') theDepthFunc=cgl.gl.GREATER;
        if(self.depthFunc.val=='greater or equal') theDepthFunc=cgl.gl.EQUAL;
        if(self.depthFunc.val=='equal') theDepthFunc=cgl.gl.EQUAL;
        if(self.depthFunc.val=='not equal') theDepthFunc=cgl.gl.NOTEQUAL;
    };

    this.depthFunc.val='less or equal';

    this.clear.val=false;
    this.enable.val=true;
    this.write.val=true;

    this.render.onTriggered=function()
    {
        if(true===self.clear.val) cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
        if(true!==self.enable.val) cgl.gl.disable(cgl.gl.DEPTH_TEST);
        if(true!==self.write.val) cgl.gl.depthMask(false);

        cgl.gl.depthFunc(theDepthFunc);

        self.trigger.trigger();

        cgl.gl.enable(cgl.gl.DEPTH_TEST);
        cgl.gl.depthMask(true);
        cgl.gl.depthFunc(cgl.gl.LEQUAL);
    };

};

Ops.Gl.Depth.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ClearDepth = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ClearDepth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);
        self.trigger.trigger();
    };
};

Ops.Gl.ClearDepth.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Wireframe = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Wireframe';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.lineWidth=this.addInPort(new Port(this,"lineWidth"));

    this.render.onTriggered=function()
    {
        cgl.wireframe=true;
        cgl.gl.lineWidth(self.lineWidth.val);
        self.trigger.trigger();
        cgl.wireframe=false;

    };

    this.lineWidth.val=2;
};

Ops.Gl.Wireframe.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Points = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Points';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.pointSize=this.addInPort(new Port(this,"pointSize"));

    this.render.onTriggered=function()
    {
        cgl.points=true;
        // gl.pointSize(self.pointSize.val);
        self.trigger.trigger();
        cgl.points=false;

    };

    this.pointSize.val=5;
};

Ops.Gl.Points.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ColorPick=function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ColorPick';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.x=this.addInPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.y=this.addInPort(new Port(this,"y",OP_PORT_TYPE_VALUE));

    this.r=this.addOutPort(new Port(this,"r",OP_PORT_TYPE_VALUE));
    this.g=this.addOutPort(new Port(this,"g",OP_PORT_TYPE_VALUE));
    this.b=this.addOutPort(new Port(this,"b",OP_PORT_TYPE_VALUE));
    this.a=this.addOutPort(new Port(this,"a",OP_PORT_TYPE_VALUE));

    var pixelValues = new Uint8Array(4);
    // var canvas = document.getElementById("glcanvas");

    function render()
    {
        cgl.gl.readPixels(self.x.val, cgl.canvas.height-self.y.val, 1,1,  cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE ,pixelValues);
        self.r.val=pixelValues[0]/255;
        self.g.val=pixelValues[1]/255;
        self.b.val=pixelValues[2]/255;
        self.a.val=pixelValues[3]/255;
    }

    this.render.onTriggered=render;
};

Ops.Gl.ColorPick.prototype = new Op();
Ops.Gl.ReadPixel=Ops.Gl.ColorPick;


// --------------------------------------------------------------------------


Ops.Gl.Mouse = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='mouse';
    this.mouseX=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.mouseY=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));

    this.normalize=this.addInPort(new Port(this,"normalize",OP_PORT_TYPE_VALUE,{display:'bool'}));

    this.smooth=this.addInPort(new Port(this,"smooth",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.smoothSpeed=this.addInPort(new Port(this,"smoothSpeed",OP_PORT_TYPE_VALUE));

    this.multiply=this.addInPort(new Port(this,"multiply",OP_PORT_TYPE_VALUE));
    this.multiply.set(1.0);

    this.smoothSpeed.set(20);
    var speed=this.smoothSpeed.get();

    var smoothTimer;

    function setValue(x,y)
    {
        if(self.normalize.get())
        {
            self.mouseX.set( (x/cgl.canvas.width*2.0-1.0)*self.multiply.get() );
            self.mouseY.set( (y/cgl.canvas.height*2.0-1.0)*self.multiply.get() );
        }
        else
        {
            self.mouseX.set( x*self.multiply.get() );
            self.mouseY.set( y*self.multiply.get() );
        }
    }

    this.smooth.onValueChanged=function()
    {
        if(self.smooth.get()) smoothTimer = setInterval(updateSmooth, 15);
            else clearTimeout(smoothTimer);
    };

    var smoothX,smoothY;
    var lineX=0,lineY=0;

    var mouseX=cgl.canvas.width/2;
    var mouseY=cgl.canvas.height/2;
    lineX=mouseX;
    lineY=mouseY;

    this.mouseX.set(mouseX);
    this.mouseY.set(mouseY);

    function updateSmooth()
    {
        if(speed<=0)speed=0.01;
        var distanceX = Math.abs(mouseX - lineX);
        var speedX = Math.round( distanceX / speed, 0 );
        lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

        var distanceY = Math.abs(mouseY - lineY);
        var speedY = Math.round( distanceY / speed, 0 );
        lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

        setValue(lineX,lineY);
    }

    cgl.canvas.onmouseenter = function(e)
    {
        speed=self.smoothSpeed.get();
    };

    function mouseLeave(e)
    {
        speed=100;
        if(self.smooth.get())
        {
            mouseX=cgl.canvas.width/2;
            mouseY=cgl.canvas.height/2;
        }
    }
    cgl.canvas.onmouseleave=mouseLeave;

    cgl.canvas.onmousemove = function(e)
    {
        if(self.smooth.get())
        {
            mouseX=e.offsetX;
            mouseY=e.offsetY;
        }
        else
        {
            setValue(e.offsetX,e.offsetY);
        }
    };

};

Ops.Gl.Mouse.prototype = new Op();



// --------------------------------------------------------------------------
    
Ops.Gl.TextureEmpty = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture empty';
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.tex=new CGL.Texture(cgl);
    
    var sizeChanged=function()
    {
        self.tex.setSize(self.width.val,self.height.val);
        self.textureOut.val=self.tex;
    };

    this.width.onValueChanged=sizeChanged;
    this.height.onValueChanged=sizeChanged;

    this.width.val=8;
    this.height.val=8;
};

Ops.Gl.TextureEmpty.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureCycler = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='TextureCycler';

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    
    var textures=[];
    var texturePorts=[];

    function setTextureArray()
    {
        textures.length=0;
        for(var i in self.portsIn)
        {
            if(self.portsIn[i].isLinked() && self.portsIn[i].get())
            {
                textures.push(self.portsIn[i].get());
            }
        }
    }

    this.getPort=function(name)
    {
        var p=self.getPortByName(name);

        if(p)return p;

        if(name.startsWith('texture')) p=addPort(name);
        return p;
    };

    function checkPorts()
    {
        var allLinked=true;
        for(var i in self.portsIn)
        {
            if(!self.portsIn[i].isLinked())
            {
                allLinked=false;
            }
        }

        if(allLinked)
        {
            addPort();
        }

        setTextureArray();
    }

    function addPort(n)
    {
        if(!n)n="texture"+texturePorts.length;
        var newPort=self.addInPort(new Port(self,n,OP_PORT_TYPE_TEXTURE));

        // newPort.onLink=checkPorts;
        newPort.onLinkChanged=checkPorts;
        newPort.onValueChanged=checkPorts;

        texturePorts.push(newPort);
        checkPorts();
    }

    addPort();

    var index=0;

    this.exe.onTriggered=function()
    {
        if(textures.length===0)
        {
            self.textureOut.set(null);
            return;
        }

        index++;
        if(index>textures.length-1)index=0;
        self.textureOut.set(textures[index]);
    };

    this.textureOut.onPreviewChanged=function()
    {
        if(self.textureOut.showPreview) CGL.Texture.previewTexture=self.textureOut.get();
    };

};

Ops.Gl.TextureCycler.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Texture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture';
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'image' } ));
    this.filter=this.addInPort(new Port(this,"filter",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['nearest','linear','mipmap']}));

    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));
    
    this.cgl_filter=CGL.Texture.FILTER_MIPMAP;

    var reload=function()
    {
        if(self.filename.val)
        {
            // console.log('load texture... '+self.filename.val);
            self.tex=CGL.Texture.load(cgl,self.patch.getFilePath(self.filename.val),function()
            {
                self.textureOut.val=self.tex;
                self.width.val=self.tex.width;
                self.height.val=self.tex.height;

                if(!self.tex.isPowerOfTwo()) self.uiAttr({warning:'texture dimensions not power of two! - texture filtering will not work.'});
                else self.uiAttr({warning:''});

            },{filter:self.cgl_filter});
            self.textureOut.val=self.tex;
        }

    };

    this.filename.onValueChanged=reload;
    this.filter.onValueChanged=function()
    {
        if(self.filter.val=='nearest') self.cgl_filter=CGL.Texture.FILTER_NEAREST;
        if(self.filter.val=='linear') self.cgl_filter=CGL.Texture.FILTER_LINEAR;
        if(self.filter.val=='mipmap') self.cgl_filter=CGL.Texture.FILTER_MIPMAP;

        reload();
    };
    this.filter.val='linear';

    this.textureOut.onPreviewChanged=function()
    {
        if(self.textureOut.showPreview) CGL.Texture.previewTexture=self.textureOut.val;
    };

};

Ops.Gl.Texture.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.TextureText = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='TextureText';
    this.text=this.addInPort(new Port(this,"text",OP_PORT_TYPE_VALUE,{type:'string'}));
    this.fontSize=this.addInPort(new Port(this,"fontSize"));
    this.align=this.addInPort(new Port(this,"align",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['left','center','right']}));
    this.font=this.addInPort(new Port(this,"font"));
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    
    this.fontSize.val=30;
    this.font.val='Arial';
    this.align.val='center';

    var canvas = document.createElement('canvas');
    canvas.id     = "hiddenCanvas";
    canvas.width  = 512;
    canvas.height = 512;
    canvas.style.display   = "none";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);

    var fontImage = document.getElementById('hiddenCanvas');
    var ctx = fontImage.getContext('2d');

    function refresh()
    {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = self.fontSize.val+"px "+self.font.val;
        ctx.textAlign = self.align.val;
        if(self.align.val=='center') ctx.fillText(self.text.val, ctx.canvas.width / 2, ctx.canvas.height / 2);
        if(self.align.val=='left') ctx.fillText(self.text.val, 0, ctx.canvas.height / 2);
        if(self.align.val=='right') ctx.fillText(self.text.val, ctx.canvas.width, ctx.canvas.height / 2);
        ctx.restore();

        if(self.textureOut.val) self.textureOut.val.initTexture(fontImage);
            else self.textureOut.val=new CGL.Texture.fromImage(cgl,fontImage);
    }

    this.align.onValueChanged=refresh;
    this.text.onValueChanged=refresh;
    this.fontSize.onValueChanged=refresh;
    this.font.onValueChanged=refresh;
    this.text.val='cables';
};

Ops.Gl.TextureText.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes=Ops.Gl.Meshes || {};

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Plotter = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Plotter';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        cgl.getShader().bind();
        cgl.gl.enableVertexAttribArray(cgl.getShader().getAttrVertexPos());
        cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),self.buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, self.buffer);
        cgl.gl.drawArrays(cgl.gl.LINE_STRIP, 0, self.buffer.numItems);

        self.trigger.trigger();
    };

    this.buffer = cgl.gl.createBuffer();

    var num=50;
    this.vertices = [];
    for(var i=0;i<num;i++)
    {
        this.vertices.push(1/num*i);
        this.vertices.push(Math.random()-0.5);
        this.vertices.push(0);
    }

    function bufferData()
    {
        cgl.gl.lineWidth(4);

        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, self.buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(self.vertices), cgl.gl.STATIC_DRAW);
        self.buffer.itemSize = 3;
        self.buffer.numItems = num;
    }
    bufferData();

    this.v.onValueChanged=function()
    {
        self.vertices.splice(0,3);
        self.vertices.push(1);
        self.vertices.push(self.v.val);
        self.vertices.push(0);

        for(var i=0;i<num*3;i+=3)
        {
            self.vertices[i]=1/num*i;
        }

        bufferData();
    };
};

Ops.Gl.Meshes.Plotter.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.Matrix={};

Ops.Gl.Matrix.Translate = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='translate';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addInPort(new Port(this,"x"));
    this.y=this.addInPort(new Port(this,"y"));
    this.z=this.addInPort(new Port(this,"z"));
    this.x.val=0.0;
    this.y.val=0.0;
    this.z.val=0.0;
    
    var vec=vec3.create();

    this.render.onTriggered=function()
    {
        vec3.set(vec, self.x.val,self.y.val,self.z.val);
        cgl.pushMvMatrix();
        mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };
};

Ops.Gl.Matrix.Translate.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.Scale = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='scale';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.scale=this.addInPort(new Port(this,"scale"));
    
    var vScale=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,transMatrix);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.scaleChanged=function()
    {
        doScale=false;
        vec3.set(vScale, self.scale.get(),self.scale.get(),self.scale.get());
        updateMatrix();
    };

    this.scale.onValueChanged=this.scaleChanged;
    this.scale.val=1.0;
    updateMatrix();
};

Ops.Gl.Matrix.Scale.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.LookatCamera = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='LookatCamera';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.centerX=this.addInPort(new Port(this,"centerX"));
    this.centerY=this.addInPort(new Port(this,"centerY"));
    this.centerZ=this.addInPort(new Port(this,"centerZ"));

    this.eyeX=this.addInPort(new Port(this,"eyeX"));
    this.eyeY=this.addInPort(new Port(this,"eyeY"));
    this.eyeZ=this.addInPort(new Port(this,"eyeZ"));

    this.vecUpX=this.addInPort(new Port(this,"upX"));
    this.vecUpY=this.addInPort(new Port(this,"upY"));
    this.vecUpZ=this.addInPort(new Port(this,"upZ"));

    this.centerX.val=0;
    this.centerY.val=0;
    this.centerZ.val=0;

    this.eyeX.val=5;
    this.eyeY.val=5;
    this.eyeZ.val=5;

    this.vecUpX.val=0;
    this.vecUpY.val=1;
    this.vecUpZ.val=0;
    
    var vUp=vec3.create();
    var vEye=vec3.create();
    var vCenter=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        vec3.set(vUp, self.vecUpX.val,self.vecUpY.val,self.vecUpZ.val);
        vec3.set(vEye, self.eyeX.val,self.eyeY.val,self.eyeZ.val);
        vec3.set(vCenter, self.centerX.val,self.centerY.val,self.centerZ.val);

        mat4.lookAt(cgl.mvMatrix, vEye, vCenter, vUp);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

};

Ops.Gl.Matrix.LookatCamera.prototype = new Op();

// ----------------------------------------------------


Ops.Gl.Matrix.Shear = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    this.name='Shear';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.shearX=this.addInPort(new Port(this,"shearX"));
    this.shearY=this.addInPort(new Port(this,"shearY"));

    var shearMatrix = mat4.create();

    function update()
    {
        mat4.identity(shearMatrix);
        shearMatrix[1]=Math.tan(self.shearX.val);
        shearMatrix[4]=Math.tan(self.shearY.val);
    }

    this.shearY.onValueChanged=update;
    this.shearX.onValueChanged=update;

    // 1, shearY, 0, 0, 
    //   shearX, 1, 0, 0,
    //   0, 0, 1, 0,
    //   0, 0, 0, 1 };

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();

        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,shearMatrix);
        self.trigger.trigger();

        cgl.popMvMatrix();
    };

    self.shearX.val=0.0;
    self.shearY.val=0.0;
};

Ops.Gl.Matrix.Shear.prototype = new Op();

// -----------------------------------------------------

Ops.Gl.Matrix.Transform = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    this.name='transform';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.posX=this.addInPort(new Port(this,"posX"));
    this.posY=this.addInPort(new Port(this,"posY"));
    this.posZ=this.addInPort(new Port(this,"posZ"));

    this.scaleX=this.addInPort(new Port(this,"scaleX"));
    this.scaleY=this.addInPort(new Port(this,"scaleY"));
    this.scaleZ=this.addInPort(new Port(this,"scaleZ"));

    this.rotX=this.addInPort(new Port(this,"rotX"));
    this.rotY=this.addInPort(new Port(this,"rotY"));
    this.rotZ=this.addInPort(new Port(this,"rotZ"));
   
    var vPos=vec3.create();
    var vScale=vec3.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;
    var doTranslate=false;

    var translationChanged=true;
    var scaleChanged=true;
    var rotChanged=true;

    this.render.onTriggered=function()
    {
        var updateMatrix=false;
        if(translationChanged)
        {
            updateTranslation();
            updateMatrix=true;
        }
        if(scaleChanged)
        {
            updateScale();
            updateMatrix=true;
        }
        if(rotChanged)
        {
            updateMatrix=true;
        }
        if(updateMatrix)doUpdateMatrix();


        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,transMatrix);

        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    var doUpdateMatrix=function()
    {
        mat4.identity(transMatrix);
        if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

        if(self.rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, self.rotX.get()*CGL.DEG2RAD);
        if(self.rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, self.rotY.get()*CGL.DEG2RAD);
        if(self.rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, self.rotZ.get()*CGL.DEG2RAD);

        if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
        rotChanged=false;
    };

    function updateTranslation()
    {
        doTranslate=false;
        if(self.posX.get()!==0.0 || self.posY.get()!==0.0 || self.posZ.get()!==0.0)doTranslate=true;
        vec3.set(vPos, self.posX.get(),self.posY.get(),self.posZ.get());
        translationChanged=false;
    }

    function updateScale()
    {
        doScale=false;
        if(self.scaleX.get()!==0.0 || self.scaleY.get()!==0.0 || self.scaleZ.get()!==0.0)doScale=true;
        vec3.set(vScale, self.scaleX.get(),self.scaleY.get(),self.scaleZ.get());
        scaleChanged=false;
    }

    this.translateChanged=function()
    {
        translationChanged=true;
    };

    this.scaleChanged=function()
    {
        scaleChanged=true;
    };

    this.rotChanged=function()
    {
        rotChanged=true;
    };

    this.rotX.onValueChanged=this.rotChanged;
    this.rotY.onValueChanged=this.rotChanged;
    this.rotZ.onValueChanged=this.rotChanged;

    this.scaleX.onValueChanged=this.scaleChanged;
    this.scaleY.onValueChanged=this.scaleChanged;
    this.scaleZ.onValueChanged=this.scaleChanged;

    this.posX.onValueChanged=this.translateChanged;
    this.posY.onValueChanged=this.translateChanged;
    this.posZ.onValueChanged=this.translateChanged;

    this.rotX.set(0.0);
    this.rotY.set(0.0);
    this.rotZ.set(0.0);

    this.scaleX.set(1.0);
    this.scaleY.set(1.0);
    this.scaleZ.set(1.0);

    this.posX.set(0.0);
    this.posY.set(0.0);
    this.posZ.set(0.0);

    doUpdateMatrix();
};

Ops.Gl.Matrix.Transform.prototype = new Op();

// ----------------------------------------------------

Ops.Gl.Matrix.MatrixMul = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    this.name='matrix';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.matrix=this.addInPort(new Port(this,"matrix"),OP_PORT_TYPE_ARRAY);

    this.render.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.multiply(cgl.mvMatrix,cgl.mvMatrix,self.matrix.val);
        self.trigger.trigger();
        cgl.popMvMatrix();
    };


    // this.matrix.onValueChanged=update;

    this.matrix.val=[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

};

Ops.Gl.Matrix.MatrixMul.prototype = new Op();


// -----------------------------------------

Ops.RandomCluster = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='random cluster';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.num=this.addInPort(new Port(this,"num"));
    this.size=this.addInPort(new Port(this,"size"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;
    this.idx=this.addOutPort(new Port(this,"index")) ;
    this.rnd=this.addOutPort(new Port(this,"rnd")) ;
    this.randoms=[];
    this.randomsRot=[];
    this.randomsFloats=[];

    var transVec=vec3.create();

    this.exe.onTriggered=function()
    {
        for(var i=0;i<self.randoms.length;i++)
        {
            cgl.pushMvMatrix();

            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, self.randoms[i]);

            mat4.rotateX(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][0]);
            mat4.rotateY(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][1]);
            mat4.rotateZ(cgl.mvMatrix,cgl.mvMatrix, self.randomsRot[i][2]);

            self.idx.set(i);
            self.rnd.set(self.randomsFloats[i]);

            self.trigger.trigger();

            cgl.popMvMatrix();
        }
    };

    function reset()
    {
        self.randoms=[];
        self.randomsRot=[];
        self.randomsFloats=[];

        for(var i=0;i<self.num.get();i++)
        {
            self.randomsFloats.push(Math.random());
            self.randoms.push(vec3.fromValues(
                (Math.random()-0.5)*self.size.get(),
                (Math.random()-0.5)*self.size.get(),
                (Math.random()-0.5)*self.size.get()
                ));
            self.randomsRot.push(vec3.fromValues(
                Math.random()*360*CGL.DEG2RAD,
                Math.random()*360*CGL.DEG2RAD,
                Math.random()*360*CGL.DEG2RAD
                ));
        }
    }

    this.size.set(40);

    this.num.onValueChanged=reset;
    this.size.onValueChanged=reset;

    this.num.set(100);
};

Ops.RandomCluster.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.Render2Texture = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    var depthTextureExt = cgl.gl.getExtension( "WEBKIT_WEBGL_depth_texture" ) ||
                    cgl.gl.getExtension( "MOZ_WEBGL_depth_texture" ) ||
                    cgl.gl.getExtension('WEBGL_depth_texture');
    // var depthTextureExt = cgl.gl.getExtension("WEBKIT_WEBGL_depth_texture"); // Or browser-appropriate prefix

    this.name='render to texture';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var frameBuf;
    var texture=new CGL.Texture(cgl);
    var textureDepth=new CGL.Texture(cgl,{isDepthTexture:true});

    this.useVPSize=this.addInPort(new Port(this,"use viewport size",OP_PORT_TYPE_VALUE,{ display:'bool' }));

    this.width=this.addInPort(new Port(this,"texture width"));
    this.height=this.addInPort(new Port(this,"texture height"));
    // this.clear=this.addInPort(new Port(this,"clear",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    // this.clear.val=true;

    this.tex=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.texDepth=this.addOutPort(new Port(this,"textureDepth",OP_PORT_TYPE_TEXTURE));
    var renderbuffer=null;

    frameBuf = cgl.gl.createFramebuffer();

    self.tex.val=texture;
    self.texDepth.val=textureDepth;

    function resize()
    {
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        self.width.val=cgl.getViewPort()[2];
        self.height.val=cgl.getViewPort()[3];

        if(renderbuffer)cgl.gl.deleteRenderbuffer(renderbuffer);

        renderbuffer = cgl.gl.createRenderbuffer();
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, self.width.val,self.height.val);

        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, texture.tex, 0);
        cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, renderbuffer);

        cgl.gl.framebufferTexture2D(
            cgl.gl.FRAMEBUFFER,
            cgl.gl.DEPTH_ATTACHMENT,
            cgl.gl.TEXTURE_2D,
            textureDepth.tex,
            0 );

        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        // console.log('resize r2t',self.width.val,self.height.val);

        texture.setSize(self.width.val,self.height.val);
        textureDepth.setSize(self.width.val,self.height.val);
    }


    this.useVPSize.onValueChanged=function()
    {
        if(self.useVPSize.val)
        {
            self.width.onValueChanged=null;
            self.height.onValueChanged=null;
        }
        else
        {
            self.width.onValueChanged=resize;
            self.height.onValueChanged=resize;
        }
    };

    this.width.val=1920;
    this.height.val=1080;
    this.useVPSize.val=true;

    var oldViewport;

    this.onResize=resize;


    function render()
    {
        cgl.pushMvMatrix();

        cgl.gl.disable(cgl.gl.SCISSOR_TEST);

        if(self.useVPSize.val)
        {
            if(texture.width!=cgl.getViewPort()[2] || texture.height!=cgl.getViewPort()[3] )
            {
                console.log('not the same ? ',texture.width, cgl.getViewPort()[2] , texture.height , cgl.getViewPort()[3]);
                        
                for(var i=0;i<self.patch.ops.length;i++)
                {
                    if(self.patch.ops[i].onResize)self.patch.ops[i].onResize();
                }
            }
        }

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        cgl.pushPMatrix();
        // cgl.gl.viewport(-self.width/2, 0, self.width.val/2,self.height.val);

        cgl.gl.viewport(0, 0, self.width.val,self.height.val);
        // mat4.perspective(cgl.pMatrix,45, 1, 0.01, 1100.0);

        // if(self.clear.val)
        // {
        //     cgl.gl.clearColor(0,0,0,1);
        //     cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        // }
        // else
        // {
            cgl.gl.clearColor(0,0,0,0);
            cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        // }

        self.trigger.trigger();

        cgl.popPMatrix();
        
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);
        
        cgl.popMvMatrix();
        cgl.resetViewPort();

        cgl.gl.enable(cgl.gl.SCISSOR_TEST);

    }

    function preview()
    {
        render();
        self.tex.val.preview();
    }

    this.tex.onPreviewChanged=function()
    {
        if(self.tex.showPreview) self.render.onTriggered=preview;
        else self.render.onTriggered=render;
    };


    self.render.onTriggered=render;
};

Ops.Gl.Render2Texture.prototype = new Op();











// ----------------------------------------------------

Ops.Gl.Spray = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='spray';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    

    this.timer=this.addInPort(new Port(this,"time"));

    this.num=this.addInPort(new Port(this,"num"));
    this.size=this.addInPort(new Port(this,"size"));

    
    this.lifetime=this.addInPort(new Port(this,"lifetime"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;
    this.idx=this.addOutPort(new Port(this,"index")) ;
    this.lifeTimePercent=this.addOutPort(new Port(this,"lifeTimePercent")) ;
    var particles=[];

    var transVec=vec3.create();

    function Particle()
    {
        this.pos=null;

        this.startPos=null;
        this.startTime=0;
        this.lifeTime=0;
        this.lifeTimePercent=0;
        this.endTime=0;

        this.pos=[0,0,0];
        this.moveVec=[0,0,0];
        this.idDead=false;

        this.update=function(time)
        {
            var timeRunning=time-this.startTime;
            if(time>this.endTime)this.isDead=true;
            this.lifeTimePercent=timeRunning/this.lifeTime;
        
            this.pos=vec3.fromValues(
                this.startPos[0]+timeRunning*this.moveVec[0],
                this.startPos[1]+timeRunning*this.moveVec[1],
                this.startPos[2]+timeRunning*this.moveVec[2]
                );
        };

        this.reAnimate=function(time)
        {
            this.isDead=false;
            this.startTime=time;
            this.lifeTime=Math.random()*self.lifetime.val;
            this.endTime=time+this.lifeTime;
            this.startPos=vec3.fromValues(
                Math.random()*0.5,
                Math.random()*0.5,
                Math.random()*0.5);

            this.moveVec=[
                Math.random()*0.2,
                Math.random()*0.2,
                Math.random()*0.2
                ];

                    

        };
        this.reAnimate(0);
    }




    this.exe.onTriggered=function()
    {
        // var time=self.patch.timer.getTime();
        var time=self.timer.val;
        for(var i=0;i<particles.length;i++)
        {
            if(particles[i].isDead)particles[i].reAnimate(time);
            
            particles[i].update(time);

            cgl.pushMvMatrix();

            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, particles[i].pos);


            self.idx.val=i;
            self.lifeTimePercent.val= particles[i].lifeTimePercent;
            // self.rnd.val=self.randomsFloats[i];

            self.trigger.trigger();

            cgl.popMvMatrix();
        }
    };

    function reset()
    {
        particles.length=0;

        for(var i=0;i<self.num.val;i++)
        {
            var p=new Particle();
            p.reAnimate(0);
            particles.push(p);
        }
    }

    this.num.onValueChanged=reset;
    this.size.onValueChanged=reset;
    this.lifetime.onValueChanged=reset;

    this.num.val=100;
    reset();
};

Ops.Gl.Spray.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Identity = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Identity';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        // if(cgl.frameStore.perspective) mat4.perspective(cgl.pMatrix,cgl.frameStore.perspective.fovY, cgl.getViewPort()[2]/cgl.getViewPort()[3], cgl.frameStore.perspective.zNear, cgl.frameStore.perspective.zFar);
        //     else mat4.perspective(cgl.pMatrix,45, cgl.canvasWidth/cgl.canvasHeight, 0.01, 1100.0);

        self.trigger.trigger();

        cgl.popMvMatrix();
    };

};

Ops.Gl.Identity.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.CanvasSize = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='CanvasSize';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var w=0,h=0;

    this.exe.onTriggered=function()
    {
        if(cgl.canvasHeight!=h) h=self.height.val=cgl.canvasHeight;
        if(cgl.canvasWidth!=w) w=self.width.val=cgl.canvasWidth;
        self.trigger.trigger();
    };
};

Ops.Gl.CanvasSize.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.ViewPortSize = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ViewPortSize';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.y=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));

    this.width=this.addOutPort(new Port(this,"width",OP_PORT_TYPE_VALUE));
    this.height=this.addOutPort(new Port(this,"height",OP_PORT_TYPE_VALUE));

    var w=0,h=0,x=0,y=0;

    this.exe.onTriggered=function()
    {
        if(cgl.getViewPort()[0]!=x) w=self.x.val=cgl.getViewPort()[0];
        if(cgl.getViewPort()[1]!=y) h=self.y.val=cgl.getViewPort()[1];
        if(cgl.getViewPort()[2]!=h) h=self.width.val=cgl.getViewPort()[2];
        if(cgl.getViewPort()[3]!=w) w=self.height.val=cgl.getViewPort()[3];
        self.trigger.trigger();
    };
};

Ops.Gl.ViewPortSize.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Performance = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Performance';
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION)) ;

    var canvas = document.createElement('canvas');
    canvas.id     = "performance_"+self.patch.config.glCanvasId;
    canvas.width  = 512;
    canvas.height = 128;
    canvas.style.display   = "block";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);

    var fontImage = document.getElementById(canvas.id);
    var ctx = fontImage.getContext('2d');

    var text='';

    ctx.font = "13px arial";
    ctx.fillStyle = 'white';

    var frames=0;
    var fps=0;
    var fpsStartTime=0;

    var lastTime=0;
    var childsTime=0;

    var queue=[];
    var queueChilds=[];
    for(var i=0;i<canvas.width;i++)
    {
        queue[i]=-1;
        queueChilds[i]=-1;
    }

    var avgMs=0;
    var avgMsChilds=0;
    var text2='';
    var text3='';

    var ll=0;
    var selfTime=0;
    var hasErrors=false;
    var countFrames=0;

    function refresh()
    {
        ll=performance.now();

        var ms=performance.now()-lastTime;
        queue.push(ms);
        queue.shift();

        queueChilds.push(childsTime);
        queueChilds.shift();

        frames++;
        
        if(fpsStartTime===0)fpsStartTime=Date.now();
        if(Date.now()-fpsStartTime>=1000)
        {
            fps=frames;
            frames=0;

            text=self.patch.config.glCanvasId+' fps: '+fps;
            fpsStartTime=Date.now();

            var count=0;
            for(var i=queue.length;i>queue.length-queue.length/3;i--)
            {
                if(queue[i]>-1)
                {
                    avgMs+=queue[i];
                    count++;
                }

                if(queueChilds[i]>-1)
                {
                    avgMsChilds+=queueChilds[i];
                }
            }
            avgMs/=count;
            avgMsChilds/=count;

            text2='frame: '+Math.round(avgMs*100)/100+' ms';
            
            text3='child ops: '+Math.round(avgMsChilds*100)/100+' ms ('+Math.round(avgMsChilds/avgMs*100)+'%) uniforms/s: '+CGL.profileUniformCount;
            if(selfTime>=1.25) text3+=' (self: '+Math.round((selfTime)*100)/100+' ms) ';
            CGL.profileUniformCount=0;

        }
        ctx.clearRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle="#222222";
        ctx.fillRect(0,0,canvas.width,canvas.height);


        ctx.fillStyle="#aaaaaa";
        for(var k=0;k<512;k++)
        {
            ctx.fillRect(k,canvas.height-queue[k]*2.5,1,queue[k]*2.5);
        }

        ctx.fillStyle="#ffffff";
        for(k=0;k<512;k++)
        {
            ctx.fillRect(k,canvas.height-queueChilds[k]*2.5,1,queueChilds[k]*2.5);
        }
        
        ctx.fillStyle="#bbbbbb";
        ctx.fillText(text, 10, 20);
        ctx.fillText(text2, 10, 35);
        ctx.fillText(text3, 10, 50);
        if(hasErrors)
        {
            ctx.fillStyle="#ff8844";
            ctx.fillText('has errors!', 10, 65);
        }

        ctx.restore();

        if(self.textureOut.get()) self.textureOut.get().initTexture(cgl,fontImage);
            else self.textureOut.set( new CGL.Texture.fromImage(cgl,fontImage) );

        lastTime=performance.now();
        selfTime=performance.now()-ll;
        
        var startTimeChilds=performance.now();

        self.trigger.trigger();

        childsTime=performance.now()-startTimeChilds;

        countFrames++;
        if(countFrames==30)
        {
            hasErrors=false;
            var error = cgl.gl.getError();
            if (error != cgl.gl.NO_ERROR)
            {
                hasErrors=true;
            }
            countFrames=0;
        }
        
    }

    this.onDelete=function()
    {
        document.getElementById(canvas.id).remove();
    };

    self.exe.onTriggered=refresh;
    if(CABLES.UI)gui.setLayout();
};

Ops.Gl.Performance.prototype = new Op();

// --------------------------------------------------------------------------



Ops.Gl.Shader= Ops.Gl.Shader || {};

// --------------------------------------------------------------------------
Ops.Gl.Shader.Shader = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='Shader';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.shader=this.addInPort(new Port(this,"shader",OP_PORT_TYPE_OBJECT));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        if(self.shader.val)
        {
            cgl.setShader(self.shader.val);
            self.shader.val.bindTextures();
            self.trigger.trigger();
            cgl.setPreviousShader();
        }
    };

    this.render.onTriggered=this.doRender;
    this.doRender();
};

Ops.Gl.Shader.Shader.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.ShowNormalsMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='ShowNormalsMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);
        self.trigger.trigger();
        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'varying vec3 norm;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(norm.x,norm.y,norm.z,1.0);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;


    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.render.onTriggered=this.doRender;
    this.doRender();
};

Ops.Gl.Shader.ShowNormalsMaterial.prototype = new Op();



Ops.Gl.Shader.MatCapMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='MatCapMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.shaderOut=this.addOutPort(new Port(this,"shader",OP_PORT_TYPE_OBJECT));
    this.shaderOut.ignoreValueSerialize=true;

    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureUniform=null;

    this.textureDiffuse=this.addInPort(new Port(this,"diffuse",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureDiffuseUniform=null;

    this.textureNormal=this.addInPort(new Port(this,"normal",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureNormalUniform=null;

    this.normalScale=this.addInPort(new Port(this,"normalScale",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.normalScale.val=0.4;
    this.normalScaleUniform=null;



    this.diffuseRepeatX=this.addInPort(new Port(this,"diffuseRepeatX",OP_PORT_TYPE_VALUE));
    this.diffuseRepeatY=this.addInPort(new Port(this,"diffuseRepeatY",OP_PORT_TYPE_VALUE));
    this.diffuseRepeatX.val=1.0;
    this.diffuseRepeatY.val=1.0;

    this.diffuseRepeatX.onValueChanged=function()
    {
        self.diffuseRepeatXUniform.setValue(self.diffuseRepeatX.val);
    };

    this.diffuseRepeatY.onValueChanged=function()
    {
        self.diffuseRepeatYUniform.setValue(self.diffuseRepeatY.val);
    };


    this.projectCoords=this.addInPort(new Port(this,"projectCoords",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['no','xy','yz']}));
    this.projectCoords.val='no';
    this.projectCoords.onValueChanged=function()
    {
        shader.removeDefine('DO_PROJECT_COORDS_XY');
        shader.removeDefine('DO_PROJECT_COORDS_YZ');

        if(self.projectCoords.val=='xy') shader.define('DO_PROJECT_COORDS_XY');
        if(self.projectCoords.val=='yz') shader.define('DO_PROJECT_COORDS_YZ');
    };

    this.normalRepeatX=this.addInPort(new Port(this,"normalRepeatX",OP_PORT_TYPE_VALUE));
    this.normalRepeatY=this.addInPort(new Port(this,"normalRepeatY",OP_PORT_TYPE_VALUE));
    this.normalRepeatX.val=1.0;
    this.normalRepeatY.val=1.0;

    this.normalRepeatX.onValueChanged=function()
    {
        self.normalRepeatXUniform.setValue(self.normalRepeatX.val);
    };

    this.normalRepeatY.onValueChanged=function()
    {
        self.normalRepeatYUniform.setValue(self.normalRepeatY.val);
    };

    this.normalScale.onValueChanged=function()
    {
        self.normalScaleUniform.setValue(self.normalScale.val*2.0);
    };

    this.texture.onPreviewChanged=function()
    {
        if(self.texture.showPreview) self.render.onTriggered=self.texture.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.textureDiffuse.onPreviewChanged=function()
    {
        if(self.textureDiffuse.showPreview) self.render.onTriggered=self.textureDiffuse.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.textureNormal.onPreviewChanged=function()
    {
        if(self.textureNormal.showPreview) self.render.onTriggered=self.textureNormal.val.preview;
            else self.render.onTriggered=self.doRender;
    };

    this.texture.onValueChanged=function()
    {
        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            shader.removeUniform('tex');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            self.textureUniform=null;
        }
    };

    this.textureDiffuse.onValueChanged=function()
    {
        if(self.textureDiffuse.val)
        {
            if(self.textureDiffuseUniform!==null)return;
            shader.define('HAS_DIFFUSE_TEXTURE');
            shader.removeUniform('texDiffuse');
            self.textureDiffuseUniform=new CGL.Uniform(shader,'t','texDiffuse',1);
        }
        else
        {
            shader.removeDefine('HAS_DIFFUSE_TEXTURE');
            shader.removeUniform('texDiffuse');
            self.textureDiffuseUniform=null;
        }
    };

    this.textureNormal.onValueChanged=function()
    {
        if(self.textureNormal.val)
        {
            if(self.textureNormalUniform!==null)return;
            shader.define('HAS_NORMAL_TEXTURE');
            shader.removeUniform('texNormal');
            self.textureNormalUniform=new CGL.Uniform(shader,'t','texNormal',2);
        }
        else
        {
            shader.removeDefine('HAS_NORMAL_TEXTURE');
            shader.removeUniform('texNormal');
            self.textureNormalUniform=null;
        }
    };

    this.bindTextures=function()
    {
        if(self.texture.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        if(self.textureDiffuse.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureDiffuse.val.tex);
        }

        if(self.textureNormal.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE2);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureNormal.val.tex);
        }
    };

    this.doRender=function()
    {
        cgl.setShader(shader);
        self.bindTextures();

        self.trigger.trigger();
        cgl.setPreviousShader();
    };

    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'precision mediump float;'
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'


        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        .endl()+'uniform mat4 normalMatrix;'
        .endl()+'varying vec2 vNorm;'


        // .endl()+'varying vec2 testTexCoords;'

        

        .endl()+'varying vec3 e;'


        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'    texCoord=attrTexCoord;'
        .endl()+'    norm=attrVertNormal;'

        .endl()+'   vec4 pos = vec4( vPosition, 1. );'
        


        .endl()+'    {{MODULE_VERTEX_POSITION}}'


        .endl()+'    e = normalize( vec3( mvMatrix * pos ) );'
        .endl()+'    vec3 n = normalize( mat3(normalMatrix) * norm );'

        .endl()+'    vec3 r = reflect( e, n );'
        .endl()+'    float m = 2. * sqrt( '
        .endl()+'        pow(r.x, 2.0)+'
        .endl()+'        pow(r.y, 2.0)+'
        .endl()+'        pow(r.z + 1.0, 2.0)'
        .endl()+'    );'
        .endl()+'    vNorm = r.xy / m + 0.5;'

        .endl()+'   #ifdef DO_PROJECT_COORDS_XY'
        .endl()+'       texCoord=(projMatrix * mvMatrix*pos).xy*0.1;'
        .endl()+'   #endif'
        .endl()+'   #ifdef DO_PROJECT_COORDS_YZ'
        .endl()+'       texCoord=(projMatrix * mvMatrix*pos).yz*0.1;'
        .endl()+'   #endif'

        .endl()+'    gl_Position = projMatrix * mvMatrix * pos;'

        .endl()+'}';


    var srcFrag=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'precision mediump float;'
        .endl()+'varying vec3 norm;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'uniform sampler2D tex;'
        .endl()+'varying vec2 vNorm;'

        .endl()+'uniform float diffuseRepeatX;'
        .endl()+'uniform float diffuseRepeatY;'


        .endl()+'#ifdef HAS_DIFFUSE_TEXTURE'
        .endl()+'   uniform sampler2D texDiffuse;'
        .endl()+'#endif'

        .endl()+'#ifdef HAS_NORMAL_TEXTURE'
        .endl()+'   uniform sampler2D texNormal;'
        .endl()+'   uniform mat4 normalMatrix;'
        .endl()+'   uniform float normalScale;'
        .endl()+'   uniform float normalRepeatX;'
        .endl()+'   uniform float normalRepeatY;'
        .endl()+'   varying vec3 e;'
        .endl()+'   vec2 vNormt;'
        .endl()+'#endif'
        
        .endl()+''

        .endl()+''
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'   vec2 vn=vNorm;'

        .endl()+'   #ifdef HAS_NORMAL_TEXTURE'
        .endl()+'       vec3 tnorm=texture2D( texNormal, vec2(texCoord.x*normalRepeatX,texCoord.y*normalRepeatY) ).xyz * 2.0 - 1.0;'

        // .endl()+'       tnorm.y *= -1.0;'

        .endl()+'       tnorm = normalize(tnorm*normalScale);'
        

        .endl()+'vec3 tangent;'
        .endl()+'vec3 binormal;'
        .endl()+'vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));'
        .endl()+'vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));'
        .endl()+'if(length(c1)>length(c2)) tangent = c1;'
        .endl()+'    else tangent = c2;'
        .endl()+'tangent = normalize(tangent);'
        .endl()+'binormal = cross(norm, tangent);'
        .endl()+'binormal = normalize(binormal);'
        .endl()+'tnorm=normalize(tangent*tnorm.x + binormal*tnorm.y + norm*tnorm.z);'
    
        

        .endl()+'       vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );'

        .endl()+'       vec3 r = reflect( e, n );'
        .endl()+'       float m = 2. * sqrt( '
        .endl()+'           pow(r.x, 2.0)+'
        .endl()+'           pow(r.y, 2.0)+'
        .endl()+'           pow(r.z + 1.0, 2.0)'
        .endl()+'       );'
        .endl()+'       vn = r.xy / m + 0.5;'


.endl()+'vn.t=clamp(vn.t, 0.0, 1.0);'
.endl()+'vn.s=clamp(vn.s, 0.0, 1.0);'


        .endl()+'    #endif'

        
        .endl()+'    vec4 col = texture2D( tex, vn );'


        .endl()+'    #ifdef HAS_DIFFUSE_TEXTURE'
        // .endl()+'       col = mix(col,texture2D( texDiffuse, vec2(texCoord.x*diffuseRepeatX,texCoord.y*diffuseRepeatY) ),0.5);'
        .endl()+'       col = col*texture2D( texDiffuse, vec2(texCoord.x*diffuseRepeatX,texCoord.y*diffuseRepeatY));'
        .endl()+'    #endif'

        .endl()+'    {{MODULE_COLOR}}'

        .endl()+'    gl_FragColor = col;'
        .endl()+''
        .endl()+'}';

    var shader=new CGL.Shader(cgl);
    
    shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR']);

    shader.bindTextures=this.bindTextures;
    this.shaderOut.val=shader;
    this.onLoaded=shader.compile;
    shader.setSource(srcVert,srcFrag);
    this.normalScaleUniform=new CGL.Uniform(shader,'f','normalScale',self.normalScale.val);
    this.normalRepeatXUniform=new CGL.Uniform(shader,'f','normalRepeatX',self.normalRepeatX.val);
    this.normalRepeatYUniform=new CGL.Uniform(shader,'f','normalRepeatY',self.normalRepeatY.val);

    this.diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',self.diffuseRepeatX.val);
    this.diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',self.diffuseRepeatY.val);

    this.render.onTriggered=this.doRender;
    this.doRender();
};

Ops.Gl.Shader.MatCapMaterial.prototype = new Op();

// --------------------------------------------------------------------------



Ops.Gl.Shader.GradientMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='GradientMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.screenSpace=this.addInPort(new Port(this,"screen space",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.screenSpace.val=false;

    this.r=this.addInPort(new Port(this,"r1",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g=this.addInPort(new Port(this,"g1",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b1",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a1",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r2=this.addInPort(new Port(this,"r2",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g2=this.addInPort(new Port(this,"g2",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b2=this.addInPort(new Port(this,"b2",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a2=this.addInPort(new Port(this,"a2",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r3=this.addInPort(new Port(this,"r3",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g3=this.addInPort(new Port(this,"g3",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b3=this.addInPort(new Port(this,"b3",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a3=this.addInPort(new Port(this,"a3",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.r.val=0.2;
    this.g.val=0.2;
    this.b.val=0.2;
    this.a.val=1.0;

    this.r2.val=0.73;
    this.g2.val=0.73;
    this.b2.val=0.73;
    this.a2.val=1.0;

    this.r3.val=1.0;
    this.g3.val=1.0;
    this.b3.val=1.0;
    this.a3.val=1.0;

    var colA=[];
    var colB=[];
    var colC=[];

    var w=0,h=0;

    this.doRender=function()
    {
        if(w!=cgl.getViewPort()[2] || h!=cgl.getViewPort()[3])
        {
            w=cgl.getViewPort()[2];
            h=cgl.getViewPort()[3];
        }

        uniformWidth.setValue(w);
        uniformHeight.setValue(h);
                    
        cgl.setShader(shader);
        self.trigger.trigger();
        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'varying vec3 norm;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'uniform vec4 colA;'
        .endl()+'uniform vec4 colB;'
        .endl()+'uniform vec4 colC;'
        .endl()+'uniform float width,height;'

        .endl()+''
        .endl()+'void main()'
        .endl()+'{'


        .endl()+'   #ifdef USE_TEXCOORDS'
        .endl()+'       vec2 coords=texCoord;'
        .endl()+'   #endif'

        .endl()+'   #ifdef USE_FRAGCOORDS'
        .endl()+'       vec2 coords=vec2(gl_FragCoord.x/width,gl_FragCoord.y/height);'
        .endl()+'   #endif'

        .endl()+'   if(coords.y<=0.5)'
        .endl()+'   {'
        .endl()+'       gl_FragColor = vec4(mix(colA, colB, coords.y*2.0));'
        .endl()+'   }'
        .endl()+'   if(coords.y>0.5)'
        .endl()+'   {'
        .endl()+'       gl_FragColor = vec4(mix(colB, colC, (coords.y-0.5)*2.0));'
        .endl()+'   }'
        .endl()+'}';

    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);
    shader.define("USE_TEXCOORDS");
    var uniformWidth=new CGL.Uniform(shader,'f','width',w);
    var uniformHeight=new CGL.Uniform(shader,'f','height',h);

    this.doRender();


    this.r.onValueChanged=this.g.onValueChanged=this.b.onValueChanged=this.a.onValueChanged=function()
    {
        colA=[self.r.val,self.g.val,self.b.val,self.a.val];
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'4f','colA',colA);
        else self.r.uniform.setValue(colA);
    };

    this.r2.onValueChanged=this.g2.onValueChanged=this.b2.onValueChanged=this.a2.onValueChanged=function()
    {
        colB=[self.r2.val,self.g2.val,self.b2.val,self.a2.val];
        if(!self.r2.uniform) self.r2.uniform=new CGL.Uniform(shader,'4f','colB',colB);
        else self.r2.uniform.setValue(colB);
    };

    this.r3.onValueChanged=this.g3.onValueChanged=this.b3.onValueChanged=this.a3.onValueChanged=function()
    {
        colC=[self.r3.val,self.g3.val,self.b3.val,self.a3.val];
        if(!self.r3.uniform) self.r3.uniform=new CGL.Uniform(shader,'4f','colC',colC);
        else self.r3.uniform.setValue(colC);
    };

    this.screenSpace.onValueChanged=function()
    {
        if(self.screenSpace.val)
        {
            shader.define("USE_FRAGCOORDS");
            shader.removeDefine("USE_TEXCOORDS");
        }
        else
        {
            shader.define("USE_TEXCOORDS");
            shader.removeDefine("USE_FRAGCOORDS");
        }

    };

    this.r3.onValueChanged();
    this.r2.onValueChanged();
    this.r.onValueChanged();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.GradientMaterial.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.shaderOut=this.addOutPort(new Port(this,"shader",OP_PORT_TYPE_OBJECT));
    this.shaderOut.ignoreValueSerialize=true;

    this.bindTextures=function()
    {
        if(self.texture.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE0);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        if(self.textureOpacity.get())
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE1);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureOpacity.val.tex);
        }
    };

    this.doRender=function()
    {
        cgl.setShader(shader);
        shader.bindTextures();
        
        self.trigger.trigger();

        cgl.setPreviousShader();
    };

    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        .endl()+'uniform mat4 normalMatrix;'

        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   texCoord=attrTexCoord;'
        .endl()+'   norm=attrVertNormal;'

        .endl()+'{{MODULE_VERTEX_POSITION}}'


        .endl()+'#ifdef BILLBOARD'
        .endl()+'   vec3 position=vPosition;'

        .endl()+"   gl_Position = projMatrix * mvMatrix * vec4(( "
        .endl()+"       position.x * vec3("
        .endl()+"           mvMatrix[0][0],"
        .endl()+"           mvMatrix[1][0], "
        .endl()+"           mvMatrix[2][0] ) +"
        .endl()+"       position.y * vec3("
        .endl()+"           mvMatrix[0][1],"
        .endl()+"           mvMatrix[1][1], "
        .endl()+"           mvMatrix[2][1]) ), 1.0);"
        .endl()+'#endif '
        .endl()+""
        .endl()+"#ifndef BILLBOARD"
        .endl()+'   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);'
        .endl()+'#endif '
        .endl()+'}';

    var srcFrag=''

        .endl()+'precision mediump float;'

        .endl()+'{{MODULES_HEAD}}'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'   #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'       uniform sampler2D texOpacity;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+'uniform float a;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   vec2 texCoords=texCoord;'
        .endl()+'#endif'

        .endl()+'{{MODULE_BEGIN_FRAG}}'


        .endl()+'   vec4 col=vec4(r,g,b,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'          col=texture2D(tex,vec2(texCoords.x,1.0-texCoords.y));'
        .endl()+'           #ifdef COLORIZE_TEXTURE'
        .endl()+'               col.r*=r;'
        .endl()+'               col.g*=g;'
        .endl()+'               col.b*=b;'
        .endl()+'           #endif'
        .endl()+'      #endif'
        .endl()+'      #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'          col.a*=texture2D(texOpacity,texCoords).g;'
        .endl()+'       #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'{{MODULE_COLOR}}'
        
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
    shader.bindTextures=this.bindTextures;
    this.shaderOut.val=shader;
    this.onLoaded=shader.compile;
    shader.setSource(srcVert,srcFrag);

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.r.onValueChanged=function()
    {
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'f','r',self.r.get());
        else self.r.uniform.setValue(self.r.get());
    };

    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.g.onValueChanged=function()
    {
        if(!self.g.uniform) self.g.uniform=new CGL.Uniform(shader,'f','g',self.g.get());
        else self.g.uniform.setValue(self.g.get());
    };

    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b.onValueChanged=function()
    {
        if(!self.b.uniform) self.b.uniform=new CGL.Uniform(shader,'f','b',self.b.get());
        else self.b.uniform.setValue(self.b.get());
    };

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.get());
        else self.a.uniform.setValue(self.a.get());
    };

    this.r.val=Math.random();
    this.g.val=Math.random();
    this.b.val=Math.random();
    this.a.val=1.0;

    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureUniform=null;

    this.texture.onPreviewChanged=function()
    {
        if(self.texture.showPreview) self.render.onTriggered=self.texture.val.preview;
        else self.render.onTriggered=self.doRender;

        console.log('show preview!');
    };


    this.texture.onValueChanged=function()
    {

        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            // console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            // console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.textureOpacity=this.addInPort(new Port(this,"textureOpacity",OP_PORT_TYPE_TEXTURE,{preview:true}));
    this.textureOpacityUniform=null;

    this.textureOpacity.onPreviewChanged=function()
    {
        if(self.textureOpacity.showPreview) self.render.onTriggered=self.textureOpacity.val.preview;
        else self.render.onTriggered=self.doRender;

        console.log('show preview!');
    };

    this.textureOpacity.onValueChanged=function()
    {
        if(self.textureOpacity.get())
        {
            if(self.textureOpacityUniform!==null)return;
            console.log('TEXTURE OPACITY ADDED');
            shader.removeUniform('texOpacity');
            shader.define('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);
        }
        else
        {
            console.log('TEXTURE OPACITY REMOVED');
            shader.removeUniform('texOpacity');
            shader.removeDefine('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=null;
        }
    };

    this.colorizeTexture=this.addInPort(new Port(this,"colorizeTexture",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.colorizeTexture.val=false;
    this.colorizeTexture.onValueChanged=function()
    {
        if(self.colorizeTexture.val) shader.define('COLORIZE_TEXTURE');
            else shader.removeDefine('COLORIZE_TEXTURE');
    };


    this.doBillboard=this.addInPort(new Port(this,"billboard",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.doBillboard.val=false;
    this.doBillboard.onValueChanged=function()
    {
        if(self.doBillboard.val)
            shader.define('BILLBOARD');
        else
            shader.removeDefine('BILLBOARD');
    };



    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();





// --------------------------------------------------------------------------





Ops.Gl.Shader.TextureSinusWobble = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='texture sinus wobble';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(self.texture.get())
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val.tex);
        }

        self.trigger.trigger();


        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float a;'
        .endl()+'uniform float time;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1,1,1,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'

        // float smoothstep(float edge0, float edge1, float x)  

        // .endl()+'          col=texture2D(tex,texCoord);'
        // .endl()+'           float x=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.y*(col.r-0.5)) );'
        .endl()+'           float x=texCoord.x+sin(time+texCoord.y*(3.0))*0.15 ;'
        .endl()+'           float y=texCoord.y+sin(time+texCoord.x*(3.0))*0.15 ;'
        // .endl()+'           float y=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.x*3.0)*cos(texCoord.x) );'
        // .endl()+'           float y=texCoord.y;'

        .endl()+'           vec2 tc=vec2(x,y );'
        .endl()+'          col=texture2D(tex,tc);'
        
        .endl()+'      #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader(cgl);
    this.onLoaded=shader.compile;
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.val);
        else self.a.uniform.setValue(self.a.val);
    };

    this.a.val=1.0;

    this.time=this.addInPort(new Port(this,"time",OP_PORT_TYPE_VALUE,{  }));
    this.time.onValueChanged=function()
    {
        if(!self.time.uniform) self.time.uniform=new CGL.Uniform(shader,'f','time',self.a.val);
        else self.time.uniform.setValue(self.time.val);
    };

    this.time.val=1.0;


    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.textureUniform=null;

    this.texture.onValueChanged=function()
    {

        if(self.texture.get())
        {
            if(self.textureUniform!==null)return;
            // console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            // console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.doRender();
};

Ops.Gl.Shader.TextureSinusWobble.prototype = new Op();




Ops.Gl.Meshes=Ops.Gl.Meshes || {};


Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Triangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        self.mesh.render(cgl.getShader());
        self.trigger.trigger();
    };

    var geom=new CGL.Geometry();
    geom.vertices = [
         0.0,  1.0,  0.0,
        -1.0,  -1.0,  0.0,
         1.0, -1.0,  0.0
    ];

    geom.verticesIndices = [
        0, 1, 2
    ];
    this.mesh=new CGL.Mesh(cgl,geom);
};

Ops.Gl.Meshes.Triangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.width=this.addInPort(new Port(this,"width"));
    this.height=this.addInPort(new Port(this,"height"));
    
    this.pivotX=this.addInPort(new Port(this,"pivot x",OP_PORT_TYPE_VALUE,{display:'dropdown',values:["center","left","right"]} ));
    this.pivotX.val='center';

    this.pivotY=this.addInPort(new Port(this,"pivot y",OP_PORT_TYPE_VALUE,{display:'dropdown',values:["center","top","bottom"]} ));
    this.pivotY.val='center';

    this.width.val=1.0;
    this.height.val=1.0;

    this.render.onTriggered=function()
    {
        self.mesh.render(cgl.getShader());
        self.trigger.trigger();
    };

    var geom=new CGL.Geometry();
    this.mesh=null;

    function rebuild()
    {
        var x=0;
        var y=0;
        if(self.pivotX.get()=='center') x=0;
        if(self.pivotX.get()=='right') x=-self.width.get()/2;
        if(self.pivotX.get()=='left') x=+self.width.get()/2;

        if(self.pivotY.get()=='center') y=0;
        if(self.pivotY.get()=='top') y=-self.height.get()/2;
        if(self.pivotY.get()=='bottom') y=+self.height.get()/2;

        geom.vertices = [
             self.width.get()/2+x,  self.height.get()/2+y,  0.0,
            -self.width.get()/2+x,  self.height.get()/2+y,  0.0,
             self.width.get()/2+x, -self.height.get()/2+y,  0.0,
            -self.width.get()/2+x, -self.height.get()/2+y,  0.0
        ];

        geom.texCoords = [
             1.0, 0.0,
             0.0, 0.0,
             1.0, 1.0,
             0.0, 1.0
        ];

        geom.verticesIndices = [
            0, 1, 2,
            2, 1, 3
        ];
        if(!self.mesh) self.mesh=new CGL.Mesh(cgl,geom);
        self.mesh.setGeom(geom);
    }
    rebuild();

    this.pivotX.onValueChanged=rebuild;
    this.pivotY.onValueChanged=rebuild;
    this.width.onValueChanged=rebuild;
    this.height.onValueChanged=rebuild;
};

Ops.Gl.Meshes.Rectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.FullscreenRectangle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='fullscreen rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;
    var geom=new CGL.Geometry();
    var x=0,y=0,z=0,w=0;

    this.render.onTriggered=function()
    {
        if(
          cgl.getViewPort()[2]!=w ||
          cgl.getViewPort()[3]!=h ) rebuild();

        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);
        mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        self.mesh.render(cgl.getShader());

        cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

        cgl.popPMatrix();
        cgl.popMvMatrix();

        self.trigger.trigger();
    };

    this.onResize=this.rebuild;

    function rebuild()
    {
        var currentViewPort=cgl.getViewPort().slice();

        x=currentViewPort[0];
        y=currentViewPort[1];
        w=currentViewPort[2];
        h=currentViewPort[3];

        var xx=0,xy=0;
        geom.vertices = [
             xx+w, xy+h,  0.0,
             xx,   xy+h,  0.0,
             xx+w, xy,    0.0,
             xx,   xy,    0.0
        ];

        geom.texCoords = [
             1.0, 1.0,
             0.0, 1.0,
             1.0, 0.0,
             0.0, 0.0
        ];

        geom.verticesIndices = [
            0, 1, 2,
            3, 1, 2
        ];

        if(!self.mesh) self.mesh=new CGL.Mesh(cgl,geom);
        else self.mesh.setGeom(geom);
    }
};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Meshes.Circle = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Circle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.segments=this.addInPort(new Port(this,"segments"));
    this.radius=this.addInPort(new Port(this,"radius"));
    this.innerRadius=this.addInPort(new Port(this,"innerRadius",OP_PORT_TYPE_VALUE,{display:"range"}));
    this.percent=this.addInPort(new Port(this,"percent"));

    this.steps=this.addInPort(new Port(this,"steps",OP_PORT_TYPE_VALUE,{type:"int"}));
    this.steps.val=0.0;
    this.invertSteps=this.addInPort(new Port(this,"invertSteps",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.invertSteps.val=false;


    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        mesh.render(cgl.getShader());
        self.trigger.trigger();
    };

    this.segments.val=40;
    this.radius.val=1;
    this.innerRadius.val=0;
    this.percent.val=1;


    var geom=new CGL.Geometry();
    var mesh=new CGL.Mesh(cgl,geom);

    function calc()
    {
        geom.clear();
        var i=0,degInRad=0;
        var oldPosX=0,oldPosY=0;
        var oldPosXTexCoord=0,oldPosYTexCoord=0;

        var oldPosXIn=0,oldPosYIn=0;
        var oldPosXTexCoordIn=0,oldPosYTexCoordIn=0;

        var posxTexCoord=0,posyTexCoord=0;
        var posx=0,posy=0;

        if(self.innerRadius.get()<=0)
        {
          for (i=0; i <= self.segments.get()*self.percent.get(); i++)
          {
              degInRad = (360/self.segments.get())*i*CGL.DEG2RAD;
              posx=Math.cos(degInRad)*self.radius.get();
              posy=Math.sin(degInRad)*self.radius.get();

              posxTexCoord=(Math.cos(degInRad)+1.0)/2;
              posyTexCoord=(Math.sin(degInRad)+1.0)/2;

              geom.addFace(
                          [posx,posy,0],
                          [oldPosX,oldPosY,0],
                          [0,0,0]
                          );

              geom.texCoords.push(posxTexCoord,posyTexCoord,oldPosXTexCoord,oldPosYTexCoord,0.5,0.5);

              oldPosXTexCoord=posxTexCoord;
              oldPosYTexCoord=posyTexCoord;

              oldPosX=posx;
              oldPosY=posy;
          }
        }
        else
        {
          var count=0;
          for (i=0; i <= self.segments.get()*self.percent.get(); i++)
          {
              count++;

              degInRad = (360/self.segments.get())*i*CGL.DEG2RAD;
              posx=Math.cos(degInRad)*self.radius.get();
              posy=Math.sin(degInRad)*self.radius.get();

              var posxIn=Math.cos(degInRad)*self.innerRadius.get()*self.radius.get();
              var posyIn=Math.sin(degInRad)*self.innerRadius.get()*self.radius.get();

              posxTexCoord=(Math.cos(degInRad)+1.0)/2;
              posyTexCoord=(Math.sin(degInRad)+1.0)/2;

              var posxTexCoordIn=(Math.cos(degInRad)+1.0)/2*self.innerRadius.get();
              var posyTexCoordIn=(Math.sin(degInRad)+1.0)/2*self.innerRadius.get();

              // if(count%5!==0)
              if(self.steps.get()===0.0 ||
                (count%parseInt(self.steps.get(),10)===0 && !self.invertSteps.get()) ||
                (count%parseInt(self.steps.get(),10)!==0 && self.invertSteps.get())
                )
              {
                  geom.addFace(
                              [posx,posy,0],
                              [oldPosX,oldPosY,0],
                              [posxIn,posyIn,0]
                              );

                  geom.addFace(
                              [posxIn,posyIn,0],
                              [oldPosX,oldPosY,0],
                              [oldPosXIn,oldPosYIn,0]
                              );

                  geom.texCoords.push(posxTexCoord,posyTexCoord,oldPosXTexCoord,oldPosYTexCoord,posxTexCoordIn,posyTexCoordIn);
                  geom.texCoords.push(posxTexCoordIn,posyTexCoordIn,oldPosXTexCoord,oldPosYTexCoord,oldPosXTexCoordIn,oldPosYTexCoordIn);
              }

              oldPosXTexCoordIn=posxTexCoordIn;
              oldPosYTexCoordIn=posyTexCoordIn;

              oldPosXTexCoord=posxTexCoord;
              oldPosYTexCoord=posyTexCoord;

              oldPosX=posx;
              oldPosY=posy;

              oldPosXIn=posxIn;
              oldPosYIn=posyIn;
            }
        }

        mesh.setGeom(geom);
    }

    this.segments.onValueChanged=calc;
    this.radius.onValueChanged=calc;
    this.innerRadius.onValueChanged=calc;
    this.percent.onValueChanged=calc;
    this.steps.onValueChanged=calc;
    this.invertSteps.onValueChanged=calc;
    calc();
};

Ops.Gl.Meshes.Circle.prototype = new Op();


// --------------------------------------------------------------------------

Ops.Gl.Meshes.ObjMesh = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='OBJ Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.calcNormals=this.addInPort(new Port(this,"calcNormals",OP_PORT_TYPE_VALUE,{display:'dropdown',values:['no','face','vertex']}));
    this.calcNormals.val='no';

    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{display:'file',type:'string',filter:'mesh'}));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh) self.mesh.render(cgl.getShader());

        self.trigger.trigger();
    };


    var reloadObj=function()
    {
        // console.log('load texture...');
        // self.tex=CGL.Texture.load(self.filename.val,function()
        //     {
        //         console.log('tex load FINISHED!!!');

        //         self.textureOut.val=self.tex;
        //     });
        // self.textureOut.val=self.tex;

      CGL.incrementLoadingAssets();

      // console.log('filename:',self.filename.val);
      if(self.filename.val===0)
      {
        CGL.decrementLoadingAssets();
        return;
      }
      

      ajaxRequest(self.patch.getFilePath(self.filename.val),function(response)
      {
        console.log('parse obj');
          // console.log(response);
          var r=parseOBJ(response);

          unwrap = function(ind, crd, cpi)
          {
              var ncrd = new Array(Math.floor(ind.length/3)*cpi);
              for(var i=0; i<ind.length; i++)
              {
                  for(var j=0; j<cpi; j++)
                  {
                      ncrd[i*cpi+j] = crd[ind[i]*cpi+j];
                  }
              }
              return ncrd;
          };


          var l=r.verticesIndices.length;
              r.vertices = unwrap(r.verticesIndices, r.vertices, 3);
              r.texCoords = unwrap(r.texCoordsIndices  , r.texCoords  , 2);
              r.vertexNormals = unwrap(r.vertexNormalIndices  , r.vertexNormals  , 3);
              r.verticesIndices = [];
              for(var i=0; i<l; i++) r.verticesIndices.push(i);
          
          if(self.calcNormals.val=='face')r.calcNormals();
          else if(self.calcNormals.val=='vertex')r.calcNormals(true);

          self.mesh=new CGL.Mesh(cgl,r);


          CGL.decrementLoadingAssets();

      });

    };

    this.filename.onValueChanged=reloadObj;
    this.calcNormals.onValueChanged=function()
    {
        reloadObj();
    };



    // this.filename.val='assets/skull.obj';

};

Ops.Gl.Meshes.ObjMesh.prototype = new Op();

// ----------------------------------------------------------------

Ops.Gl.Meshes.Cube = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='Cube';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh!==null) self.mesh.render(cgl.getShader());
        self.trigger.trigger();
    };

    var geom=new CGL.Geometry();

        geom.vertices = [
          // Front face
          -1.0, -1.0,  1.0,
           1.0, -1.0,  1.0,
           1.0,  1.0,  1.0,
          -1.0,  1.0,  1.0,
          // Back face
          -1.0, -1.0, -1.0,
          -1.0,  1.0, -1.0,
           1.0,  1.0, -1.0,
           1.0, -1.0, -1.0,
          // Top face
          -1.0,  1.0, -1.0,
          -1.0,  1.0,  1.0,
           1.0,  1.0,  1.0,
           1.0,  1.0, -1.0,
          // Bottom face
          -1.0, -1.0, -1.0,
           1.0, -1.0, -1.0,
           1.0, -1.0,  1.0,
          -1.0, -1.0,  1.0,
          // Right face
           1.0, -1.0, -1.0,
           1.0,  1.0, -1.0,
           1.0,  1.0,  1.0,
           1.0, -1.0,  1.0,
          // Left face
          -1.0, -1.0, -1.0,
          -1.0, -1.0,  1.0,
          -1.0,  1.0,  1.0,
          -1.0,  1.0, -1.0,
        ];

        geom.texCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];

        geom.vertexNormals = [
            // Front face
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,

            // Back face
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,

            // Top face
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,

            // Bottom face
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,

            // Right face
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,

            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];


        geom.verticesIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];

    this.mesh=new CGL.Mesh(cgl,geom);
};

Ops.Gl.Meshes.Cube.prototype = new Op();

// ----------------------------------------------------------------


Ops.Gl.Meshes.Spline = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;
    cgl.frameStore.SplinePoints=[];

    this.name='Spline';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.thickness=this.addInPort(new Port(this,"thickness",OP_PORT_TYPE_VALUE));
    this.thickness.val=1.0;

    this.subDivs=this.addInPort(new Port(this,"subDivs",OP_PORT_TYPE_VALUE));
    this.centerpoint=this.addInPort(new Port(this,"centerpoint",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.centerpoint.val=false;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.triggerPoints=this.addOutPort(new Port(this,"triggerPoints",OP_PORT_TYPE_FUNCTION));
    
    var buffer = cgl.gl.createBuffer();



    function easeSmoothStep(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*(3 - 2*x); // smoothstep
        return perc;
    }

    function easeSmootherStep(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*x*(x*(x*6 - 15) + 10); // smootherstep
        return perc;
    }


    this.render.onTriggered=function()
    {
        self.trigger.trigger();
        bufferData();

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        cgl.getShader().bind();
        cgl.gl.vertexAttribPointer(cgl.getShader().getAttrVertexPos(),buffer.itemSize, cgl.gl.FLOAT, false, 0, 0);
        cgl.gl.enableVertexAttribArray(cgl.getShader().getAttrVertexPos());

        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        if(self.centerpoint.val)cgl.gl.drawArrays(cgl.gl.LINES, 0, buffer.numItems);
          else cgl.gl.drawArrays(cgl.gl.LINE_STRIP, 0, buffer.numItems);

        for(var i=0;i<cgl.frameStore.SplinePoints.length;i+=3)
        {
            var vec=[0,0,0];
            vec3.set(vec, cgl.frameStore.SplinePoints[i+0], cgl.frameStore.SplinePoints[i+1], cgl.frameStore.SplinePoints[i+2]);
            cgl.pushMvMatrix();
            mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
            self.triggerPoints.trigger();
            cgl.popMvMatrix();
        }

        cgl.popMvMatrix();

        cgl.frameStore.SplinePoints.length=0;
    };

    function bufferData()
    {
        
        var subd=self.subDivs.val;

        if(self.centerpoint.val)
        {
            var points=[];

            for(var i=0;i<cgl.frameStore.SplinePoints.length;i+=3)
            {
                //center point...
                points.push( cgl.frameStore.SplinePoints[0] );
                points.push( cgl.frameStore.SplinePoints[1] );
                points.push( cgl.frameStore.SplinePoints[2] );

                //other point
                points.push( cgl.frameStore.SplinePoints[i+0] );
                points.push( cgl.frameStore.SplinePoints[i+1] );
                points.push( cgl.frameStore.SplinePoints[i+2] );

            }

            cgl.frameStore.SplinePoints=points;
        }

        // if(subd>0)
        // {
            // var points=[];
        //     for(var i=0;i<cgl.frameStore.SplinePoints.length-3;i+=3)
        //     {
        //         for(var j=0;j<subd;j++)
        //         {
        //             for(var k=0;k<3;k++)
        //             {
        //                 points.push(
        //                     cgl.frameStore.SplinePoints[i+k]+
        //                         ( cgl.frameStore.SplinePoints[i+k+3] - cgl.frameStore.SplinePoints[i+k] ) *
        //                         easeSmootherStep(j/subd)
        //                         );
        //             }

        //             // console.log('easeSmootherStep(j/subd)',easeSmootherStep(j/subd));
                            
        //         }
        //     }

        // // console.log('cgl.frameStore.SplinePoints',cgl.frameStore.SplinePoints.length);
        // // console.log('points',points.length);
        

        //     cgl.frameStore.SplinePoints=points;
        // }

        cgl.gl.lineWidth(self.thickness.val);
        cgl.gl.bindBuffer(cgl.gl.ARRAY_BUFFER, buffer);
        cgl.gl.bufferData(cgl.gl.ARRAY_BUFFER, new Float32Array(cgl.frameStore.SplinePoints), cgl.gl.STATIC_DRAW);
        buffer.itemSize = 3;
        buffer.numItems = cgl.frameStore.SplinePoints.length/buffer.itemSize;
    }

    bufferData();
};

Ops.Gl.Meshes.Spline.prototype = new Op();



// --------------------------------------------------------------------------

Ops.Gl.Meshes.SplinePoint = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='SplinePoint';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        if(!cgl.frameStore.SplinePoints)return;
        var pos=[0,0,0];
        vec3.transformMat4(pos, [0,0,0], cgl.mvMatrix);

        cgl.frameStore.SplinePoints.push(pos[0]);
        cgl.frameStore.SplinePoints.push(pos[1]);
        cgl.frameStore.SplinePoints.push(pos[2]);

        self.trigger.trigger();
    };

};

Ops.Gl.Meshes.SplinePoint.prototype = new Op();




// --------------------------------------------------------------------------

Ops.Gl.Meshes.TransformToGeometryVertices = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='TransformToGeometryVertices';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.geometry=this.addInPort(new Port(this,"geometry",OP_PORT_TYPE_OBJECT));
    this.geometry.ignoreValueSerialize=true;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.x=this.addOutPort(new Port(this,"x",OP_PORT_TYPE_VALUE));
    this.y=this.addOutPort(new Port(this,"y",OP_PORT_TYPE_VALUE));
    this.z=this.addOutPort(new Port(this,"z",OP_PORT_TYPE_VALUE));
    this.index=this.addOutPort(new Port(this,"index",OP_PORT_TYPE_VALUE));
    

    var vec=[0,0,0];
    this.render.onTriggered=function()
    {
        if(self.geometry.val)
        {

            for(var i=0;i<self.geometry.val.vertices.length;i+=3)
            {
                vec3.set(vec, self.geometry.val.vertices[i+0],self.geometry.val.vertices[i+1],self.geometry.val.vertices[i+2]);
                self.x.val=self.geometry.val.vertices[i+0];
                self.y.val=self.geometry.val.vertices[i+1];
                self.z.val=self.geometry.val.vertices[i+2];
                self.index.val=i;
                cgl.pushMvMatrix();
                mat4.translate(cgl.mvMatrix,cgl.mvMatrix, vec);
                self.trigger.trigger();
                cgl.popMvMatrix();
            }
        }
    };


};

Ops.Gl.Meshes.TransformToGeometryVertices.prototype = new Op();


// --------------------------------------------------------------------------




Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};



// --------------------------------------------------------------------------


Ops.Gl.ShaderEffects.TextureShiftGlitch = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='TextureShiftGlitch';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.pos=this.addInPort(new Port(this,"pos",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.height=this.addInPort(new Port(this,"height",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.extrude=this.addInPort(new Port(this,"extrude",OP_PORT_TYPE_VALUE));

    this.pos.onValueChanged=function(){ if(unipos)unipos.setValue(self.pos.val); };
    this.height.onValueChanged=function(){ if(uniheight)uniheight.setValue(self.height.val); };
    this.width.onValueChanged=function(){ if(uniWidth)uniWidth.setValue(self.width.val); };

    var shader=null;
    var unipos;
    var uniheight;
    var uniWidth;
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_pos;'
        .endl()+'uniform float {{mod}}_height;'
        .endl()+'uniform float {{mod}}_width;'
        .endl();

    var srcBodyVert=''
    
        .endl()+'   if( texCoords.y > {{mod}}_pos - {{mod}}_height*0.5 && texCoords.y<{{mod}}_pos+{{mod}}_height*0.5) texCoords.x+={{mod}}_width; '
        .endl();

    var module=null;

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();
            module=shader.addModule(
                {
                    name:'MODULE_BEGIN_FRAG',
                    srcHeadFrag:srcHeadVert,
                    srcBodyFrag:srcBodyVert
                });

            unipos=new CGL.Uniform(shader,'f',module.prefix+'_pos',self.pos.val);
            uniheight=new CGL.Uniform(shader,'f',module.prefix+'_height',self.height.val);
            uniWidth=new CGL.Uniform(shader,'f',module.prefix+'_width',self.width.val);
        }

        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.TextureShiftGlitch.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.ShaderEffects.VertexSinusWobble = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    var shader=null;
    var uniTime;

    this.name='VertexSinusWobble';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.frequency=this.addInPort(new Port(this,"frequency",OP_PORT_TYPE_VALUE));
    var uniFrequency=null;
    this.frequency.val=1.0;
    this.frequency.onValueChanged=function(){ if(uniFrequency)uniFrequency.setValue(self.frequency.val); };

    this.amount=this.addInPort(new Port(this,"amount",OP_PORT_TYPE_VALUE));
    var uniAmount=null;
    this.amount.val=1.0;
    this.amount.onValueChanged=function(){ if(uniAmount)uniAmount.setValue(self.amount.val); };


    this.phase=this.addInPort(new Port(this,"phase",OP_PORT_TYPE_VALUE));
    var uniPhase=null;
    this.phase.val=1.0;
    this.phase.onValueChanged=function(){ if(uniAmount)uniAmount.setValue(self.phase.val); };


    this.toAxisX=this.addInPort(new Port(this,"axisX",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisX.val=true;
    this.toAxisX.onValueChanged=setDefines;

    this.toAxisY=this.addInPort(new Port(this,"axisY",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisY.val=true;
    this.toAxisY.onValueChanged=setDefines;

    this.toAxisZ=this.addInPort(new Port(this,"axisZ",OP_PORT_TYPE_VALUE,{display:'bool'}));
    this.toAxisZ.val=true;
    this.toAxisZ.onValueChanged=setDefines;


    function setDefines()
    {
        if(!shader)return;

        if(self.toAxisX.val)shader.define(module.prefix+'_TO_AXIS_X');
            else shader.removeDefine(module.prefix+'_TO_AXIS_X');

        if(self.toAxisY.val)shader.define(module.prefix+'_TO_AXIS_Y');
            else shader.removeDefine(module.prefix+'_TO_AXIS_Y');

        if(self.toAxisZ.val)shader.define(module.prefix+'_TO_AXIS_Z');
            else shader.removeDefine(module.prefix+'_TO_AXIS_Z');
    }
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_time;'
        .endl()+'uniform float {{mod}}_frequency;'
        .endl()+'uniform float {{mod}}_amount;'
        .endl()+'uniform float {{mod}}_phase;'
        .endl();

    var srcBodyVert=''
        .endl()+'float {{mod}}_v=sin( (pos.x)*3.0 + {{mod}}_time * {{mod}}_frequency + {{mod}}_phase ) * {{mod}}_amount;'

        .endl()+'#ifdef {{mod}}_TO_AXIS_X'
        .endl()+'   pos.x+={{mod}}_v;'
        .endl()+'#endif'

        .endl()+'#ifdef {{mod}}_TO_AXIS_Y'
        .endl()+'   pos.y+={{mod}}_v;'
        .endl()+'#endif'

        .endl()+'#ifdef {{mod}}_TO_AXIS_Z'
        .endl()+'   pos.z+={{mod}}_v;'
        .endl()+'#endif'

        // .endl()+'norm=normalize(norm);'
        .endl();




    var startTime=Date.now()/1000.0;

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;
    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();
            shader=cgl.getShader();
            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniTime=new CGL.Uniform(shader,'f',module.prefix+'_time',0);
            uniFrequency=new CGL.Uniform(shader,'f',module.prefix+'_frequency',self.frequency.val);
            uniAmount=new CGL.Uniform(shader,'f',module.prefix+'_amount',self.amount.val);
            uniPhase=new CGL.Uniform(shader,'f',module.prefix+'_phase',self.phase.val);
            setDefines();
        }

        uniTime.setValue(Date.now()/1000.0-startTime);
        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexSinusWobble.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.ShaderEffects.VertexExtrudeGlitch = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='VertexExtrudeGlitch';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.min=this.addInPort(new Port(this,"min",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.max=this.addInPort(new Port(this,"max",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.width=this.addInPort(new Port(this,"width",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.extrude=this.addInPort(new Port(this,"extrude",OP_PORT_TYPE_VALUE));

    this.min.onValueChanged=function(){ if(uniMin)uniMin.setValue(self.min.val); };
    this.max.onValueChanged=function(){ if(uniMax)uniMax.setValue(self.max.val); };
    this.width.onValueChanged=function(){ if(uniWidth)uniWidth.setValue(self.width.val); };
    this.extrude.onValueChanged=function(){ if(uniExtrude)uniExtrude.setValue(self.extrude.val); };

    var shader=null;
    var uniMin;
    var uniMax;
    var uniWidth;
    var uniExtrude;
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_x;'
        .endl()+'uniform float {{mod}}_y;'
        .endl()+'uniform float {{mod}}_width;'
        .endl()+'uniform float {{mod}}_extrude;'
        .endl();

    var srcBodyVert=''
        .endl()+'   if(texCoord.x>{{mod}}_x && texCoord.x<{{mod}}_x+{{mod}}_width && texCoord.y>{{mod}}_y && texCoord.y<{{mod}}_y+{{mod}}_width)pos.xyz*={{mod}}_extrude;'
        .endl();

    var module=null;

    function removeModule()
    {
        console.log('remove module?',shader,module);

        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
            console.log('remove module!');
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();
            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniMin=new CGL.Uniform(shader,'f',module.prefix+'_x',self.min.val);
            uniMax=new CGL.Uniform(shader,'f',module.prefix+'_y',self.max.val);
            uniWidth=new CGL.Uniform(shader,'f',module.prefix+'_width',self.width.val);
            uniExtrude=new CGL.Uniform(shader,'f',module.prefix+'_extrude',self.extrude.val);

        }

        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexExtrudeGlitch.prototype = new Op();
Ops.Gl.ShaderEffects.VertexGlitch=Ops.Gl.ShaderEffects.VertexExtrudeGlitch;

// --------------------------------------------------------------------------

Ops.Gl.ShaderEffects.VertexDisplacementMap = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=self.patch.cgl;

    this.name='VertexDisplacementMap';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.extrude=this.addInPort(new Port(this,"extrude",OP_PORT_TYPE_VALUE));

    this.extrude.onValueChanged=function(){ if(uniExtrude)uniExtrude.setValue(self.extrude.val); };

    var shader=null;
    var uniExtrude,uniTexture;
    
    var srcHeadVert=''
        .endl()+'uniform float {{mod}}_extrude;'
        .endl()+'uniform sampler2D {{mod}}_texture;'
        .endl();

    var srcBodyVert=''
        .endl()+'float {{mod}}_texVal=texture2D( {{mod}}_texture, texCoord ).b+1.0;'
        // .endl()+'pos.y+={{mod}}_texVal * {{mod}}_extrude;'
        .endl()+'pos.xyz*={{mod}}_texVal * {{mod}}_extrude;'

        // .endl()+'norm=normalize(norm+normalize(pos.xyz));'


        // .endl()+'vec3 tangent;'
        // .endl()+'vec3 binormal;'
        // .endl()+'vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));'
        // .endl()+'vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));'
        // .endl()+'if(length(c1)>length(c2)) tangent = c1;'
        // .endl()+'    else tangent = c2;'
        // .endl()+'tangent = normalize(tangent);'
        // .endl()+'binormal = cross(norm, tangent);'
        // .endl()+'binormal = normalize(binormal);'
        // .endl()+'vec3 normpos = normalize(pos.xyz);'

        // .endl()+'norm=normalize(tangent*normpos.x + binormal*normpos.y + norm*normpos.z);'


        // .endl()+'norm.y+={{mod}}_texVal * {{mod}}_extrude;'
        .endl();


    var srcHeadFrag=''
        .endl()+'uniform sampler2D {{mod}}_texture;'
        .endl();

    var srcBodyFrag=''
        .endl()+'col=texture2D( {{mod}}_texture, texCoord );'
        .endl();

    var module=null;

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();



            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            uniTexture=new CGL.Uniform(shader,'t',module.prefix+'_texture',4);
            uniExtrude=new CGL.Uniform(shader,'f',module.prefix+'_extrude',self.extrude.val);

            // module=shader.addModule(
            //     {
            //         name:'MODULE_COLOR',
            //         srcHeadFrag:srcHeadFrag,
            //         srcBodyFrag:srcBodyFrag
            //     });

            // uniTexture=new CGL.Uniform(shader,'t',module.prefix+'_texture',4);

        }

        if(self.texture.val)
        {
            cgl.gl.activeTexture(cgl.gl.TEXTURE4);
            cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.texture.val.tex);
        }

        self.trigger.trigger();
    };

};

Ops.Gl.ShaderEffects.VertexDisplacementMap.prototype = new Op();

// --------------------------------------------------------------------------



Ops.Gl.ShaderEffects.MeshMorphTargets = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='MeshMorphTargets';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.geometry0=this.addInPort(new Port(this,"geometry 0",OP_PORT_TYPE_OBJECT));
    this.geometry1=this.addInPort(new Port(this,"geometry 1",OP_PORT_TYPE_OBJECT));

    this.fade=this.addInPort(new Port(this,"fade",OP_PORT_TYPE_VALUE,{display:'range'}));
    this.fade.onValueChanged=function(){ if(uniFade)uniFade.setValue(self.fade.val); };

    var geom=null;
    var mesh=null;
    var shader=null;
    var uniFade;
    
    var srcHeadVert=''
        .endl()+'attribute vec3 attrMorphTargetA;'
        .endl()+'uniform float {{mod}}_fade;'
        .endl();

    var srcBodyVert=''
        .endl()+'   pos = vec4( vPosition*{{mod}}_fade+attrMorphTargetA*(1.0-{{mod}}_fade), 1. );'
        .endl();

    function removeModule()
    {
        if(shader && module)
        {
            shader.removeModule(module);
            shader=null;
        }
    }

    this.render.onLinkChanged=removeModule;

    this.render.onTriggered=function()
    {
        if(!mesh)return;


        if(cgl.getShader()!=shader)
        {
            if(shader) removeModule();

            shader=cgl.getShader();

            module=shader.addModule(
                {
                    name:'MODULE_VERTEX_POSITION',
                    srcHeadVert:srcHeadVert,
                    srcBodyVert:srcBodyVert
                });

            console.log('morph module inited');
        
            uniFade=new CGL.Uniform(shader,'f',module.prefix+'_fade',self.fade.val);
        }

        mesh.render(cgl.getShader());
    };

    function rebuild()
    {
        if(self.geometry0.val && self.geometry1.val)
        {
            console.log('self.geometry0.val',self.geometry0.val);
            var g=self.geometry0.val;
            var geom=JSON.parse(JSON.stringify(g));

            console.log('g',geom);

            geom.morphTargets[0]=JSON.parse(JSON.stringify( self.geometry1.val.vertices ));

            console.log('geom.morphTargets[0].length',self.geometry0.val.vertices.length);
            console.log('geom.morphTargets[0].length',self.geometry1.val.vertices.length);

            mesh=new CGL.Mesh(cgl,geom);
        }
        else
        {
            mesh=null;
        }
    }

    this.geometry0.onValueChanged=rebuild;
    this.geometry1.onValueChanged=rebuild;


};

Ops.Gl.ShaderEffects.MeshMorphTargets.prototype = new Op();
Ops.Gl.Meshes.MorphMesh = Ops.Gl.ShaderEffects.MeshMorphTargets;


// https://github.com/automat/foam-gl
// http://howlerjs.com/
//http://learningwebgl.com/lessons/lesson01/index.html

Ops.Log = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='logger';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.input=this.addInPort(new Port(this,"input"));
    this.input.val='';

    this.exec=function()
    {
        console.log("[log] " + self.input.val);
    };

    this.exe.onTriggered=this.exec;
    this.input.onValueChanged=this.exec;
};
Ops.Log.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Profiler = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Profiler';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.input=this.addInPort(new Port(this,"input"));
    this.input.val='';

    this.exec=function()
    {
        console.log("[log] " + self.input.val);
    };

    this.exe.onTriggered=this.exec;
    this.input.onValueChanged=this.exec;
};
Ops.Profiler.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.CallsPerSecond = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='CallsPerSecond';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.cps=this.addOutPort(new Port(this,"cps",OP_PORT_TYPE_VALUE));

    this.timeStart=0;
    this.cpsCount=0;

    this.exe.onTriggered=function()
    {
        if(self.timeStart===0)self.timeStart=Date.now();
        var now = Date.now();

        if(now-self.timeStart>1000)
        {
            self.timeStart=Date.now();
            // console.log('cps: '+self.cps);
            self.cps.val=self.cpsCount;
            self.cpsCount=0;
        }

        self.cpsCount++;
    };
};
Ops.CallsPerSecond.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Value = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Value';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value",OP_PORT_TYPE_VALUE));

    this.result=this.addOutPort(new Port(this,"result"));

    function frame(time)
    {
        self.updateAnims();
        self.exec();
    }

    this.exec=function()
    {
        if(self.result.val!=self.v.val) self.result.val=self.v.val;
    };

    this.exe.onTriggered=this.exec;

    this.v.onValueChanged=this.exec;
    // this.onAnimFrame=function(){};
};

Ops.Value.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.Value2d = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Value2d';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.x=this.addInPort(new Port(this,"value x",OP_PORT_TYPE_VALUE));
    this.y=this.addInPort(new Port(this,"value y",OP_PORT_TYPE_VALUE));

    this.resultX=this.addOutPort(new Port(this,"result x"));
    this.resultY=this.addOutPort(new Port(this,"result y"));

    function frame(time)
    {
        self.updateAnims();
        self.exec();
    }

    this.exec=function()
    {
        if(self.resultX.val!=self.x.val) self.resultX.val=self.x.val;
        if(self.resultY.val!=self.y.val) self.resultY.val=self.y.val;
    };

    this.exe.onTriggered=this.exec;

    this.x.onValueChanged=this.exec;
    this.y.onValueChanged=this.exec;
    // this.onAnimFrame=function(){};
};

Ops.Value2d.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Value3d = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Value3d';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.x=this.addInPort(new Port(this,"value x",OP_PORT_TYPE_VALUE));
    this.y=this.addInPort(new Port(this,"value y",OP_PORT_TYPE_VALUE));
    this.z=this.addInPort(new Port(this,"value z",OP_PORT_TYPE_VALUE));

    this.resultX=this.addOutPort(new Port(this,"result x"));
    this.resultY=this.addOutPort(new Port(this,"result y"));
    this.resultZ=this.addOutPort(new Port(this,"result z"));

    function frame(time)
    {
        self.updateAnims();
        self.exec();
    }

    this.exec=function()
    {
        if(self.resultX.val!=self.x.val) self.resultX.val=self.x.val;
        if(self.resultY.val!=self.y.val) self.resultY.val=self.y.val;
        if(self.resultZ.val!=self.z.val) self.resultZ.val=self.z.val;
    };

    this.exe.onTriggered=this.exec;

    this.x.onValueChanged=this.exec;
    this.y.onValueChanged=this.exec;
    this.z.onValueChanged=this.exec;

    // this.onAnimFrame=function(){};
};

Ops.Value3d.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.ColorValue = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='ColorValue';

    this.g=this.addInPort(new Port(this,"ignore",OP_PORT_TYPE_FUNCTION,{display:'readonly'}));
    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));

    this.outR=this.addOutPort(new Port(this,"outr",OP_PORT_TYPE_VALUE));
    this.outG=this.addOutPort(new Port(this,"outg",OP_PORT_TYPE_VALUE));
    this.outB=this.addOutPort(new Port(this,"outb",OP_PORT_TYPE_VALUE));
    this.outA=this.addOutPort(new Port(this,"outa",OP_PORT_TYPE_VALUE));

    var exec=function()
    {
        self.outR.val=self.r.val;
        self.outG.val=self.g.val;
        self.outB.val=self.b.val;
        self.outA.val=self.a.val;
    };

    this.r.onValueChanged=exec;
    this.g.onValueChanged=exec;
    this.b.onValueChanged=exec;
    this.a.onValueChanged=exec;
};

Ops.ColorValue.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.TimeLineTime = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineTime';
    this.theTime=this.addOutPort(new Port(this,"time"));

    this.onAnimFrame=function(time)
    {
        this.theTime.val=time;
    };

};
Ops.TimeLineTime.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.TimeLineDelay = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineDelay';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.theTime=this.addOutPort(new Port(this,"time"));
    this.delay=this.addInPort(new Port(this,"delay"));
    this.delay.val=0.0;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        self.patch.timer.pauseEvents(true);
        self.patch.timer.setDelay(self.delay.val);
        self.theTime.val=self.patch.timer.getTime();
        self.trigger.trigger();
        self.patch.timer.setDelay(0);
        self.patch.timer.pauseEvents(false);

    };

};
Ops.TimeLineDelay.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.TimeLineDelayFrames = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineDelayFrames';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.theTime=this.addOutPort(new Port(this,"time"));
    this.delay=this.addInPort(new Port(this,"delay"));
    this.delay.val=0.0;
    
    this.fps=this.addInPort(new Port(this,"fps"));
    this.fps.val=30.0;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        self.patch.timer.setDelay(self.delay.val/self.fps.val);
        self.theTime.val=self.patch.timer.getTime();
        self.trigger.trigger();
        self.patch.timer.setDelay(0);
    };

};
Ops.TimeLineDelayFrames.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.TimeLineOverwrite = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineOverwrite';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.newTime=this.addInPort(new Port(this,"new time"));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.theTime=this.addOutPort(new Port(this,"time"));
    this.newTime.val=0.0;

    var realTime=0;
    this.exe.onTriggered=function()
    {
        realTime=self.patch.timer.getTime();

        self.patch.timer.overwriteTime=self.newTime.val;
        self.trigger.trigger();
        self.patch.timer.overwriteTime=-1;
    };
};

Ops.TimeLineOverwrite.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Repeat = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Repeat';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.num=this.addInPort(new Port(this,"num"));
    this.num.val=5;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.idx=this.addOutPort(new Port(this,"index"));

    this.exe.onTriggered=function()
    {
        for(var i=self.num.get()-1;i>-1;i--)
        {
            self.idx.set(i);
            self.trigger.trigger();
        }
    };
};
Ops.Repeat.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.ArrayIterator = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ArrayIterator';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.arr=this.addInPort(new Port(this,"array",OP_PORT_TYPE_ARRAY));

    this.num=this.addInPort(new Port(this,"num"));
    this.num.val=5;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.idx=this.addOutPort(new Port(this,"index"));
    this.val=this.addOutPort(new Port(this,"value"));

    this.exe.onTriggered=function()
    {
        if(!self.arr.val)return;
        for(var i in self.arr.val)
        {
            self.idx.val=i;
            self.val.val=self.arr.val[i];
            self.trigger.trigger();
        }
    };
};
Ops.ArrayIterator.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.IfTrueThen = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='if true then';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.bool=this.addInPort(new Port(this,"boolean"));
    this.bool.val=false;

    this.triggerThen=this.addOutPort(new Port(this,"then",OP_PORT_TYPE_FUNCTION));
    this.triggerElse=this.addOutPort(new Port(this,"else",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        if(self.bool.val || self.bool.val>=1 )
        {
            self.triggerThen.trigger();
        }
        else
        {
            self.triggerElse.trigger();
        }
    };
};

Ops.IfTrueThen.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.IfBetweenThen = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='if between then';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.number=this.addInPort(new Port(this,"number"));
    this.number.val=0;

    this.min=this.addInPort(new Port(this,"min"));
    this.min.val=0;

    this.max=this.addInPort(new Port(this,"max"));
    this.max.val=1;

    this.triggerThen=this.addOutPort(new Port(this,"then",OP_PORT_TYPE_FUNCTION));
    this.triggerElse=this.addOutPort(new Port(this,"else",OP_PORT_TYPE_FUNCTION));

    this.exe.onTriggered=function()
    {
        if(self.number.get()>=self.min.get() && self.number.get()<self.max.get()) self.triggerThen.trigger();
            else self.triggerElse.trigger();
    };
};

Ops.IfBetweenThen.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.ToggleBool = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ToggleBool';

    this.bool=this.addInPort(new Port(this,"boolean"));
    this.bool.val=false;
    this.boolOut=this.addOutPort(new Port(this,"result"));
    this.boolOut.val=true;

    this.bool.onValueChanged=function()
    {
        this.boolOut=!this.bool.val;
    };
};

Ops.ToggleBool.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Group = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='group';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.triggers=[];

    for(var i=0;i<10;i++)
    {
        this.triggers.push( this.addOutPort(new Port(this,"trigger "+i,OP_PORT_TYPE_FUNCTION)) );
    }

    this.exe.onTriggered=function()
    {
        for(var i in self.triggers)
            self.triggers[i].trigger();
    };

    this.uiAttribs.warning='"group" is deprecated, please use "sequence now"';

};
Ops.Group.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Sequence = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='sequence';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.triggers=[];

    for(var i=0;i<10;i++)
    {
        this.triggers.push( this.addOutPort(new Port(this,"trigger "+i,OP_PORT_TYPE_FUNCTION)) );
    }

    this.exe.onTriggered=function()
    {
        for(var i=0;i<self.triggers.length;i++)
            self.triggers[i].trigger();
    };

};
Ops.Sequence.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.TimedSequence = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimedSequence';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.current=this.addInPort(new Port(this,"current",OP_PORT_TYPE_VALUE));
    this.current.val=0;

    this.overwriteTime=this.addInPort(new Port(this,"overwriteTime",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.overwriteTime.val=false;
    this.ignoreInSubPatch=this.addInPort(new Port(this,"ignoreInSubPatch",OP_PORT_TYPE_VALUE,{display:"bool"}));
    this.ignoreInSubPatch.val=false;

    this.triggerAlways=this.addOutPort(new Port(this,"triggerAlways",OP_PORT_TYPE_FUNCTION));
    this.currentKeyTime=this.addOutPort(new Port(this,"currentKeyTime",OP_PORT_TYPE_VALUE));

    var triggers=[];

    for(var i=0;i<30;i++)
    {
        triggers.push( this.addOutPort(new Port(this,"trigger "+i,OP_PORT_TYPE_FUNCTION)) );
    }

    this.onLoaded=function()
    {

        var i=0;
        // console.log('TimedSequence loading---------------------------------------------');
        // for(i=0;i<triggers.length;i++)
        // {
        //     cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
        //     triggers[i].trigger();
        // }

        // if(self.current.anim)
        // {
        //     for(i=0;i<self.current.anim.keys.length;i++)
        //     {
        //         preRenderTimes.push(self.current.anim.keys[i].time);
        //         // var ii=i;
        //         // cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        //         // var time=self.current.anim.keys[ii].time+0.001;
        //         // self.exe.onTriggered(time);
        //         // console.log('timed pre init...');
        //         // cgl.gl.flush();
        //     }
        // }

        // self.triggerAlways.trigger();
        // console.log('TimedSequence loaded---------------------------------------------');
                
    };

    var lastUiValue=-1;
    this.exe.onTriggered=function(_time)
    {

        if(window.gui)
        {
                    
            if(self.current.val!=lastUiValue)
            {
                lastUiValue=parseInt(self.current.val,10);
                for(var spl=0;spl<triggers.length;spl++)
                {
                    if(spl==lastUiValue) triggers[spl].setUiActiveState(true);
                        else triggers[spl].setUiActiveState(false);
                }
                
            }
        }

        if(self.current.anim)
        {
            var time=_time;
            if(_time===undefined) time=self.current.parent.patch.timer.getTime();

            self.currentKeyTime.val=time-self.current.anim.getKey(time).time;

            if(self.current.isAnimated())
            {
                if(self.overwriteTime.val)
                {
                    self.current.parent.patch.timer.overwriteTime=self.currentKeyTime.val;  // todo  why current ? why  not self ?
                }
            }
        }

        if(self.patch.gui && self.ignoreInSubPatch.val )
        {
            for(var i=0;i<triggers.length;i++)
            {
                for(var spl=0;spl<triggers[i].links.length;spl++)
                {
                    if(triggers[i].links[spl])
                    {
                        if(triggers[i].links[spl].portIn.parent.patchId)
                        {
                            if(gui.patch().getCurrentSubPatch() == triggers[i].links[spl].portIn.parent.patchId.val)
                            {
                                self.patch.timer.overwriteTime=-1;
                                triggers[i].trigger();
                                return;
                            }
                            // console.log(triggers[i].links[spl].portIn.parent.patchId.val);
                        }
                    }
                }
            }
        }

        var outIndex=Math.round(self.current.val-0.5);
        if(outIndex>=0 && outIndex<triggers.length)
        {
            triggers[outIndex].trigger();
        }

        self.patch.timer.overwriteTime=-1;
        self.triggerAlways.trigger();
    };

};
Ops.TimedSequence.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Interval = function()
{
    Op.apply(this, arguments);

    this.name='Interval';
    this.timeOutId=-1;
    this.interval=this.addInPort(new Port(this,"interval"));
    this.interval.val=1000;
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.exec=function()
    {
        if(this.timeOutId!=-1)return;
        var self=this;

        this.timeOutId=setTimeout(function()
        {
            self.timeOutId=-1;
            self.trigger.trigger();
            self.exec();
        },
        this.interval.val );
    };

    this.exec();

};

Ops.Interval.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Anim={};

Ops.Anim.SinusAnim = function()
{
    Op.apply(this, arguments);

    this.name='SinusAnim';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    this.phase=this.addInPort(new Port(this,"phase",OP_PORT_TYPE_VALUE));
    this.mul=this.addInPort(new Port(this,"frequency",OP_PORT_TYPE_VALUE));
    this.amplitude=this.addInPort(new Port(this,"amplitude",OP_PORT_TYPE_VALUE));

    var self=this;

    this.exe.onTriggered=function()
    {
        self.result.val = self.amplitude.val*Math.sin( ( Date.now()/1000.0 * self.mul.val ) + parseFloat(self.phase.val) );
    };

    this.mul.val=1.0;
    this.amplitude.val=1.0;
    this.phase.val=1;
    this.exe.onTriggered();
};

Ops.Anim.SinusAnim.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Anim.RelativeTime = function()
{
    Op.apply(this, arguments);

    this.name='RelativeTime';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    var self=this;
    var startTime=Date.now()/1000.0;

    this.exe.onTriggered=function()
    {
        self.result.val=Date.now()/1000.0-startTime;
    };

    this.exe.onTriggered();

};

Ops.Anim.RelativeTime.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Anim.Frequency = function()
{
    Op.apply(this, arguments);

    this.name='Frequency';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.frequency=this.addInPort(new Port(this,"frequency",OP_PORT_TYPE_VALUE));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var self=this;
    var startTime=0;

    this.exe.onTriggered=function()
    {
        if(Date.now()-startTime>self.frequency.val)
        {
            startTime=Date.now();
            self.trigger.trigger();
        }
    };
};

Ops.Anim.Frequency.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Anim.TimeDiff = function()
{
    Op.apply(this, arguments);

    this.name='TimeDiff';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    var self=this;
    var lastTime=Date.now();

    this.exe.onTriggered=function()
    {
        self.result.val=(Date.now()-lastTime);
        lastTime=Date.now();
        self.trigger.trigger();
    };

    this.exe.onTriggered();

};

Ops.Anim.TimeDiff.prototype = new Op();

// ---------------------------------------------------------------------------

var cableVars={};

Ops.Anim.Variable = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Variable';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.varName=this.addInPort(new Port(this,"name"));
    this.val=this.addInPort(new Port(this,"value"));
    this.result=this.addOutPort(new Port(this,"result"));

    function changed()
    {
        cableVars[self.varName.val]=self.val.val;
        self.result.val=self.val.val;
    }

    function readValue()
    {
        self.val.val=cableVars[self.varName.val];
    }

    this.val.onValueChanged=changed;
    this.varName.onValueChanged=changed;
    this.exe.onTriggered=readValue;
};

Ops.Anim.Variable.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.String=Ops.String || {};

Ops.String.concat = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='concat';
    this.result=this.addOutPort(new Port(this,"result"));
    this.string1=this.addInPort(new Port(this,"string1",OP_PORT_TYPE_VALUE,{type:'string'}));
    this.string2=this.addInPort(new Port(this,"string2",OP_PORT_TYPE_VALUE,{type:'string'}));

    this.exec= function()
    {
        self.result.val=self.string1.val+self.string2.val;
    };

    this.string1.onValueChanged=this.exec;
    this.string2.onValueChanged=this.exec;

    this.string1.val='wurst';
    this.string2.val='tuete';
};

Ops.String.concat.prototype = new Op();

// ----------------------------------------------------------------------

Ops.LoadingStatus = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='loadingStatus';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.finished=this.addOutPort(new Port(this,"finished",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"status",OP_PORT_TYPE_VALUE));
    this.preRenderStatus=this.addOutPort(new Port(this,"preRenderStatus",OP_PORT_TYPE_VALUE));
    this.preRenderTimeFrames=this.addInPort(new Port(this,"preRenderTimes",OP_PORT_TYPE_VALUE));
    this.preRenderStatus.val=0;
    this.numAssets=this.addOutPort(new Port(this,"numAssets",OP_PORT_TYPE_VALUE));
    this.loading=this.addOutPort(new Port(this,"loading",OP_PORT_TYPE_FUNCTION));

    var finishedLoading=false;

    var preRenderInc=0;
    var preRenderDone=0;
    var preRenderTime=0;
    var preRenderTimes=[];
    var firstTime=true;

    var identTranslate=vec3.create();
    vec3.set(identTranslate, 0,0,-2);

    var preRenderAnimFrame=function(time)
    {
        self.patch.timer.setTime(preRenderTime);
        self.finished.trigger();
        // cgl.gl.flush();

        Ops.Gl.Renderer.renderStart(cgl,identTranslate);

        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        self.loading.trigger();
        // console.log('pre anim');
        
        Ops.Gl.Renderer.renderEnd(cgl);
        preRenderDone=preRenderInc;
    };

    this.onAnimFrame=function(){};

    function checkPreRender()
    {
        // console.log(' checkprerender ',preRenderTimes.length,preRenderInc,preRenderDone);

        if(preRenderTimes.length>0)
        {
            if(preRenderInc==preRenderDone)
            {
                preRenderInc++;
                preRenderTime=preRenderTimes[preRenderInc];
            }
        }
        self.preRenderStatus.val=preRenderInc/preRenderTimes.length;

        if(preRenderTimes.length===0 || preRenderDone==preRenderTimes.length-1 )
        {
            // self.patch.timer.setTime(0);
            // self.patch.timer.pause();

            self.onAnimFrame=function(){};
            CGL.decrementLoadingAssets();
            finishedLoading=true;

        }
        else
            setTimeout(checkPreRender,30);

    }

    this.exe.onTriggered= function()
    {
        self.result.val=CGL.getLoadingStatus();
        self.numAssets.val=CGL.numMaxLoadingAssets;

        if(!finishedLoading && this.onAnimFrame!=preRenderAnimFrame)
        {
            self.onAnimFrame=preRenderAnimFrame;
        }

        if(finishedLoading)
        {
            if(firstTime)
            {
                CGL.incrementLoadingAssets();
                console.log('finished loading complete...', CGL.getLoadingStatus());
                self.patch.timer.setTime(0);
                self.patch.timer.play();
                CGL.decrementLoadingAssets();
                        
                firstTime=false;
            }

            self.finished.trigger();
        }
        else
        {
            self.loading.trigger();
            self.patch.timer.pause();

            if(self.result.val>=1.0 || CGL.numMaxLoadingAssets===0)
            {
                CGL.incrementLoadingAssets();

                var i=0;
                for(i=0;i<self.patch.ops.length;i++)
                {
                    if(self.patch.ops[i].onLoaded)self.patch.ops[i].onLoaded();
                }

                // cgl.canvasWidth=cgl.canvas.clientWidth;
                // cgl.canvasHeight=cgl.canvas.clientHeight;
        
                if(self.preRenderTimeFrames.isAnimated())
                {
                    for(i=0;i<self.preRenderTimeFrames.anim.keys.length;i++)
                        preRenderTimes.push( self.preRenderTimeFrames.anim.keys[i].time );
                }
                preRenderTimes.push(0);

                checkPreRender();
            }
        }
    };
};

Ops.LoadingStatus.prototype = new Op();

// ---------------

Ops.TriggerCounter = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TriggerCounter';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.reset=this.addInPort(new Port(this,"reset",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));
    this.num=this.addOutPort(new Port(this,"timesTriggered",OP_PORT_TYPE_VALUE));

    var num=0;

    this.exe.onTriggered= function()
    {
        num++;
        self.num.val=num;
        self.trigger.trigger();
    };
    this.reset.onTriggered= function()
    {
        num=0;
        self.num.val=num;
    };

};

Ops.TriggerCounter.prototype = new Op();



Ops.Json=Ops.Json || {};


Ops.Json.jsonValue = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonValue';

    this.data=this.addInPort(new Port(this,"data",OP_PORT_TYPE_OBJECT ));
    this.key=this.addInPort(new Port(this,"key"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.data.onValueChanged=function()
    {
        if(self.data.val && self.data.val.hasOwnProperty(self.key.val))
        {
            self.result.val=self.data.val[self.key.val];
        }
    };
};

Ops.Json.jsonValue.prototype = new Op();

// -------------------------------------------------------------

Ops.Json.jsonFile = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonFile';

    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.result=this.addOutPort(new Port(this,"result",OP_PORT_TYPE_OBJECT));

    var reload=function()
    {
        ajaxRequest(self.patch.getFilePath(self.filename.val),function(data)
        {
            self.result.val=data;
            console.log('data',data);

        });
    };

    this.filename.onValueChanged=reload;
};

Ops.Json.jsonFile.prototype = new Op();

// -------------------------------------------------------------


Ops.Json3d=Ops.Json3d || {};



Ops.Json3d.json3dFile = function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='json3dFile';
    var scene=new CABLES.Variable();

    cgl.frameStore.currentScene=null;

    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'json' } ));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    function render()
    {
        var oldScene=cgl.frameStore.currentScene;
        cgl.frameStore.currentScene=scene;
        self.trigger.trigger();
        cgl.frameStore.currentScene=oldScene;
    }

    this.exe.onTriggered=render;

    var maxx=-3;
    var row=0;
    function addChild(x,y,parentOp,parentPort,ch)
    {

        if(ch.hasOwnProperty('transformation'))
        {
            maxx=Math.max(x,maxx);

            var posx=self.uiAttribs.translate.x+x*130;
            if(ch.children && ch.children.length>1) posx=posx+(ch.children.length+1)*130/2;// center
            var posy=self.uiAttribs.translate.y+y*50;

            var transOp=self.patch.addOp('Ops.Gl.Matrix.MatrixMul',{translate:{x:posx,y:posy}});
            var mat=ch.transformation;
            mat4.transpose(mat,mat);
            transOp.matrix.val=ch.transformation;

            if(ch.name)
            {
                transOp.uiAttribs.title=transOp.name=ch.name;
            }

            if(ch.children)console.log('ch ',ch.name,ch.children.length);
                    

            self.patch.link(parentOp,parentPort,transOp,'render');

            var i=0;
            if(ch.hasOwnProperty('meshes'))
            {
                for(i=0;i<ch.meshes.length;i++)
                {
                    var index=ch.meshes[i];

                    var meshOp=self.patch.addOp('Ops.Json3d.Mesh',{translate:{x:posx,y:posy+50}});
                    meshOp.index.val=index;

                    meshOp.uiAttribs.title=meshOp.name=transOp.name+' Mesh';
                    // scene.meshes[index].name=meshOp.name;

                    self.patch.link(transOp,'trigger',meshOp,'render');
                }
            }

            if(ch.hasOwnProperty('children'))
            {
                y++;
                for(i=0;i<ch.children.length;i++)
                {
                    var xx=maxx;
                    if(ch.children.length>1)xx++;
                    addChild(xx,y,transOp,'trigger',ch.children[i]);
                }
            }
        }
    }



    var reload=function()
    {
        if(!self.filename.val)return;

        CGL.incrementLoadingAssets();

        // console.log('load ajax'+self.patch.getFilePath(self.filename.val));

        CABLES.ajax(self.patch.getFilePath(self.filename.val),
            function(err,_data,xhr)
            {

                if(err)
                {
                    console.log('ajax error:',err);
                    CGL.decrementLoadingAssets();
                    return;
                }
                var data=JSON.parse(_data);
                scene.setValue(data);

                if(!self.trigger.isLinked())
                {
                    console.log('data.meshes '+data.meshes.length);
                    var root=self.patch.addOp('Ops.Sequence',{translate:{x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y+50}});
                    self.patch.link(self,'trigger',root,'exe');

                    for(var i=0;i<data.rootnode.children.length;i++)
                    {
                        addChild(maxx-2,3,root,'trigger 0',data.rootnode.children[i]);
                    }
                }

                render();
                CGL.decrementLoadingAssets();
            });

    };

    this.filename.onValueChanged=reload;
};

Ops.Json3d.json3dFile.prototype = new Op();




// -------------------------------------------------------------

Ops.Json3d.Mesh=function()
{
    Op.apply(this, arguments);
    var self=this;
    var cgl=this.patch.cgl;

    this.name='json3d Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION ));
    this.index=this.addInPort(new Port(this,"mesh index",OP_PORT_TYPE_VALUE,{type:'string'} ));
    this.centerPivot=this.addInPort(new Port(this,"center pivot",OP_PORT_TYPE_VALUE,{display:'bool'} ));
    this.centerPivot.val=false;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.geometryOut=this.addOutPort(new Port(this,"geometry",OP_PORT_TYPE_OBJECT ));
    this.geometryOut.ignoreValueSerialize=true;

    var mesh=null;
    var currentIndex=-1;

    function render()
    {
        if(!mesh && cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue() || currentIndex!=self.index.val)
        {
            reload();
        }
        if(mesh!==null)
            mesh.render(cgl.getShader());

        self.trigger.trigger();
    }

    function reload()
    {
        if(cgl.frameStore.currentScene && cgl.frameStore.currentScene.getValue())
        {
            // console.log(' has '+cgl.frameStore.currentScene.getValue().meshes.length+' meshes ');
            // console.log('reload');
            self.uiAttr({warning:''});
            self.uiAttr({info:''});

            var jsonMesh=null;

            currentIndex=self.index.val;

            if(isNumeric(self.index.val))
            {
                if(self.index.val<0 || self.index.val>=cgl.frameStore.currentScene.getValue().meshes.length)
                {
                    self.uiAttr({warning:'mesh not found - index out of range '});
                    return;
                }

                jsonMesh=cgl.frameStore.currentScene.getValue().meshes[parseInt(self.index.val,10) ];
            }
            else
            {
                var scene=cgl.frameStore.currentScene.getValue();
            }

            if(!jsonMesh)
            {
                mesh=null;
                self.uiAttr({warning:'mesh not found'});
                return;
            }
            self.uiAttribs.warning='';

            var i=0;

            var verts=JSON.parse(JSON.stringify(jsonMesh.vertices));

            if(self.centerPivot.val)
            {
                var max=[-998999999,-998999999,-998999999];
                var min=[998999999,998999999,998999999];

                for(i=0;i<verts.length;i+=3)
                {
                    max[0]=Math.max( max[0] , verts[i+0] );
                    max[1]=Math.max( max[1] , verts[i+1] );
                    max[2]=Math.max( max[2] , verts[i+2] );

                    min[0]=Math.min( min[0] , verts[i+0] );
                    min[1]=Math.min( min[1] , verts[i+1] );
                    min[2]=Math.min( min[2] , verts[i+2] );
                }

                console.log('max',max);
                console.log('min',min);

                var off=[
                    Math.abs(Math.abs(max[0])-Math.abs(min[0])),
                    Math.abs(Math.abs(max[1])-Math.abs(min[1])),
                    Math.abs(Math.abs(max[2])-Math.abs(min[2]))
                ];

                console.log('off',off);

                for(i=0;i<verts.length;i+=3)
                {
                    verts[i+0]+=(off[0] );
                    verts[i+1]+=(off[1] );
                    verts[i+2]+=(off[2] );
                }



                max=[-998999999,-998999999,-998999999];
                min=[998999999,998999999,998999999];

                for(i=0;i<verts.length;i+=3)
                {
                    max[0]=Math.max( max[0] , verts[i+0] );
                    max[1]=Math.max( max[1] , verts[i+1] );
                    max[2]=Math.max( max[2] , verts[i+2] );

                    min[0]=Math.min( min[0] , verts[i+0] );
                    min[1]=Math.min( min[1] , verts[i+1] );
                    min[2]=Math.min( min[2] , verts[i+2] );
                }

                console.log('after max',max);
                console.log('after min',min);




            }


            var geom=new CGL.Geometry();
            geom.calcNormals=true;
            geom.vertices=verts;
            geom.vertexNormals=jsonMesh.normals;
            if(jsonMesh.texturecoords) geom.texCoords = jsonMesh.texturecoords[0];
            geom.verticesIndices=[];

            for(i=0;i<jsonMesh.faces.length;i++)
                geom.verticesIndices=geom.verticesIndices.concat(jsonMesh.faces[i]);

            var nfo='';
            nfo += geom.verticesIndices.length+' faces <br/>';
            nfo += geom.vertices.length+' vertices <br/>';
            nfo += geom.texCoords.length+' texturecoords <br/>';
            nfo += geom.vertexNormals.length+' normals <br/>';
            self.uiAttr({info:nfo});

            self.geometryOut.val=geom;
            mesh=new CGL.Mesh(cgl,geom);
        }
        else
        {
            // console.log('no meshes found');
            // console.log(cgl.frameStore.currentScene);
        }
    }

    this.render.onTriggered=render;
    this.centerPivot.onValueChanged=function()
    {
        mesh=null;
    };
    // this.index.onValueChanged=reload;

};

Ops.Json3d.Mesh.prototype = new Op();







// TODO: CLAMP!

Ops.Math=Ops.Math || {};


Ops.Math.Random = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='random';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));
    this.result=this.addOutPort(new Port(this,"result"));

    this.minusPlusOne=this.addInPort(new Port(this,"0 to x / -x to x ",OP_PORT_TYPE_VALUE,{display:'bool'}));

    this.max=this.addInPort(new Port(this,"max"));

    this.exe.onTriggered=function()
    {
        if(self.minusPlusOne.val) self.result.val=(Math.random()*self.max.val)*2-self.max.val/2;
            else self.result.val=Math.random()*self.max.val;
    };

    this.exe.onTriggered();
    this.max.val=1.0;
};

Ops.Math.Random.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Clamp = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Clamp';
    this.val=this.addInPort(new Port(this,"val"));
    this.min=this.addInPort(new Port(this,"min"));
    this.max=this.addInPort(new Port(this,"max"));
    this.result=this.addOutPort(new Port(this,"result"));

    function clamp()
    {
        self.updateAnims();
        self.result.val= Math.min(Math.max(self.val.val, self.min.val), self.max.val);
    }

    this.min.val=0;
    this.max.val=1;

    this.val.onValueChanged=clamp;
    this.min.onValueChanged=clamp;
    this.max.onValueChanged=clamp;

    this.val.val=0.5;
};

Ops.Math.Clamp.prototype = new Op();

// ---------------------------------------------------------------------------


Ops.Math.SmoothStep = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='SmoothStep';
    this.val=this.addInPort(new Port(this,"val"));
    this.min=this.addInPort(new Port(this,"min"));
    this.max=this.addInPort(new Port(this,"max"));
    this.result=this.addOutPort(new Port(this,"result"));

    function smoothstep ()
    {
        self.updateAnims();
        var x = Math.max(0,Math.min(1,(self.val.val-self.min.val)/(self.max.val-self.min.val)));
        self.result.val=x*x*(3-2*x);
    }

    this.min.val=0;
    this.max.val=1;
    
    this.val.onValueChanged=smoothstep;
    this.min.onValueChanged=smoothstep;
    this.max.onValueChanged=smoothstep;

    this.val.val=0.5;
};

Ops.Math.SmoothStep.prototype = new Op();

// ----------------------------------------------------------------------------

Ops.Math.SmootherStep = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='SmootherStep';
    this.val=this.addInPort(new Port(this,"val"));
    this.min=this.addInPort(new Port(this,"min"));
    this.max=this.addInPort(new Port(this,"max"));
    this.result=this.addOutPort(new Port(this,"result"));

    function smootherstep ()
    {
        var x = Math.max(0, Math.min(1, (self.val.val-self.min.val)/(self.max.val-self.min.val)));
        self.result.val= x*x*x*(x*(x*6 - 15) + 10); // smootherstep
        // return linear(self.val.val,this,key2);
    }

    this.min.val=0;
    this.max.val=1;
    
    this.val.onValueChanged=smootherstep;
    this.min.onValueChanged=smootherstep;
    this.max.onValueChanged=smootherstep;

    this.val.val=0.5;
};

Ops.Math.SmootherStep.prototype = new Op();

// ----------------------------------------------------------------------------


Ops.Math.MapRange = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='map value range';
    this.result=this.addOutPort(new Port(this,"result"));
    this.v=this.addInPort(new Port(this,"value"));
    this.old_min=this.addInPort(new Port(this,"old min"));
    this.old_max=this.addInPort(new Port(this,"old max"));
    this.new_min=this.addInPort(new Port(this,"new min"));
    this.new_max=this.addInPort(new Port(this,"new max"));

    this.exec= function()
    {
        self.updateAnims();

        if(self.v.val>self.old_max.val)
        {
            self.result.val=self.new_max.val;
            return;
        }
        else
        if(self.v.val<self.old_min.val)
        {
            self.result.val=self.new_min.val;
            return;
        }

        var nMin=parseFloat(self.new_min.val);
        var nMax=parseFloat(self.new_max.val);
        var oMin=parseFloat(self.old_min.val);
        var oMax=parseFloat(self.old_max.val);
        var x=parseFloat(self.v.val);

        var reverseInput = false;
        var oldMin = Math.min( oMin, oMax );
        var oldMax = Math.max( oMin, oMax );
        if(oldMin!= oMin) reverseInput = true;

        var reverseOutput = false;
        var newMin = Math.min( nMin, nMax );
        var newMax = Math.max( nMin, nMax );
        if(newMin != nMin) reverseOutput = true;

        var portion=0;

        if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
            else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);
        
        if(reverseOutput) self.result.val = newMax - portion;
            else self.result.val = portion + newMin;

    };

    this.v.val=0;
    this.old_min.val=-1;
    this.old_max.val=1;
    this.new_min.val=0;
    this.new_max.val=1;


    this.v.onValueChanged=this.exec;
    this.old_min.onValueChanged=this.exec;
    this.old_max.onValueChanged=this.exec;
    this.new_min.onValueChanged=this.exec;
    this.new_max.onValueChanged=this.exec;

    this.exec();

};

Ops.Math.MapRange.prototype = new Op();



// ---------------------------------------------------------------------------

Ops.Math.Abs = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='abs';
    this.number=this.addInPort(new Port(this,"number"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.number.onValueChanged=function()
    {
        self.result.val=Math.abs(self.number.val);
    };
};

Ops.Math.Abs.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Sin = function()
{
    Op.apply(this, arguments);
    var self=this;
    this.name='Sinus';
    this.number=this.addInPort(new Port(this,"number"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.number.onValueChanged=function()
    {
        self.result.val=Math.sin(self.number.val);
    };
};

Ops.Math.Sin.prototype = new Op();

// ---------------------------------------------------------------------------


Ops.Math.SmoothStep = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='SmoothStep';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number=this.addInPort(new Port(this,"number"));
    this.min=this.addInPort(new Port(this,"min"));
    this.max=this.addInPort(new Port(this,"max"));

    var min=0;
    var max=1;
    var subAdd=0;

    this.exec= function()
    {
        var val=self.number.val;

        // todo negative min ?

        var x = Math.max(0, Math.min(1, (val-min)/(max-min)));
        self.result.val= x*x*(3 - 2*x); // smoothstep
        // return x*x*x*(x*(x*6 - 15) + 10); // smootherstep

    };

    this.min.val=0;
    this.max.val=1;
    this.number.val=0;

    function setValues()
    {
        min=self.min.val;
        max=self.max.val;

        // if(min<0)
        // {
        //     subAdd=min*-1;
        //     min+=subAdd;
        //     max+=subAdd;
        // }
        // else subAdd=0;
    }

    this.number.onValueChanged=this.exec;
    this.max.onValueChanged=setValues;
    this.min.onValueChanged=setValues;

    setValues();
};

Ops.Math.SmoothStep.prototype = new Op();

// ---------------------------------------------------------------------------


Ops.Math.Sum = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='sum';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        var v=parseFloat(self.number1.get())+parseFloat(self.number2.get());
        if(!isNaN(v)) self.result.set( v );
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

    this.number1.set(1);
    this.number2.set(1);
};

Ops.Math.Sum.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Subtract = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='subtract';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    function exec()
    {
        self.updateAnims();
        var v=parseFloat(self.number1.get())-parseFloat(self.number2.get());
        if(!isNaN(v)) self.result.set( v );
    }

    this.number1.onValueChanged=exec;
    this.number2.onValueChanged=exec;

    this.number1.set(1);
    this.number2.set(1);
};

Ops.Math.Subtract.prototype = new Op();



// ---------------------------------------------------------------------------


Ops.Math.Multiply = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='multiply';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        self.result.set(self.number1.get()*self.number2.get() );
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

    this.number1.set(1);
    this.number2.set(2);
};

Ops.Math.Multiply.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.Math.Modulo = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Modulo';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));
    this.pingpong=this.addInPort(new Port(this,"pingpong",OP_PORT_TYPE_VALUE,{display:'bool'}));

    var doPingPong=false;

    this.exec= function()
    {
        self.updateAnims();

        if(doPingPong)
        {
            self.result.val=(self.number1.val%self.number2.val*2) ;
            if(self.result.val>self.number2.val)
                self.result.val=self.number2.val*2.0-self.result.val;

            return;
        }
        
        self.result.val=self.number1.val%self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

    this.number1.val=1;
    this.number2.val=2;

    this.pingpong.onValueChanged=function()
    {
        doPingPong=self.pingpong.val;
    };

};

Ops.Math.Modulo.prototype = new Op();

// ---------------------------------------------------------------------------

Ops.Math.Divide = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Divide';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=self.number1.val/self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Divide.prototype = new Op();

// ---------------------------------------------------------------------------


Ops.Math.Compare={};




Ops.Math.Compare.IsEven = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='isEven';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));

    this.exec= function()
    {
        self.result.val=!( self.number1.val & 1 );
    };

    this.number1.onValueChanged=this.exec;
};

Ops.Math.Compare.IsEven.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Math.Compare.Greater = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Greater';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=self.number1.val>self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Compare.Greater.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Math.Compare.Between = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Between';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number=this.addInPort(new Port(this,"value"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));
    this.number.val=2.0;
    this.number1.val=1.0;
    this.number2.val=3.0;

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=
            (
                self.number.val>Math.min(self.number1.val,self.number2.val) &&
                self.number.val<Math.max(self.number1.val,self.number2.val)
            );
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
    this.number.onValueChanged=this.exec;
};
Ops.Math.Compare.Between.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Math.Compare.Lesser = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Lesser';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=self.number1.val<self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

};

Ops.Math.Compare.Lesser.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Math.Compare.Equals = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Equals';
    this.result=this.addOutPort(new Port(this,"result"));
    this.number1=this.addInPort(new Port(this,"number1"));
    this.number2=this.addInPort(new Port(this,"number2"));

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=self.number1.val==self.number2.val ;
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;
};

Ops.Math.Compare.Equals.prototype = new Op();




Ops.Net=Ops.Net || {};

Ops.Net.Websocket = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Websocket';
    this.url=this.addInPort(new Port(this,"url",OP_PORT_TYPE_VALUE,{type:'string'}));
    this.result=this.addOutPort(new Port(this,"result", OP_PORT_TYPE_OBJECT));
    this.connected=this.addOutPort(new Port(this,"connected"));

    var connection=null;
    var timeout=null;
    var connectedTo='';

    function checkConnection()
    {
        if(self.connected.val===false)
        {
            connect();
        }
        timeout=setTimeout(checkConnection,1000);
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
            if(connection!=null)connection.close();
            connection = new WebSocket(self.url.val);
        }catch (e)
        {
            console.log('could not connect to',self.url.val);
        }
        
        connection.onerror = function (message)
        {
            self.connected.val=false;
        };

        connection.onclose = function (message)
        {
            self.connected.val=false;
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

        
        
    }

    this.url.onValueChanged=connect;
    timeout=setTimeout(checkConnection,1000);

    this.url.val='ws://127.0.0.1:1337';
};

Ops.Net.Websocket.prototype = new Op();

// -------------------------------------------------------------


Ops = Ops || {};
Ops.Ui = Ops.Ui || {};

Ops.Ui.Comment = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Comment';
    this.title=this.addInPort(new Port(this,"title"));
    this.text=this.addInPort(new Port(this,"text"));
};

Ops.Ui.Comment.prototype = new Op();

// -------------------

Ops.Ui.Patch = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='Patch';
    this.patchId=this.addInPort(new Port(this,"patchId",OP_PORT_TYPE_VALUE,{ display:'readonly' }));


    var hasDynamicPort=function()
    {
        for(var i in self.portsIn)
        {
            if(self.portsIn[i].type==OP_PORT_TYPE_DYNAMIC)
            {
                        // console.log('hasDynamicPort');
                return true;
            }
            if(self.portsIn[i].getName()=='dyn')
            {
                // console.log('hasDynamicPort');
                return true;
            }

        }
                
        return false;
    };

    var getNewDynamicPort=function(name)
    {

        for(var i in this.portsIn)
        {
            if(this.portsIn[i].type==OP_PORT_TYPE_DYNAMIC)
            {
                this.portsIn[i].name=name;
                // console.log('found dyn port, change name...');
                        
                return this.portsIn[i];
            }
        }

        var p=self.addInPort(new Port(self,name,OP_PORT_TYPE_DYNAMIC));
        p.shouldLink=self.shouldLink;
        return p;
    };

    this.getPort=function(name)
    {
        for(var ipi in self.portsIn)
        {
            if(self.portsIn[ipi].getName()==name)
            {
                return self.portsIn[ipi];
            }
        }

        var p=getNewDynamicPort(name);
        
        return p;
    };

    var getSubPatchInputOp=function()
    {
        var patchInputOP=self.patch.getSubPatchOp(self.patchId.val,'Ops.Ui.PatchInput');

        if(!patchInputOP)
        {
            console.log('no patchinput!');
            self.patch.addOp('Ops.Ui.PatchInput',{'subPatch':self.patchId.val} );

            patchInputOP=self.patch.getSubPatchOp(self.patchId.val,'Ops.Ui.PatchInput');

            if(!patchInputOP)
            {
                console.warn('no patchinput2!');
            }
        }

        return patchInputOP;
    };

    this.shouldLink=function(p1,p2)
    {
        if(p1.type!=OP_PORT_TYPE_DYNAMIC && p2.type!=OP_PORT_TYPE_DYNAMIC) return true;

        // console.log('shouldlink');
        // console.log('p1 p2',p1.getName(),p2.getName());

        var dynPort=p2;
        var otherPort=p1;

        if(p1.type==OP_PORT_TYPE_DYNAMIC)
        {
            dynPort=p1;
            otherPort=p2;
        }

        dynPort.type=otherPort.type;
        dynPort.name='in_'+otherPort.getName();

        var patchInputOP=getSubPatchInputOp();
        var pOut=patchInputOP.addOutPort(new Port(self,"out_"+otherPort.getName(),dynPort.type));

        if(dynPort.type==OP_PORT_TYPE_FUNCTION)
        {
            dynPort.onTriggered=function()
            {
                pOut.trigger();
            };
            dynPort.onTriggered();
        }
        else
        {
            dynPort.onValueChanged=function()
            {
                pOut.val=dynPort.val;
            };
            dynPort.onValueChanged();
        }

        if (CABLES.UI)gui.patch().updateSubPatches();
        if(!hasDynamicPort())getNewDynamicPort('dyn');



        // console.log('port list');
        // for(var i in self.portsIn)
        // {
        //     console.log(' ',self.portsIn[i].getName(),self.portsIn[i].type);
        // }
        // console.log('  ',self.portsIn.length+' ports');
        

        return true;
    };

    this.patchId.onValueChanged=function()
    {
        Ops.Ui.Patch.maxPatchId=Math.max(Ops.Ui.Patch.maxPatchId,self.patchId.val);
    };

    this.patchId.val=Ops.Ui.Patch.maxPatchId+1;


    this.onCreate=function()
    {
        if(!hasDynamicPort())getNewDynamicPort('dyn');
        getSubPatchInputOp();

        if (CABLES.UI) gui.patch().updateSubPatches();
    };

    this.onDelete=function()
    {
        for (var i = 0; i < self.patch.ops.length; i++)
            if(self.patch.ops[i].uiAttribs && self.patch.ops[i].uiAttribs.subPatch==self.patchId.val)
                self.patch.deleteOp(self.patch.ops[i].id);
    };


};
Ops.Ui.Patch.maxPatchId=0;

Ops.Ui.Patch.prototype = new Op();

// -------------------

Ops.Ui.PatchInput = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='PatchInput';

    this.getPatchOp=function()
    {

        // console.log('...'+self.patch.ops.length);
        
        // console.log(self.uiAttribs.subPatch);

        for(var i in self.patch.ops)
        {
            if(self.patch.ops[i].patchId)
            {
                if(self.patch.ops[i].patchId.val==self.uiAttribs.subPatch)
                {
                    // console.log('FOUND PATCHOP' ,self.patch.ops[i].patchId.val );
                    return self.patch.ops[i];
                }
                 
            }

            // if(self.patch.ops[i].uiAttribs && self.patch.ops[i].objName=='Ops.Ui.Patch')
            // {
                            
                            
            //     }
            // }
        }

        console.log('NOT FOUND PATCHOP');


    };



    // this.getPort=function(name)
    // {
    //     for(var ipi in self.portsIn)
    //         if(self.portsIn[ipi].getName()==name)return self.portsIn[ipi];

    //     var p=getNewDynamicPort(name);
        
    //     return p;
    // };

    // this.addOutput=this.addOutPort(new Port(this,"new output",OP_PORT_TYPE_DYNAMIC));
    
    // this.addOutput.shouldLink=function(p1,p2)
    // {
    //     // console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    //     // console.log(p1.getName() );
    //     // console.log(p2.getName() );
        

    //     // // for(var i in self.portsOut)
    //     // // {
    //     // //     if(p2.getName()==self.portsOut[i].getName()) 
    //     // //         {
    //     // //             // found=true;
    //     // //             return true;
    //     // //         }
    //     // // }

    //     // theP=p2;
    //     // if(p1.type==OP_PORT_TYPE_DYNAMIC) theP=p1;

    //     // var pOut=self.addOutPort(new Port(self,"new output"+inPorts.length,theP.type));





    //     //     if(p2.getName()==self.portsOut[i].getName())
    //     //     {

    //     // console.log(self.portsOut[i].getName());
    //     // console.log(p1.getName());
    //     // console.log(p2.getName());
    //     // console.log('---', self.portsOut[i].getName());

    //     // console.log(p1.type);
    //     // console.log(self.portsOut[i].type);
        

    //     //         self.patch.link(p1.parent,p1.getName(),self,self.portsOut[i].getName());
    //     //     }

    //     //     // if(p2.getName()==self.portsOut[i].getName())
    //     //     // {
    //     //     //     self.patch.link(self,self.portsOut[i].getName(),p1.parent,p1.getName());
    //     //     // }

            
    //     // }


    //     console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //     console.log('p1',p1);

    //     return true;
    // };

};

Ops.Ui.PatchInput.prototype = new Op();

// -------------------

Ops.Ui.PatchOutput = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='PatchOutput';
    this.patchOutput=this.addInPort(new Port(this,"out"));
};

Ops.Ui.PatchOutput.prototype = new Op();





// --------------------------------------------------------------------------

Ops.Gl.Matrix.WASDCamera = function()
{
    Op.apply(this, arguments);
    var self=this;

    var DEG2RAD=3.14159/180.0;


    this.name='WASDCamera';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.isLocked=this.addOutPort(new Port(this,"isLocked",OP_PORT_TYPE_VALUE));
    this.isLocked.val=false;

    var vPos=vec3.create();

    // var posX=0,posZ=0,posY=0;
    // var rotX=0,rotY=0,rotZ=0;
    var speedx=0,speedy=0,speedz=0;

    var movementSpeedFactor = 0.5;

    this.posX=this.addInPort(new Port(this,"posX",OP_PORT_TYPE_VALUE));
    this.posY=this.addInPort(new Port(this,"posY",OP_PORT_TYPE_VALUE));
    this.posZ=this.addInPort(new Port(this,"posZ",OP_PORT_TYPE_VALUE));

    this.rotX=this.addInPort(new Port(this,"rotX",OP_PORT_TYPE_VALUE));
    this.rotY=this.addInPort(new Port(this,"rotY",OP_PORT_TYPE_VALUE));

    this.outPosX=this.addOutPort(new Port(this,"posX",OP_PORT_TYPE_VALUE));
    this.outPosY=this.addOutPort(new Port(this,"posY",OP_PORT_TYPE_VALUE));
    this.outPosZ=this.addOutPort(new Port(this,"posZ",OP_PORT_TYPE_VALUE));
    self.outPosX.val=-self.posX.val;
    self.outPosY.val=-self.posY.val;
    self.outPosZ.val=-self.posZ.val;

    var viewMatrix = mat4.create();


    this.render.onTriggered=function()
    {
        calcCameraMovement();
        move();

        if(speedx!==0.0 || speedy!==0.0 || speedz!==0)
        {
            self.outPosX.val=-self.posX.val;
            self.outPosY.val=-self.posY.val;
            self.outPosZ.val=-self.posZ.val;
        }

        cgl.pushMvMatrix();

        vec3.set(vPos, -self.posX.val,-self.posY.val,-self.posZ.val);

        mat4.rotateX( cgl.mvMatrix ,cgl.mvMatrix,DEG2RAD*self.rotX.val);
        mat4.rotateY( cgl.mvMatrix ,cgl.mvMatrix,DEG2RAD*self.rotY.val);
        mat4.translate( cgl.mvMatrix ,cgl.mvMatrix,vPos);

        
        self.trigger.trigger();
        cgl.popMvMatrix();
    };

    //--------------

    function calcCameraMovement()
    {
        var camMovementXComponent = 0.0,
            camMovementYComponent = 0.0,
            camMovementZComponent = 0.0,
            pitchFactor=0,
            yawFactor=0;

        if (pressedW)
        {
            // Control X-Axis movement
            pitchFactor = Math.cos(DEG2RAD*self.rotX.val);
                    
            camMovementXComponent += ( movementSpeedFactor * (Math.sin(DEG2RAD*self.rotY.val)) ) * pitchFactor;

            // Control Y-Axis movement
            camMovementYComponent += movementSpeedFactor * (Math.sin(DEG2RAD*self.rotX.val)) * -1.0;

            // Control Z-Axis movement
            yawFactor = (Math.cos(DEG2RAD*self.rotX.val));
            camMovementZComponent += ( movementSpeedFactor * (Math.cos(DEG2RAD*self.rotY.val)) * -1.0 ) * yawFactor;
        }

        if (pressedS)
        {
            // Control X-Axis movement
            pitchFactor = Math.cos(DEG2RAD*self.rotX.val);
            camMovementXComponent += ( movementSpeedFactor * (Math.sin(DEG2RAD*self.rotY.val)) * -1.0) * pitchFactor;

            // Control Y-Axis movement
            camMovementYComponent += movementSpeedFactor * (Math.sin(DEG2RAD*self.rotX.val));

            // Control Z-Axis movement
            yawFactor = (Math.cos(DEG2RAD*self.rotX.val));
            camMovementZComponent += ( movementSpeedFactor * (Math.cos(DEG2RAD*self.rotY.val)) ) * yawFactor;
        }

        if (pressedA)
        {
            // Calculate our Y-Axis rotation in radians once here because we use it twice
            var yRotRad = DEG2RAD*self.rotY.val;

            camMovementXComponent += -movementSpeedFactor * (Math.cos(yRotRad));
            camMovementZComponent += -movementSpeedFactor * (Math.sin(yRotRad));
        }

        if (pressedD)
        {
            // Calculate our Y-Axis rotation in radians once here because we use it twice
            var yRotRad = DEG2RAD*self.rotY.val;

            camMovementXComponent += movementSpeedFactor * (Math.cos(yRotRad));
            camMovementZComponent += movementSpeedFactor * (Math.sin(yRotRad));
        }

        speedx = camMovementXComponent;
        speedy = camMovementYComponent;
        speedz = camMovementZComponent;

        if (speedx > movementSpeedFactor) speedx = movementSpeedFactor;
        if (speedx < -movementSpeedFactor) speedx = -movementSpeedFactor;

        if (speedy > movementSpeedFactor) speedy = movementSpeedFactor;
        if (speedy < -movementSpeedFactor) speedy = -movementSpeedFactor;

        if (speedz > movementSpeedFactor) speedz = movementSpeedFactor;
        if (speedz < -movementSpeedFactor) speedz = -movementSpeedFactor;
    }

    function moveCallback(e)
    {
        var mouseSensitivity=0.1;
        self.rotX.val+=e.movementY*mouseSensitivity;
        self.rotY.val+=e.movementX*mouseSensitivity;

        if (self.rotX.val < -90.0) self.rotX.val = -90.0;
        if (self.rotX.val > 90.0) self.rotX.val = 90.0;
        if (self.rotY.val < -180.0) self.rotY.val += 360.0;
        if (self.rotY.val > 180.0) self.rotY.val -= 360.0;
    }

    var canvas = document.getElementById("glcanvas");

     function lockChangeCallback(e)
     {
        if (document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas ||
                document.webkitPointerLockElement === canvas)
        {
            document.addEventListener("mousemove", moveCallback, false);
            document.addEventListener("keydown", keyDown, false);
            document.addEventListener("keyup", keyUp, false);
            console.log('lock start');
            // isLocked=true;
            self.isLocked.val=true;

        }
        else
        {
            document.removeEventListener("mousemove", moveCallback, false);
            document.removeEventListener("keydown", keyDown, false);
            document.removeEventListener("keyup", keyUp, false);
            // isLocked=false;
            self.isLocked.val=false;
            pressedW=false;
            pressedA=false;
            pressedS=false;
            pressedD=false;

            console.log('lock exit');
        }
    }
       
    document.addEventListener('pointerlockchange', lockChangeCallback, false);
    document.addEventListener('mozpointerlockchange', lockChangeCallback, false);
    document.addEventListener('webkitpointerlockchange', lockChangeCallback, false);

    document.getElementById('glcanvas').addEventListener('mousedown',function()
    {
        document.addEventListener("mousemove", moveCallback, false);
        canvas.requestPointerLock = canvas.requestPointerLock ||
                                    canvas.mozRequestPointerLock ||
                                    canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();

    });

    var lastMove=0;
    function move()
    {
        var timeOffset = window.performance.now()-lastMove;

        self.posX.val+=speedx;
        self.posY.val+=speedy;
        self.posZ.val+=speedz;

        lastMove = window.performance.now();
    }

    var pressedW=false;
    var pressedA=false;
    var pressedS=false;
    var pressedD=false;

    function keyDown(e)
    {
        switch(e.which)
        {
            case 87:
                pressedW=true;
            break;
            case 65:
                pressedA=true;
            break;
            case 83:
                pressedS=true;
            break;
            case 68:
                pressedD=true;
            break;

            default:
                console.log('key:',e.which);
            break;
        }
    }

    function keyUp(e)
    {
        console.log('key');
                
        switch(e.which)
        {
            case 87:
                pressedW=false;
            break;
            case 65:
                pressedA=false;
            break;
            case 83:
                pressedS=false;
            break;
            case 68:
                pressedD=false;
            break;
        }
    }


};

Ops.Gl.Matrix.WASDCamera.prototype = new Op();


// --------------------------------------------------------------------------
