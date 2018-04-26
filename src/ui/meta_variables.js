CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};


CABLES.UI.Variables=function()
{
    this._lastTimeout=0;
};

CABLES.UI.Variables.prototype.update=function()
{
    if(CABLES.UI.userSettings.get("metatab")=='variables')
    {
        clearTimeout(this._lastTimeout);

        var vars=gui.patch().scene.getVars();

        for(var i in vars)
        {
            $('#varval'+i).html(vars[i].getValue());
        }

        this._lastTimeout=setTimeout(this.update.bind(this),250);
    }
};

CABLES.UI.Variables.prototype.show=function()
{
    var vars=gui.patch().scene.getVars();
    if(Object.keys(vars).length==0)vars=null;
    var html = CABLES.UI.getHandleBarHtml('meta_variables',
    {
        vars:vars
    });
    $('#meta_content_variables').html(html);

    this.update();

};
