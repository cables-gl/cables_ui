CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.UserSettingsDialog=function(project)
{
    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'settings_user',
            {
                texts:CABLES.UI.TEXTS,
                user:gui.user,
                userSettings:CABLES.UI.userSettings.getAll(),
                debug:
                {
                }
            });

        CABLES.UI.MODAL.show(html,{'title':'User Settings'});
    };
};
