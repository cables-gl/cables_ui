var CABLES=CABLES||{}
CABLES.UI=CABLES.UI||{};

CABLES.UI.PatchView=class extends CABLES.EventTarget
{
    constructor()
    {
        super();
    }


    showSelectedOpsPanel(ops)
    {
        var html = CABLES.UI.getHandleBarHtml(
            'params_ops', {
                numOps: ops.length,
            });

        $('#options').html(html);
        gui.setTransformGizmo(null);

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedMultiOps);
    }

    showBookmarkParamsPanel()
    {
        var html='<div class="panel">';

        if(!gui.user.isPatchOwner) html += CABLES.UI.getHandleBarHtml('clonepatch', {});
        html+=gui.bookmarks.getHtml();

        const views=document.getElementById("patchviews");
        if(views.children.length>1)
        {
            html+='<h3>Patchviews</h3>';
            for(var i=0;i<views.children.length;i++)
            {
                html+='<div class="list" onclick="gui.switchPatchView(\''+views.children[i].id+'\')"><div>'+views.children[i].id+'</div></div>';
            }
        }

        html+='</div>';

        $('#options').html(html);
    }


    
}
