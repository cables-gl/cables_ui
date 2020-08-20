// http://html5doctor.com/drag-and-drop-to-server/


CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.MODAL = CABLES.UI.MODAL || {};
CABLES.UI.MODAL._visible = false;
CABLES.UI.MODAL.contentElement = null;
CABLES.UI.MODAL.headerElement = null; // the (small) header shown in the title bar of the modal

CABLES.UI.MODAL.hideLoading = function ()
{
    if (document.querySelectorAll(".modalLoading").length > 0)
    {
        CABLES.UI.MODAL.hide();
    }
};

CABLES.UI.MODAL.init = function (options)
{
    options = options || {};
    if (window.gui)gui.showCanvasModal(false);

    if (CABLES.UI.MODAL.contentElement)
    {
        CABLES.UI.MODAL.contentElement.style.display = "none";
    }
    CABLES.UI.MODAL.contentElement = document.getElementById("modalcontent");
    CABLES.UI.MODAL.headerElement = document.getElementById("modalheader");
    CABLES.UI.MODAL.headerElement.innerHTML = "";
    if (options && options.element)
    {
        CABLES.UI.MODAL.contentElement = document.querySelector(options.element);
    }
    else
    {
        CABLES.UI.MODAL.contentElement.innerHTML = "";
    }

    document.getElementById("modalcontainer").classList.remove("transparent");
    if (!options.nopadding)
    {
        CABLES.UI.MODAL.contentElement.style.padding = "15px";
    }
};

CABLES.UI.MODAL.isVisible = function ()
{
    return CABLES.UI.MODAL._visible;
};

CABLES.UI.MODAL._setVisible = function (visible)
{
    if (visible)
    {
        CABLES.UI.MODAL._visible = true;

        CABLES.UI.MODAL.contentElement.style.display = "block";

        document.getElementById("modalcontainer").style.display = "block";
        document.getElementById("modalcontainer").style.top = "10%";
        CABLES.UI.MODAL.contentElement.style.top = "10%";
    }
    else
    {
        CABLES.UI.MODAL._visible = false;
        CABLES.UI.MODAL.contentElement.style.display = "none";
        CABLES.UI.MODAL.contentElement.style.top = "-999100px";
        document.getElementById("modalcontainer").style.display = "none";
    }
};

CABLES.UI.MODAL.hide = function (force)
{
    if (CABLES.UI.MODAL.onClose)CABLES.UI.MODAL.onClose();

    if (!force && document.querySelectorAll(".modalerror").length > 0)
    {
        console.log("not forcing close");
        return;
    }

    document.getElementById("modalclose").style.display = "block";
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL._setVisible(false);
    CABLES.UI.MODAL.contentElement.classList.remove("nopadding");
    document.getElementById("modalbg").style.display = "none";
    Array.from(document.querySelectorAll(".tooltip")).forEach((e) =>
    {
        e.style.display = "none";
    });
};

CABLES.UI.MODAL.showTop = function (content, options)
{
    CABLES.UI.MODAL.show(content, options);
};

CABLES.UI.MODAL.setTitle = function (title)
{
    if (title)
    {
        document.getElementById("modalheader").innerHTML = title;
        document.getElementById("modalheader").style.display = "block";
    }
    else
    {
        document.getElementById("modalheader").style.display = "none";
    }
};


CABLES.UI.MODAL.show = function (content, options)
{
    if (CABLES.UI.MODAL.contentElement && options && !options.ignoreTop) CABLES.UI.MODAL.contentElement.style.top = "5%";

    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init(options);

    if (options)
    {
        CABLES.UI.MODAL.setTitle(options.title);
        CABLES.UI.MODAL.onClose = options.onClose;


        if (options.transparent) document.getElementById("modalcontainer").classList.add("transparent");
        if (options.nopadding)
        {
            document.getElementById("modalcontainer").style.padding = "0px";
            CABLES.UI.MODAL.contentElement.classList.add("nopadding");
        }
    }
    else
    {
        CABLES.UI.MODAL.onClose = null;
        document.getElementById("modalcontainer").classList.remove("transparent");
    }

    if (content)
        CABLES.UI.MODAL.contentElement.innerHTML += content;

    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";
    gui.callEvent("showModal");
};

CABLES.UI.MODAL.showLoading = function (title, content)
{
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML = "<div class=\"modalLoading\" style=\"text-align:center;\"><h3>" + title + "</h3><div class=\"loading\" style=\"margin-top:0px;\"><br/><br/><div>";
    if (content)
    {
        CABLES.UI.MODAL.contentElement.innerHTML += content;
    }
    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";
};


