var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatchAPI=class
{
    constructor(patch,glpatch)
    {
        this._patch=patch;
        this._glPatch=glpatch;
        this._glPatch.patchAPI=this;

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
            // console.log("init patch",this._patch.ops[i].objname);
            this._glPatch.addOp(this._patch.ops[i]);
        }
    }

    _onLink(p1,p2,link)
    {
        console.log("onlink",p1.direction);
        if(p1.direction!=0)
        {
            var t=p2;
            p2=p1;
            p1=t;
        }
        const l=new CABLES.GLGUI.GlLink(this._glPatch,link.id,p1.parent.id,p2.parent.id,p1.id,p2.id,p1.type);
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

    showOpParams(opid)
    {
        const op=gui.scene().getOpById(opid);
        gui.patch().showOpParams(op);
    }

    unlinkPort(opid,portid)
    {
        // console.log("unlink port",portid);
        const op=gui.scene().getOpById(opid);
        const p= op.getPortById(portid);
        p.removeLinks();
    }

    setOpUiAttribs(opid,attrName,val)
    {
        const op=gui.scene().getOpById(opid);
        var attr={};
        attr[attrName]=val;
        op.setUiAttrib(attr);
        console.log("uiat",attrName,val);
    }

    _watchOp(op)
    {
    }


}