import ele from "../utils/ele";
import ModalDialog from "./modaldialog";

/**
 * Opens a modal dialog and shows info about given exception
 *
 * options:
 * - title - will replace title
 * - text
 * - codeText - will be shown as monospace font
 * - op: will add an "edit op" button
 * - opname: will show opname
 * - exception: will show stacktrace and exception message. etc.
 *
 * @param {Object} option option object
 * @class
 */
export default class ModalError
{
    constructor(options)
    {
        this._options = options;

        const s = gui.corePatch()._triggerStack;
        let stackStr = "";
        for (let i = 0; i < s.length; i++)
        {
            stackStr += "[" + s[i].parent.objName + " - " + s[i].name + "] ";
            if (i != s.length - 1)stackStr += " -> ";
        }

        if (this._options.exception && this._options.exception.message && this._options.exception.message.indexOf("NetworkError") > -1 && this._options.exception.message.indexOf("/ace/worker") > -1)
        {
            console.log("yay! suppressed nonsense ace editor exception... ");
            return;
        }

        if (this._options.exception && String(this._options.exception.stack).indexOf("file:blob:") == 0)
        {
            console.log("ignore file blob exception...");
            return;
        }

        let info = null;
        if (this._options.exception)
        {
            console.trace();

            try
            {
                if (this._options.exception.error)
                {
                    info = stackinfo(this._options.exception.error);
                }
                else
                {
                    info = stackinfo(this._options.exception);
                }
                if (info && info[0].file)
                {
                    console.log("This is line " + (info[0].line + 1));
                    console.log("This is file " + (info[0].file));

                    this._getFileSnippet(info[0].file, info[0].line, function (html)
                    {
                        const el = ele.byId("stackFileContent");

                        if (el)
                        {
                            el.style.display = "block";
                            el.innerHTML = html;
                        }
                    });
                }
            }
            catch (e)
            {
                // browser not supported, we don't care at this point
            }

            console.log("exception:", this._options.exception, info);
        }

        let doTrack = true;
        if (this._options.opname)
        {
            if (this._options.opname.startsWith("Ops.Cables.CustomOp")) doTrack = false;
            if (this._options.opname.startsWith("Ops.User.")) doTrack = false;

            if (window.gui)
            {
                const ops = gui.corePatch().getOpsByObjName(this._options.opname);
                for (let i = 0; i < ops.length; i++)
                {
                    ops[i].uiAttr({ "error": "exception occured - op stopped - reload to run again" });
                }
            }
        }

        CABLES.lastError = { "exception": this._options.exception,
            "opName": this._options.opname,
            "opTriggerStack": stackStr,
            "stackInfo": info,
            "triggerStack": this._options.triggerStack };
        if (window.gui && doTrack) gui.emitEvent("uncaughtError", CABLES.api.getErrorReport());

        const modalOptions = {
            "title": this._options.title || "cablefail :/",
            "html": this.getHtml()
        };

        this._dialog = new ModalDialog(modalOptions);
    }


    _getFileSnippet(url, line, cb)
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
                    if (i === linesAround)
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
    }

    getHtml()
    {
        let str = "";

        if (this._options.opname)
            str += "Error in op: <b>" + this._options.opname + "</b><br/><br/>";

        if (this._options.text)
            str += this._options.text + "<br/><br/>";

        if (this._options.codeText)
            str += "<div class=\"shaderErrorCode\">" + this._options.codeText + "</div>";

        if (this._options.exception)
        {
            str += this._options.exception.message + "<br/>";
            if (this._options.exception.stack)
            {
                const stackClean = document.createElement("div");
                stackClean.innerHTML = this._options.exception.stack;
                str += "<br/>stacktrace:<br/>";
                str += "<div class=\"shaderErrorCode\">" + stackClean.innerText + "</div><br/>";
                stackClean.remove();
            }
            if (this._options.exception.customMessage)
            {
                str += "<br/><br/>";
                str += "<div class=\"shaderErrorCode\">" + this._options.exception.customMessage + "</div><br/>";
            }
        }
        str += "<div class=\"shaderErrorCode hidden\" id=\"stackFileContent\"></div><br/>";

        let isCustomOp = false;
        let isUserOp = false;
        if (this._options.opname)
        {
            isUserOp = this._options.opname.startsWith("Ops.User.");
            isCustomOp = this._options.opname.startsWith("Ops.Cables.CustomOp");
            if (isCustomOp && this._op)
            {
                const codePortName = "JavaScript";
                str += "<a class=\"button \" onclick=\"CABLES.UI.paramsHelper.openParamStringEditor('" + this._options.op.id + "', '" + codePortName + "', null, true);gui.closeModal();\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
            }
            else
            {
                if (window.gui && (gui.user.isAdmin || this._options.opname.startsWith("Ops.User." + gui.user.usernameLowercase)))
                {
                    str += "<a class=\"button \" onclick=\"gui.serverOps.edit('" + this._options.opname + "');gui.closeModal();\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
                }
            }
        }

        str += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";
        str += "<a class=\"button\" target=\"_blankk\" href=\"https://github.com/cables-gl/cables_docs/issues\"><span class=\"icon icon-message\"></span>Report a problem</a>&nbsp;&nbsp;";

        if (!isCustomOp && !isUserOp)
        {
            if (CABLES && CABLES.sandbox && CABLES.sandbox.isDevEnv() && gui && gui.user && !gui.user.isAdmin)
            {
                CABLES.api.sendErrorReport(CABLES.lastError, false);
                str += "<br/><br/>Dev Environment: An automated error report has been created. We will look into it!";
            }
            else
            {
                str += "<a class=\"button \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Log</a>&nbsp;&nbsp;";
            }
        }

        return str;
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
