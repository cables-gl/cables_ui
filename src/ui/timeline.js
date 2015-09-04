
CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;


CABLES.TL.Key.prototype.updateCircle=function()
{
    if(!ui.timeLine)return;
    if(!this.circle) this.initUI(ui.timeLine.getPaper());
    var posx=this.time*100;
    var posy=this.value*-100;

    this.circle.attr({ cx:posx, cy:posy });
    this.circle.toFront();
};
            
CABLES.TL.Key.prototype.initUI=function()
{
    if(!ui.timeLine)return;
    var self=this;

    this.x=this.time*100;
    this.y=this.value*-100;

    var discattr = {fill: "#f0f", stroke: "none"};
    this.circle=ui.timeLine.getPaper().circle(self.x, self.y, 6).attr(discattr);
    this.circle.toFront();

    function move(dx, dy)
    {
        if(self.x==-1 && self.y==-1)
        {
            self.x=self.time*100;
            self.y=self.value*-100;
        }

        var posx=dx+self.x;
        var posy=dy+self.y;

        self.circle.attr({ cx:posx, cy:posy });

        self.set({time:ui.timeLine.getTimeFromPaper(posx),value:posy/-100});
    }

    function up()
    {
        self.x=-1;
        self.y=-1;
    }

    this.circle.drag(move,up);
};


CABLES.TL.Key.prototype.getPathString=function(viewBox,nextKey)
{
    var x=this.time*100;
    var y=this.value*-100;

    var str="L "+x+" "+y;
    return str;
};

CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    var tl=new CABLES.TL.Anim();
    var viewBox={x:-100,y:-400,w:1200,h:1000};
    var fps=30;
    var cursorTime=0.0;

    var paper= Raphael("timeline", 0,0);

    tl.keys.push(new CABLES.TL.Key({time:0.0,value:1.0}) );
    tl.keys.push(new CABLES.TL.Key({time:1.0,value:1.0}) );
    tl.keys.push(new CABLES.TL.Key({time:5.0,value:0.0}) );
    tl.keys.push(new CABLES.TL.Key({time:6.0,value:4.0}) );
    tl.keys.push(new CABLES.TL.Key({time:8.0,value:2.0}) );
    tl.keys.push(new CABLES.TL.Key({time:10.0,value:2.0}) );

    var ki=tl.getKeyIndex(-1.0);
    console.log('ki '+ki);

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: "#ff0", "stroke-width": 2});

    function getFrame(time)
    {
        var frame=parseInt(time*fps,10);
        return frame;
    }

    this.getPaper=function()
    {
        return paper;
    };

    this.setAnim=function(anim)
    {

        if(tl) for(var i in tl.keys)
        {
            if(tl.keys[i].circle)tl.keys[i].circle.remove();
        }

        if(!anim)
        {
            tl=null;
            updateKeyLine();
            return;
        }

        anim.paper=paper;

        tl=anim;
        updateKeyLine();

        for(var i in tl.keys)
        {
            if(tl.keys[i].circle)tl.keys[i].circle.remove();
            tl.keys[i].circle=null;
            tl.keys[i].initUI();
            tl.keys[i].updateCircle();
        }


        if(tl.onChange===null) tl.onChange=updateKeyLine;
    };

    function setCursor(time)
    {
        if(time<0)time=0;

        cursorTime=time;
        time=time*100;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
    }




    var keyLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
    keyLine.attr({ stroke: "#fff", "stroke-width": 2 });

    var zeroLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
    zeroLine.attr({ stroke: "#999", "stroke-width": 1});


    this.updateViewBox=function()
    {
        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            viewBox.w,
            viewBox.h,false
        );
        paper.canvas.setAttribute('preserveAspectRatio', 'none');

    };

    function updateKeyLine()
    {
        var str="M 0 0 ";
        if(tl)
        {
            tl.sortKeys();
            
            for(var i=0;i<tl.keys.length;i++)
            {
                var nextKey=null;
                        
                if(tl.keys.length > i+1)
                {
                    nextKey=tl.keys[i+1];
                }

                str+=tl.keys[i].getPathString(viewBox,nextKey);
                
                tl.keys[i].updateCircle();
                if(tl.keys[i].onChange===null) tl.keys[i].onChange=updateKeyLine;

            }
        }

        keyLine.attr({ path:str });
    }



    var spacePressed=false;

    this.jumpKey=function(dir)
    {
        if(!tl)return;
        var index=tl.getKeyIndex(cursorTime);
        var newIndex=parseInt(index,10)+parseInt(dir,10);

        if(tl.keys.length>newIndex && newIndex>=0)
        {
            var time=tl.keys[newIndex].time;
            ui.scene.timer.setTime(time);
            self.updateTime();
        }

    };


    $(document).keyup(function(e)
    {
        switch(e.which)
        {
            case 32:
                spacePressed=false;
            break;
        }
    });

    $(document).keydown(function(e)
    {
        switch(e.which)
        {
            case 32:
                spacePressed=true;
            break;
            case 74: // j
                self.jumpKey(-1);
            break;
            case 75: // k
                self.jumpKey(1);
            break;

            default:
                // console.log('key ',e.which);
            break;

        }
    });


    $(".timeLineInsert").bind("click", function (e)
    {
        console.log('huhu! '+cursorTime);
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:2.0}) );
        updateKeyLine();
    });

    var panX=0,pany=0;
    $("#timeline").bind("mousemove", function (e)
    {
        e=mouseEvent(e);

        if(e.which==1 && e.offsetY<50)
        {
            var time=self.getTimeFromMouse(e.offsetX);
                    
            ui.scene.timer.setTime(time);
            self.updateTime();
        }

        if(e.which==2 || e.which==3 || (e.which==1 && spacePressed))
        {
            viewBox.x+=panX-ui.getCanvasCoords(e.offsetX,e.offsetY).x;
            viewBox.y+=panY-ui.getCanvasCoords(e.offsetX,e.offsetY).y;

            self.updateViewBox();
        }

        panX=ui.getCanvasCoords(e.offsetX,e.offsetY).x;
        panY=ui.getCanvasCoords(e.offsetX,e.offsetY).y;

    });

    $('#timeline').bind("mousewheel", function (event,delta,nbr)
    {
        event=mouseEvent(event);
        if(viewBox.w-delta >0 &&  viewBox.h-delta >0 )
        {
            viewBox.x+=delta/2;
            viewBox.y+=delta/2;
            viewBox.w-=delta;
            viewBox.h-=delta;
        }

        self.updateViewBox();
    });

    this.getTimeFromMouse=function(offsetX)
    {
        var time=offsetX/$('#timeline').width() ;
        time*=(viewBox.w);
        time/=100;
        time+=viewBox.x/100;
        return time;
    };

    this.getTimeFromPaper=function(offsetX)
    {
        var time=offsetX;
        time/=100;
        return time;
    };

    var updateTimer=null;

    this.updateTime=function()
    {
        var time=ui.scene.timer.getTime();
        setCursor(time);
        $('.timelinetime').html( '<b>'+getFrame(time)+'</b><br/>'+(time+'').substr(0, 4)+'s ' );
        // if(ui.scene.timer.isPlaying()) 
        if(updateTimer===null) updateTimer=setInterval(self.updateTime,40);
    };

    this.togglePlay=function(patch)
    {
        ui.scene.timer.togglePlay();
                
        if(!ui.scene.timer.isPlaying())
        {
            $('#timelineplay').removeClass('fa-pause');
            $('#timelineplay').addClass('fa-play');
            this.updateTime();
        }
        else
        {
            $('#timelineplay').removeClass('fa-play');
            $('#timelineplay').addClass('fa-pause');
            this.updateTime();
        }
    };


    updateKeyLine();
    // setCursor(cursorTime,true);
    this.updateTime();
    this.updateViewBox();

};



