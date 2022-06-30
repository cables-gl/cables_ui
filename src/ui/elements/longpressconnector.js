import GlLinedrawer from "../gldraw/gllinedrawer";
import SuggestionDialog from "../components/suggestiondialog";

export default class LongPressConnector extends CABLES.EventTarget
{
    constructor(glPatch)
    {
        super();
        this._glPatch = glPatch;
        this._longPressTimeout = null;
        this._quickAddOpStart = null;
        this._longPressOp = null;
        this._longPress = false;
        // this._glLineDrawer = null;
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

        gui.patchView.focusOp(op.id);
        gui.patchView.showDefaultPanel();
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
        if (!this._longPress) return;
        let wasActive = this._longPress;

        this._longPressOp = null;
        if (this._longPress)gui.setCursor();
        clearTimeout(this._longPressTimeout);
        this._longPress = false;

        if (wasActive)gui.patchView.showDefaultPanel();
    }

    getParamPanelHtml()
    {
        let html = "here we go! <br/>now select any other op!";

        html += "<a onclick=\"gui.longPressConnector.longPressCancel();\" class=\"icon-button button-small \">cancel</a>";
        return html;
    }

    finish(mouseEvent, op2)
    {
        console.log("finisheing!");


        const op1 = this._longPressOp;

        const suggestions = [];
        if (!op1 || !op2) return;
        this.longPressCancel();
        for (let j = 0; j < op1.portsOut.length; j++)
        {
            const p = op1.portsOut[j];

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

            new SuggestionDialog(sugIn, op2, mouseEvent, null,
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
        else new SuggestionDialog(suggestions, op1, mouseEvent, null, showSuggestions2, false);
    }
}
