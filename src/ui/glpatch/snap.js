import { Events } from "cables-shared-client";
import { CglContext, Port } from "cables";
import GlRect from "../gldraw/glrect.js";
import gluiconfig from "./gluiconfig.js";
import uiconfig from "../uiconfig.js";
import { gui } from "../gui.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { userSettings } from "../components/usersettings.js";
import { PortDir } from "../core_constants.js";
import GlPatch from "./glpatch.js";

/**
 * snapping of ops/ports etc to an invisible grid
 *
 * @export
 * @class Snap
 * @extends {Events}
 */
export default class Snap extends Events
{

    /**
     * @param {CglContext} _cgl
     * @param {GlPatch} glPatch
     * @param {GlRectInstancer} instancer
     */
    constructor(_cgl, glPatch, instancer)
    {
        super();

        /**
         * @type {GlPatch}
         */
        this._glPatch = glPatch;
        this._xCoords = [];

        /**
         * @type {GlRectInstancer}
         */
        this._instancer = instancer;
        this._timeout = null;
        this._rectWidth = 1;
        this.enabled = true;

        if (this.enabled)
        {
            this.rect = new GlRect(this._instancer, { "name": "snaprect", "interactive": false });
            this.rect.setColor(0, 0, 0, 0.3);
            this.rect.setPosition(0, -300000);
            this.rect.setSize(this._rectWidth * 2, 1000000);
        }
    }

    update()
    {
        if (!this.enabled) return;
        this._xCoords.length = 0;
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() =>
        {
            const perf = gui.uiProfiler.start("Snap.update");
            const hashmap = {};
            const ops = gui.corePatch().getSubPatchOps(this._glPatch.getCurrentSubPatch());
            const selOps = gui.patchView.getSelectedOps();
            let selOp = null;

            if (selOps.length == 1) selOp = selOps[0];

            for (let i = 0; i < ops.length; i++)
                if (ops[i])
                    if (selOp != ops[i] && selOps.indexOf(ops[i]) == -1 && ops[i].uiAttribs.translate)
                        hashmap[ops[i].uiAttribs.translate.x] = (hashmap[ops[i].uiAttribs.translate.x] || 0) + 1;

            for (let i in hashmap)
            {
                const ii = parseInt(i);
                this._xCoords.push(ii);
            }
            perf.finish();
        }, 50);
    }

    /**
     * @param {Boolean} mouseDown
     */
    render(mouseDown)
    {
        if (!this.enabled) return;
        if (!mouseDown) if (this.rect) this.rect.visible = false;
    }

    /**
     * @param {Number} _x
     */
    snapX(_x)
    {
        let x = _x;
        if (userSettings.get("snapToGrid2"))
            x = Snap.snapOpPosX(_x);

        return x;
    }

    /**
     * @param {Number} y
     * @param {boolean} force
     * @returns {Number}
     */
    snapY(y, force = false)
    {
        if (userSettings.get("snapToGrid2") || force) return Snap.snapOpPosY(y);
        else return y;
    }

    /**
     * @param {number} _x
     * @param {Port} port
     * @param {number} _index
     * @param {number} dist
     */
    _snapPortX(_x, port, _index, dist)
    {
        if (userSettings.get("snapToGrid2")) return Snap.snapOpPosX(_x);

        for (let i = 0; i < port.links.length; i++)
        {
            const otherPort = port.links[i].getOtherPort(port);

            if (!otherPort || !otherPort.op.uiAttribs.translate || !otherPort.op.uiAttribs) continue;

            let otherPortIndex = 0;

            let ports = otherPort.op.portsOut;
            if (otherPort.direction == PortDir.in) ports = otherPort.op.portsIn;

            otherPortIndex = 0;
            for (let j = 0; j < ports.length; j++)
            {
                if (ports[j].uiAttribs.hidePort) continue;
                otherPortIndex++;
                if (ports[j] == otherPort) break;
            }

            const glOp1 = this._glPatch.getGlOp(port.op);
            const portPosx = glOp1.getGlPort(port.name).posX;

            const glOp = this._glPatch.getGlOp(otherPort.op);
            const otherPortPosx = glOp.getGlPort(otherPort.name).posX + otherPort.op.uiAttribs.translate.x;

            if (Math.abs(otherPortPosx - _x - portPosx) < dist) return otherPortPosx - portPosx;
        }

        return -1;
    }

    /**
     * @param {number} _x
     * @param {import("../core_extend_op.js").UiOp} op
     * @param {number} [dist]
     */
    snapOpX(_x, op, dist)
    {
        if (userSettings.get("snapToGrid2")) return Snap.snapOpPosX(_x);

        let hasLinks = false;
        dist = dist || gluiconfig.portWidth;
        if (op)
        {
            let index = 0;
            for (let i = 0; i < op.portsIn.length; i++)
            {
                if (op.portsIn[i].uiAttribs.hidePort) continue;
                index++;
                if (!op.portsIn[i].isLinked()) continue;
                hasLinks = true;
                const s = this._snapPortX(_x, op.portsIn[i], index, dist);
                if (s != -1) return s;
            }

            index = 0;
            for (let i = 0; i < op.portsOut.length; i++)
            {
                if (op.portsOut[i].uiAttribs.hidePort) continue;
                index++;
                if (!op.portsOut[i].isLinked()) continue;
                hasLinks = true;
                const s = this._snapPortX(_x, op.portsOut[i], index, dist);
                if (s != -1) return s;
            }
        }
        else console.warn("snapopx no op");

        if (!hasLinks)
        {
            if (this.rect)
            {
                this.rect.visible = false;
                for (let i = 0; i < this._xCoords.length; i++)
                {
                    if (Math.abs(this._xCoords[i] - _x) < dist)
                    {
                        this.rect.setPosition(this._xCoords[i] - this._rectWidth, -300000);
                        this.rect.visible = true;
                        return this._xCoords[i];
                    }
                }
            }
        }

        return _x;
    }
}

/**
 * @param {Number} posX
 */
Snap.snapOpPosX = function (posX)
{
    return (Math.round(posX / uiconfig.snapX) * uiconfig.snapX) || 1;
};

/**
 * @param {Number} posY
 */
Snap.snapOpPosY = function (posY)
{
    return Math.round(posY / uiconfig.snapY) * uiconfig.snapY;
};
