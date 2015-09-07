            $('#patch svg').bind("mousemove", function (e)
            {
                e=mouseEvent(e);

                if(mouseRubberBandStartPos && e.which!=1)
                {
                    rubberBandHide();
                }

                if(e.which==2 || e.which==3 || (e.which==1 && spacePressed))
                {
                    viewBox.x+=panX-ui.getCanvasCoordsMouse(e).x;//e.offsetX,e.offsetY).x;
                    viewBox.y+=panY-ui.getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;

                    self.updateViewBox();
                }


                panX=ui.getCanvasCoordsMouse(e).x;//e.offsetX,e.offsetY).x;
                panY=ui.getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;
            });
var CABLES=CABLES || {};


CABLES.togglePortValBool=function(which)
{
    var bool_value = $('#'+which).val() == 'true';
    bool_value=!bool_value;
    $('#'+which).val(bool_value);
    $('#'+which).trigger('input');
};


function mouseEvent(event)
{
    if(!event.offsetX) event.offsetX = event.layerX;//(event.pageX - $(event.target).offset().left);
    if(!event.offsetY) event.offsetY = event.layerY;//(event.pageY - $(event.target).offset().top);
    return event;
}



Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('compare', function(left_value, operator, right_value, options) {
    var operators, result;

    if (arguments.length < 4) {
        throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
    }

    operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    };

    if ( ! operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+ operator);
    }

    result = operators[operator](left_value, right_value);

    if (result === true) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});






document.addEventListener("DOMContentLoaded", function(event)
{

    // window.onerror = function(message, url, lineNumber)
    // {
    //     console.error(message);
    //     alert('error: '+JSON.stringify(message)+'\n'+url+'\nline:'+lineNumber);
    //     return true;
    // };

    $(document).bind("contextmenu", function(e)
    {
        // if(e.stopPropagation) e.stopPropagation();
        if(e.preventDefault) e.preventDefault();
        // e.cancelBubble = false;
    });



    var scene=new Scene();
    ui=new CABLES.Ui();
    ui.show(scene);
});

// --------------------------------

var uiConfig=
{
    portSize:10,
    portHeight:7,
    portPadding:2,

    colorBackground:'#333',
    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#888',
    colorOpBg:'#fff',
    colorOpBgSelected:'#ff9',
    colorPort:'#6c9fde',
    colorRubberBand:'#6c9fde',
    colorKey:'#6c9fde',
    colorSelected:'#fff',
    colorPortHover:'#f00',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:800,h:480},{w:0,h:0}]
};

function getPortColor(type)
{
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
    else if(type==OP_PORT_TYPE_OBJECT)  return '#26a92a';
    else return '#c6c6c6';
}

var r;
var selectedEndPort=null;

function setStatusText(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
}


function Line(startX, startY, thisPaper)
{
    var start={ x:startX,y:startY};

    this.updateEnd=function(x, y)
    {
        end.x = x;
        end.y = y;
        this.redraw();
    };

    var end = { x: startX, y: startY };
    this.getPath = function()
    {
        var startX=start.x;
        var startY=start.y;
        var endX=end.x;
        var endY=end.y;

        return "M "+startX+" "+startY+" L" + endX + " " + endY;
    };
    this.thisLine = thisPaper.path(this.getPath());
    this.thisLine.attr({ stroke: uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}

function UiLink(port1, port2)
{
    var self=this;
    this.p1=port1;
    this.p2=port2;
    // todo check if port1 is out / port2 is in...

    var middlePosX=30;
    var middlePosY=30;

    var addCircle=null;

    this.hideAddButton=function()
    {
        if(addCircle)addCircle.remove();
        addCircle=null;
    };

    this.showAddButton=function()
    {
        if(addCircle===null)
        {
            // addCircle = r.rect(middlePosX,middlePosY, uiConfig.portSize, uiConfig.portSize).attr(

            addCircle = r.circle(middlePosX,middlePosY, uiConfig.portSize*0.74).attr(
            {
                fill: getPortColor(self.p1.thePort.getType() ),
                "stroke-width": 0,
                "fill-opacity": 1,
            });

            addCircle.hover(function ()
            {
                setStatusText('left click: insert op / right click: delete link');
            });

            addCircle.drag(function(){},function(){},function(event)
            {
                if(self.p1!==null)
                {
                    if(event.which==3)
                    {
                        self.p1.thePort.removeLinkTo( self.p2.thePort );
                    }
                    else
                    {
                        event=mouseEvent(event);
                        ui.showOpSelect(event.offsetX,event.offsetY,null,null,self);
                    }
                }

            });
        }
        else
        {
            addCircle.attr({
                cx:middlePosX,
                cy:middlePosY
            });
        }
    };

    this.getPath = function()
    {

        if(!port2.attrs)return '';
        if(!port1.attrs)return '';

        var fromX=port1.matrix.e+port1.attrs.x+uiConfig.portSize/2;
        var fromY=port1.matrix.f+port1.attrs.y;
        var toX=port2.matrix.e+port2.attrs.x+uiConfig.portSize/2;
        var toY=port2.matrix.f+port2.attrs.y;

        middlePosX=0.5*(fromX+toX);
        middlePosY=0.5*(fromY+toY);

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;


        if(toY > fromY)
        {
            fromY+=uiConfig.portHeight;
        }
        if(fromY > toY)
        {
            toY+=uiConfig.portHeight;
        }

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;


        // return "M "+fromX+" "+fromY+" L" + cpX + " " + cpY;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
        // return "M "+fromX+" "+fromY+" L" + toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr(
    {
        "stroke": getPortColor(port1.thePort.type),
        "stroke-width": 2
    });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:getPortColor(self.p1.thePort.type)});
    });

    this.remove=function()
    {
        this.thisLine.remove();
    };

    this.redraw = function()
    {
        this.thisLine.attr("path", this.getPath());
        this.showAddButton();
    };
}

