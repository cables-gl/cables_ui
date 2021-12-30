import Tab from '../../elements/tabpanel/tab';

export default class GlDebugTab
{
    constructor(tabs)
    {
        this._count = 0;


        this._tab = new Tab("gluidebug", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        gui.patchView._patchRenderer._cgl.profileData.doProfileGlQuery = true;
    }

    show()
    {
        this._count++;

        let html = "<table>";
        // html = "!" + this._count;

        for (const i in gui.patchView._patchRenderer._cgl.profileData.glQueryData)
        {
            html += "<tr><td>" + i + ":</td><td> " + gui.patchView._patchRenderer._cgl.profileData.glQueryData[i].time + "</td></tr>";
        }
        html += "</table>";
        html += "<br/><br/>";

        html += "<table>";
        for (const i in gui.patchView._patchRenderer.debugData)
        {
            html += "<tr><td>" + i + ":</td><td> " + gui.patchView._patchRenderer.debugData[i] + "</td></tr>";
        }

        html += "</table>";

        this._tab.html(html);
        setTimeout(this.show.bind(this), 100);
    }
}
