CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};


CABLES.UI.Variables=function()
{



};

CABLES.UI.Variables.prototype.show=function()
{
    var html = CABLES.UI.getHandleBarHtml('meta_variables',
    {
        vars:gui.patch().scene.getVars()
    });
    $('#meta_content_variables').html(html);

    if(CABLES.UI.userSettings.get("metatab")=='variables') setTimeout(this.show.bind(this),100);

};
