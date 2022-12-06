import userSettings from "../components/usersettings";
import Logger from "../utils/logger";

export default class ChangelogToast
{
    constructor()
    {
        this._log = new Logger("changelog");
    }

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

            if (!userSettings.get("changelogLastView"))
            {
                firstTime = true;
                this._log.log("first time changelog!");
            }

            userSettings.set("changelogLastView", obj.ts);

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

    showNotification()
    {
        iziToast.show({
            "position": "topRight",
            "theme": "dark",
            "title": "UPDATE",
            "message": "cables has been updated! ",
            "progressBar": false,
            "animateInside": false,
            "close": true,
            "timeout": false,
            "buttons": [
                [
                    "<button>Read More</button>",
                    function (instance, toast)
                    {
                        CABLES.CMD.UI.showChangelog();
                        iziToast.hide({}, toast);
                    },
                ],
            ],
        });
    }

    show()
    {
        if (gui.isRemoteClient) return;

        gui.mainTabs.addIframeTab("changelog", CABLES.sandbox.getCablesUrl() + "/changelog", { "icon": "book-open", "closable": true }, true);
    }
}
