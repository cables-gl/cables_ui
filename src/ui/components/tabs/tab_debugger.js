import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import opNames from "../../opnameutils.js";
import { PortDir, portType } from "../../core_constants.js";

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
            // if (gui.corePatch().continueStepDebugSet)
            // {

            //     const f = gui.corePatch().continueStepDebugSet[0];
            //     gui.corePatch().continueStepDebugSet.shift();
            //     if (f) f();
            //     console.log("steps", gui.corePatch().continueStepDebugSet);

            // }
            this.update();
        });
        ele.clickable(ele.byId("debug_start"), () =>
        {
            // gui.corePatch().start = true;
            gui.corePatch().startStepDebug();

        });
        this._tab.on("close", () =>
        {
            editorSession.remove(TabDebugger.TABSESSION_NAME, "debugger");
        });
    }

    update()
    {
        console.log("1", gui.corePatch().continueStepDebugLog);
        // let html = getHandleBarHtml("tab_debugger");
        let html = "";
        html += "<table>";
        let lastOp = null;
        if (gui.corePatch().continueStepDebugLog)
            for (let i = 0; i < gui.corePatch().continueStepDebugLog.length; i++)
            {
                html += "<tr>";
                const step = gui.corePatch().continueStepDebugLog[i];
                html += "<td>";
                if (lastOp != step.port.op)
                    html += "<span>op " + step.port.op.name + "</span>";
                html += "</td>";
                html += "<td>";

                if (step.port.direction == PortDir.out) html += "out";
                else html += "in";
                html += "</td>";
                html += "<td>";

                html += " <span class=\"" + opNames.getPortTypeClassHtml(step.port.type) + "\">█</span>  " + step.port.name;
                html += "</td>";

                html += "<td>";
                if (step.port.type != portType.trigger)
                {
                    html += step.vold;
                    html += " -> ";
                    html += step.v;
                }
                html += "</td>";
                html += "</tr>";

                lastOp = step.port.op;
            }
        html += "</table>";

        // this._tab.html(html);
        ele.byId("debugger_log").innerHTML = html;
        // setTimeout(this.update.bind(this), 10000);
    }
}

editorSession.addListener(TabDebugger.TABSESSION_NAME, (id, data) =>
{
    new TabDebugger(gui.mainTabs);
});
