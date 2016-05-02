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
    var frameNum=0;

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
    if(!this.config.prefixAssetPath)this.config.prefixAssetPath='';

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


    this.getOpClass=function(objName)
    {
        var parts=objName.split('.');
        var opObj=null;
        if(parts.length==2) opObj=window[parts[0]][parts[1]];
        else if(parts.length==3) opObj=window[parts[0]][parts[1]][parts[2]];
        else if(parts.length==4) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]];
        else if(parts.length==5) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]];
        else if(parts.length==6) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]];
        else if(parts.length==7) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]];
        else if(parts.length==8) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]];
        else if(parts.length==9) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]];
        else if(parts.length==10) opObj=window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]][parts[9]];
        return opObj;
    };

    this.addOp=function(objName,uiAttribs)
    {
        if(!objName || objName.indexOf('.') == -1)
        {
            CABLES.UI.MODAL.showError('could not create op','op unknown');
            return;
        }

        var parts=objName.split('.');
        var op=null;

        try
        {
            var opObj=this.getOpClass(objName);

            if(!opObj)
            {
                if(CABLES.UI)
                {
                    CABLES.UI.MODAL.showError('unknown op','unknown op: '+objName);
                }
                console.error('unknown op: '+objName);
            }
            else
            {
                if(parts.length==2)      op=new window[parts[0]][parts[1]](this,objName);
                else if(parts.length==3) op=new window[parts[0]][parts[1]][parts[2]](this,objName);
                else if(parts.length==4) op=new window[parts[0]][parts[1]][parts[2]][parts[3]](this,objName);
                else if(parts.length==5) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]](this,objName);
                else if(parts.length==6) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]](this,objName);
                else if(parts.length==7) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]](this,objName);
                else if(parts.length==8) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]](this,objName);
                else if(parts.length==9) op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]](this,objName);
                else if(parts.length==10)op=new window[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]][parts[9]](this,objName);
                else console.log('parts.length',parts.length);

            }
        }
        catch(e)
        {
            // if(CABLES.UI)
            // {
            //     CABLES.UI.MODAL.showException(e,op);
            // }

            console.error('!instancing error '+objName,e);
            if(CABLES.UI)
            {
                // gui.serverOps.showOpInstancingError(objName,e);
                CABLES.UI.MODAL.showException(e,op);
            }
            return;
        }
        if(op)
        {
            op.objName=objName;
            op.patch=this;
            op.uiAttr(uiAttribs);
            if(op.onCreate)op.onCreate();

            if(op.hasOwnProperty('onAnimFrame')) this.animFrameOps.push(op);

            this.ops.push(op);

            if(this.onAdd)this.onAdd(op);
        }

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

                    var opToDelete=this.ops[i];
                    opToDelete.removeLinks();
                    this.onDelete(opToDelete);
                    opToDelete.id=generateUUID();
                    this.ops.splice( i, 1 );

                    if(opToDelete.onDelete)opToDelete.onDelete();

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

    this.getFrameNum=function()
    {
        return frameNum;
    };

    this.exec=function(e)
    {
        if(paused)return;

        requestAnimationFrame(self.exec);

        self.timer.update();

        var time=self.timer.getTime();

        // for(var i in self.animFrameOps)
        for (var i = 0; i < self.animFrameOps.length; ++i)
        {
            if(self.animFrameOps[i].onAnimFrame) self.animFrameOps[i].onAnimFrame(time);
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
        // else console.log(CABLES.Link.canLinkText(port1,port2));

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
            // console.log(this.ops[i].objName);
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

    this.getOpsByName=function(name)
    {
        var arr=[];
        for(var i in this.ops)
        {
            if(this.ops[i].name==name)arr.push(this.ops[i]);
        }
        return arr;
    };

    this.loadLib=function(which)
    {

        CABLES.ajaxSync('/ui/libs/'+which+'.js',
            function(err,res)
            {
                var se = document.createElement('script');
                se.type = "text/javascript";
                se.text = res;
                document.getElementsByTagName('head')[0].appendChild(se);

            },'GET');
        // open and send a synchronous request
        // xhrObj.open('GET', '/ui/libs/'+which+'.js', false);
        // xhrObj.send('');
        // add the returned content to a newly created script tag

    };

    this.reloadOp=function(objName)
    {
        for(var i in self.ops)
        {
            if(self.ops[i].objName==objName)
            {
                var oldOp=self.ops[i];
                var op=this.addOp(objName,oldOp.uiAttribs);
                var j,k;
                for(j in oldOp.portsIn)
                {
                    if(oldOp.portsIn[j].links.length===0)
                    {
                        op.getPort(oldOp.portsIn[j].name).set(oldOp.portsIn[j].get() );
                    }
                    else
                    while(oldOp.portsIn[j].links.length)
                    {
                        var oldName=oldOp.portsIn[j].links[0].portIn.name;
                        var oldOutName=oldOp.portsIn[j].links[0].portOut.name;
                        var oldOutOp=oldOp.portsIn[j].links[0].portOut.parent;
                        oldOp.portsIn[j].links[0].remove();

                        var l=self.link(
                            op,
                            oldName,
                            oldOutOp,
                            oldOutName
                            );
                        l.setValue();
                    }
                }

                for(j in oldOp.portsOut)
                {
                    while(oldOp.portsOut[j].links.length)
                    {
                        var oldNewName=oldOp.portsOut[j].links[0].portOut.name;
                        var oldInName=oldOp.portsOut[j].links[0].portIn.name;
                        var oldInOp=oldOp.portsOut[j].links[0].portIn.parent;
                        oldOp.portsOut[j].links[0].remove();

                        var l=self.link(
                            op,
                            oldNewName,
                            oldInOp,
                            oldInName
                            );
                        l.setValue();
                    }
                }

                self.deleteOp(oldOp.id);
            }
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

                if(typeof objPort.value =='string' && !isNaN(objPort.value)) objPort.value=parseFloat(objPort.value);
                if(port && (port.uiAttribs.display=='bool' || port.uiAttribs.type=='bool') && !isNaN(objPort.value) ) objPort.value=true===objPort.value;

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
