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
    this.v=this.addInPort(new Port(this,"value",OP_PORT_TYPE_VALUE));

    this.result=this.addOutPort(new Port(this,"result"));

    function frame(time)
    {
        self.updateAnims();
        self.exec();
    }

    this.v.onAnimToggle=function()
    {
        if(self.v.isAnimated()) self.onAnimFrame=frame;
        else self.onAnimFrame=function(){};
    };

    this.exec=function()
    {

        self.result.val=self.v.val;
    };

    this.v.onValueChanged=this.exec;
    this.onAnimFrame=function(){};
};

Ops.Value.prototype = new Op();

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
        // console.log(''+self.patch.timer.getTime() );

        self.patch.timer.setDelay(self.delay.val);
        this.theTime.val=self.patch.timer.getTime();
        self.trigger.call();
        self.patch.timer.setDelay(0);

    };

};
Ops.TimeLineDelay.prototype = new Op();


// ---------------------------------------------------------------------------

Ops.TimeLineOverwrite = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='TimeLineOverwrite';
    this.exe=this.addInPort(new Port(this,"exe",OP_PORT_TYPE_FUNCTION));

    this.theTime=this.addOutPort(new Port(this,"time"));
    this.newTime=this.addInPort(new Port(this,"new time"));
    this.newTime.val=0.0;

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var realTime=0;
    this.exe.onTriggered=function()
    {
        realTime=self.patch.timer.getTime();

        self.patch.timer.overwriteTime=self.newTime.val;
        self.trigger.call();
        self.patch.timer.overwriteTime=-1;
        // self.patch.timer.setTime(realTime);

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

        // for(var i=0;i<self.num.value;i++)
        for(var i=self.num.value-1;i>=0;i--)
        {
            self.idx.val=i;
            self.trigger.call();
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
            self.trigger.call();
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
        if(self.bool.val=='true' ||self.bool.val>=1 )
        {
            self.triggerThen.call();
        }
        else
        {
            self.triggerElse.call();
        }
    };

    this.bool.onValueChanged=function()
    {
        self.exe.onTriggered();
    };

};
Ops.IfTrueThen.prototype = new Op();



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
        {
            self.triggers[i].call();
        }

    };


};
Ops.Group.prototype = new Op();




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
            self.trigger.call();
            self.exec();
        },
        this.interval.val );
    };

    this.exec();

};

Ops.Interval.prototype = new Op();

// ---------------------------------------------------------------------------


// --------------------------------------------------------------------------

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
        self.trigger.call();
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





