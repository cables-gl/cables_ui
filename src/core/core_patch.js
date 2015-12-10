var CABLES=CABLES || {};

CABLES.Patch = function(cfg)
{
    var self=this;
    this.ops=[];
    this.settings={};
    this.timer=new CABLES.Timer();
    this.animFrameOps=[];
    this.gui=false;
    this.silent=false;
    var paused=false;

    this.onLoadStart=null;
    this.onLoadEnd=null;
    this.aborted=false;
    this.loading=new CABLES.LoadingStatus();

    this.config = cfg ||
    {
        glCanvasId:'glcanvas',
        prefixAssetPath:'',
        silent:false,
        onError:null,
        onFinishedLoading:null,
        onFirstFrameRendered:null
    };

    this.vars={};

    this.cgl=new CGL.State();
    this.cgl.patch=this;
    this.cgl.setCanvas(this.config.glCanvasId);
    this.loading.setOnFinishedLoading(this.config.onFinishedLoading);

    if(this.cgl.aborted) this.aborted=true;
    if(this.cgl.silent) this.silent=true;

    this.pause=function()
    {
        paused=true;
    };

    this.resume=function()
    {
        paused=false;
        this.exec();
    };

    this.getFilePath=function(filename)
    {
        return this.config.prefixAssetPath+filename;
    };

    this.clear=function()
    {
        self.animFrameOps.length=0;
        this.timer=new CABLES.Timer();
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
            if(parts.length==2) op=new window[parts[0]][parts[1]](this,objName);
            else if(parts.length==3) op=new window[parts[0]][parts[1]][parts[2]](this,objName);
            else if(parts.length==4) op=new window[parts[0]][parts[1]][parts[2]][parts[3]](this,objName);
            else if(parts.length==5) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]](this,objName);
            else console.log('parts.length',parts.length);
        }
        catch(e)
        {
            console.error('instancing error '+objName,e);
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

    var frameNum=0;

    this.exec=function(e)
    {
        if(paused)return;

        requestAnimationFrame(self.exec);

        self.timer.update();

        var time=self.timer.getTime();

        // for(var i in self.animFrameOps)
        for (var i = 0; i < self.animFrameOps.length; ++i)
        {
            self.animFrameOps[i].onAnimFrame(time);
        }
        frameNum++;
        if(frameNum==1)
        {
            if(self.config.onFirstFrameRendered)self.config.onFirstFrameRendered();
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

        if(CABLES.Link.canLink(port1,port2))
        {
            var link=new CABLES.Link(this);
            link.link(port1,port2);

            this.onLink(port1,port2);
            return link;
        }
        else
        {
            console.log(CABLES.Link.canLinkText(port1,port2));
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
        var loadingId=this.loading.start('core','deserialize');
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
            if(this.ops[i].onLoaded)this.ops[i].onLoaded();
            this.ops[i].id=generateUUID();
        }

        this.loading.finished(loadingId);


        if(this.onLoadEnd)this.onLoadEnd();


    };

    this.exec();

};

var Scene=CABLES.Patch;
