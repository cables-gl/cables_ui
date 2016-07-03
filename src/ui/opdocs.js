
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var opDocs=[];

    CABLES.api.get(
        'doc/ops/all',
        function(res)
        {
            logStartup('Op docs loaded');

            opDocs=res;
        },
        function(res){ console.log('err',res); }
        );

    this.getPopularity=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].pop;

        return 0;
    };

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

    this.getSuggestions=function(objName,portName)
    {
        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==objName)
            {
                if(opDocs[i].portSuggestions && opDocs[i].portSuggestions[portName])
                {
                    var suggestions=opDocs[i].portSuggestions[portName].ops;
                    return suggestions;
                }
            }
        }
    };


};
