
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
        self.result.set( parseFloat(self.number1.get())+parseFloat(self.number2.get()) );
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

    this.exec= function()
    {
        self.updateAnims();
        self.result.val=parseFloat(self.number1.val)-parseFloat(self.number2.val);
    };

    this.number1.onValueChanged=this.exec;
    this.number2.onValueChanged=this.exec;

    this.number1.val=1;
    this.number2.val=1;
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


