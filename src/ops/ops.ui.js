
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

Ops.Ui.SubPatch = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='SubPatch';
    this.title=this.addInPort(new Port(this,"title"));
    this.text=this.addInPort(new Port(this,"text"));

};

Ops.Ui.SubPatch.prototype = new Op();

