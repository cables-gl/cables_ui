CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};


CABLES.UI.Variables=function()
{
    this._lastTimeout=0;
};

CABLES.UI.Variables.prototype.update=function()
{
    console.log(CABLES.UI.userSettings.get("metatab"));
    if(CABLES.UI.userSettings.get("metatab")=='variables')
    {
        clearTimeout(this._lastTimeout);

        var vars=gui.patch().scene.getVars();
        for(var i in vars)
        {
            $('#varval'+i).html(vars[i].getValue());
        }

        this._lastTimeout=setTimeout(this.update.bind(this),100);

    }
};

CABLES.UI.Variables.prototype.show=function()
{
    var html = CABLES.UI.getHandleBarHtml('meta_variables',
    {
        vars:gui.patch().scene.getVars()
    });
    $('#meta_content_variables').html(html);

    this.update();

};
