
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.OpDocs = function ()
{
    const self = this;
    let opDocs = [];
    this.layoutPaper = null;
    this.libs = [];
    this.coreLibs = [];

    /**
     * Creates a "typeString" attribute for each port-object in the array (e.g. "Value")
     * @param {array} ports - Array of port objects with a "type" attribute
     */
    function addTypeStringToPorts(ports)
    {
        if (!ports) { console.warn("addTypeStringToPorts(): ports is not defined"); return; }
        for (let i = 0; i < ports.length; i++)
        {
            const port = ports[i];
            if (port && typeof port.type !== "undefined")
            {
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
    function getPortDocText(port, opDoc)
    {
        if (!port || !opDoc || !opDoc.docs || !opDoc.docs.ports) { return; }
        for (let i = 0; i < opDoc.docs.ports.length; i++)
        {
            if (opDoc.docs.ports[i].name === port.name)
            {
                const html = mmd(opDoc.docs.ports[i].text.trim()); // parse markdown
                return html;
            }
        }
    }

    /**
     * Sets a `text` property for each port with the documentation
     * @param {object} ports - Array-like object with ports
     * @param {object} opDoc - The op doc
     */
    function setPortDocTexts(ports, opDoc)
    {
        if (!ports) { console.warn("getPortDocText called with empty argument!"); return; }
        for (let i = 0; i < ports.length; i++)
        {
            const port = ports[i];
            const portDocText = getPortDocText(port, opDoc);
            if (portDocText)
            {
                port.text = portDocText;
            }
            else
            {
                port.text = "";
            }
        }
    }

    function parseMarkdown(mdText)
    {
        if (!mdText) { return ""; }
        return mmd(mdText);
    }

    /**
     * Adds some properties to each doc in the op docs array
     * @param {array} opDocs - The array of op docs
     */
    function extendOpDocs(_opDocs)
    {
        if (!_opDocs) { console.error("No op docs found!"); return; }
        for (let i = 0; i < _opDocs.length; i++)
        {
            const opDoc = _opDocs[i];
            opDoc.category = CABLES.Op.getNamespaceClassName(opDoc.name);
            if (opDoc.layout)
            {
                if (opDoc.layout.portsIn)
                {
                    addTypeStringToPorts(opDoc.layout.portsIn);
                    setPortDocTexts(opDoc.layout.portsIn, opDoc);
                    opDoc.summaryHtml = parseMarkdown(opDoc.summary);
                }
                if (opDoc.layout.portsOut)
                {
                    addTypeStringToPorts(opDoc.layout.portsOut);
                    setPortDocTexts(opDoc.layout.portsOut, opDoc);
                    opDoc.summaryHtml = parseMarkdown(opDoc.summary);
                }
            }
        }
    }


    // return "doc/ops/all";


    // CABLES.api.get(
    //     CABLESUILOADER.noCacheUrl(CABLES.sandbox.getUrlDocOpsAll()),
    //     function (res)
    // {
    logStartup("Op docs loaded");
    const res = CABLESUILOADER.preload.opDocsAll;
    // console.log(res);
    // if (window.process && window.process.versions.electron) res = JSON.parse(res);

    opDocs = res.opDocs;
    extendOpDocs(opDocs); /* add attributes to the docs / parse markdown, ... */
    self.libs = res.libs;
    self.coreLibs = res.coreLibs;


    // },
    // function (res, e) { console.error("err", res, e); if (cb)cb(); }
    // );


    this.getSummary = function (opname)
    {
        for (let i = 0; i < opDocs.length; i++)
            if (opDocs[i].name == opname)
                return opDocs[i].summary || "";

        return 0;
    };

    this.getAll = function ()
    {
        return opDocs;
    };

    this.opLayoutSVG = function (opname, elementId)
    {
        if (this.layoutPaper) this.layoutPaper.clear();

        for (let i = 0; i < opDocs.length; i++)
        {
            if (opDocs[i].name == opname)
            {
                if (!opDocs[i].layout) return;

                const opHeight = 40;
                const opWidth = 250;
                const ele = document.getElementById(elementId);
                if (!ele) return;

                const p = Raphael(ele, opWidth, opHeight);

                const bg = p.rect(0, 0, opWidth, opHeight);
                bg.attr("fill", "#333");
                let j = 0;

                if (opDocs[i].layout.portsIn)
                    for (j = 0; j < opDocs[i].layout.portsIn.length; j++)
                    {
                        const portIn = p.rect(j * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding * 2), 0, CABLES.UI.uiConfig.portSize, CABLES.UI.uiConfig.portHeight);
                        portIn.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsIn[j].type));
                    }

                if (opDocs[i].layout.portsOut)
                    for (j = 0; j < opDocs[i].layout.portsOut.length; j++)
                    {
                        const portOut = p.rect(j * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding * 2), opHeight - CABLES.UI.uiConfig.portHeight, CABLES.UI.uiConfig.portSize, CABLES.UI.uiConfig.portHeight);
                        portOut.node.classList.add(CABLES.UI.uiConfig.getPortTypeClass(opDocs[i].layout.portsOut[j].type));
                    }

                const visualYOffset = 2;
                const label = p.text(0 + opWidth / 2, 0 + opHeight / 2 + visualYOffset, opDocs[i].shortNameDisplay);
                label.node.classList.add("op_handle_" + CABLES.UI.uiConfig.getNamespaceClassName(opname));
                label.node.classList.add("op-svg-shortname");
                CABLES.UI.cleanRaphael(label);
                this.layoutPaper = p;
                return;
            }
        }
    };

    this.getPopularity = function (opname)
    {
        for (let i = 0; i < opDocs.length; i++)
            if (opDocs[i].name == opname)
                return opDocs[i].pop;

        return 0;
    };

    this.getAttachmentFiles = function (opname)
    {
        for (let i = 0; i < opDocs.length; i++)
            if (opDocs[i].name == opname)
                return opDocs[i].attachmentFiles || [];
        return [];
    };


    this.getPortDoc = function (op_docs, portname, type)
    {
        let html = "";
        const className = CABLES.UI.uiConfig.getPortTypeClassHtml(type);
        html += "<li>";
        html += "<span class=\"" + className + "\">" + portname + "</span>";

        for (let j = 0; j < op_docs.ports.length; j++)
        {
            if (op_docs.ports[j].name == portname)
            {
                html += ":<br/> " + op_docs.ports[j].text;
            }
        }
        html += "</li>";

        return html;
    };

    /**
     * Returns the op documentation object for an op
     * @param {string} opName - Complete op name (long form), e.g. "Ops.Value"
     */
    this.getOpDocByName = function (opName)
    {
        for (let i = 0; i < opDocs.length; i++)
        {
            if (opDocs[i].name === opName)
            {
                return opDocs[i];
            }
        }
    };

    /**
     * Returns the documentation for an op as Html
     * Does not render the op-svg (layout).
     * @param {string} opName - The name of the op to get the documantation as Html for
     */
    this.get2 = function (opName)
    {
        let opDoc = this.getOpDocByName(opName);

        if (!opDoc)
        {
            opDoc =
                {
                    "name": opName,
                    "summaryHtml": "No Op Documentation found",
                    "summary": "No Op Documentation found",
                    "userOp": opName.indexOf("Ops.User") == 0
                };
        }

        const html = CABLES.UI.getHandleBarHtml("op-doc-template", {
            "opDoc": opDoc
        });

        return html;
    };


    this.getSuggestions = function (objName, portName)
    {
        for (let i = 0; i < opDocs.length; i++)
        {
            if (opDocs[i].name == objName)
            {
                if (opDocs[i].portSuggestions && opDocs[i].portSuggestions[portName])
                {
                    const suggestions = opDocs[i].portSuggestions[portName].ops;
                    return suggestions;
                }
            }
        }
    };

    this.showPortDoc = function (opname, portname)
    {
        const perf = CABLES.uiperf.start("opdocs.portdoc");

        for (let i = 0; i < opDocs.length; i++)
        {
            if (opDocs[i].name == opname && opDocs[i].layout)
            {
                if (!opDocs[i].layout) return;

                let group = null;

                if (opDocs[i].layout.portsIn)
                    for (let k = 0; k < opDocs[i].layout.portsIn.length; k++)
                        if (opDocs[i].layout.portsIn[k].name == portname)
                            group = opDocs[i].layout.portsIn[k].group;

                if (group) group += " - ";
                else group = "";

                if (opDocs[i].docs)
                {
                    for (let j = 0; j < opDocs[i].docs.ports.length; j++)
                    {
                        if (opDocs[i].docs.ports[j].name == portname)
                        {
                            CABLES.UI.showInfo("<b>" + group + portname + "</b>:<br/>" + opDocs[i].docs.ports[j].text);
                            perf.finish();
                            return;
                        }
                    }
                }

                CABLES.UI.showInfo("<b>" + group + portname + "</b><br/> ");
                perf.finish();
                return;
            }
        }

        perf.finish();
    };
};
