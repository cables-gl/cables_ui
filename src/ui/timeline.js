

CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;
CABLES.TL.Key.prototype.circleBezierOut=null;
CABLES.TL.Key.prototype.circleBezierIn=null;
CABLES.TL.Key.prototype.selected=false;
CABLES.TL.Key.prototype.showCircle=true;

CABLES.TL.MultiGraphKeyDisplayMode=true;
CABLES.TL.MoveMode=0;
CABLES.TL.TIMESCALE=100;
CABLES.TL.VALUESCALE=100;

CABLES.TL.Key.prototype.setAttribs=function(sel)
{
    var opa=0.7;
    var fill='#222';
    if(this.isMainAnim)
    {
        fill=CABLES.UI.uiConfig.colorKey;
        opa=0.8;
    }

    this.circle.attr({ "fill-opacity":0.7 });
    this.circle.attr({ cx:this.x, cy:this.y,"fill-opacity":opa,fill:fill  });

    if(this.selected) this.circle.attr({ fill:"white" });
};

CABLES.TL.Key.prototype.setSelected=function(sel)
{
    this.selected=sel;
    this.setAttribs();
};

CABLES.TL.Key.prototype.removeUi=function()
{
    if(this.bezierControlLineOut)
    {
        this.bezierControlLineOut.undrag();
        this.bezierControlLineOut.remove();
        this.bezierControlLineOut=false;
    }

    if(this.bezierControlLineIn)
    {
        this.bezierControlLineIn.undrag();
        this.bezierControlLineIn.remove();
        this.bezierControlLineIn=false;
    }

    if(this.circleBezierOut)
    {
        this.circleBezierOut.undrag();
        this.circleBezierOut.remove();
        this.circleBezierOut=false;
    }

    if(this.circleBezierIn)
    {
        this.circleBezierIn.undrag();
        this.circleBezierIn.remove();
        this.circleBezierIn=false;
    }

    if(this.circle)
    {
        this.circle.undrag();
        this.circle.remove();
        this.circle=false;
    }
};



CABLES.TL.Key.prototype.isMainAnim=false;

CABLES.TL.Key.prototype.updateCircle=function(_isMainAnim)
{
    if(_isMainAnim!== undefined)this.isMainAnim=_isMainAnim;

    if(!gui.timeLine())return;
    if(!this.circle) this.initUI();
    if(this.getEasing()==CABLES.TL.EASING_BEZIER && !this.circleBezierOut) this.initUI();

    if(isNaN(this.value)) this.value=0;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    if(!this.showCircle) this.circle.hide();
        else this.circle.show();

    if(this.getEasing()==CABLES.TL.EASING_BEZIER)
    {
        var posBezX=this.x+this.bezTime*CABLES.TL.TIMESCALE;
        var posBezY=this.y+this.bezValue*CABLES.TL.VALUESCALE;
        this.circleBezierOut.attr({ cx:posBezX, cy:posBezY  });

        var posBezXIn=this.x+this.bezTimeIn*CABLES.TL.TIMESCALE;
        var posBezYIn=this.y+this.bezValueIn*CABLES.TL.VALUESCALE;
        this.circleBezierIn.attr({ cx:posBezXIn, cy:posBezYIn  });

        var pathOut="M "+this.x+" "+this.y+" L "+posBezX+" "+posBezY;
        var pathIn="M "+this.x+" "+this.y+" L "+posBezXIn+" "+posBezYIn;

        this.bezierControlLineOut.attr({ path:pathOut, stroke: "#888", "stroke-width": 1});
        this.bezierControlLineIn.attr({ path:pathIn, stroke: "#888", "stroke-width": 1});
    }


    if(isNaN(this.x))
    {
        this.x=0;
        console.log('key this.x NaN');
    }
    if(isNaN(this.y))
    {
        this.y=0;
        console.log('key this.x NaN');
    }


    this.setAttribs();
    if(this.isMainAnim)this.circle.toFront();
};