function getPortDescription(thePort)
{
    return thePort.getName()+' ('+thePort.val+')'+' ['+thePort.getTypeString()+']';
}

var links=[];
var line;

    Raphael.el.setGroup = function (group) { this.group = group; };
    Raphael.el.getGroup = function () { return this.group; };

    Raphael.fn.OpRect = function (x, y, w, h, text)
    {
        var background = this.rect(0, 0, w, h).attr({
            fill: uiConfig.colorOpBg,
            stroke: "#000",
            "stroke-width":0
        });

        var label = this.text(0+w/2,0+h/2+0, text);
        var layer = this.rect(0, 0, w, h).attr({
            fill: "#000",
            "fill-opacity": 0,
            "stroke-opacity": 0,
            cursor: "move"
        });

        layer.setEnabled=function(sel)
        {
            if(sel)
                    background.attr(
                    {
                        "fill-opacity": 1
                    });
                else
                    background.attr(
                    {
                        "fill-opacity": 0.6
                    });
        };

        layer.setSelected=function(sel)
        {
            if(sel)
                    background.attr(
                    {
                        "fill": uiConfig.colorOpBgSelected,
                    });
                else
                    background.attr(
                    {
                        "stroke": "#000",
                        fill: uiConfig.colorOpBg,
                    });
        };

        layer.setTitle=function(t)
        {
            label.attr({text:t});
        };

        var group = this.set();
        group.push(background, label, layer);
        group.transform('t'+x+','+y);

        layer.setGroup(group);
        layer.bgRect=background;
        return layer;
    };


    var OpUi=function(x,y,w,h,txt)
    {
        var self=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];

        this.remove=function()
        {
            this.oprect.getGroup().remove();
            this.oprect.remove();
        };

        this.removeDeadLinks=function()
        {
            var found=true;

            while(found)
            {
                found=false;
                for(var j in self.links)
                {
                    if(self.links[j].p1===null)
                    {
                        self.links.splice(j,1);
                        found=true;
                    }
                }
            }
        };

        this.showAddButtons=function()
        {
            self.removeDeadLinks();
            for(var j in self.links) self.links[j].showAddButton();
        };

        this.hideAddButtons=function()
        {
            self.removeDeadLinks();
            for(var j in self.links) self.links[j].hideAddButton();
        };

        var startMoveX=-1;
        var startMoveY=-1;
        var olsPosX=0;
        var olsPosY=0;

        var dragger = function()
        {
          this.group = this.getGroup();

          this.previousDx = 0;
          this.previousDy = 0;
        },
        move = function (dx, dy,a,b,e)
        {
            if(e.which==3)return;
            if(e.which==2)return;

            e=mouseEvent(e);

            var pos=ui.getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);

            if(!self.op.uiAttribs)
            {
                self.op.uiAttribs={};
                self.op.uiAttribs.translate={x:pos.x,y:pos.y};
            }

            // dx=ui.getCanvasCoords(dx,dy).x;
            // dy=ui.getCanvasCoords(dx,dy).y;


            // var txGroup = dx-this.previousDx;
            // var tyGroup = dy-this.previousDy;


            if(startMoveX==-1 && self.op.uiAttribs.translate)
            {
                startMoveX=pos.x-self.op.uiAttribs.translate.x;
                startMoveY=pos.y-self.op.uiAttribs.translate.y;
            }

            pos.x=pos.x-startMoveX;
            pos.y=pos.y-startMoveY;

            if(e.shiftKey===true)
            {
                pos.x=parseInt(pos.x/25,10)*25;
                pos.y=parseInt(pos.y/25,10)*25;
            }
        
            this.group.transform('t'+pos.x+','+pos.y);
            // this.group.translate(pos.x,pos.y);
            // this.previousDx = dx;
            // this.previousDy = dy;



            for(var j in self.links)
            {
                self.links[j].redraw();
            }

            self.op.uiAttribs.translate={x:pos.x,y:pos.y};
            self.isDragging=true;

        },
        up = function ()
        {
            startMoveX=-1;
            startMoveY=-1;
            self.isDragging=false;

        };



        var width=w;

        this.oprect=r.OpRect(x,y,w,h, txt).drag(move, dragger, up);

        this.setEnabled=function(en)
        {
            this.op.enabled=en;
            this.oprect.setEnabled(en);
        };

        this.setSelected=function(sel)
        {
            this.oprect.setSelected(sel);
        };


        this.oprect.node.onmousedown = function (ev)
        {

            if(ev.shiftKey)
            {
                ui.addSelectedOp(self);
            }
            else
            {
                self.showAddButtons();
                ui.setSelectedOp(self);
                ui.showOpParams(self.op);
            }

        };
        
        this.oprect.node.onclick = function ()
        {

        };



        var PortDrag = function (x,y,event)
        {
        
            if(!line)
            {
                this.startx=this.matrix.e+this.attrs.x;
                this.starty=this.matrix.f+this.attrs.y;
            }
        },
        PortMove = function(dx, dy,a,b,event)
        {
            if(event.which==3)return;
            if(event.which==2)return;

            if(!line)
            {
                line = new Line(this.startx+uiConfig.portSize/2,this.starty+uiConfig.portHeight, r);
            }
            else
            {
                // line.updateEnd(this.startx+dx,this.starty+dy);
                self.isDragging=true;

                event=mouseEvent(event);

                line.updateEnd(
                    ui.getCanvasCoordsMouse(event).x,//event.offsetX,event.offsetY).x,
                    ui.getCanvasCoordsMouse(event).y//event.offsetX,event.offsetY).y
                    );
            }

            if(selectedEndPort===null) setStatusText('select a port to link...');
            else
            {
                var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
                if(txt=='can link') setStatusText(  getPortDescription(selectedEndPort.thePort));
                    else setStatusText( txt );
            }

            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                line.thisLine.attr({ stroke: uiConfig.colorLink });
            }
            else
            {
                line.thisLine.attr({ stroke: uiConfig.colorLinkInvalid });
            }

        },
        PortUp = function (event)
        {
            if(event.which==3)
            {
                // var otherPort=this.thePort.links[0].portIn;
                // if(otherPort==this.thePort) otherPort=this.thePort.links[0].portOut;

                this.thePort.removeLinks();
                return;
            }

            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                var link=ui.scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                self.links.push(thelink);
            }
            else
            {
                event=mouseEvent(event);
                ui.showOpSelect(event.offsetX,event.offsetY,this.op,this.thePort);
            }

            if(line && line.thisLine)line.thisLine.remove();
            line=null;
            self.isDragging=false;
        };

        this.addPort=function(_inout)
        {
            var yp=0;
            var offY=0;
            var inout=_inout;
            if(inout=='out') yp=21;

            var portIndex=this.portsIn.length;
            if(inout=='out')
            {
                offY=uiConfig.portSize-uiConfig.portHeight;
                portIndex=this.portsOut.length;
            }

            var w=(uiConfig.portSize+uiConfig.portPadding)*portIndex;
            var xpos=0+w;
            var ypos=0+yp;

            if(self.oprect.bgRect.attrs.width<w+uiConfig.portSize)
            {
                self.oprect.bgRect.attr({width:w+uiConfig.portSize});
            }

            var port = r.rect(xpos,offY+ypos, uiConfig.portSize, uiConfig.portHeight).attr({
            // var port = r.circle(x+(uiConfig.portSize+uiConfig.portPadding)*portIndex,y+yp, uiConfig.portSize/2).attr({
                fill: uiConfig.colorPort,
                "stroke-width": 0
            });

            this.oprect.getGroup().push(port);
            port.direction=inout;
            port.op=self.op;
            port.opUi=self;
            port.portIndex=portIndex;

            var thePort;
            if(inout=='out') thePort=self.op.portsOut[portIndex];
            else thePort=self.op.portsIn[portIndex];

            port.thePort=thePort;
            port.attr({fill:getPortColor(thePort.type)});
            

            port.hover(function ()
            {
                selectedEndPort=this;
                port.toFront();
                port.attr(
                {
                    // fill:uiConfig.colorPortHover,
                    x:xpos-uiConfig.portSize*0.25,
                    y:ypos-uiConfig.portSize*0.25,
                    width:uiConfig.portSize*1.5,
                    height:uiConfig.portSize*1.5,
                    // stroke:'#fff',
                    'stroke-width':0,

                });

                var statusText='Port: ';
                
                setStatusText(getPortDescription(thePort));

            }, function ()
            {
                selectedEndPort=null;

                var offY=0;
                if(inout=='out') offY=uiConfig.portSize-uiConfig.portHeight;

                port.attr(
                    {

                        fill:getPortColor(this.thePort.type),
                        width:uiConfig.portSize,
                        height:uiConfig.portHeight,
                        x:xpos,
                        y:ypos+offY,
                        'stroke-width':0,
                    });

                setStatusText('');
            });

            port.drag(PortMove,PortDrag,PortUp);

            $(port.node).bind("contextmenu", function(e)
            {
                console.log('noyesmaybe');
                if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();
                e.cancelBubble = false;
            });

            if(inout=='out') this.portsOut.push(port);
                else this.portsIn.push(port);

            this.oprect.getGroup().transform('t'+x+','+y);

        };

    };







    CABLES.Ui=function()
    {
        var self=this;
        this.ops=[];
        this.scene=null;
        var rendererSize=0;
        var watchPorts=[];
        var currentProject=null;

        var mouseNewOPX=0;
        var mouseNewOPY=0;
        var linkNewOpTo=null;
        var linkNewOpToPort=null;
        var linkNewLink=null;
        var selectedOp=null;
        var spacePressed=false;
        var showTiming=true;



        $('#patch').keyup(function(e)
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
                case 27:

                    if(rendererSize==uiConfig.rendererSizes.length-1)
                    {
                        self.cycleRendererSize();
                    }
                    else
                    if( $('#modalcontent').is(':visible') )
                    {
                        ui.closeModal();
                    }
                    else
                    {
                        ui.showOpSelect(20,20);
                    }
                    
                break;
            }
        });
        $('#patch').keydown(function(e)
        {
            switch(e.which)
            {
                case 32:
                    spacePressed=true;
                break;

                case 46: case 8:
                    if ($("input").is(":focus")) return;

                    if(selectedOps.length>0)
                        for(var i in selectedOps)
                            ui.scene.deleteOp( selectedOps[i].op.id,true);
                        else
                        {
                            if(selectedOp)
                            ui.scene.deleteOp( selectedOp.op.id,true );
                        }
        
                    if(e.stopPropagation) e.stopPropagation();
                    if(e.preventDefault) e.preventDefault();
                break;


                case 68: // disable
                    console.log('disable enable '+selectedOps.length);
                    if(selectedOps.length>0)
                        for(var j in selectedOps)
                            selectedOps[j].setEnabled(!selectedOps[j].op.enabled);
                        else
                            if(selectedOp)selectedOp.setEnabled(!selectedOp.op.enabled);
                         

                break;

            }
        });

        

        this.setLayout=function()
        {
            var statusBarHeight=20;
            var menubarHeight=30;
            var optionsWidth=400;
            var timingHeight=250;
            var timelineUiHeight=40;
            var timedisplayheight=25;

            var rendererWidth=uiConfig.rendererSizes[rendererSize].w;
            var rendererHeight=uiConfig.rendererSizes[rendererSize].h;

            var patchHeight=window.innerHeight-statusBarHeight-menubarHeight;
            if(showTiming)patchHeight-=timingHeight;

            $('#patch svg').css('height',patchHeight);
            $('#patch svg').css('width',window.innerWidth-rendererWidth-2);
            $('#patch svg').css('top',menubarHeight);


            $('#timelineui').css('width',window.innerWidth-rendererWidth-2);

            $('#timing').css('width',window.innerWidth-rendererWidth-2);
            $('#timing').css('bottom',statusBarHeight);
            if(showTiming)
            {
                $('#timing').css('height',timingHeight);

                $('#timetimeline').css('width',window.innerWidth-rendererWidth-2);
                $('#timetimeline').css('height',timingHeight-timedisplayheight);
                $('#timetimeline').css('margin-top',timelineUiHeight);

                $('#timetimeline svg').css('width',window.innerWidth-rendererWidth-2);
                $('#timetimeline svg').css('height',timingHeight-timedisplayheight);


                $('#timeline svg').css('width',window.innerWidth-rendererWidth-2);
                $('#timeline svg').css('height',timingHeight-timedisplayheight);
                $('#timeline svg').css('margin-top',timelineUiHeight+timedisplayheight);
                $('#timeline svg').show();



            }
            else
            {
                $('#timeline svg').hide();
                $('#timing').css('height',timelineUiHeight);
            }

            $('#options').css('left',window.innerWidth-rendererWidth);
            $('#options').css('top',rendererHeight);
            $('#options').css('width',optionsWidth);
            $('#options').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#meta').css('right',0);
            $('#meta').css('top',rendererHeight);
            $('#meta').css('width',rendererWidth-optionsWidth);
            $('#meta').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#menubar').css('top',0);
            $('#menubar').css('width',window.innerWidth-rendererWidth);
            $('#menubar').css('height',menubarHeight);

            if(uiConfig.rendererSizes[rendererSize].w===0)
            {
                $('#glcanvas').attr('width',window.innerWidth);
                $('#glcanvas').attr('height',window.innerHeight);
                $('#glcanvas').css('z-index',9999);
            }
            else
            {
                $('#glcanvas').attr('width',uiConfig.rendererSizes[rendererSize].w);
                $('#glcanvas').attr('height',uiConfig.rendererSizes[rendererSize].h);
            }


        };

        this.getOpList=function()
        {
            var ops=[];

            function getop(val,parentname)
            {
                if (Object.prototype.toString.call(val) === '[object Object]')
                {
                    for (var propertyName in val)
                    {
                        if (val.hasOwnProperty(propertyName))
                        {
                            var html='';
                            var opname='Ops.'+ parentname + propertyName + '';

                            var isOp=false;
                            var isFunction=false;
                            if(eval('typeof('+opname+')')=="function") isFunction=true;

                            if(isFunction)
                            {
                                var op=
                                {
                                    isOp:isOp,
                                    name:opname,
                                    lowercasename:opname.toLowerCase()
                                };
                                ops.push(op);
                            }

                            found=getop(val[propertyName],parentname+propertyName+'.');
                        }
                    }
                }
            }

            getop(Ops,'');

            return ops;
        };


        this.setUpRouting=function()
        {
            var router = new Simrou();

            router.addRoute('/').get(function(event, params)
            {

                if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
                {
                    self.scene.clear();
                    ui.showExample(0);
                }

                self.scene.deSerialize(localStorage.holo);
            });

            router.addRoute('/example/:index').get(function(event, params)
            {
                ui.showExample(params.index);
            });

            router.addRoute('/project/:id').get(function(event, params)
            {

                console.log('load project...');
                CABLES.api.get('project/'+params.id,function(proj)
                {
                    self.setCurrentProject(proj);
                    self.scene.clear();
                    self.scene.deSerialize(proj);
                        console.log('ja!',proj);
                });
            });

            router.start('/');
        };

        this.saveCurrentProject=function()
        {
            CABLES.api.put(
                'project/'+currentProject._id,
                {
                    "data":ui.scene.serialize()
                },
                function(r)
                {
                    if(r.success===true) setStatusText('project saved');
                        else setStatusText('project NOT saved');
                });

        };

        this.setCurrentProject=function(proj)
        {
            console.log('set current project '+proj.name);

            currentProject=proj;
            if(currentProject===null)
            {
                $('#serverproject').hide();
                $('#projectfiles').hide();
            }
            else
            {
                $('#projectfiles').show();
                $('#serverproject').show();
                $('#serverprojectname').html(proj.name);
                self.updateProjectFiles(proj);
                $('.viewProjectLink').attr('href','/view/'+proj._id);
            }
        };

        this.updateProjectFiles=function(proj)
        {
            if(!proj)proj=currentProject;
            $('#projectfiles').html('');

            CABLES.api.get(
                'project/'+currentProject._id+'/files',
                function(files)
                {
                    proj.files=files;
                    var html='';
                    html+=getHandleBarHtml('tmpl_projectfiles_list',proj);
                    html+=getHandleBarHtml('tmpl_projectfiles_upload',proj);

                    $('#projectfiles').html(html);
                            
                });
        };

        this.toggleTiming=function()
        {
            showTiming=!showTiming;
            this.setLayout();
        };

        this.toggleSideBar=function()
        {
            $('#sidebar').animate({width:'toggle'},200);
        };

        this.showOpSelect=function(x,y,linkOp,linkPort,link)
        {
            linkNewLink=link;
            linkNewOpToPort=linkPort;
            linkNewOpToOp=linkOp;
            mouseNewOPX=ui.getCanvasCoords(x,y).x;
            mouseNewOPY=ui.getCanvasCoords(x,y).y;
            var html = getHandleBarHtml('op_select',{ops: self.getOpList() });
            self.showModal(html);

            $('#opsearch').focus();
            $('#opsearch').on('input',function(e)
            {
                var searchFor= $('#opsearch').val();

                if(!searchFor)
                    $('#search_style').html('.searchable:{display:block;}');
                else
                    $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
            });

        };


        var viewBox={x:0,y:0,w:1100,h:1010};
        var panX=-1;
        var panY=-1;

        this.updateViewBox=function()
        {
            if(!isNaN(viewBox.x) && !isNaN(viewBox.y) && !isNaN(viewBox.w) && !isNaN(viewBox.h))
                r.setViewBox(
                    viewBox.x,
                    viewBox.y,
                    viewBox.w,
                    viewBox.h
                    );
        };

        this.updateProjectList=function()
        {
            $('#projectlist').html('...');

            CABLES.api.get('myprojects',function(data)
            {
                $('#projectlist').html(getHandleBarHtml('projects',data));
            });
        };


        // ---------------------------------------------

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
                    ui.setSelectedOp(null);

                    mouseRubberBandStartPos=ui.getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);
                }
                mouseRubberBandPos=ui.getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);

                if(!rubberBandRect) rubberBandRect=r.rect(
                        0,0,10,10).attr({
                    });

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


                for(var i in self.ops)
                {
                    var rect=self.ops[i].oprect.bgRect;
                    var opX=rect.matrix.e;
                    var opY=rect.matrix.f;

                    if(opX>start.x && opX<end.x &&
                        opY>start.y && opY<end.y
                        )
                    {
                        ui.addSelectedOp(self.ops[i]);
                        // this.ops[i].oprect.setSelected(true);
                    }
                    else
                    {
                        // console.log('no');
                        // this.ops[i].oprect.setSelected(false);
                    }
                }

            }
        }

        // ---------------------------------------------

        this.show=function(_scene)
        {
            this.scene=_scene;

            $('#timing').append(getHandleBarHtml('timeline_controler'),{});


            $('#meta').append();

            this.updateProjectList();

            CABLES.api.get('user/me',
                function(data)
                {
                    if(data.user)
                    {
                        $('#loggedout').hide();
                        $('#loggedin').show();
                        $('#username').html(data.user.username);
                    }
                },function(data)
                {
                    $('#loggedout').show();
                    $('#loggedin').hide();
                });


            // var html='<div><h2>Examples</h2>';
            // for(var example in examples)
            // {
                
            //     html+='<a href="#/example/'+example+'">'+examples[example].title+'</a><br/>';

                
            // }
            // html+='</div>';
            // $('#meta').append(html);

            // ----


            r= Raphael("patch",0, 0);
            // r.setAttribute('preserveAspectRatio', 'none');



            // var zpd = new RaphaelZPD(r, { zoom: false, pan: true, drag: false });
            this.bindScene(self.scene);

            window.addEventListener( 'resize', this.setLayout, false );

            this.setUpRouting();


            viewBox={x:0,y:0,w:$('#patch svg').width(),h:$('#patch svg').height()};
            self.updateViewBox();

            $('#patch svg').bind("mousewheel", function (event,delta,nbr)
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

            var background = r.rect(-9990, -9990, 99999, 99999).attr({
                fill: uiConfig.colorBackground,
                "stroke-width":0
            });

            background.toBack();

            background.node.onmousedown = function (ev)
            {
                ui.setSelectedOp(null);
                self.setSelectedOp(false);
                self.showProjectParams();
            };

            $(background.node).on("mousemove", function(e)
            {
                for(var i in self.ops)
                    if(self.ops[i].isDragging)
                        return;

                rubberBandMove(e);
            });


            $('#patch svg').bind("mouseup", function (event)
            {
                        
                rubberBandHide();
            });

        
            $('#patch svg').bind("mousemove", function (e)
            {
                e=mouseEvent(e);

                if(mouseRubberBandStartPos && e.which!=1)
                {
                    rubberBandHide();
                }

                if(e.which==2 || e.which==3 || (e.which==1 && spacePressed))
                {
                    viewBox.x+=panX-ui.getCanvasCoordsMouse(e).x;//.offsetX,e.offsetY).x;
                    viewBox.y+=panY-ui.getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;

                    self.updateViewBox();
                }


                panX=ui.getCanvasCoordsMouse(e).x;//.offsetX,e.offsetY).x;
                panY=ui.getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;
            });

            this.timeLine=new CABLES.TL.UI.TimeLineUI();

            this.setLayout();

        };

        this.showExample=function(which)
        {
            self.scene.clear();
            self.scene.deSerialize(examples[which].src);
        };

        // document.getElementById()node.addEventListener( 'mousewheel', onMouseWheel, false );

        this.bindScene=function(scene)
        {
            scene.onUnLink=function(p1,p2)
            {
                for(var i in self.ops)
                {
                    self.ops[i].removeDeadLinks();

                    for(var j in self.ops[i].links)
                    {
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
                                self.ops[i].links[j].hideAddButton();
                                self.ops[i].links[j].p1=null;
                                self.ops[i].links[j].p2=null;
                                self.ops[i].links[j].remove();
                            }
                    }
                }
            };

            scene.onLink=function(p1,p2)
            {
                var uiPort1=null;
                var uiPort2=null;
                for(var i in self.ops)
                {
                    for(var j in self.ops[i].portsIn)
                    {
                        if(self.ops[i].portsIn[j].thePort==p1) uiPort1=self.ops[i].portsIn[j];
                        if(self.ops[i].portsIn[j].thePort==p2) uiPort2=self.ops[i].portsIn[j];
                        
                    }
                    for(var jo in self.ops[i].portsOut)
                    {
                        if(self.ops[i].portsOut[jo].thePort==p1) uiPort1=self.ops[i].portsOut[jo];
                        if(self.ops[i].portsOut[jo].thePort==p2) uiPort2=self.ops[i].portsOut[jo];
                    }
                }
        
                var thelink=new UiLink(uiPort1,uiPort2);
                uiPort1.opUi.links.push(thelink);
                uiPort2.opUi.links.push(thelink);
            };

            scene.onDelete=function(op)
            {
                for(var i in self.ops)
                {
                    if(self.ops[i].op==op)
                    {
                        self.ops[i].hideAddButtons();
                        self.ops[i].remove();
                        self.ops.splice( i, 1 );
                    }
                }
            };

            scene.onAdd=function(op)
            {
                var uiOp=new OpUi(mouseNewOPX, mouseNewOPY, 100, 31, op.name);
                uiOp.op=op;
                self.ops.push(uiOp);
                
                for(var i in op.portsIn)
                {
                    uiOp.addPort('in');
                }
                for(var i2 in op.portsOut)
                {
                    uiOp.addPort('out');
                }

                if(op.uiAttribs)
                {
                    if(op.uiAttribs.hasOwnProperty('title'))
                    {
                        console.log('settitle '+op.uiAttribs.title);
        
                        ui.setOpTitle(uiOp,op.uiAttribs.title);
                    }
                    if(op.uiAttribs.hasOwnProperty('translate'))
                    {
                        uiOp.oprect.getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
                    }
                }
                else
                {

    // var bnds = r.getBoundingClientRect();
    //         console.log('bnds',bnds);
            
    // var fx = (event.clientX - bnds.left)/bnds.width * rect.attrs.width
    // var fy = (event.clientY - bnds.top)/bnds.height * rect.attrs.height

                    op.uiAttribs={};
                    op.uiAttribs.translate={x:mouseNewOPX,y:mouseNewOPY};

                }

                if(linkNewLink)
                {
                    console.log('add into link...');

                    var op1=linkNewLink.p1.op;
                    var port1=linkNewLink.p1.thePort;
                    var op2=linkNewLink.p2.op;
                    var port2=linkNewLink.p2.thePort;

                    for(var il in port1.links)
                    {
                        if(
                            port1.links[il].portIn==port1 && port1.links[il].portOut==port2 ||
                            port1.links[il].portOut==port1 && port1.links[il].portIn==port2)
                            {
                                port1.links[il].remove();
                            }
                    }

                    var foundPort1=op.findFittingPort(port1);
                    var foundPort2=op.findFittingPort(port2);

                    if(foundPort2 && foundPort1)
                    {
                        ui.scene.link(
                            op,
                            foundPort1.getName(),
                            op1,
                            port1.getName()
                            );

                        ui.scene.link(
                            op,
                            foundPort2.getName(),
                            op2,
                            port2.getName()
                            );
                    }
                }
                else
                if(linkNewOpToPort)
                {
                    var foundPort=op.findFittingPort(linkNewOpToPort);

                    if(foundPort)
                    {
                        var link=ui.scene.link(
                            linkNewOpToOp,
                            linkNewOpToPort.getName(),
                            op,
                            foundPort.getName());
                    }
                }

                linkNewOpToOp=null;
                linkNewLink=null;
                linkNewOpToPort=null;

                mouseNewOPX=0;
                mouseNewOPY=0;
                
                ui.showOpParams(op);
                ui.setSelectedOp(uiOp);
          };
      };

    this.setOpTitle=function(uiop,t)
    {
        uiop.op.uiAttribs.title=t;
        uiop.op.name=t;
        uiop.oprect.setTitle(t);

    };

    this.setSelectedOpTitle=function(t)
    {
        if(selectedOp)
        {
            this.setOpTitle(selectedOp,t);
        }
    };
    

    this.setSelectedOp=function(uiop)
    {
        if(uiop===null)
        {
            for(var i in ui.ops)
            {
                ui.ops[i].setSelected(false);
            }
            selectedOps.length=0;
                    
            return;
        }

        if(selectedOp)
        {
            this.setSelectedOp(null);
            // selectedOp.setSelected(false);
            selectedOp.hideAddButtons();
        }

        selectedOp=uiop;
        if(selectedOp)
        {
            selectedOp.showAddButtons();
            uiop.oprect.setSelected(true);
        }
    };

    
    var selectedOps=[];
    this.addSelectedOp=function(uiop)
    {
        for(var i in selectedOps)
        {
            if(selectedOps[i]==uiop)return;
        }
        selectedOps.push(uiop);
        uiop.oprect.setSelected(true);
    };


    this.cycleRendererSize=function()
    {
        rendererSize++;
        if(rendererSize>uiConfig.rendererSizes.length-1)rendererSize=0;


        self.setLayout();
    };

    this.closeModal=function()
    {
        mouseNewOPX=0;
        mouseNewOPY=0;

        $('#modalcontent').html('');
        $('#modalcontent').hide();
        $('#modalbg').hide();
    };

    this.showModal=function(content)
    {
        $('#modalcontent').html('<div class="modalclose"><a class="button" onclick="ui.closeModal();">close</a></div>');
        $('#modalcontent').append(content);
        $('#modalcontent').show();
        $('#modalbg').show();
    };

    this.importDialog=function()
    {
        var html='';
        html+='import:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        html+='<br/>';
        html+='<br/>';
        html+='<a class="button" onclick="ui.scene.clear();ui.scene.deSerialize($(\'#serialized\').val());ui.closeModal();">import</a>';
        self.showModal(html);
    };

    this.exportDialog=function()
    {
        var html='';
        html+='export:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        self.showModal(html);
        $('#serialized').val(self.scene.serialize());
    };

    this.updateOpParams=function(id)
    {
        self.showOpParams(self.scene.getOpById(id));
    };

    function getHandleBarHtml(name,obj)
    {
        var source   = $("#"+name).html();
        var template = Handlebars.compile(source);
        var context = obj;
        return template(context);
    }

    this.showProjectParams=function(op)
    {
        $('#options').html('...');
    };

    this.showOpParams=function(op)
    {
        watchPorts=[];
        watchAnimPorts=[];

        var html = getHandleBarHtml('params_op_head',{op: op});

        var sourcePort = $("#params_port").html();
        var templatePort = Handlebars.compile(sourcePort);

        html += getHandleBarHtml('params_ports_head',{title:'in'});

        for(var i in op.portsIn)
        {
            op.portsIn[i].watchId='in_'+i;
            watchAnimPorts.push(op.portsIn[i]);

            if(op.portsIn[i].isLinked() || op.portsIn[i].isAnimated())
            {
                watchPorts.push(op.portsIn[i]);

                if(op.portsIn[i].isAnimated())
                {
                }
            }

            html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
        }

        html += getHandleBarHtml('params_ports_head',{title:'out'});

        for(var i2 in op.portsOut)
        {
            if(op.portsOut[i2].getType()==OP_PORT_TYPE_VALUE)
            {
                op.portsOut[i2].watchId='out_'+i2;
                watchPorts.push(op.portsOut[i2]);
            }

            html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false } );
        }

        html += getHandleBarHtml('params_op_foot',{op: op});

        $('#options').html(html);

        for(var ipo in op.portsOut)
        {
            (function (index)
            {
                $('#portdelete_out_'+index).on('click',function(e)
                {
                    op.portsOut[index].removeLinks();
                    self.showOpParams(op);
                });
            })(ipo);
        }

        for(var ipi in op.portsIn)
        {
            (function (index)
            {
                if(op.portsIn[index].isAnimated())
                {
                    $('#portanim_in_'+index).addClass('timingbutton_active');
                }

                $('#portanim_in_'+index).on('click',function(e)
                {
                    $('#portanim_in_'+index).toggleClass('timingbutton_active');

                    op.portsIn[index].toggleAnim();
                    self.timeLine.setAnim(op.portsIn[index].anim);
                    self.showOpParams(op);
                });
            })(ipi);
        }

        for(var ipi in op.portsIn)
        {
            (function (index)
            {
                $('#portdelete_in_'+index).on('click',function(e)
                {
                    op.portsIn[index].removeLinks();
                    self.showOpParams(op);
                });
            })(ipi);
        }

        for(var ipii in op.portsIn)
        {
            (function (index)
            {
                $('#portval_'+index).on('input',function(e)
                {
                    op.portsIn[index].val=''+$('#portval_'+index).val();
                    // self.showOpParams(op);
                });
            })(ipii);
        }

        for(var i in watchAnimPorts)
        {
            var thePort=watchAnimPorts[i];
            (function (thePort)
            {
                var id='.watchPortValue_'+thePort.watchId;

                $(id).on("focusin", function()
                {
                    ui.timeLine.setAnim(thePort.anim);
                });

            })(thePort);
        }
    };

    function doWatchPorts()
    {
        for(var i in watchPorts)
        {
            var id='.watchPortValue_'+watchPorts[i].watchId;
            if(watchPorts[i].isAnimated())
            {
                $(id).val( watchPorts[i].val );
            }
            else
            {
                $(id).html( watchPorts[i].val );
            }
        }

        if(uiConfig.watchValuesInterval>0) setTimeout( doWatchPorts,uiConfig.watchValuesInterval);
    }
    doWatchPorts();


    this.getCanvasCoordsMouse=function(evt)
    {
        var ctm = $('#patch svg')[0].getScreenCTM();

        ctm = ctm.inverse();
        var uupos = $('#patch svg')[0].createSVGPoint();

        uupos.x = evt.clientX;
        uupos.y = evt.clientY;

        uupos = uupos.matrixTransform(ctm);
        
        var res={x:uupos.x,y:uupos.y};
        return res;
    };

    this.getCanvasCoords=function(mx,my)
    {
        if(!$('#patch svg')[0].attributes[6])
        {
            console.log('no viewbox attr!');
            return {x:0,y:0};
        }

        if($('#patch svg')[0].attributes[6].name!='viewBox') console.err('no viewbox attr');
        var vb=$('#patch svg')[0].attributes[6].value.split(' '); // this will break
        // var asp=$('#patch svg')[0].attributes[7].value; // this will break

        var w=$('#patch svg').width();
        var h=$('#patch svg').height();

        var mulx=1;
        var muly=1;

        if(w>h) // FUCK THIS SHIT
        {
            mulx=parseInt(vb[2],10);
            muly=h * parseInt(vb[2],10)/w;
        }
        else
        {
            mulx=w * parseInt(vb[3],10)/h;
            muly=parseInt(vb[3],10);
        }

        var fx = 0;
        var fy = 0;

        console.log('mulx ',mulx);
                
        if(mx!==0) fx = (( mx / w  ) * mulx ) + parseFloat(vb[0],10);
        if(my!==0) fy = (( my / h ) * muly ) + parseFloat(vb[1],10);

        var res={x:fx,y:fy};
        return res;
    };

    this.addAssetOp=function(url,suffix,title)
    {
        var uiAttr={'title':title,translate:{x:viewBox.x+viewBox.w/2,y:viewBox.y+viewBox.h/2}};
        if(suffix=='.obj')
        {
            var op=ui.scene.addOp('Ops.Gl.Meshes.ObjMesh',uiAttr);
            op.getPort('file').val=url;
        }
        else
        if(suffix=='.png' || suffix=='.jpg')
        {
            var op=ui.scene.addOp('Ops.Gl.Texture',uiAttr);
            op.getPort('file').val=url;
        }
        else
        {
            setStatusText('unknown file type');
        }
    };


};



