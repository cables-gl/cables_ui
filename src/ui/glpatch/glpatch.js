var CABLES=CABLES||{};
CABLES.GLGUI=CABLES.GLGUI||{};

// CABLES.GLGUI.LineDrawer=function(cgl,options)
// {
//     this._num=100000;
//     this._counter=0;

//     this._positions=new Float32Array(3*this._num);
//     this._colors=new Float32Array(4*this._num);
// }

CABLES.GLGUI.GlPatch=function(patch)
{
    this._patch=patch;
    this._glOps=[];
    this._rectInstancer=new CABLES.GLGUI.RectInstancer(this._patch.cgl);

    patch.addEventListener("onOpAdd",this.addOp.bind(this));
    patch.addEventListener("onOpDelete",this.deleteOp.bind(this));

    this._rectInstancer.rebuild();
}

CABLES.GLGUI.GlPatch.prototype.getOpAt=function(x,y)
{
}

CABLES.GLGUI.GlPatch.prototype.deleteOp=function(op)
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

CABLES.GLGUI.GlPatch.prototype.addOp=function(op)
{
    console.log("OP ADDEDDDDDD");
    const glOp=new CABLES.GLGUI.GlOp(this._rectInstancer,op);
    this._glOps.push(glOp);

    op.addEventListener("onUiAttribsChange",glOp.update.bind(glOp));
}

CABLES.GLGUI.GlPatch.prototype.render=function(resX,resY,scrollX,scrollY,zoom,mouseX,mouseY)
{
    var z=1/(resX/2/zoom);

    scrollX/=zoom;
    scrollY/=zoom;

    this._rectInstancer.render(resX,resY,scrollX,scrollY,zoom);

    const mouseAbsX=(mouseX-(resX/2))*z+(scrollX*z*0.125);
    const mouseAbsY=(mouseY-(resY/2))*z+(scrollY*z*0.125);
    this._cursor.setPosition(mouseAbsX,mouseAbsY);
}

CABLES.GLGUI.GlPatch.prototype.dispose=function()
{
    while(this._glOps.length>0)
    {
        this._glOps[0].dispose();
        this._glOps.splice(0,1);
    }

    if(this._rectInstancer)this._rectInstancer.dispose();
}

CABLES.GLGUI.GlPatch.prototype.reset=function()
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
};
