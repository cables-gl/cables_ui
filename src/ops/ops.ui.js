
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
    this.patchId=this.addInPort(new Port(this,"title"));
    
    this.patchId.onValueChanged=function()
    {
        Ops.Ui.Patch.maxPatchId=Math.max(Ops.Ui.Patch.maxPatchId,self.patchId.val);
        console.log('max patch id ',Ops.Ui.Patch.maxPatchId);
    };

    this.patchId.val=Ops.Ui.Patch.maxPatchId+1;

};
Ops.Ui.Patch.maxPatchId=0;

Ops.Ui.Patch.prototype = new Op();

