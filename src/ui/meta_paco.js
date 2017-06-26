CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};


CABLES.UI.Paco=function()
{

};

CABLES.UI.Paco.prototype.show=function()
{
    var html = CABLES.UI.getHandleBarHtml('meta_paco',
    {
        // op:op,
        // doc:doc,
        // summary:summary,
        // libs:gui.opDocs.libs,
        user:gui.user
    });
    $('#meta_content_paco').html(html);

};
