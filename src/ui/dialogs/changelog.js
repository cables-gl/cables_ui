import { Logger } from "cables-shared-client";
import userSettings from "../components/usersettings.js";

/**
 * show a toast when cables changelog is new
 *
 * @export
 * @class ChangelogToast
 */
export default class ChangelogToast
{
    constructor()
    {
        this._log = new Logger("changelog");
    }

    getHtml(cb, since)
    {
        CABLESUILOADER.talkerAPI.send("getChangelog", { "num": 1 }, (err, obj) =>
        {
            if (since)
            {
                if (obj.items) for (let i = 0; i < obj.items.length; i++) if (obj.items[i].date < since) obj.items.length = i;
                obj.onlyLatest = true;
            }

            let firstTime = false;

            if (!userSettings.get("changelogLastView"))
            {
                firstTime = true;
                this._log.log("first time changelog!");
            }

            userSettings.set("changelogLastView", obj.ts);

            if (!obj.items || obj.items.length === 0)
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
                        window.open(CABLES.platform.getCablesUrl() + "/changelog");
                        // CABLES.CMD.UI.showChangelog();
                        // iziToast.hide({}, toast);
                    },
                ],
            ],
        });
    }

    show()
    {
        if (gui.isRemoteClient) return;

        const url = CABLES.platform.getCablesUrl() + "/changelog?iframe=true";
        const gotoUrl = CABLES.platform.getCablesUrl() + "/changelog";

        gui.mainTabs.addIframeTab("changelog", url, { "icon": "book-open", "closable": true, "gotoUrl": gotoUrl }, true);
    }
}
