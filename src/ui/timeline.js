
CABLES.ANIM.UI=CABLES.ANIM.UI || {};

CABLES.ANIM.Key.prototype.isUI=true;
CABLES.ANIM.Key.prototype.circle=null;
CABLES.ANIM.Key.prototype.circleBezierOut=null;
CABLES.ANIM.Key.prototype.circleBezierIn=null;
CABLES.ANIM.Key.prototype.selected=false;
CABLES.ANIM.Key.prototype.showCircle=true;

CABLES.ANIM.MultiGraphKeyDisplayMode=true;
CABLES.ANIM.MoveMode=0;
CABLES.ANIM.TIMESCALE=100;
CABLES.ANIM.VALUESCALE=100;


CABLES.ANIM.Key.prototype.setAttribs=function(sel)
{
    // var opa=0.7;
    // var fill='#222';
    // if(this.isMainAnim)
    // {
    //     fill=CABLES.UI.uiConfig.colorKey;
    //     opa=0.8;
    // }

    this.circle.node.classList.add("timeline-key");
    // this.circle.attr({ "fill-opacity":0.7 });
    this.circle.attr({ cx:this.x, cy:this.y }); //,"fill-opacity":opa,fill:fill 

    if(this.selected) this.circle.node.classList.add("timeline-key-selected"); //this.circle.attr({ fill:"white" });
        else this.circle.node.classList.remove("timeline-key-selected");
};

CABLES.ANIM.Key.prototype.setSelected=function(sel)
{
    this.selected=sel;
    this.setAttribs();
};

CABLES.ANIM.Key.prototype.removeUi=function()
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



CABLES.ANIM.Key.prototype.isMainAnim=false;

