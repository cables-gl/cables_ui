import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

/**
 * tab panel to welcome users of the standalone editor
 *
 * @export
 * @class WelcomeTab
 */
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

            CABLES.ajax("https://dev.cables.gl/api/events/", (err2, res, xhr) =>
            {
                if (!(err2 || (xhr && xhr.status === 0)))
                {
                    const result = JSON.parse(res);
                    result.events.reverse();
                    if (result.events.length > 3)result.events.length = 3;
                    const eventsHtml = getHandleBarHtml("tab_welcome_events", { "events": result.events || [] });
                    const eventsEle = ele.byId("welcome_events");
                    if (eventsEle) eventsEle.innerHTML = eventsHtml;
                }
            });

            if (CABLES.platform.frontendOptions.isStandalone)
                CABLES.ajax("https://dev.cables.gl/api/downloads/latest/", (err2, res, xhr) =>
                {
                    if (!(err2 || (xhr && xhr.status === 0)))
                    {
                        try
                        {
                            const result = JSON.parse(res);
                            const elePlatVersion = ele.byId("platformaltversion");
                            if (!result || !elePlatVersion || !result.name) return;
                            elePlatVersion.innerHTML = " - latest standalone release: <a target=\"_blank\" class=\"link\" href=\"https://cables.gl/standalone\">" + result.name + "</a>";
                        }
                        catch (e) {}
                    }
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
