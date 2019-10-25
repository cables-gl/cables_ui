
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};

CABLES.UI.KeyManager=class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._keys=[];

        this.key("a","A key","down","glcanvas",{},()=>
        {
            console.log("A WAS PRESSED!!!");
        });


        
        document.addEventListener("keydown", this._onKeyDown.bind(this), false);

    }


    _onKeyDown(e)
    {
        console.log("checking keys ",this._keys.length);
        for(var i=0;i<this._keys.length;i++)
        {
            const k=this._keys[i];

            console.log(i, e.key,k.key);
            
            if(k.key!=e.key)continue;
            
            console.log(e.key,k.key,e.target.id,k.target);

            if(!k.target || k.target==e.target.id)
            {
                // console.log("found key! ",k.target);
                if(k.cb)k.cb();
                else
                {
                    console.warn("[keys] key event has no callback");
                }
                return;
            }
        }

    }

    key(key,title,event,target,options,cb)
    {

        var k=
        {
            "key":key,
            "title":title,
            "target":target,
            "options":options,
            "cb":cb,
        };

        this._keys.push(k);

        // if(!target || target=="all")
        // {
        //     document.addEventListener("keydown", this._onKeyDown.bind(this), false);
        // }
        // document.getElementById(glcanvas)
        
        // document.addEventListener("keyup", onKeyUp, false);
        console.log("add key",key,this._keys.length)
    }
    
}