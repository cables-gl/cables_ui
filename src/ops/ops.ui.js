
Ops = Ops || {};
Ops.Ui = Ops.Ui || {};

// -------------------

Ops.Ui.Patch = function()
{
    var self=this;
    CABLES.Op.apply(this, arguments);

    this.name='Patch';
    this.patchId=this.addInPort(new Port(this,"patchId",OP_PORT_TYPE_VALUE,{ display:'readonly' }));


    var hasDynamicPort=function()
    {
        for(var i in self.portsIn)
            if(self.portsIn[i].type==OP_PORT_TYPE_DYNAMIC) return true;
            if(self.portsIn[i].getName()=='dyn') return true;

        return false;
    };

    var getNewDynamicPort=function(name)
    {

        for(var i in this.portsIn)
        {
            if(this.portsIn[i].type==OP_PORT_TYPE_DYNAMIC)
            {
                this.portsIn[i].name=name;
                return this.portsIn[i];
            }
        }

        var p=self.addInPort(new Port(self,name,OP_PORT_TYPE_DYNAMIC));
        p.shouldLink=self.shouldLink;
        return p;
    };


    var hasPort=function(name)
    {
        for(var ipi in self.portsIn)
        {
            if(self.portsIn[ipi].getName()==name)
            {
                return self.portsIn[ipi];
            }
        }
        return null;
    };


    this.getPort=function(name)
    {
        for(var ipi in self.portsIn)
        {
            if(self.portsIn[ipi].getName()==name)
            {
                return self.portsIn[ipi];
            }
        }

        for(var ipo in self.portsOut)
        {
            if(self.portsOut[ipo].getName()==name)
            {
                return self.portsOut[ipo];
            }
        }

        console.log('create new dyn port...??',name);


        var p=getNewDynamicPort(name);

        var realName=name;
        if(name.startsWith('in_'))
        {
            realName=name.substr(3);
            createPatchInputPort(p,realName);
        }

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

    this.routeLink=function(link)
    {
        var mainName=link.portOut.getName();
        var newDyn=getNewDynamicPort( 'in_'+mainName );

        var otherOpOut=link.portOut.parent;
        var otherPortOut=link.portOut;

        var otherOpIn=link.portIn.parent;
        var otherPortIn=link.portIn;

        newDyn.type=otherPortOut.type;

        link.remove();

        if(!CABLES.Link.canLink(otherPortOut,newDyn))
        {
            console.log('cannot route link');
            return;
        }

        var l1=gui.scene().link(
            otherOpOut,
            otherPortOut.getName(),
            this,
            newDyn.name
            );

        var pOutPort=createPatchInputPort(newDyn,mainName);

        var l2=gui.scene().link(
            otherOpIn,
            otherPortIn.getName(),
            pOutPort.parent,
            pOutPort.name
            );

        // if(!hasDynamicPort())getNewDynamicPort('dyn');

    };

    function createPatchInputPort(dynPort,name)
    {
        var patchInputOP=getSubPatchInputOp();

        patchInputOP.uiAttribs.translate={x:self.uiAttribs.translate.x,y:self.uiAttribs.translate.y-100};

        var pOut=patchInputOP.getPortByName('out_'+name);

        if(pOut)
        {
            pOut.type=dynPort.type;
        }
        else
        {
            pOut = patchInputOP.addOutPort(new Port(self,"out_"+name,dynPort.type));
        }

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

        return pOut;
    }

    this.shouldLink=function(p1,p2)
    {
        if(p1.type!=OP_PORT_TYPE_DYNAMIC && p2.type!=OP_PORT_TYPE_DYNAMIC)
        {
            console.log('shouldlink?');
            console.log(p1.name);
            console.log(p2.name);
            return true;
        }

        var dynPort=p2;
        var otherPort=p1;

        if(p1.type==OP_PORT_TYPE_DYNAMIC)
        {
            dynPort=p1;
            otherPort=p2;
        }

        dynPort.type=otherPort.type;
        dynPort.name='in_'+otherPort.getName();

        createPatchInputPort(dynPort,otherPort.getName());

        if(CABLES.UI)gui.patch().updateSubPatches();
        if(!hasDynamicPort())getNewDynamicPort('dyn');

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

Ops.Ui.Patch.prototype = new CABLES.Op();

// -------------------

Ops.Ui.PatchInput = function()
{
    var self=this;
    CABLES.Op.apply(this, arguments);

    this.name='PatchInput';

    this.getPatchOp=function()
    {
        for(var i in self.patch.ops)
        {
            if(self.patch.ops[i].patchId)
            {
                if(self.patch.ops[i].patchId.val==self.uiAttribs.subPatch)
                {
                    return self.patch.ops[i];
                }
            }
        }
    };

};

Ops.Ui.PatchInput.prototype = new CABLES.Op();

// -------------------

Ops.Ui.PatchOutput = function()
{
    var self=this;
    CABLES.Op.apply(this, arguments);

    this.name='PatchOutput';
    this.patchOutput=this.addInPort(new Port(this,"out"));
};

Ops.Ui.PatchOutput.prototype = new CABLES.Op();
