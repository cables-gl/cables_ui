var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.Text=class
{
    constructor(textWriter,text)
    {
        this._x=0;
        this._y=0;
        this._text=text;
        this._textWriter=textWriter;
    }

    set x(x){ this._x=x;}
    set y(y){ this._y=y;}
    get x(){ return this._x;}
    get y(){ return this._y;}
}