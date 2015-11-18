
var OP_PORT_TYPE_VALUE =0;
var OP_PORT_TYPE_FUNCTION =1;
var OP_PORT_TYPE_OBJECT =2;
var OP_PORT_TYPE_TEXTURE =2;
var OP_PORT_TYPE_ARRAY =3;
var OP_PORT_TYPE_DYNAMIC=4;

var Ops = {};
var CABLES=CABLES || {};

CABLES.Op = function()
{
    this.objName='';
    this.portsOut=[];
    this.portsIn=[];
    this.posts=[];
    this.uiAttribs={};
    this.enabled=true;
    this.patch=arguments[0];
    this.name=arguments[1] || 'unknown';
    this.id=generateUUID();
    this.onAddPort=null;
    this.onCreate=null;
    this.onResize=null;
    this.onLoaded=null;
    this.onDelete=null;
    this.onUiAttrChange=null;
    var _self=this;

    this.uiAttr=function(newAttribs)
    {
        if(!this.uiAttribs)this.uiAttribs={};
        for(var p in newAttribs)
        {
            this.uiAttribs[p]=newAttribs[p];
        }
        if(this.onUiAttrChange) this.onUiAttrChange();
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addOutPort=function(p)
    {
        p.direction=PORT_DIR_OUT;
        p.parent=this;
        this.portsOut.push(p);
        if(this.onAddPort)this.onAddPort(p);
        return p;
    };

    this.hasPort=function(name)
    {
        for(var i in this.portsIn)
        {
            if(this.portsIn[i].getName()==name)
            {
                return true;
            }
        }
        return false;
    };

    this.addInPort=function(p)
    {
        p.direction=PORT_DIR_IN;
        p.parent=this;
        this.portsIn.push(p);
        if(this.onAddPort)this.onAddPort(p);
        return p;
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


    this.findFittingPort=function(otherPort)
    {
        for(var ipo in this.portsOut)
            if(Link.canLink(otherPort,this.portsOut[ipo]))return this.portsOut[ipo];

        for(var ipi in this.portsIn)
            if(Link.canLink(otherPort,this.portsIn[ipi]))return this.portsIn[ipi];
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
        {
            if(this.portsIn[i].type!=OP_PORT_TYPE_DYNAMIC)
            op.portsIn.push( this.portsIn[i].getSerialized() );
        }

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].type!=OP_PORT_TYPE_DYNAMIC)
                op.portsOut.push( this.portsOut[ipo].getSerialized() );

        return op;
    };

    this.getFistOutPortByType=function(type)
    {
        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].type==type)return this.portsOut[ipo];
    };

    this.getPortByName=function(name)
    {
        for(var ipi in this.portsIn)
            if(this.portsIn[ipi].getName()==name)return this.portsIn[ipi];

        for(var ipo in this.portsOut)
            if(this.portsOut[ipo].getName()==name)return this.portsOut[ipo];
    };

    this.getPort=function(name)
    {
        return this.getPortByName(name);
    };

    this.updateAnims=function()
    {
        for(var i=0;i<this.portsIn.length;i++)
        {
            this.portsIn[i].updateAnim();
        }
    };

    this.log=function(txt)
    {
        if(!this.patch.silent) console.log('['+(this.getName())+'] '+txt);
    };

};

var Op=CABLES.Op; // deprecated!
