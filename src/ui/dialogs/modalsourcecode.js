import { utils } from "cables";
import { escapeHTML } from "../utils/helper.js";
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
        this._options = {
            "title": options.title || "Source",
            "html": "<div class\"loading\"></div>",
            "url": options.url,
            "line": options.line,
            "lang": options.lang
        };

        this._dialog = new ModalDialog(this._options);

        if (this._options.url)
        {
            this._getFileSnippet(this._options.url, (txt) =>
            {
                const html = this._getHtmlFromSrc(txt, [this._options.line - 1], this._options.line - 6, this._options.line + 7, this._options.lang || "javascript");

                this._dialog.updateHtml("" + this._options.url + "<br/><br/>" + html);
            });
        }
        else
        {
            this._log.warn("no url given...");
        }
    }

    _getHtmlFromSrc(str, badLines, from, to, lang)
    {
        let htmlWarning = "<code><pre style=\"margin-bottom:0px;\"><code class=\"shaderErrorCode language-glsl\" style=\"padding-bottom:0px;max-height: initial;max-width: initial;\">";

        str = str || "";
        from = from || 0;
        to = to || 1;

        let lines = [];
        try
        {
            lines = str.match(/^.*((\r\n|\n|\r)|$)/gm);
            while (lines.length < to)lines.push("// EOF\n");
        }
        catch (e)
        {
            return "could not parse lines.";
        }

        for (let i = from; i < to; i++)
        {
            const line = i + ": " + (lines[i] || "???");

            let isBadLine = false;
            for (const bj in badLines)
                if (badLines[bj] == i) isBadLine = true;

            if (isBadLine)
            {
                htmlWarning += "</code></pre>";
                htmlWarning += "<pre style=\"margin:0\"><code class=\"language-" + lang + "\" style=\"background-color:#660000;padding-top:0px;padding-bottom:0px\">";
            }

            htmlWarning += escapeHTML(line);

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

    _getFileSnippet(url, cb)
    {
        utils.ajax(
            url,
            (err, _data) =>
            {
                if (err)
                {
                    cb(err);
                }
                cb(_data);
            },
            "GET",
            null,
            null,
            false,
            { },
            { "credentials": true });
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
