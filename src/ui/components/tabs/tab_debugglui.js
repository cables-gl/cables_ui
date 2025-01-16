import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";

export default class GlDebugTab
{
    constructor(tabs)
    {
        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("gluidebug", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        gui.patchView._patchRenderer._cgl.profileData.doProfileGlQuery = true;
    }

    show()
    {
        this._count++;

        let html = "<div class=\"tabContentScrollContainer\"><table>";

        for (const i in gui.patchView._patchRenderer._cgl.profileData.glQueryData)
        {
            html += "<tr><td>" + i + ":</td><td> " + gui.patchView._patchRenderer._cgl.profileData.glQueryData[i].time + "</td></tr>";
        }
        html += "</table>";
        html += "<br/><br/>";

        html += "<table>";
        for (const i in gui.patchView._patchRenderer.debugData)
        {
            html += "<tr><td>" + i + ":</td><td>" + gui.patchView._patchRenderer.debugData[i] + "</td></tr>";
        }

        html += "</table></div>";

        this._tab.html(html);
        clearTimeout(this._timeout);
        this._timeout = setTimeout(this.show.bind(this), 300);
    }
}
