
var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UiPerformance = function ()
{

    this._measures={};


};


CABLES.UiPerformance.prototype.print = function ()
{


    // var people = [["John", "Smith"], ["Jane", "Doe"], ["Emily", "Jones"]]
    var data=[];

    for(var i in this._measures)
    {
        data.push(
            [i, 'count '+this._measures[i].count, this._measures[i].times[this._measures[i].times.length-1] ]
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



