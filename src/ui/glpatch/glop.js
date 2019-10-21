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
        this._width=CABLES.GLGUI.VISUALCONFIG.portWidth;
        this._height=CABLES.GLGUI.VISUALCONFIG.opHeight;
        this._needsUpdate=true;
        this._textWriter=null;
        this._glTitleExt=null;
        this._glTitle=null;
        this.uiAttribs=op.uiAttribs;

        this._visPort=null;
        this._glRectContent=null;

        this._glRectBg=instancer.createRect({"draggable":true});
        this._glRectBg.setSize(this._width,this._height);
        this._glRectBg.setColor(51/255,51/255,51/255,1);

        this._glRectBg.on("drag",
            (rect)=>
            {
                var x=rect.x;
                var y=rect.y;

                if(CABLES.UI.userSettings.get("snapToGrid"))
                {
                    x=CABLES.UI.snapOpPosX(x);
                    y=CABLES.UI.snapOpPosY(y);
                }

                // console.log("glop is draggin!");
                this._glPatch.patchAPI.setOpUiAttribs(
                    this._id,
                    "translate",
                    {
                        "x":x,
                        "y":y
                    });
            });

        this._glRectBg.addEventListener("hover",() =>
        {
            this._glRectBg.setOutline(true);
        });

        this._glRectBg.addEventListener("unhover",() =>
        {
            this._glRectBg.setOutline(false);
        });

        this._portRects=[];
        this._links={};

        for(var i=0;i<this._op.portsIn.length;i++) this._setupPort(i,this._op.portsIn[i]);
        for(var i=0;i<this._op.portsOut.length;i++) this._setupPort(i,this._op.portsOut[i]);

        const portsSize=Math.max(this._op.portsIn.length,this._op.portsOut.length)*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding);

        this._width=Math.max(this._width,portsSize);
        this._glRectBg.setSize(this._width,this._height );
        this.setHover(false);

        glPatch.on("mousedown",(e) =>
        {
            if(this.isHovering()) this._glPatch.patchAPI.showOpParams(this._id);
        });

        this._glRectBg.on("mousedown", (e) =>
        {
            if(!e.shiftKey) this._glPatch.unselectAll();
            this.selected=true;
            
            console.log("GLOP MOUSE DOWNNNNNNN!");
            glPatch.quickLinkSuggestion.longPressPrepare(this._op,this.x+this.w/2,this.y+this.h);
        });
        
        this._glRectBg.on("mouseup", (e) =>
        {
            console.log("GLOP MOUSE UP!");

            if(this._glPatch.quickLinkSuggestion.isActive()) this._glPatch.quickLinkSuggestion.finish(e,this._op);
        });
    }


    get x() { return this.opUiAttribs.translate.x; }
    get y() { return this.opUiAttribs.translate.y; }
    get w() { return this._width; }
    get h() { return this._height; }


    get id()
    {
        return this._id;
    }


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
        this.opUiAttribs=attr;
        this._needsUpdate=true;

        // glOp.setTitle(this._textWriter,attr.title);
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
        for(var i=0;i<this._portRects.length;i++) this._portRects[i].dispose();

        this._op=null;
        this._portRects.length=0;
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
        var r=new CABLES.GLGUI.GlRect(this._instancer,{"parent":this._glRectBg});
        r.setSize(CABLES.GLGUI.VISUALCONFIG.portWidth,CABLES.GLGUI.VISUALCONFIG.portHeight);

        this._glPatch.setDrawableColorByType(r,p.type);

        var y=0;
        if(p.direction==1) y=CABLES.UI.uiConfig.opHeight-CABLES.GLGUI.VISUALCONFIG.portHeight;
        
        r.setPosition(i*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding),y);
        this._glRectBg.addChild(r);
        this._portRects.push(r);
        r.data.portId=p.id;
        r.data.opId=p.parent.id;

        r.addEventListener("mousedown",(e,rect) =>
        {
            if(e.buttons==CABLES.UI.MOUSE_BUTTON_RIGHT)
            {
                this._glPatch.patchAPI.unlinkPort(rect.data.opId,rect.data.portId);
            }
        });

        r.addEventListener("hover",(rect) =>
        {
            rect.setOutline(true);
        });

        r.addEventListener("unhover",(rect) =>
        {
            rect.setOutline(false);
        });
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
            }
            if(this._visPort)
            {
                const t=this._visPort.get();

                if(t)
                {
                    const asp=this._width/t.width*2.0;
                    this._glRectContent.setSize(t.width*asp,t.height*asp);
                    this._glRectContent.setTexture(this._visPort.get());
                }
            }
        }


        this.updatePosition();
        for(var i in this._links) this._links[i].update();
    }

    set selected(s)
    {
        this.opUiAttribs.selected=s;
        if(s) this._glRectBg.setColor(90/255,90/255,90/255,1)
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

}

