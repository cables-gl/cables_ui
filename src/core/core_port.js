var PORT_DIR_IN=0;
var PORT_DIR_OUT=1;

var CABLES=CABLES || {};

CABLES.Port=function(parent,name,type,uiAttribs)
{
    var self=this;
    this.direction=PORT_DIR_IN;
    this.id=generateUUID();
    this.parent=parent;
    this.links=[];
    this.value=0.0;
    this.name=name;
    this.type=type || OP_PORT_TYPE_VALUE;
    this.uiAttribs=uiAttribs || {};
    var valueBeforeLink=null;
    this.anim=null;
    var animated=false;
    var oldAnimVal=-5711;
    this.onLink=null;
    this.showPreview=false;
    var uiActiveState=true;
    this.ignoreValueSerialize=false;
    this.onLinkChanged=null;
    this.crashed=true;

    this.doShowPreview=function(onOff)
    {
        if(onOff!=self.showPreview)
        {
            self.showPreview=onOff;
            self.onPreviewChanged();
        }
    };

    this.onPreviewChanged=function(){};
    this.shouldLink=function(){return true;};


    this.get=function()
    {
        if(animated)
        {
            this.value=self.anim.getValue(parent.patch.timer.getTime());
// console.log('animated!');
            // if(oldAnimVal!=this.value)
            {
                oldAnimVal=this.value;

                if(onValueChanged)
                {
                    onValueChanged();
                }
                else
                if(this.onValueChanged)
                {
                    // deprecated!
                    this.onValueChanged();
                }

                // console.log('changed!!');
                // this.onValueChanged();
            }
            // console.log('this.value ',this.value );

            // return this.value;
        }

        return this.value;
    };

    this.set=function(v)
    {
        this.setValue(v);
    };

    this.__defineGetter__("val", function()
        {
            // throw "deprecated val";



            return this.get();
        });
    this.__defineSetter__("val", function(v){ this.setValue(v); });

    this.getType=function(){ return this.type; };
    this.isLinked=function(){ return this.links.length>0; };

    this.onValueChanged=null; // deprecated!
    var onValueChanged=null;
    this.onTriggered=null;
    this._onTriggered=function()
    {
        parent.updateAnims();
        if(parent.enabled && self.onTriggered) self.onTriggered();
    };

    this.onValueChange=function(cb)
    {
        // onValueChanged=cb;
        onValueChanged=cb.bind(this.parent);
    };

    this.setValue=function(v)
    {
        if(parent.enabled)
        {
            if(v!=this.value || this.type==OP_PORT_TYPE_TEXTURE)
            {
                if(animated)
                {
                    self.anim.setValue(parent.patch.timer.getTime(),v);
                }
                else
                {
                    try
                    {
                        this.value=v;
                        if(onValueChanged)
                        {
                            onValueChanged();
                        }
                        else
                        if(this.onValueChanged)
                        {
                            // deprecated!
                            this.onValueChanged();
                        }
                    }
                    catch(ex)
                    {
                        this.crashed=true;
                        this.setValue=function(v){};
                        this.onTriggered=function(){};
                        console.log('exception!');
                        console.log('onvaluechanged exception cought',ex);
                        console.log('exception in: '+parent.name);
                    }
                }

                for (var i = 0; i < this.links.length; ++i)
                {
                    this.links[i].setValue();
                }
            }
        }
    };

    this.updateAnim=function()
    {
        if(animated)
        {
            this.value=self.anim.getValue(parent.patch.timer.getTime());

            if(oldAnimVal!=this.value)
            {
                oldAnimVal=this.value;
                if(this.onValueChanged)this.onValueChanged();
            }
            oldAnimVal=this.value;
        }
    };

    this.isAnimated=function()
    {
        return animated;
    };

    this.getUiActiveState=function()
    {
        return uiActiveState;
    };
    this.setUiActiveState=function(onoff)
    {
        uiActiveState=onoff;
        if(this.onUiActiveStateChange)this.onUiActiveStateChange();
    };

    this.onUiActiveStateChange=null;

    this.onAnimToggle=function(){};
    this._onAnimToggle=function(){this.onAnimToggle();};

    this.setAnimated=function(a)
    {
        if(animated!=a)
        {
            animated=a;
            if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
            this._onAnimToggle();
        }
    };

    this.toggleAnim=function(val)
    {
        animated=!animated;
        if(animated && !self.anim)self.anim=new CABLES.TL.Anim();
        self.setAnimated(animated);
        this._onAnimToggle();
    };

    this.getName= function()
    {
        return this.name;
    };

    this.addLink=function(l)
    {
        if(this.onLinkChanged)this.onLinkChanged();
        valueBeforeLink=self.value;
        this.links.push(l);
    };

    this.removeLinkTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)
                this.links[i].remove();
    };

    this.isLinkedTo=function(p2)
    {
        for(var i in this.links)
            if(this.links[i].portIn==p2 || this.links[i].portOut==p2)return true;

        return false;
    };

    this.trigger=function()
    {
        if(!parent.enabled)return;
        if(this.links.length===0)return;

        try
        {
            for (var i = 0; i < this.links.length; ++i)
            // for(var i in this.links)
            {
                // if(this.direction==PORT_DIR_OUT)this.links[i].portIn._onTriggered();
                // else
                this.links[i].portIn._onTriggered();
                // if(this.links[i].portIn !=this)
                // else if(this.links[i].portOut!=this)
            }
        }
        catch(ex)
        {
            console.error('ontriggered exception caught: op:'+this.parent.name+' port:'+this.name,ex);

        }
    };

    this.call=function()
    {
        console.log('call deprecated - use trigger() ');
        this.trigger();
    };

    this.execute=function()
    {
        console.log('### execute port: '+this.getName() , this.goals.length);
    };

    this.getTypeString=function()
    {
        if(this.type==OP_PORT_TYPE_VALUE)return 'value';
        if(this.type==OP_PORT_TYPE_FUNCTION)return 'function';
        if(this.type==OP_PORT_TYPE_TEXTURE)return 'texture';
    };

    this.getSerialized=function()
    {
        var obj={};
        obj.name=this.getName();

        if(!this.ignoreValueSerialize) obj.value=this.value;
            // else console.log('ja hier nicht speichern....');

        if(animated) obj.animated=true;
        if(this.anim) obj.anim=this.anim.getSerialized();

        if(this.direction==PORT_DIR_IN && this.links.length>0)
        {
            obj.links=[];
            for(var i in this.links)
            {
                obj.links.push( this.links[i].getSerialized() );
            }
        }
        return obj;
    };

    this.removeLinks=function()
    {
        while(this.links.length>0)
            this.links[0].remove();
    };

    this.removeLink=function(link)
    {
        if(this.onLinkChanged)this.onLinkChanged();

        for(var i in this.links)
            if(this.links[i]==link)this.links.splice( i, 1 );

        self.setValue(valueBeforeLink);
    };
};


var Port = CABLES.Port; // TODO deprecated.. remove one day...