CABLES.ANIM.Key.prototype.updateCircle=function(_isMainAnim)
{
    if(_isMainAnim!== undefined)this.isMainAnim=_isMainAnim;

    if(!gui.timeLine())return;
    if(!this.circle) this.initUI();
    if(this.getEasing()==CABLES.ANIM.EASING_BEZIER && !this.circleBezierOut) this.initUI();

    if(isNaN(this.value)) this.value=0;

    this.x=this.time*CABLES.ANIM.TIMESCALE;
    this.y=this.value*-CABLES.ANIM.VALUESCALE;

    if(!this.showCircle) this.circle.hide();
        else this.circle.show();

    if(this.getEasing()==CABLES.ANIM.EASING_BEZIER)
    {
        var posBezX=this.x+this.bezTime*CABLES.ANIM.TIMESCALE;
        var posBezY=this.y+this.bezValue*CABLES.ANIM.VALUESCALE;
        this.circleBezierOut.attr({ cx:posBezX, cy:posBezY  });

        var posBezXIn=this.x+this.bezTimeIn*CABLES.ANIM.TIMESCALE;
        var posBezYIn=this.y+this.bezValueIn*CABLES.ANIM.VALUESCALE;
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

CABLES.ANIM.Key.prototype.initUI=function()
{
    if(!gui.timeLine())return;
    var self=this;

    this.x=this.time*CABLES.ANIM.TIMESCALE;
    this.y=this.value*-CABLES.ANIM.VALUESCALE;

    this.bezX=this.x+this.bezTime*CABLES.ANIM.TIMESCALE;
    this.bezY=this.y+this.bezValue*CABLES.ANIM.VALUESCALE;

    var discattr = {fill: CABLES.UI.uiConfig.colorKey, stroke: "none"};

    if(this.circle)
    {
        this.removeUi();
    }

    if(this.getEasing()==CABLES.ANIM.EASING_BEZIER)
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

    this.circle=gui.timeLine().getPaper().circle(this.x, this.y, 5);
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



        if(CABLES.ANIM.MoveMode===0)
        {
            self.set({time:time,value:self.value});
            // self.updateCircle();
        }
        if(CABLES.ANIM.MoveMode==1)
        {
            self.set({time:time,value:newPos.y/-CABLES.ANIM.VALUESCALE});
            // self.updateCircle();
        }
        if(CABLES.ANIM.MoveMode==2)
        {
            self.set({time:time,value:newPos.y/-CABLES.ANIM.VALUESCALE});
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
        var newValue=newPos.y/CABLES.ANIM.VALUESCALE;

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
        var newValue=newPos.y/CABLES.ANIM.VALUESCALE;

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

CABLES.Anim.prototype.hasSelectedKeys=function()
{
    for(var i in this.keys)if(this.keys[i].selected)return true;
};

CABLES.Anim.prototype.moveKeyAt=function(t,nt)
{
    for(var i in this.keys)
        if(this.keys[i].time==t)
        {
            this.keys[i].time=nt;
            this.sortKeys();
        }
};

CABLES.Anim.prototype.show=function()
{
    if(gui.timeLine())
        if(!this.keyLine)
            this.keyLine = gui.timeLine().getPaper().path("M 0 0 L 0 1");
};

CABLES.Anim.prototype.removeUi=function()
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

CABLES.Anim.prototype.unselectKeys=function()
{
    for(var i in this.keys)
        this.keys[i].setSelected(false);
};

CABLES.Anim.prototype.deleteKeyAt=function(t)
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

CABLES.Anim.prototype.deleteSelectedKeys=function()
{
    var found=true;

    function undofunc(anim,objKey)
    {
        CABLES.undo.add({
            undo: function(){
                anim.addKey(new CABLES.ANIM.Key(objKey));
                anim.sortKeys();
                gui.timeLine().refresh();
            },
            redo: function(){

                anim.deleteKeyAt(objKey.t);
                gui.timeLine().refresh();
            }
        });
    }

    while(found)
    {
        found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].selected && this.keys[i].showCircle)
            {
                undofunc(this,this.keys[i].getSerialized());

                this.keys[i].removeUi();
                this.keys.splice(i, 1);
                found=true;
            }
        }
    }
    this.sortKeys();
    gui.metaKeyframes.update();
};







CABLES.ANIM.UI.TimeLineUI=function()
{
    var self=this;
    var projectLength=20;
    var tlEmpty=new CABLES.Anim();
    var anim=null;//tlEmpty;//new CABLES.Anim();
    var viewBox={x:-10,y:-170,w:1200,h:400};
    var fps=30;
    var cursorTime=0.0;
    var centerCursorTimeout=-1;
	this.hidden=true;
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
    var overviewAreaResizeWidth=6;

    var cursorLine = paper.path("M 0 0 L 0 10");
    cursorLine.node.classList.add('timeline-cursor');

    var cursorLineDisplay = paperTime.path("M 0 0 L 0 10");
    cursorLineDisplay.node.classList.add('timeline-cursor');

    this._loopAreaRect=paperTime.rect(0,1140,110,0);
    // this._loopAreaRect.node.classList.add("timeline-overview-area");
    this._loopAreaRect.attr({"fill":'#fff'});
    this._loopBegin=-1;
    this._loopEnd=0;


    var oldPos=0;
    overviewRect=paperOverview.rect( 0,0,10,10).attr({
        x:0,y:0,width:20,height:30
    });
    overviewRect.node.classList.add("timeline-overview-area");
    overviewRect.drag(
        function(dx,dy,x,y,e)
        {
            var time=(oldPos+dx)/$('#timeline').width();
            time=projectLength*time;

            viewBox.x=time*CABLES.ANIM.TIMESCALE;
    
            updateTimeDisplay();
            self.updateOverviewLine();
            self.updateViewBox();
        }, 
        function()
        {
            oldPos=overviewRect.attr('x');
        }, 
        function(){}
    );

    this._ovAreaPos=paperOverview.rect( 0,0,10,10).attr({
        x:0,y:0,width:overviewAreaResizeWidth,height:30
    });

    this._ovAreaPosR=paperOverview.rect( 0,0,10,10).attr({
        x:0,y:0,width:overviewAreaResizeWidth,height:30
    });
    

    // -- resize handle left

    var oldEndSeconds=0;
    this._ovAreaPos.drag(
        function(dx,dy,x,y,e)
        {
            var time=(e.offsetX/$('#timeline').width())*projectLength;
            var lengthSeconds=(oldEndSeconds-time);

            CABLES.ANIM.TIMESCALE=$('#timeline').width()/lengthSeconds;
            viewBox.x=time*CABLES.ANIM.TIMESCALE;

            updateTimeDisplay();
            self.updateOverviewLine();
            self.updateViewBox();
            gui.timeLine().updateTime();
        }, 
        function()
        {
            oldEndSeconds=(viewBox.w+viewBox.x)/CABLES.ANIM.TIMESCALE;
        }, 
        function(){}
    );


    // -- resize handle right

    var oldStartSeconds=0;
    this._ovAreaPosR.drag(
        function(dx,dy,x,y,e)
        {
            var time=e.offsetX/$('#timeline').width();
            time=projectLength*time;

            CABLES.ANIM.TIMESCALE=$('#timeline').width()/(time-oldStartSeconds);
            viewBox.x=oldStartSeconds*CABLES.ANIM.TIMESCALE;

            updateTimeDisplay();
            self.updateOverviewLine();
            self.updateViewBox();
            gui.timeLine().updateTime();
        }, 
        function()
        {
            oldStartSeconds=(viewBox.x)/CABLES.ANIM.TIMESCALE;
        }, 
        function(){}
    );

    this._ovAreaPosR.node.classList.add("timeline-overview-area-resize");
    this._ovAreaPos.node.classList.add("timeline-overview-area-resize");

    // -----------

    var cursorLineOverview = paperOverview.path("M 0 0 L 0 100");
    // cursorLineOverview.attr({stroke: "#ffffff", "stroke-width": 1});
    cursorLineOverview.node.classList.add("timeline-cursor");

    


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

    // function mousemoveOverview(e)
    // {
        // if(isScrollingOverview) scrollTimeOverview(e);
    // }

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
            anim.keys.push(new CABLES.ANIM.Key({time:cursorTime,value:config.defaultValue}) );
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

        self.redraw();

    };

    function setCursor(time)
    {

        if(gui.scene().timer.isPlaying() && ((time>self._loopEnd && self._loopBegin!=-1) || (time<self._loopBegin && self._loopBegin!=-1)))
        {
            gui.scene().timer.setTime(self._loopBegin);
        }
        

        if(time<0)time=0;
        if(isNaN(time))time=0;


        var pixel=$('#timeline').width()* (time/projectLength);
        cursorLineOverview.attr({path: "M "+pixel+" -1000 L" + pixel + " " + 100 });

        // console.log('time',time);
        // console.log('projectLength',projectLength);
        // console.log('time/projectLength*100',time/projectLength*100);

        self.updateOverviewLine();

        cursorTime=time;
        time=time*CABLES.ANIM.TIMESCALE;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
        cursorLineDisplay.attr({path: "M "+time+" -1000 L" + time + " " + 30 });
        cursorLine.toFront();
    }

    this.updateOverviewLine=function()
    {
        var start=(viewBox.x/CABLES.ANIM.TIMESCALE)/projectLength;
        var width=(viewBox.w/CABLES.ANIM.TIMESCALE)/projectLength;
        overviewRect.attr(
            {
                "x":start*$('#timeline').width(),
                "width":width*$('#timeline').width(),
            });

        this._ovAreaPos.attr(
            {
                "x":start*$('#timeline').width(),
            });

        this._ovAreaPosR.attr(
            {
                "x":(start+width)*($('#timeline').width()-1),
            });
        this._// ovAreaPosR.toFront();
    
        };

    var zeroLine2 = paper.path("M 0 0 L 111000 0");
    // zeroLine2.attr({ stroke: "#999", "stroke-width": 1});
    zeroLine2.node.classList.add("timeline-timesteplines");


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
            $('#timeline').height(),
            false
        );

        // var viewBox={x:-10,y:-170,w:1200,h:400};
        try
        {
            paperTime.setViewBox(
                viewBox.x,
                0,
                $('#timeline').width(),
                25,
                false
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

        // paperTime.canvas.setAttribute('preserveAspectRatio', 'yMinXMin meet');
        // paper.canvas.setAttribute('preserveAspectRatio', 'yMinXMin meet');

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
                var start=viewBox.x/CABLES.ANIM.TIMESCALE;
                var width=viewBox.w/CABLES.ANIM.TIMESCALE;

                var ik=0;

                var timePoints=[0];

                for(ik=0;ik<ani.keys.length;ik++)
                {
                    timePoints.push(ani.keys[ik].time-0.00001);
                    timePoints.push(ani.keys[ik].time);
                    timePoints.push(ani.keys[ik].time+0.00001);

                    if(ani.keys[ik].getEasing()!=CABLES.ANIM.EASING_LINEAR &&
                        ani.keys[ik].getEasing()!=CABLES.ANIM.EASING_ABSOLUTE  &&
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
                    str+=t*CABLES.ANIM.TIMESCALE+" "+v*-CABLES.ANIM.VALUESCALE;
                }

                ani.keyLine.attr({ path:str });
                ani.keyLine.toFront();
                ani.keyLine.node.classList.add("timeline-keyline");

                for(ik=0;ik<ani.keys.length;ik++)
                {
                    var nextKey=null;
                    if(ani.keys.length > ik+1) nextKey=ani.keys[ik+1];

                    if(CABLES.ANIM.MultiGraphKeyDisplayMode)
                        ani.keys[ik].showCircle=true;
                    else
                        if(ani==anim)ani.keys[ik].showCircle=true;
                            else ani.keys[ik].showCircle=false;

                    ani.keys[ik].updateCircle(ani==anim);
                    if(ani.keys[ik].onChange===null) ani.keys[ik].onChange=updateKeyLineDelayed;
                }


                // if(ani.keyLine)
                //     if(ani==anim) ani.keyLine.attr({ stroke: "#fff", "stroke-width": 2 });
                //         else ani.keyLine.attr({ stroke: "#222", "stroke-width": 1 });

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
            
            if(dir==-1 && anims[anii].keys[index].time!=cursorTime)dir=0;
            
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
                e.preventDefault();
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
                setCursor(newTime/fps);
                updateTimeDisplay();
                self.updateTime();
                
            break;

            case 39: // right
                var numr=1;
                if(e.shiftKey)numr=10;
                var rNewTime=getFrame((self.getTime()+1.0/fps*numr)+0.001);
                gui.scene().timer.setTime(rNewTime/fps);
                setCursor(rNewTime/fps);
                updateTimeDisplay();
                self.updateTime();

            break;

            case 33: // pg up
            break;

            case 34: // pg down
            break;


            case 66: // b BEGIN 
                if(self._loopBegin==self.getTime() || self._loopBegin>self._loopEnd)
                {
                    self._loopBegin=-1;
                    self._loopEnd=0;
                    self._loopAreaRect.hide();
                    updateTimeDisplay();
                    return;
                }
                self._loopBegin=self.getTime();
                updateTimeDisplay();
            break;

            case 78: // n end loop
                self._loopEnd=self.getTime();
                updateTimeDisplay();
            break;

            default:
                // console.log('key ',e.which);
            break;
        }
    });

    function toggleMoveMode()
    {
        CABLES.ANIM.MoveMode++;
        if(CABLES.ANIM.MoveMode>2)CABLES.ANIM.MoveMode=0;
        if(CABLES.ANIM.MoveMode===0)
        {
            $("#keymovemode").addClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.ANIM.MoveMode==1)
        {
            $("#keymovemode").addClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.ANIM.MoveMode==2)
        {
            $("#keymovemode").addClass('fa-arrows');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
        }
    }

    this.getTimeLeft=function()
    {
        return viewBox.x/CABLES.ANIM.TIMESCALE;
    };

    this.getTimeRight=function()
    {
        return this.getTimeLeft()+viewBox.w/CABLES.ANIM.TIMESCALE;
    };

    this.toggleLoop=function()
    {
        anim.loop=!anim.loop;
        updateKeyLine();
    };

    this.centerCursor=function()
    {
        var start=cursorTime*CABLES.ANIM.TIMESCALE;
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

        var padVal=(maxt-mint)*0.025;
        mint-=padVal;
        maxt+=padVal;
        CABLES.ANIM.TIMESCALE=viewBox.w/(maxt-mint)*1;
        var padding=padVal*CABLES.ANIM.TIMESCALE;
        viewBox.x=mint*CABLES.ANIM.TIMESCALE;
        console.log('CABLES.ANIM.TIMESCALE ',mint,maxt,count);

        self.updateViewBox();
        updateTimeDisplay();
        self.updateOverviewLine();
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

        // if( lastScaleHeightMax!=maxv ||lastScaleHeightMin!=minv )
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
            self.setValueScale( $('#timeline svg').height()/2.3/( s-Math.abs(s)*0.2) );

            console.log('before',viewBox.y);
            viewBox.y=-maxv*1.1*CABLES.ANIM.VALUESCALE;
            console.log('after',viewBox.y);
            self.updateViewBox();
            self.updateOverviewLine();
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
        self.updateEasingsSelect();
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
        self.updateEasingsSelect();
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
            CABLES.ANIM.MultiGraphKeyDisplayMode=!CABLES.ANIM.MultiGraphKeyDisplayMode;
            console.log('CABLES.ANIM.MultiGraphKeyDisplayMode ',CABLES.ANIM.MultiGraphKeyDisplayMode);
        }
        updateKeyLine();
    }


    $("#keymovemode").bind("click", toggleMoveMode);
    $("#keyscaleheight").bind("click", this.scaleHeight);
    $("#keyscalewidth").bind("click", this.scaleWidth);
    $(".timelinetime").bind("click", this.timeLineTimeClick);

    $("#loop").bind("click", this.toggleLoop);
    $("#centercursor").bind("click", this.centerCursor);
    $("#centercursor").bind("mousedown", function(){doCenter=true;} );
    $("#centercursor").bind("mouseup", function(){doCenter=false;} );

    $("#toggleMultiGraphKeyDisplay").bind("mousedown", toggleMultiGraphKeyDisplay );


    $(".timeLineInsert").bind("click", function (e)
    {
        anim.keys.push(new CABLES.ANIM.Key({paper:paper,time:cursorTime,value:anim.getValue(cursorTime)}) );
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

    var oldDoubleClickx=-1;
    var oldDoubleClickTimescale=-1;
    $("#overviewtimeline").bind("dblclick", function(e)
    {
        if(oldDoubleClickTimescale==-1)
        {
            oldDoubleClickTimescale=CABLES.ANIM.TIMESCALE;
            oldDoubleClickx=viewBox.x;
            CABLES.ANIM.TIMESCALE=$('#timeline').width()/(projectLength);
            viewBox.x=0;
            self.redraw();
        }
        else
        {
            CABLES.ANIM.TIMESCALE=oldDoubleClickTimescale;
            viewBox.x=oldDoubleClickx;
            oldDoubleClickx=-1;
            oldDoubleClickTimescale=-1;
            self.redraw();
        }

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

    // function scrollTimeOverview(e)
    // {
    //     isScrollingOverview=true;
    //     var time=e.offsetX/$('#timeline').width();
    //     time=projectLength*time;

    //     gui.scene().timer.setTime(time);
    //     clearTimeout(centerCursorTimeout);
    //     centerCursorTimeout=setTimeout(function()
    //     {
    //         self.centerCursor();
    //     },10);

    // }

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

    $('#overviewtimeline').hover( function(e) { CABLES.UI.showInfo(CABLES.UI.TEXTS.timeline_overview); }, CABLES.UI.hideInfo);
    $('#timetimeline').hover( function(e) { CABLES.UI.showInfo(CABLES.UI.TEXTS.timeline_frames); }, CABLES.UI.hideInfo);
    $('#timeline').hover( function(e) { CABLES.UI.showInfo(CABLES.UI.TEXTS.timeline_keys); }, CABLES.UI.hideInfo);
    
    $('.timelineprogress').hover( function(e) { CABLES.UI.showInfo(CABLES.UI.TEXTS.timeline_progress); }, CABLES.UI.hideInfo);
    $('.timelinetime').hover( function(e) { CABLES.UI.showInfo(CABLES.UI.TEXTS.timeline_time); }, CABLES.UI.hideInfo);
    

    $("#overviewtimeline,#timetimeline,#timelineui").contextmenu(function(e)
    {
        e.stopPropagation();
        e.preventDefault();
        return false;
    });

    $("#overviewtimeline").bind("mousemove", function(e)
    {

        if(e.which>1)
        {
            var time=(e.offsetX/$('#timeline').width())*projectLength;
            
            gui.scene().timer.setTime(time);
            self.updateTime();
            self.centerCursor();
            return;
        }
    });


    $("#timetimeline").bind("mousedown", function(e)
    {

        $(document).bind("mousemove",mousemoveTime);
        $('#timeline').focus();
        e=mouseEvent(e);
        scrollTime(e);
    });

    $("#overviewtimeline").bind("mousedown", function(e)
    {
        e.preventDefault();
        e.stopPropagation();

        if(e.shiftKey)
        {
            var time=(e.offsetX/$('#timeline').width())*projectLength;
            gui.scene().timer.setTime(time);
            self.updateTime();
            self.centerCursor();
            return;
        }

        // else
        // {
        //     // $(document).bind("mousemove",mousemoveOverview);
        //     $('#timeline').focus();
        //     e=mouseEvent(e);
        // }
        // scrollTimeOverview(e);
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

    $("#timeline").bind("mousewheel", function(e)
    {
        var delta = CGL.getWheelSpeed(event);

        if(e.metaKey)
        {
            self.setValueScale(CABLES.ANIM.VALUESCALE+delta/2);
        
            if(CABLES.ANIM.VALUESCALE<1)
            {
                self.setValueScale(1);
            }

            return;
        }


        var oldTime=self.getTimeLeft();
        // CABLES.ANIM.TIMESCALE=$('#timeline').width()/(time-oldStartSeconds);
        CABLES.ANIM.TIMESCALE+=CABLES.ANIM.TIMESCALE*delta*0.01;
        viewBox.x=oldTime*CABLES.ANIM.TIMESCALE;



        self.updateViewBox();
        updateTimeDisplay();
        self.updateOverviewLine();

    });

    $("#timeline").bind("mousemove", function(e)
    {
        if(isScrollingTime)return;
        e=mouseEvent(e);

        if(e.buttons==2 || e.buttons==3 || (e.buttons==1 && spacePressed))
        {
            viewBox.x+=panX-self.getCanvasCoordsMouse(e).x;
            viewBox.y+=panY-self.getCanvasCoordsMouse(e).y;

            var startTime=viewBox.x/CABLES.ANIM.TIMESCALE;

            self.updateViewBox();
            updateTimeDisplay();
            self.updateOverviewLine();

        }

        panX=self.getCanvasCoordsMouse(e).x;
        panY=self.getCanvasCoordsMouse(e).y;

        if(isDragging())return;

        rubberBandMove(e);

        e.preventDefault();
        e.stopPropagation();
    });

    var timeDisplayTexts=[];
    var timeDisplayLines=[];
    function updateTimeDisplay()
    {
        var i=0;
        var step=1;
        var start=(viewBox.x/CABLES.ANIM.TIMESCALE);
        var width=viewBox.w/CABLES.ANIM.TIMESCALE;

        if(width>1.5)step=5;
        if(width>5.5)step=10;
        if(width>13)step=20;
        if(width>20)step=100;
        if(width>30)step=200;
        if(width>60)step=250;
        if(width>100)step=500;
        if(width>200)step=1000;
        if(width>400)step=10000;

        var startFrame=Math.floor( (start*self.getFPS() ) )-5;
        var endFrame=Math.floor( ((start+width)*self.getFPS() ) )+5;

        for(i=0;i<timeDisplayTexts.length;i++)
        {
            timeDisplayTexts[i].hide();
            timeDisplayLines[i].hide();
        }

        var count=0;
        for(i=startFrame;i<endFrame;i++)
        {
            if(i%step===0)
            {
                var frame=i;
                if(frame<0)continue;
                var t,l;
                var textIndex=(i-startFrame);

                if(count>timeDisplayTexts.length-1)
                {
                    t = paperTime.text(10, 0, "");
                    timeDisplayTexts.push(t);
                    l = paper.path("M 0 0 L 0 10");
                    l.node.classList.add("timeline-timesteplines");
                    timeDisplayLines.push(l);
                }

                var txt=i;
                var time=(i/fps)*CABLES.ANIM.TIMESCALE;

                t=timeDisplayTexts[count];
                l=timeDisplayLines[count];
                t.show();
                t.attr({
                    "text":""+txt,
                    "x":time,
                    "y":13,
                    "fill":'#aaa',
                    "font-size": 12 });
                
                l.show();
                l.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });

                count++;

            }
        }

        if(self._loopBegin!=-1)
        {
            var time=self._loopBegin*CABLES.ANIM.TIMESCALE;
            var w=(self._loopEnd-self._loopBegin)*CABLES.ANIM.TIMESCALE;

            self._loopAreaRect.attr({
                "x":time,
                "y":0,
                "width":w,
                "opacity":0.15,
                "height":1000
            });
            self._loopAreaRect.show();
            self._loopAreaRect.toFront();


        }
    }

    this.getTime=function()
    {
        return cursorTime;
    };

    this.setValueScale=function(v)
    {
        CABLES.ANIM.VALUESCALE=v;
        updateKeyLine();
        updateTimeDisplay();
    };

    // this.setTimeScale=function(v)
    // {
    //     cursorLine.hide();

    //     var oldx=viewBox.x;

    //     var offsetLeftTime=this.getTimeFromPaper(viewBox.x);
    //     var oldCursor=(this.getPaperXFromTime(cursorTime)-viewBox.x);

    //     var leftToCursorDiff=this.getPaperXFromTime(cursorTime-offsetLeftTime);

    //     CABLES.ANIM.TIMESCALE=v;

    //     var leftToCursorDiffAfter=this.getPaperXFromTime(cursorTime-offsetLeftTime);
    //     leftToCursorDiff=leftToCursorDiffAfter-leftToCursorDiff;

    //     this.centerCursor();
    //     viewBox.x-=leftToCursorDiff;

    //     updateKeyLine();

    //     self.updateViewBox();
    //     updateTimeDisplay();

    //     $('#timeline').focus();
    //     cursorLine.show();
    //     setCursor(this.getTime());
    // };

    this.getTimeFromMouse=function(e)
    {
        var time=self.getCanvasCoordsMouseTimeDisplay(e).x;
        time/=CABLES.ANIM.TIMESCALE;
        return time;
    };

    this.isCursorVisible=function()
    {
        return (cursorTime> self.getTimeFromPaper(viewBox.x)  && cursorTime < self.getTimeFromPaper(viewBox.w)+self.getTimeFromPaper(viewBox.x));
    };

    this.getPaperXFromTime=function(t)
    {
        return t*CABLES.ANIM.TIMESCALE;
    };

    this.getTimeFromPaper=function(offsetX)
    {
        var time=offsetX;
        time/=CABLES.ANIM.TIMESCALE;
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
        if(!this.hidden)
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

                $('.timelineprogress').html( ''+(Math.round(time/projectLength*100))+'%<br/>'+(projectLength*self.getFPS())+'' );
                
            }
        }

        if(gui.scene().timer.isPlaying()) setTimeout(self.updateTime,30);
    };

    this.updatePlayIcon=function()
    {
        if(!gui.scene().timer.isPlaying())
        {
            $('#timelineplay').removeClass('fa-pause');
            $('#timelineplay').addClass('fa-play');
        }
        else
        {
            $('#timelineplay').removeClass('fa-play');
            $('#timelineplay').addClass('fa-pause');
        }
    };
    
    this.togglePlay=function()
    {
        gui.scene().timer.togglePlay();
        this.updatePlayIcon();
        this.updateTime();
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

            self.updateEasingsSelect();
        }
    }

    this.updateEasingsSelect=function()
    {
        var count=0;
        for(var j in anims)
            for(var i in anims[j].keys)
                if(anims[j].keys[i].selected) count++;

        if(count>0) $('.easingselect').show();
            else $('.easingselect').hide();
    };

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
                        anim.addKey(new CABLES.ANIM.Key(json.keys[i]));
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
                anims[i].forceChangeCallback();
            }
        }

    };

    this.moveSelectedKeys=function(dx,dy,a,b,e)
    {
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);

        // snap to cursor
        // if( Math.abs(e.clientX-gui.timeLine().getTime()*CABLES.ANIM.TIMESCALE) <20 )
        //     newPos.x=gui.timeLine().getTime()*CABLES.ANIM.TIMESCALE;

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
                anims[i].forceChangeCallback();
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

    this.redraw=function()
    {
        lastTime=-1;
        self.updateViewBox();
        self.updateOverviewLine();
        updateTimeDisplay();
        updateKeyLine();
        setCursor(cursorTime);
        self.updateTime();
        this.updatePlayIcon();
    };

    this.setProjectLength=function()
    {
        var l=prompt("project length in frames:",Math.floor(projectLength*gui.timeLine().getFPS()));
        if(l===null)return;
        projectLength=Math.floor((parseFloat(l))/gui.timeLine().getFPS());
        self.redraw();
    };

};
