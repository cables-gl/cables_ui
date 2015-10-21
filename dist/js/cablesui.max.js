
var CABLES=CABLES || {};


CABLES.API=function()
{

    function request(method,url,data,cbSuccess,cbError)
    {

        $.ajax(
        {
            method: method,
            url: "/api/"+url,
            data: data
        })
        .done(function(data)
        {
            // console.log( "success "+data );
            if(cbSuccess) cbSuccess(data);
        })
        .fail(function(data)
        {
            if(CABLES && CABLES.UI && CABLES.UI.MODAL)
            {
                if(data.statusText=='NOT_LOGGED_IN')
                {
                    CABLES.UI.MODAL.showError('not logged in','<br/>you are not logged in, so you can not save projects, or upload files. so all will be lost :/<br/><br/><br/><a class="bluebutton" href="/signup">sign up</a> <a class="bluebutton" style="background-color:#222" onclick="CABLES.UI.MODAL.hide()">continue</a> <br/><br/> ');
                }
                else
                {
                    CABLES.UI.MODAL.show('ajax error: '+data.statusText);
                }

            }
        
            if(cbError)cbError(data.responseJSON);
        })
        .always(function()
        {
            // console.log( "complete" );
        });

    }

    this.get=function(url,cb,cbErr)
    {
        request("GET",url,{},cb,cbErr);
    };

    this.post=function(url,data,cb,cbErr)
    {
        request("POST",url,data,cb,cbErr);
    };

    this.delete=function(url,data,cb,cbErr)
    {
        request("DELETE",url,data,cb,cbErr);
    };

    this.put=function(url,data,cb,cbErr)
    {
        request("PUT",url,data,cb,cbErr);
    };



};

if(!CABLES.api) CABLES.api=new CABLES.API();

window.onerror=function(err,file,row)
{
    var str="";
    str+='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
    str+='error:'+err+'<br/>';
    str+='<br/>';
    str+='file: '+file+'<br/>';
    str+='row: '+row+'<br/>';

    CABLES.UI.MODAL.show(str);
};


CABLES.UI=CABLES.UI || {};

CABLES.UI.setStatusText=function(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
};


CABLES.UI.showPreview=function(opid,which,onoff)
{
    var op=gui.scene().getOpById(opid);
    if(!op)
    {
        console.log('opid not found:',opid);
        return;
    }
    var port=op.getPort(which);
    if(!port)
    {
        console.log('port not found:',which);
        return;
    }

    port.doShowPreview(onoff);
    if(!onoff)CGL.Texture.previewTexture=null;
};


CABLES.UI.togglePortValBool=function(which,checkbox)
{
    var bool_value = $('#'+which).val() == 'true';
    bool_value=!bool_value;

    if(bool_value)
    {
        $('#'+checkbox).addClass('fa-check-square-o');
        $('#'+checkbox).removeClass('fa-square-o');
    }
    else
    {
        $('#'+checkbox).addClass('fa-square-o');
        $('#'+checkbox).removeClass('fa-check-square-o');
    }

    $('#'+which).val(bool_value);
    $('#'+which).trigger('input');
};


CABLES.UI.inputIncrement=function(v,dir)
{
    if(v=='true') return 'false';
    if(v=='false') return 'true';

    var val=parseFloat(v);
    var add=0.1;
    // if(val.)
    // if(Math.abs(val)<2) add=0.1;
    //     else if(Math.abs(val)<100) add=1;
    //         else add=10;

    var r=val+add*dir;

    if(isNaN(r))r=0.0;
    else
        r= Math.round(1000*r)/1000;
    return r;
};


function mouseEvent(event)
{
    if(!event.offsetX) event.offsetX = event.layerX;//(event.pageX - $(event.target).offset().left);
    if(!event.offsetY) event.offsetY = event.layerY;//(event.pageY - $(event.target).offset().top);
    return event;
}

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('console', function(context) {
    return console.log(context);
});

Handlebars.registerHelper('compare', function(left_value, operator, right_value, options) {
    var operators, result;

    if (arguments.length < 4) {
        throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
    }

    operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    };

    if ( ! operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+ operator);
    }

    result = operators[operator](left_value, right_value);

    if (result === true) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});



function valueChanger(ele)
{
    var isDown=false;
    var startVal=$('#'+ele).val();
    var el=document.getElementById(ele);

    function keydown(e)
    {
    }

    function down(e)
    {
        isDown=true;
        document.addEventListener('pointerlockchange', lockChange, false);
        document.addEventListener('mozpointerlockchange', lockChange, false);
        document.addEventListener('webkitpointerlockchange', lockChange, false);

        document.addEventListener('keydown', keydown, false);

        el.requestPointerLock = el.requestPointerLock ||
                                    el.mozRequestPointerLock ||
                                    el.webkitRequestPointerLock;
        el.requestPointerLock();
    }

    function up(e)
    {
        isDown=false;
        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);
        document.removeEventListener('keydown', keydown, false);
        document.exitPointerLock();

        $( document ).unbind( "mouseup", up );
        $( document ).unbind( "mousedown", down );

        document.removeEventListener("mousemove", move, false);
    }

    function move(e)
    {
        var v=parseFloat( $('#'+ele).val() ,10);
        var inc=e.movementY*-0.5;
        if(e.shiftKey || e.which==3)inc*=0.005;
        
        v+=inc;

        $('#'+ele).val(v);
        $('#'+ele).trigger('input');
    }

     function lockChange(e)
     {
        if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        {
            document.addEventListener("mousemove", move, false);
        }
        else
        {
            //propably cancled by escape key / reset value
            $('#'+ele).val(startVal);
            $('#'+ele).trigger('input');
            up();
        }
        
    }

    $( document ).bind( "mouseup", up );
    $( document ).bind( "mousedown", down );

}

//http://html5doctor.com/drag-and-drop-to-server/


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.MODAL=CABLES.UI.MODAL || {};

CABLES.UI.MODAL.hide=function()
{
    mouseNewOPX=0;
    mouseNewOPY=0;

    $('#modalcontent').html('');
    $('#modalcontent').hide();
    $('#modalbg').hide();
    $('.tooltip').hide();
    
};

CABLES.UI.MODAL.show=function(content)
{
    $('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide();"></a></div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide();
    });
};


CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div style="text-align:center;"><h3>'+title+'</h3><i class="fa fa-4x fa-cog fa-spin"></i><br/><br/><div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();
};

CABLES.UI.MODAL.showError=function(title,content)
{

$('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide();"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;'+title+'</h2>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide();
    });
};


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OPSELECT=CABLES.UI.OPSELECT || {};

CABLES.UI.OPSELECT.linkNewLink=null;
CABLES.UI.OPSELECT.linkNewOpToPort=null;
CABLES.UI.OPSELECT.linkNewOpToOp=null;
CABLES.UI.OPSELECT.newOpPos={x:0,y:0};

CABLES.UI.OPSELECT.showOpSelect=function(pos,linkOp,linkPort,link)
{
    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=pos;

    var html = CABLES.UI.getHandleBarHtml('op_select',{ops: CABLES.UI.OPSELECT.getOpList() });
    CABLES.UI.MODAL.show(html);

    $('#opsearch').focus();
    $('#opsearch').on('input',function(e)
    {
        var searchFor= $('#opsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
    });


    $( ".searchresult:first" ).addClass( "selected" );

    var displayBoxIndex=0;
    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = 0;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";
        oBoxCollectionAll.removeClass(cssClass);

        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);
    };

    function onInput(e)
    {
        // $(".searchresult:visible").first().addClass( "selected" );
        displayBoxIndex=0;
        Navigate(0);
    }

    $('#opsearch').on('input',onInput);

    $('#opsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var opname=$('.selected').data('opname');
                gui.scene().addOp(opname);
                CABLES.UI.MODAL.hide();
            break;

            case 8:
                onInput();
                return true;
            break;

            case 37: // left
            break;

            case 38: // up
                $('.selected').removeClass('selected');
                Navigate(-1);
            break;

            case 39: // right
            break;

            case 40: // down
                $('.selected').removeClass('selected');
                Navigate(1);
            break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });

    setTimeout(function(){$('#opsearch').focus();},100);

};

CABLES.UI.OPSELECT.getOpList=function()
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
                    var isFunction=false;
                    if(eval('typeof('+opname+')')=="function") isFunction=true;

                    if(isFunction)
                    {
                        var op=
                        {
                            isOp:isOp,
                            name:opname,
                            lowercasename:opname.toLowerCase()
                        };
                        ops.push(op);
                    }

                    found=getop(val[propertyName],parentname+propertyName+'.');
                }
            }
        }
    }

    getop(Ops,'');

    ops.sort(function(a, b)
    {
        return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
    });


    return ops;
};





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
                    console.log('rubber!');
                    
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

    this.setProject=function(proj)
    {
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
        CABLES.UI.MODAL.hide();
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
            delta=CABLES.UI.getWheelSpeed(event);
                    // console.log('delta',delta);
                    
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


        // select ops after pasing...
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
        };

        scene.onUnLink=function(p1,p2)
        {
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

    this.showProjectParams=function(op)
    {
        var s={};

        s.name=currentProject.name;
        s.settings=gui.scene().settings;

        var numVisibleOps=0;
        for(var i in self.ops)
        {
            if(!self.ops[i].isHidden())numVisibleOps++;
        }

        var html = CABLES.UI.getHandleBarHtml('params_project',{project: s,
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

    this.showOpParams=function(op)
    {

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

        html += CABLES.UI.getHandleBarHtml('params_ports_head',{title:'in',});

        for(var i in op.portsIn)
        {
            op.portsIn[i].watchId='in_'+i;
            watchAnimPorts.push(op.portsIn[i]);

            if(op.portsIn[i].uiAttribs.colorPick) watchColorPicker.push(op.portsIn[i]);
            if(op.portsIn[i].isLinked() || op.portsIn[i].isAnimated()) watchPorts.push(op.portsIn[i]);

            html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true,op:op } );
        }

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

    doWatchPorts();

};


var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};

function getPortOpacity(port)
{
    if(!port)return;
    if(port.direction==PORT_DIR_IN && (port.isAnimated() || port.isLinked() ))return 1.0;
    return 0.6;
}

function getPortDescription(thePort)
{
    var str='<b>'+thePort.getName()+'</b>';
    str+=' ['+thePort.getTypeString()+']';
    if(thePort.isLinked() )str+=' press right mouse button to unlink port';
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
                "stroke-opacity": 1,
                "stroke-width": 1
            });
    };

    this.showAddButton=function()
    {
        if(!this.isVisible())return;

        this.linkLine.attr(
        {
            "stroke-opacity": 1.0,
            "stroke-width": 2
        });

        if(addCircle===null)
        {
            addCircle = gui.patch().getPaper().circle(middlePosX,middlePosY, CABLES.UI.uiConfig.portSize*0.5).attr(
            {
                "stroke": CABLES.UI.uiConfig.getPortColor(self.p1.thePort ),
                "stroke-width": 2,
                "fill": CABLES.UI.uiConfig.colorBackground,
            });

            addCircle.hover(function (e)
            {
                var txt='left click: insert op / right click: delete link';
                CABLES.UI.showToolTip(e,txt);
                CABLES.UI.setStatusText(txt);
            },function()
            {
                CABLES.UI.hideToolTip();
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
                        CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),null,null,self);
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

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
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
    };

    this.redraw = function()
    {
        if(!this.linkLine)
        {
            this.linkLine = gui.patch().getPaper().path(this.getPath());
            this.linkLine.attr( CABLES.UI.uiConfig.linkingLine );
            this.linkLine.attr({ "stroke": CABLES.UI.uiConfig.getPortColor(port1.thePort) });
            
            // this.linkLine.hover(function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.colorLinkHover});
            // }, function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.getPortColor(self.p1.thePort)});
            // });
        }

        this.linkLine.attr("path", this.getPath());
        this.linkLine.toFront();
        this.showAddButton();
    };

    this.setEnabled=function(enabled)
    {
        if(enabled) this.linkLine.attr("opacity", 1.0);
            else this.linkLine.attr("opacity", 0.3);
    };
}








