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
    if (window.gui && gui.canvasUi)gui.canvasUi.showCanvasModal(false);

    if (CABLES.UI.MODAL.contentElement)
        CABLES.UI.MODAL.contentElement.style.display = "none";

    CABLES.UI.MODAL.contentElement = document.getElementById("modalcontent");
    CABLES.UI.MODAL.headerElement = document.getElementById("modalheader");
    if (CABLES.UI.MODAL.headerElement)
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
    if (!force && document.querySelectorAll(".modalerror").length > 0)
    {
        return;
    }

    if (CABLES.UI.MODAL.onClose)CABLES.UI.MODAL.onClose();

    document.getElementById("modalclose").style.display = "block";
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL._setVisible(false);
    CABLES.UI.MODAL.contentElement.classList.remove("nopadding");
    document.getElementById("modalbg").style.display = "none";

    CABLES.UI.hideToolTip();
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
    gui.emitEvent("showModal");
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
    if (document.getElementById("modalclose"))
        document.getElementById("modalclose").style.display = "block";
};

CABLES.UI.MODAL.showError = function (title, content)
{
    CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML = "<h2><span class=\"icon icon-2x icon-alert-triangle\"></span> " + title + "</h2>";


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
        if (ex.stack)
        {
            CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.stack + "</div><br/>";
        }
        if (ex.customMessage)
        {
            CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.customMessage + "</div><br/>";
        }
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
        CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button \" onclick=\"gui.serverOps.edit('" + opName + "');CABLES.UI.MODAL.hide(true);\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
    }

    CABLES.lastError = { "exception": ex, opName };

    // TODO API?
    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>&nbsp;&nbsp;";
    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";
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

    console.log(ex, ex.stack);

    if (!CABLES.UI.loaded)
    {
        let html = "";
        html += "<div class=\"startUpError\"><b>error</b>\n";
        html += "<br/>";
        html += ex.message;
        html += "<br/><br/><a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\">reload</a>";
        html += "</div>";

        document.body.innerHTML += html;
    }
    CABLES.UI.MODAL.showClose();

    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"icon icon-2x icon-alert-triangle\"></span> cablefail :/</h2>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.message + "</div><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<div class=\"shaderErrorCode\">" + ex.stack + "</div>";

    CABLES.lastError = { "exception": ex };
    // TODO API
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><a class=\"bluebutton \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>";

    CABLES.UI.MODAL._setVisible(true);

    document.getElementById("modalbg").style.display = "block";
};

// CABLES.UI.MODAL.copyPortValuePreview = function (e, title)
// {
//     navigator.clipboard
//         .writeText(JSON.stringify(CABLES.UI.MODAL.PORTPREVIEW.get()))
//         .then(() =>
//         {
//             CABLES.UI.notify("Copied value to clipboard?????");
//         })
//         .catch((err) =>
//         {
//             console.warn("copy to clipboard failed", err);
//         });

//     // console.log(e);
//     // const objStr = JSON.stringify(CABLES.UI.MODAL.PORTPREVIEW.get());
//     // CABLES.UI.notify("Copied title");
//     // e.clipboardData.setData("text/plain", objStr);
// };


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
        CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"icon icon-search\"></span>&nbsp;Inspect</h2>";
        CABLES.UI.MODAL.contentElement.innerHTML += "Port: <b>" + title + "</b> of <b>" + port.parent.name + "</b> ";
        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button \" onclick=\"CABLES.UI.MODAL.updatePortValuePreview('" + title + "')\"><span class=\"icon icon-refresh\"></span>Update</a>";
        CABLES.UI.MODAL.contentElement.innerHTML += "&nbsp;";
        CABLES.UI.MODAL.contentElement.innerHTML += "<a id=\"copybutton\" class=\"button \" ><span class=\"icon icon-copy\"></span>Copy</a>";

        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        const thing = port.get();

        if (thing && thing.constructor)
        {
            CABLES.UI.MODAL.contentElement.innerHTML += "" + thing.constructor.name + " \n";

            if (thing.constructor.name == "Array") CABLES.UI.MODAL.contentElement.innerHTML += " - length: " + thing.length + "\n";
            if (thing.constructor.name == "Float32Array") CABLES.UI.MODAL.contentElement.innerHTML += " - length: " + thing.length + "\n";
        }

        CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
        CABLES.UI.MODAL.contentElement.innerHTML += "<pre id=\"portvalue\" class=\"code hljs json\">" + convertHTML(JSON.stringify(thing, null, 2)) + "</pre>";

        CABLES.UI.MODAL._setVisible(true);

        document.getElementById("modalbg").style.display = "block";

        hljs.highlightBlock(document.getElementById("portvalue"));

        ele.byId("copybutton").addEventListener("click", (e) =>
        {
            CABLES.UI.MODAL.copyPortValuePreview(e, title);
        });
    }
    catch (ex)
    {
        console.log(ex);
    }
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


// todo: use modaldialog and remove
CABLES.UI.MODAL.prompt = function (title, text, value, callback)
{
    console.log("deprecated CABLES.UI.MODAL.prompt, use CABLES.UI.ModalDialog");
    new CABLES.UI.ModalDialog({
        "prompt": true,
        "title": title,
        "text": text,
        "promptValue": value,
        "promptOk": callback
    });
};
