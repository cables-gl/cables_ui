
import GlUiConfig from "./gluiconfig";
import GlRect from "../gldraw/glrect";
import MouseState from "./mousestate";
import Logger from "../utils/logger";

export default class GlPort
{
    constructor(glpatch, glop, rectInstancer, p, posCount, oprect)
    {
        this._log = new Logger("glPort");

        this._port = p;
        this._name = p.name;
        this._id = p.id;
        this._parent = oprect;

        this._direction = p.direction;

        this._glop = glop;
        this._type = p.type;
        this._glPatch = glpatch;
        this._rectInstancer = rectInstancer;
        this._rect = new GlRect(this._rectInstancer, { "parent": this._parent, "interactive": true });
        this._rectAssigned = null;
        this._rect.colorHoverMultiply = 0.0;

        this._mouseButtonRightTimeDown = 0;

        this._posX = posCount * (GlUiConfig.portWidth + GlUiConfig.portPadding);


        if (!this._parent) this._log.warn("no parent rect given");
        else this._parent.addChild(this._rect);

        this._updateColor();
        this._activity = 1;

        this._mouseEvents = [];

        this._mouseEvents.push(this._rect.on("mousedown", this._onMouseDown.bind(this)));
        this._mouseEvents.push(this._rect.on("mouseup", this._onMouseUp.bind(this)));
        this._mouseEvents.push(this._rect.on("hover", this._onHover.bind(this)));
        this._mouseEvents.push(this._rect.on("unhover", this._onUnhover.bind(this)));

        this._port.on("onLinkChanged", this._onLinkChanged.bind(this));

        p.on("onUiAttrChange", (attribs) =>
        {
            if (attribs.hasOwnProperty("isAnimated") || attribs.hasOwnProperty("useVariable") || attribs.hasOwnProperty("notWorking")) this._updateColor();
        });

        this.setFlowModeActivity(0);
        this.updateSize();
        this._updateColor();
    }


    _updateColor()
    {
        if (!this._rect) return;
        const isAssigned =
            this._port.uiAttribs.useVariable || this._port.uiAttribs.isAnimated ||
            (this._port.uiAttribs.expose && this._port.parent.id == this._glop._op.id);

        if (!this._rectAssigned &&
            (isAssigned || this._port.uiAttribs.notWorking))
        {
            this._rectAssigned = new GlRect(this._rectInstancer, { "parent": this._rect, "interactive": false });
            this._rectAssigned.setShape(6);
            this._rectAssigned.setColor(1, 1, 1, 1);
            let size = GlUiConfig.portHeight * 0.75;

            if (this._port.uiAttribs.notWorking)
            {
                this._rectAssigned.setColor(0.2, 0.2, 0.2, 1);
            }

            this._rectAssigned.setSize(size, size);
            this._rectAssigned.setPosition(GlUiConfig.portWidth / 2 - size / 2, GlUiConfig.portHeight / 2 - size / 2);
            this._rect.addChild(this._rectAssigned);
        }

        if (this._rectAssigned && !isAssigned && !this._port.uiAttribs.notWorking)
        {
            this._rectAssigned.dispose();
            this._rectAssigned = null;
        }

        this._glPatch.setDrawableColorByType(this._rect, this._type, this._getBrightness());
    }

    get direction()
    {
        return this._direction;
    }

    get width()
    {
        return this._rect.w;
    }

    updateSize()
    {
        let h = GlUiConfig.portHeight;
        if (this._port.isLinked()) h *= 1.5;

        let y = 0;
        if (this._port.direction == 1) y = this._glop.h - GlUiConfig.portHeight;
        else if (this._port.isLinked()) y -= GlUiConfig.portHeight * 0.5;

        if (this._rect)
        {
            this._rect.setPosition(this._posX, y);
            this._rect.setSize(GlUiConfig.portWidth, h);
        }
    }

    _onLinkChanged()
    {
        this.updateSize();
    }

    _onMouseDown(e, rect)
    {
        if (e.buttons == MouseState.BUTTON_RIGHT) this._mouseButtonRightTimeDown = performance.now();

        this._glPatch.emitEvent("mouseDownOverPort", this, this._glop.id, this._port.name, e);
    }

    _onMouseUp(e, rect)
    {
        if (this._mouseButtonRightTimeDown)
        {
            if (performance.now() - this._mouseButtonRightTimeDown < GlUiConfig.clickMaxDuration)
            {
                this._port.removeLinks();
                this._mouseButtonRightTimeDown = 0;
                return;
            }
        }
        this._glPatch.emitEvent("mouseUpOverPort", this._glop.id, this._port.name);
    }

    _getBrightness()
    {
        if (this._hover) return 2;
        if (this._activity > 0) return 0;

        // if (this._hasFlowActivity() == 0) return 0;
        // if (this._activity == -1) return 1;
        return 1;
    }

    _onHover(rect)
    {
        if (!this._glPatch.hasFocus) return;

        this._hover = true;
        const event = {
            "clientX": this._glPatch.viewBox.mouseX,
            "clientY": this._glPatch.viewBox.mouseY - 25
        };

        this._glPatch.emitEvent("mouseOverPort", this._glop.id, this._port.name);

        for (const i in this._glop._links)
            if (this._glop._links[i].portIdIn == this._id || this._glop._links[i].portIdOut == this._id)
                this._glop._links[i].highlight(true);

        CABLES.UI.updateHoverToolTip(event, this._port);
        this._updateColor();
    }

    _onUnhover(rect)
    {
        this._hover = false;
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        CABLES.UI.hideToolTip();

        for (const i in this._glop._links)
            this._glop._links[i].highlight(false);

        this._updateColor();
    }

    get type() { return this._port.type; }

    get port() { return this._port; }

    get id() { return this._id; }

    get name() { return this._name; }

    get glOp() { return this._glop; }

    get rect() { return this._rect; }

    setFlowModeActivity(a)
    {
        this._activity = a;
        // this._glPatch.setDrawableColorByType(this._rect, this._type, this._getBrightness());
        this._updateColor();
    }

    dispose()
    {
        for (let i = 0; i < this._mouseEvents.length; i++)
            this._rect.off(this._mouseEvents[i]);

        this._mouseEvents.length = 0;
        this._rect.dispose();
        this._rect = null;
    }
}
