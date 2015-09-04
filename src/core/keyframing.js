
var CABLES=CABLES || {};
CABLES.TL=CABLES.TL || {};

CABLES.TL.Key=function(obj)
{
    this.time=0.0;
    this.value=0.0;
    this.ui={};
    this.onChange=null;

    this.setValue=function(v)
    {
        this.value=v;
        if(this.onChange!==null)this.onChange();
    };

    this.set=function(obj)
    {
        if(obj)
        {
            this.time=obj.time;
            this.value=obj.value;
        }
        if(this.onChange!==null)this.onChange();
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.t=this.time;
        obj.v=this.value;
        return obj;
    };
    
    this.set(obj);

    if("isUI" in this)
    {
        this.initUI();
    }

};

CABLES.TL.Anim=function(cfg)
{
    this.keys=[];
    this.onChange=null;

    this.sortKeys=function()
    {
        this.keys.sort(function(a, b)
        {
            return parseFloat(a.time) - parseFloat(b.time);
        });
    };

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
    this.setValue=function(time,value)
    {
        var found=false;
        for(var i in this.keys)
        {
            if(this.keys[i].time==time)
            {
                found=this.keys[i];
                this.keys[i].setValue(value);
                break;
            }
        }

        if(!found)
        {
            this.keys.push(new CABLES.TL.Key({time:time,value:value,paper:this.paper})) ;
        }

        if(this.onChange)this.onChange();
        this.sortKeys();

                
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.keys=[];

        for(var i in this.keys)
        {
            obj.keys.push( this.keys[i].getSerialized() );
        }

        return obj;
    };

    this.getValue=function(time)
    {
        if(this.keys.length===0)return 0;

        var index=this.getKeyIndex(time);
        if(index>=this.keys.length-1)return this.keys[this.keys.length-1].value;
        var index2=parseInt(index,10)+1;
        var key1=this.keys[index];
        var key2=this.keys[index2];

        if(!key2)return -1;

        var perc=(time-key1.time)/(key2.time-key1.time);
        return parseFloat(key1.value)+ parseFloat((key2.value - key1.value)) * perc;
    };
};