CABLES.UI.MODAL.showClose = function ()
{
    document.getElementById("modalclose").style.display = "block";
};

CABLES.UI.MODAL.showError = function (title, content)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML = "<h2><span class=\"fa modalerror fa-exclamation-triangle\"></span>&nbsp;" + title + "</h2>";
    if (content)
    {
        CABLES.UI.MODAL.contentElement.innerHTML += content;
    }
    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";

    Array.from(document.querySelectorAll(".shadererrorcode")).forEach(function (block)
    {
        hljs.highlightBlock(block);
    });
};

CABLES.UI.MODAL.getFileSnippet = function (url, line, cb)
{
    CABLES.ajax(
        url,
        function (err, _data, xhr)
        {
            if (err)
            {
                cb("err");
            }
            const lines = _data.split("\n");
            const linesAround = 4;
            const sliced = lines.slice(line - (linesAround + 1), line + linesAround);
            let html = "";
            for (const i in sliced)
            {
                if (i == linesAround)
                {
                    html += "<span class=\"error\">";
                    CABLES.lastError.errorLine = sliced[i];
                }
                html += sliced[i];
                html += "</span>";
                html += "<br/>";
            }
            cb(html);
        });
};

CABLES.UI.MODAL.showOpException = function (ex, opName)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.setTitle("op cablefail :/");

    CABLES.UI.MODAL.contentElement.innerHTML += "Error in op: <b>" + opName + "</b><br/><br/>";

    if (ex)
    {
        CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.message + "</div><br/>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.stack + "</div><br/>";
    }
    CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode hidden\" id=\"stackFileContent\"></div><br/>";

    if (ex)
    {
        console.trace();

        const info = stackinfo(ex);
        console.log("ex:", ex, info);
        if (info && info[0].file)
        {
            console.log("This is line " + (info[0].line + 1));
            console.log("This is file " + (info[0].file));

            CABLES.UI.MODAL.getFileSnippet(info[0].file, info[0].line, function (html)
            {
                document.getElementById("stackFileContent").style.display = "block";
                document.getElementById("stackFileContent").innerHTML = html;
            });
        }
    }

    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";

    const ops = gui.corePatch().getOpsByObjName(opName);
    for (let i = 0; i < ops.length; i++)
    {
        ops[i].uiAttr({ "error": "exception occured - op stopped - reload to run again" });
    }

    if (gui.user.isAdmin || opName.startsWith("Op.User." + gui.user.usernameLowercase))
    {
        CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button fa fa-edit\" onclick=\"gui.serverOps.edit('" + opName + "');CABLES.UI.MODAL.hide(true);\">Edit op</a> &nbsp;&nbsp;";
    }

    CABLES.lastError = { "exception": ex, opName };

    // TODO API?
    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button fa fa-bug\" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>&nbsp;&nbsp;";
    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";
};

CABLES.UI.MODAL.showException = function (ex, op)
{
    if (String(ex.stack).indexOf("file:blob:") == 0)
    {
        console.log("ignore file blob exception...");
        return;
    }
    if (op)
    {
        CABLES.UI.MODAL.showOpException(ex, op.objName);
        return;
    }
    console.log(ex.stack);
    if (!CABLES.UI.loaded)
    {
        let html = "";
        html += "<div class=\"startuperror\"><b>error</b>\n";
        html += "<br/>";
        html += ex.message;
        html += "<br/><br/><a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\">reload</a>";
        html += "</div>";

        document.body.innerHTML += html;
    }
    CABLES.UI.MODAL.showClose();

    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"fa fa-exclamation-triangle\"></span>&nbsp;cablefail :/</h2>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.message + "</div><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.stack + "</div>";

    CABLES.lastError = { "exception": ex };
    // TODO API
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><a class=\"bluebutton fa fa-bug\" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>";

    CABLES.UI.MODAL._setVisible(true);

    document.getElementById("modalbg").style.display = "block";
};


CABLES.UI.notifyError = function (title, text)
{
    iziToast.error(
        {
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": false,
            "timeout": 2000
        });
};

CABLES.UI.lastNotify = "";
CABLES.UI.lastText = "";


CABLES.UI.notify = function (title, text)
{
    if (title == CABLES.UI.lastNotify && text == CABLES.UI.lastText)
    {
        setTimeout(function ()
        {
            CABLES.UI.lastNotify = "";
            CABLES.UI.lastText = "";
        }, 1000);
        return;
    }

    CABLES.UI.lastNotify = title;
    CABLES.UI.lastText = text;

    iziToast.show(
        {
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": false,
            "timeout": 2000
        });
};

CABLES.UI.MODAL.updatePortValuePreview = function (title)
{
    CABLES.UI.MODAL.showPortValue(title, CABLES.UI.MODAL.PORTPREVIEW);
};

