import { Logger } from "cables-shared-client";
import GlLink from "./gllink.js";
import undo from "../utils/undo.js";
import { hideToolTip } from "../elements/tooltips.js";
import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";

const DEFAULT_ACTIVITY = 0;

export default class GlPatchAPI
{

    /**
     * @param {Patch} patch
     * @param {GlPatch} glpatch
     */
    constructor(patch, glpatch)
    {
        this._log = new Logger("glpatch");

        /** @type {Patch} */
        this._patch = patch;
        this._glPatch = glpatch;
        this._glPatch.patchAPI = this;
        this._flowvisStartFrame = 0;
        this._currentFlowMode = -1;
        this._updateCounter = 0;

        this._patch.on(CABLES.Patch.EVENT_OP_ADDED, this._onAddOp.bind(this));
        this._patch.on(CABLES.Patch.EVENT_OP_DELETED, this._onDeleteOp.bind(this));

        this._patch.on("onLink", this._onLink.bind(this));
        this._patch.on("onUnLink", this._onUnLink.bind(this));
    }

    /**
     * @private
     */
    _initPatch()
    {
        let i = 0;
        for (i = 0; i < this._patch.ops.length; i++)
        {
            const op = this._patch.ops[i];
            this._glPatch.addOp(op);
        }

        for (i = 0; i < this._patch.ops.length; i++)
        {
            const op = this._patch.ops[i];
            if (!op) continue;

            for (let ip = 0; ip < op.portsIn.length; ip++)
            {
                for (let il = 0; il < op.portsIn[ip].links.length; il++)
                {
                    const link = op.portsIn[ip].links[il];

                    let visible = true;// link.portIn.op.uiAttribs.subPatch != gui.patchView.getCurrentSubPatch();

                    const l = new GlLink(
                        this._glPatch,
                        link,
                        link.id,
                        link.portIn.op.id,
                        link.portOut.op.id,
                        link.portIn.name,
                        link.portOut.name,
                        link.portIn.id,
                        link.portOut.id,
                        link.portIn.type,
                        visible,
                        link.portIn.op.uiAttribs.subPatch);
                }
            }
        }
    }

    stopFlowModeActivity()
    {
        for (let i = 0; i < this._patch.ops.length; i++)
        {
            const op = this._patch.ops[i];

            for (let ip = 0; ip < op.portsIn.length; ip++)
            {
                for (let il = 0; il < op.portsIn[ip].links.length; il++)
                {
                    const link = op.portsIn[ip].links[il];
                    this._glPatch.links[link.id].setFlowModeActivity(1, op.portsIn[ip].get());
                }
            }
        }
    }

    updateFlowModeActivity(flowMode)
    {
        if (flowMode == 0) return;

        const frameCount = this._glPatch._cgl.fpsCounter.frameCount;
        if (this._flowvisStartFrame == 0) this._flowvisStartFrame = frameCount;
        if (this._glPatch.frameCount - this._flowvisStartFrame < 6) return;
        if (this._glPatch.frameCount % 5 != 0) return;

        const frames = this._glPatch.frameCount - this._flowvisStartFrame;

        const perf = gui.uiProfiler.start("[glpatch] update flow mode");

        let numUpdates = Math.min(350, this._patch.ops.length);

        for (let ii = 0; ii < numUpdates; ii++)
        {
            let i = (ii + this._updateCounter) % this._patch.ops.length;
            const op = this._patch.ops[i];
            const glop = this._glPatch.getGlOp(op);

            /*
             * if (!glop.visible)
             * {
             *     numUpdates++;
             *     if (numUpdates > this._patch.ops.length) break;
             *     continue;
             * }
             */

            if (op && op.portsIn && op.portsIn[0] && op.portsIn[0].activityCounterStartFrame == frameCount) continue;

            if (op && op.portsOut)
                for (let ip = 0; ip < op.portsOut.length; ip++)
                {
                    op.portsOut[ip].apf = op.portsOut[ip].activityCounter / (frameCount - op.portsOut[ip].activityCounterStartFrame);
                    op.portsOut[ip].activityCounter = 0;
                    op.portsOut[ip].activityCounterStartFrame = frameCount;
                }

            if (op && op.portsIn)
                for (let ip = 0; ip < op.portsIn.length; ip++)
                {
                    op.portsIn[ip].apf = op.portsIn[ip].activityCounter / (frameCount - op.portsIn[ip].activityCounterStartFrame);
                    op.portsIn[ip].activityCounter = 0;
                    op.portsIn[ip].activityCounterStartFrame = frameCount;
                }

            if (glop)
            {
                for (let ip = 0; ip < op.portsOut.length; ip++)
                {
                    const thePort = op.portsOut[ip];
                    const glp = glop.getGlPort(thePort.name);
                    if (glp)glp.setFlowModeActivity(thePort.activityCounter);
                    thePort.activityCounter = 0;
                }
            }

            if (op && op.portsIn)
                for (let ip = 0; ip < op.portsIn.length; ip++)
                {
                    const thePort = op.portsIn[ip];
                    thePort.activityCounter = 0;

                    if (glop)
                    {
                        const glp = glop.getGlPort(thePort.name);
                        if (glp)glp.setFlowModeActivity(thePort.activityCounter);
                    }

                    for (let il = 0; il < thePort.links.length; il++)
                    {
                        const link = thePort.links[il];
                        let newClass = 0;

                        if (link.activityCounter >= 1) newClass = 1;

                        if (flowMode == 2)
                        {
                            if (link.activityCounter >= 10) newClass = (link.activityCounter / 10) + 3;
                            else if (link.activityCounter >= 5) newClass = 3;
                            else if (link.activityCounter >= 2) newClass = 2;
                        }

                        if (this._glPatch.links[link.id]) this._glPatch.links[link.id].setFlowModeActivity(newClass, thePort.get());
                        link.activityCounter = 0;
                    }
                }
        }
        this._updateCounter += numUpdates;
        perf.finish();
    }

