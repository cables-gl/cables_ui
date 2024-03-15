import { getHandleBarHtml } from "../utils/handlebars.js";
import userSettings from "./usersettings.js";

export default class UiProfiler
{
    constructor()
    {
        this._measures = {};
        this._ele = null;
        this._timeout = null;

        this._currentHighlight = userSettings.get("uiPerfLastHighlight");
        this._ignore = false;
    }

    hide()
    {
        this._ele.style.display = "none";
        clearTimeout(this._timeout);

        userSettings.set("showUIPerf", false);
    }

    show()
    {
        userSettings.set("showUIPerf", true);
        this.update();
    }

    highlight(name)
    {
        for (const i in this._measures) this._measures[i].highlight = false;
        this._currentHighlight = name;
        userSettings.set("uiPerfLastHighlight", name);
        if (userSettings.get("showUIPerf")) this.show();
    }

    update()
    {
        this._ele = this._ele || document.getElementById("uiperf");
        const data = [];

        for (const i in this._measures)
        {
            const lastTime = Math.round(this._measures[i].times[this._measures[i].times.length - 1] * 1000) / 1000;
            let avg = 0;
            for (let j = 0; j < this._measures[i].times.length; j++)
                avg += this._measures[i].times[j];

            avg /= this._measures[i].times.length;
            avg = Math.round(avg * 1000) / 1000;

            if (this._currentHighlight && this._currentHighlight == i)
            {
                this._measures[i].highlight = true;
            }

            let color = "col_recent";
            const dist = performance.now() - this._measures[i].date;
            if (dist > 2000) color = "col_inactive";
            if (dist < 600) color = "col_active";

            data.push(
                {
                    "highlight": this._measures[i].highlight,
                    "color": color,
                    "name": i,
                    "count": this._measures[i].count,
                    "last": lastTime,
                    "avg": avg
                });
        }

        data.sort(function (a, b)
        {
            return a.name.localeCompare(b.name);
        });

        this._ignore = true;
        const html = getHandleBarHtml("uiperformance", { "measures": data });

        this._ele.innerHTML = html;
        this._ele.style.display = "block";
        this._ignore = false;

        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            if (userSettings.get("showUIPerf")) CABLES.UI.uiProfiler.update();
        }, 500);
    }


    print()
    {
        const data = [];

        for (const i in this._measures)
        {
            const lastTime = Math.round(this._measures[i].times[this._measures[i].times.length - 1] * 1000) / 1000;
            let avg = 0;
            for (let j = 0; j < this._measures[i].times.length; j++) avg += this._measures[i].times[j];
            avg /= this._measures[i].times.length;
            avg = Math.round(avg * 1000) / 1000;

            data.push(
                [i, "count " + this._measures[i].count, lastTime, "~" + avg]
            );
        }

        console.table("uiperf print", data);
    }

    clear()
    {
        this._measures = {};
    }

    start(name)
    {
        const ignorethis = this._ignore;
        const perf = this;
        const r =
        {
            "start": performance.now(),
            finish()
            {
                if (ignorethis || !perf._measures) return;
                const time = performance.now() - this.start;

                perf._measures[name] = perf._measures[name] || {};
                perf._measures[name].count = perf._measures[name].count || 0;
                perf._measures[name].count++;

                perf._measures[name].times = perf._measures[name].times || [];

                try
                {
                    if (perf._measures[name].length > 100000000)perf._measures[name].length = 0;
                    perf._measures[name].times.push(time);
                }
                catch (e)
                {
                    console.log(e);
                    console.log(perf._measures[name].times);
                }

                perf._measures[name].date = performance.now();
            }
        };
        return r;
    }
}
