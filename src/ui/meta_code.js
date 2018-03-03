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
                    if($('#meta_content_code').is(":visible")) self.show();
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

        console.log('show meta code');

        $('#meta_content_code').html('<div class="loading" style="width:40px;height:40px;"></div>');

        if(window.process && window.process.versions['electron']) return;
        if(op)
        {
            CABLES.api.get(
                'op/'+op.objName+'/info',
                function(res)
                {
                    var doc={};
                    var summary="";
                    // doc.attachmentFiles=gui.opDocs.getAttachmentFiles(op.objName);
                    doc.attachmentFiles=res.attachmentFiles;
                    doc.libs=gui.serverOps.getOpLibs(op.objName,false);
                    summary=gui.opDocs.getSummary(op.objName);

                    if(op.objName.indexOf("User.")==-1)
                    {
                        op.github='https://github.com/pandrr/cables/tree/master/src/ops/base/'+op.objName;
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


                });
        }

    };



};

CABLES.UI.MetaCode.rename=function(oldName)
{
	if(!oldName)
	{
		var ops=gui.patch().getSelectedOps();
		if(ops.length!=1)
		{
			console.log("rename canceled - only select one op!");
			return;
		}
		oldName=ops[0].op.objName;
		console.log(oldName);
	}

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
