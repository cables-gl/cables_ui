import defaultOps from "../../defaultops";
import Tab from "../../elements/tabpanel/tab";

export default class GpuProfiler
{
    constructor(tabs)
    {
        this._tab = new Tab("GPU Profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);

        this.colors = ["#7AC4E0", "#D183BF", "#9091D6", "#FFC395", "#F0D165", "#63A8E8", "#CF5D9D", "#66C984", "#D66AA6", "#515151"];
        this.intervalId = null;
        this.lastPortTriggers = 0;
        this._subTab = 0;
        this._foundPerfOp = false;

        const glQueryExt = gui.corePatch().cgl.gl.getExtension("EXT_disjoint_timer_query_webgl2");
        if (glQueryExt)gui.corePatch().cgl.profileData.doProfileGlQuery = true;

        gui.corePatch().on("performance", this.update.bind(this));
        gui.corePatch().cgl.profileData.glQueryData = {};
        this.update();
    }


    update()
    {
        let html = "<div class=\"tabContentScrollContainer\"><h2>GPU Shader and Mesh Drawcalls</h2>";

        if (!this._foundPerfOp)
        {
            const ops = gui.corePatch().getOpsByObjName(defaultOps.defaultOpNames.performance);
            if (ops && ops.length > 0)
            {
                this._foundPerfOp = true;

                console.log("found perf op!!!!cxcsdcsd");
            }
            else
            {
                html += "<div class=\"warning-error warning-error-level2\">Error: Insert a performance op directly below mainloop to measure all performance related data!</div>";
            }
        }

        const glQueryData = gui.corePatch().cgl.profileData.glQueryData;

        if (glQueryData)
        {
            let arr = [];
            let allTimes = 0;

            for (let i in glQueryData)
            {
                arr.push(glQueryData[i]);
                allTimes += (glQueryData[i].time || 0);
            }

            for (let i = 0; i < arr.length; i++)
            {
                arr[i].perc = arr[i].time / allTimes;
            }

            arr = arr.sort((a, b) => { return b.perc - a.perc; });

            let sum = 0;
            for (let i = 0; i < arr.length; i++)
            {
                sum += (arr[i].time || 0);
            }
            html += "Sum: " + Math.round(sum * 1000) / 1000 + "ms<br/><br/>";
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
                html += "<td><span>" + Math.round((arr[i].time || 0) * 1000) / 1000 + "ms</span></td>";
                html += "<td><span>" + Math.round((arr[i].perc || 0) * 100) + "%</span></td>";
                html += "<td><span class=\"nobreak\">" + arr[i].id + "</span></td>";
                html += "</tr>";
            }
            html += "</table>";
            html += "</div>";
            html += "</div>";
        }

        this._tab.html(html);
        setTimeout(() => { this.update(); }, 500);
    }
}
