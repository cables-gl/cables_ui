
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
