export default class UiProfiler
{

    constructor()
    {
        this._measures = {};
        this.ignore = undefined;

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

    /**
     * @param {string} name
     */
    start(name)
    {
        const ignorethis = this.ignore;
        const perf = this;
        const r =
        {
            "start": performance.now(),

            /**
             * @param {string} [text]
             */
            finish(text)
            {
                if (ignorethis || !perf._measures) return;
                const time = performance.now() - this.start;

                perf._measures[name] = perf._measures[name] || {};
                perf._measures[name].count = perf._measures[name].count || 0;
                perf._measures[name].count++;
                perf._measures[name].apsCount++;
                if (!perf._measures[name].lastFps || performance.now() - perf._measures[name].lastFps)
                {
                    perf._measures[name].lastFps = performance.now();
                    perf._measures[name].aps = perf._measures[name].apsCount;
                    perf._measures[name].apsCount = 0;
                }
                perf._measures[name].text = text;
                perf._measures[name].times = perf._measures[name].times || [];

                try
                {
                    if (perf._measures[name].times.length > 1000000)perf._measures[name].times.length = 0;
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
