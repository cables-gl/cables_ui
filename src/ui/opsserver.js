CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.ServerOps=function()
{
    var ops=[];
    var self=this;

    this.load=function(cb)
    {
        CABLES.api.get('ops/',function(res)
        {
            if(res)
            {
                ops=res;
                console.log('loaded ops...');
                        
                if(cb)cb(ops);
            }
        });
    };

    this.showOpInstancingError=function(name,e)
    {
        var msg='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';

        msg+='error creating op: '+name;
        msg+='<br/><pre>'+e+'</pre>';
        
        if(this.isServerOp(name) && gui.user.isAdmin)
        {
            msg+='<br/><a class="bluebutton" onclick="gui.showEditor();gui.serverOps.edit(\''+name+'\')">edit op</a><br/><br/>';
        }
        CABLES.UI.MODAL.show(msg);

    };

    this.isServerOp=function(name)
    {
        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                console.log('found server op!'+name );
                        
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
                gui.editor().addTab(
                {
                    content:res.code,
                    title:op.name,
                    syntax:'js',
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
