CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Profiler = function (tabs)
{
    this._tab = new CABLES.UI.Tab("profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
    tabs.addTab(this._tab, true);
    this.show();

    this.colors = ["#7AC4E0", "#D183BF", "#9091D6", "#FFC395", "#F0D165", "#63A8E8", "#CF5D9D", "#66C984", "#D66AA6", "#515151"];
    this.intervalId = null;
    this.lastPortTriggers = 0;
    this._subTab = 0;


    gui.corePatch().on("onLink", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
    gui.corePatch().on("onOpAdd", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
    gui.corePatch().on("onOpDelete", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
    gui.corePatch().on("onUnLink", () => { if (gui.corePatch().profiler) gui.corePatch().profiler.clear(); this.update(); });
};

CABLES.UI.Profiler.prototype.setTab = function (which)
{
    document.getElementById("profilerTabOps").classList.remove("tabActiveSubtab");
    document.getElementById("profilerTabSubpatches").classList.remove("tabActiveSubtab");
    document.getElementById("profilerTabPeaks").classList.remove("tabActiveSubtab");
    if (which == 0) document.getElementById("profilerTabOps").classList.add("tabActiveSubtab");
    if (which == 1) document.getElementById("profilerTabSubpatches").classList.add("tabActiveSubtab");
    if (which == 2) document.getElementById("profilerTabPeaks").classList.add("tabActiveSubtab");

    gui.corePatch().profiler.clear();
    this._subTab = which;
    this.update();
};


CABLES.UI.Profiler.prototype.show = function ()
{
    const html = CABLES.UI.getHandleBarHtml("meta_profiler", {});
    this._tab.html(html);

    document.getElementById("profilerstartbutton").addEventListener("click", function ()
    {
        this.start();
    }.bind(this));
};

CABLES.UI.Profiler.prototype.update = function ()
{
    const profiler = gui.corePatch().profiler;
    const items = profiler.getItems();
    let html = "";
    let htmlBar = "";
    let allTimes = 0;
    const sortedItems = [];
    let htmlData = "";

    const cumulate = true;
    const cumulated = {};
    const cumulatedSubPatches = {};
    const opids = {};

    for (const i in items)
    {
        const item = items[i];
        allTimes += item.timeUsed;

        opids[item.opid] = 1;

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

    let allPortTriggers = 0;
    for (const i in sortedItems)
    {
        sortedItems[i].percent = sortedItems[i].timeUsed / allTimes * 100;
        allPortTriggers += sortedItems[i].numTriggers;
    }
    let colorCounter = 0;

    // if (allPortTriggers - this.lastPortTriggers > 0) htmlData = "Port triggers/s: " + (allPortTriggers - this.lastPortTriggers) + "<br/>";
    this.lastPortTriggers = allPortTriggers;

    htmlData += "Active Ops: " + Object.keys(opids).length + "<br/><br/>";

    sortedItems.sort(function (a, b) { return b.percent - a.percent; });

    if (!document.getElementById("profilerdata"))
    {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log("stopping interval...");
        return;
    }
    document.getElementById("profilerdata").innerHTML = htmlData;

    let item = null;
    let pad = "";

    if (this._subTab == 0)
    {
        html += "<h3>Ops</h3>";
        html += "<table>";

        for (let i in sortedItems)
        {
            item = sortedItems[i];
            pad = "";

            html += "<tr><td>";
            if (sortedItems.length > 0)
                for (i = 0; i < 2 - (item.percent + "").length; i++)
                    pad += "&nbsp;";

            html += pad + Math.floor(item.percent * 100) / 100 + "% </td><td>" + item.title + "</td><td> " + item.numTriggers + " times</td><td> " + Math.round(item.timeUsed) + "ms </td>";
            if (item.numCumulated)html += "<td>" + item.numCumulated + " ops</td>";
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
            html += "<td>" + Math.floor(subPatches[i].percent * 100) / 100 + "%</td>";
            html += "<td><a onclick=\"gui.patchView.setCurrentSubPatch('" + subPatches[i].subPatch + "')\">" + subPatches[i].name + "</td>";
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

            if (sortedItems.length > 0) for (i = 0; i < 2 - (item.peak + "").length; i++)pad += "&nbsp;";
            html += pad + (Math.round(96 * item.peak) / 100) + "ms " + item.title + "<br/>";
        }
    }

    document.getElementById("profilerui").style.display = "block";
    // document.getElementById("profilerlistPeaks").innerHTML = htmlPeaks;
    document.getElementById("profilerbar").innerHTML = htmlBar;
    document.getElementById("profilerlist").innerHTML = html;
    document.getElementById("profilerstartbutton").style.display = "none";
};

CABLES.UI.Profiler.prototype.start = function ()
{
    gui.corePatch().profile(true);
    this.update();
    document.getElementById("profilerTabOps").addEventListener("click", () => { this.setTab(0); });
    document.getElementById("profilerTabSubpatches").addEventListener("click", () => { this.setTab(1); });
    document.getElementById("profilerTabPeaks").addEventListener("click", () => { this.setTab(2); });

    if (!this.intervalId) this.intervalId = setInterval(this.update.bind(this), 1000);
};
