
export default class GlArea
{
    constructor(instancer, glop)
    {
        this._instancer = instancer;

        this._glop = glop;
        this._id = CABLES.shortId();

        this._rectBg = this._instancer.createRect({ "draggable": false });
        this._rectBg.setSize(200, 200);
        this._rectBg.setColor([0, 0, 0, 0.05]);
        // this._rectBg.setDecoration(6);

        this.resizeCornerSize = 20;

        this._rectResize = this._instancer.createRect({ "draggable": true });
        this._rectResize.setSize(this.resizeCornerSize, this.resizeCornerSize);
        this._rectResize.setColor([0, 0, 0, 0.1]);
        this._rectResize.setPosition(200 - this.resizeCornerSize, 200 - this.resizeCornerSize);
        this._rectResize.draggable = true;
        // this._rectResize.setDecoration(6);


        this._rectResize.draggableMove = true;

        this._glop.on("drag", () =>
        {
            this._update();
        });

        this._rectResize.on("drag", () =>
        {
            this._update();
        });


        if (this._glop.op.uiAttribs.area)
        {
            if (this._glop.op.uiAttribs.area.id) this._id = this._glop.op.uiAttribs.area.id;
            this._rectResize.setPosition(
                this._glop.x + this._glop.op.uiAttribs.area.w,
                this._glop.y + this._glop.op.uiAttribs.area.h,
            );
        }

        this._update();
    }

    _update()
    {
        this._rectBg.setPosition(
            this._glop.x,
            this._glop.y
        );


        const w = this._rectResize.x - this._glop.x + this.resizeCornerSize;
        const h = this._rectResize.y - this._glop.y + this.resizeCornerSize;


        this._rectBg.setSize(w, h);

        this._glop.op.setUiAttrib({ "area": { "w": w, "h": h, "id": this._id } });
    }

    dispose()
    {
        this._rectBg.dispose();
        this._rectResize.dispose();
    }
}
