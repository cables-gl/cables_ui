import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

export default class TabDebugger
{
    static TABSESSION_NAME = "debugger";

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this._tab = new Tab("Debugger", { "icon": "list", "singleton": true, "infotext": "tab_debugger", "padding": true });
        tabs.addTab(this._tab, true);

        editorSession.rememberOpenEditor(TabDebugger.TABSESSION_NAME, "debugger", { }, true);
        let html = getHandleBarHtml("tab_debugger");
        this._tab.html(html);
        this.update();
        this.steps = [];
        this.index = 0;

        gui.corePatch().on("debuggerstep", (o) =>
        {
            this.steps.unshift(o);
        });

        ele.clickable(ele.byId("debug_step"), () =>
        {
            if (this.steps.length > 0)
            {
                console.log("left", this.steps.length);
                const step = this.steps.shift();
                ele.byId("debugger_log").innerHTML += step.log + "<br/>";
                if (step)
                    step.exec();
            }

        });
        ele.clickable(ele.byId("debug_start"), () =>
        {
            gui.corePatch().debuggerEnabled = true;

        });
        this._tab.on("close", () =>
        {
            editorSession.remove(TabDebugger.TABSESSION_NAME, "debugger");
        });
    }

    update()
    {

    }
}

editorSession.addListener(TabDebugger.TABSESSION_NAME, (id, data) =>
{
    new TabDebugger(gui.mainTabs);
});
