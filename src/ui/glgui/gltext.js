

CABLES.GLGUI.Text=class
{
    constructor(textWriter,string)
    {
        if(!textWriter)
        {
            throw new Error("glgui text constructor without textwriter");
            return;
        }
        this._textWriter=textWriter;
        this._string=string;
        this._x=0;
        this._y=0;
        this._rects=[];
        this._width=0;
        this._height=0;
        this._r=this._g=this._b=1;
        this._align=0;
        this._scale=1;        

        this.rebuild();
    }

    set x(x){this._x=x;this.rebuild();}
    set y(y){this._y=y;this.rebuild();}
    set text(t){this._string=t;this.rebuild();}

    get width(){ return this._width; }
    get height(){ return this._height; }

    setPosition(x,y)
    {
        this._x=x;
        this._y=y;
        this.rebuild();
    }

    set scale(s)
    {
        this._scale=s;
        this.rebuild();
    }

    _map(x)
    {
        return x*0.2*this._scale;
    }

    setParentRect(r)
    {
        if(this._parentRect) this._parentRect.removeEventListener(this.rebuild.bind(this));

        this._parentRect=r;
        // this._parentRect.on("positionChanged",this.rebuild.bind(this));
        this._parentRect.on("positionChanged",this.rebuild.bind(this));
    }

    setColor(r,g,b)
    {
        this._r=r;
        this._g=g;
        this._b=b;        
        for(var i=0;i<this._rects.length;i++) if(this._rects[i]) this._rects[i].setColor(r,g,b,1);
    }

    rebuild()
    {
        // if(this._string===undefined || this._string===null)return;
        
        const font=CABLES.GLGUI.SDF_FONT_ARIAL;
        var w=0;
        for (var i = 0; i < this._string.length; i++)
        {
            var ch=font.characters[this._string[i]]||font.characters["?"];
            // if(!font.characters[ch]) ch="?";
            w += ch.advance;
        }

        this._width=this._map(w);

        const lineHeight=this._map(font.size/2)+13;
        var posX=this._x;
        var posY=this._y+lineHeight;
        var countLines=1;

        if(this._parentRect)
        {
            posX+=this._parentRect.x;
            posY+=this._parentRect.y;
        }

        if(this._align==1) posX-=this._width/2;
        else if(this._align==2) posX-=this._width;

        var rectCount=0;
        for(var i=0;i<this._string.length;i++)
        {
            const char=this._string.charAt(i);
            const ch=font.characters[char]||font.characters["?"];
            if(char=='\n')
            {
                posX=0;
                posY+=lineHeight;
                countLines++;
                continue;
            }
            rectCount++;
            var rect=this._rects[rectCount] || this._textWriter.rectDrawer.createRect();
            this._rects[rectCount]=rect;

            rect.setPosition(posX-this._map(ch.originX), posY-this._map(ch.originY));
            rect.setSize(this._map(ch.width), this._map(ch.height));
            rect.setColor(this._r,this._g,this._b,1);
            rect.setTexRect(
                ch.x/font.width, ch.y/font.height,
                ch.width/font.width, ch.height/font.height);
            rect.setTexture(this._textWriter.getFontTexture());

            posX+=this._map(ch.advance);
        }

        this._height=countLines*lineHeight;

    }

    dispose()
    {
        for(var i=0;i<this._rects.length;i++) if(this._rects[i]) this._rects[i].dispose();
    }
}