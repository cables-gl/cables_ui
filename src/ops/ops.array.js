

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
        self.value.val=self.array.val[self.index.val];
        // console.log('self.array.val',self.array.val[self.index.val]);
    }

    this.index.onValueChanged=update;
    this.array.onValueChanged=update;
};

Ops.Array.ArrayGetValue.prototype = new Op();