Raphael.el.setGroup = function (group) { this.group = group; };
Raphael.el.getGroup = function () { return this.group; };

var OpRect = function (_opui,_x, _y, _w, _h, _text,objName)
{
    var isSelected=true;
    var group = Raphael.fn.set();
    var background = null;
    var label=null;
    var w=_w;
    var h=_h;
    var x=_x;
    var y=_y;
    var opui=_opui;
    var title=_text;

    this.getRect=function()
    {
        return background;
    };

    this.isVisible=function()
    {
        return label!==null;
    };

    this.removeUi=function()
    {
        if(!this.isVisible())return;

        group.clear();
        background.remove();
        label.remove();
        label=null;
        background=null;
    };

    this.getWidth=function()
    {
        return w;
    };

    this.setWidth=function(_w)
    {
        w=_w;
        if(this.isVisible()) background.attr({width:w});
    };

    function hover()
    {
        opui.isMouseOver=true;
    }

    function unhover()
    {
        opui.isMouseOver=false;
    }

    var dragger = function(x,y,ev)
    {
        $('#patch').focus();
        if(opui.isSelected())return;

        opui.showAddButtons();
        if(!ev.shiftKey) gui.patch().setSelectedOp(null);
        gui.patch().setSelectedOp(opui);
    };

    var move = function (dx, dy,a,b,e)
    {
        gui.patch().moveSelectedOps(dx,dy,a,b,e);
    };

    var up = function ()
    {
        gui.patch().moveSelectedOpsFinished();
        gui.patch().showOpParams(opui.op);
    };

    this.addUi=function()
    {
        if(this.isVisible())return;

        background=gui.patch().getPaper().rect(0, 0, w, h).attr(
        {
            "fill": CABLES.UI.uiConfig.colorOpBg,
            "stroke": CABLES.UI.uiConfig.colorPatchStroke,
            "stroke-width":0,
            "cursor": "move"
        });
        label = gui.patch().getPaper().text(0+w/2,0+h/2+0, title);
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

        group.push(background,label);
    };

    this.setEnabled=function(enabled)
    {
        if(this.isVisible())
            if(enabled) background.attr( { "fill-opacity": 1 });
                else background.attr( { "fill-opacity": 0.5 });
    };

    this.setSelected=function(sel)
    {
        // if(isSelected==sel)return;
        isSelected=sel;
        
        if(this.isVisible())
            if(sel) background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected });
                else background.attr( { "fill": CABLES.UI.uiConfig.colorOpBg });
    };

    this.setTitle=function(t)
    {
        title=t;
        if(label) label.attr({text:title});
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
        this.oprect.getGroup().remove();
        this.oprect.removeUi();
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
        hidden=false;
        this.oprect.addUi();
        this.oprect.getGroup().show();
        

        var j=0;
        for(j in self.portsIn) self.portsIn[j].addUi(this.oprect.getGroup());
        for(j in self.portsOut) self.portsOut[j].addUi(this.oprect.getGroup());
        
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

    this.setPos=function(x,y)
    {
        if(isNumber(x))
        {
            posx=x;
            posy=y;
        }

        if(self.oprect.getGroup())
        {
            self.oprect.getGroup().transform('t'+posx+','+posy);
        }
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
        var snapRange=10;
        var snap=(pos.x%65)-snapRange;
        if(snap>0 && snap<snapRange) pos.x-=snap;
        if(snap<0 && snap>-snapRange) pos.x-=snap;

        snap=(pos.y%50)-snapRange;
        if(snap>0 && snap<snapRange) pos.y-=snap;
        if(snap<0 && snap>-snapRange) pos.y-=snap;

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
        {
            this.links[i].setEnabled(en);
        }

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
        if(self.oprect.getWidth()<w+CABLES.UI.uiConfig.portSize) self.oprect.setWidth(w+CABLES.UI.uiConfig.portSize);

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
            var txt=Link.canLinkText(selectedEndPort.thePort,self.thePort);
            if(txt=='can link') CABLES.UI.setStatusText(  getPortDescription(selectedEndPort.thePort));
                else CABLES.UI.setStatusText( txt );

            if(txt=='can link') txt='<i class="fa fa-check"></i>';
                else txt='<i class="fa fa-times"></i> '+txt;
            CABLES.UI.showToolTip(event,txt+' '+getPortDescription(selectedEndPort.thePort));
        }

        if(selectedEndPort && selectedEndPort.thePort && Link.canLink(selectedEndPort.thePort,self.thePort))
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

        if(selectedEndPort && selectedEndPort.thePort && Link.canLink(selectedEndPort.thePort,self.thePort))
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



function guid()
{
  function s4()
  {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var pingDelay=10000;
var windowUUID=guid();
var delay=pingDelay;
var hasFailed=false;

var ping=function()
{
    $.ajax(
    {
        url: "/api/ping/"+windowUUID+'/editor',
    })
    .done(function()
    {
        delay=pingDelay;
        if(hasFailed) CABLES.UI.setStatusText('connection to server ESTABLISHED...');
        hasFailed=false;
    })
    .fail(function()
    {
        delay=pingDelay*2;
        hasFailed=true;
        CABLES.UI.setStatusText('connection to server lost...');
    });

    setTimeout(ping,delay);
};

ping();

CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.FileSelect=function()
{
    var currentTab='';
    var assetPath='';
    var apiPath='';
    var inputId='';
    var filterType='';

    this.setTab=function(which)
    {
        if(which=='projectfiles')
        {
            assetPath='/assets/'+gui.patch().getCurrentProject()._id;
            apiPath='project/'+gui.patch().getCurrentProject()._id+'/files/';
        }
        if(which=='library')
        {
            assetPath='/assets/library/';
            apiPath='library/';
        }

        $('#tab_'+currentTab).removeClass('active');

        currentTab=which;
        this.load();
    };

    this.showPreview=function(val)
    {
        console.log('val',val);
                
        var opts={};

        if(val.endsWith('.jpg') || val.endsWith('.png'))
        {
            opts.previewImageUrl=val;
        }

        var html= CABLES.UI.getHandleBarHtml('library_preview',opts);

        $('#lib_preview').html( html );

    };

    this.show=function(_inputId,_filterType)
    {
        $('#library').toggle();

        if( $('#library').is(':visible') )
        {
            $('#lib_head').html( CABLES.UI.getHandleBarHtml('library_head') );

            inputId=_inputId;
            filterType=_filterType;

            this.load();


            var val=$(_inputId).val();
            this.showPreview(val);
        }
    };


    this.load=function()
    {
        if(currentTab==='')
        {
            this.setTab('projectfiles');
            return;
        }

        $('#tab_'+currentTab).addClass('active');

        function getFileList(filterType,files,p)
        {
            if(!p)p=assetPath;

            var html='';
            for(var i in files)
            {
                if(!files[i])continue;

                files[i].selectableClass='';
                if(!files[i].d)
                {
                    if(files[i].t==filterType)
                    {
                        files[i].selectableClass='selectable';
                    }
                    else
                    {
                        if(filterType=='image')continue;
                        files[i].selectableClass='unselectable';
                    }
                }

                if(!files[i].p)files[i].p=p+files[i].n;


                html+= CABLES.UI.getHandleBarHtml('library_file',{file: files[i],inputId:inputId,filterType:filterType });
                if(files[i].d )
                {
                    html+=getFileList(filterType,files[i].c,p+files[i].n+'/');
                }
            }
            return html;
        }


        
            CABLES.api.get(apiPath,function(files)
            {
                var html=getFileList(filterType,files);

                $('#lib_files').html(html);
                        
            });

    };


};

CABLES.UI.fileSelect=new CABLES.UI.FileSelect();
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.SELECTPROJECT=CABLES.UI.SELECTPROJECT || {};


CABLES.UI.SELECTPROJECT.projectsHtml=null;
CABLES.UI.SELECTPROJECT.doReload=true;

CABLES.UI.SELECTPROJECT.showSelectProjects=function(html)
{

    CABLES.UI.MODAL.show(html);

    $('#projectsearch').focus();
    $('#projectsearch').on('input',function(e)
    {
        var searchFor= $('#projectsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
    });


    $( ".searchresult:first" ).addClass( "selected" );

    var displayBoxIndex=0;
    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = 0;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";
        oBoxCollectionAll.removeClass(cssClass);

        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);
    };

    function onInput(e)
    {
        displayBoxIndex=0;
        Navigate(0);
    }

    $('#projectsearch').on('input',onInput);

    $('#projectsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var projid=$('.selected').data('projid');
                document.location.href='#/project/'+projid;
            break;

            case 8:
                onInput();
                return true;
            break;

            case 37: // left
            break;

            // case 38: // up
            //     $('.selected').removeClass('selected');
            //     Navigate(-1);
            // break;

            case 39: // right
            break;

            // case 40: // down
            //     $('.selected').removeClass('selected');
            //     Navigate(1);
            // break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });

    setTimeout(function(){$('#projectsearch').focus();},100);
};

CABLES.UI.SELECTPROJECT.show=function()
{

    if(!CABLES.UI.SELECTPROJECT.projectsHtml || CABLES.UI.SELECTPROJECT.doReload)
    {
        CABLES.api.get('myprojects',function(data)
        {
            CABLES.UI.MODAL.showLoading('loading projectlist...');
            CABLES.UI.SELECTPROJECT.projectsHtml = CABLES.UI.getHandleBarHtml('select_project',{projects:data });
            CABLES.UI.SELECTPROJECT.showSelectProjects(CABLES.UI.SELECTPROJECT.projectsHtml);
            CABLES.UI.SELECTPROJECT.doReload=false;
        });
    }
    else
        CABLES.UI.SELECTPROJECT.showSelectProjects(CABLES.UI.SELECTPROJECT.projectsHtml);

    

};




var min = 300;
var max = 3600;
var mainmin = 200;

$( document ).ready(function()
{
    $('#splitterPatch').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererWidth=window.innerWidth - e.clientX;
            gui.setLayout();
        });
    });

    $('#splitterRenderer').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererHeight= e.clientY;
            gui.setLayout();
        });
    });

    $('#splitterTimeline').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.timingHeight= window.innerHeight-e.clientY;
            gui.setLayout();
        });
    });

    $('#splitterRendererWH').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererWidth=window.innerWidth - e.clientX;
            gui.rendererHeight= e.clientY;
            gui.setLayout();
        });
    });


    $(document).mouseup(function (e) {
        $(document).unbind('mousemove');
    });


});

