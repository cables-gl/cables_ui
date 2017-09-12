CABLES.UI.MOUSEOVERPORT=false;
CABLES.UI.selectedStartPort=null;
CABLES.UI.selectedEndPort=null;

CABLES.UI.hoverInterval=-1;

CABLES.UI.selectedStartPortMulti=[];

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

    var hovering=false;
    var linkingLine=null;
    var cancelDeleteLink=false;

    function changeActiveState()
    {
        for(var i=0;i<self.opUi.links.length;i++)
            if(self.opUi.links[i].p1 && !self.opUi.links[i].p2)
                if(self.opUi.links[i].p1.thePort==self.thePort || self.opUi.links[i].p2.thePort==self.thePort)
                    self.opUi.links[i].setEnabled(self.thePort.getUiActiveState());
    }

    function dragStart(x,y,event)
    {
        cancelDeleteLink=false;

        if(event.which==3 || (event.which==1 && event.ctrlKey))
        {
            if(thePort.isLinked && self.thePort.links.length>0 ) //&& thePort.links.length===1
            {

                if(thePort.links.length>1)
                {
                	for(var i=0;i<thePort.links.length;i++)
                	{
                		var other=thePort.links[i].getOtherPort(thePort);
                		CABLES.UI.selectedStartPortMulti.push(other);
                	}
                }

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

                linkingLine = new CABLES.UI.SVGLine(xs+CABLES.UI.uiConfig.portSize/2,ys+CABLES.UI.uiConfig.portHeight);
                self.thePort.removeLinks();
                // CABLES.UI.selectedStartPortMulti.length=0;
                updateUI();
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

        // if(self.thePort.direction==PORT_DIR_IN && (self.thePort.isLinked() || self.thePort.isAnimated()) )
        if(self.thePort.direction==PORT_DIR_IN && self.thePort.isAnimated())
        {
            return;
        }

        CABLES.UI.MOUSEOVERPORT=true;

        if(!linkingLine)
        {
            linkingLine = new CABLES.UI.SVGLine(this.startx+CABLES.UI.uiConfig.portSize/2,this.starty+CABLES.UI.uiConfig.portHeight);
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

        if(window.CABLES.UI.selectedEndOp)
        {
			$('#drop-op-cursor').hide();
			$('#patch').css({cursor:"url(/img/circle.png) 10 10, auto"});
        }
		else
		{
			if(event.which==3)
			{
				$('#patch').css({cursor:"url(/img/remove.png) 10 10, auto"});
			}
			else
			{
				$('#drop-op-cursor').css({top:b-12,left:a-37});
				$('#patch').css({cursor:"url(/img/add.png) 10 10, auto"});
				$('#drop-op-cursor').show();
			}
		}

        if(!CABLES.UI.selectedEndPort || !CABLES.UI.selectedEndPort.thePort)
        {
            // CABLES.UI.selectedStartPortMulti.length=0;
            // CABLES.UI.setStatusText('select a port to link...');
        }
        else
        {
			$('#patch').css({cursor:"default"});
			$('#drop-op-cursor').hide();

            var txt=CABLES.Link.canLinkText(CABLES.UI.selectedEndPort.thePort,CABLES.UI.selectedStartPort);
            if(txt=='can link') getPortDescription(CABLES.UI.selectedEndPort.thePort);
                else CABLES.UI.hideInfo();

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;

            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(CABLES.UI.selectedEndPort.thePort));

	        if(CABLES.UI.selectedEndPort && CABLES.UI.selectedEndPort.thePort && CABLES.Link.canLink(CABLES.UI.selectedEndPort.thePort,CABLES.UI.selectedStartPort))
	        {
	            linkingLine.thisLine.node.classList.add( CABLES.UI.uiConfig.getLinkClass(CABLES.UI.selectedEndPort.thePort));
	            linkingLine.thisLine.node.classList.remove( 'link_color_error');
	        }
	        else
	            linkingLine.thisLine.node.classList.add( 'link_color_error');
	            // linkingLine.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLinkInvalid });
		}
    }

    function removeLinkingLine()
    {
        if(linkingLine && linkingLine.thisLine)linkingLine.thisLine.remove();
        linkingLine=null;
    }

    function finishDragUI()
    {
		$('#drop-op-cursor').hide();
        CABLES.UI.selectedEndOp=null;
        removeLinkingLine();
        self.opUi.isDragging=false;
        CABLES.UI.selectedStartPort=false;
        updateUI();
    }

    function dragEnd(event)
    {
        var j=0;
        CABLES.UI.MOUSEOVERPORT=false;

        var foundAutoOp=false;
        if(CABLES.UI.selectedEndOp && !CABLES.UI.selectedEndPort)
        {
            var i=0;
            var numFitting=CABLES.UI.selectedEndOp.op.countFittingPorts(CABLES.UI.selectedStartPort);

            if(numFitting==1)
            {
                var p=CABLES.UI.selectedEndOp.op.findFittingPort(CABLES.UI.selectedStartPort);

				gui.patch().scene.link(
                    CABLES.UI.selectedEndOp.op,
                    p.name,
                    CABLES.UI.selectedStartPort.parent,
                    CABLES.UI.selectedStartPort.name
                    );

				for(j=0;j<CABLES.UI.selectedStartPortMulti.length;j++)
				{
					gui.patch().scene.link(
						CABLES.UI.selectedEndOp.op,
						p.name,
						CABLES.UI.selectedStartPortMulti[j].parent,
						CABLES.UI.selectedStartPortMulti[j].name
						);
				}


                foundAutoOp=true;

            }
            else
            if(numFitting>0)
            {
                foundAutoOp=true;
                // console.log(numFitting+' numFitting ports...');
                new CABLES.UI.SuggestPortDialog(CABLES.UI.selectedEndOp.op,CABLES.UI.selectedStartPort,event,
                    function(portName)
                    {
                        console.log('final', portName);
                        if(CABLES.UI.selectedEndOp)
						{
							gui.patch().scene.link(
                                CABLES.UI.selectedEndOp.op,
                                portName,
                                CABLES.UI.selectedStartPort.parent,
                                CABLES.UI.selectedStartPort.name
                                );

							for(var j=0;j<CABLES.UI.selectedStartPortMulti.length;j++)
							{
								gui.patch().scene.link(
									CABLES.UI.selectedEndOp.op,
									portName,
									CABLES.UI.selectedStartPortMulti[j].parent,
									CABLES.UI.selectedStartPortMulti[j].name
									);
							}

						}
                        finishDragUI();
                    },finishDragUI);
                return;
            }
        }

        if(!foundAutoOp)
        {

			if(CABLES.UI.selectedStartPort && CABLES.UI.selectedStartPort.type==OP_PORT_TYPE_DYNAMIC)return;

            if( (event.which==3 && !cancelDeleteLink) || (event.which==1 && event.ctrlKey))
            {
                removeLinkingLine();
                self.thePort.removeLinks();
                CABLES.UI.selectedStartPortMulti.length=0;
                return;
            }

            if(CABLES.UI.selectedEndPort && CABLES.UI.selectedEndPort.thePort && CABLES.Link.canLink(CABLES.UI.selectedEndPort.thePort,CABLES.UI.selectedStartPort))
            {
                var link=gui.patch().scene.link(CABLES.UI.selectedEndPort.op, CABLES.UI.selectedEndPort.thePort.getName() , CABLES.UI.selectedStartPort.parent, CABLES.UI.selectedStartPort.getName());

				for(j=0;j<CABLES.UI.selectedStartPortMulti.length;j++)
				{
					gui.patch().scene.link(
						CABLES.UI.selectedEndPort.op,
						CABLES.UI.selectedEndPort.thePort.getName(),
						CABLES.UI.selectedStartPortMulti[j].parent,
						CABLES.UI.selectedStartPortMulti[j].name
						);
				}

                CABLES.UI.selectedEndPort.updateUI();
            }
            else
            {
                if(event.which!=3)
                {
                    event=mouseEvent(event);
                    if(!CABLES.UI.selectedEndPort || !CABLES.UI.selectedEndPort.thePort || !linkingLine)
                    {
                        var links=self.opUi.getPortLinks(CABLES.UI.selectedStartPort.id);
                        var coords=gui.patch().getCanvasCoordsMouse(event);
                        var isDragging=self.opUi.isDragging;
                        var selectedStartPort=CABLES.UI.selectedStartPort;

                        var dist=Math.abs(coords.x-self.op.uiAttribs.translate.x )+Math.abs(coords.y-self.op.uiAttribs.translate.y );

                        if(Math.abs(coords.x-self.op.uiAttribs.translate.x )<50) coords.x=self.op.uiAttribs.translate.x;
                        if(Math.abs(coords.y-self.op.uiAttribs.translate.y )<40) coords.y=self.op.uiAttribs.translate.y+40;

                        var showSelect=function()
                        {
                            if( dist <10)
                            {
                                // port was clicked, not dragged, insert op directly into link

								// if(event.which==1 && event.ctrlKey)
								// {
								// 	self.thePort.removeLinks();
								// 	removeLinkingLine();
								// 	console.log('remove!!!');
								// 	return;
								// }
                                // else
								gui.opSelect().show(coords,null,selectedStartPort,links[0]);
                            }
                            else
                            {
                                gui.opSelect().show(coords,self.op,selectedStartPort);
                            }
                        };

                        if( dist >30)
                        {
                            new CABLES.UI.SuggestOpDialog(self.op,CABLES.UI.selectedStartPort.name,event,coords,showSelect,
                                function()
                                {
                                    console.log('cancval');
                                });
                        }
                        else
                        {
                            showSelect();
                        }
                    }
                }
            }
        }

        CABLES.UI.selectedStartPortMulti.length=0;
        finishDragUI();
    }

    function updateUI()
    {
        if(!self.rect)return;
        var offY=0;
        if(self.direction==PORT_DIR_OUT) offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;

        if(thePort.isLinked())
        {
            if(self.direction==PORT_DIR_IN)offY-=3;
        }

        if(thePort.isLinked())
        {
            self.rect.node.classList.add('connected');
        }
        else
        {
            self.rect.node.classList.remove('connected');
        }

        if(thePort.isAnimated())
        {
            self.rect.node.classList.add('animated');
        }
        else
        {
            self.rect.node.classList.remove('animated');
        }

        if(hovering)
        {
            self.rect.node.classList.add('active');
        }
        else
        {
            self.rect.node.classList.remove('active');
        }

        self.rect.attr(
            {
                x:xpos,
                y:ypos+offY,
            });

    }
    this.updateUI=updateUI;

    function updateHoverToolTip(event)
    {
        var thePort=gui.patch().hoverPort;

        if(!thePort)return;

        var txt=getPortDescription(thePort);
        if(thePort && thePort.type==OP_PORT_TYPE_VALUE)
        {
            var val=thePort.get();
            if(isNumeric(val))val=Math.round(val*1000)/1000;
            txt+=': <span class="code">'+val+'</span>';
        }

        if(thePort && thePort.type==OP_PORT_TYPE_ARRAY)
        {
            var val=thePort.get();
            txt+=': <span class="code">#'+val.length+'</span>';
        }

        // if(thePort && thePort.type==OP_PORT_TYPE_OBJECT)
        // {
        //     var val=thePort.get();
        //     if(val.tex)
        //     {
        //         gui.hoverPreview.showHover(event);
        //         gui.hoverPreview.setTexture(thePort.parent.id,thePort.name);
        //     }
        // }

        CABLES.UI.showToolTip(event,txt);
        if(CABLES.UI.hoverInterval==-1)
        {
            CABLES.UI.hoverInterval=setInterval(updateHoverToolTip,50);
        }
        
    }

    function hover(event)
    {
        CABLES.UI.selectedEndPort=self;
        self.rect.toFront();
        hovering=true;

        gui.patch().hoverPort=thePort;

        updateHoverToolTip(event);
        updateUI();

        // hover link

        for(var i=0;i<self.opUi.links.length;i++)
            if(self.opUi.links[i].p1 && self.opUi.links[i].p2)
                if(self.opUi.links[i].p1.thePort==self.thePort || self.opUi.links[i].p2.thePort==self.thePort)
                {
                    // console.log(self.opUi.links[i]);
                    if(!self.opUi.links[i].p2.thePort.isLinked() || !self.opUi.links[i].p1.thePort.isLinked())
                        self.opUi.links[i].hide();
                    else
                        if(self.opUi.links[i].linkLine)
                        {
                            self.opUi.links[i].linkLine.node.classList.add('link_hover');
                        }
                }

    }

    function hoverOut()
    {
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval=-1;
        
        CABLES.UI.hideToolTip();
        CABLES.UI.selectedEndPort=null;
        gui.patch().hoverPort=null;

        hovering=false;

        CABLES.UI.hideInfo();
        updateUI();

        // hover link
        for(var i=0;i<self.opUi.links.length;i++)
            if(self.opUi.links[i].p1 && self.opUi.links[i].p2)
                if(self.opUi.links[i].p1.thePort==self.thePort || self.opUi.links[i].p2.thePort==self.thePort)
                    if(!self.opUi.links[i].p2.thePort.isLinked() || !self.opUi.links[i].p1.thePort.isLinked())
                        self.opUi.links[i].hide();
                    else
                        if(self.opUi.links[i].linkLine)
                            self.opUi.links[i].linkLine.node.classList.remove('link_hover');
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

        this.rect.attr({ width:10, height:6, }); // for firefox compatibility: ff seems to ignore css width/height of svg rect?!
        // this.rect.attr(height=9;
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
        updateUI();
    };

};
