import ModalDialog from "./modaldialog.js";

/**
 * Opens a modal dialog and shows a loading indicator animation
 *
 * @param {String} title
 * @class
 */
export default class ModalSourceCode
{
    constructor(options)
    {
        this._tasks = [];
        this.options = {
            "title": options.title || "?",
            "html": "loading...!"
        };

        this._dialog = new ModalDialog(this.options);

        if (options.url)
        {
            this._getFileSnippet(options.url, options.line, (html) =>
            {
                html = "<pre><code id=\"jaja\" class=\"hljs language-json\">" + html + "</code></pre>";

                this._dialog.updateHtml(html);

                hljs.highlightElement(ele.byId("jaja"), { "language": "js" });
            });
        }
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

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
