import { Logger } from "cables-shared-client";
import glUiConfig from "./gluiconfig.js";
import MouseState from "./mousestate.js";
import Gui, { gui } from "../gui.js";
import GlPort from "./glport.js";
import GlPatch from "./glpatch.js";
import GlSplineDrawer from "../gldraw/glsplinedrawer.js";
import GlRect from "../gldraw/glrect.js";

/**
 * simple line e.g. when dragging a port
 */
export default class GlDragLine
{

    /** @type {GlPort} */
    #glPort;

    /** @type {GlPatch} */
    #glPatch;

    /** @type {GlSplineDrawer} */
    #splineDrawer;

    /** @type {GlRect} */
    #rect = null;

    _startPortOpId = null;
    _startPortId = null;

    _startGlPorts = [];
    _lineIndices = [];
    color = [1, 1, 1, 1];

    _x = 0;
    _y = 0;
    _z = -1.0;

    /**
     * @param {GlSplineDrawer} splineDrawer
     * @param {GlPatch} glpatch
     */
    constructor(splineDrawer, glpatch)
    {
        this._log = new Logger("gldragline");

        this.#splineDrawer = splineDrawer;
        this._splineIdx = this.#splineDrawer.getSplineIndex();

        this.#glPatch = glpatch;

        this._clearSpline();

        glpatch.on("mouseup", (e) =>
        {
            if (!this.isActive) return;

            if (this._button == MouseState.BUTTON_LEFT)
            {
            }

            const ele = document.elementFromPoint(e.x, e.y);
            if (!ele) return;

            if (ele.dataset.opid && ele.dataset.portname)
            {
                if (gui && gui.corePatch())
                {
                    const op = gui.corePatch().getOpById(ele.dataset.opid);
                    if (op)
                    {
                        const port = op.getPortByName(ele.dataset.portname);
                        if (port)
                        {
                            this.#glPatch.emitEvent("mouseUpOverPort", ele.dataset.opid, port, e);
                        }
                    }
                }
            }

            if ((this._button == MouseState.BUTTON_LEFT || e.altKey) && this.#glPort && this.#glPort.port) // this._button == MouseState.BUTTON_LEFT &&
            {
                let x = this.#glPatch.viewBox.mousePatchX;
                let pos =
                {
                    "subPatch": this.#glPatch.subPatch,
                    "x": x,
                    "y": this.#glPatch.viewBox.mousePatchY
                };

                if (this.#glPort.glOp.op)
                {
                    if (Math.abs(this.#glPort.glOp.x - x) < 200)
                    {
                        pos.x = this.#glPort.glOp.x + this.#glPort.glOp.op.getPortPosX(this.#glPort.port.name, this.#glPort.glOp.op.id);
                        pos.noSnap = true;
                    }

                    gui.opSelect().show(
                        pos,
                        this.#glPort.port.op,
                        this.#glPort.port);
                }
            }

            this.stop();
            this.#glPatch.showOpCursor(false);
        });

        glpatch.on("mouseDragLink", (glport, _opid, _portName, _e) =>
        {
            this.setPort(glport);
        });

        glpatch.on("mouseDownOverPort", (glport, opid, portName, e) =>
        {
            if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

            this._button = e.buttons;

            if (this._button == MouseState.BUTTON_LEFT)
            {
                this.setPort(glport);
            }
            else if (this._button == MouseState.BUTTON_RIGHT)
            {
                this.setPort(glport);
                const glports = this.#glPatch.getConnectedGlPorts(opid, portName);

                if (!e.altKey && glport) gui.patchView.unlinkPort(opid, glport.id);

                this._startGlPorts = glports;
            }
        });

        glpatch.on(GlPatch.EVENT_MOUSE_UP_OVER_OP, (e, opid) =>
        {
            if (!this.isActive) return;

            if (this._startGlPorts.length === 0)
            {
                // left click
                gui.patchView.linkPortToOp(
                    e,
                    this._startPortOpId,
                    this._startPortId,
                    opid);
            }
            else
            {
                // right click
                const opids = [];
                const portIds = [];
                for (let i = 0; i < this._startGlPorts.length; i++)
                {
                    if (!this._startGlPorts[i]) continue;
                    opids.push(this._startGlPorts[i].glOp.id);
                    portIds.push(this._startGlPorts[i].id);
                }

                gui.patchView.linkPortsToOp(e, opid, opids, portIds);
            }
            this.stop();
        });

        glpatch.on("mouseUpOverPort", (opid, port, event) =>
        {
            let portId = port.id;

            /*
             * this._log.log("mouseUpOverPort",
             *     this._startPortOpId,
             *     this._startPortId,
             *     opid,
             *     portName);
             */

            if (!this._startGlPorts) return;
            if (this._startGlPorts.length === 0)
            {
                // left click
                gui.patchView.linkPorts(this._startPortOpId, this._startPortId, port.op.id, portId, event);
            }
            else
            {
                // right click
                for (let i = 0; i < this._startGlPorts.length; i++)
                {
                    if (this._startGlPorts[i])
                    {
                        if (!this._startGlPorts[i].glOp)
                        {
                            this._log.warn("glop unknown?", this._startGlPorts, this._startGlPorts[i]);
                            return;
                        }
                        gui.patchView.linkPorts(opid,
                            portId,
                            this._startGlPorts[i].glOp.id,
                            this._startGlPorts[i].name,
                            event);
                    }
                }
            }

            this.stop();
        });
    }

    get glOp()
    {
        return this.#glPort.glOp;
    }

    get glPort()
    {
        return this.#glPort;
    }

    /**
     * @param {GlPort} glp
     */
    setPort(glp)
    {
        if (!glp)
        {
            this.#glPort = this.#rect = null;
            this.#splineDrawer.setSpline(this._splineIdx, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
            return;
        }

        this._startPortOpId = glp.port.op.id;
        this._startPortId = glp.port.id;
        this.#rect = glp.rect;
        this.#glPort = glp;

        this.#glPatch.allowDragging = false;

        this._update();
    }

    _clearSpline()
    {
        for (let i = 0; i < this._lineIndices.length; i++)
        {
            this.#splineDrawer.setSpline(this._lineIndices[i], [0, 0, 0, 0, 0, 0, 0, 0, 0]);
            this.#splineDrawer.setSplineColor(this._lineIndices[i], [0, 0, 0, 0]);
        }
        this.#splineDrawer.setSplineColor(this._splineIdx, [0, 0, 0, 0]);
        this.#splineDrawer.setSpline(this._splineIdx, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    _update()
    {
        if (!this.isActive) this.#glPatch.showOpCursor(false);
        if (!this.isActive) return;

        if (!this.#glPatch.isMouseOverOp() && (!this.#glPatch._cablesHoverButtonRect || !this.#glPatch._cablesHoverButtonRect.isHovering)) this.#glPatch.showOpCursor(true);
        else this.#glPatch.showOpCursor(false);

        this._clearSpline();

        if (this.#glPort)
        {
            const col = GlPort.getColor(this.#glPort.port.type);

            if (col) this.setColor(col);
        }

        if (this._startGlPorts && this._startGlPorts.length)
        {
            let count = 0;
            for (let i = 0; i < this._startGlPorts.length; i++)
            {
                if (!this._startGlPorts[i]) continue;

                /*
                 * if (!this._startGlPorts[i].glOp) continue;
                 * if (!this._startGlPorts[i].rect) continue;
                 */
                if (count > this._lineIndices.length - 1) this._lineIndices[count] = this.#splineDrawer.getSplineIndex();

                if (this._startGlPorts[i].rect)
                    this.#splineDrawer.setSpline(
                        this._lineIndices[count],
                        [
                            this._startGlPorts[i].glOp.x + this._startGlPorts[i].rect.x + glUiConfig.portWidth / 2,
                            this._startGlPorts[i].glOp.y + this._startGlPorts[i].rect.y + glUiConfig.portHeight / 2,
                            this._z,
                            this._x, this._y, this._z,
                            this._x, this._y, this._z,
                        ]);

                count++;
            }
        }
        else
        {
            if (this.#rect && this.#glPort)
            {
                this.#splineDrawer.setSpline(this._splineIdx,
                    [
                        this.#glPort.glOp.x + this.#rect.x + glUiConfig.portWidth / 2,
                        this.#glPort.glOp.y + this.#rect.y + glUiConfig.portHeight / 2,
                        this._z,
                        this._x, this._y, this._z,
                        this._x, this._y, this._z,
                    ]);

                this.#splineDrawer.setSplineColor(this._splineIdx, this.color);
            }
        }
    }

    get isActive()
    {
        return this.#glPort != null;
    }

    stop()
    {
        if (!this.isActive) return;
        this._startGlPorts.length = 0;
        this.setPort(null);

        this.#glPatch.allowDragging = true;// this._patchDragWasAllowed;
        this._clearSpline();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        this._x = x;
        this._y = y;
        this._update();
    }

    /**
     * @param {Array} rgba
     */
    setColor(rgba)
    {
        this.color = rgba;
        for (let i = 0; i < this._lineIndices.length; i++)
            this.#splineDrawer.setSplineColor(this._lineIndices[i], this.color);

        this.#splineDrawer.setSplineColor(this._splineIdx, this.color);
    }
}
