CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlSelectionArea = class
{
    constructor(rectinstancer, glpatch)
    {
        this._selectRect = rectinstancer.createRect();
        this._selectRect.setColor(CABLES.GLGUI.VISUALCONFIG.colors.patchSelectionArea);
        this._selectRect.setPosition(0, 0, 1000);
        this._selectRect.setSize(0, 0);
        this._selectRect.setPosition(0, 0, 1000);

        this._w = 0;
        this._h = 0;
    }

    get w() { return this._w; }

    get h() { return this._h; }

    get active()
    {
        return this._w != 0 || this._h != 0;
    }

    hideArea()
    {
        this._selectRect.setSize(0, 0);
    }

    setPos(x, y)
    {
        this._selectRect.setPosition(x, y, 0.1);
    }

    setSize(w, h)
    {
        this._w = w;
        this._h = h;

        this._selectRect.setSize(w, h);
    }
};
