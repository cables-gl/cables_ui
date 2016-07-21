
CABLES.UI=CABLES.UI|| {};
CABLES.undo = new UndoManager();

CABLES.UI.GUI=function()
{

    var self=this;
    var userOpsLoaded=false;
    var showTiming=false;
    var showingEditor=false;
    var showMiniMap=false;
    var _scene=new Scene();
    _scene.gui=true;
    var _patch=null;
    var _editor=new CABLES.Editor();
    var _projectSettings=null;
    var _userOpManager=null;
    var _jobs=new CABLES.UI.Jobs();
    var _find=new CABLES.UI.Find();
    var _introduction = new CABLES.UI.Introduction();
    this.opDocs=new CABLES.UI.OpDocs();
    // var _socket=null;
    var _connection=null;
    var savedState=true;
    var metaCode=new CABLES.UI.MetaCode();
    this.bookmarks=new CABLES.UI.Bookmarks();
    this.preview=new CABLES.UI.Preview();

    var favIconLink = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(favIconLink);
    favIconLink.type = 'image/x-icon';
    favIconLink.rel = 'shortcut icon';

    this.profiler=null;
    this.user=null;

    this.project=function()
    {
        return self.patch().getCurrentProject();
    };

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

    this.jobs=function()
    {
        return _jobs;
    };

    this.find=function()
    {
        return _find;
    };

    this.introduction=function()
    {
        return _introduction;
    };

    this.projectSettings=function()
    {
        return _projectSettings;
    };

    this.infoHeight=300;
    this.timingHeight=250;
    this.rendererWidth=640;
    this.rendererHeight=360;
    this.editorWidth=700;


    this.toggleEditor=function()
    {
        if(showingEditor)self.closeEditor();
            else self.showEditor();
        self.setLayout();
    };

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


        // var statusBarHeight=26;
        var menubarHeight=30;
        var optionsWidth=400;

        var timelineUiHeight=40;
        var timedisplayheight=25;

        var patchHeight=window.innerHeight-menubarHeight-2;

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

            _editor.resize();

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

        $('#minimapContainer').show();
        $('#minimapContainer').css('left',patchLeft+patchWidth-CABLES.UI.uiConfig.miniMapWidth-4);
        if(showMiniMap)
        {
            $('#minimapContainer').css('top',menubarHeight+patchHeight-CABLES.UI.uiConfig.miniMapHeight-24);
            $('#minimap').show();
            $('#minimapContainer .title_closed').hide();
            $('#minimapContainer .title_opened').show();
        }
        else
        {
            $('#minimapContainer .title_closed').show();
            $('#minimapContainer .title_opened').hide();
            $('#minimapContainer').css('top',menubarHeight+patchHeight-24);
            $('#minimapContainer').css('width',CABLES.UI.uiConfig.miniMapWidth);
            $('#minimap').hide();
        }

        $('#timelineui').css('width',window.innerWidth-self.rendererWidth-2);

        $('#timing').css('width',window.innerWidth-self.rendererWidth-2);
        $('#timing').css('bottom',0);




        if(showTiming)
        {
            $('#timing').css('height',this.timingHeight);

            $('#timetimeline').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timetimeline').css('height',this.timingHeight-timedisplayheight);
            $('#timetimeline').css('margin-top',timelineUiHeight);

            $('#timetimeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timetimeline svg').css('height',this.timingHeight-timedisplayheight-timelineUiHeight);

            $('#timeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timeline svg').css('height',this.timingHeight-timedisplayheight);
            $('#timeline svg').css('margin-top',timelineUiHeight+timedisplayheight);
            $('#timeline svg').show();
            $('#timetimeline').show();
            $('#keycontrols').show();

            $('#splitterTimeline').show();
            $('#splitterTimeline').css('bottom',this.timingHeight-4);
            $('#timelineTitle').show();
        }
        else
        {
            $('#timelineTitle').hide();
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
        $('#options').css('height',window.innerHeight-self.rendererHeight);

var metaWidth=self.rendererWidth-optionsWidth;
        $('#meta').css('right',0);
        $('#meta').css('top',self.rendererHeight);
        $('#meta').css('width',metaWidth);
        $('#meta').css('height',window.innerHeight-self.rendererHeight);

        $('#performance_glcanvas').css('bottom',0);
        // $('#performance_glcanvas').css('right',($('#performance_glcanvas').width()-(self.rendererWidth+optionsWidth))) ;
        $('#performance_glcanvas').css('right',self.rendererWidth-optionsWidth-$('#performance_glcanvas').width()+1 );
        // $('#performance_glcanvas').css('max-width',self.rendererWidth-optionsWidth);


        $('#menubar').css('top',0);
        $('#menubar').css('width',window.innerWidth-self.rendererWidth-10);
        $('#menubar').css('height',menubarHeight);



        $('#splitterMeta').css('bottom',self.infoHeight+'px');
        $('#splitterMeta').css('width',metaWidth+'px');

        $('#infoArea').css('width',(metaWidth-20)+'px');
        $('#infoArea').css('height',(self.infoHeight-22)+'px');
        $('#infoArea').css('bottom','0px');

        $('#meta_content').css('height',window.innerHeight-self.rendererHeight-self.infoHeight-50);



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
            $('#cablescanvas').attr('width',self.rendererWidth);
            $('#cablescanvas').attr('height',self.rendererHeight);
            $('#cablescanvas').css('width',self.rendererWidth+'px');
            $('#cablescanvas').css('height',self.rendererHeight+'px');
        }
        CABLES.UI.setStatusText('webgl renderer set to size: '+self.rendererWidth+' x '+self.rendererHeight+' ESC to exit fullscreen');
        $('#glcanvas').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.canvas);
        },function()
        {
            CABLES.UI.hideInfo();
        });
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

    this.userOpManager=function()
    {
        _userOpManager=_userOpManager || new CABLES.UI.UserOpManager(self.project()._id);
        return _userOpManager;
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

    function updateTimingIcon()
    {
        if(showTiming)
        {
            $('#button_toggleTiming i').removeClass('fa-caret-up');
            $('#button_toggleTiming i').addClass('fa-caret-down');
        }
        else
        {
            $('#button_toggleTiming i').removeClass('fa-caret-down');
            $('#button_toggleTiming i').addClass('fa-caret-up');
        }
    }

    this.showMiniMap=function()
    {
        showMiniMap=true;
        self.setLayout();
    };


    this.toggleMiniMap=function()
    {
        showMiniMap=!showMiniMap;
        self.setLayout();
    };

    this.showTiming=function()
    {
        showTiming=true;
        updateTimingIcon();
        self.setLayout();
    };

    this.toggleTiming=function()
    {
        showTiming=!showTiming;
        updateTimingIcon();
        self.setLayout();
    };

    this.showMetaScreen=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'meta_screen',
            {
            });

        $('#meta_content_screen').html(html);


    };

    this.showMetaUiDebug=function()
    {

        var numVisibleOps=0;
        for(var i in self.ops)
        {
            if(!self.ops[i].isHidden())numVisibleOps++;
        }

        var html = CABLES.UI.getHandleBarHtml(
            'uiDebug',
            {
                numOps:gui.scene().ops.length,
                numVisibleOps:numVisibleOps,
                numSvgElements: $('#patch svg *').length,
                startup:CABLES.startup.log
            });

        $('#meta_content_debug').html(html);


    };

    this.showLibrary=function(inputId,filterType)
    {
        CABLES.UI.fileSelect.show(inputId,filterType);
    };

    this.setProjectName=function(name)
    {
        $('.projectname').html('&nbsp;&nbsp;'+name);
    };

    this.createProject=function()
    {
        var name=prompt('projectname','');
        if(name)
        {
            CABLES.api.post('project',{"name":name },function(d)
            {
                CABLES.UI.SELECTPROJECT.doReload=true;

                document.location.href='#/project/'+d._id;
            });

        }
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

    // this.convertFile=function(fileId)
    // {
    //     CABLES.api.post('project/'+self.patch().getCurrentProject()._id+'/file/convert/'+fileId,{options:
    //         {
    //             removeTangents:$('#convert_remove_tangents').is(':checked'),
    //             removeTexcoords:$('#convert_remove_texcoords').is(':checked'),
    //         }},
    //         function(r)
    //         {
    //             CABLES.UI.MODAL.show('<pre>'+JSON.stringify(r,null,4)+'</pre>');
    //         });
    // };

    this.getUserOs=function()
    {
      var OSName="Unknown OS";
      if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
      if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
      if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
      if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";

      return OSName;
  };

    /* Returns the default mod key for a OS */
    this.getModKeyForOs=function(os)
    {
      switch(os) {
        case 'Windows':
          return 'ctrl';
        case 'MacOS':
          return 'cmd';
        case 'UNIX':
          return 'cmd';
        default:
          return 'mod';
      }
    };

    /* Goes through all nav items and replaces "mod" with the OS-dependent modifier key */
    this.replaceNavShortcuts=function()
    {
      var osMod = gui.getModKeyForOs(gui.getUserOs());
        $("nav ul li .shortcut").each(function(){
            var newShortcut = $(this).text().replace("mod", osMod);
            $(this).text(newShortcut);
        });
    };

    this.showFile=function(fileId,file)
    {
        var html = CABLES.UI.getHandleBarHtml(
            'params_file',
            {
                file:file,
                fileId:fileId,
                projectId:self.patch().getCurrentProject()._id
            });

        $('#options').html(html);
    };

    this.showConverter=function(converterId,projectId,fileId,converterName)
    {
        var html = CABLES.UI.getHandleBarHtml(
            'params_convert',
            {
                "converterId":converterId,
                "converterName":converterName,
                "projectId":projectId,
                "fileId":fileId
            });

        $('#options').html(html);
    };

    this.bind=function(cb)
    {
        $('#glcanvas').attr('tabindex','3');

        $('#button_toggleTiming').bind("click", function (event) { self.toggleTiming(); });
        $('#button_cycleRenderSize').bind("click", function (event) { self.cycleRendererSize(); });

        // $('.button_saveCurrentProject').bind("mousedown", function (event) { self.patch().saveCurrentProject(); });
        $('.nav_patch_save').bind("click", function (event) { self.patch().saveCurrentProject(); });
        $('.nav_patch_saveas').bind("click", function (event) { self.patch().saveCurrentProjectAs(); });
        $('.nav_patch_new').bind("click", function (event) { self.createProject(); });
        $('.nav_patch_clear').bind("click", function (event) { if(confirm('really?'))gui.scene().clear(); });
        $('.nav_patch_export').bind("click", function (event) { gui.patch().exportStatic(); });
        $('.nav_patch_settings').bind("click", function (event) { self.showSettings(); });
        $('.nav_patch_browse_examples').bind("click", function (event) { var win = window.open('https://cables.gl/examples', '_blank'); win.focus(); });
        $('.nav_patch_browse_favourites').bind("click", function (event) { var win = window.open('https://cables.gl/myfavs', '_blank'); win.focus(); });
        $('.nav_patch_browse_public').bind("click", function (event) { var win = window.open('https://cables.gl/projects', '_blank'); win.focus(); });

        $('.nav_patch_profile').bind("click", self.showProfiler);


        // --- Help menu
        // Documentation
        $('.nav_help_about').bind("click", function (event) {
          // TODO: Show popup which explains what cables is and who develops it
        });
        $('.nav_help_documentation').bind("click", function (event) {
          var win = window.open('https://docs.cables.gl', '_blank');
          if(win){
              //Browser has allowed it to be opened
              win.focus();
          } else{
              //Broswer has blocked it
              alert('Please allow popups for this site');
          }
        });

        // Introduction
        $('.nav_help_introduction').bind("click", function (event) { self.introduction().showIntroduction(); });

        $('.nav_op_addOp').bind("click", function (event) { CABLES.UI.OPSELECT.showOpSelect({x:0,y:0}); });
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
            if(CABLES.UI.suggestions && (e.keyCode > 64 && e.keyCode < 91) )
            {
                if(CABLES.UI.suggestions) CABLES.UI.suggestions.showSelect();
                return;
            }

            switch(e.which)
            {
                default:
                    // console.log('e.which',e.which);
                break;

                case 49:
                    if(e.ctrlKey)self.toggleEditor();
                    break;
                case 112:  // f1
                    self.toggleEditor();
                    break;


                case 67:  //c center
                    if($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey)
                    {
                        self.patch().centerViewBoxOps();
                    }
                    break;

                case 70:
                    if(e.metaKey || e.ctrlKey)
                    {
                        if($('#patch').is(":focus"))
                        {
                            _find.show();
                            // self.patch().copy(e);
                            e.preventDefault();
                        }

                    }
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
                            else
                            {
                                self.patch().saveCurrentProject();
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
                    if(CABLES.UI.suggestions)
                    {
                        console.log(CABLES.UI.suggestions);
                        CABLES.UI.suggestions.close();
                        CABLES.UI.suggestions=null;
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
                        if(showingEditor) self.editor().focus();
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

        initRouting(cb);
    };


    this.waitToShowUI=function()
    {
        $('#loadingstatus').hide();
        $('#mainContainer').show();
    };

    function initRouting(cb)
    {
        if( !self.serverOps || !self.serverOps.finished())
        {
            // wait for userops finished loading....
            setTimeout(function()
            {
                initRouting(cb);
            },100);
            return;
        }

        logStartup('init routing...');
        var router = new Simrou();

        router.addRoute('/').get(function(event, params)
        {
            // if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20) self.scene.clear();
            //
            // self.patch().scene.deSerialize(localStorage.holo);
        });

        router.addRoute('/project/:id/v/:ver').get(function(event, params)
        {
            CABLES.UI.MODAL.showLoading('Loading');
            CABLES.api.get('project/'+params.id+'/version/'+params.ver,function(proj)
            {
                self.patch().setProject(proj);
            });
        });
        router.addRoute('/project').get(function(event, params)
        {
            console.log('no projectid?');
            $('#loadingInfo').append('Error: No Project ID in URL');
        });

        router.addRoute('/project/:id').get(function(event, params)
        {
            CABLES.UI.MODAL.showLoading('Loading');
            CABLES.api.get('project/'+params.id,function(proj)
            {
                incrementStartup();
                var userOpsUrls=[];
                for(var i in proj.userList)
                    userOpsUrls.push('/api/ops/code/'+proj.userList[i]);

                loadjs( userOpsUrls,'userops'+proj._id);
                loadjs.ready('userops'+proj._id,function()
                {
                    userOpsLoaded=true;
                    incrementStartup();
                    logStartup('User Ops loaded');
                    cb();

                    self.patch().setProject(proj);
                    if(proj.ui) self.bookmarks.set(proj.ui.bookmarks);
                    metaCode.init();
                });
            },function()
            {
                console.log('hurr');
                    $('#loadingInfo').append('Error: Unknown Project');

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
                syntax:'Markdown',
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


    this.getOpDoc=function(opname,html,cb)
    {
        cb(this.opDocs.get(opname));
    };

    this.saveScreenshot=function(filename,cb)
    {
        var w=$('#glcanvas').attr('width');
        var h=$('#glcanvas').attr('height');
        $('#glcanvas').attr('width',$('#render_width').val());
        $('#glcanvas').attr('height',$('#render_height').val());


        if(!filename)filename='cables_screenshot.png';
            else filename+='.png';

        gui.patch().scene.cgl.doScreenshotClearAlpha=$('#render_removeAlpha').is(':checked');

        console.log('gui.patch().scene.cgl.doScreenshotClearAlpha ',gui.patch().scene.cgl.doScreenshotClearAlpha);
        gui.patch().scene.cgl.doScreenshot=true;
        setTimeout(function()
        {
            $('#glcanvas').attr('width',w);
            $('#glcanvas').attr('height',h);

            var img=gui.patch().scene.cgl.screenShotDataURL;//.replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
            var anchor = document.createElement('a');

            anchor.setAttribute('download', filename);
            anchor.setAttribute('href', img);
            document.body.appendChild(anchor);

            setTimeout(function() {
                anchor.click();
                if(cb)cb();
            },66);

        },100);
    };


    this.renderScreenshots=function()
    {
        var startTime=parseFloat($('#render_start').val());
        var endTime=parseFloat($('#render_end').val());
        var fps=parseFloat($('#render_fps').val());
        var filename=$('#filename').val();

        new CABLES.UI.ImageSequenceExport(filename,startTime,endTime,fps);
    };

    this.showProfiler=function()
    {
        if(!self.profiler)self.profiler = new CABLES.UI.Profiler();
        self.profiler.show();
    };

    this.showMetaCode=function()
    {

        metaCode.show();
    };

    this.showSettings=function()
    {
        _projectSettings=new CABLES.ProjectSettings(self.patch().getCurrentProject());
        _projectSettings.show();
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
                    incrementStartup();
                    self.serverOps=new CABLES.UI.ServerOps(self);

                    logStartup('User Data loaded');
                }
            },function(data)
            {
                $('#loadingInfo').append('Error: You are not <a href="/"> logged in </a>');
            });
    };

    this.getSavedState=function()
    {
        return savedState;
    };

    this.updateProjectFiles=function(proj)
    {
        if(!proj)proj=self.project();
        if(!proj)return;
        $('#meta_content_files').html('');

        CABLES.api.get(
            'project/'+proj._id+'/files',
            function(files)
            {
                proj.files=files;
                var html='';
                html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_list',proj);
                html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_upload',proj);

                $('#meta_content_files').html(html);
            });
    };

    this.setMetaTab=function(which)
    {
        $('.meta_content').hide();
        $('#metatabs a').removeClass('active');
        $('#metatabs .tab_'+which).addClass('active');

        $('#meta_content_'+which).show();

        if(which=='code') self.showMetaCode();
        if(which=='profiler') self.showProfiler();
        if(which=='debug') self.showMetaUiDebug();
        if(which=='screen') self.showMetaScreen();
        if(which=='bookmarks') self.bookmarks.show();
        if(which=='preview') self.preview.show();
        else self.preview.hide();
    };


    this.setStateUnsaved=function()
    {
        document.title=gui.patch().getCurrentProject().name+' *';
        favIconLink.href = '/favicon/favicon_orange.ico';
        savedState=false;

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
        savedState=true;
        favIconLink.href = '/favicon/favicon.ico';

        document.title=''+gui.patch().getCurrentProject().name;
        window.onbeforeunload = null;
    };

    this.init=function()
    {
        $('#infoArea').show();
        $('#infoArea').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.infoArea);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        _patch=new CABLES.UI.Patch(this);
        _patch.show(_scene);



        // _socket=new CABLES.API.Socket(this);
        // _socket = new CABLES.API.Socket();
        _connection=new CABLES.API.Connection(this);
        $('#undev').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.undevLogo);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        /* Tab pane on the right */
        $('.tab_files').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_files);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.tab_profiler').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_profiler);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.tab_bookmarks').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_bookmarks);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.tab_debug').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_debug);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.tab_screen').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.tab_screen);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.download_screenshot').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.download_screenshot);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('#minimapContainer').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.minimapContainer);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('#project_settings_btn').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.project_settings_btn);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('#timelineui').hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.timelineui);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        $('.op_background').hover(function (e)
        {
          alert("hover");
            CABLES.UI.showInfo(CABLES.UI.TEXTS.op_background);
        },function()
        {
            CABLES.UI.hideInfo();
        });
        gui.replaceNavShortcuts();
    };
    self.loadUser();

};

function startUi(event)
{
    logStartup('Init UI');

    CABLES.UI.initHandleBarsHelper();

    $(document).bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });

    gui=new CABLES.UI.GUI();

    gui.init();
    gui.bind(function()
    {
        gui.waitToShowUI();
    });





    logStartup('Init UI done');



}
