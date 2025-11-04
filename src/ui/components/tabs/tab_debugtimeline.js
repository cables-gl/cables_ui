import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";

export default class GlTimelineDebugTab
{
    constructor(tabs)
    {
        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("timelinedebug", { "icon": "clock", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

    }

    show()
    {
        this._count++;

        let html = "<div class=\"tabContentScrollContainer\">";

        const tl = gui.glTimeline;

        html = "<table>";
        const keys = tl.getSelectedKeys();
        for (let i = 0; i < keys.length; i++)
        {
            html += "<tr>";
            html += "<td>" + keys[i].time + "</td>";
            html += "<td>" + keys[i].value + "</td>";
            html += "<td>" + keys[i].rect.absY + "</td>";
            html += "</tr>";
        }

        html += "</table>";
        html += "</div>";

        this._tab.html(html);
        clearTimeout(this._timeout);
        this._timeout = setTimeout(this.show.bind(this), 300);
    }
}
