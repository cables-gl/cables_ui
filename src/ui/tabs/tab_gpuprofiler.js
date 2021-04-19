
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
    let html = "<h2>GPU Shader and Mesh Drawcalls</h2><table>";

    const glQueryData = gui.corePatch().cgl.profileData.glQueryData;
    let currentTimeGPU = 0;
    if (glQueryData)
    {
        let count = 0;
        for (let i in glQueryData)
        {
            html += "<tr>";
            html += "<td>" + Math.round(glQueryData[i].time * 100) / 100 + "ms</td>";
            html += "<td>" + Math.round(glQueryData[i].perc * 100) / 100 + "ms</td>";
            html += "<td>" + glQueryData[i].id + "</td>";
            html += "</tr>";

            // count++;
            // if (glQueryData[i].time) currentTimeGPU += glQueryData[i].time;
        }
        // console.log("glquery count",currentTimeGPU)
    }

    html += "</table>";

    this._tab.html(html);
};
