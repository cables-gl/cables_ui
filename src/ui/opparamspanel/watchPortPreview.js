CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.WatchPortVisualizer = class
{
    constructor(v, dv)
    {
        this._canvasWidth = 300;
        this._canvasHeight = 120;

        this.created = false;
        this._lastId = 0;
        this._visible = false;

        this._num = this._canvasWidth / 2;
        this._buff = [];
        this._buff.length = this._num;

        this._position = 0;
        this._ele = null;

        this._max = -Number.MAX_VALUE;
        this._min = Number.MAX_VALUE;
        this._lastValue = Number.MAX_VALUE;
        this._firstTime = true;

        this._init();
    }

    _init()
    {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "watchportpreview";
        this.canvas.width = this._canvasWidth;
        this.canvas.height = this._canvasHeight;
        this.canvas.style.display = "none";
        this.canvas.style.position = "absolute";
        // this.canvas.style.border = "4px solid #000";
        this.canvas.style["z-index"] = 9999999;
        const body = document.getElementsByTagName("body")[0];
        body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.update();


        $(document).on("mouseenter", ".watchPort", (e) =>
        {
            this._visible = true;
            // this.canvas.style.display = "block";

            this._ele = e.target;
            const offset = e.target.getBoundingClientRect();
            this.canvas.style.left = offset.left + "px";
            this.canvas.style.top = offset.top + 30 + "px";
        });

        $(document).on("mouseleave", ".watchPort", () =>
        {
            this.canvas.style.display = "none";
            this._visible = false;
            this._lastId = "xxx";
        });

        document.addEventListener("click",
            (e) =>
            {
                if (!e.target.classList.contains("linkedValue")) return;

                if (!navigator.clipboard)
                {
                    console.log("no clipbopard found...");
                    return;
                }

                console.log("this.innerHTML", e.target.innerHTML);

                navigator.clipboard
                    .writeText(e.target.innerHTML)
                    .then(() =>
                    {
                        CABLES.UI.notify("Copied value to clipboard");
                    })
                    .catch((err) =>
                    {
                        console.log("copy failed", err);
                    });

                e.preventDefault();
            });
    }

    update(classname, id, value)
    {
        let i = 0;
        if (!this._visible) return;
        if (!this._ele.classList.contains(classname)) return;
        if (this._lastId != classname)
        {
            // console.log('reset',this._lastId,id);
            for (i = 0; i < this._buff.length; i++) this._buff[i] = Number.MAX_VALUE;
            this._position = 0;
            this._lastId = classname;

            this._max = -Number.MAX_VALUE;
            this._min = Number.MAX_VALUE;
            this._lastValue = value;
            this._firstTime = true;

            return;
        }

        if (this._firstTime && this._lastValue == value) return;
        this._firstTime = false;

        this.canvas.style.display = "block";

        this._max = Math.max(value, this._max);
        this._min = Math.min(value, this._min);

        this._buff[this._position % this._num] = value;
        this._position++;

        this.ctx.fillStyle = "#111";
        this.ctx.fillRect(0, 0, this._canvasWidth, this._canvasHeight);
        this.ctx.strokeStyle = "#aaa";
        this.ctx.font = "12px monospace";

        const h = Math.max(Math.abs(this._max), Math.abs(this._min));

        let first = true;

        this.ctx.strokeStyle = "#666";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();

        this.ctx.moveTo(0, this._canvasHeight / 2);
        this.ctx.lineTo(this._canvasWidth, this._canvasHeight / 2);
        this.ctx.stroke();

        this.ctx.strokeStyle = CABLES.UI.uiConfig.highlight;
        this.ctx.beginPath();

        this.ctx.lineWidth = 2;
        // for(var i=position;i<this._buff.length;i++)
        for (i = 0; i < this._num; i++)
        {
            const v = this._buff[(this._position + i) % this._num];
            if (this._buff[(this._position + i) % this._num] != Number.MAX_VALUE)
            {
                const pos = this.canvas.height - ((((v / h) * this.canvas.height) / 2) * 0.9 + this.canvas.height / 2);

                if (first)
                {
                    // this.ctx.moveTo(i*2,pos);
                    this.ctx.moveTo(0, pos);
                    first = false;
                }

                this.ctx.lineTo(i * 2, pos);
            }
        }
        this.ctx.stroke();

        this.ctx.fillStyle = "#666";
        this.ctx.fillText("max:" + Math.round(this._max * 100) / 100, 10, this.canvas.height - 10);
        this.ctx.fillText("min:" + Math.round(this._min * 100) / 100, 10, this.canvas.height - 30);
    }
};
