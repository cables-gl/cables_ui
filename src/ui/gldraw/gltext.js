import { vec4 } from "gl-matrix";
import { utils } from "cables";
import font from "../glpatch/sdf_font.json";
import GlRect from "./glrect.js";
import GlTextWriter from "./gltextwriter.js";

/** Draws text with an msdf font texture, using {@link GlRectInstancer}. */
export default class GlText
{
    #textWriter;

    #x = 0;
    #y = 0;
    #z = 0;

    /** @type {GlRect[]} */
    #rects = [];
    #rectCount = 0;

    #builtString = null;
    #builtScale = 0;
    #builtAlign = 0;
    #originX = 0;
    #originY = 0;
    #originZ = 0;
    _width = 0;
    _height = 0;
    _color = [1, 1, 1, 1];
    _align = 0;
    _scale = 1.2;
    _parentRect = null;

    /**
     * @param {GlTextWriter} textWriter
     * @param {string} string
     */
    constructor(textWriter, string)
    {
        if (!textWriter)
        {
            throw new Error("glgui text constructor without textwriter");
        }

        this.disposed = false;
        this._visible = true;
        this.#textWriter = textWriter;
        this._string = string || "";

        this._font = font;
        if (this._font && this._font.chars && !this._font.characters)
        {
            this._font.characters = {};

            for (let i = 0; i < this._font.chars.length; i++) this._font.characters[this._font.chars[i].char] = this._font.chars[i];
        }

        this.rebuild();
    }

    /**
     * @param {number} x
     */
    set x(x) { this.#x = x; this.rebuild(); }
    get x() { return this.#x; }
    get y() { return this.#y; }

    /**
     * @param {number} y
     */
    set y(y) { this.#y = y; this.rebuild(); }

    /**
     * @param {number} z
     */
    set z(z) { this.#z = z; this.rebuild(); }

    set text(t)
    {
        if (this.disposed) return;
        this._string = t || "";
        this.rebuild();
    }

    get text() { return this._string; }

    get width() { return this._width; }

    get height() { return this._height * 0.5 * this._scale; }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z = 0)
    {
        this.#x = x;
        this.#y = y;
        this.#z = z;

        this.rebuild();
    }

    /**
     * @param {number} s
     */
    set scale(s)
    {
        this._scale = s;
        this.rebuild();
    }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        if (this._visible === v) return;
        this._visible = v;
        for (let i = 0; i < this.#rects.length; i++)
            if (this.#rects[i]) this.#rects[i].visible = v;
    }

    /**
     * @param {number} x
     */
    _map(x)
    {
        return x * 0.11 * this._scale;
    }

    /**
     * @param {GlRect} r
     */
    setParentRect(r)
    {
        if (this._parentRectListener && this._parentRect) this._parentRectListener = this._parentRect.off(this._parentRectListener);

        this._parentRect = r;
        if (this._parentRect) this._parentRectListener = this._parentRect.on(GlRect.EVENT_POSITIONCHANGED, this.rebuild.bind(this));
        this.rebuild();
    }

    /**
     * @param {number} a
     */
    setOpacity(a)
    {
        this.setColor(this._color[0], this._color[1], this._color[2], a);
    }

    /**
     * @param {number|array} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    setColor(r, g = 1, b = 1, a = 1)
    {
        if (this.disposed) return;
        if (r === undefined)r = g = b = 1.0;
        if (r.length)
        {
            utils.logStack();
            vec4.set(this._color, r[0], r[1], r[2], a);
        }
        else vec4.set(this._color, r, g, b, a);

        for (let i = 0; i < this.#rects.length; i++) if (this.#rects[i]) this.#rects[i].setColorArray(this._color);
    }

    /**
     * @param {number[]} r
     */
    setColorArray(r)
    {
        if (this.disposed) return;
        vec4.set(this._color, r[0], r[1], r[2], 1);

        for (let i = 0; i < this.#rects.length; i++) if (this.#rects[i]) this.#rects[i].setColorArray(this._color);

    }

    rebuild()
    {
        if (this.disposed) return;

        let originX = this.#x;
        let originY = this.#y;
        let originZ = this.#z;
        if (this._parentRect)
        {
            originX += this._parentRect.absX;
            originY += this._parentRect.absY;
            originZ += this._parentRect.absZ;
        }

        if (this._string === this.#builtString && this._scale === this.#builtScale && this._align === this.#builtAlign)
        {
            this.#translate(originX - this.#originX, originY - this.#originY, originZ - this.#originZ);
        }
        else this.#layout();

        this.#originX = originX;
        this.#originY = originY;
        this.#originZ = originZ;
    }

    /**
     * @param {number} dx
     * @param {number} dy
     * @param {number} dz
     */
    #translate(dx, dy, dz)
    {
        if (dx == 0 && dy == 0 && dz == 0) return;
        for (let i = 1; i <= this.#rectCount; i++)
        {
            const rect = this.#rects[i];
            rect.setPosition(rect.x + dx, rect.y + dy, rect.z + dz);
        }
    }

    #layout()
    {
        let w = 0;
        for (let i = 0; i < this._string.length; i++)
        {
            const ch = this._font.characters[this._string[i]] || this._font.characters["?"];
            w += ch.xadvance;
        }

        this._width = this._map(w);

        const lineHeight = this._map(this._font.info.size / 2) + 13;
        let posX = this.#x;
        let posY = this.#y + lineHeight;
        let posZ = this.#z;
        let countLines = 1;

        if (this._parentRect)
        {
            posX += this._parentRect.absX;
            posY += this._parentRect.absY;
            posZ += this._parentRect.absZ;
        }

        if (this._align == 1) posX -= this._width / 2;
        else if (this._align == 2) posX -= this._width;

        let rectCount = 0;
        for (let i = 0; i < this._string.length; i++)
        {
            const char = this._string.charAt(i);
            const ch = this._font.characters[char] || this._font.characters["?"];
            if (char == "\n")
            {
                posX = this.#x;
                if (this._parentRect) posX = this.#x + this._parentRect.x;
                posY += lineHeight;
                countLines++;
                continue;
            }
            rectCount++;

            /** @type {GlRect} */
            const rect = this.#rects[rectCount] || this.#textWriter.rectDrawer.createRect({ "name": "textrect", "interactive": false });
            rect.visible = this._visible;
            this.#rects[rectCount] = rect;

            rect.setPosition(posX + this._map(ch.xoffset), this._map(ch.yoffset) - -posY - lineHeight + 6.0, posZ); //
            rect.setSize(this._map(ch.width), this._map(ch.height));
            rect.setColorArray(this._color);

            rect.setTexRect(ch.x / 1024, ch.y / 1024, ch.width / 1024, ch.height / 1024);
            rect.setTexture(0);

            posX += this._map(ch.xadvance);
        }

        for (let i = rectCount + 1; i < this.#rects.length; i++)
        {
            if (this.#rects[i])
            {
                this.#rects[i].setSize(0, 0);
                this.#rects[i].visible = false;
            }
        }

        this._height = countLines * lineHeight;
        this.#rectCount = rectCount;
        this.#builtString = this._string;
        this.#builtScale = this._scale;
        this.#builtAlign = this._align;
    }

    dispose()
    {
        this.setColor(1, 0, 0, 1);
        this.disposed = true;
        for (let i = 0; i < this.#rects.length; i++)
            if (this.#rects[i])
            {
                this.#rects[i].dispose();
            }

        this.#rects.length = 0;
        this._string = "";
        return null;
    }
}
