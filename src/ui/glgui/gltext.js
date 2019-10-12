

CABLES.GLGUI.Text=class
{
    constructor(textWriter,string)
    {
        this._textWriter=textWriter;
        this._string=string;
        this._x=-100;
        this._y=0;
        this._rects=[];

        this.rebuild();
    }

    set x(x){this._x=x;this.rebuild();}
    set y(y){this._y=y;this.rebuild();}
    set text(t){this._string=t;this.rebuild();}

    setPosition(x,y)
    {
        this._x=x;
        this._y=y;
        this.rebuild();
    }

    _map(x)
    {
        return x*0.2;
    }

    rebuild()
    {
        const font=CABLES.GLGUI.SDF_FONT_ARIAL;

        var posX=this._x;
        for(var i=0;i<this._string.length;i++)
        {
            const ch=font.characters[this._string.charAt(i)];
            
            var rect=this._rects[i] || this._textWriter.rectDrawer.createRect();
            this._rects[i]=rect;

            rect.setSize(this._map(ch.width),this._map(ch.height));
            rect.setColor(1,0,0,1);
            rect.setPosition(posX,this._map(font.size-ch.originY)+this._y + 7);
            rect.setTexRect(
                ch.x/font.width,ch.y/font.height,
                ch.width/font.width,ch.height/font.height);
            
            posX+=this._map(ch.width-ch.originX);
        }

        

    }
}