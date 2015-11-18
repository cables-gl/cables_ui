// https://github.com/automat/foam-gl
// http://howlerjs.com/
//http://learningwebgl.com/lessons/lesson01/index.html


// ---------------------------------------------------------------------------

Ops.Value = function()
{
    CABLES.Op.apply(this, arguments);
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
        if(self.result.get()!=self.v.get()) self.result.set(self.v.get());
    };

    this.exe.onTriggered=this.exec;
    this.v.onValueChanged=this.exec;
};

Ops.Value.prototype = new CABLES.Op();


// ---------------------------------------------------------------------------

Ops.Value2d = function()
{
    CABLES.Op.apply(this, arguments);
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
        if(self.resultX.get()!=self.x.get()) self.resultX.sewt(self.x.get());
        if(self.resultY.get()!=self.y.get()) self.resultY.sewt(self.y.get());
    };

    this.exe.onTriggered=this.exec;

    this.x.onValueChanged=this.exec;
    this.y.onValueChanged=this.exec;
    // this.onAnimFrame=function(){};
};

Ops.Value2d.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------

Ops.Value3d = function()
{
    CABLES.Op.apply(this, arguments);
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
        if(self.resultX.get()!=self.x.get()) self.resultX.set(self.x.get());
        if(self.resultY.get()!=self.y.get()) self.resultY.set(self.y.get());
        if(self.resultZ.get()!=self.z.get()) self.resultZ.set(self.z.get());
    };

    this.exe.onTriggered=this.exec;

    this.x.onValueChanged=this.exec;
    this.y.onValueChanged=this.exec;
    this.z.onValueChanged=this.exec;
};

Ops.Value3d.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------

Ops.ColorValue = function()
{
    CABLES.Op.apply(this, arguments);
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

Ops.ColorValue.prototype = new CABLES.Op();


// ---------------------------------------------------------------------------

Ops.TimeLineDelayFrames = function()
{
    CABLES.Op.apply(this, arguments);
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
Ops.TimeLineDelayFrames.prototype = new CABLES.Op();



// ---------------------------------------------------------------------------

Ops.IfBetweenThen = function()
{
    CABLES.Op.apply(this, arguments);
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

Ops.IfBetweenThen.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------

Ops.ToggleBool = function()
{
    CABLES.Op.apply(this, arguments);
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

Ops.ToggleBool.prototype = new CABLES.Op();


// ---------------------------------------------------------------------------

Ops.TimedSequence = function()
{
    CABLES.Op.apply(this, arguments);
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
        var spl=0;
        if(window.gui)
        {

            if(self.current.val!=lastUiValue)
            {
                lastUiValue=parseInt(self.current.val,10);
                for(spl=0;spl<triggers.length;spl++)
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
                for(spl=0;spl<triggers[i].links.length;spl++)
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
Ops.TimedSequence.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------


Ops.Anim=Ops.Anim || {};

// --------------------------------------------------------------------------

Ops.Anim.Frequency = function()
{
    CABLES.Op.apply(this, arguments);

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

Ops.Anim.Frequency.prototype = new CABLES.Op();

// --------------------------------------------------------------------------

Ops.Anim.TimeDiff = function()
{
    CABLES.Op.apply(this, arguments);

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

Ops.Anim.TimeDiff.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------

var cableVars={};

Ops.Anim.Variable = function()
{
    var self=this;
    CABLES.Op.apply(this, arguments);

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

Ops.Anim.Variable.prototype = new CABLES.Op();

// ---------------------------------------------------------------------------
