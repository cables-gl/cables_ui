
CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;
CABLES.TL.Key.prototype.selected=false;


CABLES.TL.MoveMode=0;
CABLES.TL.TIMESCALE=100;
CABLES.TL.VALUESCALE=100;

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
    var posy=this.value*-CABLES.TL.VALUESCALE;

    if(isNaN(posx))
    {
        posx=0;
        console.log('key posx NaN');
    }
    if(isNaN(posy))
    {
        posy=0;
        console.log('key posx NaN');
    }

    this.circle.attr({ cx:posx, cy:posy });
    this.circle.toFront();
};

CABLES.TL.Key.prototype.initUI=function()
{
    if(!ui.timeLine)return;
    var self=this;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    var discattr = {fill: uiConfig.colorKey, stroke: "none"};
    this.circle=ui.timeLine.getPaper().circle(self.x, self.y, 10).attr(discattr);
    this.circle.toFront();

    this.circle.node.onclick = function (e)
    {
        if(!e.shiftKey) ui.timeLine.unselectKeys();
        self.setSelected(true);
    };



    function move(dx,dy,a,b,e)
    {
        self.isDragging=true;
        var newPos=ui.timeLine.getCanvasCoordsMouse(e);
        if(newPos.x<0)newPos.x=0;

        if(CABLES.TL.MoveMode===0)
        {
            self.circle.attr({ cx:newPos.x });
            self.set({time:ui.timeLine.getTimeFromPaper(newPos.x),value:self.value});
        }
        if(CABLES.TL.MoveMode==1)
        {
            self.circle.attr({  cy:newPos.y });
            self.set({value:newPos.y/-CABLES.TL.VALUESCALE,time:self.time});
        }
        if(CABLES.TL.MoveMode==2)
        {
            self.circle.attr({ cx:newPos.x, cy:newPos.y });
            self.set({time:ui.timeLine.getTimeFromPaper(newPos.x),value:newPos.y/-CABLES.TL.VALUESCALE});
        }
    }

    function up()
    {
        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }

    this.circle.drag(move,up);
};


CABLES.TL.Key.prototype.getPathString=function(viewBox,nextKey)
{
    var x=this.time*CABLES.TL.TIMESCALE;
    var y=this.value*-CABLES.TL.VALUESCALE;

    var str="L "+x+" "+y;
    return str;
};

CABLES.TL.Anim.prototype.unselectKeys=function()
{
    for(var i in this.keys)
    {
        this.keys[i].setSelected(false);
    }
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
    this.sortKeys();
};


CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    var tl=new CABLES.TL.Anim();
    var tlEmpty=new CABLES.TL.Anim();
    var viewBox={x:-100,y:-200,w:1200,h:400};
    var fps=30;
    var cursorTime=0.0;

    var paper= Raphael("timeline", 0,0);
    var paperTime= Raphael("timetimeline", 0,0);
    var isScrollingTime=false;
    var enabled=false;

    var ki=tl.getKeyIndex(-1.0);

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: "#6c9fde", "stroke-width": 2});

    var cursorLineDisplay = paperTime.path("M 0 0 L 10 10");
    cursorLineDisplay.attr({stroke: "#6c9fde", "stroke-width": 2});

    function getFrame(time)
    {
        var frame=parseInt(time*fps,10);
        return frame;
    }

    this.getPaper=function()
    {
        return paper;
    };

    function removeDots()
    {
        if(tl) for(var i in tl.keys)
        {
            if(tl.keys[i].circle)tl.keys[i].circle.remove();
        }
        $('#timeline svg circle').remove(); // :(
    }

    this.setAnim=function(anim,config)
    {
        removeDots();

        if(!anim)
        {
            enabled=false;
            tl=tlEmpty;
            updateKeyLine();
            $('#timelineTitle').html('');
            return;
        }

        anim.paper=paper;
        tl=anim;
        enabled=true;

        if(config && config.name)
        {
            $('#timelineTitle').html(config.name);
        }
        else
            $('#timelineTitle').html('');

        if(config && config.defaultValue && anim.keys.length===0)
        {
            tl.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:config.defaultValue}) );
        }

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
        if(isNaN(time))time=0;

        cursorTime=time;
        time=time*CABLES.TL.TIMESCALE;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
        cursorLineDisplay.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
    }

    var keyLine = paper.path("M "+-1000+" "+0+" L" + 1000 + " " + 0);
    keyLine.attr({ stroke: "#fff", "stroke-width": 2 });

    var zeroLine2 = paper.path("M 0 0 L 111000 0");
    zeroLine2.attr({ stroke: "#999", "stroke-width": 1});

    this.updateViewBox=function()
    {
        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            700,
            viewBox.h,false
        );

        paperTime.setViewBox(
            viewBox.x,
            -200,
            700,
            400,false
        );

        paperTime.canvas.setAttribute('preserveAspectRatio', 'xMidYMid');
        paper.canvas.setAttribute('preserveAspectRatio', 'xMidYMid');
    };

    function updateKeyLine()
    {
        var str=null;
        if(tl)
        {
            tl.sortKeys();
            
            for(var i=0;i<tl.keys.length;i++)
            {
                var nextKey=null;
                        
                if(tl.keys.length > i+1) nextKey=tl.keys[i+1];
                
                if(str===null) str="M 0 "+(tl.keys[0].value*-CABLES.TL.VALUESCALE)+" ";

                str+=tl.keys[i].getPathString(viewBox,nextKey);
                
                tl.keys[i].updateCircle();
                if(tl.keys[i].onChange===null) tl.keys[i].onChange=updateKeyLine;
            }

            if(tl.keys.length>0) str+="L 9999000 "+(tl.keys[tl.keys.length-1].value*-CABLES.TL.VALUESCALE)+" ";
        }

        keyLine.attr({ path:str });
    }


    this.getCanvasCoordsMouse=function(evt)
    {
        return this.getCanvasCoordsSVG('#timeline svg',evt);
    };

    this.getCanvasCoordsMouseTimeDisplay=function(evt)
    {
        return this.getCanvasCoordsSVG('#timetimeline svg',evt);
    };

    this.getCanvasCoordsSVG=function(id,evt)
    {
        var ctm = $(id)[0].getScreenCTM();

        ctm = ctm.inverse();
        var uupos = $(id)[0].createSVGPoint();

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
                if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();

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

    function toggleMoveMode()
    {
        CABLES.TL.MoveMode++;
        if(CABLES.TL.MoveMode>2)CABLES.TL.MoveMode=0;
        if(CABLES.TL.MoveMode===0)
        {
            $("#keymovemode").addClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.TL.MoveMode==1)
        {
            $("#keymovemode").addClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.TL.MoveMode==2)
        {
            $("#keymovemode").addClass('fa-arrows');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
        }
    }

    this.scaleHeight=function()
    {
        var maxv=-99999;
        var minv=99999999;
        for(var i in tl.keys)
        {
            maxv=Math.max(maxv,tl.keys[i].value);
            minv=Math.min(minv,tl.keys[i].value);
        }
        
        if(maxv>0)
        {
            var s=180/(maxv+Math.abs(minv));
            console.log('value scale ',s);

            self.setValueScale(s);
            
                    
            viewBox.y=-200;
            self.updateViewBox();

        }
    };



    $("#keymovemode").bind("click", toggleMoveMode);
    $("#keyscaleheight").bind("click", this.scaleHeight);
    

    $(".timeLineInsert").bind("click", function (e)
    {
        tl.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:2.0}) );
        updateKeyLine();
    });

    $('#timeline').bind("mouseup", function (event)
    {
        rubberBandHide();
        for(var i in tl.keys)
        {
            tl.keys[i].isDragging=false;
        }
    });


    $("#timetimeline").bind("mouseup", function(e)
    {
        isScrollingTime=false;
    });


    $(document).bind("mousemove",function(e)
    {
        if(isScrollingTime)
        {
            scrollTime(e);
        }
    });

    $(document).bind("mouseup",function(e)
    {
        isScrollingTime=false;
    });

    function scrollTime(e)
    {
        if(e.which==1 || e.which==2)
        {
            isScrollingTime=true;
            e.offsetX=e.clientX;
            var time=self.getTimeFromMouse( e );
            var frame=parseInt(time*fps,10);
            time=frame/fps;

            ui.scene.timer.setTime(time);
            self.updateTime();
            $('#timeline').focus();
        }

    }

    $("#timetimeline").bind("mousemove", function(e)
    {
        e=mouseEvent(e);
        scrollTime(e);
        
    });

    var panX=0,panY=0;
    $("#timeline").bind("mousemove", function(e)
    {
        if(isScrollingTime)return;
        e=mouseEvent(e);

        if(e.which==3 || (e.which==1 && spacePressed))
        {
            viewBox.x+=panX-self.getCanvasCoordsMouse(e).x;
            viewBox.y+=panY-self.getCanvasCoordsMouse(e).y;

            var startTime=viewBox.x/CABLES.TL.TIMESCALE;

            self.updateViewBox();
        }

        panX=self.getCanvasCoordsMouse(e).x;
        panY=self.getCanvasCoordsMouse(e).y;

        for(var i in tl.keys)
            if(tl.keys[i].isDragging===true)
                return;

        rubberBandMove(e);

    });

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
                t = paperTime.text(10, -80, "");
                timeDisplayTexts.push(t);
            }

            t=timeDisplayTexts[i];
            t.attr({
                "text":""+parseInt(frame,10),
                "x":i*step/fps*CABLES.TL.TIMESCALE,
                "y":-180,
                "fill":'#aaa',
                "font-size": 22 });
        }
    }

    this.getTime=function()
    {
        return cursorTime;
    };

    this.setValueScale=function(v)
    {
        CABLES.TL.VALUESCALE=v;
        updateKeyLine();
        updateTimeDisplay();
    };

    this.setTimeScale=function(v)
    {
        CABLES.TL.TIMESCALE=v;
        updateKeyLine();
        updateTimeDisplay();
    };

    this.getTimeFromMouse=function(e)
    {
        var time=self.getCanvasCoordsMouseTimeDisplay(e).x;
        // var time=self.getCanvasCoordsMouse(e).x;//$('#timeline').width() ;
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
    this.updateTime();
    this.updateViewBox();
    updateTimeDisplay();

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
                mouseRubberBandStartPos=self.getCanvasCoordsMouse(e);
            mouseRubberBandPos=self.getCanvasCoordsMouse(e);

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

            if(!enabled)return;
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
        }
    }

    // ---------------------------------

    this.copy=function(e)
    {
        var keys=[];
        for(var i in tl.keys)
        {
            if(tl.keys[i].selected)
            {
                keys.push(tl.keys[i].getSerialized() );
            }
        }

        var obj={keys:keys};
        var objStr=JSON.stringify(obj);

        setStatusText(keys.length+' keys copied...');

        e.clipboardData.setData('text/plain', objStr);
        e.preventDefault();
    };

    this.cut=function(e)
    {
        if(!enabled)return;
        self.copy(e);
        tl.deleteSelectedKeys();
        updateKeyLine();
    };


    this.paste=function(e)
    {
        if(!enabled)return;
        if(e.clipboardData.types.indexOf('text/plain') > -1)
        {
            e.preventDefault();

            var str=e.clipboardData.getData('text/plain');

            e.preventDefault();

            var json=JSON.parse(str);
            if(json)
            {
                if(json.keys)
                {
                    var i=0;

                    var minTime=Number.MAX_VALUE;
                    for(i in json.keys)
                    {
                        minTime=Math.min(minTime,json.keys[i].t);
                    }

                    setStatusText(json.keys.length+' keys pasted...');

                    for(i in json.keys)
                    {
                        json.keys[i].t=json.keys[i].t-minTime+cursorTime;
                        tl.addKey(new CABLES.TL.Key(json.keys[i]));
                    }

                    tl.sortKeys();

                    for(i in json.keys)
                    {
                        tl.keys[i].updateCircle();
                    }

                    updateKeyLine();
                    return;
                }
            }
            setStatusText("paste failed / not cables data format...");

        }


    };

    this.unselectKeys=function()
    {
        tl.unselectKeys();
    };


};



