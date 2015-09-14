
var CABLES=CABLES || {};
CABLES.TL=CABLES.TL || {};

CABLES.TL.EASING_LINEAR=0;
CABLES.TL.EASING_ABSOLUTE=1;
CABLES.TL.EASING_SMOOTHSTEP=2;
CABLES.TL.EASING_SMOOTHERSTEP=3;
CABLES.TL.EASING_BEZIER=4;

CABLES.TL.Key=function(obj)
{
    this.time=0.0;
    this.value=0.0;
    this.ui={};
    this.onChange=null;
    var easing=0;
    this.bezTime=0.5;
    this.bezValue=0;
    this.bezTimeIn=-0.5;
    this.bezValueIn=0;
    var bezierAnim=null;
    var updateBezier=false;
    var self=this;

    this.setBezierControlOut=function(t,v)
    {
        this.bezTime=t;
        this.bezValue=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.setBezierControlIn=function(t,v)
    {
        this.bezTimeIn=t;
        this.bezValueIn=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.setValue=function(v)
    {
        this.value=v;
        updateBezier=true;
        if(this.onChange!==null)this.onChange();
    };

    this.set=function(obj)
    {
        if(obj)
        {
            if(obj.e) this.setEasing(obj.e);

            if(obj.b)
            {
                this.bezTime=obj.b[0];
                this.bezValue=obj.b[1];
                this.bezTimeIn=obj.b[2];
                this.bezValueIn=obj.b[3];
                updateBezier=true;
            }

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
        if(easing==CABLES.TL.EASING_BEZIER)
            obj.b=[this.bezTime,this.bezValue,this.bezTimeIn,this.bezValueIn];
                
        return obj;
    };
    

    if("isUI" in this)
    {
        // this.initUI();
    }

    function linear(perc,key1,key2)
    {
        return parseFloat(key1.value)+ parseFloat((key2.value - key1.value)) * perc;
    }

    this.easeLinear=function(perc,key2)
    {
        return linear(perc,this,key2);
    };

    this.easeAbsolute=function(perc,key2)
    {
        return this.value;
    };

    this.easeSmoothStep=function(perc,key2)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*(3 - 2*x); // smoothstep
        return linear(perc,this,key2);
    };

    this.easeSmootherStep=function(perc,key2)
    {
        var x = Math.max(0, Math.min(1, (perc-0)/(1-0)));
        perc= x*x*x*(x*(x*6 - 15) + 10); // smootherstep
        return linear(perc,this,key2);
    };

    BezierB1=function(t) { return t*t*t; };
    BezierB2=function(t) { return 3*t*t*(1-t); };
    BezierB3=function(t) { return 3*t*(1-t)*(1-t); };
    BezierB4=function(t) { return (1-t)*(1-t)*(1-t); };
    Bezier =function(percent,nextKey)
    {
        var val1x=nextKey.time;
        var val1y=nextKey.value;

        var c1x=nextKey.time+nextKey.bezTimeIn;
        var c1y=nextKey.value-nextKey.bezValueIn;

        var val2x=self.time;
        var val2y=self.value;

        var c2x=self.time+self.bezTime;
        var c2y=self.value-self.bezValue;

        var x = val1x*BezierB1(percent) + c1x*BezierB2(percent) + val2x*BezierB3(percent) + c2x*BezierB4(percent);
        var y = val1y*BezierB1(percent) + c1y*BezierB2(percent) + val2y*BezierB3(percent) + c2y*BezierB4(percent);

        return {x:x,y:y};
    };



    this.easeBezier=function(percent,nextKey)
    {
        if(!bezierAnim)
        {
            bezierAnim=new CABLES.TL.Anim();
            updateBezier=true;
        }

        var timeSpan=nextKey.time-self.time;
        // if(updateBezier)
        {
            bezierAnim.clear();
            // console.log('updateBezier');

            var steps=20;
            var is=1/steps;
            
            for(var i=0;i<steps;i++)
            {
                var v=Bezier(i*is,nextKey);

                // console.log('v',v);

                var time=self.time+timeSpan/steps*i;
        

        // console.log('v.x');
        
                bezierAnim.setValue(v.x,v.y);
                        
                
                // console.log('key ',time,v.y);
            }
            updateBezier=false;
        }


        return bezierAnim.getValue(self.time+percent*timeSpan);
    };

    this.getEasing=function()
    {
        return easing;
    };

    this.setEasing=function(e)
    {
        easing=e;

        if(easing==CABLES.TL.EASING_ABSOLUTE) this.ease=this.easeAbsolute;
        else if(easing==CABLES.TL.EASING_SMOOTHSTEP) this.ease=this.easeSmoothStep;
        else if(easing==CABLES.TL.EASING_SMOOTHERSTEP) this.ease=this.easeSmootherStep;
        else if(easing==CABLES.TL.EASING_BEZIER)
            {
                updateBezier=true;
                this.ease=this.easeBezier;
            }
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

    this.clear=function()
    {
        this.keys.length=0;
    };

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
        return key1.ease(perc,key2);
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


