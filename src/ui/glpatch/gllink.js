var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlLink=class 
{
    constructor(glpatch,id,opidA,opidB)
    {
        this._id=id;
        this._glpatch=glpatch;
        this._opidA=opidA;
        this._opidB=opidB;
        this._lineDrawer=this._glpatch.lineDrawer;
        this._lineIdx=this._lineDrawer.getIndex();

        this._op1=null;
        this._op2=null;

        this._glpatch.addLink(this);

        this.update();
    }

    get id()
    {
        return this._id;
    }

    update()
    {
        if(!this._op1)
        {
            this._op1=this._glpatch.getOp(this._opidA);
            if(this._op1) this._op1.addLink(this);
        }
        
        if(!this._op2)
        {
            this._op2=this._glpatch.getOp(this._opidB);
            if(this._op2) this._op2.addLink(this);
        }

        if(!this._op1 || !this._op2)
        {
            console.log('[glLink] unknown ops...');
            return;
        }

        const pos1x=this._op1.getUiAttribs().translate.x;
        const pos1y=this._op1.getUiAttribs().translate.y;

        const pos2x=this._op2.getUiAttribs().translate.x;
        const pos2y=this._op2.getUiAttribs().translate.y;

        this._lineDrawer.setLine(this._lineIdx,pos1x,pos1y,pos2x,pos2y);
        this._lineDrawer.setColor(this._lineIdx,1,1,1,1);
    }

    dispose()
    {
        if(this._op2) this._op2.removeLink(this._id);
        if(this._op1) this._op1.removeLink(this._id);
        this._lineDrawer.setColor(this._lineIdx,0,0,0,0);
    }

}

