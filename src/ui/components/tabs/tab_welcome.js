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
            const html = getHandleBarHtml("tab_welcome", { "patches": r, "url": CABLES.platform.getCablesStaticUrl() });
            this._tab.html(html);
        });

        CABLES.editorSession.remove("welcometab", "Welcome");
        CABLES.editorSession.rememberOpenEditor("welcometab", "Welcome", true);

        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("welcometab", "Welcome");
        });
    }
}
