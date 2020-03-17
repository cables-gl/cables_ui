
var CABLES=CABLES||{};

CABLES.UI.OpHistory=class
{
    constructor()
    {
        this._history=[];
        this._position=this._history.length-1;
    }

    push(opid)
    {
        if(this._history[this._position]==opid)return;
        if(this._position!=this._history.length-1)this._history.length=this._position;

        this._history.push(opid);
        this._position=this._history.length-1;
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

        gui.patch().focusOp(opid,true);
        gui.patch().setSelectedOpById(opid);
    }

    forward()
    {
        if(this._position+1>this._history.length-1)return;
        this._position++;
        
        this._focusCurrent();
    }
}

