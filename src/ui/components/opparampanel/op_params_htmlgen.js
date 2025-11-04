import { Patch, Port, utils } from "cables";
import { CablesConstants } from "cables-shared-client";
import { portType } from "../../core_constants.js";
import { gui } from "../../gui.js";
import namespace from "../../namespaceutils.js";
import opNames from "../../opnameutils.js";
import { platform } from "../../platform.js";
import { GuiText } from "../../text.js";
import { handleBarPrecompiled } from "../../utils/handlebars.js";
import { userSettings } from "../usersettings.js";

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
            const alt = Patch.getOpClass(notDeprecatedName);
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

        let opChanged = false;
        if (gui.serverOps.opIdsChangedOnServer[op.opId])
            opChanged = true;

        const o = {
            "op": op,
            "panelid": this._panelId,
            "frontendOptions": platform.frontendOptions,
            "isBookmarked": isBookmarked,
            "colorClass": opNames.getNamespaceClassName(op.objName),
            "texts": GuiText,
            "user": gui.user,
            "optitle": op.getTitle(),
            "canEditOp": canEditOp,
            "opChanged": opChanged,
            "oldVersion": oldversion,
            "minified": userSettings.get("minifiedOpHead"),
            "newestVersion": newestVersion,
            "cablesUrl": platform.getCablesUrl(),
            "hasExample": hasExample,
        };

        o.cablesDocsUrl = platform.getCablesDocsUrl();

        return this._templateHead(o, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
    }

    /**
     * @param {string} dir
     * @param {string} title
     */
    getHtmlHeaderPorts(dir, title)
    {
        return this._templatePortsHead({
            "dirStr": dir,
            "title": title,
            "texts": GuiText,
        }, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
    }

    /**
     * @param {Array<Port>} ports
     * @returns {string}
     */
    getHtmlInputPorts(ports)
    {
        let html = "";
        let lastGroup = null;

        for (let i = 0; i < ports.length; i++)
        {
            const opGroup = ports[i].uiAttribs.group;
            let startGroup = null;
            let groupSpacer = false;
            const portGroupNames = [];

            if (!ports[i].uiAttribs.hideParam)
            {
                if (lastGroup != opGroup && !opGroup) groupSpacer = true;

                if (lastGroup != opGroup)
                {
                    groupSpacer = true;
                    lastGroup = opGroup;
                    startGroup = lastGroup;
                    for (let j = 0; j < ports.length; j++)
                    {
                        if (ports[j].uiAttribs.group == startGroup)
                        {
                            portGroupNames.push(ports[j].name);
                        }
                    }
                }
            }

            ports[i].watchId = "in_" + i;

            const tmplData = {
                "port": ports[i],
                "panelid": this._panelId,
                "startGroup": startGroup,
                "groupSpacer": groupSpacer,
                "portGroupNames": portGroupNames,
                "dirStr": "in",
                "cablesUrl": platform.getCablesUrl(),
                "openLocalFiles": platform.frontendOptions.openLocalFiles,
                "portnum": i,
                "isInput": true,
                "op": ports[i].op,
                "texts": GuiText,
                "vars": ports[i].op.patch.getVars(ports[i].type)
            };

            if (ports[i].uiAttribs.display === "file")
            {
                const url = ports[i].value || "";
                const patchAsset = url.startsWith("/assets/" + gui.project()._id);
                let fileType = "";
                if (patchAsset)
                {
                    const fileName = utils.filename(url);
                    const suffix = "." + fileName.split(".").pop();
                    for (let key in CablesConstants.FILETYPES)
                    {
                        const typeSuffixes = CablesConstants.FILETYPES[key];
                        if (typeSuffixes.includes(suffix))
                        {
                            fileType = key;
                            break;
                        }
                    }
                    const editableFiles = CablesConstants.EDITABLE_FILETYPES || [];
                    tmplData.fileEditable = !platform.isElectron() && editableFiles.includes(fileType);
                    tmplData.fileType = fileType;
                    tmplData.fileName = fileName;
                }

            }

            html += this._templatePortGeneral(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortInput(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
            html += this._templatePortGeneralEnd(tmplData, { "allowProtoPropertiesByDefault": true, "allowProtoMethodsByDefault": true });
        }
        return html;
    }

    /**
     * @param {Array<Port>} ports
     * @returns {string}
     */
    getHtmlOutputPorts(ports)
    {
        let lastGroup = null;
        let html = "";
        for (const i in ports)
        {
            if (
                ports[i].getType() == portType.number ||
                ports[i].getType() == portType.array ||
                ports[i].getType() == portType.string ||
                ports[i].getType() == portType.object) ports[i].watchId = "out_" + i;

            let startGroup = null;
            let groupSpacer = false;

            const portGroupNames = [];

            const opGroup = ports[i].uiAttribs.group;

            if (lastGroup != opGroup && !opGroup) groupSpacer = true;
            if (lastGroup != opGroup)
            {
                groupSpacer = true;
                lastGroup = opGroup;
                startGroup = lastGroup;

                for (let j = 0; j < ports.length; j++)
                {
                    if (ports[j].uiAttribs.group == startGroup)
                        portGroupNames.push(ports[j].name);
                }
            }

            const tmplData = {
                "port": ports[i],
                "dirStr": "out",
                "panelid": this._panelId,
                "groupSpacer": groupSpacer,
                "startGroup": startGroup,
                "portGroupNames": portGroupNames,
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
