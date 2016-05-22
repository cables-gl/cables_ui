var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};
CABLES.UI.LINKHOVER=null;

CABLES.UI.cleanRaphael=function(el)
{
    el.node.removeAttribute('font-family');
    el.node.removeAttribute('font-size');
    el.node.removeAttribute('stroke-width');
    el.node.removeAttribute('stroke');
    el.node.removeAttribute('fill');
    el.node.removeAttribute('fill-opacity');
    el.node.removeAttribute('stroke-opacity');
};

// function getPortOpacity(port)
// {
//     if(!port)return;
//     if(port.direction==PORT_DIR_IN && (port.isAnimated()))return 0.25;
//     return 0.5;
// }

function getPortDescription(thePort)
{
    var str='<b>'+thePort.getName()+'</b> (' + thePort.getTypeString() + ')';

    var strInfo='';
    if(thePort.direction==PORT_DIR_IN)strInfo+=CABLES.UI.TEXTS.portDirIn;
    if(thePort.direction==PORT_DIR_OUT)strInfo+=CABLES.UI.TEXTS.portDirOut;
    if(thePort.isLinked() )strInfo+=CABLES.UI.TEXTS.portMouseUnlink;
    else strInfo+=CABLES.UI.TEXTS.portMouseCreate;
    CABLES.UI.showInfo(strInfo);

    return str;
}

function Line(startX, startY)
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
    this.thisLine = gui.patch().getPaper().path(this.getPath());
    this.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}

function UiLink(port1, port2)
{
    var self=this;
    var middlePosX=30;
    var middlePosY=30;
    var addCircle=null;

    this.linkLine=null;
    this.p1=port1;
    this.p2=port2;

    this.hideAddButton=function()
    {
        if(addCircle)addCircle.remove();
        addCircle=null;

        if(this.linkLine)
            this.linkLine.attr(
            {
                "stroke-opacity": 1, //0.4,
                "stroke-width": 0.7
            });
    };

    this.showAddButton=function()
    {
        if(!this.isVisible())return;

        this.linkLine.attr(
        {
            "stroke-opacity": 1, //0.6,
            "stroke-width": 1.5
        });

        if(addCircle===null)
        {
            if(self.p1)
            addCircle = gui.patch().getPaper().circle(middlePosX,middlePosY, CABLES.UI.uiConfig.portSize*0.5);

            if(!addCircle)
            {
                this.hide();
                return;
            }

            addCircle.node.classList.add(CABLES.UI.uiConfig.getLinkClass(self.p1.thePort ));
            addCircle.node.classList.add('addCircle');

            addCircle.hover(function (e)
            {
                CABLES.UI.LINKHOVER=self;
                addCircle.node.classList.add('active');

                CABLES.UI.showInfo(CABLES.UI.TEXTS.linkAddCircle);
            },function()
            {
                CABLES.UI.LINKHOVER=null;
                addCircle.node.classList.remove('active');

                CABLES.UI.hideInfo();
            });
            addCircle.toFront();

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
                        var coords=gui.patch().getCanvasCoordsMouse(event);
                        coords.x=self.p1.op.uiAttribs.translate.x;
                        CABLES.UI.OPSELECT.showOpSelect(coords,null,null,self);
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
            addCircle.toFront();

        }
    };



    this.getPath = function()
    {
        if(!port2.rect)return '';
        if(!port1.rect)return '';

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

        var str="M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
        // console.log(str);
        return str;
    };


    this.isVisible=function()
    {
        return self.linkLine!==null;
    };

    self.hide=function()
    {
        if(!this.isVisible())return;
        this.linkLine.remove();
        this.linkLine=null;
    };

    self.show=function()
    {
        if(this.isVisible())return;
        this.redraw();
    };

    this.remove=function()
    {
        self.hide();
        port1.updateUI();
        port2.updateUI();

    };


    this.redraw = function()
    {
        if(!this.linkLine)
        {
            this.linkLine = gui.patch().getPaper().path(this.getPath());

            // this.linkLine = gui.patch().getPaper().path(this.getPath());
            this.linkLine.attr( CABLES.UI.uiConfig.linkingLine );
            // this.linkLine.attr({ "stroke": CABLES.UI.uiConfig.getPortColor(port1.thePort) });
            this.linkLine.node.classList.add(CABLES.UI.uiConfig.getLinkClass(port1.thePort));



            // this.linkLine.hover(function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.colorLinkHover});
            // }, function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.getPortColor(self.p1.thePort)});
            // });

            // this.linkLine.attr("path", this.getPathStraight());
            // this.linkLine.animate({"path":this.getPath()},80);
        }
        this.linkLine.attr({"path": this.getPath()});

        this.linkLine.toFront();
        this.showAddButton();
    };

    this.setEnabled=function(enabled)
    {
        if(this.linkLine)
            // if(enabled) this.linkLine.attr("opacity", 1.0);
            //     else this.linkLine.attr("opacity", 0.3);
            this.linkLine.attr("opacity", 1.0);
    };

    port1.updateUI();
    port2.updateUI();
}








