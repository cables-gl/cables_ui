var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UiPerformance = function ()
{
    this._measures={};
    this._ele=null;
    this._timeout=null;

    this._currentHighlight = CABLES.UI.userSettings.get("uiPerfLastHighlight");
    this._ignore = false;
};

CABLES.UiPerformance.prototype.hide = function ()
{
    this._ele.style.display="none";
    clearTimeout(this._timeout);

    CABLES.UI.userSettings.set("showUIPerf", false);
}

CABLES.UiPerformance.prototype.show = function ()
{
    CABLES.UI.userSettings.set("showUIPerf", true);
    this.update();
}

CABLES.UiPerformance.prototype.highlight = function (name)
{
    for (var i in this._measures) this._measures[i].highlight=false

    this._currentHighlight=name;

    CABLES.UI.userSettings.set("uiPerfLastHighlight", name);

    if (CABLES.UI.userSettings.get("showUIPerf")) this.show();
}



CABLES.UiPerformance.prototype.update = function ()
{
    this._ele = this._ele|| document.getElementById("uiperf");

    var data = [];

    for (var i in this._measures)
    {
        var lastTime = Math.round(this._measures[i].times[this._measures[i].times.length - 1] * 1000) / 1000;
        var avg = 0;
        for (var j = 0; j < this._measures[i].times.length; j++)
        {
            avg += this._measures[i].times[j];
        }
        avg /= this._measures[i].times.length;
        avg = Math.round(avg * 1000) / 1000;

        if (this._currentHighlight && this._currentHighlight==i) {
            this._measures[i].highlight=true;
        }

        var color = 'col_recent';
        const dist=performance.now() - this._measures[i].date;
        if (dist > 2000) color = 'col_inactive';
        if (dist < 600) color = 'col_active'

        data.push(
            {
                name:i,
                color:color,
                count: this._measures[i].count,
                highlight: this._measures[i].highlight,
                last:lastTime,
                avg:avg
            });
        // console.log(i, this._measures[i].highlight);
    }

    data.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    this._ignore = true;
    var html = CABLES.UI.getHandleBarHtml('uiperformance', { measures: data});

    this._ele.innerHTML=html;
    this._ele.style.display="block";
    this._ignore = false;

    clearTimeout(this._timeout);
    this._timeout =setTimeout(function()
    {
        if (CABLES.UI.userSettings.get("showUIPerf")) CABLES.uiperf.update();
    },500);

}


CABLES.UiPerformance.prototype.print = function ()
{
    var data=[];

    for(var i in this._measures)
    {
        var lastTime=Math.round( this._measures[i].times[this._measures[i].times.length - 1]*1000 )/1000;
        var avg=0;
        for (var j = 0; j < this._measures[i].times.length ; j++) avg += this._measures[i].times[j];
        avg /= this._measures[i].times.length;
        avg=Math.round(avg*1000)/1000;

        data.push(
            [i, 'count ' + this._measures[i].count, lastTime, '~' + avg ]
        );
    }

    console.table(data);
}

CABLES.UiPerformance.prototype.clear = function ()
{
    this._measures={};
}

CABLES.UiPerformance.prototype.start = function (name) {
    const ignorethis=this._ignore;
    var perf=this;
    var r=
    {
        start: performance.now(),
        finish:function()
        {
            if (ignorethis)return;
            var time=performance.now()-this.start
            // console.log(name,time);

            perf._measures[name] = perf._measures[name] || {};
            perf._measures[name].count = perf._measures[name].count || 0;
            perf._measures[name].count++;

            perf._measures[name].times = perf._measures[name].times || [];
            perf._measures[name].times.push(time);

            perf._measures[name].date = performance.now();

        }
    }
    return r;

}



