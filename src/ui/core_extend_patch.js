/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */



export default function extendCorePatch()
{
    CABLES.Patch.prototype._opIdsToOps = function (opids)
    {
        let ops = [];
        for (let i = 0; i < opids.length; i++)
        {
            ops.push(this.getOpById(opids[i]));
        }
        return ops;
    };

    CABLES.Patch.prototype.getOpByRefId = function (refId, subPatchId)
    {
        const ops = this.getSubPatchOps(subPatchId);
        console.log("!!!!!!!!!!!getOpByRefId", ops);
        if (ops)
            for (let i = 0; i < ops.length; i++)
            {
                console.log("stor", ops[i].storage);
                if (ops[i].storage && ops[i].storage.ref == refId) return ops[i];
            }
    };

    CABLES.Patch.prototype.clearSubPatchCache = function (patchId)
    {
        // console.log("clear subpatch cache...", patchId);

        this._subpatchOpCache = this._subpatchOpCache || {};
        delete this._subpatchOpCache[patchId];
    };

    CABLES.Patch.prototype._subPatchCacheAdd = function (subPatchId, op)
    {
        if (this._subpatchOpCache[subPatchId])
            this._subpatchOpCache[subPatchId].ops[op.id] = op;
    };

    CABLES.Patch.prototype.getSubPatchOps = function (subPatchId, recursive = false)
    {
        const perf = CABLES.UI.uiProfiler.start("[corepatch ext] getSubPatchOps");

        this._subpatchOpCache = this._subpatchOpCache || {};

        let opids = [];

        console.log("CACHEEEEE", this._subpatchOpCache);
        if (this._subpatchOpCache[subPatchId] && this._subpatchOpCache[subPatchId].ops)
        {
            opids = this._subpatchOpCache[subPatchId].ops;
        }
        else
        {
            for (const i in this.ops)
            {
                const op = this.ops[i];

                console.log("i", i, op.uiAttribs.subPatch);

                // if (op.uiAttribs && op.uiAttribs.subPatch == subPatchId)
                // {
                this._subpatchOpCache[subPatchId] = this._subpatchOpCache[subPatchId] || {};// "ops": {}, "subPatchOpId": null };
                this._subpatchOpCache[subPatchId].ops = this._subpatchOpCache[subPatchId].ops || {};
                this._subpatchOpCache[subPatchId].ops[op.id] = op;
                // }

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
        const ops = this.ops;// gui.corePatch().getSubPatchOps(subPatchId);

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].innerInput) return ops[i];
        }
    };


    CABLES.Patch.prototype.getSubPatch2InnerOutputOp = function (subPatchId)
    {
        const ops = gui.corePatch().getSubPatchOps(subPatchId);
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].innerOutput) return ops[i];
        }
    };


    CABLES.Patch.prototype.buildSubPatchCache = () =>
    {
        const perf = CABLES.UI.uiProfiler.start("[corePatch ext] buildSubPatchCache");

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

    CABLES.Patch.prototype.getSubPatchOuterOp = function (subPatchId)
    {
        if (subPatchId == 0) return null;

        // oldSubPatchIds

        if (!this._subpatchOpCache[subPatchId] || !this._subpatchOpCache[subPatchId].subPatchOpId)
        {
            this.clearSubPatchCache(subPatchId);
            this.getSubPatchOps(subPatchId); // try build cache
            // console.error("unknown subpatchid cache ?!", subPatchId);
            return;
        }

        // console.log(this._subpatchOpCache);
        // console.log("subpatchopdi", this._subpatchOpCache[subPatchId].subPatchOpId);
        return this.getOpById(this._subpatchOpCache[subPatchId].subPatchOpId);

        //     const ops = this.ops;
        //     for (let i = 0; i < ops.length; i++)
        //     {
        //         const op = ops[i];
        //         if (op.isSubPatchOp() && op.patchId.get() == subPatchId) return op;
        //     }
    };
}
