import GlLinedrawer from "../gldraw/gllinedrawer";
import SuggestionDialog from "../components/suggestiondialog";
import GlSplineDrawer from "../gldraw/glsplinedrawer";
import userSettings from "../components/usersettings";

export default class LongPressConnector extends CABLES.EventTarget
{
    constructor()
    {
        super();

        this._glOp = null;
        this._longPressTimeout = null;
        this._quickAddOpStart = null;
        this._longPressOp = null;
        this._longPress = false;
        this._longPressStartTime = 0;
        this._glLineDrawer = null;
        this._glLineIdx = -1;
        this._startX = 0;
        this._startY = 0;
        this._delay = 500;
        this._enabled = userSettings.get("quickLinkLongPress") || userSettings.get("quickLinkMiddleMouse");
    }

    getStartOp()
    {
        return this._longPressOp;
    }

    isActive()
    {
        return this._longPress;
    }

    longPressStart(op, e, options)
    {
        options = options || {};
        if (!this._enabled) return;
        if (this.isActive())
        {
            this.finish(e, op);
            return;
        }
        this._removelisteners();
        this._startX = e.offsetX;
        this._startY = e.offsetY;

        // clearTimeout(this._longPressTimeout);
        this._quickAddOpStart = op;

        this._canceled = false;
        this._longPressOp = op;
        this._glOp = null;

        this._longPressStartTime = performance.now();

        setTimeout(() =>
        {
            if (this._canceled) return;

            this._removelisteners();

            this._longPress = true;
            gui.patchView.focusOp(op.id);

            gui.patchView.showDefaultPanel();
        }, options.delay || this._delay);

        this._listenerUp = this._longpressup.bind(this);
        document.addEventListener("pointerup", this._listenerUp);
        this._listenerDown = this._longpressmove.bind(this);
        document.addEventListener("pointermove", this._listenerDown);
    }

    _removelisteners()
    {
        if (!this._enabled) return;
        if (this._listenerUp)
        {
            document.removeEventListener("pointerup", this._listenerUp);
            this._listenerUp = null;
        }
        if (this._listenerDown)
        {
            document.removeEventListener("pointermove", this._listenerDown);
            this._listenerDown = null;
        }
    }

    _longpressmove(e)
    {
        if (!this._enabled) return;
        if (Math.abs(this._startY - e.offsetY) > 2 || Math.abs(this._startX - e.offsetX) > 2)
            return this.longPressCancel();
    }

    _longpressup()
    {
        if (!this._enabled) return;
        this._removelisteners();
        if (performance.now() - this._longPressStartTime > this._delay)
        {
        }
        else
        {
            this._longPressStartTime = 0;
            this._canceled = true;
            this.longPressCancel();
        }
    }

    longPressCancel()
    {
        this._canceled = true;
        this._removelisteners();

        if (!this._longPress) return;
        let wasActive = this._longPress;

        this._longPressOp = null;
        if (this._longPress) gui.setCursor();
        clearTimeout(this._longPressTimeout);
        this._longPress = false;

        if (wasActive)
            gui.patchView.showDefaultPanel();
    }

    getParamPanelHtml()
    {
        if (!this.isActive()) return "nah";
        let html = "here we go! <br/>now select any other op!";

        html += "<a onclick=\"gui.longPressConnector.longPressCancel();\" class=\"icon-button button-small \">cancel</a>";
        return html;
    }

    finish(mouseEvent, op2)
    {
        const op1 = this._longPressOp;
        const suggestions = [];

        this._longPressStartTime = 0;

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


    glRender(glpatch, cgl, resX, resY, scrollX, scrollY, zoom, mouseX, mouseY)
    {
        if (!this._longPress) return;

        if (!this._glLineDrawer)
        {
            this._glLineDrawer = new GlSplineDrawer(cgl);
            this._glLineIdx = this._glLineDrawer.getSplineIndex();
        }

        if (this._glOp === null) this._glOp = glpatch.getGlOp(this._longPressOp);
        const coord = glpatch.viewBox.screenToPatchCoord(mouseX, mouseY);

        this._glLineDrawer.setSpline(this._glLineIdx, [
            this._longPressOp.uiAttribs.translate.x + this._glOp._width / 2, this._longPressOp.uiAttribs.translate.y + this._glOp._height / 2, 0,
            coord[0], coord[1], -1111.1
        ]);
        this._glLineDrawer.setSplineColor(this._glLineIdx, [1, 1, 1, 1]);
        this._glLineDrawer.render(resX, resY, scrollX, scrollY, zoom);
    }
}
