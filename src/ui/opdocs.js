
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var self=this;
    var opDocs=[];
    this.layoutPaper=null;
    this.libs=[];

    CABLES.api.get(
        CABLES.noCacheUrl('doc/ops/all'),
        function(res)
        {
            logStartup('Op docs loaded');
            opDocs=res.opDocs;
            self.libs=res.libs;
        },
        function(res){ console.log('err',res); }
        );

    this.getSummary=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].summary||'';

        return 0;
    };

	this.getAll=function()
	{
		return opDocs;
	};

    this.opLayoutSVG=function(opname,elementId)
    {
        if(this.layoutPaper)this.layoutPaper.clear();

        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==opname)
            {
                if(!opDocs[i].layout) return;

                var p = Raphael(document.getElementById(elementId), 150, 40);

                var bg=p.rect(0,0,150,50);
                bg.attr("fill","#333");

				if(opDocs[i].layout.portsIn)
	                for(var j=0;j<opDocs[i].layout.portsIn.length;j++)
	                {
	                    var port=p.rect(j*14,0,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    // port.attr("fill","#f00");
	                    port.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsIn[j].type));
	                }

				if(opDocs[i].layout.portsOut)
	                for(var j=0;j<opDocs[i].layout.portsOut.length;j++)
	                {
	                    var port=p.rect(j*14,40-7,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    // port.attr("fill","#f00");
	                    port.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsOut[j].type));
	                }

                this.layoutPaper=p;
                return;
            }
        }


    };

    this.getPopularity=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].pop;

        return 0;
    };

    this.getAttachmentFiles=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].attachmentFiles||[];
        return [];
    };

    this.get=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
                return opDocs[i].content;

        return '';
    };

    this.getSuggestions=function(objName,portName)
    {
        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==objName)
            {
                if(opDocs[i].portSuggestions && opDocs[i].portSuggestions[portName])
                {
                    var suggestions=opDocs[i].portSuggestions[portName].ops;
                    return suggestions;
                }
            }
        }
    };



};
