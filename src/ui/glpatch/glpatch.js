var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();

        this.logEvents(false,"glpatch");
        if(!cgl) console.error("[glpatch] need cgl");
        
        this._cgl=cgl;
        // if(!cgl)cgl=patch.cgl;
        this._glOpz={};
        this._patchAPI=null;
        this._showRedrawFlash=0;
        this.debugData={};
        this._rectInstancer=new CABLES.GLGUI.RectInstancer(cgl);
        this._lines=new CABLES.GLGUI.Linedrawer(cgl);
        this._overLayRects=new CABLES.GLGUI.RectInstancer(cgl);
        this._textWriter=new CABLES.GLGUI.TextWriter(cgl);
        // this._overLayLines=new CABLES.GLGUI.Linedrawer(cgl);

        this._selection=new CABLES.GLGUI.GlSelection(this._overLayRects,this)
        // this._selectRect=this._overLayRects.createRect();
        // this._selectRect.setColor(0,0.5,0.7,0.25);
        // this._selectRect.setPosition(0,0,1000);
        // this._selectRect.setSize(0,0);
        this._mouseOverCanvas=false;

        this._lastMouseX=this._lastMouseY=-1
        this._portDragLine=new CABLES.GLGUI.GlRectDragLine(this._lines,this);

        for(var i=-100;i<100;i++)
        {
            const col=0.3;
            const size=10000;

            const gridLine=this._rectInstancer.createRect();
            gridLine.setColor(col,col,col,1);
            gridLine.setPosition(i*100,-0.5*size,-11111);
            gridLine.setSize(1,size);

            const gridLine2=this._rectInstancer.createRect();
            gridLine2.setColor(col,col,col,1);
            gridLine2.setPosition(-0.5*size,i*100,-11111);
            gridLine2.setSize(size,1);            
        }


        this._cursor2=this._overLayRects.createRect();
        this._cursor2.setSize(2,2);

        this._redrawFlash=this._overLayRects.createRect();
        this._redrawFlash.setSize(50,5);
        this._redrawFlash.setColor(0,1,0,1);

        this.quickLinkSuggestion=new CABLES.GLGUI.QuickLinkSuggestion(this);
        this._debugtext=new CABLES.GLGUI.Text(this._textWriter,"hello");

        this._viewZoom=0;
        this._viewScrollX=0;
        this._viewScrollY=0;
        this._viewResX=0;
        this._viewResY=0;

        this.needsRedraw=false;

        this._selectedGlOps={};
        
        this.links={}

        cgl.canvas.addEventListener("mousedown",(e) =>
        {
            this._mouseOverCanvas=true;
            this.emitEvent("mousedown",e);
            this._rectInstancer.mouseDown(e);
        });

        cgl.canvas.addEventListener("mouseenter",(e) =>
        {
            this._mouseOverCanvas=true;
        });

        cgl.canvas.addEventListener("mousemove",(e) =>
        {
            if(!this.quickLinkSuggestion.isActive())this.quickLinkSuggestion.longPressCancel();
        });

        cgl.canvas.addEventListener("mouseleave",(e) =>
        {
            this._mouseOverCanvas=false;
            this._selection.hideArea();
            this._lastButton=0;
            this.emitEvent("mouseleave",e);
            this.emitEvent("mouseup",e);
        });



        


        cgl.canvas.addEventListener("mouseup",(e) =>
        {

            this._rectInstancer.mouseUp(e);
            this.emitEvent("mouseup",e);
            this.quickLinkSuggestion.longPressCancel();
            this._rectInstancer.interactive=true;
        });

        gui.keys.key("Delete","Delete selected ops","down",cgl.canvas.id,{}, () =>
        {
            for(var i in this._selectedGlOps) this._patchAPI.deleteOp(i);
            this.unselectAll();
        });

        gui.keys.key("a","Align selected ops","down",cgl.canvas.id,{}, () =>
        {
            var ks=Object.keys(this._selectedGlOps);
            this._patchAPI.alignSelectedOps(ks);
        });

    }

    set patchAPI(api) { this._patchAPI=api; }
    get patchAPI() { return this._patchAPI; }

    get rectDrawer(){return this._rectInstancer;}
    get selectedGlOps(){return this._selectedGlOps;}

    getOpAt(x,y)
    {
    }

    get lineDrawer()
    {
        return this._lines;
    }

    deleteLink(linkId)
    {
        const l=this.links[linkId];

        if(l)
        {
            delete this.links[linkId];
            l.dispose();
        }
        else
        {
            console.log("this.links",this.links);
            console.log("could not find link to remove!!",linkId);
        }
    }

    deleteOp(opid) // should work  th opid...
    {
        const glop=this._glOpz[opid];

        if(!glop)
        {
            console.log("could not find op to delete",opid);
            return;
        }
        
        delete this._glOpz[opid];
        glop.dispose();
    }

    addLink(l)
    {
        if(this.links[l.id]) this.links[l.id].dispose();
        this.links[l.id]=l;
    }

    addOp(op)
    {
        if(!op) console.error("no op at addop",op);

        var glOp = this._glOpz[op.id];
        if(!glOp)
        {
            glOp = new CABLES.GLGUI.GlOp(this,this._rectInstancer,op);
            this._glOpz[op.id]=glOp;
        }
        else
        {
            glOp.uiAttribs=op.uiAttribs;
        }
        glOp.updatePosition();
        glOp.setTitle(this._textWriter,op.name);
        glOp.update();

        op.addEventListener("onUiAttribsChange",
            ()=>{
                glOp.opUiAttribs=op.uiAttribs;
                glOp.update();
            });
    }

    screenCoord(mouseX,mouseY)
    {
        var z=1/(this._viewResX/2/this._viewZoom);
        var asp=this._viewResY/this._viewResX;

        const mouseAbsX=(mouseX-(this._viewResX/2))*z-(this._viewScrollX);
        const mouseAbsY=(mouseY-(this._viewResY/2))*z+(this._viewScrollY*asp);

        return [mouseAbsX,mouseAbsY];
    }

    setFont(f)
    {
        this._textWriter.setFont(f);
    }

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY,mouseButton)
    {
        const starttime=performance.now();
        this._showRedrawFlash++;
        // if(this._showRedrawFlash) this._redrawFlash.setColor(0,0,0,1);
        // else this._redrawFlash.setColor(0,1,0,1);
        this._redrawFlash.setPosition(0,this._showRedrawFlash%30,1000);


        this._patchAPI.updateFlowModeActivity();

        this._viewResX=resX;
        this._viewResY=resY;
        this._viewZoom=zoom;
        this._viewScrollX=scrollX;
        this._viewScrollY=scrollY;

        const coord=this.screenCoord(mouseX,mouseY);
        const mouseAbsX=coord[0];
        const mouseAbsY=coord[1];

        this.mouseMove(mouseAbsX,mouseAbsY,mouseButton);
        this._cursor2.setPosition(mouseAbsX-2,mouseAbsY-2);

        this._portDragLine.setPosition(mouseAbsX,mouseAbsY);


        scrollX/=zoom;
        scrollY/=zoom;

        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
        this._overLayRects.render(resX,resY,scrollX,scrollY,zoom);
        this._textWriter.render(resX,resY,scrollX,scrollY,zoom);
        this._lines.render(resX,resY,scrollX,scrollY,zoom);


        this.quickLinkSuggestion.glRender(this._cgl,resX,resY,scrollX,scrollY,zoom,mouseX,mouseY);

        this.needsRedraw=false;


        this.debugData['glpatch.allowDragging']=this.allowDragging;
        this.debugData['rects']=this._rectInstancer.getNumRects();

        this.debugData['viewZoom']=this._viewZoom;
        this.debugData['viewScrollX']=this._viewScrollX;
        this.debugData['viewScrollY']=this._viewScrollY;
        this.debugData['viewResX']=this._viewResX;
        this.debugData['viewResY']=this._viewResY;

        var str='';
        for(var n in this.debugData)
        {
            str+=n+": "+this.debugData[n]+"\n";
        }
        this._debugtext.text=str;

        this.debugData["renderMs"] = Math.round(((this.debugData["renderMs"]||0)+performance.now()-starttime)*0.5);

    }


    mouseMove(x,y,button)
    {
        if((this._lastMouseX!=x || this._lastMouseY!=y) && !this.quickLinkSuggestion.isActive()) this.quickLinkSuggestion.longPressCancel();

        var allowSelectionArea= !this.quickLinkSuggestion.isActive() && !this._portDragLine.isActive;

        this._rectInstancer.mouseMove(x,y,button);

        if(this._rectInstancer.isDragging()) return;

        const hoverops=this._getGlOpsInRect(x,y,x+1,y+1);

        if(button==1)
        {
            // remmeber start coordinates when start dragging hovered op
            // if(hoverops.length>0 && !this._hoverDragOp)
            // {
            //     console.log("START drag coords!!!");
            //     this._dragOpStartX=x;
            //     this._dragOpStartY=y;
            //     this._dragOpOffsetX=x-hoverops[0].x;
            //     this._dragOpOffsetY=y-hoverops[0].y;
            // }
            
            // if(hoverops.length>0) this._hoverDragOp=hoverops[0];
            // else this._hoverDragOp=null;

            // drag hoverered op
            // if(this._hoverDragOp)
            // {
            //     console.log('this._dragOpStartX',this._dragOpStartX,this._dragOpStartY);
            //     if(this._dragOpStartX)
            //         this._patchAPI.setOpUiAttribs(this._hoverDragOp.id,
            //             "translate",
            //             {
            //                 "x":x-this._dragOpOffsetX,
            //                 "y":y-this._dragOpOffsetY
            //             });
            // }
        }
        else
        {
            this._hoverDragOp=null;
        }

        if(this._selection.h==0 && hoverops.length>0) allowSelectionArea = false;
        if(this._lastButton==1 && button!=1) this._selection.hideArea();

        if(this._mouseOverCanvas)
        {
            if(button==1 && allowSelectionArea)
            {
                this._rectInstancer.interactive=false;
                this._selection.setPos(this._lastMouseX,this._lastMouseY,1000);
                this._selection.setSize((x-this._lastMouseX), (y-this._lastMouseY));
                this._selectOpsInRect(x,y,this._lastMouseX,this._lastMouseY);
            }
            else
            {
                this._selection.hideArea();
                this._lastMouseX=x;
                this._lastMouseY=y;
            }
        }

        this._lastButton=button;
    }

    _getGlOpsInRect(xa,ya,xb,yb)
    {
        const x=Math.min(xa,xb);
        const y=Math.min(ya,yb);
        const x2=Math.max(xa,xb);
        const y2=Math.max(ya,yb);
        const ops=[];

        for(var i in this._glOpz)
        {
            const glop=this._glOpz[i];

            if( glop.x + glop.w >= x &&     // glop. right edge past r2 left
                glop.x <= x2 &&       // glop. left edge past r2 right
                glop.y + glop.h >= y &&       // glop. top edge past r2 bottom
                glop.y <= y2)  // r1 bottom edge past r2 top
            {
                ops.push(glop)
            }
        }
        return ops;
    }

    unselectAll()
    {
        for(var i in this._glOpz) this._glOpz[i].selected=false;
        this._selectedGlOps={};//.length=0;
    }

    selectOpId(id)
    {
        if(this._glOpz[id])
        {
            this._selectedGlOps[id]=this._glOpz[id];
            this._glOpz[id].selected=true;
        }
        else console.warn('[glpatch selectOpId] unknown opid',id);
    }

    _selectOpsInRect(xa,ya,xb,yb)
    {
        // const x=Math.min(xa,xb);
        // const y=Math.min(ya,yb);
        // const x2=Math.max(xa,xb);
        // const y2=Math.max(ya,yb);

        // for(var i in this._glOpz)
        // {
        //     const glop=this._glOpz[i];
        //     glop.selected=false;

        //     if( glop.x + glop.w >= x &&     // glop. right edge past r2 left
        //         glop.x <= x2 &&       // glop. left edge past r2 right
        //         glop.y + glop.h >= y &&       // glop. top edge past r2 bottom
        //         glop.y <= y2)  // r1 bottom edge past r2 top
        //     {
        //         glop.selected=true;
        //     }
        // }
        var ops=this._getGlOpsInRect(xa,ya,xb,yb);


        this.unselectAll();

        for(var i=0;i<ops.length;i++)
        {
            ops[i].selected=true;
            this._selectedGlOps[ops[i].id]=ops[i];
        }
    }

    getZoomForAllOps()
    {
        console.log(this.getOpBounds());
        return 1200;
    }

    getOpBounds()
    {
        const ops=this._glOpz;

        const bounds=
        {
            minx:9999,
            maxx:-9999,
            miny:9999,
            maxy:-9999,
        };

        for (let i in ops)
        {
            const op = ops[i];
            bounds.minx=Math.min(bounds.minx,op.x);
            bounds.maxx=Math.max(bounds.maxx,op.x);
            bounds.miny=Math.min(bounds.miny,op.y);
            bounds.maxy=Math.max(bounds.maxy,op.y);
        }
        return bounds;
    }

    dispose()
    {
        for(var i in this._glOpz)
        {
            this._glOpz[i].dispose();
            delete this._glOpz[i];
        }

        if(this._rectInstancer)this._rectInstancer.dispose();
        if(this._lines)this._lines.dispose();
    }

    reset()
    {
    }

    getOp(opid)
    {
        return this._glOpz[opid];
    }

    setDrawableColorByType(e,t)
    {
        var diff=1;

        if(t == CABLES.OP_PORT_TYPE_VALUE) e.setColor(92/255*diff,181/255*diff,158/255*diff,1);
        else if(t == CABLES.OP_PORT_TYPE_FUNCTION) e.setColor(240/255*diff,209/255*diff,101/255*diff,1);
        else if(t == CABLES.OP_PORT_TYPE_OBJECT) e.setColor(171/255*diff,90/255*diff,148/255*diff,1);
        else if(t == CABLES.OP_PORT_TYPE_ARRAY) e.setColor(128/255*diff,132/255*diff,212/255*diff,1);
        else if(t == CABLES.OP_PORT_TYPE_STRING) e.setColor(213/255*diff,114/255*diff,114/255*diff,1);
        else if(t == CABLES.OP_PORT_TYPE_DYNAMIC) e.setColor(1,1,1);
    }

    snapOpPosX(posX)
    {
        return Math.round(posX/CABLES.UI.uiConfig.snapX)*CABLES.UI.uiConfig.snapX;
    }

    snapOpPosY(posY)
    {
        return Math.round(posY/CABLES.UI.uiConfig.snapY)*CABLES.UI.uiConfig.snapY;
    }

    isDraggingPort()
    {
        return this._portDragLine.isActive;
    }

    get allowDragging()
    {
        return this._rectInstancer.allowDragging;
    }
    set allowDragging(b)
    {
        this._rectInstancer.allowDragging=b;
    }

    getConnectedGlPorts(opid,portname)
    {
        var op=this.getOp(opid);
        return op.getGlPortsLinkedToPort(opid,portname);

    }

}

