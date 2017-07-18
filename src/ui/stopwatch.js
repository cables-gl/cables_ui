
CABLES.StopWatch=function(title)
{
	this.title=title;
	this.startTime=CABLES.now();
	console.log(this.title+" Stopwatch started ");
};

CABLES.StopWatch.prototype.stop=function(title)
{
	var timeUsed=CABLES.now()-this.startTime;
	timeUsed=''+(Math.round(timeUsed)/100)*100+'ms';
	console.log(this.title+" "+timeUsed+" "+title);
};
