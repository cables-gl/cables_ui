CABLES.UI.ValueSmoother=class
{
    constructor(v,dv)
    {
        this._goal=v;
        this._divisor=dv||4;
        this._value=v;
        this._oldVal=v;
        this._lastTrigger=0;
    }

    set(v)
    {
        this._goal=v;
    }

    get value()
    {
        return this._value;
    }

    update()
    {
        var tm=1;
        if(CABLES.now()-this._lastTrigger>500 || this._lastTrigger===0)this._value=this._goal;
        else tm=(CABLES.now()-this._lastTrigger)/16;
        this._lastTrigger=CABLES.now();

        if(this._divisor<=0)this._divisor=0.0001;

        var diff = this._goal-this._value;

        this._value=this._value+(this._goal-this._value)/(this._divisor*tm);

        if(this._value>0 && this._value<0.000000001)this._value=0;
        if(this._divisor!=this._divisor)this._value=0;
        if(this._value!=this._value|| this._value== -Infinity || this._value==Infinity)this._value=this._goal;

        if(this._oldVal!=this._value)
        {
            this._oldVal=this._value;
        }

    }
}