CABLES.TL.UI=CABLES.TL.UI || {};

CABLES.TL.Key.prototype.isUI=true;
CABLES.TL.Key.prototype.circle=null;
CABLES.TL.Key.prototype.circleBezierOut=null;
CABLES.TL.Key.prototype.circleBezierIn=null;
CABLES.TL.Key.prototype.selected=false;
CABLES.TL.Key.prototype.showCircle=true;

CABLES.TL.MultiGraphKeyDisplayMode=true;
CABLES.TL.MoveMode=0;
CABLES.TL.TIMESCALE=100;
CABLES.TL.VALUESCALE=100;

CABLES.TL.Key.prototype.setAttribs=function(sel)
{
    var opa=0.7;
    var fill='#222';
    if(this.isMainAnim)
    {
        fill=CABLES.UI.uiConfig.colorKey;
        opa=0.8;
    }

    this.circle.attr({ "fill-opacity":0.7 });
    this.circle.attr({ cx:this.x, cy:this.y,"fill-opacity":opa,fill:fill  });

    if(this.selected) this.circle.attr({ fill:"white" });
};

CABLES.TL.Key.prototype.setSelected=function(sel)
{
    this.selected=sel;
    this.setAttribs();
};

CABLES.TL.Key.prototype.removeUi=function()
{
    if(this.bezierControlLineOut)
    {
        this.bezierControlLineOut.undrag();
        this.bezierControlLineOut.remove();
        this.bezierControlLineOut=false;
    }

    if(this.bezierControlLineIn)
    {
        this.bezierControlLineIn.undrag();
        this.bezierControlLineIn.remove();
        this.bezierControlLineIn=false;
    }

    if(this.circleBezierOut)
    {
        this.circleBezierOut.undrag();
        this.circleBezierOut.remove();
        this.circleBezierOut=false;
    }
    
    if(this.circleBezierIn)
    {
        this.circleBezierIn.undrag();
        this.circleBezierIn.remove();
        this.circleBezierIn=false;
    }

    if(this.circle)
    {
        this.circle.undrag();
        this.circle.remove();
        this.circle=false;
    }
};



CABLES.TL.Key.prototype.isMainAnim=false;

CABLES.TL.Key.prototype.updateCircle=function(_isMainAnim)
{
    if(_isMainAnim!== undefined)this.isMainAnim=_isMainAnim;

    if(!gui.timeLine())return;
    if(!this.circle) this.initUI();
    if(this.getEasing()==CABLES.TL.EASING_BEZIER && !this.circleBezierOut) this.initUI();

    if(isNaN(this.value)) this.value=0;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    if(!this.showCircle) this.circle.hide();
        else this.circle.show();

    if(this.getEasing()==CABLES.TL.EASING_BEZIER)
    {
        var posBezX=this.x+this.bezTime*CABLES.TL.TIMESCALE;
        var posBezY=this.y+this.bezValue*CABLES.TL.VALUESCALE;
        this.circleBezierOut.attr({ cx:posBezX, cy:posBezY  });

        var posBezXIn=this.x+this.bezTimeIn*CABLES.TL.TIMESCALE;
        var posBezYIn=this.y+this.bezValueIn*CABLES.TL.VALUESCALE;
        this.circleBezierIn.attr({ cx:posBezXIn, cy:posBezYIn  });

        var pathOut="M "+this.x+" "+this.y+" L "+posBezX+" "+posBezY;
        var pathIn="M "+this.x+" "+this.y+" L "+posBezXIn+" "+posBezYIn;
                
        this.bezierControlLineOut.attr({ path:pathOut, stroke: "#888", "stroke-width": 1});
        this.bezierControlLineIn.attr({ path:pathIn, stroke: "#888", "stroke-width": 1});
    }


    if(isNaN(this.x))
    {
        this.x=0;
        console.log('key this.x NaN');
    }
    if(isNaN(this.y))
    {
        this.y=0;
        console.log('key this.x NaN');
    }


    this.setAttribs();
    if(this.isMainAnim)this.circle.toFront();
};

CABLES.TL.Key.prototype.initUI=function()
{
    if(!gui.timeLine())return;
    var self=this;

    this.x=this.time*CABLES.TL.TIMESCALE;
    this.y=this.value*-CABLES.TL.VALUESCALE;

    this.bezX=this.x+this.bezTime*CABLES.TL.TIMESCALE;
    this.bezY=this.y+this.bezValue*CABLES.TL.VALUESCALE;

    var discattr = {fill: CABLES.UI.uiConfig.colorKey, stroke: "none"};

    if(this.circle)
    {
        this.removeUi();
    }

    if(this.getEasing()==CABLES.TL.EASING_BEZIER)
    {
        if(!this.circleBezierOut)
            this.circleBezierOut=gui.timeLine().getPaper().circle(this.bezX, this.bezY, 7);
        
        this.circleBezierOut.attr({ fill:"#fff","fill-opacity":0.7  });

        if(!this.circleBezierIn)
            this.circleBezierIn=gui.timeLine().getPaper().circle(this.bezXIn, this.bezYIn, 7);
        
        this.circleBezierIn.attr({ fill:"#f00","fill-opacity":0.7  });

        if(!this.bezierControlLineOut)
            this.bezierControlLineOut = gui.timeLine().getPaper().path("M 0 0 ");

        if(!this.bezierControlLineIn)
            this.bezierControlLineIn = gui.timeLine().getPaper().path("M 0 0 ");
    }

    this.circle=gui.timeLine().getPaper().circle(this.x, this.y, 7);
    this.circle.attr(discattr);
    this.circle.toFront();

    this.circle.node.onclick = function (e)
    {
        $('#timeline').focus();
        if(!e.shiftKey) gui.timeLine().unselectKeys();

        if(e.shiftKey && self.selected) self.setSelected(false);
            else self.setSelected(true);
    };

    var oldValues={};

    var startMoveX=-1;
    var startMoveY=-1;

    this.doMoveFinished=function()
    {
        startMoveX=-1;
        startMoveY=-1;
        self.isDragging=false;
    };

    this.doMove=function(dx,dy,a,b,e,newPos)
    {
        if(!this.showCircle) return;

        if(startMoveX==-1 )
        {
            startMoveX=newPos.x-self.x;
            startMoveY=newPos.y-self.y;
        }

        newPos.x=newPos.x-startMoveX;
        newPos.y=newPos.y-startMoveY;

        var time=gui.timeLine().getTimeFromPaper(newPos.x);
        var frame=parseInt( (time +0.5*1/gui.timeLine().getFPS() )*gui.timeLine().getFPS(),10);
        time=frame/gui.timeLine().getFPS();



        if(CABLES.TL.MoveMode===0)
        {
            self.set({time:time,value:self.value});
            // self.updateCircle();
        }
        if(CABLES.TL.MoveMode==1)
        {
            self.set({time:time,value:newPos.y/-CABLES.TL.VALUESCALE});
            // self.updateCircle();
        }
        if(CABLES.TL.MoveMode==2)
        {
            self.set({time:time,value:newPos.y/-CABLES.TL.VALUESCALE});
            // self.updateCircle();
        }

    };

    function move(dx,dy,a,b,e)
    {
        $('#timeline').focus();

        self.isDragging=true;
        if(!self.selected)
        {
            gui.timeLine().unselectKeys();
            self.setSelected(true);

        }
        gui.timeLine().moveSelectedKeys(dx,dy,a,b,e);
    }

    function down()
    {
        if(!self.isDragging)
        {
            oldValues=self.getSerialized();
        }
        self.isDragging=true;
    }

    function up()
    {
        gui.timeLine().moveSelectedKeysFinished();

        CABLES.undo.add({
            undo: function()
            {
                self.set(oldValues);
                gui.timeLine().refresh();
            },
            redo: function()
            {
            }
        });

        self.isDragging=false;
    }
    this.circle.drag(move,down,up);

    // --------

    function moveBezierOut(dx,dy,a,b,e)
    {
        self.isDragging=true;
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);
        var newTime=gui.timeLine().getTimeFromPaper(newPos.x);
        var t=self.time;
        var v=self.value;
        var newValue=newPos.y/CABLES.TL.VALUESCALE;
        
        self.setBezierControlOut(newTime-t,newValue+v);
        self.updateCircle();
    }

    function upBezierOut()
    {
        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }

    if(self.circleBezierOut) self.circleBezierOut.drag(moveBezierOut,upBezierOut);

    // --------

    function moveBezierIn(dx,dy,a,b,e)
    {
        self.isDragging=true;
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);
        var newTime=gui.timeLine().getTimeFromPaper(newPos.x);
        var t=self.time;
        var v=self.value;
        var newValue=newPos.y/CABLES.TL.VALUESCALE;

        self.setBezierControlIn(newTime-t,newValue+v);
        self.updateCircle();
    }

    function upBezierIn()
    {
        self.isDragging=false;
        self.x=-1;
        self.y=-1;
    }

    if(self.circleBezierIn) self.circleBezierIn.drag(moveBezierIn,upBezierIn);

};

