
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var opDocs=[];

    CABLES.api.get(
        'doc/ops/all',
        function(res)
        {
            console.log('loaded '+res.length+' op docs.');
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
