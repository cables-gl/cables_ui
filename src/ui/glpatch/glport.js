import { Logger } from "cables-shared-client";
import { Port } from "cables";
import gluiconfig from "./gluiconfig.js";
import GlRect from "../gldraw/glrect.js";
import MouseState from "./mousestate.js";
import { hideToolTip, updateHoverToolTip } from "../elements/tooltips.js";
import Gui, { gui } from "../gui.js";
import GlPatch from "./glpatch.js";
import GlOp from "./glop.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { PortDir, portType } from "../core_constants.js";

/**
 * rendering ports on {@link GlOp} on  {@link GlPatch}
 *
 * @export
 * @class GlPort
 */
export default class GlPort
{
    #name;
    #type;

    /** @type {Port} */
    #port;

    /** @type {GlOp} */
    #glop;
    #id;
    #log = new Logger("glPort");
    groupIndex = 0;
    #posX;
    #mouseButtonRightTimeDown;

    /** @type {GlRect} */
    #dot;

    /** @type {GlRect} */
    #longPortRect;

    #activity = 1;
    #mouseEvents = [];

    /** @type {GlPatch} */
    #glPatch;
    #direction;

    /** @type {GlRect} */
    #parentRect;

    /** @type {GlRect} */
    #rect;

    /**
     * Description
     * @param {GlPatch} glpatch
     * @param {GlOp} glop
     * @param {GlRectInstancer} rectInstancer
     * @param {Port} p
     * @param {number} posCount
     * @param {GlRect} oprect
     */
    constructor(glpatch, glop, rectInstancer, p, posCount, oprect)
    {

        this.#port = p;

        this.#glop = glop;
        this.#type = p.type;
        this.#name = p.name;
        this.#id = p.id;

        this.#parentRect = oprect;
        this.#direction = p.direction;
        this.#glPatch = glpatch;

        /** @type {GlRectInstancer} */
        this._rectInstancer = rectInstancer;

        this.#rect = new GlRect(this._rectInstancer, { "name": "port" + this.#name, "parent": this.#parentRect, "interactive": true });

        this.#mouseButtonRightTimeDown = 0;
        this.#posX = posCount * (gluiconfig.portWidth + gluiconfig.portPadding);
        if (!this.#parentRect) this.#log.warn("no parent rect given");
        else this.#parentRect.addChild(this.#rect);

        this.portIndex = posCount;

        this._updateColor();

        this.#mouseEvents.push(this.#rect.on(GlRect.EVENT_POINTER_DOWN, this._onMouseDown.bind(this)));
        this.#mouseEvents.push(this.#rect.on(GlRect.EVENT_POINTER_UP, this._onMouseUp.bind(this)));
        this.#mouseEvents.push(this.#rect.on(GlRect.EVENT_POINTER_HOVER, this._onHover.bind(this)));
        this.#mouseEvents.push(this.#rect.on(GlRect.EVENT_POINTER_UNHOVER, this._onUnhover.bind(this)));

        this.#port.on("onLinkChanged", this._onLinkChanged.bind(this));
        this.#port.on("onValueChangeUi", () =>
        {
            if (this.#glop.op && this.#glop.op.uiAttribs.mathTitle) this.#glop.setTitle();
        });

        p.on("onUiAttrChange", this._onUiAttrChange.bind(this));

        this._onUiAttrChange(p.uiAttribs);
        this.setFlowModeActivity(1);
        this.updateSize();
        this._updateColor();
    }

    /**
     * @type {number}
     */
    get posX()
    {
        return this.#posX;
    }

    /**
     * @param {import("cables/src/core/core_port.js").PortUiAttribs} attribs
     */
    _onUiAttrChange(attribs)
    {
        if (this.disposed) return;
        if (attribs.hasOwnProperty("isAnimated") || attribs.hasOwnProperty("useVariable") || attribs.hasOwnProperty("notWorking")) this._updateColor();
        if (attribs.hasOwnProperty("expose")) this._updateColor();

        if (attribs.hasOwnProperty("addPort")) this._updateColor();
        if (attribs.hasOwnProperty("greyout")) this._updateColor();
        if (attribs.hasOwnProperty("hover")) this.updateSize();

        if (attribs.hasOwnProperty("longPort") && attribs.longPort == 0 && this.#longPortRect) this.#longPortRect = this.#longPortRect.dispose();
        if (attribs.hasOwnProperty("longPort") && attribs.longPort > 0)
        {
            if (!this.#rect) return;
            if (!this.#longPortRect) this.#longPortRect = new GlRect(this._rectInstancer, { "name": "longport", "parent": this.#parentRect, "interactive": false });

            const col = GlPort.getColor(this.#type, false, false, false);
            this.#longPortRect.setColor(col[0], col[1], col[2], 0.5);

            this.updateSize();
        }

    }

    updateShape()
    {
        if (this.#port.isLinked() && !this.#port.isAnimated() && !this.#port.isBoundToVar())
        {
            this.#rect.setShape(0);
        }
        else
        {
            if (this.#direction == PortDir.out) this.#rect.setShape(9);
            else this.#rect.setShape(10);
        }
    }

    _updateColor()
    {
        if (!this.#rect) return;

        const isAssigned = this.#port.uiAttribs.useVariable || this.#port.uiAttribs.isAnimated;
        const dotSize = gluiconfig.portHeight * 0.75;
        const showDot = isAssigned || this.#port.uiAttribs.notWorking || this.#port.uiAttribs.addPort;

        if (!this.#dot && showDot)
        {
            this.#dot = new GlRect(this._rectInstancer, { "name": "portdot", "parent": this.#rect, "interactive": false });
            this.#dot.setSize(0, 0);
            this.#rect.addChild(this.#dot);
        }

        if (this.#dot)
        {
            if (showDot)
            {
                if (this.#port.uiAttribs.notWorking) this.#dot.setColor(0.8, 0.2, 0.2, 1);
                else this.#dot.setColor(0.24, 0.24, 0.24, 1);

                let dotPosY = this.#rect.h / 4 - dotSize / 2;
                if (this.direction == PortDir.in) dotPosY += this.#rect.h / 2;

                if (this.#port.uiAttribs.addPort) this.#dot.setShape(GlRect.SHAPE_PLUS);
                else if (this.#port.uiAttribs.notWorking) this.#dot.setShape(GlRect.SHAPE_CROSS);
                else this.#dot.setShape(GlRect.SHAPE_FILLED_CIRCLE);

                this.#dot.setSize(dotSize, dotSize);
                this.#dot.setPosition(gluiconfig.portWidth / 2 - dotSize / 2, dotPosY);
            }
            else
            {
                this.#dot = this.#dot.dispose();
            }
        }

        let hover = this._hover;

        for (const i in this.#glop._links)
            if (this.#glop._links[i].portIdIn == this.#id || this.#glop._links[i].portIdOut == this.#id)
                if (this.#glop._links[i].hovering) { hover = true; break; }

        let act = this.#activity;
        if (this.#glPatch.vizFlowMode == 0)act = 10;

        const col = GlPort.getColor(this.#type, hover, false, act);
        this.#rect.setColorArray(col);

        if (this.#port.uiAttribs.addPort) this.#rect.setOpacity(0.7);
        else this.#rect.setOpacity(1);

        if (this.#port.uiAttribs.greyout) this.#rect.setOpacity(0.4);

        if (this.#port.uiAttribs.hasOwnProperty("opacity")) this.#rect.setOpacity(this.#port.uiAttribs.opacity);
    }

    get direction()
    {
        return this.#direction;
    }

    get width()
    {
        return this.#rect.w;
    }

    updateSize()
    {
        if (!this.#rect) return;
        const oldh = this.#rect.h;

        let h = gluiconfig.portHeight * 2;
        let y = 0;

        if (this.#port.direction == PortDir.out) y = this.#glop.h;

        if (this.#port.isLinked() && !this.#port.isAnimated() && !this.#port.isBoundToVar())
        {
            if (this.#port.direction == PortDir.in) y += gluiconfig.portHeight * 0.5;
            h = gluiconfig.portHeight * 1.5;
        }

        y -= gluiconfig.portHeight;

        if (this.#glop.displayType === this.#glop.DISPLAY_REROUTE_DOT)
        {
            h = 0;
            if (this.#port.direction == PortDir.in) y = 0;
            else y = this.#glop.h;
        }

        if (this.#port.uiAttribs.hover)
        {
            if (this.direction == PortDir.in)
                y -= h;
            h *= 2;
        }

        this.updateShape();

        this.#posX = this.#glop.getPortPos(this.#name, false);

        this.#rect.setPosition(this.#posX, y, -0.0001);
        this.#rect.setSize(gluiconfig.portWidth, h);
        if (oldh != h) this._updateColor();

        if (this.#longPortRect)
        {
            let n = this.#port.op.getNumVisiblePortsIn();
            if (this.#direction == PortDir.out) n = this.#port.op.getNumVisiblePortsOut();

            const lastposX = this.#port.op.posByIndex(this.#port.uiAttribs.longPort + this.portIndex - 1, n);

            this.#longPortRect.setSize(lastposX - this.#posX, gluiconfig.portLongPortHeight);

            let yl = gluiconfig.portHeight - gluiconfig.portLongPortHeight;
            if (this.#direction == PortDir.out) yl = this.#parentRect.h - gluiconfig.portHeight;

            this.#longPortRect.setPosition(this.#posX, yl, -0.0001);
        }
    }

    _onLinkChanged()
    {
        if (this.#glop.op && this.#glop.op.uiAttribs.mathTitle) this.#glop.setTitle();
        this.updateSize();
    }

    _onMouseDown(e, _rect)
    {
        if (e.buttons == MouseState.BUTTON_RIGHT) this.#mouseButtonRightTimeDown = performance.now();

        this.#glPatch.emitEvent("mouseDownOverPort", this, this.#glop.id, this.#port.name, e);
    }

    _onMouseUp(e, _rect)
    {
        if (this.#mouseButtonRightTimeDown)
        {
            if (performance.now() - this.#mouseButtonRightTimeDown < gluiconfig.clickMaxDuration)
            {
                this.#port.removeLinks();
                this.#mouseButtonRightTimeDown = 0;
                return;
            }
        }
        this.#glPatch.emitEvent("mouseUpOverPort", this.#port.op.id, this.#port, e);
    }

    /**
     * @param {GlRect} _rect
     */
    _onHover(_rect)
    {
        if (!this.#glPatch.hasFocus) return;

        this._hover = true;
        const event = {
            "clientX": this.#glPatch.viewBox.mouseX + gui.patchView.boundingRect.left,
            "clientY": this.#glPatch.viewBox.mouseY - 25 + gui.patchView.boundingRect.top
        };

        this.#glPatch.hoverPort = this;
        gui.emitEvent(Gui.EVENT_MOUSEOVERPORT, this.#glop.id, this.#port.name);

        for (const i in this.#glop._links)
            if (this.#glop._links[i].portIdIn == this.#id || this.#glop._links[i].portIdOut == this.#id)
                this.#glop._links[i].highlight(true);

        updateHoverToolTip(event, this.#port, false);
        this.#port.setUiAttribs({ "hover": true });
        this._updateColor();
    }

    /**
     * @param {GlRect} _rect
     */
    _onUnhover(_rect)
    {
        this.#glPatch.hoverPort = null;
        this._hover = false;
        this.#port.setUiAttribs({ "hover": false });
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        hideToolTip();

        for (const i in this.#glop._links)
            this.#glop._links[i].highlight(false);

        gui.emitEvent(Gui.EVENT_MOUSEOVERPORT_OUT, this.#glop.id, this.#port.name);
        this._updateColor();
    }

    get hovering() { return this._hover; }

    get type() { return this.#port.type; }

    get port() { return this.#port; }

    get id() { return this.#id; }

    get name() { return this.#name; }

    get glOp() { return this.#glop; }

    get rect() { return this.#rect; }

    setFlowModeActivity(_a)
    {
        if (this.#activity != this.#port.apf)
        {
            this._activity = this.#port.apf;
            this._updateColor();
        }
    }

    dispose()
    {
        this.disposed = true;
        for (const i in this.#glop._links)
            if (this.#glop._links[i].portIdIn == this.#id || this.#glop._links[i].portIdOut == this.#id)
                this.#glop._links[i].visible = false;

        for (let i = 0; i < this.#mouseEvents.length; i++)
            this.#rect.off(this.#mouseEvents[i]);

        this.#mouseEvents.length = 0;
        if (this.#rect) this.#rect = this.#rect.dispose();
        if (this.#dot) this.#dot = this.#dot.dispose();
        if (this.#longPortRect) this.#longPortRect = this.#longPortRect.dispose();
    }

    /**
     * @param {number} type
     * @param {boolean} [hovering]
     * @param {boolean} [_selected]
     * @param {number | boolean} [activity]
     */
    static getColor(type, hovering, _selected, activity)
    {
        const perf = gui.uiProfiler.start("[glport] getcolor");

        let name = "";
        let portname = "";

        if (type == portType.number) portname = "num";
        else if (type == portType.trigger) portname = "trigger";
        else if (type == portType.object) portname = "obj";
        else if (type == portType.array) portname = "array";
        else if (type == portType.string) portname = "string";
        else if (type == portType.dynamic) portname = "dynamic";

        if (activity == 0)name = portname + "_inactive";

        if (hovering)name = portname + "_hover";
        // else if (selected)name = portname + "_selected";

        let col = gui.theme.colors_types[name] || gui.theme.colors_types[portname] || [1, 0, 0, 1];

        perf.finish();

        return col;
    }

    /**
     * @param {number} type
     */
    static getInactiveColor(type)
    {
        const perf = gui.uiProfiler.start("[glport] getInactiveColor");
        let portname = "";

        if (type == portType.number) portname = "num";
        else if (type == portType.trigger) portname = "trigger";
        else if (type == portType.object) portname = "obj";
        else if (type == portType.array) portname = "array";
        else if (type == portType.string) portname = "string";
        else if (type == portType.dynamic) portname = "dynamic";

        const name = portname + "_inactive";

        let col = gui.theme.colors_types[name] || gui.theme.colors_types[portname] || [0, 0, 0, 1];

        perf.finish();

        return col;
    }

    /**
     * @param {number} type
     * @param {boolean} hovering
     * @param {boolean} selected
     */
    static getColorBorder(type, hovering, selected)
    {
        const perf = gui.uiProfiler.start("[glport] getcolorBorder");
        let name = "";
        let portname = "";

        if (type == portType.number) portname = "num";
        else if (type == portType.trigger) portname = "trigger";
        else if (type == portType.object) portname = "obj";
        else if (type == portType.array) portname = "array";
        else if (type == portType.string) portname = "string";
        else if (type == portType.dynamic) portname = "dynamic";

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
    }
}
