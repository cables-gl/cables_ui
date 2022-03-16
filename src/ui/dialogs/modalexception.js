import ModalDialog from "./modaldialog";

/**
 * Opens a modal dialog and shows info about given exception
 *
 * @param {exception} exception
 * @param {Object} option option object
 * @class
 */
export default class ModalException
{
    constructor(exception, options)
    {
        this._exception = exception;

        if (exception && exception.message && exception.message.indexOf("NetworkError") > -1 && exception.message.indexOf("/ace/worker") > -1)
        {
            console.log("yay! suppressed nonsense ace editor exception... ");
            return;
        }

        this._op = null;
        if (options)
        {
            if (options.opname) this._opname = options.opname;
            if (options.op)
            {
                this._opname = options.op.name;
                this._op = options.op;
            }
        }

        if (String(this._exception.stack).indexOf("file:blob:") == 0)
        {
            console.log("ignore file blob exception...");
            return;
        }

        this.options = {
            "title": "cablefail :/",
            "html": this.getHtml()
        };

        this._dialog = new ModalDialog(this.options);

        if (this._exception)
        {
            console.trace();

            const info = stackinfo(this._exception);

            console.log("exception:", this._exception, info);

            if (info && info[0].file)
            {
                console.log("This is line " + (info[0].line + 1));
                console.log("This is file " + (info[0].file));

                this._getFileSnippet(info[0].file, info[0].line, function (html)
                {
                    document.getElementById("stackFileContent").style.display = "block";
                    document.getElementById("stackFileContent").innerHTML = html;
                });
            }
        }

        if (this._opname)
        {
            const ops = gui.corePatch().getOpsByObjName(this._opname);
            for (let i = 0; i < ops.length; i++)
            {
                ops[i].uiAttr({ "error": "exception occured - op stopped - reload to run again" });
            }
        }
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
    }

    getHtml()
    {
        let str = "";

        if (this._opname)
            str += "Error in op: <b>" + this._opname + "</b><br/><br/>";

        if (this._exception)
        {
            str += "<div class=\"shaderErrorCode\">" + this._exception.message + "</div><br/>";
            if (this._exception.stack)
            {
                str += "<div class=\"shaderErrorCode\">" + this._exception.stack + "</div><br/>";
            }
            if (this._exception.customMessage)
            {
                str += "<div class=\"shaderErrorCode\">" + this._exception.customMessage + "</div><br/>";
            }
        }
        str += "<div class=\"shaderErrorCode hidden\" id=\"stackFileContent\"></div><br/>";

        CABLES.lastError = { "exception": this._exception, "opname": this._opname };

        let isCustomOp = false;
        if (this._opname)
        {
            isCustomOp = this._opname.startsWith("Ops.Cables.CustomOp");
            if (isCustomOp && this._op)
            {
                const codePortName = "JavaScript";
                str += "<a class=\"button \" onclick=\"CABLES.UI.paramsHelper.openParamStringEditor('" + this._op.id + "', '" + codePortName + "', null, true);gui.closeModal();\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
            }
            else
            {
                if (gui.user.isAdmin || this._opname.startsWith("Op.User." + gui.user.usernameLowercase))
                {
                    str += "<a class=\"button \" onclick=\"gui.serverOps.edit('" + this._opname + "');gui.closeModal();\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
                }
            }
        }

        if (!isCustomOp)
        {
            gui.emitEvent("uncaughtError", CABLES.api.getErrorReport());
            str += "<a class=\"button \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>&nbsp;&nbsp;";
        }
        str += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

        return str;
    }


    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