    reset()
    {
        this._initPatch();
    }

    _onLink(p1, p2, link, fromDeserialize)
    {
        if (p1.direction != 0)
        {
            const t = p2;
            p2 = p1;
            p1 = t;
        }

        if (!link.portOut)
        {
            // this._log.warn("link has no portout!");
            return;
        }

        if (!fromDeserialize)
        {
            const undofunc = (function (patch, p1Name, p2Name, op1Id, op2Id)
            {
                undo.add({
                    "title": "Link port",
                    "context": {
                        p1Name,
                        p2Name
                    },
                    undo()
                    {
                        const op1 = patch.getOpById(op1Id);
                        const op2 = patch.getOpById(op2Id);
                        if (!op1 || !op2)
                        {
                            this._log.warn("undo: op not found");
                            return;
                        }
                        if (op1.getPortByName(p1Name))
                            op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
                    },
                    redo()
                    {
                        patch.link(patch.getOpById(op1Id), p1Name, patch.getOpById(op2Id), p2Name);
                    }
                });
            }(
                link.portOut.op.patch,
                p1.name,
                p2.name,
                p1.op.id,
                p2.op.id
            ));
        }

        let visible = true;// p1.op.uiAttribs.subPatch != gui.patchView.getCurrentSubPatch();
        const l = new GlLink(this._glPatch, link, link.id, p1.op.id, p2.op.id, p1.name, p2.name, p1.id, p2.id, p1.type, visible, p1.op.uiAttribs.subPatch);
    }

    _onUnLink(a, b, link)
    {
        if (!link) return;

        const undofunc = (function (patch, p1Name, p2Name, op1Id, op2Id)
        {
            undo.add({
                "title": "Unlink port",
                "context": {
                    p1Name,
                    p2Name
                },
                undo()
                {
                    patch.link(patch.getOpById(op1Id), p1Name, patch.getOpById(op2Id), p2Name);
                },
                redo()
                {
                    const op1 = patch.getOpById(op1Id);
                    const op2 = patch.getOpById(op2Id);
                    if (!op1 || !op2)
                    {
                        this._log.warn("undo: op not found");
                        return;
                    }
                    op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
                }
            });
        }(
            link.portOut.op.patch,
            link.portIn.getName(),
            link.portOut.getName(),
            link.portIn.op.id,
            link.portOut.op.id
        ));

        this._glPatch.deleteLink(link.id);
    }

    _onAddOp(op, fromDeserialize)
    {
        this._glPatch.addOp(op, fromDeserialize);
        if (!fromDeserialize) gui.patchView.testCollision(op);

        if (op.checkLinkTimeWarnings)op.checkLinkTimeWarnings();

        op.on("onPortAdd", (p) =>
        {
            const glop = this._glPatch.getGlOp(op);
            if (glop) glop.updateSize();
        });
    }

    _onDeleteOp(op)
    {
        if (!undo.paused()) gui.savedState.setUnSaved("patchApiOnDeleteOp", op.getSubPatch());

        let updateSubs = false;

        if (op.isSubPatchOp()) updateSubs = true;

        this._glPatch.deleteOp(op.id);

        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        hideToolTip();

        if (updateSubs)
            gui.bookmarks.needRefreshSubs = true;
    }

    showOpParams(opid)
    {
        setTimeout(() =>
        {
            const op = gui.corePatch().getOpById(opid);
            gui.opParams.show(op);
        }, 33);
    }

    removeLink(opIdIn, opIdOut, portIdIn, portIdOut)
    {
        const opIn = gui.corePatch().getOpById(opIdIn);
        const pIn = opIn.getPortById(portIdIn);
        const opOut = gui.corePatch().getOpById(opIdOut);
        const pOut = opOut.getPortById(portIdOut);
        if (!pOut) return;
        const l = pOut.getLinkTo(pIn);

        if (l) l.remove();
        else this._log.error("could not remove link");
    }

    /*
     * addOpIntoLink(opIdIn, opIdOut, portIdIn, portIdOut, x, y)
     * {
     *     const opIn = gui.corePatch().getOpById(opIdIn);
     *     const pIn = opIn.getPortById(portIdIn);
     *     const opOut = gui.corePatch().getOpById(opIdOut);
     *     const pOut = opOut.getPortById(portIdOut);
     *     const link = pOut.getLinkTo(pIn);
     *     // options, linkOp, linkPort, link)
     *     gui.opSelect().show({ "x": 0,
     *         "y": 0,
     *         "onOpAdd": (op) =>
     *         {
     *             // op.setUiAttrib({ "translate": { "x": coord[0], "y": coord[1] } });
     *             op.setUiAttrib({ "translate": { "x": x, "y": y } });
     *         } }, null, null, link);
     * }
     */

    deleteOp(id)
    {
        gui.corePatch().deleteOp(id, true);
    }

    setOpUiAttribs(opid, attrName, val)
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op)
        {
            this._log.warn("[setOpUiAttribs] op not found");
            return;
        }

        const attr = {};
        attr[attrName] = val;
        op.setUiAttrib(attr);
    }

    _watchOp(op)
    {
    }
}
