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
            this._getFileSnippet(options.url, options.line, (txt) =>
            {
                const html = this._getHtmlFromSrc(txt, [options.line - 1], options.line - 6, options.line + 7, options.lang || "javascript");

                this._dialog.updateHtml("" + options.url + "<br/><br/>" + html);
            });
        }
    }


    _escapeHTML(string)
    {
        const htmlEscapes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        };
        const reUnescapedHtml = /[&<>"']/g;
        const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

        return string && reHasUnescapedHtml.test(string) ?
            string.replace(reUnescapedHtml, function (chr) { return htmlEscapes[chr]; })
            : string || "";
    }

    _getHtmlFromSrc(str, badLines, from, to, lang)
    {
        let htmlWarning = "<code><pre style=\"margin-bottom:0px;\"><code class=\"shaderErrorCode language-glsl\" style=\"padding-bottom:0px;max-height: initial;max-width: initial;\">";

        str = str || "";
        const lines = str.match(/^.*((\r\n|\n|\r)|$)/gm);

        for (let i = from; i < to; i++)
        {
            const line = i + ": " + lines[i];

            let isBadLine = false;
            for (const bj in badLines)
                if (badLines[bj] == i) isBadLine = true;

            if (isBadLine)
            {
                htmlWarning += "</code></pre>";
                htmlWarning += "<pre style=\"margin:0\"><code class=\"language-" + lang + "\" style=\"background-color:#660000;padding-top:0px;padding-bottom:0px\">";
            }
            htmlWarning += this._escapeHTML(line);

            if (isBadLine)
            {
                htmlWarning += "</code></pre>";
                htmlWarning += "<pre style=\"margin:0\"><code class=\"language-" + lang + "\" style=\";padding-top:0px;padding-bottom:0px\">";
            }
        }

        htmlWarning = "" + htmlWarning + "<br/><br/>";
        htmlWarning += "</code></pre>";

        return htmlWarning;
    }

    _getFileSnippet(url, line, cb)
    {
        CABLES.ajax(
            url,
            (err, _data, xhr) =>
            {
                if (err)
                {
                    cb(err);
                }
                cb(_data);
            });
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
