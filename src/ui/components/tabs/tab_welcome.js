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



        // const html = getHandleBarHtml("tab_welcome", { });

        // this._tab.html(html);


        CABLESUILOADER.talkerAPI.send("getRecentPatches", {}, (err, r) =>
        {
            console.log("rrrrrrr", r, CABLES.platform.getCablesUrl());
            const html = getHandleBarHtml("tab_welcome", { "patches": r, "url": CABLES.platform.getCablesUrl() });
            this._tab.html(html);
        });


        CABLES.editorSession.remove("manageOp", "Welcome");
        CABLES.editorSession.rememberOpenEditor("welcometab", "Welcome", true);


        this._tab.on("close", () =>
        {
            CABLES.editorSession.remove("manageOp", "Welcome");

            for (let i in this._refreshListener)
                gui.off(this._refreshListener[i]);
        });
    }
}
