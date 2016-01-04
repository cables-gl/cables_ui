CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.UserOpManager=function(projectId)
{


    this.removeFromProject=function(userid)
    {
        CABLES.UI.MODAL.showLoading();
        CABLES.api.delete( 'project/'+projectId+'/userops/'+userid, {}, gui.userOpManager().show );
    };

    this.addToProject=function(username)
    {
        CABLES.UI.MODAL.showLoading();
        CABLES.api.put( 'project/'+projectId+'/userops/'+username, {}, gui.userOpManager().show );
    };

    this.show=function()
    {
        CABLES.UI.MODAL.showLoading();
        CABLES.api.get(
            'project/'+projectId+'/userops',
            function(r)
            {
                var html='<h2>project user ops</h2>';

                for(var i in r)
                {
                    html+='<br/>- '+r[i];
                    // if(r[i].owner)
                    //     html+=' (owner)';
                    // else
                    html+=' | <a class="" onclick="gui.userOpManager().removeFromProject( \''+r[i]._id+'\' );">remove</a>';

                }

                html+='<hr/>';
                html+='<input id="username" type="text"/>';
                html+='<br/>';
                html+='<br/>';
                html+='<a class="bluebutton" onclick="gui.userOpManager().addToProject($(\'#username\').val());">add user</a>';
                html+='<br/>';
                html+='<br/>';

                CABLES.UI.MODAL.show(html);
            });

    };
};
