CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.MetaVars = function (tabs)
{
    this._tab = new CABLES.UI.Tab("variables", {
        "icon": "hash", "infotext": "tab_variables", "showTitle": false, "hideToolbar": true, "padding": true,
    });
    tabs.addTab(this._tab);
    this._tab.addEventListener(
        "onActivate",
        function ()
        {
            this.update();
            this.show();
        }.bind(this),
    );

    this._lastTimeout = 0;
};

CABLES.UI.MetaVars.prototype.update = function ()
{
    if (!this._tab.isVisible()) return;

    clearTimeout(this._lastTimeout);

    let vars = {};
    if (CABLES.UI && window.gui) vars = gui.patch().scene.getVars();

    for (const i in vars)
    {
        $("#varval" + i).html(vars[i].getValue());
    }

    this._lastTimeout = setTimeout(this.update.bind(this), 250);
};

CABLES.UI.MetaVars.prototype.show = function ()
{
    let vars = {};
    if (CABLES.UI && window.gui) vars = gui.patch().scene.getVars();
    if (Object.keys(vars).length == 0) vars = null;
    const html = CABLES.UI.getHandleBarHtml("meta_variables", {
        vars,
    });

    this._tab.html(html);
    this.update();
};
