CABLES.UI.MOUSEOVERPORT=false;
CABLES.UI.selectedStartPort=null;



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
                CABLES.UI.selectedStartPort=otherPort;
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
            else
            {
                return;
            }
        }
        else
        {
            CABLES.UI.selectedStartPort=self.thePort;
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
        if(!CABLES.UI.selectedStartPort) return;

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
            var txt=CABLES.Link.canLinkText(selectedEndPort.thePort,CABLES.UI.selectedStartPort);
            if(txt=='can link') getPortDescription(selectedEndPort.thePort);
                else CABLES.UI.hideInfo();

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;
            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(selectedEndPort.thePort));
        }

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,CABLES.UI.selectedStartPort))
        {
            linkingLine.thisLine.node.classList.add( CABLES.UI.uiConfig.getLinkClass(selectedEndPort.thePort));
            linkingLine.thisLine.node.classList.remove( 'link_color_error');
        }
        else
            linkingLine.thisLine.node.classList.add( 'link_color_error');
            // linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLinkInvalid });
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

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,CABLES.UI.selectedStartPort))
        {
            var link=gui.patch().scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , CABLES.UI.selectedStartPort.parent, CABLES.UI.selectedStartPort.getName());
        }
        else
        {
            if(event.which!=3)
            {
                event=mouseEvent(event);
                if(!selectedEndPort || !selectedEndPort.thePort || !linkingLine)
                {
                    var links=self.opUi.getPortLinks(CABLES.UI.selectedStartPort.id);
                    var coords=gui.patch().getCanvasCoordsMouse(event);

                    if(Math.abs(coords.x-self.op.uiAttribs.translate.x )<50) coords.x=self.op.uiAttribs.translate.x;
                    if(Math.abs(coords.y-self.op.uiAttribs.translate.y )<40) coords.y=self.op.uiAttribs.translate.y+40;

                    if(links.length==1 && !self.opUi.isDragging) CABLES.UI.OPSELECT.showOpSelect(coords,null,CABLES.UI.selectedStartPort,links[0]);
                        else CABLES.UI.OPSELECT.showOpSelect(coords,self.op,CABLES.UI.selectedStartPort);
                }
            }
        }

        removeLinkingLine();
        self.opUi.isDragging=false;
        CABLES.UI.selectedStartPort=false;
    }

    function hover(event)
    {
        selectedEndPort=self;
        self.rect.toFront();
        self.rect.node.classList.add('active');

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
                x:xpos,
                y:ypos+offY,
            });
        self.rect.node.classList.remove('active');

        CABLES.UI.hideInfo();
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

        this.rect = gui.patch().getPaper().rect(xpos,offY+ypos);
        CABLES.UI.cleanRaphael(this.rect);
        // this.rect.attr({
        //     "fill-opacity": getPortOpacity(self.thePort ),
        // });
        this.rect.node.classList.add(CABLES.UI.uiConfig.getPortClass(self.thePort));
        this.rect.node.classList.add('port');


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