CABLES.TL.Anim.prototype.hasSelectedKeys=function()
{
    for(var i in this.keys)if(this.keys[i].selected)return true;
};

CABLES.TL.Anim.prototype.show=function()
{
    if(gui.timeLine())
        if(!this.keyLine)
            this.keyLine = gui.timeLine().getPaper().path("M 0 0 L 1 1");
};

CABLES.TL.Anim.prototype.removeUi=function()
{
    if(this.keyLine)
    {
        this.keyLine.hide();
        this.keyLine.remove();
        this.keyLine=false;
    }

    for(var i in this.keys)
        this.keys[i].removeUi();
};

CABLES.TL.Anim.prototype.unselectKeys=function()
{
    for(var i in this.keys)
        this.keys[i].setSelected(false);
};

CABLES.TL.Anim.prototype.deleteKeyAt=function(t)
{
    for(var i in this.keys)
    {
        if(this.keys[i].time==t)
        {
            this.keys[i].removeUi();
            this.keys.splice(i, 1);
            return;
        }
    }

};

CABLES.TL.Anim.prototype.deleteSelectedKeys=function()
{
    var found=true;

    while(found)
    {
        found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].selected && this.keys[i].showCircle)
            {
                var undofunc=function(anim,objKey)
                {
                    CABLES.undo.add({
                        undo: function(){
                            anim.addKey(new CABLES.TL.Key(objKey));
                            anim.sortKeys();
                            gui.timeLine().refresh();
                        },
                        redo: function(){

                            anim.deleteKeyAt(objKey.t);
                            gui.timeLine().refresh();
                        }
                    });
                }(this,this.keys[i].getSerialized());

                this.keys[i].removeUi();
                this.keys.splice(i, 1);
                found=true;
            }
        }
    }
    this.sortKeys();
};


