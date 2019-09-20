var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class extends CABLES.EventTarget
{
    constructor(patch,cgl)
    {
        super();
        this._patch=patch;
        if(!cgl)cgl=patch.cgl;
        // this._glOps=[];
        this._glOpz={};
        this._patchAPI=null;

        this._rectInstancer=new CABLES.GLGUI.RectInstancer(cgl);
        this._lines=new CABLES.GLGUI.Linedrawer(cgl);

        this._cursor2=new CABLES.GLGUI.GlRect(this._rectInstancer);
        this._cursor2.setColor(0,0,1);
        this._cursor2.setPosition(0,0);
        this._cursor2.setSize(40,40);
        

        // this._patch.addEventListener("onOpAdd",this.addOp.bind(this));
        // this._patch.addEventListener("onOpDelete",this.deleteOp.bind(this));

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

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY)
    {
        var z=1/(resX/2/zoom);
        var asp=resY/resX;

        const mouseAbsX=(mouseX-(resX/2))*z-(scrollX);
        const mouseAbsY=(mouseY-(resY/2))*z+(scrollY*asp);

        this.hoverMouse(mouseAbsX,mouseAbsY);

        this._cursor2.setPosition(mouseAbsX,mouseAbsY);

        scrollX/=zoom;
        scrollY/=zoom;

        this._lines.render(resX,resY,scrollX,scrollY,zoom);
        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
    }

    

    hoverMouse(x,y)
    {
        this._rectInstancer.mouseMove(x,y);

        // for(var i in this._glOpz)
        // {
        //     // this._glOpz[i].setHover(this._glOpz[i].testRectXY(x,y));
        //     this._glOpz[i].mouseMove(x,y);
        // }
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
        // this._rectInstancer=new CABLES.GLGUI.RectInstancer(this._patch.cgl);
        // this._rectInstancer.rebuild();

        // console.log('reset');
        // this.dispose();


        // if(this._glOps.length==0)
        // {
        //     for(var i=0;i<this._patch.ops.length;i++)
        //     {
        //         this.addOp(this._patch.ops[i]);
        //     }
        // }

        // for(var i=0;i<this._glOps.length;i++)
        // {
        //     this._glOps[i].updatePosition();
        // }

        // this._rectInstancer.rebuild();
    }

    getOp(opid)
    {
        return this._glOpz[opid];
        // for(var i=0;i<this._glOps.length;i++)
        // {
        //     if(this._glOps[i].id==opid) return this._glOps[i];
        // }
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

