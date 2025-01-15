import { gui } from "../gui.js";

export default class GlArea
{
    constructor(instancer, glop)
    {
        this._instancer = instancer;

        this._glop = glop;
        this._id = CABLES.shortId();

        this._w = 300;
        this._h = 200;
        this._visible = true;

        this._rectBg = this._instancer.createRect({ "draggable": false });
        this._rectBg.setSize(this._w, this._h);
        this._updateColor();

        this.resizeCornerSize = 15;

        this._rectResize = this._instancer.createRect({ "draggable": true });
        this._rectResize.setShape(2);
        this._rectResize.setSize(this.resizeCornerSize, this.resizeCornerSize);
        this._rectResize.setColor([0, 0, 0, 0.2]);
        this._rectResize.setPosition(200 - this.resizeCornerSize, 200 - this.resizeCornerSize);
        this._rectResize.draggable = true;
        this._rectResize.draggableMove = true;

        this._glop.on("drag", () =>
        {
            this._update();
        });

        this._rectResize.on("drag", (e) =>
        {
            this._w = this._rectResize.x - this._glop.x + this._rectResize.w / 2;
            this._h = this._rectResize.y - this._glop.y + this._rectResize.h / 2;

            if (CABLES.UI.userSettings.get("snapToGrid2"))
            {
                this._w = this._glop.glPatch.snap.snapX(this._w);
                this._h = this._glop.glPatch.snap.snapY(this._h);
            }

            gui.savedState.setUnSaved("resizeGlArea", this._glop.op.getSubPatch());
            this._update();
        });

        if (this._glop.op.uiAttribs.area)
        {
            if (this._glop.op.uiAttribs.area.id) this._id = this._glop.op.uiAttribs.area.id;
            this._w = this._glop.op.uiAttribs.area.w;
            this._h = this._glop.op.uiAttribs.area.h;
        }

        this._update();
    }

    set visible(v)
    {
        this._visible = v;
        this._update();
    }

    _update()
    {
        if (this._rectBg)
        {
            this._rectBg.visible = this._visible;
            this._rectResize.visible = this._visible;

            if (!this._visible) return;
            this._rectBg.setPosition(
                this._glop.x,
                this._glop.y,
                0.1);

            this._rectBg.setSize(this._w, this._h);

            this._rectResize.setPosition(
                this._glop.x + this._w - this._rectResize.w,
                this._glop.y + this._h - this._rectResize.h,
                -0.1
            );
        }

        this._glop.op.setUiAttrib({ "area": { "w": this._w, "h": this._h, "id": this._id } });
    }

    _updateColor()
    {
        // this._rectBg.colorHoverMultiply = 1;

        if (this._glop.opUiAttribs.color)
        {
            const cols = chroma.hex(this._glop.opUiAttribs.color).gl();
            cols[3] = 0.1;
            this._rectBg.setColor(cols);
        }
        else this._rectBg.setColor([0, 0, 0, 0.08]);
    }

    dispose()
    {
        this._rectBg.dispose();
        this._rectResize.dispose();
        this._rectBg = null;
        this._rectResize = null;
    }
}
