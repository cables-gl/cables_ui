
var CABLES=CABLES || {};
CABLES.TL=CABLES.TL || {};

CABLES.TL.EASING_LINEAR=0;
CABLES.TL.EASING_ABSOLUTE=1;
CABLES.TL.EASING_SMOOTHSTEP=2;
CABLES.TL.EASING_SMOOTHERSTEP=3;

CABLES.TL.Key=function(obj)
{
    this.time=0.0;
    this.value=0.0;
    this.ui={};
    this.onChange=null;
    var easing=0;

    this.setValue=function(v)
    {
        this.value=v;
        if(this.onChange!==null)this.onChange();
    };

    this.set=function(obj)
    {
        if(obj)
        {
            if(obj.e)
                {
                    this.setEasing(obj.e);
                            console.log('YEAH ',obj.e);
                            
                }
                else this.setEasing(CABLES.TL.EASING_LINEAR);

            if(obj.t)this.time=obj.t;
                else if(obj.time) this.time=obj.time;
    
            if(obj.v)this.value=obj.v;
                else if(obj.value) this.value=obj.value;
        }
        if(this.onChange!==null)this.onChange();
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.t=this.time;
        obj.v=this.value;
        obj.e=easing;
        console.log('obj.e ',obj.e);
                
        return obj;
    };
    

    if("isUI" in this)
    {
        // this.initUI();
    }

    this.easeLinear=function(perc)
    {
        return perc;
    };

    this.easeAbsolute=function(perc)
    {
        return 0;
    };

    this.easeSmoothStep=function(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        return x*x*(3 - 2*x); // smoothstep
    };

    this.easeSmootherStep=function(perc)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        return x*x*x*(x*(x*6 - 15) + 10); // smootherstep
    };

    this.setEasing=function(e)
    {
        easing=e;

        if(easing==CABLES.TL.EASING_ABSOLUTE) this.ease=this.easeAbsolute;
        else if(easing==CABLES.TL.EASING_SMOOTHSTEP) this.ease=this.easeSmoothStep;
        else if(easing==CABLES.TL.EASING_SMOOTHERSTEP) this.ease=this.easeSmootherStep;
        else
        {
            easing=CABLES.TL.EASING_LINEAR;
            this.ease=this.easeLinear;
        }
    };

    this.setEasing(CABLES.TL.EASING_LINEAR);
    this.set(obj);


};

CABLES.TL.Anim=function(cfg)
{
    this.keys=[];
    this.onChange=null;
    this.stayInTimeline=false;

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
            this.keys.push(new CABLES.TL.Key({time:time,value:value})) ;
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

        if(time<this.keys[0].time)return this.keys[0].value;

        var index=this.getKeyIndex(time);
        if(index>=this.keys.length-1)return this.keys[this.keys.length-1].value;
        var index2=parseInt(index,10)+1;
        var key1=this.keys[index];
        var key2=this.keys[index2];

        if(!key2)return -1;

        var perc=(time-key1.time)/(key2.time-key1.time);
        perc=key1.ease(perc);

        return parseFloat(key1.value)+ parseFloat((key2.value - key1.value)) * perc;
    };

    this.addKey=function(k)
    {
        if(k.time===undefined)
        {
            console.log('key time undefined, ignoreing!');
        }
        else
        {
            this.keys.push(k);
        }
    };
};


