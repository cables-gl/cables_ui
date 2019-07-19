CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.MetaDoc=function(tabs)
{
    this._tab=new CABLES.UI.Tab("doc",{"icon":"book-open","infotext":"tab_doc","showTitle":false,"hideToolbar":true,"padding":true});
    tabs.addTab(this._tab);
    
    this._op=null;
    this.html='';


    this._tab.addEventListener("onActivate",function()
    {
        this.update();
        this.show();
    }.bind(this));



};

CABLES.UI.MetaDoc.prototype.init=function()
{
    gui.patch().addEventListener('opSelected',function(_op)
    {
        this._op=_op;
        if(this._tab.isVisible())
        {
            this.update();
            this.show();
        }
    }.bind(this));
};

CABLES.UI.MetaDoc.prototype.update=function()
{
    if(!this._op)return;

    gui.getOpDoc(this._op.objName, true, function(html)
    {
        var doclink = '<div><a href="/op/' + this._op.objName + '" class="button ">view documentation</a>&nbsp;<br/><br/>';
        this.html=html+doclink;
    }.bind(this));

}

CABLES.UI.MetaDoc.prototype.show=function()
{
    this._tab.html(this.html);
}
