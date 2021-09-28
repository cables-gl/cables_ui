export default class ChangelogToast
{
    getHtml(cb, since)
    {
        CABLES.api.get("changelog?num=1", (obj) =>
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
    }

    show()
    {
        gui.mainTabs.addIframeTab("changelog", CABLES.sandbox.getCablesUrl() + "/changelog", { "icon": "book-open", "closable": true });
    }
}
