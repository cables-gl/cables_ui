import { Port } from "cables/src/core/core_port.js";
import { Patch } from "cables";
import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";
import GlPort from "./glport.js";
import GlPortCursor from "./glopcursor.js";
import { updateHoverToolTip } from "../elements/tooltips.js";
import { GuiText } from "../text.js";

export class KeyNav
{
    static CONTEXT_MODE = "keynav";

    /** @type {GlPatch} */
    #glPatch;

    /** @type {GlPort} */
    #glPort;

    /** @type {Port} */
    #port;

    /** @type {number} -1 = port itself, else index into port.links */
    #linkIdx = -1;

    /** @type {import("./gllink.js").default} */
    #glLink = null;

    /** @type {Port[]} previously visited ports, newest last */
    #history = [];

    static MAX_HISTORY = 30;

    /** @type {import("cables/src/core/core_op.js").Op<any>} last clicked op, keynav starts here */
    #startOp = null;

    /**
     * @param {GlPatch} glPatch
     */
    constructor(glPatch)
    {
        this.#glPatch = glPatch;

        gui.corePatch().on(Patch.EVENT_OP_DELETED, (op) => { this.#onOpDeleted(op); });

        const canvasId = glPatch.cgl.canvas.id;
        const options = { "contextMode": KeyNav.CONTEXT_MODE, "displayGroup": "Keyboard Navigation" };
        gui.keys.key("Enter", "Select op", "down", canvasId, options, () => { this.selectOp(false); });
        gui.keys.key("Enter", "Add op to selection", "down", canvasId, { ...options, "shiftKey": true }, () => { this.selectOp(true); });
        gui.keys.key("i", "Insert op into cable", "down", canvasId, options, () => { this.insertIntoLink(); });
        gui.keys.key("a", "Add op to port", "down", canvasId, options, () => { this.addOpToPort(); });
    }

    /**
     * current op deleted: go back to the last visited port that still exists
     * @param {import("cables/src/core/core_op.js").Op<any>} op
     */
    #onOpDeleted(op)
    {
        if (!this.#port || this.#port.op != op) return;

        this.#port = null;
        this.#glLink = null;

        while (this.#history.length > 0)
        {
            const p = this.#history.pop();
            if (p.op != op && gui.corePatch().getOpById(p.op.id) && this.#getGlPort(p))
            {
                this.setPort(p);
                return;
            }
        }

        this.#glPort = null;
        this.deactivate();
    }

    /**
     * @param {import("../core_extend_op.js").UiOp | import("cables/src/core/core_op.js").Op<any>} theOp
     */
    gotoOp(theOp)
    {
        if (!theOp) return;
        this.#port = theOp.portsIn.find((p) => { return this.#getGlPort(p); });
        if (!this.#port) return;
        this.setPort(this.#port);
    }

    /**
     * @param {import("cables/src/core/core_op.js").Op<any>} op
     */
    setStartOp(op)
    {
        this.#startOp = op;
    }

    #start()
    {
        gui.patchView.unselectAllOps();

        let op = this.#startOp;
        if (!op || !gui.corePatch().getOpById(op.id) || op.getSubPatch() != gui.patchView.getCurrentSubPatch())
            op = gui.patchView.getClosestOp(this.#glPatch.viewBox.mousePatchX, this.#glPatch.viewBox.mousePatchY);

        this.gotoOp(op);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {boolean} [linkedOnly] left/right: skip ports without links
     */
    move(x, y, linkedOnly = false)
    {

        if (!this.#glPatch.glPortCursor)
        {
            this.#glPatch.glPortCursor = new GlPortCursor(this.#glPatch, this.#glPatch.overLayRects);
            this.#glPatch.glPortCursor.updateAnim();
        }

        if (!this.#glPort || !this.#glPatch.glPortCursor.visible)
        {
            this.#start();
            return;
        }

        if (y > 0) this.moveDown();
        if (y < 0) this.moveUp();
        if (x > 0) this.moveRight(linkedOnly);
        if (x < 0) this.moveLeft(linkedOnly);

    }

    /**
     * @param {Port} port
     * @param {number} [linkIdx] -1 = the port itself
     */
    setPort(port, linkIdx = -1)
    {
        if (linkIdx == -1 && port.links.length > 0) linkIdx = this.#sortedLinkStops(port)[0].linkIdx;

        if (this.#port && this.#port != port)
        {
            this.#history.push(this.#port);
            if (this.#history.length > KeyNav.MAX_HISTORY) this.#history.shift();
        }

        this.#glPort = this.#getGlPort(port);

        this.#port = port;

        if (this.#glPort && !this.#glPort.glOp.isOnScreen())
        {
            const glop = this.#glPort.glOp;
            this.#glPatch.viewBox.animateToCenterAt(glop.x + glop.w / 2, glop.y + glop.h / 2, 0.2);
        }

        this.#linkIdx = linkIdx;
        this.#glPatch.glPortCursor.setGlPort(this.#glPort);

        if (this.#glLink) this.#glLink.setKeyNavHighlight(false);

        const link = port.links[linkIdx];
        this.#glLink = link ? this.#glPatch.links[link.id] : null;

        if (this.#glLink) this.#glLink.setKeyNavHighlight(true);
        this.#updateTooltip();

        gui.keys.setContextMode(KeyNav.CONTEXT_MODE, true);
        gui.showInfo(GuiText.keynav);

        if (!gui.opParams.isCurrentOp(this.#glPort.glOp.op))
        {
            gui.opParams.show(this.#glPort.glOp.op);

        }
    }

    /** reset, next move starts again from last clicked op or closest to mouse */
    deactivate()
    {
        if (this.#glPatch.glPortCursor) this.#glPatch.glPortCursor.hide();
        if (this.#glLink) this.#glLink.setKeyNavHighlight(false);
        this.#glLink = null;
        this.#glPort = null;
        this.#port = null;
        this.#history = [];
        this.#startOp = null;
        gui.keys.setContextMode(KeyNav.CONTEXT_MODE, false);
    }

    /**
     * @param {boolean} [add] add to selection instead of replacing it
     */
    selectOp(add)
    {
        if (!this.#port) return;
        if (add) this.#glPatch.selectOpId(this.#port.op.id);
        else this.#glPatch.setSelectedOpById(this.#port.op.id);
    }

    /** open op select to add a new op linked to the current port, like dragging a cable from the port into empty space */
    addOpToPort()
    {
        if (!this.#glPort) return;
        const glop = this.#glPort.glOp;
        const port = this.#port;

        gui.opSelect().show(
            {
                "subPatch": this.#glPatch.subPatch,
                "x": glop.x + glop.op.getPortPosX(port.name, glop.op.id),
                "y": port.direction == Port.DIR_OUT ? glop.y + glop.h + 50 : glop.y - 50,
                "noSnap": true
            },
            port.op,
            port);
    }

    /** insert op into current link, placed between both ops */
    insertIntoLink()
    {
        if (!this.#glLink) return;
        const a = this.#glLink.link.portIn.op.uiAttribs.translate;
        const b = this.#glLink.link.portOut.op.uiAttribs.translate;
        const port = this.#port;
        this.#glLink.insertOp({ "x": (a.x + b.x) / 2, "y": (a.y + b.y) / 2 }, (newOp) =>
        {
            // go to the new op's port on the new cable from the current port
            const link = port.links.find((l) => { return l.getOtherPort(port).op == newOp; });
            if (link) this.setPort(link.getOtherPort(port));
        });
    }

    #updateTooltip()
    {
        let offY = 80;
        if (this.#port.direction == Port.DIR_IN)offY = -60;
        const coords = this.#glPatch.viewBox.patchToScreenCoords(this.#glPort.glOp.x, this.#glPort.glOp.y);
        const event = {
            "clientX": coords[0] + gui.patchView.boundingRect.left,
            "clientY": coords[1] + gui.patchView.boundingRect.top + offY
        };
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        updateHoverToolTip(event, this.#port, false);
    }

    /**
     * @param {Port} p
     */
    #getGlPort(p)
    {
        return this.#glPatch.getGlOp(p.op).getGlPort(p.name);
    }

    /**
     * links of a port, sorted by x position of the other port
     * @param {Port} p
     */
    #sortedLinkStops(p)
    {
        const linkStops = [];
        for (let i = 0; i < p.links.length; i++)
            linkStops.push({ "port": p, "linkIdx": i, "x": this.#getGlPort(p.links[i].getOtherPort(p))?.rect.absX || 0 });

        linkStops.sort((a, b) => { return a.x - b.x; });
        return linkStops;
    }

    /**
     * @param {number} dir
     * @param {boolean} [linkedOnly] skip ports without links
     */
    #step(dir, linkedOnly = false)
    {
        const op = this.#glPort.port.op;
        const ports = this.#glPort.port.direction == Port.DIR_OUT ? op.portsOut : op.portsIn;
        const stops = [];
        for (const p of ports)
        {
            if (!this.#getGlPort(p)) continue;
            if (p.links.length == 0) stops.push({ "port": p, "linkIdx": -1 });
            else stops.push(...this.#sortedLinkStops(p));
        }

        const idx = stops.findIndex((s) => { return s.port == this.#glPort.port && s.linkIdx == this.#linkIdx; });
        for (let i = 1; i <= stops.length; i++)
        {
            const next = stops[((idx + dir * i) % stops.length + stops.length) % stops.length];
            if (linkedOnly && next.linkIdx == -1) continue;
            this.setPort(next.port, next.linkIdx);
            return;
        }
    }

    /**
     * visible port closest in x to the current port
     * @param {Port[]} ports
     * @param {(p:Port)=>boolean} filter
     */
    #nearestPort(ports, filter)
    {

        if (!this.#glPort || !this.#glPort.rect) return;

        const x = this.#glPort.rect.absX;
        let found = null;
        let foundDist = Infinity;
        for (const p of ports)
        {
            const glp = this.#getGlPort(p);
            if (!glp || !filter(p)) continue;
            const dist = Math.abs(glp.rect.absX - x);
            if (dist < foundDist)
            {
                found = p;
                foundDist = dist;
            }
        }
        return found;
    }

    /**
     * @param {number} followDir Port.DIR_IN for up, Port.DIR_OUT for down
     */
    #moveVertical(followDir)
    {
        const port = this.#glPort.port;
        const op = port.op;
        let p = null;

        if (port.direction == followDir)
        {
            // follow selected link, or go to nearest port on this side that has links
            const link = port.links[Math.max(0, this.#linkIdx)];
            if (link) p = link.getOtherPort(port);
            else p = this.#nearestPort(followDir == Port.DIR_IN ? op.portsIn : op.portsOut, (pp) => { return pp.links.length > 0; });
        }
        else
        {
            // switch side: nearest port on the other side
            p = this.#nearestPort(followDir == Port.DIR_IN ? op.portsIn : op.portsOut, () => { return true; });
        }

        if (p) this.setPort(p);
    }

    moveUp()
    {
        this.#moveVertical(Port.DIR_IN);
    }

    moveDown()
    {
        this.#moveVertical(Port.DIR_OUT);
    }

    /**
     * @param {boolean} [linkedOnly]
     */
    moveLeft(linkedOnly)
    {
        this.#step(-1, linkedOnly);
    }

    /**
     * @param {boolean} [linkedOnly]
     */
    moveRight(linkedOnly)
    {
        this.#step(1, linkedOnly);
    }

    get active()
    {
        return this.#glPatch?.glPortCursor?.visible;
    }

    getCurrentOp()
    {
        if (this.#glPort && this.#glPort.rect && this.#glPort.glOp && this.#glPort.glOp.op)
            return this.#glPort.glOp.op;
    }
}
