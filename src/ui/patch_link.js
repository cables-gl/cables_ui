var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};
CABLES.UI.LINKHOVER=null;

function UiLink(port1, port2)
{
    var self=this;
    var middlePosX=30;
    var middlePosY=30;
    var fromX,fromY,toX,toY;

    this._addCircles=[];

    this.linkLine=null;
    this.p1=port1;
    this.p2=port2;

    this.unlink=function()
    {
        self.p1.thePort.removeLinkTo( self.p2.thePort );
    }

    this.hideAddButton=function()
    {
        for(var i=0;i<this._addCircles.length;i++)
        {
            this._addCircles[i].hide();
            this._addCircleVisible=false;

            const llWidth = 0.5;
            if (this.linkLine && this._lastLinkLineWidth!=llWidth) 
            {
                this.linkLine.attr({ "stroke-width": llWidth });
                this._lastLinkLineWidth = llWidth;
            }
        }
        // this._addCircles.length=0;
    };

    var onHover=function (e)
    {
        CABLES.UI.LINKHOVER=self;

        var addCircle=this._addCircles[0];
        addCircle.node.classList.add('active');
        self.linkLine.node.classList.add('link_hover');

        CABLES.UI.showInfo(CABLES.UI.TEXTS.linkAddCircle);
    };

    var onUnHover=function()
    {
        var addCircle=this._addCircles[0];
        CABLES.UI.LINKHOVER=null;
        addCircle.node.classList.remove('active');
        if (self.linkLine && self.linkLine.node )self.linkLine.node.classList.remove('link_hover');

        CABLES.UI.hideInfo();
    };
   
    var onMouseDown=function (event)
    {
        $('#patch').focus();

        if(self.p1!==null)
        {
            if(event.which==3)
            {
                // self.p1.thePort.removeLinkTo( self.p2.thePort );
                self.unlink();
            }
            else
            {
                event=mouseEvent(event);
                var coords=gui.patch().getCanvasCoordsMouse(event);
                coords.x=self.p1.op.uiAttribs.translate.x;
                gui.opSelect().show(coords,null,null,self);
            }
        }
    };


    this.setElementOrder=function()
    {
        if (this.linkLine && this._addCircles[0])
        {
            this.linkLine.toFront();
            this._addCircles[0].toFront();
        }
    }

    this._addAddCircle=function()
    {
        if(!self.p1)return;

        var addCircle = gui.patch().getPaper().circle(
            middlePosX,
            middlePosY-CABLES.UI.uiConfig.portSize*0.5*0.5,
            CABLES.UI.uiConfig.portSize*0.5);

        this._addCircles.push(addCircle);

        // console.log('new addcircle',this._addCircles.length);

        addCircle.node.classList.add(CABLES.UI.uiConfig.getLinkClass(self.p1.thePort ));
        addCircle.node.classList.add('addCircle');

        addCircle.hover(onHover.bind(this),onUnHover.bind(this));
        // addCircle.toFront();

        addCircle.node.onmousedown = onMouseDown;
        this.setElementOrder();
    };


    this._lastMiddlePosX = -1;
    this._lastMiddlePosY = -1;
    this._linkLineWidth = -1;
    this._addCircleVisible = false;

    this.showAddButton=function()
    {
        if(!this.linkLine)return;
        // if(!this.isVisible())return;

        var perf = CABLES.uiperf.start('link showadd');


        const llWidth=1.5;
        if (this._lastLinkLineWidth != llWidth)
        {
            this.linkLine.attr( { "stroke-width": llWidth });
            this._lastLinkLineWidth = llWidth;
        }

        if(this._addCircles.length===0)
        {
            this._addAddCircle();
            
        }
        else
        {
            // for(var i=0;i<this._addCircles.length;i++)
            // {


            var pY = middlePosY - CABLES.UI.uiConfig.portSize * 0.5 * 0.5;
            if (this._lastMiddlePosX != middlePosX || this._lastMiddlePosY != pY )
            {
                this._lastMiddlePosX = middlePosX;
                this._lastMiddlePosY = pY;
                this._addCircles[0].attr({
                    cx: middlePosX,
                    cy: pY
                });
                
            }
            
            if (!this._addCircleVisible)
            {
                this._addCircles[0].show();
                this.setElementOrder();
                this._addCircleVisible=true;
            }
            
            
            //
            // this._addCircles[1].attr({
            //     cx:fromX,
            //     cy:fromY-4,
            //     r:CABLES.UI.uiConfig.portSize*0.35
            // });
            //
            // this._addCircles[2].attr({
            //     cx:toX,
            //     cy:toY+4,
            //     r:CABLES.UI.uiConfig.portSize*0.35
            // });

            
            // this._addCircles[1].toFront();

            // }

        }

        perf.finish();

    };

    this.getPath = function()
    {
        var perf = CABLES.uiperf.start('link getpath');
        // if(!port2.rect)return '';
        // if(!port1.rect)return '';

        // if(!port2.rect.attrs)return '';
        // if(!port1.rect.attrs)return '';

        if(port2.direction==CABLES.PORT_DIR_IN)
        {
            var temp=port1;
            port1=port2;
            port2=temp;
        }

        fromX=port1.getParentPosX()+port1.getPosX()+CABLES.UI.uiConfig.portSize/2;
        fromY=port1.getParentPosY()+port1.getPosY();
        toX=port2.getParentPosX()+port2.getPosX()+CABLES.UI.uiConfig.portSize/2;
        toY=port2.getParentPosY()+port2.getPosY()+CABLES.UI.uiConfig.portHeight*1.5;

        middlePosX=0.5*(fromX+toX);
        middlePosY=0.5*(fromY+toY+CABLES.UI.uiConfig.portSize*0.5);

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;

        if(fromY > toY)
        {
            // toY+=CABLES.UI.uiConfig.portHeight;
        }

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/2;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/2;


        if(toY > fromY-20)
        {
            // "falschrum"

            var dist=(Math.max(fromY,toY)-Math.min(fromY,toY));
            var distX=(Math.max(fromY,toY)-Math.min(fromY,toY));

            cp1Y-=(dist*0.75+40);
            cp2Y+=(dist*0.75+40);

            cp1X+=distX/2;
            cp2X-=distX/2;
        }

        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;

        var str='';
        
        // round for performane
        fromX=Math.round(fromX);
        fromY=Math.round(fromY);
        cp1X=Math.round(cp1X);
        cp1Y=Math.round(cp1Y);
        cp2X=Math.round(cp2X);
        cp2Y=Math.round(cp2Y);
        toX=Math.round(toX);
        toY=Math.round(toY);
        

        if(Math.abs(fromY-toY)<60 && Math.abs(fromX-toX)<60 || fromX==toX || CABLES.UI.userSettings.straightLines)
            str="M "+fromX+" "+fromY+" L "+ toX + " " + toY;
        else
            str="M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
            //  str="M "+fromX+" "+fromY+" L " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;

    perf.finish();

        return str;
    };


    this.isVisible=function()
    {
        return self.linkLine!==null;
    };

    self.hide=function()
    {
        if(!this.isVisible())return;
        this.hideAddButton();
        this._addCircleVisible=false;
        this.linkLine.hide();
    };

    self.show=function()
    {
        // if(this.isVisible())return;
        this.redraw();
        if (this.linkLine)this.linkLine.show();
    };

    this.remove=function()
    {
        self.hide();
        if(port1)port1.updateUI();
        if(port2)port2.updateUI();
        if (this.linkLine) this.linkLine.remove();
        this.linkLine=null;

        for (var i = 0; i < this._addCircles.length; i++)
        {
            this._addCircles[i].remove();
            this._addCircles[i] = null;
        }
    };

    this.redraw = function()
    {
        var perf = CABLES.uiperf.start('link redraw');

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
        this.setElementOrder();

        perf.finish();
    };

    this.setEnabled=function(enabled)
    {
        if(this.linkLine)
            // if(enabled) this.linkLine.attr("opacity", 1.0);
            //     else this.linkLine.attr("opacity", 0.3);
            this.linkLine.attr("opacity", 1.0);
    };

    if(port1)port1.updateUI();
    if(port2)port2.updateUI();
}





