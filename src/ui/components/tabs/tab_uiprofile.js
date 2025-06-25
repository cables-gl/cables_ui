import { Events, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { gui } from "../../gui.js";
import { userSettings } from "../usersettings.js";

export class UiProfilerTab extends Events
{
    #filter = "";
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tab = new Tab("ui profiler", { "icon": "pie-chart", "infotext": "tab_chat", "padding": true, "singleton": true, });
        this._tabs.addTab(this._tab, true);

        const html = getHandleBarHtml("tab_uiprofile", {});
        this._tab.html(html);

        this._ele = null;
        this._timeout = null;

        this._currentHighlight = userSettings.get("uiPerfLastHighlight");
        this.#filter = userSettings.get("showUIPerfFilter") || "";
        this._ignore = false;

        this._tab.on("close", () =>
        {
            userSettings.set("showUIPerf", false);
            clearTimeout(this._timeout);
        });

        ele.byId("uiPerfFilter").value = this.#filter;
        ele.byId("uiPerfFilter").addEventListener("input", () =>
        {
            console.log("on input", ele.byId("uiPerfFilter").value);
            this.filter(ele.byId("uiPerfFilter").value);

        });
        userSettings.set("showUIPerf", true);
        this.update();
    }

    /**
     * @param {any} name
     */
    highlight(name)
    {
        for (const i in gui.uiProfiler._measures) gui.uiProfiler._measures[i].highlight = false;
        this._currentHighlight = name;
        userSettings.set("uiPerfLastHighlight", name);
    }

    /**
     * @param {string} str
     */
    filter(str)
    {
        this.#filter = str;
        this.update();
        userSettings.set("showUIPerfFilter", this.#filter);
    }

    update()
    {
        this._eleContainer = this._eleContainer || ele.byId("uiperfcontainer");
        this._ele = this._ele || ele.byId("uiperf");
        const data = [];

        for (const i in gui.uiProfiler._measures)
        {
            const lastTime = Math.round(gui.uiProfiler._measures[i].times[gui.uiProfiler._measures[i].times.length - 1] * 1000) / 1000;
            let avg = 0;
            let max = -88888;
            for (let j = 0; j < gui.uiProfiler._measures[i].times.length; j++)
            {
                avg += gui.uiProfiler._measures[i].times[j];
                max = Math.max(gui.uiProfiler._measures[i].times[j]);
            }

            avg /= gui.uiProfiler._measures[i].times.length;
            avg = Math.round(avg * 1000) / 1000;
            max = Math.round(max * 1000) / 1000;

            if (this._currentHighlight && this._currentHighlight == i)
            {
                gui.uiProfiler._measures[i].highlight = true;
            }

            let color = "col_recent";
            const dist = performance.now() - gui.uiProfiler._measures[i].date;
            if (dist > 2000) color = "col_inactive";
            if (dist < 600) color = "col_active";

            if (!this.#filter || i.indexOf(this.#filter) >= 0)
                data.push(
                    {
                        "highlight": gui.uiProfiler._measures[i].highlight,
                        "color": color,
                        "name": i,
                        "count": gui.uiProfiler._measures[i].count,
                        "text": gui.uiProfiler._measures[i].text,
                        "last": lastTime,
                        "max": max,
                        "avg": avg
                    });
        }

        data.sort(function (a, b)
        {
            return a.name.localeCompare(b.name);
        });

        gui.uiProfiler.ignore = true;
        const html = getHandleBarHtml("uiperformance", { "measures": data });

        this._ele.innerHTML = html;
        this._eleContainer.style.display = "block";
        gui.uiProfiler.ignore = false;

        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            if (userSettings.get("showUIPerf")) this.update();
        }, 500);
    }

}
