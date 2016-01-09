





CABLES.UI.Port=function(thePort)
{
    var self=this;
    this.thePort=null;
    this.rect=null;
    this.portIndex=0;
    this.thePort=thePort;
    this.opUi=null;
    var xpos=0,
        ypos=0;

    var linkingLine=null;

    function changeActiveState()
    {
        for(var i=0;i<self.opUi.links.length;i++)
            if(self.opUi.links[i].p1.thePort==self.thePort || self.opUi.links[i].p2.thePort==self.thePort)
                self.opUi.links[i].setEnabled(self.thePort.getUiActiveState());
    }

    function dragStart(x,y,event)
    {
        $('#patch').focus();
        if(!linkingLine)
        {
            this.startx=this.matrix.e+this.attrs.x;
            this.starty=this.matrix.f+this.attrs.y;
        }
    }

    function dragMove(dx, dy,a,b,event)
    {
        if(event.which==3)return;
        if(event.which==2)return;

        if(self.thePort.direction==PORT_DIR_IN && (self.thePort.isLinked() || self.thePort.isAnimated()) )  return;

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
            var txt=CABLES.Link.canLinkText(selectedEndPort.thePort,self.thePort);
            if(txt=='can link') CABLES.UI.setStatusText(  getPortDescription(selectedEndPort.thePort));
                else CABLES.UI.setStatusText( txt );

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;
            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(selectedEndPort.thePort));
        }

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,self.thePort))
            linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink });
        else
            linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLinkInvalid });
    }

    function dragEnd(event)
    {

        if(event.which==3)
        {
            self.thePort.removeLinks();
            return;
        }

        if(selectedEndPort && selectedEndPort.thePort && CABLES.Link.canLink(selectedEndPort.thePort,self.thePort))
        {
            var link=gui.patch().scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , self.op, self.thePort.getName());
            if(link)
            {
                var thelink=new UiLink(selectedEndPort,self);
                selectedEndPort.opUi.links.push(thelink);
                self.opUi.links.push(thelink);
            }
        }
        else
        {
            event=mouseEvent(event);
            if(!selectedEndPort || !selectedEndPort.thePort || !linkingLine)
            {
                console.log(self.thePort);
                var links=self.opUi.getPortLinks(self.thePort.id);
                if(links.length>0)
                    CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),null,self.thePort,links[0]);
                else
                    CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),self.op,self.thePort);
            }
        }

        if(linkingLine && linkingLine.thisLine)linkingLine.thisLine.remove();
        linkingLine=null;
        self.opUi.isDragging=false;
    }



    function hover(event)
    {
        selectedEndPort=self;
        self.rect.toFront();
        self.rect.attr(
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

        CABLES.UI.setStatusText('');
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

        this.rect = gui.patch().getPaper().rect(xpos,offY+ypos, CABLES.UI.uiConfig.portSize, CABLES.UI.uiConfig.portHeight).attr({
            "stroke-width": 0,
            "fill":CABLES.UI.uiConfig.getPortColor(self.thePort),
            "fill-opacity": getPortOpacity(self.thePort ),
        });

        group.push(this.rect);

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