CABLES.TL.UI.TimeLineUI=function()
{
    var self=this;
    
    var tlEmpty=new CABLES.TL.Anim();
    var anim=null;//tlEmpty;//new CABLES.TL.Anim();
    var viewBox={x:-10,y:-170,w:1200,h:400};
    var fps=30;
    var cursorTime=0.0;

    var anims=[];

    var paper= Raphael("timeline", 0,0);
    var paperTime= Raphael("timetimeline", 0,0);
    var isScrollingTime=false;
    var enabled=false;
    var doCenter=false;

    var rubberBandStartPos=null;
    var rubberBandPos=null;
    var mouseRubberBandStartPos=null;
    var mouseRubberBandPos=null;
    var rubberBandRect=null;

    var updateTimer=null;
    var timeDisplayMode=true;

    var cursorLine = paper.path("M 0 0 L 10 10");
    cursorLine.attr({stroke: CABLES.UI.uiConfig.colorCursor, "stroke-width": 2});

    var cursorLineDisplay = paperTime.path("M 0 0 L 10 10");
    cursorLineDisplay.attr({stroke: CABLES.UI.uiConfig.colorCursor, "stroke-width": 2});

    this.getFPS=function()
    {
        return fps;
    };

    function getFrame(time)
    {
        var frame=parseInt(time*fps,10);
        return frame;
    }

    this.getPaper=function()
    {
        return paper;
    };

    function removeDots()
    {
        for(var j in anims)
        {

            anims[j].removeUi();

            // for(var i in anims[j].keys)
            // {
            //     if(anims[j].keys[i].circle)
            //     {
            //         // $('#timeline svg circle').hide();
            //         anims[j].keys[i].removeUi();
            //     }
            // }
        }
        
        if($('#timeline svg circle').length>0)
        {
            console.log('KEYS NOT REMOVED PROPERLY');
        }
    }

    this.addAnim=function(newanim)
    {
        if(newanim===null)return;

        var i=0;
        // newanim.onChange=null;



        // var newAnims=[];
        // newAnims.push(newanim);
        newanim.show();

        var found=true;
        while(found)
        {
            found=false;
            for(i in anims)
            {
                if(!found && !anims[i].stayInTimeline && anims[i]!=newanim)
                {
                            console.log('found one! '+i);
                            
                    anims[i].removeUi();
                    if(anims.length==1) anims.length=0;
                        else
                    anims=anims.slice(i,1);

                    // if(anims[i].keyLine)anims[i].keyLine.hide();
                    found=true;
                }
            }
        }

        anims.push(newanim);

                // {
                //     newAnims.push(anims[i]);
                //     anims[i].show();
                // }

        // anims=newAnims;

        // for(i in anims)
        // {
        //     if(anims[i]==newanim)
        //     {
        //         return;
        //     }
        // }
        // if(newanim) anims.push(newanim);

    };



    this.removeAnim=function(an)
    {
        if(!an)return;
        var val=an.getValue(cursorTime);

        an.stayInTimeline=false;
        // an.keyLine.hide();
        
        for(var i in anims)
        {
            if(anims[i] && anims[i]==an)
            {
                an.removeUi();
                anims=anims.slice(i,1);
                self.addAnim(tlEmpty);
                removeDots();
                updateKeyLine();
                this.refresh();
                return val;
            }
        }
        
        return 0;
    };

    function mousemoveTime(e)
    {
        if(isScrollingTime)
            scrollTime(e);
    }

    this.getAnim=function()
    {
        return anim;
    };

    this.setAnim=function(newanim,config)
    {
        if(!gui.timeLine())return;
        $(document).bind("mousemove",mousemoveTime);

        if(newanim && newanim!=tlEmpty)gui.showTiming();

        removeDots();

        if(!newanim || newanim===null)
        {
            anim=tlEmpty;
            removeDots();
            updateKeyLine();
            $('#timelineTitle').html('');
            enabled=false;
            return;
        }

        newanim.paper=paper;
        anim=newanim;
        enabled=true;
        this.addAnim(anim);
        
        if(config && config.name) $('#timelineTitle').html(config.name);
            else $('#timelineTitle').html('');

        if(config && config.hasOwnProperty('defaultValue') && anim.keys.length===0)
        {
            anim.keys.push(new CABLES.TL.Key({time:cursorTime,value:config.defaultValue}) );
            this.centerCursor();
        }

        updateKeyLine();
        if(anim.keyLine)anim.keyLine.toFront();
        for(var i in anim.keys)
        {
            if(!anim.keys[i].circle)anim.keys[i].initUI();
            anim.keys[i].updateCircle(true);
        }

        // if(anim.keys.length>1 || anims.length>0)
        // {
        //     self.scaleWidth();
        // }

        // if(anim.keys.length==1)this.centerCursor();
        // self.scaleHeight();
        // this.centerCursor();

        if(anim.onChange===null) anim.onChange=updateKeyLineDelayed;
        
    };

    function setCursor(time)
    {
        if(time<0)time=0;
        if(isNaN(time))time=0;

        cursorTime=time;
        time=time*CABLES.TL.TIMESCALE;
        cursorLine.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
        cursorLineDisplay.attr({path: "M "+time+" -1000 L" + time + " " + 1110 });
    }

    var zeroLine2 = paper.path("M 0 0 L 111000 0");
    zeroLine2.attr({ stroke: "#999", "stroke-width": 1});

    this.updateViewBox=function()
    {
        if(!enabled) removeDots();

        paper.setViewBox(
            viewBox.x,
            viewBox.y,
            $('#timeline').width(),
            viewBox.h,false
        );

        paperTime.setViewBox(
            viewBox.x,
            -200,
            $('#timeline').width(),
            400,false
        );

        viewBox.w=$('#timeline').width();

        paperTime.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        paper.canvas.setAttribute('preserveAspectRatio', 'xMinYMin slice');
        updateKeyLine();
    };

    this.refresh=function()
    {
        updateKeyLineDelayed();
    };

    var delayedUpdateKeyLine=0;
    function updateKeyLineDelayed()
    {
        clearTimeout(delayedUpdateKeyLine);
        delayedUpdateKeyLine = setTimeout(updateKeyLine, 10);
    }

    function updateKeyLine()
    {
        if(gui.patch().isLoading())return;

        for(var anii in anims)
        {
            var str=null;
            var ani=anims[anii];


            if(ani && ani.keys.length===0)
            {
                ani.removeUi();
            }
            else
            if(ani)
            {
                ani.show();
                ani.sortKeys();

                // var numSteps=500;
                var start=viewBox.x/CABLES.TL.TIMESCALE;
                var width=viewBox.w/CABLES.TL.TIMESCALE*1.2;

                var timePoints=[0];

                for(var ik=0;ik<ani.keys.length;ik++)
                {
                    timePoints.push(ani.keys[ik].time-0.00001);
                    timePoints.push(ani.keys[ik].time);
                    timePoints.push(ani.keys[ik].time+0.00001);

                    if(ani.keys[ik].getEasing()!=CABLES.TL.EASING_LINEAR &&
                        ani.keys[ik].getEasing()!=CABLES.TL.EASING_ABSOLUTE  &&
                        ik<ani.keys.length-1)
                    {
                        var timeSpan=ani.keys[ik+1].time-ani.keys[ik].time;
                                        
                        for(var j=0;j<timeSpan;j+=timeSpan/50)
                        {
                            timePoints.push(ani.keys[ik].time+j);
                        }
                    }
                }
                timePoints.push(1000);


                for(var i=0;i<timePoints.length;i++)
                {
                    // var t=start+i*width/numSteps;
                    var t=timePoints[i];
                    var v=ani.getValue(t);
                    if(str===null)str+="M ";
                        else str+="L ";
                    str+=t*CABLES.TL.TIMESCALE+" "+v*-CABLES.TL.VALUESCALE;

                }

                // var lastValue=Number.MAX_VALUE;

                // for(var i=0;i<numSteps;i++)
                // {
                //     var t=start+i*width/numSteps;
                //     var v=ani.getValue(t);

                //     if(lastValue!=v || i>=numSteps-2 || i<=3)
                //     {
                //         if(str===null)str+="M ";
                //             else str+="L ";
                //         str+=t*CABLES.TL.TIMESCALE+" "+v*-CABLES.TL.VALUESCALE;
                //     }
                //     lastValue=v;
                // }

                        // console.log('str ',str.length);
                        

                for(var ik=0;ik<ani.keys.length;ik++)
                {
                    var nextKey=null;
                    if(ani.keys.length > ik+1) nextKey=ani.keys[ik+1];
                    
                    if(CABLES.TL.MultiGraphKeyDisplayMode)
                        ani.keys[ik].showCircle=true;
                    else
                        if(ani==anim)ani.keys[ik].showCircle=true;
                            else ani.keys[ik].showCircle=false;

                    ani.keys[ik].updateCircle(ani==anim);
                    if(ani.keys[ik].onChange===null) ani.keys[ik].onChange=updateKeyLineDelayed;
                }

                ani.keyLine.attr({ path:str });
    
                if(ani.keyLine)
                    if(ani==anim) ani.keyLine.attr({ stroke: "#fff", "stroke-width": 2 });
                        else ani.keyLine.attr({ stroke: "#222", "stroke-width": 1 });

            }
        }
    }

    this.getCanvasCoordsMouse=function(evt)
    {
        return this.getCanvasCoordsSVG('#timeline svg',evt);
    };

    this.getCanvasCoordsMouseTimeDisplay=function(evt)
    {
        return this.getCanvasCoordsSVG('#timetimeline svg',evt);
    };

    this.gotoOffset=function(off)
    {
        gui.scene().timer.setOffset(off);
        self.updateTime();
        if(!self.isCursorVisible())self.centerCursor();
    };

    this.gotoZero=function()
    {
        // setCursor(0);
        gui.scene().timer.setTime(0);

        setCursor(0);
        
        self.centerCursor();
    };

    this.getCanvasCoordsSVG=function(id,evt)
    {
        var ctm = $(id)[0].getScreenCTM();

        ctm = ctm.inverse();
        var uupos = $(id)[0].createSVGPoint();

        uupos.x = evt.clientX;
        uupos.y = evt.clientY;

        uupos = uupos.matrixTransform(ctm);
        
        var res={x:uupos.x,y:uupos.y};
        return res;
    };

    var spacePressed=false;

    this.jumpKey=function(dir)
    {
        var theKey=null;

        for(var anii in anims)
        {
            var index=anims[anii].getKeyIndex(cursorTime);
            var newIndex=parseInt(index,10)+parseInt(dir,10);

            if(newIndex==1 && cursorTime<anims[anii].keys[0].time)newIndex=0;
            if(newIndex==anims[anii].keys.length-2 && cursorTime>anims[anii].keys[anims[anii].keys.length-1].time)newIndex=anims[anii].keys.length-1;

            if(anims[anii].keys.length>newIndex && newIndex>=0)
            {
                var thetime=anims[anii].keys[newIndex].time;

                if(!theKey)theKey=anims[anii].keys[newIndex];

                if( Math.abs(cursorTime-thetime) < Math.abs(cursorTime-theKey.time) )
                {
                    theKey=anims[anii].keys[newIndex];
                }
            }
        }

        if(theKey)
        {
            gui.scene().timer.setTime(theKey.time);
            self.updateTime();

            if(theKey.time>this.getTimeRight() || theKey.time<this.getTimeLeft()) this.centerCursor();
        }
    };

    $('#timeline').keyup(function(e)
    {
        switch(e.which)
        {
            case 32:
                spacePressed=false;
            break;
        }
    });

    $('#timeline').keydown(function(e)
    {
        switch(e.which)
        {
            case 46: case 8:
                for(var j in anims) anims[j].deleteSelectedKeys();
                updateKeyLine();
                if(e.stopPropagation) e.stopPropagation();
                if(e.preventDefault) e.preventDefault();
            break;

            case 32:
                spacePressed=true;
            break;


            case 72: // h
                self.scaleHeight();
                self.scaleWidth();
            break;


            case 65: // a 
                if(e.metaKey || e.ctrlKey) self.selectAllKeys();
            break;

            case 68: // d
                console.log('anim.keys',anim.keys);
            break;

            case 90: // z undo
                if(e.metaKey || e.ctrlKey)
                {
                    if(e.shiftKey) CABLES.undo.redo();
                    else CABLES.undo.undo();
                }
            break;

            case 37: // left
                var num=1;
                if(e.shiftKey)num=10;
                var newTime=getFrame((self.getTime()-1.0/fps*num)+0.001);
                gui.scene().timer.setTime(newTime/fps);
            break;

            case 39: // right
                var num=1;
                if(e.shiftKey)num=10;
                var newTime=getFrame((self.getTime()+1.0/fps*num)+0.001);
                gui.scene().timer.setTime(newTime/fps);
            break;

            default:
                console.log('key ',e.which);
            break;
        }
    });

    function toggleMoveMode()
    {
        CABLES.TL.MoveMode++;
        if(CABLES.TL.MoveMode>2)CABLES.TL.MoveMode=0;
        if(CABLES.TL.MoveMode===0)
        {
            $("#keymovemode").addClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.TL.MoveMode==1)
        {
            $("#keymovemode").addClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
            $("#keymovemode").removeClass('fa-arrows');
        }
        if(CABLES.TL.MoveMode==2)
        {
            $("#keymovemode").addClass('fa-arrows');
            $("#keymovemode").removeClass('fa-arrows-v');
            $("#keymovemode").removeClass('fa-arrows-h');
        }
    }

    this.getTimeLeft=function()
    {
        return viewBox.x/CABLES.TL.TIMESCALE;
    };

    this.getTimeRight=function()
    {
        return this.getTimeLeft()+viewBox.w/CABLES.TL.TIMESCALE;
    };

    this.toggleLoop=function()
    {
        anim.loop=!anim.loop;
        updateKeyLine();
    };

    this.centerCursor=function()
    {
        var start=cursorTime*CABLES.TL.TIMESCALE;
        var width=viewBox.w;
        var left=start-width/2;

        if(left<0)left=0;

        viewBox.x=left;

        self.updateViewBox();
        updateTimeDisplay();
    };

    this.scaleWidth=function()
    {
        if(gui.patch().isLoading())return;

        var maxt=-99999;
        var mint=99999999;

        var hasSelectedKeys=false;
        for(var anii in anims)
            if(anims[anii].hasSelectedKeys())hasSelectedKeys=true;

        var count=0;
        for(var anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                if(!hasSelectedKeys || anims[anii].keys[i].selected)
                {
                    count++;
                    maxt=Math.max(maxt,anims[anii].keys[i].time);
                    mint=Math.min(mint,anims[anii].keys[i].time);
                }
            }
        }
        if(count===0)
        {
            maxt=10;
            mint=10;
        }
        if(maxt==mint)
        {
            maxt+=3;
            mint-=3;
            if(mint<0) mint=0;
        }

        CABLES.TL.TIMESCALE=viewBox.w/(maxt-mint)*0.9;
        viewBox.x=mint*CABLES.TL.TIMESCALE-(maxt-mint)*0.05*CABLES.TL.TIMESCALE;
        console.log('CABLES.TL.TIMESCALE ',mint,maxt,count);


        self.updateViewBox();
        updateTimeDisplay();
    };

    var delayedScaleHeight=0;
    this.scaleHeightDelayed=function()
    {
        clearTimeout(delayedScaleHeight);
        delayedScaleHeight = setTimeout(self.scaleHeight, 150);
    };


    var lastScaleHeightMax=0;
    var lastScaleHeightMin=0;
    this.scaleHeight=function()
    {
        var maxv=-99999;
        var minv=99999999;

        var hasSelectedKeys=false;
        for(var anii in anims)
            if(anims[anii].hasSelectedKeys())hasSelectedKeys=true;

        var count=0;
        for(var anii in anims)
        {
            for(var i in anims[anii].keys)
            {
                if(!hasSelectedKeys || anims[anii].keys[i].selected)
                {
                    count++;
                    maxv=Math.max(maxv,anims[anii].keys[i].value);
                    minv=Math.min(minv,anims[anii].keys[i].value);
                }
            }
        }

        if( lastScaleHeightMax!=maxv ||lastScaleHeightMin!=minv )
        {
            lastScaleHeightMax=maxv;
            lastScaleHeightMin=minv;

            if(count===0)
            {
                maxv=1;
                minv=-1;
            }

            if(maxv==minv)
            {
                maxv+=2;
                minv-=2;
            }
            
            var s=Math.abs(maxv)+Math.abs(minv);
            self.setValueScale( $('#timeline').height()/2.3/( s-Math.abs(s)*0.2) );

            viewBox.y=-maxv*1.1*CABLES.TL.VALUESCALE;
            self.updateViewBox();

        }
    };

    this.selectAllKeys=function()
    {
        for(var anii in anims)
            for(var i in anims[anii].keys)
                if(anims[anii].keys[i].showCircle)
                    anims[anii].keys[i].setSelected(true);
        updateKeyLine();
    };

    this.setSelectedKeysEasing=function(e)
    {
        for(var anii in anims)
        {
            anims[anii].defaultEasing=e;
            for(var i in anims[anii].keys)
            {
                anims[anii].removeUi();

                if(anims[anii].keys[i].selected)
                    anims[anii].keys[i].setEasing(e);
            }
        }
        updateKeyLine();
    };

    function toggleMultiGraphKeyDisplay(e)
    {
        if(e.buttons==3)
        {
            removeDots();

            for(var i=0;i<anims.length;i++)
            {
                console.log('anims[i]',anims[i]);
                self.removeAnim(anims[i]);
            }

            self.setAnim(null);
            updateKeyLine();
        }
        else
        {
            CABLES.TL.MultiGraphKeyDisplayMode=!CABLES.TL.MultiGraphKeyDisplayMode;
            console.log('CABLES.TL.MultiGraphKeyDisplayMode ',CABLES.TL.MultiGraphKeyDisplayMode);
        }
        updateKeyLine();
    }


    $("#keymovemode").bind("click", toggleMoveMode);
    $("#keyscaleheight").bind("click", this.scaleHeight);
    $("#keyscalewidth").bind("click", this.scaleWidth);

    // $("#ease_linear").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_LINEAR); } );
    // $("#ease_absolute").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_ABSOLUTE); } );
    // $("#ease_smoothstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHSTEP); } );
    // $("#ease_smootherstep").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_SMOOTHERSTEP); } );
    // $("#ease_bezier").bind("click", function(){ self.setSelectedKeysEasing(CABLES.TL.EASING_BEZIER); } );


    $("#loop").bind("click", this.toggleLoop);
    $("#centercursor").bind("click", this.centerCursor);
    $("#centercursor").bind("mousedown", function(){doCenter=true;} );
    $("#centercursor").bind("mouseup", function(){doCenter=false;} );

    $("#toggleMultiGraphKeyDisplay").bind("mousedown", toggleMultiGraphKeyDisplay );


    // $('#timeline').bind("mousewheel", function (event,delta,nbr)
    // {
    //     CABLES.TL.VALUESCALE+=delta;

    //     if(CABLES.TL.VALUESCALE<10)CABLES.TL.VALUESCALE=10;
    //     self.updateViewBox();
    // });

    $(".timeLineInsert").bind("click", function (e)
    {
        anim.keys.push(new CABLES.TL.Key({paper:paper,time:cursorTime,value:anim.getValue(cursorTime)}) );
        updateKeyLine();
    });

    var startMouseDown=0;
    $('#timeline').bind("mousedown", function (event)
    {
        startMouseDown=Date.now();
    });
    $('#timeline').bind("mouseup", function (event)
    {
        if(Date.now()-startMouseDown<100 && !event.shiftKey && !isScrollingTime && !isDragging())self.unselectKeys();

        rubberBandHide();

        for(var j in anims)
            for(var i in anims[j].keys)
                anims[j].keys[i].isDragging=false;
    });

    $("#timetimeline").bind("mouseup", function(e)
    {
        isScrollingTime=false;
    });

    window.addEventListener('resize', function(event)
    {
        self.updateViewBox();
    });


    $(document).bind("mouseup",function(e)
    {
        isScrollingTime=false;
    });

    function scrollTime(e)
    {
        if(e.buttons==1 || e.buttons==2)
        {
            isScrollingTime=true;
            e.offsetX=e.clientX;
            var time=self.getTimeFromMouse( e );
            var frame=parseInt( (time +0.5*1/fps )*fps,10);
            time=frame/fps;

            gui.scene().timer.setTime(time);
            self.updateTime();
            $('#timeline').focus();
        }
    }
    $("#timelineui").bind("mousedown", function(e)
    {
        $('#timeline').focus();
        if(e.target.nodeName!='INPUT')e.preventDefault();
    });

    $("#timetimeline").bind("mousedown", function(e)
    {
        $(document).bind("mousemove",mousemoveTime);
        $('#timeline').focus();
        e=mouseEvent(e);
        scrollTime(e);
        e.preventDefault();
    });

    function isDragging()
    {
        for(var j in anims)
            for(var i in anims[j].keys)
                if(anims[j].keys[i].isDragging===true)
                    return true;

        return false;
    }

    var panX=0,panY=0;
    $("#timeline").bind("mousemove", function(e)
    {
        if(isScrollingTime)return;
        e=mouseEvent(e);

        if(e.buttons==2 || e.buttons==3 || (e.buttons==1 && spacePressed))
        {
            viewBox.x+=panX-self.getCanvasCoordsMouse(e).x;
            viewBox.y+=panY-self.getCanvasCoordsMouse(e).y;

            var startTime=viewBox.x/CABLES.TL.TIMESCALE;

            self.updateViewBox();
        }

        panX=self.getCanvasCoordsMouse(e).x;
        panY=self.getCanvasCoordsMouse(e).y;

        if(isDragging())return;


                
        rubberBandMove(e);
    });

    var timeDisplayTexts=[];
    function updateTimeDisplay()
    {
        var step=fps*5;

        step=fps+fps/4;
        if(CABLES.TL.TIMESCALE>30) step=fps/2;
        if(CABLES.TL.TIMESCALE>60) step=fps/3;
        if(CABLES.TL.TIMESCALE>300) step=fps/6;
        if(CABLES.TL.TIMESCALE>500) step=fps/10;
        // if(CABLES.TL.TIMESCALE>1000) step=fps/6;
        if(CABLES.TL.TIMESCALE>1000) step=fps/30;


        for(var i=0;i<100;i++)
        {
            var frame=i*step;
            var t;
            if(i>timeDisplayTexts.length-1)
            {
                t = paperTime.text(10, -80, "");
                timeDisplayTexts.push(t);
            }

            var txt=parseInt(frame,10);
            if(!timeDisplayMode)txt=(''+i*step/fps).substr(0, 4)+"s ";

            t=timeDisplayTexts[i];
            t.attr({
                "text":""+txt,
                "x":i*step/fps*CABLES.TL.TIMESCALE,
                "y":-190,
                "fill":'#aaa',
                "font-size": 12 });
        }
    }

    this.getTime=function()
    {
        return cursorTime;
    };

    this.setValueScale=function(v)
    {
        CABLES.TL.VALUESCALE=v;
        updateKeyLine();
        updateTimeDisplay();
    };

    this.setTimeScale=function(v)
    {
        cursorLine.hide();
        var cursorOffset=this.getTimeFromPaper(viewBox.x);
        var oldCursor=this.getPaperXFromTime(cursorTime);
        // var addOffset=Math.abs(cursorOffset-cursorTime);

        // console.log('cursorOffset',cursorOffset);
        // console.log('addOffset',cursorTime*CABLES.TL.TIMESCALE);

        CABLES.TL.TIMESCALE=v;

        viewBox.x=cursorOffset*CABLES.TL.TIMESCALE/2;

        var newCursor=this.getPaperXFromTime(cursorTime);
        viewBox.x-=(oldCursor-newCursor)/2;

        // this.centerCursor();
        updateKeyLine();

        self.updateViewBox();
        updateTimeDisplay();

        $('#timeline').focus();
        cursorLine.show();
        setCursor(this.getTime());
    };

    this.getTimeFromMouse=function(e)
    {
        var time=self.getCanvasCoordsMouseTimeDisplay(e).x;
        time/=CABLES.TL.TIMESCALE;
        return time;
    };

    this.isCursorVisible=function()
    {
        return (cursorTime> self.getTimeFromPaper(viewBox.x)  && cursorTime < self.getTimeFromPaper(viewBox.w)+self.getTimeFromPaper(viewBox.x));
    };
    this.getPaperXFromTime=function(t)
    {
        return t*CABLES.TL.TIMESCALE;
    };
    this.getTimeFromPaper=function(offsetX)
    {
        var time=offsetX;
        time/=CABLES.TL.TIMESCALE;
        return time;
    };

    this.toggleTimeDisplayMode=function()
    {
        timeDisplayMode=!timeDisplayMode;
        console.log('timeDisplayMode',timeDisplayMode);
        this.updateTime();
        updateTimeDisplay();
    };

    var lastTime=-1;
    this.updateTime=function()
    {
        var time=gui.scene().timer.getTime();
        setCursor(time);
        if(doCenter)self.centerCursor();
 

        if(lastTime!=time)
        {
            lastTime=time;

            if(timeDisplayMode)
                $('.timelinetime').html( '<b class="mainColor">'+getFrame(time)+'</b><br/>'+(time+'').substr(0, 4)+'s ' );
            else
                $('.timelinetime').html( '<b class="mainColor">'+(time+'').substr(0, 4)+'s </b><br/>'+getFrame(time)+' ' );
        }
        if(updateTimer===null) updateTimer=setInterval(self.updateTime,30);
    };

    this.togglePlay=function(patch)
    {
        gui.scene().timer.togglePlay();
                
        if(!gui.scene().timer.isPlaying())
        {
            $('#timelineplay').removeClass('fa-pause');
            $('#timelineplay').addClass('fa-play');
            this.updateTime();
        }
        else
        {
            $('#timelineplay').removeClass('fa-play');
            $('#timelineplay').addClass('fa-pause');
            this.updateTime();
        }
    };

    // ------------------

    function rubberBandHide()
    {
        mouseRubberBandStartPos=null;
        mouseRubberBandPos=null;
        if(rubberBandRect)rubberBandRect.attr({
            x:0,y:0,width:0,height:0,
            "stroke-width": 0,
            "fill-opacity": 0
        });
    }

    function rubberBandMove(e)
    {
        if(e.buttons==1 && !spacePressed)
        {
            if(!mouseRubberBandStartPos)
                mouseRubberBandStartPos=self.getCanvasCoordsMouse(e);
            mouseRubberBandPos=self.getCanvasCoordsMouse(e);

            if(!rubberBandRect) rubberBandRect=paper.rect( 0,0,10,10).attr({ });

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

            if(!enabled)return;
            var count=0;

            for(var j in anims)
            {
                for(var i in anims[j].keys)
                {
                    var rect=anims[j].keys[i].circle;
                    if(anims[j].keys[i].showCircle)
                    {
                        var opX=rect.attr("cx");
                        var opY=rect.attr("cy");

                        anims[j].keys[i].setSelected(false);
                        if(opX>start.x && opX<end.x && opY>start.y && opY<end.y )
                        {
                            anims[j].keys[i].setSelected(true);
                            count++;
                        }

                    }
                }
            }

            CABLES.UI.setStatusText(count+' keys selected');
        }
    }

    // ---------------------------------

    this.copy=function(e)
    {
        var keys=[];
        for(var i in anim.keys)
        {
            if(anim.keys[i].selected)
            {
                keys.push(anim.keys[i].getSerialized() );
            }
        }

        var obj={keys:keys};
        var objStr=JSON.stringify(obj);

        CABLES.UI.setStatusText(keys.length+' keys copied...');

        e.clipboardData.setData('text/plain', objStr);
        e.preventDefault();
    };

    this.cut=function(e)
    {
        if(!enabled)return;
        self.copy(e);
        anim.deleteSelectedKeys();
        updateKeyLine();
    };

    this.paste=function(e)
    {
        if(!enabled)return;
        if(e.clipboardData.types.indexOf('text/plain') > -1)
        {
            e.preventDefault();

            var str=e.clipboardData.getData('text/plain');

            e.preventDefault();

            var json=JSON.parse(str);
            if(json)
            {
                if(json.keys)
                {
                    var i=0;

                    var minTime=Number.MAX_VALUE;
                    for(i in json.keys)
                    {
                        minTime=Math.min(minTime,json.keys[i].t);
                    }
        
                    CABLES.UI.setStatusText(json.keys.length+' keys pasted...');

                    for(i in json.keys)
                    {
                        json.keys[i].t=json.keys[i].t-minTime+cursorTime;
                        anim.addKey(new CABLES.TL.Key(json.keys[i]));
                    }

                    anim.sortKeys();

                    for(i in anim.keys)
                    {
                        anim.keys[i].updateCircle(true);
                    }

                    updateKeyLine();
                    return;
                }
            }
            CABLES.UI.setStatusText("paste failed / not cables data format...");
        }
    };




    this.moveSelectedKeysFinished=function()
    {
        for(var i in anims)
        {
            if(anims[i])
            {
                for(var k in anims[i].keys)
                {
                    var key=anims[i].keys[k];
                    if(key.selected)
                    {
                        key.doMoveFinished();
                    }
                }
            }
        }
    };

    this.moveSelectedKeys=function(dx,dy,a,b,e)
    {
        var newPos=gui.timeLine().getCanvasCoordsMouse(e);



        // snap to cursor
        if( Math.abs(e.clientX-gui.timeLine().getTime()*CABLES.TL.TIMESCALE) <20 )
        {
            newPos.x=gui.timeLine().getTime()*CABLES.TL.TIMESCALE;
        }

        for(var i in anims)
        {
            if(anims[i])
            {
                for(var k in anims[i].keys)
                {
                    var key=anims[i].keys[k];
                    if(key.selected)
                    {
                        key.doMove(dx,dy,a,b,e,newPos);
                    }
                }
            }
        }
    };

    this.unselectKeys=function()
    {
        for(var i in anims)
        {
            if(anims[i])
            {
                anims[i].unselectKeys();
            }
        }
    };

    this.clear=function()
    {
        for(var i in anims)
        {
            // if(anims[i])
            {
                // anims[i].keyLine.hide();
                anims[i].removeUi();
                found=true;
            }
        }
        anims.length=0;
    };

    this.updateTime();
    this.setAnim(tlEmpty);
    updateTimeDisplay();
    this.centerCursor();
    updateKeyLine();
    this.setAnim(tlEmpty);
    self.updateViewBox();
    self.setAnim(tlEmpty);

    

};




CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.getHandleBarHtml=function(name,obj)
{
    var source   = $("#"+name).html();
    var template = Handlebars.compile(source);
    var context = obj;
    return template(context);
};

function isNumber (o) {
  return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}

CABLES.UI.getWheelSpeed=function(event)
{
    var normalized;
    if (event.wheelDelta)
    {
        normalized = (event.wheelDelta % 120 - 0) == -0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
    }
    else
    {
        var rawAmmount = event.deltaY ? event.deltaY : event.detail;
        normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
    }
    return normalized*-0.2;
};

var tooltipTimeout=null;

CABLES.UI=CABLES.UI || {};

CABLES.UI.showToolTip=function(e,txt)
{
    $('.tooltip').show();
    $('.tooltip').css('top',e.clientY+12);
    $('.tooltip').css('left',e.clientX+12);
    $('.tooltip').html(txt);
};


CABLES.UI.hideToolTip=function()
{
    $('.tooltip').hide();
};

$(document).on('mouseover mousemove', '.tt', function(e)
{
    clearTimeout(tooltipTimeout);
    var txt=$(this).data('tt');
    tooltipTimeout = setTimeout(function()
    {
        CABLES.UI.showToolTip(e,txt);
    }, 300);
});

$(document).on('mouseout', '.tt', function()
{
    clearTimeout(tooltipTimeout);
    CABLES.UI.hideToolTip();
});





