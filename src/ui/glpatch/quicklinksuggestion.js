CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.QuickLinkSuggestion = class extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();
        this._glPatch = glPatch;
        this._longPressTimeout = null;
        this._quickAddOpStart = null;
        this._longPressOp = null;
        this._longPress = false;
        this._glLineDrawer = null;
        this._glLineIdx = -1;
        this._startX = 0;
        this._startY = 0;
    }

    isActive()
    {
        return this._longPress;
    }

    longPressStart(op)
    {
        clearTimeout(this._longPressTimeout);
        this._longPress = true;
        this._quickAddOpStart = op;
        gui.setCursor("copy");
    }

    longPressPrepare(op, startX, startY)
    {
        this._startX = startX;
        this._startY = startY;
        this.longPressCancel();
        this._longPressOp = op;
        this._longPressTimeout = setTimeout(
            () =>
            {
                this.longPressStart(op);
            }, 300);
    }

    longPressCancel()
    {
        this._longPressOp = null;
        if (this._longPress)gui.setCursor();
        clearTimeout(this._longPressTimeout);
        this._longPress = false;
    }

    glRender(cgl, resX, resY, scrollX, scrollY, zoom, mouseX, mouseY)
    {
        if (!this._longPress) return;

        if (!this._glLineDrawer)
        {
            this._glLineDrawer = new CABLES.GLGUI.Linedrawer(cgl);
            this._glLineIdx = this._glLineDrawer.getIndex();
        }

        const coord = this._glPatch.screenCoord(mouseX, mouseY);

        this._glLineDrawer.setColor(this._glLineIdx, 1, 0, 0, 1);
        this._glLineDrawer.setLine(this._glLineIdx, this._startX, this._startY, coord[0], coord[1]);
        this._glLineDrawer.render(resX, resY, scrollX, scrollY, zoom);
    }

    finish(mouseEvent, op2)
    {
        const op1 = this._longPressOp;

        const suggestions = [];
        if (!op1 || !op2) return;

        for (let j = 0; j < op1.portsOut.length; j++)
        {
            const p = op1.portsOut[j];

            console.log(p.name, "num:", op2.countFittingPorts(p));

            const numFitting = op2.countFittingPorts(p);
            let addText = "...";
            if (numFitting > 0)
            {
                if (numFitting == 1)
                {
                    const p2 = op2.findFittingPort(p);
                    addText = p2.name;
                }

                suggestions.push({
                    p,
                    "name": p.name + "<span class=\"icon icon-arrow-right\"></span>" + addText,
                    "classname": "port_text_color_" + p.getTypeString().toLowerCase()
                });
            }
        }

        if (suggestions.length === 0)
        {
            CABLES.UI.notify("can not link!");
            return;
        }
        // if (suggestions.length > 1)
        //     op1.oprect.showFocus();

        // var fakeMouseEvent = {
        //     clientX: self.lastMouseMoveEvent.clientX,
        //     clientY: self.lastMouseMoveEvent.clientY
        // };


        function showSuggestions2(id)
        {
            const p = suggestions[id].p;
            const sugIn = [];

            for (let i = 0; i < op2.portsIn.length; i++)
            {
                if (CABLES.Link.canLink(op2.portsIn[i], p))
                {
                    sugIn.push({
                        "p": op2.portsIn[i],
                        "name": "<span class=\"icon icon-arrow-right\"></span>" + op2.portsIn[i].name,
                        "classname": "port_text_color_" + op2.portsIn[i].getTypeString().toLowerCase()
                    });
                }
            }

            if (sugIn.length == 1)
            {
                gui.corePatch().link(
                    p.parent,
                    p.name,
                    sugIn[0].p.parent,
                    sugIn[0].p.name);
                return;
            }

            // op2rect.showFocus();

            new CABLES.UI.SuggestionDialog(sugIn, op2, mouseEvent, null,
                function (sid)
                {
                    gui.corePatch().link(
                        p.parent,
                        p.name,
                        sugIn[sid].p.parent,
                        sugIn[sid].p.name);
                });
        }

        if (suggestions.length == 1) showSuggestions2(0);
        else new CABLES.UI.SuggestionDialog(suggestions, op1, mouseEvent, null, showSuggestions2, false);
    }
};
