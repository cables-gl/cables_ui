/**
 * Helper functions
 *
 */

String.prototype.endl = function ()
{
    return this + "\n";
};

export function escapeHTML(string)
{
    string = String(string) || "";
    const htmlEscapes = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    };
    const reUnescapedHtml = /[&<>"']/g;
    const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

    return string && reHasUnescapedHtml.test(string) ?
        string.replace(reUnescapedHtml, function (chr) { return htmlEscapes[chr]; })
        : string || "";
}
