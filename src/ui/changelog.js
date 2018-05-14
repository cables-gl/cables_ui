
var CABLES=CABLES||{};
CABLES.CHANGELOG={};

CABLES.CHANGELOG.getHtml=function(cb,since)
{
    CABLES.api.get('changelog',function(obj)
    {
        if(since)
        {
            for(var i=0;i<obj.items.length;i++)
            {
                if(obj.items[i].date<since)obj.items.length=i;
            }
            obj.onlyLatest=true;
        }

        var firstTime=false;

        if(!CABLES.UI.userSettings.get('changelogLastView'))
        {
            firstTime=true;
            console.log('first time changelog!');
        }

        CABLES.UI.userSettings.set('changelogLastView',obj.ts);

        if(obj.items.length===0)
        {
            cb(null);
            return;
        }
        // var html = CABLES.UI.getHandleBarHtml('changelog',obj);

        if(firstTime)
        {
            cb(null);
            return;
        }
        cb();
    });

};

CABLES.CHANGELOG.show=function(since)
{
    CABLES.CHANGELOG.getHtml(function()
    {
        console.log("HALLO");
        var win = window.open('https://cables.gl/changelog', '_blank');

        // CABLES.UI.MODAL.show(html,{title:'',nopadding:true});
    },since);

};
