CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.OpShowMetaCode=0;

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

            clearTimeout(CABLES.UI.OpShowMetaCode);
            CABLES.UI.OpShowMetaCode=setTimeout(function()
                {
                    self.show();
                },100);


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
            doc.libs=gui.opDocs.getOpLibs(op.objName);
        }

        var html = CABLES.UI.getHandleBarHtml('meta_code',
        {
            op:op,
            doc:doc,
            libs:gui.opDocs.libs,
            user:gui.user
        });
        $('#meta_content_code').html(html);
    };


};