CABLES.UI.MODAL.updatePortStructurePreview = function (title)
{
    CABLES.UI.MODAL.showPortStructure(title, CABLES.UI.MODAL.PORTSTRUCTUREPREVIEW);
};

CABLES.UI.MODAL.showPortValue = function (title, port)
{
    function convertHTML(str)
    {
        const regex = /[&|<|>|"|']/g;
        const htmlString = str.replace(regex, function (match)
        {
            if (match === "&") return "&amp;";
            else if (match === "<") return "&lt;";
            else if (match === ">") return "&gt;";
            else if (match === "\"") return "&quot;";
            else return "&apos;";
        });
        return htmlString;
    }


    try
    {
        CABLES.UI.MODAL.PORTPREVIEW = port;
        CABLES.UI.MODAL.showClose();
        CABLES.UI.MODAL.init();
        CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"fa fa-search\"></span>&nbsp;inspect</h2>";
        CABLES.UI.MODAL.contentElement.innerHTML += "port: <b>" + title + "</b> of <b>" + port.parent.name + "</b> ";
        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.UI.MODAL.updatePortValuePreview('" + title + "')\">update</a>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        const thing = port.get();

        if (thing && thing.constructor)
        {
            CABLES.UI.MODAL.contentElement.innerHTML += "" + thing.constructor.name + " \n";

            if (thing.constructor.name == "Array") CABLES.UI.MODAL.contentElement.innerHTML += " - length:" + thing.length + "\n";
            if (thing.constructor.name == "Float32Array") CABLES.UI.MODAL.contentElement.innerHTML += " - length:" + thing.length + "\n";
        }

        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<pre id=\"portvalue\" class=\"code hljs json\">" + convertHTML(JSON.stringify(thing, null, 2)) + "</pre>";

        CABLES.UI.MODAL._setVisible(true);

        document.getElementById("modalbg").style.display = "block";

        hljs.highlightBlock(document.getElementById("portvalue"));
    }
    catch (ex)
    {
        console.log(ex);
    }
};

CABLES.UI.MODAL.showPortStructure = function (title, port)
{
    function printNode(op, portName, html, key, node, path, level)
    {
        html += "<tr class=\"row\">";
        let i = 0;
        let ident = "";

        for (i = 0; i < level; i++)
        {
        // var last=level-1==i;
        // var identClass=last?"identnormal":"identlast";

            let identClass = "identBg";
            if (i == 0)identClass = "identBgLevel0";
            // if(i==level-1)identClass="identBgLast";
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
            html += node;
        }
        html += "</td>";

        html += "<td>";
        // if (!(Array.isArray(node) && level == 1))
        {
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
            html += "<a onclick=\"CABLES.UI.MODAL.showPortStructureHelpers.exposeArray('" + op.id + "', '" + portName + "', '" + path + "')\" class=\"treebutton\">Array</a>";
            html += "&nbsp;";
            html += "<a onclick=\"CABLES.UI.MODAL.showPortStructureHelpers.exposeNode('" + op.id + "', '" + portName + "', '" + path + "', '" + dataType + "')\" class=\"treebutton\">Value</a>";
        }
        html += "</td>";

        html += "</tr>";

        if (Array.isArray(node))
        {
            for (i = 0; i < node.length; i++)
            {
                const newPath = path + "." + i;
                html = printNode(op, portName, html, i, node[i], newPath, level + 1);
            }
        }
        else if (typeof node === "object")
        {
            const children = Object.keys(node);
            for (i = 0; i < children.length; i++)
            {
                const newKey = children[i];
                const newPath = path + "." + newKey;
                html = printNode(op, portName, html, newKey, node[newKey], newPath, level + 1);
            }
        }

        return html;
    }

    function printJsonInfo(json, op, portName)
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
                html = printNode(op, portName, html, i, json[i], path, 1);
            }
            else if (typeof json === "object")
            {
                const key = elements[i];
                const path = key;
                html = printNode(op, portName, html, key, json[key], path, 1);
            }
        }
        html += "</table>";
        html += "</div>";

        return html;

        // closeTab();
        // tab = new CABLES.UI.Tab("JSON", { "icon": "cube", "infotext": "tab_json", "padding": true, "singleton": true });
        // gui.mainTabs.addTab(tab, true);
        // tab.html(html);
    }

    try
    {
        CABLES.UI.MODAL.PORTSTRUCTUREPREVIEW = port;
        CABLES.UI.MODAL.showClose();
        CABLES.UI.MODAL.init();
        CABLES.UI.MODAL.contentElement.append("<h2><span class=\"fa fa-gear\"></span>&nbsp;structure</h2>");
        CABLES.UI.MODAL.contentElement.append("port: <b>" + title + "</b> of <b>" + port.parent.name + "</b> ");
        CABLES.UI.MODAL.contentElement.append("<br/><br/>");
        CABLES.UI.MODAL.contentElement.append("<a class=\"button fa fa-refresh\" onclick=\"CABLES.UI.MODAL.updatePortStructurePreview('" + title + "')\">update</a>");
        CABLES.UI.MODAL.contentElement.append("<br/><br/>");
        const thing = port.get();

        CABLES.UI.MODAL.contentElement.append("<br/><br/>");
        CABLES.UI.MODAL.contentElement.append("<pre id=\"portvalue\" class=\"code hljs json\">" + printJsonInfo(thing, port.parent, port.name) + "</pre>");

        CABLES.UI.MODAL._setVisible(true);

        document.getElementById("modalbg").style.display = "block";

        hljs.highlightBlock(document.getElementById("portvalue"));
    }
    catch (ex)
    {
        console.log(ex);
    }
};
CABLES.UI.MODAL.showPortStructureHelpers = {};
CABLES.UI.MODAL.showPortStructureHelpers.exposeNode = function (opId, portName, path, dataType)
{
    const op = gui.corePatch().getOpById(opId);
    const newop = gui.corePatch().addOp(`Ops.Json.${dataType}GetByPath`);
    newop.getPort("Path").set(path);
    op.patch.link(op, portName, newop, "Object");
    gui.patch().focusOp(newop.id, true);
    CABLES.UI.MODAL.hide();
};

