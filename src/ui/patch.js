
var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};

function getPortOpacity(port)
{
    if(!port)return;
    if(port.direction==PORT_DIR_IN && (port.isAnimated() || port.isLinked() ))return 1.0;
    return 0.6;
}
function getPortColor(port)
{
    if(!port)return '#ff0000';
    var type=port.getType();
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
    else if(type==OP_PORT_TYPE_OBJECT)  return '#26a92a';
    else if(type==OP_PORT_TYPE_ARRAY)  return '#a02bbd';
    else if(type==OP_PORT_TYPE_DYNAMIC)  return '#666';
    
    else return '#c6c6c6';
}

var r;
var selectedEndPort=null;

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
            addCircle = r.circle(middlePosX,middlePosY, uiConfig.portSize*0.5).attr(
            {
                "stroke": getPortColor(self.p1.thePort ),
                "stroke-width": 2,
                "fill": uiConfig.colorBackground,

            });

            addCircle.hover(function ()
            {
                CABLES.UI.setStatusText('left click: insert op / right click: delete link');
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

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr(
    {
        "stroke": getPortColor(port1.thePort),
        "stroke-opacity": 0.5,
        "stroke-width": 1,
        "stroke-linecap":"round"
    });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:getPortColor(self.p1.thePort)});
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
    var str=thePort.getName();
    str+=' ('+thePort.val+')'+' ['+thePort.getTypeString()+']';
    if(thePort.isLinked() )str+=' press right mouse button to unlink port';
    return str;
}

