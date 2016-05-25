
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var opDocs=[];

    CABLES.api.get(
        'doc/ops/all',
        function(res)
        {
            // console.log('loaded '+res.length+' op docs.');
            var timeUsed=Math.round((performance.now()-CABLES.uiLoadStart)/1000*100)/100;
            console.log(timeUsed+"s loaded op docs");


            opDocs=res;
        },
        function(res){ console.log('err',res); }
        );


    this.get=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==opname)
            {
                return opDocs[i].content;
            }
        }

        return '';
    };

};
