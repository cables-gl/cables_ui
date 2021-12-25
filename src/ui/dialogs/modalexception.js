import ModalDialog from "./modal";

export default class ModalException
{
    constructor(ex,options)
    {
        this._exception=ex;

        if(options)
        {
            if(options.opname) this._opname=options.opname;
            if(options.op) this._opname=options.op.name
        }

        if (String(ex.stack).indexOf("file:blob:") == 0)
        {
            console.log("ignore file blob exception...");
            return;
        }

        this.options={
            "title":"cablefail :/",
            "html":this.getHtml()
        }

        this._dialog=new ModalDialog(this.options);

        if (this._exception)
        {
            console.trace();

            const info = stackinfo(this._exception);

            console.log("exception:", this._exception, info);

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

        if(this._opname)
        {
            const ops = gui.corePatch().getOpsByObjName(this._opname);
            for (let i = 0; i < ops.length; i++)
            {
                ops[i].uiAttr({ "error": "exception occured - op stopped - reload to run again" });
            }

        }

    }

    getHtml()
    {
        let str="";

        if(this._opname)
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

        CABLES.lastError = { "exception": this._exception, "opname": this._opName };

        if(this._opname)
            if (gui.user.isAdmin || this._opname.startsWith("Op.User." + gui.user.usernameLowercase))
                str += "<a class=\"button \" onclick=\"gui.serverOps.edit('" + this._opname + "');CABLES.UI.MODAL.hide(true);\"><span class=\"icon icon-edit\"></span>Edit op</a> &nbsp;&nbsp;";

        str += "<a class=\"button \" onclick=\"CABLES.api.sendErrorReport();\">Send Error Report</a>&nbsp;&nbsp;";
        str += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

        return str;
    }


    close()
    {
        this._dialog.close();
        this._dialog=null;
    }
}
