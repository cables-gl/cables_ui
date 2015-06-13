var CABLES=CABLES || {};

document.addEventListener("DOMContentLoaded", function(event)
{

    // window.onerror = function(message, url, lineNumber)
    // {
    //     console.error(message);
    //     alert('error: '+JSON.stringify(message)+'\n'+url+'\nline:'+lineNumber);
    //     return true;
    // };

            $(document).bind("contextmenu", function(e)
            {
                // if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();
                // e.cancelBubble = false;
            });



    var scene=new Scene();
    ui=new CABLES.Ui();
    ui.show(scene);
});

// --------------------------------



var uiConfig=
{
    portSize:10,
    portPadding:2,

    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#f00',
    colorOpBg:'#fff',
    colorPort:'#6c9fde',
    colorPortHover:'#f00',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:800,h:480},{w:0,h:0}]
};

function getPortColor(type)
{
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
    else if(type==OP_PORT_TYPE_TEXTURE)  return '#26a92a';
    else return '#c6c6c6';
}

var r;
var selectedEndPort=null;


function setStatusText(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
}


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
    this.thisLine.attr({        stroke: uiConfig.colorLink,
        "stroke-width": 1});
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

    this.hideAddButton=function()
    {
        if(addCircle)addCircle.remove();
        addCircle=null;
    };

    this.showAddButton=function()
    {
        if(addCircle===null)
        {
            // addCircle = r.rect(middlePosX,middlePosY, uiConfig.portSize, uiConfig.portSize).attr(

            addCircle = r.circle(middlePosX,middlePosY, uiConfig.portSize*0.74).attr(
            {
                fill: getPortColor(self.p1.thePort.getType() ),
                "stroke-width": 0,
                "fill-opacity": 1,
            });

            addCircle.hover(function ()
            {
                setStatusText('left click: insert op / right click: delete link');
            });


            addCircle.drag(function(){},function(){},function(event)
            {
                if(self.p1!==null)
                {
                    if(event.which==3)
                    {
                        self.p1.thePort.removeLinkTo( self.p2.thePort );
                    }
                    else
                    {
                                console.log('show showOpSelect');
                                
                        ui.showOpSelect(event.offsetX,event.offsetY,null,null,self);
                    }
                }

            });


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
            fromY+=uiConfig.portSize;
        }
        if(fromY > toY)
        {
            toY+=uiConfig.portSize;
        }

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;


        // return "M "+fromX+" "+fromY+" L" + cpX + " " + cpY;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
        // return "M "+fromX+" "+fromY+" L" + toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr(
    {
        "stroke": getPortColor(port1.thePort.type),
        "stroke-width": 2
    });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:getPortColor(self.p1.thePort.type)});
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
    return thePort.getName()+' ('+thePort.val+')'+' ['+thePort.getTypeString()+']';
}

