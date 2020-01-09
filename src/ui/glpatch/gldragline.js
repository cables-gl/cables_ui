var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlRectDragLine=class
{
    constructor(linedrawer,rect)
    {
        this._rect=rect;
        this._lineDrawer=linedrawer;

        this._lineIdx0=this._lineDrawer.getIndex();
    }

    setPort(p)
    {
        this._rect=p.rect;
        this._update();
    }

    _update()
    {
        if(this._rect)
        {
            this._lineDrawer.setLine(this._lineIdx0,this._rect.x,this._rect.y,this._x,this._y);
            console.log('ghjghjghj');

        }

    }

    setPosition(x,y)
    {
        this._x=x;
        this._y=y;
        this._update();
    }

    setColor(r,g,b,a)
    {
        this._lineDrawer.setColor(this._lineIdx0,r,g,b,a);
    }


}
