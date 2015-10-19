


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
        $('#performance_glcanvas').css('max-width',self.rendererWidth-optionsWidth);


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

