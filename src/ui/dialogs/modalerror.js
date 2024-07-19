import { ele, Logger } from "cables-shared-client";
import defaultOps from "../defaultops.js";
import ModalDialog from "./modaldialog.js";

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


        const s = typeof gui !== "undefined" ? gui.corePatch()._triggerStack : [];
        let stackStr = "";
        for (let i = 0; i < s.length; i++)
        {
            stackStr += "[" + s[i].op.objName + " - " + s[i].name + "] ";
            if (i != s.length - 1)stackStr += " -> \n";
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

        this.opDoc = null;

        if (this._options.exception && this._options.exception.cause && this._options.exception.cause.indexOf("opId:") == 0)
        {
            const opid = this._options.exception.cause.substring("opId:".length);

            this.opDoc = gui.opDocs.getOpDocById(opid);

            if (this.opDoc.forbidden) this._options.title = "Forbidden Op";
            if (this.opDoc) this._options.opname = this.opDoc.name;

            if (this.opDoc.forbidden) this._options.exception = null;
        }

        let info = null;
        let stack = null;
        if (this._options.exception)
        {
            // console.trace();
            try
            {
                console.log(this._options);
                if (this._options.exception.error)
                {
                    info = stackinfo(this._options.exception.error);
                    stack = this._options.exception.error.stack;
                }
                else
                {
                    info = stackinfo(this._options.exception);
                    stack = this._options.exception.stack;
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
                            ele.show(el);
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
            if (this._options.exception && this._options.exception.error && this._options.exception.error.message) this._options.title = this._options.exception.error.message;
        }

        let doTrack = true;

        // try to get opname:
        // try to get opname from stracktrace, if given
        // if an acual op is given use the objName of that op
        // otherwise try to use the opname given in options, if set
        this.opName = "";
        if (stack && stack.startsWith(defaultOps.getOpsPrefix()))
        {
            this.opName = stack.split("/", 1)[0];
            this.opName = this.opName.substring(0, 128);
        }
        if (this._options.opname) this.opName = this._options.opname;
        if (this._options.op && this._options.op.objName) this.opName = this._options.op.objName;

        if (this.opName)
        {
            // do not track errors in patchops/userops/teamops
            if (defaultOps.isPrivateOp(this.opName)) doTrack = false;
            if (window.gui)
            {
                const ops = gui.corePatch().getOpsByObjName(this.opName);
                for (let i = 0; i < ops.length; i++)
                {
                    ops[i].uiAttr({ "error": "exception occured - op stopped - reload to run again" });
                }
            }
        }


        CABLES.lastError = {
            "title": this._options.title,
            "exception": this._options.exception || this._options.codeText,
            "opName": this.opName,
            "opTriggerStack": stackStr,
            "stackInfo": info,
            "triggerStack": this._options.triggerStack };

        if (this._options.op) CABLES.lastError.opName = this.opName;
        // if (window.gui && doTrack) gui.emitEvent("uncaughtError", CABLES.api.getErrorReport());

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
            (err, _data, xhr) =>
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

        if (this.opName)
        {
            if (this.opDoc && this.opDoc.forbidden)
            {
                str += "Op is forbidden op: <b>" + this.opName + "</b><br/>";
                str += "Please check if you have the access rights to this op.<br/><br/>";
            }
            else
            if (gui && gui.serverOps.canEditOp(gui.user, this.opName) && CABLES.platform)
            {
                const url = CABLES.platform.getCablesUrl() + "/op/edit/" + this.opName;
                str += "Error in op: <b><a href='" + url + "' target='_blank'>" + this.opName + "</a></b><br/><br/>";
            }
            else
            {
                str += "Error in op: <b>" + this.opName + "</b><br/><br/>";
            }
        }

        const isSameHost = CABLES.platform.isPatchSameHost();

        if (!isSameHost)
        {
            str += "<br/><br/>Patch was last saved on a different environment: <a class=\"link\" href=\"https://" + gui.project().buildInfo.host + "/edit/" + gui.patchId + "\" target=\"top\">" + gui.project().buildInfo.host + "</a>";
            str += "<br/><br/>";
        }

        if (this._options.text)
            str += this._options.text + "<br/><br/>";

        if (this._options.codeText)
            str += "<pre><code class=\"hljs language-json\">" + this._options.codeText + "</code></pre>";

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

        let isPrivateOp = false;
        if (this.opName)
        {
            isPrivateOp = defaultOps.isPrivateOp(this.opName);
            if (window.gui && (gui.user.isStaff || defaultOps.isCurrentUserOp(this.opName)))
            {
                str += "<a class=\"button \" onclick=\"gui.serverOps.edit('" + this.opName + "',false,null,true);gui.closeModal();\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";
            }
        }

        str += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";
        if (CABLES && CABLES.platform && CABLES.platform.getIssueTrackerUrl())
        {
            str += "<a class=\"button\" target=\"_blankk\" href=\"" + CABLES.platform.getIssueTrackerUrl() + "\"><span class=\"icon icon-message\"></span>Report a problem</a>&nbsp;&nbsp;";
        }

        let ignoreErrorReport = false;

        if (this._options.exception && this._options.exception.message && this._options.exception.message.indexOf("Script Error.") > -1)ignoreErrorReport = true;

        if (CABLES.lastError && CABLES.lastError.opTriggerStack)
        {
            if (CABLES.lastError.opTriggerStack.indexOf("Ops.Gl.Shader.CustomShader_") >= 0 ||
                CABLES.lastError.opTriggerStack.indexOf("Ops.User.") >= 0 ||
                CABLES.lastError.opTriggerStack.indexOf("Ops.Team.") >= 0 ||
                CABLES.lastError.opTriggerStack.indexOf("Ops.Patch.") >= 0) ignoreErrorReport = true;
        }

        let showSendButton = true;
        if (CABLES && CABLES.platform && !CABLES.platform.frontendOptions.sendErrorReports)
        {
            ignoreErrorReport = true;
            showSendButton = false;
        }

        if (!isPrivateOp)
        {
            if (CABLES && CABLES.platform && CABLES.platform.isDevEnv() && gui && gui.user && !gui.user.isStaff && !ignoreErrorReport)
            {
                CABLES.api.sendErrorReport(CABLES.lastError, false);
                str += "<br/><br/>Dev Environment: An automated error report has been created. We will look into it!";
            }
            else if (showSendButton)
            {
                str += "<a class=\"button \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>&nbsp;&nbsp;";
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
