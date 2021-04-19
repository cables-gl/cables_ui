
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.GpuProfiler = function (tabs)
{
    this._tab = new CABLES.UI.Tab("GPU Profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
    tabs.addTab(this._tab, true);
    // this.show();

    this.colors = ["#7AC4E0", "#D183BF", "#9091D6", "#FFC395", "#F0D165", "#63A8E8", "#CF5D9D", "#66C984", "#D66AA6", "#515151"];
    this.intervalId = null;
    this.lastPortTriggers = 0;
    this._subTab = 0;

    const glQueryExt = gui.corePatch().cgl.gl.getExtension("EXT_disjoint_timer_query_webgl2");
    if (glQueryExt)gui.corePatch().cgl.profileData.doProfileGlQuery = true;

    if (!this.intervalId) this.intervalId = setInterval(this.update.bind(this), 500);
    this.update();
};


CABLES.UI.GpuProfiler.prototype.update = function ()
{
    let html = "<h2>GPU Shader and Mesh Drawcalls</h2>";

    const glQueryData = gui.corePatch().cgl.profileData.glQueryData;
    let currentTimeGPU = 0;
    if (glQueryData)
    {
        let arr = [];
        let allTimes = 0;

        for (let i in glQueryData)
        {
            arr.push(glQueryData[i]);
            allTimes += glQueryData[i].time;
        }

        arr.sort((a, b) => b.time - a.time);

        for (let i = 0; i < arr.length; i++)
        {
            arr[i].perc = arr[i].time / allTimes;
        }


        html += "<div class=\"editor_spreadsheet\">";
        html += "<table class=\"spreadsheet\">";
        html += "<tr>";
        html += "<td class=\"colname\">Milliseconds</td>";
        html += "<td class=\"colname\">Percent</td>";
        html += "<td class=\"colname\">ID</td>";
        html += "</tr>";

        for (let i = 0; i < arr.length; i++)
        {
            html += "<tr>";
            html += "<td><span>" + Math.round(arr[i].time || 0 * 1000) / 1000 + "ms</span></td>";
            html += "<td><span>" + Math.round(arr[i].perc || 0 * 1000) / 1000 + "%</span></td>";
            html += "<td><span>" + arr[i].id + "</span></td>";
            html += "</tr>";
        }
        html += "</table>";
        html += "</div>";
    }

    this._tab.html(html);
};