var links=[];
var line;

    Raphael.el.setGroup = function (group) { this.group = group; };
    Raphael.el.getGroup = function () { return this.group; };

    Raphael.fn.OpRect = function (x, y, w, h, text)
    {
        var background = this.rect(x, y, w, h).attr({
            fill: uiConfig.colorOpBg,
            stroke: "#000",
            "stroke-width": 0
        });

        var label = this.text(x+w/2,y+h/2, text);
        var layer = this.rect(x, y, w, h).attr({
            fill: "#ccc",
            "fill-opacity": 0,
            "stroke-opacity": 0,
            cursor: "move"
        });

        var group = this.set();
        group.push(background, label, layer);


        layer.setGroup(group);
        return layer;
    };


    var OpUi=function(x,y,w,h,txt)
    {
        var self=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];

        this.remove=function()
        {
            this.oprect.getGroup().remove();
            this.oprect.remove();
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

        var dragger = function()
        {
          this.group = this.getGroup();

          this.previousDx = 0;
          this.previousDy = 0;
        },
        move = function (dx, dy)
        {
            var txGroup = dx-this.previousDx;
            var tyGroup = dy-this.previousDy;

            this.group.translate(txGroup,tyGroup);
            this.previousDx = dx;
            this.previousDy = dy;

            if(!self.op.uiAttribs)self.op.uiAttribs={};
            self.op.uiAttribs.translate=
            {
                x:self.oprect.matrix.e,
                y:self.oprect.matrix.f
            };

            for(var j in self.links)
            {
                self.links[j].redraw();
            }

        },
        up = function ()
        {

        };


        this.oprect=r.OpRect(x,y,w,h, txt).drag(move, dragger, up);


        this.oprect.node.onmousedown = function ()
        {
            self.showAddButtons();
            ui.setSelectedOp(self);
            ui.showOpParams(self.op);
        };
        
        this.oprect.node.onclick = function ()
        {
        };



        var PortDrag = function (x,y,event)
        {
        
            if(!line)
            {
                this.startx=this.matrix.e+this.attrs.x;
                this.starty=this.matrix.f+this.attrs.y;
            }
        },
        PortMove = function(dx, dy)
        {
            if(!line) line = new Line(this.startx+uiConfig.portSize/2,this.starty+uiConfig.portSize/2, r);
                else line.updateEnd(this.startx+dx,this.starty+dy);

            if(selectedEndPort===null) setStatusText('select a port to link...');
            else
            {
                var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
                if(txt=='can link') setStatusText(  getPortDescription(selectedEndPort.thePort));
                    else setStatusText( txt );
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
                // var otherPort=this.thePort.links[0].portIn;
                // if(otherPort==this.thePort) otherPort=this.thePort.links[0].portOut;

                this.thePort.removeLinks();
                return;
            }

            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                var link=ui.scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                self.links.push(thelink);
            }
            else
            {
                ui.showOpSelect(event.offsetX,event.offsetY,this.op,this.thePort);
            }

            if(line && line.thisLine)line.thisLine.remove();
            line=null;
        };

        this.addPort=function(_inout)
        {
            var yp=0;
            var inout=_inout;
            if(inout=='out') yp=20;

            var portIndex=this.portsIn.length;
            if(inout=='out') portIndex=this.portsOut.length;

            var xpos=x+(uiConfig.portSize+uiConfig.portPadding)*portIndex;
            var ypos=y+yp;

            var port = r.rect(xpos,ypos, uiConfig.portSize, uiConfig.portSize).attr({
            // var port = r.circle(x+(uiConfig.portSize+uiConfig.portPadding)*portIndex,y+yp, uiConfig.portSize/2).attr({
                fill: uiConfig.colorPort,
                "stroke-width": 0
            });


            this.oprect.getGroup().push(port);

            port.direction=inout;
            port.op=self.op;
            port.opUi=self;

            port.portIndex=portIndex;
            var thePort;
            if(inout=='out') thePort=self.op.portsOut[portIndex];
            else thePort=self.op.portsIn[portIndex];

            port.thePort=thePort;
            port.attr({fill:getPortColor(thePort.type)});
            

            port.hover(function ()
            {
                selectedEndPort=this;
                port.toFront();
                port.attr(
                {
                    // fill:uiConfig.colorPortHover,
                    x:xpos-uiConfig.portSize*0.25,
                    y:ypos-uiConfig.portSize*0.25,
                    width:uiConfig.portSize*1.5,
                    height:uiConfig.portSize*1.5,
                    stroke:'#fff',
                    'stroke-width':1,

                });
                
                var statusText='Port: ';

                
                setStatusText(getPortDescription(thePort));

            }, function ()
            {
                selectedEndPort=null;
                port.attr(
                    {
                        fill:getPortColor(this.thePort.type),
                        width:uiConfig.portSize,
                        height:uiConfig.portSize,
                        x:xpos,
                        y:ypos,
                        'stroke-width':0,
                    });

                setStatusText('');
            });

            port.drag(PortMove,PortDrag,PortUp);


            $(port.node).bind("contextmenu", function(e)
            {
                console.log('noyesmaybe');
                if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();
                e.cancelBubble = false;
            });

            if(inout=='out') this.portsOut.push(port);
                else this.portsIn.push(port);
        };

    };
























    CABLES.Ui=function()
    {
        var self=this;
        this.ops=[];
        this.scene=null;
        var rendererSize=0;
        var watchPorts=[];

        var mouseNewOPX=0;
        var mouseNewOPY=0;
        var linkNewOpTo=null;
        var linkNewOpToPort=null;
        var linkNewLink=null;
        var selectedOp=null;

        $(document).keydown(function(e)
        {
            switch(e.which)
            {
                case 46: case 8:

                    if(selectedOp)
                    {
                        ui.scene.deleteOp( selectedOp.op.id,true );
                    }
        
                    if(e.stopPropagation) e.stopPropagation();
                    if(e.preventDefault) e.preventDefault();

                break;
                case 27:

                    if(rendererSize==uiConfig.rendererSizes.length-1)
                    {
                        self.cycleRendererSize();
                    }
                    else
                    if( $('#modalcontent').is(':visible') )
                    {
                        ui.closeModal();
                    }
                    else
                    {
                        ui.showOpSelect(20,20);
                    }

                    
                break;
            }
        });

        this.setLayout=function()
        {
            var statusBarHeight=20;
            var menubarHeight=30;
            var optionsWidth=360;
            var rendererWidth=uiConfig.rendererSizes[rendererSize].w;
            var rendererHeight=uiConfig.rendererSizes[rendererSize].h;

            $('svg').css('height',window.innerHeight-statusBarHeight-menubarHeight);
            $('svg').css('width',window.innerWidth-rendererWidth-2);
            $('svg').css('top',menubarHeight);
            
            $('#options').css('left',window.innerWidth-rendererWidth);
            $('#options').css('top',rendererHeight);
            $('#options').css('width',optionsWidth);
            $('#options').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#meta').css('right',0);
            $('#meta').css('top',rendererHeight);
            $('#meta').css('width',rendererWidth-optionsWidth);
            $('#meta').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#menubar').css('top',0);
            $('#menubar').css('width',window.innerWidth-rendererWidth);
            $('#menubar').css('height',menubarHeight);

            if(uiConfig.rendererSizes[rendererSize].w===0)
            {
                $('#glcanvas').attr('width',window.innerWidth);
                $('#glcanvas').attr('height',window.innerHeight);
                $('#glcanvas').css('z-index',9999);
            }
            else
            {
                $('#glcanvas').attr('width',uiConfig.rendererSizes[rendererSize].w);
                $('#glcanvas').attr('height',uiConfig.rendererSizes[rendererSize].h);
            }

        };


        this.getOpList=function()
        {
            var ops=[];

            function getop(val,parentname)
            {
                if (Object.prototype.toString.call(val) === '[object Object]')
                {
                    for (var propertyName in val)
                    {
                        if (val.hasOwnProperty(propertyName))
                        {
                            var html='';
                            var opname='Ops.'+ parentname + propertyName + '';

                            var isOp=false;
                            if(eval('typeof('+opname+')')=="function") isFunction=true;

                            var op=
                            {
                                isOp:isOp,
                                name:opname,
                                lowercasename:opname.toLowerCase()
                            };
                            ops.push(op);

                            found=getop(val[propertyName],parentname+propertyName+'.');
                        }
                    }
                }
            }

            getop(Ops,'');

            return ops;
        };


        this.setUpRouting=function()
        {
            var router = new Simrou();

            router.addRoute('/').get(function(event, params)
            {

                if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
                {
                    scene.clear();
                    ui.showExample(0);
                }

                self.scene.deSerialize(localStorage.holo);
            });

            router.addRoute('/example/:index').get(function(event, params)
            {
                ui.showExample(params.index);
            });

            router.start('/');
        };

        this.showOpSelect=function(x,y,linkOp,linkPort,link)
        {
            // console.log('starting Port:',linkStartPort);
            linkNewLink=link;
            linkNewOpToPort=linkPort;
            linkNewOpToOp=linkOp;
            mouseNewOPX=x;
            mouseNewOPY=y;
            var html = getHandleBarHtml('op_select',{ops: self.getOpList() });
            self.showModal(html);

            $('#opsearch').focus();
            $('#opsearch').on('input',function(e)
            {
                var searchFor= $('#opsearch').val();

                if(!searchFor)
                    $('#search_style').html('.searchable:{display:block;}');
                else
                    $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
            });

        };

        this.show=function(_scene)
        {
            this.scene=_scene;

            $('#meta').append(getHandleBarHtml('timeline_controler'),{});
            $('#meta').append();

            var html='<div><h2>Examples</h2>';
            for(var example in examples)
            {
                
                html+='<a href="#/example/'+example+'">'+examples[example].title+'</a><br/>';

                
            }
            html+='</div>';
            $('#meta').append(html);

            // ----

            r= Raphael(0, 0, 640, 480);


            var zpd = new RaphaelZPD(r, { zoom: false, pan: true, drag: false });
            this.bindScene(self.scene);

            window.addEventListener( 'resize', this.setLayout, false );

            this.setLayout();
            this.setUpRouting();
        };



        this.showExample=function(which)
        {
            self.scene.clear();
            self.scene.deSerialize(examples[which].src);
        };

        this.bindScene=function(scene)
        {
            scene.onUnLink=function(p1,p2)
            {
                for(var i in self.ops)
                {
                    self.ops[i].removeDeadLinks();

                    for(var j in self.ops[i].links)
                    {
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
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
                var uiPort1=null;
                var uiPort2=null;
                for(var i in self.ops)
                {
                    for(var j in self.ops[i].portsIn)
                    {
                        if(self.ops[i].portsIn[j].thePort==p1) uiPort1=self.ops[i].portsIn[j];
                        if(self.ops[i].portsIn[j].thePort==p2) uiPort2=self.ops[i].portsIn[j];
                        
                    }
                    for(var jo in self.ops[i].portsOut)
                    {
                        if(self.ops[i].portsOut[jo].thePort==p1) uiPort1=self.ops[i].portsOut[jo];
                        if(self.ops[i].portsOut[jo].thePort==p2) uiPort2=self.ops[i].portsOut[jo];
                    }
                }
        
                var thelink=new UiLink(uiPort1,uiPort2);
                uiPort1.opUi.links.push(thelink);
                uiPort2.opUi.links.push(thelink);
            };

            scene.onDelete=function(op)
            {
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
                var uiOp=new OpUi(mouseNewOPX, mouseNewOPY, 100, 30, op.name);
                uiOp.op=op;
                self.ops.push(uiOp);
                
                for(var i in op.portsIn)
                {
                    uiOp.addPort('in');
                }
                for(var i2 in op.portsOut)
                {
                    uiOp.addPort('out');
                }

                if(op.uiAttribs)
                {
                    if(op.uiAttribs.hasOwnProperty('translate'))
                    {
                        uiOp.oprect.getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
                    }
                }

                if(linkNewLink)
                {
                    console.log('add into link...');

                    var op1=linkNewLink.p1.op;
                    var port1=linkNewLink.p1.thePort;
                    var op2=linkNewLink.p2.op;
                    var port2=linkNewLink.p2.thePort;

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
                        ui.scene.link(
                            op,
                            foundPort1.getName(),
                            op1,
                            port1.getName()
                            );

                        ui.scene.link(
                            op,
                            foundPort2.getName(),
                            op2,
                            port2.getName()
                            );
                        
                    }
                    
                            
                }
                else
                if(linkNewOpToPort)
                {
                    var foundPort=op.findFittingPort(linkNewOpToPort);

                    if(foundPort)
                    {
                        var link=ui.scene.link(
                            linkNewOpToOp,
                            linkNewOpToPort.getName(),
                            op,
                            foundPort.getName());
                    }
                }

                linkNewOpToOp=null;
                linkNewLink=null;
                linkNewOpToPort=null;

                mouseNewOPX=0;
                mouseNewOPY=0;
                
                ui.showOpParams(op);
          };
      };

        this.setSelectedOp=function(uiop)
        {
            if(selectedOp)selectedOp.hideAddButtons();
                    
            selectedOp=uiop;
            selectedOp.showAddButtons();
        };

        this.cycleRendererSize=function()
        {
            rendererSize++;
            if(rendererSize>uiConfig.rendererSizes.length-1)rendererSize=0;

            self.setLayout();
        };

        this.closeModal=function()
        {
            mouseNewOPX=0;
            mouseNewOPY=0;

            $('#modalcontent').html('');
            $('#modalcontent').hide();
            $('#modalbg').hide();
        };

        this.showModal=function(content)
        {
            $('#modalcontent').html('<div class="modalclose"><a class="button" onclick="ui.closeModal();">close</a></div>');
            $('#modalcontent').append(content);
            $('#modalcontent').show();
            $('#modalbg').show();
        };

        this.importDialog=function()
        {
            var html='';
            html+='import:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            html+='<br/>';
            html+='<br/>';
            html+='<a class="button" onclick="ui.scene.clear();ui.scene.deSerialize($(\'#serialized\').val());ui.closeModal();">import</a>';
            self.showModal(html);
        };

        this.exportDialog=function()
        {
            var html='';
            html+='export:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            self.showModal(html);
            $('#serialized').val(self.scene.serialize());
        };

        this.updateOpParams=function(id)
        {
            self.showOpParams(self.scene.getOpById(id));
        };

        function getHandleBarHtml(name,obj)
        {
            var source   = $("#"+name).html();
            var template = Handlebars.compile(source);
            var context = obj;
            return template(context);
        }

        this.showOpParams=function(op)
        {
            watchPorts=[];

            var html = getHandleBarHtml('params_op_head',{op: op});

            var sourcePort = $("#params_port").html();
            var templatePort = Handlebars.compile(sourcePort);

            html += getHandleBarHtml('params_ports_head',{title:'in'});

            for(var i in op.portsIn)
            {
                if(op.portsIn[i].isLinked())
                {
                    op.portsIn[i].watchId='in_'+i;
                    watchPorts.push(op.portsIn[i]);
                }

                html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
            }

            html += getHandleBarHtml('params_ports_head',{title:'out'});

            for(var i2 in op.portsOut)
            {
                if(op.portsOut[i2].getType()==OP_PORT_TYPE_VALUE)
                {
                    op.portsOut[i2].watchId='out_'+i2;
                    watchPorts.push(op.portsOut[i2]);
                }

                html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false } );
            }


            html += getHandleBarHtml('params_op_foot',{op: op});


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
                        op.portsIn[index].val=''+$('#portval_'+index).val();
                        // self.showOpParams(op);
                    });
                })(ipii);

            }

        };


        function doWatchPorts()
        {
            for(var i in watchPorts)
            {
                var id='.watchPortValue_'+watchPorts[i].watchId;
                $(id).html( watchPorts[i].val );
            }

            if(uiConfig.watchValuesInterval>0) setTimeout( doWatchPorts,uiConfig.watchValuesInterval);
        }
        doWatchPorts();




    };



