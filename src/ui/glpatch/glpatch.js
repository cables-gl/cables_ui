var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatch = class 
{
    constructor(patch,cgl)
    {
        this._patch=patch;
        if(!cgl)cgl=patch.cgl;
        this._glOps=[];
        this._rectInstancer=new CABLES.GLGUI.RectInstancer(cgl);
        this._lines=new CABLES.GLGUI.Linedrawer(cgl);

        this._patch.addEventListener("onOpAdd",this.addOp.bind(this));
        this._patch.addEventListener("onOpDelete",this.deleteOp.bind(this));

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

    deleteOp(op) // should work with opid...
    {
        for(var i=0;i<this._glOps.length;i++)
        {
            if(this._glOps[i].getOp()==op)
            {
                const delOp=this._glOps[i];
                this._glOps[i].getOp().removeEventListener("onUiAttribsChange",this._glOps[i].update);
                this._glOps.slice(i,1);
                delOp.dispose();
                return;
            }
        }
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
        const glOp=new CABLES.GLGUI.GlOp(this._rectInstancer,op);
        this._glOps.push(glOp);

        op.addEventListener("onUiAttribsChange",()=>{
            glOp.opUiAttribs=op.uiAttribs;
            glOp.update();
            });
    }

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY)
    {
        var z=1/(resX/2/zoom);

        scrollX/=zoom;
        scrollY/=zoom;

        const mouseAbsX=(mouseX-(resX/2))*z+(scrollX*z*0.125);
        const mouseAbsY=(mouseY-(resY/2))*z+(scrollY*z*0.125);
        this._cursor.setPosition(mouseAbsX,mouseAbsY);

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
    }

    reset()
    {
        this._rectInstancer=new CABLES.GLGUI.RectInstancer(this._patch.cgl);
        this._rectInstancer.rebuild();

        console.log('reset');
        this.dispose();

        this._cursor=new CABLES.GLGUI.GlRect(this._rectInstancer);
        this._cursor.setColor(1,0,0);
        this._cursor.setPosition(0,0);
        this._cursor.setSize(30,30);

        if(this._glOps.length==0)
        {
            for(var i=0;i<this._patch.ops.length;i++)
            {
                this.addOp(this._patch.ops[i]);
            }
        }

        for(var i=0;i<this._glOps.length;i++)
        {
            this._glOps[i].updatePosition();
        }

        this._rectInstancer.rebuild();
    }

    getOp(opid)
    {
        for(var i=0;i<this._glOps.length;i++)
        {
            if(this._glOps[i].id==opid) return this._glOps[i];
        }

    }


}

