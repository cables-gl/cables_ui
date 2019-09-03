CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UTILS = CABLES.UTILS || {};

CABLES.UI.handleBarsPrecompiled = {};
CABLES.UI.getHandleBarHtml = function (name, obj)
{
    var perf = CABLES.uiperf.start("getHandleBarHtml");

    var template = CABLES.UI.handleBarsPrecompiled[name];
    if (!template && document.getElementById(name))
    {
        var source = document.getElementById(name).innerHTML;
        if (!source)
        {
            CABLES.UI.MODAL.showError("template not found", "template " + name + " not found...");
            return;
        }
        template = CABLES.UI.handleBarsPrecompiled[name] = Handlebars.compile(source);
    }

    obj = obj || {};
    obj.cablesUrl = CABLES.sandbox.getCablesUrl();
    var html = template(obj);
    perf.finish();

    return html;
};

CABLES.UTILS.arrayContains = function (arr, obj)
{
    var i = arr.length;
    while (i--)
    {
        if (arr[i] === obj)
        {
            return true;
        }
    }
    return false;
};

CABLES.UTILS.isNumber = function (o)
{
    return !isNaN(o - 0) && o !== null && o !== "" && o !== false;
};

/**
 * @param t a raphael text shape
 * @param width - pixels to wrapp text width
 * modify t text adding new lines characters for wrapping it to given width.
 *
 * from: http://stackoverflow.com/questions/3142007/how-to-either-determine-svg-text-box-width-or-force-line-breaks-after-x-chara
 */
CABLES.UI.SVGParagraph = function (t, width)
{
    var content = t.attr("text");
    var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    t.attr({ "text-anchor": "start", text: abc });
    var letterWidth = t.getBBox().width / abc.length;
    t.attr({ text: content });
    if (content)
    {
        var words = content.split(" "),
            x = 0,
            s = [];
        for (var i = 0; i < words.length; i++)
        {
            var l = words[i].length;
            if (x + l > width)
            {
                s.push("\n");
                x = 0;
            }
            else
            {
                x += l * letterWidth;
            }
            s.push(words[i] + " ");
        }
        t.attr({ text: s.join("") });
    }
};
