
var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};

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

    var viewBox={x:0,y:0,w:1100,h:1010};
    var lastMouseMoveEvent=null;

    var rubberBandStartPos=null;
    var rubberBandPos=null;
    var mouseRubberBandStartPos=null;
    var mouseRubberBandPos=null;
    var rubberBandRect=null;
    var isLoading=false;

    this.isLoading=function()
    {
        return isLoading;
    };

    this.getPaper=function()
    {
        return self.paper;
    };

    this.paste=function(e)
    {
        if(e.clipboardData.types.indexOf('text/plain') > -1)
        {
            var str=e.clipboardData.getData('text/plain');

            e.preventDefault();

            var json=JSON.parse(str);

        console.log('paste json',json);
        

            if(json)
            {
                if(json.ops)
                {

                            
                    var i=0,j=0;
                    { // change ids

                        for(i in json.ops)
                        {
                            var searchID=json.ops[i].id;
                            var newID=json.ops[i].id=generateUUID();

                            json.ops[i].uiAttribs.pasted=true;


                            for(j in json.ops)
                            {
                                if(json.ops[j].portsIn)
                                for(var k in json.ops[j].portsIn)
                                {
                                    if(json.ops[j].portsIn[k].links)
                                    {
                                        var l=json.ops[j].portsIn[k].links.length;
                                        while(l--)
                                        {
                                            console.log('json.ops[j].portsIn[k].links[l]',json.ops[j].portsIn[k].links[l]);
                                                    
                                            if(json.ops[j].portsIn[k].links[l]===null)
                                            {
                                                        console.log('delete null link');
                                                        
                                                json.ops[j].portsIn[k].links.splice(l,1);
                                            }
                                            
                                        }

                                        
                                        for(var l in json.ops[j].portsIn[k].links)
                                        {
                                            if(json.ops[j].portsIn[k].links[l].objIn==searchID) json.ops[j].portsIn[k].links[l].objIn=newID;
                                            if(json.ops[j].portsIn[k].links[l].objOut==searchID) json.ops[j].portsIn[k].links[l].objOut=newID;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    { // set correct subpatch

                        var fixedSubPatches=[];
                        for(i=0;i<json.ops.length;i++)
                        {

                            if(json.ops[i].objName=='Ops.Ui.Patch')
                            {

                                for(var k in json.ops[i].portsIn)
                                {
                                    if(json.ops[i].portsIn[k].name=='patchId')
                                    {
                                        var oldSubPatchId=parseInt(json.ops[i].portsIn[k].value,10);
                                        var newSubPatchId=json.ops[i].portsIn[k].value=Ops.Ui.Patch.maxPatchId+1;
        
                                        console.log('oldSubPatchId',oldSubPatchId);
                                        console.log('newSubPatchId',newSubPatchId);

                                        for(j=0;j<json.ops.length;j++)
                                        {
                                            console.log('json.ops[j].uiAttribs.subPatch',json.ops[j].uiAttribs.subPatch);
                                                    
                                            if(parseInt(json.ops[j].uiAttribs.subPatch,10)==oldSubPatchId)
                                            {
                                                console.log('found child patch');
                                                        
                                                json.ops[j].uiAttribs.subPatch=newSubPatchId;
                                                fixedSubPatches.push(json.ops[j].id);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        for(i in json.ops)
                        {
                            var found=false;
                            for(j=0;j<fixedSubPatches.length;j++)
                            {
                                if(json.ops[i].id==fixedSubPatches[j])
                                {
                                    found=true;
                                    break;
                                }
                            }
                            if(!found)
                            {
                                json.ops[i].uiAttribs.subPatch=currentSubPatch;
                            }
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

                                var mouseX=0,
                                    mouseY=0;
                                if(lastMouseMoveEvent)
                                {
                                    mouseX=gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).x;
                                    mouseY=gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).y;
                                }

                                json.ops[i].uiAttribs.translate.x=json.ops[i].uiAttribs.translate.x+mouseX-minx;
                                json.ops[i].uiAttribs.translate.y=json.ops[i].uiAttribs.translate.y+mouseY-miny;
                            }
                        }
                    }

                    CABLES.UI.setStatusText('pasted '+json.ops.length+' ops...');
                    self.setSelectedOp(null);
                    gui.patch().scene.deSerialize(json);


                    // setTimeout(function()
                    // {
                    //     for(i in json.ops)
                    //     {
                    //         console.log('json.ops[i].id',json.ops[i].id);

                    //         self.addSelectedOpById(json.ops[i].id);
                    //     }
                    // },500);





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
    };

    this.copy=function(e)
    {
        var ops=[];
        var opIds=[];
        var j=0,i=0,k=0,l=0;
        for(i in selectedOps)
        {
            ops.push( selectedOps[i].op.getSerialized() );
            opIds.push(selectedOps[i].op.id);
        }


        // remove links that are not fully copied...
        for(i=0;i<ops.length;i++)
        {
            for( j=0;j<ops[i].portsIn.length;j++)
            {
                if(ops[i].portsIn[j].links)
                {
                    k=ops[i].portsIn[j].links.length;
                    while(k--)
                    {
                        if(ops[i].portsIn[j].links[k] && ops[i].portsIn[j].links[k].objIn && ops[i].portsIn[j].links[k].objOut)
                        {
                            if(!arrayContains(opIds,ops[i].portsIn[j].links[k].objIn) || !arrayContains(opIds,ops[i].portsIn[j].links[k].objOut))
                            {
                                ops[i].portsIn[j].links[k]=null;
                            }
                        }
                    }
                }
            }
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

            case 71: // g show graphs
                // self.setCurrentSubPatch(0);
                self.showSelectedOpsGraphs();
            break;


            case 49: // / - test
                self.setCurrentSubPatch(0);
            break;

            default:
                // console.log('key ',e.which);
            break;

        }
    });
    

    this.exportStatic=function()
    {
        CABLES.UI.MODAL.showLoading('exporting project');

        CABLES.api.get(
            'project/'+currentProject._id+'/export',
            function(r)
            {
                var msg='';

                if(r.error)
                {
                    msg="<h2>export error</h2>";
                    msg+='<div class="shaderErrorCode">'+JSON.stringify(r)+'<div>';
                }
                else
                {
                    msg="<h2>export finished</h2>";
                    msg+='size: '+r.size+' mb';
                    msg+='<br/><br/><br/>';
                    msg+='<a class="bluebutton" href="'+r.path+'">download</a>';
                    msg+='<br/><br/>';
                    msg+='<pre>'+r.log+'<pre>';
                }

                CABLES.UI.MODAL.show(msg);
            });
        
    };

    this.saveCurrentProject=function(cb,_id,_name)
    {
        if(this.loadingError)
        {
            CABLES.UI.MODAL.showError('project not saved','could not save project: had errors while loading!');
            return;
        }

        CABLES.UI.MODAL.showLoading('saving project');

        gui.patch().scene.cgl.doScreenshot=true;
    
        var id=currentProject._id;
        var name=currentProject.name;
        if(_id)id=_id;
        if(_name)name=_name;

        setTimeout(function()
        {
            var data=gui.patch().scene.serialize(true);

            data.ui={viewBox:{}};
            data.ui.viewBox.w=viewBox.w;
            data.ui.viewBox.h=viewBox.h;
            data.ui.viewBox.x=viewBox.x;
            data.ui.viewBox.y=viewBox.y;

            data.ui.renderer={};
            data.ui.renderer.w=gui.rendererWidth;
            data.ui.renderer.h=gui.rendererHeight;

            data=JSON.stringify(data);
            console.log('data.length',data.length);
                    

            CABLES.api.put(
                'project/'+id,
                {
                    "name":name,
                    "data":data,
                    "screenshot":gui.patch().scene.cgl.screenShotDataURL
                },
                function(r)
                {
                    if(r.success===true) CABLES.UI.setStatusText('project saved');
                    else CABLES.UI.setStatusText('project NOT saved');

                    CABLES.UI.MODAL.hide();
                    if(cb)cb();
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

    this.updateViewBox=function()
    {
        if(!isNaN(viewBox.x) && !isNaN(viewBox.y) && !isNaN(viewBox.w) && !isNaN(viewBox.h))
            self.paper.setViewBox( viewBox.x, viewBox.y, viewBox.w, viewBox.h );
    };

    function rubberBandHide()
    {
        mouseRubberBandStartPos=null;
        mouseRubberBandPos=null;
        if(rubberBandRect) rubberBandRect.hide();
    }

    function setStatusSelectedOps()
    {
        var txt='';
        txt+=selectedOps.length+" ops selected / [del] delete ops / [a] align ops / [g] show grapghs ";
        // txt+='<a class="fa fa-line-chart" data-tt="show graphs of all selected ops" onclick="gui.patch().showSelectedOpsGraphs()" ></a>';
        CABLES.UI.setStatusText(txt);
    }

    this.selectAllOpsSubPatch=function(subPatch)
    {
        for(var i in self.ops)
        {
            if(self.ops[i].getSubPatch()==subPatch)
            {
                self.addSelectedOp(self.ops[i]);
                self.ops[i].setSelected(true);
            }
        }
        setStatusSelectedOps();

    };

    this.selectAllOps=function()
    {
        this.selectAllOpsSubPatch(currentSubPatch);
    };

    function rubberBandMove(e)
    {
                


        if(e.buttons==1 && !spacePressed)
        {
            if(!mouseRubberBandStartPos)
            {
                gui.patch().setSelectedOp(null);
                mouseRubberBandStartPos=gui.patch().getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);
            }
            // console.log('rubber!');
                    
            mouseRubberBandPos=gui.patch().getCanvasCoordsMouse(e);//e.offsetX,e.offsetY);

            if(!rubberBandRect) rubberBandRect=self.paper.rect( 0,0,10,10).attr({ });
            rubberBandRect.show();
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
                    "stroke": CABLES.UI.uiConfig.colorRubberBand,
                    "fill": CABLES.UI.uiConfig.colorRubberBand,
                    "stroke-width": 2,
                    "fill-opacity": 0.1
               });

            for(var i in self.ops)
            {
                if(!self.ops[i].isHidden() )
                {


                    var rect=self.ops[i].oprect.getRect();
                    if(rect && rect.matrix)
                    {
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
            }

            if(selectedOps.length===0) CABLES.UI.setStatusText('');
                else setStatusSelectedOps();
        }
    }

    // ---------------------------------------------
    this.loadingError=false;

    this.setProject=function(proj)
    {
        this.loadingError=false;
        if(proj.ui)
        {
            if(proj.ui.viewBox)
            {
                viewBox.x=proj.ui.viewBox.x;
                viewBox.y=proj.ui.viewBox.y;
                viewBox.w=proj.ui.viewBox.w;
                viewBox.h=proj.ui.viewBox.h;
            }

            if(proj.ui.renderer)
            {
                gui.rendererWidth=proj.ui.renderer.w;
                gui.rendererHeight=proj.ui.renderer.h;
                gui.setLayout();
            }
        }
        self.updateViewBox();
        currentSubPatch=0;
        self.setCurrentProject(proj);
        gui.scene().clear();

        gui.scene().deSerialize(proj);
        CABLES.undo.clear();
        if(!this.loadingError) CABLES.UI.MODAL.hide();
        self.updateSubPatches();
    };

    this.show=function(_scene)
    {
        this.scene=_scene;

        $('#timing').append(CABLES.UI.getHandleBarHtml('timeline_controler'),{});
        $('#meta').append();

        this.paper= Raphael("patch",0, 0);
        this.bindScene(self.scene);

        viewBox={x:0,y:0,w:$('#patch svg').width(),h:$('#patch svg').height()};
        self.updateViewBox();

        $('#patch svg').bind("mousewheel", function (event,delta,nbr)
        {
            delta=CGL.getWheelSpeed(event);
                    
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

        var background = self.paper.rect(-99999, -99999, 2*99999, 2*99999).attr({
            fill: CABLES.UI.uiConfig.colorBackground,
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

            if(e.buttons==1 && !spacePressed)
            {
                for(var i in self.ops)
                    if(!self.ops[i].isHidden() && ( self.ops[i].isDragging || self.ops[i].isMouseOver))
                        return;

                rubberBandMove(e);
            }
        });

        $('#patch svg').bind("mouseup", function (event)
        {
            rubberBandHide();
        });
    
        $('#patch svg').bind("mousemove", function (e)
        {
            e=mouseEvent(e);

            if(mouseRubberBandStartPos && e.buttons!=1) rubberBandHide();

            if(e.buttons==2 || e.buttons==3 || (e.buttons==1 && spacePressed))
            {
                var mouseX=gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).x;
                var mouseY=gui.patch().getCanvasCoordsMouse(lastMouseMoveEvent).y;

                viewBox.x+=mouseX-gui.patch().getCanvasCoordsMouse(e).x;//.offsetX,e.offsetY).x;
                viewBox.y+=mouseY-gui.patch().getCanvasCoordsMouse(e).y;//e.offsetX,e.offsetY).y;

                self.updateViewBox();
            }

            lastMouseMoveEvent=e;

        });

        this.timeLine=new CABLES.TL.UI.TimeLineUI();

        gui.setLayout();
    };

    function doLink()
    {

    }

    function doAddOp(uiOp)
    {
        var op=uiOp.op;

        if(!isLoading)
        {
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
        }

        op.onAddPort=function(p)
        {
            uiOp.addPort(p.direction,p);
            uiOp.setPos(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
        };


        if(op.uiAttribs && op.uiAttribs.subPatch)
        {
            if(op.uiAttribs.subPatch!=currentSubPatch) uiOp.hide();
        }


        for(var i in op.portsIn)
        {
            var p=op.portsIn[i];

            if(!p.uiAttribs )p.uiAttribs={};

            if(p.uiAttribs.display!='readonly')
                uiOp.addPort(PORT_DIR_IN,p);

    
            if(p.uiAttribs.hasOwnProperty('display'))
            {
                if(p.uiAttribs.display=='dropdown') p.uiAttribs.type='string';
                if(p.uiAttribs.display=='file') p.uiAttribs.type='string';
                if(p.uiAttribs.display=='bool') p.uiAttribs.type='bool';
            }

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
            if(CABLES.UI.OPSELECT.newOpPos.y===0 && CABLES.UI.OPSELECT.newOpPos.x===0) op.uiAttribs.translate={x:viewBox.x+viewBox.w/2,y:viewBox.y+viewBox.h/2};
                else op.uiAttribs.translate={x:CABLES.UI.OPSELECT.newOpPos.x,y:CABLES.UI.OPSELECT.newOpPos.y};
        }


        if(op.uiAttribs.hasOwnProperty('translate'))
        {
            uiOp.setPos(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
            // uiOp.oprect.getRect().getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
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

        uiOp.setPos();

        if(!isLoading)
        {
            setTimeout(function()
            {
                if(currentSubPatch==uiOp.getSubPatch()) uiOp.show();
                gui.patch().setSelectedOp(null);
                gui.patch().setSelectedOp(uiOp);
                gui.patch().showOpParams(op);
            },30);
        }


        // select ops after pasting...
        setTimeout(function()
        {
            if(uiOp.op.uiAttribs.pasted)
            {
                delete uiOp.op.uiAttribs.pasted;
                gui.patch().addSelectedOpById(uiOp.op.id);
                uiOp.setSelected(true);
                setStatusSelectedOps();
            }
        } ,30);

        uiOp.wasAdded=true;
    }

    this.bindScene=function(scene)
    {
        scene.onLoadStart=function()
        {
            isLoading=true;
        };
        scene.onLoadEnd=function()
        {
            isLoading=false;
            self.setCurrentSubPatch(currentSubPatch);
            self.showProjectParams();
        };

        scene.onUnLink=function(p1,p2)
        {
            self.updateCurrentOpParams();
            // console.log('on unlink');

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

            if(!uiPort1.opUi.isHidden())
            {
                thelink.show();
            }

            self.updateCurrentOpParams();

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
            var uiOp=new OpUi(self.paper,op,CABLES.UI.OPSELECT.newOpPos.x,CABLES.UI.OPSELECT.newOpPos.y, 100, 31, op.name);
            self.ops.push(uiOp);
            uiOp.wasAdded=false;

            doAddOp(uiOp);
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
        if(currentOp) this.setOpTitle(currentOp,t);
    };

    this.updateSubPatches=function()
    {
        if(isLoading)return;
        for(var i in self.ops)
        {
            if(!self.ops[i].op.uiAttribs.subPatch)self.ops[i].op.uiAttribs.subPatch=0;

            if(self.ops[i].op.uiAttribs.subPatch==currentSubPatch)
            {
                self.ops[i].show();
            }
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


    this.showSelectedOpsGraphs=function()
    {
        gui.timeLine().clear();

        var doShow=true;
        var count=0;
        if(selectedOps.length>0)
        {
            for(var j=0;j<selectedOps.length;j++)
            {
                for(var i=0;i<selectedOps[j].portsIn.length;i++)
                {
                    if(selectedOps[j].portsIn[i].thePort.isAnimated() && selectedOps[j].portsIn[i].thePort.anim)
                    {
                        if(count===0)
                        {
                            doShow=!selectedOps[j].portsIn[i].thePort.anim.stayInTimeline;
                        }

                        selectedOps[j].portsIn[i].thePort.anim.stayInTimeline=doShow;
                        self.timeLine.setAnim(selectedOps[j].portsIn[i].thePort.anim);
                        count++;
                    }
                }
            }
        }
        if(!doShow)
            gui.timeLine().clear();


    };


    this.alignSelectedOpsVert=function()
    {
        if(selectedOps.length>0)
        {
            var j=0;
            var sum=0;
            for(j in selectedOps) sum+=selectedOps[j].op.uiAttribs.translate.x;

            var avg=sum/selectedOps.length;

            for(j in selectedOps) selectedOps[j].setPos(avg,selectedOps[j].op.uiAttribs.translate.y);
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

    
    this.deleteSelectedOps=function()
    {
        for(var i in selectedOps)
            gui.patch().scene.deleteOp( selectedOps[i].op.id,true);
    };

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

    this.setSelectedOpById=function(id)
    {
        for(var i in gui.patch().ops)
        {
            if(gui.patch().ops[i].op.id==id)
            {
                gui.patch().setSelectedOp(null);
                gui.patch().setSelectedOp(gui.patch().ops[i]);
                gui.patch().showOpParams(gui.patch().ops[i].op);
                return;
            }
        }
    };

    this.addSelectedOpById=function(id)
    {
        for(var i in gui.patch().ops)
        {
            if(gui.patch().ops[i].op.id==id)
            {
                self.addSelectedOp(gui.patch().ops[i]);
                console.log('found sel op by id !');

                return;
            }
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

        self.addSelectedOp(uiop);
        // selectedOps.push(uiop);
        uiop.setSelected(true);

        // gui.showOpDoc(uiop.op.objName);
    };

    this.addSelectedOp=function(uiop)
    {
        if(uiop.op.objName=='Ops.Ui.Patch')
            self.selectAllOpsSubPatch(uiop.op.patchId.val);

        uiop.oprect.setSelected(true);
        for(var i in selectedOps) if(selectedOps[i]==uiop)return;
        selectedOps.push(uiop);
    };

    this.moveSelectedOpsFinished=function()
    {
        for(var i in selectedOps)
            selectedOps[i].doMoveFinished();
    };

    this.moveSelectedOps=function(dx,dy,a,b,e)
    {
        for(var i in selectedOps)
            selectedOps[i].doMove(dx,dy,a,b,e);
    };

    this.updateOpParams=function(id)
    {
        self.showOpParams(gui.scene().getOpById(id));
    };

    this.showProjectParams=function()
    {
        var s={};

        s.name=currentProject.name;
        s.settings=gui.scene().settings;

        var numVisibleOps=0;
        for(var i in self.ops)
        {
            if(!self.ops[i].isHidden())numVisibleOps++;
        }

        var html = CABLES.UI.getHandleBarHtml('params_project',{project: s,descr:currentProject.descriptionHTML,
            debug:
            {
                numOps:gui.scene().ops.length,
                numVisibleOps:numVisibleOps,
                numSvgElements: $('#patch svg *').length,
            }
            
        });
        

        $('#options').html(html);
    };

    this.saveProjectParams=function()
    {
        var proj_name=$('#projectsettings_name').val();
        var proj_public=$('#projectsettings_public').val();

        currentProject.name=proj_name;
        gui.scene().settings=gui.scene().settings || {};
        gui.scene().settings.isPublic=proj_public;
        self.saveCurrentProject();
    };

    function updateUiAttribs()
    {
        if(!currentOp.op.uiAttribs.warning || currentOp.op.uiAttribs.warning.length===0)
        {
            $('#options_warning').hide();
        }
        else
        {
            $('#options_warning').show();
            $('#options_warning').html(currentOp.op.uiAttribs.warning);
        }

        if(!currentOp.op.uiAttribs.info) $('#options_info').hide();
        else
        {
            $('#options_info').show();
            $('#options_info').html(currentOp.op.uiAttribs.info);
        }
    }

    this.updateCurrentOpParams=function()
    {
        if(currentOp)self.showOpParams(currentOp.op);
    };

    this.showOpParams=function(op)
    {

        if(gui.user.isAdmin && gui.serverOps.isServerOp(op.objName))
        {
            op.isServerOp=true;
        }


        if(currentOp)currentOp.onUiAttrChange=null;
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

        for(var iops in this.ops)
            if(this.ops[iops].op==op)
                currentOp=this.ops[iops];

        currentOp.op.onUiAttrChange=updateUiAttribs;

        watchPorts=[];
        watchAnimPorts=[];
        watchColorPicker=[];

        var html = CABLES.UI.getHandleBarHtml('params_op_head',{op: op});
        var sourcePort = $("#params_port").html();
        var templatePort = Handlebars.compile(sourcePort);

        if(op.portsIn.length>0)
        {
            html += CABLES.UI.getHandleBarHtml('params_ports_head',{title:'in',});

            for(var i in op.portsIn)
            {
                op.portsIn[i].watchId='in_'+i;
                watchAnimPorts.push(op.portsIn[i]);

                if(op.portsIn[i].uiAttribs.colorPick) watchColorPicker.push(op.portsIn[i]);
                if(op.portsIn[i].isLinked() || op.portsIn[i].isAnimated()) watchPorts.push(op.portsIn[i]);

                html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true,op:op } );
            }
        }

        if(op.portsOut.length>0)
        {
            html += CABLES.UI.getHandleBarHtml('params_ports_head',{title:'out',op: op});

            for(var i2 in op.portsOut)
            {
                if(op.portsOut[i2].getType()==OP_PORT_TYPE_VALUE)
                {
                    op.portsOut[i2].watchId='out_'+i2;
                    watchPorts.push(op.portsOut[i2]);
                }

                html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false,op: op } );
            }
        }

        html += CABLES.UI.getHandleBarHtml('params_op_foot',{op: op});

        $('#options').html(html);
        updateUiAttribs();

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
                if(op.portsIn[index].isAnimated()) $('#portanim_in_'+index).addClass('timingbutton_active');
                if(op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) $('#portgraph_in_'+index).addClass('timingbutton_active');

                $('#portCreateOp_in_'+index).on('click',function(e)
                {
                    var thePort=op.portsIn[index];
                    if(thePort.type==OP_PORT_TYPE_TEXTURE)
                    {
                        var newop=gui.scene().addOp('Ops.Gl.Texture');
                        
                        gui.scene().link(op,thePort.name,newop,newop.getFistOutPortByType(thePort.type).name );

                    }

                });

                $('#portedit_in_'+index).on('click',function(e)
                {
                    var thePort=op.portsIn[index];

                    console.log('thePort.uiAttribs.editorSyntax',thePort.uiAttribs.editorSyntax);

                    gui.showEditor();
                    gui.editor().addTab({
                        content:op.portsIn[index].get(),
                        title:''+op.portsIn[index].name,
                        syntax:thePort.uiAttribs.editorSyntax,
                        onSave:function(setStatus,content)
                        {
                            setStatus('value set');
                            thePort.set(content);
                        }
                    });
                    console.log('edit clicked...ja...');
                    
                            
                });

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
                    if( $('#portanim_in_'+index).hasClass('timingbutton_active') )
                    {
                        
                        var val=self.timeLine.removeAnim(op.portsIn[index].anim);
                        op.portsIn[index].setAnimated(false);

                        self.timeLine.setAnim(null);
                        // op.portsIn[index].anim=null;
                        $('#portanim_in_'+index).removeClass('timingbutton_active');
                        $('#portval_'+index).val(val);
                        $('#portval_'+index).trigger('input');
                        $('#portval_'+index).focus();
                        return;
                    }

                    $('#portanim_in_'+index).addClass('timingbutton_active');

                    op.portsIn[index].toggleAnim();
                    self.timeLine.setAnim(op.portsIn[index].anim,{name:op.portsIn[index].name,defaultValue:parseFloat( $('#portval_'+index).val())} );
                });
            })(ipi);
        }

        for(var ipip in op.portsIn)
        {
            (function (index)
            {
                $('#portdelete_in_'+index).on('click',function(e)
                {
                    op.portsIn[index].removeLinks();
                    self.showOpParams(op);
                });
            })(ipip);
        }

        for(var ipii in op.portsIn)
        {
            (function (index)
            {
                $('#portval_'+index).on('input',function(e)
                {
                    var v=''+$('#portval_'+index).val();

                    if(!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type=='number')
                    {
                        if(isNaN(v) || v==='' )
                        {
                            $('#portval_'+index).addClass('invalid');
                            return;
                        }
                        else
                        {
                            $('#portval_'+index).removeClass('invalid');
                        }
                    }
                    if(op.portsIn[index].uiAttribs.type=='int')
                    {
                        if(isNaN(v) || v==='' )
                        {
                            $('#portval_'+index).addClass('invalid');
                            return;
                        }
                        else
                        {
                            $('#portval_'+index).removeClass('invalid');
                            v=parseInt(v,10);
                        }

                    }
                    if(op.portsIn[index].uiAttribs.display=='bool')
                    {
                        if(v!='true' && v!='false' )
                        {
                            v=false;
                            $('#portval_'+index).val('false');
                        }
                        if(v=='true')v=true;
                        else v=false;
                    }
                            
                    op.portsIn[index].val=v;
                    if(op.portsIn[index].isAnimated())
                        {
                                    console.log('is animatedddd');
                                    
                            gui.timeLine().scaleHeightDelayed();
                        }
                });
            })(ipii);
        }

        for(var iwap in watchAnimPorts)
        {
            var thePort=watchAnimPorts[iwap];
            (function (thePort)
            {
                var id='.watchPortValue_'+thePort.watchId;

                $(id).on("focusin", function()
                {
                    if(thePort.isAnimated() )gui.timeLine().setAnim(thePort.anim,{name:thePort.name});
                });

            })(thePort);
        }

        for(var iwcp in watchColorPicker)
        {
            var thePort=watchColorPicker[iwcp];
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
            if(watchPorts[i].isAnimated() )
            {
                if( $(id).val()!=watchPorts[i].val ) $(id).val( watchPorts[i].val );
            }
            else
            {
                $(id).html( watchPorts[i].val );
            }
        }

        if(CABLES.UI.uiConfig.watchValuesInterval>0) setTimeout( doWatchPorts,CABLES.UI.uiConfig.watchValuesInterval);
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
        var op;
        if(suffix=='.obj')
        {
            op=gui.scene().addOp('Ops.Gl.Meshes.ObjMesh',uiAttr);
            op.getPort('file').val=url;
        }
        else
        if(suffix=='.png' || suffix=='.jpg')
        {
            op=gui.scene().addOp('Ops.Gl.Texture',uiAttr);
            op.getPort('file').val=url;
        }
        else
        if(suffix=='.mp3' || suffix=='.ogg')
        {
            op=gui.scene().addOp('Ops.WebAudio.AudioPlayer',uiAttr);
            op.getPort('file').val=url;
        }
        else
        {
            CABLES.UI.setStatusText('unknown file type');
        }
    };


    this.onUploadFile=function(fn)
    {
        console.log('file uploaded:',fn);
        for(var i=0;i<this.ops.length;i++)
        {
            if(this.ops[i].op.onFileUploaded)this.ops[i].op.onFileUploaded(fn);
        }
    };

    doWatchPorts();

};

