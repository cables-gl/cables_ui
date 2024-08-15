/**
 * Helper functions
 *
 */

String.prototype.endl = function ()
{
    return this + "\n";
};

export function uniqueArray(arr)
{
    const u = {}, a = [];
    for (let i = 0, l = arr.length; i < l; ++i)
    {
        if (!u.hasOwnProperty(arr[i]))
        {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
}

export function escapeHTML(string)
{
    string = string || "";
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
