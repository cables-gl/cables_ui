CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.UserManager=function(projectId)
{

    var loadUserNames=function(cb)
    {
        CABLES.api.get(
            'usernames',
            function(users)
            {
                cb(users);
            }
        );
    };

    this.showAddUserNames=function(selectId)
    {
        $('#adduserbutton').hide();
        $('#adduserdialog').show();

        loadUserNames(function(users)
            {
                var sel = document.getElementById( selectId );
                for(var i=0;i<users.length;i++)
                {

                    var opt = document.createElement('option');
                    opt.innerHTML = users[i].username;
                    opt.value = users[i]._id;
                    sel.appendChild(opt);
                }
            });
    };

    this.setOwner=function(userid)
    {
        var doUpdate=gui.projectSettings().loadUsers;
        CABLES.api.put( 'project/'+projectId+'/owner/'+userid, {}, doUpdate );
    };

    this.removeFromProject=function(userid)
    {
        var doUpdate=gui.projectSettings().loadUsers;
        CABLES.api.delete( 'project/'+projectId+'/user/'+userid, {}, doUpdate );
    };

    this.addToProject=function(userid)
    {
        if(userid)
        {
            // CABLES.UI.MODAL.showLoading();
            var doUpdate=gui.projectSettings().loadUsers;
            CABLES.api.put( 'project/'+projectId+'/user/'+userid, {}, doUpdate );
            
        }
    };




    this.getData=function(cb)
    {
        CABLES.api.get(
            'project/'+projectId+'/users',
            function(r)
            {
                var data={};
                data.users=[];
                for(var i in r)
                {
                    // html+='<br/>- '+r[i].username;
                    // if(r[i].owner)
                    //     html+=' (owner)';
                    // else
                    //     html+=' | <a class="" onclick="gui.userManager().removeFromProject( \''+r[i]._id+'\' );">remove</a>';

                    data.users.push(
                        {
                            "username":r[i].username,
                            "owner":r[i].owner,
                            "id":r[i]._id
                        });
                }
                cb(data);

                // html+='<hr/>';
                // html+='<input id="userid" type="text"/>';
                // html+='<select id="userselect" onchange="$(\'#userid\').val($(this).val());"><option>---</option></select>';
                // html+='<br/>';
                // html+='<br/>';
                // html+='<a class="bluebutton" onclick="gui.userManager().addToProject($(\'#userid\').val());">add user</a>';
                // html+='<br/>';
                // html+='<br/>';
                //
                // loadUserNames(function(users)
                //     {
                //         var sel = document.getElementById('userselect');
                //         for(var i in users)
                //         {
                //             var opt = document.createElement('option');
                //             opt.innerHTML = users[i].username;
                //             opt.value = users[i]._id;
                //             sel.appendChild(opt);
                //         }
                //
                //     });
                //
                // CABLES.UI.MODAL.show(html);
            });



    };


    this.show=function() // delete ....
    {

        CABLES.UI.MODAL.showLoading();
        CABLES.api.get(
            'project/'+projectId+'/users',
            function(r)
            {
                var html='<h2>project users</h2>';

                for(var i in r)
                {
                    html+='<br/>- '+r[i].username;
                    if(r[i].owner)
                        html+=' (owner)';
                    else
                        html+=' | <a class="" onclick="gui.userManager().removeFromProject( \''+r[i]._id+'\' );">remove</a>';

                }

                html+='<hr/>';
                html+='<input id="userid" type="text"/>';
                html+='<select id="userselect" onchange="$(\'#userid\').val($(this).val());"><option>---</option></select>';
                html+='<br/>';
                html+='<br/>';
                html+='<a class="bluebutton" onclick="gui.userManager().addToProject($(\'#userid\').val());">add user</a>';
                html+='<br/>';
                html+='<br/>';

                loadUserNames(function(users)
                    {
                        var sel = document.getElementById('userselect');
                        for(var i in users)
                        {
                            var opt = document.createElement('option');
                            opt.innerHTML = users[i].username;
                            opt.value = users[i]._id;
                            sel.appendChild(opt);
                        }

                    });

                CABLES.UI.MODAL.show(html);
            });

    };
};
