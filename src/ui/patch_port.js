CABLES.UI.MOUSEDRAGGINGPORT = false;
CABLES.UI.MOUSEOVERPORT = false;
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
    this._posX=0;
    this._posY=0;

    var hovering=false;
    var linkingLine=null;
    var cancelDeleteLink=false;

    thePort.onUiAttrChange=function(attribs)
    {
        if(attribs.hasOwnProperty('hidePort'))
        {
            self.thePort.removeLinks();
            self.opUi.initPorts();
            gui.patch().updateOpParams(self.opUi.op.id);
            self.opUi.setPos();
        }
        if(attribs.hasOwnProperty('greyout'))
        {
            gui.patch().updateOpParams(self.opUi.op.id);
        }
        if(attribs.hasOwnProperty('title'))
        {
            gui.patch().updateOpParams(self.opUi.op.id);
        }
    };

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
                CABLES.UI.MOUSEDRAGGINGPORT = true;

                var otherPorts=[];
                if(thePort.links.length>1)
                {
                	for(var i=0;i<thePort.links.length;i++)
                	{
                        var other=thePort.links[i].getOtherPort(thePort);
                        otherPorts.push(other);
                		CABLES.UI.selectedStartPortMulti.push(other);
                	}
                }
                else
                {
                    otherPorts.push(self.thePort.links[0].getOtherPort(self.thePort));
                }
                
                CABLES.UI.selectedStartPort=otherPorts[0];

                var ops=gui.patch().ops;
                var points=[];

                for(var ip=0;ip<otherPorts.length;ip++)
                {
                    var otherPort=otherPorts[ip];

                    for(var o in ops)
                    {
                        if(ops[o].op==otherPort.parent)
                        {
                            var xs=ops[o].op.uiAttribs.translate.x;
                            var ys=ops[o].op.uiAttribs.translate.y;
    
                            for(var oo in ops[o].portsOut)
                            {
                                if(ops[o].portsOut[oo].thePort==otherPort)
                                {
                                    xs+=ops[o].portsOut[oo].rect.attr('x');
                                    ys+=ops[o].portsOut[oo].rect.attr('y');
                                }
                            }
    
                            points.push(xs);
                            points.push(ys);
                        }
                    }
                }

                removeLinkingLine();
                linkingLine = new CABLES.UI.SVGMultiLine(points);
                linkingLine.updateEnd(gui.patch().getCanvasCoordsMouse(event).x+2,gui.patch().getCanvasCoordsMouse(event).y-2);
                linkingLine.addClass("link");
    
                if(!event.altKey) self.thePort.removeLinks();
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

        if(self.thePort.direction==CABLES.PORT_DIR_IN && self.thePort.isAnimated()) return;

        CABLES.UI.MOUSEDRAGGINGPORT=true;

        if(!linkingLine)
        {
            linkingLine = new CABLES.UI.SVGMultiLine([this.startx+CABLES.UI.uiConfig.portSize/2,this.starty+CABLES.UI.uiConfig.portHeight]);
        }
        else
        {
            self.opUi.isDragging=true;
            event=mouseEvent(event);

            linkingLine.updateEnd(
                gui.patch().getCanvasCoordsMouse(event).x+2,
                gui.patch().getCanvasCoordsMouse(event).y-2
                );
        }

        if(window.CABLES.UI.selectedEndOp)
        {
			$('#drop-op-cursor').hide();
            gui.setCursor("port_circle");
        }
		else
		{
            if(event.buttons==CABLES.UI.MOUSE_BUTTON_RIGHT)
			{
                gui.setCursor("port_remove");
			}
			else
			{
				$('#drop-op-cursor').css({top:b-12,left:a-37});
                gui.setCursor("port_add");
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
            gui.setCursor();
			$('#drop-op-cursor').hide();

            var txt=CABLES.Link.canLinkText(CABLES.UI.selectedEndPort.thePort,CABLES.UI.selectedStartPort);
            if(txt=='can link') getPortDescription(CABLES.UI.selectedEndPort.thePort);
                else CABLES.UI.hideInfo();

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;

            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(CABLES.UI.selectedEndPort.thePort));

	        if(CABLES.UI.selectedEndPort && CABLES.UI.selectedEndPort.thePort && CABLES.Link.canLink(CABLES.UI.selectedEndPort.thePort,CABLES.UI.selectedStartPort))
	        {
                linkingLine.addClass(CABLES.UI.uiConfig.getLinkClass(CABLES.UI.selectedEndPort.thePort));
                linkingLine.removeClass('link_color_error');
	        }
	        else
                linkingLine.addClass( 'link_color_error');
		}
    }

    function removeLinkingLine()
    {
        if(linkingLine) linkingLine.remove();
        linkingLine=null;
        $('#drop-op-cursor').hide();
    }

    function finishDragUI()
    {
		$('#drop-op-cursor').hide();
        CABLES.UI.selectedEndOp=null;
        removeLinkingLine();
        self.opUi.isDragging=false;
        CABLES.UI.selectedStartPort=null;
        CABLES.UI.selectedStartPortMulti.length=0;
        updateUI();
    }

    function dragEnd(event)
    {
        var j=0;
        CABLES.UI.MOUSEDRAGGINGPORT=false;
        removeLinkingLine();
        if(event.stopPropagation)event.stopPropagation();
        if(event.preventDefault)event.preventDefault();

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
                new CABLES.UI.SuggestPortDialog(CABLES.UI.selectedEndOp.op,CABLES.UI.selectedStartPort,event,
                    function(portName)
                    {
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
                    
                return false;
            }
        }

        if(!foundAutoOp)
        {
			if(CABLES.UI.selectedStartPort && CABLES.UI.selectedStartPort.type==CABLES.OP_PORT_TYPE_DYNAMIC)return;

            if( (event.buttons==CABLES.UI.MOUSE_BUTTON_RIGHT && !cancelDeleteLink) || (event.buttons==CABLES.UI.MOUSE_BUTTON_LEFT && event.ctrlKey))
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
                        if(Math.abs(coords.y-self.op.uiAttribs.translate.y )<40) 
                        {
                            if(CABLES.UI.selectedStartPort && CABLES.UI.selectedStartPort.direction==CABLES.PORT_DIR_IN) coords.y=self.op.uiAttribs.translate.y-40;
                                else coords.y=self.op.uiAttribs.translate.y+40;
                        }

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


        var perf = CABLES.uiperf.start('port updateUI');
        

        var offY=0;
        if(self.direction==CABLES.PORT_DIR_OUT) offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;

        if(thePort.isLinked())
        {
            if(self.direction==CABLES.PORT_DIR_IN)offY-=3;
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
                x:self._posX,
                y:self._posY+offY,
            });

        perf.finish();
    }
    this.updateUI=updateUI;

    function updateHoverToolTip(event)
    {
        var thePort=gui.patch().hoverPort;

        if(!thePort)return;

        var txt=getPortDescription(thePort);
        var val=null;
        if(thePort && thePort.type==CABLES.OP_PORT_TYPE_VALUE)
        {
            val=thePort.get();
            if(CABLES.UTILS.isNumeric(val))val=Math.round(val*1000)/1000;
            txt+=': <span class="code">'+val+'</span>';
        }

        if(thePort && thePort.type==CABLES.OP_PORT_TYPE_ARRAY)
        {
            val=thePort.get();
            if(val && val.hasOwnProperty('val')) txt+=': <span class="code">#'+val.length+'</span>';
        }



        CABLES.UI.showToolTip(event,txt);
        if(CABLES.UI.hoverInterval==-1)
        {
            CABLES.UI.hoverInterval=setInterval(updateHoverToolTip,50);
        }
        
    }

    function hover(event)
    {
        CABLES.UI.MOUSEOVERPORT = true;
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

        if(thePort && thePort.type==CABLES.OP_PORT_TYPE_OBJECT)
        {
            var val=thePort.get();
            if(val && val.tex)
                gui.texturePreview().hover(thePort);
        }
    }

    function hoverOut()
    {
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval=-1;
        
        CABLES.UI.hideToolTip();
        CABLES.UI.selectedEndPort=null;
        gui.patch().hoverPort=null;

        gui.texturePreview().hoverEnd();


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

        CABLES.UI.MOUSEOVERPORT = false;
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

    var contextMenu=function(e)
    {
        if(e.stopPropagation) e.stopPropagation();
        if(e.preventDefault) e.preventDefault();
        e.cancelBubble = false;
    };

    this.addUi=function(group)
    {
        thePort.onUiActiveStateChange=changeActiveState;

        if(self.isVisible())return;
        if(self.opUi.isHidden())return;
        var yp=0;
        var offY=0;
        // var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*self.portPosX;
        var w=self.portPosX;

        if(self.direction==CABLES.PORT_DIR_OUT)
        {
            offY=CABLES.UI.uiConfig.portSize-CABLES.UI.uiConfig.portHeight;
            yp=21;
        }

        this._posX=0+w;
        this._posY=0+yp;
        
        this.rect = gui.patch().getPaper().rect(this._posX,offY+this._posY);
        CABLES.UI.cleanRaphael(this.rect);

        this.rect.attr({ width:10, height:6, }); // for firefox compatibility: ff seems to ignore css width/height of svg rect?!
        this.rect.node.classList.add(CABLES.UI.uiConfig.getPortClass(self.thePort));
        this.rect.node.classList.add('port');

        group.push(this.rect);

        $(self.rect.node).bind("contextmenu", contextMenu);

        self.rect.hover(hover, hoverOut);
        self.rect.drag(dragMove,dragStart,dragEnd);
        updateUI();
    };

};

CABLES.UI.Port.prototype.getPosX=function()
{
    return this._posX;
}

CABLES.UI.Port.prototype.getPosY=function()
{
    return this._posY;
}

CABLES.UI.Port.prototype.getParentPosX=function()
{
    return this.opUi.getPosX();
}

CABLES.UI.Port.prototype.getParentPosY=function()
{
    return this.opUi.getPosY();
}

