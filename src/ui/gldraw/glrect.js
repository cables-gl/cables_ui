import { Logger, Events } from "cables-shared-client";
import GlRectInstancer from "./glrectinstancer.js";

/**
 * rectangle data structure for {@link GlRectInstancer}
 *
 * @export
 * @class GlRect
 * @extends {Events}
 */
export default class GlRect extends Events
{

    /**
     * @param {GlRectInstancer} instancer
     * @param {Object} options
     */
    constructor(instancer, options)
    {
        super();

        this._log = new Logger("GlRect");

        if (!instancer || !instancer.getIndex)
            this._log.warn("no instancer given!");

        options = options || {};
        this._visible = true;
        this._hovering = false;
        this._rectInstancer = instancer;
        this._attrIndex = instancer.getIndex();

        this.childs = [];
        this._shape = false;
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._absX = 0;
        this._absY = 0;
        this._absZ = 0;
        this._w = 110;
        this._h = 110;
        this._rectInstancer.setSize(this._attrIndex, this._w, this._h);
        this._data = {};
        this.color = vec4.create();
        this.colorHover = null;
        // this.colorHoverMultiply = 1.0;
        this._texture = null;
        // draggable stuff
        this._draggable = false;
        this.draggableX = true;
        this.draggableY = true;
        this._isDragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this.draggableMove = false;
        this.interactive = true;
        if (options.hasOwnProperty("interactive")) this.interactive = options.interactive;

        this._parent = null;
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

    /**
     * @param {number} c
     */
    setShape(c)
    {
        if (this._shape != c)
        {
            this._shape = c;
            this._rectInstancer.setShape(this._attrIndex, c);
        }

        if (this._border != 0) this._rectInstancer.setBorder(this._attrIndex, 0);
        if (this._selected != 0) this._rectInstancer.setSelected(this._attrIndex, 0);
    }

    /**
     * @param {number} c
     */
    setBorder(c)
    {
        if (this._border != c)
        {
            this._border = c;
            this._rectInstancer.setBorder(this._attrIndex, c);
        }
    }

    /**
     * @param {boolean} c
     */
    setSelected(c)
    {
        if (this._selected != c)
        {
            this._selected = c;
            this._rectInstancer.setSelected(this._attrIndex, c);
        }
    }

    get visible() { return this._visible; }

    set visible(v)
    {
        const changed = this._visible != v;
        this._visible = v;

        if (changed)
        {
            this._updateSize();

            if (!this.visible) this._hovering = false;
            for (let i = 0; i < this.childs.length; i++) this.childs[i].visible = v;
        }
    }

    _updateSize()
    {
        if (!this._visible) this._rectInstancer.setSize(this._attrIndex, 0, 0);
        else this._rectInstancer.setSize(this._attrIndex, this._w, this._h);
    }

    setSize(w, h)
    {
        if (this._w == w && this._h == h) return;
        this._w = w;
        this._h = h;
        this._updateSize();
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    setColorHover(r, g, b, a)
    {
        this.colorHover = vec4.create();
        vec4.set(this.colorHover, r, g, b, a);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a=1
     */
    setColor(r, g, b, a = 1)
    {
        if (r === undefined)r = g = b = a = 1.0;
        if (r.length) vec4.set(this.color, r[0], r[1], r[2], r[3]);
        else vec4.set(this.color, r, g, b, a);
        this._rectInstancer.setColor(this._attrIndex, this.color);
    }

    setOpacity(a, childs)
    {
        this.setColor(this.color[0], this.color[1], this.color[2], a);

        if (childs !== false)
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
        this._visible = p.visible;
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

    /**
     * @param {number} _x
     * @param {number} _y
     * @param {number} _z
     */
    setPosition(_x, _y, _z = 0)
    {
        this._x = _x;
        this._y = _y;
        this._z = _z;

        this._absX = this._x;
        this._absY = this._y;
        this._absZ = this._z;

        if (this._parent)
        {
            this._absX += this.getParentX();
            this._absY += this.getParentY();
            this._absZ += this.getParentZ();
        }

        this._rectInstancer.setPosition(this._attrIndex, this._absX, this._absY, this._absZ);

        for (let i = 0; i < this.childs.length; i++) this.childs[i].setPosition(this.childs[i].x, this.childs[i].y, this.childs[i].z);
        this.emitEvent("positionChanged");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    isPointInside(x, y)
    {
        return x > this._absX && x < this._absX + this._w && y > this._absY && y < this._absY + this._h;
    }

    mouseUp(e)
    {
        if (this._hovering) this.emitEvent("mouseup", e, this);
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseUp(e);

        if (this._isDragging) this.mouseDragEnd();
    }

    mouseDown(e)
    {
        if (this._hovering) this.emitEvent("mousedown", e, this);
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseDown(e);
    }

    isHovering()
    {
        return this._hovering;
    }

    getParentX()
    {
        // todo: add up all parents
        if (!this._parent) return 0;
        return this._parent._absX;
    }

    getParentY()
    {
        // todo: add up all parents
        if (!this._parent) return 0;
        return this._parent._absY;
    }

    getParentZ()
    {
        // todo: add up all parents
        if (!this._parent) return 0;
        return this._parent._absZ;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    mouseDrag(x, y)
    {
        if (!this.interactive) return;

        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        if (this.draggableX) this._dragOffsetX = x - this._dragStartX;
        if (this.draggableY) this._dragOffsetY = y - this._dragStartY;

        if (this.draggableMove)
        {
            this.setPosition(this.x + this._dragOffsetX + this.getParentX(), this.y + this._dragOffsetY + this.getParentY());
            this._dragStartX = this.x;
            this._dragStartY = this.y;
        }
        // this.setPosition( x - this._dragOffsetX, y - this._dragOffsetY);
        this.emitEvent("drag", this, this._dragOffsetX, this._dragOffsetY);
    }

    mouseDragEnd()
    {
        if (!this.interactive) return;
        this.emitEvent("dragEnd", this);
        this._isDragging = false;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} button
     */
    mouseMove(x, y, button)
    {
        if (!this.interactive) return;
        if (!this._visible) return;

        const hovering = this.isPointInside(x, y);
        const isHovered = this._hovering;

        const hoverChanged = this._hovering != hovering;
        this._hovering = hovering;

        if (hovering && !isHovered) this.emitEvent("hover", this);
        else if (!hovering && isHovered) this.emitEvent("unhover", this);

        if (hoverChanged)
        {
            if (this.colorHover)
            {
                if (!this._hovering) this._rectInstancer.setColor(this._attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);
                else this._rectInstancer.setColor(this._attrIndex, this.colorHover[0], this.colorHover[1], this.colorHover[2], this.colorHover[3]);
            }
            else this._rectInstancer.setColor(this._attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);

            // if (this.colorHoverMultiply)
            // {
            //     if (!this._hovering) this._rectInstancer.setColor(this._attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);
            //     else this._rectInstancer.setColor(this._attrIndex, this.color[0] * this.colorHoverMultiply, this.color[1] * this.colorHoverMultiply, this.color[2] * this.colorHoverMultiply, this.color[3] * this.colorHoverMultiply);
            // }
        }

        for (let i = 0; i < this.childs.length; i++)
        {
            this.childs[i].mouseMove(x, y, button);
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
                this._dragOffsetX = x;
                this._dragOffsetY = y;
            }
        }
    }

    removeChild(child)
    {
        const idx = this.childs.indexOf(child);
        child._parent = null;
        if (idx >= 0) this.childs.splice(idx, 1);
    }

    dispose()
    {
        this.visible = false;
        if (this._parent) this._parent.removeChild(this);
        this.setShape(0);
        this.setSize(0, 0);
        this.setPosition(0, 0);
        return null;
    }
}
