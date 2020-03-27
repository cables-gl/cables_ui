
var CABLES=CABLES||{};

CABLES.UI.OpHistory=class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._history=[];
        this._position=this._history.length-1;

    }

    push(opid)
    {
        if(this._history[this._position]==opid)return;
        if(this._position!=this._history.length-1)this._history.length=this._position;

        this._history.push(opid);
        this._position=this._history.length-1;

        this.emitEvent("changed");
    }

    back()
    {
        this._position--;
        var opid= this._history[this._position];

        if(gui.patch().isCurrentOpId(opid))
        {
            this._position--;
            opid= this._history[this._position];
        }
        this._focusCurrent();
    }

    _focusCurrent()
    {
        const opid= this._history[this._position];

        if(!gui.keys.shiftKey) gui.patch().focusOp(opid,true); else gui.patch().setSelectedOpById(opid);
    }

    forward()
    {
        if(this._position+1>this._history.length-1)return;
        this._position++;
        
        this._focusCurrent();
    }

    getAsArray(max)
    {
        if(max===undefined)max=9999;
        var h=[];

        var start=Math.max(0,this._history.length-max);
        var end=this._history.length-1;
        
console.log(start,end);

        for(var i=end;i>=start;i--)
        {
            const idx=i;
            var o=
                {
                    id:this._history[idx],
                    title:gui.patch().scene.getOpById(this._history[idx]).uiAttribs.title
                };
            h.push(o);
        }
        return h;
    }
}

