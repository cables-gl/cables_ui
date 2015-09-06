
CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;
CABLES.TL.Key.prototype.selected=false;


CABLES.TL.TIMESCALE=100;

CABLES.TL.Key.prototype.setSelected=function(sel)
{
    this.selected=sel;

    if(sel)
    {
        this.circle.attr({ fill:"white" });
    }
    else
    {
        this.circle.attr({ fill:uiConfig.colorKey });
    }
};

CABLES.TL.Key.prototype.updateCircle=function()
{
    if(!ui.timeLine)return;
    if(!this.circle) this.initUI(ui.timeLine.getPaper());

    if(isNaN(this.value)) this.value=0;

    var posx=this.time*CABLES.TL.TIMESCALE;
    var posy=this.value*-100;

    this.circle.attr({ cx:posx, cy:posy });
    this.circle.toFront();
};


CABLES.TL.Key.prototype.initUI=function()
{
    if(!ui.timeLine)return;
    var self=this;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-100;

    var discattr = {fill: uiConfig.colorKey, stroke: "none"};
    this.circle=ui.timeLine.getPaper().circle(self.x, self.y, 8).attr(discattr);
    this.circle.toFront();

    this.circle.node.onclick = function ()
    {
        self.setSelected(true);
    };

    function move(dx,dy,a,b,e)
    {
        var newPos=ui.timeLine.getCanvasCoordsMouse(e);
        self.circle.attr({ cx:newPos.x, cy:newPos.y });
        self.set({time:ui.timeLine.getTimeFromPaper(newPos.x),value:newPos.y/-100});
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
    var x=this.time*CABLES.TL.TIMESCALE;
    var y=this.value*-100;

    var str="L "+x+" "+y;
    return str;
};

CABLES.TL.Anim.prototype.deleteSelectedKeys=function()
{
    var found=true;

    while(found)
    {
        found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].selected)
            {
                this.keys[i].circle.remove();
                this.keys.splice(i, 1);
                found=true;
            }
        }
    }
};


CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    var tl=new CABLES.TL.Anim();
    var viewBox={x:-100,y:-200,w:1200,h:400};
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

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: "#6c9fde", "stroke-width": 2});

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
        time=time*CABLES.TL.TIMESCALE;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
    }




    var keyLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
    keyLine.attr({ stroke: "#fff", "stroke-width": 2 });

    var zeroLine = paper.path("M 0 0 L 111000 0");
    zeroLine.attr({ stroke: "#999", "stroke-width": 1});


    this.updateViewBox=function()
    {
        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            viewBox.w,
            viewBox.h,false
        );
        // paper.canvas.setAttribute('preserveAspectRatio', 'none');

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

    this.getCanvasCoordsMouse=function(evt)
    {
        var ctm = $('#timeline svg')[0].getScreenCTM();

        ctm = ctm.inverse();
        var uupos = $('#timeline svg')[0].createSVGPoint();

        uupos.x = evt.clientX;
        uupos.y = evt.clientY;

        uupos = uupos.matrixTransform(ctm);
        
        var res={x:uupos.x,y:uupos.y};
        return res;
    };

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

    $('#timeline').keyup(function(e)
    {
        switch(e.which)
        {
            case 32:
                spacePressed=false;
            break;
        }
    });

    $('#timeline').keydown(function(e)
    {
        switch(e.which)
        {
            case 46: case 8:
                tl.deleteSelectedKeys();
                updateKeyLine();
            break;
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
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:2.0}) );
        updateKeyLine();
    });

    $('#timeline').bind("mouseup", function (event)
    {
        rubberBandHide();
    });

    var panX=0,pany=0;
    $("#timeline").bind("mousemove", function (e)
    {
        e=mouseEvent(e);

        if(e.which==1 && e.offsetY<50 || e.which==2)
        {
            var time=self.getTimeFromMouse( e );

            var frame=parseInt(time*fps,10);
            time=frame/fps;

            ui.scene.timer.setTime(time);
            self.updateTime();
        }

        if(e.which==3 || (e.which==1 && spacePressed))
        {
            viewBox.x+=panX-self.getCanvasCoordsMouse(e).x;
            viewBox.y+=panY-self.getCanvasCoordsMouse(e).y;

            var startTime=viewBox.x/CABLES.TL.TIMESCALE;;

            self.updateViewBox();
        }

        panX=self.getCanvasCoordsMouse(e).x;
        panY=self.getCanvasCoordsMouse(e).y;

        rubberBandMove(e);

    });

    // $('#timeline').bind("mousewheel", function (event,delta,nbr)
    // {
    //     event=mouseEvent(event);
    //     if(viewBox.w-delta >0 &&  viewBox.h-delta >0 )
    //     {
    //         viewBox.x+=delta/2;
    //         viewBox.y+=delta/2;
    //         viewBox.w-=delta;
    //         viewBox.h-=delta;
    //     }

    //     self.updateViewBox();
    // });

    var timeDisplayTexts=[];
    function updateTimeDisplay()
    {
        var step=fps*5;
        if(CABLES.TL.TIMESCALE>90) step=fps;
        if(CABLES.TL.TIMESCALE>500) step=fps/3;
        if(CABLES.TL.TIMESCALE>1000) step=fps/6;
        if(CABLES.TL.TIMESCALE>1400) step=fps/30;

        for(var i=0;i<50;i++)
        {
            var frame=i*step;
            var t;
            if(i>timeDisplayTexts.length-1)
            {
                t = paper.text(50, 50, "");
                timeDisplayTexts.push(t);
            }

            t=timeDisplayTexts[i];
            t.attr({
                "text":""+parseInt(frame,10),
                "x":i*step/fps*CABLES.TL.TIMESCALE,
                "y":0,
                "font-size": 36 });
        }
    }

    this.setTimeScale=function(v)
    {
        CABLES.TL.TIMESCALE=v;
        console.log('CABLES.TL.TIMESCALE ', CABLES.TL.TIMESCALE);
                
        updateKeyLine();
        updateTimeDisplay();
    };

    this.getTimeFromMouse=function(e)
    {
        var time=self.getCanvasCoordsMouse(e).x;//$('#timeline').width() ;
        time/=CABLES.TL.TIMESCALE;
        return time;
    };

    this.getTimeFromPaper=function(offsetX)
    {
        var time=offsetX;
        time/=CABLES.TL.TIMESCALE;
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


    // ------------------

    var rubberBandStartPos=null;
    var rubberBandPos=null;
    var mouseRubberBandStartPos=null;
    var mouseRubberBandPos=null;
    var rubberBandRect=null;

    function rubberBandHide()
    {
        mouseRubberBandStartPos=null;
        mouseRubberBandPos=null;
        if(rubberBandRect)rubberBandRect.attr({
            x:0,y:0,width:0,height:0,
            "stroke-width": 0,
            "fill-opacity": 0
        });
    }

    function rubberBandMove(e)
    {
        if(e.which==1 && !spacePressed)
        {
            if(!mouseRubberBandStartPos)
            {
                // ui.setSelectedOp(null);
                mouseRubberBandStartPos=self.getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);
            }
            mouseRubberBandPos=self.getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);

            if(!rubberBandRect) rubberBandRect=paper.rect( 0,0,10,10).attr({ });

            var start={x:mouseRubberBandStartPos.x,y:mouseRubberBandStartPos.y};
            var end={x:mouseRubberBandPos.x,y:mouseRubberBandPos.y};

            if(end.x-start.x<0)
            {
                var tempx=start.x;
                start.x=end.x;
                end.x=tempx;
            }
            if(end.y-start.y<0)
            {
                var tempy=start.y;
                start.y=end.y;
                end.y=tempy;
            }

            rubberBandRect.attr({
                    x:start.x,
                    y:start.y,
                    width:end.x-start.x,
                    height:end.y-start.y,
                    "stroke": uiConfig.colorRubberBand,
                    "fill": uiConfig.colorRubberBand,
                    "stroke-width": 2,
                    "fill-opacity": 0.1
               });

            for(var i in tl.keys)
            {
                var rect=tl.keys[i].circle;
                var opX=rect.attr("cx");
                var opY=rect.attr("cy");

                tl.keys[i].setSelected(false);
                if(opX>start.x && opX<end.x && opY>start.y && opY<end.y )
                {
                    tl.keys[i].setSelected(true);
                }
            }

            // for(var i in self.ops)
            // {
            //     var rect=self.ops[i].oprect.bgRect;
            //     var opX=rect.matrix.e;
            //     var opY=rect.matrix.f;

            //     if(opX>start.x && opX<end.x && opY>start.y && opY<end.y )
            //     {
            //         ui.addSelectedOp(self.ops[i]);
            //     }
            // }
        }
    }


    // ---------------------------------


};



