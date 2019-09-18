var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class 
{
    constructor(patch,cgl)
    {
        this._patch=patch;
        if(!cgl)cgl=patch.cgl;
        this._glOps=[];
        this._glOpz={};

        this._rectInstancer=new CABLES.GLGUI.RectInstancer(cgl);
        this._lines=new CABLES.GLGUI.Linedrawer(cgl);

        this._cursor=new CABLES.GLGUI.GlRect(this._rectInstancer);
        this._cursor.setColor(1,0,0);
        this._cursor.setPosition(0,0);
        this._cursor.setSize(30,30);

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

        const mouseAbsX=(mouseX-(resX/2))*z+(scrollX/z);
        const mouseAbsY=(mouseY-(resY/2))*z+(scrollY/z);
        this._cursor.setPosition(mouseAbsX,mouseAbsY);

        scrollX/=zoom;
        scrollY/=zoom;

        this._lines.render(resX,resY,scrollX,scrollY,zoom);
        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
    }

    dispose()
    {
        while(this._glOps.length>0)
        {
            this._glOps[0].dispose();
            this._glOps.splice(0,1);
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
        if(t == CABLES.OP_PORT_TYPE_VALUE) e.setColor(0,1,0.7);
        else if(t == CABLES.OP_PORT_TYPE_FUNCTION) e.setColor(1,1,0);
        else if(t == CABLES.OP_PORT_TYPE_OBJECT) e.setColor(1,0,1);
        else if(t == CABLES.OP_PORT_TYPE_ARRAY) e.setColor(0,0.3,1);
        else if(t == CABLES.OP_PORT_TYPE_STRING) e.setColor(1,0.3,0);
        else if(t == CABLES.OP_PORT_TYPE_DYNAMIC) e.setColor(1,1,1);

    }

}

