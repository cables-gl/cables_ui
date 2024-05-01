import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";

export default class WelcomeTab
{
    constructor(tabs)
    {
        this._tab = new Tab("Welcome", { "icon": "cables", "infotext": "tab_welcome", "padding": true });
        tabs.addTab(this._tab, true);
        this._tabs = tabs;

        CABLESUILOADER.talkerAPI.send("getRecentPatches", {}, (err, r) =>
        {
            const html = getHandleBarHtml("tab_welcome", { "patches": r, "url": CABLES.platform.getCablesUrl() });
            this._tab.html(html);
        });

        CABLES.editorSession.remove("manageOp", "Welcome");
        CABLES.editorSession.rememberOpenEditor("welcometab", "Welcome", true);

        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("manageOp", "Welcome");
        });
    }
}
