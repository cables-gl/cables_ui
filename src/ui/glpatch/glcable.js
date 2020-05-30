CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlCable = class
{
    constructor(linedrawer, buttonRect, type)
    {
        this._buttonRect = buttonRect;
        this._type = type;
        this._lineDrawer = linedrawer;

        this._lineIdx0 = this._lineDrawer.getIndex();
        this._lineIdx1 = this._lineDrawer.getIndex();
        this._lineIdx2 = this._lineDrawer.getIndex();

        this._x = 0;
        this._y = 0;
        this._y2 = 0;
        this._x2 = 0;
        this._h = CABLES.GLGUI.VISUALCONFIG.portHeight * 2;
    }

    set visible(v)
    {
        this._visible = v;
        this._buttonRect.visible = v;
        this._updateLinePos();
    }

    _updateLinePos()
    {
        if (this._visible)
        {
            this._lineDrawer.setLine(this._lineIdx0, this._x, this._y, this._x, this._y - this._h);
            this._lineDrawer.setLine(this._lineIdx1, this._x, this._y - this._h, this._x2, this._y2 + this._h);
            this._lineDrawer.setLine(this._lineIdx2, this._x2, this._y2 + this._h, this._x2, this._y2);
        }
        else
        {
            this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);
            this._lineDrawer.setLine(this._lineIdx1, 0, 0, 0, 0);
            this._lineDrawer.setLine(this._lineIdx2, 0, 0, 0, 0);
        }
    }

    setPosition(x, y, x2, y2)
    {
        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;

        this._updateLinePos();

        // circle button
        const buttonSize = 12;
        this._buttonRect.setCircle(1);
        this._buttonRect.setSize(buttonSize, buttonSize);
        this._buttonRect.setPosition(
            x + ((x2 - x) / 2) - buttonSize / 2,
            (y + this._h) + (((y2 - this._h) - (y + this._h)) / 2) - buttonSize / 2
        );
    }


    setColor(r, g, b, a)
    {
        this._lineDrawer.setColor(this._lineIdx0, r, g, b, a);
        this._lineDrawer.setColor(this._lineIdx1, r, g, b, a);
        this._lineDrawer.setColor(this._lineIdx2, r, g, b, a);

        this._buttonRect.setColor(r, g, b, a);
    }

    setSpeed(speed)
    {
        this._lineDrawer.setSpeed(this._lineIdx0, speed);
        this._lineDrawer.setSpeed(this._lineIdx1, speed);
        this._lineDrawer.setSpeed(this._lineIdx2, speed);
    }
};
