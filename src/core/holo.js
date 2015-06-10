
var PORT_DIR_IN=0;
var PORT_DIR_OUT=1;

var OP_PORT_TYPE_VALUE =0;
var OP_PORT_TYPE_FUNCTION =1;
var OP_PORT_TYPE_TEXTURE =2;

var Ops = {};


var Op = function()
{
    this.objName='';
    this.portsOut=[];
    this.portsIn=[];
    this.posts=[];
    this.uiAttribs={};
    this.name='unknown';
    this.id=generateUUID();

    this.getName= function()
    {
        return this.name;
    };
    this.addOutPort=function(p)
    {
        p.direction=PORT_DIR_OUT;
        p.parent=this;
        this.portsOut.push(p);
        return p;
    };
    this.addInPort=function(p)
    {
        p.direction=PORT_DIR_IN;
        p.parent=this;
        this.portsIn.push(p);
        return p;
    };
    this.execute=function()
    {
        this.exec();
    };
    this.printInfo=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
            console.log('in: '+this.portsIn[i].getName());

        for(var ipo in this.portsOut)
            console.log('out: '+this.portsOut[ipo].getName());
    };

    this.removeLinks=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
            this.portsIn[i].removeLinks();
        for(var ipo in this.portsOut)
            this.portsOut[ipo].removeLinks();
    };

    this.getPort=function(name)
    {
        for(var ipi in this.portsIn)
            if(this.portsIn[ipi].getName()==name)return this.portsIn[ipi];

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].getName()==name)return this.portsOut[ipo];
    };

    this.getSerialized=function()
    {
        var op={};
        op.name=this.getName();
        op.objName=this.objName;
        op.id=this.id;
        op.uiAttribs=this.uiAttribs;

        op.portsIn=[];
        op.portsOut=[];

        for(var i=0;i<this.portsIn.length;i++)
            op.portsIn.push( this.portsIn[i].getSerialized() );

        for(var ipo in this.portsOut)
            op.portsOut.push( this.portsOut[ipo].getSerialized() );

        return op;
    };

    this.getPortByName=function(name)
    {
        for(var i=0;i<this.portsIn.length;i++)
            if(this.portsIn[i].name==name)return this.portsIn[i];
        
        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].name==name)return this.portsOut[ipo];
    };

};

// ------------------------------------------------------------------------------------

var Port=function(parent,name,type)
{
    var self=this;
    this.direction=PORT_DIR_IN;
    this.id=generateUUID();
    this.parent=parent;
    this.links=[];
    this.value=null;
    this.name=name;
    this.type=type || OP_PORT_TYPE_VALUE;
    var valueBeforeLink=null;

    this.__defineGetter__("val", function()
    {
        return this.value;
    });

    this.__defineSetter__("val", function(v)
    {
        this.setValue(v);
    });

    this.onValueChanged=function(){};
    this.onTriggered=function(){};

    this.setValue=function(v)
    {
        if(v!=this.value)
        {
            this.value=v;
            this.onValueChanged();

            for(var i in this.links)
            {
                this.links[i].setValue();
            }
        }
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addLink=function(l)
    {
        valueBeforeLink=self.value;
        this.links.push(l);
    };

    this.isLinkedTo=function(p2)
    {
        for(var i in this.links)
        {
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)return true;
        }
        return false;
    };

    this.call=function()
    {
        for(var i in this.links)
        {
            if(this.links[i].portIn !=this)this.links[i].portIn.onTriggered();
            if(this.links[i].portOut!=this)this.links[i].portOut.onTriggered();
        }
    };


    this.execute=function()
    {
        console.log('### execute port: '+this.getName() , this.goals.length);
    };

    this.getTypeString=function()
    {
        if(this.type==OP_PORT_TYPE_VALUE)return 'value';
        if(this.type==OP_PORT_TYPE_FUNCTION)return 'function';
        if(this.type==OP_PORT_TYPE_TEXTURE)return 'texture';
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.name=this.getName();
        obj.value=this.value;

        if(this.direction==PORT_DIR_IN && this.links.length>0)
        {
            obj.links=[];
            for(var i in this.links)
            {
                obj.links.push( this.links[i].getSerialized() );
            }
        }
        return obj;
    };

    this.removeLinks=function()
    {
        while(this.links.length>0)
        {
            this.links[0].remove();
        }
    };

    this.removeLink=function(link)
    {
        for(var i in this.links)
        {
            if(this.links[i]==link)this.links.splice( i, 1 );
        }
        self.setValue(valueBeforeLink);
    };
};



// ---------------------------------------------------------------------------

var Link = function(scene)
{
    this.portIn=null;
    this.portOut=null;
    this.scene=scene;

    this.setValue=function()
    {
        if(this.portIn.val!=this.portOut.val)
            this.portIn.val=this.portOut.val;
    };

    this.remove=function()
    {
        this.portIn.removeLink(this);
        this.portOut.removeLink(this);
        this.scene.onUnLink(this.portIn,this.portOut);
        this.portIn=null;
        this.portOut=null;
        this.scene=null;
    };


    this.link=function(p1,p2)
    {
        if(!Link.canLink(p1,p2))
        {
            console.log('cannot link ports!');
            return false;
        }
        if(p1.direction==PORT_DIR_IN)
        {
            this.portIn=p1;
            this.portOut=p2;
        }
        else
        {
            this.portIn=p2;
            this.portOut=p1;
        }

        p1.addLink(this);
        p2.addLink(this);
        this.setValue();
    };

    this.getSerialized=function()
    {
        var obj={};

        obj.portIn=this.portIn.getName();
        obj.portOut=this.portOut.getName();
        obj.objIn=this.portIn.parent.id;
        obj.objOut=this.portOut.parent.id;

        return obj;
    };
};


