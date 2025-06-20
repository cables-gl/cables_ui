import { Logger } from "cables-shared-client";
import ModalDialog from "../../dialogs/modaldialog.js";
import GlUiConfig from "../../glpatch/gluiconfig.js";
import defaultOps from "../../defaultops.js";
import { gui } from "../../gui.js";

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
        const modal = new ModalDialog({
            "title": "Structure of " + port.op.name + "/" + port.name
        });
        this._showPortStructure(port.name, modal, port);
    }

    _showPortStructure(title, modal, port)
    {
        const elementsLimit = 5;

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
            html += "<a onclick=\"gui.opPortModal.structureHelper_exposeArray('" + op.id + "', '" + portName + "', '" + path + "', '" + inputDataType + "')\" class=\"treebutton\">Array</a>";
            html += "&nbsp;";
            html += "<a onclick=\"gui.opPortModal.structureHelper_exposeNode('" + op.id + "', '" + portName + "', '" + path + "', '" + dataType + "', '" + inputDataType + "')\" class=\"treebutton " + dataType.toLowerCase() + "\">" + dataType + "</a>";
            html += "</td>";

            html += "</tr>";

            let numNodes = 0;
            if (node)
            {
                if (Array.isArray(node))
                {
                    for (i = 0; i < node.length; i++)
                    {
                        if (i > elementsLimit)
                        {
                            numNodes = node.length;
                            break;
                        }
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

            if (numNodes > elementsLimit)
            {
                html += "<tr>";
                for (i = 0; i < level; i++)
                {
                    let identClass = "identBg";
                    if (i == 0)identClass = "identBgLevel0";
                    ident += "<td class=\"ident  " + identClass + "\" ><div style=\"\"></div></td>";
                }
                html += ident;
                html += "<td colspan=\"" + (20 - level) + "\">";
                html += "and " + (numNodes - elementsLimit) + " <a onclick=\"new CABLES.UI.TabPortObjectInspect('" + op.id + "','" + portName + "');\">more...</a>";
                html += "</td>";
                html += "</tr>";
            }
            return html;
        }

        function printJsonInfo(json, op, portName, inputDataType = "Object")
        {
            if (!json) return;

            let html = "<div style=\"overflow:scroll;width:100%;height:100%\">";

            let elements = [];
            let typeTitle = "";
            let moreHtml = "";
            let limitText = "";

            if (Array.isArray(json))
            {
                typeTitle = "Array ";
                elements = json;
            }
            else if (typeof json === "object")
            {
                typeTitle = "Object ";
                elements = Object.keys(json);
            }

            if (Array.isArray(json) && elements.length > elementsLimit)
            {
                limitText = " showing first " + elementsLimit;
                moreHtml = "<tr>";
                moreHtml += " <td colspan=\"20\">";
                moreHtml += "and " + (elements.length - elementsLimit) + " <a onclick=\"new CABLES.UI.TabPortObjectInspect('" + op.id + "','" + portName + "');\">more...</a>";
                moreHtml += "</td>";
                moreHtml += " <td></td>";
                moreHtml += " <td></td>";
                moreHtml += "</tr>";
            }

            html += "<h3 style='margin-top: 0;'>" + typeTitle + "Nodes (" + elements.length + limitText + ")</h3>";
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
                    if (i > elementsLimit) break;
                    html = printNode(op, portName, html, i, json[i], i, 1, inputDataType);
                }
                else if (typeof json === "object")
                {
                    const key = elements[i];
                    html = printNode(op, portName, html, key, json[key], key, 1, inputDataType);
                }
            }
            html += moreHtml;
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
            fullHTML += "<br/>";
            fullHTML += "<a class=\"button \" onclick=\"gui.opPortModal.updatePortStructurePreview('" + title + "')\"><span class=\"icon icon-refresh\"></span>Update</a>";
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
            fullHTML += "<pre><code id=\"portvalue\" class=\"code hljs json\">Unable to serialize Array/Object:<br/>" + ex.message + "</code></pre>";
            modal.updateHtml(fullHTML);
        }
    }

    updatePortStructurePreview(title)
    {
        this._showPortStructure(title, gui.currentModal, this._port);
    }

    structureHelper_exposeNode(opId, portName, path, dataType, inputDataType = "Object")
    {
        let byPath = "";
        if (path && path.includes(".")) byPath = "ByPath";
        const jsonDataOp = defaultOps.jsonPathOps[inputDataType + "Get" + dataType + byPath];
        if (!jsonDataOp) return;

        const op = gui.corePatch().getOpById(opId);
        this._createOp(op, jsonDataOp, path, portName);
    }

    structureHelper_exposeArray(opId, portName, path, inputDataType = "Object")
    {
        const jsonDataOp = defaultOps.jsonPathOps[inputDataType + "GetArrayValues"];
        if (!jsonDataOp) return;

        const op = gui.corePatch().getOpById(opId);
        this._createOp(op, jsonDataOp, path, portName);
    }

    _createOp(op, jsonDataOp, path, portName)
    {
        gui.patchView.addOp(
            jsonDataOp.opName,
            {
                "subPatch": gui.patchView.getCurrentSubPatch(),
                "onOpAdd": (newop) =>
                {
                    newop.setUiAttrib({
                        "translate": {
                            "x": op.uiAttribs.translate.x,
                            "y": op.uiAttribs.translate.y + GlUiConfig.newOpDistanceY
                        }
                    });

                    newop.getPort(jsonDataOp.keyPort).set(path);
                    op.patch.link(op, portName, newop, jsonDataOp.dataPort);
                    gui.patchView.centerSelectOp(newop.id);
                    gui.closeModal();
                }
            });
    }
}
