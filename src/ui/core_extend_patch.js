/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */

import { gui } from "./gui.js";

export default function extendCorePatch()
{
    // @ts-expect-error
    CABLES.Patch.prototype._opIdsToOps = function (opids)
    {
        let ops = [];
        for (let i = 0; i < opids.length; i++)
        {
            ops.push(this.getOpById(opids[i]));
        }
        return ops;
    };

    CABLES.Patch.prototype.hasOp = function (op)
    {
        for (const i in this.ops)
        {
            if (this.ops[i].opId === op.opId) return true;
            if (this.ops[i].objName === op.objName) return true;
        }
        return false;
    };

    CABLES.Patch.prototype.getOpByRefId = function (refId, subPatchId)
    {
        const ops = this.getSubPatchOps(subPatchId);
        if (ops)
            for (let i = 0; i < ops.length; i++)
                if (ops[i].storage && ops[i].storage.ref == refId) return ops[i];
    };

    CABLES.Patch.prototype.clearSubPatchCache = function (patchId)
    {
        if (patchId === undefined)
        {
            this._subpatchOpCache = {};
            return;
        }
        this._subpatchOpCache = this._subpatchOpCache || {};
        delete this._subpatchOpCache[patchId];
    };

    CABLES.Patch.prototype._subPatchCacheAdd = function (subPatchId, op)
    {
        if (this._subpatchOpCache[subPatchId])
        {
            this._subpatchOpCache[subPatchId].ops = this._subpatchOpCache[subPatchId].ops || {};
            this._subpatchOpCache[subPatchId].ops[op.id] = op;
        }
    };

    CABLES.Patch.prototype.getSubPatchOps = function (subPatchId, recursive = false)
    {
        if (subPatchId === undefined) subPatchId = gui.patchView.getCurrentSubPatch();
        if (this.ops.length == 0) return [];
        const perf = gui.uiProfiler.start("[corepatch ext] getSubPatchOps");

        this._subpatchOpCache = this._subpatchOpCache || {};

        let opids = [];

        if (this._subpatchOpCache[subPatchId] && this._subpatchOpCache[subPatchId].ops)
        {
            // console.log("cache hit");
            opids = this._subpatchOpCache[subPatchId].ops;
        }
        else
        {
            // console.log("creating cache...ops:", this.ops.length);
            for (let i = 0; i < this.ops.length; i++)
            {
                // console.log("creating cache ", subPatchId, this.ops.length);
                const op = this.ops[i];
                if (!op || !op.uiAttribs) continue;

                // console.log("creating cache ", subPatchId, op.uiAttribs.subPatch, this.ops);

                if ((op.uiAttribs && op.uiAttribs.subPatch == subPatchId) || !op.uiAttribs.hasOwnProperty("subPatch"))
                {
                    this._subpatchOpCache[subPatchId] = this._subpatchOpCache[subPatchId] || {};// "ops": {}, "subPatchOpId": null };
                    this._subpatchOpCache[subPatchId].ops = this._subpatchOpCache[subPatchId].ops || {};
                    this._subpatchOpCache[subPatchId].ops[op.id] = op;
                }

                // if (op.isSubPatchOp()) console.log("issub", op.isSubPatchOp(), op.patchId.get(), subPatchId);

                if (op.isSubPatchOp())
                {
                    this._subpatchOpCache[op.patchId.get()] = this._subpatchOpCache[op.patchId.get()] || {};
                    this._subpatchOpCache[op.patchId.get()].subPatchOpId = op.id;
                    // console.log("subpatchiopid", op.patchId.get());
                }
            }
            // this._subpatchOpCache[subPatchId].ops = opids;
        }
        if (!this._subpatchOpCache[subPatchId] || !this._subpatchOpCache[subPatchId].ops)
        {
            // console.log("no cache", subPatchId);
        }
        else
            opids = Object.keys(this._subpatchOpCache[subPatchId].ops);

        let ops = this._opIdsToOps(opids);

        if (recursive)
        {
            for (const i in ops)
            {
                if (ops[i].storage && ops[i].storage.subPatchVer)
                {
                    const subPatchPort = ops[i].portsIn.find((port) => { return port.name === "patchId"; });
                    if (subPatchPort)
                    {
                        if (subPatchPort.value != subPatchId)
                            ops = ops.concat(this.getSubPatchOps(subPatchPort.value, true));
                    }
                }
            }
        }

        perf.finish();
        return ops;
    };

    CABLES.Patch.prototype.getSubPatch2InnerInputOp = function (subPatchId)
    {
        const ops = gui.corePatch().getSubPatchOps(subPatchId);
        for (let i = 0; i < ops.length; i++)
            if (ops[i].innerInput) return ops[i];
    };

    CABLES.Patch.prototype.getSubPatch2InnerOutputOp = function (subPatchId)
    {
        const ops = gui.corePatch().getSubPatchOps(subPatchId);
        for (let i = 0; i < ops.length; i++)
            if (ops[i].innerOutput) return ops[i];
    };

    CABLES.Patch.prototype.buildSubPatchCache = () =>
    {
        const perf = gui.uiProfiler.start("[corePatch ext] buildSubPatchCache");

        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch)
            {
                gui.corePatch().getSubPatchOuterOp(ops[i].uiAttribs.subPatch);
            }
        }

        perf.finish();
    };

    CABLES.Patch.prototype.getNewSubpatchId = function (oldSubPatchId)
    {
        for (let i in this._subpatchOpCache)
        {
            if (this._subpatchOpCache[i].subPatchOpId)
            {
                const outerOp = this.getOpById(this._subpatchOpCache[i].subPatchOpId);
                if (outerOp.oldSubPatchIds && outerOp.oldSubPatchIds.indexOf(oldSubPatchId) > -1)
                {
                    return i;
                }
            }
        }
    };

    CABLES.Patch.prototype.getSubPatchOuterOp = function (subPatchId, ignoreNotFound)
    {
        if (subPatchId == 0) return null;
        // oldSubPatchIds

        if (!this._subpatchOpCache[subPatchId] || !this._subpatchOpCache[subPatchId].subPatchOpId)
        {
            if (!ignoreNotFound)
            {
                this.clearSubPatchCache(subPatchId);
                this.getSubPatchOps(subPatchId); // try build cache
            }
            else return null;
        }

        // console.log(this._subpatchOpCache);
        // console.log("subpatchopdi", this._subpatchOpCache[subPatchId].subPatchOpId);

        if (!this._subpatchOpCache[subPatchId])
        {
            // console.log("subpatch [cache] not found", subPatchId);
            return null;
        }
        let op = this.getOpById(this._subpatchOpCache[subPatchId].subPatchOpId);
        if (op) return op;

        // const ops = this.ops;
        // for (let i = 0; i < ops.length; i++)
        // {
        //     op = ops[i];
        //     if (op.isSubPatchOp() && op.patchId.get() == subPatchId) return op;
        // }

        // console.log("not found+?!?!?!");
        return null;
    };

    CABLES.Patch.prototype.getOpsInRect = function (xa, ya, xb, yb)
    {
        const perf = gui.uiProfiler.start("[extPatch] ops in rect");
        const x = Math.min(xa, xb);
        const y = Math.min(ya, yb);
        const x2 = Math.max(xa, xb);
        const y2 = Math.max(ya, yb);
        const ops = [];
        const cops = gui.corePatch().getSubPatchOps();

        for (let j = 0; j < cops.length; j++)
        {
            if (cops[j])
            {
                const op = cops[j];
                if (
                    op.uiAttribs &&
                    op.uiAttribs.translate &&
                    op.uiAttribs.translate.x >= x && // op.uiAttribs.translate. right edge past r2 left
                        op.uiAttribs.translate.x <= x2 && // op.uiAttribs.translate. left edge past r2 right
                        op.uiAttribs.translate.y >= y && // op.uiAttribs.translate. top edge past r2 bottom
                        op.uiAttribs.translate.y <= y2) // r1 bottom edge past r2 top
                {
                    ops.push(op);
                    // console.log(1);
                }
            }
            // else console.log("no c op");
        }

        perf.finish();

        return ops;
    };

    CABLES.Patch.prototype.getAllAnimPorts = function ()
    {
        const ports = [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            for (let j = 0; j < ops[i].portsIn.length; j++)
            {
                if (ops[i].portsIn[j].isAnimated())ports.push(ops[i].portsIn[j]);

            }
        }

        return ports;
    };

    CABLES.Patch.prototype.reloadOp = function (objName, cb, refOldOp)
    {
        let count = 0;
        const ops = [];
        const oldOps = [];

        gui.patchView.unselectAllOps();

        for (const i in this.ops)
        {
            if (this.ops[i].objName == objName)
            {
                oldOps.push(this.ops[i]);
            }
        }

        let refNewOp = null;

        for (let i = 0; i < oldOps.length; i++)
        {
            count++;
            const oldOp = oldOps[i];
            oldOp.deleted = true;
            const op = this.addOp(objName, oldOp.uiAttribs);
            if (!op) continue;
            if (oldOp && oldOp.storage) op.setStorage(JSON.parse(JSON.stringify(oldOp.storage)));
            ops.push(op);

            if (oldOp == refOldOp)
            {
                refNewOp = op;
            }

            if (oldOp.patchId)
            {
                op.oldSubPatchIds = oldOp.oldSubPatchIds || [];
                op.oldSubPatchIds.push(oldOp.patchId.get());
            }

            let l;
            for (let j in oldOp.portsIn)
            {
                if (oldOp.portsIn[j].links.length === 0)
                {
                    const p = op.getPort(oldOp.portsIn[j].name);
                    if (!p)
                    {
                        this._log.warn("[reloadOp] could not set port " + oldOp.portsIn[j].name + ", probably renamed port ?");
                    }
                    else
                    {
                        p.set(oldOp.portsIn[j].get());

                        if (oldOp.portsIn[j].getVariableName())
                            p.setVariable(oldOp.portsIn[j].getVariableName());
                    }
                }
                else
                {
                    while (oldOp.portsIn[j].links.length)
                    {
                        const oldName = oldOp.portsIn[j].links[0].portIn.name;
                        const oldOutName = oldOp.portsIn[j].links[0].portOut.name;
                        const oldOutOp = oldOp.portsIn[j].links[0].portOut.op;
                        oldOp.portsIn[j].links[0].remove();

                        l = this.link(op, oldName, oldOutOp, oldOutName);
                        if (!l) this._log.warn("[reloadOp] relink after op reload not successfull for port " + oldOutName);
                        else l.setValue();
                    }
                }
            }

            for (let j in oldOp.portsOut)
            {
                while (oldOp.portsOut[j].links.length)
                {
                    const oldNewName = oldOp.portsOut[j].links[0].portOut.name;
                    const oldInName = oldOp.portsOut[j].links[0].portIn.name;
                    const oldInOp = oldOp.portsOut[j].links[0].portIn.op;
                    oldOp.portsOut[j].links[0].remove();

                    l = this.link(op, oldNewName, oldInOp, oldInName);
                    if (!l) this._log.warn("relink after op reload not successfull for port " + oldInName);
                    else l.setValue();
                }
            }

            this.deleteOp(oldOp.id, false, true);
        }

        gui.patchView.unselectAllOps();

        cb(count, ops, refNewOp);
    };
}