Link.canLinkText=function(p1,p2)
{
    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return 'input port already busy';
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return 'input port already busy';
    if(p1.isLinkedTo(p2))return 'ports already linked';
    if(!p1)return 'can not link: port 1 invalid';
    if(!p2)return 'can not link: port 2 invalid';
    if(p1.direction==p2.direction)return 'can not link: same direction';
    if(p1.type!=p2.type)return 'can not link: different type';
    if(p1.parent==p2.parent)return 'can not link: same op';
    return 'can link';
};

Link.canLink=function(p1,p2)
{

    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return false;
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return false;
    if(p1.isLinkedTo(p2))return false;
    if(!p1)return false;
    if(!p2)return false;
    if(p1.direction==p2.direction)return false;
    if(p1.type!=p2.type)return false;
    if(p1.parent==p2.parent)return false;

    return true;
};


// ------------------------------------------------------------------------------------


var Scene = function()
{
    var self=this;
    this.ops=[];
    this.timer=new Timer();
    this.animFrameOps=[];
    

    this.clear=function()
    {
        this.timer=new Timer();
        while(this.ops.length>0)
        {
            this.deleteOp(this.ops[0].id);
        }
    };

    this.addOp=function(objName,uiAttribs)
    {
        var op=eval('new '+objName+'();');
        op.objName=objName;
        op.uiAttribs=uiAttribs;

        if(op.hasOwnProperty('onAnimFrame')) this.animFrameOps.push(op);

        this.ops.push(op);
        if(this.onAdd)this.onAdd(op);
        return op;
    };

    this.deleteOp=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)
            {
                this.ops[i].removeLinks();
                this.onDelete(this.ops[i]);
                this.ops.splice( i, 1 );
            }
        }
    };

    this.exec=function()
    {
        requestAnimationFrame(self.exec);
        self.timer.update();

        var time=self.timer.getTime();

        for(var i in self.animFrameOps)
        {
            self.animFrameOps[i].onAnimFrame(time);
        }

    };

    this.link=function(op1,port1Name,op2,port2Name)
    {
        var port1=op1.getPort(port1Name);
        var port2=op2.getPort(port2Name);

        if(Link.canLink(port1,port2))
        {
            var link=new Link(this);
            link.link(port1,port2);
            this.onLink(port1,port2);
            return link;
        }
        else
        {
            console.log(Link.canLinkText(port1,port2));
        }
    };
    this.onAdd=function(op){};
    this.onDelete=function(op){};
    this.onLink=function(p1,p2){};
    this.onUnLink=function(p1,p2){};
    this.serialize=function()
    {
        var obj={};

        obj.ops=[];
        for(var i in this.ops)
        {
            obj.ops.push( this.ops[i].getSerialized() );
        }
        
        return JSON.stringify(obj);
    };
    this.getOpById=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)return this.ops[i];
        }

    };
    this.deSerialize=function(obj)
    {
        if (typeof obj === "string") obj=JSON.parse(obj);
        var self=this;

        function addLink(opinid,opoutid,inName,outName)
        {
            var found=false;
            if(!found)
            {
                self.link(
                    self.getOpById(opinid),
                    inName,
                    self.getOpById(opoutid),
                    outName
                    );
            }
        }

        // add ops...
        for(var iop in obj.ops)
        {
            var op=this.addOp(obj.ops[iop].objName,obj.ops[iop].uiAttribs);
            op.id=obj.ops[iop].id;

            for(var ipi in obj.ops[iop].portsIn)
            {
                var port=op.getPortByName(obj.ops[iop].portsIn[ipi].name);
                if(port && port.type!=OP_PORT_TYPE_TEXTURE)port.val=obj.ops[iop].portsIn[ipi].value;
            }

            for(var ipo in obj.ops[iop].portsOut)
            {
                var port2=op.getPortByName(obj.ops[iop].portsOut[ipo].name);
                if(port2&& port2.type!=OP_PORT_TYPE_TEXTURE)port2.val=obj.ops[iop].portsOut[ipo].value;
            }


            // op.uiAttribs=obj.ops[iop].uiAttribs;
        }

        // create links...
        for(iop in obj.ops)
        {
            for(var ipi2 in obj.ops[iop].portsIn)
            {

                for(var ili in obj.ops[iop].portsIn[ipi2].links)
                {
                    addLink(
                        obj.ops[iop].portsIn[ipi2].links[ili].objIn,
                        obj.ops[iop].portsIn[ipi2].links[ili].objOut,
                        obj.ops[iop].portsIn[ipi2].links[ili].portIn,
                        obj.ops[iop].portsIn[ipi2].links[ili].portOut);
                }
            }


            // for(var ipo in obj.ops[iop].portsOut)
            // {
            //     for(var ili in obj.ops[iop].portsOut[ipo].links)
            //     {
            //         addLink(
            //             obj.ops[iop].portsOut[ipo].links[ili].objIn,
            //             obj.ops[iop].portsOut[ipo].links[ili].objOut,
            //             obj.ops[iop].portsOut[ipo].links[ili].portIn,
            //             obj.ops[iop].portsOut[ipo].links[ili].portOut);

            //     }
            // }
        }


        for(var i in this.ops)
        {
            this.ops[i].id=generateUUID();
        }



    };

    this.exec();

};