Raphael.el.setGroup = function (group) { this.group = group; };
Raphael.el.getGroup = function () { return this.group; };

var OpRect = function (_opui,_x, _y, _w, _h, _text,objName)
{
    var isSelected=true;
    var group = Raphael.fn.set();
    var background = null;
    var miniRect = null;
    var resizeHandle = null;
    var label=null;
    var w=_w;
    var h=_h;
    var x=_x;
    var y=_y;
    var opui=_opui;
    var title=_text;
    var shownTitle=_text;
    var backgroundResize=null;
    var backgroundComment=null;

    this.getRect=function()
    {
        return background;
    };

    this.isVisible=function()
    {
        return label!==null;
    };

    this.setPosition=function(posx,posy)
    {
        if(this.getGroup())
        {
            this.getGroup().transform('t'+posx+','+posy);
        }

        if(miniRect) miniRect.attr({x:posx,y:posy});
    };

    this.deleteUi=function()
    {
        group.clear();

        if(background)background.remove();
        if(label)label.remove();
        if(backgroundComment)backgroundComment.remove();
        if(backgroundResize)backgroundResize.remove();
        if(resizeHandle)resizeHandle.remove();
        if(miniRect)miniRect.remove();
        label=background=backgroundComment=backgroundResize=null;
    };

    this.removeUi=function()
    {
        if(!this.isVisible())return;
        this.deleteUi();
    };

    this.getWidth=function()
    {
        return w;
    };

    this.setWidth=function(_w)
    {
        w=_w;
        if(this.isVisible())
        {
            background.attr({width:w});

            if(miniRect)miniRect.attr({
                width:w,
                height:10,
            });
        }

    };

    function hover()
    {
        opui.isMouseOver=true;
    }

    function unhover()
    {
        opui.isMouseOver=false;
    }


    var shakeCountP=0;
    var shakeCountN=0;
    var shakeLastX=-1;
    var shakeTimeOut=0;
    var lastShakeDir=false;

    var dragger = function(x,y,ev)
    {
        shakeCount=0;
        shakeCountP=0;
        shakeCountN=0;
        $('#patch').focus();

        if(ev.buttos==2)
        {
            //show context menu...
            return;
        }


        if(opui.isSelected())
        {
            if(ev.shiftKey)
            {
                gui.patch().removeSelectedOp(opui);
                opui.setSelected(false);
            }
            return;
        }

        opui.showAddButtons();

        if(!ev.shiftKey)
        {
            gui.patch().setSelectedOp(null);
            gui.patch().setSelectedOp(opui);
        }
        else
        {
            gui.patch().addSelectedOp(opui);
            opui.setSelected(true);
        }

    };

    var move = function (dx, dy,a,b,e)
    {
        if(shakeLastX!=-1)
        {
            if(shakeLastX-a>30 && lastShakeDir)
            {
                lastShakeDir=false;
                shakeCountP++;
                clearTimeout(shakeTimeOut);
                shakeTimeOut=setTimeout(function(){ console.log('reset');shakeCountP=0; shakeCountN=0; },250);
            }
            else
            if(shakeLastX-a<30 && !lastShakeDir)
            {
                lastShakeDir=true;
                shakeCountN++;
                clearTimeout(shakeTimeOut);
                shakeTimeOut=setTimeout(function(){ console.log('reset');shakeCountP=0; shakeCountN=0; },250);
            }
            if(shakeCountP + shakeCountN>=5)
            {
                opui.op.unLinkShake();
                shakeCount=0;
                shakeLastX=-1;
            }
            shakeLastX=-1;
        }
        shakeLastX=a;

        gui.patch().moveSelectedOps(dx,dy,a,b,e);
        gui.patch().updateBounds=true;
        gui.setStateUnsaved();
    };

    var up = function ()
    {
        shakeCount=0;
        shakeCountP=0;
        shakeCountN=0;

        lastX=-1;

        if(CABLES.UI.LINKHOVER)
        {
            var oldLink=CABLES.UI.LINKHOVER;
            if(oldLink.p1 && oldLink.p2)
            {
                var portIn=oldLink.p1;
                var portOut=oldLink.p2;

                if(oldLink.p2.thePort.direction==PORT_DIR_IN)
                {
                    portIn=oldLink.p2;
                    portOut=oldLink.p1;
                }

                portIn.thePort.removeLinks();

                if(CABLES.Link.canLink(opui.op.portsIn[0],portOut.thePort))
                {
                    gui.patch().scene.link(
                        opui.op,
                        opui.op.portsIn[0].getName() , portOut.thePort.parent, portOut.thePort.getName());

                    gui.patch().scene.link(
                        opui.op,
                        opui.op.portsOut[0].getName() , portIn.thePort.parent, portIn.thePort.getName());

                    opui.setPos(portOut.thePort.parent.uiAttribs.translate.x,opui.op.uiAttribs.translate.y);
                }
                else
                {
                    gui.patch().scene.link(
                        portIn.thePort.parent, portIn.thePort.getName(),
                        portOut.thePort.parent, portOut.thePort.getName());
                }
            }
        }

        gui.patch().moveSelectedOpsFinished();
        gui.patch().showOpParams(opui.op);
        CABLES.UI.LINKHOVER=null;
    };

    // this.getBgColor=function()
    // {
    //     var fill=CABLES.UI.uiConfig.colorOpBg;
    //     // if( objName.startsWith('Ops.Gl') ) fill='#ccffcc';
    //     // else if( objName.startsWith('Ops.WebAudio') ) fill='#bbeeff';
    //     return fill;
    // };

    this.addUi=function()
    {
        if(this.isVisible())return;

        miniRect=gui.patch().getPaperMap().rect(x,y, w, h);
        miniRect.attr({
            "width":w,
            "height":32,
            "fill-opacity":1
        });

        miniRect.node.classList.add(CABLES.UI.uiConfig.getOpMiniRectClassName(opui.op.objName));
        CABLES.UI.cleanRaphael(miniRect);


        background=gui.patch().getPaper().rect(0, 0, w, h);
        CABLES.UI.cleanRaphael(background);
        background.node.classList.add('op_background');


        resizeHandle=gui.patch().getPaper().rect(w-CABLES.UI.uiConfig.resizeBarWidth, 0, CABLES.UI.uiConfig.resizeBarWidth, h);
        CABLES.UI.cleanRaphael(resizeHandle);
        resizeHandle.node.classList.add(CABLES.UI.uiConfig.getOpHandleClassName(opui.op.objName));
        resizeHandle.node.classList.add('op_handle');


        label = gui.patch().getPaper().text(0+w/2,0+h/2+0, title);
        CABLES.UI.cleanRaphael(label);

        this.setTitle(title);

        $(label.node).css({'pointer-events': 'none'});

        background.drag(move, dragger, up);
        background.hover(hover,unhover);

        background.node.ondblclick = function (ev)
        {
            gui.patch().setSelectedOp(null);
            if(opui.op.objName=='Ops.Ui.Patch')
                gui.patch().setCurrentSubPatch(opui.op.patchId.val);
        };

        background.onmouseup = function (ev)
        {
            opui.isDragging=false;
        };

        if(objName=='Ops.Ui.Patch')
        {
            background.attr({
                'stroke-width':4,
                'stroke': CABLES.UI.uiConfig.colorPatchStroke
            });
        }

        if(objName!='Ops.Ui.Comment')
        {
            // var oldPosX = 0;
            // var resizeStart = function(dx, dy,a,b,e)
            // {
            //     oldPosX=resizeHandle.attrs.x;
            //     opui.isDragging=true;
            // };
            //
            // var resizeEnd = function(dx, dy,a,b,e)
            // {
            //     oldPosX=-1;
            //     opui.isDragging=false;
            // };
            //
            // var resizeMove = function(dx, dy,a,b,e)
            // {
            //     if(oldPosX<0)return;
            //
            //     var width=oldPosX+dx-background.attrs.x;
            //     if(width<50)width=50;
            //
            //     resizeHandle.attr({
            //         "x":oldPosX+dx
            //     });
            //     background.attr({
            //         "width":width
            //     });
            //     label.attr({
            //         "x":width/2
            //     });
            // };
            //
            // resizeHandle.drag(resizeMove, resizeStart,resizeEnd);

        }
        else
        {
            var sw=150;
            var sh=100;
            var resizeSize=20;

            if(opui.op.uiAttribs.size)
            {
                sw=opui.op.uiAttribs.size[0];
                sh=opui.op.uiAttribs.size[1];
            }

            label.attr({
                'x':sw/2,
                'y':45
            });

            background.attr({
                'width':sw,
                'height':resizeSize,
                'opacity':0.2,
                "fill": '#000',
            });

            backgroundComment=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            {
                "x":0,
                "y":0,
                'width':sw,
                'height':sh,
                "fill": '#000',
                "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                "stroke-width":0,
                'opacity':0.3,
            });
            CABLES.UI.cleanRaphael(backgroundComment);

            backgroundResize=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            {
                "x":sw-resizeSize,
                "y":sh-resizeSize,
                "fill": '#000',
                "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                "stroke-width":0,
                'opacity':0.2,
                "cursor": "se-resize"
            });
            CABLES.UI.cleanRaphael(backgroundResize);

            var oldPosX,oldPosY;
            var resizeCommentStart = function(dx, dy,a,b,e)
            {
                oldPosX=backgroundResize.attrs.x;
                oldPosY=backgroundResize.attrs.y;
                opui.isDragging=true;
            };

            var resizeCommentEnd = function(dx, dy,a,b,e)
            {
                oldPosX=-1;
                oldPosY=-1;
                opui.isDragging=false;
            };

            var resizeCommentMove = function(dx, dy,a,b,e)
            {
                if(oldPosX<0)return;

                var width=backgroundResize.attrs.x-background.attrs.x;
                var height=backgroundResize.attrs.y-background.attrs.y;

                if(width<50)width=50;
                if(height<50)height=50;

                label.attr({
                    x:backgroundComment.attrs.x+width/2
                });

                background.attr({
                    width:width+resizeSize
                });


                backgroundResize.attr({
                    x:oldPosX+dx,
                    y:oldPosY+dy
                });

                backgroundComment.attr({
                    x:background.attrs.x,
                    y:background.attrs.y,
                    width:width+resizeSize,
                    height:height+resizeSize
                });

                _opui.op.uiAttribs.size=[width,height];

                backgroundComment.toBack();
                gui.patch().background.toBack();
                background.toFront();
                backgroundResize.toFront();
            };

            backgroundResize.drag(resizeCommentMove, resizeCommentStart,resizeCommentEnd);

            group.push(backgroundResize,backgroundComment);
            backgroundComment.toBack();
            gui.patch().background.toBack();
            backgroundResize.toFront();
            background.toFront();
        }

        group.push(background,label,resizeHandle);
        resizeHandle.toFront();
    };

    this.setEnabled=function(enabled)
    {
        if(this.isVisible())
            if(enabled) background.attr( { "fill-opacity": 1 });
                else background.attr( { "fill-opacity": 0.1 });
    };

    this.setSelected=function(sel)
    {
        isSelected=sel;

        if(this.isVisible() && !backgroundComment)
        if(sel)
        {
            background.node.classList.add("active");
            // background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected,"stroke-width":0,"stroke":"#fff" });
            // label.attr( { "font-weight": "bold" });
        }
        else
        {
            background.node.classList.remove("active");
            // background.attr( { "fill": this.getBgColor(),"stroke-width":0 });
            // label.attr( { "font-weight": "normal" });
        }

        if(opui.op.uiAttribs.error && opui.op.uiAttribs.error.length>0)
        {
            if(background)background.attr({"fill":"#f88"});
        }

        // if(sel) background.attr( { stroke: '#fff', "stroke-width": 10});
        //     else background.attr( { stroke: '#fff', "stroke-width": 0});
    };

    this.setTitle=function(t)
    {
        title=t;
        if(label)
        {
            shownTitle=title;
            label.attr({text:shownTitle});

            while(label.node.getComputedTextLength()>background.attr("width"))
            {
                shownTitle=shownTitle.substr(0,shownTitle.length-1);
                label.attr({'text': shownTitle+'...  '});
            }
        }


    };

    this.getGroup=function()
    {
        return group;
    };

    // group.push(background);
    group.transform('t'+x+','+y);
};

