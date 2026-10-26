import { TalkerAPI } from "cables-shared-client";
import { CmdPatch } from "../../commands/cmd_patch.js";
import subPatchOpUtil from "../../subpatchop_util.js";

/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    describe("ui: create subpatch op from selection", () =>
    {
        const createdOps = [];
        let newOpName = null;

        afterEach(() =>
        {
            for (let i = 0; i < createdOps.length; i++)
                if (t.gui.corePatch().getOpById(createdOps[i])) t.gui.corePatch().deleteOp(createdOps[i]);
            createdOps.length = 0;
        });

        it("marks the new subpatch as saved", function (done)
        {
            this.timeout(30000);

            const patch = t.gui.corePatch();
            const opA = patch.addOp("Ops.Math.Sum");
            const opB = patch.addOp("Ops.Math.Sum");
            createdOps.push(opA.id, opB.id);
            patch.link(opA, "result", opB, "number1");

            t.gui.patchView.unselectAllOps();
            t.gui.patchView.selectOpId(opA.id);
            t.gui.patchView.selectOpId(opB.id);

            newOpName = subPatchOpUtil.getAutoName();

            const listener = t.gui.on("createdSubPatchOp", (newOp, subPatchId) =>
            {
                t.gui.off(listener);
                createdOps.push(newOp.id);
                try
                {
                    t.expect(newOp.objName).to.equal(newOpName);
                    t.expect(t.gui.savedState.getStateBlueprint(subPatchId)).to.equal(true);
                    t.expect(t.gui.savedState.isSavedSubPatch(subPatchId)).to.equal(true);
                    done();
                }
                catch (e) { done(e); }
            });

            CmdPatch.createOpFromSelection({ "newOpName": newOpName, "ignoreNsCheck": true });
        });

        describe("with links crossing the selection", () =>
        {
            let outerA = null;
            let innerB = null;
            let innerC = null;
            let outerD = null;

            const waitFor = (check, timeout, next) =>
            {
                const start = Date.now();
                const tick = () =>
                {
                    check((ok, result) =>
                    {
                        if (ok || Date.now() - start > timeout) next(result);
                        else setTimeout(tick, 200);
                    });
                };
                tick();
            };

            const createFromSelection = (next) =>
            {
                const patch = t.gui.corePatch();
                outerA = patch.addOp("Ops.Math.Sum");
                innerB = patch.addOp("Ops.Math.Sum");
                innerC = patch.addOp("Ops.Math.Sum");
                outerD = patch.addOp("Ops.Math.Sum");
                createdOps.push(outerA.id, innerB.id, innerC.id, outerD.id);
                patch.link(outerA, "result", innerB, "number1");
                patch.link(innerB, "result", innerC, "number1");
                patch.link(innerC, "result", outerD, "number1");

                t.gui.patchView.unselectAllOps();
                t.gui.patchView.selectOpId(innerB.id);
                t.gui.patchView.selectOpId(innerC.id);

                newOpName = subPatchOpUtil.getAutoName();

                const listener = t.gui.on("createdSubPatchOp", (newOp, subPatchId) =>
                {
                    t.gui.off(listener);
                    createdOps.push(newOp.id);
                    next(newOp, subPatchId);
                });

                CmdPatch.createOpFromSelection({ "newOpName": newOpName, "ignoreNsCheck": true });
            };

            it("contains the selected ops when created", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp, subPatchId) =>
                {
                    try
                    {
                        const subOps = t.gui.corePatch().getSubPatchOps(subPatchId, false);
                        let sums = 0;
                        for (let i = 0; i < subOps.length; i++) if (subOps[i].objName == "Ops.Math.Sum") sums++;
                        t.expect(sums).to.equal(2);
                        done();
                    }
                    catch (e) { done(e); }
                });
            });

            it("links the inner ops to the subpatch input and output", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp, subPatchId) =>
                {
                    try
                    {
                        const inputOp = t.gui.corePatch().getSubPatch2InnerInputOp(subPatchId);
                        const outputOp = t.gui.corePatch().getSubPatch2InnerOutputOp(subPatchId);
                        t.expect(inputOp).to.exist;
                        t.expect(outputOp).to.exist;

                        let linksFromInput = 0;
                        for (let i = 0; i < inputOp.portsOut.length; i++) linksFromInput += inputOp.portsOut[i].links.length;
                        let linksToOutput = 0;
                        for (let i = 0; i < outputOp.portsIn.length; i++) linksToOutput += outputOp.portsIn[i].links.length;

                        t.expect(linksFromInput).to.equal(1);
                        t.expect(linksToOutput).to.equal(1);
                        done();
                    }
                    catch (e) { done(e); }
                });
            });

            it("links the outer ops to the subpatch op", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp) =>
                {
                    try
                    {
                        let linksIn = 0;
                        for (let i = 0; i < newOp.portsIn.length; i++) linksIn += newOp.portsIn[i].links.length;
                        let linksOut = 0;
                        for (let i = 0; i < newOp.portsOut.length; i++) linksOut += newOp.portsOut[i].links.length;
                        t.expect(linksIn).to.equal(1);
                        t.expect(linksOut).to.equal(1);
                        done();
                    }
                    catch (e) { done(e); }
                });
            });

            it("saves the inner links to the subpatch attachment", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp) =>
                {
                    const readSaved = (cb) =>
                    {
                        t.platform.talkerAPI.send(
                            TalkerAPI.CMD_GET_OP_ATTACHMENT,
                            { "opname": newOp.opId, "name": subPatchOpUtil.blueprintSubpatchAttachmentFilename },
                            (err, res) =>
                            {
                                if (err || !res || !res.content) return cb(false, null);
                                const saved = JSON.parse(res.content);
                                let linked = false;
                                for (let i = 0; i < saved.ops.length; i++)
                                {
                                    const outs = saved.ops[i].portsOut || [];
                                    for (let j = 0; j < outs.length; j++)
                                        if (outs[j].name.indexOf("innerOut_") == 0 && outs[j].links && outs[j].links.length) linked = true;
                                }
                                cb(linked, saved);
                            }
                        );
                    };

                    waitFor(readSaved, 10000, (saved) =>
                    {
                        try
                        {
                            t.expect(saved).to.exist;
                            let hasInputLinks = false;
                            let hasTempAttrib = false;
                            for (let i = 0; i < saved.ops.length; i++)
                            {
                                if (saved.ops[i].uiAttribs && saved.ops[i].uiAttribs.tempSubOldOpId) hasTempAttrib = true;
                                const outs = saved.ops[i].portsOut || [];
                                for (let j = 0; j < outs.length; j++)
                                    if (outs[j].name.indexOf("innerOut_") == 0 && outs[j].links && outs[j].links.length) hasInputLinks = true;
                            }
                            t.expect(hasInputLinks, "saved attachment has links from subpatch input").to.equal(true);
                            t.expect(hasTempAttrib, "saved attachment has leftover tempSubOldOpId").to.equal(false);
                            done();
                        }
                        catch (e) { done(e); }
                    });
                });
            });
        });
    });
}
