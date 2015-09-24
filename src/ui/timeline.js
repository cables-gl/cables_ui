
CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;
CABLES.TL.Key.prototype.circleBezierOut=null;
CABLES.TL.Key.prototype.circleBezierIn=null;
CABLES.TL.Key.prototype.selected=false;

CABLES.TL.MoveMode=2;
CABLES.TL.TIMESCALE=100;
CABLES.TL.VALUESCALE=100;

CABLES.TL.Key.prototype.setSelected=function(sel)
{
    this.selected=sel;

    if(sel)
    {
        this.circle.attr({ fill:"white","fill-opacity":0.7 });
    }
    else
    {
        this.circle.attr({ fill:uiConfig.colorKey,"fill-opacity":0.7 });
    }
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



CABLES.TL.Key.prototype.updateCircle=function()
{
    if(!gui.timeLine())return;
    if(!this.circle) this.initUI();
    if(this.getEasing()==CABLES.TL.EASING_BEZIER && !this.circleBezierOut) this.initUI();

    if(isNaN(this.value)) this.value=0;

    var posx=this.time*CABLES.TL.TIMESCALE;
    var posy=this.value*-CABLES.TL.VALUESCALE;

    if(this.getEasing()==CABLES.TL.EASING_BEZIER)
    {
        var posBezX=posx+this.bezTime*CABLES.TL.TIMESCALE;
        var posBezY=posy+this.bezValue*CABLES.TL.VALUESCALE;
        this.circleBezierOut.attr({ cx:posBezX, cy:posBezY  });

        var posBezXIn=posx+this.bezTimeIn*CABLES.TL.TIMESCALE;
        var posBezYIn=posy+this.bezValueIn*CABLES.TL.VALUESCALE;
        this.circleBezierIn.attr({ cx:posBezXIn, cy:posBezYIn  });

        var pathOut="M "+posx+" "+posy+" L "+posBezX+" "+posBezY;
        var pathIn="M "+posx+" "+posy+" L "+posBezXIn+" "+posBezYIn;
                
        this.bezierControlLineOut.attr({ path:pathOut, stroke: "#888", "stroke-width": 1});
        this.bezierControlLineIn.attr({ path:pathIn, stroke: "#888", "stroke-width": 1});
    }

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

    this.circle.attr({ cx:posx, cy:posy,"fill-opacity":0.7  });
    this.circle.toFront();
};

CABLES.TL.Key.prototype.initUI=function()
{
    if(!gui.timeLine())return;
    var self=this;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    this.bezX=this.x+this.bezTime*CABLES.TL.TIMESCALE;
    this.bezY=this.y+this.bezValue*CABLES.TL.VALUESCALE;

    var discattr = {fill: uiConfig.colorKey, stroke: "none"};


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

    this.circle=gui.timeLine().getPaper().circle(this.x, this.y, 10);
    this.circle.attr(discattr);
    this.circle.toFront();

    this.circle.node.onclick = function (e)
    {
        $('#timeline').focus();
        if(!e.shiftKey) gui.timeLine().unselectKeys();
        self.setSelected(true);
    };

    var oldValues={};

    function move(dx,dy,a,b,e)
    {
        $('#timeline').focus();

        if(!self.isDragging)
        {
            oldValues=self.getSerialized();
        }

        self.isDragging=true;
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);
        if(newPos.x<0)newPos.x=0;

        var time=gui.timeLine().getTimeFromPaper(newPos.x);
        var frame=parseInt( (time +0.5*1/gui.timeLine().getFPS() )*gui.timeLine().getFPS(),10);
        time=frame/gui.timeLine().getFPS();

        if(CABLES.TL.MoveMode===0)
        {
            self.set({time:time,value:self.value});
            self.updateCircle();
        }
        if(CABLES.TL.MoveMode==1)
        {
            self.set({value:newPos.y/-CABLES.TL.VALUESCALE,time:self.time});
            self.updateCircle();
        }
        if(CABLES.TL.MoveMode==2)
        {
            self.set({time:time,value:newPos.y/-CABLES.TL.VALUESCALE});
            self.updateCircle();
        }
    }

    function up()
    {

        // var undofunc=function(anim)
        // {
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
        // }(self);

        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }
    this.circle.drag(move,up);

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

CABLES.TL.Anim.prototype.removeUi=function()
{
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
};


CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    
    var tlEmpty=new CABLES.TL.Anim();
    var anim=null;//tlEmpty;//new CABLES.TL.Anim();
    var viewBox={x:-10,y:-170,w:1200,h:400};
    var fps=30;
    var cursorTime=0.0;

    var anims=[];

    var paper= Raphael("timeline", 0,0);
    var paperTime= Raphael("timetimeline", 0,0);
    var isScrollingTime=false;
    var enabled=false;
    var doCenter=false;

    var rubberBandStartPos=null;
    var rubberBandPos=null;
    var mouseRubberBandStartPos=null;
    var mouseRubberBandPos=null;
    var rubberBandRect=null;

    var updateTimer=null;
    var timeDisplayMode=true;

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: uiConfig.colorCursor, "stroke-width": 2});

    var cursorLineDisplay = paperTime.path("M 0 0 L 10 10");
    cursorLineDisplay.attr({stroke: uiConfig.colorCursor, "stroke-width": 2});

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

            for(var i in anims[j].keys)
            {
                if(anims[j].keys[i].circle)
                {
                    // $('#timeline svg circle').hide();
                    anims[j].keys[i].removeUi();
                }
            }
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
        newanim.onChange=null;

        if(!newanim.keyLine)
            newanim.keyLine = paper.path("M 0 0 L 1 1");

        for(i in anims)
            anims[i].keyLine.attr({ stroke: "#aaa", "stroke-width": 1 });

        var newAnims=[];
        newAnims.push(newanim);
        newanim.keyLine.show();

        found=false;
        for(i in anims)
        {
            if(anims[i])
            {
                if(!anims[i].stayInTimeline && anims[i]!=newanim)
                {
                    anims[i].removeUi();
                    anims=anims.slice(i,1);
                    anims[i].keyLine.hide();
                    found=true;
                }
                else
                {
                    newAnims.push(anims[i]);
                    anims[i].keyLine.show();
                }
            }
        }

        anims=newAnims;

        for(i in anims)
        {
            if(anims[i]==newanim)
            {
                return;
            }
        }
        anims.push(newanim);

    };

    this.deleteAnim=function(an)
    {
        an.stayInTimeline=false;
        
        for(var i in anims)
        {
            if(anims[i] && anims[i]==an)
            {
                anims[i].removeUi();
                anims[i].keyLine.hide();
                an.clear();
                anims=anims.slice(i,1);
                return;
            }
        }
        updateKeyLine();

    };

    this.setAnim=function(newanim,config)
    {
        if(newanim && newanim!=tlEmpty)gui.showTiming();

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
        anim.keyLine.attr({ stroke: "#fff", "stroke-width": 2 });

        if(config && config.name) $('#timelineTitle').html(config.name);
            else $('#timelineTitle').html('');


        if(config && config.hasOwnProperty('defaultValue') && anim.keys.length==0)
        {
            anim.keys.push(new CABLES.TL.Key({time:cursorTime,value:config.defaultValue}) );
            this.centerCursor();
        }

        updateKeyLine();

        for(var i in anim.keys)
        {
            if(!anim.keys[i].circle)anim.keys[i].initUI();
            anim.keys[i].updateCircle();
        }

        if(anim.keys.length>1 || anims.length>0)
        {
            self.scaleWidth();
        }

        if(anim.keys.length==1)this.centerCursor();
        self.scaleHeight();

        if(anim.onChange===null) anim.onChange=updateKeyLine;
        
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


    var zeroLine2 = paper.path("M 0 0 L 111000 0");
    zeroLine2.attr({ stroke: "#999", "stroke-width": 1});

    this.updateViewBox=function()
    {
        if(!enabled) removeDots();

        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            $('#timeline').width(),
            viewBox.h,false
        );

        paperTime.setViewBox(
            viewBox.x,
            -200,
            $('#timeline').width(),
            400,false
        );

        viewBox.w=$('#timeline').width();

        paperTime.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        updateKeyLine();
    };

    this.refresh=function()
    {
        updateKeyLine();
    };

    function updateKeyLine()
    {
        for(var anii in anims)
        {
            var str=null;
            var ani=anims[anii];

            if(ani && ani.keys.length===0)
            {
                ani.keyLine.hide();
            }
            else
            if(ani )
            {
                ani.keyLine.show();
                ani.sortKeys();

                var numSteps=300;
                var start=viewBox.x/CABLES.TL.TIMESCALE;
                var width=viewBox.w/CABLES.TL.TIMESCALE*1.2;

                for(var i=0;i<numSteps;i++)
                {
                    var t=start+i*width/numSteps;
                    var v=ani.getValue(t);

                    if(str===null)str+="M ";
                        else str+="L ";

                    str+=t*CABLES.TL.TIMESCALE+" "+v*-CABLES.TL.VALUESCALE;
                }

                for(var i=0;i<ani.keys.length;i++)
                {
                    var nextKey=null;

                    if(ani.keys.length > i+1) nextKey=ani.keys[i+1];
                    
                    // if(str===null) str="M 0 "+(ani.keys[0].value*-CABLES.TL.VALUESCALE)+" ";

                    // str+=ani.keys[i].getPathString(viewBox,nextKey);
                    
                    ani.keys[i].updateCircle();
                    if(ani.keys[i].onChange===null) ani.keys[i].onChange=updateKeyLine;
                }

                // if(anim.keys.length>0) str+="L 9999000 "+(anim.keys[anim.keys.length-1].value*-CABLES.TL.VALUESCALE)+" ";
                ani.keyLine.attr({ path:str });
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
        if(!anim)return;
        var index=anim.getKeyIndex(cursorTime);
        var newIndex=parseInt(index,10)+parseInt(dir,10);

        if(anim.keys.length>newIndex && newIndex>=0)
        {
            var time=anim.keys[newIndex].time;
            gui.scene().timer.setTime(time);
            self.updateTime();

            if(time>this.getTimeRight() || time<this.getTimeLeft()) this.centerCursor();
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
                for(var j in anims) anims[j].deleteSelectedKeys();
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

            case 72: // h
                self.scaleHeight();
                self.scaleWidth();
            break;

            case 75: // k
                self.jumpKey(1);
            break;

            case 65: // a 
                if(e.metaKey || e.ctrlKey) self.selectAllKeys();
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
                var num=1;
                if(e.shiftKey)num=10;
                var newTime=getFrame((self.getTime()+1.0/fps*num)+0.001);
                gui.scene().timer.setTime(newTime/fps);
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
        var maxt=-99999;
        var mint=99999999;

        var count=0;
        for(var anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                count++;
                maxt=Math.max(maxt,anims[anii].keys[i].time);
                mint=Math.min(mint,anims[anii].keys[i].time);
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

        var count=0;
        for(var anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                count++;
                maxv=Math.max(maxv,anims[anii].keys[i].value);
                minv=Math.min(minv,anims[anii].keys[i].value);
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

    this.selectAllKeys=function()
    {
        for(var anii in anims)
            for(var i in anims[anii].keys)
                anims[anii].keys[i].setSelected(true);
        updateKeyLine();
    };

    this.setSelectedKeysEasing=function(e)
    {
        for(var anii in anims)
        {
            anims[anii].defaultEasing=e;
            for(var i in anims[anii].keys)
            {
                anims[anii].removeUi();

                if(anims[anii].keys[i].selected)
                    anims[anii].keys[i].setEasing(e);
            }
        }
        updateKeyLine();
    };


    $("#keymovemode").bind("click", toggleMoveMode);
    $("#keyscaleheight").bind("click", this.scaleHeight);
    $("#keyscalewidth").bind("click", this.scaleWidth);

    // $("#ease_linear").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_LINEAR); } );
    // $("#ease_absolute").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_ABSOLUTE); } );
    // $("#ease_smoothstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHSTEP); } );
    // $("#ease_smootherstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHERSTEP); } );
    // $("#ease_bezier").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_BEZIER); } );


    $("#loop").bind("click", this.toggleLoop);
    $("#centercursor").bind("click", this.centerCursor);
    $("#centercursor").bind("mousedown", function(){doCenter=true;} );
    $("#centercursor").bind("mouseup", function(){doCenter=false;} );

    $(".timeLineInsert").bind("click", function (e)
    {
        anim.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:anim.getValue(cursorTime)}) );
        updateKeyLine();
    });

    $('#timeline').bind("mouseup", function (event)
    {
        rubberBandHide();
        for(var j in anims)
            for(var i in anims[j].keys)
                anims[j].keys[i].isDragging=false;
    });

    $("#timetimeline").bind("mouseup", function(e)
    {
        isScrollingTime=false;
    });

    window.addEventListener('resize', function(event)
    {
        self.updateViewBox();
    });

    $(document).bind("mousemove",function(e)
    {
        if(isScrollingTime)
            scrollTime(e);
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
        $('#timeline').focus();
        e=mouseEvent(e);
        scrollTime(e);
        e.preventDefault();
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

        if(isDragging())return;

        rubberBandMove(e);
    });

    var timeDisplayTexts=[];
    function updateTimeDisplay()
    {
        var step=fps*5;

        step=fps+fps/4;
        if(CABLES.TL.TIMESCALE>30) step=fps/2;
        if(CABLES.TL.TIMESCALE>60) step=fps/3;
        if(CABLES.TL.TIMESCALE>300) step=fps/6;
        if(CABLES.TL.TIMESCALE>500) step=fps/10;
        // if(CABLES.TL.TIMESCALE>1000) step=fps/6;
        if(CABLES.TL.TIMESCALE>1000) step=fps/30;


        for(var i=0;i<100;i++)
        {
            var frame=i*step;
            var t;
            if(i>timeDisplayTexts.length-1)
            {
                t = paperTime.text(10, -80, "");
                timeDisplayTexts.push(t);
            }

            var txt=parseInt(frame,10);
            if(!timeDisplayMode)txt=(''+i*step/fps).substr(0, 4)+"s ";

            t=timeDisplayTexts[i];
            t.attr({
                "text":""+txt,
                "x":i*step/fps*CABLES.TL.TIMESCALE,
                "y":-190,
                "fill":'#aaa',
                "font-size": 12 });
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
        var cursorOffset=this.getTimeFromPaper(viewBox.x);
        // var addOffset=Math.abs(cursorOffset-cursorTime);

        // console.log('cursorOffset',cursorOffset);
        // console.log('addOffset',cursorTime*CABLES.TL.TIMESCALE);

        CABLES.TL.TIMESCALE=v;

        viewBox.x=cursorOffset*CABLES.TL.TIMESCALE;

        // this.centerCursor();
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
            var count=0;

            for(var j in anims)
            {
                for(var i in anims[j].keys)
                {
                    var rect=anims[j].keys[i].circle;
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

            CABLES.UI.setStatusText(count+' keys selected');
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

        CABLES.UI.setStatusText(keys.length+' keys copied...');

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
        
                    CABLES.UI.setStatusText(json.keys.length+' keys pasted...');

                    for(i in json.keys)
                    {
                        json.keys[i].t=json.keys[i].t-minTime+cursorTime;
                        anim.addKey(new CABLES.TL.Key(json.keys[i]));
                    }

                    anim.sortKeys();

                    for(i in anim.keys)
                    {
                        anim.keys[i].updateCircle();
                    }

                    updateKeyLine();
                    return;
                }
            }
            CABLES.UI.setStatusText("paste failed / not cables data format...");
        }
    };

    this.unselectKeys=function()
    {
        anim.unselectKeys();
    };

    this.clear=function()
    {
        for(var i in anims)
        {
            if(anims[i])
            {
                anims[i].removeUi();
                anims[i].keyLine.hide();
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

    

};



