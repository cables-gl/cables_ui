CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPatchAPI = class
{
    constructor(patch, glpatch)
    {
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
                    const l = new CABLES.GLGUI.GlLink(
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
                    this._glPatch.links[link.id].setFlowModeActivity(1);
                }
            }
        }
    }

    updateFlowModeActivity()
    {
        if (this._flowvisStartFrame == 0) this._flowvisStartFrame = this._glPatch.frameCount;
        if (this._glPatch.frameCount - this._flowvisStartFrame < 6) return;
        if (this._glPatch.frameCount % 6 != 0) return;

        const perf = CABLES.uiperf.start("[glpatch] update flow mode");
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
                    if (link.activityCounter >= 2) newClass = 2;
                    if (link.activityCounter >= 5) newClass = 3;
                    if (link.activityCounter >= 10) newClass = (link.activityCounter / 10) + 3;

                    this._glPatch.links[link.id].setFlowModeActivity(newClass);
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

    _onLink(p1, p2, link)
    {
        if (p1.direction != 0)
        {
            const t = p2;
            p2 = p1;
            p1 = t;
        }

        console.log("ONLINK!", link);
        const l = new CABLES.GLGUI.GlLink(this._glPatch, link, link.id, p1.parent.id, p2.parent.id,
            p1.name, p2.name,
            p1.id, p2.id,
            p1.type);
    }

    _onUnLink(a, b, link)
    {
        if (!link) return;

        const undofunc = (function (patch, p1Name, p2Name, op1Id, op2Id)
        {
            CABLES.undo.add({
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
                        console.warn("undo: op not found");
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

    _onAddOp(op)
    {
        this._glPatch.addOp(op);
    }

    _onDeleteOp(op)
    {
        this._glPatch.deleteOp(op.id);
    }

    showOpParams(opid)
    {
        const op = gui.corePatch().getOpById(opid);
        gui.opParams.show(op);
    }

    removeLink(opIdIn, opIdOut, portIdIn, portIdOut)
    {
        console.log("patchapi removeLink!");

        const opIn = gui.corePatch().getOpById(opIdIn);
        const pIn = opIn.getPortById(portIdIn);
        const opOut = gui.corePatch().getOpById(opIdOut);
        const pOut = opOut.getPortById(portIdOut);
        const l = pOut.getLinkTo(pIn);

        if (l) l.remove();
        else console.error("could not remove link");
    }

    addOpIntoLink(opIdIn, opIdOut, portIdIn, portIdOut, x, y)
    {
        const opIn = gui.corePatch().getOpById(opIdIn);
        const pIn = opIn.getPortById(portIdIn);
        const opOut = gui.corePatch().getOpById(opIdOut);
        const pOut = opOut.getPortById(portIdOut);
        const link = pOut.getLinkTo(pIn);
        // options, linkOp, linkPort, link)
        gui.opSelect().show({ "x": 0,
            "y": 0,
            "onOpAdd": (op) =>
            {
                op.setUiAttrib({ "translate": { "x": x, "y": y } });
                // console.log("ONOPADD!!!", x, y);
                // op.uiAttribs.translate.x = x;
                // op.uiAttribs.translate.y = y;
            } }, null, null, link);
    }

    deleteOp(id)
    {
        gui.corePatch().deleteOp(id, true);
    }

    setOpUiAttribs(opid, attrName, val)
    {
        const op = gui.corePatch().getOpById(opid);
        const attr = {};
        attr[attrName] = val;
        op.setUiAttrib(attr);
    }

    _watchOp(op)
    {
    }
};
