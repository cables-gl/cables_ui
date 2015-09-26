var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};

function getPortOpacity(port)
{
    if(!port)return;
    if(port.direction==PORT_DIR_IN && (port.isAnimated() || port.isLinked() ))return 1.0;
    return 0.6;
}

function getPortDescription(thePort)
{
    var str='<b>'+thePort.getName()+'</b>';
    str+=' ['+thePort.getTypeString()+']';
    if(thePort.isLinked() )str+=' press right mouse button to unlink port';
    return str;
}

CABLES.UI.linkingLine=null;

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
    this.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}



function UiLink(port1, port2)
{
    var self=this;
    this.p1=port1;
    this.p2=port2;

    var middlePosX=30;
    var middlePosY=30;

    var addCircle=null;

    self.hide=function()
    {
        this.thisLine.hide();
    };

    self.show=function()
    {
        this.thisLine.show();
    };

    this.hideAddButton=function()
    {
        if(addCircle)addCircle.remove();
        addCircle=null;

        this.thisLine.attr(
        {
            "stroke-opacity": 1,
            "stroke-width": 1
        });
    };

    this.showAddButton=function()
    {
        this.thisLine.attr(
        {
            "stroke-opacity": 1.0,
            "stroke-width": 2
        });

        if(addCircle===null)
        {
            addCircle = r.circle(middlePosX,middlePosY, CABLES.UI.uiConfig.portSize*0.5).attr(
            {
                "stroke": CABLES.UI.uiConfig.getPortColor(self.p1.thePort ),
                "stroke-width": 2,
                "fill": CABLES.UI.uiConfig.colorBackground,
            });

            addCircle.hover(function (e)
            {
                var txt='left click: insert op / right click: delete link';
                CABLES.UI.showToolTip(event,txt);
                CABLES.UI.setStatusText(txt);
            },function()
            {
                CABLES.UI.hideToolTip();
            });

            addCircle.node.onmousedown = function (event)
            {
                $('#library').hide();
                $('#patch').focus();
        
                if(self.p1!==null)
                {
                    if(event.which==3)
                    {
                        self.p1.thePort.removeLinkTo( self.p2.thePort );
                    }
                    else
                    {
                        event=mouseEvent(event);
                        CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),null,null,self);
                    }
                }
            };
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

        var fromX=port1.matrix.e+port1.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var fromY=port1.matrix.f+port1.attrs.y;
        var toX=port2.matrix.e+port2.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var toY=port2.matrix.f+port2.attrs.y;

        middlePosX=0.5*(fromX+toX);
        middlePosY=0.5*(fromY+toY);

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;

        if(toY > fromY)fromY+=CABLES.UI.uiConfig.portHeight;
        if(fromY > toY) toY+=CABLES.UI.uiConfig.portHeight;

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr( CABLES.UI.uiConfig.linkingLine );
    this.thisLine.attr({ "stroke": CABLES.UI.uiConfig.getPortColor(port1.thePort) });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:CABLES.UI.uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:CABLES.UI.uiConfig.getPortColor(self.p1.thePort)});
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


Raphael.el.setGroup = function (group) { this.group = group; };
Raphael.el.getGroup = function () { return this.group; };

Raphael.fn.OpRect = function (x, y, w, h, text,objName)
{
    var group = this.set();
    var background = this.rect(0, 0, w, h).attr(
        {
            fill: CABLES.UI.uiConfig.colorOpBg,
            stroke: CABLES.UI.uiConfig.colorPatchStroke,
            "stroke-width":0,
            cursor: "move"
        });
    var label = this.text(0+w/2,0+h/2+0, text);

    background.setEnabled=function(sel)
    {
        if(sel) background.attr( { "fill-opacity": 1 });
            else background.attr( { "fill-opacity": 1 });
    };

    background.setSelected=function(sel)
    {
        if(sel) background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected });
            else background.attr( { fill: CABLES.UI.uiConfig.colorOpBg });
    };

    background.setTitle=function(t)
    {
        label.attr({text:t});
    };

    group.push(background, label);
    group.transform('t'+x+','+y);
    background.setGroup(group);

    if(objName=='Ops.Ui.Patch')
    {
        background.attr({
            'stroke-width':4,
            'stroke': CABLES.UI.uiConfig.colorPatchStroke
        });
    }
    $(label.node).css({'pointer-events': 'none'});

    return background;
};

