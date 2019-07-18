CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};

CABLES.UI.MetaVars=function(tabs)
{
    this._tab=new CABLES.UI.Tab("variables",{"icon":"hash","infotext":"tab_variables","showTitle":false});
    tabs.addTab(this._tab);
    this._tab.addEventListener("onactivate",function()
    {
        this.update();
        this.show();
    }.bind(this));

    this._lastTimeout=0;
};

CABLES.UI.MetaVars.prototype.update=function()
{
    if(!this._tab.isVisible())return;

    clearTimeout(this._lastTimeout);

    var vars={};
    if(CABLES.UI && window.gui) vars=gui.patch().scene.getVars();

    for(var i in vars)
    {
        $('#varval'+i).html(vars[i].getValue());
    }

    this._lastTimeout=setTimeout(this.update.bind(this),250);
};

CABLES.UI.MetaVars.prototype.show=function()
{
    var vars={};
    if(CABLES.UI && window.gui) vars=gui.patch().scene.getVars();
    if(Object.keys(vars).length==0)vars=null;
    var html = CABLES.UI.getHandleBarHtml('meta_variables',
    {
        vars:vars
    });


    this._tab.html(html);
    this.update();
};
