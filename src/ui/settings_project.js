
CABLES.ProjectSettings=function(project)
{

var self=this;
    this.userManager=new CABLES.UI.UserManager(project._id);

    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'settings',
            {
                "user":gui.user,
                "project":project,
                "tags":project.tags.join()
            });

        CABLES.UI.MODAL.show(html);

        this.loadUsers();
        this.updateIcons();
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

    this.saveTags=function(tags)
    {
        CABLES.api.post(
            'project/'+gui.patch().getCurrentProject()._id+'/save_tags',
            {"tags":tags},
            function(res)
            {
                console.log('saved tags...');
                tags = tags.split(",");
                for(var i in tags)
                {
                    tags[i]=tags[i].trim();
                }

                gui.patch().getCurrentProject().tags=tags;


                console.log('res',res);
            },
            function(res)
            {
                // setStatus('error: not saved');
                console.log('err res',res);
            }
        );

    };

    this.saveDescription=function(content)
    {
        CABLES.api.post(
            'project/'+gui.patch().getCurrentProject()._id+'/save_description',
            {content:content},
            function(res)
            {
                // setStatus('saved');
                console.log('res',res);
            },
            function(res)
            {
                // setStatus('error: not saved');
                console.log('err res',res);
            }
        );

    };


    this.saveParams=function()
    {
        var proj_name=$('#projectsettings_name').val();
        var proj_public=$('#projectsettings_public').val();
        var proj_secret=$('#projectsettings_secret').val();
        var proj_example=$('#projectsettings_example').val();
        var proj_test=$('#projectsettings_test').val();
        var proj_autoscreenshot=$('#projectsettings_autoscreenshot').val();

        gui.patch().getCurrentProject().name=proj_name;
        gui.scene().settings=gui.scene().settings || {};
        gui.scene().settings.isPublic=proj_public;
        gui.scene().settings.secret=proj_secret;
        gui.scene().settings.isExample=proj_example;
        gui.scene().settings.isTest=proj_test;

        gui.scene().settings.manualScreenshot=proj_autoscreenshot;

        gui.patch().saveCurrentProject();

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
        self.saveParams();
    };

    this.toggleAutoScreenshot=function()
    {
        $('#projectsettings_autoscreenshot').val(''+!($('#projectsettings_autoscreenshot').val()=='true'));

        self.updateIcons();
        self.saveParams();
    };

    this.toggleExample=function()
    {
        $('#projectsettings_example').val(''+!($('#projectsettings_example').val()=='true'));

        self.updateIcons();
        self.saveParams();
    };

    this.toggleTest=function()
    {
        $('#projectsettings_test').val(''+!($('#projectsettings_test').val()=='true'));

        self.updateIcons();
        self.saveParams();
    };



    this.tab=function(which)
    {
        $('#settings_tab_users').hide();
        $('#settings_tab_params').hide();
        $('#settings_tab_delete').hide();

        if(which=='users') $('#settings_tab_users').show();
        if(which=='params') $('#settings_tab_params').show();
        if(which=='delete') $('#settings_tab_delete').show();

    };



};
