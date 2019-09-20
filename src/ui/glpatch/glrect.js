var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlRect=class extends CABLES.EventTarget
{
    constructor(instancer,options)
    {
        super();

        options=options||{};
        this._rectInstancer=instancer;
        this._attrIndex=instancer.getIndex();
        this._parent=options.parent||null;
        this.childs=[];
        this._outline=0;
        this._x=0;
        this._y=0;
        this._absX=0;
        this._absY=0;
        this._w=110;
        this._h=110;
        this._rectInstancer.setSize(this._attrIndex,this._w,this._h);
    }

    get x() { return this._x; }
    get y() { return this._y; }

    addChild(c)
    {
        this.childs.push(c);
    }

    setSize(w,h)
    {
        this._w=w;
        this._h=h;
        this._rectInstancer.setSize(this._attrIndex,this._w,this._h);
    }

    setColor(r,g,b,a)
    {
        this._rectInstancer.setColor(this._attrIndex,r,g,b,1);
    }

    setPosition(_x,_y)
    {
        this._x=Math.floor(_x);
        this._y=Math.floor(_y);

        this._absX=this._x;
        this._absY=this._y;

        if(this._parent)
        {
            this._absX+=this._parent.x;
            this._absY+=this._parent.y;
        }

        this._rectInstancer.setPosition(this._attrIndex,this._absX,this._absY);

        for(var i=0;i<this.childs.length;i++) this.childs[i].setPosition(this.childs[i].x,this.childs[i].y);
    }

    isPointInside(x,y)
    {
        return x>this._absX &&  x<this._absX+this._w &&  y>this._absY && y<this._absY+this._h;
    }

    setOutline(o)
    {
        if(o===true) o=1.0;
        if(!o) o=0.0;

        this._rectInstancer.setOutline(this._attrIndex,o);
    }

}





