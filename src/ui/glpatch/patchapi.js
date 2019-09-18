var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatchAPI=class
{
    constructor(patch,glpatch)
    {
        this._patch=patch;
        this._glPatch=glpatch;

        this._initPatch();

        this._patch.addEventListener("onOpAdd",this._onAddOp.bind(this));
        this._patch.addEventListener("onOpDelete",this._onDeleteOp.bind(this));

        this._patch.addEventListener("onLink",this._onLink.bind(this));
        this._patch.addEventListener("onUnLink",this._onUnLink.bind(this));
    }

    _initPatch()
    {
        console.log("patch.ops.length",this._patch.ops.length);
        for(var i=0;i<this._patch.ops.length;i++)
        {
            console.log("init patch",this._patch.ops[i].objname);
            this._glPatch.addOp(this._patch.ops[i]);
        }
    }

    _onLink(p1,p2,link)
    {
        console.log(
            "onlink",link        );
        const l=new CABLES.GLGUI.GlLink(this._glPatch,link.id,p1.parent.id,p2.parent.id);
    }

    _onUnLink(a,b,link)
    {
        if(!link)return;
        this._glPatch.deleteLink(link.id);
    }

    _onAddOp(op)
    {
        this._glPatch.addOp(op);
    }

    _onDeleteOp(op)
    {
        this._glPatch.deleteOp(op.id);
    }

    _watchOp(op)
    {

    }
}