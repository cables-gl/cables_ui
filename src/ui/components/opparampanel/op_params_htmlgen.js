import namespace from "../../namespaceutils.js";
import opNames from "../../opnameutils.js";
import text from "../../text.js";
import { handleBarPrecompiled } from "../../utils/handlebars.js";

class PortHtmlGenerator
{
    constructor(panelId)
    {
        this._panelId = panelId;
        this._templateHead = handleBarPrecompiled("params_op_head");
        this._templatePortGeneral = handleBarPrecompiled("params_port_general");
        this._templatePortGeneralEnd = handleBarPrecompiled("params_port_general_end");
        this._templatePortInput = handleBarPrecompiled("params_port_input");
        this._templatePortOutput = handleBarPrecompiled("params_port_output");
        this._templatePortsHead = handleBarPrecompiled("params_ports_head");
    }

    getHtmlOpHeader(op)
    {
        let isBookmarked = false;
        let oldversion = false;
        let newestVersion = false;
        let hasExample = false;
        let doc = null;

        if (op) isBookmarked = gui.bookmarks.hasBookmarkWithId(op.id);

        const canEditOp = gui.serverOps.canEditOp(gui.user, op.objName);
        if (namespace.isDeprecatedOp(op.objName))
        {
            op.isDeprecated = true;
            const notDeprecatedName = op.objName.replace("Deprecated.", "");
            const alt = CABLES.Patch.getOpClass(notDeprecatedName);
            if (alt) op.isDeprecatedAlternative = notDeprecatedName;
        }
        if (namespace.isDevOp(op.objName)) op.isExperimental = true;

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

        const o = {
            "op": op,
            "panelid": this._panelId,
            "frontendOptions": CABLES.platform.frontendOptions,
            "isBookmarked": isBookmarked,
            "colorClass": opNames.getNamespaceClassName(op.objName),
            "texts": text,
            "user": gui.user,
            "optitle": op.getTitle(),
            "canEditOp": canEditOp,
            "showRenameButton": canEditOp && namespace.isNonCoreOp(op.objName),
            "oldVersion": oldversion,
            "minified": CABLES.UI.userSettings.get("minifiedOpHead"),
            "newestVersion": newestVersion,
            "cablesUrl": CABLES.platform.getCablesUrl(),
            "hasExample": hasExample,
        };

        o.cablesDocsUrl = CABLES.platform.getCablesDocsUrl();

        return this._templateHead(o, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
    }

    getHtmlHeaderPorts(dir, title)
    {
        return this._templatePortsHead({
            "dirStr": dir,
            "title": title,
            "texts": text,
        }, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
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
                "cablesUrl": CABLES.platform.getCablesUrl(),
                "openLocalFiles": CABLES.platform.frontendOptions.openLocalFiles,
                "portnum": i,
                "isInput": true,
                "op": ports[i].op,
                "texts": text,
                "vars": ports[i].op.patch.getVars(ports[i].type)
            };

            html += this._templatePortGeneral(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortInput(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortGeneralEnd(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
        }
        return html;
    }

    getHtmlOutputPorts(ports)
    {
        let lastGroup = null;
        let html = "";
        for (const i in ports)
        {
            if (
                ports[i].getType() == CABLES.OP_PORT_TYPE_VALUE ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_ARRAY ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_STRING ||
                ports[i].getType() == CABLES.OP_PORT_TYPE_OBJECT) ports[i].watchId = "out_" + i;

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

            const tmplData = {
                "port": ports[i],
                "dirStr": "out",
                "panelid": this._panelId,
                "groupSpacer": groupSpacer,
                "startGroup": startGroup,
                "portnum": i,
                "isInput": false,
                "op": ports[i].op
            };
            html += this._templatePortGeneral(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortOutput(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortGeneralEnd(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
        }

        return html;
    }
}

export { PortHtmlGenerator };
