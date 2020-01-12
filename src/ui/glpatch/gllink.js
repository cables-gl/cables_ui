var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlLink=class 
{
    constructor(glpatch,id,opIdInput,opIdOutput,
        portNameIn,
        portNameOut,portIdInput,portIdOutput,type)
    {
        this._id=id;
        this._glPatch=glpatch;
        this._type=type;
        this._portNameInput=portNameIn;
        this._portNameOutput=portNameOut;
        this._opIdInput=opIdInput;
        this._opIdOutput=opIdOutput;
        this._portIdInput=portIdInput;
        this._portIdOutput=portIdOutput;

        this._buttonRect=this._glPatch.rectDrawer.createRect({});
        this._buttonRect.setColorHover(1,1,1,1);
        this._buttonRect.on("mousedown",(e)=>
            {
                if(e.buttons == CABLES.UI.MOUSE_BUTTON_RIGHT)
                    this._glPatch.patchAPI.removeLink(this._opIdInput,this._opIdOutput,this._portIdInput,this._portIdOutput);
                else
                    this._glPatch.patchAPI.addOpIntoLink(this._opIdInput,this._opIdOutput,this._portIdInput,this._portIdOutput);
            });

        this._cable=new CABLES.GLGUI.GlCable(this._glPatch.lineDrawer,this._buttonRect,this._type);
        this._glPatch.setDrawableColorByType(this._cable,this._type);

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

    get nameInput()
    {
        return this._portNameInput;
    }

    get nameOutput()
    {
        return this._portNameOutput;
    }

    get opIdOutput(){ return this._opIdOutput};
    get opIdInput(){ return this._opIdInput};

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
        const pos2y=this._opOut.getUiAttribs().translate.y+CABLES.UI.uiConfig.opHeight;
        this._cable.setPosition(pos1x,pos1y,pos2x,pos2y);
    }

    dispose()
    {
        if(this._opOut) this._opOut.removeLink(this._id);
        if(this._opIn) this._opIn.removeLink(this._id);
        this._cable.setColor(0,0,0,0);
        this._buttonRect.dispose();
    }

    setFlowModeActivity(act)
    {
        this._cable.setSpeed(act);
    }

}
