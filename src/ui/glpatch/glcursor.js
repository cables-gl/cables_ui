CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlCursor = class extends CABLES.EventTarget
{
    constructor(glPatch, instancer)
    {
        super();

        this._glPatch = glPatch;
        this._instancer = instancer;
        this._cursor2 = this._instancer.createRect();
        this._cursor2.setSize(10, 10);
        this._cursor2.setDecoration(5);

        const col = this.HSVtoRGB(Math.random(), 0.75, 1.0);

        this._cursor2.setColor(col.r, col.g, col.b, 1);
    }

    setColor(r, g, b, a) { this._cursor2.setColor(1, 1, 1, 1); }

    get visible() { return this._cursor2.visible; }

    set visible(v) { this._cursor2.visible = v; }

    setSize(w, h) { this._cursor2.setSize(w, h); }

    setPosition(x, y) { this._cursor2.setPosition(x, y); }

    HSVtoRGB(h, s, v)
    {
        let r, g, b, i, f, p, q, t;
        if (arguments.length === 1)
        {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6)
        {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        }
        return {
            "r": r,
            "g": g,
            "b": b
        };
    }
};
