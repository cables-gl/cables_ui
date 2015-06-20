
Ops.Json=Ops.Json || {};


Ops.Json.jsonValue = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='jsonValue';
    this.data=this.addInPort(new Port(this,"data"),OP_PORT_TYPE_OBJECT);
    this.key=this.addInPort(new Port(this,"key"));
    this.result=this.addOutPort(new Port(this,"result"));

    this.data.onValueChanged=function()
    {
        self.result.val=self.data.val[self.key.val];
    };

};

Ops.Json.jsonValue.prototype = new Op();

// -------------------------------------------------------------
