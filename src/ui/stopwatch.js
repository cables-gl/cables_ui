
CABLES.StopWatch = function (title)
{
    this.title = title;
    this.startTime = CABLES.now();
    console.log(this.title + " Stopwatch started ");
};

CABLES.StopWatch.prototype.stop = function (title)
{
    let timeUsed = CABLES.now() - this.startTime;
    timeUsed = "" + (Math.round(timeUsed) / 100) * 100 + "ms";
    console.log(this.title + " " + timeUsed + " " + title);
};

// ----------

CABLES.perSecondInterval = -1;
CABLES.perSecondCounterArr = [];

CABLES.perSecondCounter = function (title)
{
    this.title = title;
    this._count = 0;
    console.log(this.title + " PerSecondCounter started ");

    CABLES.perSecondCounterArr.push(this);

    if (CABLES.perSecondInterval == -1)
        CABLES.perSecondInterval = setInterval(CABLES.perSecondCounter.perSecondStats, 1000);
};

CABLES.perSecondCounter.perSecondStats = function ()
{
    for (let i = 0; i < CABLES.perSecondCounterArr.length; i++)
    {
        console.log(CABLES.perSecondCounterArr[i].title + ": " + CABLES.perSecondCounterArr[i]._count);
        CABLES.perSecondCounterArr[i]._count = 0;
    }
};

CABLES.perSecondCounter.prototype.count = function ()
{
    this._count++;
};
