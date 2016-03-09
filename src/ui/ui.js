
CABLES.UI=CABLES.UI|| {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI=function()
{
    var self=this;
    var showTiming=false;
    var showingEditor=false;
    var _scene=new Scene();
    _scene.gui=true;
    var _patch=null;
    var _editor=new CABLES.Editor();
    var _chat = new CABLES.Chat();
    var _userManager=null;
    var _userOpManager=null;


    var favIconLink = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(favIconLink);
    favIconLink.type = 'image/x-icon';
    favIconLink.rel = 'shortcut icon';

    this.user=null;

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

    this.editor=function()
    {
        return _editor;
    };

    this.timingHeight=250;
    this.rendererWidth=640;
    this.rendererHeight=360;
    this.editorWidth=700;

    this.showEditor=function()
    {
        if(!showingEditor)
        {
            showingEditor=true;
            this.setLayout();
        }
    };

    this.closeEditor=function()
    {
        if(showingEditor)
        {
            showingEditor=false;
            this.setLayout();
        }
    };

    this.setLayout=function()
    {
        $('#menubar').show();
        $('#timelineui').show();

        if(self.rendererWidth===undefined || self.rendererHeight===undefined || self.rendererWidth>window.innerWidth*0.99 || self.rendererHeight>window.innerHeight*0.99)
        {
            self.rendererWidth=window.innerWidth*0.4;
            self.rendererHeight=window.innerHeight*0.25;
        }
        if(self.rendererWidth===0)
        {
            self.rendererWidth=window.innerWidth;
            self.rendererHeight=window.innerHeight;
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


        if(showingEditor)
        {
            if(self.editorWidth>window.innerWidth-self.rendererWidth)
                self.rendererWidth=window.innerWidth-self.editorWidth;


            var editorbarHeight=70;
            $('#editor').show();
            $('#editorbar').css('height',editorbarHeight);
            $('#editorbar').css('top',menubarHeight+2);

            // patchLeft=self.editorWidth;
            var editorHeight=patchHeight-2-editorbarHeight;
            $('#ace').css('height',editorHeight);
            $('#ace').css('width',self.editorWidth);
            $('#ace').css('top',menubarHeight+2+editorbarHeight);
            $('#ace').css('left',0);

            $('#editorbar').css('width',self.editorWidth);
            $('#splitterEditor').show();
            $('#splitterEditor').css('left',self.editorWidth);
            $('#splitterEditor').css('height',patchHeight-2);
            $('#splitterEditor').css('width',5);
            $('#splitterEditor').css('top',menubarHeight);

            patchWidth-=self.editorWidth-6;
            patchLeft=self.editorWidth+5;
        }
        else
        {
            $('#splitterEditor').hide();
            $('#editor').hide();
        }

        if(self.rendererWidth<100)self.rendererWidth=100;

        $('#patch svg').css('height',patchHeight-2);
        $('#patch svg').css('width',patchWidth-2);

        $('#splitterPatch').css('left',window.innerWidth-self.rendererWidth-5);
        $('#splitterPatch').css('height',patchHeight+timelineUiHeight+2);
        $('#splitterPatch').css('top',menubarHeight);
        $('#splitterRenderer').css('top',self.rendererHeight);
        $('#splitterRenderer').css('width',self.rendererWidth);
        $('#splitterRendererWH').css('right',self.rendererWidth-35);
        $('#splitterRendererWH').css('top',self.rendererHeight-30);

        $('#button_subPatchBack').css('margin-right',self.rendererWidth+20);


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
        CABLES.UI.setStatusText('webgl renderer set to size: '+self.rendererWidth+' x '+self.rendererHeight+' ESC to exit fullscreen');
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

    this.userManager=function()
    {
        _userManager=_userManager || new CABLES.UI.UserManager(self.patch().getCurrentProject()._id);
        return _userManager;
    };

    this.userOpManager=function()
    {
        _userOpManager=_userOpManager || new CABLES.UI.UserOpManager(self.patch().getCurrentProject()._id);
        return _userOpManager;
    };

    this.showUsers=function()
    {
        this.userManager().show();
    };

    this.showUserOps=function()
    {
        this.userOpManager().show();
    };

    this.showVersions=function()
    {
        CABLES.UI.MODAL.showLoading('loading versions');
        CABLES.api.get('project/'+self.patch().getCurrentProject()._id+'/versions',function(r)
        {
            var html='<h2>project history</h2>';

            if(r.length===0)
            {
                html+='no old versions of project available. save project first.<br/><br/>';
            }
            else
            {
                html+='<select id="versionselect">';
                html+='<option>select...</option>';
                for(var i in r)
                {
                    html+='<option value="/ui/#/project/'+r[i].projectId+'/v/'+r[i]._id+'">'+r[i].name+' / '+r[i].readableDate+' ('+r[i].readableDateSince+')</option>';
                }
                html+='</select>';
                html+='<br/><br/><br/>';
                html+='<a onclick="document.location.href=$(\'#versionselect\').val()" class="bluebutton">load</a>';
                html+='<br/><br/>';
            }

            CABLES.UI.MODAL.show(html);
            // console.log(r);
        });
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


    this.deleteCurrentProject=function()
    {
        if(confirm('delete ?'))
        {
            CABLES.api.delete('project/'+self.patch().getCurrentProject()._id,{},
                function()
                {
                    // CABLES.UI.SELECTPROJECT.doReload=true;
                    document.location.href="/";
                } );
        }
    };

    this.convertFile=function(fileId)
    {


        CABLES.api.post('project/'+self.patch().getCurrentProject()._id+'/file/convert/'+fileId,{options:
            {
                removeTangents:$('#convert_remove_tangents').is(':checked'),
                removeTexcoords:$('#convert_remove_texcoords').is(':checked'),
            }},
            function(r)
            {
                CABLES.UI.MODAL.show('<pre>'+JSON.stringify(r,null,4)+'</pre>');
            });
    };

    this.showConverter=function(fileId)
    {
        var html = CABLES.UI.getHandleBarHtml(
            'params_convert',
            {
                fileId:fileId

            });


        $('#options').html(html);

    };

    this.bind=function()
    {
        $('#glcanvas').attr('tabindex','3');

        $('#button_toggleTiming').bind("mousedown", function (event) { self.toggleTiming(); });
        $('#button_cycleRenderSize').bind("mousedown", function (event) { self.cycleRendererSize(); });

        $('.button_saveCurrentProject').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.nav_patch_save').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.nav_patch_saveas').bind("mousedown", function (event) { self.patch().saveCurrentProjectAs(); });
        $('.nav_patch_new').bind("mousedown", function (event) { self.createProject(); });
        $('.nav_patch_clear').bind("mousedown", function (event) { if(confirm('really?'))gui.scene().clear(); });
        $('.nav_patch_export').bind("mousedown", function (event) { gui.patch().exportStatic(); });
        $('.nav_patch_settings').bind("click", function (event) { self.patch().showProjectParams(); });

        $('.nav_op_addOp').bind("mousedown", function (event) { CABLES.UI.OPSELECT.showOpSelect({x:0,y:0}); });
        $('#button_subPatchBack').bind("click", function (event) { self.patch().setCurrentSubPatch(0); });
        // $('#button_editor').bind("click", function (event) { showingEditor=!showingEditor;self.setLayout(); });

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
                    // console.log('e.which',e.which);
                break;

                case 79: // o - open
                    if(e.metaKey || e.ctrlKey)
                    {
                        CABLES.UI.SELECTPROJECT.show();
                        e.preventDefault();
                    }
                break;
                case 69: // e - editor save/execute/build
                    if(e.metaKey || e.ctrlKey)
                    {
                        if(showingEditor)
                        {
                            self.editor().save();
                        }

                    }
                break;
                case 83: // s - save
                    if(e.metaKey || e.ctrlKey)
                    {
                        if(!e.shiftKey)
                        {
                            if($('#patch').is(":focus"))
                            {
                                self.patch().saveCurrentProject();
                                CABLES.UI.SELECTPROJECT.doReload=true;
                            }
                            else
                            if(showingEditor)
                            {
                                self.editor().save();
                            }
                            e.preventDefault();
                        }
                        else
                        {
                            self.patch().saveCurrentProjectAs();
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

                    if(self.rendererWidth>window.innerWidth*0.9)
                    {
                        self.rendererWidth=window.innerWidth*0.4;
                        self.rendererHeight=window.innerHeight*0.25;
                        self.setLayout();
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
        if(!self.serverOps || !self.serverOps.finished())
        {
            // wait for userops finished loading....
            setTimeout(initRouting,100);
            return;
        }

        var router = new Simrou();

        router.addRoute('/').get(function(event, params)
        {
            if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20) self.scene.clear();

            self.patch().scene.deSerialize(localStorage.holo);
        });

        router.addRoute('/project/:id/v/:ver').get(function(event, params)
        {
            CABLES.UI.MODAL.showLoading('loading');
            CABLES.api.get('project/'+params.id+'/version/'+params.ver,function(proj)
            {
                self.patch().setProject(proj);
            });
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

    var infoTimeout=-1;

    this.editOpDoc=function(objName)
    {
        CABLES.api.clearCache();

        this.showEditor();

        this.getOpDoc(objName,false,function(content)
        {
            self.editor().addTab(
            {
                content:content,
                title:objName,
                syntax:'md',
                onSave:function(setStatus,content)
                {
                    CABLES.api.post(
                        'doc/ops/edit/'+objName,
                        {content:content},
                        function(res)
                        {
                            setStatus('saved');
                            console.log('res',res);
                        },
                        function(res)
                        {
                            setStatus('error: not saved');
                            console.log('err res',res);
                        }
                    );

                }
            });
        });

    };

    this.editProjectDescription=function(objName)
    {
        this.showEditor();

        self.editor().addTab(
        {
            content:self.patch().getCurrentProject().description || '### '+self.patch().getCurrentProject().name+'\n\n is great!',
            title:self.patch().getCurrentProject().name+' description',
            syntax:'md',
            onSave:function(setStatus,content)
            {
                CABLES.api.post(
                    'project/'+self.patch().getCurrentProject()._id+'/save_description',
                    {content:content},
                    function(res)
                    {
                        setStatus('saved');
                        console.log('res',res);
                    },
                    function(res)
                    {
                        setStatus('error: not saved');
                        console.log('err res',res);
                    }
                );
            }
        });

    };

    this.getOpDoc=function(opname,html,cb)
    {
        var apiUrl='doc/ops/'+opname;
        if(!html)apiUrl='doc/ops/md/'+opname;

        var cached=CABLES.api.hasCached(apiUrl);
        if(cached)
        {
            cb(cached.data.content);
            return;
        }

        if(infoTimeout!=-1)clearTimeout(infoTimeout);
        infoTimeout = setTimeout(function()
        {
            CABLES.api.getCached(
                apiUrl,
                function(res)
                {
                    if(!res.content)res.content='';
                    cb(res.content);
                },
                function(res){ console.log('err',res); }
                );

        }, 300);

    };

    this.showOpDoc=function(opname)
    {
        var docOpHead='<div class="panelhead">documentation</div><div>';
        var docOpFooter='<br/><br/><a onclick="gui.editOpDoc(\''+opname+'\')" class="button fa fa-pencil" target="_blankkk">&nbsp;edit</a></div>';

        this.getOpDoc(opname,true,function(html)
        {
            $('#doc_op').html(docOpHead+html+docOpFooter);
        });
    };


    this.loadUser=function()
    {

        CABLES.api.get('user/me',
            function(data)
            {
                if(data.user)
                {
                    self.user=data.user;
                    $('#loggedout').hide();
                    $('#loggedin').show();
                    $('#username').html(data.user.username);

                    self.serverOps=new CABLES.UI.ServerOps(self);

                }
            },function(data)
            {
                $('#loggedout').show();
                $('#loggedin').hide();
            });

            console.log('data.user',self.user);
    };


    this.setStateUnsaved=function()
    {
        document.title=gui.patch().getCurrentProject().name+' *';
        favIconLink.href = '/favicon/favicon_orange.ico';

        window.onbeforeunload = function (event)
        {
            var message = 'unsaved content!';
            if(typeof event == 'undefined')
            {
                event = window.event;
            }
            if(event)
            {
                event.returnValue = message;
            }
            return message;
        };
    };

    this.setStateSaved=function()
    {
        favIconLink.href = '/favicon/favicon.ico';

        document.title=''+gui.patch().getCurrentProject().name;
        window.onbeforeunload = null;
    };





    this.init=function()
    {
        _patch=new CABLES.UI.Patch(this);
        _patch.show(_scene);

        initRouting();


    };
    self.loadUser();

};


document.addEventListener("DOMContentLoaded", function(event)
{
    console.log("starting...");
    $(document).bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });

    gui=new CABLES.UI.GUI();
    // _patch=ui;

    gui.init();
    gui.bind();

});
