
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
    var inPorts=[];

    this.addInput=this.addInPort(new Port(this,"new input",OP_PORT_TYPE_DYNAMIC));


    this.addInput.shouldLink=function(p1,p2)
    {
        console.log('shouldlink!');
        console.log('p1',p1);
     
        var theP=p1;
        if(p1.type==OP_PORT_TYPE_DYNAMIC) theP=p2;

        var p=self.addInPort(new Port(self,"new input"+inPorts.length,theP.type));
        inPorts.push(p);

        self.patch.link(self,p.getName(),theP.parent,theP.getName());

        var patchInputOP=self.patch.getSubPatchOp(self.patchId.val,'Ops.Ui.PatchInput');

if(patchInputOP)
{
    var pOut=patchInputOP.addOutPort(new Port(self,"new output"+inPorts.length,theP.type));

    if(theP.type==OP_PORT_TYPE_FUNCTION)
    {
        p.onTriggered=function()
        {
            pOut.call();
        };
    }
    else
    {
        p.onValueChanged=function()
        {
            pOut.val=p.val;
        };
    }

}
else
{
    console.log('no patchinput!');

}



                

        return false;
    };

    this.addInput.onValueChanged=function()
    {
        console.log('dynamic link!',this.addInput.links.length);
        console.log(this.addInput.links[0]);

    };


    this.patchId=this.addInPort(new Port(this,"patchId",OP_PORT_TYPE_VALUE,{ display:'readonly' }));


    this.patchId.onValueChanged=function()
    {
        Ops.Ui.Patch.maxPatchId=Math.max(Ops.Ui.Patch.maxPatchId,self.patchId.val);
        console.log('max patch id ',Ops.Ui.Patch.maxPatchId);
    };

    this.patchId.val=Ops.Ui.Patch.maxPatchId+1;

};
Ops.Ui.Patch.maxPatchId=0;

Ops.Ui.Patch.prototype = new Op();

// -------------------

Ops.Ui.PatchInput = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='PatchInput';
    
    

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


