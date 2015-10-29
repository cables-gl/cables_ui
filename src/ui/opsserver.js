CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.ServerOps=function()
{
    var ops=[];

    CABLES.api.get('ops/',function(res)
    {
        if(res)
        {
            ops=res;
        }
    });

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

    this.edit=function(name)
    {
        var op=null;
                console.log('allo');
                
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

        gui.showEditor();
        CABLES.UI.MODAL.hide();
        gui.editor().addTab(
        {
            content:op.code,
            title:'op '+op.name,
            syntax:'js',
            onSave:function(content)
            {
                CABLES.api.put(
                    'ops/'+op.name,
                    {code:content},
                    function(res)
                    {
                        console.log('res',res);
                    },
                    function(res)
                    {
                        console.log('err res',res);
                    }
                );
            }
        });

    };



};
