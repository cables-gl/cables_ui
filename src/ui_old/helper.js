
CABLES.UI = CABLES.UI || {};

CABLES.UI.MOUSE_BUTTON_NONE = 0;
CABLES.UI.MOUSE_BUTTON_LEFT = 1;
CABLES.UI.MOUSE_BUTTON_RIGHT = 2;
CABLES.UI.MOUSE_BUTTON_WHEEL = 4;


CABLES.UI.sanitizeUsername = function (name)
{
    name = name.toLowerCase();
    name = name.split(" ").join("_");
    name = name.replace(/\./g, "_");
    if (name.match(/^\d/))name = "u_" + name;
    return name;
};


CABLES.serializeForm = function (selector)
{
    const json = {};
    Array.from(document.querySelector(selector).elements).forEach((e) =>
    {
        json[e.getAttribute("name")] = e.value;
    });
    return json;
};


CABLES.UI.showJson = function (opid, which)
{
    const op = gui.corePatch().getOpById(opid);
    if (!op)
    {
        console.log("opid not found:", opid);
        return;
    }
    const port = op.getPort(which);
    if (!port)
    {
        console.log("port not found:", which);
        return;
    }

    CABLES.UI.MODAL.showPortValue(port.name, port);
};

CABLES.UI.showJsonStructure = function (opid, which)
{
    const op = gui.corePatch().getOpById(opid);
    if (!op)
    {
        console.log("opid not found:", opid);
        return;
    }
    const port = op.getPort(which);
    if (!port)
    {
        console.log("port not found:", which);
        return;
    }

    CABLES.UI.MODAL.showPortStructure(port.name, port);
};


// CABLES.UI.togglePreview=function(opid,which)
// {
//     CABLES.UI.PREVIEW.onoff=!CABLES.UI.PREVIEW.onoff;
//     console.log('CABLES.UI.PREVIEW.onoff',CABLES.UI.PREVIEW.onoff);
//
//     if(!CABLES.UI.PREVIEW.onoff)
//     {
//         CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//         CABLES.UI.PREVIEW.op=null;
//         CABLES.UI.PREVIEW.port=null;
//         CGL.Texture.previewTexture=null;
//         console.log('preview OFFF');
//     }
//     else
//     {
//         var op=gui.scene().getOpById(opid);
//         if(!op)
//         {
//             console.log('opid not found:',opid);
//             return;
//         }
//         var port=op.getPort(which);
//         if(!port)
//         {
//             console.log('port not found:',which);
//             return;
//         }
//
//         CABLES.UI.PREVIEW.op=op;
//         CABLES.UI.PREVIEW.port=port;
//     }
//
//     if(CABLES.UI.PREVIEW.port && CABLES.UI.PREVIEW.onoff) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//
//  // onmouseover="CABLES.UI.showPreview('{{op.id}}','{{port.name}}',true);" onmouseout="CABLES.UI.showPreview('{{op.id}}','{{port.name}}',false);"
// };
//
// CABLES.UI.showPreview=function()
// {
//     // if(CABLES.UI.PREVIEW.port) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//     if(CABLES.UI.PREVIEW.port && CABLES.UI.PREVIEW.onoff) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
// };


function mouseEvent(event)
{
    if (!event) return event;
    if (event.buttons === undefined) // safari
    {
        event.buttons = event.which;

        if (event.which == 3)event.buttons = CABLES.UI.MOUSE_BUTTON_RIGHT;
        if (event.which == 2)event.buttons = CABLES.UI.MOUSE_BUTTON_WHEEL;
    }

    if (event.type == "touchmove" && event.originalEvent)
    {
        event.buttons = 3;
        event.clientX = event.originalEvent.touches[0].pageX;
        event.clientY = event.originalEvent.touches[0].pageY;
    }

    return event;
}

CABLES.mouseEvent = mouseEvent;

CABLES.UI.initHandleBarsHelper = function ()
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
};
