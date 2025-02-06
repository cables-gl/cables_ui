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
    color = vec4.create();
    colorHover = null;
    interactive = true;
    childs = [];

    #parent = null;
    #visible = true;
    #hovering = false;
    #rectInstancer = null;
    #attrIndex = null;
    #texture = null;
    #shape = 0;
    #data = {};

    #w = 110;
    #h = 110;
    #x = 0;
    #y = 0;
    #z = 0;

    #absX = 0;
    #absY = 0;
    #absZ = 0;

    #isDragging = false;
    #draggable = false;
    #dragStartX = 0;
    #dragStartY = 0;
    #dragOffsetX = 0;
    #dragOffsetY = 0;
    draggableX = true;
    draggableY = true;
    draggableMove = false;

    #log = new Logger("GlRect");

    static EVENT_POINTER_HOVER = "hover";
    static EVENT_POINTER_UNHOVER = "unhover";
    static EVENT_POINTER_MOVE = "pointerMove";
    static EVENT_POINTER_UP = "mouseup";
    static EVENT_POINTER_DOWN = "mousedown";

    static EVENT_DRAG = "drag";
    static EVENT_DRAGSTART = "dragStart";
    static EVENT_DRAGEND = "dragEnd";

    static EVENT_POSITIONCHANGED = "positionChanged";
    static EVENT_TEXTURECHANGED = "textureChanged";

    static OPTION_INTERACTIVE = "interactive";
    static OPTION_PARENT = "parent";

    /**
     * @param {GlRectInstancer} instancer
     * @param {Object} options
     */
    constructor(instancer, options)
    {
        super();

        if (!instancer || !instancer.getIndex) this.#log.warn("no instancer given!");

        this.#rectInstancer = instancer;
        this.#attrIndex = instancer.getIndex();
        this.#rectInstancer.setSize(this.#attrIndex, this.#w, this.#h);
        options = options || {};

        if (options.hasOwnProperty(GlRect.OPTION_INTERACTIVE)) this.interactive = options.interactive;
        if (options.hasOwnProperty(GlRect.OPTION_PARENT)) this.setParent(options.parent);
    }

    get x() { return this.#x; }
    get y() { return this.#y; }
    get z() { return this.#z; }

    get w() { return this.#w; }
    get h() { return this.#h; }

    get absX() { return this.#absX; }
    get absY() { return this.#absY; }
    get absZ() { return this.#absZ; }

    get dragOffsetX() { return this.#dragOffsetX; }
    get dragOffsetY() { return this.#dragOffsetY; }

    get data() { return this.#data; }
    set data(r) { this.#data = r; }

    set draggable(b) { this.#draggable = b; }
    get draggable() { return this.#draggable; }
    get isDragging() { return this.#isDragging; }

    get idx() { return this.#attrIndex; }

    get parent() { return this.#parent; }

    /**
     * @param {GlRect} c
     */
    hasChild(c)
    {
        return this.childs.indexOf(c) > -1;
    }

    /**
     * @param {GlRect} c
     */
    addChild(c)
    {
        if (!this.hasChild(c)) this.childs.push(c);
    }

    /**
     * @param {number} c
     */
    setShape(c)
    {
        if (this.#shape != c)
        {
            this.#shape = c;
            this.#rectInstancer.setShape(this.#attrIndex, c);
        }

        if (this._border != 0) this.#rectInstancer.setBorder(this.#attrIndex, 0);
        if (this._selected != 0) this.#rectInstancer.setSelected(this.#attrIndex, 0);
    }

    /**
     * @param {number} c
     */
    setBorder(c)
    {
        if (this._border != c)
        {
            this._border = c;
            this.#rectInstancer.setBorder(this.#attrIndex, c);
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
            this.#rectInstancer.setSelected(this.#attrIndex, c);
        }
    }

    /**
     * @returns {boolean}
     */
    get visible() { return this.#visible; }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        const changed = this.#visible != v;
        this.#visible = v;

        if (changed)
        {
            this._updateSize();

            if (!this.visible) this.#hovering = false;
            for (let i = 0; i < this.childs.length; i++) this.childs[i].visible = v;
        }
    }

    _updateSize()
    {
        if (!this.#visible) this.#rectInstancer.setSize(this.#attrIndex, 0, 0);
        else this.#rectInstancer.setSize(this.#attrIndex, this.#w, this.#h);
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h)
    {
        if (this.#w == w && this.#h == h) return;
        this.#w = w;
        this.#h = h;
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
        this.#rectInstancer.setColor(this.#attrIndex, this.color);
    }

    /**
     * @param {number} a
     * @param {boolean} childs
     */
    setOpacity(a, childs)
    {
        this.setColor(this.color[0], this.color[1], this.color[2], a);

        if (childs !== false)
            for (let i = 0; i < this.childs.length; i++) this.childs[i].setOpacity(a);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setTexRect(x, y, w, h)
    {
        this.#rectInstancer.setTexRect(this.#attrIndex, x, y, w, h);
    }

    /**
     * @param {GlRect} p
     */
    setParent(p)
    {
        this.#parent = p;
        p.addChild(this);
        this.#visible = p.visible;
        this.updateParentPosition();
    }

    get texture()
    {
        return this.#texture;
    }

    /**
     * @param {CGL.Texture} t
     */
    setTexture(t)
    {
        if (this.#texture == t) return;
        this.#texture = t;
        this.emitEvent(GlRect.EVENT_TEXTURECHANGED);
    }

    /**
     * @param {number} _x
     * @param {number} _y
     * @param {number} _z
     */
    setPosition(_x, _y, _z = 0)
    {
        this.#x = _x;
        this.#y = _y;
        this.#z = _z;

        this.#absX = this.#x;
        this.#absY = this.#y;
        this.#absZ = this.#z;

        if (this.#parent)
        {
            this.#absX += this.getParentX();
            this.#absY += this.getParentY();
            this.#absZ += this.getParentZ();
        }

        this.#rectInstancer.setPosition(this.#attrIndex, this.#absX, this.#absY, this.#absZ);

        for (let i = 0; i < this.childs.length; i++) this.childs[i].updateParentPosition();
        this.emitEvent(GlRect.EVENT_POSITIONCHANGED);
    }

    updateParentPosition()
    {
        this.setPosition(this.x, this.y, this.z);
    }

    /**
     * Description
     * @param {any} x
     * @param {any} y
     */
    isPointInside(x, y)
    {
        return x > this.#absX && x < this.#absX + this.#w && y > this.#absY && y < this.#absY + this.#h;
    }

    /**
     * @param {MouseEvent} e
     */
    mouseUp(e)
    {
        if (this.#hovering) this.emitEvent(GlRect.EVENT_POINTER_UP, e, this);
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseUp(e);

        if (this.#isDragging) this.mouseDragEnd();
    }

    /**
     * @param {MouseEvent} e
     */
    mouseDown(e)
    {
        if (this.#hovering) this.emitEvent(GlRect.EVENT_POINTER_DOWN, e, this);
        for (let i = 0; i < this.childs.length; i++) this.childs[i].mouseDown(e);
    }

    /**
     * @returns {boolean}
     */
    isHovering()
    {
        return this.#hovering;
    }

    /**
     * @returns {number}
     */
    getParentX()
    {
        let px = 0;
        let p = this.#parent;
        while (p)
        {
            px += p.x;
            p = p.parent;
        }

        return px;
    }

    /**
     * @returns {number}
     */
    getParentY()
    {
        let py = 0;
        let p = this.#parent;
        while (p)
        {
            py += p.y;
            p = p.parent;
        }

        return py;
    }

    /**
     * @returns {number}
     */
    getParentZ()
    {
        // todo: add up all parents
        if (!this.#parent) return 0;
        return this.#parent.absZ;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} button
     * * @param {MouseEvent} event
     */
    mouseDrag(x, y, button, event)
    {
        if (!this.interactive) return;

        this.#dragOffsetX = 0;
        this.#dragOffsetY = 0;
        if (this.draggableX) this.#dragOffsetX = x - this.#dragStartX;
        if (this.draggableY) this.#dragOffsetY = y - this.#dragStartY;

        if (this.draggableMove)
        {
            this.setPosition(this.x + this.#dragOffsetX + this.getParentX(), this.y + this.#dragOffsetY + this.getParentY());
            this.#dragStartX = this.x;
            this.#dragStartY = this.y;
        }

        this.emitEvent(GlRect.EVENT_DRAG, this, this.#dragOffsetX, this.#dragOffsetY, button, event);
    }

    mouseDragEnd()
    {
        if (!this.interactive) return;
        this.emitEvent(GlRect.EVENT_DRAGEND, this);
        this.#isDragging = false;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} button
     */
    mouseMove(x, y, button, e)
    {
        if (!this.interactive) return;
        if (!this.#visible) return;

        const hovering = this.isPointInside(x, y);
        const isHovered = this.#hovering;

        const hoverChanged = this.#hovering != hovering;
        this.#hovering = hovering;

        if (hovering && !isHovered) this.emitEvent(GlRect.EVENT_POINTER_HOVER, this);
        else if (!hovering && isHovered) this.emitEvent(GlRect.EVENT_POINTER_UNHOVER, this);

        if (hoverChanged)
        {
            if (this.colorHover)
            {
                if (!this.#hovering) this.#rectInstancer.setColor(this.#attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);
                else this.#rectInstancer.setColor(this.#attrIndex, this.colorHover[0], this.colorHover[1], this.colorHover[2], this.colorHover[3]);
            }
            else this.#rectInstancer.setColor(this.#attrIndex, this.color[0], this.color[1], this.color[2], this.color[3]);

        }

        for (let i = 0; i < this.childs.length; i++)
        {
            this.childs[i].mouseMove(x, y, button, e);
            if (this.childs[i].isHovering()) this.#hovering = false;
        }

        if (this.#hovering)
        {
            if (button == 1 && this.#rectInstancer.allowDragging)
            {
                if (!this.#isDragging)
                {
                    this.#isDragging = true;
                    this.#dragStartX = x;
                    this.#dragStartY = y;
                    this.emitEvent(GlRect.EVENT_DRAGSTART, this, x, y, button, e);
                }
                this.#dragOffsetX = x;
                this.#dragOffsetY = y;
            }
            this.emitEvent(GlRect.EVENT_POINTER_MOVE, x, y);
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
        if (this.#parent) this.#parent.removeChild(this);
        this.setShape(0);
        this.setSize(0, 0);
        return null;
    }
}
