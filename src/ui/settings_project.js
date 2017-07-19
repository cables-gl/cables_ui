
CABLES.ProjectSettings=function(project)
{
    var self=this;

    this.userManager=new CABLES.UI.UserManager(project._id);
	var taggle=null;


    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'settings',
            {
                "user":gui.user,
                "project":project,
                // "tags":project.tags.join()
            });

        CABLES.UI.MODAL.show(html,
			{
				// "title":"Settings",
				"nopadding":true,
				"transparent":true
			});

        this.loadUsers();
        this.updateIcons();
		$('#settings_tags').val(project.tags.join(",") );


		taggle=new Taggle('taginput', {
		    tags: project.tags,
			onTagAdd:function()
			{
				$('#settings_tags').val(taggle.getTags().values.join(",") );
				self.resize();
				setTimeout(self.resize,100);
			},
			onTagRemove:function()
			{
				$('#settings_tags').val(taggle.getTags().values.join(",") );
				self.resize();
				setTimeout(self.resize,100);
			}
		});

		CABLES.api.get('tags/',
			function(r)
			{
				var input=$('.taggle_input')[0];
				if(!input)return;
				new Awesomplete(input, {
					list: r.tags
				});

				window.addEventListener("awesomplete-selectcomplete",
					function(e)
					{
						console.log(e);
						if(e.text && e.text.value) taggle.add(e.text.value);
						self.resize();
					}, false);

				self.resize();

			});

		self.resize();
    };

	this.resize=function()
	{
		var h=$('.settings_content').outerHeight();
		$('.settings_tabs').css({
			'height':h+"px"
		});
	};


    this.loadUsers=function()
    {
        self.userManager.getData(function(userData)
        {
            var html = CABLES.UI.getHandleBarHtml(
                'settings_users',
                {
                    "userData":userData
                });

            $('#projectSettingsUsers').html(html);
        });
    };

    this.saveTags=function(cb)
    {
        var tags=$("#settings_tags").val();
        CABLES.api.post(
            'project/'+gui.patch().getCurrentProject()._id+'/save_tags',
            {"tags":tags},
            function(res)
            {
                // console.log('saved tags...');
                tags = tags.split(",");
                for(var i in tags)
                {
                    tags[i]=tags[i].trim();
                }

                gui.patch().getCurrentProject().tags=tags;

                cb();
                // console.log('res',res);
            },
            function(res)
            {
                cb();
                // setStatus('error: not saved');
                console.log('err res',res);
            }
        );

    };

    this.saveDescription=function(cb)
    {
        CABLES.api.post(
            'project/'+gui.patch().getCurrentProject()._id+'/save_description',
            {content:$("#settings_description").val()},
            function(res)
            {
                cb();
                // setStatus('saved');
                console.log('res',res);
            },
            function(res)
            {
                cb();
                // setStatus('error: not saved');
                console.log('err res',res);
            }
        );
    };


    this.saveParams=function()
    {
        if(this.hasErrors())
        {
            console.log('has errors');
            return;
        }

        var proj_name=$('#projectsettings_name').val();
        var proj_public=$('#projectsettings_public').val();
        var proj_secret=$('#projectsettings_secret').val();
        var proj_example=$('#projectsettings_example').val();
        var proj_test=$('#projectsettings_test').val();
        var proj_autoscreenshot=$('#projectsettings_autoscreenshot').val();

        gui.setProjectName(proj_name);

        gui.patch().getCurrentProject().name=proj_name;
        gui.scene().settings=gui.scene().settings || {};
        gui.scene().settings.isPublic=proj_public;
        gui.scene().settings.secret=proj_secret;
        gui.scene().settings.isExample=proj_example;
        gui.scene().settings.isTest=proj_test;

        gui.scene().settings.manualScreenshot=proj_autoscreenshot;

        this.saveTags(function()
        {
            console.log('saving1');
            this.saveDescription(function()
            {
                console.log('saving2');
                gui.patch().saveCurrentProject();
            }.bind(this));
        }.bind(this));

    };

    this.hasErrors=function()
    {
        var errors=[];

        if($('#projectsettings_name').val().length<4)
            errors.push({"txt":'Enter a longer name'});

        if($('#projectsettings_public').val()=='true')
            if($('#projectsettings_name').val().toLowerCase()=="new project")
                errors.push({"txt":'Enter a better patch name'});

        if($('#projectsettings_public').val()=='true')
        {
            var tags=$("#settings_tags").val();
            tags = tags.split(",");
            if(tags.length<2)
                errors.push({"txt":'Please enter at least two tags to make patch public'});
        }


        if(errors.length>0)
        {
            var html="<b>PATCH NOT SAVED:</b><br/><ul>";
            for(var i=0;i<errors.length;i++)
            {
                html+="<li>"+errors[i].txt+"</li>";
            }

            html+="</ul>";

            $('#settings_error').html(html);
            $('#settings_error').show();
        }
        else
        {
            $('#settings_error').hide();
        }

        return errors.length!==0;

    };

    this.updateIcons=function()
    {

        if($('#projectsettings_public').val()=='true')
        {
            $('#projectsettings_public_icon').addClass('fa-check-square-o');
            $('#projectsettings_public_icon').removeClass('fa-square-o');
        }
        else
        {
            $('#projectsettings_public_icon').removeClass('fa-check-square-o');
            $('#projectsettings_public_icon').addClass('fa-square-o');
        }

        if($('#projectsettings_autoscreenshot').val()=='true')
        {
            $('#projectsettings_autoscreenshot_icon').addClass('fa-check-square-o');
            $('#projectsettings_autoscreenshot_icon').removeClass('fa-square-o');
        }
        else
        {
            $('#projectsettings_autoscreenshot_icon').removeClass('fa-check-square-o');
            $('#projectsettings_autoscreenshot_icon').addClass('fa-square-o');
        }

        if($('#projectsettings_example').val()=='true')
        {
            $('#projectsettings_example_icon').addClass('fa-check-square-o');
            $('#projectsettings_example_icon').removeClass('fa-square-o');
        }
        else
        {
            $('#projectsettings_example_icon').removeClass('fa-check-square-o');
            $('#projectsettings_example_icon').addClass('fa-square-o');
        }

        if($('#projectsettings_test').val()=='true')
        {
            $('#projectsettings_test_icon').addClass('fa-check-square-o');
            $('#projectsettings_test_icon').removeClass('fa-square-o');
        }
        else
        {
            $('#projectsettings_test_icon').removeClass('fa-check-square-o');
            $('#projectsettings_test_icon').addClass('fa-square-o');
        }

    };

    this.togglePublic=function()
    {
        $('#projectsettings_public').val(''+!($('#projectsettings_public').val()=='true'));

        self.updateIcons();
    };

    this.toggleAutoScreenshot=function()
    {
        $('#projectsettings_autoscreenshot').val(''+!($('#projectsettings_autoscreenshot').val()=='true'));

        self.updateIcons();
    };

    this.toggleExample=function()
    {
        $('#projectsettings_example').val(''+!($('#projectsettings_example').val()=='true'));

        self.updateIcons();
    };

    this.toggleTest=function()
    {
        $('#projectsettings_test').val(''+!($('#projectsettings_test').val()=='true'));

        self.updateIcons();
    };


    var oldTab="params";
    this.tab=this.setTab=function(which)
    {
        $('#settings_tab_users').hide();
        $('#settings_tab_params').hide();
        $('#settings_tab_delete').hide();
        $('#settings_tab_reports').hide();
        $('#settings_tab_versions').hide();

        if(which=='users') $('#settings_tab_users').show();
        if(which=='params') $('#settings_tab_params').show();
        if(which=='delete') $('#settings_tab_delete').show();
        if(which=='reports')
        {
            $('#settings_tab_reports').show();
            loadFPSReports();
        }

        if(which=='versions')
        {
            $('#settings_tab_versions').show();
            showVersions();
        }

        $('.settings_tabs .tab_'+oldTab).removeClass('active');
        $('.settings_tabs .tab_'+which).addClass('active');
        oldTab=which;

		this.resize();
    };

    function loadFPSReports()
    {
        CABLES.api.get('report/summary/'+project._id,
            function(r)
            {
                var html='';

                if(r.length===0)
                {
                    html+='no reports available. visit <a href="/p/'+project._id+'">this page</a> and watch it for 20 seconds to generate reports...<br/><br/>';
                }
                else
                {
                    for(var i in r)
                    {
                        html+=(r[i].when)+': '+Math.round(r[i].avgFps)+' FPS <br/>'+r[i].renderer+' <br/><br/>';
                    }
                }

                $('#fpsreports').html(html);
            });
    }

    function showVersions()
    {
        // CABLES.UI.MODAL.showLoading('loading versions');
        CABLES.api.get('project/'+project._id+'/versions',function(r)
        {
            var html='';

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

            // CABLES.UI.MODAL.show(html);
            $('#loadversions').html(html);

        });

    }


};
