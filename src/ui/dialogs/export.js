CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Exporter=function(project)
{
    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'export',
            {
                texts:CABLES.UI.TEXTS,
                user:gui.user,
            });

        CABLES.UI.MODAL.show(html,{'title':'Export'});
    };
};
