
document.addEventListener("DOMContentLoaded", function(event)
{
    var scene=new Scene();
    ui=new HOLO.Ui();
    ui.show(scene);


    
});

// --------------------------------

var uiConfig=
{
    portSize:10,
    portPadding:2,

    colorLink:'#fff',
    colorLinkHover:'#00f',
    colorLinkInvalid:'#f00',
    colorOpBg:'#fff',
    colorPort:'#6c9fde',
    colorPortHover:'#f00'
};

function getPortColor(type)
{
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else return '#6c9fde';
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


    this.getPath = function()
    {

        if(!port2.attrs)return '';
        if(!port1.attrs)return '';

        var fromX=port1.matrix.e+port1.attrs.x+uiConfig.portSize/2;
        var fromY=port1.matrix.f+port1.attrs.y;
        var toX=port2.matrix.e+port2.attrs.x+uiConfig.portSize/2;
        var toY=port2.matrix.f+port2.attrs.y;

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
        var that=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];

        this.remove=function()
        {

            this.oprect.getGroup().remove();
            this.oprect.remove();
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

            if(!that.op.uiAttribs)that.op.uiAttribs={};
            that.op.uiAttribs.translate={x:that.oprect.matrix.e,y:that.oprect.matrix.f};

                   
                        
            for(var j in that.links)
            {
                that.links[j].redraw();
            }

        },
        up = function ()
        {

        };


        this.oprect=r.OpRect(x,y,w,h, txt).drag(move, dragger, up);

        this.oprect.node.onclick = function ()
        {
            ui.showOpParams(that.op);
        };

        var PortDrag = function ()
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
        PortUp = function ()
        {
            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                var link=ui.scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                that.links.push(thelink);
            }
            else
            {
                console.log('endport nonono');
                        
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
            port.op=that.op;
            port.opUi=that;

            port.portIndex=portIndex;
            var thePort;
            if(inout=='out') thePort=that.op.portsOut[portIndex];
            else thePort=that.op.portsIn[portIndex];

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

            if(inout=='out') this.portsOut.push(port);
                else this.portsIn.push(port);
        };

    };


var HOLO=
{
    Ui:function()
    {
        var self=this;
        this.ops=[];
        this.scene=null;







        this.setLayout=function()
        {
            var statusBarHeight=20;
            var menubarHeight=30;
            var optionsWidth=360;
            var rendererWidth=640;
            var rendererHeight=360;

            $('svg').css('height',window.innerHeight-statusBarHeight-menubarHeight);
            $('svg').css('width',window.innerWidth-rendererWidth);
            $('svg').css('top',menubarHeight);
            
            $('#options').css('left',window.innerWidth-rendererWidth+1);
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

        this.addOpList=function(val,parentname)
        {
        
            if (Object.prototype.toString.call(val) === '[object Object]')
            {
                for (var propertyName in val)
                {
                    if (val.hasOwnProperty(propertyName))
                    {
                        var html='';
                        var opname='Ops.'+ parentname + propertyName + '';

                        var isFunction=false;
                        if(eval('typeof('+opname+')')=="function") isFunction=true;

                        if(isFunction)html+='<a onclick="ui.scene.addOp(\''+opname+'\',{})">&nbsp;';
                        html+='Ops.'+parentname + propertyName +'';
                        if(isFunction)html+='&nbsp;</a>';
                        html+='<br/>';
                        $('#meta').append(html);
                        
                        
                        found=this.addOpList(val[propertyName],parentname+propertyName+'.');
                    }
                }
            }

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

            router.start();
        };

        this.show=function(_scene)
        {
            this.scene=_scene;
            

            $('#meta').append(getHandleBarHtml('timeline_controler'),{});
            $('#meta').append();

            $('#meta').append('Examples:<br/>');
            for(var example in examples)
            {
                var html='';
                html+='<a href="#/example/'+example+'">'+examples[example].title+'</a><br/>';
                $('#meta').append(html);
            }


            $('#meta').append('<br/><br/>Ops:<br/>');
            this.addOpList(Ops,'');
            r= Raphael(0, 0, 640, 480);
            $('svg').bind( "dblclick", function()
            {

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


                // self.showOptionsScene();
            });

            // var zpd = new RaphaelZPD(r, { zoom: true, pan: true, drag: true });
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

                    for(var j in self.ops[i].links)
                    {
                                
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
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
                        self.ops[i].remove();
                        self.ops.splice( i, 1 );
                    }
                }
            };

            scene.onAdd=function(op)
            {
                var uiOp=new OpUi(0, 0, 100, 30, op.name);
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

            };
        };




        this.closeModal=function()
        {
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

            var html = getHandleBarHtml('params_op_head',{op: op});

            var sourcePort = $("#params_port").html();
            var templatePort = Handlebars.compile(sourcePort);

            html += getHandleBarHtml('params_ports_head',{title:'in'});

            for(var i in op.portsIn)
            {
                html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
            }

            html += getHandleBarHtml('params_ports_head',{title:'out'});

            for(var i2 in op.portsOut)
            {
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





    }

};

