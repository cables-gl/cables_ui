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

    this.v.onAnimToggle=function()
    {
        // console.log('animtoggle');
        
        // if(self.v.isAnimated() )
        // {
        //     // if(!self.onAnimFrame) self.patch.animFrameOps.push(op);
        //     self.onAnimFrame=frame;
        // }
        // else self.onAnimFrame=function(){};
    };

    this.exec=function()
    {
        if(self.result.val!=self.v.val) self.result.val=self.v.val;
    };

    this.exe.onTriggered=this.exec;

    this.v.onValueChanged=this.exec;
    this.onAnimFrame=function(){};
};

Ops.Value.prototype = new Op();

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
        for(var i=self.num.value-1;i>-1;i--)
        {
            self.idx.val=i;
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
        if(self.number.val>=self.min.val && self.number.val<self.max.val) self.triggerThen.trigger();
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

    this.exe.onTriggered=function(_time)
    {
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
    this.string1=this.addInPort(new Port(this,"string1"));
    this.string2=this.addInPort(new Port(this,"string2"));

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

    var identTranslate=vec3.create();
    vec3.set(identTranslate, 0,0,-2);

    var preRenderAnimFrame=function(time)
    {
        self.patch.timer.setTime(preRenderTime);
        self.finished.trigger();
        cgl.gl.flush();

        Ops.Gl.Renderer.renderStart(identTranslate);

        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        self.loading.trigger();
        console.log('pre anim');
        
        Ops.Gl.Renderer.renderEnd();
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
            self.patch.timer.setTime(0);
            self.patch.timer.pause();
            setTimeout(function()
            {
                console.log('finished prerendering');

                self.onAnimFrame=function(){};
                
                self.patch.timer.setTime(0);
                self.patch.timer.play();
                self.patch.timer.setTime(0);
                CGL.decrementLoadingAssets();
                finishedLoading=true;
            },80);
        }
        else
            setTimeout(checkPreRender,30);

    }

    this.exe.onTriggered= function()
    {
        self.result.val=CGL.getLoadingStatus();
        self.numAssets.val=CGL.numMaxLoadingAssets;

        if(finishedLoading) self.finished.trigger();
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

                if(this.onAnimFrame!=preRenderAnimFrame)
                {
                    self.onAnimFrame=preRenderAnimFrame;
                }
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