CABLES.UI=CABLES.UI|| {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI=function()
{
    var self=this;
    var showTiming=false;
    var showEditor=false;
    var _scene=new Scene();
    _scene.gui=true;
    var _patch=null;

    this.timeLine=function()
    {
        return _patch.timeLine;
    };

    this.scene=function()
    {
        return _scene;
    };

    this.patch=function()
    {
        return _patch;
    };

    this.timingHeight=250;
    this.rendererWidth=640;
    this.rendererHeight=360;

    this.setLayout=function()
    {
        if(self.rendererWidth===undefined || self.rendererHeight===undefined || self.rendererWidth>window.innerWidth*0.99 || self.rendererHeight>window.innerHeight*0.99)
        {
            self.rendererWidth=window.innerWidth*0.4;
            self.rendererHeight=window.innerHeight*0.25;
        }

        var statusBarHeight=26;
        var menubarHeight=33;
        var optionsWidth=400;

        var timelineUiHeight=40;
        var timedisplayheight=25;

        var patchHeight=window.innerHeight-statusBarHeight-menubarHeight-2;

        var patchWidth=window.innerWidth-self.rendererWidth-8;
        var patchLeft=0;

        if(showTiming)
        {
            patchHeight=patchHeight-this.timingHeight-2;

            $('.easingselect').css('bottom',40);
            $('.easingselect').css('left',patchWidth+30);
        }
        else
        {
            patchHeight-=timelineUiHeight;
        }

        if(showEditor)
        {
            var editorbarHeight=30;
            $('#editor').show();
            $('#editorbar').css('height',editorbarHeight);
            $('#editorbar').css('top',menubarHeight+2);

            patchWidth=patchWidth/2;
            patchLeft=patchWidth;
            $('#ace').css('height',patchHeight-2-editorbarHeight);
            $('#ace').css('width',patchWidth);
            $('#ace').css('top',menubarHeight+2+editorbarHeight);
            $('#ace').css('left',0);
        }
        else
        {
            $('#editor').hide();
        }




        $('#patch svg').css('height',patchHeight-2);
        $('#patch svg').css('width',window.innerWidth-self.rendererWidth-9);

        $('#splitterPatch').css('left',window.innerWidth-self.rendererWidth-5);
        $('#splitterPatch').css('height',patchHeight+timelineUiHeight+2);
        $('#splitterPatch').css('top',menubarHeight);
        $('#splitterRenderer').css('top',self.rendererHeight);
        $('#splitterRenderer').css('width',self.rendererWidth);
        $('#splitterRendererWH').css('right',self.rendererWidth-35);
        $('#splitterRendererWH').css('top',self.rendererHeight-30);

        $('#patch').css('height',patchHeight-2);
        $('#patch').css('width',patchWidth);
        $('#patch').css('top',menubarHeight+2);
        $('#patch').css('left',patchLeft);

        $('#timelineui').css('width',window.innerWidth-self.rendererWidth-2);

        $('#timing').css('width',window.innerWidth-self.rendererWidth-2);
        $('#timing').css('bottom',statusBarHeight);




        if(showTiming)
        {
            $('#timing').css('height',this.timingHeight);

            $('#timetimeline').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timetimeline').css('height',this.timingHeight-timedisplayheight);
            $('#timetimeline').css('margin-top',timelineUiHeight);

            $('#timetimeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timetimeline svg').css('height',this.timingHeight-timedisplayheight-timelineUiHeight-statusBarHeight);

            $('#timeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timeline svg').css('height',this.timingHeight-timedisplayheight);
            $('#timeline svg').css('margin-top',timelineUiHeight+timedisplayheight);
            $('#timeline svg').show();
            $('#timetimeline').show();
            $('#keycontrols').show();

            $('#splitterTimeline').show();
            $('#splitterTimeline').css('bottom',this.timingHeight-timedisplayheight+timelineUiHeight+8);
        }
        else
        {
            $('#keycontrols').hide();
            $('#timetimeline').hide();
            $('#timeline svg').hide();
            $('#timing').css('height',timelineUiHeight);

            $('#splitterTimeline').hide();
        }

        if(self.timeLine())self.timeLine().updateViewBox();

        $('#splitterTimeline').css('width',window.innerWidth-self.rendererWidth-2);

        $('#options').css('left',window.innerWidth-self.rendererWidth-1);
        $('#options').css('top',self.rendererHeight);
        $('#options').css('width',optionsWidth);
        $('#options').css('height',window.innerHeight-self.rendererHeight-statusBarHeight);

        $('#meta').css('right',0);
        $('#meta').css('top',self.rendererHeight);
        $('#meta').css('width',self.rendererWidth-optionsWidth);
        $('#meta').css('height',window.innerHeight-self.rendererHeight-statusBarHeight);

        $('#performance_glcanvas').css('bottom',statusBarHeight);
        // $('#performance_glcanvas').css('right',($('#performance_glcanvas').width()-(self.rendererWidth+optionsWidth))) ;
        $('#performance_glcanvas').css('right',self.rendererWidth-optionsWidth-$('#performance_glcanvas').width()+1 );
        // $('#performance_glcanvas').css('max-width',self.rendererWidth-optionsWidth);


        $('#menubar').css('top',0);
        $('#menubar').css('width',window.innerWidth-self.rendererWidth-10);
        $('#menubar').css('height',menubarHeight);

        if(self.rendererWidth===0)
        {
            $('#glcanvas').attr('width',window.innerWidth);
            $('#glcanvas').attr('height',window.innerHeight);
            $('#glcanvas').css('z-index',9999);
        }
        else
        {
            $('#glcanvas').attr('width',self.rendererWidth);
            $('#glcanvas').attr('height',self.rendererHeight);
        }
        CABLES.UI.setStatusText('webgl renderer set to size: '+self.rendererWidth+' x '+self.rendererHeight);
    };

    this.importDialog=function()
    {
        var html='';
        html+='import:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        html+='<br/>';
        html+='<br/>';
        html+='<a class="button" onclick="gui.patch().scene.clear();gui.patch().scene.deSerialize($(\'#serialized\').val());CABLES.UI.MODAL.hide();">import</a>';
        CABLES.UI.MODAL.show(html);
    };

    this.exportDialog=function()
    {
        var html='';
        html+='export:<br/><br/>';
        html+='<textarea id="serialized"></textarea>';
        CABLES.UI.MODAL.show(html);
        $('#serialized').val(self.patch().scene.serialize());
    };

    var oldRendwerWidth,oldRendwerHeight;
    this.cycleRendererSize=function()
    {
                console.log('cycleRendererSize');
                
        if(self.rendererWidth!==0)
        {
            oldRendwerWidth=self.rendererWidth;
            oldRendwerHeight=self.rendererHeight;
            self.rendererWidth=0;
        }
        else
        {
            self.rendererWidth=oldRendwerWidth;
            self.rendererHeight=oldRendwerHeight;
        }

        self.setLayout();
    };

    this.isShowingTiming=function()
    {
        return showTiming;
    };

    this.showTiming=function()
    {
        showTiming=true;
        self.setLayout();
    };

    this.toggleTiming=function()
    {
        showTiming=!showTiming;
        self.setLayout();
    };

    this.showLibrary=function(inputId,filterType)
    {
        CABLES.UI.fileSelect.show(inputId,filterType);
    };


    this.createProject=function()
    {
        CABLES.api.post('project',{name: prompt('projectname','') },function(d)
        {
            CABLES.UI.SELECTPROJECT.doReload=true;

            document.location.href='#/project/'+d._id;
        });
    };

    this.showHelp=function()
    {
        var html=CABLES.UI.getHandleBarHtml('help1');
        CABLES.UI.MODAL.show(html);
    };

    this.deleteCurrentProject=function()
    {
        if(confirm('delete ?'))
        {
            CABLES.api.delete('project/'+self.patch().getCurrentProject()._id,{},
                function()
                {
                    CABLES.UI.SELECTPROJECT.doReload=true;
                } );
        }
    };

    this.bind=function()
    {
        $('#glcanvas').attr('tabindex','3');

        $('#button_toggleTiming').bind("mousedown", function (event) { self.toggleTiming(); });
        $('#button_cycleRenderSize').bind("mousedown", function (event) { self.cycleRendererSize(); });
        $('.button_saveCurrentProject').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.button_addOp').bind("mousedown", function (event) { CABLES.UI.OPSELECT.showOpSelect({x:0,y:0}); });
        $('#button_subPatchBack').bind("click", function (event) { self.patch().setCurrentSubPatch(0); });
        $('#button_settings').bind("click", function (event) { self.patch().showProjectParams(); });

        $('#help').bind("click", function (event) { self.showHelp(); });

        window.addEventListener( 'resize', self.setLayout, false );

        document.addEventListener('copy', function(e)
        {
            if($('#patch').is(":focus")) self.patch().copy(e);
            if($('#timeline').is(":focus"))self.patch().timeLine.copy(e);
        });

        document.addEventListener('paste', function(e)
        {
            if($('#patch').is(":focus")) self.patch().paste(e);
            if($('#timeline').is(":focus"))self.patch().timeLine.paste(e);
        });

        document.addEventListener('cut', function(e)
        {
            if($('#patch').is(":focus")) self.patch().cut(e);
            if($('#timeline').is(":focus"))self.patch().timeLine.cut(e);
        });

        var spaceBarStart = 0;


        $('#timeline, #patch').keyup(function(e)
        {
            switch(e.which)
            {
                case 32: // space play
                    var timeused=Date.now()-spaceBarStart;
                    if(timeused<150) self.timeLine().togglePlay();
                    spaceBarStart=0;
                break;
            }
        });

        $(document).keydown(function(e)
        {
            switch(e.which)
            {
                default:
                        console.log('e.which',e.which);
                        
                break;
                case 49: // 1 - editor
                if(e.shiftKey)
                {
                    showEditor=!showEditor;
                    self.setLayout();

                    var editor = ace.edit("ace");
                    editor.setTheme("ace/theme/twilight");
                    editor.session.setMode("ace/mode/javascript");
                    editor.resize();
                }

                break;

                case 79: // o - open
                    if(e.metaKey || e.ctrlKey)
                    {
                        CABLES.UI.SELECTPROJECT.show();
                        e.preventDefault();
                    }
                break;
                case 83: // s - save
                    if(e.metaKey || e.ctrlKey)
                    {
                        if(!e.shiftKey)
                        {
                            self.patch().saveCurrentProject();
                            CABLES.UI.SELECTPROJECT.doReload=true;
                            e.preventDefault();
                        }
                        else
                        {
                            CABLES.api.post('project',{name: prompt('projectname','') },function(d)
                            {
                                CABLES.UI.SELECTPROJECT.doReload=true;
                                self.patch().saveCurrentProject(function(){
                                    document.location.href='#/project/'+d._id;
                                },d._id,d.name);
                                
                            });
                        }
                    }
                break;
                case 78: // n - new project
                    if(e.metaKey || e.ctrlKey)
                    {
                        self.createProject();
                    }
                break;
                case 27:
                    if(e.metaKey || e.ctrlKey)
                    {
                        CABLES.UI.SELECTPROJECT.show();
                        return;
                    }

                    $('.tooltip').hide();

                    if(self.rendererWidth===0)
                    {
                        self.cycleRendererSize();
                    }
                    else
                    if( $('#library').is(':visible') )
                    {
                        $('#library').hide();
                    }
                    else
                    if( $('#sidebar').is(':visible') )
                    {
                        $('#sidebar').animate({width:'toggle'},200);
                    }
                    else
                    if( $('.easingselect').is(':visible') )
                    {
                        $('.easingselect').hide();
                    }
                    else
                    if( $('#modalcontent').is(':visible') )
                    {
                        CABLES.UI.MODAL.hide();
                    }
                    else
                    {
                        CABLES.UI.OPSELECT.showOpSelect({x:0,y:0});
                    }

                break;
            }
        });

        $('#timeline, #patch').keydown(function(e)
        {
            switch(e.which)
            {
                case 32: // space play
                    if(spaceBarStart===0) spaceBarStart = Date.now();
                break;

                case 74: // j
                    self.timeLine().jumpKey(-1);
                break;
                case 75: // k
                    self.timeLine().jumpKey(1);
                break;
            }
        });

    };


    function initRouting()
    {
        var router = new Simrou();

        router.addRoute('/').get(function(event, params)
        {
            if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
                self.scene.clear();

            self.patch().scene.deSerialize(localStorage.holo);
        });

        router.addRoute('/project/:id').get(function(event, params)
        {
            CABLES.UI.MODAL.showLoading('loading');

            CABLES.api.get('project/'+params.id,function(proj)
            {
                self.patch().setProject(proj);
            });
        });

        router.start('/');
    }

    this.importJson3D=function(id)
    {
        CABLES.api.get('json3dimport/'+id,
            function(data)
            {
                console.log('data',data);
            }
        );
        
    };

    this.loadUser=function()
    {
        CABLES.api.get('user/me',
            function(data)
            {
                if(data.user)
                {
                    $('#loggedout').hide();
                    $('#loggedin').show();
                    $('#username').html(data.user.username);
                }
            },function(data)
            {
                $('#loggedout').show();
                $('#loggedin').hide();
            });
    };

    this.init=function()
    {
        _patch=new CABLES.UI.Patch(this);
        _patch.show(_scene);

        initRouting();
        self.loadUser();
    };

};


document.addEventListener("DOMContentLoaded", function(event)
{
    $(document).bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });

    gui=new CABLES.UI.GUI();
    // _patch=ui;

    gui.init();
    gui.bind();

});



