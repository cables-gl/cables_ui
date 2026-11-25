import { TalkerAPI } from "cables-shared-client";
import { CmdPatch } from "../../commands/cmd_patch.js";
import subPatchOpUtil from "../../subpatchop_util.js";

/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    const createdOps = [];
    const createdOpNames = [];

    const cleanUp = () =>
    {
        const patch = t.gui.corePatch();
        for (let i = 0; i < createdOps.length; i++)
            if (patch.getOpById(createdOps[i])) patch.deleteOp(createdOps[i]);

        // executing a subpatch op replaces its instance, so find the current ones by name
        for (let i = 0; i < createdOpNames.length; i++)
        {
            const ops = patch.getOpsByObjName(createdOpNames[i]);
            for (let j = 0; j < ops.length; j++) patch.deleteOp(ops[j].id);
        }
        createdOps.length = 0;
        createdOpNames.length = 0;
    };

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

    /**
     * @param {string} opId
     * @param {string} name
     * @param {function} cb
     */
    const readAttachment = (opId, name, cb) =>
    {
        t.platform.talkerAPI.send(
            TalkerAPI.CMD_GET_OP_ATTACHMENT,
            { "opname": opId, "name": name },
            (err, res) =>
            {
                if (err || !res || !res.content) return cb(null);
                cb(JSON.parse(res.content));
            });
    };

    const countOps = (ops, objName) =>
    {
        let num = 0;
        for (let i = 0; i < ops.length; i++) if (ops[i].objName == objName) num++;
        return num;
    };

    /**
     * outerA -> innerB -> innerC -> outerD, innerB and innerC become the subpatch op
     * @param {function} next
     */
    const createFromSelection = (next) =>
    {
        const patch = t.gui.corePatch();
        const ops = {
            "outerA": patch.addOp("Ops.Math.Sum"),
            "innerB": patch.addOp("Ops.Math.Sum"),
            "innerC": patch.addOp("Ops.Math.Sum"),
            "outerD": patch.addOp("Ops.Math.Sum")
        };
        createdOps.push(ops.outerA.id, ops.innerB.id, ops.innerC.id, ops.outerD.id);
        patch.link(ops.outerA, "result", ops.innerB, "number1");
        patch.link(ops.innerB, "result", ops.innerC, "number1");
        patch.link(ops.innerC, "result", ops.outerD, "number1");

        t.gui.patchView.unselectAllOps();
        t.gui.patchView.selectOpId(ops.innerB.id);
        t.gui.patchView.selectOpId(ops.innerC.id);

        const newOpName = subPatchOpUtil.getAutoName();
        createdOpNames.push(newOpName);

        const listener = t.gui.on("createdSubPatchOp", (newOp, subPatchId) =>
        {
            t.gui.off(listener);
            next(newOp, subPatchId, ops);
        });

        CmdPatch.createOpFromSelection({ "newOpName": newOpName, "ignoreNsCheck": true });
    };

    /**
     * calls cb after each save of a subpatch attachment that also executes the op, until the returned function is called
     * @param {function} cb
     */
    const onExecutingSave = (cb) =>
    {
        const orig = subPatchOpUtil.updateSubPatchOpAttachment;
        subPatchOpUtil.updateSubPatchOpAttachment = (op, options = {}) =>
        {
            const next = options.next;
            orig(op, {
                ...options,
                "next": () =>
                {
                    if (next) next();
                    if (options.execute !== false) cb(op);
                }
            });
        };
        return () => { subPatchOpUtil.updateSubPatchOpAttachment = orig; };
    };

    describe("ui: create subpatch op from selection", () =>
    {
        afterEach(cleanUp);

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

            const newOpName = subPatchOpUtil.getAutoName();
            createdOpNames.push(newOpName);

            const listener = t.gui.on("createdSubPatchOp", (newOp, subPatchId) =>
            {
                t.gui.off(listener);
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
            it("contains the selected ops when created", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp, subPatchId) =>
                {
                    try
                    {
                        t.expect(countOps(t.gui.corePatch().getSubPatchOps(subPatchId, false), "Ops.Math.Sum")).to.equal(2);
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
                        readAttachment(newOp.opId, subPatchOpUtil.blueprintSubpatchAttachmentFilename, (saved) =>
                        {
                            if (!saved) return cb(false, null);
                            let linked = false;
                            for (let i = 0; i < saved.ops.length; i++)
                            {
                                const outs = saved.ops[i].portsOut || [];
                                for (let j = 0; j < outs.length; j++)
                                    if (outs[j].name.indexOf("innerOut_") == 0 && outs[j].links && outs[j].links.length) linked = true;
                            }
                            cb(linked, saved);
                        });
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

            it("saves a port for each crossing link", function (done)
            {
                this.timeout(30000);

                createFromSelection((newOp) =>
                {
                    readAttachment(newOp.opId, subPatchOpUtil.blueprintPortJsonAttachmentFilename, (portsJson) =>
                    {
                        try
                        {
                            t.expect(portsJson).to.exist;
                            t.expect(portsJson.ports.length).to.equal(2);
                            done();
                        }
                        catch (e) { done(e); }
                    });
                });
            });
        });
    });

    describe("ui: save and execute subpatch op", () =>
    {
        afterEach(cleanUp);

        it("saves ops added inside the subpatch", function (done)
        {
            this.timeout(30000);

            createFromSelection((newOp, subPatchId) =>
            {
                const added = t.gui.corePatch().addOp("Ops.Math.Sum", { "subPatch": subPatchId });

                subPatchOpUtil.updateSubPatchOpAttachment(newOp, {
                    "oldSubId": subPatchId,
                    "execute": false,
                    "next": () =>
                    {
                        readAttachment(newOp.opId, subPatchOpUtil.blueprintSubpatchAttachmentFilename, (saved) =>
                        {
                            try
                            {
                                t.expect(added).to.exist;
                                t.expect(saved).to.exist;
                                t.expect(saved.ops.filter((o) => { return o.opId == added.opId; }).length).to.equal(3);
                                done();
                            }
                            catch (e) { done(e); }
                        });
                    }
                });
            });
        });

        it("keeps its contents after executing", function (done)
        {
            this.timeout(30000);

            createFromSelection((newOp) =>
            {
                t.gui.serverOps.execute(newOp.opId, (newOps) =>
                {
                    const subPatchId = newOps[0].patchId.get();
                    subPatchOpUtil.onSubPatchLoaded(subPatchId, () =>
                    {
                        try
                        {
                            t.expect(newOps[0].id).to.not.equal(newOp.id);
                            t.expect(countOps(t.gui.corePatch().getSubPatchOps(subPatchId, false), "Ops.Math.Sum")).to.equal(2);
                            t.expect(t.gui.corePatch().getSubPatch2InnerInputOp(subPatchId)).to.exist;
                            t.expect(t.gui.corePatch().getSubPatch2InnerOutputOp(subPatchId)).to.exist;
                            done();
                        }
                        catch (e) { done(e); }
                    });
                });
            });
        });
    });

    describe("ui: add port to subpatch op", () =>
    {
        let stopListening = null;

        afterEach(() =>
        {
            if (stopListening) stopListening();
            stopListening = null;
            cleanUp();
        });

        /**
         * adds a port for an inner op port, calls next after the final save with the reloaded op
         * @param {function} getPort gets the subpatch id, returns the inner port
         * @param {function} next
         */
        const addPort = (getPort, next) =>
        {
            createFromSelection((newOp, subPatchId) =>
            {
                let newPortJson = null;
                stopListening = onExecutingSave((savedOp) =>
                {
                    if (!newPortJson) return;
                    stopListening();
                    stopListening = null;
                    next(savedOp, newPortJson);
                });

                subPatchOpUtil.addPortToSubpatch(newOp.opId, getPort(subPatchId), {
                    "cb": (portJson) => { newPortJson = portJson; }
                });
            });
        };

        const findInnerSum = (subPatchId) =>
        {
            const ops = t.gui.corePatch().getSubPatchOps(subPatchId, false);
            for (let i = 0; i < ops.length; i++) if (ops[i].objName == "Ops.Math.Sum") return ops[i];
        };

        it("keeps the subpatch contents in the saved attachment", function (done)
        {
            this.timeout(30000);

            addPort((subPatchId) => { return findInnerSum(subPatchId).getPort("number2"); }, (op) =>
            {
                readAttachment(op.opId, subPatchOpUtil.blueprintSubpatchAttachmentFilename, (saved) =>
                {
                    try
                    {
                        t.expect(saved).to.exist;
                        t.expect(saved.ops.length, "saved subpatch ops").to.equal(4);
                        t.expect(countOps(t.gui.corePatch().getSubPatchOps(op.patchId.get(), false), "Ops.Math.Sum")).to.equal(2);
                        done();
                    }
                    catch (e) { done(e); }
                });
            });
        });

        it("saves the new port", function (done)
        {
            this.timeout(30000);

            addPort((subPatchId) => { return findInnerSum(subPatchId).getPort("number2"); }, (op, newPortJson) =>
            {
                readAttachment(op.opId, subPatchOpUtil.blueprintPortJsonAttachmentFilename, (portsJson) =>
                {
                    try
                    {
                        t.expect(portsJson.ports.length).to.equal(3);
                        t.expect(portsJson.ports.some((p) => { return p.id == newPortJson.id; })).to.equal(true);
                        t.expect(op.getPort(newPortJson.id)).to.exist;
                        done();
                    }
                    catch (e) { done(e); }
                });
            });
        });

        it("links the inner port to the subpatch input", function (done)
        {
            this.timeout(30000);

            addPort((subPatchId) => { return findInnerSum(subPatchId).getPort("number2"); }, (op, newPortJson) =>
            {
                try
                {
                    const inputOp = t.gui.corePatch().getSubPatch2InnerInputOp(op.patchId.get());
                    const p = inputOp.getPort("innerOut_" + newPortJson.id);
                    t.expect(p).to.exist;
                    t.expect(p.links.length).to.equal(1);
                    t.expect(p.links[0].getOtherPort(p).name).to.equal("number2");
                    done();
                }
                catch (e) { done(e); }
            });
        });

        it("links ops that were added after the subpatch was loaded", function (done)
        {
            this.timeout(30000);

            addPort((subPatchId) =>
            {
                const added = t.gui.corePatch().addOp("Ops.Math.Multiply", { "subPatch": subPatchId });
                return added.getPort("number1");
            }, (op, newPortJson) =>
            {
                try
                {
                    const subPatchId = op.patchId.get();
                    t.expect(countOps(t.gui.corePatch().getSubPatchOps(subPatchId, false), "Ops.Math.Multiply"), "added op survives reload").to.equal(1);

                    const inputOp = t.gui.corePatch().getSubPatch2InnerInputOp(subPatchId);
                    const p = inputOp.getPort("innerOut_" + newPortJson.id);
                    t.expect(p.links.length).to.equal(1);
                    t.expect(p.links[0].getOtherPort(p).op.objName).to.equal("Ops.Math.Multiply");
                    done();
                }
                catch (e) { done(e); }
            });
        });
    });

    describe("ui: onSubPatchLoaded", () =>
    {
        it("calls back right away when the subpatch has ops", () =>
        {
            let called = false;
            subPatchOpUtil.onSubPatchLoaded(0, () => { called = true; });
            t.expect(called).to.equal(true);
        });

        it("waits for the subpatch to be exposed", () =>
        {
            const subId = "test_" + Date.now();
            let called = 0;
            subPatchOpUtil.onSubPatchLoaded(subId, () => { called++; });
            t.expect(called).to.equal(0);

            t.gui.corePatch().emitEvent("subpatchExpose", "other");
            t.expect(called).to.equal(0);

            t.gui.corePatch().emitEvent("subpatchExpose", subId);
            t.gui.corePatch().emitEvent("subpatchExpose", subId);
            t.expect(called).to.equal(1);
        });
    });
}
