var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};


CABLES.GLGUI.GlPatchAPI=class
{
    constructor(patch,glpatch)
    {
        this._patch=patch;
        this._glPatch=glpatch;

        this._patch.addEventListener("onOpAdd",this._onAddOp.bind(this));
        this._patch.addEventListener("onOpDelete",this._onDeleteOp.bind(this));

        this._patch.addEventListener("onLink",this._onLink.bind(this));
        this._patch.addEventListener("onUnLink",this._onUnLink.bind(this));
    }

    _onLink(p1,p2,link)
    {
        // console.log("onlink",link);
        const l=new CABLES.GLGUI.GlLink(this._glPatch,link.id,p1.parent.id,p2.parent.id);
    }

    _onUnLink(a,b,link)
    {
        this._glPatch.deleteLink(link.id);
        console.log("unlink API",link);
        // const l=new CABLES.GLGUI.GlLink(this._glPatch,p1.parent.id,p2.parent.id);
    }

    _onAddOp()
    {
    }

    _onDeleteOp()
    {
    }
}