import { uuid } from "cables/src/core/utils.js";
import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";

export class ProfilerDrawCalls
{

    /**
     * @param {import("../../elements/tabpanel/tabpanel.js").default} tabs
     */
    constructor(tabs)
    {
        this._tab = new Tab("GPU Profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);

        const glQueryExt = gui.corePatch().cgl.gl.getExtension("EXT_disjoint_timer_query_webgl2");
        if (glQueryExt)gui.corePatch().cgl.profileData.doProfileGlQuery = true;

        // gui.corePatch().cgl.profileData.glQueryData = {};
        // this.update();
        let html = "<div class=\"tabContentScrollContainer\"><h2>Drawcalls</h2>";
        html += "<a id=\"updatedc\" class=\"cblbutton\" >update</a>";
        html += "<div id=\"dcresults\"></div>";

        this._tab.html(html);
        ele.clickable(ele.byId("updatedc"), () =>
        {
            this.update();

        });
        this.update();

    }

    update()
    {
        // const glQueryData = gui.corePatch().cgl.profileData.glQueryData;
        const cgl = gui.corePatch().cgl;

        const l1 = cgl.on("beginFrame", () =>
        {

            cgl.off(l1);
            cgl.profileData.profileDrawCalls = [];

            const l2 = cgl.on("endFrame", () =>
            {
                console.log("sresresr", gui.corePatch().cgl.profileData.profileDrawCalls);
                cgl.off(l2);
                const calls = gui.corePatch().cgl.profileData.profileDrawCalls;

                let html = "";
                html += calls.length + " drawcalls";

                html += "<div class=\"editor_spreadsheet\">";
                html += "<table class=\"spreadsheet\">";
                html += "<tr>";
                html += "<td class=\"colname\">mesh</td>";
                html += "<td class=\"colname\">shader</td>";
                html += "<td class=\"colname\">verts</td>";
                html += "<td class=\"colname\">instances </td>";
                html += "<td class=\"colname\"></td>";
                html += "</tr>";

                for (let i = 0; i < calls.length; i++)
                {

                    html += "<tr>";
                    html += "<td>" + calls[i].name + "</td>";
                    html += "<td>" + calls[i].shader + "</td>";
                    html += "<td>" + calls[i].verts + "</td>";
                    html += "<td>" + calls[i].instances || 1 + "</td>";
                    if (calls[i].opId)html += "<td><a onclick=\"gui.patchView.focusOpAnim('" + calls[i].opId + "');gui.patchView.centerSelectOp('" + calls[i].opId + "');\" class=\"cblbutton\" >mesh</a></td>";
                    html += "</tr>";
                }
                ele.byId("dcresults").innerHTML = html;
                cgl.profileData.profileDrawCalls = null;

            });
        });
    }
}
