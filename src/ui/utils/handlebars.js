/**
 * Handlebars template helper functions
 *
 */

const handleBarsPrecompiled = {};

export function getHandleBarHtml(name, obj)
{
    const perf = CABLES.UI.uiProfiler.start("getHandleBarHtml");

    let template = handleBarsPrecompiled[name];
    if (!template && document.getElementById(name))
    {
        const source = document.getElementById(name).innerHTML;
        if (!source)
        {
            console.warn("template not found", "template " + name + " not found...");
            return;
        }
        template = handleBarsPrecompiled[name] = Handlebars.compile(source);
    }

    obj = obj || {};
    obj.cablesUrl = CABLES.sandbox.getCablesUrl();
    const html = template(obj);
    perf.finish();

    return html;
}

export function initHandleBarsHelper()
{
    Handlebars.registerHelper("json", function (context)
    {
        let str = "";
        try
        {
            str = JSON.stringify(context, true, 4);
        }
        catch (e)
        {
            console.error(e);
        }

        return str;
    });

    Handlebars.registerHelper("console", function (context)
    {
        return console.log(context);
    });

    Handlebars.registerHelper("compare", function (left_value, operator, right_value, options)
    {
        if (arguments.length < 4)
        {
            throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
        }

        const operators = {
            "==": function (l, r) { return l == r; },
            "===": function (l, r) { return l === r; },
            "!=": function (l, r) { return l != r; },
            "<": function (l, r) { return l < r; },
            ">": function (l, r) { return l > r; },
            "<=": function (l, r) { return l <= r; },
            ">=": function (l, r) { return l >= r; },
            "typeof": function (l, r) { return typeof l == r; }
        };

        if (!operators[operator])
        {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        const result = operators[operator](left_value, right_value);

        if (result === true)
        {
            return options.fn(this);
        }
        else
        {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("toUpperCase", function (str)
    {
        if (str && typeof str === "string")
        {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        return "";
    });
}
