import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

export default class WelcomeTab
{
    constructor(tabs)
    {
        this._tab = new Tab("Welcome", { "icon": "cables", "infotext": "tab_welcome", "padding": true, "singleton": true });
        tabs.addTab(this._tab, true);
        this._tabs = tabs;

        CABLESUILOADER.talkerAPI.send("getRecentPatches", {}, (err, r) =>
        {
            const html = getHandleBarHtml("tab_welcome", { "patches": r, "url": CABLES.platform.getCablesStaticUrl(), "version": CABLES.platform.getCablesVersion() });
            this._tab.html(html);

            CABLES.ajax("https://dev.cables.gl/api/events/", (err2, res) =>
            {
                const result = JSON.parse(res);

                if (result.events.length > 3)result.events.length = 3;

                const eventsHtml = getHandleBarHtml("tab_welcome_events", { "events": result.events || [] });

                ele.byId("welcome_events").innerHTML = eventsHtml;
            });

            if (!CABLES.platform.frontendOptions.hasCommunity)
                CABLES.ajax("https://dev.cables.gl/api/downloads/latest/", (err2, res) =>
                {
                    const result = JSON.parse(res);
                    const elePlatVersion = ele.byId("platformaltversion");

                    if (!result || !elePlatVersion || !result.name) return;

                    elePlatVersion.innerHTML = " - latest standalone release: <a target=\"_blank\" class=\"link\" href=\"https://cables.gl/downloads\">" + result.name + "</a>";
                });
        });

        CABLES.editorSession.remove("welcometab", "Welcome");
        CABLES.editorSession.rememberOpenEditor("welcometab", "Welcome", true);

        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("welcometab", "Welcome");
        });
    }
}
