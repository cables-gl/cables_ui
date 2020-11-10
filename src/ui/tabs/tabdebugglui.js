CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.GlDebugTab = class
{
    constructor(tabs)
    {
        this._count = 0;


        this._tab = new CABLES.UI.Tab("gluidebug", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();
    }

    show()
    {
        this._count++;

        let html = "<table>";
        // html = "!" + this._count;

        for (const i in gui.patchView._patchRenderer.debugData)
        {
            html += "<tr><td>" + i + ":</td><td> " + gui.patchView._patchRenderer.debugData[i] + "</td></tr>";
        }

        html += "</table>";

        this._tab.html(html);
        setTimeout(this.show.bind(this), 100);
    }
};
