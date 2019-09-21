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

        this._cursor2=new CABLES.GLGUI.GlRect(this._rectInstancer);
        this._cursor2.setColor(0,0,1);
        this._cursor2.setPosition(0,0);
        this._cursor2.setSize(40,40);

        this._selectRect=this._rectInstancer.createRect();
        this._selectRect.setColor(0,0.5,0.7,0.5);
        this._selectRect.setPosition(0,0,1000);
        this._selectRect.setSize(0,0);

        this._rectInstancer.rebuild();
        this.links={}

        cgl.canvas.addEventListener("mousedown",(e) =>
        {
            console.log("MOUSEDOWN ",e);
            this.emitEvent("mousedown",e);
            this._rectInstancer.mouseDown(e);
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
        if(!op)
            console.error("no op at addop",op);

        const glOp=new CABLES.GLGUI.GlOp(this,this._rectInstancer,op);
        this._glOpz[op.id]=glOp;
        glOp.updatePosition();
        glOp.update();

        op.addEventListener("onUiAttribsChange",()=>{
            glOp.opUiAttribs=op.uiAttribs;
            glOp.update();
            });
    }

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY,mouseButton)
    {
        var z=1/(resX/2/zoom);
        var asp=resY/resX;

        const mouseAbsX=(mouseX-(resX/2))*z-(scrollX);
        const mouseAbsY=(mouseY-(resY/2))*z+(scrollY*asp);

        this.mouseMove(mouseAbsX,mouseAbsY,mouseButton);

        this._cursor2.setPosition(mouseAbsX,mouseAbsY);

        scrollX/=zoom;
        scrollY/=zoom;

        this._lines.render(resX,resY,scrollX,scrollY,zoom);
        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
    }

    mouseMove(x,y,button)
    {
        this._rectInstancer.mouseMove(x,y);

        if(this._lastButton==1 && button!=1)
            this._selectRect.setSize(0,0);

        if(button==1)
        {
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
            this._lastMouseX=x;
            this._lastMouseY=y;
        }
        this._lastButton=button;
    }

    _selectOpsInRect(xa,ya,xb,yb)
    {
        const x=Math.min(xa,xb);
        const y=Math.min(ya,yb);
        const x2=Math.max(xa,xb);
        const y2=Math.max(ya,yb);

        for(var i in this._glOpz)
        {
            const glop=this._glOpz[i];
            glop.selected=false;

            if( glop.x + glop.w >= x &&     // glop. right edge past r2 left
                glop.x <= x2 &&       // glop. left edge past r2 right
                glop.y + glop.h >= y &&       // glop. top edge past r2 bottom
                glop.y <= y2)  // r1 bottom edge past r2 top
            {
                glop.selected=true;
            }
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

}

