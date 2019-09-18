var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class 
{
    constructor(patch,cgl)
    {
        this._patch=patch;
        if(!cgl)cgl=patch.cgl;
        // this._glOps=[];
        this._glOpz={};

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
    }

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
            console.log(Object.keys(this.links));
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

        // for(var i=0;i<this._glOps.length;i++)
        // {
        //     if(this._glOps[i].getOp()==op)
        //     {
        //         const delOp=this._glOps[i];
        //         this._glOps[i].getOp().removeEventListener("onUiAttribsChange",this._glOps[i].update);
        //         this._glOps.slice(i,1);
        //         delOp.dispose();
        //         return;
        //     }
        // }
    }

    addLink(l)
    {
        this.links[l.id]=l;
    }

    addOp(op)
    {
        if(!op)
        {
            console.error("no op at addop",op);
        }
        console.log("OP ADDEDDDDDD");
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
        // console.log("z",z);
        // var scx=1/(resX/z);
        // console.log(scrollX,z)

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
        for(var i in this._glOpz)
        {
            this._glOpz[i].setHover(this._glOpz[i].testRectXY(x,y));
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
        if(t == CABLES.OP_PORT_TYPE_VALUE) e.setColor(92/255,181/255,158/255);
        else if(t == CABLES.OP_PORT_TYPE_FUNCTION) e.setColor(240/255,209/255,101/255);
        else if(t == CABLES.OP_PORT_TYPE_OBJECT) e.setColor(171/255,90/255,148/255);
        else if(t == CABLES.OP_PORT_TYPE_ARRAY) e.setColor(128/255,132/255,212/255);
        else if(t == CABLES.OP_PORT_TYPE_STRING) e.setColor(213/255,114/255,114/255);
        else if(t == CABLES.OP_PORT_TYPE_DYNAMIC) e.setColor(1,1,1);
    }

}

