var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlCable=class
{
    constructor(linedrawer,type)
    {
        this._type=type;
        this._lineDrawer=linedrawer;

        this._lineIdx0=this._lineDrawer.getIndex();
        this._lineIdx1=this._lineDrawer.getIndex();
        this._lineIdx2=this._lineDrawer.getIndex();
    }

    setPosition(x,y,x2,y2)
    {
        const h=CABLES.GLGUI.OP_PORT_HEIGHT;
        this._lineDrawer.setLine(this._lineIdx0,x,y,x,y-h);
        this._lineDrawer.setLine(this._lineIdx1,x,y-h,x2,y2+h);
        this._lineDrawer.setLine(this._lineIdx2,x2,y2+h,x2,y2);
    }

    setColor(r,g,b,a)
    {
        this._lineDrawer.setColor(this._lineIdx0,r,g,b,a);
        this._lineDrawer.setColor(this._lineIdx1,r,g,b,a);
        this._lineDrawer.setColor(this._lineIdx2,r,g,b,a);
    }

    setSpeed(speed)
    {
        this._lineDrawer.setSpeed(this._lineIdx0,speed);
        this._lineDrawer.setSpeed(this._lineIdx1,speed);
        this._lineDrawer.setSpeed(this._lineIdx2,speed);
    }

}





