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
        this._data={};
        this.color=vec4.create();
        this.colorHover=null;

        // draggable stuff
        this._draggable=false;
        this._isDragging=false;
        this._dragStartX=0;
        this._dragStartY=0;
        this._dragOffsetX=0;
        this._dragOffsetY=0;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get w() { return this._w; }
    get h() { return this._h; }

    get data() { return this._data; }
    set data(r) { this._data=r; }

    set draggable(b) { this._draggable=b; }
    get draggable() { return this._draggable; }

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

    setColorHover(r,g,b,a)
    {
        this.colorHover=vec4.create();
        vec4.set(this.colorHover,r,g,b,a);
    }

    setColor(r,g,b,a)
    {
        vec4.set(this.color,r,g,b,a);
        this._rectInstancer.setColor(this._attrIndex,r,g,b,a);
    }

    setTexRect(x,y,w,h)
    {
        this._rectInstancer.setTexRect(this._attrIndex,x,y,w,h);
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
        if(!o) o=0;
        else if(o===true) o=1;

        this._rectInstancer.setOutline(this._attrIndex,o);
    }

    mouseUp(e)
    {
        if(this._hovering)
        {
            this.emitEvent("mouseup",e,this);
            for(var i=0;i<this.childs.length;i++) this.childs[i].mouseUp(e);
        }
    }

    mouseDown(e)
    {
        if(this._hovering)
        {
            this.emitEvent("mousedown",e,this);

            for(var i=0;i<this.childs.length;i++) this.childs[i].mouseDown(e);
        }
    }

    isHovering()
    {
        return this._hovering;
    }

    mouseDrag(x,y,button)
    {
        this.setPosition( x - this._dragOffsetX, y - this._dragOffsetY);
        this.emitEvent("drag",this);
    }

    mouseDragEnd()
    {
        this.emitEvent("dragEnd",this);
        this._isDragging=false;
    }

    mouseMove(x,y,button)
    {
        const hovering=this.isPointInside(x,y)

        if(hovering && !this._hovering) this.emitEvent("hover",this);
        else if(!hovering && this._hovering) this.emitEvent("unhover",this);

        this._hovering=hovering;

        if(this.colorHover)
        {
            if(!this._hovering) this._rectInstancer.setColor(this._attrIndex,this.color[0],this.color[1],this.color[2],this.color[3]);
            else this._rectInstancer.setColor(this._attrIndex,this.colorHover[0],this.colorHover[1],this.colorHover[2],this.colorHover[3]);
        }

        for(var i=0;i<this.childs.length;i++)
        {
            this.childs[i].mouseMove(x,y);
        }

        if(hovering)
        {
            if(button==1)
            {
                if(!this._isDragging)
                {
                    this._isDragging=true;
                    this._dragStartX=x;
                    this._dragStartY=y;
                    this._dragOffsetX=x-this._x;
                    this._dragOffsetY=y-this._y;
                    this.emitEvent("dragStart",this);
                }

            }


        }
    }
}