CABLES.TL.Key.prototype.initUI=function()
{
    if(!gui.timeLine())return;
    var self=this;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    this.bezX=this.x+this.bezTime*CABLES.TL.TIMESCALE;
    this.bezY=this.y+this.bezValue*CABLES.TL.VALUESCALE;

    var discattr = {fill: CABLES.UI.uiConfig.colorKey, stroke: "none"};

    if(this.circle)
    {
        this.removeUi();
    }

    if(this.getEasing()==CABLES.TL.EASING_BEZIER)
    {
        if(!this.circleBezierOut)
            this.circleBezierOut=gui.timeLine().getPaper().circle(this.bezX, this.bezY, 7);

        this.circleBezierOut.attr({ fill:"#fff","fill-opacity":0.7  });

        if(!this.circleBezierIn)
            this.circleBezierIn=gui.timeLine().getPaper().circle(this.bezXIn, this.bezYIn, 7);

        this.circleBezierIn.attr({ fill:"#f00","fill-opacity":0.7  });

        if(!this.bezierControlLineOut)
            this.bezierControlLineOut = gui.timeLine().getPaper().path("M 0 0 ");

        if(!this.bezierControlLineIn)
            this.bezierControlLineIn = gui.timeLine().getPaper().path("M 0 0 ");
    }

    this.circle=gui.timeLine().getPaper().circle(this.x, this.y, 7);
    this.circle.attr(discattr);
    this.circle.toFront();

    this.circle.node.onclick = function (e)
    {
        $('#timeline').focus();
        if(!e.shiftKey) gui.timeLine().unselectKeys();

        if(e.shiftKey && self.selected) self.setSelected(false);
            else self.setSelected(true);
    };

    var oldValues={};

    var startMoveX=-1;
    var startMoveY=-1;

    this.doMoveFinished=function()
    {
        startMoveX=-1;
        startMoveY=-1;
        gui.metaKeyframes.update();
        self.isDragging=false;
    };

    this.doMove=function(dx,dy,a,b,e,newPos)
    {
        if(!this.showCircle) return;

        if(startMoveX==-1 )
        {
            startMoveX=newPos.x-self.x;
            startMoveY=newPos.y-self.y;
        }

        newPos.x=newPos.x-startMoveX;
        newPos.y=newPos.y-startMoveY;

        var time=gui.timeLine().getTimeFromPaper(newPos.x);
        var frame=parseInt( (time +0.5*1/gui.timeLine().getFPS() )*gui.timeLine().getFPS(),10);
        time=frame/gui.timeLine().getFPS();



        if(CABLES.TL.MoveMode===0)
        {
            self.set({time:time,value:self.value});
            // self.updateCircle();
        }
        if(CABLES.TL.MoveMode==1)
        {
            self.set({time:time,value:newPos.y/-CABLES.TL.VALUESCALE});
            // self.updateCircle();
        }
        if(CABLES.TL.MoveMode==2)
        {
            self.set({time:time,value:newPos.y/-CABLES.TL.VALUESCALE});
            // self.updateCircle();
        }

    };

    function move(dx,dy,a,b,e)
    {
        $('#timeline').focus();

        self.isDragging=true;
        if(!self.selected)
        {
            gui.timeLine().unselectKeys();
            self.setSelected(true);

        }
        gui.timeLine().moveSelectedKeys(dx,dy,a,b,e);
    }

    function down()
    {
        if(!self.isDragging)
        {
            oldValues=self.getSerialized();
        }
        self.isDragging=true;
    }

    function up()
    {
        gui.timeLine().moveSelectedKeysFinished();

        CABLES.undo.add({
            undo: function()
            {
                self.set(oldValues);
                gui.timeLine().refresh();
            },
            redo: function()
            {
            }
        });

        gui.metaKeyframes.update();

        self.isDragging=false;
    }
    this.circle.drag(move,down,up);

    // --------

    function moveBezierOut(dx,dy,a,b,e)
    {
        self.isDragging=true;
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);
        var newTime=gui.timeLine().getTimeFromPaper(newPos.x);
        var t=self.time;
        var v=self.value;
        var newValue=newPos.y/CABLES.TL.VALUESCALE;

        self.setBezierControlOut(newTime-t,newValue+v);
        self.updateCircle();
    }

    function upBezierOut()
    {
        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }

    if(self.circleBezierOut) self.circleBezierOut.drag(moveBezierOut,upBezierOut);

    // --------

    function moveBezierIn(dx,dy,a,b,e)
    {
        self.isDragging=true;
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);
        var newTime=gui.timeLine().getTimeFromPaper(newPos.x);
        var t=self.time;
        var v=self.value;
        var newValue=newPos.y/CABLES.TL.VALUESCALE;

        self.setBezierControlIn(newTime-t,newValue+v);
        self.updateCircle();
    }

    function upBezierIn()
    {
        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }

    if(self.circleBezierIn) self.circleBezierIn.drag(moveBezierIn,upBezierIn);

};

CABLES.TL.Anim.prototype.hasSelectedKeys=function()
{
    for(var i in this.keys)if(this.keys[i].selected)return true;
};

CABLES.TL.Anim.prototype.moveKeyAt=function(t,nt)
{
    for(var i in this.keys)
        if(this.keys[i].time==t)
        {
            this.keys[i].time=nt;
            this.sortKeys();
        }
};

CABLES.TL.Anim.prototype.show=function()
{
    if(gui.timeLine())
        if(!this.keyLine)
            this.keyLine = gui.timeLine().getPaper().path("M 0 0 L 1 1");
};

CABLES.TL.Anim.prototype.removeUi=function()
{
    if(this.keyLine)
    {
        this.keyLine.hide();
        this.keyLine.remove();
        this.keyLine=false;
    }

    for(var i in this.keys)
        this.keys[i].removeUi();
};

CABLES.TL.Anim.prototype.unselectKeys=function()
{
    for(var i in this.keys)
        this.keys[i].setSelected(false);
};

CABLES.TL.Anim.prototype.deleteKeyAt=function(t)
{
    for(var i in this.keys)
    {
        if(this.keys[i].time==t)
        {
            this.keys[i].removeUi();
            this.keys.splice(i, 1);
            return;
        }
    }
    gui.metaKeyframes.update();
};

CABLES.TL.Anim.prototype.deleteSelectedKeys=function()
{
    var found=true;

    while(found)
    {
        found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].selected && this.keys[i].showCircle)
            {
                var undofunc=function(anim,objKey)
                {
                    CABLES.undo.add({
                        undo: function(){
                            anim.addKey(new CABLES.TL.Key(objKey));
                            anim.sortKeys();
                            gui.timeLine().refresh();
                        },
                        redo: function(){

                            anim.deleteKeyAt(objKey.t);
                            gui.timeLine().refresh();
                        }
                    });
                }(this,this.keys[i].getSerialized());

                this.keys[i].removeUi();
                this.keys.splice(i, 1);
                found=true;
            }
        }
    }
    this.sortKeys();
    gui.metaKeyframes.update();
};


CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    var projectLength=20;
    var tlEmpty=new CABLES.TL.Anim();
    var anim=null;//tlEmpty;//new CABLES.TL.Anim();
    var viewBox={x:-10,y:-170,w:1200,h:400};
    var fps=30;
    var cursorTime=0.0;
    var centerCursorTimeout=-1;

    var anims=[];

    var paper= Raphael("timeline", 0,0);
    var paperTime= Raphael("timetimeline", 0,0);
    var paperOverview= Raphael("overviewtimeline", 0,0);
    var isScrollingTime=false;
    var isScrollingOverview=false;
    var enabled=false;
    var doCenter=false;

    var rubberBandStartPos=null;
    var rubberBandPos=null;
    var mouseRubberBandStartPos=null;
    var mouseRubberBandPos=null;
    var rubberBandRect=null;
    var overviewRect=null;
    var firstTimeLine=true;
    var updateTimer=null;
    var timeDisplayMode=true;

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: CABLES.UI.uiConfig.colorCursor, "stroke-width": 2});

    var cursorLineDisplay = paperTime.path("M 0 0 L 10 10");
    cursorLineDisplay.attr({stroke: CABLES.UI.uiConfig.colorCursor, "stroke-width": 2});

    overviewRect=paperOverview.rect( 0,0,10,10).attr({
        x:0,y:0,width:20,height:30,
        "stroke-width": 0,
        "fill-opacity": 1,
        "fill":"#333"
    });

    var cursorLineOverview = paperOverview.path("M 0 0 L 10 10");
    cursorLineOverview.attr({stroke: "#ffffff", "stroke-width": 1});




    this.setTimeLineLength=function(l)
    {
        projectLength=l||20;
    };

    this.getTimeLineLength=function()
    {
        return projectLength;
    };

    this.getFPS=function()
    {
        return fps;
    };


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
        for(var j in anims)
        {

            anims[j].removeUi();

            // for(var i in anims[j].keys)
            // {
            //     if(anims[j].keys[i].circle)
            //     {
            //         // $('#timeline svg circle').hide();
            //         anims[j].keys[i].removeUi();
            //     }
            // }
        }

        if($('#timeline svg circle').length>0)
        {
            console.log('KEYS NOT REMOVED PROPERLY');
        }
    }

    this.addAnim=function(newanim)
    {
        if(newanim===null)return;

        var i=0;
        // newanim.onChange=null;
        // var newAnims=[];
        // newAnims.push(newanim);
        newanim.show();

        var found=true;
        while(found)
        {
            found=false;
            for(i in anims)
            {
                if(!found && !anims[i].stayInTimeline && anims[i]!=newanim)
                {
                    console.log('found one! '+i);

                    anims[i].removeUi();
                    if(anims.length==1) anims.length=0;
                        else anims=anims.slice(i,1);

                    // if(anims[i].keyLine)anims[i].keyLine.hide();
                    found=true;
                }
            }
        }

        anims.push(newanim);

        // {
        //     newAnims.push(anims[i]);
        //     anims[i].show();
        // }

        // anims=newAnims;

        // for(i in anims)
        // {
        //     if(anims[i]==newanim)
        //     {
        //         return;
        //     }
        // }
        // if(newanim) anims.push(newanim);

    };



    this.removeAnim=function(an)
    {
        if(!an)return;
        var val=an.getValue(cursorTime);

        an.stayInTimeline=false;
        // an.keyLine.hide();

        for(var i in anims)
        {
            if(anims[i] && anims[i]==an)
            {
                an.removeUi();
                anims=anims.slice(i,1);
                self.addAnim(tlEmpty);
                removeDots();
                updateKeyLine();
                this.refresh();
                return val;
            }
        }

        return 0;
    };

    function mousemoveTime(e)
    {
        if(isScrollingTime) scrollTime(e);
    }

    function mousemoveOverview(e)
    {
        if(isScrollingOverview) scrollTimeOverview(e);
    }

    this.getAnim=function()
    {
        return anim;
    };

    this.setAnim=function(newanim,config)
    {
        if(!gui.timeLine())return;
        $(document).bind("mousemove",mousemoveTime);

        if(newanim==anim)return;
        if(newanim && newanim!=tlEmpty)gui.showTiming();

        gui.metaKeyframes.setAnim(newanim);

        removeDots();

        if(!newanim || newanim===null)
        {
            anim=tlEmpty;
            removeDots();
            updateKeyLine();
            $('#timelineTitle').html('');
            enabled=false;
            return;
        }

        newanim.paper=paper;
        anim=newanim;
        enabled=true;
        this.addAnim(anim);

        if(config && config.name) $('#timelineTitle').html(config.name);
            else $('#timelineTitle').html('');

        if(config && config.hasOwnProperty('defaultValue') && anim.keys.length===0)
        {
            anim.keys.push(new CABLES.TL.Key({time:cursorTime,value:config.defaultValue}) );
            this.centerCursor();
        }

        updateKeyLine();
        if(anim.keyLine)anim.keyLine.toFront();
        for(var i in anim.keys)
        {
            if(!anim.keys[i].circle)anim.keys[i].initUI();
            anim.keys[i].updateCircle(true);
        }

        // if(anim.keys.length>1 || anims.length>0)
        // {
        //     self.scaleWidth();
        // }

        // if(anim.keys.length==1)this.centerCursor();
        // self.scaleHeight();
        // this.centerCursor();

        if(anim.onChange===null) anim.onChange=updateKeyLineDelayed;

        if(firstTimeLine)
        {
            firstTimeLine=false;
            self.scaleWidth();
            self.scaleHeight();
        }

    };

    function setCursor(time)
    {
        if(time<0)time=0;
        if(isNaN(time))time=0;



        var pixel=$('#timeline').width()* (time/projectLength);

        cursorLineOverview.attr({path: "M "+pixel+" -1000 L" + pixel + " " + 100 });

// console.log('time',time);
// console.log('projectLength',projectLength);
// console.log('time/projectLength*100',time/projectLength*100);

var start=(viewBox.x/CABLES.TL.TIMESCALE)/projectLength;
var width=(viewBox.w/CABLES.TL.TIMESCALE)/projectLength;
overviewRect.attr(
    {
        "x":start*$('#timeline').width(),
        "width":width*$('#timeline').width(),
    });



        cursorTime=time;
        time=time*CABLES.TL.TIMESCALE;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
        cursorLineDisplay.attr({path: "M "+time+" -1000 L" + time + " " + 30 });

    }

    var zeroLine2 = paper.path("M 0 0 L 111000 0");
    zeroLine2.attr({ stroke: "#999", "stroke-width": 1});

    this.updateViewBox=function()
    {
        if(!enabled) removeDots();

        paperOverview.setViewBox(
            0,
            0,
            $('#timeline').width(),
            25,
            true
        );

        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            $('#timeline').width(),
            viewBox.h,false
        );

