var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlRect=class
{
    constructor(instancer,options)
    {
        options=options||{};
        this._rectInstancer=instancer;
        this._attrIndex=instancer.getIndex();
        this._parent=options.parent||null;
        this.childs=[];
        this._rectInstancer.setSize(this._attrIndex,100,100);
    }

    addChild(c)
    {
        this.childs.push(c);
    }

    setSize(x,y)
    {
        this._rectInstancer.setSize(this._attrIndex,x,y);
    }

    setColor(r,g,b)
    {
        this._rectInstancer.setColor(this._attrIndex,r,g,b);
    }

    setPosition(_x,_y)
    {
        this.x=_x;
        this.y=_y;

        var x=this.x;
        var y=this.y;

        if(this._parent)
        {
            x+=this._parent.x;
            y+=this._parent.y;
        }

        this._rectInstancer.setPosition(this._attrIndex,x,y);

        for(var i=0;i<this.childs.length;i++)
            this.childs[i].setPosition(this.childs[i].x,this.childs[i].y);
    }
}





