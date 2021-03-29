CABLES.GLGUI.Text = class
{
    constructor(textWriter, string)
    {
        if (!textWriter)
        {
            throw new Error("glgui text constructor without textwriter");
        }

        this._visible = true;
        this._textWriter = textWriter;
        this._string = string;
        this._x = 0;
        this._y = 0;
        this._rects = [];
        this._width = 0;
        this._height = 0;
        this._color = [1, 1, 1, 1];
        this._align = 0;
        this._scale = 0.9;
        this._parentRect = null;


        this._font = CABLES.GLGUI.MSDF_FONT_WORKSANS;
        if (this._font && this._font.chars)
        {
            this._font.characters = {};

            for (let i = 0; i < this._font.chars.length; i++) this._font.characters[this._font.chars[i].char] = this._font.chars[i];
        }


        this.rebuild();
    }

    set x(x) { this._x = x; this.rebuild(); }

    set y(y) { this._y = y; this.rebuild(); }

    set text(t) { this._string = t; this.rebuild(); }

    get text() { return this._string; }

    get width() { return this._width; }

    get height() { return this._height; }

    setPosition(x, y)
    {
        this._x = x;
        this._y = y;
        this.rebuild();
    }

    set scale(s)
    {
        this._scale = s;
        this.rebuild();
    }

    set visible(v)
    {
        this._visible = v;
        for (let i = 0; i < this._rects.length; i++)
            if (this._rects[i]) this._rects[i].visible = v;
    }

    _map(x)
    {
        return x * 0.11 * this._scale;
    }

    setParentRect(r)
    {
        if (this._parentRect) this._parentRect.removeEventListener(this.rebuild.bind(this));

        this._parentRect = r;
        // this._parentRect.on("positionChanged",this.rebuild.bind(this));
        this._parentRect.on("positionChanged", this.rebuild.bind(this));
    }

    setOpacity(a)
    {
        this.setColor(this._color[0], this._color[1], this._color[2], a);
    }

    setColor(r, g, b, a)
    {
        if (a === undefined)a = 1.0;
        if (r.length) vec4.set(this._color, r[0], r[1], r[2], 1);
        else vec4.set(this._color, r, g, b, a);

        for (let i = 0; i < this._rects.length; i++) if (this._rects[i]) this._rects[i].setColor(this._color);
    }


    rebuild()
    {
        // if(this._string===undefined || this._string===null)return;

        let w = 0;
        for (let i = 0; i < this._string.length; i++)
        {
            // const ch = this.getChar(font, font.characters[this._string[i]]);

            const ch = this._font.characters[this._string[i]] || this._font.characters["?"];
            // if(!font.characters[ch]) ch="?";
            w += ch.xadvance;
        }

        this._width = this._map(w);

        const lineHeight = this._map(this._font.info.size / 2) + 13;
        let posX = this._x;


        let posY = this._y + lineHeight;
        let countLines = 1;

        if (this._parentRect)
        {
            posX += this._parentRect.x;
            posY += this._parentRect.y;
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
            const rect = this._rects[rectCount] || this._textWriter.rectDrawer.createRect();
            rect.visible = this._visible;
            this._rects[rectCount] = rect;

            // if (i == 3)
            // console.log(posX - this._map(ch.xoffset), posY - this._map(ch.yoffset));
            rect.setPosition(posX + this._map(ch.xoffset), this._map(ch.yoffset) - -posY - lineHeight + 6.0); //
            rect.setSize(this._map(ch.width), this._map(ch.height));
            rect.setColor(this._color);

            // console.log(ch.x / this._font.info.size, ch.y / this._font.info.size);
            rect.setTexRect(
                // ch.x / this._font.width, ch.y / this._font.height,
                ch.x / 1024, ch.y / 1024,

                ch.width / 1024, ch.height / 1024);
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
        for (let i = 0; i < this._rects.length; i++) if (this._rects[i]) this._rects[i].dispose();
    }
};
