//http://html5doctor.com/drag-and-drop-to-server/


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.MODAL=CABLES.UI.MODAL || {};

CABLES.UI.MODAL.hide=function()
{
    mouseNewOPX=0;
    mouseNewOPY=0;

    $('#modalcontent').html('');
    $('#modalcontent').hide();
    $('#modalbg').hide();
    $('.tooltip').hide();
    
};

CABLES.UI.MODAL.show=function(content)
{
    $('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times tt" data-tt="close / press escape to close" onclick="CABLES.UI.MODAL.hide();"></a></div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();
};


CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div style="text-align:center;"><h3>'+title+'</h3><i class="fa fa-4x fa-cog fa-spin"></i><br/><br/><div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();
};