CABLES.UI=CABLES.UI|| {};

CABLES.UI.uiConfig=
{
    portSize:10,
    portHeight:7,
    portPadding:2,

    colorBackground:'#333',
    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#888',
    colorOpBg:'#ddd',
    colorOpBgSelected:'#ff9',
    colorPort:'#6c9fde',
    colorRubberBand:'#6c9fde',
    colorPortHover:'#f00',
    colorPatchStroke:'#6c9fde',

    colorSelected:'#fff',
    colorKey:'#6c9fde',
    colorKeyOther:'#ea6638',
    colorCursor:'#ea6638',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:1024,h:768},{w:1280,h:720},{w:0,h:0}],

    getPortColor:function(port)
    {
        if(!port)return '#ff0000';
        var type=port.getType();
        if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
        else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
        else if(type==OP_PORT_TYPE_OBJECT)  return '#26a92a';
        else if(type==OP_PORT_TYPE_ARRAY)  return '#a02bbd';
        else if(type==OP_PORT_TYPE_DYNAMIC)  return '#666';
        
        else return '#c6c6c6';
    },

    linkingLine:
    {
        "stroke-width": 1,
    }


};


//http://html5doctor.com/drag-and-drop-to-server/

$("html").on("dragover", function(event)
{
    event.preventDefault();
    event.stopPropagation();
    $(this).addClass('dragging');
    CABLES.UI.MODAL.show("drop files to upload!");
    jQuery.event.props.push('dataTransfer');
});

$("html").on("dragleave", function(event)
{
    event.preventDefault();
    event.stopPropagation();
    $(this).removeClass('dragging');
});

$("html").on("drop", function(event)
{
    event.preventDefault();
    event.stopPropagation();

    CABLES.UI.MODAL.showLoading("uploading");

    var files = event.dataTransfer.files;
    var url='/api/project/'+gui.patch().getCurrentProject()._id+'/file';

    var formData = new FormData();
    $.each(files, function(key, value)
    {
        formData.append(key, value);
    });

    // now post a new XHR request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = function (event)
    {
        if (event.lengthComputable)
        {
            var complete = (event.loaded / event.total * 100 | 0);
            CABLES.UI.MODAL.showLoading('uploading ' + complete + '%');
        }
    };

    xhr.onload = function (e)
    {
        gui.patch().updateProjectFiles();
        if (xhr.status === 200)
        {
            CABLES.UI.MODAL.hide();
        }
        else
        {
            var msg='unknown';
            var res=JSON.parse(e.target.response);
            msg=res.msg;

            CABLES.UI.MODAL.show('upload error (' + xhr.status +') :'+msg);
        }
    };

    xhr.send(formData);

});
