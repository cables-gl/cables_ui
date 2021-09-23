
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.SuggestPortDialog = function (op, port, mouseEvent, cb, cbCancel)
{
    const suggestions = [];

    function addPort(p)
    {
        const name = p.name;
        suggestions.push({
            p,
            "name": p.name,
            "isLinked": p.isLinked(),
            "isBoundToVar": p.isBoundToVar(),
            "isAnimated": p.isAnimated()
        });
    }

    // linkRecommendations
    for (let i = 0; i < op.portsIn.length; i++)
        if (CABLES.Link.canLink(op.portsIn[i], port))
            addPort(op.portsIn[i]);

    for (let i = 0; i < op.portsOut.length; i++)
        if (CABLES.Link.canLink(op.portsOut[i], port))
            addPort(op.portsOut[i]);

    new CABLES.UI.SuggestionDialog(suggestions, op, mouseEvent, cb,
        function (id)
        {
            for (const i in suggestions)
            {
                if (suggestions[i].id == id)
                {
                    cb(suggestions[i].name);
                }
            }
        }, false, cbCancel);
};

CABLES.UI.SuggestOpDialog = function (op, portname, mouseEvent, coords, cb)
{
    let suggestions = gui.opDocs.getSuggestions(op.objName, portname);

    if (op && op.getPort(portname) && op.getPort(portname).uiAttribs && op.getPort(portname).uiAttribs.linkRecommendations)
    {
        const recs = op.getPort(portname).uiAttribs.linkRecommendations.ops;
        if (recs)
        {
            suggestions = suggestions || [];

            for (let i = 0; i < recs.length; i++)
            {
                suggestions.push(
                    {
                        "name": recs[i].name,
                        "port": recs[i].port,
                        "isLinked": recs[i].isLinked,
                        "recommended": true,
                    });
            }
        }
    }

    if (suggestions)
        for (let i = 0; i < suggestions.length; i++)
            suggestions[i].classname = "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(suggestions[i].name || "");

    CABLES.UI.OPSELECT.newOpPos = coords;

    new CABLES.UI.SuggestionDialog(suggestions, op, mouseEvent, cb,
        function (id)
        {
            for (const i in suggestions)
            {
                if (suggestions[i].id == id)
                {
                    CABLES.UI.OPSELECT.linkNewOpToSuggestedPort = {};
                    CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.op = op;
                    CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.portName = portname;
                    CABLES.UI.OPSELECT.linkNewOpToSuggestedPort.newPortName = suggestions[i].port;
                    gui.corePatch().addOp(suggestions[i].name);
                }
            }
        }, true);
};


// ----------------------------------------------------------------------------------


CABLES.UI.SuggestionDialog = function (suggestions, op, mouseEvent, cb, _action, showSelect, cbCancel)
{
    this.doShowSelect = showSelect;
    this.close = function ()
    {
        $("#suggestionDialog").html("");
        $("#suggestionDialog").hide();
        CABLES.UI.MODAL.hide(true);
        CABLES.UI.suggestions = null;
    };

    this.showSelect = function ()
    {
        if (cb)cb();
        else this.close();
    };

    this.action = function (id)
    {
        this.close();
        _action(id);
    };

    const self = this;

    if (!suggestions)
    {
        if (cb)cb();
        return;
    }

    CABLES.UI.suggestions = this;

    const sugDegree = 6;
    const sugHeight = 23;

    for (let i = 0; i < suggestions.length; i++)
    {
        suggestions[i].id = i;
        suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
        suggestions[i].left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3) / 2;
        suggestions[i].top = (i * sugHeight) - (suggestions.length * sugHeight / 2) - sugHeight;
        suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);
        if (suggestions[i].name) suggestions[i].shortName = suggestions[i].name;
    }

    // if(suggestions.length==1)
    // {
    //     _action(0);
    //     return;
    // }

    const html = CABLES.UI.getHandleBarHtml("suggestions", { suggestions, showSelect });
    $("#suggestionDialog").html(html);
    $("#modalbg").show();
    $("#suggestionDialog").show();
    $("#suggestionDialog").css(
        {
            "left": mouseEvent.clientX,
            "top": mouseEvent.clientY,
        });

    $(".opSelect").css({
        "width": 5,
        "height": 5,
        "margin-left": 2.5,
        "margin-top": -2.5
    });

    $(".opSelect").animate(
        {
            "width": 30,
            "height": 30,
            "margin-left": -15,
            "margin-top": -15
        }, 100);

    for (let i = 0; i < suggestions.length; i++)
    {
        suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
        const left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3);

        suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);

        $("#suggestion" + i).css({ "opacity": 0 });
        $("#suggestion" + i).delay(Math.abs(i - suggestions.length / 2) * 25).animate(
            {
                "opacity": 1,
                left,
            }, 230);

        suggestions[i].id = i;
    }

    $("#modalbg").on("click", function ()
    {
        self.close();

        if (cbCancel)cbCancel();
    });
};
