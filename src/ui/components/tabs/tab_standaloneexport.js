import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { CmdPatch } from "../../commands/cmd_patch.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { gui } from "../../gui.js";

export default class StandaloneExport
{
    static TABSESSION_NAME = "standaloneexport";

    constructor(tabs)
    {
        this._tab = tabs.addTab(new Tab("Export", { "icon": "download", "singleton": true, "padding": true }), true);

        this._tab.html(getHandleBarHtml("tab_standaloneexport", {}));
        this._tab.contentEle.querySelector("#exportHtml").addEventListener("click", () => { CmdPatch.export("html"); });
        this._tab.contentEle.querySelector("#exportPatch").addEventListener("click", () => { CmdPatch.export("patch"); });

        editorSession.rememberOpenEditor(StandaloneExport.TABSESSION_NAME, StandaloneExport.TABSESSION_NAME, {}, true);
        this._tab.on(Tab.EVENT_CLOSE, () => { editorSession.remove(StandaloneExport.TABSESSION_NAME, StandaloneExport.TABSESSION_NAME); });
    }
}

editorSession.addListener(StandaloneExport.TABSESSION_NAME, () => { new StandaloneExport(gui.mainTabs); });
