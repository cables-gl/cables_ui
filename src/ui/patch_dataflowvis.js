CABLES.UI.Patch.prototype.flowvis=false;
CABLES.UI.Patch.prototype.flowvisStartFrame=0;
CABLES.UI.speedCycle=true;

CABLES.UI.Patch.prototype.toggleFlowVis=function()
{
    if(!this.flowvis)
    {
        CABLES.UI.Patch.prototype.flowvisStartFrame=0;
        this.startflowVis();
        this.flowvis=true;
    }
    else
    {
        this.stopFlowVis();
        this.flowvis=false;
    }
};

CABLES.UI.Patch.prototype.stopFlowVis=function()
{
    this.scene.removeOnAnimCallback(this.updateFlowVis);

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

CABLES.UI.Patch.prototype.updateFlowVis=function(time,frame)
{
    if(CABLES.UI.Patch.prototype.flowvisStartFrame==0)CABLES.UI.Patch.prototype.flowvisStartFrame=frame;
    if(frame-CABLES.UI.Patch.prototype.flowvisStartFrame<5)return;
    if(frame%5!=0) return;

    CABLES.UI.speedCycle=!CABLES.UI.speedCycle;

    var count=0;
    var countInvalid=0;
    var patch=gui.patch();

    for(var i=0;i<patch.ops.length;i++)
    {
        for(var j=0;j<patch.ops[i].links.length;j++)
        {
            if(patch.ops[i].links[j] && patch.ops[i].links[j].linkLine )
            {
                var link=patch.ops[i].links[j].p2.thePort.getLinkTo( patch.ops[i].links[j].p1.thePort );
                if(!link) link=patch.ops[i].links[j].p1.thePort.getLinkTo( patch.ops[i].links[j].p2.thePort );

                if(link)
                {
                    if(link.CABLES.UI.speedCycle!=CABLES.UI.speedCycle)
                    {
                        count++;

                        link.CABLES.UI.speedCycle=CABLES.UI.speedCycle;

                        var newClass="pathSpeed0";
                        if(link.activityCounter>=1)
                        {
                            newClass="pathSpeed1";
                        }
                        if(link.activityCounter>=5) newClass="pathSpeed2";
                        if(link.activityCounter>=10) newClass="pathSpeed3";
                        if(link.activityCounter>=20) newClass="pathSpeed4";

                        if(patch.ops[i].links[j].linkLine.speedClass!=newClass)
                        {
                            patch.ops[i].links[j].linkLine.node.classList.remove( patch.ops[i].links[j].linkLine.speedClass);
                            patch.ops[i].links[j].linkLine.speedClass=newClass;
                            patch.ops[i].links[j].linkLine.node.classList.add(newClass);
                        }
                        link.activityCounter=0;
                    }
                }
                else
                {
                    countInvalid++;
                }
            }
        }
    }
};

CABLES.UI.Patch.prototype.startflowVis=function()
{
    for(var i=0;i<this.ops.length;i++)
    {
        for(var j=0;j<this.ops[i].links.length;j++)
        {
            if(this.ops[i].links[j] && this.ops[i].links[j].linkLine )
            {
                var link=this.ops[i].links[j].p2.thePort.getLinkTo( this.ops[i].links[j].p1.thePort );
                if(!link) link=this.ops[i].links[j].p1.thePort.getLinkTo( this.ops[i].links[j].p2.thePort );
                if(link) link.activityCounter=0;
            }
        }
    }

    this.scene.removeOnAnimCallback(this.updateFlowVis);
    this.scene.addOnAnimFrameCallback(this.updateFlowVis);
};
