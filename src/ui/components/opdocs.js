import defaultops, { defaultOpNames } from "../defaultops";
import Logger from "../utils/logger";
import { getHandleBarHtml } from "../utils/handlebars";
import uiconfig from "../uiconfig";
import gluiconfig from "../glpatch/gluiconfig";
import GlPatch from "../glpatch/glpatch";
import GlPort from "../glpatch/glport";

export default class OpDocs
{
    constructor()
    {
        this._log = new Logger();
        this._opDocs = [];
        this.libs = [];
        this.coreLibs = [];
        this._extensions = [];
        this._teamnamespaces = [];
    }

    addCoreOpDocs()
    {
        if (window.logStartup) logStartup("Op docs loaded");
        const res = CABLESUILOADER.preload.opDocsAll;
        this._extensions = res.extensions;
        this._teamnamespaces = res.teamNamespaces;
        this.libs = res.libs;
        this.coreLibs = res.coreLibs;

        this.addOpDocs(res.opDocs);

        this.checkDefaultOpsOutdated();
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

        const perf = CABLES.UI.uiProfiler.start("[opdocs] portdocs inner");
        for (let i = 0; i < opDoc.docs.ports.length; i++)
        {
            if (opDoc.docs.ports[i].name === port.name)
            {
                const html = this.parseMarkdown(opDoc.docs.ports[i].text.trim()); // parse markdown
                return html;
            }
        }
        perf.finish();
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
        const perf = CABLES.UI.uiProfiler.start("[opdocs] parse markdown");
        if (!mdText) { return ""; }
        const s = marked.parse(mdText);
        perf.finish();
        return s;
    }

