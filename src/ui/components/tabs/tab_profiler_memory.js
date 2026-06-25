import { uuid } from "cables/src/core/utils.js";
import { ele } from "cables-shared-client";
import { MemProfiler } from "cables/src/core/memprofiler.js";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import OpWatchUiAttribs from "./tab_uiattribs.js";

export class TabProfilerMemory
{
    static NAME = "tabProfilerMemory";
    #tab = null;

    /**
     * @param {import("../../elements/tabpanel/tabpanel.js").default} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab("Memory Profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this.#tab, true);

        editorSession.rememberOpenEditor(TabProfilerMemory.NAME, "profiler", { }, true);

        this.#tab.on("close", () =>
        {
            editorSession.remove(TabProfilerMemory.NAME, "profiler");
        });

        let html = "<div class=\"tabContentScrollContainer\"><h2>Memory</h2>";
        html += "<a id=\"updatedc\" class=\"cblbutton\" >update</a>";
        html += "<div id=\"dcresults\"></div>";

        this.#tab.html(html);
        ele.clickable(ele.byId("updatedc"), () =>
        {
            this.update();

        });
        this.update();

    }

    update()
    {

        let html = "";
        html += Object.keys(CABLES.memProfiler.items).length + " items";

        html += "<div class=\"editor_spreadsheet\">";
        html += "<table class=\"spreadsheet\">";
        html += "<tr>";
        html += "<td class=\"colname\">name</td>";
        html += "<td class=\"colname\">type</td>";
        html += "<td class=\"colname\">size</td>";
        html += "<td class=\"colname\">size GPU</td>";
        html += "</tr>";

        const items = CABLES.memProfiler.items;
        for (const i in items)
        {
            html += "<tr>";
            html += "<td>" + items[i].name + "</td>";
            html += "<td>" + items[i].type + "</td>";

            if (items[i].size)html += "<td>" + Math.round(items[i].size / 1024 / 1024 * 100) / 100 + "mb</td>";
            else html += "<td></td>";

            if (items[i].sizeGpu)html += "<td>" + Math.round(items[i].sizeGpu / 1024 / 1024 * 100) / 100 + "mb</td>";
            else html += "<td></td>";

            html += "</tr>";
        }
        ele.byId("dcresults").innerHTML = html;
    }
}
editorSession.addListener(TabProfilerMemory.NAME, (id, data) =>
{
    new TabProfilerMemory(gui.mainTabs);
});
