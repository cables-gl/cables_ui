var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UiPerformance = function ()
{

    this._measures={};


};


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


CABLES.UiPerformance.prototype.start = function (name) {
    var perf=this;
    var r=
    {
        start: performance.now(),
        finish:function()
        {
            var time=performance.now()-this.start
            // console.log(name,time);

            perf._measures[name] = perf._measures[name] || {};
            perf._measures[name].count = perf._measures[name].count || 0;
            perf._measures[name].count++;

            perf._measures[name].times = perf._measures[name].times || [];
            perf._measures[name].times.push(time);

        }
    }
    return r;

}

// CABLES.UiPerformance.finish = function (name) {
//     this._running[name] = performance.now();
// }


CABLES.uiperf=new CABLES.UiPerformance();



