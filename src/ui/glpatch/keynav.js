import { Port } from "cables/src/core/core_port.js";
import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";
import GlPort from "./glport.js";
import GlPortCursor from "./glopcursor.js";
import { updateHoverToolTip } from "../elements/tooltips.js";

export class KeyNav
{

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

    /**
     * @param {GlPatch} glPatch
     */
    constructor(glPatch)
    {
        this.#glPatch = glPatch;

    }

    /**
     * @param {import("../core_extend_op.js").UiOp | import("cables/src/core/core_op.js").Op<any>} theOp
     */
    gotoOp(theOp)
    {
        this.#port = theOp.portsIn.find((p) => { return this.#getGlPort(p); });
        if (!this.#port) return;
        this.setPort(this.#port);
    }

    useClosestOp()
    {
        this.gotoOp(gui.patchView.getClosestOp());
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    move(x, y)
    {

        if (!this.#glPatch.glPortCursor)
        {
            this.#glPatch.glPortCursor = new GlPortCursor(this.#glPatch, this.#glPatch.overLayRects);
            this.#glPatch.glPortCursor.updateAnim();

            console.log("created...");
        }

        if (!this.#glPort)
        {
            let theOp = this.#glPatch.glPortCursor?.op;

            if (!theOp)
            {
                const ops = gui.patchView.getSelectedOps();

                if (ops.length == 0) theOp = gui.patchView.getClosestOp();
                else theOp = ops[0];
            }

            this.gotoOp(theOp);
            return;
        }

        if (!this.#glPatch.glPortCursor.visible)
        {
            console.log("not active anymote!");
            this.useClosestOp();
            return;
        }

        console.log("dir", x, y);
        if (y > 0) this.moveDown();
        if (y < 0) this.moveUp();
        if (x > 0) this.moveRight();
        if (x < 0) this.moveLeft();

    }

    /**
     * @param {Port} port
     * @param {number} [linkIdx] -1 = the port itself
     */
    setPort(port, linkIdx = -1)
    {
        if (linkIdx == -1 && port.links.length > 0) linkIdx = this.#sortedLinkStops(port)[0].linkIdx;

        this.#glPort = this.#getGlPort(port);

        this.#port = port;

        this.#linkIdx = linkIdx;
        this.#glPatch.glPortCursor.setGlPort(this.#glPort);

        if (this.#glLink) this.#glLink.setKeyNavHighlight(false);

        const link = port.links[linkIdx];
        this.#glLink = link ? this.#glPatch.links[link.id] : null;

        if (this.#glLink) this.#glLink.setKeyNavHighlight(true);
        this.#updateTooltip();
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
     */
    #step(dir)
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
        const next = stops[(idx + dir + stops.length) % stops.length];
        if (next) this.setPort(next.port, next.linkIdx);
    }

    /**
     * visible port closest in x to the current port
     * @param {Port[]} ports
     * @param {(p:Port)=>boolean} filter
     */
    #nearestPort(ports, filter)
    {
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

    moveLeft()
    {
        this.#step(-1);
    }

    moveRight()
    {
        this.#step(1);
    }

}
