CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};


CABLES.UI.Variables=function()
{

    this._lastTimeout=0;

};

CABLES.UI.Variables.prototype.show=function()
{
    var html = CABLES.UI.getHandleBarHtml('meta_variables',
    {
        vars:gui.patch().scene.getVars()
    });
    $('#meta_content_variables').html(html);

    clearTimeout(this._lastTimeout);
    if(CABLES.UI.userSettings.get("metatab")=='variables') this._lastTimeout=setTimeout(this.show.bind(this),300);

};
