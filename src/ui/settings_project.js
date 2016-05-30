
CABLES.ProjectSettings=function(project)
{

var self=this;
    this.userManager=new CABLES.UI.UserManager(project._id);

    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'settings',
            {
                "project":project,
                "tags":project.tags.join()
            });

        CABLES.UI.MODAL.show(html);

        this.loadUsers();
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

};
