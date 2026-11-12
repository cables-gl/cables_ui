import { Port } from "cables/src/core/core_port.js";
import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";
import GlPort from "./glport.js";
import GlPortCursor from "./glopcursor.js";

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
        this.#port = theOp.getFirstPortIn();
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

        //     const cursub = this.getCurrentSubPatch();
        //     let foundOp = null;
        //     let foundOpScore = 9999999;
        //     for (let i = 0; i < this._p.ops.length; i++)
        //     {
        //         const op = this._p.ops[i];
        //         if (op.getSubPatch() == cursub && op.uiAttribs.translate)
        //         {
        //             if (y == 1 && op.uiAttribs.translate.y > curOp.uiAttribs.translate.y)
        //             {
        //                 const score = this.getDistScore(curOp.uiAttribs.translate.y, curOp.uiAttribs.translate.x, op.uiAttribs.translate.y, op.uiAttribs.translate.x);
        //                 if (score < foundOpScore)
        //                 {
        //                     foundOp = op;
        //                     foundOpScore = score;
        //                 }
        //             }
        //             else
        //             if (y == -1 && op.uiAttribs.translate.y < curOp.uiAttribs.translate.y)
        //             {
        //                 const score = this.getDistScore(curOp.uiAttribs.translate.y, curOp.uiAttribs.translate.x, op.uiAttribs.translate.y, op.uiAttribs.translate.x);
        //                 if (score < foundOpScore)
        //                 {
        //                     foundOp = op;
        //                     foundOpScore = score;
        //                 }
        //             }
        //             else
        //             if (x == 1 && op.uiAttribs.translate.x > curOp.uiAttribs.translate.x)
        //             {
        //                 const score = this.getDistScore(curOp.uiAttribs.translate.x, curOp.uiAttribs.translate.y, op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        //                 if (score < foundOpScore)
        //                 {
        //                     foundOp = op;
        //                     foundOpScore = score;
        //                 }
        //             }
        //             else
        //             if (x == -1 && op.uiAttribs.translate.x < curOp.uiAttribs.translate.x)
        //             {
        //                 const score = this.getDistScore(curOp.uiAttribs.translate.x, curOp.uiAttribs.translate.y, op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        //                 if (score < foundOpScore)
        //                 {
        //                     foundOp = op;
        //                     foundOpScore = score;
        //                 }
        //             }
        //         }
        //     }

    //     if (foundOp)
    //     {
    //         this.setKeyboardCursorToOp(foundOp);
    //         // this.setSelectedOpById(foundOp.id);
    //         // this.focusOp(foundOp.id);
    //     }
    }

    /**
     * @param {Port} p
     * @param {number} [linkIdx] -1 = the port itself
     */
    setPort(p, linkIdx = -1)
    {
        if (linkIdx == -1 && p.links.length > 0) linkIdx = this.#sortedLinkStops(p)[0].linkIdx;

        this.#glPort = this.#getGlPort(p);
        this.#linkIdx = linkIdx;
        this.#glPatch.glPortCursor.setGlPort(this.#glPort);

        if (this.#glLink) this.#glLink.setKeyNavHighlight(false);

        const link = p.links[linkIdx];
        this.#glLink = link ? this.#glPatch.links[link.id] : null;

        if (this.#glLink) this.#glLink.setKeyNavHighlight(true);
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
            if (p.links.length == 0) stops.push({ "port": p, "linkIdx": -1 });
            else stops.push(...this.#sortedLinkStops(p));
        }

        const idx = stops.findIndex((s) => { return s.port == this.#glPort.port && s.linkIdx == this.#linkIdx; });
        const next = stops[(idx + dir + stops.length) % stops.length];
        if (next) this.setPort(next.port, next.linkIdx);
    }

    gotoOtherDirPort()
    {
        console.log("otherport DIR");

        const op = this.#glPort.port.op;
        const p = this.#glPort.port.direction == Port.DIR_IN ? op.getFirstPortOut() : op.getFirstPortIn();
        if (!p) return;
        this.setPort(p);

    }

    gotoOtherOpPort()
    {
        const link = this.#glPort.port.links[Math.max(0, this.#linkIdx)];
        if (!link) return;
        this.setPort(link.getOtherPort(this.#glPort.port));
    }

    moveUp()
    {
        console.log("up");
        if (this.#glPort.port.direction == Port.DIR_IN) this.gotoOtherOpPort();
        else this.gotoOtherDirPort();
    }

    moveDown()
    {
        console.log("down");
        if (this.#glPort.port.direction == Port.DIR_IN) this.gotoOtherDirPort();
        else this.gotoOtherOpPort();
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
