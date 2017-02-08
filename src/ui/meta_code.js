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
        var summary="";
        if(op)
        {
            doc.attachmentFiles=gui.opDocs.getAttachmentFiles(op.objName);
            doc.libs=gui.serverOps.getOpLibs(op.objName,false);
            summary=gui.opDocs.getSummary(op.objName);
        }


        var html = CABLES.UI.getHandleBarHtml('meta_code',
        {
            op:op,
            doc:doc,
            summary:summary,
            libs:gui.opDocs.libs,
            user:gui.user
        });
        $('#meta_content_code').html(html);
    };



};

CABLES.UI.MetaCode.rename=function(oldName)
{
    var newName=prompt('rename '+oldName+':',oldName);

    if(newName)
        CABLES.api.get(
            'admin/op/rename/'+oldName+'/'+newName,
            function(res)
            {
                var html='<h2>Rename</h2><br/> <a class="bluebutton" onclick="document.location.reload();">reload now</a><br/><br/><br/><div>'+JSON.stringify(res)+'</div>';
                CABLES.UI.MODAL.show(html);

            });

};
