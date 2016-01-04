
Ops.Anim=Ops.Anim || {};



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
