CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Profiler=function(projectId)
{
    var colors=["#7AC4E0","#D183BF","#9091D6","#FFC395","#F0D165","#63A8E8","#CF5D9D","#66C984","#D66AA6","#515151"];

    var intervalId=null;

    this.show=function()
    {
        var html = CABLES.UI.getHandleBarHtml('params_profiler',{});
        $('#options').html(html);
    };

    var lastPortTriggers=0;

    this.update=function()
    {
        var profiler=gui.patch().scene.profiler;
        var items=profiler.getItems();
        var html='';
        var htmlBar='';
        var allTimes=0;
        var i=0;
        var sortedItems = [];

        var htmlData='';

        for(i in items)
        {
            allTimes+=items[i].timeUsed;
            sortedItems.push(items[i]);
        }

        var allPortTriggers=0;
        for(i in items)
        {
            items[i].percent=Math.round(items[i].timeUsed/allTimes*100);
            allPortTriggers+=items[i].numTriggers;

        }
        var colorCounter=0;

        if(allPortTriggers-lastPortTriggers>0) htmlData='port triggers/s: '+(allPortTriggers-lastPortTriggers);
        lastPortTriggers=allPortTriggers;

        sortedItems.sort(function(a, b) {return b.percent - a.percent; });



$('#profilerdata').html(htmlData);

        for(i in sortedItems)
        {
            var item=sortedItems[i];
            html+=item.percent+'% / '+item.title+': '+item.numTriggers+' / '+Math.round(item.timeUsed)+'ms <br/>';

            if(item.percent>0)
            {
                htmlBar+='<div class="tt" data-tt="'+item.title+'" style="height:20px;background-color:'+colors[colorCounter]+';float:left;padding:0px;overflow:hidden;width:'+item.percent*2+'px"></div>';
                colorCounter++;
                if(colorCounter>colors.length-1)colorCounter=0;
            }
        }

        $('#profilerlist').html(html);
        $('#profilerbar').html(htmlBar);

    };


    this.start=function()
    {
        gui.patch().scene.profile(true);
        if(!intervalId) intervalId=setInterval(this.update,1000);
    };

};
