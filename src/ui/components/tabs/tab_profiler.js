import { ele } from "cables-shared-client";
import { Patch } from "cables";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { gui } from "../../gui.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

/**
 * cpu profile the running patch, what is most expensive?
 *
 * @export
 * @class Profiler
 */
export default class Profiler
{
    static TABSESSION_NAME = "spreadsheet";
    #tab;

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab("Profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this.#tab, true);
        this.show();

        this.colors = ["#7AC4E0", "#D183BF", "#9091D6", "#FFC395", "#F0D165", "#63A8E8", "#CF5D9D", "#66C984", "#D66AA6", "#515151"];
        this.intervalId = null;
        this.lastPortTriggers = 0;
        this._subTab = 0;
        this.#tab.on("close", () =>
        {
            editorSession.remove(Profiler.TABSESSION_NAME, "profiler");
        });

        gui.corePatch().on("onLink", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
        gui.corePatch().on(Patch.EVENT_OP_ADDED, () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
        gui.corePatch().on(Patch.EVENT_OP_DELETED, () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
        gui.corePatch().on("onUnLink", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
    }

    /**
     * @param {number} maxTime
     */
    updateHeatmap(opids, maxTime)
    {
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];

            if (opids[op.id])
            {
                op.setUiAttribs({
                    "heatmapIntensity": opids[op.id].timePsMs / maxTime,
                    "commentOverwrite":
                        this.round(opids[op.id].timePsMs) + "ms ps\n" +
                        this.round(opids[op.id].timePsCount) + "x ps\n" +
                        this.round(opids[op.id].timePsMsAvg) + "ms avg" });

            }
            else
            {
                op.setUiAttribs({ "heatmapIntensity": 0 });

            }
        }

    }

    round(n)
    {
        return Math.round(n * 100) / 100;
    }

    /**
     * @param {number} which
     */
    setTab(which)
    {
        ele.byId("profilerTabOpsCum").classList.remove("tabActiveSubtab");
        ele.byId("profilerTabOps").classList.remove("tabActiveSubtab");
        ele.byId("profilerTabSubpatches").classList.remove("tabActiveSubtab");
        ele.byId("profilerTabPeaks").classList.remove("tabActiveSubtab");
        ele.byId("profilerTabEvents").classList.remove("tabActiveSubtab");

        if (which == 0) ele.byId("profilerTabOpsCum").classList.add("tabActiveSubtab");
        if (which == 3) ele.byId("profilerTabOps").classList.add("tabActiveSubtab");
        if (which == 1) ele.byId("profilerTabSubpatches").classList.add("tabActiveSubtab");
        if (which == 2) ele.byId("profilerTabPeaks").classList.add("tabActiveSubtab");
        if (which == 4) ele.byId("profilerTabEvents").classList.add("tabActiveSubtab");

        gui.corePatch().profiler.clear();
        this._subTab = which;
        this.update();
    }

    show()
    {
        editorSession.rememberOpenEditor(Profiler.TABSESSION_NAME, "profiler", { }, true);

        const html = getHandleBarHtml("meta_profiler", {});
        this.#tab.html(html);

        ele.byId("profilerstartbutton").addEventListener("click", function ()
        {
            this.start();
        }.bind(this));
    }

    update()
    {
        const profiler = gui.corePatch().profiler;
        if (!profiler) return;

        const items = profiler.getItems();

        let html = "";
        let htmlBar = "";
        let allTimes = 0;
        const sortedItems = [];
        let htmlData = "";

        let cumulate = true;
        if (this._subTab == 1 || this._subTab == 3) cumulate = false;

        let allFrameTime = 0;
        const cumulated = {};
        const cumulatedSubPatches = {};

        /** @type {Object.<string,import("cables/src/core/core_profiler.js").ProfilerItem>} */
        const opids = {};
        let maxMsSecond = 0;

        for (const i in items)
        {
            const item = items[i];
            allTimes += item.timePsMs;
            allFrameTime += item.timeUsedFrame;

            maxMsSecond = Math.max(maxMsSecond, item.timePsMs);
            opids[item.opid] = item;

            if (cumulatedSubPatches[item.subPatch])
            {
                cumulatedSubPatches[item.subPatch].timeUsed += item.timeUsed;
            }
            else
            {
                cumulatedSubPatches[item.subPatch] = {};
                cumulatedSubPatches[item.subPatch].timeUsed = item.timeUsed;
                cumulatedSubPatches[item.subPatch].subPatch = item.subPatch;
            }

            if (cumulate)
            {
                if (cumulated[item.title])
                {
                    cumulated[item.title].timeUsed += item.timeUsed;
                    cumulated[item.title].numTriggers += item.numTriggers;
                    cumulated[item.title].numCumulated++;
                }
                else
                {
                    cumulated[item.title] = item;
                    cumulated[item.title].numCumulated = 1;
                    sortedItems.push(cumulated[item.title]);
                }
            }
            else
            {
                sortedItems.push(item);
            }
        }

        this.updateHeatmap(opids, maxMsSecond);

        let allPortTriggers = 0;
        for (const i in sortedItems)
        {
            sortedItems[i].percent = sortedItems[i].timePsMs / allTimes * 100;
            allPortTriggers += sortedItems[i].numTriggers;
        }
        this.lastPortTriggers = allPortTriggers;

        let colorCounter = 0;

        htmlData += "Active Ops: " + Object.keys(opids).length + "<br/><br/>";

        sortedItems.sort(function (a, b) { return b.percent - a.percent; });

        if (!ele.byId("profilerdata"))
        {
            clearInterval(this.intervalId);
            this.intervalId = null;
            return;
        }
        ele.byId("profilerdata").innerHTML = htmlData;

        let item = null;
        let pad = "";
        const cgl = gui.corePatch().cgl;

        if (this._subTab == 4)
        {
            html += "<table>";
            for (let i = 0; i < cgl.profileData.heavyEvents.length; i++)
            {
                html += "<tr><td>" + cgl.profileData.heavyEvents[i].event + "</td><td>" + cgl.profileData.heavyEvents[i].name + "</td><td>" + (cgl.profileData.heavyEvents[i].info || "") + "</td></tr>";
            }
            html += "</table>";
        }
        if (this._subTab == 0 || this._subTab == 3)
        {
            html += "<h3>Ops</h3>";
            html += "<table>";

            html += "<tr>";
            html += "<td class=\"colname\">%</td>";
            html += "<td class=\"colname\">Port Name</td>";
            html += "<td class=\"colname\">Per Frame</td>";
            html += "<td class=\"colname\">Ms Per Second</td>";
            html += "<td class=\"colname\">Ops</td>";
            html += "</td>";

            for (let i in sortedItems)
            {
                item = sortedItems[i];
                pad = "";

                html += "<tr><td><span>";
                if (sortedItems.length > 0)
                    for (let j = 0; j < 2 - (item.percent + "").length; j++)
                        pad += "&nbsp;";

                html += pad + Math.floor(item.percent * 100) / 100 + "% </span></td><td>";

                html += "<span>";

                html += item.title;
                html += "</span></td><td><span> " + Math.round(item.numTriggers * 10) / 10 + "x</span></td><td><span> " + this.round(item.timePsMs) + "ms </span></td>";

                if (cumulate && item.numCumulated)html += "<td><span>" + item.numCumulated + "</span></td>";
                if (!cumulate) html += "<td ><a class=\"button-small\" onclick=\"gui.patchView.centerSelectOp('" + item.opid + "')\">op</a></td>";

                html += "</tr>";

                if (item.percent > 0)
                {
                    htmlBar += "<div class=\"tt\" data-tt=\"" + item.title + "\" style=\"height:20px;background-color:" + this.colors[colorCounter] + ";float:left;padding:0px;overflow:hidden;min-width:0px;width:" + item.percent + "%\"></div>";
                    colorCounter++;
                    if (colorCounter > this.colors.length - 1)colorCounter = 0;
                }
            }

            html += "</table>";
        }

        // peak list
        const htmlPeaks = "";
        sortedItems.sort(function (a, b) { return b.peak - a.peak; });

        // if (Object.keys(cumulatedSubPatches).length > 1)
        if (this._subTab == 1)
        {
            const subPatches = [];
            let allTimesUsed = 0;
            for (const i in cumulatedSubPatches)
            {
                allTimesUsed += cumulatedSubPatches[i].timeUsed;
                subPatches.push(cumulatedSubPatches[i]);
            }
            for (let i = 0; i < subPatches.length; i++)
            {
                subPatches[i].name = gui.patchView.getSubPatchName(subPatches[i].subPatch);
                subPatches[i].percent = subPatches[i].timeUsed / allTimesUsed * 100;
            }
            subPatches.sort(function (a, b) { return b.percent - a.percent; });

            html += "<h3>Subpatches</h3>";
            html += "<table>";
            for (let i = 0; i < subPatches.length; i++)
            {
                html += "<tr>";
                html += "<td><span>" + Math.floor(subPatches[i].percent * 100) / 100 + "%</span></td>";
                html += "<td><span><a onclick=\"gui.patchView.setCurrentSubPatch('" + subPatches[i].subPatch + "')\">" + subPatches[i].name + "</span></td>";
                html += "</tr>";
            }
            html += "</table>";
        }

        if (this._subTab == 2)
        {
            html += "<h3>Peaks</h3>";
            for (let i in sortedItems)
            {
                item = sortedItems[i];
                pad = "";

                if (sortedItems.length > 0) for (let j = 0; j < 2 - (item.peak + "").length; j++)pad += "&nbsp;";
                html += pad + (Math.round(96 * item.peak) / 100) + "ms " + item.title + "<br/>";
            }
        }

        let pauseStr = "Pause";
        if (gui.corePatch().profiler)
        {
            if (gui.corePatch().profiler.paused)pauseStr = "Resume";
            ele.byId("profiler_pause").innerHTML = pauseStr;
        }

        ele.byId("profilerui").style.display = "block";
        // ele.byId("profilerlistPeaks").innerHTML = htmlPeaks;
        ele.byId("profilerbar").innerHTML = htmlBar;
        ele.byId("profilerlist").innerHTML = html;
        ele.byId("profilerstartbutton").style.display = "none";
    }

    start()
    {
        gui.corePatch().profile(true);
        this.update();
        ele.byId("profilerTabOpsCum").addEventListener("click", () => { this.setTab(0); });
        ele.byId("profilerTabOps").addEventListener("click", () => { this.setTab(3); });
        ele.byId("profilerTabSubpatches").addEventListener("click", () => { this.setTab(1); });
        ele.byId("profilerTabPeaks").addEventListener("click", () => { this.setTab(2); });
        ele.byId("profilerTabEvents").addEventListener("click", () => { this.setTab(4); });

        if (!this.intervalId) this.intervalId = setInterval(this.update.bind(this), 1000);
    }
}
editorSession.addListener(Profiler.TABSESSION_NAME, (id, data) =>
{
    new Profiler(gui.mainTabs);
});
