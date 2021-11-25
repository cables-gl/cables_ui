
export default class GlPreviewLayerNumber extends CABLES.EventTarget
{
    constructor(previewLayer, item)
    {
        super();
        this._item = item;
        this._previewLayer = previewLayer;

        this._buff = [];

        this._max = -Number.MAX_VALUE;
        this._min = Number.MAX_VALUE;
    }

    render(ctx, pos, size)
    {
        const port = this._item.port;
        if (!port || !port.get()) return;

        const perf = CABLES.UI.uiProfiler.start("previewlayer graph");

        const colors = [
            "#00ffff",
            "#ffff00",
            "#ff00ff",
            "#0000ff",
            "#00ff00",
            "#ff0000",
            "#ffffff",
            "#888888",
        ];

        for (let p = 0; p < this._item.ports.length; p++)
        {
            if (!this._item.ports[p].isLinked()) continue;
            const newVal = this._item.ports[p].get();

            this._max = Math.max(this._item.ports[p].get(), this._max);
            this._min = Math.min(this._item.ports[p].get(), this._min);

            if (!this._buff[p]) this._buff[p] = [];
            this._buff[p].push(newVal);
            if (this._buff[p].length > 60) this._buff[p].shift();

            const texSlot = 5;
            const mulX = size[0] / 60;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#555555";

            ctx.beginPath();
            ctx.moveTo(pos[0], CABLES.map(0, this._min, this._max, size[1], 0) + pos[1]);
            ctx.lineTo(pos[0] + size[0], CABLES.map(0, this._min, this._max, size[1], 0) + pos[1]);
            ctx.stroke();


            ctx.strokeStyle = colors[p];

            ctx.beginPath();

            for (let i = 0; i < this._buff[p].length; i++)
            {
                let y = this._buff[p][i];

                y = CABLES.map(y, this._min, this._max, size[1], 0);
                y += pos[1];
                if (i == 0)ctx.moveTo(pos[0], y);
                else ctx.lineTo(pos[0] + i * mulX, y);
            }

            ctx.stroke();
        }


        ctx.fillStyle = "#888";
        ctx.fillText("max:" + Math.round(this._max * 100) / 100, pos[0] + 10, pos[1] + size[1] - 10);
        ctx.fillText("min:" + Math.round(this._min * 100) / 100, pos[0] + 10, pos[1] + size[1] - 30);

        perf.finish();
    }
}
