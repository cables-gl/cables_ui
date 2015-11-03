var PORT_DIR_IN=0;
var PORT_DIR_OUT=1;

var OP_PORT_TYPE_VALUE =0;
var OP_PORT_TYPE_FUNCTION =1;
var OP_PORT_TYPE_OBJECT =2;
var OP_PORT_TYPE_TEXTURE =2;
var OP_PORT_TYPE_ARRAY =3;
var OP_PORT_TYPE_DYNAMIC=4;

var Ops = {};

var Op = function(_patch)
{
    this.objName='';
    this.portsOut=[];
    this.portsIn=[];
    this.posts=[];
    this.uiAttribs={};
    this.enabled=true;
    this.patch=_patch;
    this.name='unknown';
    this.id=generateUUID();
    this.onAddPort=null;
    this.onCreate=null;
    this.onResize=null;
    this.onLoaded=null;
    this.onDelete=null;
    this.onUiAttrChange=null;

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


};

// ------------------------------------------------------------------------------------


var Port=function(parent,name,type,uiAttribs)
{
    var self=this;
    this.direction=PORT_DIR_IN;
    this.id=generateUUID();
    this.parent=parent;
    this.links=[];
    this.value=0.0;
    this.name=name;
    this.type=type || OP_PORT_TYPE_VALUE;
    this.uiAttribs=uiAttribs || {};
    var valueBeforeLink=null;
    this.anim=null;
    var animated=false;
    var oldAnimVal=-5711;
    this.onLink=null;
    this.showPreview=false;
    var uiActiveState=true;
    this.ignoreValueSerialize=false;
    this.onLinkChanged=null;

    this.doShowPreview=function(onOff)
    {
        if(onOff!=self.showPreview)
        {
            self.showPreview=onOff;
            self.onPreviewChanged();
        }
    };

    this.onPreviewChanged=function(){};
    this.shouldLink=function(){return true;};


    this.get=function()
    {
        return this.value;
    };

    this.set=function(v)
    {
        this.setValue(v);
    };

    this.__defineGetter__("val", function()
        {
            // throw "deprecated val";
                    
            // if(animated)
            // {

            //     this.value=self.anim.getValue(parent.patch.timer.getTime());

            //     if(oldAnimVal!=this.value)
            //     {
            //         oldAnimVal=this.value;
            //         console.log('changed!!');
            //         this.onValueChanged();
            //     }
            //     oldAnimVal=this.value;
            //     console.log('this.value ',this.value );
                        
            //     return this.value;
            // }

            return this.value;
        });
    this.__defineSetter__("val", function(v){ this.setValue(v); });

    this.getType=function(){ return this.type; };
    this.isLinked=function(){ return this.links.length>0; };
    this.onValueChanged=null;
    this.onTriggered=null;
    this._onTriggered=function()
    {
        parent.updateAnims();
        if(parent.enabled && self.onTriggered) self.onTriggered();
    };

    this.setValue=function(v)
    {
        if(parent.enabled)
        {
            if(v!=this.value || this.type==OP_PORT_TYPE_TEXTURE)
            {
                if(animated)
                {
                    self.anim.setValue(parent.patch.timer.getTime(),v);
                }
                else
                {
                    this.value=v;
                    if(this.onValueChanged)this.onValueChanged();
                }

                // if(this.links.length!==0)
                for (var i = 0; i < this.links.length; ++i)
                {
                    this.links[i].setValue();
                }
            }
        }
    };

    this.updateAnim=function()
    {
        if(animated)
        {
            this.value=self.anim.getValue(parent.patch.timer.getTime());

            if(oldAnimVal!=this.value)
            {
                oldAnimVal=this.value;
                if(this.onValueChanged)this.onValueChanged();
            }
            oldAnimVal=this.value;
        }
    };

    this.isAnimated=function()
    {
        return animated;
    };

    this.getUiActiveState=function()
    {
        return uiActiveState;
    };
    this.setUiActiveState=function(onoff)
    {
        uiActiveState=onoff;
        if(this.onUiActiveStateChange)this.onUiActiveStateChange();
    };

    this.onUiActiveStateChange=null;

    this.onAnimToggle=function(){};
    this._onAnimToggle=function(){this.onAnimToggle();};

    this.setAnimated=function(a)
    {
        if(animated!=a)
        {
            animated=a;
            if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
            this._onAnimToggle();
        }
    };

    this.toggleAnim=function(val)
    {
        animated=!animated;
        if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
        self.setAnimated(animated);
        this._onAnimToggle();
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addLink=function(l)
    {
        if(this.onLinkChanged)this.onLinkChanged();
        valueBeforeLink=self.value;
        this.links.push(l);
    };

    this.removeLinkTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)
                this.links[i].remove();
    };

    this.isLinkedTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)return true;

        return false;
    };

    this.trigger=function()
    {
        if(!parent.enabled)return;
        if(this.links.length===0)return;

        for (var i = 0; i < this.links.length; ++i)
        // for(var i in this.links)
        {
            // if(this.direction==PORT_DIR_OUT)this.links[i].portIn._onTriggered();
            // else
             this.links[i].portIn._onTriggered();
            // if(this.links[i].portIn !=this)
            // else if(this.links[i].portOut!=this)
        }
    };

    this.call=function()
    {
        console.log('call deprecated - use trigger() ');
        this.trigger();
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

        if(!this.ignoreValueSerialize) obj.value=this.value;
            else console.log('ja hier nicht speichern....');

        if(animated) obj.animated=true;
        if(this.anim) obj.anim=this.anim.getSerialized();

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
            this.links[0].remove();
    };

    this.removeLink=function(link)
    {
        if(this.onLinkChanged)this.onLinkChanged();

        for(var i in this.links)
            if(this.links[i]==link)this.links.splice( i, 1 );

        self.setValue(valueBeforeLink);
    };
};

