
export default class MetaDoc
{
    constructor(tabs)
    {
        this._tab = new CABLES.UI.Tab("doc", { "icon": "book-open", "infotext": "tab_doc", "showTitle": false, "hideToolbar": true, "padding": true });
        tabs.addTab(this._tab);

        this._op = null;
        this.html = "";

        this._tab.addEventListener("onActivate", () =>
        {
            this.update();
            this.show();
        });
    }

    init()
    {
        gui.opParams.addEventListener("opSelected", function (_op)
        {
            this._op = _op;
            if (this._tab.isVisible())
            {
                this.update();
                this.show();
            }
        }.bind(this));
    }

    update()
    {
        if (!this._op) return;

        gui.getOpDoc(this._op.objName, true, function (html)
        {
            const doclink = "<div><a href=\"" + CABLES.sandbox.getCablesUrl() + "/op/" + this._op.objName + "\" class=\"button \">View documentation</a>&nbsp;<br/><br/>";
            this.html = html + doclink;
        }.bind(this));
    }

    show()
    {
        this._tab.html(this.html);
    }
}