CABLES.UI.SVGLine=function(startX, startY)
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
        var str="M "+startX+" "+startY+" L" + endX + " " + endY;

        return str;
    };

    this.thisLine = gui.patch().getPaper().path(this.getPath());
    this.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };

    this.remove=function()
    {
        this.thisLine.remove();
    };
};


CABLES.UI.SVGMultiLine=function(points)
{
    this._endX=points[0];
    this._endY=points[1];
    this._svgLines=[];
    this._points=points;

    this._getPath = function(x,y,x2,y2)
    {
        var str="M "+x+" "+y+" L" + x2 + " " + y2;
        return str;
    };

    for(var i=0;i<points.length/2;i++)
    {
        var l=gui.patch().getPaper().path(this._getPath(points[i*2],points[i*2+1],points[i*2],points[i*2+1] ));
        l.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
        this._svgLines.push( l );
    }
};




CABLES.UI.SVGMultiLine.prototype.updateEnd=function(x,y)
{
    for(var i=0;i<this._svgLines.length;i++)
    {
        this._svgLines[i].attr({"path": this._getPath( this._getPath(this._points[i*2],this._points[i*2+1],x,y ) )});
    }
}

CABLES.UI.SVGMultiLine.prototype.remove=function()
{
    for(var i=0;i<this._svgLines.length;i++)
    {
        this._svgLines[i].remove();
    }
    this._svgLines.length=0;
};

CABLES.UI.SVGMultiLine.prototype.addClass=function(classname)
{
    for(var i=0;i<this._svgLines.length;i++)
        this._svgLines[i].node.classList.add(classname);
}

CABLES.UI.SVGMultiLine.prototype.removeClass=function(classname)
{
    for(var i=0;i<this._svgLines.length;i++)
        this._svgLines[i].node.classList.remove(classname);
}