
import GlLink from "./gllink";
import Logger from "../utils/logger";

export default class GlPatchAPI
{
    constructor(patch, glpatch)
    {
        this._log = new Logger("glpatch");

        this._patch = patch;
        this._glPatch = glpatch;
        this._glPatch.patchAPI = this;
        this._flowvisStartFrame = 0;

        this._patch.addEventListener("onOpAdd", this._onAddOp.bind(this));
        this._patch.addEventListener("onOpDelete", this._onDeleteOp.bind(this));

        this._patch.addEventListener("onLink", this._onLink.bind(this));
        this._patch.addEventListener("onUnLink", this._onUnLink.bind(this));
    }

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

            for (let ip = 0; ip < op.portsIn.length; ip++)
            {
                for (let il = 0; il < op.portsIn[ip].links.length; il++)
                {
                    const link = op.portsIn[ip].links[il];
                    const l = new GlLink(
                        this._glPatch,
                        link,
                        link.id,
                        link.portIn.parent.id,
                        link.portOut.parent.id,
                        link.portIn.name,
                        link.portOut.name,
                        link.portIn.id,
                        link.portOut.id,
                        link.portIn.type);
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

    updateFlowModeActivity()
    {
        const flowMode = CABLES.UI.userSettings.get("glflowmode");

        if (this._flowvisStartFrame == 0) this._flowvisStartFrame = this._glPatch.frameCount;
        if (this._glPatch.frameCount - this._flowvisStartFrame < 6) return;
        if (this._glPatch.frameCount % 6 != 0) return;

        const perf = CABLES.UI.uiProfiler.start("[glpatch] update flow mode");
        for (let i = 0; i < this._patch.ops.length; i++)
        {
            const op = this._patch.ops[i];

            for (let ip = 0; ip < op.portsIn.length; ip++)
            {
                for (let il = 0; il < op.portsIn[ip].links.length; il++)
                {
                    const link = op.portsIn[ip].links[il];
                    let newClass = 0;

                    if (link.activityCounter >= 1) newClass = 1;

                    if (flowMode)
                    {
                        if (link.activityCounter >= 2) newClass = 2;

                        if (link.activityCounter >= 5) newClass = 3;
                        if (link.activityCounter >= 10) newClass = (link.activityCounter / 10) + 3;
                    }

                    if (this._glPatch.links[link.id])
                        this._glPatch.links[link.id].setFlowModeActivity(newClass, op.portsIn[ip].get());
                    link.activityCounter = 0;
                }
            }
        }
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
                CABLES.UI.undo.add({
                    "title": "Link port",
                    undo()
                    {
                        const op1 = patch.getOpById(op1Id);
                        const op2 = patch.getOpById(op2Id);
                        if (!op1 || !op2)
                        {
                            this._log.warn("undo: op not found");
                            return;
                        }
                        op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
                    },
                    redo()
                    {
                        patch.link(patch.getOpById(op1Id), p1Name, patch.getOpById(op2Id), p2Name);
                    }
                });
            }(
                link.portOut.parent.patch,
                p1.name,
                p2.name,
                p1.parent.id,
                p2.parent.id
            ));
        }

        let visible = p1.parent.uiAttribs.subPatch != gui.patchView.getCurrentSubPatch();

        const l = new GlLink(this._glPatch, link, link.id, p1.parent.id, p2.parent.id,
            p1.name, p2.name,
            p1.id, p2.id,
            p1.type, visible, p1.parent.uiAttribs.subPatch);
    }

    _onUnLink(a, b, link)
    {
        if (!link) return;

        const undofunc = (function (patch, p1Name, p2Name, op1Id, op2Id)
        {
            CABLES.UI.undo.add({
                "title": "Unlink port",
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
            link.portOut.parent.patch,
            link.portIn.getName(),
            link.portOut.getName(),
            link.portIn.parent.id,
            link.portOut.parent.id
        ));

        this._glPatch.deleteLink(link.id);
    }

    _onAddOp(op, fromDeserialize)
    {
        this._glPatch.addOp(op, fromDeserialize);
        if (!fromDeserialize) gui.patchView.testCollision(op);

        op.on("onPortAdd", (p) =>
        {
            const glop = this._glPatch.getGlOp(op);
            if (glop) glop.updateSize();
        });
    }

    _onDeleteOp(op)
    {
        if (!CABLES.UI.undo.paused()) gui.setStateUnsaved();

        this._glPatch.deleteOp(op.id);

        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        CABLES.UI.hideToolTip();
    }

    showOpParams(opid)
    {
        const op = gui.corePatch().getOpById(opid);
        gui.opParams.show(op);
    }

    removeLink(opIdIn, opIdOut, portIdIn, portIdOut)
    {
        const opIn = gui.corePatch().getOpById(opIdIn);
        const pIn = opIn.getPortById(portIdIn);
        const opOut = gui.corePatch().getOpById(opIdOut);
        const pOut = opOut.getPortById(portIdOut);
        const l = pOut.getLinkTo(pIn);

        if (l) l.remove();
        else this._log.error("could not remove link");
    }


    // addOpIntoLink(opIdIn, opIdOut, portIdIn, portIdOut, x, y)
    // {
    //     const opIn = gui.corePatch().getOpById(opIdIn);
    //     const pIn = opIn.getPortById(portIdIn);
    //     const opOut = gui.corePatch().getOpById(opIdOut);
    //     const pOut = opOut.getPortById(portIdOut);
    //     const link = pOut.getLinkTo(pIn);
    //     // options, linkOp, linkPort, link)
    //     gui.opSelect().show({ "x": 0,
    //         "y": 0,
    //         "onOpAdd": (op) =>
    //         {
    //             // op.setUiAttrib({ "translate": { "x": coord[0], "y": coord[1] } });
    //             op.setUiAttrib({ "translate": { "x": x, "y": y } });
    //         } }, null, null, link);
    // }

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