CABLES.UI.MODAL.showPortStructureHelpers.exposeArray = function (opId, portName, path)
{
    const op = gui.corePatch().getOpById(opId);
    const newop = gui.corePatch().addOp("Ops.Json.ObjectGetArrayByPath");
    newop.getPort("Path").set(path);
    op.patch.link(op, portName, newop, "Object");
    gui.patch().focusOp(newop.id, true);
    CABLES.UI.MODAL.hide();
};

CABLES.UI.MODAL.showCode = function (title, code, type)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"fa fa-search\"></span>&nbsp;inspect</h2>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<b>" + title + "</b> ";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";

    code = code || "";
    code = code.replace(/\</g, "&lt;"); // for <
    code = code.replace(/\>/g, "&gt;"); // for >

    CABLES.UI.MODAL.contentElement.innerHTML += "<pre><code class=\"" + (type || "javascript") + "\">" + code + "</code></pre>";
    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";
    Array.from(document.querySelectorAll("pre code")).forEach(function (block)
    {
        hljs.highlightBlock(block);
    });
};

CABLES.UI.MODAL.promptCallbackExec = function ()
{
    if (CABLES.UI.MODAL.promptCallback)
    {
        const v = document.getElementById("modalpromptinput").value;
        CABLES.UI.MODAL.hide();
        CABLES.UI.MODAL.promptCallback(v);
    }
    else
    {
        console.log("no callback found for prompt");
    }
};

CABLES.UI.MODAL.prompt = function (title, text, value, callback)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    CABLES.UI.MODAL.promptCallback = callback;

    CABLES.UI.MODAL.contentElement.innerHTML += "<h2>" + title + "</h2>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<b>" + text + "</b> ";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<input id=\"modalpromptinput\" class=\"medium\" value=\"" + (value || "") + "\"/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"bluebutton\" onclick=\"CABLES.UI.MODAL.promptCallbackExec()\">&nbsp;&nbsp;&nbsp;ok&nbsp;&nbsp;&nbsp;</a>";
    CABLES.UI.MODAL.contentElement.innerHTML += "&nbsp;&nbsp;<a class=\"greybutton\" onclick=\"CABLES.UI.MODAL.hide()\">&nbsp;&nbsp;&nbsp;cancel&nbsp;&nbsp;&nbsp;</a>";
    CABLES.UI.MODAL._setVisible(true);

    document.getElementById("modalbg").style.display = "block";

    setTimeout(function ()
    {
        document.getElementById("modalpromptinput").focus();
        document.getElementById("modalpromptinput").select();
    }, 100);

    document.getElementById("modalpromptinput").addEventListener("keydown",
        function (e)
        {
            if (e.which == 13)
            {
                CABLES.UI.MODAL.promptCallbackExec();
                e.preventDefault();
            }
        });
};


window.onerror = function (err, file, row)
{
    setTimeout(function ()
    {
        if (!CABLES.lastError)
        {
            CABLES.UI.MODAL.showException({ "message": err, "stack": "file:" + file + " / row:" + row });
        }
    }, 100);
};
