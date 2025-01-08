import { Logger } from "cables-shared-client";
import ModalDialog from "../../dialogs/modaldialog.js";
import GlUiConfig from "../../glpatch/gluiconfig.js";
import defaultOps from "../../defaultops.js";

export default class ModalPortValue
{
    constructor()
    {
        this._log = new Logger("ModalPortValue");
        this._port = null;
    }


    showJsonStructure(opid, which)
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op)
        {
            this._log.warn("opid not found:", opid);
            return;
        }
        const port = op.getPort(which);
        if (!port)
        {
            this._log.warn("port not found:", which);
            return;
        }

        this._port = port;
        const modal = new ModalDialog({});
        this._showPortStructure(port.name, modal, port);
    }

    _showPortStructure(title, modal, port)
    {
        function asyncInnerHTML(HTML, callback)
        {
            const container = document.createElement("div");
            const temp = document.createElement("div");
            const frag = document.createElement("template");
            temp.innerHTML = HTML;
            const _innerHTML = function ()
            {
                if (temp.firstChild)
                {
                    frag.appendChild(temp.firstChild);
                    setTimeout(_innerHTML, 0);
                }
                else
                {
                    const fragmentElms = [...frag.children];
                    fragmentElms.forEach((elm) =>
                    {
                        container.appendChild(elm);
                    });
                    callback(container, frag);
                }
            };
            _innerHTML();
        }

        function printNode(op, portName, html, key, node, path, level, inputDataType = "Object")
        {
            html += "<tr class=\"row\">";
            let i = 0;
            let ident = "";

            for (i = 0; i < level; i++)
            {
                let identClass = "identBg";
                if (i == 0)identClass = "identBgLevel0";
                ident += "<td class=\"ident  " + identClass + "\" ><div style=\"\"></div></td>";
            }
            html += ident;
            html += "<td colspan=\"" + (20 - level) + "\">";
            if (Array.isArray(node))
            {
                html += "<span class=\"icon icon-arrow-down-right\">[]</span> &nbsp;";
            }
            else if (typeof node === "object")
            {
                html += "<span class=\"icon icon-arrow-down-right\">[]</span> &nbsp;";
            }
            else
            {
                html += "<span class=\"icon icon-circle\">[]</span> &nbsp;";
            }
            html += key;
            html += "</td>";

            html += "<td style='max-width: 100px; overflow: hidden; text-overflow: ellipsis;'>";
            if (!Array.isArray(node) && !(typeof node === "object"))
            {
                html += String(node).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
            html += "</td>";

            html += "<td>";

            let dataType = "Array";
            if (!Array.isArray(node))
            {
                switch (typeof node)
                {
                case "string":
                    dataType = "String";
                    break;
                case "number":
                    dataType = "Number";
                    break;
                default:
                    dataType = "Object";
                    break;
                }
            }
            const hideclass = "";
            html += "<a onclick=\"gui.opPortModal.structureHelper_exposeArray('" + op.id + "', '" + portName + "', '" + path + "', '" + inputDataType + "')\" class=\"treebutton\">Array</a>";
            html += "&nbsp;";
            html += "<a onclick=\"gui.opPortModal.structureHelper_exposeNode('" + op.id + "', '" + portName + "', '" + path + "', '" + dataType + "', '" + inputDataType + "')\" class=\"treebutton " + dataType.toLowerCase() + "\">" + dataType + "</a>";
            html += "</td>";

            html += "</tr>";

            if (node)
            {
                if (Array.isArray(node))
                {
                    for (i = 0; i < node.length; i++)
                    {
                        const newPath = path + "." + i;
                        html = printNode(op, portName, html, i, node[i], newPath, level + 1, inputDataType);
                    }
                }
                else if (typeof node === "object")
                {
                    const children = Object.keys(node);
                    for (i = 0; i < children.length; i++)
                    {
                        const newKey = children[i];
                        const newPath = path + "." + newKey;
                        html = printNode(op, portName, html, newKey, node[newKey], newPath, level + 1, inputDataType);
                    }
                }
            }

            return html;
        }

        function printJsonInfo(json, op, portName, inputDataType = "Object")
        {
            if (!json) return;

            const sizes = {};

            let html = "<div style=\"overflow:scroll;width:100%;height:100%\">";

            let elements = [];
            if (Array.isArray(json))
            {
                elements = json;
            }
            else if (typeof json === "object")
            {
                elements = Object.keys(json);
            }

            html += "<h3>Nodes (" + elements.length + ")</h3>";
            html += "<table class=\"table treetable\">";

            html += "<tr>";
            html += " <th colspan=\"20\">Name</th>";
            html += " <th>Value</th>";
            html += " <th>Expose</th>";
            html += "</tr>";

            for (let i = 0; i < elements.length; i++)
            {
                if (Array.isArray(json))
                {
                    const path = i;
                    html = printNode(op, portName, html, i, json[i], path, 1, inputDataType);
                }
                else if (typeof json === "object")
                {
                    const key = elements[i];
                    const path = key;
                    html = printNode(op, portName, html, key, json[key], path, 1, inputDataType);
                }
            }
            html += "</table>";
            html += "</div>";

            return html;
        }

        try
        {
            const thing = this._port.get();
            let inputDataType = "Object";
            if (Array.isArray(thing))
            {
                inputDataType = "Array";
            }
            const jsonInfo = printJsonInfo(thing, port.op, port.name, inputDataType);

            let fullHTML = "";
            fullHTML += "<h2 class=\"splitter\"><span class=\"icon icon-settings\"></span>&nbsp;Structure</h2>";
            fullHTML += "port: <b>" + title + "</b> of <b>" + port.op.name + "</b> ";
            fullHTML += "<br/><br/>";
            fullHTML += "<a class=\"button \" onclick=\"gui.opPortModal.updatePortStructurePreview('" + title + "')\"><span class=\"icon icon-refresh\"></span>Update</a>";
            fullHTML += "<br/><br/>";
            fullHTML += "<br/><br/>";
            fullHTML += "<pre id=\"portvalue\" class=\"code hljs json\">" + jsonInfo + "</pre>";

            asyncInnerHTML(fullHTML, function (html, fragment)
            {
                modal.updateHtml(html.innerHTML);
            });
        }
        catch (ex)
        {
            let fullHTML = "";
            fullHTML += "<h2><span class=\"splitter icon icon-settings\"></span>&nbsp;Structure</h2>";
            fullHTML += "port: <b>" + title + "</b> of <b>" + port.op.name + "</b> ";
            fullHTML += "<br/><br/>";
            fullHTML += "<pre><code id=\"portvalue\" class=\"code hljs json\">Unable to serialize Array/Object:<br/>" + ex.message + "</code></pre>";

            modal.updateHtml(fullHTML);
        }
    }

    updatePortValuePreview(title)
    {
        this._showPortValue(title);
    }

    updatePortStructurePreview(title)
    {
        this._showPortStructure(title, gui.currentModal, this._port);
    }

    structureHelper_exposeNode(opId, portName, path, dataType, inputDataType = "Object")
    {
        const jsonDataOpName = defaultOps.jsonPathOps[inputDataType + "Get" + dataType];
        if (!jsonDataOpName) return;
        const op = gui.corePatch().getOpById(opId);
        gui.patchView.addOp(
            jsonDataOpName,
            {
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "onOpAdd": (newop) =>
                {
                    newop.setUiAttrib({ "translate": { "x": op.uiAttribs.translate.x, "y": op.uiAttribs.translate.y + GlUiConfig.newOpDistanceY } });

                    newop.getPort("Path").set(path);
                    op.patch.link(op, portName, newop, inputDataType);
                    gui.patchView.centerSelectOp(newop.id);
                    gui.closeModal();
                }
            });
    }

    structureHelper_exposeArray(opId, portName, path, inputDataType = "Object")
    {
        const jsonDataOpName = defaultOps.jsonPathOps[inputDataType + "GetArrayValues"];
        if (!jsonDataOpName) return;

        const op = gui.corePatch().getOpById(opId);
        const newop = gui.corePatch().addOp(jsonDataOpName);

        newop.setUiAttrib({ "translate": { "x": op.uiAttribs.translate.x, "y": op.uiAttribs.translate.y + GlUiConfig.newOpDistanceY } });

        newop.getPort("Path").set(path);
        op.patch.link(op, portName, newop, inputDataType);
        gui.patchView.centerSelectOp(newop.id);
        gui.closeModal();
    }
}
