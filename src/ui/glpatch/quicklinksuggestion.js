
var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.QuickLinkSuggestion=class extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();
        this._glPatch=glPatch;
        this._longPressTimeout=null;
        this._quickAddOpStart=null;
        this._longPressOp=null;
        this._longPress=false;
        this._glLineDrawer=null;
        this._glLineIdx=-1;
        this._startX=0;
        this._startY=0;
    }

    isActive()
    {
        return this._longPress;
    }

    longPressStart(op)
    {
        clearTimeout(this._longPressTimeout);
        this._longPress=true;
        this._quickAddOpStart=op;
        console.log("long press!");
        gui.setCursor("copy");
    }

    longPressPrepare(op,startX,startY)
    {

        this._startX=startX;
        this._startY=startY;

        this.longPressCancel();
        // console.log("long press prepare");
        this._longPressOp = op;
        this._longPressTimeout=setTimeout( 
            ()=>
            {
                this.longPressStart(op);
            },300);
    }

    longPressCancel()
    {
        this._longPressOp=null;
        if(this._longPress)gui.setCursor();
        clearTimeout(this._longPressTimeout);
        this._longPress=false;
        console.log("long press cancel!!!");
    }

    glRender(cgl,resX,resY,scrollX,scrollY,zoom,mouseX,mouseY)
    {
        if(!this._longPress)return;

        if(!this._glLineDrawer)
        {
            this._glLineDrawer=new CABLES.GLGUI.Linedrawer(cgl);
            this._glLineIdx=this._glLineDrawer.getIndex();
        }

        const coord=this._glPatch.screenCoord(resX,resY,zoom,mouseX,mouseY)
        
        this._glLineDrawer.setColor(this._glLineIdx,1,0,0,1);
        this._glLineDrawer.setLine(this._glLineIdx,this._startX,this._startY,coord[0],coord[1]);
        this._glLineDrawer.render(resX,resY,scrollX,scrollY,zoom);
        

        

    }

}


