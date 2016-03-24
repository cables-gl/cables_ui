CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Find=function()
{

    var html = CABLES.UI.getHandleBarHtml(
        'params_find',
        {
        });

this.show=function()
{
    $('#options').html(html);
    $('#findinput').focus();
};

function addResultOp(op)
{
    var html='';

    html+='<div onmouseover="gui.patch().setCurrentSubPatch('+op.getSubPatch()+');gui.patch().centerViewBox('+op.op.uiAttribs.translate.x+','+op.op.uiAttribs.translate.y+');" onclick="gui.patch().setSelectedOpById(\''+op.op.id+'\');">';
    html+='<h3>'+op.op.name+'</h3>';
    html+=''+op.op.objName;
    html+='</div>';

    $('#searchresult').append(html);
}

this.search=function(str)
{
    $('#searchresult').html('');
    if(str.length<2)return;

    str=str.toLowerCase();
    console.log('--- ',str);
    for(var i=0;i<gui.patch().ops.length;i++)
    {
        if(gui.patch().ops[i].op)
        {
            if(
                gui.patch().ops[i].op.objName.toLowerCase().indexOf(str)>-1 ||
                gui.patch().ops[i].op.name.toLowerCase().indexOf(str)>-1
            )
            {
                addResultOp(gui.patch().ops[i]);
            }


        }

    }

};



};
