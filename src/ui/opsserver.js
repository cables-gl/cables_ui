CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// localStorage.cables=localStorage.cables || {};
// localStorage.cables.editor=localStorage.cables.editor || {};

// localStorage.cables.editor.serverops= [];


CABLES.UI.ServerOps=function()
{
    var ops=[];
    var self=this;
    var storedOps=[];

    function updateStoredOps()
    {
        if(!storedOps)storedOps=[];

        storedOps = storedOps.slice() // slice makes copy of array before sorting it
          .sort()
          .reduce(function(a,b){
            if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
            return a;
          },[]); // this empty array becomes the starting value for a

        localStorage.setItem("cables.editor.serverops",JSON.stringify(storedOps));
        console.log('storedOps.length',storedOps.length);
    }

    // this.pushOp=function(name)
    // {
    //     CABLES.api.get('ops/github/push/'+name,function(res)
    //     {
    //         var msg='<h2>push status</h2>';
    //
    //         msg+='<br/><pre>'+JSON.stringify(res,false,4)+'</pre><br/>';
    //
    //         CABLES.UI.MODAL.show(msg);
    //
    //     });
    //
    // };

    // this.pullOp=function(name)
    // {
    //     CABLES.api.get('ops/github/pull/'+name,function(res)
    //         {
    //
    //             var msg='<h2><span class="fa fa-exclamation-triangle"></span> pull status</h2>';
    //
    //             msg+='<a class="bluebutton" onclick="document.location.reload()">reload</a>';
    //             msg+='<br/><pre>'+JSON.stringify(res,false,4)+'</pre><br/>';
    //
    //             CABLES.UI.MODAL.show(msg);
    //
    //         });
    // };

    this.load=function(cb)
    {
        CABLES.api.get('ops/',function(res)
        {
            if(res)
            {
                ops=res;
                console.log('loaded ops...');

                if(cb)cb(ops);

                storedOps=JSON.parse(localStorage.getItem("cables.editor.serverops"));
                updateStoredOps();

                if(storedOps && storedOps.length>0)
                {
                    console.log('found storedOps!!!!!!!!!!!!!');

                    for(var i in storedOps)
                    {
                        self.edit(storedOps[i]);
                    }


                }
            }
        });
    };

    this.showOpInstancingError=function(name,e)
    {
        console.log('show server op error message modal');

        gui.patch().loadingError=true;

        var msg='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
        msg+='error creating op: '+name;
        msg+='<br/><pre>'+e+'</pre><br/>';

        if(this.isServerOp(name))
        {
            msg+='<a class="bluebutton" onclick="gui.showEditor();gui.serverOps.edit(\''+name+'\')">edit op</a>';
        }
        if(gui.user.isAdmin)
        {
            msg+=' <a class="bluebutton" onclick="gui.serverOps.pullOp(\''+name+'\')">try to pull</a>';
        }
        CABLES.UI.MODAL.show(msg);

    };

    this.isServerOp=function(name)
    {
        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                return true;
            }
        }

        return false;
    };

    this.create=function(name)
    {
        console.log('create '+name);

        CABLES.api.get(
            'ops/create/'+name,
            function(res)
            {
                console.log('res',res);
                self.load(
                function()
                {
                    console.log('now edit...');
                    self.edit(name);
                });
            },
            function(res)
            {
                console.log('err res',res);
            }
        );

    };

    this.execute=function(name)
    {
        // console.log(name);
        CABLES.UI.MODAL.showLoading('executing...');
        var s = document.createElement( 'script' );
        s.setAttribute( 'src', '/api/op/'+name );
        s.onload=function()
        {
            gui.patch().scene.reloadOp(name);
            CABLES.UI.MODAL.hideLoading();
        };
        document.body.appendChild( s );

    };

    this.edit=function(name)
    {
        var op=null;

        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                op=ops[i];
            }
        }
        if(!op)
        {
            console.log('server op not found '+name);
            return;
        }
        CABLES.api.get(
            'ops/'+op.name,
            function(res)
            {
                gui.showEditor();
                CABLES.UI.MODAL.hide();

                storedOps.push(name);
                updateStoredOps();

                var html='';
                html+='<a class="button" onclick="gui.serverOps.execute(\''+op.name+'\');">execute</a>';


                gui.editor().addTab(
                {
                    content:res.code,
                    title:op.name,
                    syntax:'js',
                    toolbarHtml:html,
                    onClose:function(which)
                    {
                        console.log('close tab',which);

                        for(var i in storedOps)
                        {
                            console.log('-- ', storedOps[i], which.title);

                            if(storedOps[i]==which.title)
                            {
                                console.log('found op to remove');
                                storedOps.splice(i,1);
                                updateStoredOps();
                                return;
                            }

                        }
                    },
                    onSave:function(setStatus,content)
                    {

                        CABLES.api.put(
                            'ops/'+op.name,
                            {code:content},
                            function(res)
                            {
                                if(!res.success)
                                {
                                    if(res.error) setStatus('error: Line '+res.error.lineNumber+' : '+res.error.description,true);
                                    else setStatus('error: unknown error',true);
                                }
                                else
                                {
// exec ???
                                    setStatus('saved');
                                }
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

    this.load();

};
