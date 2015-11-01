
// TODO: CLAMP!

Ops.Math=Ops.Math || {};






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


