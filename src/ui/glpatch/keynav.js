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

    /**
     * @param {GlPatch} glPatch
     */
    constructor(glPatch)
    {
        this.#glPatch = glPatch;

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
            // this.#glPort = curOp.portsIn[0];

            const glop = this.#glPatch.getGlOp(theOp);
            this.#port = glop.op.getFirstPortIn();
            this.#glPort = glop.getGlPort(this.#port.name);
            this.#glPatch.glPortCursor.setGlPort(this.#glPort);
            return;
        }

        console.log("dir", x, y);
        if (y > 0) this.moveDown();
        if (y < 0) this.moveUp();
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

    gotoOtherDirPort()
    {
        console.log("otherport DIR");

        const op = this.#glPort.port.op;
        const p = this.#glPort.port.direction == Port.DIR_IN ? op.getFirstPortOut() : op.getFirstPortIn();
        if (!p) return;
        this.#glPort = this.#glPort.glOp.getGlPort(p.name);

        this.#glPatch.glPortCursor.setGlPort(this.#glPort);
    }

    gotoOtherOpPort()
    {
        const link = this.#glPort.port.links[0];
        if (!link) return;
        const other = link.getOtherPort(this.#glPort.port);
        this.#glPort = this.#glPatch.getGlOp(other.op).getGlPort(other.name);
        console.log("otherport");
        this.#glPatch.glPortCursor.setGlPort(this.#glPort);
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

}
