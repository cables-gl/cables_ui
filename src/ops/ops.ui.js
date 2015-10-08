
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
    this.patchId=this.addInPort(new Port(this,"patchId",OP_PORT_TYPE_VALUE,{ display:'readonly' }));


    var hasDynamicPort=function()
    {


        for(var i in self.portsIn)
        {
            if(self.portsIn[i].type==OP_PORT_TYPE_DYNAMIC)
            {
                        // console.log('hasDynamicPort');
                return true;
            }
            if(self.portsIn[i].getName()=='dyn')
            {
                // console.log('hasDynamicPort');
                return true;
            }

        }
                
        return false;
    };

    var getNewDynamicPort=function(name)
    {

        for(var i in this.portsIn)
        {
            if(this.portsIn[i].type==OP_PORT_TYPE_DYNAMIC)
            {
                this.portsIn[i].name=name;
                // console.log('found dyn port, change name...');
                        
                return this.portsIn[i];
            }
        }

        var p=self.addInPort(new Port(self,name,OP_PORT_TYPE_DYNAMIC));
        p.shouldLink=self.shouldLink;
        return p;
    };

    this.getPort=function(name)
    {
        for(var ipi in self.portsIn)
        {
            if(self.portsIn[ipi].getName()==name)
            {
                // console.log('found existing port with name');
                return self.portsIn[ipi];
            }
        }

        var p=getNewDynamicPort(name);
        
        return p;
    };

    var getSubPatchInputOp=function()
    {
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

        return patchInputOP;
    };

    this.shouldLink=function(p1,p2)
    {
        if(p1.type!=OP_PORT_TYPE_DYNAMIC && p2.type!=OP_PORT_TYPE_DYNAMIC) return true;

        // console.log('shouldlink');
        // console.log('p1 p2',p1.getName(),p2.getName());

        var dynPort=p2;
        var otherPort=p1;

        if(p1.type==OP_PORT_TYPE_DYNAMIC)
        {
            dynPort=p1;
            otherPort=p2;
        }

        dynPort.type=otherPort.type;
        dynPort.name='in_'+otherPort.getName();

        var patchInputOP=getSubPatchInputOp();
        var pOut=patchInputOP.addOutPort(new Port(self,"out_"+otherPort.getName(),dynPort.type));

        if(dynPort.type==OP_PORT_TYPE_FUNCTION)
        {
            dynPort.onTriggered=function()
            {
                pOut.trigger();
            };
            dynPort.onTriggered();
        }
        else
        {
            dynPort.onValueChanged=function()
            {
                pOut.val=dynPort.val;
            };
            dynPort.onValueChanged();
        }

        if (CABLES.UI)gui.patch().updateSubPatches();
        if(!hasDynamicPort())getNewDynamicPort('dyn');



        // console.log('port list');
        // for(var i in self.portsIn)
        // {
        //     console.log(' ',self.portsIn[i].getName(),self.portsIn[i].type);
        // }
        // console.log('  ',self.portsIn.length+' ports');
        

        return true;
    };

    this.patchId.onValueChanged=function()
    {
        Ops.Ui.Patch.maxPatchId=Math.max(Ops.Ui.Patch.maxPatchId,self.patchId.val);
    };

    this.patchId.val=Ops.Ui.Patch.maxPatchId+1;

    this.onCreate=function()
    {
        if(!hasDynamicPort())getNewDynamicPort('dyn');
        getSubPatchInputOp();

        if (CABLES.UI) gui.patch().updateSubPatches();

    };

    this.onDelete=function()
    {
        for (var i = 0; i < self.patch.ops.length; i++)
            if(self.patch.ops[i].uiAttribs && self.patch.ops[i].uiAttribs.subPatch==self.patchId.val)
                self.patch.deleteOp(self.patch.ops[i].id);
    };


};
Ops.Ui.Patch.maxPatchId=0;

Ops.Ui.Patch.prototype = new Op();

// -------------------

Ops.Ui.PatchInput = function()
{
    var self=this;
    Op.apply(this, arguments);

    this.name='PatchInput';

    this.getPatchOp=function()
    {

        // console.log('...'+self.patch.ops.length);
        
        // console.log(self.uiAttribs.subPatch);

        for(var i in self.patch.ops)
        {
            if(self.patch.ops[i].patchId)
            {
                if(self.patch.ops[i].patchId.val==self.uiAttribs.subPatch)
                {
                    // console.log('FOUND PATCHOP' ,self.patch.ops[i].patchId.val );
                    return self.patch.ops[i];
                }
                 
            }

            // if(self.patch.ops[i].uiAttribs && self.patch.ops[i].objName=='Ops.Ui.Patch')
            // {
                            
                            
            //     }
            // }
        }

        console.log('NOT FOUND PATCHOP');


    };



    // this.getPort=function(name)
    // {
    //     for(var ipi in self.portsIn)
    //         if(self.portsIn[ipi].getName()==name)return self.portsIn[ipi];

    //     var p=getNewDynamicPort(name);
        
    //     return p;
    // };

    // this.addOutput=this.addOutPort(new Port(this,"new output",OP_PORT_TYPE_DYNAMIC));
    
    // this.addOutput.shouldLink=function(p1,p2)
    // {
    //     // console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    //     // console.log(p1.getName() );
    //     // console.log(p2.getName() );
        

    //     // // for(var i in self.portsOut)
    //     // // {
    //     // //     if(p2.getName()==self.portsOut[i].getName()) 
    //     // //         {
    //     // //             // found=true;
    //     // //             return true;
    //     // //         }
    //     // // }

    //     // theP=p2;
    //     // if(p1.type==OP_PORT_TYPE_DYNAMIC) theP=p1;

    //     // var pOut=self.addOutPort(new Port(self,"new output"+inPorts.length,theP.type));





    //     //     if(p2.getName()==self.portsOut[i].getName())
    //     //     {

    //     // console.log(self.portsOut[i].getName());
    //     // console.log(p1.getName());
    //     // console.log(p2.getName());
    //     // console.log('---', self.portsOut[i].getName());

    //     // console.log(p1.type);
    //     // console.log(self.portsOut[i].type);
        

    //     //         self.patch.link(p1.parent,p1.getName(),self,self.portsOut[i].getName());
    //     //     }

    //     //     // if(p2.getName()==self.portsOut[i].getName())
    //     //     // {
    //     //     //     self.patch.link(self,self.portsOut[i].getName(),p1.parent,p1.getName());
    //     //     // }

            
    //     // }


    //     console.log('shouldlink!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //     console.log('p1',p1);

    //     return true;
    // };

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


