var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlOp=class extends CABLES.EventTarget
{

    constructor(glPatch,instancer,op)
    {
        super();

        this._id=op.id;
        this._glPatch=glPatch;
        this._op=op;
        this._instancer=instancer;
        this._width=CABLES.GLGUI.VISUALCONFIG.opWidth;
        this._height=CABLES.GLGUI.VISUALCONFIG.opHeight;
        this._needsUpdate=true;
        this._textWriter=null;
        this._glTitleExt=null;
        this._glTitle=null;
        this._glPorts=[];
        this.opUiAttribs={};
        this._links={};

        this.uiAttribs=op.uiAttribs;

        this._visPort=null;
        this._glRectContent=null;

        this._glRectBg=instancer.createRect({"draggable":true});
        this._glRectBg.setSize(this._width,this._height);
        this._glRectBg.setColor(51/255,51/255,51/255,1);

        this._passiveDragStartX=null;
        this._passiveDragStartY=null;
        
        this._glRectBg.on("dragEnd", () =>
        {
            var glOps=this._glPatch.selectedGlOps;
            for(var i in glOps)
            {
                glOps[i].endPassiveDrag();
            }

            console.log("DRAGEND!!!!!");
            // var glOps=this._glPatch.selectedGlOps;

            // if(!glOps || glOps.length==0)return;

            // for(var i in glOps)
            // {
            //     glOps[i].endPassiveDrag();
            // }
    
        });

        // this._glRectBg.on("mouseup", (e) =>
        // {
        //     console.log("mouse up op!!!");

        // });

        this._glRectBg.on("drag",
            (rect) =>
            {
                var glOps=this._glPatch.selectedGlOps;
                var ids=Object.keys(glOps);

                if(!glOps || ids.length==0)return;
                if(glPatch.isDraggingPort())return;

                if(!glOps[ids[0]].isPassiveDrag())
                {
                    console.log("starting drag!!!!");
                    for(var i in glOps)
                    {
                        glOps[i].startPassiveDrag();
                    }
                }

                var offX=this._glRectBg.dragOffsetX;
                var offY=this._glRectBg.dragOffsetY;

                for(var i in glOps)
                    glOps[i].setPassiveDragOffset(offX,offY);

                // var x=rect.x;
                // var y=rect.y;

                // if(CABLES.UI.userSettings.get("snapToGrid"))
                // {
                //     x=CABLES.UI.snapOpPosX(x);
                //     y=CABLES.UI.snapOpPosY(y);
                // }

                // // console.log("glop is draggin!");
                // this._glPatch.patchAPI.setOpUiAttribs(
                //     this._id,
                //     "translate",
                //     {
                //         "x":x,
                //         "y":y
                //     });
            });

        this._glRectBg.on("hover",() =>
        {
            // this._glRectBg.setOutline(true);
        });

        this._glRectBg.on("unhover",() =>
        {
            // this._glRectBg.setOutline(false);
        });

        // this._portRects=[];

        for(var i=0;i<this._op.portsIn.length;i++) this._setupPort(i,this._op.portsIn[i]);
        for(var i=0;i<this._op.portsOut.length;i++) this._setupPort(i,this._op.portsOut[i]);

        const portsSize=Math.max(this._op.portsIn.length,this._op.portsOut.length)*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding);

        this._width=Math.max(this._width,portsSize);
        this._glRectBg.setSize(this._width,this._height);
        this.setHover(false);

        glPatch.on("mousedown",(e) =>
            {
                if(this.isHovering()) this._glPatch.patchAPI.showOpParams(this._id);
            });

        this._glRectBg.on("mousedown", (e) =>
            {
                if(!this.selected && !e.shiftKey) this._glPatch.unselectAll();
                this._glPatch.selectOpId(this.id);

                glPatch.quickLinkSuggestion.longPressPrepare(this._op,this.x+this.w/2,this.y+this.h);
            });
        
        this._glRectBg.on("mouseup", (e) =>
            {

                glPatch.emitEvent("mouseUpOverOp",e,this._id);

                if(this.isPassiveDrag())
                {
                    console.log("GLOP mouseup canceled!");
                    return;
                }
                console.log("GLOP MOUSE UP!");
                

                if(this._glPatch.quickLinkSuggestion.isActive()) this._glPatch.quickLinkSuggestion.finish(e,this._op);
            });
    }

    get x() { return this.opUiAttribs.translate.x; }
    get y() { return this.opUiAttribs.translate.y; }
    get w() { return this._width; }
    get h() { return this._height; }
    get id() { return this._id; }
    get title() { return this.opUiAttribs.title; }

    _updateWhenRendering()
    {
        this.update();
        console.log("update when rendering...");
        instancer.removeEventListener(this._updateWhenRendering);
    }

    _updateLater()
    {
        instancer.on("render",this._updateWhenRendering);
    }

    set uiAttribs(attr)
    {
        if(attr)
            if(!this.opUiAttribs.selected && attr.selected) this._glPatch.selectOpId(this._id);

        this.opUiAttribs=attr;
        this._needsUpdate=true;
    }

    get uiAttribs()
    {
        return this.opUiAttribs;
    }

    setTitle(textWriter,title)
    {
        this._textWriter=textWriter;

        if(!this._glTitle)
        {
            this._glTitle=new CABLES.GLGUI.Text(this._textWriter,title);
            this._glTitle.setParentRect(this._glRectBg);
        }

        this._glRectBg.setSize(Math.max(this._getTitleWidth(),this._glRectBg.w),this._glRectBg.h);
    }

    addLink(l)
    {
        this._links[l.id]=l;
    }

    isHovering()
    {
        if(this._glRectBg) return this._glRectBg.isHovering();
    }

    mouseMove(x,y)
    {
        // const wasHovering=this._isHovering;
        // this.setHover(this._glRectBg.isPointInside(x,y));

        // if(this._isHovering)
        // {
        //     for(var i=0;i<this._portRects.length;i++)
        //     {
        //         this._portRects[i].setOutline(this._portRects[i].isPointInside(x,y));
        //         // if( this._portRects[i].isPointInside(x,y) ) this._portRects[i].setColor(1,0,0,1);
        //         // else this._portRects[i].setColor(0,0,0,1);
        //     }
        // }

        // if(wasHovering && !this._isHovering)
        // {
        //     for(var i=0;i<this._portRects.length;i++)
        //         this._portRects[i].setOutline(false);
        // }
    }

    setHover(h)
    {
        if(!this._isHovering && h) this.emitEvent("hoverStart");
        if(this._isHovering && !h) this.emitEvent("hoverEnd");

        this._isHovering=h;
    }

    dispose()
    {
        if(this._glRectBg) this._glRectBg.dispose();
        if(this._glTitle) this._glTitle.dispose();
        for(var i=0;i<this._glPorts.length;i++) this._glPorts[i].dispose();

        this._op=null;
        this._glPorts.length=0;
        this._glRectBg=null;
        this._instancer=null;
    }

    removeLink(linkId)
    {
        const l=this._links[linkId];
        if(l)
        {
            delete this._links[linkId];
            this.update();
        }
    }

    _setupPort(i,p)
    {
        if (p.uiAttribs.display == 'dropdown')return;

        const glp=new CABLES.GLGUI.GlPort(this._glPatch,this,this._instancer,p,i,this._glRectBg);
        this._glPorts.push(glp);
    }

    updatePosition()
    {
        if(!this._glRectBg) return;
        this._glRectBg.setPosition(this.opUiAttribs.translate.x,this.opUiAttribs.translate.y);

        if(this._glTitle) this._glTitle.setPosition(this._getTitlePosition(),0);
        if(this._glTitleExt) this._glTitleExt.setPosition(this._getTitleExtPosition(),0);
    }

    getUiAttribs()
    {
        return this.opUiAttribs;
    }

    getOp()
    {
        return this._op;
    }

    _getTitleWidth()
    {
        var w=0;
        if(this._glTitleExt)w+=this._glTitleExt.width;
        if(this._glTitle)w+=this._glTitle.width;

        w+=CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight*2.0;

        return w;
    }

    _getTitlePosition()
    {
        return CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight;
    }
    _getTitleExtPosition()
    {
        return CABLES.GLGUI.VISUALCONFIG.OpTitlePaddingLeftRight+this._glTitle.width;
    }


    update()
    {
        if(this.opUiAttribs.extendTitle && !this._glTitleExt)
        {
            this._glTitleExt=new CABLES.GLGUI.Text(this._textWriter," | "+this.opUiAttribs.extendTitle);
            this._glTitleExt.setParentRect(this._glRectBg);
            this._glTitleExt.setColor(0.5,0.5,0.5,1.0);
        }
        else if(!this.opUiAttribs.extendTitle && this._glTitleExt)
        {
            this._glTitleExt=null;
        }
 
        if(this.opUiAttribs.glPreviewTexture)
        {
            if(!this._glRectContent)
            {
                this._glRectContent=this._instancer.createRect();
                this._glRectContent.setParent(this._glRectBg);
                this._glRectContent.setPosition(0,this._height);
                this._glRectContent.setColor(255,0,220,1);

                var p=this._op.getPort("Texture");
                this._visPort=p;

                this._visPort.onChange = ()=>
                {
                    const t=this._visPort.get();

                    if(t)
                    {
                        const asp=this._width/t.width*2.5;
                        this._glRectContent.setSize(t.width*asp,t.height*asp);
                        this._glRectContent.setTexture(this._visPort.get());
                    }
    
                };
            }
            if(this._visPort)
            {
            }
        }

        this.updatePosition();
        for(var i in this._links) this._links[i].update();
        this._glPatch.needsRedraw=true;
    }

    set selected(s)
    {

        this.opUiAttribs.selected=s;
        if(s) this._glRectBg.setColor(73/255,73/255,73/255,1)
        else this._glRectBg.setColor(51/255,51/255,51/255,1)
    }

    getPortPos(id)
    {
        for(var i=0;i<this._op.portsIn.length;i++)
        {
            if(this._op.portsIn[i].id==id)
                return i*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding)+CABLES.UI.uiConfig.portSize*0.5;
        }

        for(var i=0;i<this._op.portsOut.length;i++)
        {
            if(this._op.portsOut[i].id==id)
                return i*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding)+CABLES.UI.uiConfig.portSize*0.5;
        }

        return 100;
    }





    isPassiveDrag()
    {
        return !(this._passiveDragStartX==null && this._passiveDragStartY==null);
    }

    endPassiveDrag()
    {
        this._passiveDragStartX=null;
        this._passiveDragStartY=null;
    }

    startPassiveDrag()
    {
        this._passiveDragStartX=this.x;
        this._passiveDragStartY=this.y;
        // console.log("START DRAGGINOP !!!!!!!!!!",this._passiveDragStartX);
    }

    setPassiveDragOffset(x,y)
    {
        if(!this._passiveDragStartX) this.startPassiveDrag();

        // console.log('this._passiveDragStartX', this._passiveDragStartX,x);

        this._glPatch.patchAPI.setOpUiAttribs(
            this._id,
            "translate",
            {
                "x":this._passiveDragStartX+x,
                "y":this._passiveDragStartY+y
            });

        // this.setPosition( this._passiveDragStartX+x, this._passiveDragStartY+y);
        // updatePosition()
    }

    getGlPort(name)
    {
        for(var i =0;i<this._glPorts.length;i++)
        {
            console.log(this._glPorts[i].name,name,']]]]]]]]]]]]]]]]');

            if(this._glPorts[i].name==name) return this._glPorts[i];
        }
        
    }

    getGlPortsLinkedToPort(opid,portname)
    {
        var ports=[];

        for(var i in this._links)
        {
            if(this._links[i].nameInput==portname && this._links[i].opIdInput==opid )
            {
                var op=this._glPatch.getOp(this._links[i].opIdOutput);
                ports.push(op.getGlPort(this._links[i].nameOutput));
            }
            if(this._links[i].nameOutput==portname && this._links[i].opIdOutput==opid )
            {
                var op=this._glPatch.getOp(this._links[i].opIdInput);
                ports.push(op.getGlPort(this._links[i].nameInput));
            }
        }

        return ports;
    }



}

