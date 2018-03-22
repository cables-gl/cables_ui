
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OpDocs=function()
{
    var self=this;
    var opDocs=[];
    this.layoutPaper=null;
    this.libs=[];

    /**
     * Creates a "typeString" attribute for each port-object in the array (e.g. "Value")
     * @param {array} ports - Array of port objects with a "type" attribute
     */
    function addTypeStringToPorts(ports) {
        if(!ports) { console.warn('addTypeStringToPorts(): ports is not defined'); return; }
        for(var i=0; i<ports.length; i++) {
            var port = ports[i];
            if(port && typeof port.type !== 'undefined') {
                port.typeString = CABLES.Port.portTypeNumberToString(port.type);   
            }
        }
    }

    /**
     * Checks for the existence of a documentation text for the port with name `port.name`
     * @param {object} port - The port-object containing a `name` property to look for
     * @param {object} opDoc - The doc object of the op
     * @returns {string} - The documeentation for the port as html (markdown parsed)
     */
    function getPortDocText(port, opDoc) {
        if(!port || !opDoc || !opDoc.docs || !opDoc.docs.ports) { return; }
        for(var i=0; i<opDoc.docs.ports.length; i++) {
            if(opDoc.docs.ports[i].name === port.name) {
                var html = mmd(opDoc.docs.ports[i].text.trim()); // parse markdown
                return html;
            }
        }
    }

    /**
     * Sets a `text` property for each port with the documentation
     * @param {object} ports - Array-like object with ports 
     * @param {object} opDoc - The op doc
     */
    function setPortDocTexts(ports, opDoc) {
        if(!ports) { console.warn('getPortDocText called with empty argument!'); return; }
        for(var i=0; i<ports.length; i++) {
            var port = ports[i];
            var portDocText = getPortDocText(port, opDoc);
            if(portDocText) {
                port.text = portDocText;
            } else {
                port.text = '';
            }
        }
    }

    function parseMarkdown(mdText) {
        if(!mdText) { return ''; }
        return mmd(mdText);
    }

    /**
     * Adds some properties to each doc in the op docs array
     * @param {array} opDocs - The array of op docs
     */
    function extendOpDocs(opDocs) {
        if(!opDocs) { console.error('No op docs found!'); return; }
        for(var i=0; i<opDocs.length; i++) {
            var opDoc = opDocs[i];
            opDoc.category = CABLES.Op.getNamespaceClassName(opDoc.name);
            if(opDoc.layout) {
                if(opDoc.layout.portsIn) {
                    addTypeStringToPorts(opDoc.layout.portsIn);
                    setPortDocTexts(opDoc.layout.portsIn, opDoc);
                    opDoc.summaryHtml = parseMarkdown(opDoc.summary);
                }
                if(opDoc.layout.portsOut) {
                    addTypeStringToPorts(opDoc.layout.portsOut);
                    setPortDocTexts(opDoc.layout.portsOut, opDoc);
                    opDoc.summaryHtml = parseMarkdown(opDoc.summary);
                }
            }
        }
    }

    CABLES.api.get(
        CABLES.noCacheUrl(CABLES.sandbox.getUrlDocOpsAll()),
        function(res)
        {
            logStartup('Op docs loaded');
            
            console.log('op docs response');

            if(window.process && window.process.versions['electron'])  res=JSON.parse(res);
            
            opDocs=res.opDocs;
            extendOpDocs(opDocs); /* add attributes to the docs / parse markdown, ... */
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

                var opHeight=40;
                var opWidth=250;
                var p = Raphael(document.getElementById(elementId), opWidth, opHeight);

                var bg=p.rect(0,0,opWidth,opHeight);
                bg.attr("fill","#333");
                var j=0;

                if(opDocs[i].layout.portsIn)
	                for(j=0;j<opDocs[i].layout.portsIn.length;j++)
	                {
	                    var portIn=p.rect(j*(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding*2),0,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    portIn.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsIn[j].type));
	                }

                if(opDocs[i].layout.portsOut)
	                for(j=0;j<opDocs[i].layout.portsOut.length;j++)
	                {
	                    var portOut=p.rect(j*(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding*2),opHeight-CABLES.UI.uiConfig.portHeight,CABLES.UI.uiConfig.portSize,CABLES.UI.uiConfig.portHeight);
	                    portOut.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsOut[j].type));
	                }

                    // label = gui.patch().getPaper().text();

                var visualYOffset = 2;
                var label= p.text(0 + opWidth / 2, 0 + opHeight / 2 + visualYOffset,opDocs[i].shortName);
                label.node.classList.add("op_handle_"+CABLES.UI.uiConfig.getNamespaceClassName(opname));
                label.node.classList.add('op-svg-shortname');
                CABLES.UI.cleanRaphael(label);
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

    /**
     * Returns the op documentation object for an op
     * @param {string} opName - Complete op name (long form), e.g. "Ops.Value"
     */
    this.getOpDocByName = function(opName) {
        for(var i=0; i<opDocs.length; i++) {
            if(opDocs[i].name === opName) {
                return opDocs[i];
            }
        }
    };

    /**
     * Returns the documentation for an op as Html, replaces `get` function.
     * Does not render the op-svg (layout).
     * @param {string} opName - The name of the op to get the documantation as Html for
     */
    this.get2 = function(opName) {
        var opDoc = this.getOpDocByName(opName);
        if(!opDoc) { console.error('Op doc not found: ' + opName); return; }

        var html = CABLES.UI.getHandleBarHtml('op-doc-template', {
            opDoc: opDoc
        });
        return html;
    };

    /**
     * OLD! Use `get2` instead! This can be removed...
     * @param {string} opname - The op name to get the documentation as Html for
     */
    this.get=function(opname)
    {
        for(var i=0;i<opDocs.length;i++)
            if(opDocs[i].name==opname)
            {
                var html='<div class="op-doc">';
                // if( (!html || html.length==0) && opDocs[i].name )
                {
                    var nameParts=opDocs[i].name.split('.');
                    // html='<h1 class="opTitleSvg">'+nameParts[nameParts.length-1]+'</h1>';
                    var namespaceClass = 'color-op-category-' + CABLES.UI.uiConfig.getNamespaceClassName(opname);
                    // html+='<p><em><a class="namespace-link ' + namespaceClass + '" target="_blank" href="/op/' + ( opDocs[i].name || '' ) + '"><i class="icon icon-link"></i>' + ( opDocs[i].name || '' ) + '</a></em></p>';
                    html+='<p class="namespace-wrapper"><span class="namespace ' + namespaceClass + '">' + ( opDocs[i].name || '' ) + '</span></p>';
                    html+='<p class="op-summary">' + ( opDocs[i].summary || '' ) + '</p>';
                }

                if(opDocs[i].hasScreenshot)
                {
                    html+='<img src="/op/screenshot/'+opDocs[i].name+'.png"/>';
                }

                html+='</div>';
                html+=opDocs[i].content;

                if(opDocs[i] && opDocs[i].layout && opDocs[i].docs && opDocs[i].docs.ports && opDocs[i].layout)
                {
                    html+='<br/><h3>ports</h3><ul>';
                    html+='<h4>Input</h4>';

                    if(opDocs[i].layout.portsIn)
                    {
                        for(var j=0;j<opDocs[i].layout.portsIn.length;j++)
                        {
                            html+=this.getPortDoc(opDocs[i].docs,opDocs[i].layout.portsIn[j].name,opDocs[i].layout.portsIn[j].type);
                        }
                    }

                    if(opDocs[i].layout.portsOut)
                    {
                        html+='<h4>Output</h4>';
                        for(var j=0;j<opDocs[i].layout.portsOut.length;j++)
                        {
                            html+=this.getPortDoc(opDocs[i].docs,opDocs[i].layout.portsOut[j].name,opDocs[i].layout.portsOut[j].type);
                        }
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
