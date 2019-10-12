
var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class extends CABLES.EventTarget
{
    constructor(patch,cgl)
    {
        super();
        this._patch=patch;
        if(!cgl)cgl=patch.cgl;
        this._glOpz={};
        this._patchAPI=null;

        this._rectInstancer=new CABLES.GLGUI.RectInstancer(cgl);
        this._lines=new CABLES.GLGUI.Linedrawer(cgl);
        this._overLayRects=new CABLES.GLGUI.RectInstancer(cgl);

        this._textWriter=new CABLES.GLGUI.TextWriter(cgl);
        

        this._selectRect=this._overLayRects.createRect();
        this._selectRect.setColor(0,0.5,0.7,0.25);
        this._selectRect.setPosition(0,0,1000);
        this._selectRect.setSize(0,0);
        this._mouseOverCanvas=false;

        this._cursor2=this._overLayRects.createRect();
        this._cursor2.setSize(4,4);
        this._cursor2.setColor(0,0,1,1);

        // this._hoverDragOp=null;

        this.quickLinkSuggestion=new CABLES.GLGUI.QuickLinkSuggestion(this);

        this._viewZoom=0;
        this._viewScrollX=0;
        this._viewScrollY=0;
        this._viewResX=0;
        this._viewResY=0;
        
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
            this.removeSelectionArea();
            this._lastButton=0;
            this.emitEvent("mouseleave",e);
            this.emitEvent("mouseup",e);
        });

        cgl.canvas.addEventListener("mouseup",(e) =>
        {
            this._rectInstancer.mouseUp(e);
            this.quickLinkSuggestion.longPressCancel();
            this._rectInstancer.interactive=true;

        });
    }

    set patchAPI(api) { this._patchAPI=api; }
    get patchAPI() { return this._patchAPI; }

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

    deleteOp(opid) // should work with opid...
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
        this.links[l.id]=l;
    }

    addOp(op)
    {
        if(!op) console.error("no op at addop",op);

        const glOp=new CABLES.GLGUI.GlOp(this,this._rectInstancer,op);
        this._glOpz[op.id]=glOp;
        glOp.updatePosition();
        glOp.setTitle(this._textWriter,op.name);
        glOp.update();

        op.addEventListener("onUiAttribsChange",()=>{
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
        console.log(f);

        this._textWriter.setFont(f);
    }

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY,mouseButton)
    {
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

        scrollX/=zoom;
        scrollY/=zoom;

        this._lines.render(resX,resY,scrollX,scrollY,zoom);
        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
        this._overLayRects.render(resX,resY,scrollX,scrollY,zoom);

        this._textWriter.render(resX,resY,scrollX,scrollY,zoom);

        this.quickLinkSuggestion.glRender(this._patch.cgl,resX,resY,scrollX,scrollY,zoom,mouseX,mouseY);
    }

    removeSelectionArea()
    {
        this._selectRect.setSize(0,0);
    }

    mouseMove(x,y,button)
    {

        if( (this._lastMouseX!=x || this._lastMouseY!=y) && !this.quickLinkSuggestion.isActive() ) this.quickLinkSuggestion.longPressCancel();

        var allowSelectionArea= !this.quickLinkSuggestion.isActive();

        this._rectInstancer.mouseMove(x,y,button);

        if(this._rectInstancer.isDragging())
        {
            console.log("dragging,.,..");
            return;
        }




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

        if( this._selectRect.h==0 && hoverops.length>0 ) allowSelectionArea = false;








        if(this._lastButton==1 && button!=1) this.removeSelectionArea();

        if(this._mouseOverCanvas)
        {
            if(button==1 && allowSelectionArea)
            {
                this._rectInstancer.interactive=false;
                this._selectRect.setPosition(this._lastMouseX,this._lastMouseY,1000);
                this._selectRect.setSize(
                    (x-this._lastMouseX),
                    (y-this._lastMouseY));

                this._selectOpsInRect(
                    x,
                    y,
                    this._lastMouseX,
                    this._lastMouseY);
            }
            else
            {
                this.removeSelectionArea();
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

        for(var i in this._glOpz)
        {
            this._glOpz[i].selected=false;
        }
        for(var i=0;i<ops.length;i++)
        {
            ops[i].selected=true;
        }
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


}

