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


function Line(startX, startY, paper)
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
    this.thisLine = paper.path(this.getPath());
    this.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}



function UiLink(port1, port2)
{
    var self=this;
    var middlePosX=30;
    var middlePosY=30;
    var addCircle=null;
    this.p1=port1;
    this.p2=port2;

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
        if(!port2.rect.attrs)return '';
        if(!port1.rect.attrs)return '';

        var fromX=port1.rect.matrix.e+port1.rect.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var fromY=port1.rect.matrix.f+port1.rect.attrs.y;
        var toX=port2.rect.matrix.e+port2.rect.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var toY=port2.rect.matrix.f+port2.rect.attrs.y;

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
    var isSelected=true;
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
        if(isSelected==sel)return;
        isSelected=sel;
        
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
        if(sel) self.showAddButtons();
            else self.hideAddButtons();
        self.isDragging=false;
        this.oprect.setSelected(sel);
    };

    this.oprect.node.onmouseup = function (ev)
    {
        self.isDragging=false;
    };


    this.updatePortAttribs=function(port)
    {
        // if(!port)
        // {
        //     var i=0;
        //     for(i in this.portsOut) this.updatePortAttribs(this.portsOut[i]);
        //     for(i in this.portsIn) this.updatePortAttribs(this.portsIn[i]);
        // }
        // else
        // {
        //     port.rect.attr(
        //     {
        //         "fill": CABLES.UI.uiConfig.getPortColor(port.thePort),
        //         "fill-opacity": getPortOpacity(port.thePort),
        //     });
        // }
    };

    this.addPort=function(_inout,thePort)
    {
        var inout=_inout;

        var portIndex=this.portsIn.length;
        if(inout==PORT_DIR_OUT) portIndex=this.portsOut.length;

        var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*portIndex;
        if(self.oprect.attrs.width<w+CABLES.UI.uiConfig.portSize) self.oprect.attr({width:w+CABLES.UI.uiConfig.portSize});

        var port=new CABLES.UI.Port(thePort);

        port.direction=inout;
        port.op=self.op;
        port.opUi=self;
        port.portIndex=portIndex;

        port.addUi();
        this.oprect.getGroup().push(port.rect);



        if(inout==PORT_DIR_OUT) this.portsOut.push(port);
            else this.portsIn.push(port);

    };
};
