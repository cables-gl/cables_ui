
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var self=this;
    var opDocs=[];
    this.layoutPaper=null;
    this.libs=[];

    console.log('op docs');

    CABLES.api.get(
        CABLES.noCacheUrl(CABLES.sandbox.getUrlDocOpsAll()),
        function(res)
        {
            logStartup('Op docs loaded');
            
            console.log('op docs response');

            if(window.process && window.process.versions['electron'])  res=JSON.parse(res);
            
            opDocs=res.opDocs;
            self.libs=res.libs;
            gui.opSelect().prepare();
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
                var j=0;

                if(opDocs[i].layout.portsIn)
	                for(j=0;j<opDocs[i].layout.portsIn.length;j++)
	                {
	                    var portIn=p.rect(j*14,0,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    portIn.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsIn[j].type));
	                }

                if(opDocs[i].layout.portsOut)
	                for(j=0;j<opDocs[i].layout.portsOut.length;j++)
	                {
	                    var portOut=p.rect(j*14,40-7,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    portOut.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsOut[j].type));
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


    this.getPortDoc=function(op_docs,portname,type)
    {
        var html='';
        var className=CABLES.UI.uiConfig.getPortTypeClassHtml(type);
        html+='<li>';
        html+='<span class="'+className+'">'+portname+'</span>';
        
        for(var j=0;j<op_docs.ports.length;j++)
        {
            if(op_docs.ports[j].name==portname)
            {
                html+=':<br/> '+op_docs.ports[j].text;
            }
        }
        html+='</li>';

        return html;
    }

    this.get=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
            {
                var html='<div>';
                // if( (!html || html.length==0) && opDocs[i].name )
                {
                    var nameParts=opDocs[i].name.split('.');
                    html='<h1 class="opTitleSvg">'+nameParts[nameParts.length-1]+'</h1>';

                    html+='<p><em><a target="_blank" href="/op/' + ( opDocs[i].name || '' ) + '"><i class="icon icon-link"></i>' + ( opDocs[i].name || '' ) + '</a></em></p>';
                    html+='<p>' + ( opDocs[i].summary || '' ) + '</p>';
                }

                if(opDocs[i].hasScreenshot)
                {
                    html+='<img src="/op/screenshot/'+opDocs[i].name+'.png"/>';
                }

                html+='</div>';
                html+=opDocs[i].content;

                if(opDocs[i].docs && opDocs[i].docs.ports)
                {
                    html+='<br/><h3>ports</h3><ul>';
                    html+='<h4>Input</h4>';

                    for(var j=0;j<opDocs[i].layout.portsIn.length;j++)
                    {
                        html+=this.getPortDoc(opDocs[i].docs,opDocs[i].layout.portsIn[j].name,opDocs[i].layout.portsIn[j].type);
                    }

                    html+='<h4>Output</h4>';
                    for(var j=0;j<opDocs[i].layout.portsOut.length;j++)
                    {
                        html+=this.getPortDoc(opDocs[i].docs,opDocs[i].layout.portsOut[j].name,opDocs[i].layout.portsOut[j].type);
                    }




                    html+='</ul>';
    
                }
                if(opDocs[i].credits)
                {
                    html+='<br/><h3>credits</h3><ul>';

                    for(var j in opDocs[i].credits)
                    {
                        if(opDocs[i].credits[j].url && opDocs[i].credits[j].url.length>0)html+='<a href="'+opDocs[i].credits[j].url+'" target="_blank">';
                        html+='<li>'+opDocs[i].credits[j].title+' by '+opDocs[i].credits[j].author+'</li>';
                        if(opDocs[i].credits[j].url && opDocs[i].credits[j].url.length>0)html+='</a>';
                    }
                    html+='</ul>';
                }

                if(opDocs[i].authorName)
                {
                    html+='<br/><h3>author</h3><ul>';
                    html+='<li><a href="https://cables.gl/admin/user/'+opDocs[i].authorName+'">'+opDocs[i].authorName+'</a></li>';
                    html+='</ul>';
                }

                return html;
            }

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

	// this.writeSummary=function(opname,summary)
	// {
	// 	CABLES.UI.MODAL.prompt(
	// 		"Summary",
	// 		"write a summary (oneliner) for "+opname,
	// 		summary||"",
	// 		function(v)
	// 		{
	// 			gui.serverOps.addOpSummary(opname, v );
	// 		});

    // };

    this.showPortDoc=function(opname,portname)
    {
        CABLES.UI.showInfo('');
        
        for(var i=0;i<opDocs.length;i++)
        {
            if(opDocs[i].name==opname)
            {
                if(opDocs[i].docs)
                {
                    for(var j=0;j<opDocs[i].docs.ports.length;j++)
                    {
                        if(opDocs[i].docs.ports[j].name==portname)
                        {
                            CABLES.UI.showInfo('<b>'+portname+'</b>:<br/> '+opDocs[i].docs.ports[j].text);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    // this.editPortDoc=function(opname,portname)
    // {
    //     var txt='';

    //     for(var i=0;i<opDocs.length;i++)
    //     {
    //         if(opDocs[i].name==opname)
    //         {
    //             if(opDocs[i].docs)
    //             {
    //                 for(var j=0;j<opDocs[i].docs.ports.length;j++)
    //                 {
    //                     if(opDocs[i].docs.ports[j].name==portname)
    //                     {
    //                         txt=opDocs[i].docs.ports[j].text;
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     CABLES.UI.MODAL.prompt('port doc '+portname,'enter here:',txt,
    //     function(txt)
    //     {
    //         console.log('new text:',txt);

    //         CABLES.api.put(
    //             'doc/' + opname + '/' + portname, {
    //                 "summary": txt
    //             },
    //             function(res) {
    //                 console.log(res);
    //             });
    //     })



    // }



};