try
{
    paperTime.setViewBox(
        viewBox.x,
        -200,
        $('#timeline').width(),
        400,false
    );

}
catch(e)
{
    console.log(e);
    console.log('strange values????',viewBox.x,
                -200,
                $('#timeline').width(),
                400,false
    );

}
        viewBox.w=$('#timeline').width();

        paperTime.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        updateKeyLine();
    };

    this.refresh=function()
    {
        updateKeyLineDelayed();
    };

    var delayedUpdateKeyLine=0;
    function updateKeyLineDelayed()
    {
        clearTimeout(delayedUpdateKeyLine);
        delayedUpdateKeyLine = setTimeout(updateKeyLine, 10);
    }

    function updateKeyLine()
    {
        if(gui.patch().isLoading())return;

        for(var anii in anims)
        {
            var str=null;
            var ani=anims[anii];


            if(ani && ani.keys.length===0)
            {
                ani.removeUi();
            }
            else
            if(ani)
            {
                ani.show();
                ani.sortKeys();

                // var numSteps=500;
                var start=viewBox.x/CABLES.TL.TIMESCALE;
                var width=viewBox.w/CABLES.TL.TIMESCALE;

                var ik=0;

                var timePoints=[0];

                for(ik=0;ik<ani.keys.length;ik++)
                {
                    timePoints.push(ani.keys[ik].time-0.00001);
                    timePoints.push(ani.keys[ik].time);
                    timePoints.push(ani.keys[ik].time+0.00001);

                    if(ani.keys[ik].getEasing()!=CABLES.TL.EASING_LINEAR &&
                        ani.keys[ik].getEasing()!=CABLES.TL.EASING_ABSOLUTE  &&
                        ik<ani.keys.length-1)
                    {
                        var timeSpan=ani.keys[ik+1].time-ani.keys[ik].time;

                        for(var j=0;j<timeSpan;j+=timeSpan/50)
                        {
                            timePoints.push(ani.keys[ik].time+j);
                        }
                    }
                }
                timePoints.push(1000);


                for(var i=0;i<timePoints.length;i++)
                {
                    // var t=start+i*width/numSteps;
                    var t=timePoints[i];
                    var v=ani.getValue(t);
                    if(str===null)str+="M ";
                        else str+="L ";
                    str+=t*CABLES.TL.TIMESCALE+" "+v*-CABLES.TL.VALUESCALE;
                }

                for(ik=0;ik<ani.keys.length;ik++)
                {
                    var nextKey=null;
                    if(ani.keys.length > ik+1) nextKey=ani.keys[ik+1];

                    if(CABLES.TL.MultiGraphKeyDisplayMode)
                        ani.keys[ik].showCircle=true;
                    else
                        if(ani==anim)ani.keys[ik].showCircle=true;
                            else ani.keys[ik].showCircle=false;

                    ani.keys[ik].updateCircle(ani==anim);
                    if(ani.keys[ik].onChange===null) ani.keys[ik].onChange=updateKeyLineDelayed;
                }

                ani.keyLine.attr({ path:str });

                if(ani.keyLine)
                    if(ani==anim) ani.keyLine.attr({ stroke: "#fff", "stroke-width": 2 });
                        else ani.keyLine.attr({ stroke: "#222", "stroke-width": 1 });

            }
        }
    }

    this.getCanvasCoordsMouse=function(evt)
    {
        return this.getCanvasCoordsSVG('#timeline svg',evt);
    };

    this.getCanvasCoordsMouseTimeDisplay=function(evt)
    {
        return this.getCanvasCoordsSVG('#timetimeline svg',evt);
    };

    this.gotoOffset=function(off)
    {
        gui.scene().timer.setOffset(off);
        self.updateTime();
        if(!self.isCursorVisible())self.centerCursor();
    };

    this.gotoZero=function()
    {
        // setCursor(0);
        gui.scene().timer.setTime(0);

        setCursor(0);

        self.centerCursor();
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
        var theKey=null;

        for(var anii in anims)
        {
            var index=anims[anii].getKeyIndex(cursorTime);
            var newIndex=parseInt(index,10)+parseInt(dir,10);

            if(newIndex==1 && cursorTime<anims[anii].keys[0].time)newIndex=0;
            if(newIndex==anims[anii].keys.length-2 && cursorTime>anims[anii].keys[anims[anii].keys.length-1].time)newIndex=anims[anii].keys.length-1;

            if(anims[anii].keys.length>newIndex && newIndex>=0)
            {
                var thetime=anims[anii].keys[newIndex].time;

                if(!theKey)theKey=anims[anii].keys[newIndex];

                if( Math.abs(cursorTime-thetime) < Math.abs(cursorTime-theKey.time) )
                {
                    theKey=anims[anii].keys[newIndex];
                }
            }
        }

        if(theKey)
        {
            gui.scene().timer.setTime(theKey.time);
            self.updateTime();

            if(theKey.time>this.getTimeRight() || theKey.time<this.getTimeLeft()) this.centerCursor();
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
        // console.log(e.which);
        switch(e.which)
        {
            case 46: case 8:
                for(var j in anims) anims[j].deleteSelectedKeys();
                updateKeyLine();
                if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();
            break;

            case 32:
                spacePressed=true;
            break;


            case 72: // h
                self.scaleHeight();
                self.scaleWidth();
            break;

            case 77: // m move key
                var frame=window.prompt("move keys",Math.round(cursorTime*gui.timeLine().getFPS()));
                if(frame!==null)
                {
                    console.log(frame);
                    var firstKeyTimeFPS=-1;
                    for(var i in anim.keys)
                    {

                        if(anim.keys[i].selected)
                        {
                            var t=anim.keys[i].time;
                            if(firstKeyTimeFPS==-1)
                            {
                                 firstKeyTimeFPS=t;
                                 anim.keys[i].time=frame/gui.timeLine().getFPS();
                            }
                            else
                            {
                                anim.keys[i].time=anim.keys[i].time-firstKeyTimeFPS+frame/gui.timeLine().getFPS();
                            }
                        }
                    }
                    anim.sortKeys();
                    updateKeyLine();
                }
            break;


            case 65: // a
                if(e.metaKey || e.ctrlKey) self.selectAllKeys();
            break;

            case 68: // d
                console.log('anim.keys',anim.keys);
            break;

            case 90: // z undo
                if(e.metaKey || e.ctrlKey)
                {
                    if(e.shiftKey) CABLES.undo.redo();
                    else CABLES.undo.undo();
                }
            break;

            case 37: // left
                var num=1;
                if(e.shiftKey)num=10;
                var newTime=getFrame((self.getTime()-1.0/fps*num)+0.001);
                gui.scene().timer.setTime(newTime/fps);
            break;

            case 39: // right
                var numr=1;
                if(e.shiftKey)numr=10;
                var rNewTime=getFrame((self.getTime()+1.0/fps*numr)+0.001);
                gui.scene().timer.setTime(rNewTime/fps);
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

    this.getTimeLeft=function()
    {
        return viewBox.x/CABLES.TL.TIMESCALE;
    };

    this.getTimeRight=function()
    {
        return this.getTimeLeft()+viewBox.w/CABLES.TL.TIMESCALE;
    };

    this.toggleLoop=function()
    {
        anim.loop=!anim.loop;
        updateKeyLine();
    };

    this.centerCursor=function()
    {
        var start=cursorTime*CABLES.TL.TIMESCALE;
        var width=viewBox.w;
        var left=start-width/2;

        if(left<0)left=0;

        viewBox.x=left;

        self.updateViewBox();
        updateTimeDisplay();
    };

    this.scaleWidth=function()
    {
        if(gui.patch().isLoading())return;

        var maxt=-99999;
        var mint=99999999;
        var anii=0;

        var hasSelectedKeys=false;
        for(anii in anims)
            if(anims[anii].hasSelectedKeys())hasSelectedKeys=true;

        var count=0;
        for(anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                if(!hasSelectedKeys || anims[anii].keys[i].selected)
                {
                    count++;
                    maxt=Math.max(maxt,anims[anii].keys[i].time);
                    mint=Math.min(mint,anims[anii].keys[i].time);
                }
            }
        }
        if(count===0)
        {
            maxt=10;
            mint=10;
        }
        if(maxt==mint)
        {
            maxt+=3;
            mint-=3;
            if(mint<0) mint=0;
        }

        CABLES.TL.TIMESCALE=viewBox.w/(maxt-mint)*0.9;
        viewBox.x=mint*CABLES.TL.TIMESCALE-(maxt-mint)*0.05*CABLES.TL.TIMESCALE;
        console.log('CABLES.TL.TIMESCALE ',mint,maxt,count);


        self.updateViewBox();
        updateTimeDisplay();
    };

    var delayedScaleHeight=0;
    this.scaleHeightDelayed=function()
    {
        clearTimeout(delayedScaleHeight);
        delayedScaleHeight = setTimeout(self.scaleHeight, 150);
    };


    var lastScaleHeightMax=0;
    var lastScaleHeightMin=0;
    this.scaleHeight=function()
    {
        var maxv=-99999;
        var minv=99999999;
        var anii=0;
        var hasSelectedKeys=false;

        for(anii in anims)
            if(anims[anii].hasSelectedKeys())hasSelectedKeys=true;

        var count=0;
        for(anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                if(!hasSelectedKeys || anims[anii].keys[i].selected)
                {
                    count++;
                    maxv=Math.max(maxv,anims[anii].keys[i].value);
                    minv=Math.min(minv,anims[anii].keys[i].value);
                }
            }
        }

        if( lastScaleHeightMax!=maxv ||lastScaleHeightMin!=minv )
        {
            lastScaleHeightMax=maxv;
            lastScaleHeightMin=minv;

            if(count===0)
            {
                maxv=1;
                minv=-1;
            }

            if(maxv==minv)
            {
                maxv+=2;
                minv-=2;
            }

            var s=Math.abs(maxv)+Math.abs(minv);
            self.setValueScale( $('#timeline').height()/2.3/( s-Math.abs(s)*0.2) );

            viewBox.y=-maxv*1.1*CABLES.TL.VALUESCALE;
            self.updateViewBox();

        }
    };

    this.timeLineTimeClick=function(e)
    {
        if(!e)return;
        if(e.which!=1)
        {
            gui.timeLine().toggleTimeDisplayMode();
        }
        else
        {

            var frame=window.prompt('jump to key:',0);

            if(frame!==null)
            {
                var t=frame/gui.timeLine().getFPS();

                gui.scene().timer.setTime(t);
                setCursor(t);
                self.centerCursor();

            }

        }
    };

    this.selectAllKeys=function()
    {
        for(var anii in anims)
            for(var i in anims[anii].keys)
                if(anims[anii].keys[i].showCircle)
                    anims[anii].keys[i].setSelected(true);
        updateKeyLine();
    };

    this.setSelectedKeysEasing=function(e)
    {
        for(var anii in anims)
        {
            // anims[anii].defaultEasing=e;
            for(var i in anims[anii].keys)
            {
                anims[anii].removeUi();

                if(anims[anii].keys[i].selected)
                    anims[anii].keys[i].setEasing(e);
            }
        }
        updateKeyLine();
    };

    function toggleMultiGraphKeyDisplay(e)
    {
        if(e.buttons==3)
        {
            removeDots();

            for(var i=0;i<anims.length;i++)
            {
                console.log('anims[i]',anims[i]);
                self.removeAnim(anims[i]);
            }

            self.setAnim(null);
            updateKeyLine();
        }
        else
        {
            CABLES.TL.MultiGraphKeyDisplayMode=!CABLES.TL.MultiGraphKeyDisplayMode;
            console.log('CABLES.TL.MultiGraphKeyDisplayMode ',CABLES.TL.MultiGraphKeyDisplayMode);
        }
        updateKeyLine();
    }


    $("#keymovemode").bind("click", toggleMoveMode);
    $("#keyscaleheight").bind("click", this.scaleHeight);
    $("#keyscalewidth").bind("click", this.scaleWidth);
    $(".timelinetime").bind("click", this.timeLineTimeClick);



    // $("#ease_linear").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_LINEAR); } );
    // $("#ease_absolute").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_ABSOLUTE); } );
    // $("#ease_smoothstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHSTEP); } );
    // $("#ease_smootherstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHERSTEP); } );
    // $("#ease_bezier").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_BEZIER); } );


    $("#loop").bind("click", this.toggleLoop);
    $("#centercursor").bind("click", this.centerCursor);
    $("#centercursor").bind("mousedown", function(){doCenter=true;} );
    $("#centercursor").bind("mouseup", function(){doCenter=false;} );

    $("#toggleMultiGraphKeyDisplay").bind("mousedown", toggleMultiGraphKeyDisplay );


    // $('#timeline').bind("mousewheel", function (event,delta,nbr)
    // {
    //     CABLES.TL.VALUESCALE+=delta;

    //     if(CABLES.TL.VALUESCALE<10)CABLES.TL.VALUESCALE=10;
    //     self.updateViewBox();
    // });

    $(".timeLineInsert").bind("click", function (e)
    {
        anim.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:anim.getValue(cursorTime)}) );
        updateKeyLine();
    });

    var startMouseDown=0;
    $('#timeline').bind("mousedown", function (event)
    {
        startMouseDown=Date.now();
    });

    $('#timeline').bind("mouseup", function (event)
    {
        if(Date.now()-startMouseDown<100 && !event.shiftKey && !isScrollingTime && !isScrollingOverview && !isDragging())self.unselectKeys();

        rubberBandHide();

        for(var j in anims)
            for(var i in anims[j].keys)
                anims[j].keys[i].isDragging=false;
    });

    $("#timetimeline").bind("mouseup", function(e)
    {
        isScrollingTime=false;
    });

    $("#overviewtimeline").bind("mouseup", function(e)
    {
        isScrollingOverview=false;
    });

    window.addEventListener('resize', function(event)
    {
        self.updateViewBox();
    });

    $(document).bind("mouseup",function(e)
    {
        isScrollingTime=false;
        isScrollingOverview=false;
    });

    function scrollTimeOverview(e)
    {
        isScrollingOverview=true;
        var time=e.clientX/$('#timeline').width();
        time=projectLength*time;

        gui.scene().timer.setTime(time);
        clearTimeout(centerCursorTimeout);
        centerCursorTimeout=setTimeout(function()
        {
            self.centerCursor();
        },100);

    }

    function scrollTime(e)
    {
        if(e.buttons==1 || e.buttons==2)
        {
            isScrollingTime=true;
            e.offsetX=e.clientX;
            var time=self.getTimeFromMouse( e );
            var frame=parseInt( (time +0.5*1/fps )*fps,10);
            time=frame/fps;

            gui.scene().timer.setTime(time);
            self.updateTime();
            $('#timeline').focus();
        }
    }
    $("#timelineui").bind("mousedown", function(e)
    {
        $('#timeline').focus();
        if(e.target.nodeName!='INPUT')e.preventDefault();
    });

    $("#timetimeline").bind("mousedown", function(e)
    {
        $(document).bind("mousemove",mousemoveTime);
        $('#timeline').focus();
        e=mouseEvent(e);
        scrollTime(e);
        e.preventDefault();
    });

    $("#overviewtimeline").bind("mousedown", function(e)
    {
        e.preventDefault();
        e.stopPropagation();

        if(e.which==3)
        {
            var l=prompt("projectlength",Math.floor(projectLength*gui.timeLine().getFPS()));
            if(l==null)return;
            projectLength=parseInt(l)/gui.timeLine().getFPS();
        }
        else
        {
            $(document).bind("mousemove",mousemoveOverview);
            $('#timeline').focus();
            e=mouseEvent(e);
        }
        scrollTimeOverview(e);
        e.preventDefault();
        e.stopPropagation();

    });

    function isDragging()
    {
        for(var j in anims)
            for(var i in anims[j].keys)
                if(anims[j].keys[i].isDragging===true)
                    return true;

        return false;
    }

    var panX=0,panY=0;

    $("#timeline").bind("mouseleave", function(e)
    {
        rubberBandHide();
    });

    $("#timeline").bind("mousemove", function(e)
    {
        if(isScrollingTime)return;
        e=mouseEvent(e);

        if(e.buttons==2 || e.buttons==3 || (e.buttons==1 && spacePressed))
        {
            viewBox.x+=panX-self.getCanvasCoordsMouse(e).x;
            viewBox.y+=panY-self.getCanvasCoordsMouse(e).y;

            var startTime=viewBox.x/CABLES.TL.TIMESCALE;

            self.updateViewBox();
            updateTimeDisplay();

        }

        panX=self.getCanvasCoordsMouse(e).x;
        panY=self.getCanvasCoordsMouse(e).y;

        if(isDragging())return;

        rubberBandMove(e);

        e.preventDefault();
        e.stopPropagation();
    });

    var timeDisplayTexts=[];
    function updateTimeDisplay()
    {
        var step=1;

        var start=(viewBox.x/CABLES.TL.TIMESCALE);
        var width=viewBox.w/CABLES.TL.TIMESCALE;

        if(width>1.5)step=5;
        if(width>5.5)step=10;
        if(width>13)step=20;
        if(width>20)step=100;

        var startFrame=Math.floor( (start*self.getFPS() ) )-5;
        var endFrame=Math.floor( ((start+width)*self.getFPS() ) )+5;

        for(var i=0;i<timeDisplayTexts.length;i++)
        {
            timeDisplayTexts[i].hide();
        }

        var count=0;
        for(var i=startFrame;i<endFrame;i++)
        {
            if(i%step==0)
            {
                var frame=i;
                if(frame<0)continue;
                var t;
                var textIndex=(i-startFrame);

                if(count>timeDisplayTexts.length-1)
                {
                    t = paperTime.text(10, -80, "");
                    timeDisplayTexts.push(t);
                }


                var txt=i;

                t=timeDisplayTexts[count];
                t.show();
                t.attr({
                    "text":""+txt,
                    "x":(i/fps)*CABLES.TL.TIMESCALE,
                    "y":-190,
                    "fill":'#aaa',
                    "font-size": 12 });

                count++;

            }
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
        cursorLine.hide();

        var oldx=viewBox.x;

        var offsetLeftTime=this.getTimeFromPaper(viewBox.x);
        var oldCursor=(this.getPaperXFromTime(cursorTime)-viewBox.x);

        var leftToCursorDiff=this.getPaperXFromTime(cursorTime-offsetLeftTime);

        CABLES.TL.TIMESCALE=v;

        var leftToCursorDiffAfter=this.getPaperXFromTime(cursorTime-offsetLeftTime);
        leftToCursorDiff=leftToCursorDiffAfter-leftToCursorDiff;

        this.centerCursor();
        viewBox.x-=leftToCursorDiff;

        updateKeyLine();

        self.updateViewBox();
        updateTimeDisplay();

        $('#timeline').focus();
        cursorLine.show();
        setCursor(this.getTime());
    };

    this.getTimeFromMouse=function(e)
    {
        var time=self.getCanvasCoordsMouseTimeDisplay(e).x;
        time/=CABLES.TL.TIMESCALE;
        return time;
    };

    this.isCursorVisible=function()
    {
        return (cursorTime> self.getTimeFromPaper(viewBox.x)  && cursorTime < self.getTimeFromPaper(viewBox.w)+self.getTimeFromPaper(viewBox.x));
    };

    this.getPaperXFromTime=function(t)
    {
        return t*CABLES.TL.TIMESCALE;
    };

    this.getTimeFromPaper=function(offsetX)
    {
        var time=offsetX;
        time/=CABLES.TL.TIMESCALE;
        return time;
    };

    this.toggleTimeDisplayMode=function()
    {
        timeDisplayMode=!timeDisplayMode;
        console.log('timeDisplayMode',timeDisplayMode);
        this.updateTime();
        updateTimeDisplay();
    };

    var lastTime=-1;
    this.updateTime=function()
    {
        if(gui.isShowingTiming())
        {
            var time=gui.scene().timer.getTime();
            setCursor(time);
            if(doCenter)self.centerCursor();
            if(lastTime!=time)
            {
                lastTime=time;

                if(timeDisplayMode)
                    $('.timelinetime').html( '<b class="mainColor">'+getFrame(time)+'</b><br/>'+(time+'').substr(0, 4)+'s ' );
                else
                    $('.timelinetime').html( '<b class="mainColor">'+(time+'').substr(0, 4)+'s </b><br/>'+getFrame(time)+' ' );
            }

        }

        if(updateTimer===null) updateTimer=setInterval(self.updateTime,30);
    };

    this.togglePlay=function(patch)
    {
        gui.scene().timer.togglePlay();

        if(!gui.scene().timer.isPlaying())
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

    // ------------------

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
        if(e.buttons==1 && !spacePressed)
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
                    "stroke": CABLES.UI.uiConfig.colorRubberBand,
                    "fill": CABLES.UI.uiConfig.colorRubberBand,
                    "stroke-width": 2,
                    "fill-opacity": 0.1
               });

            if(!enabled)return;
            var count=0;

            for(var j in anims)
            {
                for(var i in anims[j].keys)
                {
                    var rect=anims[j].keys[i].circle;
                    if(anims[j].keys[i].showCircle)
                    {
                        var opX=rect.attr("cx");
                        var opY=rect.attr("cy");

                        anims[j].keys[i].setSelected(false);
                        if(opX>start.x && opX<end.x && opY>start.y && opY<end.y )
                        {
                            anims[j].keys[i].setSelected(true);
                            count++;
                        }
                    }
                }
            }

            // CABLES.UI.setStatusText(count+' keys selected');
            CABLES.UI.notify(count+' keys selected');
        }
    }

    // ---------------------------------

    this.copy=function(e)
    {
        var keys=[];
        for(var i in anim.keys)
        {
            if(anim.keys[i].selected)
            {
                keys.push(anim.keys[i].getSerialized() );
            }
        }

        var obj={keys:keys};
        var objStr=JSON.stringify(obj);

        // CABLES.UI.setStatusText(keys.length+' keys copied...');
        CABLES.UI.notify(keys.length+' keys copied...');

        e.clipboardData.setData('text/plain', objStr);
        e.preventDefault();
    };

    this.cut=function(e)
    {
        if(!enabled)return;
        self.copy(e);
        anim.deleteSelectedKeys();
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

                    // CABLES.UI.setStatusText(json.keys.length+' keys pasted...');
                    CABLES.UI.notify(json.keys.length+' keys pasted');

                    for(i in json.keys)
                    {
                        json.keys[i].t=json.keys[i].t-minTime+cursorTime;
                        anim.addKey(new CABLES.TL.Key(json.keys[i]));
                    }

                    anim.sortKeys();

                    for(i in anim.keys)
                    {
                        anim.keys[i].updateCircle(true);
                    }

                    updateKeyLine();
                    return;
                }
            }
            // CABLES.UI.setStatusText("paste failed / not cables data format...");
            CABLES.UI.notify('Paste failed');

        }
    };

    this.moveSelectedKeysFinished=function()
    {
        for(var i in anims)
        {
            if(anims[i])
            {
                for(var k in anims[i].keys)
                {
                    var key=anims[i].keys[k];
                    if(key.selected)
                    {
                        key.doMoveFinished();
                    }
                }
            }
        }
    };

    this.moveSelectedKeys=function(dx,dy,a,b,e)
    {
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);

        // snap to cursor
        if( Math.abs(e.clientX-gui.timeLine().getTime()*CABLES.TL.TIMESCALE) <20 )
            newPos.x=gui.timeLine().getTime()*CABLES.TL.TIMESCALE;

        for(var i in anims)
        {
            if(anims[i])
            {
                for(var k in anims[i].keys)
                {
                    var key=anims[i].keys[k];
                    if(key.selected)
                    {
                        key.doMove(dx,dy,a,b,e,newPos);
                    }
                }
            }
        }
    };

    this.unselectKeys=function()
    {
        for(var i in anims)
        {
            if(anims[i])
            {
                anims[i].unselectKeys();
            }
        }
    };

    this.clear=function()
    {
        for(var i in anims)
        {
            // if(anims[i])
            {
                // anims[i].keyLine.hide();
                anims[i].removeUi();
                found=true;
            }
        }
        anims.length=0;
    };

    this.updateTime();
    this.setAnim(tlEmpty);
    updateTimeDisplay();
    this.centerCursor();
    updateKeyLine();
    this.setAnim(tlEmpty);
    self.updateViewBox();
    self.setAnim(tlEmpty);

    $("#timeline").bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });


};
