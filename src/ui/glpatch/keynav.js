import { Port } from "cables/src/core/core_port.js";
import { Patch } from "cables";
import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";
import GlPort from "./glport.js";
import GlPortCursor from "./glopcursor.js";
import { updateHoverToolTip } from "../elements/tooltips.js";
import { GuiText } from "../text.js";
import { KeyNavJump } from "./keynavjump.js";

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

    /** @type {KeyNavJump} */
    #jump;

    /** @type {(e:KeyboardEvent)=>void} waits for the key after g */
    #gotoKeyListener = null;

    /**
     * @param {GlPatch} glPatch
     */
    constructor(glPatch)
    {
        this.#glPatch = glPatch;
        this.#jump = new KeyNavJump(glPatch, (op) => { this.gotoOp(op); });

        gui.corePatch().on(Patch.EVENT_OP_DELETED, (op) => { this.#onOpDeleted(op); });

        const canvasId = glPatch.cgl.canvas.id;
        const options = { "contextMode": KeyNav.CONTEXT_MODE, "displayGroup": "Keyboard Navigation" };
        gui.keys.key("Enter", "Select op", "down", canvasId, options, () => { this.selectOp(false); });
        gui.keys.key("Enter", "Add op to selection", "down", canvasId, { ...options, "shiftKey": true }, () => { this.selectOp(true); });
        gui.keys.key("i", "Insert op into cable", "down", canvasId, options, () => { this.insertIntoLink(); });
        gui.keys.key("a", "Add op to port", "down", canvasId, options, () => { this.addOpToPort(); });
        gui.keys.key("s", "Edit port in param panel", "down", canvasId, options, () => { this.editPort(); });
        gui.keys.key("g", "Go to: g topmost op, w jump to op, s top of branch, e bottom of branch", "down", canvasId, { "displayGroup": "Keyboard Navigation" }, () => { this.#startGoto(); });
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
        this.#port = theOp.portsIn.find((p) => { return this.#getGlPort(p); }) || theOp.portsOut.find((p) => { return this.#getGlPort(p); });
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

        if (!this.#glPatch.glPortCursor)
        {
            this.#glPatch.glPortCursor = new GlPortCursor(this.#glPatch, this.#glPatch.overLayRects);
            this.#glPatch.glPortCursor.updateAnim();
        }
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

    /** show params of the current op and focus the current port, buttons get pressed */
    editPort()
    {
        if (!this.#port) return;
        gui.opParams.show(this.#port.op);
        gui.opParams.focusPort(this.#port);
    }

    /** show jump labels on all ops on screen */
    startJump()
    {
        if (!this.#glPort) return;
        this.#jump.start(this.#glPort.glOp.x, this.#glPort.glOp.y);
    }

    /** g pressed: next key g goes to topmost op, w jumps to op, s goes to top of branch, e to bottom. if not active, starts keynav at the selected op, else like arrow keys */
    #startGoto()
    {
        if (!this.#glPort || !this.active)
        {
            const ops = gui.patchView.getSelectedOps();
            if (ops.length == 1) this.gotoOp(ops[0]);
            else this.#start();
            if (!this.#glPort) return;
        }

        this.#stopGoto();
        this.#gotoKeyListener = (e) =>
        {
            if (e.key == "Shift") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.#stopGoto();
            gui.showInfo(GuiText.keynav);

            if (e.key == "g") this.#gotoTopmostOp();
            if (e.key == "w") this.startJump();
            if (e.key == "s") this.#gotoBranchEnd(Port.DIR_IN);
            if (e.key == "e") this.#gotoBranchEnd(Port.DIR_OUT);
        };
        window.addEventListener("keydown", this.#gotoKeyListener, true);
        gui.showInfo(GuiText.keynav_goto);
    }

    /** op with the smallest y in the current subpatch */
    #gotoTopmostOp()
    {
        const subPatch = gui.patchView.getCurrentSubPatch();
        let top = null;
        for (const op of gui.corePatch().ops)
        {
            if (op.uiAttribs.subPatch != subPatch || !op.uiAttribs.translate || op.uiAttribs.hidden) continue;
            if (!top || op.uiAttribs.translate.y < top.uiAttribs.translate.y) top = op;
        }
        this.gotoOp(top);
    }

    #stopGoto()
    {
        if (this.#gotoKeyListener) window.removeEventListener("keydown", this.#gotoKeyListener, true);
        this.#gotoKeyListener = null;
    }

    /**
     * follow cables up or down until an op without cables on that side
     * @param {number} followDir Port.DIR_IN for up, Port.DIR_OUT for down
     */
    #gotoBranchEnd(followDir)
    {
        if (!this.#glPort) return;

        let port = this.#glPort.port;
        let linkIdx = this.#linkIdx;
        const visited = new Set();

        while (!visited.has(port.op))
        {
            visited.add(port.op);

            if (port.direction != followDir || port.links.length == 0)
            {
                const ports = followDir == Port.DIR_IN ? port.op.portsIn : port.op.portsOut;
                const p = this.#nearestPort(ports, (pp) => { return pp.links.length > 0; }, this.#getGlPort(port)?.rect.absX);
                if (!p) break;
                port = p;
                linkIdx = -1;
            }

            port = port.links[Math.max(0, linkIdx)].getOtherPort(port);
            linkIdx = -1;
        }

        this.setPort(port);
    }

    /** reset, next move starts again from last clicked op or closest to mouse */
    deactivate()
    {
        this.#jump.stop();
        this.#stopGoto();
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
        updateHoverToolTip(event, this.#port, false, { "noInfo": true });
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
     * @param {number} [x] default: x of current port
     */
    #nearestPort(ports, filter, x = this.#glPort?.rect?.absX)
    {
        if (x === undefined) return;

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
