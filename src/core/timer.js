
function Timer()
{
    var self=this;
    var timeStart=Date.now();
    var timeOffset=0;

    var currentTime=0;
    var lastTime=0;
    var paused=true;
    var delay=0;
    this.overwriteTime=-1;

    function getTime()
    {

        lastTime=(Date.now()-timeStart)/1000;
        return lastTime+timeOffset;
    }

    this.setDelay=function(d)
    {
        delay=d;
    };

    this.isPlaying=function()
    {
        return !paused;
    };

    this.update=function()
    {
        if(paused) return;
        currentTime=getTime();

        return currentTime;
    };

    this.getTime=function()
    {
        if(this.overwriteTime>=0)return this.overwriteTime-delay;
        return currentTime-delay;
    };

    this.togglePlay=function()
    {
        if(paused) self.play();
            else self.pause();
    };

    this.setTime=function(t)
    {
        if(t<0)t=0;
        timeStart=Date.now();
        timeOffset=t;
        currentTime=t;
    };

    this.setOffset=function(val)
    {
        if(currentTime+val<0)
        {
            timeStart=Date.now();
            timeOffset=0;
            currentTime=0;
        }
        else
        {
            timeOffset+=val;
            currentTime=lastTime+timeOffset;
        }
    };

    this.play=function()
    {
        timeStart=Date.now();
        paused=false;
    };

    this.pause=function()
    {
        timeOffset=currentTime;
        paused=true;
    };

}