import { vec4 } from "gl-matrix";
import { utils } from "cables";
import font from "../glpatch/sdf_font.json";
import GlRect from "./glrect.js";
import GlTextWriter from "./gltextwriter.js";

/**
 * draw text using msdf font texture, using {@link GlRectInstancer}
 *
 * @export
 * @class GlText
 */
export default class GlText
{

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
        this._textWriter = textWriter;
        this._string = string || "";
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._rects = [];
        this._width = 0;
        this._height = 0;
        this._color = [1, 1, 1, 1];
        this._align = 0;
        this._scale = 1.2;
        this._parentRect = null;

        this._font = font;
        if (this._font && this._font.chars)
        {
            this._font.characters = {};

            for (let i = 0; i < this._font.chars.length; i++) this._font.characters[this._font.chars[i].char] = this._font.chars[i];
        }

        this.rebuild();
    }

    /**
     * @param {number} x
     */
    set x(x) { this._x = x; this.rebuild(); }
    get x() { return this._x; }
    get y() { return this._y; }

    /**
     * @param {number} y
     */
    set y(y) { this._y = y; this.rebuild(); }

    /**
     * @param {number} z
     */
    set z(z) { this._z = z; this.rebuild(); }

    set text(t)
    {
        if (this.disposed) return;
        this._string = t;
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
        this._x = x;
        this._y = y;
        this._z = z;

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
        for (let i = 0; i < this._rects.length; i++)
            if (this._rects[i]) this._rects[i].visible = v;
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

        for (let i = 0; i < this._rects.length; i++) if (this._rects[i]) this._rects[i].setColorArray(this._color);
    }

    /**
     * @param {number[]} r
     */
    setColorArray(r)
    {
        if (this.disposed) return;
        vec4.set(this._color, r[0], r[1], r[2], 1);

        for (let i = 0; i < this._rects.length; i++) if (this._rects[i]) this._rects[i].setColorArray(this._color);

    }

    rebuild()
    {
        if (this.disposed) return;
        let w = 0;
        for (let i = 0; i < this._string.length; i++)
        {
            const ch = this._font.characters[this._string[i]] || this._font.characters["?"];
            w += ch.xadvance;
        }

        this._width = this._map(w);

        const lineHeight = this._map(this._font.info.size / 2) + 13;
        let posX = this._x;
        let posY = this._y + lineHeight;
        let posZ = this._z;
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
                posX = this._x;
                if (this._parentRect) posX = this._x + this._parentRect.x;
                posY += lineHeight;
                countLines++;
                continue;
            }
            rectCount++;
            const rect = this._rects[rectCount] || this._textWriter.rectDrawer.createRect({ "name": "textrect", "interactive": false });
            rect.visible = this._visible;
            this._rects[rectCount] = rect;

            rect.setPosition(posX + this._map(ch.xoffset), this._map(ch.yoffset) - -posY - lineHeight + 6.0, posZ); //
            rect.setSize(this._map(ch.width), this._map(ch.height));
            rect.setColorArray(this._color);

            rect.setTexRect(
                ch.x / 1024, ch.y / 1024, ch.width / 1024, ch.height / 1024);
            rect.setTexture(this._textWriter.getFontTexture());

            posX += this._map(ch.xadvance);
        }

        for (let i = rectCount + 1; i < this._rects.length; i++)
        {
            if (this._rects[i])
            {
                this._rects[i].setSize(0, 0);
                this._rects[i].visible = false;
            }
        }

        this._height = countLines * lineHeight;
    }

    dispose()
    {
        this.setColor(1, 0, 0, 1);
        this.disposed = true;
        for (let i = 0; i < this._rects.length; i++)
            if (this._rects[i])
            {
                this._rects[i].dispose();
            }

        this._rects.length = 0;
        this._string = "";
        return null;
    }
}
