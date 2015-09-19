
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
    this.patchId=this.addInPort(new Port(this,"patchId",OP_PORT_TYPE_VALUE,{ display:'readonly' }));


    this.addInput.shouldLink=function(p1,p2)
    {
        var theP=p1;
        if(p1.type==OP_PORT_TYPE_DYNAMIC) theP=p2;

        var p=self.addInPort(new Port(self,"new input"+inPorts.length,theP.type));
        inPorts.push(p);

        var lIn=self.patch.link(self,p.getName(),theP.parent,theP.getName());

        lIn.getSerialized=function()
        {
            var obj={};

            obj.portIn=self.addInput.getName();
            obj.objIn=self.id;

            obj.portOut=theP.getName();
            obj.objOut=theP.parent.id;

            return obj;
        };




        var patchInputOP=self.patch.getSubPatchOp(self.patchId.val,'Ops.Ui.PatchInput');

        if(!patchInputOP)
        {
            console.log('no patchinput!');
            self.patch.addOp('Ops.Ui.PatchInput',{'subPatch':self.patchId.val} );

            patchInputOP=self.patch.getSubPatchOp(self.patchId.val,'Ops.Ui.PatchInput');

            if(!patchInputOP)
            {
                console.warn('no patchinput2!');
            }
        }

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

        gui.patch().updateSubPatches();

        return false;
    };

    this.addInput.onValueChanged=function()
    {
        console.log('dynamic link!',this.addInput.links.length);
        console.log(this.addInput.links[0]);
    };


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

    this.addOutput=this.addOutPort(new Port(this,"new output",OP_PORT_TYPE_DYNAMIC));
    
    this.addOutput.shouldLink=function(p1,p2)
    {
        // console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        // console.log(p1.getName() );
        // console.log(p2.getName() );
        

        // // for(var i in self.portsOut)
        // // {
        // //     if(p2.getName()==self.portsOut[i].getName()) 
        // //         {
        // //             // found=true;
        // //             return true;
        // //         }
        // // }

        // theP=p2;
        // if(p1.type==OP_PORT_TYPE_DYNAMIC) theP=p1;

        // var pOut=self.addOutPort(new Port(self,"new output"+inPorts.length,theP.type));





        //     if(p2.getName()==self.portsOut[i].getName())
        //     {

        // console.log(self.portsOut[i].getName());
        // console.log(p1.getName());
        // console.log(p2.getName());
        // console.log('---', self.portsOut[i].getName());

        // console.log(p1.type);
        // console.log(self.portsOut[i].type);
        

        //         self.patch.link(p1.parent,p1.getName(),self,self.portsOut[i].getName());
        //     }

        //     // if(p2.getName()==self.portsOut[i].getName())
        //     // {
        //     //     self.patch.link(self,self.portsOut[i].getName(),p1.parent,p1.getName());
        //     // }

            
        // }


        console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('p1',p1);

        return true;
    };

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