var OpUi=function(op,x,y,w,h,txt)
{
    var self=this;
    this.links=[];
    this.portsIn=[];
    this.portsOut=[];
    var hidden=false;
    this.op=op;
    var selected=false;
    var width=w;

    var oldUiAttribs='';
    var startMoveX=-1;
    var startMoveY=-1;
    var olsPosX=0;
    var olsPosY=0;
    this.isMouseOver=false;

    this.remove=function()
    {
        this.oprect.getGroup().remove();
        this.oprect.remove();
    };

    this.hide=function()
    {
        hidden=true;
        this.oprect.getGroup().hide();
        for(var j in self.links)
        {
            self.links[j].hide();
            self.links[j].hideAddButton();
        }
    };

    this.show=function()
    {
        hidden=false;
        this.oprect.getGroup().show();
        
        for(var j in self.links) self.links[j].show();
    };

    this.isHidden=function()
    {
        return hidden;
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

    this.doMoveFinished=function()
    {
        CABLES.undo.add({
            undo: function()
            {
                try
                {
                    var u=JSON.parse(oldUiAttribs);
                    self.setPos(u.translate.x,u.translate.y);
                }catch(e){}
            },
            redo: function()
            {
            }
        });

        startMoveX=-1;
        startMoveY=-1;
        self.isDragging=false;
    };

    this.setPos=function(x,y)
    {
        self.oprect.getGroup().transform('t'+x+','+y);
        self.op.uiAttribs.translate={x:x,y:y};

        for(var j in self.links)
            self.links[j].redraw();
    };

    this.doMove = function (dx, dy,a,b,e)
    {
        if(e.which==3)return;
        if(e.which==2)return;

        e=mouseEvent(e);

        var pos=gui.patch().getCanvasCoordsMouse(e);

        if(!self.op.uiAttribs)
        {
            self.op.uiAttribs={};
            self.op.uiAttribs.translate={x:pos.x,y:pos.y};
        }

        if(startMoveX==-1 && self.op.uiAttribs.translate)
        {
            oldUiAttribs=JSON.stringify(self.op.uiAttribs);
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

        self.setPos(pos.x,pos.y);
        self.isDragging=true;
    };

    var dragger = function(x,y,ev)
    {
        $('#patch').focus();
        if(selected)return;

        self.showAddButtons();
        if(!ev.shiftKey) gui.patch().setSelectedOp(null);
        gui.patch().setSelectedOp(self);

        //-------

        this.group = this.getGroup();

        this.previousDx = 0;
        this.previousDy = 0;
    };
    var move = function (dx, dy,a,b,e)
    {
        gui.patch().moveSelectedOps(dx,dy,a,b,e);
    };
    var up = function ()
    {
        gui.patch().moveSelectedOpsFinished();
        gui.patch().showOpParams(self.op);
    };

    this.oprect=r.OpRect(x,y,w,h, txt,self.op.objName).drag(move, dragger, up);
    this.oprect.hover(function(e)
    {
        self.isMouseOver=true;
    },function(e)
    {
        self.isMouseOver=false;
    });

    this.oprect.node.ondblclick = function (ev)
    {
        if(self.op.objName=='Ops.Ui.Patch')
            gui.patch().setCurrentSubPatch(self.op.patchId.val);
    };

    this.setEnabled=function(en)
    {
        this.op.enabled=en;
        this.oprect.setEnabled(en);
    };

    this.setSelected=function(sel)
    {
        selected=sel;
        if(sel)self.showAddButtons();
            else self.hideAddButtons();
        self.isDragging=false;
        this.oprect.setSelected(sel);
    };

    this.oprect.node.onmouseup = function (ev)
    {
        self.isDragging=false;
    };

    var PortDrag = function (x,y,event)
    {
        $('#patch').focus();
        if(!CABLES.UI.linkingLine)
        {
            this.startx=this.matrix.e+this.attrs.x;
            this.starty=this.matrix.f+this.attrs.y;
        }
    },
    PortMove = function(dx, dy,a,b,event)
    {
        if(event.which==3)return;
        if(event.which==2)return;

        if(this.thePort.direction==PORT_DIR_IN && (this.thePort.isLinked() || this.thePort.isAnimated()) )  return;

        if(!CABLES.UI.linkingLine)
        {
            CABLES.UI.linkingLine = new Line(this.startx+CABLES.UI.uiConfig.portSize/2,this.starty+CABLES.UI.uiConfig.portHeight, r);
        }
        else
        {
            self.isDragging=true;
            event=mouseEvent(event);

            CABLES.UI.linkingLine.updateEnd(
                gui.patch().getCanvasCoordsMouse(event).x,
                gui.patch().getCanvasCoordsMouse(event).y
                );
        }

        if(selectedEndPort===null) CABLES.UI.setStatusText('select a port to link...');
        else
        {
            var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
            if(txt=='can link') CABLES.UI.setStatusText(  getPortDescription(selectedEndPort.thePort));
                else CABLES.UI.setStatusText( txt );

            if(txt=='can link')txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;
            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(selectedEndPort.thePort));
        }

        if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            CABLES.UI.linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink });
        else
            CABLES.UI.linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLinkInvalid });

    },
    PortUp = function (event)
    {
        if(event.which==3)
        {
            this.thePort.removeLinks();
            return;
        }

        if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
        {
            var link=gui.patch().scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
            if(link)
            {
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                self.links.push(thelink);
            }
        }
        else
        {
            event=mouseEvent(event);
            CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),this.op,this.thePort);
        }

        if(CABLES.UI.linkingLine && CABLES.UI.linkingLine.thisLine)CABLES.UI.linkingLine.thisLine.remove();
        CABLES.UI.linkingLine=null;
        self.isDragging=false;
    };

    this.updatePortAttribs=function(port)
    {
        if(!port)
        {
            var i=0;
            for(i in this.portsOut) this.updatePortAttribs(this.portsOut[i]);
            for(i in this.portsIn) this.updatePortAttribs(this.portsIn[i]);
        }
        else
        {
            port.attr(
            {
                "fill": CABLES.UI.uiConfig.getPortColor(port.thePort),
                "fill-opacity": getPortOpacity(port.thePort),
            });
        }
    };

    this.addPort=function(_inout,thePort)
    {
        var yp=0;
        var offY=0;
        var inout=_inout;
        if(inout==PORT_DIR_OUT) yp=21;

        var portIndex=this.portsIn.length;

        var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*portIndex;
        var xpos=0+w;
        var ypos=0+yp;

        if(inout==PORT_DIR_OUT)
        {
            offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;
            portIndex=this.portsOut.length;
        }

        if(self.oprect.attrs.width<w+CABLES.UI.uiConfig.portSize) self.oprect.attr({width:w+CABLES.UI.uiConfig.portSize});

        var port = r.rect(xpos,offY+ypos, CABLES.UI.uiConfig.portSize, CABLES.UI.uiConfig.portHeight).attr({
            fill: CABLES.UI.uiConfig.colorPort,
            "stroke-width": 0
        });

        this.oprect.getGroup().push(port);
        port.direction=inout;
        port.op=self.op;
        port.opUi=self;
        port.portIndex=portIndex;
        port.thePort=thePort;

        port.hover(function ()
        {
            selectedEndPort=this;
            port.toFront();
            port.attr(
            {
                x:xpos-CABLES.UI.uiConfig.portSize*0.25,
                y:ypos-CABLES.UI.uiConfig.portSize*0.25,
                width:CABLES.UI.uiConfig.portSize*1.5,
                height:CABLES.UI.uiConfig.portSize*1.5,
                'stroke-width':0,
            });

            var txt=getPortDescription(thePort);
            CABLES.UI.setStatusText(txt);
            CABLES.UI.showToolTip(event,txt);

        }, function ()
        {
            CABLES.UI.hideToolTip();
            selectedEndPort=null;

            var offY=0;
            if(inout==PORT_DIR_OUT) offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;

            port.attr(
                {
                    fill:CABLES.UI.uiConfig.getPortColor(port.thePort),
                    "fill-opacity": getPortOpacity(this.thePort ),
                    width:CABLES.UI.uiConfig.portSize,
                    height:CABLES.UI.uiConfig.portHeight,
                    x:xpos,
                    y:ypos+offY,
                    'stroke-width':0,
                });

            CABLES.UI.setStatusText('');
        });

        port.drag(PortMove,PortDrag,PortUp);

        $(port.node).bind("contextmenu", function(e)
        {
            if(e.stopPropagation) e.stopPropagation();
            if(e.preventDefault) e.preventDefault();
            e.cancelBubble = false;
        });

        if(inout==PORT_DIR_OUT) this.portsOut.push(port);
            else this.portsIn.push(port);

    };
};
