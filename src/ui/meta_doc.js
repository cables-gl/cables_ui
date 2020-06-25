CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.MetaDoc = function (tabs)
{
    this._tab = new CABLES.UI.Tab("doc", { "icon": "book-open", "infotext": "tab_doc", "showTitle": false, "hideToolbar": true, "padding": true });
    tabs.addTab(this._tab);

    this._op = null;
    this.html = "";


    this._tab.addEventListener("onActivate", function ()
    {
        this.update();
        this.show();
    }.bind(this));
};

CABLES.UI.MetaDoc.prototype.init = function ()
{
    gui.opParams.addEventListener("opSelected", function (_op)
    {
        console.log("op selected!");
        this._op = _op;
        if (this._tab.isVisible())
        {
            console.log("op ssss!");
            this.update();
            this.show();
        }
    }.bind(this));
};

CABLES.UI.MetaDoc.prototype.update = function ()
{
    if (!this._op) return;

    gui.getOpDoc(this._op.objName, true, function (html)
    {
        const doclink = "<div><a href=\"" + CABLES.sandbox.getCablesUrl() + "/op/" + this._op.objName + "\" class=\"button \">View documentation</a>&nbsp;<br/><br/>";
        this.html = html + doclink;
    }.bind(this));
};

CABLES.UI.MetaDoc.prototype.show = function ()
{
    this._tab.html(this.html);
};