// ---------------------------------------------------------------------------

var Link = function(scene)
{
    this.portIn=null;
    this.portOut=null;
    this.scene=scene;

    this.setValue=function(v)
    {
        this.portIn.val=v;
    };

    this.setValue=function()
    {
        // try
        // if(this.portIn.val!=this.portOut.val)
        //     this.portIn.val=this.portOut.val;

        if(this.portIn.get()!=this.portOut.get())
            this.portIn.set(this.portOut.get());


        // catch(exc)
        // {
        //     console.log('',this);
                    
        //     // console.log('exc',exc);
                    
        // }
    };

    this.getOtherPort=function(p)
    {
        if(p==this.portIn)return this.portOut;
        return this.portIn;
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
        if(p1.onLink) p1.onLink(this);
        if(p2.onLink) p2.onLink(this);
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
    if(p1.direction==p2.direction)
    {
        var txt='(out)';
        if(p2.direction==PORT_DIR_IN)txt="(in)";
        return 'can not link: same direction'+txt;
    }
    if(p1.parent==p2.parent)return 'can not link: same op';
    if( p1.type!=OP_PORT_TYPE_DYNAMIC && p2.type!=OP_PORT_TYPE_DYNAMIC )
    {
        if(p1.type!=p2.type)return 'can not link: different type';
    }
 
    if(!p1)return 'can not link: port 1 invalid';
    if(!p2)return 'can not link: port 2 invalid';

    if(p1.direction==PORT_DIR_IN && p1.isAnimated())return 'can not link: is animated';
    if(p2.direction==PORT_DIR_IN && p2.isAnimated())return 'can not link: is animated';


    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return 'input port already busy';
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return 'input port already busy';
    if(p1.isLinkedTo(p2))return 'ports already linked';


    return 'can link';
};

Link.canLink=function(p1,p2)
{
    if( p1.type==OP_PORT_TYPE_DYNAMIC || p2.type==OP_PORT_TYPE_DYNAMIC )return true;
    if(!p1)return false;
    if(!p2)return false;
    if(p1.direction==PORT_DIR_IN && p1.isAnimated())return false;
    if(p2.direction==PORT_DIR_IN && p2.isAnimated())return false;

    if(p1.direction==PORT_DIR_IN && p1.links.length>0)return false;
    if(p2.direction==PORT_DIR_IN && p2.links.length>0)return false;
    if(p1.isLinkedTo(p2))return false;
    if(p1.direction==p2.direction)return false;
    if(p1.type!=p2.type)return false;
    if(p1.parent==p2.parent)return false;

    return true;
};

// ------------------------------------------------------------------------------------

var Scene = function(cfg)
{
    var self=this;
    this.ops=[];
    this.settings={};
    this.timer=new Timer();
    this.animFrameOps=[];
    this.gui=false;

    this.onLoadStart=null;
    this.onLoadEnd=null;
    this.aborted=false;

    this.config = cfg ||
    {
        glCanvasId:'glcanvas',
        prefixAssetPath:'',
        onError:null
    };

    this.vars={};

    this.cgl=new CGL.State();
    this.cgl.patch=this;
    this.cgl.setCanvas(this.config.glCanvasId);

    if(this.cgl.aborted)
    {
        this.aborted=true;
    }

    this.getFilePath=function(filename)
    {
        return this.config.prefixAssetPath+filename;
    };

    this.clear=function()
    {
        self.animFrameOps.length=0;
        this.timer=new Timer();
        while(this.ops.length>0)
        {
            this.deleteOp(this.ops[0].id);
        }
    };

    this.addOp=function(objName,uiAttribs)
    {
        var parts=objName.split('.');
        var op=null;

        try
        {
            if(parts.length==2) op=new window[parts[0]][parts[1]](this);
            else if(parts.length==3) op=new window[parts[0]][parts[1]][parts[2]](this);
            else if(parts.length==4) op=new window[parts[0]][parts[1]][parts[2]][parts[3]](this);
            else if(parts.length==5) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]](this);
            else console.log('parts.length',parts.length);
        }
        catch(e)
        {
            console.log('instancing error '+objName,e);
            if(CABLES.UI)
            {
                gui.serverOps.showOpInstancingError(objName,e);
            }
            return;
        }

        // var op=new window[objName]();
        op.objName=objName;
        op.patch=this;
        op.uiAttr(uiAttribs);
        if(op.onCreate)op.onCreate();

        if(op.hasOwnProperty('onAnimFrame')) this.animFrameOps.push(op);

        this.ops.push(op);

        if(this.onAdd)this.onAdd(op);
        return op;
    };

    this.removeOnAnimFrame=function(op)
    {
        for(var i=0;i<this.animFrameOps.length;i++)
        {
            this.animFrameOps.splice(i,1);
        }

    };

    this.deleteOp=function(opid,tryRelink)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)
            {
                var op=this.ops[i];
                var reLinkP1=null;
                var reLinkP2=null;

                if(op)
                {
                    if(tryRelink)
                    {
                        if(
                            (this.ops[i].portsIn.length>0 && this.ops[i].portsIn[0].isLinked()) &&
                            (this.ops[i].portsOut.length>0 && this.ops[i].portsOut[0].isLinked()))
                        {
                            if(this.ops[i].portsIn[0].getType()==this.ops[i].portsOut[0].getType())
                            {
                                reLinkP1=this.ops[i].portsIn[0].links[0].getOtherPort(this.ops[i].portsIn[0]);
                                reLinkP2=this.ops[i].portsOut[0].links[0].getOtherPort(this.ops[i].portsOut[0]);
                            }
                        }
                    }

                    this.ops[i].removeLinks();
                    this.onDelete(this.ops[i]);
                    this.ops[i].id=generateUUID();
                    if(this.ops[i].onDelete)this.ops[i].onDelete();
                    this.ops.splice( i, 1 );


                    if(reLinkP1!==null && reLinkP2!==null)
                    {
                        self.link(
                            reLinkP1.parent,
                            reLinkP1.getName(),
                            reLinkP2.parent,
                            reLinkP2.getName()
                            );
                    }
                }
            }
        }
    };

    this.exec=function(e)
    {

        if(CGL.getLoadingStatus()>0 && CGL.getLoadingStatus()<1.0)
        {
            // setTimeout(function()
            // {
                requestAnimationFrame(self.exec);
            // 120);
        }
        else
        {
            requestAnimationFrame(self.exec);
        }
        self.timer.update();

        var time=self.timer.getTime();

        // for(var i in self.animFrameOps)
        for (var i = 0; i < self.animFrameOps.length; ++i)
        {
            self.animFrameOps[i].onAnimFrame(time);
        }
    };

    this.link=function(op1,port1Name,op2,port2Name)
    {
        if(!op1 || !op2)return;
        var port1=op1.getPort(port1Name);
        var port2=op2.getPort(port2Name);

        if(!port1)
        {
            console.warn('port not found! '+port1Name);
            return;
        }
        if(!port2)
        {
            console.warn('port not found! '+port2Name);
            return;
        }

        if(!port1.shouldLink(port1,port2) || !port2.shouldLink(port1,port2))
        {
            return false;
        }

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
    this.serialize=function(asObj)
    {
        var obj={};

        obj.ops=[];
        obj.settings=this.settings;
        for(var i in this.ops)
        {
            obj.ops.push( this.ops[i].getSerialized() );
        }
        
        if(asObj)return obj;
        return JSON.stringify(obj);
    };

    this.getOpById=function(opid)
    {
        for(var i in this.ops)
        {
            if(this.ops[i].id==opid)return this.ops[i];
        }
    };

    this.getSubPatchOp=function(patchId,objName)
    {
        for(var i in self.ops)
        {
            if(self.ops[i].uiAttribs && self.ops[i].uiAttribs.subPatch==patchId && self.ops[i].objName==objName)
            {
                return self.ops[i];
            }
        }

        return false;
    };

    this.deSerialize=function(obj)
    {
        if(this.onLoadStart)this.onLoadStart();


        if (typeof obj === "string") obj=JSON.parse(obj);
        var self=this;

        this.settings=obj.settings;

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

        // console.log('add ops ',self.config.glCanvasId);
        // add ops...
        for(var iop in obj.ops)
        {
            var op=this.addOp(obj.ops[iop].objName,obj.ops[iop].uiAttribs);
            if(!op)continue;
            op.id=obj.ops[iop].id;

            for(var ipi in obj.ops[iop].portsIn)
            {
                var objPort=obj.ops[iop].portsIn[ipi];

                var port=op.getPort(objPort.name);

                if(port && port.type!=OP_PORT_TYPE_TEXTURE)port.val=objPort.value;
                if(objPort.animated)port.setAnimated(objPort.animated);
                if(objPort.anim)
                {
                    if(!port.anim) port.anim=new CABLES.TL.Anim();

                    if(objPort.anim.loop) port.anim.loop=objPort.anim.loop;

                    for(var ani in objPort.anim.keys)
                    {
                        // var o={t:objPort.anim.keys[ani].t,value:objPort.anim.keys[ani].v};
                        port.anim.keys.push(new CABLES.TL.Key(objPort.anim.keys[ani]) );
                    }
                }
            }

            for(var ipo in obj.ops[iop].portsOut)
            {
                var port2=op.getPort(obj.ops[iop].portsOut[ipo].name);
                if(port2&& port2.type!=OP_PORT_TYPE_TEXTURE)port2.val=obj.ops[iop].portsOut[ipo].value;
            }
        }
        // console.log('create links...');
                

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
        }

        // console.log('create uuids ');

        for(var i in this.ops)
        {
            this.ops[i].id=generateUUID();
        }

        if(this.onLoadEnd)this.onLoadEnd();

    };

    this.exec();

};
