import defaultops from "../../defaultops";
import text from "../../text";

class PortHtmlGenerator
{
    constructor(panelId)
    {
        this._panelId = panelId;
        this._templateHead = Handlebars.compile(document.getElementById("params_op_head").innerHTML);
        this._templatePortGeneral = Handlebars.compile(document.getElementById("params_port_general").innerHTML);
        this._templatePortGeneralEnd = Handlebars.compile(document.getElementById("params_port_general_end").innerHTML);
        this._templatePortInput = Handlebars.compile(document.getElementById("params_port_input").innerHTML);
        this._templatePortOutput = Handlebars.compile(document.getElementById("params_port_output").innerHTML);
        this._templatePortsHead = Handlebars.compile(document.getElementById("params_ports_head").innerHTML);
    }

    getHtmlOpHeader(op)
    {
        let isBookmarked = false;
        let ownsOp = false;
        let oldversion = false;
        let newestVersion = false;
        let hasExample = false;
        let doc = null;

        if (op) isBookmarked = gui.bookmarks.hasBookmarkWithId(op.id);

        if (op.objName.startsWith("Ops.User." + gui.user.username)) ownsOp = true;
        if (op.objName.startsWith("Ops.Deprecated."))
        {
            op.isDeprecated = true;
            const notDeprecatedName = op.objName.replace("Deprecated.", "");
            const alt = CABLES.Patch.getOpClass(notDeprecatedName);
            if (alt) op.isDeprecatedAlternative = notDeprecatedName;
        }
        if (defaultops.isDevOp(op.objName)) op.isExperimental = true;

        if (gui.opDocs)
        {
            op.summary = gui.opDocs.getSummary(op.objName);
            doc = gui.opDocs.getOpDocByName(op.objName);
        }

        if (doc)
        {
            hasExample = doc.hasExample;
            if (doc.oldVersion) oldversion = doc.oldVersion;
            newestVersion = doc.newestVersion;
        }

        return this._templateHead({
            "op": op,
            "panelid": this._panelId,
            "isBookmarked": isBookmarked,
            "colorClass": "op_color_" + defaultops.getNamespaceClassName(op.objName),
            "texts": text,
            "user": gui.user,
            "optitle": op.getTitle(),
            "ownsOp": ownsOp,
            "oldVersion": oldversion,
            "newestVersion": newestVersion,
            "cablesUrl": CABLES.sandbox.getCablesUrl(),
            "hasExample": hasExample,
        });
    }

    getHtmlHeaderPorts(dir, title)
    {
        return this._templatePortsHead({
            "dirStr": dir,
            "title": title,
            "texts": text,
        });
    }

    getHtmlInputPorts(ports)
    {
        let html = "";
        let lastGroup = null;

        for (let i = 0; i < ports.length; i++)
        {
            const opGroup = ports[i].uiAttribs.group;
            let startGroup = null;
            let groupSpacer = false;

            if (!ports[i].uiAttribs.hideParam)
            {
                if (lastGroup != opGroup && !opGroup) groupSpacer = true;

                if (lastGroup != opGroup)
                {
                    groupSpacer = true;
                    lastGroup = opGroup;
                    startGroup = lastGroup;
                }
            }

            ports[i].watchId = "in_" + i;

            const tmplData = {
                "port": ports[i],
                "panelid": this._panelId,
                "startGroup": startGroup,
                "groupSpacer": groupSpacer,
                "dirStr": "in",
                "portnum": i,
                "isInput": true,
                "op": ports[i].parent,
                "texts": text,
                "vars": ports[i].parent.patch.getVars(ports[i].type)
            };

            html += this._templatePortGeneral(tmplData);
            html += this._templatePortInput(tmplData);
            html += this._templatePortGeneralEnd(tmplData);
        }
        return html;
    }

    getHtmlOutputPorts(ports)
    {
        let foundPreview = false;
        let lastGroup = null;
        let html = "";
        for (const i in ports)
        {
            if (
                ports[i].getType() == CABLES.OP_PORT_TYPE_VALUE ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_ARRAY ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_STRING ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_OBJECT)
            {
                ports[i].watchId = "out_" + i;
            }

            let startGroup = null;
            let groupSpacer = false;

            const opGroup = ports[i].uiAttribs.group;

            if (lastGroup != opGroup && !opGroup) groupSpacer = true;
            if (lastGroup != opGroup)
            {
                groupSpacer = true;
                lastGroup = opGroup;
                startGroup = lastGroup;
            }

            // set auto preview
            if (!foundPreview && ports[i].uiAttribs.preview)
            {
                foundPreview = true;
                gui.texturePreview().selectTexturePort(ports[i]);
            }

            const tmplData = {
                "port": ports[i],
                "dirStr": "out",
                "panelid": this._panelId,
                "groupSpacer": groupSpacer,
                "startGroup": startGroup,
                "portnum": i,
                "isInput": false,
                "op": ports[i].parent
            };
            html += this._templatePortGeneral(tmplData);
            html += this._templatePortOutput(tmplData);
            html += this._templatePortGeneralEnd(tmplData);
        }

        return html;
    }
}

export { PortHtmlGenerator };
