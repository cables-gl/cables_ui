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

        var idx=this._lines.getIndex();
        this._lines.setLine(idx,0,0,200,200);
        this._lines.setColor(idx,1,0,0,1);

        var idx2=this._lines.getIndex();
        this._lines.setLine(idx2,20,20,-200,1500);
        this._lines.setColor(idx2,1,1,1,1);

        this._patch.addEventListener("onOpAdd",this.addOp.bind(this));
        this._patch.addEventListener("onOpDelete",this.deleteOp.bind(this));

        this._rectInstancer.rebuild();
    }

    getOpAt(x,y)
    {
    }

    deleteOp(op)
    {
        for(var i=0;i<this._glOps.length;i++)
        {
            if(this._glOps[i].getOp()==op)
            {
                var delOp=this._glOps[i];
                this._glOps[i].getOp().removeEventListener("onUiAttribsChange",this._glOps[i].update);
                this._glOps.slice(i,1);
                delOp.dispose();
                return;
            }
        }
    }

    addOp(op)
    {
        console.log("OP ADDEDDDDDD");
        const glOp=new CABLES.GLGUI.GlOp(this._rectInstancer,op);
        this._glOps.push(glOp);

        op.addEventListener("onUiAttribsChange",glOp.update.bind(glOp));
    }

    render(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY)
    {
        var z=1/(resX/2/zoom);

        scrollX/=zoom;
        scrollY/=zoom;

        const mouseAbsX=(mouseX-(resX/2))*z+(scrollX*z*0.125);
        const mouseAbsY=(mouseY-(resY/2))*z+(scrollY*z*0.125);
        this._cursor.setPosition(mouseAbsX,mouseAbsY);

        this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);
        this._lines.render(resX,resY,scrollX,scrollY,zoom);
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


}

