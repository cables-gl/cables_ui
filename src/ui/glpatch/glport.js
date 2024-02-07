
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
        this.groupIndex = 0;

        this._direction = p.direction;

        this._glop = glop;
        this._type = p.type;
        this._glPatch = glpatch;
        this._rectInstancer = rectInstancer;
        this._rect = new GlRect(this._rectInstancer, { "parent": this._parent, "interactive": true });
        this._dot = null;
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
            if (attribs.hasOwnProperty("expose")) this._updateColor();
        });

        this.setFlowModeActivity(1);
        this.updateSize();
        this._updateColor();
    }

    updateShape()
    {
        if (this._port.isLinked())
        {
            this._rect.setShape(0);
        }
        else
        {
            if (this._direction == CABLES.PORT_DIR_OUT) this._rect.setShape(9);
            else this._rect.setShape(10);
        }
    }

    _updateColor()
    {
        if (!this._rect) return;
        const isAssigned =
            this._port.uiAttribs.useVariable || this._port.uiAttribs.isAnimated;

        const dotSize = GlUiConfig.portHeight * 0.75;

        if (!this._dot &&
            (isAssigned || this._port.uiAttribs.notWorking))
        {
            this._dot = new GlRect(this._rectInstancer, { "parent": this._rect, "interactive": false });

            this._rect.addChild(this._dot);
            this._dot.setSize(dotSize, dotSize);
        }

        if (this._dot)
        {
            if (this._port.uiAttribs.notWorking) this._dot.setColor(0.8, 0.2, 0.2, 1);
            else this._dot.setColor(0.24, 0.24, 0.24, 1);

            let dotPosY = GlUiConfig.portHeight / 2 - dotSize / 2;
            if (this.direction == CABLES.PORT_DIR_IN) dotPosY += GlUiConfig.portHeight;
            this._dot.setShape(6);
            this._dot.setSize(dotSize, dotSize);
            this._dot.setPosition(GlUiConfig.portWidth / 2 - dotSize / 2, dotPosY);
        }

        if (this._dot && !isAssigned && !this._port.uiAttribs.notWorking)
        {
            this._dot.dispose();
            this._dot = null;
        }

        let hover = this._hover;

        for (const i in this._glop._links)
            if (this._glop._links[i].portIdIn == this._id || this._glop._links[i].portIdOut == this._id)
                if (this._glop._links[i].hovering) { hover = true; break; }

        const col = GlPort.getColor(this._type, hover, false, this._activity);
        this._rect.setColor(col);
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
        if (!this._rect) return;

        let h = GlUiConfig.portHeight * 2;
        let y = 0;

        if (this._port.direction == CABLES.PORT_DIR_OUT) y = this._glop.h;

        if (this._port.isLinked())
        {
            if (this._port.direction == CABLES.PORT_DIR_IN) y += GlUiConfig.portHeight * 0.5;

            h = GlUiConfig.portHeight * 1.5;
        }

        this.updateShape();
        this._rect.setPosition(this._posX, y - GlUiConfig.portHeight);
        this._rect.setSize(GlUiConfig.portWidth, h);
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
        this._glPatch.emitEvent("mouseUpOverPort", this._port.op.id, this._port);
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





        CABLES.UI.updateHoverToolTip(event, this._port, false);
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

    get hovering() { return this._hover; }

    get type() { return this._port.type; }

    get port() { return this._port; }

    get id() { return this._id; }

    get name() { return this._name; }

    get glOp() { return this._glop; }

    get rect() { return this._rect; }

    setFlowModeActivity(a)
    {
        if (this._activity != this._port.apf)
        {
            this._activity = this._port.apf;
            this._updateColor();
        }
    }

    dispose()
    {
        for (let i = 0; i < this._mouseEvents.length; i++)
            this._rect.off(this._mouseEvents[i]);

        this._mouseEvents.length = 0;
        if (this._rect) this._rect = this._rect.dispose();
        if (this._dot) this._dot = this._dot.dispose();
    }
}


GlPort.getInactiveColor = (type) =>
{
    const perf = CABLES.UI.uiProfiler.start("[glport] getInactiveColor");
    let portname = "";

    if (type == CABLES.OP_PORT_TYPE_VALUE) portname = "num";
    else if (type == CABLES.OP_PORT_TYPE_FUNCTION) portname = "trigger";
    else if (type == CABLES.OP_PORT_TYPE_OBJECT) portname = "obj";
    else if (type == CABLES.OP_PORT_TYPE_ARRAY) portname = "array";
    else if (type == CABLES.OP_PORT_TYPE_STRING) portname = "string";
    else if (type == CABLES.OP_PORT_TYPE_DYNAMIC) portname = "dynamic";

    const name = portname + "_inactive";

    let col = gui.theme.colors_types[name] || gui.theme.colors_types[portname] || [0, 0, 0, 1];

    perf.finish();

    return col;
};

GlPort.getColorBorder = (type, hovering, selected) =>
{
    const perf = CABLES.UI.uiProfiler.start("[glport] getcolorBorder");
    let name = "";
    let portname = "";

    if (type == CABLES.OP_PORT_TYPE_VALUE) portname = "num";
    else if (type == CABLES.OP_PORT_TYPE_FUNCTION) portname = "trigger";
    else if (type == CABLES.OP_PORT_TYPE_OBJECT) portname = "obj";
    else if (type == CABLES.OP_PORT_TYPE_ARRAY) portname = "array";
    else if (type == CABLES.OP_PORT_TYPE_STRING) portname = "string";
    else if (type == CABLES.OP_PORT_TYPE_DYNAMIC) portname = "dynamic";

    let coll = [1, 0.9, 0.8, 0];
    if (hovering)
    {
        name = portname + "_hover";
        coll = gui.theme.colors_types[name] || gui.theme.colors_types[portname] || [1, 0, 0, 1];
    }
    else if (selected)
    {
        // name = portname + "_selected";
        coll = gui.theme.colors_patch.selectedCable;
    }
    else return coll;

    let col = [coll[0], coll[1], coll[2], coll[3]];

    if (!hovering && !selected)col[3] = 0;
    perf.finish();

    return col;
};

GlPort.getColor = (type, hovering, selected, activity) =>
{
    const perf = CABLES.UI.uiProfiler.start("[glport] getcolor");

    let name = "";
    let portname = "";

    if (type == CABLES.OP_PORT_TYPE_VALUE) portname = "num";
    else if (type == CABLES.OP_PORT_TYPE_FUNCTION) portname = "trigger";
    else if (type == CABLES.OP_PORT_TYPE_OBJECT) portname = "obj";
    else if (type == CABLES.OP_PORT_TYPE_ARRAY) portname = "array";
    else if (type == CABLES.OP_PORT_TYPE_STRING) portname = "string";
    else if (type == CABLES.OP_PORT_TYPE_DYNAMIC) portname = "dynamic";

    if (activity == 0)name = portname + "_inactive";

    // if (hovering)name = portname + "_hover";
    // else if (selected)name = portname + "_selected";

    let col = gui.theme.colors_types[name] || gui.theme.colors_types[portname] || [1, 0, 0, 1];

    perf.finish();

    return col;
};
