import glUiConfig from "./gluiconfig";


export default class GlSelectionArea
{
    constructor(rectinstancer, glpatch)
    {
        this._selectRect = rectinstancer.createRect();

        this.updateTheme();
        this._selectRect.setSize(0, 0);
        this._selectRect.setPosition(0, 0, 1000);
        this.previousOps = [];

        this._w = 0;
        this._h = 0;
    }

    updateTheme()
    {
        this._selectRect.setColor(gui.theme.colors_patch.patchSelectionArea);
    }

    get w() { return this._w; }

    get h() { return this._h; }

    get active()
    {
        return this._w != 0 || this._h != 0;
    }

    mouseUp()
    {
        this._w = this._h = 0;
    }

    setColor(rgba)
    {
        this._selectRect.setColor(rgba);
    }

    isVisible()
    {
        return this._selectRect._w != 0 && this._selectRect._h != 0;
    }

    hideArea()
    {
        this._selectRect.setSize(0, 0);
    }

    setPos(x, y)
    {
        this._selectRect.setPosition(x, y, -0.1);
    }

    setSize(w, h)
    {
        this._w = w;
        this._h = h;

        this._selectRect.setSize(w, h);
    }
}
