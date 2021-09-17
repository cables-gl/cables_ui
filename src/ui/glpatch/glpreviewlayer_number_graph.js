CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPreviewLayerNumber = class extends CABLES.EventTarget
{
    constructor(previewLayer, item)
    {
        super();
        this._item = item;
        this._previewLayer = previewLayer;

        this._buff = [];
    }

    render(ctx, pos, size)
    {
        const port = this._item.port;
        if (!port || !port.get()) return;

        const perf = CABLES.uiperf.start("previewlayer number");

        this._buff.push(this._item.port.get());
        if (this._buff.length > 60) this._buff.shift();

        // const glop = this._previewLayer._glPatch.getGlOp(this._item.op);
        // const size = this._previewLayer._glPatch.viewBox.patchToScreenConv(glop.w, glop.h);
        // const pos = this._previewLayer._glPatch.viewBox.patchToScreenCoords(this._item.posX, this._item.posY);

        // if (pos[0] < 0 || pos[1] < 0 || (pos[0] + 100) > w || (pos[1] + 100) > h) return;

        const texSlot = 5;
        const texSlotCubemap = texSlot + 1;

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ff0000";


        const mul = size[1];
        const mulX = size[0] / 60;


        ctx.beginPath();
        ctx.moveTo(2, 2);
        // ctx.lineTo(0, 0);
        ctx.lineTo(size[0], 0);
        ctx.lineTo(size[0], size[1]);
        ctx.lineTo(0, size[1]);
        ctx.lineTo(0, 0);
        ctx.stroke();


        ctx.fillRect(pos[0], pos[1], size[0], 1);

        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);

        // console.log(size);


        for (let i = 0; i < this._buff.length; i++)
        {
            ctx.lineTo(pos[0] + i * mulX, this._buff[i] * mul + pos[1]);
        }

        ctx.stroke();


        perf.finish();
    }
};
