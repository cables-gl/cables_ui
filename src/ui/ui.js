CABLES.UI = CABLES.UI || {};
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
    this._cmdPalette=new CABLES.UI.CommandPalette();
    var _opselect=new CABLES.UI.OpSelect();
    var _introduction = new CABLES.UI.Introduction();

    this.patchConnection=new CABLES.PatchConnectionSender();
    this.opDocs=new CABLES.UI.OpDocs();
    // var _socket=null;
    var _connection=null;
    var savedState=true;
    var metaCode=new CABLES.UI.MetaCode();
    this.metaPaco=new CABLES.UI.Paco();
    this.metaKeyframes=new CABLES.UI.MetaKeyframes();
    this.bookmarks=new CABLES.UI.Bookmarks();
    this.preview=new CABLES.UI.Preview();

    var favIconLink = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(favIconLink);
    favIconLink.type = 'image/x-icon';
    favIconLink.rel = 'shortcut icon';

    this.profiler=null;
    this.user=null;
    this.onSaveProject=null;


    this.project=function()
    {
        return self.patch().getCurrentProject();
    };

    this.opSelect=function()
    {
        return _opselect;
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

    this.infoHeight=200;
    this.timingHeight=250;
    this.rendererWidth=640;
    this.rendererHeight=360;
    this.editorWidth=CABLES.UI.userSettings.get("editorWidth")||700;

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
            _editor.focus();
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
		var startTime=performance.now();

		this._elAceEditor=this._elAceEditor||$('#ace_editor');
		this._elSplitterPatch=this._elSplitterPatch||$('#splitterPatch');
		this._elSplitterRenderer=this._elSplitterRenderer||$('#splitterRenderer');
		this._elSplitterRendererWH=this._elSplitterRendererWH||$('#splitterRendererWH');
		this._elPatch=this._elPatch||$('#patch');
		this._elOptions=this._elOptions||$('#options');
		this._elMeta=this._elMeta||$('#meta');
		this._elMenubar=this._elMenubar||$('#menubar');
		this._elSplitterMeta=this._elSplitterMeta||$('#splitterMeta');
		this._elInforArea=this._elInforArea||$('#infoArea');
		this._elGlCanvas=this._elGlCanvas||$('#glcanvas');
		this._elCablesCanvas=this._elCablesCanvas||$('#cablescanvas');
		this._elEditorBar=this._elEditorBar||$('#editorbar');
		this._elSplitterEditor=this._elSplitterEditor||$('#splitterEditor');

        this._elMenubar.show();
        // $('#timelineui').show();

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
		if(self.timeLine().hidden)timelineUiHeight=0;

        var filesHeight=0;
		if(CABLES.UI.fileSelect.visible)filesHeight=$('#library').height();

        var timedisplayheight=25;

        var patchHeight=window.innerHeight-menubarHeight-2;

        var patchWidth=window.innerWidth-self.rendererWidth-6;
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

        if(patchWidth<600)
        {
            $('#username').hide();
            $('.projectname').hide();
            $('.naventry').hide();
        }
        else
        {
            $('#username').show();
            $('.projectname').show();
            $('.naventry').show();
        }

        if(showingEditor)
        {
            if(self.editorWidth>window.innerWidth-self.rendererWidth)
                self.rendererWidth=window.innerWidth-self.editorWidth;

            var editorbarHeight=77;
            $('#editor').show();
            this._elEditorBar.css('height',editorbarHeight);
            this._elEditorBar.css('top',menubarHeight+2);

            var editorHeight=patchHeight-2-editorbarHeight;

            $('#ace_editor').css('height',editorHeight);

            this._elAceEditor.css('width',self.editorWidth);
            this._elAceEditor.css('top',menubarHeight+2+editorbarHeight);
            this._elAceEditor.css('left',0);

            this._elEditorBar.css('width',self.editorWidth);
            this._elSplitterEditor.show();
            this._elSplitterEditor.css('left',self.editorWidth);
            this._elSplitterEditor.css('height',patchHeight-2);
            this._elSplitterEditor.css('width',5);
            this._elSplitterEditor.css('top',menubarHeight);

            _editor.resize();

            patchWidth-=self.editorWidth-5;
            patchLeft=self.editorWidth+5;
        }
        else
        {
            $('#splitterEditor').hide();
            $('#editor').hide();
        }

        if(self.rendererWidth<100)self.rendererWidth=100;

        $('#patch svg').css('height',patchHeight);
        $('#patch svg').css('width',patchWidth);

        this._elSplitterPatch.css('left',window.innerWidth-self.rendererWidth-4);
        this._elSplitterPatch.css('height',patchHeight+timelineUiHeight+2);
        this._elSplitterPatch.css('top',menubarHeight);
        this._elSplitterRenderer.css('top',self.rendererHeight);
        this._elSplitterRenderer.css('width',self.rendererWidth);
        this._elSplitterRendererWH.css('right',self.rendererWidth-35);
        this._elSplitterRendererWH.css('top',self.rendererHeight-30);

        $('#button_subPatchBack').css('margin-right',self.rendererWidth+20);

        this._elPatch.css('height',patchHeight);
        this._elPatch.css('width',patchWidth);
        this._elPatch.css('top',menubarHeight);
        this._elPatch.css('left',patchLeft);

		$('#searchbox').css('left',patchLeft+patchWidth-CABLES.UI.uiConfig.miniMapWidth+1);
		$('#searchbox').css('width',CABLES.UI.uiConfig.miniMapWidth);

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
            $('#minimapContainer').hide();
            // $('#minimapContainer .title_opened').hide();
            // $('#minimapContainer').css('top',menubarHeight+patchHeight-24);
            // $('#minimapContainer').css('width',CABLES.UI.uiConfig.miniMapWidth);
            $('#minimap').hide();
        }


        $('#library').css('left',0);
        $('#library').css('width',window.innerWidth-self.rendererWidth);
        $('#library').css('bottom',0);

        $('#timelineui').css('width',window.innerWidth-self.rendererWidth-2);
        $('#timing').css('width',window.innerWidth-self.rendererWidth-2);
        $('#timing').css('bottom',filesHeight);

        if(showTiming)
        {
			$('#timelineui').show();
            $('#timing').css('height',this.timingHeight);

            $('#overviewtimeline').css('margin-top',timelineUiHeight);
            $('#overviewtimeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#overviewtimeline svg').css('height',25);

            $('#timetimeline').css('margin-top',timelineUiHeight+timedisplayheight);
            $('#timetimeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timetimeline svg').css('height',this.timingHeight-timedisplayheight-timelineUiHeight);

            $('#timeline svg').css('width',window.innerWidth-self.rendererWidth-2);
            $('#timeline svg').css('height',this.timingHeight-timedisplayheight);
            $('#timeline svg').css('margin-top',timelineUiHeight+timedisplayheight+timedisplayheight);

            $('#timeline svg').show();
            $('#timetimeline').show();
            $('#overviewtimeline').show();
            $('#keycontrols').show();

            $('#splitterTimeline').show();
            $('#splitterTimeline').css('bottom',this.timingHeight-4);
            $('#timelineTitle').show();
        }
        else
        {
            $('#overviewtimeline').hide();
            $('#timelineTitle').hide();
            $('#keycontrols').hide();
            $('#timetimeline').hide();
            $('#timeline svg').hide();
            $('#timing').css('height',timelineUiHeight);

            $('#splitterTimeline').hide();
        }

        if(self.timeLine())self.timeLine().updateViewBox();

        $('#splitterTimeline').css('width',window.innerWidth-self.rendererWidth-2);


        $('#delayed').css('left',window.innerWidth-self.rendererWidth+10);

        this._elOptions.css('left',window.innerWidth-self.rendererWidth-1);
        this._elOptions.css('top',self.rendererHeight);
        this._elOptions.css('width',optionsWidth);
        this._elOptions.css('height',window.innerHeight-self.rendererHeight);

        var metaWidth=self.rendererWidth-optionsWidth+1;
        this._elMeta.css('right',0);
        this._elMeta.css('top',self.rendererHeight);
        this._elMeta.css('width',metaWidth);
        this._elMeta.css('height',window.innerHeight-self.rendererHeight);

        $('#performance_glcanvas').css('bottom',0);
        // $('#performance_glcanvas').css('right',($('#performance_glcanvas').width()-(self.rendererWidth+optionsWidth))) ;
        $('#performance_glcanvas').css('right',self.rendererWidth-optionsWidth-$('#performance_glcanvas').width()+1 );
        // $('#performance_glcanvas').css('max-width',self.rendererWidth-optionsWidth);

        this._elMenubar.css('top',0);
        this._elMenubar.css('width',window.innerWidth-self.rendererWidth-10);
        this._elMenubar.css('height',menubarHeight);

        this._elSplitterMeta.css('bottom',self.infoHeight+30+'px');
        this._elSplitterMeta.css('width',metaWidth-22+'px');

        if(self.infoHeight===0)
        {
            this._elInforArea.hide();
            $('#splitterMeta').hide();
        }
        else
        {
            this._elInforArea.css('width',(metaWidth-20)+'px');
            this._elInforArea.css('height',(self.infoHeight)+'px');
            this._elInforArea.css('bottom','0px');
        }

        $('#meta_content').css('height',window.innerHeight-self.rendererHeight-self.infoHeight-50);

        if(self.rendererWidth===0)
        {
            this._elGlCanvas.attr('width',window.innerWidth);
            this._elGlCanvas.attr('height',window.innerHeight);
            this._elGlCanvas.css('z-index',9999);
        }
        else
        {
            this._elGlCanvas.attr('width',self.rendererWidth);
            this._elGlCanvas.attr('height',self.rendererHeight-2);
            this._elCablesCanvas.attr('width',self.rendererWidth);
            this._elCablesCanvas.attr('height',self.rendererHeight);
            this._elCablesCanvas.css('width',self.rendererWidth+'px');
            this._elCablesCanvas.css('height',self.rendererHeight+'px');
        }
        // CABLES.UI.setStatusText('webgl renderer set to size: '+self.rendererWidth+' x '+self.rendererHeight+' ESC to exit fullscreen');
        this._elGlCanvas.hover(function (e)
        {
            CABLES.UI.showInfo(CABLES.UI.TEXTS.canvas);
        },function()
        {
            CABLES.UI.hideInfo();
        });

		window.avg=window.avg || (performance.now()-startTime);
		window.avg+=(performance.now()-startTime);
		window.avg/=2;
		// console.log('layout ',window.avg);
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

    var oldRendwerWidth,oldRendwerHeight,oldShowingEditor;
    this.cycleRendererSize=function()
    {
        if(self.rendererWidth!==0)
        {
            oldRendwerWidth=self.rendererWidth;
            oldRendwerHeight=self.rendererHeight;
            oldShowingEditor=showingEditor;

            self.rendererWidth=0;
            showingEditor=false;
        }
        else
        {
            self.rendererWidth=oldRendwerWidth;
            self.rendererHeight=oldRendwerHeight;
            showingEditor=oldShowingEditor;
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

    this.hideMiniMap=function()
    {
        showMiniMap=false;
        self.setLayout();
    };

    // this.toggleMiniMap=function()
    // {
    //     showMiniMap=!showMiniMap;
    //     self.setLayout();
    // };

    this.showTiming=function()
    {
        showTiming=true;
        updateTimingIcon();
        self.setLayout();
    };


	this.hideTiming=function()
    {
		self.timeLine().hidden=true;
		showTiming=false;
		$('#timing').hide();
		gui.setLayout();
    };

    this.toggleTiming=function()
    {
		self.timeLine().hidden=false;
		$('#timing').show();

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
            if(!self.ops[i].isHidden()) numVisibleOps++;
        }

        var canvass=[];
        var canvs=$('canvas');

        for(i=0;i<canvs.length;i++)
        {
            canvass.push(
                {
                    "name":canvs[i].id,
                    "width":canvs[i].width,
                    "height":canvs[i].height
                });
        }

        var gl=gui.patch().scene.cgl.gl;
        var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
        var gl_renderer="unknown";
        if(dbgRenderInfo) gl_renderer= gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);

        var html = CABLES.UI.getHandleBarHtml(
            'uiDebug',
            {

                "gl_ver":gl.getParameter(gl.VERSION),
                "gl_renderer":gl_renderer,
                "numOps":gui.scene().ops.length,
                "numVisibleOps":numVisibleOps,
                "canvass":canvass,
                "numSvgElements": $('#patch svg *').length,
                "startup":CABLES.startup.log
            });

        $('#meta_content_debug').html(html);
    };

    this.showLibrary=function(inputId,filterType,opid)
    {
        CABLES.UI.fileSelect.show(inputId,filterType,opid);
    };

    this.setProjectName=function(name)
    {
        $('.projectname').html('&nbsp;&nbsp;'+name);
    };

    this.createProject=function()
    {
		CABLES.UI.MODAL.prompt(
			"New Project",
			"Enter a name for your new Project",
			"My new Project",
			function(name)
			{
        // var name=prompt('projectname','');
		        if(name)
		        {
		            CABLES.api.post('project',{"name":name },function(d)
		            {
		                CABLES.UI.SELECTPROJECT.doReload=true;
		                document.location.href='#/project/'+d._id;
		            });

		        }
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
        console.log(file);
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
        $('.nav_patch_save').bind("click", function (event) { CABLES.CMD.PATCH.save(); });
        $('.nav_patch_saveas').bind("click", function (event) { CABLES.CMD.PATCH.saveAs(); });
        $('.nav_patch_new').bind("click", function (event) { CABLES.CMD.PATCH.newPatch(); });
        $('.nav_patch_clear').bind("click", function (event) { if(confirm('really?'))CABLES.CMD.PATCH.clear(); });
        $('.nav_patch_export').bind("click", function (event) { CABLES.CMD.PATCH.export() });
        $('.nav_patch_export_ignoreAssets').bind("click", function (event) { gui.patch().exportStatic(true); });

        $('.nav_patch_settings').bind("click", function (event) { CABLES.CMD.UI.settings(); });
        $('.nav_patch_browse_examples').bind("click", function (event) { var win = window.open('https://cables.gl/examples', '_blank'); win.focus(); });
        $('.nav_patch_browse_favourites').bind("click", function (event) { var win = window.open('https://cables.gl/myfavs', '_blank'); win.focus(); });
        $('.nav_patch_browse_public').bind("click", function (event) { var win = window.open('https://cables.gl/projects', '_blank'); win.focus(); });
        $('.nav_patch_resolve_subpatch').bind("click",function(event){ self.patch().resolveSubpatch(); });

        $('.nav_patch_contributors').bind("click", CABLES.CMD.UI.settingsContributors);

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
		$('.nav_help_video').bind("click", function (event)
			{
				var html='<iframe width="800" height="640" src="https://www.youtube.com/embed/videoseries?list=PLYimpE2xWgBveaPOiV_2_42kZEl_1ExB0&showinfo=1" frameborder="0" allowfullscreen></iframe>';
				CABLES.UI.MODAL.show(html);
			});


        $('.nav_op_addOp').bind("click", function (event) { CABLES.CMD.PATCH.addOp(); });
        $('.nav_op_createOp').bind("click", function (event) { self.serverOps.createDialog(); });

        $('.nav_files').bind("click", function (event) { CABLES.CMD.UI.files(); });

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
                if(CABLES.UI.suggestions)
                {
                    var suggs=CABLES.UI.suggestions;
                    CABLES.UI.suggestions.close();
                    suggs.showSelect();

                    // CABLES.UI.suggestions=null;
                }
                return;
            }

            switch(e.which)
            {
                default:
                    // console.log('e.which',e.which);
                break;

                case 13:
                    if(e.ctrlKey || e.metaKey)self.toggleEditor();
                    break;
                case 112:  // f1
                    self.toggleEditor();
                    break;

                case 88:  //x unlink
                    if($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey)
                    {
                        self.patch().unlinkSelectedOps();
                    }
                    break;


                case 67:  //c center
                    if($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey)
                    {
                        self.patch().centerViewBoxOps();
                    }
                    break;

                case 80:
                    if(e.ctrlKey || e.metaKey)
                    {
                        e.preventDefault();
                        self._cmdPalette.show();
                    }
                break;

                case 70:
                    if(e.metaKey || e.ctrlKey)
                    {
                        if(!$('#ace_editor textarea').is(":focus"))
                        {
							CABLES.CMD.UI.showSearch();

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

                case 9:
                    if($('#patch').is(":focus") && !e.metaKey && !e.ctrlKey)
                    {
                        gui.opSelect().showOpSelect({x:0,y:0});
                        e.preventDefault();
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
                        showingEditor=oldShowingEditor;

                        self.setLayout();
                    }
                    else
                    if(CABLES.UI.suggestions)
                    {
                        console.log(CABLES.UI.suggestions);
                        CABLES.UI.suggestions.close();
                        CABLES.UI.suggestions=null;
                    }
                    else if( $('#cmdpalette').is(':visible') ) gui._cmdPalette.close();
                    else if( $('#searchbox').is(':visible') ) $('#searchbox').hide();
                    else if( $('#library').is(':visible') ) $('#library').hide();
                    else if( $('#sidebar').is(':visible') ) $('#sidebar').animate({width:'toggle'},200);
                    else if( $('.easingselect').is(':visible') ) $('.easingselect').hide();
                    else
                    if( $('#modalcontent').is(':visible') )
                    {
                        CABLES.UI.MODAL.hide();
                        if(showingEditor) self.editor().focus();
                    }
                    else
                    {
                        gui.opSelect().showOpSelect({x:0,y:0});

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
        // self.setMetaTab('doc');
        self.setMetaTab(CABLES.UI.userSettings.get("metatab")||'doc');

        if(_scene.cgl.aborted)
        {
            console.log('errror...');
            CABLES.UI.MODAL.showError('no webgl','your browser does not support webgl');
            // _scene.pause();
            return;
        }



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
        });


        function loadProject(id,ver)
        {
            if(_scene.cgl.aborted)
            {
                cb();
                return;
            }

            if(ver) ver='/version/'+ver;
                else ver="";

            CABLES.UI.MODAL.showLoading('Loading');
            CABLES.api.get('project/'+id,function(proj)
            {
                incrementStartup();
                var userOpsUrls=[];
                // console.log(proj.userList[i]+'!!!',proj);

                for(var i in proj.userList)
                {
                    userOpsUrls.push('/api/ops/code/'+proj.userList[i]);
                }

                var lid='userops'+proj._id+CABLES.generateUUID();
                loadjs( userOpsUrls,lid);
                loadjs.ready(lid,function()
                {
                    userOpsLoaded=true;
                    incrementStartup();
                    logStartup('User Ops loaded');
                    cb();

                    self.patch().setProject(proj);
                    if(proj.ui)
                    {
                        self.bookmarks.set(proj.ui.bookmarks);
                    }
                    metaCode.init();
                    self.setMetaTab(CABLES.UI.userSettings.get("metatab")||'doc');
                });
            },function()
            {
                $('#loadingInfo').append('Error: Unknown Project');

            });
        }

        router.addRoute('/project/:id/v/:ver').get(function(event, params)
        {
            loadProject(params.id,params.ver);
            // CABLES.UI.MODAL.showLoading('Loading');
            // CABLES.api.get('project/'+params.id+'/version/'+params.ver,function(proj)
            // {
            //     self.patch().setProject(proj);
            // });
        });
        router.addRoute('/project').get(function(event, params)
        {
            console.log('no projectid?');
            $('#loadingInfo').append('Error: No Project ID in URL');
        });

        router.addRoute('/project/:id').get(function(event, params)
        {
            loadProject(params.id);
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

        CABLES.api.get(
            'doc/ops/md/'+objName,
            function(res)
            {
                var content=res.content||'';

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
                                // console.log('res',res);
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

        function padLeft(nr, n, str){
            return Array(n-String(nr).length+1).join(str||'0')+nr;
        }

        var d=new Date();

        var dateStr=String(d.getFullYear())+
            String(d.getMonth()+1)+
            String(d.getDate())+'_'+
            padLeft(d.getHours(),2)+
            padLeft(d.getMinutes(),2)+
            padLeft(d.getSeconds(),2);

        var projectStr=this.project().name;
        projectStr=projectStr.split(' ').join('_');

        if(!filename)filename='cables_'+projectStr+'_'+dateStr+'.png';
            else filename+='.png';

        gui.patch().scene.cgl.doScreenshotClearAlpha=$('#render_removeAlpha').is(':checked');

        // console.log('gui.patch().scene.cgl.doScreenshotClearAlpha ',gui.patch().scene.cgl.doScreenshotClearAlpha);
        gui.patch().scene.cgl.doScreenshot=true;

        gui.patch().scene.cgl.onScreenShot=function(blob)
        {
            $('#glcanvas').attr('width',w);
            $('#glcanvas').attr('height',h);
            gui.patch().scene.cgl.onScreenShot=null;

            var anchor = document.createElement('a');

            anchor.setAttribute('download', filename);
            anchor.setAttribute('href', URL.createObjectURL(blob));
            document.body.appendChild(anchor);

            setTimeout(
                function() {
                    anchor.click();
                    if(cb)cb();
                },33);
        };
    };

    this.liveRecord=function()
    {
        $('#glcanvas').attr('width',parseFloat($('#render_width').val()) );
        $('#glcanvas').attr('height',parseFloat($('#render_height').val()));

        if(!CABLES.UI.capturer)
        {
            $('#liveRecordButton').html("Stop Live Recording");
            CABLES.UI.capturer = new CCapture( {
                format: 'gif',
                // format: 'webm',
                // quality:77,
                workersPath: '/ui/js/gifjs/',
                framerate: parseFloat($('#render_fps').val()),
                display:true,
                verbose: true
            } );

            CABLES.UI.capturer.start( gui.patch().scene.cgl.canvas );
        }
        else
        {
            $('#liveRecordButton').html("Start Live Recording");
            CABLES.UI.capturer.stop();
            CABLES.UI.capturer.save();
            var oldCap=CABLES.UI.capturer;
            CABLES.UI.capturer=null;
        }

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

    this.showMetaPaco=function()
    {
        this.metaPaco.show();
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
        var docOpHead='<div>'; //<img src="/api/op/layout/'+opname+'"/>
        var docOpFooter='<br/><br/><a onclick="gui.editOpDoc(\''+opname+'\')" class="button fa fa-pencil" target="_blankkk">&nbsp;edit</a></div>';

        this.getOpDoc(opname,true,function(html)
        {
            $('#meta_content_doc').html(docOpHead+html+docOpFooter);
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
                self.redirectNotLoggedIn();

            });
    };

    this.redirectNotLoggedIn=function()
    {
        var theUrl=document.location.href;
        theUrl=theUrl.replace('#','@HASH@');
        document.location.href='/login?redir='+theUrl;
    };

    this.getSavedState=function()
    {
        return savedState;
    };

    // this.updateProjectFiles=function(proj)
    // {
    //     if(!proj)proj=self.project();
    //     if(!proj)return;
    //     $('#meta_content_files').html('');
    //
    //     CABLES.api.get(
    //         'project/'+proj._id+'/files',
    //         function(files)
    //         {
    //             proj.files=files;
    //             var html='';
    //             html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_list',proj);
    //             html+=CABLES.UI.getHandleBarHtml('tmpl_projectfiles_upload',proj);
    //
    //             $('#meta_content_files').html(html);
    //         });
    // };

    this.setMetaTab=function(which)
    {
        $('.meta_content').hide();
        $('#metatabs a').removeClass('active');
        $('#metatabs .tab_'+which).addClass('active');

        $('#meta_content_'+which).show();

        if(which=='code') self.showMetaCode();
        if(which=='keyframes') self.metaKeyframes.show();
        if(which=='paco') self.showMetaPaco();

        if(which=='profiler') self.showProfiler();
        if(which=='debug') self.showMetaUiDebug();
        if(which=='screen') self.showMetaScreen();
        if(which=='bookmarks') self.bookmarks.show();
        if(which=='preview') self.preview.show();
        else self.preview.hide();
        // if(which=='find') self.find().show();

        CABLES.UI.userSettings.set("metatab",which);

    };

    this.startPacoSender=function()
    {
        this.patchConnection.connectors.push(new CABLES.PatchConnectorSocketIO());
    };

    this.startPacoReceiver=function()
    {
        this.patch().scene.clear();

        var conn=new CABLES.PatchConnectionReceiver(
            this.patch().scene,
            {},
            new CABLES.PatchConnectorSocketIO()
        );



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

    this.closeInfo=function()
    {
        this.infoHeight=0;
        this.setLayout();
    };


    this.setStateSaved=function()
    {
        savedState=true;
        favIconLink.href = '/favicon/favicon.ico';

        document.title=''+gui.patch().getCurrentProject().name;
        window.onbeforeunload = function()
        {
            gui.patchConnection.send(CABLES.PACO_CLEAR);

        };
    };

    this.init=function()
    {


        $('#infoArea').show();
        $('#infoArea').hover(function (e)
        {
            CABLES.UI.showInfo();
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

    $("#patch").bind("contextmenu", function(e)
    {
        if(e.preventDefault) e.preventDefault();
    });


    gui=new CABLES.UI.GUI();


    gui.init();


    gui.bind(function()
    {
        gui.waitToShowUI();
    });



    $(document).on("click", '.panelhead', function(e)
        {
            var panelselector=$(this).data("panelselector");
            if(panelselector)
            {
                $(panelselector).toggle();

                if($(panelselector).is(":visible"))
                {
                    $(this).addClass("opened");
                    $(this).removeClass("closed");
                }
                else
                {
                    $(this).addClass("closed");
                    $(this).removeClass("opened");
                }
            }
        });

    CABLES.watchPortVisualize.init();



    logStartup('Init UI done');
}
