
var CABLES=CABLES || {};
CABLES.TL=CABLES.TL || {};


CABLES.TL.Key=function(obj)
{
    this.time=0.0;
    this.value=0.0;

    this.ui={};


    this.onChange=null;
    this.set=function(obj)
    {
        if(obj)
        {
            this.time=obj.time;
            this.value=obj.value;
        }
        if(this.onChange!==null)this.onChange();

    };
    
    this.set(obj);

    if(obj.paper && "isUI" in this)
    {
        this.initUI(obj.paper);
    }



};

CABLES.TL.TimeLine=function()
{
    this.keys=[];


    this.getKeyIndex=function(time)
    {
        var theKey=0;
        for(var i in this.keys)
        {
            if(time >= this.keys[i].time) theKey=i;
            if( this.keys[i].time > time ) return theKey;
        }
        return theKey;
    };

    this.getValue=function(time)
    {

    };

};


