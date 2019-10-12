var CABLES=CABLES||{};

CABLES.WatchPortVisualizer=function()
{
    this._canvasWidth=300;
    this._canvasHeight=120;

    this.created=false;
    var self=this;
    this._lastId=0;
    this._visible=false;

    this._num=this._canvasWidth/2;
    this._buff=[];
    this._buff.length=this._num;

    this._position=0;
    this._ele=null;

    this._max=-Number.MAX_VALUE;
    this._min=Number.MAX_VALUE;
    this._lastValue=Number.MAX_VALUE;
    this._firstTime=true;

    this.update=function(classname,id,value)
    {
        var i=0;
        if(!this._visible)return;
        if(!self._ele.hasClass(classname.substr(1)))return;
        if(this._lastId!=classname)
        {
            // console.log('reset',this._lastId,id);
            for(i=0;i<this._buff.length;i++) this._buff[i]=Number.MAX_VALUE;
            this._position=0;
            this._lastId=classname;

            this._max=-Number.MAX_VALUE;
            this._min=Number.MAX_VALUE;
            this._lastValue=value;
            this._firstTime=true;

            return;
        }

        if(this._firstTime && this._lastValue==value)return;
        this._firstTime=false;

        self.canvas.style.display = "block";

        this._max=Math.max(value,this._max);
        this._min=Math.min(value,this._min);

        this._buff[this._position%this._num]=value;
        this._position++;

        this.ctx.fillStyle="#1b1b1b";
        this.ctx.fillRect(0,0,this._canvasWidth,this._canvasHeight);
        this.ctx.strokeStyle="#aaa";
        this.ctx.font = "12px monospace";

        var h=Math.max(Math.abs(this._max),Math.abs(this._min));

        var first=true;

        this.ctx.strokeStyle="#666";
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();

        this.ctx.moveTo(0,this._canvasHeight/2);
        this.ctx.lineTo(this._canvasWidth,this._canvasHeight/2);
        this.ctx.stroke();

        this.ctx.strokeStyle=CABLES.UI.uiConfig.highlight;
        this.ctx.beginPath();

        this.ctx.lineWidth = 2;
        // for(var i=position;i<this._buff.length;i++)
        for(i=0;i<this._num;i++)
        {
            var v=this._buff[(this._position+i)%this._num];
            if(this._buff[(this._position+i)%this._num]!=Number.MAX_VALUE)
            {
                var pos=this.canvas.height-( (v/h*this.canvas.height/2*0.9)+this.canvas.height/2 );

                if(first)
                {
                    // this.ctx.moveTo(i*2,pos);
                    this.ctx.moveTo(0,pos);
                    first=false;
                }

                this.ctx.lineTo(i*2, pos);
            }
        }
        this.ctx.stroke();

        this.ctx.fillStyle="#666";
        this.ctx.fillText('max:'+(Math.round(this._max*100)/100), 10, this.canvas.height-10);
        this.ctx.fillText('min:'+(Math.round(this._min*100)/100), 10, this.canvas.height-30);
    };

    this.create=function()
    {
        this.canvas = document.createElement('canvas');
        this.canvas.id = "watchportpreview";
        this.canvas.width  = this._canvasWidth;
        this.canvas.height = this._canvasHeight;
        this.canvas.style.display = "block";
        this.canvas.style.position = "absolute";
        this.canvas.style['z-index'] = 9999999;
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.update();
    };


    this.init=function()
    {
        $(document).on("mouseenter", ".watchPort",
            function()
            {
                if(!self.canvas)self.create();

                self._visible=true;
                self._ele=$(this);

                var offset = $(this).offset();
                self.canvas.style.left=offset.left;
                self.canvas.style.top=offset.top+30;

            });

        $(document).on("mouseleave", ".watchPort",
            function()
            {
                self.canvas.style.display   = "none";
                self._visible=false;
                self._lastId="xxx";
            });

        $(document).on("click", ".linkedValue",
            function(e)
            {
                // console.log(this);
                // console.log(this.innerHTML);

                if(!navigator.clipboard)
                {
                    console.log("no clipbopard found...");
                    return;
                }

                navigator.clipboard.writeText(this.innerHTML)
                    .then(() => {
                        CABLES.UI.notify('Copied value to clipboard');
                    })
                    .catch(err => {
                        console.log("copy failed",err);
                    });

                e.preventDefault();
            });
    };
};

CABLES.watchPortVisualize=new CABLES.WatchPortVisualizer();
