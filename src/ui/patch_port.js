CABLES.UI.MOUSEOVERPORT=false;

CABLES.UI.Port=function(thePort)
{
    var self=this;
    this.thePort=null;
    this.rect=null;
    this.hover=null;
    this.portIndex=0;
    this.thePort=thePort;
    this.opUi=null;
    var xpos=0,
        ypos=0;

    var linkingLine=null;
    var cancelDeleteLink=false;

    function changeActiveState()
    {
        for(var i=0;i<self.opUi.links.length;i++)
            if(self.opUi.links[i].p1.thePort==self.thePort || self.opUi.links[i].p2.thePort==self.thePort)
                self.opUi.links[i].setEnabled(self.thePort.getUiActiveState());
    }

    function dragStart(x,y,event)
    {
        cancelDeleteLink=false;

        if(event.which==3)
        {
            if(thePort.isLinked && thePort.links.length===1)
            {
                var otherPort=self.thePort.links[0].getOtherPort(self.thePort);
                selectedStartPort=otherPort;
                var xs=0;
                var ys=0;

                var ops=gui.patch().ops;
                for(var o in ops)
                {
                    if(ops[o].op==otherPort.parent)
                    {
                        xs=ops[o].op.uiAttribs.translate.x;
                        ys=ops[o].op.uiAttribs.translate.y;

                        for(var oo in ops[o].portsOut)
                        {
                            if(ops[o].portsOut[oo].thePort==otherPort)
                            {
                                xs+=ops[o].portsOut[oo].rect.attr('x');
                                ys+=ops[o].portsOut[oo].rect.attr('y');
                                break;
                            }
                        }
                    }
                }

                linkingLine = new Line(xs+CABLES.UI.uiConfig.portSize/2,ys+CABLES.UI.uiConfig.portHeight);
                self.thePort.removeLinks();
            }
        }
        else
        {
            selectedStartPort=self.thePort;
        }

        $('#patch').focus();
        if(!linkingLine)
        {
            this.startx=this.matrix.e+this.attrs.x;
            this.starty=this.matrix.f+this.attrs.y;
        }
    }


    function dragMove(dx, dy,a,b,event)
    {
        cancelDeleteLink=true;
        if(event.which==2) return;

        if(self.thePort.direction==PORT_DIR_IN && (self.thePort.isLinked() || self.thePort.isAnimated()) )
        {
            return;
        }

        CABLES.UI.MOUSEOVERPORT=true;

        if(!linkingLine)
        {
            linkingLine = new Line(this.startx+CABLES.UI.uiConfig.portSize/2,this.starty+CABLES.UI.uiConfig.portHeight);
        }
        else
        {
            self.opUi.isDragging=true;
            event=mouseEvent(event);

            linkingLine.updateEnd(
                gui.patch().getCanvasCoordsMouse(event).x,
                gui.patch().getCanvasCoordsMouse(event).y
                );
        }

        if(!selectedEndPort || !selectedEndPort.thePort)
        {
            CABLES.UI.setStatusText('select a port to link...');
        }
        else
        {
            var txt=CABLES.Link.canLinkText(selectedEndPort.thePort,selectedStartPort);
            if(txt=='can link') getPortDescription(selectedEndPort.thePort);
                else CABLES.UI.hideInfo();

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;
            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(selectedEndPort.thePort));
        }

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,selectedStartPort))
            linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.getPortColor(selectedEndPort.thePort) });
        else
            linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLinkInvalid });
    }

    function removeLinkingLine()
    {
        if(linkingLine && linkingLine.thisLine)linkingLine.thisLine.remove();
        linkingLine=null;
    }

    function dragEnd(event)
    {
        CABLES.UI.MOUSEOVERPORT=false;

        if(event.which==3 && !cancelDeleteLink)
        {
            removeLinkingLine();
            self.thePort.removeLinks();
            return;
        }

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,selectedStartPort))
        {
            var link=gui.patch().scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , selectedStartPort.parent, selectedStartPort.getName());
        }
        else
        {
            event=mouseEvent(event);
            if(!selectedEndPort || !selectedEndPort.thePort || !linkingLine)
            {
                var links=self.opUi.getPortLinks(selectedStartPort.id);
                var coords=gui.patch().getCanvasCoordsMouse(event);

                if(Math.abs(coords.x-self.op.uiAttribs.translate.x )<50) coords.x=self.op.uiAttribs.translate.x;
                if(Math.abs(coords.y-self.op.uiAttribs.translate.y )<40) coords.y=self.op.uiAttribs.translate.y+40;

                if(links.length==1 && !self.opUi.isDragging) CABLES.UI.OPSELECT.showOpSelect(coords,null,selectedStartPort,links[0]);
                    else CABLES.UI.OPSELECT.showOpSelect(coords,self.op,selectedStartPort);
            }
        }

        removeLinkingLine();
        self.opUi.isDragging=false;
    }



    function hover(event)
    {
        selectedEndPort=self;
        self.rect.toFront();
        self.rect.attr(
        {
            'stroke-width':2,
            "fill-opacity": 1,
        });

        var txt=getPortDescription(thePort);
        CABLES.UI.setStatusText(txt);
        CABLES.UI.showToolTip(event,txt);
    }

    function hoverOut()
    {
        CABLES.UI.hideToolTip();
        selectedEndPort=null;
        var offY=0;
        if(self.direction==PORT_DIR_OUT) offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;

        self.rect.attr(
            {
                fill:CABLES.UI.uiConfig.getPortColor(self.thePort),
                "fill-opacity": getPortOpacity(self.thePort ),
                width:CABLES.UI.uiConfig.portSize,
                height:CABLES.UI.uiConfig.portHeight,
                x:xpos,
                y:ypos+offY,
                'stroke-width':0,
            });

        CABLES.UI.hideInfo();

        // for(var i=0;i<self.opUi.links.length;i++) self.opUi.links[i].redraw();

    }


    this.isVisible=function()
    {
        return this.rect!==null;
    };

    this.removeUi=function()
    {
        if(!self.isVisible())return;
        this.rect.undrag();
        this.rect.unhover(hover,hoverOut);
        this.rect.remove();
        this.rect=null;
        thePort.onUiActiveStateChange=null;
    };

    this.addUi=function(group)
    {
        thePort.onUiActiveStateChange=changeActiveState;

        if(self.isVisible())return;
        if(self.opUi.isHidden())return;
        var yp=0;
        var offY=0;
        var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*self.portIndex;

        if(self.direction==PORT_DIR_OUT)
        {
            offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;
            yp=21;
        }

        xpos=0+w;
        ypos=0+yp;


        this.rect = gui.patch().getPaper().rect(xpos,offY+ypos, CABLES.UI.uiConfig.portSize, CABLES.UI.uiConfig.portHeight);
        this.rect.attr({
            "stroke-width": 0,
            "stroke": CABLES.UI.uiConfig.getPortColor(self.thePort),
            "fill":CABLES.UI.uiConfig.getPortColor(self.thePort),
            "fill-opacity": getPortOpacity(self.thePort ),
        });



        group.push(this.rect);
        // group.push(this.hover);

        $(self.rect.node).bind("contextmenu", function(e)
        {
            if(e.stopPropagation) e.stopPropagation();
            if(e.preventDefault) e.preventDefault();
            e.cancelBubble = false;
        });

        self.rect.hover(hover, hoverOut);
        self.rect.drag(dragMove,dragStart,dragEnd);
    };


};
