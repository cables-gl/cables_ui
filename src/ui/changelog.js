CABLES = CABLES || {};
CABLES.CHANGELOG = {};

CABLES.CHANGELOG.getHtml = function (cb, since)
{
    CABLES.api.get("changelog?num=0", function (obj)
    {
        if (since)
        {
            for (let i = 0; i < obj.items.length; i++) if (obj.items[i].date < since) obj.items.length = i;

            obj.onlyLatest = true;
        }

        let firstTime = false;

        if (!CABLES.UI.userSettings.get("changelogLastView"))
        {
            firstTime = true;
            console.log("first time changelog!");
        }

        CABLES.UI.userSettings.set("changelogLastView", obj.ts);

        if (obj.items.length === 0)
        {
            cb(null);
            return;
        }

        if (firstTime)
        {
            cb(null);
            return;
        }
        cb();
    });
};

CABLES.CHANGELOG.show = function (since)
{
    gui.mainTabs.addIframeTab("changelog", CABLES.sandbox.getCablesUrl() + "/changelog", { "icon": "book-open", "closable": true });

    // CABLES.CHANGELOG.getHtml(function()
    // {
    //     console.log("HALLO");
    //     var win = window.open('https://cables.gl/changelog', '_blank');

    //     // CABLES.UI.MODAL.show(html,{title:'',nopadding:true});
    // },since);
};