    /**
     * Adds some properties to each doc in the op docs array
     * @param {array} _opDocs - The array of op docs
     */
    extendOpDocs(_opDocs)
    {
        if (!_opDocs) { this._log.error("No op docs found!"); return; }
        for (let i = 0; i < _opDocs.length; i++)
        {
            const opDoc = _opDocs[i];
            opDoc.category = defaultops.getNamespaceClassName(opDoc.name);
            let summaryParsed = false;
            if (opDoc.layout)
            {
                if (opDoc.layout.portsIn)
                {
                    this.addTypeStringToPorts(opDoc.layout.portsIn);
                    this.setPortDocTexts(opDoc.layout.portsIn, opDoc);
                    opDoc.summaryHtml = this.parseMarkdown(opDoc.summary);
                    summaryParsed = true;
                }
                if (opDoc.layout.portsOut)
                {
                    this.addTypeStringToPorts(opDoc.layout.portsOut);
                    this.setPortDocTexts(opDoc.layout.portsOut, opDoc);
                    if (!summaryParsed)
                    {
                        opDoc.summaryHtml = this.parseMarkdown(opDoc.summary);
                        summaryParsed = true;
                    }
                }
            }
            if (defaultops.isCollection(opDoc.name))
            {
                if (!summaryParsed)
                {
                    opDoc.summaryHtml = this.parseMarkdown(opDoc.summary);
                    summaryParsed = true;
                }
                opDoc.descriptionHtml = this.parseMarkdown(opDoc.description);
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
        let docs = this._opDocs.filter((opDoc) => { return opDoc.name && opDoc.name.startsWith(namespace); });
        docs = docs.concat(this._extensions.filter((opDoc) => { return opDoc.name && opDoc.name.startsWith(namespace); }));
        docs = docs.concat(this._teamnamespaces.filter((opDoc) => { return opDoc.name && opDoc.name.startsWith(namespace); }));
        return docs;
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
        for (let i = 0; i < this._extensions.length; i++)
        {
            if (this._extensions[i].name === opName)
            {
                return this._extensions[i];
            }
        }
        for (let i = 0; i < this._teamnamespaces.length; i++)
        {
            if (this._teamnamespaces[i].name === opName)
            {
                return this._teamnamespaces[i];
            }
        }
    }

    /**
     * Returns the op documentation object for an op
     * @param {string} opId
     */
    getOpDocById(opId)
    {
        let doc = this._opDocs.find((d) => { return d.id == opId; });
        if (doc) return doc;

        doc = this._extensions.find((d) => { return d.id == opId; });
        if (doc) return doc;

        doc = this._teamnamespaces.find((d) => { return d.id == opId; });
        if (doc) return doc;

        return null;
    }

    /**
     * Returns the documentation for an op as Html
     * @param {string} opName - The name of the op to get the documentation as Html for
     */
    getHtml(opName, collectionInfo = {})
    {
        let opDoc = this.getOpDocByName(opName);

        let template = "op-doc-template";
        if (defaultops.isExtension(opName)) template = "op-doc-collection-template-extension";
        if (defaultops.isTeamNamespace(opName)) template = "op-doc-collection-template-teamnamespace";
        if (!opDoc)
        {
            if (defaultops.isCollection(opName))
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

        if (!opDoc.isExtended)
        {
            this.extendOpDocs([opDoc]);
            opDoc.isExtended = true;
        }

        return getHandleBarHtml(template, {
            "opDoc": opDoc,
            "collectionInfo": collectionInfo
        });
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
        const perf = CABLES.UI.uiProfiler.start("[opdocs] addOpDocs");
        const newOpDocs = [];

        opDocs.forEach((doc) =>
        {
            let oldDoc = this._opDocs.findIndex((d) => { return d.id === doc.id; });
            if (oldDoc === -1)
            {
                newOpDocs.push(doc);
            }
            else
            {
                this._opDocs[oldDoc] = doc;
            }
        });
        this._opDocs = this._opDocs.concat(newOpDocs);
        perf.finish();
    }

    getOpDocs()
    {
        return this._opDocs;
    }


    checkDefaultOpsOutdated()
    {
        const perf = CABLES.UI.uiProfiler.start("[opdocs] checkDefaultOpsOutdated");
        for (const i in defaultOpNames)
        {
            const doc = this.getOpDocByName(defaultOpNames[i]);

            if (!doc)
            {
                console.warn("default op " + i + " " + defaultOpNames[i] + " not found... outdated ?");
            }
        }

        perf.finish();
    }

    getLayoutSvg(opname)
    {
        function glColorToHtml(glCol)
        {
            const r = Math.round(glCol[0] * 255);
            const g = Math.round(glCol[1] * 255);
            const b = Math.round(glCol[2] * 255);

            return "rgb(" + r + ", " + g + ", " + b + ")";
        }

        const doc = this.getOpDocByName(opname);
        if (doc.layout)
        {
            let svgStr = "";
            let width = 200;
            if (doc.layout.portsIn)
                width = Math.max(width, doc.layout.portsIn.length * (gluiconfig.portWidth + gluiconfig.portPadding));

            svgStr += "<?xml version=\"1.0\"?>";
            svgStr += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" width=\"" + width + "\" height=\"" + gluiconfig.opHeight + "\">";


            svgStr += "<rect width=\"" + width + "\" height=\"" + gluiconfig.opHeight + "\" fill=\"" + glColorToHtml(gui.theme.colors_patch.opBgRect) + "\"/>";

            if (doc.layout.portsIn)
                for (let i = 0; i < doc.layout.portsIn.length; i++)
                {
                    if (!doc.layout.portsIn[i]) continue;
                    let posx = i * (gluiconfig.portWidth + gluiconfig.portPadding);

                    const pcol = GlPort.getColor(doc.layout.portsIn[i].type);
                    const cssCol = glColorToHtml(pcol);

                    svgStr += "<rect x=\"" + posx + "\" width=\"" + gluiconfig.portWidth + "\" height=\"" + gluiconfig.portHeight + "\" fill=\"" + cssCol + "\"/>";
                }

            if (doc.layout.portsOut)
                for (let i = 0; i < doc.layout.portsOut.length; i++)
                {
                    if (!doc.layout.portsOut[i]) continue;
                    let posx = i * (gluiconfig.portWidth + gluiconfig.portPadding);
                    const pcol = GlPort.getColor(doc.layout.portsOut[i].type);
                    const cssCol = glColorToHtml(pcol);


                    svgStr += "<rect y=\"" + (gluiconfig.opHeight - gluiconfig.portHeight) + "\" x=\"" + posx + "\" width=\"" + gluiconfig.portWidth + "\" height=\"" + gluiconfig.portHeight + "\" fill=\"" + cssCol + "\"/>";
                }

            const nsCol = GlPatch.getOpNamespaceColor(opname);
            const cssCol = glColorToHtml(nsCol);

            svgStr += "<text x=\"" + gluiconfig.portWidth + "\" y=\"" + gluiconfig.opHeight * 0.63 + "\" style=\"font-family:roboto, arial;font-size:12px;\" fill=\"" + cssCol + "\">" + doc.shortNameDisplay + "</text>";

            svgStr += "</svg>";

            return svgStr;
        }
    }
}