var links=[];
var line;

    Raphael.el.setGroup = function (group) { this.group = group; };
    Raphael.el.getGroup = function () { return this.group; };

    Raphael.fn.OpRect = function (x, y, w, h, text,objName)
    {
        var background = this.rect(0, 0, w, h).attr({
            fill: uiConfig.colorOpBg,
            stroke: uiConfig.colorPatchStroke,
            "stroke-width":0
        });

        if(objName=='Ops.Ui.Patch')
        {
            background.attr({'stroke-width':4,'stroke': uiConfig.colorPatchStroke});
        }

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


    var OpUi=function(op,x,y,w,h,txt)
    {
        var self=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];
        var hidden=false;
        this.op=op;

        this.isHidden=function()
        {
            return hidden;
        };

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
            for(var j in self.links)
            {
                self.links[j].show();
            }

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

        var oldUiAttribs='';
        var startMoveX=-1;
        var startMoveY=-1;
        var olsPosX=0;
        var olsPosY=0;
        this.isMouseOver=false;

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
            {
                self.links[j].redraw();
            }
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

            self.oprect.getGroup().transform('t'+pos.x+','+pos.y);
            self.op.uiAttribs.translate={x:pos.x,y:pos.y};

            self.isDragging=true;

            for(var j in self.links)
            {
                self.links[j].redraw();
            }
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
        },
        move = function (dx, dy,a,b,e)
        {
            gui.patch().moveSelectedOps(dx,dy,a,b,e);
        },
        up = function ()
        {
            gui.patch().moveSelectedOpsFinished();
            gui.patch().showOpParams(self.op);
        };

        var selected=false;

        var width=w;

        this.oprect=r.OpRect(x,y,w,h, txt,self.op.objName).drag(move, dragger, up);

        this.oprect.node.ondblclick = function (ev)
        {
            if(self.op.objName=='Ops.Ui.Patch')
            {
                gui.patch().setCurrentSubPatch(self.op.patchId.val);
            }
                    
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

        this.oprect.hover(function(e)
        {
            self.isMouseOver=true;
        },function(e)
        {
            self.isMouseOver=false;
        });

        this.oprect.node.onmouseup = function (ev)
        {
            self.isDragging=false;
        };

        var PortDrag = function (x,y,event)
        {
            $('#patch').focus();
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

            if(this.thePort.direction==PORT_DIR_IN && (this.thePort.isLinked() || this.thePort.isAnimated()) )  return;

            if(!line)
            {
                line = new Line(this.startx+uiConfig.portSize/2,this.starty+uiConfig.portHeight, r);
            }
            else
            {
                self.isDragging=true;

                event=mouseEvent(event);

                line.updateEnd(
                    gui.patch().getCanvasCoordsMouse(event).x,//event.offsetX,event.offsetY).x,
                    gui.patch().getCanvasCoordsMouse(event).y//event.offsetX,event.offsetY).y
                    );
            }

            if(selectedEndPort===null) CABLES.UI.setStatusText('select a port to link...');
            else
            {
                var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
                if(txt=='can link') CABLES.UI.setStatusText(  getPortDescription(selectedEndPort.thePort));
                    else CABLES.UI.setStatusText( txt );
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

            if(line && line.thisLine)line.thisLine.remove();
            line=null;
            self.isDragging=false;
        };

        this.updatePortAttribs=function(port)
        {
            if(!port)
            {
                var i=0;
                for(i in this.portsOut)
                {
                    this.updatePortAttribs(this.portsOut[i]);
                }

                for(i in this.portsIn)
                {
                    this.updatePortAttribs(this.portsIn[i]);
                }
            }
            else
            {
                port.attr(
                    {
                        "fill": getPortColor(port.thePort),
                        "fill-opacity": getPortOpacity(port.thePort),
                    });
            }

        };

        // var portRects=[];

        // this.updatePorts=function()
        // {
        //     for(var j in portRects)
        //     {
        //         portRects[j].remove();
        //         portRects[j].unhover();
        //     }

        //     portRects.length=0;
        //     self.portsIn.length=0;
        //     self.portsOut.length=0;

        //     for(var i in op.portsIn)
        //     {
        //         if(!self.op.portsIn[i].uiAttribs || self.op.portsIn[i].uiAttribs.display!='readonly')
        //             self.addPort(PORT_DIR_IN,self.op.portsIn[i]);
        //     }

        //     for(var i2 in op.portsOut)
        //     {
        //         self.addPort(PORT_DIR_OUT,self.op.portsOut[i2]);
        //     }

        // };

        this.addPort=function(_inout,thePort)
        {
            var yp=0;
            var offY=0;
            var inout=_inout;
            if(inout==PORT_DIR_OUT) yp=21;

            var portIndex=this.portsIn.length;
            if(inout==PORT_DIR_OUT)
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

            // portRects.push(port);

            this.oprect.getGroup().push(port);
            port.direction=inout;
            port.op=self.op;
            port.opUi=self;
            port.portIndex=portIndex;

            // if(inout=='out') thePort=self.op.portsOut[portIndex];
            // else thePort=self.op.portsIn[portIndex];

            port.thePort=thePort;
            this.updatePortAttribs();

            port.hover(function ()
            {
                selectedEndPort=this;
                port.toFront();
                port.attr(
                {
                    x:xpos-uiConfig.portSize*0.25,
                    y:ypos-uiConfig.portSize*0.25,
                    width:uiConfig.portSize*1.5,
                    height:uiConfig.portSize*1.5,
                    'stroke-width':0,
                });

                CABLES.UI.setStatusText(getPortDescription(thePort));

            }, function ()
            {
                selectedEndPort=null;

                var offY=0;
                if(inout==PORT_DIR_OUT) offY=uiConfig.portSize-uiConfig.portHeight;

                port.attr(
                    {

                        fill:getPortColor(this.thePort),
                        "fill-opacity": getPortOpacity(this.thePort ),
                        width:uiConfig.portSize,
                        height:uiConfig.portHeight,
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

            // this.oprect.getGroup().transform('t'+x+','+y);
        };
    };


    CABLES.UI.Patch=function(_gui)
    {
        var self=this;
        this.ops=[];
        this.scene=null;
        var gui=_gui;
        
        var watchPorts=[];
        var currentProject=null;
        var currentOp=null;
        var spacePressed=false;
        var selectedOps=[];
        var currentSubPatch=0;

        this.paste=function(e)
        {
            if(e.clipboardData.types.indexOf('text/plain') > -1)
            {
                var str=e.clipboardData.getData('text/plain');

                e.preventDefault();

                var json=JSON.parse(str);
                if(json)
                {
                    if(json.ops)
                    {

                        var i=0;
                        { // change ids

                            for(i in json.ops)
                            {
                                var searchID=json.ops[i].id;
                                var newID=json.ops[i].id=generateUUID();

                                for(var j in json.ops)
                                {
                                    if(json.ops[j].portsIn)
                                    for(var k in json.ops[j].portsIn)
                                    {
                                        if(json.ops[j].portsIn[k].links)
                                        for(var l in json.ops[j].portsIn[k].links)
                                        {
                                            if(json.ops[j].portsIn[k].links[l].objIn==searchID) json.ops[j].portsIn[k].links[l].objIn=newID;
                                            if(json.ops[j].portsIn[k].links[l].objOut==searchID) json.ops[j].portsIn[k].links[l].objOut=newID;
                                        }
                                    }
                                }
                            }
                        }

                        { // set current subpatch

                            for(i in json.ops)
                            {
                                json.ops[i].uiAttribs.subPatch=currentSubPatch;
                            }
                        }

                        { // change position of ops to paste
                            var minx=Number.MAX_VALUE;
                            var miny=Number.MAX_VALUE;

                            for(i in json.ops)
                            {
                                if(json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate)
                                {
                                    minx=Math.min(minx, json.ops[i].uiAttribs.translate.x);
                                    miny=Math.min(miny, json.ops[i].uiAttribs.translate.y);
                                }
                            }

                            for(i in json.ops)
                            {
                                if(json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate)
                                {
                                    json.ops[i].uiAttribs.translate.x=json.ops[i].uiAttribs.translate.x+mouseX-minx;
                                    json.ops[i].uiAttribs.translate.y=json.ops[i].uiAttribs.translate.y+mouseY-miny;
                                }
                            }
                        }

                        CABLES.UI.setStatusText('pasted '+json.ops.length+' ops...');
                        self.setSelectedOp(null);

                        gui.patch().scene.deSerialize(json);

                        return;
                    }
                }
                CABLES.UI.setStatusText("paste failed / not cables data format...");
            }
        };


        this.cut=function(e)
        {
            self.copy(e);
            self.deleteSelectedOps();
        }

        this.copy=function(e)
        {
            var ops=[];
            for(var i in selectedOps)
            {
                ops.push( selectedOps[i].op.getSerialized() );
            }

            var obj={"ops":ops};
            var objStr=JSON.stringify(obj);

            CABLES.UI.setStatusText('copied '+selectedOps.length+' ops...');

            e.clipboardData.setData('text/plain', objStr);
            e.preventDefault();
        };


        $('#patch').keyup(function(e)
        {
            switch(e.which)
            {
                case 32:
                    spacePressed=false;
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

                case 46: case 8: // delete
                    if($("input").is(":focus")) return;

                    self.deleteSelectedOps();
                    if(e.stopPropagation) e.stopPropagation();
                    if(e.preventDefault) e.preventDefault();
                    self.showProjectParams();
                break;

                case 68: // d - disable
                    for(var j in selectedOps)
                        selectedOps[j].setEnabled(!selectedOps[j].op.enabled);
                break;

                case 90: // z undo
                    if(e.metaKey || e.ctrlKey)
                    {
                        if(e.shiftKey) CABLES.undo.redo();
                        else CABLES.undo.undo();
                    }

                break;

                case 65: // a - align
                    if(e.metaKey || e.ctrlKey)
                    {
                        self.selectAllOps();
                    }
                    else
                    {
                        if(e.shiftKey) self.alignSelectedOpsHor();
                        else self.alignSelectedOpsVert();
                    }
                break;


                case 49: // / - test
                
                    self.setCurrentSubPatch(0);
                break;



                default:
                    // console.log('key ',e.which);
                break;

            }
        });
        


        this.saveCurrentProject=function()
        {
            CABLES.UI.MODAL.showLoading('saving project');

            cgl.doScreenshot=true;
        
            setTimeout(function()
            {
                var data=gui.patch().scene.serialize(true);


                data.ui={viewBox:{}};
                data.ui.viewBox.w=viewBox.w;
                data.ui.viewBox.h=viewBox.h;
                data.ui.viewBox.x=viewBox.x;
                data.ui.viewBox.y=viewBox.y;

                data=JSON.stringify(data);

                CABLES.api.put(
                    'project/'+currentProject._id,
                    {
                        "name":currentProject.name,
                        "data":data,
                        "screenshot":cgl.screenShotDataURL
                    },
                    function(r)
                    {
                        if(r.success===true)
                        {
                            CABLES.UI.setStatusText('project saved');
                        }
                        else CABLES.UI.setStatusText('project NOT saved');

                        CABLES.UI.MODAL.hide();
                            
                    });
            },30);


        };


        this.getCurrentProject=function()
        {
            return currentProject;
        };
        this.setCurrentProject=function(proj)
        {

            if(self.timeLine) self.timeLine.clear();

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
                    html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_list',proj);
                    html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_upload',proj);

                    $('#projectfiles').html(html);
                            
                });
        };


        var viewBox={x:0,y:0,w:1100,h:1010};
        var mouseX=-1;
        var mouseY=-1;

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

        this.selectAllOps=function()
        {
            for(var i in self.ops)
            {
                self.addSelectedOp(self.ops[i]);
                self.ops[i].setSelected(true);
            }
        };

        function rubberBandMove(e)
        {
            if(e.which==1 && !spacePressed)
            {
                if(!mouseRubberBandStartPos)
                {
                    gui.patch().setSelectedOp(null);
                    mouseRubberBandStartPos=gui.patch().getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);
                }
                mouseRubberBandPos=gui.patch().getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);

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
                    if(!self.ops[i].isHidden() )
                    {
                        var rect=self.ops[i].oprect.bgRect;
                        var opX=rect.matrix.e;
                        var opY=rect.matrix.f;
                        var opW=rect.attr("width");
                        var opH=rect.attr("height");

                        if(
                            (opX>start.x && opX<end.x && opY>start.y && opY<end.y) ||  // left upper corner
                            (opX+opW>start.x && opX+opW<end.x && opY+opH>start.y && opY+opH<end.y)  // right bottom corner

                            )
                        {
                            self.addSelectedOp(self.ops[i]);
                            self.ops[i].setSelected(true);
                        }
                        else
                        {
                            self.removeSelectedOp(self.ops[i]);
                            self.ops[i].setSelected(false);
                        }
                    }
                }

                if(selectedOps.length==0) CABLES.UI.setStatusText('');
                    else CABLES.UI.setStatusText(selectedOps.length+" ops selected / [del] delete ops / [a] align ops");
            }
        }

        // ---------------------------------------------

        this.setProject=function(proj)
        {
            if(proj.ui)
            {
                if(proj.ui.viewBox)
                {
                    viewBox.x=proj.ui.viewBox.x;
                    viewBox.y=proj.ui.viewBox.y;
                    viewBox.w=proj.ui.viewBox.w;
                    viewBox.h=proj.ui.viewBox.h;
                }
            }
            self.updateViewBox();
            currentSubPatch=0;
            self.setCurrentProject(proj);
            gui.scene().clear();

            gui.scene().deSerialize(proj);
            CABLES.undo.clear();
            CABLES.UI.MODAL.hide();
            self.updateSubPatches();
        };

        this.show=function(_scene)
        {
            this.scene=_scene;

            $('#timing').append(CABLES.UI.getHandleBarHtml('timeline_controler'),{});
            $('#meta').append();


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

            r= Raphael("patch",0, 0);
            this.bindScene(self.scene);

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

            var background = r.rect(-99999, -99999, 2*99999, 2*99999).attr({
                fill: uiConfig.colorBackground,
                "stroke-width":0
            });

            background.toBack();

            background.node.onmousedown = function (ev)
            {
                $('#library').hide();
                $('#patch').focus();

                gui.patch().setSelectedOp(null);
                self.showProjectParams();
            };

            $('#patch').on("mousemove", function(e)
            {
                for(var i in self.ops)
                {
                    if(self.ops[i].isDragging || self.ops[i].isMouseOver)
                        return;
                }

                rubberBandMove(e);
            });

            $('#patch svg').bind("mouseup", function (event)
            {
                rubberBandHide();
            });
        
            $('#patch svg').bind("mousemove", function (e)
            {
                e=mouseEvent(e);

                if(mouseRubberBandStartPos && e.which!=1) rubberBandHide();

                if(e.which==2 || e.which==3 || (e.which==1 && spacePressed))
                {
                    viewBox.x+=mouseX-gui.patch().getCanvasCoordsMouse(e).x;//.offsetX,e.offsetY).x;
                    viewBox.y+=mouseY-gui.patch().getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;

                    self.updateViewBox();
                }

                mouseX=gui.patch().getCanvasCoordsMouse(e).x;//.offsetX,e.offsetY).x;
                mouseY=gui.patch().getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;
            });

            this.timeLine=new CABLES.TL.UI.TimeLineUI();

            gui.setLayout();
        };

        this.showExample=function(which)
        {
            gui.scene().clear();
            gui.scene().deSerialize(examples[which].src);
        };

        this.bindScene=function(scene)
        {
            scene.onUnLink=function(p1,p2)
            {
                console.log('on unlink');

                for(var i in self.ops)
                {
                    self.ops[i].removeDeadLinks();

                    for(var j in self.ops[i].links)
                    {
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
                                var undofunc=function(p1Name,p2Name,op1Id,op2Id)
                                {

                                    CABLES.undo.add({
                                        undo: function()
                                        {
                                            scene.link(scene.getOpById(op1Id), p1Name , scene.getOpById(op2Id), p2Name);
                                        },
                                        redo: function()
                                        {
                                            var op1=scene.getOpById(op1Id);
                                            var op2=scene.getOpById(op2Id);
                                            if(!op1 || !op2){ console.warn('undo: op not found'); return; }
                                            op1.getPortByName(p1Name).removeLinkTo( op2.getPortByName(p2Name) );
                                        }
                                    });
                                }(self.ops[i].links[j].p1.thePort.getName(),
                                    self.ops[i].links[j].p2.thePort.getName(),
                                    self.ops[i].links[j].p1.thePort.parent.id,
                                    self.ops[i].links[j].p2.thePort.parent.id
                                    );

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
                console.log('on link');
                        
                var uiPort1=null;
                var uiPort2=null;
                for(var i in self.ops)
                {
                    for(var j in self.ops[i].portsIn)
                    {
                        if(self.ops[i].portsIn[j].thePort==p1) uiPort1=self.ops[i].portsIn[j];
                        if(self.ops[i].portsIn[j].thePort==p2) uiPort2=self.ops[i].portsIn[j];
                        self.ops[i].updatePortAttribs();
                    }
                    for(var jo in self.ops[i].portsOut)
                    {
                        if(self.ops[i].portsOut[jo].thePort==p1) uiPort1=self.ops[i].portsOut[jo];
                        if(self.ops[i].portsOut[jo].thePort==p2) uiPort2=self.ops[i].portsOut[jo];
                        self.ops[i].updatePortAttribs();
                    }
                }
        
                var thelink=new UiLink(uiPort1,uiPort2);
                uiPort1.opUi.links.push(thelink);
                uiPort2.opUi.links.push(thelink);

                var undofunc=function(p1Name,p2Name,op1Id,op2Id)
                {
                    CABLES.undo.add({
                        undo: function()
                        {
                            var op1=scene.getOpById(op1Id);
                            var op2=scene.getOpById(op2Id);
                            if(!op1 || !op2){ console.warn('undo: op not found'); return; }
                            op1.getPortByName(p1Name).removeLinkTo( op2.getPortByName(p2Name) );
                        },
                        redo: function()
                        {
                            scene.link(scene.getOpById(op1Id), p1Name , scene.getOpById(op2Id), p2Name);
                        }
                    });
                }(p1.getName(),p2.getName(),p1.parent.id,p2.parent.id);
            };

            scene.onDelete=function(op)
            {

                var undofunc=function(opname,opid)
                {
                    CABLES.undo.add({
                        undo: function() {
                            gui.scene().addOp(opname,op.uiAttribs,opid);
                        },
                        redo: function() {
                            gui.scene().deleteOp( opid,false);
                        }
                    });
                }(op.objName,op.id);

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
                $('#patch').focus();
                var uiOp=new OpUi(op,CABLES.UI.OPSELECT.newOpPos.x,CABLES.UI.OPSELECT.newOpPos.y, 100, 31, op.name);
                self.ops.push(uiOp);
                

                console.log('on add');

                var undofunc=function(opid,objName)
                {
                    CABLES.undo.add({
                        undo: function() {
                            gui.scene().deleteOp( opid,true);
                        },
                        redo: function() {
                            gui.scene().addOp(objName,op.uiAttribs,opid);
                        }
                    });

                }(op.id,op.objName);


                op.onAddPort=function(p)
                {
                    console.log('uiOp',uiOp);

                    console.log('yes, a new port was born!',p.getName() ,p.direction,p.type);
                    uiOp.addPort(p.direction,p);

                            

                    // uiOp.updatePorts();

                    uiOp.setPos(op.uiAttribs.translate.x,op.uiAttribs.translate.y);


                };



                for(var i in op.portsIn)
                {
                    if(!op.portsIn[i].uiAttribs || op.portsIn[i].uiAttribs.display!='readonly')
                        uiOp.addPort(PORT_DIR_IN,op.portsIn[i]);
                }

                for(var i2 in op.portsOut)
                {
                    uiOp.addPort(PORT_DIR_OUT,op.portsOut[i2]);
                }

                if(!op.uiAttribs)
                {
                    op.uiAttribs={};
                }

                if(!op.uiAttribs.translate)
                {
                    op.uiAttribs.translate={x:CABLES.UI.OPSELECT.newOpPos.x,y:CABLES.UI.OPSELECT.newOpPos.y};
                }

                if(op.uiAttribs.hasOwnProperty('translate'))
                {
                    uiOp.oprect.getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
                }
                if(op.uiAttribs.hasOwnProperty('title'))
                {
                    gui.patch().setOpTitle(uiOp,op.uiAttribs.title);
                }


                if(!op.uiAttribs.hasOwnProperty('subPatch'))
                {
                    op.uiAttribs.subPatch=currentSubPatch;
                }

                if(CABLES.UI.OPSELECT.linkNewLink)
                {
                    console.log('add into link...');

                    var op1=CABLES.UI.OPSELECT.linkNewLink.p1.op;
                    var port1=CABLES.UI.OPSELECT.linkNewLink.p1.thePort;
                    var op2=CABLES.UI.OPSELECT.linkNewLink.p2.op;
                    var port2=CABLES.UI.OPSELECT.linkNewLink.p2.thePort;

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
                        gui.scene().link(
                            op,
                            foundPort1.getName(),
                            op1,
                            port1.getName()
                            );

                        gui.scene().link(
                            op,
                            foundPort2.getName(),
                            op2,
                            port2.getName()
                            );
                    }
                }
                else
                if(CABLES.UI.OPSELECT.linkNewOpToPort)
                {
                    var foundPort=op.findFittingPort(CABLES.UI.OPSELECT.linkNewOpToPort);

                    if(foundPort)
                    {
                        var link=gui.patch().scene.link(
                            CABLES.UI.OPSELECT.linkNewOpToOp,
                            CABLES.UI.OPSELECT.linkNewOpToPort.getName(),
                            op,
                            foundPort.getName());
                    }
                }



                    uiOp.setPos(op.uiAttribs.translate.x,op.uiAttribs.translate.y);



                CABLES.UI.OPSELECT.linkNewOpToOp=null;
                CABLES.UI.OPSELECT.linkNewLink=null;
                CABLES.UI.OPSELECT.linkNewOpToPort=null;

                CABLES.UI.OPSELECT.newOpPos={x:0,y:0};
                // CABLES.UI.OPSELECT.mouseNewOPX=0;
                // CABLES.UI.OPSELECT.mouseNewOPY=0;

                gui.patch().showOpParams(op);
                gui.patch().setSelectedOp(null);
                gui.patch().setSelectedOp(uiOp);
          };
      };

    this.setOpTitle=function(uiop,t)
    {
        uiop.op.uiAttribs.title=t;
        uiop.op.name=t;
        uiop.oprect.setTitle(t);

    };

    this.setCurrentOpTitle=function(t)
    {
        if(currentOp)
        {
            this.setOpTitle(currentOp,t);
        }
    };




    this.updateSubPatches=function()
    {
        for(var i in self.ops)
        {
            if(!self.ops[i].op.uiAttribs.subPatch)self.ops[i].op.uiAttribs.subPatch=0;

            if(self.ops[i].op.uiAttribs.subPatch==currentSubPatch)
                self.ops[i].show();
            else
            {
                self.ops[i].hide();

            }
        }

    };

    this.getCurrentSubPatch=function()
    {
        return currentSubPatch;
    };

    this.setCurrentSubPatch=function(which)
    {
        if(which===0) $('#button_subPatchBack').hide();
            else $('#button_subPatchBack').show();

        currentSubPatch=which;
        self.updateSubPatches();

        $('#patch').focus();
    };

    this.setSelectedOpsSubPatch=function(which)
    {
        if(selectedOps.length>0)
        {
            for(var j in selectedOps)
            {
                selectedOps[j].op.uiAttribs.subPatch=which;
            }
        }
        self.updateSubPatches();
    };

    this.alignSelectedOpsVert=function()
    {
        if(selectedOps.length>0)
        {
            var j=0;
            var sum=0;
            for(j in selectedOps)
                sum+=selectedOps[j].op.uiAttribs.translate.x;

            var avg=sum/selectedOps.length;

            for(j in selectedOps)
                selectedOps[j].setPos(avg,selectedOps[j].op.uiAttribs.translate.y);
        }
    };

    this.alignSelectedOpsHor=function()
    {
        if(selectedOps.length>0)
        {
            var j=0;
            var sum=0;
            for(j in selectedOps)
                sum+=selectedOps[j].op.uiAttribs.translate.y;

            var avg=sum/selectedOps.length;

            for(j in selectedOps)
                selectedOps[j].setPos(selectedOps[j].op.uiAttribs.translate.x,avg);
        }
    };
    
    this.setSelectedOp=function(uiop)
    {
        if(uiop===null )
        {

            selectedOps.length=0;
            for(var i in gui.patch().ops)
            {
                gui.patch().ops[i].setSelected(false);
                gui.patch().ops[i].hideAddButtons();
            }
            return;
        }

        selectedOps.push(uiop);

        uiop.setSelected(true);
    };
    
    this.deleteSelectedOps=function()
    {
        for(var i in selectedOps)
            gui.patch().scene.deleteOp( selectedOps[i].op.id,true);

    }


    this.removeSelectedOp=function(uiop)
    {
        for(var i in selectedOps)
        {
            if(selectedOps[i]==uiop)
            {
                selectedOps.splice(i,1);
                return;
            }
        }
    };

    this.addSelectedOp=function(uiop)
    {
        uiop.oprect.setSelected(true);
        for(var i in selectedOps)
        {
            if(selectedOps[i]==uiop)return;
        }
        selectedOps.push(uiop);
    };

    this.moveSelectedOpsFinished=function()
    {
        for(var i in selectedOps)
        {
            selectedOps[i].doMoveFinished();
        }
    };

    this.moveSelectedOps=function(dx,dy,a,b,e)
    {
        for(var i in selectedOps)
        {
            selectedOps[i].doMove(dx,dy,a,b,e);
        }
    };

    this.updateOpParams=function(id)
    {
        self.showOpParams(gui.scene().getOpById(id));
    };

    this.showProjectParams=function(op)
    {
        var s={};

        s.name=currentProject.name;
        s.settings=gui.scene().settings;

        var html = CABLES.UI.getHandleBarHtml('params_project',{project: s});
        $('#options').html(html);
    };

    this.saveProjectParams=function()
    {
        var proj_name=$('#projectsettings_name').val();
        var proj_public=$('#projectsettings_public').val();

        currentProject.name=proj_name;
        gui.scene().settings=gui.scene().settings || {};
        gui.scene().settings.isPublic=proj_public;
    };

    this.showOpParams=function(op)
    {
        { // show first anim in timeline
            if(self.timeLine)
            {
                var foundAnim=false;
                for(var i in op.portsIn)
                {
                    if(op.portsIn[i].isAnimated())
                    {
                        self.timeLine.setAnim(op.portsIn[i].anim,{name:op.portsIn[i].name});
                        foundAnim=true;
                        continue;
                    }
                }
                if(!foundAnim) self.timeLine.setAnim(null);
            }
        }

        for(var i in this.ops)
        {
            if(this.ops[i].op==op)
            {
                currentOp=this.ops[i];
            }
        }

        watchPorts=[];
        watchAnimPorts=[];
        watchColorPicker=[];

        var html = CABLES.UI.getHandleBarHtml('params_op_head',{op: op});

        var sourcePort = $("#params_port").html();
        var templatePort = Handlebars.compile(sourcePort);

        html += CABLES.UI.getHandleBarHtml('params_ports_head',{title:'in'});

        for(var i in op.portsIn)
        {
            op.portsIn[i].watchId='in_'+i;
            watchAnimPorts.push(op.portsIn[i]);

            if(op.portsIn[i].uiAttribs.colorPick)
            {
                watchColorPicker.push(op.portsIn[i]);
            }

            if(op.portsIn[i].isLinked() || op.portsIn[i].isAnimated())
            {
                watchPorts.push(op.portsIn[i]);
            }

            html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
        }

        html += CABLES.UI.getHandleBarHtml('params_ports_head',{title:'out'});

        for(var i2 in op.portsOut)
        {
            if(op.portsOut[i2].getType()==OP_PORT_TYPE_VALUE)
            {
                op.portsOut[i2].watchId='out_'+i2;
                watchPorts.push(op.portsOut[i2]);
            }

            html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false } );
        }

        html += CABLES.UI.getHandleBarHtml('params_op_foot',{op: op});

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
                    $('#portanim_in_'+index).addClass('timingbutton_active');

                if(op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline)
                    $('#portgraph_in_'+index).addClass('timingbutton_active');

                $('#portgraph_in_'+index).on('click',function(e)
                {
                    if(op.portsIn[index].isAnimated())
                    {
                        op.portsIn[index].anim.stayInTimeline=!op.portsIn[index].anim.stayInTimeline;
                        $('#portgraph_in_'+index).toggleClass('timingbutton_active');
                        self.timeLine.setAnim(op.portsIn[index].anim,{name:op.portsIn[index].name,defaultValue:parseFloat( $('#portval_'+index).val())} );
                    }

                });

                $('#portanim_in_'+index).on('click',function(e)
                {
                    $('#portanim_in_'+index).toggleClass('timingbutton_active');

                    op.portsIn[index].toggleAnim();

                    self.timeLine.setAnim(op.portsIn[index].anim,{name:op.portsIn[index].name,defaultValue:parseFloat( $('#portval_'+index).val())} );

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
                    var v=''+$('#portval_'+index).val();

                    if( op.portsIn[index].uiAttribs)
                    {
                        if(op.portsIn[index].uiAttribs.hasOwnProperty('display'))
                        {
                            if(op.portsIn[index].uiAttribs.display=='bool')
                            {
                                if(v=='true')v=true;
                                else v=false;
                            }
                        }
                   }
                            
                    op.portsIn[index].val=v;
                    // self.showOpParams(op);
                    if(op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();
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
                    gui.timeLine().setAnim(thePort.anim,{name:thePort.name});
                });

            })(thePort);
        }

        for(var i in watchColorPicker)
        {
            var thePort=watchColorPicker[i];
            (function (thePort)
            {
                var id='#watchcolorpick_'+thePort.watchId;
                var c1=Math.round(255*$(id).parent().next('td').find('input.value').val());
                var c2=Math.round(255*$(id).parent().parent().next('tr').find('input.value').val());
                var c3=Math.round(255*$(id).parent().parent().next('tr').next('tr').find('input.value').val());

                $(id).css('background-color','rgb('+c1+','+c2+','+c3+')');

                $(id).colorPicker(
                {
                    opacity:true,
                    margin: '4px -2px 0',
                    doRender: 'div div',
                    renderCallback:function(res)
                    {
                        var colors = this.color.colors;

                        $(id).parent().next('td').find('input.value').val(colors.rgb.r).trigger('input');
                        $(id).parent().parent().next('tr').find('input.value').val(colors.rgb.g).trigger('input');
                        $(id).parent().parent().next('tr').next('tr').find('input.value').val(colors.rgb.b).trigger('input');

                        $(id).parent().next('td').find('input.range').val(colors.rgb.r).trigger('input');
                        $(id).parent().parent().next('tr').find('input.range').val(colors.rgb.g).trigger('input');
                        $(id).parent().parent().next('tr').next('tr').find('input.range').val(colors.rgb.b).trigger('input');

                        modes = {
                            r: Math.round(colors.rgb.r*255), g: Math.round(colors.rgb.g*255), b: Math.round(colors.rgb.b*255),
                            h: colors.hsv.h, s: colors.hsv.s, v: colors.hsv.v,
                            HEX: this.color.colors.HEX
                        };

                        $('input', '.cp-panel').each(function() {
                            this.value = modes[this.className.substr(3)];
                        });
                    },
                    buildCallback: function($elm)
                    {
                        var colorInstance = this.color,
                            colorPicker = this;

                        $elm.prepend('<div class="cp-panel">' +
                            'R <input type="text" class="cp-r" /><br>' +
                            'G <input type="text" class="cp-g" /><br>' +
                            'B <input type="text" class="cp-b" /><hr>' +
                            'H <input type="text" class="cp-h" /><br>' +
                            'S <input type="text" class="cp-s" /><br>' +
                            'B <input type="text" class="cp-v" /><hr>' +
                            '<input type="text" class="cp-HEX" />' +
                        '</div>').on('change', 'input', function(e) {
                            var value = this.value,
                                className = this.className,
                                type = className.split('-')[1],
                                color = {};

                            color[type] = value;
                            colorInstance.setColor(type === 'HEX' ? value : color,
                                type === 'HEX' ? 'HEX' : /(?:r|g|b)/.test(type) ? 'rgb' : 'hsv');
                            colorPicker.render();
                            this.blur();
                        });
                    }
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
                if( $(id).val() !=watchPorts[i].val )
                    $(id).val( watchPorts[i].val );
            }
            else
            {
                $(id).html( watchPorts[i].val );
            }
        }

        if(uiConfig.watchValuesInterval>0) setTimeout( doWatchPorts,uiConfig.watchValuesInterval);
    }

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

    this.addAssetOp=function(url,suffix,title)
    {
        var uiAttr={'title':title,translate:{x:viewBox.x+viewBox.w/2,y:viewBox.y+viewBox.h/2}};
        if(suffix=='.obj')
        {
            var op=gui.scene().addOp('Ops.Gl.Meshes.ObjMesh',uiAttr);
            op.getPort('file').val=url;
        }
        else
        if(suffix=='.png' || suffix=='.jpg')
        {
            var op=gui.scene().addOp('Ops.Gl.Texture',uiAttr);
            op.getPort('file').val=url;
        }
        else
        if(suffix=='.mp3' || suffix=='.ogg')
        {
            var op=gui.scene().addOp('Ops.WebAudio.AudioPlayer',uiAttr);
            op.getPort('file').val=url;
        }
        else
        {
            CABLES.UI.setStatusText('unknown file type');
        }
    };

    doWatchPorts();

};

