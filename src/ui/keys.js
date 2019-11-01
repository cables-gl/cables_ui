
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};

CABLES.UI.KeyManager=class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._keys=[];

        document.addEventListener("keydown", this._onKeyDown.bind(this), false);
    }

    show()
    {
        this._tab=new CABLES.UI.Tab("keyboard shortcuts",{"icon":"help","infotext":"tab_keys","padding":true});
        gui.mainTabs.addTab(this._tab,true);

        var k=JSON.parse(JSON.stringify(this._keys));

        k.sort(function(a,b)
        {
            return a.key.localeCompare(b.key);
        });

        k.sort(function(a,b)
        {
            if(!a.target)a.target="global";
            if(!b.target)b.target="global";
            return a.target.localeCompare(b.target);
        });

        var lastTarget='';
        for(var i=0;i<k.length;i++)
        {
            if(k[i].target!=lastTarget) k[i].group=k[i].target;
            lastTarget=k[i].target;

            if(k[i].key==" ")k[i].key="Space";
        }

        var html = CABLES.UI.getHandleBarHtml('tab_keys',{keys:k});
        this._tab.html(html);

        gui.maintabPanel.show();
    }

    _onKeyDown(e)
    {
        // console.log(document.activeElement.tagName);

        for(var i=0;i<this._keys.length;i++)
        {
            const k=this._keys[i];

            if(!k.options.ignoreInput && document.activeElement && (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA"))continue;

            if(k.key!=(e.key+"").toLowerCase() || k.event!="down") continue;
            
            if(k.options.cmdCtrl) if(!e.ctrlKey && !e.metaKey) continue;
            if(!k.options.cmdCtrl) if(e.ctrlKey || e.metaKey) continue;

            if(k.options.shiftKey && !e.shiftKey) continue;
            if(!k.options.shiftKey && e.shiftKey) continue;

            if(!k.target || k.target==e.target.id)
            {
                // console.log("found key! ",k.target);
                if(k.cb)k.cb(e);
                else console.warn("[keys] key event has no callback",k);

                e.preventDefault();

                return;
            }
        }
    }

    key(key,title,event,target,options,cb)
    {
        var k=
        {
            "key":key.toLowerCase(),
            "title":title,
            "event":event,
            "target":target,
            "options":options,
            "cb":cb,
        };

        this._keys.push(k);
    }

}