CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UTILS = CABLES.UTILS || {};


CABLES.UI.handleBarsPrecompiled = {};
CABLES.UI.getHandleBarHtml = function (name, obj)
{
    const perf = CABLES.uiperf.start("getHandleBarHtml");

    let template = CABLES.UI.handleBarsPrecompiled[name];
    if (!template && document.getElementById(name))
    {
        const source = document.getElementById(name).innerHTML;
        if (!source)
        {
            CABLES.UI.MODAL.showError("template not found", "template " + name + " not found...");
            return;
        }
        template = CABLES.UI.handleBarsPrecompiled[name] = Handlebars.compile(source);
    }

    obj = obj || {};
    obj.cablesUrl = CABLES.sandbox.getCablesUrl();
    const html = template(obj);
    perf.finish();

    return html;
};

CABLES.UTILS.arrayContains = function (arr, obj)
{
    let i = arr.length;
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
    const content = t.attr("text");
    const abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    t.attr({ "text-anchor": "start", "text": abc });
    const letterWidth = t.getBBox().width / abc.length;
    t.attr({ "text": content });
    if (content)
    {
        let words = content.split(" "),
            x = 0,
            s = [];
        for (let i = 0; i < words.length; i++)
        {
            const l = words[i].length;
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
        t.attr({ "text": s.join("") });
    }
};
