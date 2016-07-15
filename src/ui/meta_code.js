CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.MetaCode=function(projectId)
{
    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml('meta_code',{});
        $('#meta_content_code').html(html);
    };


};
