CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.OpShowMetaCode=0;

CABLES.UI.MetaCode=function(tabs)
{
    this._tab=new CABLES.UI.Tab("code",{"icon":"code","infotext":"tab_code","showTitle":false,"hideToolbar":true,"padding":true});
    tabs.addTab(this._tab);
    this._tab.addEventListener("onActivate",function()
    {
        this.show();
    }.bind(this));

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
                    if(this._tab.isVisible()) this.show();
                }.bind(this),100);
        }.bind(this));

    };

    this.show=function()
    {
        if(!op)
        {
            this._tab.html('<h3>Code</h3>Select any Op');
            return;
        }

        this._tab.html('<div class="loading" style="width:40px;height:40px;"></div>');

        if(window.process && window.process.versions['electron']) return;
        if(op)
        {
            CABLES.api.get(
                'op/'+op.objName+'/info',
                function(res)
                {
                    var doc={};
                    var summary="";
                    // doc.attachmentFiles=res.attachmentFiles;

                    if(res.attachmentFiles)
                    {
                        var attachmentFiles=[];
                        for(var i=0;i<res.attachmentFiles.length;i++)
                        {
                            attachmentFiles.push(
                                {
                                    "readable":res.attachmentFiles[i].substr(4),
                                    "original":res.attachmentFiles[i],
                                })
                        }
                        doc.attachmentFiles=attachmentFiles;
                    }

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
                        user:gui.user,
                        opserialized:op.getSerialized()
                    });
                    this._tab.html(html);


                }.bind(this),function()
            {
                console.log('error api?');
            });
        }

    };
};
