CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Paco = function (tabs)
{
    this._tab = new CABLES.UI.Tab("paco", { "icon": "play", "infotext": "tab_paco", "showTitle": false, "hideToolbar": true, "padding": true });
    tabs.addTab(this._tab);
    this._tab.addEventListener("onActivate", function ()
    {
        this.show();
    }.bind(this));
};

CABLES.UI.Paco.prototype.open = function ()
{
    const popup = window.open("/renderer/?p=" + gui.project()._id, "_blank");
    popup.addEventListener("load", function ()
    {
        console.log("loaded!");
        setTimeout(function () // kinda sucks... better create client send event and then send patch data....
        {
            let json = {};
            json = gui.corePatch().serialize(true);
            gui.patchConnection.send(CABLES.PACO_LOAD,
                {
                    "patch": JSON.stringify(json)
                });
            console.log(json);
        }, 1000);
    }, false);
};

CABLES.UI.Paco.prototype.show = function ()
{
    if (!window.gui)
    {
        setTimeout(this.show.bind(this), 300);
        return;
    }
    const html = CABLES.UI.getHandleBarHtml("meta_paco",
        {
            "user": gui.user
        });
    this._tab.html(html);
};
