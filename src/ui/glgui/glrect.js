var CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlRect = class extends CABLES.EventTarget
{
    constructor(instancer, options)
    {
        super();

        options = options || {};
        this._visible = true;
        this._hovering = false;
        this._rectInstancer = instancer;
        this._attrIndex = instancer.getIndex();
        this._parent = options.parent || null;

        this.childs = [];
        this._decoration = false;
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._absX = 0;
        this._absY = 0;
        this._w = 110;
        this._h = 110;
        this._rectInstancer.setSize(this._attrIndex, this._w, this._h);
        this._data = {};
        this.color = vec4.create();
        this.colorHover = null;
        this.colorHoverMultiply = 1.4;
        this._texture = null;
        // draggable stuff
        this._draggable = false;
        this._isDragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this.interactive = true;
        if (options.parent) this.setParent(options.parent);
    }

    get x() { return this._x; }

    get y() { return this._y; }

    get z() { return this._z; }

    get w() { return this._w; }

    get h() { return this._h; }

    get dragOffsetX() { return this._dragOffsetX; }

    get dragOffsetY() { return this._dragOffsetY; }

    get data() { return this._data; }

    set data(r) { this._data = r; }

    set draggable(b) { this._draggable = b; }

    get draggable() { return this._draggable; }

    get isDragging() { return this._isDragging; }

    get idx() { return this._attrIndex; }


    hasChild(c)
    {
        return this.childs.indexOf(c) > -1;
    }

    addChild(c)
    {
        if (!this.hasChild(c)) this.childs.push(c);
    }

    setDecoration(c)
    {
        this._decoration = c;
        this._rectInstancer.setDecoration(this._attrIndex, c);
    }

    get visible() { return this._visible; }

    set visible(v)
    {
        this._visible = v;
        this._updateSize();

        if (!this.visible) this._hovering = false;
        for (let i = 0; i < this.childs.length; i++) this.childs[i].visible = v;
    }

    _updateSize()
    {
        if (!this._visible) this._rectInstancer.setSize(this._attrIndex, 0, 0);
        else this._rectInstancer.setSize(this._attrIndex, this._w, this._h);
    }

    setSize(w, h)
    {
        this._w = w;
        this._h = h;
        this._updateSize();
    }

    setColorHover(r, g, b, a)
    {
        this.colorHover = vec4.create();
        vec4.set(this.colorHover, r, g, b, a);
    }

    setColor(r, g, b, a)
    {
        if (r.length) vec4.set(this.color, r[0], r[1], r[2], r[3]);
        else vec4.set(this.color, r, g, b, a);
        this._rectInstancer.setColor(this._attrIndex, this.color);
    }

    setOpacity(a)
    {
        this.setColor(this.color[0], this.color[1], this.color[2], a);

        for (let i = 0; i < this.childs.length; i++) this.childs[i].setOpacity(a);
    }

    setTexRect(x, y, w, h)
    {
        this._rectInstancer.setTexRect(this._attrIndex, x, y, w, h);
    }

    setParent(p)
    {
        this._parent = p;
        p.addChild(this);
        this.setPosition(this._x, this._y, this._z);
    }

    get texture()
    {
        return this._texture;
    }

    setTexture(t)
    {
        if (this._texture == t) return;
        this._texture = t;

        this.emitEvent("textureChanged");
    }

    setPosition(_x, _y, _z)
    {
        this._x = _x;
        this._y = _y;
        this._z = _z || 0;

        this._absX = this._x;
        this._absY = this._y;

        if (this._parent)
        {
            this._absX += this._parent.x;
            this._absY += this._parent.y;
        }

        this._rectInstancer.setPosition(this._attrIndex, this._absX, this._absY, this._z);

        for (let i = 0; i < this.childs.length; i++) this.childs[i].setPosition(this.childs[i].x, this.childs[i].y);
        this.emitEvent("positionChanged");
    }

    isPointInside(x, y)
    {
        return x > this._absX && x < this._absX + this._w && y > this._absY && y < this._absY + this._h;
    }

    // setOutline(o)
    // {
    //     if(!o) o=0;
    //     else if(o===true) o=1;

    //     this._rectInstancer.setOutline(this._attrIndex,o);
    // }

    mouseUp(e)
    {
        if (this._hovering)
        {
            this.emitEvent("mouseup", e, this);
        }
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseUp(e);
    }

    mouseDown(e)
    {
        if (this._hovering)
        {
            this.emitEvent("mousedown", e, this);
        }
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseDown(e);
    }

    isHovering()
    {
        return this._hovering;
    }

    mouseDrag(x, y, button)
    {
        if (!this.interactive) return;
        this._dragOffsetX = x - this._dragStartX;
        this._dragOffsetY = y - this._dragStartY;

        // this.setPosition( x - this._dragOffsetX, y - this._dragOffsetY);
        this.emitEvent("drag", this);
    }

    mouseDragEnd()
    {
        if (!this.interactive) return;
        this.emitEvent("dragEnd", this);
        this._isDragging = false;
    }

    mouseMove(x, y, button)
    {
        if (!this.interactive) return;
        if (!this._visible) return;

        const hovering = this.isPointInside(x, y);
        const isHovered = this._hovering;

        // if (hovering && !this._hovering) console.log(this);
        this._hovering = hovering;

        if (hovering && !isHovered) this.emitEvent("hover", this);
        else if (!hovering && isHovered) this.emitEvent("unhover", this);

        if (this.colorHover)
        {
            if (!this._hovering) this._rectInstancer.setColor(this._attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);
            else this._rectInstancer.setColor(this._attrIndex, this.colorHover[0], this.colorHover[1], this.colorHover[2], this.colorHover[3]);
        }
        if (this.colorHoverMultiply)
        {
            if (!this._hovering) this._rectInstancer.setColor(this._attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);
            else this._rectInstancer.setColor(this._attrIndex, this.color[0] * this.colorHoverMultiply, this.color[1] * this.colorHoverMultiply, this.color[2] * this.colorHoverMultiply, this.color[3] * this.colorHoverMultiply);
        }

        for (let i = 0; i < this.childs.length; i++)
        {
            this.childs[i].mouseMove(x, y);
            if (this.childs[i].isHovering()) this._hovering = false;
        }

        if (this._hovering)
        {
            if (button == 1 && this._rectInstancer.allowDragging)
            {
                if (!this._isDragging)
                {
                    this._isDragging = true;
                    this._dragStartX = x;
                    this._dragStartY = y;
                    this.emitEvent("dragStart", this);
                }
                this._dragOffsetX = x - this._dragStartX;
                this._dragOffsetY = y - this._dragStartY;
            }
        }
    }

    removeChild(child)
    {
        const idx = this.childs.indexOf(child);
        child.parent = null;
        if (idx >= 0) this.childs.splice(idx, 1);
    }

    dispose()
    {
        // console.log("rect dispose!!!");
        if (this.parent) this.parent.removeChild(this);
        this.setDecoration(0);
        this.setSize(0, 0);
        this.setPosition(0, 0);
    }
};
