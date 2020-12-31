CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlCursor = class extends CABLES.EventTarget
{
    constructor(glPatch, instancer, clientId)
    {
        super();


        this._glPatch = glPatch;
        this._instancer = instancer;
        this._cursor2 = this._instancer.createRect();
        this._cursor2.setSize(10, 10);
        this._cursor2.setDecoration(5);

        // const col = this.HSVtoRGB(Math.random(), 0.75, 1.0);
        let col = null;
        if (gui.socketUi)col = gui.socketUi.getClientColor(clientId);
        if (col) this._cursor2.setColor(col.r, col.g, col.b, 1);
        else this._cursor2.setColor(1, 1, 1, 1);
    }

    setColor(r, g, b, a) { this._cursor2.setColor(1, 1, 1, 1); }

    get visible() { return this._cursor2.visible; }

    set visible(v) { this._cursor2.visible = v; }

    setSize(w, h) { this._cursor2.setSize(w, h); }

    setPosition(x, y) { this._cursor2.setPosition(x, y); }
};
