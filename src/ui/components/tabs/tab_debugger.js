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
    lastCount = 0;

    steps = [];
    index = 0;
    timeOut = null;

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

        gui.corePatch().on("debuggerstep", (o) =>
        {
            this.steps.unshift(o);
        });

        ele.clickable(ele.byId("debug_step"), () =>
        {
            this.update();
        });

        ele.clickable(ele.byId("debug_start"), () =>
        {
            gui.corePatch().startStepDebug();
            this.update();
        });

        this._tab.on("close", () =>
        {
            clearInterval(this.timeOut);
            editorSession.remove(TabDebugger.TABSESSION_NAME, "debugger");
        });
        this.timeOut = setInterval(this.update.bind(this), 500);
    }

    update()
    {
        console.log("1");
        gui.corePatch().continueStepDebugLog = gui.corePatch().continueStepDebugLog || [];
        if (this.lastCount == gui.corePatch().continueStepDebugLog.length) return;

        this.lastCount = gui.corePatch().continueStepDebugLog.length;

        let html = "";
        html += "<table>";
        let lastOp = null;

        for (let i = 0; i < gui.corePatch().continueStepDebugLog.length; i++)
        {
            const step = gui.corePatch().continueStepDebugLog[i];
            if (lastOp != step.port.op)
            {
                html += "<tr>";
                html += "<td colspan=\"10\"><div style=\"margin:4px\"></div>";
                html += "</td>";
                html += "</tr>";
            }
            html += "<tr>";
            html += "<td>";
            if (lastOp != step.port.op)
                html += "<span>op " + step.port.op.name + "</span>";
            html += "</td>";
            html += "<td>";

            if (step.port.direction == PortDir.out) html += "out";
            else html += "in";
            html += "</td>";
            html += "<td >";

            html += " <span class=\"" + opNames.getPortTypeClassHtml(step.port.type) + "\">█</span>  " + step.port.name;
            html += "</td>";

            html += "<td>";
            if (step.port.type != portType.trigger)
            {
                html += step.vold;
                html += " → ";
                html += step.v;
            }
            html += "</td>";
            html += "</tr>";

            lastOp = step.port.op;
        }
        html += "</table>";

        // this._tab.html(html);
        ele.byId("debugger_log").innerHTML = html;
    }
}

editorSession.addListener(TabDebugger.TABSESSION_NAME, (id, data) =>
{
    new TabDebugger(gui.mainTabs);
});
