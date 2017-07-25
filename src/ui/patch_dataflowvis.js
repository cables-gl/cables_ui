

CABLES.UI.Patch.prototype.flowvis=-1;

CABLES.UI.Patch.prototype.toggleFlowVis=function()
{
    if(this.flowvis==-1)
    {
        console.log('start');
        this.startflowVis();
    }
    else
    {
        console.log('stop');
        clearInterval(this.flowvis);
        this.stopFlowVis();
        this.flowvis=-1;
    }
};

CABLES.UI.Patch.prototype.stopFlowVis=function()
{
    for(var i=0;i<this.ops.length;i++)
    {
        for(var j=0;j<this.ops[i].links.length;j++)
        {
            if(this.ops[i].links[j] && this.ops[i].links[j].linkLine )
            {
                var link=this.ops[i].links[j].p2.thePort.getLinkTo( this.ops[i].links[j].p1.thePort );
                if(!link) link=this.ops[i].links[j].p1.thePort.getLinkTo( this.ops[i].links[j].p2.thePort );

                if(link)
                {
                    this.ops[i].links[j].linkLine.node.classList.remove( this.ops[i].links[j].linkLine.speedClass);
                    this.ops[i].links[j].linkLine.speedClass='nospeed';
                }
            }
        }
    }
};



CABLES.UI.Patch.prototype.startflowVis=function()
{

    var speedCycle=true;
    this.flowvis=setInterval(function()
    {
        speedCycle=!speedCycle;

        function setClass(link)
        {
        }

        var count=0;
        var countInvalid=0;

        for(var i=0;i<this.ops.length;i++)
        {
            // this.ops[i].removeDeadLinks();

            for(var j=0;j<this.ops[i].links.length;j++)
            {
                if(this.ops[i].links[j] && this.ops[i].links[j].linkLine )
                {
                    // var link=this.ops[i].links[j];
                    var link=this.ops[i].links[j].p2.thePort.getLinkTo( this.ops[i].links[j].p1.thePort );
                    if(!link) link=this.ops[i].links[j].p1.thePort.getLinkTo( this.ops[i].links[j].p2.thePort );

                    if(link)
                    {
                        // if(!link.lastVis || CABLES.now()-link.lastVis>200)
                        if(link.speedCycle!=speedCycle)
                        {

                            count++;

                            link.speedCycle=speedCycle;

                            var newClass="pathSpeed0";
                            if(link.activityCounter>=1)
                            {
                                newClass="pathSpeed1";
                            }
                            if(link.activityCounter>=6) newClass="pathSpeed3";
                            if(link.activityCounter>=20) newClass="pathSpeed4";

                            if(this.ops[i].links[j].linkLine.speedClass!=newClass)
                            {
                                this.ops[i].links[j].linkLine.node.classList.remove( this.ops[i].links[j].linkLine.speedClass);
                                this.ops[i].links[j].linkLine.speedClass=newClass;
                                this.ops[i].links[j].linkLine.node.classList.add(newClass);
                            }
                            link.activityCounter=0;
                            link.lastVis=CABLES.now();
                        }

                    }
                    else
                    {
                        countInvalid++;

                    }

                }
                else {
                }
            }
        }

        // console.log('links',count,countInvalid);


    }.bind(this),200);

};
