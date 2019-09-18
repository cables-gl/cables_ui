var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlLink=class 
{
    constructor(glpatch,id,opIdInput,opIdOutput,portIdInput,portIdOutput,type)
    {
        this._id=id;
        this._glPatch=glpatch;
        this._type=type;
        this._opIdInput=opIdInput;
        this._opIdOutput=opIdOutput;
        // this._lineDrawer=this._glPatch.lineDrawer;
        // this._lineIdx=this._lineDrawer.getIndex();
        this._cable=new CABLES.GLGUI.GlCable(this._glPatch.lineDrawer,this._type);
        this._glPatch.setDrawableColorByType(this._cable,this._type);

        this._portIdInput=portIdInput;
        this._portIdOutput=portIdOutput;

        this._opIn=null;
        this._opOut=null;

        this._offsetXInput=0;
        this._offsetXOutput=0;

        this._glPatch.addLink(this);
        this.update();
    }

    get id()
    {
        return this._id;
    }

    update()
    {


        if(!this._opIn)
        {
            this._opIn=this._glPatch.getOp(this._opIdInput);
            if(this._opIn)
            {
                this._opIn.addLink(this);
                this._offsetXInput=this._opIn.getPortPos(this._portIdInput);
            }
        }
        
        if(!this._opOut)
        {
            this._opOut=this._glPatch.getOp(this._opIdOutput);
            if(this._opOut)
            {
                this._opOut.addLink(this);
                this._offsetXOutput=this._opOut.getPortPos(this._portIdOutput);
            }
        }

        if(!this._opIn || !this._opOut)
        {
            console.log('[glLink] unknown ops...');
            return;
        }

        const pos1x=this._opIn.getUiAttribs().translate.x+this._offsetXInput;
        const pos1y=this._opIn.getUiAttribs().translate.y;

        const pos2x=this._opOut.getUiAttribs().translate.x+this._offsetXOutput;
        const pos2y=this._opOut.getUiAttribs().translate.y+CABLES.GLGUI.OP_HEIGHT;

        this._cable.setPosition(pos1x,pos1y,pos2x,pos2y);
    }

    dispose()
    {
        if(this._opOut) this._opOut.removeLink(this._id);
        if(this._opIn) this._opIn.removeLink(this._id);
        this._cable.setColor(0,0,0,0);
    }

}