var OpUi=function(paper,op,x,y,w,h,txt)
{
    var self=this;
    this.links=[];
    this.portsIn=[];
    this.portsOut=[];
    var hidden=false;
    var deleted=false;
    this.op=op;
    var selected=false;
    var width=w;

    var oldUiAttribs='';
    var startMoveX=-1;
    var startMoveY=-1;
    var olsPosX=0;
    var olsPosY=0;
    var posx=0;
    var posy=0;
    this.isMouseOver=false;

    this.remove=function()
    {
        deleted=true;
        this.hide();
        this.oprect.getGroup().remove();
        this.oprect.deleteUi();
    };

    this.getSubPatch=function()
    {
        if(!op.uiAttribs.subPatch)return 0;
        else return op.uiAttribs.subPatch;
    };

    this.isSelected=function()
    {
        return selected;
    };

    this.hide=function()
    {
        hidden=true;
        this.oprect.removeUi();
        this.oprect.getGroup().hide();

        var j=0;
        for(j in self.portsIn) self.portsIn[j].removeUi();
        for(j in self.portsOut) self.portsOut[j].removeUi();

        for(j in self.links)
        {
            self.links[j].hide();
            self.links[j].hideAddButton();
        }
    };

    this.show=function()
    {
        if(deleted)return;
        hidden=false;

        this.oprect.addUi();
        this.oprect.getGroup().show();

        var j=0;
        if(op.objName!='Ops.Ui.Comment')
        {
            for(j in self.portsIn) self.portsIn[j].addUi(this.oprect.getGroup());
            for(j in self.portsOut) self.portsOut[j].addUi(this.oprect.getGroup());
        }

        // this.oprect.getGroup().transform('t'+posx+','+posy);

        for(j in self.links) self.links[j].show();

        self.setPos();
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
        if(this.isHidden())return;
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

    this.getPosX=function(){return posx;};
    this.getPosY=function(){return posy;};

    this.setPos=function(x,y)
    {
        if(isNumber(x))
        {
            posx=x;
            posy=y;
        }


        self.oprect.setPosition(posx,posy);



        self.op.uiAttribs.translate={x:posx,y:posy};

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

        // var snapRange=10;
        // var snap=(pos.x%65)-snapRange;
        // if(snap>0 && snap<snapRange) pos.x-=snap;
        // if(snap<0 && snap>-snapRange) pos.x-=snap;
        //
        // snap=(pos.y%50)-snapRange;
        // if(snap>0 && snap<snapRange) pos.y-=snap;
        // if(snap<0 && snap>-snapRange) pos.y-=snap;

        // if(e.shiftKey===true)
        // {
        //     pos.x=parseInt(pos.x/25,10)*25;
        //     pos.y=parseInt(pos.y/25,10)*25;
        // }

        self.setPos(pos.x,pos.y);
        self.isDragging=true;
    };

    this.oprect=new OpRect(this,x,y,w,h, txt,self.op.objName);

    this.setEnabled=function(en)
    {
        this.op.enabled=en;
        this.oprect.setEnabled(en);

        for(var i=0;i<this.links.length;i++)
            this.links[i].setEnabled(en);
    };

    this.getPortLinks=function(portId)
    {
        var links=[];
        for(var i=0;i<this.links.length;i++)
        {
            if(this.links[i].p2)
            if(this.links[i].p2.thePort.id==portId || this.links[i].p1.thePort.id==portId)links.push(this.links[i]);
        }

        return links;
    };

    this.setSelected=function(sel)
    {
        selected=sel;
        if(sel) self.showAddButtons();
            else self.hideAddButtons();
        self.isDragging=false;
        this.oprect.setSelected(sel);
    };


    this.addPort=function(_inout,thePort)
    {
        var inout=_inout;

        var portIndex=this.portsIn.length;
        if(inout==PORT_DIR_OUT) portIndex=this.portsOut.length;


        var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*portIndex;
        if(self.oprect.getWidth()<w+CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.resizeBarWidth*2) self.oprect.setWidth(w+CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.resizeBarWidth*2);

        var port=new CABLES.UI.Port(thePort);

        port.direction=inout;
        port.op=self.op;
        port.opUi=self;
        port.portIndex=portIndex;


        if(this.oprect.getRect()) port.addUi(this.oprect.getGroup());

        if(inout==PORT_DIR_OUT) this.portsOut.push(port);
            else this.portsIn.push(port);

    };
};
