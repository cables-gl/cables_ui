CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.MetaCode=function(projectId)
{
    var self=this;
    var initialized=false;

    var op=null;

    this.init=function()
    {
        if(initialized)return;
        initialized=true;

        gui.patch().addEventListener('opSelected',function(_op)
        {
            op=_op;
            self.show();
            console.log('op selected!',_op.name);
        });

    };

    this.show=function()
    {
        if(!op)
        {
            $('#meta_content_code').html('<h3>Code</h3>Select any Op');
            return;
        }

        var doc={};
        if(op)
        {
            doc.attachmentFiles=gui.opDocs.getAttachmentFiles(op.objName);
        }

        var html = CABLES.UI.getHandleBarHtml('meta_code',
        {
            op:op,
            doc:doc,
            user:gui.user
        });
        $('#meta_content_code').html(html);
    };


};
