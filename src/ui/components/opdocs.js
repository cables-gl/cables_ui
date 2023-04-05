
import defaultops from "../defaultops";
import Logger from "../utils/logger";
import { getHandleBarHtml } from "../utils/handlebars";

export default class OpDocs
{
    constructor()
    {
        this._log = new Logger();
        const self = this;
        this._opDocs = [];
        this.layoutPaper = null;
        this.libs = [];
        this.coreLibs = [];
    }

    addCoreOpDocs()
    {
        logStartup("Op docs loaded");
        const res = CABLESUILOADER.preload.opDocsAll;
        this._extensions = res.extensions;
        this._teamnamespaces = res.teamNamespaces;
        this.libs = res.libs;
        this.coreLibs = res.coreLibs;

        this.addOpDocs(res.opDocs);
    }

    /**
     * Creates a "typeString" attribute for each port-object in the array (e.g. "Value")
     * @param {array} ports - Array of port objects with a "type" attribute
     */
    addTypeStringToPorts(ports)
    {
        if (!ports) { this._log.warn("addTypeStringToPorts(): ports is not defined"); return; }
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
    getPortDocText(port, opDoc)
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
    setPortDocTexts(ports, opDoc)
    {
        if (!ports) { this._log.warn("getPortDocText called with empty argument!"); return; }
        for (let i = 0; i < ports.length; i++)
        {
            const port = ports[i];
            const portDocText = this.getPortDocText(port, opDoc);
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

    parseMarkdown(mdText)
    {
        if (!mdText) { return ""; }
        return mmd(mdText);
    }

    /**
     * Adds some properties to each doc in the op docs array
     * @param {array} opDocs - The array of op docs
     */
    extendOpDocs(_opDocs)
    {
        if (!_opDocs) { this._log.error("No op docs found!"); return; }
        for (let i = 0; i < _opDocs.length; i++)
        {
            const opDoc = _opDocs[i];
            opDoc.category = defaultops.getNamespaceClassName(opDoc.name);
            if (opDoc.layout)
            {
                if (opDoc.layout.portsIn)
                {
                    this.addTypeStringToPorts(opDoc.layout.portsIn);
                    this.setPortDocTexts(opDoc.layout.portsIn, opDoc);
                    opDoc.summaryHtml = this.parseMarkdown(opDoc.summary);
                }
                if (opDoc.layout.portsOut)
                {
                    this.addTypeStringToPorts(opDoc.layout.portsOut);
                    this.setPortDocTexts(opDoc.layout.portsOut, opDoc);
                    opDoc.summaryHtml = this.parseMarkdown(opDoc.summary);
                }
            }
        }
    }


    getSummary(opname)
    {
        for (let i = 0; i < this._opDocs.length; i++)
            if (this._opDocs[i].name == opname)
                return this._opDocs[i].summary || "";

        return 0;
    }

    getAll()
    {
        return this._opDocs;
    }

    getExtensions()
    {
        return this._extensions;
    }

    getTeamNamespaces()
    {
        return this._teamnamespaces;
    }

    getNamespaceDocs(namespace)
    {
        return this._opDocs.filter((opDoc) => { return opDoc.name && opDoc.name.startsWith(namespace); });
    }

    getAttachmentFiles(opname)
    {
        for (let i = 0; i < this._opDocs.length; i++)
            if (this._opDocs[i].name == opname)
                return this._opDocs[i].attachmentFiles || [];
        return [];
    }


    getPortDoc(op_docs, portname, type)
    {
        let html = "";


        const className = defaultops.getPortTypeClassHtml(type);
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
    }

    /**
     * Returns the op documentation object for an op
     * @param {string} opName - Complete op name (long form), e.g. "Ops.Value"
     */
    getOpDocByName(opName)
    {
        for (let i = 0; i < this._opDocs.length; i++)
        {
            if (this._opDocs[i].name === opName)
            {
                return this._opDocs[i];
            }
        }
    }

    /**
     * Returns the documentation for an op as Html
     * Does not render the op-svg (layout).
     * @param {string} opName - The name of the op to get the documantation as Html for
     */
    get2(opName)
    {
        let opDoc = this.getOpDocByName(opName);
        if (!opDoc)
        {
            if (defaultops.isExtension(opName))
            {
                opDoc =
                    {
                        "name": "",
                        "summaryHtml": "",
                        "summary": "",
                        "userOp": false
                    };
            }
            else if (defaultops.isTeamNamespace(opName))
            {
                opDoc =
                    {
                        "name": "",
                        "summaryHtml": "",
                        "summary": "",
                        "userOp": false
                    };
            }
            else
            {
                opDoc =
                    {
                        "name": opName,
                        "summaryHtml": "No Op Documentation found",
                        "summary": "No Op Documentation found",
                        "userOp": opName.indexOf("Ops.User") == 0
                    };
            }
        }

        const html = getHandleBarHtml("op-doc-template", {
            "opDoc": opDoc
        });

        return html;
    }

    showPortDoc(opname, portname)
    {
        const perf = CABLES.UI.uiProfiler.start("opdocs.portdoc");

        for (let i = 0; i < this._opDocs.length; i++)
        {
            if (this._opDocs[i].name == opname && this._opDocs[i].layout)
            {
                if (!this._opDocs[i].layout) return;

                let group = null;

                if (this._opDocs[i].layout.portsIn)
                    for (let k = 0; k < this._opDocs[i].layout.portsIn.length; k++)
                        if (this._opDocs[i].layout.portsIn[k].name == portname)
                            group = this._opDocs[i].layout.portsIn[k].group;

                if (group) group += " - ";
                else group = "";

                if (this._opDocs[i].docs)
                {
                    for (let j = 0; j < this._opDocs[i].docs.ports.length; j++)
                    {
                        if (this._opDocs[i].docs.ports[j].name == portname)
                        {
                            gui.showInfoParam("<b>" + group + portname + "</b>: " + this._opDocs[i].docs.ports[j].text);
                            perf.finish();
                            return;
                        }
                    }
                }

                gui.showInfoParam("<b>" + group + portname + "</b> ");
                perf.finish();
                return;
            }
        }

        perf.finish();
    }

    addOpDocs(opDocs = [])
    {
        this._opDocs = this._opDocs.concat(opDocs);
        this.extendOpDocs(this._opDocs);
    }

    getOpDocs()
    {
        return this._opDocs;
    }
}
