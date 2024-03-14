import { Events } from "cables-shared-client";

export default class GlCursor extends Events
{
    constructor(glPatch, instancer, clientId)
    {
        super();

        this.isAnimated = clientId !== undefined;
        this._animX = new CABLES.Anim();
        this._animY = new CABLES.Anim();


        this._animX.defaultEasing = this._animY.defaultEasing = CABLES.ANIM.EASING_CUBIC_OUT;

        this._glPatch = glPatch;
        this._instancer = instancer;
        this._cursor2 = this._instancer.createRect();
        this._cursor2.setSize(10, 10);
        this._cursor2.setShape(5);

        let col = null;
        if (gui.socket)col = gui.socket.getClientColor(clientId);
        if (col) this._cursor2.setColor(col.r, col.g, col.b, 1);
        else this._cursor2.setColor(1, 1, 1, 1);
    }

    updateAnim()
    {
        if (this.isAnimated)
        {
            this._cursor2.setPosition(
                this._animX.getValue(this._glPatch.time),
                this._animY.getValue(this._glPatch.time));
        }
    }

    setColor(r, g, b, a) { this._cursor2.setColor(1, 1, 1, 1); }

    get visible() { return this._cursor2.visible; }

    set visible(v) { this._cursor2.visible = v; }

    setSize(w, h) { this._cursor2.setSize(w, h); }

    setPosition(x, y)
    {
        if (!this.isAnimated) this._cursor2.setPosition(x, y);
        else
        {
            this._animX.clear(this._glPatch.time);
            this._animY.clear(this._glPatch.time);
            const netCursorDelay = gui.socket ? gui.socket.netMouseCursorDelay / 1000 : 0;
            this._animX.setValue(this._glPatch.time + netCursorDelay, x);
            this._animY.setValue(this._glPatch.time + netCursorDelay, y);
            this.updateAnim();
        }
    }

    dispose()
    {
        this._cursor2.dispose();
    }
}
